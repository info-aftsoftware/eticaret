'use client'

/**
 * Favoriler — tek kaynak (ürün kartı, ürün sayfası, favoriler sayfası ve profil aynı durumu görür).
 * Favoriler her hesabın kendisine özeldir (Firestore users/{uid}/favorites). Misafir favoriye dokununca giriş sayfasına
 * yönlendirilir; yalnızca dokunduğu o ürün sessionStorage'da bekler ve giriş/kayıttan sonra favorilerine eklenir.
 * Eski sürümden tarayıcıda kalan misafir listesi (localStorage "guest-favorites") hiçbir hesaba taşınmaz, silinir:
 * aynı tarayıcıda açılan başka bir hesabın favorilerine karışıyordu.
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

function dropLegacyGuestList() {
  try {
    localStorage.removeItem(GUEST_KEY)
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
  dropLegacyGuestList()
  if (!uid) {
    // Misafirin favori listesi yoktur; çıkışta önceki hesabın listesi ekranda kalmaz
    useFavoritesStore.setState({ ids: [], uid: null, ready: true })
    return
  }
  useFavoritesStore.setState({ ids: [], uid, ready: false })
  const remote = (await getFavorites(uid)).map((f) => f.productId)
  // Yalnızca girişten hemen önce bu sekmede dokunulan ürün eklenir
  const pending = takePending()
  let added: string[] = []
  if (pending && !remote.includes(pending)) {
    added = await addFavorite(uid, pending).then(() => [pending]).catch(() => [])
  }
  if (seq !== loadSeq) return
  useFavoritesStore.setState({ ids: [...added, ...remote], uid, ready: true })
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
