import { resolveProductsQuery } from '@/lib/products-query'
import { getStorefrontProducts, type StorefrontProduct } from '@/lib/discounts'
import { buildProductsSnapshot } from '@/lib/products-listing'
import { mockProducts } from '@/lib/products-mock'
import { ProductsPageClient } from './ProductsPageClient'

type SearchParams = Record<string, string | string[] | undefined>

/**
 * Ürün listesi sunucuda çizilir (SEO / LCP): category, brand, q, sort parametreleri burada çözülür.
 * İlk sayfa /api/products ile aynı kaynaktan (DB birleştirmesi + kampanyalar) hazırlanır; istemciye yalnızca ilk sayfa
 * ve filtre özetleri gider, tam liste istemcide /api/products'tan yüklenir ve filtreleme orada devam eder.
 */
export default async function ProductsPage(props: { searchParams: Promise<SearchParams> }) {
  const query = resolveProductsQuery(await props.searchParams)
  let products: StorefrontProduct[]
  try {
    products = await getStorefrontProducts()
  } catch (error) {
    console.error('Products page: storefront products unavailable, falling back to catalog', error)
    products = mockProducts
  }
  return <ProductsPageClient query={query} initial={buildProductsSnapshot(products, query)} />
}
