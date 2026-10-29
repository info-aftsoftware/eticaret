/**
 * Sipariş fiyatlandırması — tamamen sunucu tarafında.
 * İstemciden yalnızca sepet kalemi id'si ve adet alınır; birim fiyat katalogdan (mock + ProductOverride + aktif kampanya),
 * kupon Firestore `coupons` koleksiyonundan; KDV, kargo ve havale indirimi lib/store-config'ten hesaplanır.
 */

import type { MergedProduct } from '@/lib/catalog-merge'
import { getStorefrontProductById } from '@/lib/discounts'
import { prisma } from '@/lib/prisma'
import { computeOrderTotals, MAX_ONLINE_QTY_PER_PRODUCT, VAT_RATE, type CheckoutPaymentMethod, type OrderTotals } from '@/lib/store-config'
import { cartLogistics, panelLineLogistics, quoteShipping, type LineLogisticsOverride, type ShippingQuote } from '@/lib/shipping/fee'
import { isContactOnlyLine, isContactOnlyProduct } from '@/lib/shipping/battery'
import { isQuoteOnly } from '@/lib/sale-mode'
import { lineStock, stockKeyFor } from '@/lib/variant-stock'

export { VAT_RATE }
const MAX_QTY_PER_LINE = 999

export class PricingError extends Error {}
/** Stok yetersiz: sipariş API'si 409 döner */
export class StockError extends PricingError {}

export type PricedLine = {
  cartId: string
  productId: string
  variantKey?: string
  name: string
  /** Varyant eki olmadan ürün adı */
  productName: string
  /** Stoğun düşüleceği anahtar: ürün id'si veya ayrı stoklanan varyantta "productId::variantKey" (lib/variant-stock) */
  stockKey: string
  /** Stok mesajlarında kullanılacak ad (ayrı stoklu varyantta varyant adıyla) */
  stockName: string
  /** Panelde tanımlı tek adet lojistik (A07); yoksa desi.json kullanılır */
  logistics?: LineLogisticsOverride
  /** Kalemin güncel stoğu (ürün veya ayrı stoklanan varyant); takip yoksa undefined */
  stock?: number
  unitPrice: number
  quantity: number
  lineSubtotal: number
}

export type OrderPricing = OrderTotals & {
  lines: PricedLine[]
  couponCode: string | null
  /** Kargo teklifi: hangi kaynak (Geliver / Navlungo) ve firma, tüm adaylar */
  shippingQuote: ShippingQuote
}

const round2 = (n: number) => Math.round(n * 100) / 100

/**
 * Sepet id'si `productId` veya `productId-variantKey` biçimindedir.
 * Ürün id'leri de tire içerebildiği için sondan başa doğru bölme noktaları denenir.
 * Varyantlı ürün taban id'siyle satılamaz (fiyat seçeneğe göre değişir): PricingError fırlatır.
 */
export async function resolveCartId(cartId: string): Promise<{ product: MergedProduct; variantKey?: string } | null> {
  const direct = await getStorefrontProductById(cartId)
  if (direct) {
    if (direct.variants?.length) {
      throw new PricingError(`"${direct.name}" için bir seçenek (model) seçmelisiniz. Lütfen ürünü sepetten çıkarıp seçenekle yeniden ekleyin.`)
    }
    return { product: direct }
  }

  let idx = cartId.lastIndexOf('-')
  while (idx > 0) {
    const productId = cartId.slice(0, idx)
    const variantKey = cartId.slice(idx + 1)
    const product = await getStorefrontProductById(productId)
    if (product?.variants?.some((v) => v.key === variantKey)) {
      return { product, variantKey }
    }
    idx = cartId.lastIndexOf('-', idx - 1)
  }
  return null
}

/** Kupon kodu biçimi: büyük harf, rakam, - ve _ (3–32 karakter) */
export function normalizeCouponCode(raw: string): string {
  return raw.trim().toUpperCase().replace(/\s+/g, '')
}

/** Sepet sayfasındaki kupon kurallarının sunucu karşılığı. Geçersizse PricingError fırlatır. */
export async function computeCouponDiscount(rawCode: string, subtotal: number): Promise<number> {
  const code = normalizeCouponCode(rawCode)
  const coupon = await prisma.coupon.findUnique({ where: { code } })
  if (!coupon) throw new PricingError('Geçersiz kupon kodu.')

  const now = Date.now()
  if (!coupon.active) throw new PricingError('Bu kupon artık geçerli değil.')
  if (coupon.startDate && coupon.startDate.getTime() > now) throw new PricingError('Bu kupon henüz geçerli değil.')
  if (coupon.endDate && coupon.endDate.getTime() < now) throw new PricingError('Bu kuponun süresi dolmuş.')
  if (coupon.usageLimit != null && coupon.usedCount >= coupon.usageLimit) {
    throw new PricingError('Bu kuponun kullanım limiti dolmuş.')
  }
  if (coupon.minAmount && subtotal < coupon.minAmount) {
    throw new PricingError(`Bu kupon en az ${coupon.minAmount.toLocaleString('tr-TR')} TL (KDV hariç) alışverişlerde geçerlidir.`)
  }

  let disc = coupon.type === 'PERCENT' ? Math.round(subtotal * (coupon.value / 100) * 100) / 100 : coupon.value
  if (coupon.maxDiscount && disc > coupon.maxDiscount) disc = coupon.maxDiscount
  return Math.max(0, Math.min(disc, subtotal))
}

/**
 * Sipariş oluşurken kupon kullanımını ayırır (kullanım sınırı yarış durumuna karşı koşullu artırma).
 * Sınır dolmuşsa PricingError fırlatır.
 */
