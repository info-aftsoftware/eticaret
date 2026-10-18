'use client'

import React from 'react'
import { useRouter } from 'next/navigation'
import { useLocale } from 'next-intl'
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu'
import { ChevronDown } from 'lucide-react'

const LOCALE_COOKIE = 'NEXT_LOCALE'

const LOCALES = [
  { code: 'tr' as const, label: 'Türkçe' },
  { code: 'en' as const, label: 'English' },
]

export function LanguageSwitcher() {
  const router = useRouter()
  const locale = useLocale() as 'tr' | 'en'

  const setLocale = (newLocale: 'tr' | 'en') => {
    if (newLocale === locale) return
    document.cookie = `${LOCALE_COOKIE}=${newLocale};path=/;max-age=31536000`
    router.refresh()
  }

  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <button
          type="button"
          className="flex items-center gap-1 hover:text-brand transition-colors text-inherit font-medium"
          aria-label={`${LOCALES.find((l) => l.code === locale)?.label ?? 'Türkçe'} — dil seçin`}
        >
          {LOCALES.find((l) => l.code === locale)?.label ?? 'Türkçe'}
          <ChevronDown className="w-3 h-3" />
        </button>
      </DropdownMenuTrigger>
      <DropdownMenuContent align="start" className="min-w-[120px]">
        {LOCALES.map((l) => (
          <DropdownMenuItem
            key={l.code}
            onClick={() => setLocale(l.code)}
            className="cursor-pointer"
          >
            {l.label}
          </DropdownMenuItem>
        ))}
      </DropdownMenuContent>
    </DropdownMenu>
  )
}
