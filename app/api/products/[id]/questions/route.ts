/**
 * Ürün soruları (Prisma StoreQuestion — Firebase servis hesabı gerekmez)
 * GET:  yanıtlanmış ve gizlenmemiş sorular
 * POST: yeni soru (misafir veya üye); mağaza yanıtlayınca yayınlanır ve soran kişiye e-posta gider.
 */

export const dynamic = 'force-dynamic'

import { NextRequest, NextResponse } from 'next/server'
import { isRateLimited, getClientIp } from '@/lib/rate-limit'
import { verifyTurnstile, TURNSTILE_ERROR } from '@/lib/turnstile'
import { prisma } from '@/lib/prisma'
import { EMAIL_RE, reviewAuthorFromRequest } from '@/lib/reviews'
import { toCatalogLocale } from '@/lib/catalog-en'

export async function GET(_request: NextRequest, props: { params: Promise<{ id: string }> }) {
  const { id } = await props.params
  try {
    const rows = await prisma.storeQuestion.findMany({
      where: { productId: id, status: 'answered', answer: { not: null } },
      orderBy: { createdAt: 'desc' },
      take: 100,
    })
    return NextResponse.json({
      questions: rows.map((q) => ({
        id: q.id,
        question: q.question,
        answer: q.answer,
        userName: q.userName,
        createdAt: q.createdAt.toISOString(),
      })),
    })
  } catch (error) {
    console.error('Questions GET error:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}

export async function POST(request: NextRequest, props: { params: Promise<{ id: string }> }) {
  const { id } = await props.params
  try {
    if (isRateLimited(request, 'product-question', 5, 10 * 60_000)) {
      return NextResponse.json({ error: 'Çok fazla soru gönderdiniz. Lütfen daha sonra tekrar deneyin.' }, { status: 429 })
    }
    const body = await request.json().catch(() => ({}))
    const { question, productName, guestName, guestEmail } = body
    if (!(await verifyTurnstile(body.turnstileToken, getClientIp(request)))) {
      return NextResponse.json({ error: TURNSTILE_ERROR }, { status: 400 })
    }
    if (typeof question !== 'string' || !question.trim()) return NextResponse.json({ error: 'Soru gereklidir' }, { status: 400 })
    if (question.trim().length > 1000) return NextResponse.json({ error: 'Soru en fazla 1000 karakter olabilir.' }, { status: 400 })

    const author = await reviewAuthorFromRequest(request)
    const name = (author?.name || (typeof guestName === 'string' ? guestName.trim() : '')).slice(0, 100)
    const email = (author?.email || (typeof guestEmail === 'string' ? guestEmail.trim() : '')).slice(0, 200).toLowerCase()
    if (!name || !email) return NextResponse.json({ error: 'Ad ve e-posta gereklidir' }, { status: 400 })
    if (!EMAIL_RE.test(email)) return NextResponse.json({ error: 'Geçerli bir e-posta adresi girin.' }, { status: 400 })

    const q = await prisma.storeQuestion.create({
      data: {
        productId: id,
        productName: typeof productName === 'string' ? productName.slice(0, 300) : null,
        userId: author?.userId ?? null,
        userName: name,
        userEmail: email,
        question: question.trim(),
        status: 'pending',
        // Yanıt e-postasının dili: sorunun sorulduğu site dili
        locale: toCatalogLocale(request.cookies.get('NEXT_LOCALE')?.value),
      },
    })
    return NextResponse.json({ id: q.id }, { status: 201 })
  } catch (error) {
    console.error('Question POST error:', error)
    return NextResponse.json({ error: 'Bir hata oluştu' }, { status: 500 })
  }
}
