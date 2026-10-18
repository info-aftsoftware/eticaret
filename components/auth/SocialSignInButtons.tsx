'use client'

/**
 * "Google ile devam et" / "Facebook ile devam et".
 * Her sağlayıcı Firebase Console'da etkinleştirilip site alan adı "Authorized domains" listesine eklenince
 * ortam değişkeniyle görünür olur: NEXT_PUBLIC_GOOGLE_SIGNIN_ENABLED=true, NEXT_PUBLIC_FACEBOOK_SIGNIN_ENABLED=true.
 * Sağlayıcı kapalıysa (auth/operation-not-allowed vb.) o düğme bu oturumda gizlenir ve kibar bir mesaj gösterilir.
 */

import React, { useEffect, useState } from 'react'
import { Loader2 } from 'lucide-react'
import { useAuthStore } from '@/lib/store/useAuthStore'
import { requestWelcomeEmail } from '@/lib/store/useFirebaseAuth'
import { saveSignupConsents } from './consents'
import { SecondaryButton, Divider } from './AuthUI'
import { useL } from '@/lib/i18n-inline'

type Provider = 'google' | 'facebook'

const UNAVAILABLE_CODES = new Set(['auth/operation-not-allowed', 'auth/unauthorized-domain', 'auth/configuration-not-found'])
const SILENT_CODES = new Set(['auth/popup-closed-by-user', 'auth/cancelled-popup-request', 'auth/user-cancelled'])
const LABEL: Record<Provider, string> = { google: 'Google', facebook: 'Facebook' }
const disabledKey = (p: Provider) => `voltekno_${p}_signin_unavailable`

function isEnabled(p: Provider): boolean {
  const flag = p === 'google' ? process.env.NEXT_PUBLIC_GOOGLE_SIGNIN_ENABLED : process.env.NEXT_PUBLIC_FACEBOOK_SIGNIN_ENABLED
  if (flag === 'true') return true
  // Geliştirmede arayüzü denemek için: localStorage.setItem('voltekno_social_signin', '1')
  if (process.env.NODE_ENV !== 'production') {
    try {
      return localStorage.getItem('voltekno_social_signin') === '1'
    } catch {
      return false
    }
  }
  return false
}

function GoogleLogo() {
  return (
    <svg viewBox="0 0 48 48" className="h-5 w-5" aria-hidden>
      <path fill="#FFC107" d="M43.6 20.5H42V20H24v8h11.3C33.7 32.7 29.2 36 24 36c-6.6 0-12-5.4-12-12s5.4-12 12-12c3.1 0 5.8 1.2 7.9 3.1l5.7-5.7C34 6.1 29.3 4 24 4 12.9 4 4 12.9 4 24s8.9 20 20 20 20-8.9 20-20c0-1.3-.1-2.4-.4-3.5z" />
      <path fill="#FF3D00" d="M6.3 14.7l6.6 4.8C14.7 15.1 19 12 24 12c3.1 0 5.8 1.2 7.9 3.1l5.7-5.7C34 6.1 29.3 4 24 4 16.3 4 9.7 8.3 6.3 14.7z" />
      <path fill="#4CAF50" d="M24 44c5.2 0 9.9-2 13.4-5.2l-6.2-5.2C29.2 35.1 26.7 36 24 36c-5.2 0-9.6-3.3-11.3-7.9l-6.5 5C9.5 39.6 16.2 44 24 44z" />
      <path fill="#1976D2" d="M43.6 20.5H42V20H24v8h11.3c-.8 2.2-2.2 4.2-4.1 5.6l6.2 5.2C37 39.2 44 34 44 24c0-1.3-.1-2.4-.4-3.5z" />
    </svg>
  )
}

