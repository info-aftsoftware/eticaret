import type { Metadata } from 'next'
import { DEFAULT_OG_IMAGE } from '@/lib/seo/og'
import { notFound } from 'next/navigation'
import { getLocale, getTranslations } from 'next-intl/server'
import { getCategoryKey } from '@/lib/categories'
import { BRANDS, brandBySlug } from '@/lib/seo/brands'
import { typeByCategory, typeHref, typeName } from '@/lib/seo/taxonomy'
import { localizedMetadata } from '@/lib/locale-metadata'
import { getStorefrontProducts, type StorefrontProduct } from '@/lib/discounts'
import { mockProducts } from '@/lib/products-mock'
import { grossPrice } from '@/lib/store-config'
import { CollectionPage, collectionJsonLd, fmtTL, type Crumb } from '@/components/seo/CollectionPage'

/**
 * Marka sayfası: /marka/<slug> — "victron mppt", "tommatech akü" gibi marka aramalarının hedefi.
 * Tanıtım cümlesi lib/seo/brands.ts'den; ürün türleri, sayılar ve fiyatlar katalogdan üretilir.
 */
export const revalidate = 600
export const dynamicParams = false

export function generateStaticParams() {
  return BRANDS.map((b) => ({ slug: b.slug }))
}

type Props = { params: Promise<{ slug: string }> }

async function loadProducts(brand: string): Promise<StorefrontProduct[]> {
  let all: StorefrontProduct[]
  try {
    all = await getStorefrontProducts()
  } catch (e) {
    console.error('Brand page: storefront products unavailable, falling back to catalog', e)
    all = mockProducts
  }
  return all
    .filter((p) => p.brand === brand)
    .sort((a, b) => (a.category ?? '').localeCompare(b.category ?? '', 'tr') || a.price - b.price)
}

/** Markanın ürün türleri, ürün sayısına göre azalan */
function typesOf(products: StorefrontProduct[]) {
  const counts = new Map<string, number>()
  for (const p of products) if (p.category) counts.set(p.category, (counts.get(p.category) ?? 0) + 1)
  return [...counts.entries()].sort((a, b) => b[1] - a[1])
}


export async function generateMetadata(props: Props): Promise<Metadata> {
  const { slug } = await props.params
  const brand = brandBySlug(slug)
  if (!brand) return {}
  const products = await loadProducts(brand.name)
  const top = typesOf(products).slice(0, 3).map(([c]) => c)
  const types = top.map((c) => typeName(c, 'tr').toLocaleLowerCase('tr'))
  const title = `${brand.name} Ürünleri ve Fiyatları`
  const description = `${brand.name} ${types.join(', ')} modelleri: ${products.length} ürün, teknik özellikler ve KDV dahil fiyatlar voltekno'da.`.slice(0, 160)
  const path = `/marka/${brand.slug}`
  const enTypes = top.map((c) => typeName(c, 'en')).join(', ')
  return localizedMetadata(
    {
      title,
      description,
      alternates: { canonical: path },
      openGraph: { images: [DEFAULT_OG_IMAGE], type: 'website', title: `${title} | Voltekno`, description, url: path, siteName: 'Voltekno' },
      twitter: { images: [DEFAULT_OG_IMAGE.url], card: 'summary', title: `${title} | Voltekno`, description },
    },
    {
      title: `${brand.name} Products and Prices`,
      description: `${brand.name} ${enTypes}: ${products.length} products with technical specifications and VAT-inclusive prices at Voltekno.`.slice(0, 160),
    },
  )
}

export default async function BrandPage(props: Props) {
  const { slug } = await props.params
  const brand = brandBySlug(slug)
  if (!brand) notFound()

  const products = await loadProducts(brand.name)
  const types = typesOf(products)
  const locale = await getLocale().catch(() => 'tr')
  const en = locale === 'en'
  const L = (tr: string, enText: string) => (en ? enText : tr)
  const tHeader = en ? await getTranslations('header').catch(() => null) : null
  // Tür sayfası olmayan kategoriler (ör. ısı pompası) menüdeki çevirisiyle
  const typeLabel = (category: string) => {
    const key = getCategoryKey(category)
    return !typeByCategory(category) && tHeader && key && tHeader.has(key) ? tHeader(key) : typeName(category, locale)
  }
  const path = `/marka/${brand.slug}`
  const h1 = L(`${brand.name} Ürünleri`, `${brand.name} Products`)
  const about = en ? brand.aboutEn : brand.about
  const crumbs: Crumb[] = [
    { name: 'Ana Sayfa', href: '/' },
    { name: brand.name, href: path },
  ]
  const minPrice = products.length ? Math.min(...products.map((p) => p.price)) : 0
  const typeText = types.map(([c, n]) => `${en ? typeLabel(c) : typeLabel(c).toLocaleLowerCase('tr')} (${n})`).join(', ')
  const description = L(
    `Voltekno'da ${brand.name} markasının ${products.length} ürünü: ${typeText}.`,
    `${products.length} ${brand.name} products at Voltekno: ${typeText}.`,
  )

  return (
    <CollectionPage
      crumbs={en ? crumbs.map((c, i) => (i === 0 ? { ...c, name: 'Home' } : c)) : crumbs}
      en={en}
      h1={h1}
      intro={
        <>
          {about && <p>{about}</p>}
          <p className={about ? 'mt-2' : ''}>{description}</p>
        </>
      }
      facts={minPrice > 0 ? <>{L(`Fiyatlar ${fmtTL(grossPrice(minPrice))} başlıyor (KDV dahil)`, `From ${fmtTL(grossPrice(minPrice), true)} (VAT incl.)`)}</> : null}
      products={products}
      linkGroups={[
        {
          title: L(`${brand.name} ürün türleri`, `${brand.name} product types`),
          items: types.map(([c, n]) => ({ label: typeLabel(c), href: typeHref(c), note: L(`${n} ürün`, `${n} ${n === 1 ? 'product' : 'products'}`) })),
        },
        {
          title: L('Diğer markalar', 'Other brands'),
          items: BRANDS.filter((b) => b.slug !== brand.slug).map((b) => ({ label: b.name, href: `/marka/${b.slug}` })),
        },
      ]}
      jsonLd={collectionJsonLd(crumbs, h1, description, path, products)}
    />
  )
}
