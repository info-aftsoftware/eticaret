'use client'

import React from 'react'
import { AlertTriangle, Info } from 'lucide-react'
import { useCartStore } from '@/lib/store/useCartStore'
import { useCartQuote } from '@/lib/useCartQuote'

/** Sepet/ödeme: sunucuyla eşlenen fiyat değişikliği ve satılamayan ürün uyarıları. */
export function CartQuoteNotice() {
  const { pricesChanged, unavailable } = useCartQuote()
  const removeItem = useCartStore((s) => s.removeItem)
  if (!pricesChanged && unavailable.length === 0) return null
  return (
    <div className="space-y-2 mb-4">
      {pricesChanged && (
        <div role="status" className="flex items-start gap-2 rounded-lg border border-blue-200 bg-blue-50 p-3 text-sm text-blue-900">
          <Info className="w-4 h-4 mt-0.5 shrink-0" aria-hidden />
          Sepetinizdeki bazı ürünlerin fiyatı güncellendi (kampanya veya fiyat değişikliği). Tutarlar güncel fiyatlarla gösteriliyor.
        </div>
      )}
      {unavailable.map((u) => (
        <div key={u.id} role="alert" className="flex items-start gap-2 rounded-lg border border-red-200 bg-red-50 p-3 text-sm text-red-900">
          <AlertTriangle className="w-4 h-4 mt-0.5 shrink-0" aria-hidden />
          <span className="flex-1">{u.error}</span>
          <button type="button" onClick={() => removeItem(u.id)} className="shrink-0 font-medium underline">
            Sepetten çıkar
          </button>
        </div>
      ))}
    </div>
  )
}
