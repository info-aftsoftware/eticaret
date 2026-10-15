/**
 * Cart Store — Static hosting uyumlu.
 * Backend API yok: localStorage persist kullanılır.
 * Giriş yapan kullanıcılar için localStorage'da 60 gün, misafirler için sessionStorage'da
 * (sekme kapanınca temizlenir; ödeme sağlayıcısından geri dönüşte sepet korunur).
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
  /** Özel konfigürasyon / teklif kalemi işareti */
  isCustom?: boolean
  selectedVariant?: {
    key: string
    label: string
    price: number
  }
}

interface CartState {
  items: CartItem[]
  /** Sepette doğrulanan kupon kodu; ödeme sırasında sunucu tekrar doğrular */
  couponCode: string | null
  isLoading: boolean
  /** localStorage'dan sepet yüklendikten sonra true (boş sepet gösteriminde kullanılır) */
  _hasHydrated: boolean
  addItem: (item: Omit<CartItem, 'quantity'> & { quantity?: number }) => void
  removeItem: (id: string) => void
  updateQuantity: (id: string, quantity: number) => void
  clearCart: () => void
  setCouponCode: (code: string | null) => void
  /** Sunucudan gelen güncel birim fiyatları uygular (kampanya / fiyat değişikliği) */
  syncPrices: (prices: Record<string, number>) => void
  getTotalPrice: () => number
  getTotalItems: () => number
  getItemQuantity: (id: string) => number
  // API stub'ları — static hosting'de no-op
  loadCartFromServer: (token: string) => Promise<void>
  syncCartToServer: (token: string) => Promise<void>
}

function isUserAuthenticated(): boolean {
  if (typeof window === 'undefined') return false
  try {
    const authStorage = localStorage.getItem('auth-storage')
    if (!authStorage) return false
    const parsed = JSON.parse(authStorage)
    return parsed?.state?.isAuthenticated === true
  } catch {
    return false
  }
}

export const useCartStore = create<CartState>()(
  persist(
    (set, get) => ({
      items: [],
      couponCode: null,
      isLoading: false,
      _hasHydrated: false,

      addItem: (item) => {
        const qty = item.quantity ?? 1
        void trackAddToCart(cartItemToGa({ ...item, quantity: qty }))
        const existingItem = get().items.find(i => i.id === item.id)
        if (existingItem) {
          set((state) => ({
            items: state.items.map(i =>
              i.id === item.id ? { ...i, quantity: i.quantity + qty } : i
            )
          }))
        } else {
          set((state) => ({
            items: [...state.items, { ...item, quantity: qty }]
          }))
        }
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
        set((state) => ({
          items: state.items.map(i =>
            i.id === id ? { ...i, quantity } : i
          )
        }))
      },

      clearCart: () => set({ items: [], couponCode: null }),

      setCouponCode: (code) => set({ couponCode: code }),

      syncPrices: (prices) =>
        set((state) => ({
          items: state.items.map((i) => (prices[i.id] != null && prices[i.id] !== i.price ? { ...i, price: prices[i.id] } : i)),
        })),

      getTotalPrice: () =>
        get().items.reduce((total, item) => total + item.price * item.quantity, 0),

      getTotalItems: () =>
        get().items.reduce((total, item) => total + item.quantity, 0),

      getItemQuantity: (id) => {
        const item = get().items.find(i => i.id === id)
        return item ? item.quantity : 0
      },

      // Static hosting: no-op stub'lar (geriye dönük uyumluluk için)
      loadCartFromServer: async (_token: string) => { /* no-op */ },
      syncCartToServer: async (_token: string) => { /* no-op */ },
    }),
    {
      name: 'cart-storage',
      partialize: (state) => ({ items: state.items, couponCode: state.couponCode }),
      onRehydrateStorage: () => () => {
        useCartStore.setState({ _hasHydrated: true })
      },
      storage: ({
        getItem: (name: string) => {
          if (typeof window === 'undefined') return null
          // Misafir: sekme oturumu boyunca sessionStorage
          if (!isUserAuthenticated()) {
            try {
              const str = sessionStorage.getItem(name)
              const data = str ? JSON.parse(str) : null
              return data?.state ? { state: data.state, version: data.version || 0 } : null
            } catch {
              return null
            }
          }
          try {
            const str = localStorage.getItem(name)
            if (!str) return null
            const data = JSON.parse(str)
            if (data?.expire && Date.now() > data.expire) {
              localStorage.removeItem(name)
              return null
            }
            if (data?.state) {
              return { state: data.state, version: data.version || 0 }
            }
            return null
          } catch {
            localStorage.removeItem(name)
            return null
          }
        },
        setItem: (name: string, value: { state: any; version?: number }): void => {
          if (typeof window === 'undefined') return
          // Giriş yapılmamışsa sepet yalnızca bu sekmede (sessionStorage) tutulur
          if (!isUserAuthenticated()) {
            try {
              sessionStorage.setItem(name, JSON.stringify(value))
            } catch {}
            return
          }
          try {
            const expire = Date.now() + 60 * 24 * 60 * 60 * 1000 // 60 gün
            localStorage.setItem(name, JSON.stringify({ ...value, expire }))
          } catch {
            localStorage.setItem(name, JSON.stringify(value))
          }
        },
        removeItem: (name: string): void => {
          if (typeof window === 'undefined') return
          localStorage.removeItem(name)
          try {
            sessionStorage.removeItem(name)
          } catch {}
        },
      }) as any,
    }
  )
)

