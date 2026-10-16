/**
 * Product Reviews API
 * GET: Get reviews for a product (from Firestore)
 * POST: Create a new review (guest or logged-in)
 */

export const dynamic = 'force-dynamic'

import { NextRequest, NextResponse } from 'next/server'
import { isRateLimited, getClientIp } from '@/lib/rate-limit'
import { verifyTurnstile, TURNSTILE_ERROR } from '@/lib/turnstile'
import { getAdminFirestore, getAdminAuth, isFirebaseAdminConfigured } from '@/lib/firebaseAdminServer'

async function getUserFromToken(request: NextRequest): Promise<{ userId: string; name?: string; email?: string } | null> {
  const authHeader = request.headers.get('authorization')
  const token = authHeader?.replace('Bearer ', '')
  if (!token) return null
  try {
    const adminAuth = getAdminAuth()
    if (!adminAuth) return null
    const decoded = await adminAuth.verifyIdToken(token)
    return {
      userId: decoded.uid,
      name: decoded.name as string | undefined,
      email: decoded.email,
    }
  } catch {
    return null
  }
}

export async function GET(request: NextRequest, props: { params: Promise<{ id: string }> }) {
  const params = await props.params;
  try {
    if (!isFirebaseAdminConfigured()) {
      return NextResponse.json({ reviews: [], averageRating: 0, totalReviews: 0 })
    }
    const db = getAdminFirestore()
    if (!db) return NextResponse.json({ reviews: [], averageRating: 0, totalReviews: 0 })

    const snap = await db
      .collection('productReviews')
      .where('productId', '==', params.id)
      .where('status', '==', 'approved')
      .orderBy('createdAt', 'desc')
      .limit(100)
      .get()

    const reviews = snap.docs.map((d) => {
      const data = d.data()
      const ts = data.createdAt as { toDate?: () => Date } | null
      return {
        id: d.id,
        userId: data.userId || '',
        userName: data.userName || 'Anonim',
        rating: data.rating || 5,
        title: data.title || '',
        comment: data.comment || '',
        createdAt: ts?.toDate ? ts.toDate().toISOString() : '',
      }
    })

    const averageRating =
      reviews.length > 0
        ? reviews.reduce((sum, r) => sum + r.rating, 0) / reviews.length
        : 0

    return NextResponse.json({
      reviews,
      averageRating: Math.round(averageRating * 10) / 10,
      totalReviews: reviews.length,
    })
  } catch (error) {
    console.error('Reviews GET error:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}

export async function POST(request: NextRequest, props: { params: Promise<{ id: string }> }) {
  const params = await props.params;
  try {
    const body = await request.json()
    const { rating, title, comment, guestName, guestEmail } = body
    if (!(await verifyTurnstile(body.turnstileToken, getClientIp(request)))) {
      return NextResponse.json({ success: false, error: TURNSTILE_ERROR }, { status: 400 })
    }
    if (isRateLimited(request, 'product-review', 5, 10 * 60_000)) {
      return NextResponse.json({ success: false, error: 'Çok fazla yorum gönderdiniz. Lütfen daha sonra tekrar deneyin.' }, { status: 429 })
    }
    if (typeof comment === 'string' && comment.trim().length > 3000) {
      return NextResponse.json({ success: false, error: 'Yorum en fazla 3000 karakter olabilir.' }, { status: 400 })
    }
    if (typeof title === 'string' && title.trim().length > 200) {
      return NextResponse.json({ success: false, error: 'Başlık en fazla 200 karakter olabilir.' }, { status: 400 })
    }

    if (!comment?.trim()) {
      return NextResponse.json({ success: false, error: 'Yorum gereklidir' }, { status: 400 })
    }
    if (!rating || rating < 1 || rating > 5) {
      return NextResponse.json({ success: false, error: 'Yıldız 1-5 arası olmalıdır' }, { status: 400 })
    }

    // Logged-in user from Firebase ID token
    const authUser = await getUserFromToken(request)

    // Guest must provide name + email
    const resolvedName = authUser?.name || guestName?.trim()
    const resolvedEmail = authUser?.email || guestEmail?.trim()

    if (!resolvedName || !resolvedEmail) {
      return NextResponse.json(
        { success: false, error: 'Ad ve e-posta gereklidir' },
        { status: 400 }
      )
    }

    if (!isFirebaseAdminConfigured()) {
      return NextResponse.json({ success: false, error: 'Sunucu yapılandırılmamış' }, { status: 503 })
    }
    const db = getAdminFirestore()
    if (!db) {
      return NextResponse.json({ success: false, error: 'Veritabanı bağlantısı kurulamadı' }, { status: 503 })
    }

    const docRef = await db.collection('productReviews').add({
      productId: params.id,
      userId: authUser?.userId || null,
      userName: resolvedName,
      userEmail: resolvedEmail,
      rating: parseInt(String(rating)),
      title: title?.trim() || null,
      comment: comment.trim(),
      status: 'pending',
      createdAt: new Date(),
    })

    return NextResponse.json({ success: true, id: docRef.id }, { status: 201 })
  } catch (error) {
    console.error('Review POST error:', error)
    return NextResponse.json({ success: false, error: 'Bir hata oluştu' }, { status: 500 })
  }
}
