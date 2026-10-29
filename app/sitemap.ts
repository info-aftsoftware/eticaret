import type { MetadataRoute } from 'next'
import { mockProducts } from '@/lib/products-mock'
import { CATEGORY_GROUPS } from '@/lib/categories'
import { PACKAGE_CATEGORIES } from '@/lib/package-categories'
import { getMergedProducts } from '@/lib/catalog-merge'
import { LEGAL_SLUGS, legalHref } from '@/lib/legal/documents'
import { getLegalDocumentEn } from '@/lib/legal/documents-en'
import { PRODUCT_TYPES } from '@/lib/seo/product-types'
import { BRANDS } from '@/lib/seo/brands'
import { BLOG_POSTS, blogDateIso } from '@/lib/blog-posts'
import { BLOG_POSTS_EN } from '@/lib/blog-posts-en'
import { localizePath } from '@/lib/i18n/locale-path'

// Admin'in eklediği ürünler de site haritasına girsin
export const revalidate = 3600

const SITE_URL = (process.env.NEXT_PUBLIC_SITE_URL || process.env.NEXT_PUBLIC_BASE_URL || 'https://voltekno.com').replace(/\/$/, '')

/**
 * Yalnızca 200 dönen, canonical'ı kendine bakan, dizinlenebilir sayfalar.
 * lastModified yalnızca gerçek tarih biliniyorsa (blog) yazılır; her derlemede "bugün" yazmak Google'a yanlış sinyal verir.
 * changeFrequency / priority Google tarafından yok sayıldığı için yazılmaz.
 * Her sayfa iki dilde: Türkçe kökte, İngilizce /en önekli; ikisi de dil eşlerini (hreflang) verir. İngilizcesi olmayan
 * blog yazısı ve yasal metin yalnız Türkçe girer.
 */
export default async function sitemap(): Promise<MetadataRoute.Sitemap> {
  const abs = (path: string) => (path === '/' ? SITE_URL : `${SITE_URL}${path}`)
  const page = (path: string, lastModified?: string, hasEnglish = true): MetadataRoute.Sitemap => {
    const tr = abs(path)
    if (!hasEnglish) return [{ url: tr, ...(lastModified && { lastModified }) }]
    const en = abs(localizePath(path, 'en'))
    const alternates = { languages: { tr, en, 'x-default': tr } }
    return [
      { url: tr, ...(lastModified && { lastModified }), alternates },
      { url: en, ...(lastModified && { lastModified }), alternates },
    ]
  }

  const staticPages = [
    '/', '/products', '/categories', '/paketler', '/ges', '/blog', '/hakkimizda', '/faq', '/contact', '/shipping', '/siparis-takip',
  ].flatMap((p) => page(p))
  const legalPages = LEGAL_SLUGS.flatMap((slug) => page(legalHref(slug), undefined, Boolean(getLegalDocumentEn(slug))))

  // Ürün grupları ve türleri (boş "diger" grubu hariç)
  let products: { id: string; category?: string; brand?: string }[] = mockProducts
  try {
    // Taslak ürünler (A08) site haritasına girmez
    products = (await getMergedProducts()).filter((p) => p.status !== 'draft')
  } catch (e) {
    console.error('Sitemap catalog error:', e)
  }
  const categoriesWithProducts = new Set(products.map((p) => p.category))
  const brandsWithProducts = new Set(products.map((p) => p.brand))

  const groupPages = CATEGORY_GROUPS.filter((g) => g.categoryValues.some((c) => categoriesWithProducts.has(c))).flatMap((g) =>
    page(`/category/${g.id}`)
  )
  const typePages = PRODUCT_TYPES.filter((t) => categoriesWithProducts.has(t.category)).flatMap((t) => page(`/category/${t.group}/${t.slug}`))
  const brandPages = BRANDS.filter((b) => brandsWithProducts.has(b.name)).flatMap((b) => page(`/marka/${b.slug}`))
  const packagePages = PACKAGE_CATEGORIES.flatMap((item) => page(`/paketler/${item.slug}`))
  const blogPages = Object.entries(BLOG_POSTS).flatMap(([slug, post]) => page(`/blog/${slug}`, blogDateIso(post.date), Boolean(BLOG_POSTS_EN[slug])))
  const productPages = products.flatMap((p) => page(`/products/${p.id}`))

  return [...staticPages, ...groupPages, ...typePages, ...brandPages, ...packagePages, ...blogPages, ...productPages, ...legalPages]
}
