/**
 * Product Questions API
 * GET: Get questions for a product (from Firestore)
 * POST: Create a new question (guest or logged-in)
 */

export const dynamic = 'force-dynamic'

import { NextRequest, NextResponse } from 'next/server'
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

export async function GET(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
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

    const questions = snap.docs.map((d) => {
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

export async function POST(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const body = await request.json()
    const { question, productName, guestName, guestEmail } = body

    if (!question?.trim()) {
      return NextResponse.json({ error: 'Soru gereklidir' }, { status: 400 })
    }

    // Logged-in user from Firebase ID token
    const authUser = await getUserFromToken(request)

    const resolvedName = authUser?.name || guestName?.trim()
    const resolvedEmail = authUser?.email || guestEmail?.trim()

    if (!resolvedName || !resolvedEmail) {
      return NextResponse.json({ error: 'Ad ve e-posta gereklidir' }, { status: 400 })
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
      productName: productName || null,
      userId: authUser?.userId || null,
      userName: resolvedName,
      userEmail: resolvedEmail,
      question: question.trim(),
      answer: null,
      createdAt: new Date(),
    })

    return NextResponse.json({ id: docRef.id }, { status: 201 })
  } catch (error) {
    console.error('Question POST error:', error)
    return NextResponse.json({ error: 'Bir hata oluştu' }, { status: 500 })
  }
}
