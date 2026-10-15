import type { Metadata } from 'next'
import { mockProducts } from '@/lib/products-mock'
import { notFound, permanentRedirect } from 'next/navigation'
import ProductDetailClient from './ProductDetailClient'
import type { MergedProduct } from '@/lib/catalog-merge'
import { getStorefrontProductById, type StorefrontProduct } from '@/lib/discounts'
import { computeOrderTotals, VAT_RATE } from '@/lib/store-config'
import { SELLER } from '@/lib/legal/company'
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
const SITE_URL = process.env.NEXT_PUBLIC_SITE_URL || process.env.NEXT_PUBLIC_BASE_URL || 'https://voltekno.com'

function truncate(str: string, max: number) {
  if (!str || str.length <= max) return str
  return str.slice(0, max).trim() + '…'
}

export async function generateMetadata({ params }: { params: { id: string } }): Promise<Metadata> {
  const product = await loadProduct(params.id)
  if (!product) return { title: 'Ürün Bulunamadı' }

  // app/products/layout.tsx kök başlık şablonunu devralmadığı için marka burada eklenir
  const title = product.metaTitle || `${product.name} | ${SITE_NAME}`
  const baseDesc = product.description || `${product.name} — ${product.category}.`
  const description = truncate(baseDesc, 160)
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

function buildProductJsonLd(product: StorefrontProduct) {
  // Google: yapılandırılmış veri fiyatı sayfadaki satış fiyatıyla (KDV dahil) aynı olmalı
  const priceWithVat = Math.round(product.price * (1 + VAT_RATE / 100) * 100) / 100
  const shippingFee = computeOrderTotals({ subtotal: product.price, paymentMethod: 'card' }).shipping
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
    ...(product.rating && {
      aggregateRating: {
        '@type': 'AggregateRating',
        ratingValue: product.rating,
        reviewCount: product.reviews ?? 1,
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

export default async function ProductPage({ params }: { params: { id: string } }) {
  const product = await loadProduct(params.id)
  if (!product) {
    // Eski katalogdaki ürün: yeni ürüne/kategoriye kalıcı yönlendirme (next.config.js redirects ile aynı liste;
    // boşluk içeren eski kablo id'leri gibi config'te eşleşmeyen adresler burada yakalanır)
    const legacyTarget = LEGACY_PRODUCT_REDIRECTS[params.id] ?? LEGACY_PRODUCT_REDIRECTS[safeDecode(params.id)]
    if (legacyTarget) permanentRedirect(legacyTarget)
    notFound()
  }

  return (
    <>
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(buildProductJsonLd(product)) }}
      />
      <ProductDetailClient initialProduct={product} productId={params.id} />
    </>
  )
}
