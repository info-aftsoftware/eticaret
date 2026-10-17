'use client'

import React, { useEffect, useRef, useState } from 'react'
import Link from 'next/link'
import { usePathname } from 'next/navigation'
import { ArrowRight, ChevronDown, ChevronUp } from 'lucide-react'
import { mockProducts } from '@/lib/products-mock'
import { PACKAGE_CATEGORIES } from '@/lib/package-categories'

type NavGroup = {
  id: string
  labelKey: string
  href: string
  categories: { value: string; labelKey: string }[]
}

/** Alt kategori → katalogdaki markalar (ürün sayısına göre azalan) */
const BRANDS_BY_CATEGORY: Record<string, string[]> = (() => {
  const counts: Record<string, Record<string, number>> = {}
  for (const p of mockProducts) {
    if (!p.category || !p.brand) continue
    const byBrand = (counts[p.category] ??= {})
    byBrand[p.brand] = (byBrand[p.brand] ?? 0) + 1
  }
  return Object.fromEntries(
    Object.entries(counts).map(([category, byBrand]) => [
      category,
      Object.entries(byBrand).sort((a, b) => b[1] - a[1] || a[0].localeCompare(b[0], 'tr')).map(([brand]) => brand),
    ])
  )
})()

const PACKAGES_ID = '__packages'
const productsHref = (category: string, brand?: string) =>
  `/products?category=${encodeURIComponent(category)}${brand ? `&brand=${encodeURIComponent(brand)}` : ''}`

/** voltekno.com'daki dört kareli kategori ikonu (sarı) */
export function CategoryGridIcon({ className = '' }: { className?: string }) {
  return (
    <svg viewBox="0 0 14 14" className={className} aria-hidden fill="none" stroke="#F5B400" strokeWidth="1.5">
      <rect x="0.75" y="0.75" width="5" height="5" rx="1.25" />
      <rect x="8.25" y="0.75" width="5" height="5" rx="1.25" />
      <rect x="0.75" y="8.25" width="5" height="5" rx="1.25" />
      <rect x="8.25" y="8.25" width="5" height="5" rx="1.25" />
    </svg>
  )
}

/**
 * "TÜM KATEGORİLER" (voltekno.com yapısı): lacivert buton, altında ana kategori listesi;
 * bir ana kategorinin üzerine gelince sağda alt kategoriler ve markaları açılır (gunesenerjisistemi.com kırılımı).
 */
