export const dynamic = 'force-dynamic'

import { NextRequest, NextResponse } from 'next/server'
import { reportError } from '@/lib/alerts'
import { prisma } from '@/lib/prisma'
import type { Prisma } from '@prisma/client'
import { isRateLimited } from '@/lib/rate-limit'
import crypto from 'node:crypto'
import { getBankPosConfig, buildPosForm, type PosForm } from '@/lib/payments/bank-pos'
import { getNextOrderNo, getNextCustomerNo } from '@/lib/sequence'
import { getCustomerFromRequest } from '@/lib/customerAuth'
import { priceOrder, PricingError, StockError, VAT_RATE, reserveCouponUse, releaseCouponUse } from '@/lib/order-pricing'
import { reserveStock, InsufficientStockError } from '@/lib/stock-reservation'
import { notifyLowStockAfterOrder } from '@/lib/low-stock'
import { revalidateStorefront } from '@/lib/storefront-revalidate'
import { onOrderCreated, changeOrderStatus, logOrderEvent } from '@/lib/order-service'
import { cartLogistics } from '@/lib/shipping/fee'
import { toCustomerOrder } from '@/lib/customer-order'
import { getLegalDocument } from '@/lib/legal/documents'
import {
  clientIpFromHeaders,
  formatTrPhone,
  isValidEmail,
  isValidTrPhone,
  normalizeTrPhone,
  onlyDigits,
  validateBilling,
} from '@/lib/checkout-validation'

/** Aynı e-posta/telefona açık (ödenmemiş) havale siparişi üst sınırı */
const MAX_OPEN_UNPAID_BANK_ORDERS = 3

const str = (v: unknown, max = 500): string => (typeof v === 'string' ? v.trim().slice(0, max) : '')

/** Ödeme sayfasının deneme anahtarı (çift tıklama / ağ tekrarı): biçim ve geçerlilik süresi */
const IDEMPOTENCY_KEY_RE = /^[A-Za-z0-9_-]{16,80}$/
const IDEMPOTENCY_WINDOW_MS = 24 * 60 * 60 * 1000
/** Aynı anahtarla eşzamanlı gelen istekler sırayla işlenir (tek süreçli Node uygulaması) */
const inflight = new Map<string, Promise<unknown>>()

const fmtTl = (n: number) => n.toLocaleString('tr-TR', { minimumFractionDigits: 2, maximumFractionDigits: 2 })

function siteBase() {
  return (process.env.NEXT_PUBLIC_SITE_URL || process.env.NEXT_PUBLIC_BASE_URL || 'https://voltekno.com').replace(/\/$/, '')
}

/** Aynı anahtarla daha önce açılmış sipariş varsa ilk yanıtın aynısı döner (yeni sipariş açılmaz) */
async function replayOrder(key: string) {
  const order = await prisma.order.findFirst({
    where: { idempotencyKey: key, createdAt: { gte: new Date(Date.now() - IDEMPOTENCY_WINDOW_MS) } },
    orderBy: { createdAt: 'desc' },
  })
  if (!order) return null
  let payment: { form: PosForm; bank: string } | undefined
  const posConfig = order.paymentMethod === 'card' && order.status === 'PENDING' && order.paymentStatus !== 'PAID' ? getBankPosConfig() : null
  if (posConfig) {
    payment = {
      bank: posConfig.bankName,
      form: buildPosForm(
        { orderNo: order.orderNo, amount: order.total, callbackUrl: `${siteBase()}/api/payments/pos/callback`, customer: { name: order.shippingName, email: order.shippingEmail ?? '', phone: order.shippingPhone } },
        posConfig
      ),
    }
  }
  return NextResponse.json({
    success: true,
    replayed: true,
    orderId: order.orderNo,
    pricing: { subtotal: order.subtotal, couponDiscount: order.couponDiscount, paymentDiscount: order.paymentDiscount, tax: order.vatTotal, shipping: order.shippingCost, total: order.total },
    payment,
  })
}

/**
 * Sipariş oluşturur. Fiyat, KDV, kargo ve kupon indirimi sunucuda hesaplanır;
 * istemcinin gönderdiği fiyat/toplam alanları yok sayılır. Ödeme durumu her zaman PENDING başlar
 * ve yalnızca doğrulanmış ödeme webhook'u (veya admin) PAID yapabilir.
 * Body: { customer, items: [{ id, quantity }], couponCode?, paymentMethod: 'bank_transfer' | 'card', acceptedTerms: true, notes? }
 */
