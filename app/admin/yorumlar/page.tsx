'use client'

import React, { useState, useEffect, useCallback } from 'react'
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Badge } from '@/components/ui/badge'
import {
  Star,
  Search,
  Loader2,
  RefreshCw,
  CheckCircle,
  Trash2,
  ChevronDown,
  ChevronUp,
  User,
} from 'lucide-react'
import { useToast } from '@/components/admin/toast'
import { useAdminLive } from '@/components/admin/AdminLiveProvider'

type Review = {
  id: string
  productId: string
  userName: string
  userEmail: string
  rating: number
  title: string
  comment: string
  status: 'pending' | 'approved' | 'rejected'
  /** Bu ürünü içeren teslim edilmiş siparişi var */
  verified?: boolean
  /** Mağaza yanıtı (sitede yorumun altında görünür) */
  reply?: string | null
  createdAt: string
}

/** Yorumun altına mağaza yanıtı (boş bırakılıp kaydedilirse yanıt kaldırılır) */
function ReplyBox({ review, onSaved }: { review: Review; onSaved: (reply: string | null) => void }) {
  const toast = useToast()
  const [text, setText] = useState(review.reply ?? '')
  const [saving, setSaving] = useState(false)
  const save = async () => {
    setSaving(true)
    try {
      const res = await fetch('/api/admin/reviews', {
        method: 'PATCH',
        credentials: 'include',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ id: review.id, reply: text }),
      })
      if (!res.ok) throw new Error()
      onSaved(text.trim() || null)
      toast.success(text.trim() ? 'Yanıt kaydedildi' : 'Yanıt kaldırıldı')
    } catch {
      toast.error('Yanıt kaydedilemedi')
    } finally {
      setSaving(false)
    }
  }
  return (
    <div className="mb-4">
      <label htmlFor={`reply-${review.id}`} className="block text-xs font-semibold text-slate-500 uppercase tracking-wide mb-1">
        Mağaza yanıtı (sitede görünür)
      </label>
      <textarea
        id={`reply-${review.id}`}
        value={text}
        onChange={(e) => setText(e.target.value)}
        rows={2}
        maxLength={2000}
        className="w-full rounded-lg border border-slate-200 bg-white p-2.5 text-sm text-slate-700 outline-none focus:border-[#0b2540]"
        placeholder="Teşekkür, çözüm veya bilgi notu"
      />
      <Button size="sm" variant="outline" disabled={saving || text.trim() === (review.reply ?? '')} onClick={save} className="mt-1.5 rounded-lg h-8 text-xs">
        {saving && <Loader2 className="w-3.5 h-3.5 animate-spin mr-1" />}Yanıtı kaydet
      </Button>
    </div>
  )
}

function StarDisplay({ rating }: { rating: number }) {
  return (
    <div className="flex items-center gap-0.5">
      {[1, 2, 3, 4, 5].map((s) => (
        <Star
          key={s}
          className={`w-3.5 h-3.5 ${
            s <= Math.round(rating) ? 'fill-amber-400 text-amber-400' : 'text-slate-200'
          }`}
        />
      ))}
    </div>
  )
}

function StatusBadge({ status }: { status: Review['status'] }) {
  if (status === 'approved') {
    return <Badge className="bg-green-100 text-green-700 border-0 text-xs">Onaylı</Badge>
  }
  if (status === 'rejected') {
    return <Badge className="bg-red-100 text-red-700 border-0 text-xs">Reddedildi</Badge>
  }
  return <Badge className="bg-amber-100 text-amber-700 border-0 text-xs">Bekliyor</Badge>
}

