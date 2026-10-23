/**
 * Site kataloğu: mockProducts + ProductOverride + StockOverride merge.
 * Admin catalog API ve public products API bu helper'ı kullanır.
 */

import { mockProducts, type MockProduct } from '@/lib/products-mock'
import type { ProductOverride } from '@prisma/client'
import { prisma } from '@/lib/prisma'
import { applyTryRates, getTryRates, toTry, type TryRates } from '@/lib/fx-rates'
import { applyVariantStock, parseStockKey, variantStockKey } from '@/lib/variant-stock'
import { getProductDescriptionHtml } from '@/lib/product-descriptions'
import { withDetails } from '@/lib/catalog-details'

export type MergedProduct = MockProduct & { id: string; slug?: string }

type PricingOverride = { price?: number | null; priceMode?: string | null }

/**
 * Ürünün etkin fiyatlandırma modu. Döviz fiyatı olmayan ürün her zaman sabit TL'dir.
 * Eski kayıtlarda (priceMode boş) panelde TL fiyat girilmişse sabit TL, girilmemişse dövize bağlıdır.
 */
export function effectivePriceMode(p: Pick<MockProduct, 'priceCurrency' | 'basePrice'>, override?: PricingOverride | null): 'fx' | 'fixed' {
  if (!p.priceCurrency || p.priceCurrency === 'TRY' || typeof p.basePrice !== 'number') return 'fixed'
  if (override?.priceMode === 'fx' || override?.priceMode === 'fixed') return override.priceMode
  return override?.price != null ? 'fixed' : 'fx'
}

/** Panel kaydı (ProductOverride); maliyet alanları birleştirilmiş ürüne hiç kopyalanmaz (A06) */
type OverrideRow = Partial<Omit<ProductOverride, 'id' | 'updatedAt'>>

function applyOverride(base: MergedProduct, override: OverrideRow, rates?: TryRates): void {
  if (override.name != null) {
    base.name = override.name
    // Excel'deki SEO başlığı eski isme ait; admin ismi değiştirdiyse başlık isimden üretilir
    base.metaTitle = undefined
  }
  if (override.slug != null) base.slug = override.slug
  if (override.description != null) base.description = override.description
  if (override.fullDescription != null) base.fullDescription = override.fullDescription
  // Admin'in yazdığı açıklama, Excel'den gelen HTML açıklamanın yerine geçer
  if (override.fullDescription?.trim()) base.descriptionHtml = undefined
  // Fiyatlandırma modu (A05): fx'te TL fiyat döviz fiyatından kurla hesaplanır, kayıttaki TL fiyat yok sayılır
  const fx = override.priceMode === 'fx' && !!base.priceCurrency && base.priceCurrency !== 'TRY'
  if (fx) {
    if (override.basePrice != null) base.basePrice = override.basePrice
    if (rates && typeof base.basePrice === 'number') base.price = toTry(base.basePrice, base.priceCurrency, rates)
  } else if (override.price != null) base.price = override.price
  base.priceMode = effectivePriceMode(base, override)
  if (override.image != null) base.image = override.image
  if (override.images != null) {
    base.images = override.images as string[] | undefined
    // Panelde düzenlenen galeri varyant seçildiğinde de görünsün (Excel'in varyant görselleri devre dışı)
    base.imagesByVariant = undefined
  }
  if (override.category != null) base.category = override.category
  if (override.stock != null) base.stock = override.stock
  if (override.featured != null) base.featured = override.featured
  if (override.specifications != null) base.specifications = override.specifications as Record<string, string> | undefined
  if (override.features != null) base.features = override.features as string[] | undefined
  if (override.variants != null) {
    base.variants = override.variants as unknown as MockProduct['variants']
    // Fiyatı panelde değiştirilmeyen varyantlar (basePrice korunur) güncel kurla yeniden hesaplanır;
    // aksi hâlde kayıt anındaki TL fiyatında donarlardı. Panelde fiyatı değişen varyant TL olarak sabit kalır.
    if (rates && base.variants && base.priceCurrency && base.priceCurrency !== 'TRY') {
      base.variants = applyTryRates({ ...base, variants: base.variants }, rates).variants
    }
  }
  if (override.brand != null) base.brand = override.brand
  if (override.sku != null) base.sku = override.sku
  if (override.tags != null) base.tags = override.tags as string[] | undefined
  if (override.slogan != null) base.slogan = override.slogan
  if (override.warranty != null) base.warranty = override.warranty
  // Lojistik (A07): panelde girilen koli bilgisi desi.json'daki değerin yerine geçer (lib/shipping/fee panelLineLogistics)
  if (override.saleMode === 'install' || override.saleMode === 'quote') base.saleMode = override.saleMode
  else if (override.saleMode === 'normal') base.saleMode = undefined
  if (override.desi != null) {
    base.logisticsSource = 'panel'
    if (Array.isArray(override.dimensionsCm)) base.dimensionsCm = override.dimensionsCm as unknown as number[]
    if (override.weightKg != null) base.weightKg = override.weightKg
    if (override.packageCount != null) base.packageCount = override.packageCount
    if (override.desi != null) base.desi = override.desi
    base.desiSource = 'panel'
  }
  if (override.status === 'draft') base.status = 'draft'
  // Varyant görselleri (A17): panelde varyant anahtarıyla atanır; boş dizi o varyantta genel galeri demektir
  if (override.variantImages && typeof override.variantImages === 'object' && !Array.isArray(override.variantImages) && base.variants?.length) {
    const map = override.variantImages as Record<string, unknown>
    base.imagesByVariant = base.variants.map((v) => (Array.isArray(map[v.key]) ? (map[v.key] as string[]) : []))
  }
}

