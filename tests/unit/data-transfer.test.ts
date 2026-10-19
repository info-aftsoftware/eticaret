import { test } from 'node:test'
import assert from 'node:assert/strict'
import { toCsv, parseCsv, parseNumber, headerKey } from '../../lib/csv'
import { planStockPriceImport, type ImportProduct } from '../../lib/stock-price-import'
import { planBulkShipping, matchCarrier } from '../../lib/bulk-shipping'
import { errorFingerprint } from '../../lib/error-log'

test('CSV: Excel uyumlu (BOM, noktalı virgül, ondalık virgül) ve geri okunur', () => {
  const csv = toCsv(['Ürün kodu', 'Ad'], [['a-1', 'Akü; "12V"'], ['b-2', 1234.5]])
  assert.ok(csv.startsWith('﻿'))
  assert.ok(csv.includes('"Akü; ""12V"""'))
  assert.ok(csv.includes('1234,5'))
  const back = parseCsv(csv)
  assert.deepEqual(back[1], ['a-1', 'Akü; "12V"'])
  assert.deepEqual(back[2], ['b-2', '1234,5'])
})

test('CSV: virgül ve sekme ayırıcı tahmin edilir', () => {
  assert.deepEqual(parseCsv('a,b\n1,2\n'), [['a', 'b'], ['1', '2']])
  assert.deepEqual(parseCsv('a\tb\r\n1\t2'), [['a', 'b'], ['1', '2']])
})

test('sayı okuma: Türkçe ve İngilizce biçimler', () => {
  assert.equal(parseNumber('1.234,56'), 1234.56)
  assert.equal(parseNumber('1,234.56'), 1234.56)
  assert.equal(parseNumber('1234,5'), 1234.5)
  assert.equal(parseNumber('₺ 12.500'), 12500)
  assert.equal(parseNumber('17'), 17)
  assert.equal(parseNumber(''), null)
  assert.equal(parseNumber('abc'), null)
  assert.equal(headerKey('Fiyat (KDV hariç)'), 'fiyat')
  assert.equal(headerKey('Ürün kodu'), 'urun kodu')
})

const products: ImportProduct[] = [
  { id: 'aku-100', sku: 'AK100', name: 'Akü 100Ah', price: 10000, stock: 17 },
  { id: 'inv-3k', sku: 'INV3', name: 'İnverter 3kW', price: 20000, stock: 5, isVariantProduct: true },
]

test('içe aktarma planı: değişen, aynı ve hatalı satırlar; SKU ile eşleme', () => {
  const csv = 'Ürün kodu;SKU;Stok;Fiyat (KDV hariç)\naku-100;;24;10.500,00\n;INV3;5;20000\nyok-1;;3;\n'
  const plan = planStockPriceImport(csv, products)
  assert.ok(!('error' in plan))
  if ('error' in plan) return
  assert.equal(plan.rows[0].status, 'change')
  assert.equal(plan.rows[0].newStock, 24)
  assert.equal(plan.rows[0].newPrice, 10500)
  assert.equal(plan.rows[1].status, 'same')
  assert.equal(plan.rows[2].status, 'error')
  assert.equal(plan.changes, 1)
  assert.equal(plan.errors, 1)
})

test('içe aktarma planı: geçersiz stok, varyantlı fiyat ve şüpheli büyük fiyat değişikliği reddedilir', () => {
  const plan = planStockPriceImport('Ürün kodu;Stok;Fiyat\naku-100;-2;\ninv-3k;;25000\n', products)
  if ('error' in plan) throw new Error(plan.error)
  assert.match(plan.rows[0].message ?? '', /Stok/)
  assert.match(plan.rows[1].message ?? '', /Varyantlı/)
  const big = planStockPriceImport('Ürün kodu;Fiyat\naku-100;100000\n', products)
  if ('error' in big) throw new Error(big.error)
  assert.equal(big.rows[0].status, 'error')
  assert.ok('error' in planStockPriceImport('Ad;Stok\nx;1\n', products))
})

test('toplu kargo: firma adı esnek eşlenir, ödenmemiş ve bilinmeyen siparişler reddedilir', () => {
  assert.equal(matchCarrier('Yurtiçi')?.id, 'yurtici')
  assert.equal(matchCarrier('ARAS KARGO')?.id, 'aras')
  assert.equal(matchCarrier('mng')?.id, 'mng')
  assert.equal(matchCarrier('bilinmeyen firma'), null)
  const orders = [
    { id: 'o1', orderNo: 'ORD-2026-02301', status: 'PICKING', paymentStatus: 'PAID' },
    { id: 'o2', orderNo: 'ORD-2026-02302', status: 'PENDING', paymentStatus: 'PENDING' },
  ]
  const plan = planBulkShipping('Sipariş no;Kargo firması;Takip no\nord-2026-02301;Aras;123\nORD-2026-02302;Aras;456\nORD-9;Aras;789\n', orders)
  if ('error' in plan) throw new Error(plan.error)
  assert.equal(plan.rows[0].status, 'ship')
  assert.equal(plan.rows[1].status, 'error')
  assert.match(plan.rows[1].message ?? '', /Ödemesi/)
  assert.equal(plan.rows[2].message, 'Sipariş bulunamadı')
  assert.equal(plan.ready, 1)
})

test('hata gruplama: değişken sayı ve kimlikler aynı satırda toplanır', () => {
  const a = errorFingerprint({ source: 'server', context: 'odeme', message: 'Sipariş ORD-2026-02301 için 3 deneme başarısız' })
  const b = errorFingerprint({ source: 'server', context: 'odeme', message: 'Sipariş ORD-2026-02999 için 5 deneme başarısız' })
  const c = errorFingerprint({ source: 'client', context: 'odeme', message: 'Sipariş ORD-2026-02301 için 3 deneme başarısız' })
  assert.equal(a, b)
  assert.notEqual(a, c)
})
