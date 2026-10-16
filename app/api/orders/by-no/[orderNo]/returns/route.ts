export const dynamic = 'force-dynamic'

/**
 * Müşteri iade / cayma talebi.
 * POST  { type: 'withdrawal' | 'defective' | 'wrong_item', items: [{ lineId, quantity }], reason?, note?, email?, phone? }
 * PATCH { returnId, op: 'cancel', email?, phone? }  — onaydan önce talebi geri çekme
 * Yetki: sipariş sahibi (Bearer token) veya misafir için e-posta + telefon eşleşmesi.
 */

import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import { getCustomerFromRequest } from '@/lib/customerAuth'
import { isRateLimited } from '@/lib/rate-limit'
import { canAccessOrder, toCustomerOrder } from '@/lib/customer-order'
import { createReturnRequest, updateReturnRequest } from '@/lib/return-service'
import { OrderTransitionError } from '@/lib/order-service'

async function authorize(request: NextRequest, orderNo: string, body: { email?: string; phone?: string }) {
  const order = await prisma.order.findUnique({ where: { orderNo } })
  if (!order) return null
  const userId = (await getCustomerFromRequest(request))?.userId ?? null
  return canAccessOrder(order, userId, { email: body.email, phone: body.phone }) ? order : null
}

async function respond(orderId: string) {
  const order = await prisma.order.findUnique({
    where: { id: orderId },
    include: {
      lines: true,
      events: { where: { visibleToCustomer: true }, orderBy: { createdAt: 'asc' } },
      returnRequests: { orderBy: { createdAt: 'asc' } },
    },
  })
  return NextResponse.json({ success: true, order: order ? toCustomerOrder(order) : null })
}

function errorResponse(e: unknown) {
  if (e instanceof OrderTransitionError) return NextResponse.json({ success: false, error: e.message }, { status: 409 })
  console.error('Return request error:', e)
  return NextResponse.json({ success: false, error: 'İşlem yapılamadı.' }, { status: 500 })
}

export async function POST(request: NextRequest, props: { params: Promise<{ orderNo: string }> }) {
  const params = await props.params;
  if (isRateLimited(request, 'order-return', 5, 10 * 60_000)) {
    return NextResponse.json({ success: false, error: 'Çok fazla istek.' }, { status: 429 })
  }
  const body = await request.json().catch(() => ({}))
  const order = await authorize(request, params.orderNo, body)
  if (!order) return NextResponse.json({ success: false, error: 'Sipariş bulunamadı' }, { status: 404 })
  try {
    await createReturnRequest(order.id, {
      type: String(body.type ?? ''),
      items: Array.isArray(body.items) ? body.items : [],
      reason: typeof body.reason === 'string' ? body.reason : null,
      note: typeof body.note === 'string' ? body.note : null,
    })
    return respond(order.id)
  } catch (e) {
    return errorResponse(e)
  }
}

export async function PATCH(request: NextRequest, props: { params: Promise<{ orderNo: string }> }) {
  const params = await props.params;
  const body = await request.json().catch(() => ({}))
  const order = await authorize(request, params.orderNo, body)
  if (!order) return NextResponse.json({ success: false, error: 'Sipariş bulunamadı' }, { status: 404 })
  if (body.op !== 'cancel' || typeof body.returnId !== 'string') {
    return NextResponse.json({ success: false, error: 'Geçersiz işlem' }, { status: 400 })
  }
  try {
    await updateReturnRequest(order.id, body.returnId, 'cancel', { actor: 'customer' })
    return respond(order.id)
  } catch (e) {
    return errorResponse(e)
  }
}
