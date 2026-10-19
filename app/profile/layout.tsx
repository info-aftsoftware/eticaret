import type { Metadata } from 'next'
import { getLocale } from 'next-intl/server'

export async function generateMetadata(): Promise<Metadata> {
  const locale = await getLocale()
  return {
    title: locale === 'en' ? 'My Account' : 'Hesabım',
    robots: { index: false, follow: true },
  }
}

export default function ProfileLayout({ children }: { children: React.ReactNode }) {
  return children
}
