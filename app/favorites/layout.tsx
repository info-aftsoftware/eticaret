import type { Metadata } from 'next'
import { getLocale } from 'next-intl/server'

export async function generateMetadata(): Promise<Metadata> {
  const locale = await getLocale()
  return {
    title: locale === 'en' ? 'My Favorites' : 'Favorilerim',
    robots: { index: false, follow: true },
  }
}

export default function FavoritesLayout({ children }: { children: React.ReactNode }) {
  return children
}
