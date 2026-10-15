'use client'

import { useEffect, useMemo, useState } from 'react'
import { useCartStore } from '@/lib/store/useCartStore'

type QuoteLine = { id: string; available: boolean; unitPrice?: number; campaign?: string | null; error?: string }

/**
 * Sepetteki fiyatları sunucuyla eşler (kampanya başlamış/bitmiş, fiyat değişmiş, ürün tükenmiş olabilir).
 * Fiyatı değişen kalemler güncellenir; satılamayan kalemler için uyarı döner.
 */
export function useCartQuote() {
  const items = useCartStore((s) => s.items)
  const hydrated = useCartStore((s) => s._hasHydrated)
  const syncPrices = useCartStore((s) => s.syncPrices)
  const [changed, setChanged] = useState(false)
  const [unavailable, setUnavailable] = useState<{ id: string; name: string; error: string }[]>([])
  const [campaigns, setCampaigns] = useState<Record<string, string>>({})

  // Yalnızca id/adet değişince sorgula (fiyat güncellemesi tekrar tetiklemesin)
  const key = useMemo(() => items.map((i) => `${i.id}:${i.quantity}`).join('|'), [items])

  useEffect(() => {
    if (!hydrated || !key) {
      setUnavailable([])
      return
    }
    const current = useCartStore.getState().items
    let cancelled = false
    fetch('/api/cart/quote', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ items: current.map((i) => ({ id: i.id, quantity: i.quantity })) }),
    })
      .then((r) => (r.ok ? r.json() : null))
      .then((data: { lines?: QuoteLine[] } | null) => {
        if (cancelled || !data?.lines) return
        const prices: Record<string, number> = {}
        const camp: Record<string, string> = {}
        let diff = false
        for (const l of data.lines) {
          if (!l.available || l.unitPrice == null) continue
          prices[l.id] = l.unitPrice
          if (l.campaign) camp[l.id] = l.campaign
          const item = current.find((i) => i.id === l.id)
          if (item && Math.abs(item.price - l.unitPrice) > 0.009) diff = true
        }
        if (diff) {
          syncPrices(prices)
          setChanged(true)
        }
        setCampaigns(camp)
        setUnavailable(
          data.lines
            .filter((l) => !l.available)
            .map((l) => ({ id: l.id, name: current.find((i) => i.id === l.id)?.name ?? l.id, error: l.error ?? 'Ürün şu anda satılamıyor.' }))
        )
      })
      .catch(() => {})
    return () => {
      cancelled = true
    }
  }, [hydrated, key, syncPrices])

  return { pricesChanged: changed, unavailable, campaigns }
}
