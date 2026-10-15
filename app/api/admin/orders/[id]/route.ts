/**
 * Admin: Tek sipariş detay (GET) ve durum güncelleme (PATCH).
 * Query: source=prisma | firestore, Firestore için userId zorunlu.
 */

import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import { getAdminFirestore, isFirebaseAdminConfigured } from '@/lib/firebaseAdminServer'
import { checkAdmin } from '@/lib/adminAuth'
import { getAdminOrderDetail, patchAdminOrder } from '@/lib/admin-orders'
import { sendShipmentNotice, sendPaymentConfirmation } from '@/lib/notifications'
import type { NotificationData } from '@/lib/notifications'
import { buildInvoiceDataFromPrisma, buildInvoiceDataFromNormalized } from '@/lib/invoice-data'
import { generateAndSendInvoice } from '@/lib/invoice-send'

/** Admin UI'dan gelen lowercase/mixed status → Prisma OrderStatus (uppercase, mevcut enum değerleri) */
function normalizeStatus(s: string | undefined): string | undefined {
  if (!s) return undefined
  const map: Record<string, string> = {
    pending: 'PENDING',
    confirmed: 'PICKING',   // "Onaylandı" → picking
    processing: 'PICKING',  // "İşleniyor" → picking
    paid: 'PAID',
    picking: 'PICKING',
    shipped: 'SHIPPED',
    delivered: 'DELIVERED',
    cancelled: 'CANCELLED',
    returned: 'RETURNED',
  }
  return map[s.toLowerCase()] ?? s.toUpperCase()
}

function normalizeOrderForResponse(order: {
  id: string
  source: 'prisma' | 'firestore'
  orderId: string
  customer: Record<string, unknown>
  items: Array<{ id?: string; name: string; price: number; quantity: number; productName?: string; unitPrice?: number; lineTotal?: number }>
  pricing: { subtotal?: number; total?: number; tax?: number; shipping?: number }
  status: string
  paymentStatus: string
  createdAt: Date | string
  trackingNumber?: string | null
  userId?: string | null
}) {
  return {
    id: order.id,
    source: order.source,
    orderId: order.orderId,
    customer: order.customer,
    items: order.items.map((item) => ({
      id: item.id,
      name: item.name || item.productName || 'Ürün',
      price: item.price ?? item.unitPrice ?? 0,
      quantity: item.quantity,
      lineTotal: item.lineTotal ?? (item.price ?? item.unitPrice ?? 0) * item.quantity,
    })),
    pricing: order.pricing,
    status: order.status,
    paymentStatus: order.paymentStatus,
    createdAt: typeof order.createdAt === 'string' ? order.createdAt : order.createdAt?.toISOString?.() ?? new Date().toISOString(),
    trackingNumber: order.trackingNumber ?? undefined,
    userId: order.userId ?? undefined,
  }
}

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
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
    if (source === 'prisma') {
      const detail = await getAdminOrderDetail(id)
      if (!detail) {
        return NextResponse.json({ error: 'Sipariş bulunamadı' }, { status: 404 })
      }
      return NextResponse.json(detail)
    }

    if (source === 'firestore') {
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
      const createdAtDate = createdAt?.toDate?.() ?? (data.createdAt instanceof Date ? data.createdAt : new Date())
      const customer = (data.customer as Record<string, unknown>) || {}
      const items = (data.items as Array<{ id?: string; name: string; price: number; quantity: number }>) || []
      const pricing = (data.pricing as { subtotal?: number; tax?: number; shipping?: number; total?: number }) || {}
      return NextResponse.json(
        normalizeOrderForResponse({
          id: docSnap.id,
          source: 'firestore',
          orderId: (data.orderId as string) || docSnap.id,
          customer,
          items,
          pricing,
          status: (data.status as string) || 'pending',
          paymentStatus: (data.paymentStatus as string) || 'pending',
          createdAt: createdAtDate,
          trackingNumber: data.trackingNumber as string | undefined,
          userId,
        })
      )
    }

    return NextResponse.json({ error: 'Geçersiz source' }, { status: 400 })
  } catch (error) {
    console.error('Admin order detail error:', error)
    return NextResponse.json(
      { error: 'Sipariş getirilirken bir hata oluştu' },
      { status: 500 }
    )
  }
}

