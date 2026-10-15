/**
 * Ürün ayrıntıları (lib/catalog/product-details.json): teknik özellikler, döviz fiyatı (basePrice),
 * ölçü/ağırlık/desi ve SEO başlığı. İstemci paketini küçük tutmak için hafif katalogdan (products.json) ayrıdır;
 * yalnızca sunucu tarafında import edilmelidir (catalog-merge, ürün sayfası).
 */

import details from '@/lib/catalog/product-details.json'
import type { MockProduct, ProductVariant } from '@/lib/products-mock'

type VariantDetails = Pick<ProductVariant, 'specifications' | 'basePrice' | 'dimensionsCm' | 'weightKg' | 'desi' | 'desiSource'>
type ProductDetails = Pick<MockProduct, 'specifications' | 'basePrice' | 'metaTitle' | 'dimensionsCm' | 'weightKg' | 'desi' | 'desiSource'> & {
  variants?: Record<string, VariantDetails>
}

const map = details as Record<string, ProductDetails>

/** Hafif katalog ürününü sunucu ayrıntılarıyla birleştirir (ayrıntısı olmayan ürün aynen döner). */
export function withDetails<T extends MockProduct>(product: T): T {
  const d = map[product.id]
  if (!d) return product
  const { variants: variantDetails, ...rest } = d
  return {
    ...product,
    ...rest,
    ...(product.variants && variantDetails
      ? { variants: product.variants.map((v) => ({ ...v, ...(variantDetails[v.key] ?? {}) })) }
      : {}),
  }
}
