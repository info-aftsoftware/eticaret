'use client'

import React from 'react'

// Alan adı ortamdan (test alan adında da kendi adresi; kontrol listesi 33). Doğrulanmamış sosyal medya hesabı (sameAs) yazılmaz.
const SITE_URL = (process.env.NEXT_PUBLIC_SITE_URL || process.env.NEXT_PUBLIC_BASE_URL || 'https://voltekno.com').replace(/\/$/, '')

export function StructuredData() {
    const organizationData = {
        "@context": "https://schema.org",
        "@type": "Organization",
        "name": "voltekno",
        "url": SITE_URL,
        "logo": `${SITE_URL}/logo.png`,
        "contactPoint": {
            "@type": "ContactPoint",
            "telephone": "+90-551-829-16-13",
            "contactType": "customer service",
            "areaServed": "TR",
            "availableLanguage": "Turkish"
        }
    }

    const websiteData = {
        "@context": "https://schema.org",
        "@type": "WebSite",
        "name": "voltekno",
        "url": SITE_URL,
        "potentialAction": {
            "@type": "SearchAction",
            "target": `${SITE_URL}/products?q={search_term_string}`,
            "query-input": "required name=search_term_string"
        }
    }

    return (
        <>
            <script
                type="application/ld+json"
                dangerouslySetInnerHTML={{ __html: JSON.stringify(organizationData) }}
            />
            <script
                type="application/ld+json"
                dangerouslySetInnerHTML={{ __html: JSON.stringify(websiteData) }}
            />
        </>
    )
}
