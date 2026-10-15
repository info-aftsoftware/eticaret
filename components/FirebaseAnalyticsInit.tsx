'use client'

import { useEffect } from 'react'
import { isFirebaseConfigured, getAnalytics } from '@/lib/firebase/config'
import { COOKIE_CONSENT_EVENT, hasAnalyticsConsent } from '@/components/CookieConsent'

/**
 * Firebase Analytics'i tarayıcıda başlatır (measurementId tanımlıysa).
 * Analitik çerezleri zorunlu olmadığından yalnızca kullanıcı çerez bandında "Kabul Et" dedikten sonra başlar.
 */
export function FirebaseAnalyticsInit() {
  useEffect(() => {
    if (!isFirebaseConfigured) return
    const start = () => {
      if (hasAnalyticsConsent()) void getAnalytics()
    }
    start()
    window.addEventListener(COOKIE_CONSENT_EVENT, start)
    return () => window.removeEventListener(COOKIE_CONSENT_EVENT, start)
  }, [])
  return null
}
