export const dynamic = 'force-dynamic'

/**
 * Kupon önizleme: sepet kalemleri + kupon kodu ile sunucu tarafı fiyatlandırmayı döner.
 * Sipariş oluşturma (POST /api/orders) aynı hesaplayıcıyı kullanır.
 * Body: { code: string, items: [{ id, quantity }], paymentMethod?: 'bank_transfer' | 'card' }
 */

import { NextRequest, NextResponse } from 'next/server'
import { priceOrder, PricingError } from '@/lib/order-pricing'
import { isRateLimited } from '@/lib/rate-limit'

export async function POST(request: NextRequest) {
  if (isRateLimited(request, 'coupon-preview', 20, 60_000)) {
    return NextResponse.json(
      { success: false, error: 'Çok fazla deneme. Lütfen kısa süre sonra tekrar deneyin.' },
      { status: 429 }
    )
  }
  try {
    const body = await request.json().catch(() => null)
    const code = typeof body?.code === 'string' ? body.code.trim() : ''
    if (!code) {
      return NextResponse.json({ success: false, error: 'Kupon kodu gerekli.' }, { status: 400 })
    }
    const paymentMethod = body?.paymentMethod === 'bank_transfer' ? 'bank_transfer' : body?.paymentMethod === 'card' ? 'card' : null
    const pricing = await priceOrder(body?.items, code, paymentMethod)
    return NextResponse.json({
      success: true,
      couponCode: pricing.couponCode,
      discount: pricing.couponDiscount,
      paymentDiscount: pricing.paymentDiscount,
      subtotal: pricing.subtotal,
      tax: pricing.tax,
      shipping: pricing.shipping,
      total: pricing.total,
    })
  } catch (e) {
    if (e instanceof PricingError) {
      return NextResponse.json({ success: false, error: e.message }, { status: 400 })
    }
    console.error('Coupon preview error:', e)
    return NextResponse.json({ success: false, error: 'Kupon kontrol edilemedi.' }, { status: 500 })
  }
}
