import type { Metadata } from 'next'
import { getLocale } from 'next-intl/server'

export async function generateMetadata(): Promise<Metadata> {
  const locale = await getLocale()
  return {
    title: locale === 'en' ? 'Secure Checkout' : 'Güvenli Ödeme',
    robots: { index: false, follow: false },
  }
}

export default function CheckoutLayout({ children }: { children: React.ReactNode }) {
  return children
}
