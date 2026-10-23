import type { MetadataRoute } from 'next'
import { mockProducts } from '@/lib/products-mock'
import { CATEGORY_GROUPS } from '@/lib/categories'
import { PACKAGE_CATEGORIES } from '@/lib/package-categories'
import { getMergedProducts } from '@/lib/catalog-merge'
import { LEGAL_SLUGS, legalHref } from '@/lib/legal/documents'

// Admin'in eklediği ürünler de site haritasına girsin
export const revalidate = 3600

const SITE_URL = process.env.NEXT_PUBLIC_SITE_URL || process.env.NEXT_PUBLIC_BASE_URL || 'https://voltekno.com'

export default async function sitemap(): Promise<MetadataRoute.Sitemap> {
  const now = new Date()

  const staticPages: MetadataRoute.Sitemap = [
    { url: `${SITE_URL}/`, lastModified: now, changeFrequency: 'daily', priority: 1 },
    { url: `${SITE_URL}/products`, lastModified: now, changeFrequency: 'daily', priority: 0.95 },
    { url: `${SITE_URL}/ges`, lastModified: now, changeFrequency: 'weekly', priority: 0.9 },
    { url: `${SITE_URL}/paketler`, lastModified: now, changeFrequency: 'weekly', priority: 0.85 },
    { url: `${SITE_URL}/categories`, lastModified: now, changeFrequency: 'weekly', priority: 0.82 },
    { url: `${SITE_URL}/faq`, lastModified: now, changeFrequency: 'weekly', priority: 0.78 },
    { url: `${SITE_URL}/contact`, lastModified: now, changeFrequency: 'monthly', priority: 0.8 },
    { url: `${SITE_URL}/shipping`, lastModified: now, changeFrequency: 'monthly', priority: 0.5 },
    { url: `${SITE_URL}/siparis-takip`, lastModified: now, changeFrequency: 'yearly', priority: 0.3 },
    // Yasal metinler (eski /terms, /privacy, /cookies, /returns bu adreslere canonical verir)
    ...LEGAL_SLUGS.map((slug) => ({
      url: `${SITE_URL}${legalHref(slug)}`,
      lastModified: now,
      changeFrequency: 'yearly' as const,
      priority: 0.4,
    })),
  ]

  const categoryPages: MetadataRoute.Sitemap = CATEGORY_GROUPS.map((group) => ({
    url: `${SITE_URL}/category/${group.id}`,
    lastModified: now,
    changeFrequency: 'weekly',
    priority: 0.85,
  }))

  const packagePages: MetadataRoute.Sitemap = PACKAGE_CATEGORIES.map((item) => ({
    url: `${SITE_URL}/paketler/${item.slug}`,
    lastModified: now,
    changeFrequency: 'weekly',
    priority: 0.8,
  }))

  let products: { id: string }[] = mockProducts
  try {
    // Taslak ürünler (A08) site haritasına girmez
    products = (await getMergedProducts()).filter((p) => p.status !== 'draft')
  } catch (e) {
    console.error('Sitemap catalog error:', e)
  }
  const productPages: MetadataRoute.Sitemap = products.map((product) => ({
    url: `${SITE_URL}/products/${product.id}`,
    lastModified: now,
    changeFrequency: 'weekly',
    priority: 0.8,
  }))

  return [...staticPages, ...categoryPages, ...packagePages, ...productPages]
}
