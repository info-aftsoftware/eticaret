export const dynamic = 'force-dynamic'

/**
 * Sepet fiyat teklifi: her kalem için güncel (kampanyalı) birim fiyat ve satılabilirlik.
 * Sepet/ödeme sayfası bununla tarayıcıdaki fiyatları tazeler; sipariş POST /api/orders aynı hesaplayıcıyı kullanır.
 * Body: { items: [{ id, quantity }] }
 */

import { NextRequest, NextResponse } from 'next/server'
import { priceOrder, PricingError } from '@/lib/order-pricing'
import { getStorefrontProductById } from '@/lib/discounts'
import { isRateLimited } from '@/lib/rate-limit'

export async function POST(request: NextRequest) {
  if (isRateLimited(request, 'cart-quote', 60, 60_000)) {
    return NextResponse.json({ error: 'Çok fazla istek.' }, { status: 429 })
  }
  const body = await request.json().catch(() => ({}))
  const items = (Array.isArray(body.items) ? body.items : []).slice(0, 100) as { id?: unknown; quantity?: unknown }[]

  const lines = []
  for (const raw of items) {
    const id = typeof raw?.id === 'string' ? raw.id : ''
    if (!id) continue
    try {
      const priced = await priceOrder([{ id, quantity: raw.quantity }])
      const l = priced.lines[0]
      const product = await getStorefrontProductById(l.productId)
      lines.push({
        id,
        available: true,
        unitPrice: l.unitPrice,
        campaign: product?.campaign?.name ?? null,
      })
    } catch (e) {
      lines.push({ id, available: false, error: e instanceof PricingError ? e.message : 'Ürün fiyatlandırılamadı.' })
    }
  }
  return NextResponse.json({ lines })
}
