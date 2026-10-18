import type { Metadata } from 'next'
import { getLocale } from 'next-intl/server'

export async function generateMetadata(): Promise<Metadata> {
  const locale = await getLocale()
  return {
    title: locale === 'en' ? 'Reset Password' : 'Şifre Sıfırlama',
    robots: { index: false, follow: true },
  }
}

export default function ResetPasswordLayout({ children }: { children: React.ReactNode }) {
  return children
}
