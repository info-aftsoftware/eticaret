'use client'

import React, { useState, useMemo, useEffect } from 'react'
import Link from 'next/link'
import { usePathname, useSearchParams, useRouter } from 'next/navigation'
import { useTranslations } from 'next-intl'
import {
  Search,
  ChevronDown,
  ChevronRight,
  Zap,
  Battery,
  Sun,
  Cpu,
  Thermometer,
  BarChart2,
  LayoutGrid,
} from 'lucide-react'
import { Input } from '@/components/ui/input'
import { Button } from '@/components/ui/button'
import { CATEGORY_GROUPS, getCategoryKey } from '@/lib/categories'
import { useCategoriesWithProducts } from './CategoriesWithProductsProvider'

const GROUP_CONFIG: Record<string, { icon: React.ElementType; color: string; bg: string }> = {
  'elektrikli-arac-sarj-urunleri': { icon: Zap,         color: 'text-blue-600',   bg: 'bg-blue-50' },
  'batarya-depolama':              { icon: Battery,      color: 'text-emerald-600', bg: 'bg-emerald-50' },
  'inverterler':                   { icon: Cpu,          color: 'text-violet-600',  bg: 'bg-violet-50' },
  'gunes-enerjisi':                { icon: Sun,          color: 'text-orange-500',  bg: 'bg-orange-50' },
  'isi-pompasi-hvac':              { icon: Thermometer,  color: 'text-rose-500',    bg: 'bg-rose-50' },
  'enerji-yonetimi':               { icon: BarChart2,    color: 'text-sky-600',     bg: 'bg-sky-50' },
}

