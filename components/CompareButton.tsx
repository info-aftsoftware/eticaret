'use client'

import React, { useEffect, useState } from 'react'
import { GitCompare } from 'lucide-react'
import { useCompareStore, COMPARE_MAX } from '@/lib/store/useCompareStore'
import { useToast } from '@/components/ui/toast'

/** Ürün sayfasında "Karşılaştır" düğmesi */
export function CompareButton({ productId, productName }: { productId: string; productName: string }) {
  const ids = useCompareStore((s) => s.ids)
  const toggle = useCompareStore((s) => s.toggle)
  const { addToast } = useToast()
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
          addToast({ type: 'error', title: 'Karşılaştırma listesi dolu', description: `En fazla ${COMPARE_MAX} ürün karşılaştırabilirsiniz.` })
        } else {
          addToast({ type: 'success', title: r === 'added' ? 'Karşılaştırmaya eklendi' : 'Karşılaştırmadan çıkarıldı', description: productName })
        }
      }}
      className={`inline-flex items-center gap-1.5 rounded-lg border px-3 py-2 text-sm font-medium transition-colors ${
        active ? 'border-brand bg-brand/10 text-brand' : 'border-slate-200 text-slate-700 hover:border-slate-300'
      }`}
    >
      <GitCompare className="w-4 h-4" aria-hidden />
      {active ? 'Karşılaştırmada' : 'Karşılaştır'}
    </button>
  )
}
