/**
 * Birim testleri: ürün arama (lib/search-product searchProducts).
 */
import { test } from 'node:test'
import assert from 'node:assert/strict'
import { searchProducts, productMatchesQuery } from '../../lib/search-product'

const products = [
  { id: 'inv-1', name: 'Deye Monofaze İnverter 5 kW', brand: 'Deye', category: 'İnverterler', description: 'Hibrit inverter' },
  { id: 'pnl-1', name: 'TommaTech 450Wp TOPCon Güneş Paneli', brand: 'TommaTech', category: 'Güneş Panelleri', description: 'Monokristal panel' },
  { id: 'aku-1', name: 'Apex LiFePO4 Akü 100Ah', brand: 'Apex', category: 'Aküler', description: 'Lityum demir fosfat batarya' },
  { id: 'kbl-1', name: 'Solar Kablo 6mm', brand: 'Genel', category: 'Kablolar', description: 'Panel bağlantısı için inverter uyumlu kablo' },
]
const ids = (q: string) => searchProducts(products, q).map((p) => p.id)

test('Türkçe karakter ve büyük/küçük harf duyarsız', () => {
  // "güneş" eş anlamlıları (solar, panel) solar kabloyu da bulur; en ilgili sonuç önce gelir
  assert.equal(ids('GÜNEŞ')[0], 'pnl-1')
  assert.deepEqual(ids('aku'), ['aku-1'])
})

test('yazım hatası toleransı (tek harf)', () => {
  assert.ok(ids('invertör').includes('inv-1'))
  assert.ok(ids('invreter').includes('inv-1'))
  assert.ok(ids('panal').includes('pnl-1'))
})

test('eş anlamlılar: batarya → akü, solar → panel', () => {
  assert.ok(ids('batarya').includes('aku-1'))
  assert.ok(ids('solar panel').includes('pnl-1'))
})

test('çok kelimeli aramada tüm kelimeler eşleşmeli', () => {
  assert.deepEqual(ids('deye inverter'), ['inv-1'])
  assert.deepEqual(ids('deye panel'), [])
})

test('adında geçen ürün, yalnızca açıklamasında geçenden önce gelir', () => {
  assert.deepEqual(ids('inverter').slice(0, 2), ['inv-1', 'kbl-1'])
})

test('kısa kelimelerde yazım hatası eşleşmesi yapılmaz (gürültüyü önler)', () => {
  assert.deepEqual(ids('xyz'), [])
  assert.equal(productMatchesQuery(products[0], ''), true)
})
