/**
 * Cart Store — Static hosting uyumlu.
 * Backend API yok: localStorage persist kullanılır.
 * Giriş yapan kullanıcılar için localStorage'da 60 gün (kayıt sahibinin uid'siyle), misafirler için sessionStorage'da
 * (sekme kapanınca temizlenir; ödeme sağlayıcısından geri dönüşte sepet korunur).
 * Girişte misafir sepeti üye sepetiyle birleşir, çıkışta sepet boşalır (components/CartSync.tsx).
 */
import { create } from 'zustand'
import { persist, PersistStorage } from 'zustand/middleware'
import { cartItemToGa, trackAddToCart, trackRemoveFromCart } from '@/lib/analytics'

export interface CartItem {
  id: string
  name: string
  description?: string
  price: number
  quantity: number
  image?: string
  category?: string
  /** Katalog ürün id'si (varyantlar aynı ürünün stoğunu paylaşır) */
  productId?: string
  /** Ürünün bilinen stoğu: aynı ürünün tüm kalemlerinin toplam adedi bunu aşamaz */
  maxQuantity?: number
  /** Özel konfigürasyon / teklif kalemi işareti */
  isCustom?: boolean
  selectedVariant?: {
    key: string
    label: string
    price: number
  }
}

type PersistedCart = { items: CartItem[]; couponCode: string | null }

interface CartState {
  items: CartItem[]
  /** Sepette doğrulanan kupon kodu; ödeme sırasında sunucu tekrar doğrular */
  couponCode: string | null
  isLoading: boolean
  /** localStorage'dan sepet yüklendikten sonra true (boş sepet gösteriminde kullanılır) */
  _hasHydrated: boolean
  /** Eklenen adedi döner (stok sınırı nedeniyle istenenden az, hatta 0 olabilir) */
  addItem: (item: Omit<CartItem, 'quantity'> & { quantity?: number }) => number
  removeItem: (id: string) => void
  updateQuantity: (id: string, quantity: number) => void
  clearCart: () => void
  setCouponCode: (code: string | null) => void
  /** Sunucudan gelen güncel birim fiyatları uygular (kampanya / fiyat değişikliği) */
  syncPrices: (prices: Record<string, number>) => void
  /** Sunucudan gelen güncel stok bilgisini kalemlere yazar */
  syncStock: (stock: Record<string, { productId: string; stock?: number }>) => void
  getTotalPrice: () => number
  getTotalItems: () => number
  getItemQuantity: (id: string) => number
  /** Aynı ürünün (tüm varyantları) sepetteki toplam adedi */
  getProductQuantity: (productId: string) => number
  // API stub'ları — static hosting'de no-op
  loadCartFromServer: (token: string) => Promise<void>
  syncCartToServer: (token: string) => Promise<void>
}

const STORAGE_KEY = 'cart-storage'
const MEMBER_TTL_MS = 60 * 24 * 60 * 60 * 1000

/**
 * Sepetin sahibi (üye uid'si). İlk yüklemede kalıcı oturum bilgisinden (auth-storage) okunur,
 * sonra CartSync oturum değişince günceller. undefined = henüz okunmadı.
 */
let cartOwner: string | null | undefined

function persistedAuthUid(): string | null {
  if (typeof window === 'undefined') return null
  try {
    const parsed = JSON.parse(localStorage.getItem('auth-storage') || 'null')
    return parsed?.state?.isAuthenticated === true ? parsed?.state?.user?.id ?? '' : null
  } catch {
    return null
  }
}

function currentOwner(): string | null {
  if (cartOwner === undefined) cartOwner = persistedAuthUid()
  return cartOwner
}

/** Sepetin şu an ait olduğu üye (misafirse null) */
export function getCartOwner(): string | null {
  return typeof window === 'undefined' ? null : currentOwner()
}

/** Üyenin localStorage'daki kayıtlı sepetini okur (sahibi farklıysa veya süresi dolmuşsa null). */
function readMemberCart(uid: string): PersistedCart | null {
  try {
    const data = JSON.parse(localStorage.getItem(STORAGE_KEY) || 'null')
    if (!data?.state) return null
    if (data.expire && Date.now() > data.expire) return null
    if (data.owner && uid && data.owner !== uid) return null
    return { items: Array.isArray(data.state.items) ? data.state.items : [], couponCode: data.state.couponCode ?? null }
  } catch {
    return null
  }
}

