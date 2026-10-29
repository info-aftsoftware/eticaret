import type { Metadata } from 'next'
import { DEFAULT_OG_IMAGE } from '@/lib/seo/og'
import { redirect } from 'next/navigation'
import { CATEGORY_GROUPS, LEGACY_CATEGORY_REDIRECTS } from '@/lib/categories'
import { CategoryPageClient } from './CategoryPageClient'
import { categoryInitialProducts } from '@/lib/category-initial'

/** Fiyatlar kurla değiştiği için sayfa 10 dakikada bir yeniden üretilir (ilk çizim güncel fiyatla, madde 3) */
export const revalidate = 600
import { CategoryTypeLinks } from './CategoryTypeLinks'
import { CATEGORY_META } from './category-meta'
import { mockProducts } from '@/lib/products-mock'
import { categoryHref } from '@/lib/seo/type-paths'
import { typeByCategory } from '@/lib/seo/taxonomy'
import { jsonLdHtml } from '@/lib/seo/json-ld'

const SITE_URL = process.env.NEXT_PUBLIC_SITE_URL || process.env.NEXT_PUBLIC_BASE_URL || 'https://voltekno.com'

export function generateStaticParams() {
  return CATEGORY_GROUPS.map((group) => ({ id: group.id }))
}

function getCategoryTitle(id: string) {
  return CATEGORY_META[id]?.title ?? CATEGORY_GROUPS.find((group) => group.id === id)?.id ?? 'Kategori'
}

export async function generateMetadata(props: { params: Promise<{ id: string }> }): Promise<Metadata> {
  const params = await props.params;
  const meta = CATEGORY_META[params.id]
  const title = getCategoryTitle(params.id)
  const description =
    meta?.seoDescription ?? meta?.description ??
    `${title} ürünlerini fiyat, marka ve özelliklere göre filtreleyin. Voltekno'da güvenilir ürünler ve teknik destek.`
  const rawImage = meta?.image
  const imageUrl = rawImage
    ? rawImage.startsWith('http') ? rawImage : `${SITE_URL}${rawImage}`
    : undefined

  // "Fiyatları" zaten title içindeyse tekrar ekleme
  const pageTitle = title.includes('Fiyat') ? title : `${title} Fiyatları ve Modelleri`

  return {
    title: pageTitle,
    description,
    alternates: { canonical: `/category/${params.id}` },
    openGraph: {
      title: `${title} | Voltekno`,
      description,
      type: 'website',
      url: `${SITE_URL}/category/${params.id}`,
      siteName: 'Voltekno',
      images: [imageUrl ? { url: imageUrl, alt: title } : DEFAULT_OG_IMAGE],
    },
    twitter: {
      card: 'summary_large_image',
      title: `${title} | Voltekno`,
      description,
      images: [imageUrl ?? DEFAULT_OG_IMAGE.url],
    },
  }
}

export default async function CategoryPage(props: { params: Promise<{ id: string }> }) {
  const params = await props.params;
  // Eski kategori URL'leri yeni Excel kategorilerine yönlendirilir (karşılığı yoksa tüm ürünler)
  if (params.id in LEGACY_CATEGORY_REDIRECTS) {
    const target = LEGACY_CATEGORY_REDIRECTS[params.id]
    redirect(target ? `/category/${target}` : '/products')
  }

  const title = getCategoryTitle(params.id)
  const meta = CATEGORY_META[params.id]

  // Kategori ürünlerini ItemList schema için hazırla (ilk 10)
  const group = CATEGORY_GROUPS.find((g) => g.id === params.id)
  const categoryProducts = group
    ? mockProducts
        .filter((p) => (group.categoryValues as readonly string[]).includes(p.category))
        .slice(0, 10)
    : []

  // Gruptaki ürün türleri → dizinlenebilir tür sayfaları (Google bu bağlantılardan tür sayfalarını keşfeder)
  const typeLinks = group
    ? (group.categoryValues as readonly string[])
        .map((c) => ({ category: c, label: typeByCategory(c)?.h1 ?? c, href: categoryHref(c), count: mockProducts.filter((p) => p.category === c).length }))
        .filter((t) => t.count > 0)
    : []

  const breadcrumbJsonLd = {
    '@context': 'https://schema.org',
    '@type': 'BreadcrumbList',
    itemListElement: [
      { '@type': 'ListItem', position: 1, name: 'Ana Sayfa', item: SITE_URL },
      { '@type': 'ListItem', position: 2, name: 'Kategoriler', item: `${SITE_URL}/categories` },
      { '@type': 'ListItem', position: 3, name: title, item: `${SITE_URL}/category/${params.id}` },
    ],
  }

  const itemListJsonLd = categoryProducts.length > 0 ? {
    '@context': 'https://schema.org',
    '@type': 'ItemList',
    name: `${title} Ürünleri`,
    description: meta?.seoDescription ?? meta?.description,
    url: `${SITE_URL}/category/${params.id}`,
    numberOfItems: categoryProducts.length,
    itemListElement: categoryProducts.map((p, i) => ({
      '@type': 'ListItem',
      position: i + 1,
      url: `${SITE_URL}/products/${p.id}`,
      name: p.name,
    })),
  } : null

  return (
    <>
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: jsonLdHtml(breadcrumbJsonLd) }}
      />
      {itemListJsonLd && (
        <script
          type="application/ld+json"
          dangerouslySetInnerHTML={{ __html: jsonLdHtml(itemListJsonLd) }}
        />
      )}
      <CategoryPageClient id={params.id} initialProducts={await categoryInitialProducts(params.id)} />
      {typeLinks.length > 1 && (
        <CategoryTypeLinks groupId={params.id} title={title} links={typeLinks} />
      )}
    </>
  )
}
