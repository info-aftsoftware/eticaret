/**
 * Birim testleri: kampanya motoru (lib/discounts applyCampaigns) — veritabanı kullanmaz.
 */
import { test } from 'node:test'
import assert from 'node:assert/strict'
import { applyCampaigns, type ActiveCampaign } from '../../lib/discounts'

const product = {
  id: 'urun-1',
  sku: 'U1',
  name: 'Ürün',
  description: '',
  price: 1000,
  category: 'Güneş Panelleri',
  stock: 10,
  variants: [
    { key: 'a', label: 'A', price: 1000 },
    { key: 'b', label: 'B', price: 2000 },
  ],
} as unknown as Parameters<typeof applyCampaigns>[0]

const c = (over: Partial<ActiveCampaign>): ActiveCampaign => ({
  id: 'c', name: 'Kampanya', scope: 'ALL', categoryName: null, productIds: [], type: 'PERCENT', value: 10, endDate: null, ...over,
})

test('kampanya yoksa ürün değişmez', () => {
  const r = applyCampaigns(product, [])
  assert.equal(r.price, 1000)
  assert.equal(r.oldPrice, undefined)
})

test('yüzde indirim: fiyat, eski fiyat, rozet ve varyantlar', () => {
  const r = applyCampaigns(product, [c({ value: 10 })])
  assert.equal(r.price, 900)
  assert.equal(r.oldPrice, 1000)
  assert.equal(r.discount, 10)
  assert.deepEqual(r.variants?.map((v) => v.price), [900, 1800])
  assert.equal(r.campaign?.name, 'Kampanya')
})

test('sabit TL indirim', () => {
  const r = applyCampaigns(product, [c({ type: 'FIXED', value: 150 })])
  assert.equal(r.price, 850)
  assert.equal(r.discount, 15)
})

test('birden fazla kampanyada en avantajlısı uygulanır (toplanmaz)', () => {
  const r = applyCampaigns(product, [c({ id: '1', value: 10 }), c({ id: '2', type: 'FIXED', value: 300 }), c({ id: '3', value: 20 })])
  assert.equal(r.price, 700)
  assert.equal(r.campaign?.id, '2')
})

test('kapsam: kategori ve ürün eşleşmesi', () => {
  assert.equal(applyCampaigns(product, [c({ scope: 'CATEGORY', categoryName: 'İnverterler' })]).price, 1000)
  assert.equal(applyCampaigns(product, [c({ scope: 'CATEGORY', categoryName: 'Güneş Panelleri' })]).price, 900)
  assert.equal(applyCampaigns(product, [c({ scope: 'PRODUCT', productIds: ['baska'] })]).price, 1000)
  assert.equal(applyCampaigns(product, [c({ scope: 'PRODUCT', productIds: ['urun-1'] })]).price, 900)
})

test('fiyat sıfıra inemez (en fazla %99)', () => {
  assert.equal(applyCampaigns(product, [c({ type: 'FIXED', value: 5000 })]).price, 10)
  assert.equal(applyCampaigns(product, [c({ value: 100 })]).price, 10)
})
