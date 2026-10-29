import type { Metadata } from 'next'
import { notFound } from 'next/navigation'
import Link from '@/lib/i18n/navigation'
import Image from 'next/image'
import { ArrowRight } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { PACKAGE_CATEGORIES, getPackageCategory } from '@/lib/package-categories'
import { getStorefrontProducts } from '@/lib/discounts'
import { packageProductList } from '@/lib/package-fit'
import { contactHref } from '@/lib/contact-topics'
import { ProductCard } from '@/components/ProductCard'
import { PAGE_CONTAINER } from '@/lib/page-container'
import { getLocale } from 'next-intl/server'
import { localizedMetadata } from '@/lib/locale-metadata'
import { localizeSiteUrls } from '@/lib/i18n/alternates'
import { jsonLdHtml } from '@/lib/seo/json-ld'

const SITE_URL = process.env.NEXT_PUBLIC_SITE_URL || process.env.NEXT_PUBLIC_BASE_URL || 'https://voltekno.com'
const MAX_PRODUCTS = 16

// Güncel vitrin verisi (fiyat, satış durumu, panelde girilen sistem voltajı) 10 dakikada bir yenilenir
export const revalidate = 600

export function generateStaticParams() {
  return PACKAGE_CATEGORIES.map((item) => ({ slug: item.slug }))
}

export async function generateMetadata(props: { params: Promise<{ slug: string }> }): Promise<Metadata> {
  const params = await props.params;
  const item = getPackageCategory(params.slug)
  if (!item) return { title: 'Sayfa bulunamadı' }

  const title = `${item.seoTitle} | Voltekno`
  const description = item.seoDescription

  const trMetadata: Metadata = {
    // Kök şablon "%s | Voltekno" ekler; sayfa başlığına marka tekrar yazılmaz
    title: item.seoTitle,
    description,
    alternates: { canonical: `/paketler/${item.slug}` },
    openGraph: {
      title,
      description,
      type: 'website',
      siteName: 'Voltekno',
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
    title: `${item.en.shortTitle} Solar Energy Solutions`,
    description: item.en.description,
  })
}

function buildBreadcrumbSchema(item: NonNullable<ReturnType<typeof getPackageCategory>>) {
  return {
    '@context': 'https://schema.org',
    '@type': 'BreadcrumbList',
    itemListElement: [
      { '@type': 'ListItem', position: 1, name: 'Ana Sayfa', item: `${SITE_URL}/` },
      { '@type': 'ListItem', position: 2, name: 'Kullanım Alanları', item: `${SITE_URL}/paketler` },
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
  const title = L(item.title, `${item.en.shortTitle} Solutions`)

  // Kullanım alanının kategorilerinden, uygunluk sınırlarına (voltaj, depolama, ağırlık) uyan ürünler (lib/package-fit)
  const relatedProducts = packageProductList(item, await getStorefrontProducts(), MAX_PRODUCTS)

  return (
    <div className="min-h-screen bg-slate-50">
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: jsonLdHtml(localizeSiteUrls(buildBreadcrumbSchema(item), locale === 'en' ? 'en' : 'tr')) }}
      />
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: jsonLdHtml(localizeSiteUrls(buildFaqSchema(item), locale === 'en' ? 'en' : 'tr')) }}
      />

      {/* Hero */}
      <div className="bg-white border-b border-slate-200/80">
        <div className={`${PAGE_CONTAINER} py-8 md:py-12`}>
          <nav className="text-sm text-slate-500 mb-6 flex items-center gap-1.5 flex-wrap">
            <Link href="/" className="hover:text-slate-900 transition-colors">{L('Ana Sayfa', 'Home')}</Link>
            <span className="text-slate-300">/</span>
            <Link href="/paketler" className="hover:text-slate-900 transition-colors">{L('Kullanım Alanları', 'Solutions by Use')}</Link>
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
                {L('Kullanım Alanı', 'Application')}
              </span>
              <h1 className="text-3xl md:text-4xl xl:text-5xl font-black tracking-tight text-slate-900 leading-tight">
                {title}
              </h1>
              <div className="mt-6 flex flex-wrap gap-3">
                <Button asChild className="bg-brand hover:bg-brand-hover text-white rounded-xl">
                  <a href="#urunler">{L('Ürünleri İncele', 'Browse Products')}</a>
                </Button>
                <Button asChild variant="outline" className="rounded-xl border-slate-300">
                  <Link href="/ges">{L('GES Ön Tahmin ve Teklif', 'Solar Estimate and Quote')}</Link>
                </Button>
                <Button asChild variant="outline" className="rounded-xl border-slate-300">
                  <Link href={contactHref('urun', { subject: `${item.shortTitle} sistemi için ürün teklifi` })}>{L('Ürün Teklifi Al', 'Get a Product Quote')}</Link>
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
                {L(`${item.shortTitle} İçin Uygun Ürünler`, `Products for ${item.en.shortTitle} Use`)}
              </h2>
              <p className="text-slate-500 text-sm mt-1">
                {L(`${relatedProducts.length} ürün listeleniyor`, `${relatedProducts.length} products listed`)}
                {item.fit && L(` · ${item.fit.note}`, ` · ${item.fit.noteEn}`)}
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

          {/* Madde 14–15: hazır paket değil; listede bulunmak uyumluluk iddiası değil */}
          <div className="mb-6 rounded-xl border border-slate-200 bg-white p-4 text-sm text-slate-600 leading-relaxed">
            <p>
              {L(
                `Bu sayfa hazır bir paket değildir. ${item.shortTitle} kurulumlarında kullanılan ürün gruplarından seçilmiş ürünler listelenir; listede bulunmak sizin sisteminizle uyumlu olduğu anlamına gelmez. Adetli malzeme listesi, güç ve depolama kapasitesi, toplam bedel ve dahil/hariç kapsam ihtiyaç analizinden sonra teklifte hazırlanır.`,
                `This page is not a ready-made package. It lists products from the product groups used in ${item.en.shortTitle.toLowerCase()} installations; being listed does not mean compatibility with your system. The bill of materials, power and storage capacity, total price and scope are prepared in a quote after a needs analysis.`
              )}
            </p>
            {locale !== 'en' && item.includesItems.length > 0 && (
              <div className="mt-3">
                <p className="font-semibold text-slate-800">Tipik bir sistemde bulunanlar (örnek, kesin liste teklifte belirlenir)</p>
                <ul className="mt-1.5 list-disc pl-5 space-y-0.5">
                  {item.includesItems.map((x) => (
                    <li key={x}>{x}</li>
                  ))}
                </ul>
              </div>
            )}
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
