/**
 * Birim testleri: sipariş toplamı (lib/store-config) ve güvenli yönlendirme (lib/safe-redirect).
 * Çalıştırma: npm run test:unit
 */
import { test } from 'node:test'
import assert from 'node:assert/strict'
import {
  computeOrderTotals,
  amountToFreeShipping,
  FREE_SHIPPING_THRESHOLD,
  SHIPPING_FEE,
} from '../../lib/store-config'
import { safeRedirect } from '../../lib/safe-redirect'

test('kart: indirim yok, KDV ara toplamın %20si, eşik altı kargo ücretli', () => {
  const t = computeOrderTotals({ subtotal: 900, paymentMethod: 'card' })
  assert.equal(t.paymentDiscount, 0)
  assert.equal(t.tax, 180)
  assert.equal(t.shipping, SHIPPING_FEE)
  assert.equal(t.total, 1130)
})

test('havale: ara toplam üzerinden %3 indirim, KDV indirimli matrahtan', () => {
  const t = computeOrderTotals({ subtotal: 900, paymentMethod: 'bank_transfer' })
  assert.equal(t.paymentDiscount, 27)
  assert.equal(t.taxableAmount, 873)
  assert.equal(t.tax, 174.6)
  assert.equal(t.total, 1097.6)
})

test('kupon + havale birlikte, toplam indirim ara toplamı aşamaz', () => {
  const t = computeOrderTotals({ subtotal: 1000, couponDiscount: 100, paymentMethod: 'bank_transfer' })
  assert.equal(t.couponDiscount, 100)
  assert.equal(t.paymentDiscount, 30)
  assert.equal(t.discount, 130)
  const capped = computeOrderTotals({ subtotal: 100, couponDiscount: 500, paymentMethod: 'bank_transfer' })
  assert.equal(capped.discount, 100)
  assert.equal(capped.tax, 0)
})

test('ücretsiz kargo eşiği: eşik ve üzeri ücretsiz (indirim öncesi ara toplama göre)', () => {
  assert.equal(computeOrderTotals({ subtotal: FREE_SHIPPING_THRESHOLD - 0.01 }).shipping, SHIPPING_FEE)
  assert.equal(computeOrderTotals({ subtotal: FREE_SHIPPING_THRESHOLD }).shipping, 0)
  assert.equal(computeOrderTotals({ subtotal: FREE_SHIPPING_THRESHOLD, paymentMethod: 'bank_transfer' }).shipping, 0)
  assert.equal(amountToFreeShipping(FREE_SHIPPING_THRESHOLD - 500), 500)
  assert.equal(amountToFreeShipping(FREE_SHIPPING_THRESHOLD), 0)
})

test('negatif / sıfır girişler güvenli', () => {
  assert.equal(computeOrderTotals({ subtotal: -5 }).total, 0)
  assert.equal(computeOrderTotals({ subtotal: 0 }).shipping, 0)
  assert.equal(computeOrderTotals({ subtotal: 100, couponDiscount: -50 }).couponDiscount, 0)
})

test('safeRedirect yalnızca site içi yollara izin verir', () => {
  assert.equal(safeRedirect('/checkout'), '/checkout')
  assert.equal(safeRedirect('//evil.com'), '/profile')
  assert.equal(safeRedirect('/\\evil.com'), '/profile')
  assert.equal(safeRedirect('https://evil.com'), '/profile')
  assert.equal(safeRedirect(null, '/'), '/')
})
