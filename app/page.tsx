import type { Metadata } from 'next'
import HomePageClient from './HomePageClient'
import { withLocaleAlternates } from '@/lib/i18n/alternates'
import { requestLocale } from '@/lib/i18n/server'

/** Ana sayfa: istemci bileşeni ayrı dosyada; canonical ve dil eşleri burada (kök düzen her sayfaya canonical vermiyor). */
export async function generateMetadata(): Promise<Metadata> {
  return withLocaleAlternates({ alternates: { canonical: '/' } }, await requestLocale())
}

export default function HomePage() {
  return <HomePageClient />
}