export default function AdminYorumlarPage() {
  const toast = useToast()
  const { refresh: refreshLive } = useAdminLive()
  const [reviews, setReviews] = useState<Review[]>([])
  const [loading, setLoading] = useState(true)
  const [refreshing, setRefreshing] = useState(false)
  const [searchQuery, setSearchQuery] = useState('')
  const [expandedId, setExpandedId] = useState<string | null>(null)
  const [actionLoading, setActionLoading] = useState<string | null>(null)

  const fetchReviews = useCallback(async (silent = false) => {
    if (!silent) setLoading(true)
    else setRefreshing(true)
    try {
      const res = await fetch('/api/admin/reviews', { credentials: 'include' })
      if (res.ok) {
        const data = await res.json()
        setReviews(data.reviews || [])
      }
    } catch (err) {
      console.error('Reviews load error:', err)
    } finally {
      setLoading(false)
      setRefreshing(false)
    }
  }, [])

  useEffect(() => {
    fetchReviews()
  }, [fetchReviews])

  const handleApprove = async (review: Review) => {
    const newStatus = review.status === 'approved' ? 'pending' : 'approved'
    setActionLoading(review.id)
    try {
      const res = await fetch('/api/admin/reviews', {
        method: 'PATCH',
        credentials: 'include',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ id: review.id, status: newStatus }),
      })
      if (!res.ok) toast.error('Yorum güncellenemedi')
      if (res.ok) {
        toast.success(newStatus === 'approved' ? 'Yorum onaylandı ve yayında' : 'Yorum yayından kaldırıldı')
        refreshLive()
        setReviews((prev) =>
          prev.map((r) => (r.id === review.id ? { ...r, status: newStatus } : r))
        )
      }
    } catch (err) {
      console.error('Approve error:', err)
    } finally {
      setActionLoading(null)
    }
  }

  const handleDelete = async (id: string) => {
    if (!confirm('Bu yorumu silmek istediğinize emin misiniz?')) return
    setActionLoading(id)
    try {
      const res = await fetch(`/api/admin/reviews?id=${id}`, {
        method: 'DELETE',
        credentials: 'include',
      })
      if (!res.ok) toast.error('Yorum silinemedi')
      if (res.ok) {
        refreshLive()
        setReviews((prev) => prev.filter((r) => r.id !== id))
        if (expandedId === id) setExpandedId(null)
      }
    } catch (err) {
      console.error('Delete error:', err)
    } finally {
      setActionLoading(null)
    }
  }

  const filtered = reviews.filter((r) => {
    const q = searchQuery.toLowerCase()
    return (
      !q ||
      r.userName.toLowerCase().includes(q) ||
      r.userEmail.toLowerCase().includes(q) ||
      r.productId.toLowerCase().includes(q) ||
      r.comment.toLowerCase().includes(q) ||
      r.title.toLowerCase().includes(q)
    )
  })

  const pendingCount = reviews.filter((r) => r.status === 'pending').length

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-slate-900">Yorumlar</h1>
          <p className="text-slate-600 mt-1">
            {loading
              ? 'Yükleniyor...'
              : `${reviews.length} yorum${pendingCount > 0 ? ` · ${pendingCount} bekliyor` : ''}`}
          </p>
        </div>
        <Button
          variant="outline"
          size="sm"
          onClick={() => fetchReviews(true)}
          disabled={refreshing || loading}
          className="w-fit"
        >
          <RefreshCw className={`w-4 h-4 mr-2 ${refreshing ? 'animate-spin' : ''}`} />
          Yenile
        </Button>
      </div>

      <Card className="border-slate-200/80 bg-white shadow-sm">
        <CardHeader className="border-b border-slate-200/80 pb-4">
          <CardTitle className="text-lg font-semibold flex items-center gap-2">
            <Star className="w-5 h-5 text-amber-400 fill-amber-400" />
            Ürün Değerlendirmeleri
          </CardTitle>
          <CardDescription>{filtered.length} yorum görüntüleniyor</CardDescription>
          <div className="relative pt-2">
            <Search className="absolute left-3 top-1/2 translate-y-[-30%] text-slate-400 w-4 h-4 pointer-events-none" />
            <Input
              placeholder="Kullanıcı, ürün veya yorum ara..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="pl-10 border-slate-200 text-sm"
            />
          </div>
        </CardHeader>

        <CardContent className="p-0">
          {loading ? (
            <div className="flex items-center justify-center py-20">
              <Loader2 className="w-10 h-10 animate-spin text-brand" />
            </div>
          ) : filtered.length === 0 ? (
            <div className="text-center py-16 text-slate-500">
              <Star className="w-14 h-14 mx-auto mb-3 text-slate-200" />
              <p className="font-medium">
                {searchQuery ? 'Yorum bulunamadı.' : 'Henüz yorum yok.'}
              </p>
            </div>
          ) : (
            <div className="divide-y divide-slate-100">
              {filtered.map((review) => {
                const isExpanded = expandedId === review.id
                const isActioning = actionLoading === review.id
                return (
                  <div key={review.id} className="hover:bg-slate-50/60 transition-colors">
                    {/* Header row */}
                    <button
                      className="w-full text-left px-4 py-3"
                      onClick={() => setExpandedId(isExpanded ? null : review.id)}
                    >
                      <div className="flex items-start justify-between gap-3">
                        <div className="flex-1 min-w-0">
                          <div className="flex items-center gap-2 flex-wrap">
                            <div className="flex items-center gap-1.5">
                              <User className="w-3.5 h-3.5 text-slate-400" />
                              <span className="font-semibold text-slate-900 text-sm">
                                {review.userName}
                              </span>
                            </div>
                            <StarDisplay rating={review.rating} />
                            <StatusBadge status={review.status} />
                          </div>
                          <p className="text-xs text-slate-500 mt-0.5">
                            Ürün: <span className="font-mono">{review.productId}</span>
                          </p>
                          <p className="text-xs text-slate-400 mt-0.5 truncate">{review.comment}</p>
                        </div>
                        <div className="flex items-center gap-2 shrink-0">
                          <span className="text-xs text-slate-400 whitespace-nowrap">
                            {review.createdAt
                              ? new Date(review.createdAt).toLocaleString('tr-TR', {
                                  day: '2-digit',
                                  month: 'short',
                                  year: 'numeric',
                                })
                              : '—'}
                          </span>
                          {isExpanded ? (
                            <ChevronUp className="w-4 h-4 text-slate-400" />
                          ) : (
                            <ChevronDown className="w-4 h-4 text-slate-400" />
                          )}
                        </div>
                      </div>
                    </button>

                    {/* Expanded */}
                    {isExpanded && (
                      <div className="px-4 pb-4 bg-slate-50/80 border-t border-slate-100">
                        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 pt-3 mb-3">
                          <div>
                            <p className="text-xs font-semibold text-slate-500 uppercase tracking-wide mb-1">
                              Kullanıcı
                            </p>
                            <p className="text-sm font-medium text-slate-900">{review.userName}</p>
                            {review.userEmail && (
                              <p className="text-xs text-slate-500 mt-0.5">{review.userEmail}</p>
                            )}
                          </div>
                          <div>
                            <p className="text-xs font-semibold text-slate-500 uppercase tracking-wide mb-1">
                              Ürün ID
                            </p>
                            <p className="text-sm font-mono text-slate-700">{review.productId}</p>
                          </div>
                        </div>

                        {review.title && (
                          <div className="mb-2">
                            <p className="text-xs font-semibold text-slate-500 uppercase tracking-wide mb-1">
                              Başlık
                            </p>
                            <p className="text-sm font-semibold text-slate-800">{review.title}</p>
                          </div>
                        )}

                        {review.verified && (
                          <p className="mb-2 inline-flex rounded-full bg-emerald-50 px-2 py-0.5 text-[11px] font-semibold text-emerald-700 ring-1 ring-inset ring-emerald-200">
                            Doğrulanmış alıcı (teslim edilmiş siparişi var)
                          </p>
                        )}
                        <div className="mb-4">
                          <p className="text-xs font-semibold text-slate-500 uppercase tracking-wide mb-1">
                            Yorum
                          </p>
                          <div className="bg-white rounded-lg border border-slate-200 p-3">
                            <p className="text-sm text-slate-700 whitespace-pre-wrap leading-relaxed">
                              {review.comment}
                            </p>
                          </div>
                        </div>

                        <ReplyBox
                          review={review}
                          onSaved={(reply) => setReviews((prev) => prev.map((r) => (r.id === review.id ? { ...r, reply } : r)))}
                        />
                        <div className="flex items-center gap-2">
                          <Button
                            size="sm"
                            variant={review.status === 'approved' ? 'outline' : 'default'}
                            disabled={isActioning}
                            onClick={() => handleApprove(review)}
                            className="rounded-lg h-8 text-xs"
                          >
                            {isActioning ? (
                              <Loader2 className="w-3.5 h-3.5 animate-spin" />
                            ) : (
                              <CheckCircle className="w-3.5 h-3.5 mr-1" />
                            )}
                            {review.status === 'approved' ? 'Onayı Kaldır' : 'Onayla'}
                          </Button>
                          <Button
                            size="sm"
                            variant="outline"
                            disabled={isActioning}
                            onClick={() => handleDelete(review.id)}
                            className="rounded-lg h-8 text-xs text-red-600 border-red-200 hover:bg-red-50"
                          >
                            {isActioning ? (
                              <Loader2 className="w-3.5 h-3.5 animate-spin" />
                            ) : (
                              <Trash2 className="w-3.5 h-3.5 mr-1" />
                            )}
                            Sil
                          </Button>
                        </div>
                      </div>
                    )}
                  </div>
                )
              })}
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  )
}
