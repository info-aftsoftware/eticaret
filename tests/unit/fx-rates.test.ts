import { test } from 'node:test'
import assert from 'node:assert/strict'
import { applyTryRates, toTry, type TryRates } from '../../lib/fx-rates'
import type { MockProduct } from '../../lib/products-mock'

const rates: TryRates = { USD: 40, EUR: 45, updatedAt: '2026-01-01T00:00:00.000Z', source: 'TCMB' }

const product = (over: Partial<MockProduct> = {}): MockProduct => ({
  id: 'p', sku: 'P-1', name: 'Ürün', description: '', price: 1, category: 'Panel', stock: 5,
  featured: false, isVariantProduct: false, priceCurrency: 'USD', basePrice: 100, ...over,
})

test('USD fiyat güncel kurla TL’ye çevrilir', () => {
  assert.equal(applyTryRates(product(), rates).price, 4000)
})

test('EUR fiyat ve varyant fiyatları çevrilir, tam TL’ye yukarı yuvarlanır', () => {
  const p = applyTryRates(product({
    priceCurrency: 'EUR',
    basePrice: 10.333,
    isVariantProduct: true,
    variants: [{ key: 'a', label: 'A', price: 0, basePrice: 10.333 }, { key: 'b', label: 'B', price: 0, basePrice: 20 }],
  }), rates)
  assert.equal(p.price, 465)
  assert.deepEqual(p.variants!.map((v) => v.price), [465, 900])
})

test('döviz bilgisi olmayan (TL) ürün değişmez', () => {
  const p = product({ priceCurrency: undefined, basePrice: undefined, price: 750 })
  assert.equal(applyTryRates(p, rates), p)
  assert.equal(toTry(12.345, 'TRY', rates), 12.35)
})
