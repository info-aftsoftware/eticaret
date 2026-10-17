'use client'

import { useEffect } from 'react'
import { useCartStore, handleCartAuthChange, getCartOwner } from '@/lib/store/useCartStore'
import { useAuthStore, getAuthToken } from '@/lib/store/useAuthStore'
import { handleFavoritesAuthChange } from '@/lib/useFavorites'

const uidOf = (s: { isAuthenticated: boolean; user: { id: string } | null }) => (s.isAuthenticated && s.user?.id ? s.user.id : null)

/**
 * Oturum değişimini izler: girişte misafir sepeti/favorileri üye hesabına taşınır, çıkışta sepet boşalır.
 * Ayrıca giriş yapmış üyenin sepet özetini sunucuya gönderir (terk edilen sepet hatırlatması için):
 * sepet içeriği değiştikten 5 sn sonra tek istek; misafirlerde hiçbir şey göndermez.
 */
export function CartSync() {
  const isAuthenticated = useAuthStore((s) => s.isAuthenticated)

  useEffect(() => {
    // Abonelik senkron çalışır: sepet, oturum değişiminden sonraki ilk yazımdan önce doğru depoya taşınır
    // Sepet yüklendiği andaki oturumla şimdiki farklıysa (ör. oturum süresi dolmuş) önce o geçiş uygulanır
    let prevUid = uidOf(useAuthStore.getState())
    const owner = getCartOwner()
    if (owner !== prevUid && owner !== '') handleCartAuthChange(owner, prevUid)
    if (useAuthStore.getState().authReady) void handleFavoritesAuthChange(prevUid)
    return useAuthStore.subscribe((state) => {
      const uid = uidOf(state)
      if (state.authReady) void handleFavoritesAuthChange(uid)
      if (uid === prevUid) return
      const before = prevUid
      prevUid = uid
      handleCartAuthChange(before, uid)
    })
  }, [])

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
