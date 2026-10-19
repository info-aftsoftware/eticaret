'use client'

import React from 'react'
import { SELLER } from '@/lib/legal/company'

const SITE_URL = (process.env.NEXT_PUBLIC_SITE_URL || process.env.NEXT_PUBLIC_BASE_URL || 'https://voltekno.com').replace(/\/$/, '')

/**
 * Ana sayfaya özel kurum + site şeması (IntlProvider yalnızca "/" için çizer).
 * Diğer sayfalar bu nesnelere @id ile başvurur (#organization, #website). Bilgiler lib/legal/company.ts'den;
 * doğrulanmamış sosyal medya hesabı (sameAs) yazılmaz.
 */
export function StructuredData() {
  const data = {
    '@context': 'https://schema.org',
    '@graph': [
      {
        '@type': 'OnlineStore',
        '@id': `${SITE_URL}/#organization`,
        name: SELLER.brand,
        legalName: SELLER.legalName,
        url: `${SITE_URL}/`,
        logo: `${SITE_URL}/logo.png`,
        email: SELLER.email,
        telephone: SELLER.phone.replace(/\s/g, ''),
        vatID: SELLER.taxNo,
        taxID: SELLER.taxNo,
        address: {
          '@type': 'PostalAddress',
          streetAddress: 'Çaydaçıra Mah. Prof. Dr. Nuri Orhan Bul. No:5 İç Kapı No:17',
          addressLocality: SELLER.district,
          addressRegion: SELLER.city,
          addressCountry: 'TR',
        },
        contactPoint: {
          '@type': 'ContactPoint',
          telephone: SELLER.phone.replace(/\s/g, ''),
          email: SELLER.email,
          contactType: 'customer service',
          areaServed: 'TR',
          availableLanguage: ['Turkish', 'English'],
        },
      },
      {
        '@type': 'WebSite',
        '@id': `${SITE_URL}/#website`,
        name: SELLER.brand,
        alternateName: 'voltekno',
        url: `${SITE_URL}/`,
        inLanguage: 'tr',
        publisher: { '@id': `${SITE_URL}/#organization` },
        // SearchAction yok: Google sitelinks arama kutusunu kaldırdı
      },
    ],
  }

  return <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(data) }} />
}
