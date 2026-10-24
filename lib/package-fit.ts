/**
 * Kullanım alanı sayfalarındaki ürün listesi (madde 14–15): kullanım alanının ürün kategorilerinden, uygunluk
 * sınırlarına (sistem voltajı, depolama enerjisi, ağırlık) uyan ürünler; kategoriler sırayla karıştırılır ki liste tek
 * kategoriyle dolmasın. Listede bulunmak uyumluluk iddiası değildir; sayfa bunu ayrıca yazar. Saf modül (birim testli).
 */
import { DC_SYSTEM_CATEGORIES, systemVoltageOf } from '@/lib/compat'
import { storageKwh } from '@/lib/spec-facets'
import type { PackageCategory } from '@/lib/package-categories'
import { PLACEHOLDER_PRODUCT_IMAGE, type MockProduct } from '@/lib/products-mock'

export function fitsPackage(p: MockProduct, item: Pick<PackageCategory, 'productCategories' | 'fit'>): boolean {
  if (!item.productCategories.includes(p.category)) return false
  const fit = item.fit
  if (!fit) return true
  if (fit.exclude?.test(p.name)) return false
  if (fit.voltages && DC_SYSTEM_CATEGORIES.has(p.category)) {
    const v = systemVoltageOf(p)
    // Voltajı bilinmeyen DC ürünü ve voltajdan bağımsız aksesuar (ör. raf batarya kablosu) kullanım alanına özel değildir;
    // listelenmez. Çok voltajlı üründe en az bir izinli sınıf yeterli.
    if (v.any || !v.classes.size) return false
    if (![...v.classes].some((c) => fit.voltages!.includes(c))) return false
  }
  if (fit.maxKwh != null) {
    const kwh = storageKwh(p)
    if (kwh.length && Math.min(...kwh) > fit.maxKwh) return false
  }
  if (fit.maxWeightKg != null && typeof p.weightKg === 'number' && p.weightKg > fit.maxWeightKg) return false
  return true
}

export function packageProductList(item: Pick<PackageCategory, 'productCategories' | 'fit'>, pool: MockProduct[], max = 16): MockProduct[] {
  const pools = item.productCategories.map((c) => pool.filter((p) => p.category === c && p.image !== PLACEHOLDER_PRODUCT_IMAGE && fitsPackage(p, item)))
  const out: MockProduct[] = []
  for (let i = 0; out.length < max && pools.some((list) => list.length > i); i++) {
    for (const list of pools) if (list[i] && out.length < max) out.push(list[i])
  }
  return out
}
