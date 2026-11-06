import type { Metadata } from 'next'
import { redirect } from 'next/navigation'
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

// Şimdilik kapalı (7.11.2026): bağlantılar kaldırıldı, doğrudan gelenler GES sayfasına yönlenir.
// Yeniden açmak için QUOTE_VERIFY_ENABLED = true yapıp footer / GES formu bağlantılarını geri koymak yeterli.
const QUOTE_VERIFY_ENABLED = false

export default function QuoteVerifyLayout({ children }: { children: React.ReactNode }) {
  if (!QUOTE_VERIFY_ENABLED) redirect('/ges')
  return children
}
