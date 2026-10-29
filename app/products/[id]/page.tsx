import type { Metadata } from 'next'
import { categoryHref } from '@/lib/seo/type-paths'
import { reviewSummary } from '@/lib/reviews'
import { mockProducts } from '@/lib/products-mock'
import { notFound, permanentRedirect } from 'next/navigation'
import ProductDetailClient from './ProductDetailClient'
import type { MergedProduct } from '@/lib/catalog-merge'
import { getStorefrontProductById, type StorefrontProduct } from '@/lib/discounts'
import { VAT_RATE } from '@/lib/store-config'
import { lineLogistics, panelLineLogistics, shippingFeeFor } from '@/lib/shipping/fee'
import { isContactOnlyProduct } from '@/lib/shipping/battery'
import { isInstallShipping, isQuoteOnly } from '@/lib/sale-mode'
import { SELLER } from '@/lib/legal/company'
import { getGroupIdForCategory } from '@/lib/categories'
import { CATEGORY_META } from '@/app/category/[id]/category-meta'
import { getProductDescriptionHtml } from '@/lib/product-descriptions'
import { withDetails } from '@/lib/catalog-details'
import { labelMeasurements, variantDistinctLabels } from '@/lib/seo/variant-attributes'
import legacyProductRedirects from '@/lib/legacy-product-redirects.json'
import { getLocale } from 'next-intl/server'
import { localizeProduct, toCatalogLocale, type CatalogLocale } from '@/lib/catalog-en'
import { localizeDescriptionHtml } from '@/lib/catalog-en/descriptions.server'

const LEGACY_PRODUCT_REDIRECTS = legacyProductRedirects as Record<string, string>

function safeDecode(value: string) {
  try {
    return decodeURIComponent(value)
  } catch {
    return value
  }
}

export async function generateStaticParams() {
  return mockProducts.map((p) => ({ id: p.id }))
}

// Admin fiyat/stok değişiklikleri sayfaya ve yapılandırılmış veriye 10 dakika içinde yansır
export const revalidate = 600

/** Açıklamanın tekrar karşılaştırmasında kullanılan baş kısmı (arama sonucunda görünen bölüm) */
const DESCRIPTION_KEY_LENGTH = 120

/** Katalogda birden fazla üründe aynı başlayan açıklamalar (ilk 120 karakter) */
const DUPLICATE_DESCRIPTIONS: Set<string> = (() => {
  const seen = new Map<string, number>()
  for (const p of mockProducts) {
    const d = (p.description || '').slice(0, DESCRIPTION_KEY_LENGTH)
    if (d) seen.set(d, (seen.get(d) ?? 0) + 1)
  }
  return new Set([...seen].filter(([, n]) => n > 1).map(([d]) => d))
})()

/**
 * Ürüne özgü açıklama. Aynı açıklamayı paylaşan ürünlerde (ör. MDK110A 55-75 kW / 90-110 kW, BMS / BMS AIO)
 * açıklamanın başındaki seri adı ürünün tam adıyla değiştirilir; seri adıyla başlamıyorsa ürün adı başa eklenir.
 */
function productDescription(product: Pick<MergedProduct, 'name' | 'category' | 'description'>): string {
  const base = product.description || `${product.name} — ${product.category}.`
  if (!DUPLICATE_DESCRIPTIONS.has(base.slice(0, DESCRIPTION_KEY_LENGTH))) return base
  const [head, ...rest] = base.split(' – ')
  if (rest.length && head !== product.name && product.name.startsWith(head)) return [product.name, ...rest].join(' – ')
  return `${product.name}: ${base}`
}

/** Katalog (kod + admin düzenlemeleri); veritabanına ulaşılamazsa koddaki ürün */
async function loadCatalogProduct(id: string): Promise<StorefrontProduct | null> {
  try {
    const merged = await getStorefrontProductById(id)
    if (merged) return merged
  } catch (e) {
    console.error('Product load error:', e)
  }
  const mock = mockProducts.find((p) => p.id === id)
  return mock ? { ...withDetails(mock), id: mock.id, descriptionHtml: getProductDescriptionHtml(mock.id) } : null
}

/**
 * Ürün, ziyaretçinin dilinde: İngilizcede ad / kısa açıklama / varyant adları ve HTML açıklama çevrilir
 * (URL ve kanonik adres değişmez; teknik özellik çevirisi istemcide gösterim sırasında yapılır).
 */
async function loadProduct(id: string): Promise<{ product: StorefrontProduct; locale: CatalogLocale } | null> {
  const product = await loadCatalogProduct(id)
  if (!product) return null
  const locale = toCatalogLocale(await getLocale().catch(() => 'tr'))
  if (locale !== 'en') return { product, locale }
  return {
    product: { ...localizeProduct(product, locale), descriptionHtml: localizeDescriptionHtml(product.descriptionHtml, locale) },
    locale,
  }
}

