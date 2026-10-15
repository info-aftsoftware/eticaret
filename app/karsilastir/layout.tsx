import type { Metadata } from 'next'

// Kişiye özel liste: arama motorlarında dizine eklenmez
export const metadata: Metadata = {
  title: 'Ürün Karşılaştırma',
  robots: { index: false, follow: true },
}

export default function CompareLayout({ children }: { children: React.ReactNode }) {
  return children
}
