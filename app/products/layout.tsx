import type { Metadata } from 'next'
import { DEFAULT_OG_IMAGE } from '@/lib/seo/og'

export const metadata: Metadata = {
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

export default function ProductsLayout({ children }: { children: React.ReactNode }) {
  return children
}
