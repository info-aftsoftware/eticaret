'use client'

import React, { useState, useEffect, useCallback } from 'react'
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Textarea } from '@/components/ui/textarea'
import { Badge } from '@/components/ui/badge'
import {
  HelpCircle,
  Search,
  Loader2,
  RefreshCw,
  Send,
  Trash2,
  ChevronDown,
  ChevronUp,
  User,
} from 'lucide-react'
import { useToast } from '@/components/admin/toast'
import { useAdminLive } from '@/components/admin/AdminLiveProvider'

type Question = {
  id: string
  productId: string
  productName: string
  userName: string
  userEmail: string
  question: string
  answer: string | null
  createdAt: string
}

function AnswerBadge({ answered }: { answered: boolean }) {
  return answered ? (
    <Badge className="bg-green-100 text-green-700 border-0 text-xs">Yanıtlandı</Badge>
  ) : (
    <Badge className="bg-amber-100 text-amber-700 border-0 text-xs">Bekliyor</Badge>
  )
}

export default function AdminSorularPage() {
  const toast = useToast()
  const { refresh: refreshLive } = useAdminLive()
  const [questions, setQuestions] = useState<Question[]>([])
  const [loading, setLoading] = useState(true)
  const [refreshing, setRefreshing] = useState(false)
  const [searchQuery, setSearchQuery] = useState('')
  const [expandedId, setExpandedId] = useState<string | null>(null)
  const [answerDrafts, setAnswerDrafts] = useState<Record<string, string>>({})
  const [actionLoading, setActionLoading] = useState<string | null>(null)

  const fetchQuestions = useCallback(async (silent = false) => {
    if (!silent) setLoading(true)
    else setRefreshing(true)
    try {
      const res = await fetch('/api/admin/questions', { credentials: 'include' })
      if (res.ok) {
        const data = await res.json()
        setQuestions(data.questions || [])
      }
    } catch (err) {
      console.error('Questions load error:', err)
    } finally {
      setLoading(false)
      setRefreshing(false)
    }
  }, [])

  useEffect(() => {
    fetchQuestions()
  }, [fetchQuestions])

  const handleAnswer = async (id: string) => {
    const answer = answerDrafts[id]?.trim()
    if (!answer) return
    setActionLoading(id)
    try {
      const res = await fetch('/api/admin/questions', {
        method: 'PATCH',
        credentials: 'include',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ id, answer }),
      })
      const data = await res.json().catch(() => null)
      if (!res.ok) {
        toast.error('Yanıt kaydedilemedi', data?.error)
      } else {
        toast.success(
          'Yanıt yayınlandı',
          data?.emailed ? 'Soruyu soran kişiye e-posta ile bildirildi.' : data?.hadEmail ? 'Yanıt değişmediği için e-posta gönderilmedi.' : 'Soruda e-posta adresi yok; bildirim gönderilmedi.'
        )
        refreshLive()
        setQuestions((prev) =>
          prev.map((q) => (q.id === id ? { ...q, answer } : q))
        )
        setAnswerDrafts((prev) => {
          const next = { ...prev }
          delete next[id]
          return next
        })
      }
    } catch (err) {
      console.error('Answer error:', err)
    } finally {
      setActionLoading(null)
    }
  }

  const handleDelete = async (id: string) => {
    if (!confirm('Bu soruyu silmek istediğinize emin misiniz?')) return
    setActionLoading(id)
    try {
      const res = await fetch(`/api/admin/questions?id=${id}`, {
        method: 'DELETE',
        credentials: 'include',
      })
      if (!res.ok) toast.error('Soru silinemedi')
      if (res.ok) {
        refreshLive()
        setQuestions((prev) => prev.filter((q) => q.id !== id))
        if (expandedId === id) setExpandedId(null)
      }
    } catch (err) {
      console.error('Delete error:', err)
    } finally {
      setActionLoading(null)
    }
  }

  const filtered = questions.filter((q) => {
    const search = searchQuery.toLowerCase()
    return (
      !search ||
      q.userName.toLowerCase().includes(search) ||
      q.userEmail.toLowerCase().includes(search) ||
      q.productId.toLowerCase().includes(search) ||
      q.productName.toLowerCase().includes(search) ||
      q.question.toLowerCase().includes(search)
    )
  })

  const pendingCount = questions.filter((q) => !q.answer).length

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-slate-900">Sorular</h1>
          <p className="text-slate-600 mt-1">
            {loading
              ? 'Yükleniyor...'
              : `${questions.length} soru${pendingCount > 0 ? ` · ${pendingCount} yanıt bekliyor` : ''}`}
          </p>
        </div>
        <Button
          variant="outline"
          size="sm"
          onClick={() => fetchQuestions(true)}
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
            <HelpCircle className="w-5 h-5 text-brand" />
            Ürün Soruları
          </CardTitle>
          <CardDescription>{filtered.length} soru görüntüleniyor</CardDescription>
          <div className="relative pt-2">
            <Search className="absolute left-3 top-1/2 translate-y-[-30%] text-slate-400 w-4 h-4 pointer-events-none" />
            <Input
              placeholder="Kullanıcı, ürün veya soru ara..."
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
              <HelpCircle className="w-14 h-14 mx-auto mb-3 text-slate-200" />
              <p className="font-medium">
                {searchQuery ? 'Soru bulunamadı.' : 'Henüz soru yok.'}
              </p>
            </div>
          ) : (
            <div className="divide-y divide-slate-100">
              {filtered.map((q) => {
                const isExpanded = expandedId === q.id
                const isActioning = actionLoading === q.id
                const draft = answerDrafts[q.id] ?? ''
                return (
                  <div key={q.id} className="hover:bg-slate-50/60 transition-colors">
                    {/* Header row */}
                    <button
                      className="w-full text-left px-4 py-3"
                      onClick={() => setExpandedId(isExpanded ? null : q.id)}
                    >
                      <div className="flex items-start justify-between gap-3">
                        <div className="flex-1 min-w-0">
                          <div className="flex items-center gap-2 flex-wrap">
                            <div className="flex items-center gap-1.5">
                              <User className="w-3.5 h-3.5 text-slate-400" />
                              <span className="font-semibold text-slate-900 text-sm">
                                {q.userName}
                              </span>
                            </div>
                            <AnswerBadge answered={!!q.answer} />
                            {q.productName && (
                              <Badge className="bg-brand/10 text-brand border-0 text-xs">
                                {q.productName}
                              </Badge>
                            )}
                          </div>
                          <p className="text-xs text-slate-500 mt-0.5 truncate">{q.question}</p>
                        </div>
                        <div className="flex items-center gap-2 shrink-0">
                          <span className="text-xs text-slate-400 whitespace-nowrap">
                            {q.createdAt
                              ? new Date(q.createdAt).toLocaleString('tr-TR', {
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
                            <p className="text-sm font-medium text-slate-900">{q.userName}</p>
                            {q.userEmail && (
                              <p className="text-xs text-slate-500 mt-0.5">{q.userEmail}</p>
                            )}
                          </div>
                          {q.productName && (
                            <div>
                              <p className="text-xs font-semibold text-slate-500 uppercase tracking-wide mb-1">
                                Ürün
                              </p>
                              <p className="text-sm text-slate-700">{q.productName}</p>
                              <p className="text-xs font-mono text-slate-400">{q.productId}</p>
                            </div>
                          )}
                        </div>

                        <div className="mb-4">
                          <p className="text-xs font-semibold text-slate-500 uppercase tracking-wide mb-1">
                            Soru
                          </p>
                          <div className="bg-white rounded-lg border border-slate-200 p-3">
                            <p className="text-sm text-slate-800 leading-relaxed">{q.question}</p>
                          </div>
                        </div>

                        {q.answer && (
                          <div className="mb-4">
                            <p className="text-xs font-semibold text-slate-500 uppercase tracking-wide mb-1">
                              Mevcut Cevap
                            </p>
                            <div className="bg-green-50 rounded-lg border border-green-200 p-3">
                              <p className="text-sm text-green-800 leading-relaxed">{q.answer}</p>
                            </div>
                          </div>
                        )}

                        <div className="space-y-2">
                          <p className="text-xs font-semibold text-slate-500 uppercase tracking-wide">
                            {q.answer ? 'Cevabı Güncelle' : 'Cevap Yaz'}
                          </p>
                          <Textarea
                            placeholder="Cevabınızı buraya yazın..."
                            value={draft}
                            onChange={(e) =>
                              setAnswerDrafts((prev) => ({ ...prev, [q.id]: e.target.value }))
                            }
                            rows={3}
                            className="rounded-lg border-slate-200 text-sm resize-none bg-white"
                          />
                          <div className="flex items-center gap-2">
                            <Button
                              size="sm"
                              disabled={isActioning || !draft.trim()}
                              onClick={() => handleAnswer(q.id)}
                              className="rounded-lg h-8 text-xs"
                            >
                              {isActioning ? (
                                <Loader2 className="w-3.5 h-3.5 animate-spin mr-1" />
                              ) : (
                                <Send className="w-3.5 h-3.5 mr-1" />
                              )}
                              {q.answer ? 'Güncelle' : 'Cevapla'}
                            </Button>
                            <Button
                              size="sm"
                              variant="outline"
                              disabled={isActioning}
                              onClick={() => handleDelete(q.id)}
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
