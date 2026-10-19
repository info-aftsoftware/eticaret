import type { Metadata } from 'next'
import { categoryHref } from '@/lib/seo/type-paths'
import { reviewSummary } from '@/lib/reviews'
import { mockProducts } from '@/lib/products-mock'
import { notFound, permanentRedirect } from 'next/navigation'
import ProductDetailClient from './ProductDetailClient'
import type { MergedProduct } from '@/lib/catalog-merge'
import { getStorefrontProductById, type StorefrontProduct } from '@/lib/discounts'
import { VAT_RATE } from '@/lib/store-config'
import { lineLogistics, shippingFeeFor } from '@/lib/shipping/fee'
import { SELLER } from '@/lib/legal/company'
import { getGroupIdForCategory } from '@/lib/categories'
import { CATEGORY_META } from '@/app/category/[id]/category-meta'
import { getProductDescriptionHtml } from '@/lib/product-descriptions'
import { withDetails } from '@/lib/catalog-details'
import legacyProductRedirects from '@/lib/legacy-product-redirects.json'

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

/** Katalogda birden fazla üründe aynı olan (kısaltılmış) açıklamalar */
const DUPLICATE_DESCRIPTIONS: Set<string> = (() => {
  const seen = new Map<string, number>()
  for (const p of mockProducts) {
    const d = truncate(p.description || '', 160)
    if (d) seen.set(d, (seen.get(d) ?? 0) + 1)
  }
  return new Set([...seen].filter(([, n]) => n > 1).map(([d]) => d))
})()

/** Katalog (kod + admin düzenlemeleri); veritabanına ulaşılamazsa koddaki ürün */
async function loadProduct(id: string): Promise<StorefrontProduct | null> {
  try {
    const merged = await getStorefrontProductById(id)
    if (merged) return merged
  } catch (e) {
    console.error('Product load error:', e)
  }
  const mock = mockProducts.find((p) => p.id === id)
  return mock ? { ...withDetails(mock), id: mock.id, descriptionHtml: getProductDescriptionHtml(mock.id) } : null
}

const SITE_NAME = 'voltekno'

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
  const product = await loadProduct(params.id)
  if (!product) return { title: 'Ürün Bulunamadı' }

  // app/products/layout.tsx kök başlık şablonunu devralmadığı için marka burada eklenir
  const title = product.metaTitle && !DUPLICATE_META_TITLES.has(product.metaTitle) ? product.metaTitle : `${product.name} | ${SITE_NAME}`
  const baseDesc = product.description || `${product.name} — ${product.category}.`
  // Aynı açıklamayı paylaşan varyant ürünlerde (ör. 55-75 kW / 90-110 kW) ürün adı başa alınır: her sayfa benzersiz
  const description = truncate(DUPLICATE_DESCRIPTIONS.has(truncate(baseDesc, 160)) ? `${product.name}: ${baseDesc}` : baseDesc, 160)
  const image = (product.images && product.images[0]) || product.image
  const imageUrl = image?.startsWith('http') ? image : image ? `${SITE_URL}${image}` : undefined
  const keywords = [
    product.name,
    product.category,
    product.brand,
    'voltekno',
    'satın al',
    'fiyat',
  ].filter(Boolean) as string[]

  return {
    title: { absolute: title },
    description,
    keywords,
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

function buildProductJsonLd(product: StorefrontProduct, rating: { average: number; count: number }) {
  // Google: yapılandırılmış veri fiyatı sayfadaki satış fiyatıyla (KDV dahil) aynı olmalı
  const priceWithVat = Math.round(product.price * (1 + VAT_RATE / 100) * 100) / 100
  const shippingFee = shippingFeeFor(lineLogistics(product.id))
  const image = (product.images && product.images[0]) || product.image
  const imageUrl = image?.startsWith('http') ? image : image ? `${SITE_URL}${image}` : undefined

  return {
    '@context': 'https://schema.org',
    '@type': 'Product',
    name: product.name,
    description: truncate(product.description || product.name, 300),
    sku: product.sku,
    ...(imageUrl && { image: imageUrl }),
    ...(product.brand && {
      brand: { '@type': 'Brand', name: product.brand },
    }),
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
    offers: {
      '@type': 'Offer',
      url: `${SITE_URL}/products/${product.id}`,
      priceCurrency: 'TRY',
      price: priceWithVat,
      priceValidUntil: new Date(Date.now() + 90 * 24 * 60 * 60 * 1000).toISOString().split('T')[0],
      availability:
        (product.stock ?? 0) > 0
          ? 'https://schema.org/InStock'
          : 'https://schema.org/OutOfStock',
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
      shippingDetails: {
        '@type': 'OfferShippingDetails',
        shippingRate: {
          '@type': 'MonetaryAmount',
          value: shippingFee,
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
      },
    },
  }
}

export default async function ProductPage(props: { params: Promise<{ id: string }> }) {
  const params = await props.params;
  const product = await loadProduct(params.id)
  if (!product) {
    // Eski katalogdaki ürün: yeni ürüne/kategoriye kalıcı yönlendirme (next.config.js redirects ile aynı liste;
    // boşluk içeren eski kablo id'leri gibi config'te eşleşmeyen adresler burada yakalanır)
    const legacyTarget = LEGACY_PRODUCT_REDIRECTS[params.id] ?? LEGACY_PRODUCT_REDIRECTS[safeDecode(params.id)]
    if (legacyTarget) permanentRedirect(legacyTarget)
    notFound()
  }

  const rating = await reviewSummary(product.id).catch(() => ({ average: 0, count: 0 }))

  return (
    <>
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(buildProductJsonLd(product, rating)) }}
      />
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(buildBreadcrumbJsonLd(product)) }}
      />
      <ProductDetailClient initialProduct={product} productId={params.id} />
    </>
  )
}
