'use client'

import React from 'react'
import Link from '@/lib/i18n/navigation'
import Image from 'next/image'
import { ArrowRight } from 'lucide-react'
import { useL } from '@/lib/i18n-inline'
import { GROUP_IMAGES } from '@/lib/category-images'
import { categoryHref } from '@/lib/seo/type-paths'
import { useCategoryCounts } from '@/components/CategoriesWithProductsProvider'

export type PanelGroup = {
  id: string
  href: string
  categories: { value: string; labelKey: string }[]
}

/** Alt kategori listesi 4+ alt kategoride 2 sütun; görselli grupta sağda kategori kartı */
export function groupPanelWidth(group: PanelGroup): number {
  const cols = group.categories.length >= 4 ? 2 : 1
  return (cols === 2 ? 580 : 300) + (GROUP_IMAGES[group.id] ? 236 : 0)
}

/**
 * Kategori açılır panelinin içeriği: alt kategoriler (ürün sayılarıyla) ve kategori kartı (görsel, toplam ürün,
 * "Tümünü gör"). Başlıktaki kategori menüleri ve "Tüm Kategoriler" menüsü aynı görünümü kullanır.
 */
export function GroupPanelContent({
  group,
  label,
  t,
  onNavigate,
}: {
  group: PanelGroup
  label: string
  t: (key: string) => string
  onNavigate: () => void
}) {
  const L = useL()
  const subs = group.categories
  const counts = useCategoryCounts()
  const total = counts ? subs.reduce((n, c) => n + (counts[c.value] ?? 0), 0) : 0
  const image = GROUP_IMAGES[group.id]
  const cols = subs.length >= 4 ? 2 : 1

  return (
    <div className="flex gap-5">
      <div className="min-w-0 flex-1">
        <p className="px-3 text-[11px] font-semibold uppercase tracking-[0.12em] text-[#8a99a8]">{L('Alt kategoriler', 'Subcategories')}</p>
        <ul className="mt-2 grid gap-x-3 gap-y-0.5" style={{ gridTemplateColumns: `repeat(${cols}, minmax(0, 1fr))` }}>
          {subs.map((cat) => (
            <li key={cat.value} className="min-w-0">
              <Link
                href={categoryHref(cat.value)}
                onClick={onNavigate}
                className="group/sub flex items-baseline justify-between gap-3 rounded-md px-3 py-2 text-[13.5px] font-medium leading-snug text-[#20384e] transition-colors hover:bg-[#f1f4f8] hover:text-[#0b2540]"
              >
                <span className="min-w-0">{t(cat.labelKey)}</span>
                {counts?.[cat.value] != null && (
                  <span className="shrink-0 text-[12px] font-normal tabular-nums text-[#8a99a8] group-hover/sub:text-[#5d6e80]">{counts[cat.value]}</span>
                )}
              </Link>
            </li>
          ))}
        </ul>
      </div>

      {image ? (
        <Link
          href={group.href}
          onClick={onNavigate}
          className="group/card flex w-[216px] shrink-0 flex-col rounded-lg bg-[#f5f7fa] p-4 transition-colors hover:bg-[#eef2f6]"
        >
          <span className="relative block h-[120px] w-full">
            <Image src={image} alt="" fill sizes="184px" className="object-contain mix-blend-multiply transition-transform duration-300 group-hover/card:scale-[1.04]" />
          </span>
          <span className="mt-3 text-[14px] font-semibold text-[#121926]">{label}</span>
          {total > 0 && <span className="mt-0.5 text-[12.5px] text-[#5d6e80]">{L(`${total} ürün`, `${total} products`)}</span>}
          <span className="mt-3 inline-flex h-9 items-center justify-center gap-1.5 rounded-md bg-[#0b2540] px-3 text-[13px] font-semibold text-white transition-colors group-hover/card:bg-[#12335a]">
            {L('Tümünü gör', 'View all')} <ArrowRight className="h-4 w-4" aria-hidden />
          </span>
        </Link>
      ) : (
        <Link
          href={group.href}
          onClick={onNavigate}
          className="self-end inline-flex items-center gap-1.5 whitespace-nowrap text-[13px] font-semibold text-[#0b2540] hover:text-[#12335a]"
        >
          {L(`Tüm ${label} ürünleri`, `All ${label}`)} <ArrowRight className="h-4 w-4" aria-hidden />
        </Link>
      )}
    </div>
  )
}
