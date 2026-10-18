import type { Metadata } from 'next'

export const metadata: Metadata = {
  title: 'Tüm Ürünler — Akü, Güneş Paneli, İnverter, EV Şarj',
  description:
    'Güneş paneli, lityum akü, solar inverter ve enerji depolama ürünleri. Marka, kategori ve fiyata göre filtreleyin; hızlı teslimat ve teknik destek voltekno\'da.',
  keywords: [
    'güneş paneli satın al',
    'lityum akü fiyatları',
    'hibrit inverter',
    'ev şarj istasyonu',
    'enerji depolama',
    'ges ürünleri',
    'solar ürünler',
    'voltekno ürünler',
  ],
  alternates: { canonical: '/products' },
  openGraph: {
    title: 'Tüm Ürünler | voltekno',
    description:
      'Lityum akü, güneş paneli, hibrit inverter, EV şarj ve enerji depolama ürünlerini filtrele. voltekno\'da hızlı teslimat.',
    type: 'website',
    siteName: 'voltekno',
  },
  twitter: {
    card: 'summary',
    title: 'Tüm Ürünler | voltekno',
    description: 'Güneş paneli, akü, inverter, EV şarj ve enerji depolama ürünleri.',
  },
}

export default function ProductsLayout({ children }: { children: React.ReactNode }) {
  return children
}
