import type { Metadata } from 'next'
import HomePageClient from './HomePageClient'

/** Ana sayfa: istemci bileşeni ayrı dosyada; canonical burada (kök düzen artık her sayfaya canonical vermiyor). */
export const metadata: Metadata = {
  alternates: { canonical: '/' },
}

export default function HomePage() {
  return <HomePageClient />
}
