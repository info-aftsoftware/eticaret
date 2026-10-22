import type { Metadata } from 'next'
import { localizedMetadata } from '@/lib/locale-metadata'
import Link from 'next/link'
import Image from 'next/image'
import { ArrowUpRight } from 'lucide-react'
import { getLocale } from 'next-intl/server'
import { PACKAGE_CATEGORIES } from '@/lib/package-categories'
import { PAGE_CONTAINER } from '@/lib/page-container'

const SITE_URL = process.env.NEXT_PUBLIC_SITE_URL || process.env.NEXT_PUBLIC_BASE_URL || 'https://voltekno.com'

const trMetadata: Metadata = {
  title: 'Enerji Paketleri: Bağ Evi, Villa, Karavan, Sulama, Marin',
  description:
    'Bağ evi, villa, karavan, tarımsal sulama ve marin uygulamaları için hazır güneş enerjisi paketleri. Panel, inverter ve akü ihtiyaca göre birlikte seçilir.',
  keywords: [
    'bağ evi güneş enerji paketi',
    'dağ evi solar sistem',
    'yayla evi güneş paneli',
    'bungalov enerji paketi',
    'villa güneş paneli paketi',
    'karavan güneş paneli',
    'sulama güneş enerjisi',
    'marin güneş enerji paketi',
    'hazir solar paket',
    'güneş enerji sistemi fiyatları',
    'ges paketi',
  ],
  alternates: { canonical: '/paketler' },
  openGraph: {
    title: 'Enerji Paketleri | voltekno',
    description: 'Bağ evi, villa, karavan, sulama ve marin için hazır güneş enerjisi paketleri.',
    type: 'website',
    siteName: 'voltekno',
    url: `${SITE_URL}/paketler`,
  },
}

/** Türkçe meta veri (kanonik, SEO) değişmez; İngilizce seçili ziyaretçide başlık ve açıklama İngilizce */
export function generateMetadata(): Promise<Metadata> {
  return localizedMetadata(trMetadata, {
    title: 'Energy Packages: Cabin, Villa, Caravan, Irrigation, Marine',
    description:
      'Ready-made solar energy packages for cabins, villas, caravans, agricultural irrigation and marine use. Panels, inverters and batteries are matched to your needs.',
    shareTitle: 'Energy Packages | voltekno',
    shareDescription: 'Ready-made solar energy packages for cabins, villas, caravans, irrigation and marine use.',
  })
}

function buildPackageListSchema() {
  return {
    '@context': 'https://schema.org',
    '@type': 'CollectionPage',
    name: 'Enerji Paketleri',
    description: 'Farklı kullanım alanları için hazırlanmış güneş enerjisi paketleri.',
    url: `${SITE_URL}/paketler`,
    mainEntity: {
      '@type': 'ItemList',
      itemListElement: PACKAGE_CATEGORIES.map((item, index) => ({
        '@type': 'ListItem',
        position: index + 1,
        url: `${SITE_URL}/paketler/${item.slug}`,
        name: item.seoTitle,
      })),
    },
  }
}

export default async function PaketlerPage() {
  const locale = await getLocale()
  const L = (tr: string, en: string) => (locale === 'en' ? en : tr)
  return (
    <div className="min-h-screen bg-slate-50">
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(buildPackageListSchema()) }}
      />
      <div className={`${PAGE_CONTAINER} py-10 md:py-14`}>
        <header className="mb-8 md:mb-10">
          <h1 className="text-3xl md:text-4xl font-black text-slate-900 tracking-tight">{L('Paket Kategorileri', 'Package Categories')}</h1>
          <p className="mt-2 text-slate-600">{L('İhtiyaca göre hazırlanmış enerji paketlerini inceleyin.', 'Explore energy packages tailored to your needs.')}</p>
        </header>

        <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-3 gap-6 md:gap-7">
          {PACKAGE_CATEGORIES.map((item) => {
            return (
              <Link
                key={item.slug}
                href={`/paketler/${item.slug}`}
                className="group overflow-hidden rounded-[30px] bg-white shadow-[0_16px_48px_rgba(15,23,42,0.09)] ring-1 ring-slate-200/80 hover:-translate-y-2 hover:shadow-[0_28px_70px_rgba(15,23,42,0.16)] transition-all duration-500"
              >
                <div className="relative aspect-[11/14] bg-slate-100 overflow-hidden">
                  <Image
                    src={item.image}
                    alt={L(item.imageAlt, `${item.en.shortTitle} solar energy package`)}
                    fill
                    className="object-cover group-hover:scale-[1.05] transition-transform duration-700"
                    sizes="(max-width: 640px) 100vw, (max-width: 1024px) 50vw, 33vw"
                    style={{ objectPosition: item.objectPosition ?? 'center' }}
                  />
                  <div className="absolute inset-0 ring-1 ring-inset ring-white/10" />
                  <div className="absolute inset-x-0 top-0 h-[38%] bg-gradient-to-b from-slate-950/58 via-slate-950/18 to-transparent" />
                  <div className="absolute left-0 top-0 h-36 w-36 bg-[radial-gradient(circle_at_top_left,rgba(15,23,42,0.34),transparent_72%)]" />
                  <div className="absolute inset-x-0 top-0 p-4 sm:p-5">
                    <div className="max-w-[12.75rem] rounded-[22px] border border-white/10 bg-[linear-gradient(180deg,rgba(15,23,42,0.34),rgba(15,23,42,0.12))] px-4 py-3.5 pr-5 shadow-[0_16px_34px_rgba(15,23,42,0.14)] backdrop-blur-[2px]">
                      <span className="mb-2.5 block h-px w-10 bg-gradient-to-r from-[#e7c15b] to-transparent" />
                      <h2 className="text-[1.8rem] sm:text-[1.95rem] font-black uppercase leading-[0.92] tracking-[-0.045em] [text-wrap:balance]">
                        <span className="block text-[#e7c15b] drop-shadow-[0_6px_20px_rgba(15,23,42,0.35)]">
                          {L(item.shortTitle, item.en.shortTitle)}
                        </span>
                        <span className="mt-1 block text-white drop-shadow-[0_6px_20px_rgba(15,23,42,0.38)]">
                          {L('Paketleri', 'Packages')}
                        </span>
                      </h2>
                    </div>
                  </div>
                </div>
              </Link>
            )
          })}
        </div>
      </div>
    </div>
  )
}