export async function POST(request: NextRequest) {
  const raw = await request.text().catch(() => '')
  let parsed: Record<string, unknown> | null = null
  try {
    parsed = raw ? JSON.parse(raw) : null
  } catch {
    parsed = null
  }
  const key = typeof parsed?.idempotencyKey === 'string' && IDEMPOTENCY_KEY_RE.test(parsed.idempotencyKey) ? parsed.idempotencyKey : null
  if (!key) return createOrder(request, parsed)
  // Aynı anahtarla gelen istekler sırayla: önceki bitince sipariş açılmışsa onun yanıtı döner
  while (inflight.has(key)) await inflight.get(key)!.catch(() => {})
  const run = (async () => (await replayOrder(key)) ?? createOrder(request, parsed, key))()
  inflight.set(key, run)
  try {
    return await run
  } finally {
    inflight.delete(key)
  }
}

async function createOrder(request: NextRequest, parsedBody: Record<string, unknown> | null, idempotencyKey: string | null = null) {
  try {
    if (isRateLimited(request, 'orders', 20, 60_000)) {
      return NextResponse.json(
        { success: false, error: 'Çok fazla sipariş isteği. Lütfen kısa süre sonra tekrar deneyin.' },
        { status: 429 }
      )
    }
    const body = parsedBody as Record<string, any> | null
    if (!body || typeof body !== 'object') {
      return NextResponse.json({ success: false, error: 'Geçersiz istek' }, { status: 400 })
    }

    const { customer, items, couponCode, acceptedTerms } = body
    const paymentMethod = body.paymentMethod === 'card' ? 'card' : 'bank_transfer'
    // Banka sanal POS bilgileri girilmeden kartla sipariş alınmaz (sipariş oluşturulmadan reddedilir)
    const posConfig = paymentMethod === 'card' ? getBankPosConfig() : null
    if (paymentMethod === 'card' && !posConfig) {
      return NextResponse.json(
        { success: false, code: 'CARD_UNAVAILABLE', error: 'Kartla ödeme şu anda kullanılamıyor. Lütfen Havale/EFT seçeneğiyle devam edin.' },
        { status: 503 }
      )
    }

    if (acceptedTerms !== true) {
      return NextResponse.json(
        { success: false, error: 'Ön Bilgilendirme Formu ve Mesafeli Satış Sözleşmesi onaylanmalıdır.' },
        { status: 400 }
      )
    }

    const c = customer && typeof customer === 'object' ? customer : {}
    const name = str(c.name, 200)
    const email = str(c.email, 200)
    const phoneDigits = normalizeTrPhone(str(c.phone, 30))
    const addressLine = str(c.addressLine)
    const city = str(c.city, 100)
    const district = str(c.district, 100)
    if (!name || !phoneDigits || !addressLine || !city || !district || !isValidEmail(email)) {
      return NextResponse.json(
        { success: false, error: 'Ad, e-posta, telefon ve adres bilgileri zorunludur.' },
        { status: 400 }
      )
    }
    if (!isValidTrPhone(phoneDigits)) {
      return NextResponse.json({ success: false, error: 'Geçerli bir telefon numarası girin (5xx xxx xx xx).' }, { status: 400 })
    }
    // 5xx xxx xx xx biçiminde saklanır (e-posta, kargo etiketi ve misafir takibi aynı biçimi kullanır)
    const phone = formatTrPhone(phoneDigits)
    // Ödenmemiş havale siparişleri stoğu ve kupon kullanımını ödeme süresi boyunca ayırır; uydurma siparişlerle
    // katalogun "tükendi" gösterilmesini önlemek için aynı e-posta/telefona açık sipariş sayısı sınırlanır.
    if (paymentMethod === 'bank_transfer') {
      const openUnpaid = await prisma.order.count({
        where: {
          status: 'PENDING',
          paymentMethod: 'bank_transfer',
          paymentStatus: { not: 'PAID' },
          OR: [{ shippingEmail: email.toLowerCase() }, { shippingPhone: phone }],
        },
      })
      if (openUnpaid >= MAX_OPEN_UNPAID_BANK_ORDERS) {
        return NextResponse.json(
          {
            success: false,
            code: 'TOO_MANY_OPEN_ORDERS',
            error: `Ödemesi bekleyen ${openUnpaid} siparişiniz var. Yeni sipariş vermeden önce mevcut siparişlerinizin ödemesini tamamlayın veya iptal edin.`,
          },
          { status: 429 }
        )
      }
    }
    const billingType = c.billingType === 'company' ? 'company' : 'individual'
    const idNumber = onlyDigits(str(c.idNumber, 20))
    const taxId = onlyDigits(str(c.taxId, 20))
    const taxOffice = str(c.taxOffice, 100)
    const billingErrors = validateBilling({ billingType, idNumber, companyName: str(c.billingName, 200), taxId, taxOffice })
    if (Object.keys(billingErrors).length > 0) {
      return NextResponse.json(
        { success: false, error: Object.values(billingErrors)[0], fields: billingErrors },
        { status: 400 }
      )
    }
    const postalCode = onlyDigits(str(c.postalCode, 10)).slice(0, 5)
    // Fatura adresi ayrıysa kendi posta kodu kullanılır (teslimat posta kodu kopyalanmaz)
    const separateBilling = !!str(c.billingAddress)
    const billingPostalCode = separateBilling ? onlyDigits(str(c.billingPostalCode, 10)).slice(0, 5) : postalCode

    let pricing
    try {
      pricing = await priceOrder(items, typeof couponCode === 'string' ? couponCode : null, paymentMethod)
    } catch (e) {
      if (e instanceof PricingError) {
        const outOfStock = e instanceof StockError
        return NextResponse.json(
          { success: false, ...(outOfStock ? { code: 'OUT_OF_STOCK' } : {}), error: e.message },
          { status: outOfStock ? 409 : 400 }
        )
      }
      throw e
    }

    // Fiyat değişimi: müşterinin onayladığı toplam (expectedTotal) sunucunun hesabından farklıysa sipariş açılmaz,
    // yeni toplam bildirilir; müşteri yeni toplamı onaylayıp tekrar gönderince geçer (kur, kampanya, stok değişimi).
    const expectedTotal = typeof body.expectedTotal === 'number' && Number.isFinite(body.expectedTotal) ? body.expectedTotal : null
    if (expectedTotal !== null && Math.abs(expectedTotal - pricing.total) > 0.01) {
      return NextResponse.json(
        {
          success: false,
          code: 'PRICE_CHANGED',
          error: `Sepet tutarınız güncellendi: yeni toplam ${fmtTl(pricing.total)} TL (önceki ${fmtTl(expectedTotal)} TL). Lütfen kontrol edip siparişi yeniden onaylayın.`,
          pricing: { subtotal: pricing.subtotal, couponDiscount: pricing.couponDiscount, paymentDiscount: pricing.paymentDiscount, tax: pricing.tax, shipping: pricing.shipping, total: pricing.total },
        },
        { status: 409 }
      )
    }

    // Kullanıcı yalnızca doğrulanmış token'dan belirlenir; gövdedeki userId yok sayılır.
    let resolvedUserId: string | null = null
    const tokenUserId = (await getCustomerFromRequest(request))?.userId ?? null
    if (tokenUserId) {
      const user = await prisma.user.findUnique({
        where: { id: tokenUserId },
        select: { id: true, customerNo: true },
      })
      if (user) {
        resolvedUserId = user.id
        if (!user.customerNo) {
          const customerNo = await getNextCustomerNo()
          await prisma.user.update({ where: { id: user.id }, data: { customerNo } })
        }
      }
    }

    // Kupon kullanım sınırı: sipariş oluşmadan önce bir kullanım ayrılır (oluşmazsa geri verilir)
    if (pricing.couponCode) {
      try {
        await reserveCouponUse(pricing.couponCode)
      } catch (e) {
        if (e instanceof PricingError) return NextResponse.json({ success: false, error: e.message }, { status: 400 })
        throw e
      }
    }

    const orderNo = await getNextOrderNo().catch(async (e) => {
      await releaseCouponUse(pricing.couponCode)
      throw e
    })
    const ip = clientIpFromHeaders(request.headers)

    const order = await prisma.order.create({
      data: {
        orderNo,
        userId: resolvedUserId,
        status: 'PENDING',
        paymentStatus: 'PENDING',
        paymentMethod: paymentMethod === 'card' ? 'card' : 'bank_transfer',
        shippingName: name,
        // Küçük harfle saklanır: üyelikten sonra doğrulanmış e-postayla hesaba bağlanabilsin
        shippingEmail: email.toLowerCase(),
        shippingPhone: phone,
        shippingAddress: addressLine,
        shippingCity: city,
        shippingDistrict: district,
        shippingPostalCode: postalCode,
        shippingCountry: str(c.country, 100) || 'Türkiye',
        billingType,
        billingName: str(c.billingName, 200) || name,
        billingTaxId: (billingType === 'company' ? taxId : idNumber) || null,
        billingTaxOffice: billingType === 'company' ? taxOffice || null : null,
        billingAddress: separateBilling ? str(c.billingAddress) : addressLine,
        billingCity: (separateBilling && str(c.billingCity, 100)) || city,
        billingDistrict: (separateBilling && str(c.billingDistrict, 100)) || district,
        billingPostalCode: billingPostalCode || null,
        billingCountry: str(c.country, 100) || 'Türkiye',
        subtotal: pricing.subtotal,
        vatTotal: pricing.tax,
        shippingCost: pricing.shipping,
        idempotencyKey,
        // Ücretin kaynağı yönetim panelinde gösterilir (Geliver / Navlungo, firma, tüm teklifler)
        shippingQuoteProvider: pricing.shippingQuote.provider,
        shippingQuoteCarrier: pricing.shippingQuote.carrierId,
        shippingQuote: pricing.shippingQuote as unknown as Prisma.InputJsonValue,
        discount: pricing.discount,
        couponCode: pricing.couponCode,
        couponDiscount: pricing.couponDiscount,
        paymentDiscount: pricing.paymentDiscount,
        total: pricing.total,
        currency: 'TRY',
        customerNote: str(body.notes, 2000) || null,
        notes: JSON.stringify({
          consents: {
            distanceSalesAndPreInfo: true,
            acceptedAt: new Date().toISOString(),
            ip,
            // Onaylanan metin sürümleri (lib/legal/documents.json "Son güncelleme")
            versions: {
              preInfo: getLegalDocument('on-bilgilendirme-formu')?.updated ?? null,
              distanceSales: getLegalDocument('mesafeli-satis-sozlesmesi')?.updated ?? null,
            },
          },
        }),
        lines: {
          create: pricing.lines.map((l) => ({
            variantId: null,
            productName: l.name.slice(0, 500),
            // stok iadesi ve raporlama için katalog ürün id'si
            variantMatrix: { productId: l.productId, ...(l.variantKey ? { variantKey: l.variantKey } : {}) },
            quantity: l.quantity,
            unitPrice: l.unitPrice,
            vatRate: VAT_RATE,
            lineTotal: Math.round(l.lineSubtotal * (1 + VAT_RATE / 100) * 100) / 100,
          })),
        },
      },
      include: { lines: true },
    }).catch(async (e) => {
      await releaseCouponUse(pricing.couponCode)
      throw e
    })

    // ── Stok düşme ─────────────────────────────────────────────────────────
    // Tüm kalemler tek transaction'da koşullu düşülür (StockOverride; satır yoksa katalog stoğundan tohumlanır).
    // Stok yetmezse (eşzamanlı sipariş) hiçbir stok değişmez, sipariş geri alınır ve 409 döner.
    let decremented: Set<string>
    try {
      decremented = await reserveStock(pricing.lines.map((l) => ({ productId: l.productId, productName: l.productName, quantity: l.quantity })))
    } catch (stockErr) {
      await prisma.order.delete({ where: { id: order.id } }).catch((e) => console.error('Sipariş geri alma hatası:', e))
      await releaseCouponUse(pricing.couponCode)
      if (stockErr instanceof InsufficientStockError) {
        return NextResponse.json({ success: false, code: 'OUT_OF_STOCK', error: stockErr.message }, { status: 409 })
      }
      throw stockErr
    }
    // Hangi satırın stoğu gerçekten düşüldü: iptal/iadede yalnızca bunlar geri eklenir (hayali stok oluşmaz)
    try {
      for (const line of order.lines) {
        const vm = (line.variantMatrix ?? {}) as { productId?: string; variantKey?: string }
        const done = !!vm.productId && decremented.has(vm.productId)
        await prisma.orderLine.update({
          where: { id: line.id },
          data: { variantMatrix: { ...vm, stockDecremented: done, productStockDecremented: false } },
        })
      }
    } catch (flagErr) {
      console.error('Stock flag error:', flagErr)
    }
    // Eşik altına düşen ürünler için yöneticiye uyarı (yanıtı bekletmez)
    void notifyLowStockAfterOrder(
      pricing.lines.filter((l) => decremented.has(l.productId)).map((l) => ({ productId: l.productId, quantity: l.quantity }))
    ).catch((e) => console.error('Düşük stok uyarısı:', e))
    // Stok değişti: ürün sayfaları ve listeler yeni stokla üretilsin (admin paneliyle aynı kaynak)
    if (decremented.size > 0) revalidateStorefront()
    // ───────────────────────────────────────────────────────────────────────

    // Üyenin sepet özeti (terk edilen sepet hatırlatması) artık gereksiz
    if (resolvedUserId) await prisma.cartSnapshot.deleteMany({ where: { userId: resolvedUserId } }).catch(() => {})

    // Zaman çizelgesi + e-postalar (havalede hemen; kartlı siparişte ödeme onaylanınca)
    await onOrderCreated(order).catch((e) => reportError('siparis-bildirimi', e, { orderNo: order.orderNo }))
    // Kurulumlu ürün (şarj istasyonu): nakliye ve kurulum fiyata dahil değil, müşteriyle iletişime geçilecek
    if (cartLogistics(pricing.lines.map((l) => ({ id: l.cartId, productId: l.productId, quantity: l.quantity }))).hasInstall) {
      await logOrderEvent(order.id, {
        type: 'note',
        message: 'Şarj istasyonu: kurulum ve nakliye fiyata dahil değildir; saha, kurulum ve nakliye planı için sizinle iletişime geçeceğiz.',
        actor: 'system',
        visibleToCustomer: true,
      }).catch((e) => reportError('siparis-kurulum-notu', e, { orderNo: order.orderNo }))
    }

    // Kartlı ödeme: tarayıcı bu imzalı formla bankanın 3D Secure sayfasına gider.
    // paymentProviderRef = ödeme dönüş sayfasının durumu sorgularken kullandığı tek kullanımlık anahtar.
    let payment: { form: PosForm; bank: string } | undefined
    if (paymentMethod === 'card' && posConfig) {
      try {
        const returnToken = crypto.randomBytes(18).toString('base64url')
        await prisma.order.update({ where: { id: order.id }, data: { paymentProviderRef: returnToken } })
        const baseUrl = siteBase()
        payment = {
          bank: posConfig.bankName,
          form: buildPosForm(
            { orderNo: order.orderNo, amount: pricing.total, callbackUrl: `${baseUrl}/api/payments/pos/callback`, customer: { name, email, phone } },
            posConfig
          ),
        }
      } catch (e) {
        await reportError('kart-odeme-baslatma', e, { orderNo: order.orderNo })
        await changeOrderStatus(order.id, 'CANCELLED', { actor: 'system', reason: 'Kart ödeme sayfası hazırlanamadı', notifyCustomer: false }).catch(() => {})
        return NextResponse.json(
          { success: false, error: 'Kart ödeme sayfası şu anda açılamıyor. Lütfen Havale/EFT ile deneyin veya daha sonra tekrar deneyin.' },
          { status: 502 }
        )
      }
    }

    return NextResponse.json({
      success: true,
      orderId: order.orderNo,
      pricing: {
        subtotal: pricing.subtotal,
        couponDiscount: pricing.couponDiscount,
        paymentDiscount: pricing.paymentDiscount,
        tax: pricing.tax,
        shipping: pricing.shipping,
        total: pricing.total,
      },
      payment,
    })
  } catch (error) {
    await reportError('siparis-olusturma', error)
    return NextResponse.json(
      { success: false, error: 'Sipariş oluşturulurken bir hata oluştu' },
      { status: 500 }
    )
  }
}


