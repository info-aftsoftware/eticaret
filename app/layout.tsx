import type { Metadata, Viewport } from 'next'
import React from 'react'
import { Inter } from 'next/font/google'
import './globals.css'
import { getLocale } from 'next-intl/server'
import IntlProvider from './IntlProvider'
import { FirebaseAnalyticsInit } from '@/components/FirebaseAnalyticsInit'
import { ClientErrorReporter } from '@/components/ClientErrorReporter'
import { CartSync } from '@/components/CartSync'

// latin-ext: Türkçe harfler (ş, ğ, ı, İ) aynı fonttan gelsin; yoksa yedek fonttan çizilip sonradan değişiyor (CLS)
const inter = Inter({ subsets: ['latin', 'latin-ext'], display: 'swap' })
const SITE_URL = process.env.NEXT_PUBLIC_SITE_URL || process.env.NEXT_PUBLIC_BASE_URL || 'https://voltekno.com'
const SITE_NAME = 'voltekno'

export const viewport: Viewport = {
  width: 'device-width',
  initialScale: 1,
  maximumScale: 5,
  userScalable: true,
  viewportFit: 'cover',
  themeColor: '#0f172a',
}

export const metadata: Metadata = {
  metadataBase: new URL(SITE_URL),
  icons: {
    icon: [
      { url: '/favicon.png', type: 'image/png', sizes: '192x192' },
    ],
    // Apple simgesi: app/apple-icon.png (180×180, beyaz zemin) dosya kuralıyla eklenir
    shortcut: ['/favicon.png'],
  },
  title: {
    default: 'voltekno | Güneş Paneli, Akü, İnverter, EV Şarj ve Enerji Sistemleri',
    template: '%s | voltekno',
  },
  description:
    'Güneş paneli, lityum akü, solar inverter, şarj kontrol cihazı ve anahtar teslim GES çözümleri. Hazır enerji paketleri, hızlı teslimat ve uzman teknik destek.',
  keywords: [
    'güneş paneli',
    'güneş paneli fiyatları',
    'monokristal güneş paneli',
    'lityum akü',
    'lifepo4 akü',
    'akü fiyatları',
    'hibrit inverter',
    'off grid inverter',
    'ges hesaplama',
    'güneş enerji sistemi',
    'enerji depolama',
    'ev şarj istasyonu',
    'ev şarj kablosu',
    'araç şarj kablosu',
    'tip2 şarj kablosu',
    'solar panel',
    'güneş enerjisi',
    'bağ evi enerji paketi',
    'villa güneş paneli',
    'karavan güneş paneli',
    'sulama güneş enerjisi',
    'marin batarya',
    'taşınabilir güç istasyonu',
    'enerji yönetim sistemi',
    'voltekno',
  ],
  authors: [{ name: 'voltekno', url: SITE_URL }],
  creator: 'voltekno',
  publisher: 'voltekno',
  // NEXT_PUBLIC_NOINDEX=true: test/geçici alan adı arama sonuçlarına girmesin
  robots: {
    index: process.env.NEXT_PUBLIC_NOINDEX !== 'true',
    follow: process.env.NEXT_PUBLIC_NOINDEX !== 'true',
    googleBot: {
      index: process.env.NEXT_PUBLIC_NOINDEX !== 'true',
      follow: process.env.NEXT_PUBLIC_NOINDEX !== 'true',
      'max-image-preview': 'large',
      'max-snippet': -1,
      'max-video-preview': -1,
    },
  },
  openGraph: {
    type: 'website',
    locale: 'tr_TR',
    url: SITE_URL,
    siteName: SITE_NAME,
    title: 'voltekno | Güneş Paneli, Akü, İnverter ve Enerji Sistemleri',
    description:
      'Güneş paneli, lityum akü, inverter, EV şarj ve enerji depolama ürünleri. GES hesaplama ve teknik destek. Türkiye\'ye hızlı teslimat.',
    images: [
      {
        url: 'https://images.unsplash.com/photo-1509391366360-2e959784a276?w=1200&h=630&fit=crop&q=80',
        width: 1200,
        height: 630,
        alt: 'voltekno enerji sistemleri',
      },
    ],
  },
  twitter: {
    card: 'summary_large_image',
    title: 'voltekno | Güneş Paneli, Akü, İnverter ve Enerji Sistemleri',
    description:
      'Güneş paneli, lityum akü, inverter, EV şarj ve enerji depolama ürünleri. GES hesaplama ve teknik destek.',
    images: ['https://images.unsplash.com/photo-1509391366360-2e959784a276?w=1200&h=630&fit=crop&q=80'],
  },
  alternates: {
    canonical: SITE_URL,
    languages: {
      'tr-TR': SITE_URL,
    },
  },
  verification: {
    google: process.env.NEXT_PUBLIC_GOOGLE_SITE_VERIFICATION || '',
  },
}

