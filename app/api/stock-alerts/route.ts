export const dynamic = 'force-dynamic'

/**
 * "Stok gelince haber ver" kaydı. Body: { productId, email }
 * Ürün stoğa girince tek seferlik e-posta gönderilir (lib/stock-alerts); dili talebin site dili (NEXT_LOCALE).
 */

import { NextRequest, NextResponse } from 'next/server'
import { isValidEmail } from '@/lib/checkout-validation'
import { prisma } from '@/lib/prisma'
import { isRateLimited, getClientIp } from '@/lib/rate-limit'
import { verifyTurnstile, TURNSTILE_ERROR } from '@/lib/turnstile'
import { getMergedProductById } from '@/lib/catalog-merge'
import { toCatalogLocale } from '@/lib/catalog-en'

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
  if (!productId || !isValidEmail(email)) {
    return NextResponse.json({ success: false, error: 'Geçerli bir e-posta adresi girin.' }, { status: 400 })
  }
  const product = await getMergedProductById(productId)
  if (!product || product.status === 'draft') return NextResponse.json({ success: false, error: 'Ürün bulunamadı.' }, { status: 404 })
  if ((product.stock ?? 0) > 0) {
    return NextResponse.json({ success: false, error: 'Bu ürün şu anda stokta.' }, { status: 409 })
  }
  const locale = toCatalogLocale(request.cookies.get('NEXT_LOCALE')?.value)
  // Aynı ürün + e-posta için tek kayıt; daha önce bildirildiyse yeniden bekleyen duruma al (dil son talebe göre)
  await prisma.stockAlert.upsert({
    where: { productId_email: { productId, email } },
    create: { productId, email, locale },
    update: { notifiedAt: null, locale },
  })
  return NextResponse.json({ success: true })
}
