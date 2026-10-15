/**
 * Ürün karşılaştırma listesi (tarayıcıda saklanır, en fazla 4 ürün).
 */
import { create } from 'zustand'
import { persist } from 'zustand/middleware'

export const COMPARE_MAX = 4

type CompareState = {
  ids: string[]
  toggle: (id: string) => 'added' | 'removed' | 'full'
  remove: (id: string) => void
  clear: () => void
}

export const useCompareStore = create<CompareState>()(
  persist(
    (set, get) => ({
      ids: [],
      toggle: (id) => {
        const ids = get().ids
        if (ids.includes(id)) {
          set({ ids: ids.filter((x) => x !== id) })
          return 'removed'
        }
        if (ids.length >= COMPARE_MAX) return 'full'
        set({ ids: [...ids, id] })
        return 'added'
      },
      remove: (id) => set({ ids: get().ids.filter((x) => x !== id) }),
      clear: () => set({ ids: [] }),
    }),
    { name: 'compare-storage' }
  )
)
