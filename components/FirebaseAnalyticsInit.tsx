'use client'

import { useEffect } from 'react'
import { setAnalyticsCollectionEnabled } from 'firebase/analytics'
import { isFirebaseConfigured, getAnalytics } from '@/lib/firebase/config'
import { COOKIE_CONSENT_EVENT, hasAnalyticsConsent } from '@/components/CookieConsent'

/**
 * Firebase Analytics'i tarayıcıda başlatır (measurementId tanımlıysa).
 * Analitik çerezleri zorunlu olmadığından yalnızca kullanıcı çerez bandında "Kabul Et" dedikten sonra başlar;
 * onay sonradan geri alınırsa (footer "Çerez tercihleri") toplama durdurulur.
 */
export function FirebaseAnalyticsInit() {
  useEffect(() => {
    if (!isFirebaseConfigured) return
    let started = false
    const start = () => {
      if (hasAnalyticsConsent()) {
        started = true
        void getAnalytics().then((a) => a && setAnalyticsCollectionEnabled(a, true))
      } else if (started) {
        void getAnalytics().then((a) => a && setAnalyticsCollectionEnabled(a, false))
      }
    }
    start()
    window.addEventListener(COOKIE_CONSENT_EVENT, start)
    return () => window.removeEventListener(COOKIE_CONSENT_EVENT, start)
  }, [])
  return null
}
