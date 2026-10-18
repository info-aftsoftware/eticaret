'use client'

import { Turnstile } from '@/components/Turnstile'
import React, { useState, useEffect, useCallback } from 'react'
import { Star, Loader2, MessageSquare, User, Send } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Textarea } from '@/components/ui/textarea'
import { Input } from '@/components/ui/input'
import { useAuthStore, getAuthToken } from '@/lib/store/useAuthStore'
import { useL } from '@/lib/i18n-inline'

type Review = {
  id: string
  userId: string
  userName: string
  rating: number
  title: string
  comment: string
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
  const [turnstileToken, setTurnstileToken] = useState<string | null>(null)
  const [turnstileReset, setTurnstileReset] = useState(0)
  const [reviews, setReviews] = useState<Review[]>([])
  const [loading, setLoading] = useState(true)
  const [rating, setRating] = useState(5)
  const [hoverRating, setHoverRating] = useState(0)
  const [title, setTitle] = useState('')
  const [comment, setComment] = useState('')
  const [guestName, setGuestName] = useState('')
  const [guestEmail, setGuestEmail] = useState('')
  const [submitting, setSubmitting] = useState(false)
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
    if (!isAuthenticated && (!guestName.trim() || !guestEmail.trim())) {
      setError(L('Ad ve e-posta zorunludur.', 'Name and email are required.'))
      return
    }
    setSubmitting(true)
    setError('')
    try {
      const headers: Record<string, string> = { 'Content-Type': 'application/json' }
      const token = isAuthenticated ? await getAuthToken() : null
      if (token) headers['Authorization'] = `Bearer ${token}`

      const res = await fetch(`/api/products/${productId}/reviews`, {
        method: 'POST',
        headers,
        body: JSON.stringify({
          rating,
          title: title.trim() || undefined,
          comment: comment.trim(),
          // Guests provide their own; logged-in users send profile as fallback
          guestName: isAuthenticated ? user?.name : guestName.trim() || undefined,
          guestEmail: isAuthenticated ? user?.email : guestEmail.trim() || undefined,
          turnstileToken,
        }),
      })
      setTurnstileReset((n) => n + 1)

      const data = await res.json()
      if (!res.ok) {
        setError(data.error || L('Yorum gönderilemedi. Lütfen tekrar deneyin.', 'Your review could not be submitted. Please try again.'))
        return
      }

      setSubmitted(true)
      setComment('')
      setTitle('')
      setRating(5)
      setGuestName('')
      setGuestEmail('')
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
            {L('✓ Değerlendirmeniz alındı, onaylandıktan sonra yayımlanacak. Teşekkürler!', '✓ Your review has been received and will be published after approval. Thank you!')}
          </p>
          <button
            onClick={() => setSubmitted(false)}
            className="text-xs text-brand hover:underline mt-1"
          >
            {L('Tekrar değerlendir', 'Write another review')}
          </button>
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

            {/* Guest name/email - only shown when not logged in */}
            {!isAuthenticated && (
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <Input
                  placeholder={L('Adınız *', 'Your name *')}
                  aria-label={L('Adınız', 'Your name')}
                  value={guestName}
                  onChange={(e) => setGuestName(e.target.value)}
                  className="rounded-xl border-slate-200 text-sm"
                  required
                />
                <Input
                  type="email"
                  placeholder={L('E-posta *', 'Email *')}
                  aria-label={L('E-posta adresiniz', 'Your email address')}
                  value={guestEmail}
                  onChange={(e) => setGuestEmail(e.target.value)}
                  className="rounded-xl border-slate-200 text-sm"
                  required
                />
              </div>
            )}

            {isAuthenticated && user?.name && (
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
    <div className="mt-10 pt-8 border-t border-slate-200">
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
          <MessageSquare className="w-10 h-10 mx-auto mb-2 text-slate-200" />
          <p className="text-sm">{L('Henüz değerlendirme yok. İlk değerlendirmeyi siz yapın!', 'No reviews yet. Be the first to review!')}</p>
        </div>
      ) : (
        <div className="space-y-3 mb-8">
          {reviews.map((r) => (
            <div key={r.id} className="bg-white rounded-xl border border-slate-200 p-4">
              <div className="flex items-start justify-between gap-3 mb-2">
                <div className="flex items-center gap-2.5">
                  <div className="w-8 h-8 rounded-full bg-brand/10 flex items-center justify-center shrink-0">
                    <User className="w-4 h-4 text-brand" />
                  </div>
                  <div>
                    <p className="text-sm font-semibold text-slate-900">{r.userName}</p>
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
            </div>
          ))}
        </div>
      )}

      {/* Form — always visible, guest or logged-in */}
      <div className="bg-slate-50 rounded-2xl border border-slate-200 p-5">
        {ReviewForm}
      </div>
    </div>
  )
}