const productKey = (i: Pick<CartItem, 'id' | 'productId'>) => i.productId ?? i.id

/** Ürünün stok sınırına göre kalemin alabileceği en fazla adet (sınır yoksa Infinity). */
function capFor(items: CartItem[], target: Pick<CartItem, 'id' | 'productId' | 'maxQuantity'>): number {
  const key = productKey(target)
  const max = target.maxQuantity ?? items.find((i) => productKey(i) === key && i.maxQuantity != null)?.maxQuantity
  if (max == null) return Infinity
  const others = items.filter((i) => productKey(i) === key && i.id !== target.id).reduce((n, i) => n + i.quantity, 0)
  return Math.max(0, max - others)
}

export const useCartStore = create<CartState>()(
  persist(
    (set, get) => ({
      items: [],
      couponCode: null,
      isLoading: false,
      _hasHydrated: false,

      addItem: (item) => {
        const items = get().items
        const existing = items.find((i) => i.id === item.id)
        const requested = Math.max(1, Math.floor(item.quantity ?? 1))
        const merged = { ...existing, ...item, maxQuantity: item.maxQuantity ?? existing?.maxQuantity }
        const cap = capFor(items, merged)
        const current = existing?.quantity ?? 0
        const qty = Math.min(requested, Math.max(0, cap - current))
        if (qty <= 0) return 0
        void trackAddToCart(cartItemToGa({ ...item, quantity: qty }))
        if (existing) {
          set((state) => ({
            items: state.items.map((i) => (i.id === item.id ? { ...i, ...item, maxQuantity: merged.maxQuantity, quantity: current + qty } : i)),
          }))
        } else {
          set((state) => ({ items: [...state.items, { ...item, quantity: qty }] }))
        }
        return qty
      },

      removeItem: (id) => {
        const removed = get().items.find((i) => i.id === id)
        if (removed) void trackRemoveFromCart(cartItemToGa(removed))
        set((state) => ({
          items: state.items.filter(i => i.id !== id)
        }))
      },

      updateQuantity: (id, quantity) => {
        if (quantity <= 0) {
          get().removeItem(id)
          return
        }
        const items = get().items
        const target = items.find((i) => i.id === id)
        if (!target) return
        const next = Math.max(1, Math.min(Math.floor(quantity), capFor(items, target)))
        if (next === target.quantity) return
        set((state) => ({
          items: state.items.map((i) => (i.id === id ? { ...i, quantity: next } : i)),
        }))
      },

      clearCart: () => set({ items: [], couponCode: null }),

      setCouponCode: (code) => set({ couponCode: code }),

      syncPrices: (prices) =>
        set((state) => ({
          items: state.items.map((i) => (prices[i.id] != null && prices[i.id] !== i.price ? { ...i, price: prices[i.id] } : i)),
        })),

      syncStock: (stock) =>
        set((state) => {
          let changed = false
          const items = state.items.map((i) => {
            const s = stock[i.id]
            if (!s) return i
            if (i.productId === s.productId && i.maxQuantity === s.stock) return i
            changed = true
            return { ...i, productId: s.productId, maxQuantity: s.stock }
          })
          return changed ? { items } : state
        }),

      getTotalPrice: () =>
        get().items.reduce((total, item) => total + item.price * item.quantity, 0),

      getTotalItems: () =>
        get().items.reduce((total, item) => total + item.quantity, 0),

      getItemQuantity: (id) => {
        const item = get().items.find(i => i.id === id)
        return item ? item.quantity : 0
      },

      getProductQuantity: (productId) =>
        get().items.filter((i) => productKey(i) === productId).reduce((n, i) => n + i.quantity, 0),

      // Static hosting: no-op stub'lar (geriye dönük uyumluluk için)
      loadCartFromServer: async (_token: string) => { /* no-op */ },
      syncCartToServer: async (_token: string) => { /* no-op */ },
    }),
    {
      name: STORAGE_KEY,
      partialize: (state) => ({ items: state.items, couponCode: state.couponCode }),
      storage: ({
        getItem: (name: string) => {
          if (typeof window === 'undefined') return null
          const owner = currentOwner()
          // Misafir: sekme oturumu boyunca sessionStorage
          if (owner === null) {
            try {
              const str = sessionStorage.getItem(name)
              const data = str ? JSON.parse(str) : null
              return data?.state ? { state: data.state, version: data.version || 0 } : null
            } catch {
              return null
            }
          }
          const member = readMemberCart(owner)
          return member ? { state: member, version: 0 } : null
        },
        setItem: (name: string, value: { state: PersistedCart; version?: number }): void => {
          if (typeof window === 'undefined') return
          const owner = currentOwner()
          // Giriş yapılmamışsa sepet yalnızca bu sekmede (sessionStorage) tutulur
          if (owner === null) {
            try {
              sessionStorage.setItem(name, JSON.stringify(value))
            } catch {}
            return
          }
          try {
            localStorage.setItem(name, JSON.stringify({ ...value, owner: owner || undefined, expire: Date.now() + MEMBER_TTL_MS }))
          } catch {}
        },
        removeItem: (name: string): void => {
          if (typeof window === 'undefined') return
          localStorage.removeItem(name)
          try {
            sessionStorage.removeItem(name)
          } catch {}
        },
      }) as PersistStorage<PersistedCart>,
    }
  )
)

