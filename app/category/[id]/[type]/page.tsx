import type { Metadata } from 'next'
import { DEFAULT_OG_IMAGE } from '@/lib/seo/og'
import { notFound } from 'next/navigation'
import { getLocale, getTranslations } from 'next-intl/server'
import { PRODUCT_TYPES } from '@/lib/seo/product-types'
import { localizeType, typeBySlug, typeHref } from '@/lib/seo/taxonomy'
import { CATEGORY_GROUPS } from '@/lib/categories'
import { BLOG_POSTS_EN } from '@/lib/blog-posts-en'
import { localizedMetadata } from '@/lib/locale-metadata'
import { brandHref } from '@/lib/seo/brands'
import { CATEGORY_META } from '../category-meta'
import { getStorefrontProducts, type StorefrontProduct } from '@/lib/discounts'
import { mockProducts } from '@/lib/products-mock'
import { grossPrice } from '@/lib/store-config'
import { BLOG_POSTS } from '@/lib/blog-posts'
import { CollectionPage, collectionJsonLd, fmtTL, type Crumb } from '@/components/seo/CollectionPage'

/**
 * Ürün türü sayfası: /category/<grup>/<tür> — ör. /category/solar-aku/lityum-aku.
 * "lityum akü", "mppt şarj kontrol cihazı" gibi tür aramalarının hedef sayfası: H1, giriş, katalogdan özet,
 * tüm ürünler (sunucuda), alım rehberi ve SSS. İçerik: lib/seo/product-types.ts. Fiyat/stok admin değişince tazelenir.
 */
export const revalidate = 600
export const dynamicParams = false

export function generateStaticParams() {
  return PRODUCT_TYPES.map((t) => ({ id: t.group, type: t.slug }))
}

type Props = { params: Promise<{ id: string; type: string }> }

async function loadProducts(category: string): Promise<StorefrontProduct[]> {
  let all: StorefrontProduct[]
  try {
    all = await getStorefrontProducts()
  } catch (e) {
    console.error('Type page: storefront products unavailable, falling back to catalog', e)
    all = mockProducts
  }
  // Stokta olanlar önce, sonra fiyata göre
  return all
    .filter((p) => p.category === category)
    .sort((a, b) => Number((b.stock ?? 0) > 0) - Number((a.stock ?? 0) > 0) || a.price - b.price)
}

export async function generateMetadata(props: Props): Promise<Metadata> {
  const { id, type } = await props.params
  const t = typeBySlug(id, type)
  if (!t) return {}
  const path = `/category/${t.group}/${t.slug}`
  const enType = localizeType(t, 'en')
  return localizedMetadata(
    {
      title: t.title,
      description: t.description,
      alternates: { canonical: path },
      openGraph: { images: [DEFAULT_OG_IMAGE], type: 'website', title: `${t.title} | Voltekno`, description: t.description, url: path, siteName: 'Voltekno' },
      twitter: { images: [DEFAULT_OG_IMAGE.url], card: 'summary', title: `${t.title} | Voltekno`, description: t.description },
    },
    { title: enType.title, description: enType.description },
  )
}

export default async function ProductTypePage(props: Props) {
  const { id, type } = await props.params
  const source = typeBySlug(id, type)
  if (!source) notFound()

  const products = await loadProducts(source.category)
  const locale = await getLocale().catch(() => 'tr')
  const en = locale === 'en'
  const L = (tr: string, enText: string) => (en ? enText : tr)
  const t = localizeType(source, locale)
  const labelKey = CATEGORY_GROUPS.find((g) => g.id === t.group)?.labelKey
  const tHeader = en && labelKey ? await getTranslations('header').catch(() => null) : null
  const groupName = (tHeader && labelKey ? tHeader(labelKey) : null) ?? CATEGORY_META[t.group]?.title ?? t.group
  const path = `/category/${t.group}/${t.slug}`
  const crumbs: Crumb[] = [
    { name: 'Ana Sayfa', href: '/' },
    { name: groupName, href: `/category/${t.group}` },
    { name: t.h1, href: path },
  ]

  const brandCounts = new Map<string, number>()
  for (const p of products) if (p.brand) brandCounts.set(p.brand, (brandCounts.get(p.brand) ?? 0) + 1)
  const brands = [...brandCounts.entries()].sort((a, b) => b[1] - a[1])
  const minPrice = products.length ? Math.min(...products.map((p) => p.price)) : 0
  const inStock = products.filter((p) => (p.stock ?? 0) > 0).length

  const facts = (
    <>
      {products.length} {L('ürün', products.length === 1 ? 'product' : 'products')}{inStock < products.length ? ` (${inStock} ${L('stokta', 'in stock')})` : ''}
      {brands.length > 0 && <> · {L('Markalar', 'Brands')}: {brands.map(([b], i) => (
        <span key={b}>{i > 0 && ', '}<a href={brandHref(b)} className="text-[#0b2540] hover:underline underline-offset-2">{b}</a></span>
      ))}</>}
      {minPrice > 0 && <> · {L(`Fiyatlar ${fmtTL(grossPrice(minPrice))} başlıyor (KDV dahil)`, `From ${fmtTL(grossPrice(minPrice), true)} (VAT incl.)`)}</>}
    </>
  )

  const related = t.related
    .map((slug) => PRODUCT_TYPES.find((x) => x.slug === slug))
    .filter((x): x is NonNullable<typeof x> => Boolean(x))
    .map((x) => localizeType(x, locale))
  const siblings = PRODUCT_TYPES.filter((x) => x.group === t.group && x.slug !== t.slug && !t.related.includes(x.slug)).map((x) =>
    localizeType(x, locale),
  )

  const linkGroups = [
    ...(related.length || siblings.length
      ? [{ title: L('İlgili ürün türleri', 'Related product types'), items: [...related, ...siblings].map((x) => ({ label: x.h1, href: typeHref(x.category) })) }]
      : []),
    ...(t.blog.length
      ? [{ title: L('Rehberler', 'Guides'), items: t.blog.filter((s) => BLOG_POSTS[s]).map((s) => ({ label: (en && BLOG_POSTS_EN[s]?.title) || BLOG_POSTS[s].title, href: `/blog/${s}` })) }]
      : []),
    { title: groupName, items: [{ label: L(`Tüm ${groupName} ürünleri`, `All ${groupName} products`), href: `/category/${t.group}` }] },
  ]

  return (
    <CollectionPage
      crumbs={en ? crumbs.map((c, i) => (i === 0 ? { ...c, name: 'Home' } : c)) : crumbs}
      en={en}
      h1={t.h1}
      intro={<p>{t.intro}</p>}
      facts={facts}
      products={products}
      sections={t.guide}
      faq={t.faq}
      linkGroups={linkGroups}
      jsonLd={collectionJsonLd(crumbs, t.h1, t.description, path, products)}
    />
  )
}