const SITE_NAME = 'Voltekno'

/** Excel'deki SEO başlığı birden çok üründe aynıysa (ör. aynı serinin iki modeli) ürün adından başlık üretilir */
const DUPLICATE_META_TITLES = (() => {
  const counts = new Map<string, number>()
  for (const p of mockProducts) {
    const t = withDetails(p).metaTitle
    if (t) counts.set(t, (counts.get(t) ?? 0) + 1)
  }
  return new Set([...counts].filter(([, n]) => n > 1).map(([t]) => t))
})()
const SITE_URL = process.env.NEXT_PUBLIC_SITE_URL || process.env.NEXT_PUBLIC_BASE_URL || 'https://voltekno.com'

function truncate(str: string, max: number) {
  if (!str || str.length <= max) return str
  return str.slice(0, max).trim() + '…'
}

export async function generateMetadata(props: { params: Promise<{ id: string }> }): Promise<Metadata> {
  const params = await props.params;
  const loaded = await loadProduct(params.id)
  if (!loaded) return { title: 'Ürün Bulunamadı' }
  const { product, locale } = loaded

  // app/products/layout.tsx kök başlık şablonunu devralmadığı için marka burada eklenir.
  // Excel'in SEO başlığı Türkçe; İngilizcede başlık çevrilmiş addan üretilir.
  const title =
    locale === 'tr' && product.metaTitle && !DUPLICATE_META_TITLES.has(product.metaTitle) ? product.metaTitle : `${product.name} | ${SITE_NAME}`
  const description = truncate(productDescription(product), 160)
  const image = (product.images && product.images[0]) || product.image
  const imageUrl = image?.startsWith('http') ? image : image ? `${SITE_URL}${image}` : undefined

  return {
    title: { absolute: title },
    description,
    alternates: {
      canonical: `${SITE_URL}/products/${product.id}`,
    },
    openGraph: {
      title,
      description,
      type: 'website',
      url: `${SITE_URL}/products/${product.id}`,
      siteName: SITE_NAME,
      ...(imageUrl && { images: [{ url: imageUrl, alt: product.name, width: 800, height: 800 }] }),
    },
    twitter: {
      card: 'summary_large_image',
      title,
      description,
      ...(imageUrl && { images: [imageUrl] }),
    },
  }
}

/** Görünür breadcrumb ile aynı yol: Ana Sayfa › Ürünler › ana kategori › alt kategori › ürün */
function buildBreadcrumbJsonLd(product: StorefrontProduct) {
  const groupId = product.category ? getGroupIdForCategory(product.category) : null
  const items: { name: string; item?: string }[] = [
    { name: 'Ana Sayfa', item: `${SITE_URL}/` },
    { name: 'Ürünler', item: `${SITE_URL}/products` },
  ]
  if (groupId && CATEGORY_META[groupId]) items.push({ name: CATEGORY_META[groupId].title, item: `${SITE_URL}/category/${groupId}` })
  // Alt kategori: dizinlenebilir tür sayfası (tek türlü grupta grup sayfasıyla aynıysa tekrar eklenmez)
  if (product.category) {
    const typeUrl = `${SITE_URL}${categoryHref(product.category)}`
    if (!items.some((it) => it.item === typeUrl)) items.push({ name: product.category, item: typeUrl })
  }
  items.push({ name: product.name })
  return {
    '@context': 'https://schema.org',
    '@type': 'BreadcrumbList',
    itemListElement: items.map((it, i) => ({ '@type': 'ListItem', position: i + 1, name: it.name, ...(it.item ? { item: it.item } : {}) })),
  }
}

type Rating = { average: number; count: number }
type Variant = NonNullable<StorefrontProduct['variants']>[number]

const absoluteUrl = (src: string) => (src.startsWith('http') ? src : `${SITE_URL}${src}`)
const imageList = (list: (string | undefined)[]) => Array.from(new Set(list.filter(Boolean) as string[])).slice(0, 8).map(absoluteUrl)
const productUrl = (product: StorefrontProduct) => `${SITE_URL}/products/${product.id}`
/** Varyantın kendi adresi: ürün sayfası ?variant= ile açıldığında o seçenek seçili gelir (ProductDetailClient) */
const variantUrl = (product: StorefrontProduct, key: string) => `${productUrl(product)}?variant=${encodeURIComponent(key)}`

/** Sayfadaki "Teknik özellikler" tablosuyla aynı değerler (görünür içerikle birebir); uzun serbest metinler alınmaz */
function specProperties(specs: Record<string, string> | undefined) {
  return Object.entries(specs ?? {})
    .map(([name, value]) => [name.trim(), String(value).trim()] as const)
    .filter(([name, value]) => name && value && value.length <= 120)
    .slice(0, 25)
    .map(([name, value]) => ({ '@type': 'PropertyValue', name, value }))
}

