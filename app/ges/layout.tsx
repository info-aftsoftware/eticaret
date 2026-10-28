import type { Metadata } from 'next'
import { DEFAULT_OG_IMAGE } from '@/lib/seo/og'

export const metadata: Metadata = {
  title: 'GES Hesaplama — Güneş Enerjisi Sistemi Boyutlandırma',
  description:
    'Ücretsiz GES hesaplama: aylık tüketiminizi girin; gereken panel gücünü, inverter kapasitesini ve geri dönüş süresini öğrenin, hemen teklif alın.',
  alternates: { canonical: '/ges' },
  openGraph: {
    images: [DEFAULT_OG_IMAGE],
    title: 'GES Hesaplama — Güneş Enerjisi Sistemi | Voltekno',
    description:
      'Ücretsiz GES hesaplama: tüketiminize göre panel gücü, inverter kapasitesi ve geri dönüş süresi. voltekno\'dan uzman teklif alın.',
    type: 'website',
    siteName: 'Voltekno',
  },
  twitter: {
    images: [DEFAULT_OG_IMAGE.url],
    card: 'summary_large_image',
    title: 'GES Hesaplama | Voltekno',
    description: 'Ücretsiz güneş enerji sistemi hesaplama aracı. Panel gücü, maliyet ve teklif.',
  },
}

export default function GesLayout({ children }: { children: React.ReactNode }) {
  return children
}
