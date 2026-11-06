'use client'

import React, { useEffect, useRef, useState } from 'react'
import Link, { usePathname } from '@/lib/i18n/navigation'
import { ArrowRight, ChevronDown, ChevronRight, ChevronUp } from 'lucide-react'
import { PACKAGE_CATEGORIES } from '@/lib/package-categories'
import { categoryHref } from '@/lib/seo/type-paths'
import { useL } from '@/lib/i18n-inline'
import { GroupPanelContent, groupPanelWidth } from './GroupPanel'
import { useCategoryCounts } from '@/components/CategoriesWithProductsProvider'

export type NavGroup = {
  id: string
  labelKey: string
  href: string
  categories: { value: string; labelKey: string }[]
}

const PACKAGES_ID = '__packages'
/** Alt kategori bağlantısı: dizinlenebilir tür sayfası (lib/seo/type-paths.ts) */
export const productsHref = (category: string) => categoryHref(category)

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

  const L = useL()
  const counts = useCategoryCounts()
  const groupTotal = (g: NavGroup) => (counts ? g.categories.reduce((n, c) => n + (counts[c.value] ?? 0), 0) : 0)
  const activeGroup = navGroups.find((g) => g.id === activeId)
  // Başlıktaki kategori menüleriyle aynı görünüm: yuvarlatılmış satır, açık gri vurgu, sağda ürün sayısı
  const itemClass = (active: boolean) =>
    `group/item flex items-center justify-between gap-3 rounded-md px-3 h-10 text-[14px] font-medium transition-colors ${active ? 'bg-[#f1f4f8] text-[#0b2540]' : 'text-[#20384e] hover:bg-[#f1f4f8] hover:text-[#0b2540]'}`
  const itemTail = (n: number, active: boolean) => (
    <span className="flex shrink-0 items-center gap-2">
      {n > 0 && <span className="text-[12px] font-normal tabular-nums text-[#8a99a8]">{n}</span>}
      <ChevronRight className={`h-4 w-4 transition-colors ${active ? 'text-[#0b2540]' : 'text-[#b4c0cc] group-hover/item:text-[#5d6e80]'}`} aria-hidden />
    </span>
  )
  const panelWidth = activeGroup ? groupPanelWidth(activeGroup) : 640

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
            className="w-[290px] p-2 rounded-xl bg-white border border-[#e3e8ee] shadow-[0_18px_40px_rgba(11,37,64,0.12)]"
          >
            <li className="px-3 pt-1.5 pb-1 text-[11px] font-semibold uppercase tracking-[0.12em] text-[#8a99a8]">{L('Kategoriler', 'Categories')}</li>
            {navGroups.map((g) => (
              <li key={g.id}>
                <Link
                  href={g.href}
                  onMouseEnter={() => setActiveId(g.id)}
                  onFocus={() => setActiveId(g.id)}
                  onClick={close}
                  className={itemClass(activeId === g.id)}
                >
                  <span className="min-w-0 truncate">{t(g.labelKey)}</span>
                  {itemTail(groupTotal(g), activeId === g.id)}
                </Link>
              </li>
            ))}
            <li className="mt-1 border-t border-[#eef1f5] pt-1">
              <Link
                href="/paketler"
                onMouseEnter={() => setActiveId(PACKAGES_ID)}
                onFocus={() => setActiveId(PACKAGES_ID)}
                onClick={close}
                className={itemClass(activeId === PACKAGES_ID)}
              >
                <span className="min-w-0 truncate">{t('catGroupReadyPackages')}</span>
                {itemTail(0, activeId === PACKAGES_ID)}
              </Link>
            </li>
          </ul>

          {(activeGroup || activeId === PACKAGES_ID) && (
            <div
              className="ml-2 min-h-[200px] max-h-[70vh] overflow-y-auto rounded-xl bg-white border border-[#e3e8ee] shadow-[0_18px_40px_rgba(11,37,64,0.12)] p-5"
              style={{ width: `min(${panelWidth}px, calc(100vw - 360px))` }}
            >
              {activeId === PACKAGES_ID ? (
                <>
                  <div className="flex items-baseline justify-between gap-3 px-3">
                    <p className="text-[11px] font-semibold uppercase tracking-[0.12em] text-[#8a99a8]">{t('catGroupReadyPackages')}</p>
                    <Link href="/paketler" onClick={close} className="inline-flex items-center gap-1 text-[13px] font-semibold text-[#0b2540] hover:text-[#12335a]">
                      {L('Tümünü gör', 'View all')} <ArrowRight className="h-4 w-4" aria-hidden />
                    </Link>
                  </div>
                  <ul className="mt-2 grid grid-cols-2 gap-x-3 gap-y-0.5">
                    {PACKAGE_CATEGORIES.map((p) => (
                      <li key={p.slug} className="min-w-0">
                        <Link href={`/paketler/${p.slug}`} onClick={close} className="block rounded-md px-3 py-2 transition-colors hover:bg-[#f1f4f8]">
                          <span className="block text-[13.5px] font-medium leading-snug text-[#20384e]">{p.shortTitle}</span>
                          <span className="mt-0.5 block text-[12px] leading-snug text-[#5d6e80] line-clamp-2">{p.description}</span>
                        </Link>
                      </li>
                    ))}
                  </ul>
                </>
              ) : activeGroup ? (
                <GroupPanelContent group={activeGroup} label={t(activeGroup.labelKey)} t={t} onNavigate={close} />
              ) : null}
            </div>
          )}
        </div>
      )}
    </div>
  )
}

