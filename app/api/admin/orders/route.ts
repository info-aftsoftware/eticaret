export const dynamic = 'force-dynamic'

/**
 * Admin: Sipariş listesi
 * - Prisma Order (misafir / variant siparişleri)
 * - Firestore: users/{uid}/orders — collectionGroup('orders') ile tüm üye siparişleri listelenir
 */

import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import { getAdminFirestore, isFirebaseAdminConfigured } from '@/lib/firebaseAdminServer'
import { checkAdmin } from '@/lib/adminAuth'

export async function GET(request: NextRequest) {
  const auth = await checkAdmin(request)
  if ('error' in auth) {
    return NextResponse.json({ error: auth.error }, { status: auth.status })
  }

  try {
    const { searchParams } = new URL(request.url)
    const limit = Math.min(parseInt(searchParams.get('limit') || '100', 10), 500)
    const status = searchParams.get('status') || undefined
    const source = searchParams.get('source') || 'all' // 'prisma' | 'firestore' | 'all'

    const result: { prisma: any[]; firestore: any[] } = { prisma: [], firestore: [] }

    if (source === 'all' || source === 'prisma') {
      const where = status ? { status: status as any } : {}
      result.prisma = await prisma.order.findMany({
        where,
        include: {
          lines: true,
          user: { select: { id: true, email: true, name: true, customerNo: true } },
          returnRequests: { where: { status: { in: ['REQUESTED', 'APPROVED', 'RECEIVED'] } }, select: { id: true, status: true } },
          events: { where: { type: 'payment_notice' }, select: { id: true } },
        },
        orderBy: { createdAt: 'desc' },
        take: limit,
      })
    }

    if (source === 'all' || source === 'firestore') {
      try {
        const db = isFirebaseAdminConfigured() ? getAdminFirestore() : null
        if (db) {
          const snapshot = await db.collectionGroup('orders').orderBy('createdAt', 'desc').limit(limit).get()
          result.firestore = snapshot.docs.map((d) => {
            const data = d.data()
            const createdAt = data.createdAt
            const createdAtDate =
              createdAt && typeof (createdAt as { toDate?: () => Date }).toDate === 'function'
                ? (createdAt as { toDate: () => Date }).toDate()
                : createdAt instanceof Date
                  ? createdAt
                  : new Date()
            const parentUserId = d.ref.parent?.parent?.id ?? null
            return {
              id: d.id,
              userId: parentUserId,
              source: 'firestore',
              orderId: data.orderId || d.id,
              customer: data.customer || {},
              items: data.items || [],
              pricing: data.pricing || {},
              status: data.status || 'pending',
              paymentStatus: data.paymentStatus || 'pending',
              createdAt: createdAtDate,
            }
          })
        }
      } catch (firestoreErr) {
        console.warn('Firestore orders query failed (index missing?):', (firestoreErr as Error).message)
        result.firestore = []
      }
    }

    return NextResponse.json(result)
  } catch (error) {
    console.error('Admin orders list error:', error)
    return NextResponse.json(
      { error: 'Siparişler getirilirken bir hata oluştu' },
      { status: 500 }
    )
  }
}
