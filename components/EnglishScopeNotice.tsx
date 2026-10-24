'use client'

import { usePathname } from 'next/navigation'
import { useLocale } from 'next-intl'
import { SELLER } from '@/lib/legal/company'

/**
 * İngilizce görünümün kapsamı (madde 21): menü, düğme, sepet ve ödeme adımları çevrilir; ürün adları ve açıklamaları,
 * yasal metinler ve e-postalar Türkçedir. Tam İngilizce katalog ayrı dalda (ingilizce-tam) bekliyor; birleşene kadar
 * ziyaretçi bunu sayfanın başında açıkça görür. Yönetim panelinde gösterilmez.
 */
export function EnglishScopeNotice() {
  const locale = useLocale()
  const pathname = usePathname()
  if (locale !== 'en' || pathname?.startsWith('/admin')) return null
  return (
    <div className="bg-[#fff8e1] border-b border-[#f5dc85] text-[#5c4400] text-[12.5px] leading-snug" role="note" lang="en">
      <p className="max-w-[1454px] mx-auto px-4 min-[541px]:px-6 py-2">
        English view: menus, buttons, cart and checkout are translated. Product names and descriptions, legal documents and
        order emails are in Turkish. For help in English, write to{' '}
        <a href={`mailto:${SELLER.email}`} className="font-semibold underline">{SELLER.email}</a>.
      </p>
    </div>
  )
}
