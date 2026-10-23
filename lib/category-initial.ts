/**
 * Kategori sayfasının ilk çizim verisi (madde 3): güncel vitrin fiyatları (kur, kampanya, panel düzenlemeleri, satış durumu)
 * sunucuda hesaplanır; istemci katalog dosyasının içe aktarma anındaki kurla başlayıp sonra güncel fiyata "sıçramaz".
 */
import { CATEGORY_GROUPS } from '@/lib/categories'
import { getStorefrontProducts } from '@/lib/discounts'
import { toListItem, type ProductListItem } from '@/lib/products-listing'

export async function categoryInitialProducts(groupId: string): Promise<ProductListItem[] | undefined> {
  const group = CATEGORY_GROUPS.find((g) => g.id === groupId)
  if (!group) return undefined
  const values = new Set<string>(group.categoryValues)
  try {
    return (await getStorefrontProducts()).filter((p) => values.has(p.category)).map(toListItem)
  } catch (e) {
    console.error('Kategori ilk verisi:', e)
    return undefined
  }
}
