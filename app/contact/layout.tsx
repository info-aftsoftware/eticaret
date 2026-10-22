import type { Metadata } from 'next'
import { localizedMetadata } from '@/lib/locale-metadata'
import React from 'react'

const SITE_URL = process.env.NEXT_PUBLIC_SITE_URL || process.env.NEXT_PUBLIC_BASE_URL || 'https://voltekno.com'

const trMetadata: Metadata = {
  title: 'İletişim — Teknik Destek ve Ürün Teklifi',
  description:
    'voltekno ile iletişime geçin: güneş paneli, akü ve inverter için fiyat teklifi, teknik destek ve kurulum danışmanlığı. Elazığ merkezli, Türkiye geneli hizmet.',
  keywords: [
    'voltekno iletişim',
    'güneş paneli teklif',
    'ges teklif al',
    'akü fiyat teklifi',
    'enerji sistemi danışmanlık',
    'teknik destek güneş',
    'solar sistem kurulum',
  ],
  alternates: { canonical: '/contact' },
  openGraph: {
    title: 'İletişim | voltekno',
    description: 'Güneş paneli, akü ve EV şarj için fiyat teklifi ve teknik destek.',
    type: 'website',
    siteName: 'voltekno',
    url: `${SITE_URL}/contact`,
  },
}

/** Türkçe meta veri (kanonik, SEO) değişmez; İngilizce seçili ziyaretçide başlık ve açıklama İngilizce */
export function generateMetadata(): Promise<Metadata> {
  return localizedMetadata(trMetadata, {
    title: 'Contact — Technical Support and Product Quotes',
    description:
      'Get in touch with voltekno: price quotes, technical support and installation consulting for solar panels, batteries and inverters. Based in Elazig, serving all of Turkey.',
    shareTitle: 'Contact | voltekno',
    shareDescription: 'Price quotes and technical support for solar panels, batteries and EV charging.',
  })
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
              name: 'voltekno',
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
