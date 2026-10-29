'use client'

import React, { useEffect, useState } from 'react'
import { Truck } from 'lucide-react'
import { useLocale } from 'next-intl'
import { estimateDelivery, formatDeliveryRange } from '@/lib/delivery-estimate'

/**
 * Tahmini teslim tarihi. Tarih istemcide hesaplanır (sunucu/istemci saat farkı hydration hatası vermesin).
 * compact: yalnızca tarih aralığı (ürün sayfasındaki bilgi tablosu için; etiket tabloda).
 */
export function DeliveryEstimate({ className = '', compact = false }: { className?: string; compact?: boolean }) {
  const locale = useLocale() === 'en' ? 'en' : 'tr'
  const [text, setText] = useState<string | null>(null)
  useEffect(() => {
    const { from, to } = estimateDelivery()
    setText(formatDeliveryRange(from, to, locale))
  }, [locale])
  if (!text) return compact ? <span className="text-[#8a99a8]">—</span> : null
  if (compact) return <span className={`font-medium text-[#121926] ${className}`}>{text}</span>
  return (
    <p className={`flex items-start gap-2 text-sm text-slate-600 ${className}`}>
      <Truck className="w-4 h-4 mt-0.5 shrink-0 text-emerald-600" aria-hidden />
      <span>
        {locale === 'en' ? 'Estimated delivery' : 'Tahmini teslimat'}: <strong className="font-semibold text-slate-900">{text}</strong>
      </span>
    </p>
  )
}
