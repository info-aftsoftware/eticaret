'use client'

import React from 'react'
import Link from 'next/link'
import { Mail, Phone } from 'lucide-react'
import { SELLER } from '@/lib/legal/company'

/** Üst lacivert şerit — voltekno.com ile birebir: solda kurumsal linkler, sağda telefon ve e-posta. */
const TOP_LINKS = [
  { href: '/ges', label: 'Teklif Al', highlight: true },
  { href: '/siparis-takip', label: 'Sipariş Takibi' },
  { href: '/hakkimizda', label: 'Hakkımızda' },
  { href: '/faq', label: 'S.S.S.' },
  { href: '/contact', label: 'İletişim' },
]

const PHONE_DISPLAY = SELLER.phone.replace('+90 ', '0')

export function HeaderTopBar() {
  return (
    <div className="bg-[#0b2540]">
      <div className="flex items-center justify-between h-[38px] px-4 min-[541px]:px-6 max-w-[1454px] mx-auto text-xs leading-3 font-medium tracking-[0.12px]">
        <nav aria-label="Kurumsal" className="flex items-center gap-[22px] min-w-0">
          {TOP_LINKS.map((link) => (
            <Link
              key={link.href}
              href={link.href}
              className={`whitespace-nowrap !min-h-0 transition-colors ${link.highlight ? 'font-bold text-[#f4b400] hover:text-[#ffc933]' : 'hidden min-[901px]:inline text-[#cfdbe8] hover:text-white'}`}
            >
              {link.label}
            </Link>
          ))}
        </nav>
        <div className="flex items-center gap-[22px] shrink-0">
          <a href={SELLER.phoneHref} className="flex items-center gap-2 text-[#cfdbe8] hover:text-white transition-colors">
            <Phone className="w-[13px] h-[13px] text-[#f4b400]" aria-hidden />
            {PHONE_DISPLAY}
          </a>
          <a href={`mailto:${SELLER.email}`} className="hidden min-[901px]:flex items-center gap-2 text-[#cfdbe8] hover:text-white transition-colors">
            <Mail className="w-[13px] h-[13px] text-[#f4b400]" aria-hidden />
            {SELLER.email}
          </a>
        </div>
      </div>
    </div>
  )
}
