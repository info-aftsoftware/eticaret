'use client'

import React, { useEffect, useState } from 'react'
import Link from 'next/link'
import { usePathname } from 'next/navigation'
import { GitCompare, X } from 'lucide-react'
import { useCompareStore } from '@/lib/store/useCompareStore'
import { useL } from '@/lib/i18n-inline'

/** Sayfa altında karşılaştırma listesi çubuğu (1+ ürün varken; karşılaştırma ve ödeme sayfalarında gizli). */
export function CompareBar() {
  const ids = useCompareStore((s) => s.ids)
  const clear = useCompareStore((s) => s.clear)
  const pathname = usePathname()
  const L = useL()
  const [mounted, setMounted] = useState(false)
  useEffect(() => setMounted(true), [])

  if (!mounted || ids.length === 0) return null
  if (pathname?.startsWith('/karsilastir') || pathname?.startsWith('/checkout') || pathname?.startsWith('/admin')) return null

  return (
    <div className="fixed bottom-4 left-1/2 -translate-x-1/2 z-40 flex items-center gap-2 rounded-full bg-white text-[#121926] border border-[#d3d9e1] shadow-lg px-2 py-1.5 pl-4 max-w-[calc(100vw-2rem)]">
      <GitCompare className="w-4 h-4 shrink-0" aria-hidden />
      <span className="text-sm whitespace-nowrap">{L(`${ids.length} ürün`, `${ids.length} ${ids.length === 1 ? 'product' : 'products'}`)}</span>
      <Link href="/karsilastir" className="rounded-full bg-[#0b2540] text-white text-sm font-semibold px-3 py-1.5 hover:bg-[#12335a] whitespace-nowrap">
        {L('Karşılaştır', 'Compare')}
      </Link>
      <button type="button" onClick={clear} aria-label={L('Karşılaştırma listesini temizle', 'Clear comparison list')} className="p-1.5 rounded-full text-[#5d6e80] hover:bg-[#f1f4f8]">
        <X className="w-4 h-4" />
      </button>
    </div>
  )
}
