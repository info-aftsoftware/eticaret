export const dynamic = 'force-dynamic'

/**
 * Admin: Product Questions
 * GET    — list all questions
 * PATCH  — add/update an answer  (body: { id, answer })
 * DELETE — delete a question     (?id=...)
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
      .collection('productQuestions')
      .orderBy('createdAt', 'desc')
      .limit(500)
      .get()

    const questions = snap.docs.map((d) => {
      const data = d.data()
      const ts = data.createdAt as { toDate?: () => Date } | null
      return {
        id: d.id,
        productId: data.productId || '',
        productName: data.productName || '',
        userName: data.userName || 'Anonim',
        userEmail: data.userEmail || '',
        question: data.question || '',
        answer: data.answer || null,
        createdAt: ts?.toDate ? ts.toDate().toISOString() : '',
      }
    })

    return NextResponse.json({ questions })
  } catch (error) {
    console.error('Admin questions GET error:', error)
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
    const { id, answer } = body

    if (!id) return NextResponse.json({ error: 'id gereklidir' }, { status: 400 })
    if (answer === undefined || answer === null) {
      return NextResponse.json({ error: 'answer gereklidir' }, { status: 400 })
    }

    await db.collection('productQuestions').doc(id).update({
      answer: answer.trim(),
      answeredAt: new Date(),
    })

    return NextResponse.json({ success: true })
  } catch (error) {
    console.error('Admin questions PATCH error:', error)
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

    await db.collection('productQuestions').doc(id).delete()
    return NextResponse.json({ success: true })
  } catch (error) {
    console.error('Admin questions DELETE error:', error)
    return NextResponse.json({ error: 'Silme başarısız' }, { status: 500 })
  }
}
