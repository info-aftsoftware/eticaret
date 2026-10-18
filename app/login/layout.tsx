import type { Metadata } from 'next'
import { getLocale } from 'next-intl/server'

export async function generateMetadata(): Promise<Metadata> {
  const locale = await getLocale()
  return {
    title: locale === 'en' ? 'Sign In' : 'Giriş Yap',
    robots: { index: false, follow: true },
  }
}

export default function LoginLayout({ children }: { children: React.ReactNode }) {
  return children
}