export function AllCategoriesMenu({ navGroups, t }: { navGroups: NavGroup[]; t: (key: string) => string }) {
  const [open, setOpen] = useState(false)
  const [activeId, setActiveId] = useState<string | null>(null)
  const closeTimer = useRef<ReturnType<typeof setTimeout> | null>(null)
  /** Fareyle açıldığı an; hemen ardından gelen tıklama menüyü geri kapatmasın diye */
  const hoverOpenedAt = useRef(0)
  const rootRef = useRef<HTMLDivElement>(null)
  const pathname = usePathname()

  useEffect(() => setOpen(false), [pathname])
  useEffect(() => { if (!open) setActiveId(null) }, [open])

  useEffect(() => {
    if (!open) return
    const onKey = (e: KeyboardEvent) => { if (e.key === 'Escape') setOpen(false) }
    const onDown = (e: MouseEvent) => { if (!rootRef.current?.contains(e.target as Node)) setOpen(false) }
    window.addEventListener('keydown', onKey)
    window.addEventListener('mousedown', onDown)
    return () => {
      window.removeEventListener('keydown', onKey)
      window.removeEventListener('mousedown', onDown)
    }
  }, [open])

  const show = () => {
    if (closeTimer.current) clearTimeout(closeTimer.current)
    if (!open) hoverOpenedAt.current = Date.now()
    setOpen(true)
  }
  const hide = () => {
    closeTimer.current = setTimeout(() => setOpen(false), 180)
  }
  const close = () => setOpen(false)

  const activeGroup = navGroups.find((g) => g.id === activeId)
  const itemClass = (active: boolean) =>
    `flex items-center justify-between gap-3 px-5 h-[39px] text-[14.5px] font-medium transition-colors ${active ? 'bg-[#f1f4f8] text-[#0b2540]' : 'text-[#14141a] hover:bg-[#f1f4f8]'}`

  return (
    <div ref={rootRef} className="relative shrink-0" onMouseEnter={show} onMouseLeave={hide}>
      <button
        type="button"
        onClick={() => setOpen((o) => (o && Date.now() - hoverOpenedAt.current < 500 ? true : !o))}
        aria-expanded={open}
        aria-haspopup="true"
        aria-controls="all-categories-panel"
        className="flex items-center gap-3 h-11 w-[249px] px-[18px] rounded-[10px] bg-[#0b2540] hover:bg-[#12335a] text-white text-base font-normal uppercase tracking-[0.75px] whitespace-nowrap transition-colors"
      >
        <CategoryGridIcon className="w-[13px] h-[13px] shrink-0" />
        <span className="flex-1 text-left">{t('catNavAllCategories')}</span>
        {open ? <ChevronUp className="w-4 h-4" aria-hidden /> : <ChevronDown className="w-4 h-4" aria-hidden />}
      </button>

      {open && (
        <div id="all-categories-panel" className="absolute left-0 top-full mt-2 z-50 flex items-start">
          <ul
            className="w-[290px] py-2 rounded-xl bg-white border border-[#e3e8ee] shadow-[0_18px_40px_rgba(11,37,64,0.16)]"
          >
            {navGroups.map((g) => (
              <li key={g.id}>
                <Link
                  href={g.href}
                  onMouseEnter={() => setActiveId(g.id)}
                  onFocus={() => setActiveId(g.id)}
                  onClick={close}
                  className={itemClass(activeId === g.id)}
                >
                  {t(g.labelKey)}
                  <ArrowRight className="w-3.5 h-3.5 shrink-0 text-[#727276]" aria-hidden />
                </Link>
              </li>
            ))}
            <li>
              <Link
                href="/paketler"
                onMouseEnter={() => setActiveId(PACKAGES_ID)}
                onFocus={() => setActiveId(PACKAGES_ID)}
                onClick={close}
                className={itemClass(activeId === PACKAGES_ID)}
              >
                {t('catGroupReadyPackages')}
                <ArrowRight className="w-3.5 h-3.5 shrink-0 text-[#727276]" aria-hidden />
              </Link>
            </li>
          </ul>

          {(activeGroup || activeId === PACKAGES_ID) && (
            <div
              className="ml-2 w-[min(640px,calc(100vw-360px))] min-h-[200px] max-h-[70vh] overflow-y-auto rounded-xl bg-white border border-[#e3e8ee] shadow-[0_18px_40px_rgba(11,37,64,0.16)] p-6"
            >
              {activeId === PACKAGES_ID ? (
                <>
                  <PanelHeading title={t('catGroupReadyPackages')} href="/paketler" onClick={close} />
                  <ul className="grid grid-cols-2 gap-2">
                    {PACKAGE_CATEGORIES.map((p) => (
                      <li key={p.slug}>
                        <Link href={`/paketler/${p.slug}`} onClick={close} className="block rounded-lg border border-[#e6ebf1] px-4 py-3 hover:bg-[#f1f4f8] transition-colors">
                          <span className="block text-sm font-semibold text-[#20384e]">{p.shortTitle}</span>
                          <span className="block text-xs text-[#6b7c8f] mt-0.5 line-clamp-2">{p.description}</span>
                        </Link>
                      </li>
                    ))}
                  </ul>
                </>
              ) : activeGroup ? (
                <>
                  <PanelHeading title={t(activeGroup.labelKey)} href={activeGroup.href} onClick={close} />
                  <div className="grid grid-cols-2 lg:grid-cols-3 gap-x-6 gap-y-5">
                    {activeGroup.categories.map((cat) => {
                      const brands = BRANDS_BY_CATEGORY[cat.value] ?? []
                      return (
                        <div key={cat.value} className="min-w-0">
                          <Link href={productsHref(cat.value)} onClick={close} className="block text-[13.5px] font-semibold text-[#20384e] hover:text-[#0b2540] mb-1.5">
                            {t(cat.labelKey)}
                          </Link>
                          {brands.length > 0 && (
                            <ul className="space-y-0.5">
                              {brands.map((brand) => (
                                <li key={brand}>
                                  <Link href={productsHref(cat.value, brand)} onClick={close} className="block text-[13px] text-[#6b7c8f] hover:text-[#0b2540] py-0.5">
                                    {brand}
                                  </Link>
                                </li>
                              ))}
                            </ul>
                          )}
                        </div>
                      )
                    })}
                  </div>
                </>
              ) : null}
            </div>
          )}
        </div>
      )}
    </div>
  )
}

function PanelHeading({ title, href, onClick }: { title: string; href: string; onClick: () => void }) {
  return (
    <div className="flex items-center justify-between mb-4 pb-3 border-b border-[#e6ebf1]">
      <span className="text-[15px] font-semibold text-[#0b2540]">{title}</span>
      <Link href={href} onClick={onClick} className="inline-flex items-center gap-1 text-xs font-medium text-[#6b7c8f] hover:text-[#0b2540]">
        Tümünü Gör <ArrowRight className="w-3 h-3" aria-hidden />
      </Link>
    </div>
  )
}
