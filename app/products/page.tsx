'use client'

import React, { useEffect, useMemo, useState, Suspense } from 'react'
import Link from 'next/link'
import { useSearchParams, useRouter } from 'next/navigation'
import { useTranslations } from 'next-intl'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { Slider } from '@/components/ui/slider'
import { Sheet, SheetContent, SheetHeader, SheetTitle } from '@/components/ui/sheet'
import { Filter, ChevronLeft, ChevronRight, Search, Menu, X } from 'lucide-react'
import { fmtPrice } from '@/lib/format'
import { useCurrencyStore } from '@/lib/store/useCurrencyStore'
import { useExchangeRates } from '@/lib/useExchangeRates'
import { mockProducts } from '@/lib/products-mock'
import { ProductCard } from '@/components/ProductCard'
import { buildSpecFacets } from '@/lib/spec-facets'
import { CATEGORY_GROUPS, getGroupIdForCategory, getCategoryValuesByGroupId, getCategoryKey } from '@/lib/categories'
import { productMatchesQuery } from '@/lib/search-product'
import { ProductPageShell } from '@/components/ProductPageShell'

type SortOption = 'price-asc' | 'price-desc' | 'name-asc' | 'name-desc' | 'newest'
type SpecFilters = Record<string, string[]>

const ALL_CATEGORY_VALUES = new Set(CATEGORY_GROUPS.flatMap((g) => [...g.categoryValues] as string[]))

function isGroupId(cat: string) {
  return CATEGORY_GROUPS.some((g) => g.id === cat)
}

