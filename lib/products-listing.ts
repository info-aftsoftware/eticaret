import { isQuoteOnly } from '@/lib/sale-mode'
import type { StorefrontProduct } from '@/lib/discounts'
import { getCategoryValuesByGroupId } from '@/lib/categories'
import { productMatchesQuery, type ProductLike } from '@/lib/search-product'
import { buildSpecFacets, type SpecFacet } from '@/lib/spec-facets'
import { isCategoryGroupId, type ProductSortOption, type ProductsQuery } from '@/lib/products-query'

/**
 * /products liste mantığı (sunucu ve istemci ortak): kategori/arama/marka/fiyat/özellik filtresi, sıralama, sayfalama.
 * Sunucu ilk sayfayı bununla hazırlar (ProductsSnapshot), istemci /api/products verisi gelince aynı fonksiyonlarla devam eder;
 * iki taraf aynı kuralları kullandığı için ürün sayısı hydration öncesi ve sonrası aynıdır.
 */

export const PRODUCTS_PER_PAGE = 24

export type SpecFilters = Record<string, string[]>

export type ListingProduct = ProductLike & {
  id: string
  name: string
  price: number
  category: string
  brand?: string
  specifications?: Record<string, string>
  saleMode?: string
}

/** /api/products liste öğesi: varyant özellikleri, döviz fiyatı ve kargo kaynağı yalnızca ürün detay API'sinde */
export function toListItem(p: StorefrontProduct) {
  const { basePrice: _basePrice, desiSource: _desiSource, dimensionsCm: _dims, ...rest } = p
  return {
    ...rest,
    variants: p.variants?.map(({ specifications: _s, basePrice: _b, desiSource: _d, dimensionsCm: _dm, ...v }) => v),
  }
}

export type ProductListItem = ReturnType<typeof toListItem>

/** Sunucunun ilk sayfa için gönderdiği kart verisi (RSC yükü küçük kalsın diye yalnızca ProductCard alanları) */
export function toCardItem(p: StorefrontProduct) {
  return {
    id: p.id,
    sku: p.sku,
    name: p.name,
    description: p.description,
    price: p.price,
    oldPrice: p.oldPrice,
    discount: p.discount,
    image: p.image,
    category: p.category,
    brand: p.brand,
    stock: p.stock,
    rating: p.rating,
    tags: p.tags,
    isVariantProduct: p.isVariantProduct,
    variants: p.variants?.map((v) => ({ key: v.key, label: v.label, price: v.price, sku: v.sku })),
    saleMode: p.saleMode,
    salesClosed: p.salesClosed,
  }
}

export type ProductCardItem = ReturnType<typeof toCardItem>

export function filterByCategoryAndSearch<T extends ListingProduct>(products: T[], category: string | null, q: string): T[] {
  const query = q.trim()
  const groupValues = category && isCategoryGroupId(category) ? getCategoryValuesByGroupId(category) : null
  return products.filter((product) => {
    if (category) {
      const matchesCategory = groupValues ? groupValues.includes(product.category) : product.category === category
      if (!matchesCategory) return false
    }
    return productMatchesQuery(product, query)
  })
}

/** Fiyat aralığı; teklifle satılan (fiyatı olmayan) ürünler sayılmaz */
export function getPriceBounds(all: { price: number; saleMode?: string }[]): [number, number] {
  const products = all.filter((p) => !isQuoteOnly(p))
  if (products.length === 0) return [0, 0]
  let min = Infinity
  let max = -Infinity
  for (const p of products) {
    if (p.price < min) min = p.price
    if (p.price > max) max = p.price
  }
  return [min, max]
}

export function getBrands(products: { brand?: string }[]): string[] {
  return (Array.from(new Set(products.map((p) => p.brand).filter(Boolean))) as string[]).sort((a, b) =>
    a.localeCompare(b, 'tr')
  )
}

/** Kategori seçiliyse özellik filtreleri (kategori + arama sonucuna göre) */
export function getSpecFacets(categoryAndSearchFiltered: ListingProduct[], category: string | null): SpecFacet[] {
  return category ? buildSpecFacets(categoryAndSearchFiltered) : []
}

export function applyListingFilters<T extends ListingProduct>(
  products: T[],
  opts: { brand: string | null; priceRange: [number, number] | null; specs: SpecFilters; sort: ProductSortOption }
): T[] {
  const { brand, priceRange, specs, sort } = opts
  const result = products.filter((product) => {
    if (brand && product.brand !== brand) return false
    // Teklifle satılan ürünün fiyatı yok: fiyat aralığı onu elemez
    if (priceRange && !isQuoteOnly(product) && (product.price < priceRange[0] || product.price > priceRange[1])) return false
    return Object.entries(specs).every(([specKey, selectedValues]) => {
      if (selectedValues.length === 0) return true
      const specValue = product.specifications?.[specKey]
      return !!specValue && selectedValues.includes(specValue)
    })
  })

  return [...result].sort((a, b) => {
    // Fiyata göre sıralamada teklifle satılan ürünler sona
    if ((sort === 'price-asc' || sort === 'price-desc') && isQuoteOnly(a) !== isQuoteOnly(b)) return isQuoteOnly(a) ? 1 : -1
    switch (sort) {
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
}

/** Sunucuda çizilen ilk durum: ilk sayfa + toplam ve filtre panelinin ihtiyaç duyduğu özetler (tüm katalog gönderilmez) */
export type ProductsSnapshot = {
  products: ProductCardItem[]
  total: number
  brands: string[]
  subCategories: string[]
  specFacets: SpecFacet[]
  priceBounds: [number, number]
}

export function buildProductsSnapshot(all: StorefrontProduct[], query: ProductsQuery): ProductsSnapshot {
  const base = filterByCategoryAndSearch(all, query.category, query.q)
  const filtered = applyListingFilters(base, {
    brand: query.brand,
    // İlk durumda fiyat aralığı sonuçların tamamını kapsar
    priceRange: null,
    specs: {},
    sort: query.sort ?? 'newest',
  })
  const lastPage = Math.max(1, Math.ceil(filtered.length / PRODUCTS_PER_PAGE))
  const start = (Math.min(query.page ?? 1, lastPage) - 1) * PRODUCTS_PER_PAGE
  return {
    products: filtered.slice(start, start + PRODUCTS_PER_PAGE).map(toCardItem),
    total: filtered.length,
    brands: getBrands(all),
    subCategories: Array.from(new Set(all.map((p) => p.category))),
    specFacets: getSpecFacets(base, query.category),
    priceBounds: getPriceBounds(base),
  }
}
