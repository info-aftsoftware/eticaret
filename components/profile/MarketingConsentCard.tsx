'use client'

import React, { useEffect, useState } from 'react'
import Link from 'next/link'
import { doc, getDoc, setDoc } from 'firebase/firestore'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Mail, Loader2 } from 'lucide-react'
import { getDb } from '@/lib/firebase/config'
import { useAuthStore } from '@/lib/store/useAuthStore'

/**
 * Ticari elektronik ileti izni (kampanya e-postası / SMS) — verme ve geri alma (ret hakkı).
 * Firestore users/{uid}.consents.commercialMessages (zaman damgalı).
 */
export function MarketingConsentCard() {
  const uid = useAuthStore((s) => s.user?.id)
  const [accepted, setAccepted] = useState<boolean | null>(null)
  const [saving, setSaving] = useState(false)
  const [message, setMessage] = useState('')

  useEffect(() => {
    if (!uid) return
    getDoc(doc(getDb(), 'users', uid))
      .then((snap) => setAccepted(snap.get('consents.commercialMessages.accepted') === true))
      .catch(() => setAccepted(false))
  }, [uid])

  const toggle = async (next: boolean) => {
    if (!uid) return
    setSaving(true)
    setMessage('')
    try {
      await setDoc(
        doc(getDb(), 'users', uid),
        { consents: { commercialMessages: { accepted: next, at: new Date().toISOString(), channels: next ? ['email', 'sms'] : [] } } },
        { merge: true }
      )
      setAccepted(next)
      setMessage(next ? 'Kampanya ve duyurulardan haberdar edileceksiniz.' : 'Ticari ileti izniniz kaldırıldı.')
    } catch {
      setMessage('Tercihiniz kaydedilemedi. Lütfen tekrar deneyin.')
    } finally {
      setSaving(false)
    }
  }

  return (
    <Card className="classic-card rounded-lg">
      <CardHeader>
        <CardTitle className="flex items-center gap-2"><Mail className="w-5 h-5" />İletişim Tercihleri</CardTitle>
      </CardHeader>
      <CardContent className="space-y-2 text-sm">
        {accepted === null ? (
          <Loader2 className="w-4 h-4 animate-spin text-ink-muted" />
        ) : (
          <label className="flex items-start gap-3 cursor-pointer">
            <input
              type="checkbox"
              className="mt-0.5 w-5 h-5"
              checked={accepted}
              disabled={saving}
              onChange={(e) => toggle(e.target.checked)}
            />
            <span className="text-ink">
              Kampanya, indirim ve duyurularla ilgili e-posta ve SMS almak istiyorum.{' '}
              <Link href="/pages/ticari-elektronik-ileti-onayi" className="text-brand hover:underline" target="_blank">Ayrıntılar</Link>
            </span>
          </label>
        )}
        <p className="text-xs text-ink-muted">Sipariş, ödeme ve kargo bilgilendirmeleri bu tercihten bağımsız olarak gönderilir.</p>
        {message && <p role="status" className="text-xs text-emerald-700">{message}</p>}
      </CardContent>
    </Card>
  )
}
