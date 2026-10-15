'use client'

import React from 'react'

export function StructuredData() {
    const organizationData = {
        "@context": "https://schema.org",
        "@type": "Organization",
        "name": "voltekno",
        "url": "https://voltekno.com",
        "logo": "https://voltekno.com/logo.png",
        "contactPoint": {
            "@type": "ContactPoint",
            "telephone": "+90-551-829-16-13",
            "contactType": "customer service",
            "areaServed": "TR",
            "availableLanguage": "Turkish"
        },
        "sameAs": [
            "https://facebook.com/voltekno",
            "https://twitter.com/voltekno",
            "https://instagram.com/voltekno"
        ]
    }

    const websiteData = {
        "@context": "https://schema.org",
        "@type": "WebSite",
        "name": "voltekno",
        "url": "https://voltekno.com",
        "potentialAction": {
            "@type": "SearchAction",
            "target": "https://voltekno.com/products?q={search_term_string}",
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
