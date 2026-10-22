/**
 * Ürün yorumları (Prisma StoreReview — Firebase servis hesabı gerekmez)
 * GET:  onaylı yorumlar + puan özeti
 * POST: yeni yorum; yalnızca bu ürünü satın alıp teslim almış üye (lib/reviews → reviewEligibility), ürün başına bir kez.
 *       Moderasyon onayından sonra yayınlanır.
 */

export const dynamic = 'force-dynamic'

import { NextRequest, NextResponse } from 'next/server'
import { isRateLimited, getClientIp } from '@/lib/rate-limit'
import { verifyTurnstile, TURNSTILE_ERROR } from '@/lib/turnstile'
import { prisma } from '@/lib/prisma'
import { reviewAuthorFromRequest, reviewEligibility } from '@/lib/reviews'

export async function GET(_request: NextRequest, props: { params: Promise<{ id: string }> }) {
  const { id } = await props.params
  try {
    const rows = await prisma.storeReview.findMany({
      where: { productId: id, status: 'approved' },
      orderBy: { createdAt: 'desc' },
      take: 100,
    })
    const reviews = rows.map((r) => ({
      id: r.id,
      userId: r.userId ?? '',
      userName: r.userName,
      rating: r.rating,
      title: r.title ?? '',
      comment: r.comment,
      verified: r.verifiedPurchase,
      reply: r.reply,
      createdAt: r.createdAt.toISOString(),
    }))
    const average = reviews.length ? reviews.reduce((s, r) => s + r.rating, 0) / reviews.length : 0
    return NextResponse.json({ reviews, averageRating: Math.round(average * 10) / 10, totalReviews: reviews.length })
  } catch (error) {
    console.error('Reviews GET error:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}

export async function POST(request: NextRequest, props: { params: Promise<{ id: string }> }) {
  const { id } = await props.params
  try {
    const body = await request.json().catch(() => ({}))
    const { rating, title, comment, guestName } = body
    if (!(await verifyTurnstile(body.turnstileToken, getClientIp(request)))) {
      return NextResponse.json({ success: false, error: TURNSTILE_ERROR }, { status: 400 })
    }
    if (isRateLimited(request, 'product-review', 5, 10 * 60_000)) {
      return NextResponse.json({ success: false, error: 'Çok fazla yorum gönderdiniz. Lütfen daha sonra tekrar deneyin.' }, { status: 429 })
    }
    if (typeof comment !== 'string' || !comment.trim()) {
      return NextResponse.json({ success: false, error: 'Yorum gereklidir' }, { status: 400 })
    }
    if (comment.trim().length > 3000) {
      return NextResponse.json({ success: false, error: 'Yorum en fazla 3000 karakter olabilir.' }, { status: 400 })
    }
    if (typeof title === 'string' && title.trim().length > 200) {
      return NextResponse.json({ success: false, error: 'Başlık en fazla 200 karakter olabilir.' }, { status: 400 })
    }
    const stars = parseInt(String(rating), 10)
    if (!(stars >= 1 && stars <= 5)) {
      return NextResponse.json({ success: false, error: 'Yıldız 1-5 arası olmalıdır' }, { status: 400 })
    }

    const author = await reviewAuthorFromRequest(request)
    const eligibility = await reviewEligibility(id, author)
    if (!author || eligibility.reason === 'login') {
      return NextResponse.json({ success: false, error: 'Değerlendirme yazmak için giriş yapın.' }, { status: 401 })
    }
    if (eligibility.reason === 'not_purchased') {
      return NextResponse.json({ success: false, error: 'Yalnızca bu ürünü satın alıp teslim alan müşterilerimiz değerlendirme yazabilir.' }, { status: 403 })
    }
    if (eligibility.reason === 'already_reviewed') {
      return NextResponse.json({ success: false, error: 'Bu ürün için değerlendirmenizi zaten gönderdiniz.' }, { status: 409 })
    }
    // Ad: oturumdaki ad, yoksa profildeki ad (istemci gönderir); e-posta yalnızca oturumdan
    const name = (author.name || (typeof guestName === 'string' ? guestName.trim() : '') || 'Müşteri').slice(0, 100)
    const email = (author.email ?? '').slice(0, 200).toLowerCase()
    const review = await prisma.storeReview.create({
      data: {
        productId: id,
        userId: author.userId,
        userName: name,
        userEmail: email,
        rating: stars,
        title: typeof title === 'string' && title.trim() ? title.trim() : null,
        comment: comment.trim(),
        status: 'pending',
        verifiedPurchase: true,
      },
    })
    return NextResponse.json({ success: true, id: review.id }, { status: 201 })
  } catch (error) {
    console.error('Review POST error:', error)
    return NextResponse.json({ success: false, error: 'Bir hata oluştu' }, { status: 500 })
  }
}
