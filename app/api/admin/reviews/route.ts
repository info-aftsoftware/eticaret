export const dynamic = 'force-dynamic'

/**
 * Admin: Product Reviews
 * GET  — list all reviews
 * PATCH — approve a review  (body: { id, status })
 * DELETE — delete a review  (?id=...)
 */

import { NextRequest, NextResponse } from 'next/server'
import { checkAdmin } from '@/lib/adminAuth'
import { getAdminFirestore, isFirebaseAdminConfigured } from '@/lib/firebaseAdminServer'

function requireFirestore() {
  if (!isFirebaseAdminConfigured()) {
    return { error: 'Firebase Admin yapılandırılmamış', status: 503 }
  }
  const db = getAdminFirestore()
  if (!db) return { error: 'Veritabanı bağlantısı kurulamadı', status: 503 }
  return { db }
}

export async function GET(request: NextRequest) {
  const auth = await checkAdmin(request)
  if ('error' in auth) return NextResponse.json({ error: auth.error }, { status: auth.status })

  const result = requireFirestore()
  if ('error' in result) return NextResponse.json({ error: result.error }, { status: result.status })
  const { db } = result

  try {
    const snap = await db
      .collection('productReviews')
      .orderBy('createdAt', 'desc')
      .limit(500)
      .get()

    const reviews = snap.docs.map((d) => {
      const data = d.data()
      const ts = data.createdAt as { toDate?: () => Date } | null
      return {
        id: d.id,
        productId: data.productId || '',
        userName: data.userName || 'Anonim',
        userEmail: data.userEmail || '',
        rating: data.rating || 0,
        title: data.title || '',
        comment: data.comment || '',
        status: data.status || 'pending',
        createdAt: ts?.toDate ? ts.toDate().toISOString() : '',
      }
    })

    return NextResponse.json({ reviews })
  } catch (error) {
    console.error('Admin reviews GET error:', error)
    return NextResponse.json({ error: 'Liste alınamadı' }, { status: 500 })
  }
}

export async function PATCH(request: NextRequest) {
  const auth = await checkAdmin(request)
  if ('error' in auth) return NextResponse.json({ error: auth.error }, { status: auth.status })

  const result = requireFirestore()
  if ('error' in result) return NextResponse.json({ error: result.error }, { status: result.status })
  const { db } = result

  try {
    const body = await request.json()
    const { id, status } = body

    if (!id || !status) {
      return NextResponse.json({ error: 'id ve status gereklidir' }, { status: 400 })
    }
    if (!['pending', 'approved', 'rejected'].includes(status)) {
      return NextResponse.json({ error: 'Geçersiz status' }, { status: 400 })
    }

    await db.collection('productReviews').doc(id).update({ status })
    return NextResponse.json({ success: true })
  } catch (error) {
    console.error('Admin reviews PATCH error:', error)
    return NextResponse.json({ error: 'Güncelleme başarısız' }, { status: 500 })
  }
}

export async function DELETE(request: NextRequest) {
  const auth = await checkAdmin(request)
  if ('error' in auth) return NextResponse.json({ error: auth.error }, { status: auth.status })

  const result = requireFirestore()
  if ('error' in result) return NextResponse.json({ error: result.error }, { status: result.status })
  const { db } = result

  try {
    const { searchParams } = new URL(request.url)
    const id = searchParams.get('id')
    if (!id) return NextResponse.json({ error: 'id gereklidir' }, { status: 400 })

    await db.collection('productReviews').doc(id).delete()
    return NextResponse.json({ success: true })
  } catch (error) {
    console.error('Admin reviews DELETE error:', error)
    return NextResponse.json({ error: 'Silme başarısız' }, { status: 500 })
  }
}
