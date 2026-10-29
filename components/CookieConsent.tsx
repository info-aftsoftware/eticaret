'use client'

import React, { useState, useEffect } from 'react'
import Link from '@/lib/i18n/navigation'
import { useTranslations } from 'next-intl'
import { Button } from '@/components/ui/button'

export const COOKIE_CONSENT_KEY = 'voltekno_cookie_consent'
export const COOKIE_CONSENT_EVENT = 'voltekno:cookie-consent'
/** Bandı yeniden açar (footer "Çerez tercihleri"; kontrol listesi 23: tercih sonradan değiştirilebilmeli) */
export const COOKIE_PREFERENCES_EVENT = 'voltekno:cookie-preferences'
const STORAGE_KEY = COOKIE_CONSENT_KEY

/** Analitik gibi zorunlu olmayan çerezler yalnızca açık onayla ('accepted') kullanılabilir. */
export function hasAnalyticsConsent(): boolean {
  try {
    return typeof window !== 'undefined' && localStorage.getItem(COOKIE_CONSENT_KEY) === 'accepted'
  } catch {
    return false
  }
}

export function openCookiePreferences() {
  window.dispatchEvent(new Event(COOKIE_PREFERENCES_EVENT))
}

/** Onay geri alınınca ölçüm çerezleri silinir (GA4 _ga/_ga_*, Meta _fbp); alan adı ve üst alan adı için */
function clearAnalyticsCookies() {
  const host = window.location.hostname
  const domains = ['', host, '.' + host, '.' + host.split('.').slice(-2).join('.')]
  for (const c of document.cookie.split(';')) {
    const name = c.split('=')[0].trim()
    if (!/^(_ga|_gid|_gat|_fbp|_fbc)/.test(name)) continue
    for (const d of domains) document.cookie = `${name}=; Max-Age=0; path=/${d ? `; domain=${d}` : ''}`
  }
}

export function CookieConsent() {
  const t = useTranslations('cookie')
  const [visible, setVisible] = useState(false)

  useEffect(() => {
    try {
      const stored = typeof window !== 'undefined' ? localStorage.getItem(STORAGE_KEY) : null
      if (stored !== 'accepted' && stored !== 'dismissed') {
        setVisible(true)
      }
    } catch {
      setVisible(true)
    }
    const open = () => setVisible(true)
    window.addEventListener(COOKIE_PREFERENCES_EVENT, open)
    return () => window.removeEventListener(COOKIE_PREFERENCES_EVENT, open)
  }, [])

  const accept = () => {
    try {
      localStorage.setItem(STORAGE_KEY, 'accepted')
    } catch {}
    window.dispatchEvent(new Event(COOKIE_CONSENT_EVENT))
    setVisible(false)
  }

  const dismiss = () => {
    try {
      localStorage.setItem(STORAGE_KEY, 'dismissed')
    } catch {}
    clearAnalyticsCookies()
    // Ölçüm başlamışsa durdurulur (components/FirebaseAnalyticsInit)
    window.dispatchEvent(new Event(COOKIE_CONSENT_EVENT))
    setVisible(false)
  }

  if (!visible) return null

  return (
    <div
      role="dialog"
      aria-label={t('ariaLabel')}
      className="fixed bottom-0 left-0 right-0 z-[100] bg-surface-elevated border-t border-palette shadow-[0_-4px_20px_rgba(0,0,0,0.08)] p-4 md:p-5 pb-[max(1rem,env(safe-area-inset-bottom))]"
    >
      <div className="container mx-auto max-w-5xl flex flex-col sm:flex-row items-start sm:items-center gap-4">
        <div className="flex items-start gap-3 flex-1 min-w-0">
          <div className="min-w-0">
            <p className="text-sm font-medium text-ink mb-0.5">{t('title')}</p>
            <p className="text-sm text-ink-muted">
              {t('description')}{' '}
              <Link href="/pages/gizlilik-ve-cerez-politikasi" className="text-brand underline hover:no-underline font-medium">
                {t('cookieLink')}
              </Link>
              {' · '}
              <Link href="/pages/kvkk" className="text-brand underline hover:no-underline font-medium">
                {t('privacyLink')}
              </Link>
            </p>
          </div>
        </div>
        <div className="flex flex-col sm:flex-row gap-2 w-full sm:w-auto shrink-0">
          <Button
            type="button"
            variant="outline"
            size="sm"
            onClick={dismiss}
            className="rounded-lg border-palette text-ink w-full sm:w-auto min-h-[44px] touch-manipulation"
          >
            {t('essentialOnly')}
          </Button>
          <Button
            type="button"
            size="sm"
            onClick={accept}
            className="rounded-lg bg-brand hover:bg-brand-hover w-full sm:w-auto min-h-[44px] touch-manipulation"
          >
            {t('accept')}
          </Button>
        </div>
      </div>
    </div>
  )
}
