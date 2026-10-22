'use client'

import { Turnstile } from '@/components/Turnstile'
import React, { useState, useEffect, useCallback } from 'react'
import Link from 'next/link'
import { usePathname } from 'next/navigation'
import { Star, Loader2, Send } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Textarea } from '@/components/ui/textarea'
import { Input } from '@/components/ui/input'
import { useAuthStore, getAuthToken } from '@/lib/store/useAuthStore'
import { useL } from '@/lib/i18n-inline'
import { useServerError } from '@/lib/server-error-i18n'

type Review = {
  id: string
  userId: string
  userName: string
  rating: number
  title: string
  comment: string
  /** Bu ürünü içeren teslim edilmiş siparişi olan yorumcu */
  verified?: boolean
  /** Mağaza yanıtı */
  reply?: string | null
  createdAt: string
}

function StarRow({
  rating,
  size = 'sm',
}: {
  rating: number
  size?: 'sm' | 'lg'
}) {
  const cls = size === 'lg' ? 'w-5 h-5' : 'w-4 h-4'
  return (
    <div className="flex items-center gap-0.5">
      {[1, 2, 3, 4, 5].map((s) => (
        <Star
          key={s}
          className={`${cls} ${s <= Math.round(rating) ? 'fill-amber-400 text-amber-400' : 'text-slate-200'}`}
        />
      ))}
    </div>
  )
}

