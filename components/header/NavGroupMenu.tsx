'use client'

import React, { useEffect, useLayoutEffect, useRef, useState } from 'react'
import Link from '@/lib/i18n/navigation'
import { ArrowRight, ChevronDown } from 'lucide-react'
import { productsHref, type NavGroup } from './AllCategoriesMenu'
import { useL } from '@/lib/i18n-inline'
import Image from 'next/image'
import { GROUP_IMAGES } from '@/lib/category-images'
import { useCategoryCounts } from '@/components/CategoriesWithProductsProvider'

const OPEN_DELAY = 90
const CLOSE_DELAY = 160
/** Panel ekran kenarına en fazla bu kadar yaklaşır */
const EDGE = 16

/**
 * Masaüstü kategori satırındaki tek bir ana kategori linki: fareyle üzerine gelince altında alt kategorilerini
 * gösteren panel açılır. Link tıklanınca kategori sayfasına gider; panel yalnızca
 * fare kısayoludur (klavyede Tab her linkten geçmesin diye odakla açılmaz; tüm alt kategoriler "Tüm Kategoriler" menüsünde).
 */
export function NavGroupMenu({
  group,
  label,
  align = 'left',
  className = '',
  linkClassName,
  t,
}: {
  group: NavGroup
  label: string
  align?: 'left' | 'right'
  className?: string
  linkClassName: string
  t: (key: string) => string
}) {
  const [open, setOpen] = useState(false)
  const L = useL()
  const timer = useRef<ReturnType<typeof setTimeout> | null>(null)

  const schedule = (next: boolean) => {
    if (timer.current) clearTimeout(timer.current)
    timer.current = setTimeout(() => setOpen(next), next ? OPEN_DELAY : CLOSE_DELAY)
  }
  useEffect(() => () => { if (timer.current) clearTimeout(timer.current) }, [])

  useEffect(() => {
    if (!open) return
    const onKey = (e: KeyboardEvent) => { if (e.key === 'Escape') setOpen(false) }
    document.addEventListener('keydown', onKey)
    return () => document.removeEventListener('keydown', onKey)
  }, [open])

  const subs = group.categories
  const counts = useCategoryCounts()
  const total = counts ? subs.reduce((n, c) => n + (counts[c.value] ?? 0), 0) : 0
  const image = GROUP_IMAGES[group.id]
  // Alt kategori listesi: 4+ alt kategoride 2 sütun; sağda kategori kartı (görsel + toplam + tümünü gör)
  const cols = subs.length >= 4 ? 2 : 1
  const width = (cols === 2 ? 580 : 300) + (image ? 236 : 0)

  // Panel hiçbir ekran genişliğinde taşmasın: açılınca ölçülür, gerekirse yana kaydırılır, dar ekranda daralır
  const panelRef = useRef<HTMLDivElement>(null)
  const [shift, setShift] = useState(0)
  const [fitWidth, setFitWidth] = useState(width)
  useLayoutEffect(() => {
    if (!open) return
    const place = () => {
      const anchor = panelRef.current?.parentElement?.getBoundingClientRect()
      if (!anchor) return
      const vw = document.documentElement.clientWidth
      const w = Math.min(width, vw - EDGE * 2)
      const left = align === 'right' ? anchor.right - w : anchor.left
      const overRight = left + w - (vw - EDGE)
      const overLeft = EDGE - left
      setFitWidth(w)
      setShift(overRight > 0 ? -overRight : overLeft > 0 ? overLeft : 0)
    }
    place()
    window.addEventListener('resize', place)
    return () => window.removeEventListener('resize', place)
  }, [open, width, align])

  return (
    <div
      className={`relative ${className}`}
      onMouseEnter={() => schedule(true)}
      onMouseLeave={() => schedule(false)}
    >
      <Link
        href={group.href}
        className={`${linkClassName} inline-flex items-center gap-1`}
        onClick={() => setOpen(false)}
      >
        {label}
        <ChevronDown className={`w-3.5 h-3.5 text-[#8a99a8] transition-transform ${open ? 'rotate-180' : ''}`} aria-hidden />
      </Link>

      {open && subs.length > 0 && (
        <div
          ref={panelRef}
          className={`absolute top-full z-50 pt-2 ${align === 'right' ? 'right-0' : 'left-0'}`}
          style={shift ? { transform: `translateX(${shift}px)` } : undefined}
        >
          <div
            className="flex gap-5 rounded-xl border border-[#e3e8ee] bg-white p-5 shadow-[0_18px_40px_rgba(11,37,64,0.12)]"
            style={{ width: fitWidth }}
          >
            <div className="min-w-0 flex-1">
              <p className="px-3 text-[11px] font-semibold uppercase tracking-[0.12em] text-[#8a99a8]">{L('Alt kategoriler', 'Subcategories')}</p>
              <ul className="mt-2 grid gap-x-3 gap-y-0.5" style={{ gridTemplateColumns: `repeat(${cols}, minmax(0, 1fr))` }}>
                {subs.map((cat) => (
                  <li key={cat.value} className="min-w-0">
                    <Link
                      href={productsHref(cat.value)}
                      onClick={() => setOpen(false)}
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
                onClick={() => setOpen(false)}
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
                onClick={() => setOpen(false)}
                className="self-end inline-flex items-center gap-1.5 whitespace-nowrap text-[13px] font-semibold text-[#0b2540] hover:text-[#12335a]"
              >
                {L(`Tüm ${label} ürünleri`, `All ${label}`)} <ArrowRight className="h-4 w-4" aria-hidden />
              </Link>
            )}
          </div>
        </div>
      )}
    </div>
  )
}