// Depo senkron olduğu için yükleme create() sırasında biter; onRehydrateStorage içinden useCartStore'a
// erişilemediğinden (henüz tanımlı değil) işaret burada konur.
if (typeof window !== 'undefined') {
  const markHydrated = () => {
    if (!useCartStore.getState()._hasHydrated) useCartStore.setState({ _hasHydrated: true })
  }
  if (useCartStore.persist.hasHydrated()) markHydrated()
  useCartStore.persist.onFinishHydration(markHydrated)
}

/**
 * Oturum değişimi (CartSync çağırır):
 * - Giriş: misafir sepeti, üyenin bu cihazda kayıtlı sepetiyle birleşir ve üye sepeti olarak saklanır.
 * - Çıkış / hesap değişimi: görünen sepet boşalır (üyenin kayıtlı sepeti bir sonraki girişi için kalır).
 */
export function handleCartAuthChange(prevUid: string | null, nextUid: string | null) {
  if (typeof window === 'undefined' || prevUid === nextUid) return
  const state = useCartStore.getState()

  if (nextUid === null) {
    cartOwner = null
    useCartStore.setState({ items: [], couponCode: null })
    try {
      sessionStorage.removeItem(STORAGE_KEY)
    } catch {}
    return
  }

  // Hesap değişimi: önceki üyenin sepeti taşınmaz; misafirden girişte görünen sepet misafir sepetidir
  const guest: PersistedCart = prevUid === null ? { items: state.items, couponCode: state.couponCode } : { items: [], couponCode: null }
  const member = readMemberCart(nextUid) ?? { items: [], couponCode: null }
  cartOwner = nextUid

  const merged: CartItem[] = member.items.map((i) => ({ ...i }))
  for (const g of guest.items) {
    const existing = merged.find((i) => i.id === g.id)
    if (existing) {
      // Aynı kalem iki sepette de varsa büyük adet alınır (iki kez sayılmaz)
      existing.quantity = Math.max(existing.quantity, g.quantity)
      existing.price = g.price
      existing.maxQuantity = g.maxQuantity ?? existing.maxQuantity
      existing.productId = g.productId ?? existing.productId
    } else {
      merged.push({ ...g })
    }
  }
  // Stok sınırı bilinen ürünlerde toplam adet sınırı aşmasın
  const result: CartItem[] = []
  for (const item of merged) {
    const cap = capFor(result, item)
    const quantity = Math.min(item.quantity, cap)
    if (quantity > 0) result.push({ ...item, quantity })
  }

  useCartStore.setState({ items: result, couponCode: guest.couponCode ?? member.couponCode })
  try {
    sessionStorage.removeItem(STORAGE_KEY)
  } catch {}
}
