/**
 * Panel ürün araması: ad, SKU, ürün id'si, marka, varyant adı ve varyant SKU'su.
 * Büyük/küçük harf, boşluk ve kod ayırıcıları (- _ . /) yok sayılır: "tommat tt600144" ile
 * "TOMMAT-TT600144TN10-00073" eşleşir. Varyanttan eşleşen ürünlerde hangi varyantın eşleştiği döner.
 */

export type SearchableVariant = { key: string; label: string; sku?: string }
export type SearchableProduct = { id: string; name: string; sku?: string | null; brand?: string | null; variants?: SearchableVariant[] }

export type ProductMatch = { variant?: SearchableVariant; field: 'name' | 'sku' | 'id' | 'brand' | 'variant-label' | 'variant-sku' }

const lower = (s: string) => s.toLocaleLowerCase('tr-TR')
/** Ayırıcısız biçim (kod karşılaştırması) */
export const compactCode = (s: string) => lower(s).replace(/[\s\-_./]+/g, '')

function has(value: string | null | undefined, needle: string, compactNeedle: string): boolean {
  if (!value) return false
  return lower(value).includes(needle) || (compactNeedle.length > 0 && compactCode(value).includes(compactNeedle))
}

/** Eşleşme yoksa null. Varyant SKU'su tam eşleşiyorsa ana ürün alanlarından önce varyant gösterilir. */
export function matchProduct(p: SearchableProduct, query: string): ProductMatch | null {
  const needle = lower(query.trim())
  if (!needle) return { field: 'name' }
  const compactNeedle = compactCode(needle)
  const exactVariant = (p.variants ?? []).find((v) => v.sku && compactCode(v.sku) === compactNeedle)
  if (exactVariant) return { field: 'variant-sku', variant: exactVariant }
  if (has(p.sku, needle, compactNeedle)) return { field: 'sku' }
  // Varyant adı ürün adından önce: "600Wp" araması hangi varyantın eşleştiğini göstersin
  const byLabel = (p.variants ?? []).find((v) => has(v.label, needle, compactNeedle))
  if (byLabel) return { field: 'variant-label', variant: byLabel }
  if (has(p.name, needle, compactNeedle)) return { field: 'name' }
  if (has(p.id, needle, compactNeedle)) return { field: 'id' }
  if (has(p.brand, needle, compactNeedle)) return { field: 'brand' }
  const bySku = (p.variants ?? []).find((v) => has(v.sku, needle, compactNeedle))
  if (bySku) return { field: 'variant-sku', variant: bySku }
  return null
}