function FacebookLogo() {
  return (
    <svg viewBox="0 0 24 24" className="h-5 w-5" aria-hidden>
      <path fill="#1877F2" d="M24 12.07C24 5.41 18.63 0 12 0S0 5.4 0 12.07C0 18.1 4.39 23.1 10.13 24v-8.44H7.08v-3.49h3.05V9.41c0-3.02 1.79-4.69 4.53-4.69 1.31 0 2.68.24 2.68.24v2.97h-1.51c-1.49 0-1.96.93-1.96 1.89v2.25h3.33l-.53 3.49h-2.8V24C19.61 23.1 24 18.1 24 12.07z" />
    </svg>
  )
}

export function SocialSignInButtons({
  onSuccess,
  onError,
  canStart,
  acceptMarketing = false,
  disabled,
  dividerText,
  notice,
}: {
  onSuccess: (isNewUser: boolean) => void
  onError: (message: string) => void
  /** Başlamadan önce kontrol (örn. kayıtta üyelik koşulları onayı); false dönerse başlamaz */
  canStart?: () => boolean
  acceptMarketing?: boolean
  disabled?: boolean
  dividerText?: string
  /** Düğmelerin altında gösterilecek kısa bilgi (örn. ilk girişte üyelik koşulları) */
  notice?: React.ReactNode
}) {
  const L = useL()
  const loginWithGoogle = useAuthStore((s) => s.loginWithGoogle)
  const loginWithFacebook = useAuthStore((s) => s.loginWithFacebook)
  const [visible, setVisible] = useState<Provider[]>([])
  const [loading, setLoading] = useState<Provider | null>(null)

  useEffect(() => {
    const list = (['google', 'facebook'] as Provider[]).filter((p) => {
      let unavailable = false
      try {
        unavailable = sessionStorage.getItem(disabledKey(p)) === '1'
      } catch {
        // yoksay
      }
      return isEnabled(p) && !unavailable
    })
    setVisible(list)
  }, [])

  if (visible.length === 0) return null

  const handleClick = async (p: Provider) => {
    if (canStart && !canStart()) return
    setLoading(p)
    const result = await (p === 'google' ? loginWithGoogle() : loginWithFacebook())
    if (result.success) {
      if (result.isNewUser) {
        const uid = useAuthStore.getState().user?.id
        if (uid) await saveSignupConsents(uid, acceptMarketing).catch((e) => console.error('Consent save error:', e))
        requestWelcomeEmail()
      }
      onSuccess(!!result.isNewUser)
      return
    }
    setLoading(null)
    if (result.code && SILENT_CODES.has(result.code)) return
    if (result.code && UNAVAILABLE_CODES.has(result.code)) {
      try {
        sessionStorage.setItem(disabledKey(p), '1')
      } catch {
        // yoksay
      }
      setVisible((v) => v.filter((x) => x !== p))
      onError(L(`${LABEL[p]} ile giriş şu anda kullanılamıyor. Lütfen e-posta adresiniz ve şifrenizle devam edin.`, `Sign-in with ${LABEL[p]} is currently unavailable. Please continue with your email address and password.`))
      return
    }
    onError(result.error || L(`${LABEL[p]} ile giriş yapılamadı.`, `Sign-in with ${LABEL[p]} failed.`))
  }

  return (
    <div className="space-y-5">
      <div className="space-y-2.5">
        {visible.map((p) => (
          <SecondaryButton key={p} type="button" onClick={() => handleClick(p)} disabled={disabled || loading !== null}>
            {loading === p ? <Loader2 className="h-5 w-5 animate-spin text-[#5d6e80]" /> : p === 'google' ? <GoogleLogo /> : <FacebookLogo />}
            {L(`${LABEL[p]} ile devam et`, `Continue with ${LABEL[p]}`)}
          </SecondaryButton>
        ))}
      </div>
      {notice && <div className="-mt-2 text-[12.5px] leading-relaxed text-[#5d6e80] [&_button]:min-h-0 [&_button]:min-w-0">{notice}</div>}
      <Divider>{dividerText ?? L('veya', 'or')}</Divider>
    </div>
  )
}
