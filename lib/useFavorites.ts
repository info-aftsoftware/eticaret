'use client'

/**
 * Favoriler — tek kaynak (ürün kartı, ürün sayfası, favoriler sayfası ve profil aynı durumu görür).
 * Yalnızca üyeler favori ekleyebilir (Firestore users/{uid}/favorites). Misafir favoriye dokununca giriş sayfasına
 * yönlendirilir; dokunduğu ürün sessionStorage'da bekler ve giriş/kayıttan sonra favorilerine eklenir.
 * Eski sürümden kalan misafir listesi (localStorage) girişte üyenin listesine taşınır.
 */

import { useCallback, useEffect } from 'react'
import { create } from 'zustand'
import { getFavorites, addFavorite, removeFavorite } from '@/lib/firebase/firestore'
import { useAuthStore } from '@/lib/store/useAuthStore'

const GUEST_KEY = 'guest-favorites'
const PENDING_KEY = 'favorite-after-login'

/** Misafirin dokunduğu ürünü girişten sonra eklemek üzere saklar ve giriş sayfasının adresini döner */
export function favoriteLoginHref(productId: string): string {
  try {
    sessionStorage.setItem(PENDING_KEY, productId)
  } catch {}
  const here = typeof window === 'undefined' ? '/' : `${window.location.pathname}${window.location.search}`
  return `/login?redirect=${encodeURIComponent(here)}&reason=favorite`
}

function takePending(): string | null {
  try {
    const id = sessionStorage.getItem(PENDING_KEY)
    sessionStorage.removeItem(PENDING_KEY)
    return id && /^[\w-]{1,200}$/.test(id) ? id : null
  } catch {
    return null
  }
}

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
    // Misafirde favori listesi yok (eski misafir listesi localStorage'da bekler, girişte hesaba taşınır)
    useFavoritesStore.setState({ ids: [], uid: null, ready: true })
    return
  }
  useFavoritesStore.setState({ ids: [], uid, ready: false })
  const remote = (await getFavorites(uid)).map((f) => f.productId)
  const guest = readGuest()
  const pending = takePending()
  const missing = [...new Set([...guest, ...(pending ? [pending] : [])])].filter((id) => !remote.includes(id))
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
      // Misafir favori ekleyemez: çağıran önce isMember'ı kontrol edip favoriteLoginHref ile girişe yönlendirir
      if (!uid) throw new Error('login-required')
      useFavoritesStore.setState({ ids: next })
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

  return { ids, ready, authReady, isFavorite, toggle, remove, isMember: !!uid }
}
