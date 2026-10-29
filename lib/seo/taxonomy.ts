/**
 * Ürün türü (product.category) ↔ dizinlenebilir sayfa adresi. Tek kaynak: lib/seo/product-types.ts.
 * Tür sayfası: /category/<grup>/<tür>. Tanımı olmayan türler (ör. tek türlü ısı pompası grubu) grup sayfasına,
 * o da yoksa ürün listesi filtresine gider.
 */
import { CATEGORY_GROUPS } from '@/lib/categories'
import { PRODUCT_TYPES, type ProductTypeSeo } from '@/lib/seo/product-types'
import { categoryHref } from '@/lib/seo/type-paths'
import { PRODUCT_TYPES_EN } from '@/lib/seo/product-types-en'

const BY_CATEGORY = new Map(PRODUCT_TYPES.map((t) => [t.category, t]))
const BY_KEY = new Map(PRODUCT_TYPES.map((t) => [`${t.group}/${t.slug}`, t]))

export const typeByCategory = (category?: string | null): ProductTypeSeo | undefined =>
  category ? BY_CATEGORY.get(category) : undefined
export const typeBySlug = (group: string, slug: string) => BY_KEY.get(`${group}/${slug}`)

/** Tür içeriği ziyaretçinin dilinde (İngilizcesi lib/seo/product-types-en.ts; adres, kategori ve ilişkiler ortak) */
export function localizeType(t: ProductTypeSeo, locale: string): ProductTypeSeo {
  const en = locale === 'en' ? PRODUCT_TYPES_EN[t.slug] : undefined
  return en ? { ...t, ...en } : t
}

/** Türün kısa adı (H1) ziyaretçinin dilinde; tanımı olmayan türde katalog adı */
export function typeName(category: string, locale: string): string {
  const t = typeByCategory(category)
  return t ? localizeType(t, locale).h1 : category
}

export function groupOfCategory(category?: string | null) {
  if (!category) return undefined
  return CATEGORY_GROUPS.find((g) => (g.categoryValues as readonly string[]).includes(category))
}

/** Ürün türünün kalıcı adresi (menüler, kırıntı yolu, iç bağlantılar) — tek eşleme: lib/seo/type-paths.ts */
export const typeHref = categoryHref
