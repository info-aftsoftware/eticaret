/**
 * Ürün listesi / kategori sayfası özellik filtreleri.
 * Excel'den gelen teknik özellikler çok çeşitli olduğundan yalnızca filtrelemeye uygun anahtarlar alınır:
 * listedeki ürünlerin en az %30'unda bulunan, 2–12 farklı ve kısa (≤ 32 karakter) değeri olan anahtarlar; en fazla 6 filtre.
 */

export type SpecFacet = { key: string; values: string[] }

type WithSpecs = { specifications?: Record<string, string> }

const MIN_COVERAGE = 0.3
const MAX_VALUES = 12
const MAX_VALUE_LENGTH = 32
const MAX_FACETS = 6
/** Filtre olarak anlamsız anahtarlar (marka için ayrı filtre var; model/garanti her üründe farklı veya bilgi amaçlı) */
const EXCLUDED_KEYS = new Set(['model', 'marka', 'garanti', 'seri', 'ürün', 'ağırlık', 'net ağırlık', 'boyutlar', 'boyut'])

export function buildSpecFacets(products: WithSpecs[]): SpecFacet[] {
  const map = new Map<string, { values: Set<string>; count: number }>()
  for (const product of products) {
    for (const [keyRaw, valueRaw] of Object.entries(product.specifications ?? {})) {
      const key = keyRaw.trim()
      const value = String(valueRaw).trim()
      if (!key || !value || EXCLUDED_KEYS.has(key.toLocaleLowerCase('tr'))) continue
      const entry = map.get(key) ?? { values: new Set<string>(), count: 0 }
      entry.values.add(value)
      entry.count++
      map.set(key, entry)
    }
  }
  const minCount = Math.max(2, Math.ceil(products.length * MIN_COVERAGE))
  return Array.from(map.entries())
    .filter(([, e]) => e.count >= minCount && e.values.size >= 2 && e.values.size <= MAX_VALUES)
    .filter(([, e]) => Array.from(e.values).every((v) => v.length <= MAX_VALUE_LENGTH))
    .sort((a, b) => b[1].count - a[1].count || a[1].values.size - b[1].values.size || a[0].localeCompare(b[0], 'tr'))
    .slice(0, MAX_FACETS)
    .map(([key, e]) => ({ key, values: Array.from(e.values).sort((a, b) => a.localeCompare(b, 'tr', { numeric: true })) }))
}
