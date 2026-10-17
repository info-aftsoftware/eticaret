/**
 * Admin: Tek sipariş detay (GET) ve işlemler (PATCH).
 * Siparişler Prisma'dadır; işlemler lib/admin-orders → lib/order-service üzerinden yapılır.
 *
 * Eski Firestore siparişleri (users/{uid}/orders) istemci tarafından yazılabildiği için güvenilir değildir:
 * yalnızca salt okunur görüntülenir (?source=firestore&userId=...), üzerinde e-posta gönderen işlem yapılmaz.
 */

import { NextRequest, NextResponse } from 'next/server'
import { getAdminFirestore, isFirebaseAdminConfigured } from '@/lib/firebaseAdminServer'
import { checkAdmin } from '@/lib/adminAuth'
import { getAdminOrderDetail, patchAdminOrder } from '@/lib/admin-orders'

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
    return await patchAdminOrder(id, body)
  } catch (error) {
    console.error('Admin order PATCH error:', error)
    return NextResponse.json({ error: 'Sipariş güncellenirken bir hata oluştu' }, { status: 500 })
  }
}
