'use client'

import React, { useState, useMemo, Suspense } from 'react'
import Link from 'next/link'
import Image from 'next/image'
import { ChevronRight, Package, SlidersHorizontal, Filter, Menu, X, Search } from 'lucide-react'
import { ProductCard } from '@/components/ProductCard'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Slider } from '@/components/ui/slider'
import { Sheet, SheetContent, SheetHeader, SheetTitle } from '@/components/ui/sheet'
import { mockProducts, PLACEHOLDER_PRODUCT_IMAGE } from '@/lib/products-mock'
import { getCategoryValuesByGroupId } from '@/lib/categories'
import { buildSpecFacets } from '@/lib/spec-facets'
import { CATEGORY_META } from '@/app/category/[id]/category-meta'
import { ProductPageShell } from '@/components/ProductPageShell'
import { useTranslations } from 'next-intl'
import { fmtPrice } from '@/lib/format'
import { useCurrencyStore } from '@/lib/store/useCurrencyStore'
import { useExchangeRates } from '@/lib/useExchangeRates'

type SortOption = 'newest' | 'price-asc' | 'price-desc' | 'name-asc'

export function CategoryPageClient({ id: groupId }: { id: string }) {
  const tCommon = useTranslations('common')
  const tProducts = useTranslations('products')
  const [selectedBrand, setSelectedBrand] = useState<string | null>(null)
  const [sortBy, setSortBy] = useState<SortOption>('newest')
  const [selectedSub, setSelectedSub] = useState<string | null>(null)
  const [filterOpen, setFilterOpen] = useState(false)
  const [selectedSpecs, setSelectedSpecs] = useState<Record<string, string[]>>({})
  const [searchQuery, setSearchQuery] = useState('')

  const currency = useCurrencyStore((s) => s.currency)
  const { rates } = useExchangeRates()
  const formatPrice = (amount: number) => fmtPrice(amount, currency, rates?.rates ?? null)

  // Güncel katalog (admin fiyat/stok düzenlemeleri + aktif kampanyalar); ilk çizim için koddaki liste
  const [catalog, setCatalog] = useState<(typeof mockProducts)[number][]>(mockProducts)
  React.useEffect(() => {
    fetch('/api/products')
      .then((res) => (res.ok ? res.json() : null))
      .then((data) => { if (Array.isArray(data) && data.length > 0) setCatalog(data) })
      .catch(() => {})
  }, [])

  const meta = CATEGORY_META[groupId]
  const categoryValues = useMemo(() => getCategoryValuesByGroupId(groupId), [groupId])
  const heroImages = useMemo(() => {
    const inGroup = catalog.filter((p) => categoryValues.includes(p.category) && p.image && p.image !== PLACEHOLDER_PRODUCT_IMAGE)
    const ordered = [...inGroup.filter((p) => p.featured), ...inGroup.filter((p) => !p.featured)]
    return Array.from(new Set(ordered.map((p) => p.image as string))).slice(0, 3)
  }, [catalog, categoryValues])

  const subcategories = useMemo(
    () => categoryValues.filter((v) => catalog.some((p) => p.category === v)),
    [categoryValues, catalog]
  )

  const brands = useMemo(() => {
    const set = new Set(
      catalog
        .filter((p) => categoryValues.includes(p.category) && p.brand)
        .map((p) => p.brand as string)
    )
    return Array.from(set).sort((a, b) => a.localeCompare(b, 'tr'))
  }, [categoryValues, catalog])

  const productsInRange = useMemo(() => {
    return catalog.filter((p) => categoryValues.includes(p.category))
  }, [categoryValues, catalog])

  const dynamicMinPrice = useMemo(() => {
    if (productsInRange.length === 0) return 0
    return Math.min(...productsInRange.map((p) => p.price))
  }, [productsInRange])

  const dynamicMaxPrice = useMemo(() => {
    if (productsInRange.length === 0) return 0
    return Math.max(...productsInRange.map((p) => p.price))
  }, [productsInRange])

  const [priceRange, setPriceRange] = useState<[number, number]>([dynamicMinPrice, dynamicMaxPrice])
  const [minInput, setMinInput] = useState<string>(String(dynamicMinPrice))
  const [maxInput, setMaxInput] = useState<string>(String(dynamicMaxPrice))

  React.useEffect(() => {
    setPriceRange([dynamicMinPrice, dynamicMaxPrice])
    setMinInput(String(dynamicMinPrice))
    setMaxInput(String(dynamicMaxPrice))
  }, [dynamicMinPrice, dynamicMaxPrice])

  const specFacets = useMemo(() => buildSpecFacets(productsInRange), [productsInRange])

  const filteredProducts = useMemo(() => {
    let list = catalog.filter((p) => {
      const catOk = selectedSub ? p.category === selectedSub : categoryValues.includes(p.category)
      const brandOk = !selectedBrand || p.brand === selectedBrand
      const priceOk = p.price >= priceRange[0] && p.price <= priceRange[1]
      const searchOk = !searchQuery || p.name.toLowerCase().includes(searchQuery.toLowerCase())

      const specsOk = Object.entries(selectedSpecs).every(([key, vals]) => {
        if (!vals.length) return true
        return p.specifications?.[key] && vals.includes(p.specifications[key])
      })

      return catOk && brandOk && priceOk && searchOk && specsOk
    })

    if (sortBy === 'price-asc') list = [...list].sort((a, b) => a.price - b.price)
    else if (sortBy === 'price-desc') list = [...list].sort((a, b) => b.price - a.price)
    else if (sortBy === 'name-asc') list = [...list].sort((a, b) => a.name.localeCompare(b.name, 'tr'))

    return list
  }, [catalog, categoryValues, selectedBrand, selectedSub, sortBy, priceRange, searchQuery, selectedSpecs])

  const updateSpecFilter = (key: string, value: string, checked: boolean) => {
    setSelectedSpecs((prev) => {
      const current = prev[key] ?? []
      const nextValues = checked ? [...current, value] : current.filter((v) => v !== value)
      if (nextValues.length === 0) {
        const next = { ...prev }
        delete next[key]
        return next
      }
      return { ...prev, [key]: nextValues }
    })
  }

  const resetAllFilters = () => {
    setSelectedBrand(null)
    setSelectedSub(null)
    setSelectedSpecs({})
    setSearchQuery('')
    setPriceRange([dynamicMinPrice, dynamicMaxPrice])
    setMinInput(String(dynamicMinPrice))
    setMaxInput(String(dynamicMaxPrice))
  }

  if (!meta) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-slate-50">
        <div className="text-center">
          <h1 className="text-2xl font-bold text-slate-900 mb-2">{tProducts('categoryNotFound')}</h1>
          <Link href="/products" className="text-brand hover:underline text-sm">
            {tProducts('backToAllProducts')}
          </Link>
        </div>
      </div>
    )
  }

  return (
    <ProductPageShell
      hero={
        <div className="relative min-h-[max(28vh,200px)] sm:min-h-0 sm:h-[320px] md:h-[380px] overflow-hidden w-full">
          {/* Arka plan: görselin arkası siyah */}
          <div className="absolute inset-0 bg-black" />
          {/* Görsel yukarı ve aşağıdan görünebildiği kadar: object-contain, dikeyde tam görünür */}
          {meta.image ? (
            <div className="absolute inset-0 flex items-center justify-center p-0">
              <Image
                src={meta.image}
                alt={meta.title}
                fill
                className="object-contain"
                style={{ objectPosition: meta.imagePosition ?? 'center center' }}
                priority
                sizes="100vw"
              />
            </div>
          ) : (
            <>
              <div className="absolute inset-0 bg-gradient-to-br from-slate-950 via-slate-900 to-brand/40" />
              {/* Banner görseli olmayan kategorilerde kategorinin öne çıkan ürün görselleri */}
              <div className="absolute inset-y-0 right-0 hidden xl:flex items-center gap-4 pr-10" aria-hidden>
                {heroImages.map((src, i) => (
                  <div
                    key={src}
                    className={`relative rounded-2xl bg-white/95 shadow-xl overflow-hidden ${i === 1 ? 'w-48 h-48' : 'w-32 h-32'}`}
                  >
                    <Image src={src} alt="" fill className="object-contain p-3" sizes="208px" />
                  </div>
                ))}
              </div>
            </>
          )}
          <div className="relative z-10 h-full flex flex-col justify-end max-w-[1440px] mx-auto px-4 sm:px-6 md:px-8 pb-8 sm:pb-10 md:pb-12 text-white">
            <h1 className="text-3xl sm:text-4xl md:text-[2.75rem] font-bold mb-2 tracking-tight leading-tight">
              {meta.title}
            </h1>
            <p className="text-white/75 text-sm sm:text-base max-w-lg leading-relaxed font-light">
              {meta.description}
            </p>

            <div className="mt-4 flex items-center gap-3">
              <span className="inline-flex items-center gap-1.5 bg-white/10 backdrop-blur-sm text-white/90 text-xs font-medium px-3 py-1.5 rounded-full border border-white/15">
                <Package className="w-3.5 h-3.5" />
                {tProducts('productsListed', { count: filteredProducts.length })}
              </span>
            </div>
          </div>
        </div>
      }
      breadcrumbs={
        <nav className="flex items-center gap-1.5 text-slate-500 text-xs font-medium py-1">
          <Link href="/" className="hover:text-slate-900 transition-colors">{tCommon('home')}</Link>
          <ChevronRight className="w-3 h-3" />
          <Link href="/products" className="hover:text-slate-900 transition-colors">{tCommon('products')}</Link>
          <ChevronRight className="w-3 h-3" />
          <span className="text-slate-900 font-semibold">{meta.title}</span>
        </nav>
      }
    >
      <div className="min-w-0">
        <Sheet open={filterOpen} onOpenChange={setFilterOpen}>
          <SheetContent side="left" className="w-[85vw] sm:max-w-md overflow-y-auto min-w-0 rounded-r-2xl border-slate-200" onOpenAutoFocus={(e: Event) => e.preventDefault()}>
            <SheetHeader>
              <SheetTitle className="flex items-center gap-2">
                <Menu className="w-5 h-5" />
                {tProducts('filters')}
              </SheetTitle>
            </SheetHeader>
            <div className="mt-6 space-y-6">
              <div className="space-y-6">
                <div className="relative">
                  <Input
                    type="search"
                    placeholder={tProducts('searchPlaceholder')}
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                    className="h-10 rounded-lg border-slate-200 bg-slate-50 text-sm pl-10"
                  />
                  <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
                </div>

                {subcategories.length > 0 && (
                  <nav aria-label="Kategori filtresi">
                    <h3 className="text-sm font-semibold text-slate-800 mb-2">{tProducts('category')}</h3>
                    <ul className="space-y-1">
                      <li>
                        <button
                          type="button"
                          onClick={() => { setSelectedSub(null); setFilterOpen(false) }}
                          className={`w-full flex items-center justify-between gap-2 px-3.5 py-2.5 rounded-xl text-sm font-medium transition-colors ${!selectedSub ? 'bg-brand text-white shadow-sm' : 'text-slate-700 hover:bg-slate-100'}`}
                        >
                          <span>{tCommon('all')}</span>
                          {!selectedSub && <ChevronRight className="w-4 h-4 shrink-0" />}
                        </button>
                      </li>
                      {subcategories.map((sub) => {
                        const isSelected = selectedSub === sub
                        return (
                          <li key={sub}>
                            <button
                              type="button"
                              onClick={() => { setSelectedSub(isSelected ? null : sub); setFilterOpen(false) }}
                              className={`w-full flex items-center justify-between gap-2 px-3.5 py-2.5 rounded-xl text-sm font-medium transition-colors ${isSelected ? 'bg-brand text-white shadow-sm' : 'text-slate-700 hover:bg-slate-100'}`}
                            >
                              <span className="truncate text-left">{sub}</span>
                              {isSelected && <ChevronRight className="w-4 h-4 shrink-0" />}
                            </button>
                          </li>
                        )
                      })}
                    </ul>
                  </nav>
                )}

                {brands.length > 0 && (
                  <div className="border-t border-slate-200 pt-4">
                    <h3 className="text-sm font-semibold text-slate-800 mb-2">{tProducts('brand')}</h3>
                    <ul className="space-y-0.5">
                      <li>
                        <button
                          type="button"
                          onClick={() => { setSelectedBrand(null); setFilterOpen(false) }}
                          className={`w-full flex items-center justify-between gap-2 px-3.5 py-2.5 rounded-xl text-sm font-medium transition-colors ${!selectedBrand ? 'bg-brand text-white' : 'text-slate-700 hover:bg-slate-100'}`}
                        >
                          <span>{tCommon('all')}</span>
                          {!selectedBrand && <ChevronRight className="w-4 h-4 shrink-0" />}
                        </button>
                      </li>
                      {brands.map((brand) => {
                        const isSelected = selectedBrand === brand
                        return (
                          <li key={brand}>
                            <button
                              type="button"
                              onClick={() => { setSelectedBrand(isSelected ? null : brand); setFilterOpen(false) }}
                              className={`w-full flex items-center justify-between gap-2 px-3.5 py-2.5 rounded-xl text-sm font-medium transition-colors ${isSelected ? 'bg-brand text-white' : 'text-slate-700 hover:bg-slate-100'}`}
                            >
                              <span className="truncate text-left">{brand}</span>
                              {isSelected && <ChevronRight className="w-4 h-4 shrink-0" />}
                            </button>
                          </li>
                        )
                      })}
                    </ul>
                  </div>
                )}

                <div className="border-t border-slate-200 pt-4">
                  <div className="flex items-center justify-between mb-2">
                    <h3 className="text-sm font-semibold text-slate-800">{tProducts('priceRange')}</h3>
                  </div>
                  <Slider
                    value={priceRange}
                    onValueChange={(value) => setPriceRange([value[0], value[1]])}
                    min={dynamicMinPrice}
                    max={dynamicMaxPrice}
                    step={100}
                    className="mb-4"
                  />
                  <div className="grid grid-cols-2 gap-2">
                    <Input
                      value={minInput}
                      onChange={(e) => setMinInput(e.target.value.replace(/[^0-9]/g, ''))}
                      onBlur={() => {
                        const parsed = Number(minInput || dynamicMinPrice)
                        const nextMin = Math.max(dynamicMinPrice, Math.min(parsed, priceRange[1]))
                        setPriceRange([nextMin, priceRange[1]])
                        setMinInput(String(nextMin))
                      }}
                      className="h-10 rounded-lg border-slate-200"
                      inputMode="numeric"
                    />
                    <Input
                      value={maxInput}
                      onChange={(e) => setMaxInput(e.target.value.replace(/[^0-9]/g, ''))}
                      onBlur={() => {
                        const parsed = Number(maxInput || dynamicMaxPrice)
                        const nextMax = Math.min(dynamicMaxPrice, Math.max(parsed, priceRange[0]))
                        setPriceRange([priceRange[0], nextMax])
                        setMaxInput(String(nextMax))
                      }}
                      className="h-10 rounded-lg border-slate-200"
                      inputMode="numeric"
                    />
                  </div>
                </div>

                {specFacets.length > 0 && (
                  <div className="border-t border-slate-200 pt-4 space-y-4">
                    {specFacets.map((facet) => (
                      <div key={facet.key}>
                        <h4 className="text-xs font-semibold uppercase tracking-wide text-slate-500 mb-2">{facet.key}</h4>
                        <div className="space-y-1.5 max-h-44 overflow-y-auto pr-1">
                          {facet.values.map((value) => {
                            const checked = (selectedSpecs[facet.key] ?? []).includes(value)
                            return (
                              <label key={`${facet.key}-${value}`} className="flex items-center gap-2 text-sm text-slate-700">
                                <input
                                  type="checkbox"
                                  checked={checked}
                                  onChange={(e) => updateSpecFilter(facet.key, value, e.target.checked)}
                                  className="h-4 w-4 rounded border-slate-300 text-brand focus:ring-brand/30"
                                />
                                <span className="truncate">{value}</span>
                              </label>
                            )
                          })}
                        </div>
                      </div>
                    ))}
                  </div>
                )}

                <Button
                  variant="outline"
                  className="w-full h-10 rounded-lg border-slate-300 text-slate-700"
                  onClick={resetAllFilters}
                >
                  {tProducts('clearAllFilters')}
                </Button>
              </div>
            </div>
          </SheetContent>
        </Sheet>

        <div className="grid grid-cols-1 lg:grid-cols-[280px_minmax(0,1fr)] gap-6 lg:gap-8 min-w-0 items-start">
          <aside className="hidden lg:block">
            <div className="sticky top-[108px] rounded-2xl border border-slate-200 bg-white p-4 shadow-sm">
              <div className="space-y-6">
                <div className="relative">
                  <Input
                    type="search"
                    placeholder={tProducts('searchPlaceholder')}
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                    className="h-10 rounded-lg border-slate-200 bg-slate-50 text-sm pl-10"
                  />
                  <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
                </div>

                {subcategories.length > 0 && (
                  <nav aria-label="Kategori filtresi">
                    <h3 className="text-sm font-semibold text-slate-800 mb-2">{tProducts('category')}</h3>
                    <ul className="space-y-1">
                      <li>
                        <button
                          type="button"
                          onClick={() => setSelectedSub(null)}
                          className={`w-full flex items-center justify-between gap-2 px-3 py-2 rounded-lg text-sm font-medium transition-colors ${!selectedSub ? 'bg-brand text-white' : 'text-slate-600 hover:bg-slate-100'}`}
                        >
                          <span>{tCommon('all')}</span>
                          {!selectedSub && <ChevronRight className="w-4 h-4 shrink-0" />}
                        </button>
                      </li>
                      {subcategories.map((sub) => {
                        const isSelected = selectedSub === sub
                        return (
                          <li key={sub}>
                            <button
                              type="button"
                              onClick={() => setSelectedSub(isSelected ? null : sub)}
                              className={`w-full flex items-center justify-between gap-2 px-3 py-2 rounded-lg text-sm font-medium transition-colors ${isSelected ? 'bg-brand text-white' : 'text-slate-600 hover:bg-slate-100'}`}
                            >
                              <span className="truncate text-left">{sub}</span>
                              {isSelected && <ChevronRight className="w-4 h-4 shrink-0" />}
                            </button>
                          </li>
                        )
                      })}
                    </ul>
                  </nav>
                )}

                {brands.length > 0 && (
                  <div className="border-t border-slate-200 pt-4">
                    <h3 className="text-sm font-semibold text-slate-800 mb-2">{tProducts('brand')}</h3>
                    <ul className="space-y-0.5">
                      <li>
                        <button
                          type="button"
                          onClick={() => setSelectedBrand(null)}
                          className={`w-full flex items-center justify-between gap-2 px-3 py-2 rounded-lg text-sm font-medium transition-colors ${!selectedBrand ? 'bg-brand text-white' : 'text-slate-600 hover:bg-slate-100'}`}
                        >
                          <span>{tCommon('all')}</span>
                          {!selectedBrand && <ChevronRight className="w-4 h-4 shrink-0" />}
                        </button>
                      </li>
                      {brands.map((brand) => {
                        const isSelected = selectedBrand === brand
                        return (
                          <li key={brand}>
                            <button
                              type="button"
                              onClick={() => setSelectedBrand(isSelected ? null : brand)}
                              className={`w-full flex items-center justify-between gap-2 px-3 py-2 rounded-lg text-sm font-medium transition-colors ${isSelected ? 'bg-brand text-white' : 'text-slate-600 hover:bg-slate-100'}`}
                            >
                              <span className="truncate text-left">{brand}</span>
                              {isSelected && <ChevronRight className="w-4 h-4 shrink-0" />}
                            </button>
                          </li>
                        )
                      })}
                    </ul>
                  </div>
                )}

                <div className="border-t border-slate-200 pt-4">
                  <div className="flex items-center justify-between mb-2">
                    <h3 className="text-sm font-semibold text-slate-800">{tProducts('priceRange')}</h3>
                  </div>
                  <Slider
                    value={priceRange}
                    onValueChange={(value) => setPriceRange([value[0], value[1]])}
                    min={dynamicMinPrice}
                    max={dynamicMaxPrice}
                    step={100}
                    className="mb-4"
                  />
                  <div className="grid grid-cols-2 gap-2">
                    <Input
                      value={minInput}
                      onChange={(e) => setMinInput(e.target.value.replace(/[^0-9]/g, ''))}
                      onBlur={() => {
                        const parsed = Number(minInput || dynamicMinPrice)
                        const nextMin = Math.max(dynamicMinPrice, Math.min(parsed, priceRange[1]))
                        setPriceRange([nextMin, priceRange[1]])
                        setMinInput(String(nextMin))
                      }}
                      className="h-10 rounded-lg border-slate-200 text-sm"
                      inputMode="numeric"
                    />
                    <Input
                      value={maxInput}
                      onChange={(e) => setMaxInput(e.target.value.replace(/[^0-9]/g, ''))}
                      onBlur={() => {
                        const parsed = Number(maxInput || dynamicMaxPrice)
                        const nextMax = Math.min(dynamicMaxPrice, Math.max(parsed, priceRange[0]))
                        setPriceRange([priceRange[0], nextMax])
                        setMaxInput(String(nextMax))
                      }}
                      className="h-10 rounded-lg border-slate-200 text-sm"
                      inputMode="numeric"
                    />
                  </div>
                </div>

                {specFacets.length > 0 && (
                  <div className="border-t border-slate-200 pt-4 space-y-4">
                    {specFacets.map((facet) => (
                      <div key={facet.key}>
                        <h4 className="text-xs font-semibold uppercase tracking-wide text-slate-500 mb-2">{facet.key}</h4>
                        <div className="space-y-1.5 max-h-44 overflow-y-auto pr-1">
                          {facet.values.map((value) => {
                            const checked = (selectedSpecs[facet.key] ?? []).includes(value)
                            return (
                              <label key={`${facet.key}-${value}`} className="flex items-center gap-2 text-sm text-slate-700 pointer-cursor">
                                <input
                                  type="checkbox"
                                  checked={checked}
                                  onChange={(e) => updateSpecFilter(facet.key, value, e.target.checked)}
                                  className="h-4 w-4 rounded border-slate-300 text-brand focus:ring-brand/30"
                                />
                                <span className="truncate">{value}</span>
                              </label>
                            )
                          })}
                        </div>
                      </div>
                    ))}
                  </div>
                )}

                <Button
                  variant="outline"
                  className="w-full h-10 rounded-lg border-slate-300 text-slate-700"
                  onClick={resetAllFilters}
                >
                  {tProducts('clearAllFilters')}
                </Button>
              </div>
            </div>
          </aside>

          <main className="min-w-0">
            <div className="flex items-center justify-between mb-6 gap-4 flex-wrap border-b border-slate-200 pb-5 pt-4">
              <p className="text-slate-500 text-sm">
                <span className="font-semibold text-slate-900">{tProducts('productsListed', { count: filteredProducts.length })}</span>
              </p>
              <div className="flex items-center gap-2.5">
                <Button type="button" variant="outline" size="sm" className="min-h-[44px] h-11 rounded-xl border-slate-200 gap-2 touch-manipulation lg:hidden" onClick={() => setFilterOpen(true)}>
                  <Filter className="w-4 h-4" />
                  {tProducts('filters')}
                </Button>
                <SlidersHorizontal className="w-4 h-4 text-slate-400 hidden sm:block" />
                <Select value={sortBy} onValueChange={(v) => setSortBy(v as SortOption)}>
                  <SelectTrigger aria-label="Sıralama" className="w-[178px] min-h-[44px] h-11 text-sm border-slate-200 bg-white rounded-xl touch-manipulation">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="newest">{tProducts('sortNewest')}</SelectItem>
                    <SelectItem value="price-asc">{tProducts('sortPriceAsc')}</SelectItem>
                    <SelectItem value="price-desc">{tProducts('sortPriceDesc')}</SelectItem>
                    <SelectItem value="name-asc">{tProducts('sortNameAsc')}</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>

            {(searchQuery || selectedBrand || selectedSub || Object.keys(selectedSpecs).length > 0) && (
              <div className="mb-6 flex flex-wrap items-center gap-2">
                {searchQuery && (
                  <span className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-full text-xs font-medium bg-slate-100 text-slate-700 border border-slate-200">
                    Arama: {searchQuery}
                    <button type="button" onClick={() => setSearchQuery('')} className="text-slate-400 hover:text-slate-600"><X className="w-3.5 h-3.5" /></button>
                  </span>
                )}
                {selectedBrand && (
                  <span className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-full text-xs font-medium bg-slate-100 text-slate-700 border border-slate-200">
                    Marka: {selectedBrand}
                    <button type="button" onClick={() => setSelectedBrand(null)} className="text-slate-400 hover:text-slate-600"><X className="w-3.5 h-3.5" /></button>
                  </span>
                )}
                {selectedSub && (
                  <span className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-full text-xs font-medium bg-slate-100 text-slate-700 border border-slate-200">
                    Alt Kategori: {selectedSub}
                    <button type="button" onClick={() => setSelectedSub(null)} className="text-slate-400 hover:text-slate-600"><X className="w-3.5 h-3.5" /></button>
                  </span>
                )}
                {Object.entries(selectedSpecs).map(([key, values]) => values.map(val => (
                  <span key={`${key}-${val}`} className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-full text-xs font-medium bg-slate-100 text-slate-700 border border-slate-200">
                    {key}: {val}
                    <button type="button" onClick={() => updateSpecFilter(key, val, false)} className="text-slate-400 hover:text-slate-600"><X className="w-3.5 h-3.5" /></button>
                  </span>
                )))}
                <button
                  type="button"
                  onClick={resetAllFilters}
                  className="text-xs font-semibold text-brand hover:text-brand-hover hover:underline transition-all px-2"
                >
                  Tümünü Temizle
                </button>
              </div>
            )}

            {filteredProducts.length === 0 ? (
              <div className="text-center py-24">
                <Package className="w-14 h-14 text-slate-200 mx-auto mb-4" />
                <p className="text-slate-500 text-lg font-medium">{tProducts('noCategoryProducts')}</p>
                <button onClick={resetAllFilters} className="mt-4 text-brand hover:underline text-sm font-medium">
                  {tProducts('clearAllFilters')}
                </button>
              </div>
            ) : (
              <div className="grid grid-cols-2 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-3 sm:gap-5 md:gap-6 min-w-0">
                {filteredProducts.map((product) => (
                  <ProductCard
                    key={product.id}
                    product={{ id: product.id, name: product.name, description: product.description, price: product.price, image: product.image, category: product.category, brand: product.brand }}
                    sku={product.sku}
                    badges={product.tags}
                    stock={product.stock}
                    isVariantProduct={product.isVariantProduct}
                    oldPrice={product.oldPrice}
                    discount={product.discount}
                  />
                ))}
              </div>
            )}
          </main>
        </div>
      </div>
    </ProductPageShell>
  )
}
