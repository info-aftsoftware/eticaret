'use client'

import React, { useEffect, useState } from 'react'
import { Truck } from 'lucide-react'
import { estimateDelivery, formatDeliveryRange, SHIPPING_CUTOFF_HOUR } from '@/lib/delivery-estimate'

/** Tahmini teslim tarihi satırı. Tarih istemcide hesaplanır (sunucu/istemci saat farkı hydration hatası vermesin). */
export function DeliveryEstimate({ className = '' }: { className?: string }) {
  const [text, setText] = useState<string | null>(null)
  useEffect(() => {
    const { from, to } = estimateDelivery()
    setText(formatDeliveryRange(from, to))
  }, [])
  if (!text) return null
  return (
    <p className={`flex items-start gap-2 text-sm text-slate-600 ${className}`}>
      <Truck className="w-4 h-4 mt-0.5 shrink-0 text-emerald-600" aria-hidden />
      <span>
        Tahmini teslimat: <strong className="font-semibold text-slate-900">{text}</strong>
        <span className="block text-xs text-slate-500">İş günü saat {SHIPPING_CUTOFF_HOUR}:00&apos;e kadar verilen siparişler aynı gün kargoda.</span>
      </span>
    </p>
  )
}
