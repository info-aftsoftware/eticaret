'use client'

/**
 * E-postası doğrulanmamış, oturum açık kullanıcı için uyarı bandı:
 * "Doğrulama e-postasını tekrar gönder" (bekleme süreli) ve "Doğruladım" (durumu yenile).
 */

import React, { useCallback, useEffect, useState } from 'react'
import { MailWarning, Loader2, CheckCircle2, RefreshCw } from 'lucide-react'
import { useAuthStore } from '@/lib/store/useAuthStore'
import { sendVerificationEmail, refreshEmailVerified } from '@/lib/store/useFirebaseAuth'

export const RESEND_COOLDOWN_SECONDS = 60
const STORAGE_KEY = 'voltekno_verify_sent_at'

function readSentAt(uid: string): number {
  try {
    const raw = localStorage.getItem(STORAGE_KEY)
    const data = raw ? (JSON.parse(raw) as Record<string, number>) : {}
    return data[uid] ?? 0
  } catch {
    return 0
  }
}

function writeSentAt(uid: string, at: number) {
  try {
    localStorage.setItem(STORAGE_KEY, JSON.stringify({ [uid]: at }))
  } catch {
    // yoksay
  }
}

/** Doğrulama e-postası gönderimi + bekleme süresi + durum yenileme (banner ve /verify-email ortak). */
export function useEmailVerification() {
  const user = useAuthStore((s) => s.user)
  const uid = user?.id ?? ''
  const [remaining, setRemaining] = useState(0)
  const [sending, setSending] = useState(false)
  const [checking, setChecking] = useState(false)
  const [message, setMessage] = useState<{ tone: 'success' | 'error' | 'info'; text: string } | null>(null)

  const tick = useCallback(() => {
    if (!uid) return setRemaining(0)
    const left = Math.ceil((readSentAt(uid) + RESEND_COOLDOWN_SECONDS * 1000 - Date.now()) / 1000)
    setRemaining(left > 0 ? left : 0)
  }, [uid])

  useEffect(() => {
    tick()
    const t = setInterval(tick, 1000)
    return () => clearInterval(t)
  }, [tick])

  /** Kayıt sırasında gönderildiyse bekleme süresini başlat */
  const markSent = useCallback(() => {
    if (uid && !readSentAt(uid)) writeSentAt(uid, Date.now())
    tick()
  }, [uid, tick])

  const resend = useCallback(async () => {
    if (!uid || remaining > 0 || sending) return
    setSending(true)
    setMessage(null)
    const result = await sendVerificationEmail()
    setSending(false)
    if (result.alreadyVerified) {
      await refreshEmailVerified()
      setMessage({ tone: 'success', text: 'E-posta adresiniz zaten doğrulanmış.' })
      return
    }
    if (result.success) {
      writeSentAt(uid, Date.now())
      tick()
      setMessage({ tone: 'success', text: `Doğrulama bağlantısı ${user?.email ?? 'e-posta adresinize'} adresine gönderildi. Gelen kutunuzu ve spam klasörünü kontrol edin.` })
    } else {
      setMessage({ tone: 'error', text: result.error || 'E-posta gönderilemedi. Lütfen biraz sonra tekrar deneyin.' })
    }
  }, [uid, remaining, sending, tick, user?.email])

  const check = useCallback(async () => {
    setChecking(true)
    setMessage(null)
    const ok = await refreshEmailVerified()
    setChecking(false)
    if (!ok) setMessage({ tone: 'info', text: 'Henüz doğrulanmamış görünüyor. E-postadaki bağlantıya tıkladıktan sonra tekrar deneyin.' })
    return ok
  }, [])

  return { user, remaining, sending, checking, message, resend, check, markSent }
}

export function EmailVerifyBanner({ className = '' }: { className?: string }) {
  const authReady = useAuthStore((s) => s.authReady)
  const { user, remaining, sending, checking, message, resend, check } = useEmailVerification()

  if (!authReady || !user || user.emailVerified) return null

  return (
    <div className={`rounded-xl border border-[#f5b400]/50 bg-[#fffaeb] p-4 sm:p-5 ${className}`} role="region" aria-label="E-posta doğrulama">
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center">
        <div className="flex min-w-0 flex-1 gap-3">
          <span className="flex h-10 w-10 shrink-0 items-center justify-center rounded-lg bg-[#f5b400]/20 text-[#8a6100]">
            <MailWarning className="h-5 w-5" />
          </span>
          <div className="min-w-0">
            <p className="text-[15px] font-semibold text-[#121926]">E-posta adresinizi doğrulayın</p>
            <p className="mt-0.5 text-[14px] leading-relaxed text-[#20384e]">
              <span className="break-all font-medium">{user.email}</span> adresine gönderdiğimiz bağlantıya tıklayın. Doğrulama sonrası üye
              olmadan verdiğiniz siparişler de hesabınızda görünür.
            </p>
          </div>
        </div>
        <div className="flex shrink-0 flex-col gap-2 sm:flex-row">
          <button
            type="button"
            onClick={resend}
            disabled={sending || remaining > 0}
            className="inline-flex h-10 items-center justify-center gap-2 rounded-[10px] bg-[#0b2540] px-4 text-[14px] font-semibold text-white transition-colors hover:bg-[#12335a] disabled:cursor-not-allowed disabled:opacity-60"
          >
            {sending && <Loader2 className="h-4 w-4 animate-spin" />}
            {remaining > 0 ? `Tekrar gönder (${remaining} sn)` : 'Doğrulama e-postasını tekrar gönder'}
          </button>
          <button
            type="button"
            onClick={check}
            disabled={checking}
            className="inline-flex h-10 items-center justify-center gap-2 rounded-[10px] border border-[#d3d9e1] bg-white px-4 text-[14px] font-semibold text-[#121926] transition-colors hover:bg-[#f5f7fa] disabled:opacity-60"
          >
            {checking ? <Loader2 className="h-4 w-4 animate-spin" /> : <RefreshCw className="h-4 w-4" />}
            Doğruladım
          </button>
        </div>
      </div>
      {message && (
        <p
          role="status"
          className={`mt-3 flex items-start gap-2 text-[13.5px] ${message.tone === 'error' ? 'text-red-700' : message.tone === 'success' ? 'text-emerald-700' : 'text-[#20384e]'}`}
        >
          {message.tone === 'success' && <CheckCircle2 className="mt-0.5 h-4 w-4 shrink-0" />}
          {message.text}
        </p>
      )}
    </div>
  )
}
