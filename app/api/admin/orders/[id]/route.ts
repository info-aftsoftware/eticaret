/**
 * Admin: Tek sipariş detay (GET) ve işlemler (PATCH).
 * Siparişler Prisma'dadır; işlemler lib/admin-orders → lib/order-service üzerinden yapılır.
 *
 * Eski Firestore siparişleri (users/{uid}/orders) istemci tarafından yazılabildiği için güvenilir değildir:
 * yalnızca salt okunur görüntülenir (?source=firestore&userId=...), üzerinde e-posta gönderen işlem yapılmaz.
 */

import { NextRequest, NextResponse } from 'next/server'
import { getAdminFirestore, isFirebaseAdminConfigured } from '@/lib/firebaseAdminServer'
import { checkAdmin, logAdminAction } from '@/lib/adminAuth'
import { getAdminOrderDetail, patchAdminOrder } from '@/lib/admin-orders'
import { prisma } from '@/lib/prisma'
import { getClientIp } from '@/lib/rate-limit'
import { ORDER_STATUS_LABELS_TR } from '@/lib/order-service'
import { diffFields, summarizeChanges } from '@/lib/audit-diff'

const PAYMENT_TR: Record<string, string> = { PENDING: 'Bekliyor', PAID: 'Ödendi', FAILED: 'Başarısız', REFUNDED: 'İade edildi', PARTIALLY_REFUNDED: 'Kısmi iade' }

/** İşlem kaydında izlenen sipariş alanları (A09) */
const ORDER_AUDIT_LABELS: Record<string, string> = {
  status: 'Sipariş durumu',
  paymentStatus: 'Ödeme durumu',
  shippingCarrier: 'Kargo firması',
  trackingNumber: 'Takip no',
  adminNote: 'Yönetici notu',
  geliverShipmentId: 'Geliver gönderisi',
  navlungoPostNumber: 'Navlungo gönderisi',
  returns: 'İade talepleri',
}

async function orderAuditSnapshot(id: string): Promise<Record<string, unknown> | null> {
  const o = await prisma.order.findUnique({
    where: { id },
    select: { orderNo: true, status: true, paymentStatus: true, shippingCarrier: true, trackingNumber: true, adminNote: true, geliverShipmentId: true, navlungoPostNumber: true, returnRequests: { select: { requestNo: true, status: true } } },
  })
  if (!o) return null
  return {
    ...o,
    status: ORDER_STATUS_LABELS_TR[o.status] ?? o.status,
    paymentStatus: PAYMENT_TR[o.paymentStatus] ?? o.paymentStatus,
    returns: o.returnRequests.map((r) => `${r.requestNo}:${r.status}`).join(', ') || null,
  }
}

type LegacyItem = { id?: string; name?: string; productName?: string; price?: number; unitPrice?: number; quantity?: number; lineTotal?: number }

export async function GET(request: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const auth = await checkAdmin(request)
  if ('error' in auth) {
    return NextResponse.json({ error: auth.error }, { status: auth.status })
  }

  const { id } = await params
  const { searchParams } = new URL(request.url)
  const source = searchParams.get('source') || 'prisma'
  const userId = searchParams.get('userId') || ''

  if (!id) {
    return NextResponse.json({ error: 'Sipariş id gerekli' }, { status: 400 })
  }

  try {
    if (source !== 'firestore') {
      const detail = await getAdminOrderDetail(id)
      if (!detail) {
        return NextResponse.json({ error: 'Sipariş bulunamadı' }, { status: 404 })
      }
      return NextResponse.json(detail)
    }

    // Eski Firestore siparişi — salt okunur
    if (!userId) {
      return NextResponse.json({ error: 'Firestore siparişi için userId gerekli' }, { status: 400 })
    }
    const db = isFirebaseAdminConfigured() ? getAdminFirestore() : null
    if (!db) {
      return NextResponse.json({ error: 'Firestore yapılandırılmamış' }, { status: 503 })
    }
    const docSnap = await db.collection('users').doc(userId).collection('orders').doc(id).get()
    if (!docSnap.exists) {
      return NextResponse.json({ error: 'Sipariş bulunamadı' }, { status: 404 })
    }
    const data = docSnap.data()!
    const createdAt = data.createdAt as { toDate?: () => Date } | undefined
    const items = (Array.isArray(data.items) ? data.items : []) as LegacyItem[]
    return NextResponse.json({
      id: docSnap.id,
      source: 'firestore',
      readOnly: true,
      orderId: (data.orderId as string) || docSnap.id,
      userId,
      customer: (data.customer as Record<string, unknown>) || {},
      items: items.map((item) => {
        const price = Number(item.price ?? item.unitPrice ?? 0)
        const quantity = Number(item.quantity ?? 1)
        return { id: item.id, name: item.name || item.productName || 'Ürün', price, quantity, lineTotal: item.lineTotal ?? price * quantity }
      }),
      pricing: (data.pricing as Record<string, number>) || {},
      status: String(data.status || 'pending').toUpperCase(),
      paymentStatus: String(data.paymentStatus || 'pending').toUpperCase(),
      createdAt: (createdAt?.toDate?.() ?? new Date()).toISOString(),
      trackingNumber: (data.trackingNumber as string | undefined) ?? undefined,
    })
  } catch (error) {
    console.error('Admin order detail error:', error)
    return NextResponse.json({ error: 'Sipariş getirilirken bir hata oluştu' }, { status: 500 })
  }
}

export async function PATCH(request: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const auth = await checkAdmin(request)
  if ('error' in auth) {
    return NextResponse.json({ error: auth.error }, { status: auth.status })
  }

  const { id } = await params
  const { searchParams } = new URL(request.url)
  if (!id) {
    return NextResponse.json({ error: 'Sipariş id gerekli' }, { status: 400 })
  }
  if (searchParams.get('source') === 'firestore') {
    return NextResponse.json(
      { error: 'Eski (Firestore) siparişler salt okunurdur; bu siparişler üzerinde işlem yapılamaz.' },
      { status: 410 }
    )
  }

  let body: Record<string, unknown>
  try {
    body = await request.json()
  } catch {
    return NextResponse.json({ error: 'Geçersiz JSON' }, { status: 400 })
  }

  try {
    // İşlem kaydı (A09): siparişin izlenen alanları işlemden önce ve sonra karşılaştırılır
    const before = await orderAuditSnapshot(id)
    const res = await patchAdminOrder(id, body)
    if (res.ok && before) {
      const after = await orderAuditSnapshot(id)
      const changes = after ? diffFields(before, after, ORDER_AUDIT_LABELS) : []
      const op = typeof body.action === 'string' ? body.action : body.status ? 'status' : body.paymentStatus ? 'mark_paid' : body.adminNote !== undefined ? 'note' : 'güncelleme'
      void logAdminAction(auth.actor, 'Sipariş güncellendi', {
        method: 'PATCH',
        path: `/api/admin/orders/${id}`,
        ip: getClientIp(request),
        objectType: 'order',
        objectId: String(before.orderNo),
        changes,
        details: `${before.orderNo} (${op})${changes.length ? `: ${summarizeChanges(changes)}` : ''}`,
      })
    }
    return res
  } catch (error) {
    console.error('Admin order PATCH error:', error)
    return NextResponse.json({ error: 'Sipariş güncellenirken bir hata oluştu' }, { status: 500 })
  }
}
