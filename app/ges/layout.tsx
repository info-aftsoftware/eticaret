import type { Metadata } from 'next'
import { localizedMetadata } from '@/lib/locale-metadata'

const trMetadata: Metadata = {
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

/** Türkçe meta veri (kanonik, SEO) değişmez; İngilizce seçili ziyaretçide başlık ve açıklama İngilizce */
export function generateMetadata(): Promise<Metadata> {
  return localizedMetadata(trMetadata, {
    title: 'Solar Calculator — Solar Energy System Sizing',
    description:
      'Free solar (PV) calculator: enter your monthly consumption to see the panel capacity, inverter size and payback period you need, and get a quote right away.',
    shareTitle: 'Solar Calculator — Solar Energy System | voltekno',
    shareDescription: 'Free solar energy system calculator: panel capacity, inverter size, payback period and a quote from voltekno.',
  })
}

export default function GesLayout({ children }: { children: React.ReactNode }) {
  return children
}
