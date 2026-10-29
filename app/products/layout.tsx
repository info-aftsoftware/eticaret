import type { Metadata } from 'next'
import { DEFAULT_OG_IMAGE } from '@/lib/seo/og'
import { localizedMetadata } from '@/lib/locale-metadata'

const trMetadata: Metadata = {
  title: 'Tüm Ürünler — Akü, Güneş Paneli, İnverter, EV Şarj',
  description:
    'Güneş paneli, lityum akü, solar inverter ve enerji depolama ürünleri. Marka, kategori ve fiyata göre filtreleyin; hızlı teslimat ve teknik destek voltekno\'da.',
  alternates: { canonical: '/products' },
  openGraph: {
    images: [DEFAULT_OG_IMAGE],
    title: 'Tüm Ürünler | Voltekno',
    description:
      'Lityum akü, güneş paneli, hibrit inverter, EV şarj ve enerji depolama ürünlerini filtrele. voltekno\'da hızlı teslimat.',
    type: 'website',
    siteName: 'Voltekno',
  },
  twitter: {
    images: [DEFAULT_OG_IMAGE.url],
    card: 'summary',
    title: 'Tüm Ürünler | Voltekno',
    description: 'Güneş paneli, akü, inverter, EV şarj ve enerji depolama ürünleri.',
  },
}

/** Türkçe meta veri (kanonik, SEO) değişmez; İngilizce seçili ziyaretçide başlık ve açıklama İngilizce */
export function generateMetadata(): Promise<Metadata> {
  return localizedMetadata(trMetadata, {
    title: 'All Products — Batteries, Solar Panels, Inverters, EV Charging',
    description:
      'Solar panels, lithium batteries, solar inverters and energy storage products. Filter by brand, category and price; fast delivery and technical support at voltekno.',
    shareTitle: 'All Products | Voltekno',
    shareDescription:
      'Filter lithium batteries, solar panels, hybrid inverters, EV charging and energy storage products. Fast delivery at voltekno.',
  })
}

export default function ProductsLayout({ children }: { children: React.ReactNode }) {
  return children
}
