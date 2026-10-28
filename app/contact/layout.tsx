import type { Metadata } from 'next'
import { DEFAULT_OG_IMAGE } from '@/lib/seo/og'
import React from 'react'

const SITE_URL = process.env.NEXT_PUBLIC_SITE_URL || process.env.NEXT_PUBLIC_BASE_URL || 'https://voltekno.com'

export const metadata: Metadata = {
  title: 'İletişim — Teknik Destek ve Ürün Teklifi',
  description:
    'voltekno ile iletişime geçin: güneş paneli, akü ve inverter için fiyat teklifi, teknik destek ve kurulum danışmanlığı. Elazığ merkezli, Türkiye geneli hizmet.',
  alternates: { canonical: '/contact' },
  openGraph: {
    images: [DEFAULT_OG_IMAGE],
    title: 'İletişim | Voltekno',
    description: 'Güneş paneli, akü ve EV şarj için fiyat teklifi ve teknik destek.',
    type: 'website',
    siteName: 'Voltekno',
    url: `${SITE_URL}/contact`,
  },
}

export default function ContactLayout({ children }: { children: React.ReactNode }) {
  return (
    <>
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{
          __html: JSON.stringify({
            '@context': 'https://schema.org',
            '@type': 'ContactPage',
            name: 'voltekno İletişim',
            url: `${SITE_URL}/contact`,
            description: 'Güneş paneli, akü, inverter ve EV şarj için iletişim sayfası.',
            mainEntity: {
              '@type': 'LocalBusiness',
              name: 'Voltekno',
              url: SITE_URL,
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
              areaServed: 'TR',
              sameAs: [],
            },
          }),
        }}
      />
      {children}
    </>
  )
}
