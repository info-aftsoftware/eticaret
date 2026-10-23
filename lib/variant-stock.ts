/**
 * Varyant bazında stok (A03). Ürün "varyantlar ayrı stoklanır" olarak işaretlenmişse (ProductOverride.variantStock)
 * her varyantın stoğu StockOverride tablosunda "productId::variantKey" satırında tutulur; ürünün stoğu varyant toplamıdır.
 * İşaretli değilse eski davranış: varyantlar ürün stoğunu (StockOverride "productId") paylaşır.
 * Varyant anahtarları yalnızca [A-Za-z0-9_-] içerdiğinden ayırıcı çakışmaz.
 */

export const VARIANT_STOCK_SEP = '::'

export const variantStockKey = (productId: string, variantKey: string) => `${productId}${VARIANT_STOCK_SEP}${variantKey}`

export function parseStockKey(key: string): { productId: string; variantKey?: string } {
  const i = key.lastIndexOf(VARIANT_STOCK_SEP)
  return i > 0 ? { productId: key.slice(0, i), variantKey: key.slice(i + VARIANT_STOCK_SEP.length) } : { productId: key }
}

/** Sepet/sipariş kaleminin stoğunun düşüleceği anahtar */
export function stockKeyFor(product: { id: string; variantStock?: boolean }, variantKey?: string): string {
  return product.variantStock && variantKey ? variantStockKey(product.id, variantKey) : product.id
}

type StockedProduct = { id: string; stock: number; variantStock?: boolean; variants?: { key: string; stock?: number }[] }

/**
 * Varyant stoklarını ürüne yazar (yerinde). Ayrı stok kapalıysa varyantlara stok yazılmaz.
 * Satırı olmayan varyantın stoğu 0'dır (satılamaz); ürün stoğu varyantların toplamıdır.
 */
export function applyVariantStock<T extends StockedProduct>(product: T, enabled: boolean | null | undefined, stockMap: Map<string, number>): T {
  if (!enabled || !product.variants?.length) {
    product.variantStock = undefined
    return product
  }
  product.variantStock = true
  product.variants = product.variants.map((v) => ({ ...v, stock: Math.max(0, stockMap.get(variantStockKey(product.id, v.key)) ?? 0) }))
  product.stock = product.variants.reduce((n, v) => n + (v.stock ?? 0), 0)
  return product
}

/** Sepet kaleminin satılabilir stoğu: ayrı stokta varyantın, değilse ürünün stoğu (takip yoksa undefined) */
export function lineStock(product: StockedProduct, variantKey?: string): number | undefined {
  if (product.variantStock && variantKey) {
    const v = product.variants?.find((x) => x.key === variantKey)
    return v ? v.stock ?? 0 : 0
  }
  return typeof product.stock === 'number' ? product.stock : undefined
}
