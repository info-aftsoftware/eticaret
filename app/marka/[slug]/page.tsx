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
import { BANK_TRANSFER_DISCOUNT_RATE, grossPrice } from '@/lib/store-config'
import { isQuoteOnly } from '@/lib/sale-mode'
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
  const priced = products.filter((p) => p.price > 0 && !isQuoteOnly(p))
  const from = priced.length ? fmtTL(grossPrice(Math.min(...priced.map((p) => p.price)))) : null
  // Kelime ortasında kesilmesin: açıklama 158 karaktere sığana kadar tür listesi kısaltılır.
  // Fiyat ekli yazılmaz ("₺683'den" gibi ek hatası olmasın).
  const metaFor = (list: string[]) => {
    const head = list.length ? `${brand.name} ${list.join(', ')}` : `${brand.name} ürünleri`
    return from
      ? `${head}: ${products.length} ürün, teknik özellikler ve KDV dahil fiyatlar Voltekno'da. Başlangıç fiyatı ${from}.`
      : `${head}: ${products.length} ürün ve teknik özellikler Voltekno'da.`
  }
  let shown = types.length
  while (shown > 0 && metaFor(types.slice(0, shown)).length > 158) shown--
  const description = metaFor(types.slice(0, shown))
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
      description: `${brand.name} ${enTypes}: ${products.length} products with technical specifications and VAT-inclusive prices at Voltekno.`,
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
  // Teklifle satılan (fiyatsız) ürünler fiyat hesaplarına girmez
  const priced = products.filter((p) => p.price > 0 && !isQuoteOnly(p))
  const minPrice = priced.length ? Math.min(...priced.map((p) => p.price)) : 0
  const typeText = types.map(([c, n]) => `${en ? typeLabel(c) : typeLabel(c).toLocaleLowerCase('tr')} (${n})`).join(', ')
  const description = L(
    `Voltekno'da ${brand.name} markasının ${products.length} ürünü: ${typeText}.`,
    `${products.length} ${brand.name} products at Voltekno: ${typeText}.`,
  )
  const price = (n: number) => fmtTL(grossPrice(n), en)
  // Ürün adından marka ön ekini at: "TommaTech Marine MRN1 …" → "Marine MRN1 …"
  const shortName = (name: string) => name.replace(new RegExp(`^${brand.name.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')}\\s+`, 'i'), '')

  // Katalogdan üretilen, markaya özgü içerik (sayılar, model adları, fiyat aralıkları): her marka sayfası benzersiz
  const rangeSection = {
    heading: L(`${brand.name} ürün yelpazesi`, `${brand.name} product range`),
    body: types
      .map(([c, n]) => {
        const items = products.filter((p) => p.category === c)
        const names = items.slice(0, 3).map((p) => shortName(p.name))
        const ps = items.filter((p) => p.price > 0 && !isQuoteOnly(p)).map((p) => p.price)
        const label = typeLabel(c)
        const priceText = ps.length
          ? Math.min(...ps) === Math.max(...ps)
            ? L(` Fiyat: ${price(ps[0])} (KDV dahil).`, ` Price: ${price(ps[0])} (VAT incl.).`)
            : L(` Fiyatlar ${price(Math.min(...ps))} ile ${price(Math.max(...ps))} arasında (KDV dahil).`, ` Prices from ${price(Math.min(...ps))} to ${price(Math.max(...ps))} (VAT incl.).`)
          : L(' Fiyat teklifle belirlenir.', ' Price on request.')
        const more = n > 3 ? L(' ve diğer modeller', ' and more') : ''
        return L(`${label} (${n} model): ${names.join(', ')}${more}.`, `${label} (${n} ${n === 1 ? 'model' : 'models'}): ${names.join(', ')}${more}.`) + priceText
      })
      .join('\n\n'),
  }
  const cheapest = priced.length ? priced.reduce((a, b) => (b.price < a.price ? b : a)) : null
  const maxPrice = priced.length ? Math.max(...priced.map((p) => p.price)) : 0
  const inStock = products.filter((p) => (p.stock ?? 0) > 0).length
  const faq = [
    {
      q: L(`Voltekno'da hangi ${brand.name} ürünleri satılıyor?`, `Which ${brand.name} products does Voltekno sell?`),
      a: L(`Toplam ${products.length} ${brand.name} ürünü listeleniyor: ${typeText}. Her ürünün teknik özellikleri ve datasheet bilgisi ürün sayfasında yer alır.`, `${products.length} ${brand.name} products are listed: ${typeText}. Each product page has the full technical specifications.`),
    },
    ...(cheapest
      ? [{
          q: L(`${brand.name} ürünlerinin fiyatları ne kadar?`, `How much do ${brand.name} products cost?`),
          a: L(
            `KDV dahil fiyatlar ${price(minPrice)} ile ${price(maxPrice)} arasında değişiyor; en uygun fiyatlı model ${shortName(cheapest.name)} (${price(cheapest.price)}). Havale/EFT ile ödemede %${BANK_TRANSFER_DISCOUNT_RATE} indirim uygulanır.`,
            `VAT-inclusive prices range from ${price(minPrice)} to ${price(maxPrice)}; the most affordable model is ${shortName(cheapest.name)} (${price(cheapest.price)}). Bank transfer payments get ${BANK_TRANSFER_DISCOUNT_RATE}% off.`,
          ),
        }]
      : []),
    {
      q: L(`Stokta kaç ${brand.name} ürünü var?`, `How many ${brand.name} products are in stock?`),
      a: L(`Şu anda ${products.length} ${brand.name} ürününden ${inStock} tanesi stokta. Stok durumu her ürün sayfasında güncel olarak gösterilir; stokta olmayan ürünler için gelince haber ver kaydı bırakabilirsiniz.`, `${inStock} of ${products.length} ${brand.name} products are currently in stock. Each product page shows live stock; you can sign up for a restock alert on out-of-stock items.`),
    },
    {
      q: L(`${brand.name} ürünleri faturalı ve garantili mi?`, `Are ${brand.name} products invoiced and under warranty?`),
      a: L(`Evet. Voltekno'da satılan tüm ${brand.name} ürünleri faturalı ve garantili olarak satılır; ürün seçimi ve sistem uyumu için teknik ekibimize danışabilirsiniz.`, `Yes. All ${brand.name} products sold at Voltekno are invoiced and come with warranty; our technical team can help with product selection and compatibility.`),
    },
  ]

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
      sections={types.length ? [rangeSection] : []}
      faq={products.length ? faq : []}
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