export function ProductReviews({ productId }: { productId: string }) {
  const { user, isAuthenticated } = useAuthStore()
  const L = useL()
  const tErr = useServerError()
  const [turnstileToken, setTurnstileToken] = useState<string | null>(null)
  const [turnstileReset, setTurnstileReset] = useState(0)
  const [reviews, setReviews] = useState<Review[]>([])
  const [loading, setLoading] = useState(true)
  const [rating, setRating] = useState(5)
  const [hoverRating, setHoverRating] = useState(0)
  const [title, setTitle] = useState('')
  const [comment, setComment] = useState('')
  const [submitting, setSubmitting] = useState(false)
  const pathname = usePathname()
  /** Değerlendirme yalnızca bu ürünü satın alıp teslim almış üyeye açık (sunucu da aynı kuralı uygular) */
  const [eligibility, setEligibility] = useState<{ canReview: boolean; reason: string } | null>(null)
  const [submitted, setSubmitted] = useState(false)
  const [error, setError] = useState('')

  const loadReviews = useCallback(async () => {
    try {
      const res = await fetch(`/api/products/${productId}/reviews`)
      if (res.ok) {
        const data = await res.json()
        setReviews(data.reviews || [])
      }
    } catch {
      // silent
    } finally {
      setLoading(false)
    }
  }, [productId])

  useEffect(() => {
    loadReviews()
  }, [loadReviews])

  useEffect(() => {
    if (!isAuthenticated) {
      setEligibility({ canReview: false, reason: 'login' })
      return
    }
    let cancelled = false
    ;(async () => {
      try {
        const token = await getAuthToken()
        const res = await fetch(`/api/products/${productId}/reviews/eligibility`, {
          headers: token ? { Authorization: `Bearer ${token}` } : {},
          cache: 'no-store',
        })
        const data = await res.json().catch(() => null)
        if (!cancelled) setEligibility(data && typeof data.canReview === 'boolean' ? data : { canReview: false, reason: 'login' })
      } catch {
        if (!cancelled) setEligibility({ canReview: false, reason: 'login' })
      }
    })()
    return () => {
      cancelled = true
    }
  }, [isAuthenticated, productId])

  const avgRating =
    reviews.length > 0 ? reviews.reduce((sum, r) => sum + r.rating, 0) / reviews.length : 0

  const ratingCounts = [5, 4, 3, 2, 1].map((s) => ({
    star: s,
    count: reviews.filter((r) => Math.round(r.rating) === s).length,
  }))

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!comment.trim()) {
      setError(L('Lütfen bir yorum yazın.', 'Please write a review.'))
      return
    }
    setSubmitting(true)
    setError('')
    try {
      const headers: Record<string, string> = { 'Content-Type': 'application/json' }
      const token = await getAuthToken()
      if (token) headers['Authorization'] = `Bearer ${token}`

      const res = await fetch(`/api/products/${productId}/reviews`, {
        method: 'POST',
        headers,
        body: JSON.stringify({
          rating,
          title: title.trim() || undefined,
          comment: comment.trim(),
          // Oturumda ad yoksa profildeki ad kullanılır
          guestName: user?.name || undefined,
          turnstileToken,
        }),
      })
      setTurnstileReset((n) => n + 1)

      const data = await res.json()
      if (!res.ok) {
        setError(tErr(data.error) || L('Yorum gönderilemedi. Lütfen tekrar deneyin.', 'Your review could not be submitted. Please try again.'))
        return
      }

      setSubmitted(true)
      setComment('')
      setTitle('')
      setRating(5)
      setEligibility({ canReview: false, reason: 'already_reviewed' })
      setLoading(true)
      await loadReviews()
    } catch {
      setError(L('Yorum gönderilemedi. Lütfen tekrar deneyin.', 'Your review could not be submitted. Please try again.'))
    } finally {
      setSubmitting(false)
    }
  }

  const ReviewForm = (
    <>
      {submitted ? (
        <div className="text-center py-2">
          <p className="text-sm font-semibold text-green-700">
            {L('Değerlendirmeniz alındı, onaylandıktan sonra yayımlanacak. Teşekkürler!', 'Your review has been received and will be published after approval. Thank you!')}
          </p>
        </div>
      ) : (
        <>
          <h3 className="font-semibold text-slate-900 mb-4 text-sm">{L('Değerlendirme Yaz', 'Write a Review')}</h3>
          <form onSubmit={handleSubmit} className="space-y-3">
            {/* Yıldız seçici */}
            <div className="flex items-center gap-1" role="radiogroup" aria-label={L('Puanınız', 'Your rating')}>
              {[1, 2, 3, 4, 5].map((s) => (
                <button
                  key={s}
                  type="button"
                  role="radio"
                  aria-checked={rating === s}
                  aria-label={L(`${s} yıldız`, `${s} star${s > 1 ? 's' : ''}`)}
                  onMouseEnter={() => setHoverRating(s)}
                  onMouseLeave={() => setHoverRating(0)}
                  onClick={() => setRating(s)}
                  className="transition-transform hover:scale-110 focus:outline-none"
                >
                  <Star
                    className={`w-8 h-8 transition-colors ${
                      s <= (hoverRating || rating)
                        ? 'fill-amber-400 text-amber-400'
                        : 'text-slate-200 hover:text-amber-300'
                    }`}
                  />
                </button>
              ))}
              <span className="ml-2 text-sm text-slate-500">
                {[
                  '',
                  L('Berbat', 'Terrible'),
                  L('Kötü', 'Poor'),
                  L('Orta', 'Average'),
                  L('İyi', 'Good'),
                  L('Mükemmel', 'Excellent'),
                ][hoverRating || rating]}
              </span>
            </div>

            {user?.name && (
              <p className="text-xs text-slate-500">
                {L('Değerlendirme ', 'Review will be submitted as ')}<span className="font-medium text-slate-700">{user.name}</span>{L(' olarak gönderilecek.', '.')}
              </p>
            )}

            <Input
              placeholder={L('Başlık (opsiyonel)', 'Title (optional)')}
              aria-label={L('Değerlendirme başlığı', 'Review title')}
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              className="rounded-xl border-slate-200 text-sm"
            />
            <Textarea
              placeholder={L('Ürün hakkında deneyiminizi paylaşın...', 'Share your experience with this product...')}
              aria-label={L('Değerlendirmeniz', 'Your review')}
              value={comment}
              onChange={(e) => setComment(e.target.value)}
              rows={3}
              className="rounded-xl border-slate-200 text-sm resize-none"
              required
            />
            {error && <p className="text-xs text-red-500">{error}</p>}
            <Turnstile onToken={setTurnstileToken} resetKey={turnstileReset} />
            <Button
              type="submit"
              disabled={submitting}
              size="sm"
              className="rounded-xl"
            >
              <Send className="w-3.5 h-3.5 mr-1.5" />
              {submitting ? L('Gönderiliyor...', 'Submitting...') : L('Değerlendirmeyi Gönder', 'Submit Review')}
            </Button>
          </form>
        </>
      )}
    </>
  )

  return (
    <div id="degerlendirmeler" className="mt-10 pt-8 border-t border-slate-200 scroll-mt-28">
      <h2 className="text-lg font-bold text-slate-900 mb-6 flex items-center gap-2">
        {L('Değerlendirmeler', 'Reviews')}
        {reviews.length > 0 && (
          <span className="text-sm font-normal text-slate-500">({reviews.length})</span>
        )}
      </h2>

      {/* Özet */}
      {reviews.length > 0 && (
        <div className="flex flex-col sm:flex-row gap-6 mb-8 bg-slate-50 rounded-2xl border border-slate-200 p-5">
          <div className="flex items-center gap-4">
            <span className="text-5xl font-bold text-slate-900">{avgRating.toFixed(1)}</span>
            <div>
              <StarRow rating={avgRating} size="lg" />
              <p className="text-sm text-slate-500 mt-1">{L(`${reviews.length} değerlendirme`, `${reviews.length} ${reviews.length === 1 ? 'review' : 'reviews'}`)}</p>
            </div>
          </div>
          <div className="flex-1 space-y-1.5">
            {ratingCounts.map(({ star, count }) => (
              <div key={star} className="flex items-center gap-2">
                <span className="text-xs text-slate-500 w-4 text-right">{star}</span>
                <Star className="w-3.5 h-3.5 fill-amber-400 text-amber-400 shrink-0" />
                <div className="flex-1 h-2 bg-slate-200 rounded-full overflow-hidden">
                  <div
                    className="h-full bg-amber-400 rounded-full transition-all"
                    style={{ width: reviews.length ? `${(count / reviews.length) * 100}%` : '0%' }}
                  />
                </div>
                <span className="text-xs text-slate-400 w-4">{count}</span>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Liste */}
      {loading ? (
        <div className="flex justify-center py-10">
          <Loader2 className="w-7 h-7 animate-spin text-slate-400" />
        </div>
      ) : reviews.length === 0 ? (
        <div className="text-center py-10 text-slate-400">
          <p className="text-sm">{L('Henüz değerlendirme yok. İlk değerlendirmeyi siz yapın!', 'No reviews yet. Be the first to review!')}</p>
        </div>
      ) : (
        <div className="space-y-3 mb-8">
          {reviews.map((r) => (
            <div key={r.id} className="bg-white rounded-xl border border-slate-200 p-4">
              <div className="flex items-start justify-between gap-3 mb-2">
                <div className="flex items-center gap-2.5">
                  <span aria-hidden className="w-8 h-8 rounded-full bg-slate-100 text-slate-600 flex items-center justify-center shrink-0 text-sm font-semibold">
                    {r.userName.trim().charAt(0).toLocaleUpperCase('tr') || '?'}
                  </span>
                  <div>
                    <p className="text-sm font-semibold text-slate-900">
                      {r.userName}
                      {r.verified && <span className="ml-2 align-middle rounded-full bg-emerald-50 px-2 py-0.5 text-[11px] font-semibold text-emerald-700 ring-1 ring-inset ring-emerald-200">{L('Doğrulanmış alıcı', 'Verified buyer')}</span>}
                    </p>
                    <p className="text-xs text-slate-400">
                      {r.createdAt ? new Date(r.createdAt).toLocaleDateString(L('tr-TR', 'en-US')) : ''}
                    </p>
                  </div>
                </div>
                <StarRow rating={r.rating} />
              </div>
              {r.title && (
                <p className="text-sm font-semibold text-slate-800 mb-1">{r.title}</p>
              )}
              <p className="text-sm text-slate-600 leading-relaxed">{r.comment}</p>
              {r.reply && (
                <div className="mt-3 rounded-lg bg-slate-50 border-l-2 border-slate-300 px-3 py-2">
                  <p className="text-xs font-semibold text-slate-700">{L('Voltekno yanıtı', 'Reply from Voltekno')}</p>
                  <p className="mt-0.5 text-sm text-slate-600 leading-relaxed">{r.reply}</p>
                </div>
              )}
            </div>
          ))}
        </div>
      )}

      {/* Form yalnızca ürünü satın alıp teslim almış üyeye; diğerlerine kısa bilgi */}
      {(submitted || eligibility?.canReview) ? (
        <div className="bg-slate-50 rounded-2xl border border-slate-200 p-5">
          {ReviewForm}
        </div>
      ) : eligibility ? (
        <p className="rounded-xl border border-slate-200 bg-slate-50 px-4 py-3 text-sm text-slate-600">
          {eligibility.reason === 'already_reviewed'
            ? L('Bu ürün için değerlendirmenizi gönderdiniz. Teşekkürler!', 'You have already reviewed this product. Thank you!')
            : eligibility.reason === 'not_purchased'
              ? L('Bu ürünü satın alıp teslim aldıktan sonra değerlendirme yazabilirsiniz.', 'You can write a review after you purchase and receive this product.')
              : (
                <>
                  {L('Değerlendirmeleri yalnızca bu ürünü satın alan müşterilerimiz yazabilir.', 'Only customers who purchased this product can write a review.')}{' '}
                  <Link href={`/login?redirect=${encodeURIComponent(`${pathname}#degerlendirmeler`)}`} className="font-semibold text-brand hover:underline">
                    {L('Giriş yapın', 'Sign in')}
                  </Link>
                </>
              )}
        </p>
      ) : null}
    </div>
  )
}