/** Katalog ürününden MergedProduct kopyası (override uygulanmamış); TL fiyat güncel kurla hesaplanır. */
function mockToMerged(p: MockProduct, rates: TryRates): MergedProduct {
  // Döviz fiyatı (basePrice) ayrıntı dosyasından gelir; mod ona göre belirlenir
  const detailed = withDetails(p)
  return {
    ...applyTryRates(detailed, rates),
    id: p.id,
    priceMode: effectivePriceMode(detailed),
  }
}

/**
 * Panelde eklenen (katalogda olmayan) ürün için MergedProduct üretir. Alanlar katalog ürünüyle aynı kuralla
 * (applyOverride) uygulanır; para birimi kayıttaki priceCurrency'dir (A06), USD/EUR ise fiyat dövize bağlıdır.
 */
function overrideOnlyToMerged(override: OverrideRow & { productId: string }, rates?: TryRates): MergedProduct {
  const id = override.productId
  const currency = override.priceCurrency === 'USD' || override.priceCurrency === 'EUR' ? override.priceCurrency : undefined
  const base: MergedProduct = {
    id,
    sku: id,
    name: 'İsimsiz ürün',
    description: '',
    price: override.price ?? 0,
    category: 'Genel',
    stock: 0,
    featured: false,
    isVariantProduct: Array.isArray(override.variants) && override.variants.length > 0,
    ...(currency ? { priceCurrency: currency } : {}),
  }
  applyOverride(base, { ...override, stock: override.stock ?? 0 }, rates)
  return base
}

/**
 * Tüm ürünleri mock + ProductOverride + StockOverride ile birleştirir.
 * Sadece ProductOverride'da olan (mock'ta olmayan) ürünler de listeye eklenir.
 */
