'use client'

import React, { createContext, useContext, useEffect, useState } from 'react'
import { ALL_CATEGORY_VALUES } from '@/lib/categories'

/** Ürünü olan kategori değerleri (product.category). null = henüz yüklenmedi. */
type CategoriesWithProductsContextValue = Set<string> | null

const CategoriesWithProductsContext = createContext<CategoriesWithProductsContextValue>(null)
/** Kategori başına ürün sayısı (header açılır menüsü). null = yüklenmedi veya statik yedekte sayı yok. */
const CategoryCountsContext = createContext<Record<string, number> | null>(null)

export function useCategoryCounts(): Record<string, number> | null {
  return useContext(CategoryCountsContext)
}

export function useCategoriesWithProducts(): CategoriesWithProductsContextValue {
  return useContext(CategoriesWithProductsContext)
}

function parseCategoryResponse(data: unknown): string[] {
  if (data && typeof data === 'object' && 'categoryValues' in data) {
    const arr = (data as { categoryValues?: unknown }).categoryValues
    return Array.isArray(arr) ? arr.filter((v): v is string => typeof v === 'string') : []
  }
  return []
}

export function CategoriesWithProductsProvider({ children }: { children: React.ReactNode }) {
  const [set, setSet] = useState<Set<string> | null>(null)
  const [counts, setCounts] = useState<Record<string, number> | null>(null)

  useEffect(() => {
    let cancelled = false
    const fallbackAll = () => {
      if (!cancelled) setSet(new Set(ALL_CATEGORY_VALUES))
    }

    fetch('/api/categories-with-products')
      .then((res) => {
        if (cancelled) return
        if (res.ok) return res.json()
        return Promise.reject(new Error('API not available'))
      })
      .then((data) => {
        if (cancelled) return
        const arr = parseCategoryResponse(data)
        setSet(arr.length > 0 ? new Set(arr) : new Set(ALL_CATEGORY_VALUES))
        const c = data && typeof data === 'object' ? (data as { counts?: unknown }).counts : null
        if (c && typeof c === 'object') setCounts(c as Record<string, number>)
      })
      .catch(() => {
        if (cancelled) return
        fallbackAll()
        fetch('/data/categories-with-products.json')
          .then((r) => (r.ok ? r.json() : Promise.reject(new Error('no static data'))))
          .then((data) => {
            if (cancelled) return
            const arr = parseCategoryResponse(data)
            if (arr.length > 0) setSet(new Set(arr))
          })
          .catch(() => {})
      })
    return () => { cancelled = true }
  }, [])

  return (
    <CategoriesWithProductsContext.Provider value={set}>
      <CategoryCountsContext.Provider value={counts}>{children}</CategoryCountsContext.Provider>
    </CategoriesWithProductsContext.Provider>
  )
}
