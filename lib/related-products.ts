/**
 * Ürün sayfasındaki "Uyumlu ürünler" ve "Önerilen ürünler" (madde 6): sunucuda, panel değerleri (sistem voltajı,
 * kategori, satış durumu) birleştirilmiş vitrin listesinden hesaplanır. Saf modül (birim testli).
 */
import { getComplementaryIds, PLACEHOLDER_PRODUCT_IMAGE, type MockProduct } from '@/lib/products-mock'

const MIN_RECOMMENDED = 5
const MAX_RECOMMENDED = 8
const MAX_COMPATIBLE = 4

export function relatedProductIds(product: MockProduct, pool: MockProduct[]): { compatible: string[]; recommended: string[] } {
  const complementary = getComplementaryIds(product, pool)
  // Teknik uyumu kontrol edilmiş ilişki yoksa "uyumlu" bölümü boş kalır; öneriler aynı kategoriden tamamlanır
  let recommended = complementary.length
    ? complementary
    : pool.filter((p) => p.category === product.category && p.id !== product.id && p.image !== PLACEHOLDER_PRODUCT_IMAGE).map((p) => p.id)
  recommended = recommended.slice(0, MAX_RECOMMENDED)
  if (recommended.length < MIN_RECOMMENDED) {
    const extra = pool.filter((p) => p.id !== product.id && !recommended.includes(p.id) && p.image !== PLACEHOLDER_PRODUCT_IMAGE)
    recommended = [...recommended, ...extra.slice(0, MIN_RECOMMENDED - recommended.length).map((p) => p.id)]
  }
  return { compatible: complementary.slice(0, MAX_COMPATIBLE), recommended }
}
