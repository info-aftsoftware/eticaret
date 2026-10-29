import type { Metadata, Viewport } from 'next'
import React from 'react'
import { Inter } from 'next/font/google'
import './globals.css'
import { getLocale } from 'next-intl/server'
import IntlProvider from './IntlProvider'
import { FirebaseAnalyticsInit } from '@/components/FirebaseAnalyticsInit'
import { ClientErrorReporter } from '@/components/ClientErrorReporter'
import { CartSync } from '@/components/CartSync'
import { EnglishScopeNotice } from '@/components/EnglishScopeNotice'
import { DEFAULT_OG_IMAGE } from '@/lib/seo/og'
import { localizedMetadata } from '@/lib/locale-metadata'

// latin-ext: Türkçe harfler (ş, ğ, ı, İ) aynı fonttan gelsin; yoksa yedek fonttan çizilip sonradan değişiyor (CLS)
const inter = Inter({ subsets: ['latin', 'latin-ext'], display: 'swap' })
const SITE_URL = process.env.NEXT_PUBLIC_SITE_URL || process.env.NEXT_PUBLIC_BASE_URL || 'https://voltekno.com'
const SITE_NAME = 'Voltekno'

export const viewport: Viewport = {
  width: 'device-width',
  initialScale: 1,
  maximumScale: 5,
  userScalable: true,
  viewportFit: 'cover',
  themeColor: '#0f172a',
}

const trMetadata: Metadata = {
  metadataBase: new URL(SITE_URL),
  icons: {
    icon: [
      { url: '/favicon.png', type: 'image/png', sizes: '192x192' },
    ],
    // Apple simgesi: app/apple-icon.png (180×180, beyaz zemin) dosya kuralıyla eklenir
    shortcut: ['/favicon.png'],
  },
  title: {
    default: 'Güneş Paneli, Akü, İnverter ve EV Şarj | Voltekno',
    template: '%s | Voltekno',
  },
  description:
    'Güneş paneli, lityum akü, solar inverter, şarj kontrol cihazı ve anahtar teslim GES çözümleri. Hazır enerji paketleri, hızlı teslimat ve uzman teknik destek.',
  authors: [{ name: 'Voltekno', url: SITE_URL }],
  creator: 'Voltekno',
  publisher: 'Voltekno',
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
    title: 'Güneş Paneli, Akü, İnverter ve EV Şarj | Voltekno',
    description:
      'Güneş paneli, lityum akü, inverter, EV şarj ve enerji depolama ürünleri. GES hesaplama ve teknik destek. Türkiye\'ye hızlı teslimat.',
    images: [DEFAULT_OG_IMAGE],
  },
  twitter: {
    card: 'summary_large_image',
    title: 'Güneş Paneli, Akü, İnverter ve EV Şarj | Voltekno',
    description:
      'Güneş paneli, lityum akü, inverter, EV şarj ve enerji depolama ürünleri. GES hesaplama ve teknik destek.',
    images: [DEFAULT_OG_IMAGE.url],
  },
  // canonical sayfa başına verilir (kök düzende verilirse kendi canonical'ı olmayan her sayfa ana sayfanın kopyası sayılır)
  // Search Console HTML etiketi doğrulaması (alan adı DNS ile doğrulanırsa gerekmez)
  ...(process.env.NEXT_PUBLIC_GOOGLE_SITE_VERIFICATION && {
    verification: { google: process.env.NEXT_PUBLIC_GOOGLE_SITE_VERIFICATION },
  }),
}

/**
 * Ana sayfa ve kendi başlığı olmayan sayfalar: İngilizce seçili ziyaretçide sekme başlığı ve açıklama İngilizce.
 * Kanonik URL, hreflang ve anahtar kelimeler Türkçe sürümle aynı kalır.
 */
export function generateMetadata(): Promise<Metadata> {
  return localizedMetadata(trMetadata, {
    title: {
      default: 'Solar Panels, Batteries, Inverters and EV Charging | Voltekno',
      template: '%s | Voltekno',
    },
    description:
      'Solar panels, lithium batteries, solar inverters, charge controllers and turnkey solar (PV) solutions. Ready-made energy packages, fast delivery and expert technical support.',
    shareTitle: 'Solar Panels, Batteries, Inverters and EV Charging | Voltekno',
    shareDescription:
      'Solar panels, lithium batteries, inverters, EV charging and energy storage products. Solar sizing and technical support. Fast delivery across Turkey.',
  })
}

// Kurum + site şeması yalnızca ana sayfada (components/StructuredData.tsx); diğer sayfalar @id ile başvurur.

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
        <IntlProvider>
          <FirebaseAnalyticsInit />
          <ClientErrorReporter />
          <CartSync />
          <EnglishScopeNotice />
          {children}
        </IntlProvider>
      </body>
    </html>
  )
}
