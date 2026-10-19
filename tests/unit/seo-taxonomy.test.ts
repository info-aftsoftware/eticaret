import { test } from 'node:test'
import assert from 'node:assert/strict'
import { PRODUCT_TYPES } from '../../lib/seo/product-types'
import { TYPE_PATHS, categoryHref } from '../../lib/seo/type-paths'
import { BRANDS, brandHref } from '../../lib/seo/brands'
import { CATEGORY_GROUPS } from '../../lib/categories'
import { mockProducts } from '../../lib/products-mock'
import { BLOG_POSTS, blogDateIso } from '../../lib/blog-posts'

test('her ürün türünün içeriği ile hafif adres eşlemesi aynı', () => {
  for (const t of PRODUCT_TYPES) {
    assert.equal(TYPE_PATHS[t.category], `/category/${t.group}/${t.slug}`, t.category)
    const group = CATEGORY_GROUPS.find((g) => g.id === t.group)
    assert.ok(group && (group.categoryValues as readonly string[]).includes(t.category), `${t.category} ${t.group} grubunda değil`)
  }
})

test('katalogdaki her ürün türünün kalıcı bir sayfası var (filtre adresine düşmüyor)', () => {
  const categories = new Set(mockProducts.map((p) => p.category).filter((c) => c && c !== 'Genel'))
  for (const c of categories) assert.ok(!categoryHref(c!).startsWith('/products?'), `${c} için sayfa yok`)
})

test('tür adresleri ASCII, küçük harf, tireli; başlık ve açıklamalar benzersiz', () => {
  for (const t of PRODUCT_TYPES) assert.match(t.slug, /^[a-z0-9]+(-[a-z0-9]+)*$/, t.slug)
  const titles = PRODUCT_TYPES.map((t) => t.title)
  const descs = PRODUCT_TYPES.map((t) => t.description)
  assert.equal(new Set(titles).size, titles.length, 'yinelenen title')
  assert.equal(new Set(descs).size, descs.length, 'yinelenen description')
  for (const t of PRODUCT_TYPES) {
    assert.ok(t.title.length <= 60, `${t.slug} title ${t.title.length} karakter`)
    assert.ok(t.description.length >= 110 && t.description.length <= 165, `${t.slug} description ${t.description.length} karakter`)
    assert.ok(t.guide.length >= 2 && t.faq.length >= 2, `${t.slug} rehber/SSS eksik`)
    for (const r of t.related) assert.ok(PRODUCT_TYPES.some((x) => x.slug === r), `${t.slug} → bilinmeyen ilgili tür ${r}`)
    for (const b of t.blog) assert.ok(BLOG_POSTS[b], `${t.slug} → bilinmeyen blog ${b}`)
  }
})

test('katalogdaki her markanın sayfası var', () => {
  const brands = new Set(mockProducts.map((p) => p.brand).filter(Boolean))
  for (const b of brands) assert.ok(brandHref(b!).startsWith('/marka/'), `${b} için marka sayfası yok`)
  for (const b of BRANDS) assert.match(b.slug, /^[a-z0-9]+(-[a-z0-9]+)*$/)
})

test('blog tarihleri ISO biçimine çevrilir', () => {
  assert.equal(blogDateIso('12 Nisan 2025'), '2025-04-12')
  assert.equal(blogDateIso('5 Ağustos 2025'), '2025-08-05')
  for (const p of Object.values(BLOG_POSTS)) assert.ok(blogDateIso(p.date), p.date)
})
