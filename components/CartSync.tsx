'use client'

import { useEffect } from 'react'
import { useCartStore } from '@/lib/store/useCartStore'
import { useAuthStore, getAuthToken } from '@/lib/store/useAuthStore'

/**
 * Giriş yapmış üyenin sepet özetini sunucuya gönderir (terk edilen sepet hatırlatması için).
 * Sepet içeriği değiştikten 5 sn sonra tek istek; misafirlerde hiçbir şey göndermez.
 */
export function CartSync() {
  const isAuthenticated = useAuthStore((s) => s.isAuthenticated)

  useEffect(() => {
    if (!isAuthenticated) return
    let timer: ReturnType<typeof setTimeout> | null = null
    let lastSent = ''
    const send = (items: { id: string; quantity: number }[]) => {
      const payload = JSON.stringify({ items: items.map((i) => ({ id: i.id, quantity: i.quantity })) })
      if (payload === lastSent) return
      if (timer) clearTimeout(timer)
      timer = setTimeout(async () => {
        const token = await getAuthToken()
        if (!token) return
        fetch('/api/cart-snapshot', {
          method: 'PUT',
          headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${token}` },
          body: payload,
          keepalive: true,
        })
          .then(() => { lastSent = payload })
          .catch(() => {})
      }, 5000)
    }
    const unsubscribe = useCartStore.subscribe((state, prev) => {
      if (state.items !== prev.items && state._hasHydrated) send(state.items)
    })
    return () => {
      unsubscribe()
      if (timer) clearTimeout(timer)
    }
  }, [isAuthenticated])

  return null
}
