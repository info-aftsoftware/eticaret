import type { Metadata } from 'next'
import { DEFAULT_OG_IMAGE } from '@/lib/seo/og'
import { localizedMetadata } from '@/lib/locale-metadata'
import Link from '@/lib/i18n/navigation'
import Image from 'next/image'
import { ArrowUpRight } from 'lucide-react'
import { getLocale } from 'next-intl/server'
import { PACKAGE_CATEGORIES } from '@/lib/package-categories'
import { PAGE_CONTAINER } from '@/lib/page-container'
import { localizeSiteUrls } from '@/lib/i18n/alternates'
import { jsonLdHtml } from '@/lib/seo/json-ld'

const SITE_URL = process.env.NEXT_PUBLIC_SITE_URL || process.env.NEXT_PUBLIC_BASE_URL || 'https://voltekno.com'

const trMetadata: Metadata = {
  title: 'Bağ Evi, Villa, Karavan ve Sulama için Güneş Enerjisi',
  description:
    'Bağ evi, villa, karavan, tarımsal sulama ve marin için güneş enerjisi ürünleri. Panel, inverter ve akü ihtiyaca göre teklifte birlikte belirlenir.',
  alternates: { canonical: '/paketler' },
  openGraph: {
    images: [DEFAULT_OG_IMAGE],
    title: 'Kullanım Alanına Göre Çözümler | Voltekno',
    description: 'Bağ evi, villa, karavan, sulama ve marin için güneş enerjisi çözümleri.',
    type: 'website',
    siteName: 'Voltekno',
    url: `${SITE_URL}/paketler`,
  },
}

/** Türkçe meta veri (kanonik, SEO) değişmez; İngilizce seçili ziyaretçide başlık ve açıklama İngilizce */
export function generateMetadata(): Promise<Metadata> {
  return localizedMetadata(trMetadata, {
    title: 'Solar Energy for Country Houses, Villas, RVs and Irrigation',
    description:
      'Solar energy products for country houses, villas, RVs, agricultural irrigation and marine use. Panels, inverters and batteries are selected together in your quote.',
    shareTitle: 'Solutions by Use Case | Voltekno',
    shareDescription: 'Solar energy solutions for country houses, villas, RVs, irrigation and marine use.',
  })
}

function buildPackageListSchema() {
  return {
    '@context': 'https://schema.org',
    '@type': 'CollectionPage',
    name: 'Kullanım Alanına Göre Çözümler',
    description: 'Farklı kullanım alanları için güneş enerjisi ürünleri ve çözümleri.',
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
        dangerouslySetInnerHTML={{ __html: jsonLdHtml(localizeSiteUrls(buildPackageListSchema(), locale === 'en' ? 'en' : 'tr')) }}
      />
      <div className={`${PAGE_CONTAINER} py-10 md:py-14`}>
        <header className="mb-8 md:mb-10">
          <h1 className="text-3xl md:text-4xl font-black text-slate-900 tracking-tight">{L('Kullanım Alanına Göre Çözümler', 'Solutions by Use')}</h1>
          <p className="mt-2 text-slate-600">{L('Kullanım alanına uygun ürünleri inceleyin. Bunlar hazır paket değildir; adetli malzeme listesi ve toplam bedel ihtiyaç analizinden sonra teklifte hazırlanır.', 'Browse products suited to each application. These are not ready-made packages; the bill of materials and total price are prepared in a quote after a needs analysis.')}</p>
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
                          {L('Çözümleri', 'Solutions')}
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
