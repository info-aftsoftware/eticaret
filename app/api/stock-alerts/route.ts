export const dynamic = 'force-dynamic'

/**
 * "Stok gelince haber ver" kaydı. Body: { productId, email }
 * Ürün stoğa girince tek seferlik e-posta gönderilir (lib/stock-alerts).
 */

import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import { isRateLimited, getClientIp } from '@/lib/rate-limit'
import { verifyTurnstile, TURNSTILE_ERROR } from '@/lib/turnstile'
import { getMergedProductById } from '@/lib/catalog-merge'

export async function POST(request: NextRequest) {
  if (isRateLimited(request, 'stock-alert', 10, 10 * 60_000)) {
    return NextResponse.json({ success: false, error: 'Çok fazla istek.' }, { status: 429 })
  }
  const body = await request.json().catch(() => ({}))
  if (!(await verifyTurnstile(body.turnstileToken, getClientIp(request)))) {
    return NextResponse.json({ success: false, error: TURNSTILE_ERROR }, { status: 400 })
  }
  const productId = typeof body.productId === 'string' ? body.productId.slice(0, 200) : ''
  const email = typeof body.email === 'string' ? body.email.trim().toLowerCase().slice(0, 200) : ''
  if (!productId || !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
    return NextResponse.json({ success: false, error: 'Geçerli bir e-posta adresi girin.' }, { status: 400 })
  }
  const product = await getMergedProductById(productId)
  if (!product) return NextResponse.json({ success: false, error: 'Ürün bulunamadı.' }, { status: 404 })
  if ((product.stock ?? 0) > 0) {
    return NextResponse.json({ success: false, error: 'Bu ürün şu anda stokta.' }, { status: 409 })
  }
  // Aynı ürün + e-posta için tek kayıt; daha önce bildirildiyse yeniden bekleyen duruma al
  await prisma.stockAlert.upsert({
    where: { productId_email: { productId, email } },
    create: { productId, email },
    update: { notifiedAt: null },
  })
  return NextResponse.json({ success: true })
}
