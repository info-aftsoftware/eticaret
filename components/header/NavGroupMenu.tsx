'use client'

import React, { useEffect, useLayoutEffect, useRef, useState } from 'react'
import Link from '@/lib/i18n/navigation'
import { ArrowRight, ChevronDown } from 'lucide-react'
import { productsHref, type NavGroup } from './AllCategoriesMenu'
import { useL } from '@/lib/i18n-inline'

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
  const cols = subs.length >= 3 ? 3 : subs.length
  const width = cols === 1 ? 280 : cols === 2 ? 480 : 680

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
            className="rounded-xl border border-[#e3e8ee] bg-white shadow-[0_18px_40px_rgba(11,37,64,0.14)] p-5"
            style={{ width: fitWidth }}
          >
            <ul className="grid gap-x-6 gap-y-1" style={{ gridTemplateColumns: `repeat(${cols}, minmax(0, 1fr))` }}>
              {subs.map((cat) => (
                <li key={cat.value} className="min-w-0">
                  <Link
                    href={productsHref(cat.value)}
                    onClick={() => setOpen(false)}
                    className="block py-1.5 text-[14px] font-medium text-[#121926] hover:text-[#0b2540] hover:underline underline-offset-2"
                  >
                    {t(cat.labelKey)}
                  </Link>
                </li>
              ))}
            </ul>
            <div className="mt-5 pt-4 border-t border-[#eef1f5]">
              <Link
                href={group.href}
                onClick={() => setOpen(false)}
                className="inline-flex items-center gap-1.5 text-[13px] font-semibold text-[#0b2540] hover:text-[#12335a]"
              >
                {L(`Tüm ${label} ürünleri`, `All ${label}`)} <ArrowRight className="w-4 h-4" aria-hidden />
              </Link>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
