import type { Metadata } from 'next'
import { DEFAULT_OG_IMAGE } from '@/lib/seo/og'
import { localizedMetadata } from '@/lib/locale-metadata'

const trMetadata: Metadata = {
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

/** Türkçe meta veri (kanonik, SEO) değişmez; İngilizce seçili ziyaretçide başlık ve açıklama İngilizce */
export function generateMetadata(): Promise<Metadata> {
  return localizedMetadata(trMetadata, {
    title: 'Solar Calculator — Solar Energy System Sizing',
    description:
      'Free solar (PV) calculator: enter your monthly consumption to see the panel capacity, inverter size and payback period you need, and get a quote right away.',
    shareTitle: 'Solar Calculator — Solar Energy System | Voltekno',
    shareDescription: 'Free solar energy system calculator: panel capacity, inverter size, payback period and a quote from voltekno.',
  })
}

export default function GesLayout({ children }: { children: React.ReactNode }) {
  return children
}
