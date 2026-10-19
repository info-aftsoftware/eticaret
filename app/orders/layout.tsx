import type { Metadata } from 'next'
import { getLocale } from 'next-intl/server'

export async function generateMetadata(): Promise<Metadata> {
  const locale = await getLocale()
  return {
    title: locale === 'en' ? 'My Orders' : 'Siparişlerim',
    robots: { index: false, follow: false },
  }
}

export default function OrdersLayout({ children }: { children: React.ReactNode }) {
  return children
}