const organizationJsonLd = {
  '@context': 'https://schema.org',
  '@type': 'Organization',
  name: 'voltekno',
  legalName: 'AFET TEKNOLOJİLERİ TİCARET VE SANAYİ LİMİTED ŞİRKETİ',
  email: 'info@voltekno.com',
  taxID: '0091882726',
  url: SITE_URL,
  logo: `${SITE_URL}/icon.png`,
  description: 'Güneş paneli, akü, inverter, EV şarj istasyonu ve enerji depolama sistemleri satışı.',
  sameAs: [],
  contactPoint: {
    '@type': 'ContactPoint',
    telephone: '+90-551-829-16-13',
    contactType: 'customer service',
    availableLanguage: ['Turkish', 'English'],
    areaServed: 'TR',
  },
  address: {
    '@type': 'PostalAddress',
    streetAddress: 'Çaydaçıra Mah. Prof. Dr. Nuri Orhan Bul. No:5 İç Kapı No:17',
    addressLocality: 'Merkez',
    addressRegion: 'Elazığ',
    addressCountry: 'TR',
  },
}

const websiteJsonLd = {
  '@context': 'https://schema.org',
  '@type': 'WebSite',
  name: 'voltekno',
  url: SITE_URL,
  description: 'Güneş paneli, akü, inverter ve enerji sistemleri e-ticaret sitesi.',
  potentialAction: {
    '@type': 'SearchAction',
    target: {
      '@type': 'EntryPoint',
      urlTemplate: `${SITE_URL}/products?q={search_term_string}`,
    },
    'query-input': 'required name=search_term_string',
  },
}

const localBusinessJsonLd = {
  '@context': 'https://schema.org',
  '@type': 'LocalBusiness',
  name: 'voltekno',
  url: SITE_URL,
  logo: `${SITE_URL}/icon.png`,
  telephone: '+90-551-829-16-13',
  email: 'info@voltekno.com',
  address: {
    '@type': 'PostalAddress',
    streetAddress: 'Çaydaçıra Mah. Prof. Dr. Nuri Orhan Bul. No:5 İç Kapı No:17',
    addressLocality: 'Merkez',
    addressRegion: 'Elazığ',
    addressCountry: 'TR',
  },
  openingHoursSpecification: [
    {
      '@type': 'OpeningHoursSpecification',
      dayOfWeek: ['Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday'],
      opens: '09:00',
      closes: '18:00',
    },
  ],
  priceRange: '₺₺',
  currenciesAccepted: 'TRY',
  paymentAccepted: 'Cash, Credit Card, Bank Transfer',
  areaServed: 'TR',
}

export default async function RootLayout({
  children,
}: {
  children: React.ReactNode
}) {
  // İngilizce seçiliyken sunucu HTML'i de lang="en" gelsin (arama motorları, ekran okuyucular)
  let lang = 'tr'
  try {
    lang = (await getLocale()) === 'en' ? 'en' : 'tr'
  } catch {
    lang = 'tr'
  }
  return (
    <html lang={lang} suppressHydrationWarning>
      <body className={inter.className} suppressHydrationWarning>
        <script
          type="application/ld+json"
          dangerouslySetInnerHTML={{ __html: JSON.stringify([organizationJsonLd, websiteJsonLd, localBusinessJsonLd]) }}
        />
        <IntlProvider>
          <FirebaseAnalyticsInit />
          <ClientErrorReporter />
          <CartSync />
          {children}
        </IntlProvider>
      </body>
    </html>
  )
}
