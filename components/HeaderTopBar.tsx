'use client'

import React from 'react'
import Link from 'next/link'
import { ChevronDown, Mail, Phone } from 'lucide-react'
import { useCurrencyStore } from '@/lib/store/useCurrencyStore'
import { SELLER } from '@/lib/legal/company'
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

/** Üst lacivert şerit (voltekno.com yapısı): solda kurumsal linkler, sağda iletişim + dil/para birimi. */
const TOP_LINKS = [
  { href: '/ges', label: 'Teklif Al', highlight: true },
  { href: '/siparis-takip', label: 'Sipariş Takibi' },
  { href: '/hakkimizda', label: 'Hakkımızda' },
  { href: '/faq', label: 'S.S.S.' },
  { href: '/blog', label: 'Blog' },
  { href: '/contact', label: 'İletişim' },
]

export function HeaderTopBar() {
  const currency = useCurrencyStore((s) => s.currency)
  const setCurrency = useCurrencyStore((s) => s.setCurrency)

  return (
    <div className="bg-brand text-white">
      <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
        <div className="flex items-center justify-between h-9 text-xs font-medium gap-4">
          <nav aria-label="Kurumsal" className="flex items-center gap-4 lg:gap-5 min-w-0">
            {TOP_LINKS.map((link) => (
              <Link
                key={link.href}
                href={link.href}
                className={`whitespace-nowrap transition-colors ${link.highlight ? 'text-amber-300 hover:text-amber-200 font-semibold' : 'text-white/80 hover:text-white'}`}
              >
                {link.label}
              </Link>
            ))}
          </nav>

          <div className="flex items-center gap-4 shrink-0">
            <a href={SELLER.phoneHref} className="hidden lg:flex items-center gap-1.5 text-white/80 hover:text-white transition-colors">
              <Phone className="w-3.5 h-3.5" aria-hidden />
              {SELLER.phone.replace('+90 ', '0')}
            </a>
            <a href={`mailto:${SELLER.email}`} className="hidden xl:flex items-center gap-1.5 text-white/80 hover:text-white transition-colors">
              <Mail className="w-3.5 h-3.5" aria-hidden />
              {SELLER.email}
            </a>
            <span className="hidden lg:block w-px h-3.5 bg-white/20" aria-hidden />
            <div className="[&_button]:text-white/80 [&_button:hover]:text-white">
              <LanguageSwitcher />
            </div>
            <span className="w-px h-3.5 bg-white/20" aria-hidden />
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <button
                  type="button"
                  className="flex items-center gap-1 text-white/80 hover:text-white transition-colors"
                  aria-label="Para birimi"
                >
                  {CURRENCIES.find((c) => c.code === currency)?.label ?? 'TL'}
                  <ChevronDown className="w-3 h-3" />
                </button>
              </DropdownMenuTrigger>
              <DropdownMenuContent align="end" className="min-w-[90px] rounded-xl border-slate-200 shadow-xl bg-white">
                {CURRENCIES.map((c) => (
                  <DropdownMenuItem
                    key={c.code}
                    onClick={() => setCurrency(c.code)}
                    className="cursor-pointer rounded-lg text-sm"
                  >
                    {c.label}
                  </DropdownMenuItem>
                ))}
              </DropdownMenuContent>
            </DropdownMenu>
          </div>
        </div>
      </div>
    </div>
  )
}
