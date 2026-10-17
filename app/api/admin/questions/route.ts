export const dynamic = 'force-dynamic'

/**
 * Admin: Product Questions
 * GET    — list all questions
 * PATCH  — add/update an answer  (body: { id, answer, notify? }) — soran kişiye yanıt e-postası gönderilir
 * DELETE — delete a question     (?id=...)
 */

import { NextRequest, NextResponse } from 'next/server'
import { checkAdmin } from '@/lib/adminAuth'
import { getAdminFirestore, isFirebaseAdminConfigured } from '@/lib/firebaseAdminServer'
import { sendQuestionAnsweredEmail } from '@/lib/notifications'
import { getMergedProductById } from '@/lib/catalog-merge'

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
        status: data.status || (data.answer ? 'answered' : 'pending'),
        answerEmailSentAt: (data.answerEmailSentAt as { toDate?: () => Date } | null)?.toDate?.()?.toISOString() ?? null,
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
    const { id, answer, notify } = body as { id?: string; answer?: unknown; notify?: boolean }

    if (!id || typeof id !== 'string') return NextResponse.json({ error: 'id gereklidir' }, { status: 400 })
    if (typeof answer !== 'string' || !answer.trim()) {
      return NextResponse.json({ error: 'Yanıt boş olamaz' }, { status: 400 })
    }
    if (answer.length > 3000) return NextResponse.json({ error: 'Yanıt en fazla 3000 karakter olabilir' }, { status: 400 })

    const ref = db.collection('productQuestions').doc(id)
    const snap = await ref.get()
    if (!snap.exists) return NextResponse.json({ error: 'Soru bulunamadı' }, { status: 404 })
    const q = snap.data() as Record<string, unknown>
    const text = answer.trim()
    const changed = text !== (typeof q.answer === 'string' ? q.answer.trim() : '')

    await ref.update({ answer: text, answeredAt: new Date(), status: 'answered' })

    // Soran kişiye e-posta: ilk yanıtta ve yanıt değiştiğinde (notify:false ile kapatılabilir)
    let emailed = false
    const to = typeof q.userEmail === 'string' ? q.userEmail.trim() : ''
    if (notify !== false && changed && /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(to)) {
      const productId = String(q.productId || '')
      const productName =
        (typeof q.productName === 'string' && q.productName) || (await getMergedProductById(productId).catch(() => null))?.name || 'Ürün'
      emailed = await sendQuestionAnsweredEmail({
        to,
        customerName: typeof q.userName === 'string' ? q.userName : '',
        productId,
        productName,
        question: String(q.question || ''),
        answer: text,
      })
      if (emailed) await ref.update({ answerEmailSentAt: new Date() })
    }

    return NextResponse.json({ success: true, emailed, hadEmail: !!to })
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
