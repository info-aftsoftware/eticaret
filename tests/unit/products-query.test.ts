import { test } from 'node:test'
import assert from 'node:assert/strict'
import { resolveProductsQuery, resolveCategoryParam } from '../../lib/products-query'
import { CATEGORY_GROUPS } from '../../lib/categories'

test('ürün listesi: parametre yoksa varsayılanlar', () => {
  assert.deepEqual(resolveProductsQuery({}), { category: null, q: '', brand: null, sort: null })
})

test('ürün listesi: alt kategori, marka, arama ve sıralama okunur', () => {
  assert.deepEqual(
    resolveProductsQuery({ category: 'Lityum Akü', brand: 'Deye', q: 'akü', sort: 'price-asc' }),
    { category: 'Lityum Akü', q: 'akü', brand: 'Deye', sort: 'price-asc' }
  )
})

test('ürün listesi: grup id, eski alt kategori ve bilinmeyen kategori', () => {
  const groupId = CATEGORY_GROUPS[0].id
  assert.equal(resolveCategoryParam(groupId), groupId)
  assert.equal(resolveCategoryParam('Lityum Batarya'), 'Lityum Akü')
  assert.equal(resolveCategoryParam('olmayan-kategori'), null)
})

test('ürün listesi: geçersiz sort yok sayılır, dizi parametrede ilk değer alınır', () => {
  const query = resolveProductsQuery({ sort: 'random', brand: ['A', 'B'] })
  assert.equal(query.sort, null)
  assert.equal(query.brand, 'A')
})
