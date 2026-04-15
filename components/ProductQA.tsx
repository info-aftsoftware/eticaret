'use client'

import React, { useState, useEffect, useCallback } from 'react'
import { HelpCircle, ChevronDown, ChevronUp, Loader2, Send } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Textarea } from '@/components/ui/textarea'
import { Input } from '@/components/ui/input'
import { useAuthStore } from '@/lib/store/useAuthStore'

type QAItem = {
  id: string
  question: string
  answer: string | null
  userName: string
  createdAt: string
}

export function ProductQA({
  productId,
  productName,
}: {
  productId: string
  productName: string
}) {
  const { user, isAuthenticated, token } = useAuthStore()
  const [qas, setQas] = useState<QAItem[]>([])
  const [loading, setLoading] = useState(true)
  const [expanded, setExpanded] = useState<Set<string>>(new Set())
  const [showForm, setShowForm] = useState(false)
  const [question, setQuestion] = useState('')
  const [guestName, setGuestName] = useState('')
  const [guestEmail, setGuestEmail] = useState('')
  const [submitting, setSubmitting] = useState(false)
  const [submitted, setSubmitted] = useState(false)
  const [error, setError] = useState('')

  const loadQAs = useCallback(async () => {
    try {
      const res = await fetch(`/api/products/${productId}/questions`)
      if (res.ok) {
        const data = await res.json()
        setQas(data.questions || [])
      }
    } catch {
      // silent
    } finally {
      setLoading(false)
    }
  }, [productId])

  useEffect(() => {
    loadQAs()
  }, [loadQAs])

  const toggle = (id: string) => {
    setExpanded((prev) => {
      const next = new Set(prev)
      if (next.has(id)) next.delete(id)
      else next.add(id)
      return next
    })
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!question.trim()) {
      setError('Lütfen sorunuzu yazın.')
      return
    }
    if (!isAuthenticated && (!guestName.trim() || !guestEmail.trim())) {
      setError('Ad ve e-posta zorunludur.')
      return
    }
    setSubmitting(true)
    setError('')
    try {
      const headers: Record<string, string> = { 'Content-Type': 'application/json' }
      if (token) headers['Authorization'] = `Bearer ${token}`

      const res = await fetch(`/api/products/${productId}/questions`, {
        method: 'POST',
        headers,
        body: JSON.stringify({
          question: question.trim(),
          productName,
          // Guests provide their own; logged-in users send profile as fallback
          guestName: isAuthenticated ? user?.name : guestName.trim() || undefined,
          guestEmail: isAuthenticated ? user?.email : guestEmail.trim() || undefined,
        }),
      })

      const data = await res.json()
      if (!res.ok) {
        setError(data.error || 'Soru gönderilemedi. Lütfen tekrar deneyin.')
        return
      }

      setSubmitted(true)
      setQuestion('')
      setGuestName('')
      setGuestEmail('')
      setShowForm(false)
      setLoading(true)
      await loadQAs()
    } catch {
      setError('Soru gönderilemedi. Lütfen tekrar deneyin.')
    } finally {
      setSubmitting(false)
    }
  }

  const answeredCount = qas.filter((q) => q.answer).length

  return (
    <div className="mt-10 pt-8 border-t border-slate-200">
      <div className="flex items-center justify-between mb-6 flex-wrap gap-3">
        <h2 className="text-lg font-bold text-slate-900 flex items-center gap-2">
          <HelpCircle className="w-5 h-5 text-brand" />
          Soru & Cevap
          {qas.length > 0 && (
            <span className="text-sm font-normal text-slate-500">
              ({answeredCount}/{qas.length} yanıtlandı)
            </span>
          )}
        </h2>
        {!submitted && (
          <Button
            variant="outline"
            size="sm"
            onClick={() => setShowForm((f) => !f)}
            className="rounded-xl border-slate-200 text-sm"
          >
            {showForm ? 'İptal' : 'Soru Sor'}
          </Button>
        )}
      </div>

      {submitted && (
        <div className="bg-green-50 border border-green-200 rounded-xl p-4 mb-6 text-sm text-green-700 flex items-center gap-2">
          <span className="font-bold">✓</span>
          Sorunuz alındı! Ekibimiz en kısa sürede yanıtlayacak.
        </div>
      )}

      {/* Soru formu */}
      {showForm && (
        <div className="bg-slate-50 border border-slate-200 rounded-2xl p-5 mb-6">
          <h3 className="font-semibold text-slate-900 mb-4 text-sm">Soru Sor</h3>
          <form onSubmit={handleSubmit} className="space-y-3">
            {/* Guest name/email - only shown when not logged in */}
            {!isAuthenticated && (
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <Input
                  placeholder="Adınız *"
                  value={guestName}
                  onChange={(e) => setGuestName(e.target.value)}
                  className="rounded-xl border-slate-200 text-sm"
                  required
                />
                <Input
                  type="email"
                  placeholder="E-posta *"
                  value={guestEmail}
                  onChange={(e) => setGuestEmail(e.target.value)}
                  className="rounded-xl border-slate-200 text-sm"
                  required
                />
              </div>
            )}

            {isAuthenticated && user?.name && (
              <p className="text-xs text-slate-500">
                Soru <span className="font-medium text-slate-700">{user.name}</span> adına gönderilecek.
              </p>
            )}

            <Textarea
              placeholder={`"${productName}" hakkında sorunuzu yazın...`}
              value={question}
              onChange={(e) => setQuestion(e.target.value)}
              rows={3}
              className="rounded-xl border-slate-200 text-sm resize-none"
              required
            />
            {error && <p className="text-xs text-red-500">{error}</p>}
            <Button type="submit" disabled={submitting} size="sm" className="rounded-xl">
              <Send className="w-3.5 h-3.5 mr-1.5" />
              {submitting ? 'Gönderiliyor...' : 'Soruyu Gönder'}
            </Button>
          </form>
        </div>
      )}

      {/* Q&A listesi */}
      {loading ? (
        <div className="flex justify-center py-10">
          <Loader2 className="w-7 h-7 animate-spin text-slate-400" />
        </div>
      ) : qas.length === 0 ? (
        <div className="text-center py-10 text-slate-400">
          <HelpCircle className="w-10 h-10 mx-auto mb-2 text-slate-200" />
          <p className="text-sm">Henüz soru sorulmamış. İlk soruyu siz sorun!</p>
        </div>
      ) : (
        <div className="space-y-2">
          {qas.map((qa) => {
            const isOpen = expanded.has(qa.id)
            return (
              <div
                key={qa.id}
                className="bg-white rounded-xl border border-slate-200 overflow-hidden"
              >
                <button
                  type="button"
                  className="w-full text-left px-4 py-3.5"
                  onClick={() => toggle(qa.id)}
                >
                  <div className="flex items-start justify-between gap-3">
                    <div className="flex items-start gap-2.5 min-w-0">
                      <span className="inline-flex items-center justify-center w-5 h-5 rounded-full bg-brand text-white text-xs font-bold shrink-0 mt-0.5">
                        S
                      </span>
                      <p className="text-sm font-medium text-slate-900 leading-snug">
                        {qa.question}
                      </p>
                    </div>
                    <div className="flex items-center gap-2 shrink-0">
                      {qa.answer && (
                        <span className="text-xs bg-green-100 text-green-700 px-2 py-0.5 rounded-full font-medium">
                          Yanıtlandı
                        </span>
                      )}
                      {isOpen ? (
                        <ChevronUp className="w-4 h-4 text-slate-400" />
                      ) : (
                        <ChevronDown className="w-4 h-4 text-slate-400" />
                      )}
                    </div>
                  </div>
                  <p className="text-xs text-slate-400 mt-1.5 ml-7">
                    {qa.userName}
                    {qa.createdAt
                      ? ` · ${new Date(qa.createdAt).toLocaleDateString('tr-TR')}`
                      : ''}
                  </p>
                </button>

                {isOpen && (
                  <div className="border-t border-slate-100 px-4 py-3.5">
                    {qa.answer ? (
                      <div className="flex items-start gap-2.5">
                        <span className="inline-flex items-center justify-center w-5 h-5 rounded-full bg-brand/10 text-brand text-xs font-bold shrink-0 mt-0.5">
                          C
                        </span>
                        <p className="text-sm text-slate-700 leading-relaxed">{qa.answer}</p>
                      </div>
                    ) : (
                      <p className="text-sm text-slate-400 italic ml-7">
                        Bu soru henüz yanıtlanmamış.
                      </p>
                    )}
                  </div>
                )}
              </div>
            )
          })}
        </div>
      )}
    </div>
  )
}
