import type { Metadata } from 'next'
import { getLocale } from 'next-intl/server'

export async function generateMetadata(): Promise<Metadata> {
  const locale = await getLocale()
  return {
    title: locale === 'en' ? 'Email Verification' : 'E-posta Doğrulama',
    robots: { index: false, follow: true },
  }
}

export default function VerifyEmailLayout({ children }: { children: React.ReactNode }) {
  return children
}
