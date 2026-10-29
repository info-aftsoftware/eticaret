/**
 * Ürün ayrıntıları (lib/catalog/product-details.json): teknik özellikler, döviz fiyatı (basePrice),
 * ölçü/ağırlık/desi ve SEO başlığı. İstemci paketini küçük tutmak için hafif katalogdan (products.json) ayrıdır;
 * yalnızca sunucu tarafında import edilmelidir (catalog-merge, ürün sayfası).
 *
 * Barkod (GTIN): önce Excel'in "Barkod Listesi" sütunundan (product-details.json), yoksa SKU'ya göre
 * lib/catalog/gtin.json'dan (üretici kaynaklarından doğrulanmış barkodlar, kaynaklarıyla). İçe aktarma gtin.json'a
 * dokunmaz; panelde girilen barkod ikisinin de önüne geçer (catalog-merge).
 */

import details from '@/lib/catalog/product-details.json'
import gtinFile from '@/lib/catalog/gtin.json'
import type { MockProduct, ProductVariant } from '@/lib/products-mock'
import { normalizeGtin } from '@/lib/gtin'

type VariantDetails = Pick<ProductVariant, 'specifications' | 'basePrice' | 'dimensionsCm' | 'weightKg' | 'desi' | 'desiSource' | 'gtin'>
type ProductDetails = Pick<MockProduct, 'specifications' | 'basePrice' | 'metaTitle' | 'dimensionsCm' | 'weightKg' | 'desi' | 'desiSource' | 'gtin'> & {
  variants?: Record<string, VariantDetails>
}

const map = details as Record<string, ProductDetails>

/** SKU → barkod; geçersiz kayıt (kontrol basamağı tutmayan) yok sayılır */
const GTIN_BY_SKU: Record<string, string> = Object.fromEntries(
  Object.entries((gtinFile as { items: Record<string, { gtin: string }> }).items).flatMap(([sku, e]) => {
    const g = normalizeGtin(e.gtin)
    return g ? [[sku, g]] : []
  })
)

const gtinFor = (sku: string | undefined, fromExcel: string | undefined) => fromExcel ?? (sku ? GTIN_BY_SKU[sku] : undefined)

/** Hafif katalog ürününü sunucu ayrıntılarıyla birleştirir (ayrıntısı olmayan ürün aynen döner). */
export function withDetails<T extends MockProduct>(product: T): T {
  const d = map[product.id] ?? {}
  const { variants: variantDetails, ...rest } = d
  const merged: T = {
    ...product,
    ...rest,
    ...(product.variants
      ? { variants: product.variants.map((v) => ({ ...v, ...(variantDetails?.[v.key] ?? {}) })) }
      : {}),
  }
  // Varyantlı üründe barkod varyantlarda; tek ürün kendi SKU'suyla
  if (merged.variants?.length) {
    merged.variants = merged.variants.map((v) => {
      const gtin = gtinFor(v.sku, v.gtin)
      return gtin ? { ...v, gtin } : v
    })
  } else {
    const gtin = gtinFor(merged.sku, merged.gtin)
    if (gtin) merged.gtin = gtin
  }
  return merged
}
