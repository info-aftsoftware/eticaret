/**
 * Admin: Sipariş faturasını (proforma) oluşturup müşteri e-postasına yeniden gönderir.
 * Yalnızca Prisma siparişleri. Eski Firestore siparişleri istemciden yazılabildiği için
 * (e-posta adresi güvenilir değil) bu uç nokta üzerinden e-posta gönderilmez.
 */

import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import { checkAdmin } from '@/lib/adminAuth'
import { buildInvoiceDataFromPrisma } from '@/lib/invoice-data'
import { generateAndSendInvoice } from '@/lib/invoice-send'
import { logOrderEvent } from '@/lib/order-service'

export async function POST(request: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const auth = await checkAdmin(request)
  if ('error' in auth) {
    return NextResponse.json({ error: auth.error }, { status: auth.status })
  }

  const { id } = await params
  const body = (await request.json().catch(() => ({}))) as { source?: string }
  if (!id) {
    return NextResponse.json({ error: 'Sipariş id gerekli' }, { status: 400 })
  }
  if (body.source === 'firestore') {
    return NextResponse.json({ error: 'Eski (Firestore) siparişler için fatura gönderilemez.' }, { status: 410 })
  }

  try {
    const order = await prisma.order.findUnique({
      where: { id },
      include: { lines: true, user: { select: { email: true } } },
    })
    if (!order) {
      return NextResponse.json({ error: 'Sipariş bulunamadı' }, { status: 404 })
    }
    // İptal edilmiş siparişe sipariş özeti (proforma) gönderilmez (A15)
    if (order.status === 'CANCELLED') {
      return NextResponse.json({ error: 'İptal edilmiş siparişe sipariş özeti gönderilmez.' }, { status: 409 })
    }
    // Misafir siparişlerinde e-posta shippingEmail alanındadır
    const customerEmail = order.shippingEmail || order.user?.email || ''
    if (!customerEmail || customerEmail.endsWith('@placeholder.local')) {
      return NextResponse.json({ error: 'Siparişte müşteri e-postası yok' }, { status: 400 })
    }
    const invoiceData = buildInvoiceDataFromPrisma(order)
    const result = await generateAndSendInvoice(order.orderNo, invoiceData, customerEmail)
    await logOrderEvent(order.id, {
      type: 'email',
      message: result.sent ? 'Fatura e-postası admin tarafından yeniden gönderildi.' : `Fatura gönderilemedi: ${result.error ?? 'bilinmeyen hata'}`,
      actor: 'admin',
      visibleToCustomer: false,
    })
    if (result.sent) {
      return NextResponse.json({ success: true, message: 'Sipariş özeti (proforma) e-posta ile gönderildi.' })
    }
    return NextResponse.json({ success: false, error: result.error || 'Gönderilemedi' }, { status: 500 })
  } catch (error) {
    console.error('Send invoice error:', error)
    return NextResponse.json({ error: 'Fatura gönderilirken hata oluştu' }, { status: 500 })
  }
}
