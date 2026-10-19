export const dynamic = 'force-dynamic'

/**
 * Yönetim: ürün soruları (Prisma StoreQuestion)
 * GET    — son 500 soru
 * PATCH  — { id, answer, notify? } yanıtla (soran kişiye e-posta) · { id, status: 'hidden' | 'answered' } gizle/göster
 * DELETE — ?id=
 */

import { NextRequest, NextResponse } from 'next/server'
import { checkAdmin } from '@/lib/adminAuth'
import { sendQuestionAnsweredEmail } from '@/lib/notifications'
import { getMergedProductById } from '@/lib/catalog-merge'
import { prisma } from '@/lib/prisma'
import { EMAIL_RE } from '@/lib/reviews'

export async function GET(request: NextRequest) {
  const auth = await checkAdmin(request)
  if ('error' in auth) return NextResponse.json({ error: auth.error }, { status: auth.status })
  try {
    const rows = await prisma.storeQuestion.findMany({ orderBy: { createdAt: 'desc' }, take: 500 })
    return NextResponse.json({
      questions: rows.map((q) => ({
        id: q.id,
        productId: q.productId,
        productName: q.productName ?? '',
        userName: q.userName,
        userEmail: q.userEmail,
        question: q.question,
        answer: q.answer,
        status: q.status,
        answerEmailSentAt: q.answerEmailSentAt?.toISOString() ?? null,
        createdAt: q.createdAt.toISOString(),
      })),
    })
  } catch (error) {
    console.error('Admin questions GET error:', error)
    return NextResponse.json({ error: 'Liste alınamadı' }, { status: 500 })
  }
}

export async function PATCH(request: NextRequest) {
  const auth = await checkAdmin(request)
  if ('error' in auth) return NextResponse.json({ error: auth.error }, { status: auth.status })
  try {
    const body = await request.json().catch(() => ({}))
    const { id, answer, notify, status } = body as { id?: string; answer?: unknown; notify?: boolean; status?: string }
    if (!id || typeof id !== 'string') return NextResponse.json({ error: 'id gereklidir' }, { status: 400 })
    const q = await prisma.storeQuestion.findUnique({ where: { id } })
    if (!q) return NextResponse.json({ error: 'Soru bulunamadı' }, { status: 404 })

    // Yalnızca görünürlük değişikliği
    if (answer === undefined && (status === 'hidden' || status === 'answered')) {
      if (status === 'answered' && !q.answer) return NextResponse.json({ error: 'Yanıtsız soru yayınlanamaz' }, { status: 400 })
      await prisma.storeQuestion.update({ where: { id }, data: { status } })
      return NextResponse.json({ success: true })
    }

    if (typeof answer !== 'string' || !answer.trim()) return NextResponse.json({ error: 'Yanıt boş olamaz' }, { status: 400 })
    if (answer.length > 3000) return NextResponse.json({ error: 'Yanıt en fazla 3000 karakter olabilir' }, { status: 400 })
    const text = answer.trim()
    const changed = text !== (q.answer ?? '').trim()
    await prisma.storeQuestion.update({ where: { id }, data: { answer: text, answeredAt: new Date(), status: 'answered' } })

    // Soran kişiye e-posta: ilk yanıtta ve yanıt değiştiğinde (notify:false ile kapatılabilir)
    let emailed = false
    const to = q.userEmail.trim()
    if (notify !== false && changed && EMAIL_RE.test(to)) {
      const productName = q.productName || (await getMergedProductById(q.productId).catch(() => null))?.name || 'Ürün'
      emailed = await sendQuestionAnsweredEmail({
        to,
        customerName: q.userName,
        productId: q.productId,
        productName,
        question: q.question,
        answer: text,
      })
      if (emailed) await prisma.storeQuestion.update({ where: { id }, data: { answerEmailSentAt: new Date() } })
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
  try {
    const id = request.nextUrl.searchParams.get('id')
    if (!id) return NextResponse.json({ error: 'id gereklidir' }, { status: 400 })
    await prisma.storeQuestion.delete({ where: { id } })
    return NextResponse.json({ success: true })
  } catch (error) {
    console.error('Admin questions DELETE error:', error)
    return NextResponse.json({ error: 'Silme başarısız' }, { status: 500 })
  }
}
