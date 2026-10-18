'use client'

import React, { useEffect, useState } from 'react'
import { GitCompare } from 'lucide-react'
import { useCompareStore, COMPARE_MAX } from '@/lib/store/useCompareStore'
import { useToast } from '@/components/ui/toast'
import { useL } from '@/lib/i18n-inline'

/** Ürün sayfasında "Karşılaştır" düğmesi */
export function CompareButton({ productId, productName }: { productId: string; productName: string }) {
  const ids = useCompareStore((s) => s.ids)
  const toggle = useCompareStore((s) => s.toggle)
  const { addToast } = useToast()
  const L = useL()
  const [mounted, setMounted] = useState(false)
  useEffect(() => setMounted(true), [])
  const active = mounted && ids.includes(productId)

  return (
    <button
      type="button"
      aria-pressed={active}
      onClick={() => {
        const r = toggle(productId)
        if (r === 'full') {
          addToast({ type: 'error', title: L('Karşılaştırma listesi dolu', 'Comparison list is full'), description: L(`En fazla ${COMPARE_MAX} ürün karşılaştırabilirsiniz.`, `You can compare up to ${COMPARE_MAX} products.`) })
        } else {
          addToast({ type: 'success', title: r === 'added' ? L('Karşılaştırmaya eklendi', 'Added to comparison') : L('Karşılaştırmadan çıkarıldı', 'Removed from comparison'), description: productName })
        }
      }}
      aria-label={active ? L('Karşılaştırmada', 'In comparison') : L('Karşılaştır', 'Compare')}
      className={`inline-flex items-center gap-1.5 rounded-lg border px-3 py-2 text-sm font-medium transition-colors ${
        active ? 'border-brand bg-brand/10 text-brand' : 'border-slate-200 text-slate-700 hover:border-slate-300'
      }`}
    >
      <GitCompare className="w-4 h-4" aria-hidden />
      {/* Dar ekranda yalnızca simge; ad aria-label ile */}
      <span className="hidden min-[420px]:inline">{active ? L('Karşılaştırmada', 'In comparison') : L('Karşılaştır', 'Compare')}</span>
    </button>
  )
}
