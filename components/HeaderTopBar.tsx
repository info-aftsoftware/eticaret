'use client'

import React from 'react'
import Link from 'next/link'
import { Mail, Phone } from 'lucide-react'
import { SELLER } from '@/lib/legal/company'
import { useTranslations } from 'next-intl'

/** Üst ince şerit (açık zemin): solda kurumsal linkler, sağda telefon ve e-posta. */
const TOP_LINKS: { href: string; key: 'footer.gesTeklif' | 'footer.orderTracking' | 'footer.about' | 'headerTopBar.faq' | 'footer.contact'; highlight?: boolean }[] = [
  { href: '/ges', key: 'footer.gesTeklif', highlight: true },
  { href: '/siparis-takip', key: 'footer.orderTracking' },
  { href: '/hakkimizda', key: 'footer.about' },
  { href: '/faq', key: 'headerTopBar.faq' },
  { href: '/contact', key: 'footer.contact' },
]

const PHONE_DISPLAY = SELLER.phone.replace('+90 ', '0')

export function HeaderTopBar() {
  const t = useTranslations()
  return (
    <div className="bg-[#f5f7fa] border-b border-[#e6ebf1]">
      <div className="flex items-center justify-between h-[38px] px-4 min-[541px]:px-6 max-w-[1454px] mx-auto text-xs leading-3 font-medium tracking-[0.12px]">
        <nav aria-label="Kurumsal" className="flex items-center gap-[22px] min-w-0">
          {TOP_LINKS.map((link) => (
            <Link
              key={link.href}
              href={link.href}
              className={`whitespace-nowrap !min-h-0 transition-colors ${link.highlight ? 'font-bold text-[#0b2540] hover:text-[#12335a]' : 'hidden min-[901px]:inline text-[#3b4a5a] hover:text-[#0b2540]'}`}
            >
              {t(link.key)}
            </Link>
          ))}
        </nav>
        <div className="flex items-center gap-[22px] shrink-0">
          <a href={SELLER.phoneHref} className="flex items-center gap-2 text-[#3b4a5a] hover:text-[#0b2540] transition-colors">
            <Phone className="w-[13px] h-[13px] text-[#5d6e80]" aria-hidden />
            {PHONE_DISPLAY}
          </a>
          <a href={`mailto:${SELLER.email}`} className="hidden min-[901px]:flex items-center gap-2 text-[#3b4a5a] hover:text-[#0b2540] transition-colors">
            <Mail className="w-[13px] h-[13px] text-[#5d6e80]" aria-hidden />
            {SELLER.email}
          </a>
        </div>
      </div>
    </div>
  )
}