/**
 * Tüm varyantlarda aynı olan özellikler (ürün düzeyinde özellik tablosu olmayan varyantlı ürün için; ör. Deye
 * Off-Grid: faz, akü sistemi). Bir varyantın tablosu yoksa ortak değer bilinemez, boş döner.
 */
function commonVariantSpecs(variants: Variant[]): Record<string, string> | undefined {
  const all = variants.map((v) => v.specifications)
  if (!all.length || all.some((s) => !s || !Object.keys(s).length)) return undefined
  const [first, ...rest] = all as Record<string, string>[]
  const common = Object.fromEntries(Object.entries(first).filter(([k, v]) => k !== 'Model' && rest.every((s) => s[k] === v)))
  return Object.keys(common).length ? common : undefined
}

/** Seçenek aralığı ürün adından atılır: "Deye Off-Grid Akıllı İnverter (5 kW / 6 kW)" → "Deye Off-Grid Akıllı İnverter" */
const groupBaseName = (name: string) => name.replace(/\s*\([^()]*\d[^()]*\)\s*$/, '') || name

/** Kargo bilgisi: sepetteki kargo hesabıyla aynı satır (ürün veya ürün-varyant) ve aynı tarife */
function shippingDetailsFor(product: StorefrontProduct, lineId: string) {
  // Akü / batarya (çevrim içi satılmıyor, kargo için iletişim) ve kurulumlu ürün (kurulum ve nakliye siparişten sonra
  // ayrıca planlanır): sepette kargo ücreti hesaplanmıyor, şemada da ücret verilmez (lib/shipping/battery, lib/sale-mode)
  if (isContactOnlyProduct(product) || isInstallShipping(product)) return undefined
  return {
    '@type': 'OfferShippingDetails',
    shippingRate: {
      '@type': 'MonetaryAmount',
      value: shippingFeeFor(lineLogistics(lineId, product.id, panelLineLogistics(product))),
      currency: 'TRY',
    },
    shippingDestination: { '@type': 'DefinedRegion', addressCountry: 'TR' },
    deliveryTime: {
      '@type': 'ShippingDeliveryTime',
      businessDays: {
        '@type': 'OpeningHoursSpecification',
        dayOfWeek: ['Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday'],
      },
      cutoffTime: '15:00',
      handlingTime: { '@type': 'QuantitativeValue', minValue: 0, maxValue: 1, unitCode: 'DAY' },
      transitTime: { '@type': 'QuantitativeValue', minValue: 1, maxValue: 3, unitCode: 'DAY' },
    },
  }
}

function offerFor(product: StorefrontProduct, o: { url: string; netPrice: number; stock: number; lineId: string }) {
  const shippingDetails = shippingDetailsFor(product, o.lineId)
  return {
    '@type': 'Offer',
    url: o.url,
    priceCurrency: 'TRY',
    // Google: yapılandırılmış veri fiyatı sayfadaki satış fiyatıyla (KDV dahil) aynı olmalı
    price: Math.round(o.netPrice * (1 + VAT_RATE / 100) * 100) / 100,
    priceValidUntil: new Date(Date.now() + 90 * 24 * 60 * 60 * 1000).toISOString().split('T')[0],
    itemCondition: 'https://schema.org/NewCondition',
    availability: o.stock > 0 ? 'https://schema.org/InStock' : 'https://schema.org/OutOfStock',
    seller: {
      '@type': 'Organization',
      name: SELLER.brand,
      legalName: SELLER.legalName,
      url: SITE_URL,
    },
    hasMerchantReturnPolicy: {
      '@type': 'MerchantReturnPolicy',
      applicableCountry: 'TR',
      returnPolicyCategory: 'https://schema.org/MerchantReturnFiniteReturnWindow',
      merchantReturnDays: 14,
      returnMethod: 'https://schema.org/ReturnByMail',
      returnFees: 'https://schema.org/FreeReturn',
    },
    ...(shippingDetails && { shippingDetails }),
  }
}

/** Ürün ve ürün grubunda ortak alanlar (ad, açıklama, görsel, marka, kategori, özellikler, puan) */
function productCore(product: StorefrontProduct, rating: Rating, specs: Record<string, string> | undefined) {
  const images = imageList([...(product.images ?? []), product.image])
  const additionalProperty = specProperties(specs)
  return {
    url: productUrl(product),
    name: product.name,
    description: truncate(productDescription(product), 300),
    ...(images.length > 0 && { image: images }),
    ...(product.category && { category: product.category }),
    ...(additionalProperty.length > 0 && { additionalProperty }),
    ...(product.brand && { brand: { '@type': 'Brand', name: product.brand } }),
    // Yalnızca sayfada görünen onaylı müşteri yorumlarından (Google: puan görünür, gerçek yorumlara dayanmalı)
    ...(rating.count > 0 && {
      aggregateRating: {
        '@type': 'AggregateRating',
        ratingValue: rating.average,
        reviewCount: rating.count,
        bestRating: 5,
        worstRating: 1,
      },
    }),
  }
}

