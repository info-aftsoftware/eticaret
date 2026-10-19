export const dynamic = 'force-dynamic'

/**
 * Yönetim: ürün yorumları (Prisma StoreReview)
 * GET    — son 500 yorum
 * PATCH  — { id, status } moderasyon ve/veya { id, reply } mağaza yanıtı
 * DELETE — ?id=
 */

import { NextRequest, NextResponse } from 'next/server'
import { checkAdmin } from '@/lib/adminAuth'
import { prisma } from '@/lib/prisma'
import { revalidateStorefront } from '@/lib/storefront-revalidate'

export async function GET(request: NextRequest) {
  const auth = await checkAdmin(request)
  if ('error' in auth) return NextResponse.json({ error: auth.error }, { status: auth.status })
  try {
    const rows = await prisma.storeReview.findMany({ orderBy: { createdAt: 'desc' }, take: 500 })
    return NextResponse.json({
      reviews: rows.map((r) => ({
        id: r.id,
        productId: r.productId,
        userName: r.userName,
        userEmail: r.userEmail,
        rating: r.rating,
        title: r.title ?? '',
        comment: r.comment,
        status: r.status,
        verified: r.verifiedPurchase,
        reply: r.reply,
        createdAt: r.createdAt.toISOString(),
      })),
    })
  } catch (error) {
    console.error('Admin reviews GET error:', error)
    return NextResponse.json({ error: 'Liste alınamadı' }, { status: 500 })
  }
}

export async function PATCH(request: NextRequest) {
  const auth = await checkAdmin(request)
  if ('error' in auth) return NextResponse.json({ error: auth.error }, { status: auth.status })
  try {
    const body = await request.json().catch(() => ({}))
    const { id, status, reply } = body as { id?: string; status?: string; reply?: unknown }
    if (!id) return NextResponse.json({ error: 'id gereklidir' }, { status: 400 })
    const data: { status?: string; reply?: string | null; repliedAt?: Date | null } = {}
    if (status !== undefined) {
      if (!['pending', 'approved', 'rejected'].includes(status)) return NextResponse.json({ error: 'Geçersiz status' }, { status: 400 })
      data.status = status
    }
    if (reply !== undefined) {
      const text = typeof reply === 'string' ? reply.trim() : ''
      if (text.length > 2000) return NextResponse.json({ error: 'Yanıt en fazla 2000 karakter olabilir' }, { status: 400 })
      data.reply = text || null
      data.repliedAt = text ? new Date() : null
    }
    if (!Object.keys(data).length) return NextResponse.json({ error: 'status veya reply gereklidir' }, { status: 400 })
    await prisma.storeReview.update({ where: { id }, data })
    // Onaylanan yorum ürün sayfasının puan şemasını (aggregateRating) değiştirir
    revalidateStorefront()
    return NextResponse.json({ success: true })
  } catch (error) {
    console.error('Admin reviews PATCH error:', error)
    return NextResponse.json({ error: 'Güncelleme başarısız' }, { status: 500 })
  }
}

export async function DELETE(request: NextRequest) {
  const auth = await checkAdmin(request)
  if ('error' in auth) return NextResponse.json({ error: auth.error }, { status: auth.status })
  try {
    const id = request.nextUrl.searchParams.get('id')
    if (!id) return NextResponse.json({ error: 'id gereklidir' }, { status: 400 })
    await prisma.storeReview.delete({ where: { id } })
    revalidateStorefront()
    return NextResponse.json({ success: true })
  } catch (error) {
    console.error('Admin reviews DELETE error:', error)
    return NextResponse.json({ error: 'Silme başarısız' }, { status: 500 })
  }
}