export async function reserveCouponUse(code: string): Promise<void> {
  const coupon = await prisma.coupon.findUnique({ where: { code }, select: { usageLimit: true } })
  if (!coupon) throw new PricingError('Geçersiz kupon kodu.')
  const res = await prisma.coupon.updateMany({
    where: { code, ...(coupon.usageLimit != null ? { usedCount: { lt: coupon.usageLimit } } : {}) },
    data: { usedCount: { increment: 1 } },
  })
  if (res.count === 0) throw new PricingError('Bu kuponun kullanım limiti dolmuş.')
}

/** Sipariş iptal edilir / oluşturulamazsa kupon kullanımını geri verir. */
export async function releaseCouponUse(code: string | null | undefined): Promise<void> {
  if (!code) return
  await prisma.coupon.updateMany({ where: { code, usedCount: { gt: 0 } }, data: { usedCount: { decrement: 1 } } }).catch(() => {})
}

export async function priceOrder(
  items: unknown,
  couponCode?: string | null,
  paymentMethod?: CheckoutPaymentMethod | null
): Promise<OrderPricing> {
  if (!Array.isArray(items) || items.length === 0) throw new PricingError('Sepet boş.')
  if (items.length > 100) throw new PricingError('Sepette çok fazla kalem var.')

  const lines: PricedLine[] = []
  for (const raw of items as { id?: unknown; quantity?: unknown }[]) {
    const cartId = typeof raw?.id === 'string' ? raw.id : ''
    const quantity = Math.floor(Number(raw?.quantity))
    if (!cartId) throw new PricingError('Geçersiz sepet kalemi.')
    if (!Number.isFinite(quantity) || quantity < 1 || quantity > MAX_QTY_PER_LINE) {
      throw new PricingError('Geçersiz ürün adedi.')
    }

    const resolved = await resolveCartId(cartId)
    if (!resolved) throw new PricingError('Sepetteki bir ürün artık satışta değil. Lütfen sepetinizi güncelleyin.')
    const { product, variantKey } = resolved
    // Akü / batarya: kargo kısıtları kontrol edilene kadar çevrim içi satılmaz (lib/shipping/battery.ts)
    // Satışa kapalı ürün (ürün grubu kapatıldı): sipariş verilemez
    if (product.salesClosed) {
      throw new PricingError(`"${product.name}" şu anda satışa kapalı. Lütfen sepetinizden çıkarın.`)
    }
    if (isQuoteOnly(product)) {
      throw new PricingError(`"${product.name}" çevrim içi sipariş edilemiyor. Fiyat için lütfen teklif alın.`)
    }
    // Kategori panelde değiştirilse de desi kaydındaki akü işareti sipariş açtırmaz (sepetteki kuralla aynı)
    if (isContactOnlyProduct(product) || isContactOnlyLine(cartId, product.id)) {
      throw new PricingError(`"${product.name}" çevrim içi sipariş edilemiyor. Akü ve bataryalarda kargo ücreti teklifle belirlenir; lütfen teklif alın.`)
    }
    const variant = variantKey ? product.variants?.find((v) => v.key === variantKey) : undefined
    // Stok kontrolü: varyantlar ayrı stoklanıyorsa varyantın, değilse ürünün stoğu (varyantlar paylaşır)
    const stockKey = stockKeyFor(product, variantKey)
    const stock = lineStock(product, variantKey)
    const stockName = product.variantStock && variant ? `${product.name} - ${variant.label}` : product.name
    const sameStockInCart = lines.filter((l) => l.stockKey === stockKey).reduce((n, l) => n + l.quantity, 0)
    if (sameStockInCart + quantity > MAX_ONLINE_QTY_PER_PRODUCT) {
      throw new PricingError(
        `"${stockName}" için çevrim içi en fazla ${MAX_ONLINE_QTY_PER_PRODUCT} adet sipariş verilebilir. Daha fazlası için lütfen teklif alın.`
      )
    }
    if (typeof stock === 'number') {
      const alreadyInCart = sameStockInCart
      if (stock <= 0) {
        throw new StockError(`"${stockName}" şu anda stokta yok. Lütfen sepetinizden çıkarın.`)
      }
      if (alreadyInCart + quantity > stock) {
        throw new StockError(`"${stockName}" için stokta yalnızca ${stock} adet var.`)
      }
    }
    const unitPrice = Number(variant ? variant.price : product.price)
    if (!Number.isFinite(unitPrice) || unitPrice <= 0) {
      throw new PricingError(`${product.name} için fiyat bilgisi bulunamadı.`)
    }

    lines.push({
      cartId,
      productId: product.id,
      variantKey,
      name: variant ? `${product.name} - ${variant.label}` : product.name,
      productName: product.name,
      stockKey,
      stockName,
      logistics: panelLineLogistics(product),
      stock,
      unitPrice,
      quantity,
      lineSubtotal: round2(unitPrice * quantity),
    })
  }

  const subtotal = round2(lines.reduce((s, l) => s + l.lineSubtotal, 0))
  const code = couponCode?.trim() ? normalizeCouponCode(couponCode) : null
  const couponDiscount = code ? await computeCouponDiscount(code, subtotal) : 0
  const shippingQuote = quoteShipping(cartLogistics(lines.map((l) => ({ id: l.cartId, productId: l.productId, quantity: l.quantity, logistics: l.logistics }))))
  const totals = computeOrderTotals({ subtotal, couponDiscount, paymentMethod, shippingFee: shippingQuote.fee })

  return { lines, ...totals, couponCode: code, shippingQuote }
}
