import type { Metadata } from 'next'
import { notFound } from 'next/navigation'
import Link from 'next/link'
import Image from 'next/image'
import { ArrowRight } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { PACKAGE_CATEGORIES, getPackageCategory } from '@/lib/package-categories'
import { mockProducts } from '@/lib/products-mock'
import { ProductCard } from '@/components/ProductCard'
import { PAGE_CONTAINER } from '@/lib/page-container'
import { getLocale } from 'next-intl/server'
import { localizedMetadata } from '@/lib/locale-metadata'

const SITE_URL = process.env.NEXT_PUBLIC_SITE_URL || process.env.NEXT_PUBLIC_BASE_URL || 'https://voltekno.com'
const MAX_PRODUCTS = 16

export function generateStaticParams() {
  return PACKAGE_CATEGORIES.map((item) => ({ slug: item.slug }))
}

export async function generateMetadata(props: { params: Promise<{ slug: string }> }): Promise<Metadata> {
  const params = await props.params;
  const item = getPackageCategory(params.slug)
  if (!item) return { title: 'Paket Bulunamadı' }

  const title = `${item.seoTitle} | voltekno`
  const description = item.seoDescription

  const trMetadata: Metadata = {
    // Kök şablon "%s | voltekno" ekler; sayfa başlığına marka tekrar yazılmaz
    title: item.seoTitle,
    description,
    keywords: item.keywords,
    alternates: { canonical: `/paketler/${item.slug}` },
    openGraph: {
      title,
      description,
      type: 'website',
      siteName: 'voltekno',
      url: `${SITE_URL}/paketler/${item.slug}`,
      images: [{ url: item.image, alt: item.imageAlt, width: 1600, height: 900 }],
    },
    twitter: {
      card: 'summary_large_image',
      title,
      description,
      images: [item.image],
    },
  }
  return localizedMetadata(trMetadata, {
    title: `${item.en.shortTitle} Solar Energy Packages`,
    description: item.en.description,
  })
}

function buildBreadcrumbSchema(item: NonNullable<ReturnType<typeof getPackageCategory>>) {
  return {
    '@context': 'https://schema.org',
    '@type': 'BreadcrumbList',
    itemListElement: [
      { '@type': 'ListItem', position: 1, name: 'Ana Sayfa', item: `${SITE_URL}/` },
      { '@type': 'ListItem', position: 2, name: 'Paketler', item: `${SITE_URL}/paketler` },
      { '@type': 'ListItem', position: 3, name: item.title, item: `${SITE_URL}/paketler/${item.slug}` },
    ],
  }
}

function buildFaqSchema(item: NonNullable<ReturnType<typeof getPackageCategory>>) {
  return {
    '@context': 'https://schema.org',
    '@type': 'FAQPage',
    mainEntity: item.faq.map((q) => ({
      '@type': 'Question',
      name: q.question,
      acceptedAnswer: { '@type': 'Answer', text: q.answer },
    })),
  }
}

