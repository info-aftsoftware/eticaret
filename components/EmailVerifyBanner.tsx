'use client'

/**
 * E-postası doğrulanmamış, oturum açık kullanıcı için uyarı bandı:
 * "Doğrulama e-postasını tekrar gönder" (bekleme süreli) ve "Doğruladım" (durumu yenile).
 */

import React, { useCallback, useEffect, useState } from 'react'
import { Loader2, CheckCircle2, RefreshCw } from 'lucide-react'
import { useAuthStore } from '@/lib/store/useAuthStore'
import { sendVerificationEmail, refreshEmailVerified } from '@/lib/store/useFirebaseAuth'
import { useL } from '@/lib/i18n-inline'
import { useServerError } from '@/lib/server-error-i18n'

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
  const L = useL()
  const tErr = useServerError()
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
      setMessage({ tone: 'success', text: L('E-posta adresiniz zaten doğrulanmış.', 'Your email address is already verified.') })
      return
    }
    if (result.success) {
      writeSentAt(uid, Date.now())
      tick()
      setMessage({ tone: 'success', text: L(`Doğrulama bağlantısı ${user?.email ?? 'e-posta adresinize'} adresine gönderildi. Gelen kutunuzu ve spam klasörünü kontrol edin.`, `A verification link has been sent to ${user?.email ?? 'your email address'}. Check your inbox and spam folder.`) })
    } else {
      setMessage({ tone: 'error', text: tErr(result.error) || L('E-posta gönderilemedi. Lütfen biraz sonra tekrar deneyin.', 'The email could not be sent. Please try again shortly.') })
    }
  }, [uid, remaining, sending, tick, user?.email, L, tErr])

  const check = useCallback(async () => {
    setChecking(true)
    setMessage(null)
    const ok = await refreshEmailVerified()
    setChecking(false)
    if (!ok) setMessage({ tone: 'info', text: L('Henüz doğrulanmamış görünüyor. E-postadaki bağlantıya tıkladıktan sonra tekrar deneyin.', 'It doesn’t look verified yet. Click the link in the email, then try again.') })
    return ok
  }, [L])

  return { user, remaining, sending, checking, message, resend, check, markSent }
}

export function EmailVerifyBanner({ className = '' }: { className?: string }) {
  const L = useL()
  const authReady = useAuthStore((s) => s.authReady)
  const { user, remaining, sending, checking, message, resend, check } = useEmailVerification()

  if (!authReady || !user || user.emailVerified) return null

  return (
    <div className={`rounded-xl border border-[#f5b400]/50 bg-[#fffaeb] p-4 sm:p-5 ${className}`} role="region" aria-label={L('E-posta doğrulama', 'Email verification')}>
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center">
        <div className="flex min-w-0 flex-1 gap-3">
          <div className="min-w-0">
            <p className="text-[15px] font-semibold text-[#121926]">{L('E-posta adresinizi doğrulayın', 'Verify your email address')}</p>
            <p className="mt-0.5 text-[14px] leading-relaxed text-[#20384e]">
              {L('', 'Click the link we sent to ')}<span className="break-all font-medium">{user.email}</span>
              {L(' adresine gönderdiğimiz bağlantıya tıklayın. Doğrulama sonrası üye olmadan verdiğiniz siparişler de hesabınızda görünür.', '. After verification, orders you placed as a guest will also appear in your account.')}
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
            {remaining > 0 ? L(`Tekrar gönder (${remaining} sn)`, `Resend (${remaining}s)`) : L('Doğrulama e-postasını tekrar gönder', 'Resend verification email')}
          </button>
          <button
            type="button"
            onClick={check}
            disabled={checking}
            className="inline-flex h-10 items-center justify-center gap-2 rounded-[10px] border border-[#d3d9e1] bg-white px-4 text-[14px] font-semibold text-[#121926] transition-colors hover:bg-[#f5f7fa] disabled:opacity-60"
          >
            {checking ? <Loader2 className="h-4 w-4 animate-spin" /> : <RefreshCw className="h-4 w-4" />}
            {L('Doğruladım', 'I’ve verified')}
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
