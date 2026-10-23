'use client'

import { useEffect, useMemo, useState } from 'react'
import { useCartStore } from '@/lib/store/useCartStore'
import type { LineLogisticsOverride } from '@/lib/shipping/fee'

export type CartLineStatus = {
  available: boolean
  error?: string
  unitPrice?: number
  productId?: string
  stockKey?: string
  logistics?: LineLogisticsOverride
  stock?: number
  campaign?: string | null
  /** Doğrulamanın yapıldığı adet */
  quantity?: number
}

/**
 * Sepet sayfası: kalemleri sunucuyla doğrular (/api/cart/quote). Güncel fiyat ve stok sepete yazılır;
 * kalem bazında durum (satılamıyor / stok aşımı / fiyat değişti) döner.
 */
export function useCartValidation() {
  const items = useCartStore((s) => s.items)
  const hydrated = useCartStore((s) => s._hasHydrated)
  const [status, setStatus] = useState<Record<string, CartLineStatus>>({})
  const [priceChanges, setPriceChanges] = useState<Record<string, { from: number; to: number }>>({})
  const [checked, setChecked] = useState(false)

  const key = useMemo(() => items.map((i) => `${i.id}:${i.quantity}`).join('|'), [items])

  useEffect(() => {
    if (!hydrated) return
    if (!key) {
      setStatus({})
      setChecked(true)
      return
    }
    const current = useCartStore.getState().items
    let cancelled = false
    const timer = setTimeout(() => {
      fetch('/api/cart/quote', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ items: current.map((i) => ({ id: i.id, quantity: i.quantity })) }),
      })
        .then((r) => (r.ok ? r.json() : null))
        .then((data: { lines?: (CartLineStatus & { id: string })[] } | null) => {
          if (cancelled || !data?.lines) return
          const next: Record<string, CartLineStatus> = {}
          const prices: Record<string, number> = {}
          const stock: Record<string, { productId: string; stockKey?: string; stock?: number; logistics?: LineLogisticsOverride }> = {}
          const changes: Record<string, { from: number; to: number }> = {}
          for (const l of data.lines) {
            const item = current.find((i) => i.id === l.id)
            next[l.id] = { ...l, quantity: item?.quantity }
            if (l.unitPrice != null) {
              prices[l.id] = l.unitPrice
              if (item && Math.abs(item.price - l.unitPrice) > 0.009) changes[l.id] = { from: item.price, to: l.unitPrice }
            }
            if (l.productId) stock[l.id] = { productId: l.productId, stockKey: l.stockKey, stock: l.stock, logistics: l.logistics }
          }
          const store = useCartStore.getState()
          if (Object.keys(changes).length) {
            store.syncPrices(prices)
            setPriceChanges((prev) => ({ ...prev, ...changes }))
          }
          store.syncStock(stock)
          setStatus(next)
          setChecked(true)
        })
        .catch(() => setChecked(true))
    }, 250)
    return () => {
      cancelled = true
      clearTimeout(timer)
    }
  }, [hydrated, key])

  // Adedi değişmiş kalemin eski uyarısı gösterilmez (yeni doğrulama gelene kadar)
  const fresh = useMemo(() => {
    const out: Record<string, CartLineStatus> = {}
    for (const i of items) {
      const st = status[i.id]
      if (!st) continue
      const stale = st.quantity !== i.quantity && !st.available && st.unitPrice != null
      out[i.id] = stale ? { ...st, available: true, error: undefined } : st
    }
    return out
  }, [items, status])
  const blocking = items.filter((i) => fresh[i.id] && !fresh[i.id].available)
  return { status: fresh, priceChanges, checked, blocking }
}
