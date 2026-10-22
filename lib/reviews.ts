/**
 * Yorum ve soru-cevap yardımcıları (Prisma: StoreReview, StoreQuestion). Firebase servis hesabı gerekmez:
 * müşteri oturumu Google açık anahtarlarıyla doğrulanır (lib/firebase-id-token.ts).
 */
import type { NextRequest } from 'next/server'
import { prisma } from '@/lib/prisma'
import { verifyFirebaseIdToken } from '@/lib/firebase-id-token'

export type ReviewAuthor = { userId: string; name?: string; email?: string; emailVerified?: boolean }

/** Authorization: Bearer <Firebase ID token> → oturumdaki müşteri (yoksa misafir) */
export async function reviewAuthorFromRequest(request: NextRequest): Promise<ReviewAuthor | null> {
  const token = request.headers.get('authorization')?.replace(/^Bearer\s+/i, '')
  if (!token) return null
  const decoded = await verifyFirebaseIdToken(token).catch(() => null)
  return decoded ? { userId: decoded.uid, name: decoded.name, email: decoded.email, emailVerified: decoded.email_verified === true } : null
}

/**
 * Doğrulanmış alıcı: bu ürünü içeren, teslim edilmiş bir siparişi var mı (üye kimliği veya sipariş e-postası ile).
 * Sipariş satırında ürün kimliği variantMatrix.productId'de tutulur.
 */
export async function hasDeliveredPurchase(productId: string, who: { userId?: string | null; email?: string | null }): Promise<boolean> {
  const email = who.email?.trim().toLowerCase()
  const or = [
    ...(who.userId ? [{ userId: who.userId }] : []),
    ...(email ? [{ shippingEmail: email }, { user: { email } }] : []),
  ]
  if (!or.length) return false
  const orders = await prisma.order.findMany({
    where: { status: 'DELIVERED', OR: or },
    select: { lines: { select: { variantMatrix: true } } },
    take: 50,
  })
  return orders.some((o) => o.lines.some((l) => (l.variantMatrix as { productId?: string } | null)?.productId === productId))
}

export type ReviewEligibility = { canReview: boolean; reason: 'ok' | 'login' | 'not_purchased' | 'already_reviewed' }

/**
 * Değerlendirme yalnızca bu ürünü satın alıp teslim almış üyeye açıktır (ürün başına bir değerlendirme).
 * Sipariş üye kimliğiyle ya da doğrulanmış hesap e-postasıyla eşleşir (üye olmadan verilen sipariş, aynı e-postayla açılan hesapta sayılır).
 */
export async function reviewEligibility(productId: string, author: ReviewAuthor | null): Promise<ReviewEligibility> {
  if (!author) return { canReview: false, reason: 'login' }
  const email = author.emailVerified ? author.email : undefined
  const bought = await hasDeliveredPurchase(productId, { userId: author.userId, email }).catch(() => false)
  if (!bought) return { canReview: false, reason: 'not_purchased' }
  const existing = await prisma.storeReview.count({ where: { productId, userId: author.userId, status: { not: 'rejected' } } })
  if (existing > 0) return { canReview: false, reason: 'already_reviewed' }
  return { canReview: true, reason: 'ok' }
}

/** Onaylı yorumların puan özeti (ürün sayfası ve JSON-LD aggregateRating için) */
export async function reviewSummary(productId: string): Promise<{ average: number; count: number }> {
  const agg = await prisma.storeReview.aggregate({
    where: { productId, status: 'approved' },
    _avg: { rating: true },
    _count: { _all: true },
  })
  return { average: Math.round((agg._avg.rating ?? 0) * 10) / 10, count: agg._count._all }
}

export const EMAIL_RE = /^[^\s@]+@[^\s@]+\.[^\s@]+$/
