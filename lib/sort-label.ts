/** Ürün listesi sıralama seçeneğinin çeviri anahtarı (ürünler ve kategori sayfası aynı eşlemeyi kullanır) */
const SORT_LABEL_KEYS = {
  newest: 'sortNewest',
  'price-asc': 'sortPriceAsc',
  'price-desc': 'sortPriceDesc',
  'name-asc': 'sortNameAsc',
  'name-desc': 'sortNameDesc',
} as const

export type SortLabelKey = (typeof SORT_LABEL_KEYS)[keyof typeof SORT_LABEL_KEYS] | 'sortByPlaceholder'

export function sortLabelKey(sortBy: string): SortLabelKey {
  return SORT_LABEL_KEYS[sortBy as keyof typeof SORT_LABEL_KEYS] ?? 'sortByPlaceholder'
}
