import type { MetadataRoute } from 'next'
import { mockProducts } from '@/lib/products-mock'
import { CATEGORY_GROUPS } from '@/lib/categories'
import { PACKAGE_CATEGORIES } from '@/lib/package-categories'
import { getMergedProducts } from '@/lib/catalog-merge'
import { LEGAL_SLUGS, legalHref } from '@/lib/legal/documents'
import { PRODUCT_TYPES } from '@/lib/seo/product-types'
import { BRANDS } from '@/lib/seo/brands'
import { BLOG_POSTS, blogDateIso } from '@/lib/blog-posts'

// Admin'in eklediği ürünler de site haritasına girsin
export const revalidate = 3600

const SITE_URL = (process.env.NEXT_PUBLIC_SITE_URL || process.env.NEXT_PUBLIC_BASE_URL || 'https://voltekno.com').replace(/\/$/, '')

/**
 * Yalnızca 200 dönen, canonical'ı kendine bakan, dizinlenebilir sayfalar.
 * lastModified yalnızca gerçek tarih biliniyorsa (blog) yazılır; her derlemede "bugün" yazmak Google'a yanlış sinyal verir.
 * changeFrequency / priority Google tarafından yok sayıldığı için yazılmaz.
 */
export default async function sitemap(): Promise<MetadataRoute.Sitemap> {
  const page = (path: string, lastModified?: string): MetadataRoute.Sitemap[number] => ({
    url: `${SITE_URL}${path}`,
    ...(lastModified && { lastModified }),
  })

  const staticPages = [
    '/', '/products', '/categories', '/paketler', '/ges', '/blog', '/hakkimizda', '/faq', '/contact', '/shipping', '/siparis-takip',
  ].map((p) => page(p))
  const legalPages = LEGAL_SLUGS.map((slug) => page(legalHref(slug)))

  // Ürün grupları ve türleri (boş "diger" grubu hariç)
  let products: { id: string; category?: string; brand?: string }[] = mockProducts
  try {
    products = await getMergedProducts()
  } catch (e) {
    console.error('Sitemap catalog error:', e)
  }
  const categoriesWithProducts = new Set(products.map((p) => p.category))
  const brandsWithProducts = new Set(products.map((p) => p.brand))

  const groupPages = CATEGORY_GROUPS.filter((g) => g.categoryValues.some((c) => categoriesWithProducts.has(c))).map((g) =>
    page(`/category/${g.id}`)
  )
  const typePages = PRODUCT_TYPES.filter((t) => categoriesWithProducts.has(t.category)).map((t) => page(`/category/${t.group}/${t.slug}`))
  const brandPages = BRANDS.filter((b) => brandsWithProducts.has(b.name)).map((b) => page(`/marka/${b.slug}`))
  const packagePages = PACKAGE_CATEGORIES.map((item) => page(`/paketler/${item.slug}`))
  const blogPages = Object.entries(BLOG_POSTS).map(([slug, post]) => page(`/blog/${slug}`, blogDateIso(post.date)))
  const productPages = products.map((p) => page(`/products/${p.id}`))

  return [...staticPages, ...groupPages, ...typePages, ...brandPages, ...packagePages, ...blogPages, ...productPages, ...legalPages]
}
