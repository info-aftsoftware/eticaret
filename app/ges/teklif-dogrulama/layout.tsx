import type { Metadata } from 'next'

/** Teklif doğrulama aracı: müşteriye özel kodla çalışır, arama sonuçlarında gösterilmez (GES sayfasının başlığını da miras almaz). */
export const metadata: Metadata = {
  title: 'GES Teklif Doğrulama',
  description: 'Voltekno tarafından verilen güneş enerjisi teklifinin doğruluğunu teklif numarasıyla kontrol edin.',
  alternates: { canonical: '/ges/teklif-dogrulama' },
  robots: { index: false, follow: true },
}

export default function QuoteVerifyLayout({ children }: { children: React.ReactNode }) {
  return children
}
