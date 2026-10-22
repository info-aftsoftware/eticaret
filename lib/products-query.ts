import { parsePageParam } from '@/lib/pagination'
import { CATEGORY_GROUPS, ALL_CATEGORY_VALUES, LEGACY_SUBCATEGORY_MAP, getGroupIdForCategory } from '@/lib/categories'

/**
 * /products URL parametrelerinin (category, q, brand, sort, page) çözümlenmesi.
 * Sunucu ilk listeyi bununla çizer, istemci aynı değerlerle başlar (hydration uyumu).
 */

export const PRODUCT_SORT_OPTIONS = ['newest', 'price-asc', 'price-desc', 'name-asc', 'name-desc'] as const
export type ProductSortOption = (typeof PRODUCT_SORT_OPTIONS)[number]

export type ProductsQuery = {
  category: string | null
  q: string
  brand: string | null
  /** URL'de geçerli sort yoksa null: istemci mevcut sıralamayı korur */
  sort: ProductSortOption | null
  /** 1'den başlar; sonuç sayısını aşarsa son sayfaya sınırlanır */
  page: number
}

type RawParam = string | string[] | null | undefined

const CATEGORY_VALUE_SET = new Set<string>(ALL_CATEGORY_VALUES)

function first(value: RawParam): string | null {
  const v = Array.isArray(value) ? value[0] : value
  return v ? v : null
}

export function isCategoryGroupId(cat: string) {
  return CATEGORY_GROUPS.some((g) => g.id === cat)
}

/** ?category= değeri → grup id'si veya alt kategori değeri (eski değerler yeni karşılığına çevrilir) */
export function resolveCategoryParam(categoryParam: string | null): string | null {
  if (!categoryParam) return null
  if (isCategoryGroupId(categoryParam)) return categoryParam
  if (CATEGORY_VALUE_SET.has(categoryParam)) return categoryParam
  if (LEGACY_SUBCATEGORY_MAP[categoryParam]) return LEGACY_SUBCATEGORY_MAP[categoryParam]
  return getGroupIdForCategory(categoryParam)
}

export function parseSortParam(sortParam: string | null): ProductSortOption | null {
  return sortParam && (PRODUCT_SORT_OPTIONS as readonly string[]).includes(sortParam)
    ? (sortParam as ProductSortOption)
    : null
}

export function resolveProductsQuery(params: Record<string, RawParam>): ProductsQuery {
  return {
    category: resolveCategoryParam(first(params.category)),
    q: first(params.q) ?? '',
    brand: first(params.brand),
    sort: parseSortParam(first(params.sort)),
    page: parsePageParam(first(params.page)),
  }
}
