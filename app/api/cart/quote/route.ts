export const dynamic = 'force-dynamic'

/**
 * Sepet fiyat teklifi: her kalem için güncel (kampanyalı) birim fiyat, stok ve satılabilirlik.
 * Sepet/ödeme sayfası bununla tarayıcıdaki fiyatları tazeler; sipariş POST /api/orders aynı hesaplayıcıyı kullanır.
 * Body: { items: [{ id, quantity }] }
 * Yanıt: { lines: [{ id, available, unitPrice?, campaign?, productId?, stockKey?, stock?, error? }] }
 * Adet aşımı stok anahtarı bazında kontrol edilir: ortak stokta ürün, ayrı stoklanan varyantta varyant (lib/variant-stock).
 */

import { NextRequest, NextResponse } from 'next/server'
import { priceOrder, PricingError, type PricedLine } from '@/lib/order-pricing'
import type { LineLogisticsOverride } from '@/lib/shipping/fee'
import { getStorefrontProductById } from '@/lib/discounts'
import { isRateLimited } from '@/lib/rate-limit'
import { MAX_ONLINE_QTY_PER_PRODUCT } from '@/lib/store-config'

type QuoteLine = {
  id: string
  available: boolean
  unitPrice?: number
  campaign?: string | null
  productId?: string
  stockKey?: string
  /** Panelde tanımlı lojistik (A07): sepet/ödeme kargo tahmini sunucuyla aynı desiyi kullansın */
  logistics?: LineLogisticsOverride
  stock?: number
  error?: string
}

export async function POST(request: NextRequest) {
  if (isRateLimited(request, 'cart-quote', 60, 60_000)) {
    return NextResponse.json({ error: 'Çok fazla istek.' }, { status: 429 })
  }
  const body = await request.json().catch(() => ({}))
  const items = (Array.isArray(body.items) ? body.items : []).slice(0, 100) as { id?: unknown; quantity?: unknown }[]

  const priced: { id: string; quantity: number; line?: PricedLine; result: QuoteLine }[] = []
  for (const raw of items) {
    const id = typeof raw?.id === 'string' ? raw.id : ''
    if (!id) continue
    const quantity = Math.max(1, Math.floor(Number(raw.quantity)) || 1)
    try {
      // Adet 1 ile fiyatlandırılır; stok aşımı aşağıda ürün bazında değerlendirilir
      const l = (await priceOrder([{ id, quantity: 1 }])).lines[0]
      const product = await getStorefrontProductById(l.productId)
      priced.push({
        id,
        quantity,
        line: l,
        result: { id, available: true, unitPrice: l.unitPrice, campaign: product?.campaign?.name ?? null, productId: l.productId, stockKey: l.stockKey, stock: l.stock, ...(l.logistics ? { logistics: l.logistics } : {}) },
      })
    } catch (e) {
      priced.push({ id, quantity, result: { id, available: false, error: e instanceof PricingError ? e.message : 'Ürün fiyatlandırılamadı.' } })
    }
  }

  const perProduct = new Map<string, number>()
  for (const p of priced) if (p.line) perProduct.set(p.line.stockKey, (perProduct.get(p.line.stockKey) ?? 0) + p.quantity)
  for (const p of priced) {
    if (!p.line) continue
    const stock = p.line.stock
    const total = perProduct.get(p.line.stockKey) ?? 0
    if (typeof stock === 'number' && total > stock) {
      p.result.available = false
      p.result.error = `"${p.line.stockName}" için stokta yalnızca ${stock} adet var. Lütfen adedi azaltın.`
    } else if (total > MAX_ONLINE_QTY_PER_PRODUCT) {
      // Sipariş de aynı sınırla reddedilir (lib/order-pricing)
      p.result.available = false
      p.result.error = `"${p.line.stockName}" için çevrim içi en fazla ${MAX_ONLINE_QTY_PER_PRODUCT} adet sipariş verilebilir. Daha fazlası için lütfen teklif alın.`
    }
  }

  return NextResponse.json({ lines: priced.map((p) => p.result) })
}
