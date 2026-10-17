'use client'

/**
 * Favoriler — tek kaynak (ürün kartı, ürün sayfası, favoriler sayfası ve profil aynı durumu görür).
 * Üye: Firestore users/{uid}/favorites. Misafir: localStorage; girişte üyenin listesine taşınır.
 */

import { useCallback, useEffect } from 'react'
import { create } from 'zustand'
import { getFavorites, addFavorite, removeFavorite } from '@/lib/firebase/firestore'
import { useAuthStore } from '@/lib/store/useAuthStore'

const GUEST_KEY = 'guest-favorites'

type FavoritesState = {
  ids: string[]
  uid: string | null
  /** Liste yüklendi (misafirde localStorage, üyede Firestore) */
  ready: boolean
}

const useFavoritesStore = create<FavoritesState>(() => ({ ids: [], uid: null, ready: false }))

function readGuest(): string[] {
  try {
    const parsed = JSON.parse(localStorage.getItem(GUEST_KEY) || '[]')
    return Array.isArray(parsed) ? parsed.filter((x): x is string => typeof x === 'string') : []
  } catch {
    return []
  }
}

function writeGuest(ids: string[]) {
  try {
    if (ids.length) localStorage.setItem(GUEST_KEY, JSON.stringify(ids))
    else localStorage.removeItem(GUEST_KEY)
  } catch {}
}

let syncedFor: string | null | undefined
let loadSeq = 0

/**
 * Oturum değişince listeyi yükler; girişte misafir favorilerini üyenin listesine ekler. Aynı uid için tekrar çalışmaz.
 * Firebase oturumu doğrulandıktan (authReady) sonra çağrılmalıdır.
 */
export async function handleFavoritesAuthChange(uid: string | null): Promise<void> {
  if (typeof window === 'undefined' || syncedFor === uid) return
  syncedFor = uid
  const seq = ++loadSeq
  if (!uid) {
    useFavoritesStore.setState({ ids: readGuest(), uid: null, ready: true })
    return
  }
  useFavoritesStore.setState({ ids: [], uid, ready: false })
  const remote = (await getFavorites(uid)).map((f) => f.productId)
  const guest = readGuest()
  const missing = guest.filter((id) => !remote.includes(id))
  const moved: string[] = []
  await Promise.all(
    missing.map((id) =>
      addFavorite(uid, id)
        .then(() => { moved.push(id) })
        .catch(() => {})
    )
  )
  // Taşınanlar misafir listesinden silinir (çıkıştan sonra başkasına görünmesin)
  writeGuest(guest.filter((id) => !remote.includes(id) && !moved.includes(id)))
  if (seq !== loadSeq) return
  useFavoritesStore.setState({ ids: [...moved, ...remote], uid, ready: true })
}

export function useFavorites() {
  const uid = useAuthStore((s) => (s.isAuthenticated && s.user?.id ? s.user.id : null))
  const authReady = useAuthStore((s) => s.authReady)
  const ids = useFavoritesStore((s) => s.ids)
  const ready = useFavoritesStore((s) => s.ready)

  // Firestore isteği Firebase oturumu doğrulandıktan sonra yapılır
  useEffect(() => {
    if (authReady) void handleFavoritesAuthChange(uid)
  }, [uid, authReady])

  const isFavorite = useCallback((productId: string) => ids.includes(productId), [ids])

  /** Favori durumunu değiştirir; yeni durumu döner. Kaydedilemezse eski duruma döner ve hata fırlatır. */
  const toggle = useCallback(
    async (productId: string): Promise<boolean> => {
      const before = useFavoritesStore.getState().ids
      const adding = !before.includes(productId)
      const next = adding ? [productId, ...before] : before.filter((id) => id !== productId)
      useFavoritesStore.setState({ ids: next })
      if (!uid) {
        writeGuest(next)
        return adding
      }
      try {
        if (adding) await addFavorite(uid, productId)
        else await removeFavorite(uid, productId)
        return adding
      } catch (e) {
        useFavoritesStore.setState({ ids: before })
        throw e
      }
    },
    [uid]
  )

  const remove = useCallback(
    async (productId: string) => {
      if (useFavoritesStore.getState().ids.includes(productId)) await toggle(productId)
    },
    [toggle]
  )

  return { ids, ready, isFavorite, toggle, remove, isMember: !!uid }
}
