'use client'

import { useEffect } from 'react'

/** Aynı sayfa yüklemesinde gönderilen en fazla hata ve tekrar edenleri ayıklamak için */
const MAX_PER_PAGE = 5
const sent = new Set<string>()

/** Hata kaydına gönderir (sendBeacon: sayfa kapanırken de gider; çerez/kişisel veri yok) */
export function reportClientError(kind: string, message: string, stack?: string) {
  if (typeof window === 'undefined' || !message) return
  const key = `${kind}|${message}`
  if (sent.has(key) || sent.size >= MAX_PER_PAGE) return
  sent.add(key)
  const body = JSON.stringify({ kind, message: message.slice(0, 500), stack: stack?.slice(0, 4000), url: window.location.href })
  try {
    if (navigator.sendBeacon) navigator.sendBeacon('/api/client-errors', new Blob([body], { type: 'application/json' }))
    else void fetch('/api/client-errors', { method: 'POST', body, keepalive: true, headers: { 'Content-Type': 'application/json' } })
  } catch {}
}

/** Yakalanmamış tarayıcı hatalarını Yönetim > Sistem Durumu'na raporlar */
export function ClientErrorReporter() {
  useEffect(() => {
    const onError = (e: ErrorEvent) => reportClientError('tarayıcı', e.message || String(e.error), e.error?.stack)
    const onRejection = (e: PromiseRejectionEvent) => {
      const r = e.reason
      reportClientError('tarayıcı (promise)', r instanceof Error ? r.message : String(r), r instanceof Error ? r.stack : undefined)
    }
    window.addEventListener('error', onError)
    window.addEventListener('unhandledrejection', onRejection)
    return () => {
      window.removeEventListener('error', onError)
      window.removeEventListener('unhandledrejection', onRejection)
    }
  }, [])
  return null
}
