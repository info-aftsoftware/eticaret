'use client'

import React from 'react'
import { ChevronDown } from 'lucide-react'
import { useCurrencyStore } from '@/lib/store/useCurrencyStore'
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from './ui/dropdown-menu'
import { LanguageSwitcher } from './LanguageSwitcher'

const CURRENCIES = [
  { code: 'TRY' as const, label: 'TL' },
  { code: 'USD' as const, label: 'USD' },
  { code: 'EUR' as const, label: 'EUR' },
]

/** Dil ve para birimi seçimi (voltekno.com başlığında yer almadığı için footer'da). */
export function LocaleCurrencySwitcher() {
  const currency = useCurrencyStore((s) => s.currency)
  const setCurrency = useCurrencyStore((s) => s.setCurrency)

  return (
    <div className="flex items-center gap-4 text-xs text-slate-400 [&_button:hover]:text-white">
      <LanguageSwitcher />
      <span className="w-px h-3.5 bg-white/15" aria-hidden />
      <DropdownMenu>
        <DropdownMenuTrigger asChild>
          <button type="button" className="flex items-center gap-1 transition-colors" aria-label={`${CURRENCIES.find((c) => c.code === currency)?.label ?? 'TL'} — para birimi`}>
            {CURRENCIES.find((c) => c.code === currency)?.label ?? 'TL'}
            <ChevronDown className="w-3 h-3" />
          </button>
        </DropdownMenuTrigger>
        <DropdownMenuContent align="end" className="min-w-[90px] rounded-xl border-slate-200 shadow-xl bg-white">
          {CURRENCIES.map((c) => (
            <DropdownMenuItem key={c.code} onClick={() => setCurrency(c.code)} className="cursor-pointer rounded-lg text-sm">
              {c.label}
            </DropdownMenuItem>
          ))}
        </DropdownMenuContent>
      </DropdownMenu>
    </div>
  )
}
