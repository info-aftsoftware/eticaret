import type { Metadata } from 'next'

export const metadata: Metadata = {
  title: 'GES Hesaplama — Güneş Enerjisi Sistemi Boyutlandırma',
  description:
    'Ücretsiz GES hesaplama: aylık tüketiminizi girin; gereken panel gücünü, inverter kapasitesini ve geri dönüş süresini öğrenin, hemen teklif alın.',
  keywords: [
    'ges hesaplama',
    'güneş enerji sistemi hesaplama',
    'güneş paneli boyutlandırma',
    'ges kaç kwp',
    'çatı güneş sistemi hesaplama',
    'solar hesaplama aracı',
    'güneş paneli kaç tane',
    'ges teklif',
    'güneş enerjisi hesaplama',
    'ges kurulum maliyeti',
  ],
  alternates: { canonical: '/ges' },
  openGraph: {
    title: 'GES Hesaplama — Güneş Enerjisi Sistemi | voltekno',
    description:
      'Ücretsiz GES hesaplama: tüketiminize göre panel gücü, inverter kapasitesi ve geri dönüş süresi. voltekno\'dan uzman teklif alın.',
    type: 'website',
    siteName: 'voltekno',
  },
  twitter: {
    card: 'summary_large_image',
    title: 'GES Hesaplama | voltekno',
    description: 'Ücretsiz güneş enerji sistemi hesaplama aracı. Panel gücü, maliyet ve teklif.',
  },
}

export default function GesLayout({ children }: { children: React.ReactNode }) {
  return children
}