/**
 * Ürün sayfasının JSON-LD'si:
 *  - varyantlı ürün: ProductGroup + hasVariant (her varyant kendi SKU'su, fiyatı, stoğu, kargo ücreti ve ?variant= adresiyle;
 *    ayırt edici değer `size` olarak, variesBy schema.org/size — Google'ın varyant özellikleri arasında güç/gerilim yok)
 *  - tek ürün: Product + Offer
 *  - teklifle satılan ürün (fiyat yok): Offer verilemez; Google Product için offers, review veya aggregateRating ister.
 *    Fiyatsız Product Search Console'da geçersiz öğe olur, uydurma fiyat ise politika ihlali: onaylı yorumu yoksa
 *    Product şeması hiç basılmaz (sayfa BreadcrumbList ile kalır), yorumu varsa yalnızca puanlı Product verilir.
 */
function buildProductJsonLd(product: StorefrontProduct, rating: Rating) {
  const context = { '@context': 'https://schema.org' }
  const id = `${productUrl(product)}#product`

  if (isQuoteOnly(product)) {
    if (rating.count === 0) return null
    return { ...context, '@type': 'Product', '@id': id, ...productCore(product, rating, product.specifications), sku: product.sku }
  }

  const variants = product.variants ?? []
  if (variants.length === 0) {
    return {
      ...context,
      '@type': 'Product',
      '@id': id,
      ...productCore(product, rating, product.specifications),
      sku: product.sku,
      offers: offerFor(product, { url: productUrl(product), netPrice: product.price, stock: product.stock ?? 0, lineId: product.id }),
    }
  }

  const distinct = variantDistinctLabels(variants.map((v) => v.label))
  const baseName = groupBaseName(product.name)
  const groupImages = imageList([...(product.images ?? []), product.image])
  return {
    ...context,
    '@type': 'ProductGroup',
    '@id': id,
    ...productCore(product, rating, product.specifications ?? commonVariantSpecs(variants)),
    productGroupID: product.id,
    variesBy: ['https://schema.org/size'],
    hasVariant: variants.map((v, i) => {
      const url = variantUrl(product, v.key)
      const images = product.imagesByVariant?.[i]?.length ? imageList(product.imagesByVariant[i]) : groupImages
      // Varyantın kendi tablosu yoksa sayfada ürünün tablosu görünür (ürün grubunda); varyanta etiketteki ölçüler eklenir
      const own = specProperties(v.specifications)
      const additionalProperty = own.length ? own : labelMeasurements(distinct[i]).map((m) => ({ '@type': 'PropertyValue', ...m }))
      return {
        '@type': 'Product',
        '@id': `${url}#product`,
        url,
        name: `${baseName} – ${distinct[i]}`,
        ...(v.sku && { sku: v.sku }),
        inProductGroupWithID: product.id,
        size: distinct[i],
        ...(images.length > 0 && { image: images }),
        ...(additionalProperty.length > 0 && { additionalProperty }),
        // Ayrı stokta varyantın kendi stoğu, değilse varyantlar ürün stoğunu paylaşır (lib/variant-stock)
        offers: offerFor(product, {
          url,
          netPrice: v.price,
          stock: product.variantStock ? v.stock ?? 0 : product.stock ?? 0,
          lineId: `${product.id}-${v.key}`,
        }),
      }
    }),
  }
}

export default async function ProductPage(props: { params: Promise<{ id: string }> }) {
  const params = await props.params;
  const loaded = await loadProduct(params.id)
  if (!loaded) {
    // Eski katalogdaki ürün: yeni ürüne/kategoriye kalıcı yönlendirme (next.config.js redirects ile aynı liste;
    // boşluk içeren eski kablo id'leri gibi config'te eşleşmeyen adresler burada yakalanır)
    const legacyTarget = LEGACY_PRODUCT_REDIRECTS[params.id] ?? LEGACY_PRODUCT_REDIRECTS[safeDecode(params.id)]
    if (legacyTarget) permanentRedirect(legacyTarget)
    notFound()
  }
  const { product } = loaded

  const rating = await reviewSummary(product.id).catch(() => ({ average: 0, count: 0 }))
  const productJsonLd = buildProductJsonLd(product, rating)

  return (
    <>
      {productJsonLd && (
        <script
          type="application/ld+json"
          dangerouslySetInnerHTML={{ __html: JSON.stringify(productJsonLd) }}
        />
      )}
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(buildBreadcrumbJsonLd(product)) }}
      />
      <ProductDetailClient initialProduct={product} productId={params.id} />
    </>
  )
}
