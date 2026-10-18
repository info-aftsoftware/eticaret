import { test } from 'node:test'
import assert from 'node:assert/strict'
import { mockProducts } from '../../lib/products-mock'
import {
  PRODUCTS_PER_PAGE,
  applyListingFilters,
  buildProductsSnapshot,
  filterByCategoryAndSearch,
  getPriceBounds,
  toListItem,
} from '../../lib/products-listing'
import { resolveProductsQuery } from '../../lib/products-query'
import { CATEGORY_GROUPS } from '../../lib/categories'

/** İstemcinin /api/products verisiyle yaptığı hesap (ilk durum: fiyat aralığı sonuçların tamamı) */
function clientListing(params: Record<string, string>) {
  const query = resolveProductsQuery(params)
  const base = filterByCategoryAndSearch(mockProducts.map(toListItem), query.category, query.q)
  return applyListingFilters(base, { brand: query.brand, priceRange: getPriceBounds(base), specs: {}, sort: query.sort ?? 'newest' })
}

const CASES: Record<string, string>[] = [{}, { q: 'akü' }, { q: 'inverter', sort: 'price-asc' }, { category: CATEGORY_GROUPS[0].id }, { category: 'Lityum Akü', brand: 'Deye' }]

for (const params of CASES) {
  test(`ürün listesi: sunucu ilk sayfası istemci hesabıyla aynı (${JSON.stringify(params)})`, () => {
    const snapshot = buildProductsSnapshot(mockProducts, resolveProductsQuery(params))
    const client = clientListing(params)
    assert.equal(snapshot.total, client.length)
    assert.deepEqual(snapshot.products.map((p) => p.id), client.slice(0, PRODUCTS_PER_PAGE).map((p) => p.id))
  })
}

test('ürün listesi: sunucu yalnızca ilk sayfayı gönderir', () => {
  const snapshot = buildProductsSnapshot(mockProducts, resolveProductsQuery({}))
  assert.equal(snapshot.total, mockProducts.length)
  assert.equal(snapshot.products.length, Math.min(PRODUCTS_PER_PAGE, mockProducts.length))
  assert.equal(snapshot.specFacets.length, 0)
})
