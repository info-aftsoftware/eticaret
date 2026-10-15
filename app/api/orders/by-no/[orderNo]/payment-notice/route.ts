export const dynamic = 'force-dynamic'

/**
 * Havale / EFT ödeme bildirimi (müşteri "ödemeyi yaptım" der).
 * Body: { senderName, bank, amount, paidOn (YYYY-MM-DD), note?, email?, phone? }
 * Yetki: sipariş sahibi (Bearer) veya misafir için e-posta + telefon. Yalnızca ödeme bekleyen havale siparişleri.
 * Sipariş ödendi olarak İŞARETLENMEZ — admin hesap hareketini kontrol edip onaylar.
 */

import React from 'react'
import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import { getCustomerFromRequest } from '@/lib/customerAuth'
import { isRateLimited } from '@/lib/rate-limit'
import { canAccessOrder, toCustomerOrder } from '@/lib/customer-order'
import { logOrderEvent } from '@/lib/order-service'
import { sendEmail } from '@/lib/email'
import { STORE_CONTACT } from '@/lib/store-config'
import PaymentNoticeEmail from '@/emails/order/PaymentNoticeEmail'

const str = (v: unknown, max: number) => (typeof v === 'string' ? v.trim().slice(0, max) : '')

export async function POST(request: NextRequest, { params }: { params: { orderNo: string } }) {
  if (isRateLimited(request, 'payment-notice', 5, 10 * 60_000)) {
    return NextResponse.json({ success: false, error: 'Çok fazla istek.' }, { status: 429 })
  }
  const body = await request.json().catch(() => ({}))
  const order = await prisma.order.findUnique({ where: { orderNo: params.orderNo } })
  const userId = (await getCustomerFromRequest(request))?.userId ?? null
  if (!order || !canAccessOrder(order, userId, { email: body.email, phone: body.phone })) {
    return NextResponse.json({ success: false, error: 'Sipariş bulunamadı' }, { status: 404 })
  }
  if (order.paymentMethod !== 'bank_transfer' || order.paymentStatus === 'PAID' || order.status !== 'PENDING') {
    return NextResponse.json({ success: false, error: 'Bu sipariş için ödeme bildirimi yapılamaz.' }, { status: 409 })
  }

  const senderName = str(body.senderName, 120)
  const bank = str(body.bank, 80)
  const amount = Math.round(Number(body.amount) * 100) / 100
  const paidOn = str(body.paidOn, 10)
  const note = str(body.note, 500) || null
  const paidDate = /^\d{4}-\d{2}-\d{2}$/.test(paidOn) ? new Date(`${paidOn}T00:00:00`) : null
  if (!senderName || !bank || !Number.isFinite(amount) || amount <= 0 || !paidDate || paidDate.getTime() > Date.now() + 86_400_000) {
    return NextResponse.json({ success: false, error: 'Gönderen adı, banka, tutar ve geçerli bir ödeme tarihi girin.' }, { status: 400 })
  }

  const paidOnText = paidDate.toLocaleDateString('tr-TR')
  await logOrderEvent(order.id, {
    type: 'payment_notice',
    message: `Müşteri ödeme bildirimi: ${senderName}, ${bank}, ${amount.toLocaleString('tr-TR', { style: 'currency', currency: 'TRY' })}, ${paidOnText}${note ? ` — ${note}` : ''}. Ödeme kontrol ediliyor.`,
    actor: 'customer',
  })

  try {
    const site = STORE_CONTACT.siteUrl.replace(/\/$/, '')
    const to = process.env.ADMIN_EMAIL || STORE_CONTACT.email
    const res = await sendEmail(
      to,
      `Havale bildirimi - ${order.orderNo}`,
      React.createElement(PaymentNoticeEmail, {
        notice: {
          orderNo: order.orderNo,
          orderTotal: order.total,
          customerName: order.shippingName,
          customerEmail: order.shippingEmail ?? '',
          senderName,
          bank,
          amount,
          paidOn: paidOnText,
          note,
          adminUrl: `${site}/admin/orders/${order.id}?source=prisma`,
        },
      })
    )
    await logOrderEvent(order.id, {
      type: 'email',
      message: res.success ? 'Admin\'e havale bildirimi e-postası gönderildi.' : 'Havale bildirimi e-postası gönderilemedi.',
      visibleToCustomer: false,
    })
  } catch (e) {
    console.error('Payment notice email error:', e)
  }

  const updated = await prisma.order.findUnique({
    where: { id: order.id },
    include: {
      lines: true,
      events: { where: { visibleToCustomer: true }, orderBy: { createdAt: 'asc' } },
      returnRequests: { orderBy: { createdAt: 'asc' } },
    },
  })
  return NextResponse.json({ success: true, order: updated ? toCustomerOrder(updated) : null })
}
