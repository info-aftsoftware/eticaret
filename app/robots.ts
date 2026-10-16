import type { MetadataRoute } from 'next'

const SITE_URL = process.env.NEXT_PUBLIC_SITE_URL || process.env.NEXT_PUBLIC_BASE_URL || 'https://voltekno.com'

/** Test/geçici alan adlarında (NEXT_PUBLIC_NOINDEX=true) tüm site arama motorlarına kapatılır */
const NOINDEX = process.env.NEXT_PUBLIC_NOINDEX === 'true'

export default function robots(): MetadataRoute.Robots {
  if (NOINDEX) return { rules: { userAgent: '*', disallow: '/' } }
  return {
    rules: {
      userAgent: '*',
      allow: '/',
      disallow: ['/admin', '/api'],
    },
    sitemap: `${SITE_URL}/sitemap.xml`,
    host: SITE_URL,
  }
}