export async function getMergedProducts(): Promise<MergedProduct[]> {
  const [overrides, stockOverrides, rates] = await Promise.all([
    prisma.productOverride.findMany({ orderBy: { productId: 'asc' } }),
    prisma.stockOverride.findMany(),
    getTryRates(),
  ])

  const stockMap = new Map(stockOverrides.map((s) => [s.productId, s.stock]))
  const overrideMap = new Map(overrides.map((o) => [o.productId, o]))

  const mockIds = new Set(mockProducts.map((p) => p.id))
  const result: MergedProduct[] = []

  for (const mock of mockProducts) {
    const merged = mockToMerged(mock, rates)
    const override = overrideMap.get(mock.id)
    if (override) {
      applyOverride(merged, override, rates)
      overrideMap.delete(mock.id)
    }
    const stockOverride = stockMap.get(mock.id)
    if (stockOverride != null) merged.stock = stockOverride
    applyVariantStock(merged, override?.variantStock, stockMap)
    result.push(merged)
  }

  for (const [, override] of overrideMap) {
    const merged = overrideOnlyToMerged(override, rates)
    const stockOverride = stockMap.get(override.productId)
    if (stockOverride != null) merged.stock = stockOverride
    applyVariantStock(merged, override.variantStock, stockMap)
    result.push(merged)
  }

  return result
}

/**
 * Tek ürünü id ile getirir (mock + override + stock). Yoksa null.
 * Liste fonksiyonundan farklı olarak HTML açıklamayı (descriptionHtml) da ekler.
 */
export async function getMergedProductById(productId: string): Promise<MergedProduct | null> {
  const mock = mockProducts.find((p) => p.id === productId)
  const [override, stockRows, rates] = await Promise.all([
    prisma.productOverride.findUnique({ where: { productId } }),
    // Ürün satırı ve varyant satırları ("productId::key")
    prisma.stockOverride.findMany({ where: { OR: [{ productId }, { productId: { startsWith: variantStockKey(productId, '') } }] } }),
    getTryRates(),
  ])
  const stockMap = new Map(stockRows.map((s) => [s.productId, s.stock]))
  const stockRow = stockMap.get(productId)

  if (mock) {
    const merged = mockToMerged(mock, rates)
    const descriptionHtml = getProductDescriptionHtml(mock.id)
    if (descriptionHtml) merged.descriptionHtml = descriptionHtml
    if (override) applyOverride(merged, override, rates)
    if (stockRow != null) merged.stock = stockRow
    applyVariantStock(merged, override?.variantStock, stockMap)
    return merged
  }

  if (override) {
    const merged = overrideOnlyToMerged(override, rates)
    if (stockRow != null) merged.stock = stockRow
    applyVariantStock(merged, override.variantStock, stockMap)
    return merged
  }

  return null
}

type ProductOverrideReader = { productOverride: Pick<typeof prisma.productOverride, 'findUnique'> }

/**
 * StockOverride satırı yokken geçerli olan stok: ProductOverride.stock, yoksa katalog stoğu (varyant satırında 0).
 * Sipariş stoğu düşerken StockOverride satırını tohumlamak için kullanılır (transaction istemcisi verilebilir).
 * Ürün hiç yoksa veya stok takibi yoksa null.
 */
export async function getBaseStock(stockKey: string, db: ProductOverrideReader = prisma): Promise<number | null> {
  // Varyant stoğu ("productId::key"): satırı olmayan varyant stoksuzdur (panelde girilene kadar satılamaz)
  const { productId, variantKey } = parseStockKey(stockKey)
  if (variantKey) return 0
  const override = await db.productOverride.findUnique({ where: { productId }, select: { stock: true } })
  if (override?.stock != null) return override.stock
  const mock = mockProducts.find((p) => p.id === productId)
  if (mock) return typeof mock.stock === 'number' ? mock.stock : null
  return override ? 0 : null
}

/** Varyantları ayrı stoklanan ürün id'leri (ürün bazında stok yazan toplu işlemler bunları atlar) */
export async function variantStockedIds(ids?: string[]): Promise<Set<string>> {
  const rows = await prisma.productOverride.findMany({
    where: { variantStock: true, ...(ids ? { productId: { in: ids } } : {}) },
    select: { productId: true },
  })
  return new Set(rows.map((r) => r.productId))
}
