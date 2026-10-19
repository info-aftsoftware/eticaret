'use client'

import React, { useEffect, useState } from 'react'
import Link from 'next/link'
import { doc, getDoc, setDoc } from 'firebase/firestore'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Loader2 } from 'lucide-react'
import { saveMarketingConsent } from '@/components/auth/consents'
import { getDb } from '@/lib/firebase/config'
import { useAuthStore } from '@/lib/store/useAuthStore'
import { useL } from '@/lib/i18n-inline'

/**
 * Ticari elektronik ileti izni (kampanya e-postası / SMS) — verme ve geri alma (ret hakkı).
 * Sunucudaki izin defteri (lib/marketing-consent.ts, tarihli kayıt); eski kayıtlar için Firestore'a geri düşer.
 */
export function MarketingConsentCard() {
  const uid = useAuthStore((s) => s.user?.id)
  const [accepted, setAccepted] = useState<boolean | null>(null)
  const [saving, setSaving] = useState(false)
  const [message, setMessage] = useState('')
  const L = useL()

  useEffect(() => {
    if (!uid) return
    // Önce sunucudaki izin defteri; kayıt yoksa eski Firestore kaydı
    ;(async () => {
      try {
        const { getAuth } = await import('@/lib/firebase/config')
        const token = await getAuth().currentUser?.getIdToken()
        if (token) {
          const res = await fetch('/api/account/consent', { headers: { Authorization: `Bearer ${token}` } })
          const d = res.ok ? await res.json() : null
          if (typeof d?.accepted === 'boolean') return setAccepted(d.accepted)
        }
        const snap = await getDoc(doc(getDb(), 'users', uid))
        setAccepted(snap.get('consents.commercialMessages.accepted') === true)
      } catch {
        setAccepted(false)
      }
    })()
  }, [uid])

  const toggle = async (next: boolean) => {
    if (!uid) return
    setSaving(true)
    setMessage('')
    try {
      if (!(await saveMarketingConsent(next, 'hesap'))) throw new Error('consent')
      // Eski kayıt yeri de güncel kalsın (Firestore yoksa sessizce atlanır)
      setDoc(
        doc(getDb(), 'users', uid),
        { consents: { commercialMessages: { accepted: next, at: new Date().toISOString(), channels: next ? ['email', 'sms'] : [] } } },
        { merge: true }
      ).catch(() => {})
      setAccepted(next)
      setMessage(next ? L('Kampanya ve duyurulardan haberdar edileceksiniz.', 'You will be notified about promotions and announcements.') : L('Ticari ileti izniniz kaldırıldı.', 'Your consent to marketing messages has been withdrawn.'))
    } catch {
      setMessage(L('Tercihiniz kaydedilemedi. Lütfen tekrar deneyin.', 'Your preference could not be saved. Please try again.'))
    } finally {
      setSaving(false)
    }
  }

  return (
    <Card className="classic-card rounded-lg">
      <CardHeader>
        <CardTitle>{L('İletişim Tercihleri', 'Communication Preferences')}</CardTitle>
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
              {L('Kampanya, indirim ve duyurularla ilgili e-posta ve SMS almak istiyorum.', 'I would like to receive emails and SMS about promotions, discounts and announcements.')}{' '}
              <Link href="/pages/ticari-elektronik-ileti-onayi" className="text-brand hover:underline" target="_blank">{L('Ayrıntılar', 'Details')}</Link>
            </span>
          </label>
        )}
        <p className="text-xs text-ink-muted">{L('Sipariş, ödeme ve kargo bilgilendirmeleri bu tercihten bağımsız olarak gönderilir.', 'Order, payment and shipping notifications are sent regardless of this preference.')}</p>
        {message && <p role="status" className="text-xs text-emerald-700">{message}</p>}
      </CardContent>
    </Card>
  )
}
