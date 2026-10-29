export const dynamic = 'force-dynamic'

/**
 * Üye sepeti özeti (terk edilen sepet hatırlatması için). Yalnızca giriş yapmış üye; sepet tarayıcıda kalır.
 * PUT    { items: [{ id, quantity }] } — boş liste özeti siler; site dili (NEXT_LOCALE) hatırlatmanın dili olur
 * DELETE — özeti siler
 */

import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import { getCustomerFromRequest } from '@/lib/customerAuth'
import { isRateLimited } from '@/lib/rate-limit'
import { toCatalogLocale } from '@/lib/catalog-en'

export async function PUT(request: NextRequest) {
  if (isRateLimited(request, 'cart-snapshot', 60, 60_000)) {
    return NextResponse.json({ ok: false }, { status: 429 })
  }
  const customer = await getCustomerFromRequest(request)
  if (!customer?.email) return NextResponse.json({ ok: false }, { status: 401 })

  const body = await request.json().catch(() => ({}))
  const items = (Array.isArray(body.items) ? body.items : [])
    .slice(0, 100)
    .map((i: { id?: unknown; quantity?: unknown }) => ({
      id: typeof i?.id === 'string' ? i.id.slice(0, 200) : '',
      quantity: Math.max(1, Math.min(999, Math.floor(Number(i?.quantity) || 1))),
    }))
    .filter((i: { id: string }) => i.id)

  if (items.length === 0) {
    await prisma.cartSnapshot.deleteMany({ where: { userId: customer.userId } })
    return NextResponse.json({ ok: true })
  }
  const locale = toCatalogLocale(request.cookies.get('NEXT_LOCALE')?.value)
  // Sepet değiştiğinde hatırlatma hakkı yenilenir (bir sepet için en fazla bir hatırlatma)
  await prisma.cartSnapshot.upsert({
    where: { userId: customer.userId },
    create: { userId: customer.userId, email: customer.email, items, locale },
    update: { email: customer.email, items, remindedAt: null, locale },
  })
  return NextResponse.json({ ok: true })
}

export async function DELETE(request: NextRequest) {
  const customer = await getCustomerFromRequest(request)
  if (!customer) return NextResponse.json({ ok: false }, { status: 401 })
  await prisma.cartSnapshot.deleteMany({ where: { userId: customer.userId } })
  return NextResponse.json({ ok: true })
}
