'use client'

import React, { useEffect, useRef, useState } from 'react'
import Link from 'next/link'
import { usePathname } from 'next/navigation'
import { ChevronRight, LayoutGrid, Package, FileText, ShoppingBag } from 'lucide-react'
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

/**
 * "TÜM KATEGORİLER" açılır menüsü (gunesenerjisistemi.com / voltekno.com yapısı):
 * solda ana kategoriler, sağda seçili ana kategorinin alt kategorileri ve her alt kategorinin markaları.
 */
export function AllCategoriesMenu({ navGroups, t }: { navGroups: NavGroup[]; t: (key: string) => string }) {
  const [open, setOpen] = useState(false)
  const [activeId, setActiveId] = useState<string>(navGroups[0]?.id ?? PACKAGES_ID)
  const closeTimer = useRef<ReturnType<typeof setTimeout> | null>(null)
  /** Fareyle açıldığı an; hemen ardından gelen tıklama menüyü geri kapatmasın diye */
  const hoverOpenedAt = useRef(0)
  const rootRef = useRef<HTMLDivElement>(null)
  const pathname = usePathname()

  useEffect(() => setOpen(false), [pathname])

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

  return (
    <div ref={rootRef} className="relative shrink-0" onMouseEnter={show} onMouseLeave={hide}>
      <button
        type="button"
        onClick={() => setOpen((o) => (o && Date.now() - hoverOpenedAt.current < 500 ? true : !o))}
        aria-expanded={open}
        aria-haspopup="true"
        aria-controls="all-categories-panel"
        className="flex items-center gap-2 h-11 px-4 xl:px-5 rounded-l-md bg-brand hover:bg-brand-hover text-white text-[13px] font-bold uppercase tracking-wide whitespace-nowrap transition-colors"
      >
        <LayoutGrid className="w-4 h-4" aria-hidden />
        {t('catNavAllCategories')}
      </button>

      {open && (
        <div
          id="all-categories-panel"
          className="absolute left-0 top-full mt-2 z-50 flex w-[min(980px,calc(100vw-3rem))] min-h-[420px] rounded-xl border border-slate-200 bg-white shadow-[0_16px_48px_rgba(15,23,42,0.16)] overflow-hidden animate-in fade-in slide-in-from-top-1 duration-150"
        >
          {/* Sol: ana kategoriler */}
          <ul className="w-[260px] shrink-0 bg-slate-50 border-r border-slate-100 py-2">
            {navGroups.map((g) => (
              <li key={g.id}>
                <Link
                  href={g.href}
                  onMouseEnter={() => setActiveId(g.id)}
                  onFocus={() => setActiveId(g.id)}
                  onClick={close}
                  className={`flex items-center justify-between gap-2 px-4 py-2.5 text-[13.5px] font-semibold transition-colors ${activeId === g.id ? 'bg-white text-brand border-l-[3px] border-brand pl-[13px]' : 'text-slate-700 hover:text-brand'}`}
                >
                  {t(g.labelKey)}
                  <ChevronRight className="w-3.5 h-3.5 shrink-0 opacity-50" aria-hidden />
                </Link>
              </li>
            ))}
            <li className="mt-1 pt-1 border-t border-slate-200/70">
              <Link
                href="/paketler"
                onMouseEnter={() => setActiveId(PACKAGES_ID)}
                onFocus={() => setActiveId(PACKAGES_ID)}
                onClick={close}
                className={`flex items-center justify-between gap-2 px-4 py-2.5 text-[13.5px] font-semibold transition-colors ${activeId === PACKAGES_ID ? 'bg-white text-brand border-l-[3px] border-brand pl-[13px]' : 'text-slate-700 hover:text-brand'}`}
              >
                <span className="flex items-center gap-2"><Package className="w-4 h-4" aria-hidden />{t('catGroupReadyPackages')}</span>
                <ChevronRight className="w-3.5 h-3.5 shrink-0 opacity-50" aria-hidden />
              </Link>
            </li>
            <li>
              <Link href="/products" onClick={close} className="flex items-center gap-2 px-4 py-2.5 text-[13.5px] font-semibold text-slate-700 hover:text-brand">
                <ShoppingBag className="w-4 h-4" aria-hidden />{t('catNavAllProducts')}
              </Link>
            </li>
            <li>
              <Link href="/ges" onClick={close} className="flex items-center gap-2 px-4 py-2.5 text-[13.5px] font-semibold text-amber-600 hover:text-amber-700">
                <FileText className="w-4 h-4" aria-hidden />{t('catNavSolarQuote')}
              </Link>
            </li>
          </ul>

          {/* Sağ: alt kategoriler + markalar */}
          <div className="flex-1 min-w-0 p-6 overflow-y-auto max-h-[70vh]">
            {activeId === PACKAGES_ID ? (
              <>
                <PanelHeading title={t('catGroupReadyPackages')} href="/paketler" onClick={close} />
                <ul className="grid grid-cols-2 xl:grid-cols-3 gap-2">
                  {PACKAGE_CATEGORIES.map((p) => (
                    <li key={p.slug}>
                      <Link href={`/paketler/${p.slug}`} onClick={close} className="block rounded-lg border border-slate-100 px-4 py-3 hover:border-brand/30 hover:bg-slate-50 transition-colors">
                        <span className="block text-sm font-semibold text-slate-800">{p.shortTitle}</span>
                        <span className="block text-xs text-slate-500 mt-0.5 line-clamp-2">{p.description}</span>
                      </Link>
                    </li>
                  ))}
                </ul>
              </>
            ) : activeGroup ? (
              <>
                <PanelHeading title={t(activeGroup.labelKey)} href={activeGroup.href} onClick={close} />
                <div className="grid grid-cols-2 xl:grid-cols-3 gap-x-6 gap-y-5">
                  {activeGroup.categories.map((cat) => {
                    const brands = BRANDS_BY_CATEGORY[cat.value] ?? []
                    return (
                      <div key={cat.value} className="min-w-0">
                        <Link href={productsHref(cat.value)} onClick={close} className="block text-[13.5px] font-bold text-slate-900 hover:text-brand mb-1.5">
                          {t(cat.labelKey)}
                        </Link>
                        {brands.length > 0 && (
                          <ul className="space-y-0.5">
                            {brands.map((brand) => (
                              <li key={brand}>
                                <Link href={productsHref(cat.value, brand)} onClick={close} className="block text-[13px] text-slate-500 hover:text-brand py-0.5">
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
        </div>
      )}
    </div>
  )
}

function PanelHeading({ title, href, onClick }: { title: string; href: string; onClick: () => void }) {
  return (
    <div className="flex items-center justify-between mb-5 pb-3 border-b border-slate-100">
      <span className="text-base font-black text-brand">{title}</span>
      <Link href={href} onClick={onClick} className="inline-flex items-center gap-1 text-xs font-semibold text-slate-400 hover:text-brand">
        Tümünü Gör <ChevronRight className="w-3 h-3" aria-hidden />
      </Link>
    </div>
  )
}
