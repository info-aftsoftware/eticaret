import type { Metadata } from 'next'
import { notFound } from 'next/navigation'
import { getLocale } from 'next-intl/server'
import { BRANDS, brandBySlug } from '@/lib/seo/brands'
import { typeByCategory, typeHref } from '@/lib/seo/taxonomy'
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

function typeLabel(category: string) {
  return typeByCategory(category)?.h1 ?? category
}

export async function generateMetadata(props: Props): Promise<Metadata> {
  const { slug } = await props.params
  const brand = brandBySlug(slug)
  if (!brand) return {}
  const products = await loadProducts(brand.name)
  const types = typesOf(products).slice(0, 3).map(([c]) => typeLabel(c).toLocaleLowerCase('tr'))
  const title = `${brand.name} Ürünleri ve Fiyatları`
  const description = `${brand.name} ${types.join(', ')} modelleri: ${products.length} ürün, teknik özellikler ve KDV dahil fiyatlar voltekno'da.`.slice(0, 160)
  const path = `/marka/${brand.slug}`
  return {
    title,
    description,
    alternates: { canonical: path },
    openGraph: { type: 'website', title: `${title} | voltekno`, description, url: path, siteName: 'voltekno' },
    twitter: { card: 'summary', title: `${title} | voltekno`, description },
  }
}

export default async function BrandPage(props: Props) {
  const { slug } = await props.params
  const brand = brandBySlug(slug)
  if (!brand) notFound()

  const products = await loadProducts(brand.name)
  const types = typesOf(products)
  const en = (await getLocale().catch(() => 'tr')) === 'en'
  const L = (tr: string, enText: string) => (en ? enText : tr)
  const path = `/marka/${brand.slug}`
  const h1 = `${brand.name} Ürünleri`
  const crumbs: Crumb[] = [
    { name: 'Ana Sayfa', href: '/' },
    { name: brand.name, href: path },
  ]
  const minPrice = products.length ? Math.min(...products.map((p) => p.price)) : 0
  const typeText = types.map(([c, n]) => `${typeLabel(c).toLocaleLowerCase('tr')} (${n})`).join(', ')
  const description = `voltekno'da ${brand.name} markasının ${products.length} ürünü: ${typeText}.`

  return (
    <CollectionPage
      crumbs={en ? crumbs.map((c, i) => (i === 0 ? { ...c, name: 'Home' } : c)) : crumbs}
      en={en}
      h1={h1}
      intro={
        <>
          {brand.about && <p>{brand.about}</p>}
          <p className={brand.about ? 'mt-2' : ''}>{description}</p>
        </>
      }
      facts={minPrice > 0 ? <>{L(`Fiyatlar ${fmtTL(grossPrice(minPrice))} başlıyor (KDV dahil)`, `From ${fmtTL(grossPrice(minPrice))} (incl. VAT)`)}</> : null}
      products={products}
      linkGroups={[
        {
          title: L(`${brand.name} ürün türleri`, `${brand.name} product types`),
          items: types.map(([c, n]) => ({ label: typeLabel(c), href: typeHref(c), note: L(`${n} ürün`, `${n} products`) })),
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
