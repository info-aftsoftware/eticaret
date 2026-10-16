/**
 * Product Questions API
 * GET: Get questions for a product (from Firestore)
 * POST: Create a new question (guest or logged-in)
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
      return NextResponse.json({ questions: [] })
    }
    const db = getAdminFirestore()
    if (!db) return NextResponse.json({ questions: [] })

    const snap = await db
      .collection('productQuestions')
      .where('productId', '==', params.id)
      .orderBy('createdAt', 'desc')
      .limit(100)
      .get()

    // Yalnızca yanıtlanmış (admin onaylı) sorular yayınlanır
    const questions = snap.docs.filter((d) => {
      const data = d.data()
      return !!data.answer && data.status !== 'hidden'
    }).map((d) => {
      const data = d.data()
      const ts = data.createdAt as { toDate?: () => Date } | null
      return {
        id: d.id,
        question: data.question || '',
        answer: data.answer || null,
        userName: data.userName || 'Anonim',
        createdAt: ts?.toDate ? ts.toDate().toISOString() : '',
      }
    })

    return NextResponse.json({ questions })
  } catch (error) {
    console.error('Questions GET error:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}

export async function POST(request: NextRequest, props: { params: Promise<{ id: string }> }) {
  const params = await props.params;
  try {
    if (isRateLimited(request, 'product-question', 5, 10 * 60_000)) {
      return NextResponse.json({ error: 'Çok fazla soru gönderdiniz. Lütfen daha sonra tekrar deneyin.' }, { status: 429 })
    }
    const body = await request.json().catch(() => ({}))
    const { question, productName, guestName, guestEmail } = body
    if (!(await verifyTurnstile(body.turnstileToken, getClientIp(request)))) {
      return NextResponse.json({ error: TURNSTILE_ERROR }, { status: 400 })
    }

    if (typeof question !== 'string' || !question.trim()) {
      return NextResponse.json({ error: 'Soru gereklidir' }, { status: 400 })
    }
    if (question.trim().length > 1000) {
      return NextResponse.json({ error: 'Soru en fazla 1000 karakter olabilir.' }, { status: 400 })
    }

    // Logged-in user from Firebase ID token
    const authUser = await getUserFromToken(request)

    const resolvedName = (authUser?.name || (typeof guestName === 'string' ? guestName.trim() : '')).slice(0, 100)
    const resolvedEmail = (authUser?.email || (typeof guestEmail === 'string' ? guestEmail.trim() : '')).slice(0, 200)

    if (!resolvedName || !resolvedEmail) {
      return NextResponse.json({ error: 'Ad ve e-posta gereklidir' }, { status: 400 })
    }
    if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(resolvedEmail)) {
      return NextResponse.json({ error: 'Geçerli bir e-posta adresi girin.' }, { status: 400 })
    }

    if (!isFirebaseAdminConfigured()) {
      return NextResponse.json({ error: 'Sunucu yapılandırılmamış' }, { status: 503 })
    }
    const db = getAdminFirestore()
    if (!db) {
      return NextResponse.json({ error: 'Veritabanı bağlantısı kurulamadı' }, { status: 503 })
    }

    const docRef = await db.collection('productQuestions').add({
      productId: params.id,
      productName: typeof productName === 'string' ? productName.slice(0, 300) : null,
      userId: authUser?.userId || null,
      userName: resolvedName,
      userEmail: resolvedEmail,
      question: question.trim(),
      answer: null,
      // Moderasyon: soru, admin yanıtlayana kadar sitede yayınlanmaz
      status: 'pending',
      createdAt: new Date(),
    })

    return NextResponse.json({ id: docRef.id }, { status: 201 })
  } catch (error) {
    console.error('Question POST error:', error)
    return NextResponse.json({ error: 'Bir hata oluştu' }, { status: 500 })
  }
}
