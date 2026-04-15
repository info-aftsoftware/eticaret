/**
 * Cart Store — Static hosting uyumlu.
 * Backend API yok: localStorage persist kullanılır.
 * Giriş yapan kullanıcılar için 60 gün, misafirler için sekme kapanınca temizlenir.
 */
import { create } from 'zustand'
import { persist, PersistStorage } from 'zustand/middleware'

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
  isLoading: boolean
  /** localStorage'dan sepet yüklendikten sonra true (boş sepet gösteriminde kullanılır) */
  _hasHydrated: boolean
  addItem: (item: Omit<CartItem, 'quantity'> & { quantity?: number }) => void
  removeItem: (id: string) => void
  updateQuantity: (id: string, quantity: number) => void
  clearCart: () => void
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
      isLoading: false,
      _hasHydrated: false,

      addItem: (item) => {
        const qty = item.quantity ?? 1
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

      clearCart: () => set({ items: [] }),

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
      partialize: (state) => ({ items: state.items }),
      onRehydrateStorage: () => () => {
        useCartStore.setState({ _hasHydrated: true })
      },
      storage: ({
        getItem: (name: string) => {
          if (typeof window === 'undefined') return null
          // Giriş yapılmamışsa kayıtlı sepet yüklenmez — her seferinde boş başlar
          if (!isUserAuthenticated()) return null
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
          // Giriş yapılmamışsa sepet localStorage'a kaydedilmez
          if (!isUserAuthenticated()) return
          try {
            const expire = Date.now() + 60 * 24 * 60 * 60 * 1000 // 60 gün
            localStorage.setItem(name, JSON.stringify({ ...value, expire }))
          } catch {
            localStorage.setItem(name, JSON.stringify(value))
          }
        },
        removeItem: (name: string): void => {
          if (typeof window !== 'undefined') localStorage.removeItem(name)
        },
      }) as any,
    }
  )
)

