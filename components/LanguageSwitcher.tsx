'use client'

import React from 'react'
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
  const locale = useLocale() as 'tr' | 'en'

  const [switching, setSwitching] = React.useState(false)

  const setLocale = (newLocale: 'tr' | 'en') => {
    if (newLocale === locale || switching) return
    setSwitching(true)
    document.cookie = `${LOCALE_COOKIE}=${newLocale};path=/;max-age=31536000;samesite=lax`
    // router.refresh() yalnızca o anki sayfanın sunucu bileşenlerini tazeliyordu: istemci yönlendirici
    // önbelleğindeki (önceden yüklenmiş) sayfalar ve istemci durumu eski dilde kalıyor, değişim geç
    // ve parça parça görünüyordu. Tam yeniden yükleme her şeyi tek seferde yeni dile geçirir.
    window.location.reload()
  }

  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <button
          type="button"
          className="flex items-center gap-1 hover:text-brand transition-colors text-inherit font-medium"
          aria-label={`${LOCALES.find((l) => l.code === locale)?.label ?? 'Türkçe'} — ${locale === 'en' ? 'choose language' : 'dil seçin'}`}
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