export function CategorySidebar() {
  const pathname = usePathname()
  const searchParams = useSearchParams()
  const router = useRouter()
  const tCommon = useTranslations('common')
  const tHeader = useTranslations('header')
  const categoriesWithProducts = useCategoriesWithProducts()
  const categoryParam = searchParams.get('category')
  const [searchQuery, setSearchQuery] = useState(searchParams.get('q') ?? '')

  const filteredGroups = useMemo(() => {
    if (!categoriesWithProducts || categoriesWithProducts.size === 0) return CATEGORY_GROUPS
    const filtered = CATEGORY_GROUPS.map((group) => ({
      ...group,
      categoryValues: group.categoryValues.filter((v) => categoriesWithProducts.has(v)),
    })).filter((g) => g.categoryValues.length > 0)
    return filtered.length > 0 ? filtered : CATEGORY_GROUPS
  }, [categoriesWithProducts])

  const activeGroupId = useMemo(() => {
    const match = pathname.match(/^\/category\/([^/]+)/)
    if (match) return match[1]
    if (categoryParam) {
      const grp = filteredGroups.find((g) =>
        (g.categoryValues as readonly string[]).includes(categoryParam)
      )
      return grp?.id ?? null
    }
    return null
  }, [pathname, categoryParam, filteredGroups])

  const [expandedGroups, setExpandedGroups] = useState<Set<string>>(() => new Set())

  useEffect(() => {
    if (activeGroupId) {
      setExpandedGroups((prev) => (prev.has(activeGroupId) ? prev : new Set([...prev, activeGroupId])))
    }
  }, [activeGroupId])

  const toggleGroup = (id: string) => {
    setExpandedGroups((prev) => {
      const next = new Set(prev)
      if (next.has(id)) next.delete(id)
      else next.add(id)
      return next
    })
  }

  const isAllActive = !activeGroupId && pathname === '/products'

  return (
    <aside className="w-full lg:w-60 xl:w-64 shrink-0" aria-label="Tüm kategoriler">

      {/* Mobil arama */}
      <form
        className="flex gap-2 mb-4 lg:hidden"
        onSubmit={(e) => {
          e.preventDefault()
          const params = new URLSearchParams()
          if (searchQuery.trim()) params.set('q', searchQuery.trim())
          router.push(`/products${params.toString() ? `?${params.toString()}` : ''}`)
        }}
      >
        <Input
          type="search"
          placeholder="Ürün ara..."
          value={searchQuery}
          onChange={(e) => setSearchQuery(e.target.value)}
          className="flex-1 h-10 rounded-lg border-slate-200 bg-slate-50 text-sm placeholder:text-slate-400"
          autoComplete="off"
        />
        <Button
          type="submit"
          size="icon"
          className="h-10 w-10 shrink-0 rounded-lg bg-brand hover:bg-brand-hover"
          aria-label="Ara"
        >
          <Search className="w-4 h-4 text-white" />
        </Button>
      </form>

      {/* Kategori paneli */}
      <div className="rounded-xl border border-slate-200 bg-white overflow-hidden shadow-sm">

        {/* Panel başlığı */}
        <div className="px-4 py-3 border-b border-slate-100 flex items-center gap-2">
          <LayoutGrid className="w-4 h-4 text-slate-400 shrink-0" />
          <span className="text-xs font-bold text-slate-500 uppercase tracking-widest">Kategoriler</span>
        </div>

        <nav aria-label="Ürün kategorileri">
          <ul className="py-1">

            {/* Tümü */}
            <li>
              <Link
                href="/products"
                className={`flex items-center gap-3 px-4 py-2.5 min-h-[44px] text-sm font-semibold transition-colors touch-manipulation ${
                  isAllActive
                    ? 'bg-brand/8 text-brand border-r-2 border-brand'
                    : 'text-slate-700 hover:bg-slate-50'
                }`}
              >
                <span
                  className={`w-7 h-7 rounded-lg flex items-center justify-center shrink-0 ${
                    isAllActive ? 'bg-brand/15' : 'bg-slate-100'
                  }`}
                >
                  <LayoutGrid className={`w-3.5 h-3.5 ${isAllActive ? 'text-brand' : 'text-slate-400'}`} />
                </span>
                {tCommon('all')}
              </Link>
            </li>

            {/* Ayırıcı */}
            <li className="mx-4 my-1 border-t border-slate-100" aria-hidden />

            {/* Gruplar */}
            {filteredGroups.map((group) => {
              const isGroupActive = activeGroupId === group.id
              const isExpanded = expandedGroups.has(group.id)
              const cfg = GROUP_CONFIG[group.id] ?? { icon: LayoutGrid, color: 'text-slate-500', bg: 'bg-slate-100' }
              const Icon = cfg.icon
              const label = tHeader(group.labelKey)

              return (
                <li key={group.id}>
                  {/* Grup satırı */}
                  <div className="flex items-stretch">
                    <Link
                      href={`/category/${group.id}`}
                      className={`flex-1 flex items-center gap-3 px-4 py-2.5 min-h-[44px] text-sm font-semibold min-w-0 transition-colors touch-manipulation ${
                        isGroupActive
                          ? 'bg-brand/8 text-brand border-r-2 border-brand'
                          : 'text-slate-800 hover:bg-slate-50'
                      }`}
                    >
                      <span
                        className={`w-7 h-7 rounded-lg flex items-center justify-center shrink-0 transition-colors ${
                          isGroupActive ? 'bg-brand/15' : cfg.bg
                        }`}
                      >
                        <Icon
                          className={`w-3.5 h-3.5 shrink-0 ${isGroupActive ? 'text-brand' : cfg.color}`}
                        />
                      </span>
                      <span className="truncate leading-tight">{label}</span>
                    </Link>

                    {/* Genişlet butonu */}
                    <button
                      type="button"
                      onClick={() => toggleGroup(group.id)}
                      className={`min-h-[44px] w-10 shrink-0 flex items-center justify-center transition-colors touch-manipulation ${
                        isGroupActive
                          ? 'text-brand hover:bg-brand/10'
                          : 'text-slate-400 hover:text-slate-600 hover:bg-slate-50'
                      }`}
                      aria-label={isExpanded ? 'Daralt' : 'Genişlet'}
                    >
                      <ChevronDown
                        className={`w-3.5 h-3.5 transition-transform duration-200 ${isExpanded ? 'rotate-180' : ''}`}
                      />
                    </button>
                  </div>

                  {/* Alt kategoriler */}
                  {isExpanded && (
                    <ul className="pb-1 bg-slate-50/60">
                      {(group.categoryValues as readonly string[]).map((catValue) => {
                        const isSubActive =
                          pathname === '/products' && categoryParam === catValue
                        const labelKey = getCategoryKey(catValue)
                        const subLabel = labelKey ? tHeader(labelKey) : catValue
                        return (
                          <li key={catValue}>
                            <Link
                              href={`/products?category=${encodeURIComponent(catValue)}`}
                              className={`flex items-center gap-2 pl-[52px] pr-4 py-2 min-h-[40px] text-xs font-medium leading-snug transition-colors touch-manipulation ${
                                isSubActive
                                  ? 'text-brand font-semibold bg-brand/5 border-r-2 border-brand'
                                  : 'text-slate-500 hover:text-slate-900 hover:bg-white'
                              }`}
                            >
                              <ChevronRight className={`w-3 h-3 shrink-0 ${isSubActive ? 'text-brand' : 'text-slate-300'}`} />
                              <span className="truncate">{subLabel}</span>
                            </Link>
                          </li>
                        )
                      })}
                    </ul>
                  )}
                </li>
              )
            })}
          </ul>
        </nav>
      </div>
    </aside>
  )
}
