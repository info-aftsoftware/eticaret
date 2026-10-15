'use client'

import React, { useEffect, useRef } from 'react'

/**
 * Cloudflare Turnstile bot koruması (çoğu kullanıcı için görünmez/tek tık).
 * NEXT_PUBLIC_TURNSTILE_SITE_KEY yoksa hiçbir şey göstermez; onToken(null) ile form engellenmez.
 * Sunucu doğrulaması: lib/turnstile.ts
 */

declare global {
  interface Window {
    turnstile?: {
      render: (el: HTMLElement, opts: Record<string, unknown>) => string
      reset: (id?: string) => void
      remove: (id: string) => void
    }
  }
}

const SITE_KEY = process.env.NEXT_PUBLIC_TURNSTILE_SITE_KEY
const SCRIPT_SRC = 'https://challenges.cloudflare.com/turnstile/v0/api.js?render=explicit'
let scriptPromise: Promise<void> | null = null

function loadScript(): Promise<void> {
  if (window.turnstile) return Promise.resolve()
  if (!scriptPromise) {
    scriptPromise = new Promise((resolve, reject) => {
      const s = document.createElement('script')
      s.src = SCRIPT_SRC
      s.async = true
      s.defer = true
      s.onload = () => resolve()
      s.onerror = () => reject(new Error('Turnstile yüklenemedi'))
      document.head.appendChild(s)
    })
  }
  return scriptPromise
}

export const turnstileEnabled = !!SITE_KEY

export function Turnstile({ onToken, resetKey }: { onToken: (token: string | null) => void; resetKey?: number }) {
  const ref = useRef<HTMLDivElement>(null)
  const widgetId = useRef<string | null>(null)

  useEffect(() => {
    if (!SITE_KEY || !ref.current) return
    let cancelled = false
    loadScript()
      .then(() => {
        if (cancelled || !ref.current || !window.turnstile) return
        widgetId.current = window.turnstile.render(ref.current, {
          sitekey: SITE_KEY,
          language: 'tr',
          appearance: 'interaction-only',
          callback: (t: string) => onToken(t),
          'expired-callback': () => onToken(null),
          'error-callback': () => onToken(null),
        })
      })
      .catch(() => onToken(null))
    return () => {
      cancelled = true
      if (widgetId.current && window.turnstile) window.turnstile.remove(widgetId.current)
      widgetId.current = null
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [resetKey])

  if (!SITE_KEY) return null
  return <div ref={ref} className="min-h-0" />
}
