import type { Metadata } from 'next'
import { getLocale } from 'next-intl/server'

// Kişiye özel liste: arama motorlarında dizine eklenmez
export async function generateMetadata(): Promise<Metadata> {
  const locale = await getLocale()
  return {
    title: locale === 'en' ? 'Compare Products' : 'Ürün Karşılaştırma',
    robots: { index: false, follow: true },
  }
}

export default function CompareLayout({ children }: { children: React.ReactNode }) {
  return children
}
