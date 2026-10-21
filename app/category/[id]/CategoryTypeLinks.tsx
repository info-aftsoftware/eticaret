'use client'

import Link from 'next/link'
import { useTranslations } from 'next-intl'
import { CATEGORY_GROUPS, getCategoryKey } from '@/lib/categories'
import { PAGE_CONTAINER } from '@/lib/page-container'
import { useL } from '@/lib/i18n-inline'

/** Gruptaki ürün türlerine bağlantılar. Sayfa statik derlendiği için dil istemcide seçilir (İngilizcede kategori çevirisi). */
export function CategoryTypeLinks({
  groupId,
  title,
  links,
}: {
  groupId: string
  title: string
  links: { category: string; label: string; href: string; count: number }[]
}) {
  const L = useL()
  const tHeader = useTranslations('header')
  const en = (key: string | undefined, fallback: string) => (key && tHeader.has(key) ? tHeader(key) : fallback)
  const groupKey = CATEGORY_GROUPS.find((g) => g.id === groupId)?.labelKey
  const heading = L(`${title} ürün türleri`, `${en(groupKey, title)} product types`)
  return (
    <nav aria-label={heading} className={`${PAGE_CONTAINER} pb-12`}>
      <h2 className="text-[18px] font-semibold text-[#121926]">{heading}</h2>
      <ul className="mt-3 flex flex-wrap gap-2">
        {links.map((t) => (
          <li key={t.href}>
            <Link href={t.href} className="inline-flex items-center gap-1.5 rounded-full border border-[#d3d9e1] bg-white px-3.5 py-1.5 text-[13.5px] font-medium text-[#20384e] hover:border-[#0b2540]">
              {L(t.label, en(getCategoryKey(t.category), t.label))} <span className="text-[#5d6e80]">({t.count})</span>
            </Link>
          </li>
        ))}
      </ul>
    </nav>
  )
}
