export const dynamic = 'force-dynamic'

/**
 * Admin: canlı bildirim özeti (panel düzeni ~30 sn'de bir yoklar).
 * GET ?since=ISO → bekleyen iş sayıları + since sonrasındaki yeni siparişler / havale bildirimleri.
 * Yorum ve soru sayıları Firestore'dan gelir; maliyeti düşük tutmak için 60 sn önbelleklenir.
 */

import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import { checkAdmin } from '@/lib/adminAuth'
import { getAdminFirestore, isFirebaseAdminConfigured } from '@/lib/firebaseAdminServer'

const OPEN_RETURN_STATUSES = ['REQUESTED', 'APPROVED', 'RECEIVED']
/** Açık müşteri iptal talebi (lib/order-service notes.cancelRequest) */
const OPEN_CANCEL_REQUEST = { notes: { contains: '"cancelRequest":{"status":"REQUESTED"' } }
let moderationCache: { at: number; reviews: number; questions: number } | null = null

async function moderationCounts(): Promise<{ reviews: number; questions: number }> {
  if (moderationCache && Date.now() - moderationCache.at < 60_000) return moderationCache
  let reviews = moderationCache?.reviews ?? 0
  let questions = moderationCache?.questions ?? 0
  try {
    const db = isFirebaseAdminConfigured() ? getAdminFirestore() : null
    if (db) {
      const [r, q] = await Promise.all([
        db.collection('productReviews').where('status', '==', 'pending').count().get(),
        db.collection('productQuestions').where('answer', '==', null).count().get(),
      ])
      reviews = r.data().count
      questions = q.data().count
    }
  } catch (e) {
    console.warn('Admin live: moderation count failed', (e as Error).message)
  }
  moderationCache = { at: Date.now(), reviews, questions }
  return moderationCache
}

export async function GET(request: NextRequest) {
  const auth = await checkAdmin(request)
  if ('error' in auth) return NextResponse.json({ error: auth.error }, { status: auth.status })

  const sinceParam = new URL(request.url).searchParams.get('since')
  const sinceDate = sinceParam ? new Date(sinceParam) : null
  const since = sinceDate && !Number.isNaN(sinceDate.getTime()) ? sinceDate : null
  const now = new Date()

  try {
    const [awaitingPayment, toPrepare, picking, openReturns, paymentNotices, moderation, newOrders, newNotices, cancelRequests, newCancelRequests] = await Promise.all([
      prisma.order.count({ where: { status: 'PENDING', paymentStatus: { not: 'PAID' }, paymentMethod: 'bank_transfer' } }),
      prisma.order.count({ where: { paymentStatus: 'PAID', status: { in: ['PENDING', 'PAID', 'CONFIRMED', 'PROCESSING'] } } }),
      prisma.order.count({ where: { status: 'PICKING' } }),
      prisma.order.count({ where: { returnRequests: { some: { status: { in: OPEN_RETURN_STATUSES } } } } }),
      prisma.order.count({
        where: { status: 'PENDING', paymentStatus: { not: 'PAID' }, events: { some: { type: 'payment_notice' } } },
      }),
      moderationCounts(),
      since
        ? prisma.order.findMany({
            // Havale siparişi oluşturulunca, kartlı sipariş ödeme onaylanınca "yeni sipariş" sayılır
            where: {
              OR: [
                { createdAt: { gt: since }, paymentMethod: 'bank_transfer' },
                { paidAt: { gt: since }, paymentMethod: { not: 'bank_transfer' } },
              ],
            },
            orderBy: { createdAt: 'desc' },
            take: 5,
            select: { id: true, orderNo: true, shippingName: true, total: true, paymentMethod: true, createdAt: true },
          })
        : Promise.resolve([]),
      since
        ? prisma.orderEvent.findMany({
            where: { type: 'payment_notice', createdAt: { gt: since } },
            orderBy: { createdAt: 'desc' },
            take: 5,
            select: { id: true, orderId: true, order: { select: { orderNo: true } } },
          })
        : Promise.resolve([]),
      prisma.order.count({ where: OPEN_CANCEL_REQUEST }),
      since
        ? prisma.orderEvent.findMany({
            where: { type: 'cancel_request', status: 'REQUESTED', createdAt: { gt: since } },
            orderBy: { createdAt: 'desc' },
            take: 5,
            select: { id: true, orderId: true, order: { select: { orderNo: true } } },
          })
        : Promise.resolve([]),
    ])

    return NextResponse.json({
      now: now.toISOString(),
      counts: {
        awaitingPayment,
        toPrepare,
        picking,
        // Siparişler menüsündeki rozet: işlem bekleyen siparişler
        ordersAction: toPrepare + picking + paymentNotices + openReturns + cancelRequests,
        cancelRequests,
        paymentNotices,
        openReturns,
        pendingReviews: moderation.reviews,
        pendingQuestions: moderation.questions,
      },
      newOrders: newOrders.map((o) => ({
        id: o.id,
        orderNo: o.orderNo,
        name: o.shippingName,
        total: o.total,
        paymentMethod: o.paymentMethod,
        createdAt: o.createdAt.toISOString(),
      })),
      newPaymentNotices: newNotices.map((e) => ({ id: e.id, orderId: e.orderId, orderNo: e.order.orderNo })),
      newCancelRequests: newCancelRequests.map((e) => ({ id: e.id, orderId: e.orderId, orderNo: e.order.orderNo })),
    })
  } catch (error) {
    console.error('Admin live error:', error)
    return NextResponse.json({ error: 'Özet alınamadı' }, { status: 500 })
  }
}