export async function PATCH(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
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

  let body: Record<string, any>
  try {
    body = await request.json()
  } catch {
    return NextResponse.json({ error: 'Geçersiz JSON' }, { status: 400 })
  }

  const { status: rawStatus, paymentStatus: rawPaymentStatus, trackingNumber } = body
  const status = normalizeStatus(rawStatus)
  const paymentStatus = rawPaymentStatus ? rawPaymentStatus.toUpperCase() : undefined

  try {
    if (source === 'prisma') {
      return await patchAdminOrder(id, body)
    }

    if (source === 'firestore') {
      if (!userId) {
        return NextResponse.json({ error: 'Firestore siparişi için userId gerekli' }, { status: 400 })
      }
      const db = isFirebaseAdminConfigured() ? getAdminFirestore() : null
      if (!db) {
        return NextResponse.json({ error: 'Firestore yapılandırılmamış' }, { status: 503 })
      }

      const ref = db.collection('users').doc(userId).collection('orders').doc(id)
      const docSnap = await ref.get()
      if (!docSnap.exists) {
        return NextResponse.json({ error: 'Sipariş bulunamadı' }, { status: 404 })
      }

      const updateData: Record<string, unknown> = {}
      if (status !== undefined) updateData.status = status
      if (paymentStatus !== undefined) updateData.paymentStatus = paymentStatus
      if (trackingNumber !== undefined) updateData.trackingNumber = trackingNumber

      if (Object.keys(updateData).length > 0) {
        await ref.update(updateData)
      }

      const data = docSnap.data()!
      const customer = (data.customer as Record<string, unknown>) || {}
      const customerEmail = (customer.email as string) || ''
      if (status === 'shipped' && trackingNumber && customerEmail) {
        const notificationData: NotificationData = {
          orderId: (data.orderId as string) || id,
          orderData: {} as any,
          customer: customer as any,
          config: null,
          choices: null,
          pricing: (data.pricing as any) || {},
        }
        await sendShipmentNotice(notificationData, trackingNumber)
      }

      const updatedSnap = await ref.get()
      const updatedData = updatedSnap.data()!

      // Admin "Ödendi" işaretlediyse (havale) fatura + ödeme onay e-postası gönder
      if (paymentStatus === 'PAID' && customerEmail) {
        try {
          const orderId = (updatedData.orderId as string) || id
          const normalized = {
            customer: updatedData.customer || {},
            items: updatedData.items || [],
            pricing: updatedData.pricing || {},
            status: updatedData.status,
          }
          const invoiceData = buildInvoiceDataFromNormalized(normalized)
          await generateAndSendInvoice(orderId, invoiceData, customerEmail)
          await sendPaymentConfirmation({
            orderId,
            orderData: normalized,
            customer: invoiceData.customer,
            config: null,
            choices: null,
            pricing: invoiceData.pricing,
          })
        } catch (e) {
          console.error('Admin mark PAID (Firestore): invoice/email error', e)
        }
      }
      const createdAt = updatedData.createdAt as { toDate?: () => Date } | undefined
      const createdAtDate = createdAt?.toDate?.() ?? new Date()
      const items = (updatedData.items as any[]) || []
      const pricing = (updatedData.pricing as any) || {}
      return NextResponse.json({
        success: true,
        order: normalizeOrderForResponse({
          id: updatedSnap.id,
          source: 'firestore',
          orderId: (updatedData.orderId as string) || updatedSnap.id,
          customer: updatedData.customer || {},
          items,
          pricing,
          status: (updatedData.status as string) || 'pending',
          paymentStatus: (updatedData.paymentStatus as string) || 'pending',
          createdAt: createdAtDate,
          trackingNumber: updatedData.trackingNumber as string | undefined,
          userId,
        }),
      })
    }

    return NextResponse.json({ error: 'Geçersiz source' }, { status: 400 })
  } catch (error) {
    console.error('Admin order PATCH error:', error)
    return NextResponse.json(
      { error: 'Sipariş güncellenirken bir hata oluştu' },
      { status: 500 }
    )
  }
}
