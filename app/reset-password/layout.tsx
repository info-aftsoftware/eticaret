import type { Metadata } from 'next'

export const metadata: Metadata = {
  title: 'Şifre Sıfırlama',
  robots: { index: false, follow: true },
}

export default function ResetPasswordLayout({ children }: { children: React.ReactNode }) {
  return children
}
