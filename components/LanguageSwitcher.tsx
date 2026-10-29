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
import { localizePath, stripLocale } from '@/lib/i18n/locale-path'

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
    // Dil adresten gelir: aynı sayfanın diğer dildeki adresine gidilir (/products ↔ /en/products). Çerez,
    // sayfadan yapılan API çağrıları için middleware'de de yazılır; burada hemen yazılması geçişte boşluk bırakmaz.
    document.cookie = `${LOCALE_COOKIE}=${newLocale};path=/;samesite=lax`
    // Tam sayfa geçişi: istemci yönlendirici önbelleğindeki sayfalar ve istemci durumu eski dilde kalmasın
    const { pathname, search, hash } = window.location
    window.location.assign(localizePath(stripLocale(pathname).path + search + hash, newLocale))
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
