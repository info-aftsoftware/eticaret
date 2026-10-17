'use client'

/**
 * Canlı bildirimler: /api/admin/live uç noktasını 30 sn'de bir yoklar (sekme görünürken).
 * Menü rozetleri, yeni sipariş / havale bildirimi toast'ı, isteğe bağlı ses ve sekme başlığında sayı.
 */

import React, { createContext, useCallback, useContext, useEffect, useRef, useState } from 'react'
import { fmtTRY } from '@/lib/format'
import { useToast } from './toast'

export type LiveCounts = {
  awaitingPayment: number
  toPrepare: number
  picking: number
  ordersAction: number
  paymentNotices: number
  openReturns: number
  cancelRequests: number
  pendingReviews: number
  pendingQuestions: number
}

type LiveApi = {
  counts: LiveCounts | null
  refresh: () => void
  soundOn: boolean
  setSoundOn: (v: boolean) => void
  /** Son yoklamada yeni bir şey geldiğinde artar (sayfalar listeyi yenilemek için dinleyebilir) */
  tick: number
}

const LiveContext = createContext<LiveApi>({ counts: null, refresh: () => {}, soundOn: false, setSoundOn: () => {}, tick: 0 })
export const useAdminLive = () => useContext(LiveContext)

const POLL_MS = 30_000
const SINCE_KEY = 'admin-live-since'
const SOUND_KEY = 'admin-live-sound'

function readLS(key: string): string | null {
  try {
    return localStorage.getItem(key)
  } catch {
    return null
  }
}
function writeLS(key: string, value: string) {
  try {
    localStorage.setItem(key, value)
  } catch {
    /* gizli pencere vb. */
  }
}

/** Kısa iki tonlu bildirim sesi (dosya gerektirmez) */
function chime() {
  try {
    const Ctx = window.AudioContext || (window as unknown as { webkitAudioContext: typeof AudioContext }).webkitAudioContext
    const ctx = new Ctx()
    const tone = (freq: number, start: number) => {
      const osc = ctx.createOscillator()
      const gain = ctx.createGain()
      osc.type = 'sine'
      osc.frequency.value = freq
      gain.gain.setValueAtTime(0.0001, ctx.currentTime + start)
      gain.gain.exponentialRampToValueAtTime(0.18, ctx.currentTime + start + 0.02)
      gain.gain.exponentialRampToValueAtTime(0.0001, ctx.currentTime + start + 0.35)
      osc.connect(gain).connect(ctx.destination)
      osc.start(ctx.currentTime + start)
      osc.stop(ctx.currentTime + start + 0.4)
    }
    tone(880, 0)
    tone(1320, 0.18)
    setTimeout(() => ctx.close().catch(() => {}), 1000)
  } catch {
    /* ses desteklenmiyor */
  }
}

export function AdminLiveProvider({ children }: { children: React.ReactNode }) {
  const toast = useToast()
  const [counts, setCounts] = useState<LiveCounts | null>(null)
  const [soundOn, setSoundOnState] = useState(false)
  const [tick, setTick] = useState(0)
  const sinceRef = useRef<string | null>(null)
  const soundRef = useRef(false)
  const baseTitle = useRef<string>('')
  const inflight = useRef(false)

  useEffect(() => {
    const s = readLS(SOUND_KEY) === '1'
    setSoundOnState(s)
    soundRef.current = s
    // İlk açılışta geçmiş siparişler için toast gösterme; son 10 dakikadan eskiyse "şimdi"den başla
    const stored = readLS(SINCE_KEY)
    const tenMin = Date.now() - 10 * 60_000
    sinceRef.current = stored && new Date(stored).getTime() > tenMin ? stored : new Date().toISOString()
  }, [])

  const setSoundOn = useCallback((v: boolean) => {
    setSoundOnState(v)
    soundRef.current = v
    writeLS(SOUND_KEY, v ? '1' : '0')
    if (v) chime()
  }, [])

  const poll = useCallback(async () => {
    if (inflight.current) return
    inflight.current = true
    try {
      const since = sinceRef.current ?? new Date().toISOString()
      const res = await fetch(`/api/admin/live?since=${encodeURIComponent(since)}`, { credentials: 'include', cache: 'no-store' })
      if (!res.ok) return
      const data: {
        now: string
        counts: LiveCounts
        newOrders: { id: string; orderNo: string; name: string; total: number; paymentMethod: string | null }[]
        newPaymentNotices: { id: string; orderId: string; orderNo: string }[]
        newCancelRequests?: { id: string; orderId: string; orderNo: string }[]
      } = await res.json()
      setCounts(data.counts)
      sinceRef.current = data.now
      writeLS(SINCE_KEY, data.now)
      const cancels = data.newCancelRequests ?? []
      const fresh = data.newOrders.length + data.newPaymentNotices.length + cancels.length
      if (fresh > 0) {
        for (const o of data.newOrders.slice(0, 3)) {
          toast.info(
            'Yeni sipariş',
            `${o.orderNo} · ${o.name} · ${fmtTRY(o.total)}${o.paymentMethod === 'bank_transfer' ? ' · havale bekleniyor' : ''}`,
            `/admin/orders/${o.id}`
          )
        }
        for (const n of data.newPaymentNotices.slice(0, 3)) {
          toast.info('Havale bildirimi', `${n.orderNo} için müşteri ödeme yaptığını bildirdi.`, `/admin/orders/${n.orderId}`)
        }
        for (const c of cancels.slice(0, 3)) {
          toast.info('İptal talebi', `${c.orderNo} için müşteri iptal talep etti.`, `/admin/orders/${c.orderId}`)
        }
        if (soundRef.current) chime()
        setTick((t) => t + 1)
      }
    } catch {
      /* ağ hatası: bir sonraki turda tekrar denenir */
    } finally {
      inflight.current = false
    }
  }, [toast])

  useEffect(() => {
    poll()
    const id = setInterval(() => {
      if (document.visibilityState === 'visible') poll()
    }, POLL_MS)
    const onVisible = () => document.visibilityState === 'visible' && poll()
    document.addEventListener('visibilitychange', onVisible)
    return () => {
      clearInterval(id)
      document.removeEventListener('visibilitychange', onVisible)
    }
  }, [poll])

  // Sekme başlığında işlem bekleyen iş sayısı
  useEffect(() => {
    if (!counts) return
    const total = counts.ordersAction + counts.pendingReviews + counts.pendingQuestions
    const strip = (t: string) => t.replace(/^\(\d+\+?\)\s*/, '')
    const apply = () => {
      baseTitle.current = strip(document.title)
      const next = total > 0 ? `(${total > 99 ? '99+' : total}) ${baseTitle.current}` : baseTitle.current
      if (document.title !== next) document.title = next
    }
    apply()
    // Sayfa geçişlerinde Next başlığı yeniden yazar — başlık değişince sayıyı tekrar ekle
    const el = document.querySelector('title')
    if (!el) return
    const obs = new MutationObserver(() => {
      if (!/^\(\d+\+?\)\s/.test(document.title) && total > 0) apply()
    })
    obs.observe(el, { childList: true, characterData: true, subtree: true })
    return () => obs.disconnect()
  }, [counts])

  return <LiveContext.Provider value={{ counts, refresh: poll, soundOn, setSoundOn, tick }}>{children}</LiveContext.Provider>
}