export default async function PaketDetailPage(props: { params: Promise<{ slug: string }> }) {
  const params = await props.params;
  const item = getPackageCategory(params.slug)
  if (!item) notFound()

  const locale = await getLocale()
  const L = (tr: string, en: string) => (locale === 'en' ? en : tr)
  const title = L(item.title, `${item.en.shortTitle} Packages`)

  const categorySet = new Set(item.productCategories)
  const relatedProducts = mockProducts
    .filter((p) => categorySet.has(p.category))
    .slice(0, MAX_PRODUCTS)

  return (
    <div className="min-h-screen bg-slate-50">
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(buildBreadcrumbSchema(item)) }}
      />
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(buildFaqSchema(item)) }}
      />

      {/* Hero */}
      <div className="bg-white border-b border-slate-200/80">
        <div className={`${PAGE_CONTAINER} py-8 md:py-12`}>
          <nav className="text-sm text-slate-500 mb-6 flex items-center gap-1.5 flex-wrap">
            <Link href="/" className="hover:text-slate-900 transition-colors">{L('Ana Sayfa', 'Home')}</Link>
            <span className="text-slate-300">/</span>
            <Link href="/paketler" className="hover:text-slate-900 transition-colors">{L('Paketler', 'Packages')}</Link>
            <span className="text-slate-300">/</span>
            <span className="text-slate-900 font-medium">{title}</span>
          </nav>

          <div className="grid grid-cols-1 lg:grid-cols-5 gap-8 lg:gap-12 items-center">
            {/* Sol: görsel */}
            <div className="lg:col-span-2 relative aspect-[4/3] rounded-2xl overflow-hidden border border-slate-200 shadow-sm">
              <Image
                src={item.image}
                alt={L(item.imageAlt, `${item.en.shortTitle} solar energy package`)}
                fill
                className="object-cover"
                sizes="(max-width: 1024px) 100vw, 40vw"
                style={{ objectPosition: item.objectPosition ?? 'center' }}
                priority
              />
            </div>

            {/* Sağ: bilgi */}
            <div className="lg:col-span-3">
              <span className="inline-block text-xs font-semibold uppercase tracking-widest text-brand mb-3">
                {L('Paket Kategorisi', 'Package Category')}
              </span>
              <h1 className="text-3xl md:text-4xl xl:text-5xl font-black tracking-tight text-slate-900 leading-tight">
                {title}
              </h1>
              <div className="mt-6 flex flex-wrap gap-3">
                <Button asChild className="bg-brand hover:bg-brand-hover text-white rounded-xl">
                  <a href="#urunler">{L('Ürünleri İncele', 'Browse Products')}</a>
                </Button>
                <Button asChild variant="outline" className="rounded-xl border-slate-300">
                  <Link href="/ges">{L('GES Hesaplama', 'Solar Calculator')}</Link>
                </Button>
                <Button asChild variant="outline" className="rounded-xl border-slate-300">
                  <Link href="/contact">{L('Teklif Al', 'Get a Quote')}</Link>
                </Button>
              </div>
            </div>
          </div>
        </div>
      </div>

      <div className={`${PAGE_CONTAINER} py-10 md:py-14 space-y-12`}>

        {/* Ürünler bölümü */}
        <section id="urunler">
          <div className="flex flex-col sm:flex-row sm:items-end sm:justify-between gap-3 mb-6">
            <div>
              <h2 className="text-2xl md:text-3xl font-black text-slate-900 tracking-tight">
                {L(`${item.shortTitle} Paketine Uygun Ürünler`, `Products for ${item.en.shortTitle} Packages`)}
              </h2>
              <p className="text-slate-500 text-sm mt-1">
                {L(`${relatedProducts.length} ürün listeleniyor`, `${relatedProducts.length} products listed`)}
              </p>
            </div>
            <Link
              href={`/products?q=${encodeURIComponent(item.searchHint)}`}
              className="inline-flex items-center gap-1.5 text-sm font-semibold text-brand hover:underline shrink-0"
            >
              {L('Tümünü Gör', 'View All')}
              <ArrowRight className="w-4 h-4" />
            </Link>
          </div>

          {relatedProducts.length === 0 ? (
            <div className="rounded-2xl border border-dashed border-slate-300 bg-white py-16 text-center">
              <p className="text-slate-500">{L('Bu kategoriye ait ürün bulunamadı.', 'No products found in this category.')}</p>
              <Button asChild variant="outline" className="mt-4">
                <Link href="/products">{L('Tüm Ürünler', 'All Products')}</Link>
              </Button>
            </div>
          ) : (
            <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-4 md:gap-5">
              {relatedProducts.map((product) => (
                <ProductCard key={product.id} product={product} />
              ))}
            </div>
          )}
        </section>

        {/* SSS */}
        <section className="bg-white border border-slate-200 rounded-2xl p-6">
          <h2 className="text-lg font-bold text-slate-900 mb-5">{L('Sık Sorulan Sorular', 'Frequently Asked Questions')}</h2>
          <div className="space-y-3">
            {(locale === 'en' && item.en.faq ? item.en.faq : item.faq).map((qa) => (
              <details key={qa.question} className="group border border-slate-200 rounded-xl p-4">
                <summary className="cursor-pointer font-semibold text-slate-900 list-none flex items-center justify-between gap-2">
                  {qa.question}
                  <span className="text-slate-400 text-lg leading-none group-open:rotate-45 transition-transform">+</span>
                </summary>
                <p className="mt-3 text-slate-600 text-sm leading-relaxed">{qa.answer}</p>
              </details>
            ))}
          </div>
        </section>
      </div>
    </div>
  )
}