/**
 * Müşterinin kendi siparişleri (Prisma). Auth zorunlu; sadece userId eşleşen siparişler döner.
 */
export async function GET(request: NextRequest) {
  try {
    const customer = await getCustomerFromRequest(request)
    const userId = customer?.userId ?? null
    if (!userId) {
      return NextResponse.json(
        { success: false, error: 'Giriş yapmanız gerekiyor' },
        { status: 401 }
      )
    }

    // Üye olmadan verilen siparişler, e-posta adresi DOĞRULANMIŞ hesapla eşleşiyorsa hesaba bağlanır
    // (doğrulanmamış e-postayla başkasının siparişleri görülemesin diye)
    if (customer?.emailVerified && customer.email) {
      const email = customer.email.trim()
      await prisma.order
        .updateMany({
          where: { userId: null, shippingEmail: { in: Array.from(new Set([email, email.toLowerCase()])) } },
          data: { userId },
        })
        .catch((e) => console.error('Misafir siparişi bağlama hatası:', e))
    }

    const { searchParams } = new URL(request.url)
    const limit = Math.min(parseInt(searchParams.get('limit') || '100', 10), 500)
    const status = searchParams.get('status')

    const where: { userId: string; status?: any } = { userId }
    if (status) where.status = status as any

    const orders = await prisma.order.findMany({
      where,
      include: { lines: true, events: { where: { visibleToCustomer: true }, orderBy: { createdAt: 'asc' } }, returnRequests: { orderBy: { createdAt: 'asc' } } },
      orderBy: { createdAt: 'desc' },
      take: limit,
    })

    return NextResponse.json({
      success: true,
      orders: orders.map(toCustomerOrder),
    })
  } catch (error) {
    console.error('Error fetching orders:', error)
    return NextResponse.json(
      { success: false, error: 'Siparişler getirilirken bir hata oluştu' },
      { status: 500 }
    )
  }
}
