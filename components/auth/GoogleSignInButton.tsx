'use client'

/**
 * "Google ile devam et". Firebase Console'da Google sağlayıcısı etkinleştirilip site alan adı
 * "Authorized domains" listesine eklenince NEXT_PUBLIC_GOOGLE_SIGNIN_ENABLED=true ile görünür olur.
 * Sağlayıcı kapalıysa (auth/operation-not-allowed) düğme bu oturumda gizlenir ve kibar bir mesaj gösterilir.
 */

import React, { useEffect, useState } from 'react'
import { useAuthStore } from '@/lib/store/useAuthStore'
import { requestWelcomeEmail } from '@/lib/store/useFirebaseAuth'
import { saveSignupConsents } from './consents'
import { SecondaryButton, Divider } from './AuthUI'
import { Loader2 } from 'lucide-react'

const DISABLED_KEY = 'voltekno_google_signin_unavailable'
const UNAVAILABLE_CODES = new Set(['auth/operation-not-allowed', 'auth/unauthorized-domain', 'auth/configuration-not-found'])
const SILENT_CODES = new Set(['auth/popup-closed-by-user', 'auth/cancelled-popup-request', 'auth/user-cancelled'])

function isEnabled(): boolean {
  if (process.env.NEXT_PUBLIC_GOOGLE_SIGNIN_ENABLED === 'true') return true
  // Geliştirmede arayüzü denemek için: localStorage.setItem('voltekno_google_signin', '1')
  if (process.env.NODE_ENV !== 'production') {
    try {
      return localStorage.getItem('voltekno_google_signin') === '1'
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

export function GoogleSignInButton({
  onSuccess,
  onError,
  canStart,
  acceptMarketing = false,
  disabled,
  dividerText = 'veya',
  notice,
}: {
  onSuccess: (isNewUser: boolean) => void
  onError: (message: string) => void
  /** Başlamadan önce kontrol (örn. kayıtta üyelik koşulları onayı); false dönerse başlamaz */
  canStart?: () => boolean
  acceptMarketing?: boolean
  disabled?: boolean
  dividerText?: string
  /** Düğmenin altında gösterilecek kısa bilgi (örn. ilk girişte üyelik koşulları) */
  notice?: React.ReactNode
}) {
  const loginWithGoogle = useAuthStore((s) => s.loginWithGoogle)
  const [visible, setVisible] = useState(false)
  const [loading, setLoading] = useState(false)

  useEffect(() => {
    let unavailable = false
    try {
      unavailable = sessionStorage.getItem(DISABLED_KEY) === '1'
    } catch {
      // yoksay
    }
    setVisible(isEnabled() && !unavailable)
  }, [])

  if (!visible) return null

  const handleClick = async () => {
    if (canStart && !canStart()) return
    setLoading(true)
    const result = await loginWithGoogle()
    if (result.success) {
      if (result.isNewUser) {
        const uid = useAuthStore.getState().user?.id
        if (uid) await saveSignupConsents(uid, acceptMarketing).catch((e) => console.error('Consent save error:', e))
        requestWelcomeEmail()
      }
      onSuccess(!!result.isNewUser)
      return
    }
    setLoading(false)
    if (result.code && SILENT_CODES.has(result.code)) return
    if (result.code && UNAVAILABLE_CODES.has(result.code)) {
      try {
        sessionStorage.setItem(DISABLED_KEY, '1')
      } catch {
        // yoksay
      }
      setVisible(false)
      onError('Google ile giriş şu anda kullanılamıyor. Lütfen e-posta adresiniz ve şifrenizle devam edin.')
      return
    }
    onError(result.error || 'Google ile giriş yapılamadı.')
  }

  return (
    <div className="space-y-5">
      <SecondaryButton type="button" onClick={handleClick} disabled={disabled || loading}>
        {loading ? <Loader2 className="h-5 w-5 animate-spin text-[#5d6e80]" /> : <GoogleLogo />}
        Google ile devam et
      </SecondaryButton>
      {notice && <div className="-mt-2 text-[12.5px] leading-relaxed text-[#5d6e80] [&_button]:min-h-0 [&_button]:min-w-0">{notice}</div>}
      <Divider>{dividerText}</Divider>
    </div>
  )
}
