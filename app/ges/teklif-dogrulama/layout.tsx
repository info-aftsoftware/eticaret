import type { Metadata } from 'next'
import { localizedMetadata } from '@/lib/locale-metadata'

/** Teklif doğrulama aracı: müşteriye özel kodla çalışır, arama sonuçlarında gösterilmez (GES sayfasının başlığını da miras almaz). */
const trMetadata: Metadata = {
  title: 'GES Teklif Doğrulama',
  description: 'Voltekno tarafından verilen güneş enerjisi teklifinin doğruluğunu teklif numarasıyla kontrol edin.',
  alternates: { canonical: '/ges/teklif-dogrulama' },
  robots: { index: false, follow: true },
}

export function generateMetadata(): Promise<Metadata> {
  return localizedMetadata(trMetadata, {
    title: 'Solar Quote Verification',
    description: 'Check that a solar energy quote issued by Voltekno is genuine using its quote number.',
  })
}

export default function QuoteVerifyLayout({ children }: { children: React.ReactNode }) {
  return children
}
