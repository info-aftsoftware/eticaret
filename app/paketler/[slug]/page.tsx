import type { Metadata } from 'next'
import { notFound } from 'next/navigation'
import Link from 'next/link'
import Image from 'next/image'
import { ArrowRight, CheckCircle2, Zap } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { PACKAGE_CATEGORIES, getPackageCategory } from '@/lib/package-categories'
import { mockProducts } from '@/lib/products-mock'
import { ProductCard } from '@/components/ProductCard'
import { PackageUsageScenario } from '@/components/PackageUsageScenario'

const SITE_URL = process.env.NEXT_PUBLIC_SITE_URL || process.env.NEXT_PUBLIC_BASE_URL || 'https://voltekno.com'
const MAX_PRODUCTS = 16

export function generateStaticParams() {
  return PACKAGE_CATEGORIES.map((item) => ({ slug: item.slug }))
}

export async function generateMetadata({ params }: { params: { slug: string } }): Promise<Metadata> {
  const item = getPackageCategory(params.slug)
  if (!item) return { title: 'Paket Bulunamadı | voltekno' }

  const title = `${item.seoTitle} | voltekno`
  const description = item.seoDescription

  return {
    title,
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

export default function PaketDetailPage({ params }: { params: { slug: string } }) {
  const item = getPackageCategory(params.slug)
  if (!item) notFound()

  const categorySet = new Set(item.productCategories)
  const relatedProducts = mockProducts
    .filter((p) => categorySet.has(p.category))
    .slice(0, MAX_PRODUCTS)

  // Kategori bazlı ürün sayıları (gösterim için)
  const categoryCounts = item.productCategories.map((cat) => ({
    cat,
    count: mockProducts.filter((p) => p.category === cat).length,
  })).filter((x) => x.count > 0)

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
        <div className="container mx-auto px-4 sm:px-6 lg:px-8 max-w-7xl py-8 md:py-12">
          <nav className="text-sm text-slate-500 mb-6 flex items-center gap-1.5 flex-wrap">
            <Link href="/" className="hover:text-slate-900 transition-colors">Ana Sayfa</Link>
            <span className="text-slate-300">/</span>
            <Link href="/paketler" className="hover:text-slate-900 transition-colors">Paketler</Link>
            <span className="text-slate-300">/</span>
            <span className="text-slate-900 font-medium">{item.title}</span>
          </nav>

          <div className="grid grid-cols-1 lg:grid-cols-5 gap-8 lg:gap-12 items-center">
            {/* Sol: görsel */}
            <div className="lg:col-span-2 relative aspect-[4/3] rounded-2xl overflow-hidden border border-slate-200 shadow-sm">
              <Image
                src={item.image}
                alt={item.imageAlt}
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
                Paket Kategorisi
              </span>
              <h1 className="text-3xl md:text-4xl xl:text-5xl font-black tracking-tight text-slate-900 leading-tight">
                {item.title}
              </h1>
              <p className="mt-4 text-slate-600 text-base md:text-lg leading-relaxed">
                {item.seoDescription}
              </p>
              <p className="mt-2 text-slate-500 text-sm">{item.targetAudience}</p>

              {/* Kullanım alanları */}
              <div className="mt-5 flex flex-wrap gap-2">
                {item.useCases.map((uc) => (
                  <span key={uc} className="inline-flex items-center gap-1.5 rounded-full border border-slate-200 bg-slate-50 px-3 py-1 text-xs font-medium text-slate-700">
                    <CheckCircle2 className="w-3 h-3 text-brand shrink-0" />
                    {uc}
                  </span>
                ))}
              </div>

              {/* Kategori sayımları */}
              {categoryCounts.length > 0 && (
                <div className="mt-5 flex flex-wrap gap-2">
                  {categoryCounts.map(({ cat, count }) => (
                    <span key={cat} className="inline-flex items-center gap-1.5 rounded-lg bg-red-50 border border-red-200 px-3 py-1 text-xs font-semibold text-brand">
                      <Zap className="w-3 h-3 shrink-0" />
                      {cat} <span className="text-brand/60">({count})</span>
                    </span>
                  ))}
                </div>
              )}

              <div className="mt-7 flex flex-wrap gap-3">
                <Button asChild className="bg-brand hover:bg-brand-hover text-white rounded-xl">
                  <a href="#urunler">Ürünleri İncele</a>
                </Button>
                <Button asChild variant="outline" className="rounded-xl border-slate-300">
                  <Link href="/ges">GES Hesaplama</Link>
                </Button>
                <Button asChild variant="outline" className="rounded-xl border-slate-300">
                  <Link href="/contact">Teklif Al</Link>
                </Button>
              </div>
            </div>
          </div>
        </div>
      </div>

      <PackageUsageScenario item={item} />

      <div className="container mx-auto px-4 sm:px-6 lg:px-8 max-w-7xl py-10 md:py-14 space-y-12">

        {/* Ürünler bölümü */}
        <section id="urunler">
          <div className="flex flex-col sm:flex-row sm:items-end sm:justify-between gap-3 mb-6">
            <div>
              <h2 className="text-2xl md:text-3xl font-black text-slate-900 tracking-tight">
                {item.shortTitle} Paketine Uygun Ürünler
              </h2>
              <p className="text-slate-500 text-sm mt-1">
                {relatedProducts.length} ürün listeleniyor — {item.productCategories.length} kategori
              </p>
            </div>
            <Link
              href={`/products?q=${encodeURIComponent(item.searchHint)}`}
              className="inline-flex items-center gap-1.5 text-sm font-semibold text-brand hover:underline shrink-0"
            >
              Tümünü Gör
              <ArrowRight className="w-4 h-4" />
            </Link>
          </div>

          {relatedProducts.length === 0 ? (
            <div className="rounded-2xl border border-dashed border-slate-300 bg-white py-16 text-center">
              <p className="text-slate-500">Bu kategoriye ait ürün bulunamadı.</p>
              <Button asChild variant="outline" className="mt-4">
                <Link href="/products">Tüm Ürünler</Link>
              </Button>
            </div>
          ) : (
            <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-4 md:gap-5">
              {relatedProducts.map((product) => (
                <ProductCard key={product.id} product={product} />
              ))}
            </div>
          )}

          {/* Kategori bazlı alt filtreler */}
          {categoryCounts.length > 1 && (
            <div className="mt-6 flex flex-wrap gap-2">
              {categoryCounts.map(({ cat }) => (
                <Link
                  key={cat}
                  href={`/products?category=${encodeURIComponent(cat)}`}
                  className="rounded-lg border border-slate-200 bg-white px-4 py-2 text-sm font-medium text-slate-700 hover:border-brand hover:text-brand transition-colors"
                >
                  {cat}
                </Link>
              ))}
            </div>
          )}
        </section>

        {/* Paket Detayları */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
          <section className="bg-white border border-slate-200 rounded-2xl p-6">
            <h2 className="text-lg font-bold text-slate-900 mb-4">Kullanım Senaryoları</h2>
            <ul className="space-y-2.5">
              {item.useCases.map((useCase) => (
                <li key={useCase} className="flex items-start gap-2.5">
                  <CheckCircle2 className="w-4 h-4 mt-0.5 text-brand shrink-0" />
                  <span className="text-slate-700 text-sm">{useCase}</span>
                </li>
              ))}
            </ul>
          </section>

          <section className="bg-white border border-slate-200 rounded-2xl p-6">
            <h2 className="text-lg font-bold text-slate-900 mb-4">Paket İçeriği Öne Çıkanlar</h2>
            <ul className="space-y-2.5">
              {item.includedHighlights.map((feature) => (
                <li key={feature} className="flex items-start gap-2.5">
                  <span className="mt-2 h-1.5 w-1.5 rounded-full bg-slate-900 shrink-0" />
                  <span className="text-slate-700 text-sm">{feature}</span>
                </li>
              ))}
            </ul>
          </section>
        </div>

        {/* SSS */}
        <section className="bg-white border border-slate-200 rounded-2xl p-6">
          <h2 className="text-lg font-bold text-slate-900 mb-5">Sık Sorulan Sorular</h2>
          <div className="space-y-3">
            {item.faq.map((qa) => (
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

        {/* Alt bağlantılar */}
        <section className="grid grid-cols-1 sm:grid-cols-3 gap-3">
          <Link
            href="/products"
            className="text-center rounded-xl border border-slate-200 bg-white py-3 px-4 text-sm font-medium text-slate-700 hover:border-brand hover:text-brand transition-colors"
          >
            Tüm Ürünler
          </Link>
          <Link
            href="/category/gunes-paneli"
            className="text-center rounded-xl border border-slate-200 bg-white py-3 px-4 text-sm font-medium text-slate-700 hover:border-brand hover:text-brand transition-colors"
          >
            Güneş Paneli
          </Link>
          <Link
            href="/category/enerji-depolama"
            className="text-center rounded-xl border border-slate-200 bg-white py-3 px-4 text-sm font-medium text-slate-700 hover:border-brand hover:text-brand transition-colors"
          >
            Enerji Depolama
          </Link>
        </section>
      </div>
    </div>
  )
}
