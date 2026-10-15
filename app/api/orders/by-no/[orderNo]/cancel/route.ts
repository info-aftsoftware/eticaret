export const dynamic = 'force-dynamic'

/**
 * Müşteri sipariş iptali — yalnızca ödemesi alınmamış, "Beklemede" durumundaki sipariş.
 * Yetki: sipariş sahibi (Bearer token) veya misafir için body.email + body.phone eşleşmesi.
 * Body: { email?, phone?, reason? }
 */

import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import { getCustomerFromRequest } from '@/lib/customerAuth'
import { isRateLimited } from '@/lib/rate-limit'
import { changeOrderStatus, OrderTransitionError } from '@/lib/order-service'
import { toCustomerOrder } from '@/lib/customer-order'

const normalizePhone = (s: unknown) =>
  typeof s === 'string' ? s.replace(/\D/g, '').replace(/^90/, '').replace(/^0/, '') : ''

export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ orderNo: string }> }
) {
  if (isRateLimited(request, 'order-cancel', 10, 60_000)) {
    return NextResponse.json({ success: false, error: 'Çok fazla istek.' }, { status: 429 })
  }
  try {
    const { orderNo } = await params
    const body = await request.json().catch(() => ({}))
    const order = await prisma.order.findUnique({ where: { orderNo } })
    const notFound = NextResponse.json({ success: false, error: 'Sipariş bulunamadı' }, { status: 404 })
    if (!order) return notFound

    const userId = (await getCustomerFromRequest(request))?.userId ?? null
    const isOwner = !!order.userId && order.userId === userId
    const email = typeof body?.email === 'string' ? body.email.trim().toLowerCase() : ''
    const phone = normalizePhone(body?.phone)
    const isGuestMatch =
      !!email && order.shippingEmail?.trim().toLowerCase() === email &&
      phone.length >= 10 && normalizePhone(order.shippingPhone) === phone
    if (!isOwner && !isGuestMatch) return notFound

    if (order.status !== 'PENDING' || order.paymentStatus === 'PAID') {
      return NextResponse.json(
        { success: false, error: 'Bu sipariş artık iptal edilemiyor. Lütfen bizimle iletişime geçin.' },
        { status: 409 }
      )
    }

    const reason = typeof body?.reason === 'string' ? body.reason.trim().slice(0, 500) : null
    await changeOrderStatus(order.id, 'CANCELLED', { actor: 'customer', reason })
    const updated = await prisma.order.findUnique({
      where: { id: order.id },
      include: { lines: true, events: { where: { visibleToCustomer: true }, orderBy: { createdAt: 'asc' } }, returnRequests: { orderBy: { createdAt: 'asc' } } },
    })
    return NextResponse.json({ success: true, order: updated ? toCustomerOrder(updated) : null })
  } catch (e) {
    if (e instanceof OrderTransitionError) {
      return NextResponse.json({ success: false, error: e.message }, { status: 409 })
    }
    console.error('Customer cancel error:', e)
    return NextResponse.json({ success: false, error: 'Sipariş iptal edilemedi.' }, { status: 500 })
  }
}