function ProductsPageContent() {
  const searchParams = useSearchParams()
  const router = useRouter()
  const tCommon = useTranslations('common')
  const tHeader = useTranslations('header')
  const tProducts = useTranslations('products')

  const currency = useCurrencyStore((s) => s.currency)
  const { rates } = useExchangeRates()
  const formatPrice = (amount: number) => fmtPrice(amount, currency, rates?.rates ?? null)

  const [filterOpen, setFilterOpen] = useState(false)
  const [searchQuery, setSearchQuery] = useState('')
  const [selectedCategory, setSelectedCategory] = useState<string | null>(null)
  const [selectedBrand, setSelectedBrand] = useState<string | null>(null)
  const [selectedSpecs, setSelectedSpecs] = useState<SpecFilters>({})
  const [sortBy, setSortBy] = useState<SortOption>('newest')
  const [currentPage, setCurrentPage] = useState(1)
  const [allProducts, setAllProducts] = useState(mockProducts)

  useEffect(() => {
    fetch('/api/products')
      .then((res) => res.json())
      .then((data) => { if (Array.isArray(data) && data.length > 0) setAllProducts(data) })
      .catch(() => {})
  }, [])

  const brands = useMemo(
    () =>
      Array.from(new Set(allProducts.map((p) => p.brand).filter(Boolean))).sort((a, b) =>
        (a || '').localeCompare(b || '', 'tr')
      ) as string[],
    [allProducts]
  )
  const availableSubCategorySet = useMemo(
    () => new Set(allProducts.map((p) => p.category)),
    [allProducts]
  )

  const buildProductsUrl = (opts: { category?: string | null; q?: string; brand?: string | null }) => {
    const params = new URLSearchParams()
    if (opts.category) params.set('category', opts.category)
    if (opts.q?.trim()) params.set('q', opts.q.trim())
    if (opts.brand) params.set('brand', opts.brand)
    return `/products${params.toString() ? `?${params.toString()}` : ''}`
  }

  useEffect(() => {
    const categoryParam = searchParams.get('category')
    let value: string | null = null
    if (categoryParam) {
      if (isGroupId(categoryParam)) {
        value = categoryParam
      } else if (ALL_CATEGORY_VALUES.has(categoryParam)) {
        value = categoryParam
      } else {
        const groupId = getGroupIdForCategory(categoryParam)
        if (groupId) value = groupId
      }
    }
    setSelectedCategory(value)

    const q = searchParams.get('q')
    setSearchQuery(q ?? '')

    const brandParam = searchParams.get('brand')
    setSelectedBrand(brandParam ?? null)

    const sortParam = searchParams.get('sort') as SortOption | null
    if (sortParam && ['newest', 'price-asc', 'price-desc', 'name-asc', 'name-desc'].includes(sortParam)) {
      setSortBy(sortParam)
    }
  }, [searchParams])

  const categoryAndSearchFiltered = useMemo(() => {
    return allProducts.filter((product) => {
      const matchesSearch = productMatchesQuery(product, searchQuery.trim())

      let matchesCategory: boolean
      if (!selectedCategory) {
        matchesCategory = true
      } else if (isGroupId(selectedCategory)) {
        const groupValues = getCategoryValuesByGroupId(selectedCategory)
        matchesCategory = groupValues.includes(product.category)
      } else {
        matchesCategory = product.category === selectedCategory
      }

      return matchesSearch && matchesCategory
    })
  }, [searchQuery, selectedCategory, allProducts])

  const dynamicMinPrice = useMemo(() => {
    if (categoryAndSearchFiltered.length === 0) return 0
    return Math.min(...categoryAndSearchFiltered.map((p) => p.price))
  }, [categoryAndSearchFiltered])

  const dynamicMaxPrice = useMemo(() => {
    if (categoryAndSearchFiltered.length === 0) return 0
    return Math.max(...categoryAndSearchFiltered.map((p) => p.price))
  }, [categoryAndSearchFiltered])

  const [priceRange, setPriceRange] = useState<[number, number]>([dynamicMinPrice, dynamicMaxPrice])
  const [minInput, setMinInput] = useState<string>(String(dynamicMinPrice))
  const [maxInput, setMaxInput] = useState<string>(String(dynamicMaxPrice))

  useEffect(() => {
    setPriceRange([dynamicMinPrice, dynamicMaxPrice])
    setMinInput(String(dynamicMinPrice))
    setMaxInput(String(dynamicMaxPrice))
  }, [dynamicMinPrice, dynamicMaxPrice])

  const specFacets = useMemo(() => {
    if (!selectedCategory) return []
    return buildSpecFacets(categoryAndSearchFiltered)
  }, [selectedCategory, categoryAndSearchFiltered])

  useEffect(() => {
    setSelectedSpecs((prev) => {
      const allowedKeys = new Set(specFacets.map((f) => f.key))
      const next: SpecFilters = {}
      for (const [key, values] of Object.entries(prev)) {
        if (!allowedKeys.has(key)) continue
        const facet = specFacets.find((f) => f.key === key)
        if (!facet) continue
        const allowedValues = new Set(facet.values)
        const valid = values.filter((v) => allowedValues.has(v))
        if (valid.length > 0) next[key] = valid
      }
      return next
    })
  }, [specFacets])

  const filteredProducts = useMemo(() => {
    let result = categoryAndSearchFiltered.filter((product) => {
      const matchesBrand = !selectedBrand || product.brand === selectedBrand
      const matchesPrice = product.price >= priceRange[0] && product.price <= priceRange[1]

      const matchesSpecs = Object.entries(selectedSpecs).every(([specKey, selectedValues]) => {
        if (selectedValues.length === 0) return true
        const specValue = product.specifications?.[specKey]
        return !!specValue && selectedValues.includes(specValue)
      })

      return matchesBrand && matchesPrice && matchesSpecs
    })

    result = [...result].sort((a, b) => {
      switch (sortBy) {
        case 'price-asc':
          return a.price - b.price
        case 'price-desc':
          return b.price - a.price
        case 'name-asc':
          return a.name.localeCompare(b.name, 'tr')
        case 'name-desc':
          return b.name.localeCompare(a.name, 'tr')
        case 'newest':
        default:
          return 0
      }
    })

    return result
  }, [categoryAndSearchFiltered, selectedBrand, priceRange, selectedSpecs, sortBy])

  useEffect(() => {
    setCurrentPage(1)
  }, [searchQuery, selectedCategory, selectedBrand, priceRange, selectedSpecs, sortBy])

  const itemsPerPage = 24
  const totalPages = Math.ceil(filteredProducts.length / itemsPerPage)
  const startIndex = (currentPage - 1) * itemsPerPage
  const paginatedProducts = filteredProducts.slice(startIndex, startIndex + itemsPerPage)

  const updateSpecFilter = (key: string, value: string, checked: boolean) => {
    setSelectedSpecs((prev) => {
      const current = prev[key] ?? []
      const nextValues = checked ? [...current, value] : current.filter((v) => v !== value)

      if (nextValues.length === 0) {
        const next = { ...prev }
        delete next[key]
        return next
      }

      return { ...prev, [key]: Array.from(new Set(nextValues)) }
    })
  }

  const resetAllFilters = () => {
    setSearchQuery('')
    setSelectedCategory(null)
    setSelectedBrand(null)
    setSelectedSpecs({})
    setPriceRange([dynamicMinPrice, dynamicMaxPrice])
    setMinInput(String(dynamicMinPrice))
    setMaxInput(String(dynamicMaxPrice))
    router.push('/products')
  }

  const filtersPanel = (
    <div className="space-y-6">
      <form
        className="flex gap-2 min-w-0"
        onSubmit={(e) => {
          e.preventDefault()
          router.push(buildProductsUrl({ category: selectedCategory, q: searchQuery, brand: selectedBrand }))
        }}
      >
        <Input
          type="search"
          placeholder={tProducts('searchPlaceholder')}
          value={searchQuery}
          onChange={(e) => { setSearchQuery(e.target.value); setCurrentPage(1) }}
          className="flex-1 min-w-0 max-w-full h-10 rounded-lg border-slate-200 bg-slate-50 text-sm"
          autoComplete="off"
        />
        <Button type="submit" size="icon" className="h-10 w-10 shrink-0 rounded-lg bg-brand hover:bg-brand-hover" aria-label={tCommon('search')}>
          <Search className="w-4 h-4 text-white" />
        </Button>
      </form>

      <nav aria-label="Kategoriler">
        <h3 className="text-sm font-semibold text-slate-800 mb-2">{tProducts('category')}</h3>
        <ul className="space-y-1">
          <li>
            <Link
              href={buildProductsUrl({ category: null, q: searchQuery, brand: selectedBrand })}
              onClick={() => {
                setSelectedCategory(null)
                setSelectedSpecs({})
              }}
              className={`flex items-center justify-between gap-2 px-3.5 py-2.5 rounded-lg text-sm font-medium transition-colors ${!selectedCategory ? 'bg-brand text-white shadow-sm' : 'text-slate-700 hover:bg-slate-100'}`}
            >
              <span>{tCommon('all')}</span>
              {!selectedCategory && <ChevronRight className="w-4 h-4 shrink-0" />}
            </Link>
          </li>
          {CATEGORY_GROUPS.map((group) => {
            const isGroupSelected = selectedCategory === group.id
            const isSubOfGroupSelected =
              selectedCategory != null &&
              !isGroupId(selectedCategory) &&
              (group.categoryValues as readonly string[]).includes(selectedCategory)
            const isSelected = isGroupSelected || isSubOfGroupSelected
            const label = tHeader(group.labelKey)
            const subCategories = (group.categoryValues as readonly string[]).filter((value) =>
              availableSubCategorySet.has(value)
            )

            return (
              <li key={group.id} className="space-y-1">
                <Link
                  href={buildProductsUrl({ category: group.id, q: searchQuery, brand: selectedBrand })}
                  onClick={() => {
                    setSelectedCategory(group.id)
                    setSelectedSpecs({})
                  }}
                  className={`flex items-center justify-between gap-2 px-3.5 py-2.5 rounded-lg text-sm font-medium transition-colors ${isSelected ? 'bg-brand text-white shadow-sm' : 'text-slate-700 hover:bg-slate-100'}`}
                >
                  <span className="truncate">{label}</span>
                  {isSelected && <ChevronRight className="w-4 h-4 shrink-0" />}
                </Link>

                {isSelected && (
                  <ul className="ml-4 mt-1 space-y-1 border-l-2 border-slate-200 pl-2 py-1">
                    {subCategories.map((subVal) => {
                      const isSubSelected = selectedCategory === subVal
                      return (
                        <li key={subVal}>
                          <Link
                            href={buildProductsUrl({ category: subVal, q: searchQuery, brand: selectedBrand })}
                            onClick={() => {
                              setSelectedCategory(subVal)
                              setSelectedSpecs({})
                            }}
                            className={`block px-3 py-1.5 rounded-md text-xs font-semibold transition-colors ${isSubSelected ? 'text-brand bg-brand-light/50' : 'text-slate-500 hover:text-slate-900 hover:bg-slate-50'}`}
                          >
                            {getCategoryKey(subVal) ? tHeader(getCategoryKey(subVal)!) : subVal}
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

      <section>
        <h3 className="text-sm font-semibold text-slate-800 mb-2">{tProducts('brand')}</h3>
        <div className="space-y-1.5 max-h-52 overflow-y-auto pr-1">
          <button
            type="button"
            onClick={() => {
              setSelectedBrand(null)
              router.push(buildProductsUrl({ category: selectedCategory, q: searchQuery, brand: null }))
            }}
            className={`w-full text-left px-3 py-2 rounded-lg text-sm transition-colors ${selectedBrand === null ? 'bg-brand-light text-brand font-semibold' : 'text-slate-600 hover:bg-slate-100'}`}
          >
            {tProducts('allBrands')}
          </button>
          {brands.map((brand) => (
            <button
              key={brand}
              type="button"
              onClick={() => {
                setSelectedBrand(brand)
                router.push(buildProductsUrl({ category: selectedCategory, q: searchQuery, brand }))
              }}
              className={`w-full text-left px-3 py-2 rounded-lg text-sm transition-colors ${selectedBrand === brand ? 'bg-brand-light text-brand font-semibold' : 'text-slate-600 hover:bg-slate-100'}`}
            >
              {brand}
            </button>
          ))}
        </div>
      </section>

      <section>
        <div className="flex items-center justify-between mb-2">
          <h3 className="text-sm font-semibold text-slate-800">{tProducts('priceRange')}</h3>
          <span className="text-xs text-slate-500">
            {formatPrice(priceRange[0])} - {formatPrice(priceRange[1])}
          </span>
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
      </section>

      {selectedCategory && specFacets.length > 0 && (
        <section className="space-y-4">
          <h3 className="text-sm font-semibold text-slate-800">Kategoriye Özel Filtreler</h3>
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
        </section>
      )}

      <Button
        type="button"
        variant="outline"
        className="w-full h-10 rounded-lg border-slate-300 text-slate-700"
        onClick={resetAllFilters}
      >
        {tProducts('clearAllFilters')}
      </Button>
    </div>
  )

  return (
    <ProductPageShell
      breadcrumbs={
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 flex-wrap py-1">
          <h1 className="sr-only">{tProducts('allProducts')}</h1>
          <div className="flex items-center gap-2 text-sm text-slate-500 min-w-0">
            <Link href="/" className="hover:text-slate-900 transition-colors shrink-0">{tCommon('home')}</Link>
            <ChevronRight className="w-3.5 h-3.5 shrink-0 text-slate-300" />
            <span className="text-slate-900 font-semibold truncate">{tProducts('allProducts')}</span>
          </div>
          <div className="flex flex-wrap items-center gap-3">
            <Button
              type="button"
              variant="outline"
              size="sm"
              className="min-h-[44px] h-11 rounded-xl border-slate-200 gap-2 touch-manipulation lg:hidden"
              onClick={() => setFilterOpen(true)}
            >
              <Filter className="w-4 h-4" />
              {tProducts('filters')}
            </Button>
            <span className="text-sm text-slate-600 font-medium">{tProducts('productsListed', { count: filteredProducts.length })}</span>
            <Select value={sortBy} onValueChange={(value) => setSortBy(value as SortOption)}>
              <SelectTrigger className="min-h-[44px] h-11 w-[180px] max-w-full bg-white border-slate-200 text-slate-800 text-sm rounded-xl touch-manipulation">
                <SelectValue placeholder={tProducts('sortByPlaceholder')} />
              </SelectTrigger>
              <SelectContent align="end" className="rounded-xl border-slate-200 bg-white">
                <SelectItem value="newest" className="text-sm">{tProducts('sortNewest')}</SelectItem>
                <SelectItem value="price-asc" className="text-sm">{tProducts('sortPriceAsc')}</SelectItem>
                <SelectItem value="price-desc" className="text-sm">{tProducts('sortPriceDesc')}</SelectItem>
                <SelectItem value="name-asc" className="text-sm">{tProducts('sortNameAsc')}</SelectItem>
                <SelectItem value="name-desc" className="text-sm">{tProducts('sortNameDesc')}</SelectItem>
              </SelectContent>
            </Select>
          </div>
        </div>
      }
    >
      <Sheet open={filterOpen} onOpenChange={setFilterOpen}>
        <SheetContent side="left" className="w-[85vw] sm:max-w-md overflow-y-auto min-w-0 rounded-r-2xl border-slate-200" onOpenAutoFocus={(e: Event) => e.preventDefault()}>
          <SheetHeader>
            <SheetTitle className="flex items-center gap-2">
              <Menu className="w-5 h-5" />
              {tProducts('categoriesFilters')}
            </SheetTitle>
          </SheetHeader>
          <div className="mt-6">{filtersPanel}</div>
        </SheetContent>
      </Sheet>

      <div className="grid grid-cols-1 lg:grid-cols-[280px_minmax(0,1fr)] gap-6 lg:gap-8 min-w-0">
        <aside className="hidden lg:block">
          <div className="sticky top-6 rounded-2xl border border-slate-200 bg-white p-4 shadow-sm">{filtersPanel}</div>
        </aside>

        <main className="min-w-0 overflow-x-hidden">
          {Object.keys(selectedSpecs).length > 0 && (
            <div className="mb-4 flex flex-wrap items-center gap-2">
              {Object.entries(selectedSpecs).flatMap(([key, values]) => values.map((value) => (
                <span key={`${key}-${value}`} className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-xs bg-slate-100 text-slate-700 border border-slate-200">
                  {key}: {value}
                  <button
                    type="button"
                    onClick={() => updateSpecFilter(key, value, false)}
                    className="text-slate-500 hover:text-slate-800"
                    aria-label="Filtreyi kaldır"
                  >
                    <X className="w-3 h-3" />
                  </button>
                </span>
              )))}
            </div>
          )}

          <div
            className={`grid grid-cols-2 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-3 sm:gap-5 md:gap-6 grid-products-mobile ${
              Object.keys(selectedSpecs).length > 0 ? 'mt-4' : 'mt-5'
            }`}
          >
            {paginatedProducts.map((product) => (
              <ProductCard
                key={product.id}
                product={product}
                oldPrice={product.oldPrice}
                discount={product.discount}
                badges={product.tags}
                sku={product.sku}
                stock={product.stock}
                rating={product.rating}
                isVariantProduct={product.isVariantProduct}
                variant="full"
              />
            ))}
          </div>

          {filteredProducts.length === 0 && (
            <div className="text-center py-20 px-4 bg-white rounded-3xl border border-slate-200 shadow-sm overflow-hidden relative group">
              <div className="absolute inset-0 bg-gradient-to-b from-slate-50 to-transparent opacity-50" />
              <div className="relative z-10 max-w-sm mx-auto">
                <div className="w-20 h-20 rounded-full bg-brand-light flex items-center justify-center mx-auto mb-6">
                  <Search className="w-10 h-10 text-brand" />
                </div>
                <h3 className="text-xl font-bold text-slate-900 mb-2">{tProducts('notFound')}</h3>
                <p className="text-slate-500 mb-8 leading-relaxed">{tProducts('notFoundDesc')}</p>
                <Button onClick={resetAllFilters} className="bg-brand hover:bg-brand-hover text-white rounded-xl px-8">
                  {tProducts('clearAllFilters')}
                </Button>
              </div>
            </div>
          )}

          {totalPages > 1 && (
            <div className="flex items-center justify-center gap-2 mt-8 md:mt-10 flex-wrap py-6">
              <Button
                variant="outline"
                size="sm"
                className="rounded-lg border-slate-300 min-h-[44px] min-w-[44px] touch-manipulation text-slate-700 hover:bg-slate-50"
                onClick={() => setCurrentPage((prev) => Math.max(1, prev - 1))}
                disabled={currentPage === 1}
                aria-label={tProducts('prevPage')}
              >
                <ChevronLeft className="w-4 h-4" />
              </Button>
              <span className="min-h-[44px] px-3 flex items-center justify-center text-sm font-medium text-slate-600 md:sr-only">
                {tProducts('pageOf', { current: currentPage, total: totalPages })}
              </span>
              <div className="hidden md:flex items-center gap-1">
                {Array.from({ length: totalPages }, (_, i) => i + 1).map((page) => (
                  <Button
                    key={page}
                    variant={currentPage === page ? 'default' : 'outline'}
                    size="sm"
                    className={`min-h-[44px] min-w-[44px] rounded-lg touch-manipulation ${currentPage === page ? 'bg-brand hover:bg-brand-hover text-white' : 'bg-white border-slate-300 text-slate-700 hover:bg-slate-50'}`}
                    onClick={() => setCurrentPage(page)}
                  >
                    {page}
                  </Button>
                ))}
              </div>
              <Button
                variant="outline"
                size="sm"
                className="rounded-lg border-slate-300 min-h-[44px] min-w-[44px] touch-manipulation text-slate-700 hover:bg-slate-50"
                onClick={() => setCurrentPage((prev) => Math.min(totalPages, prev + 1))}
                disabled={currentPage === totalPages}
                aria-label={tProducts('nextPage')}
              >
                <ChevronRight className="w-4 h-4" />
              </Button>
            </div>
          )}
        </main>
      </div>
    </ProductPageShell>
  )
}

export default function ProductsPage() {
  const tCommon = useTranslations('common')

  return (
    <Suspense
      fallback={
        <div className="min-h-screen flex items-center justify-center">
          <div className="text-center">
            <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-brand mx-auto mb-4"></div>
            <p className="text-ink-muted">{tCommon('loading')}</p>
          </div>
        </div>
      }
    >
      <ProductsPageContent />
    </Suspense>
  )
}
