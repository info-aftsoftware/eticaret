/**
 * Birim testleri: sipariş toplamı (lib/store-config) ve güvenli yönlendirme (lib/safe-redirect).
 * Çalıştırma: npm run test:unit
 */
import { test } from 'node:test'
import assert from 'node:assert/strict'
import { computeOrderTotals } from '../../lib/store-config'
import { shippingFeeFor, cartLogistics } from '../../lib/shipping/fee'
import { safeRedirect } from '../../lib/safe-redirect'

test('kart: indirim yok, KDV ara toplamın %20si, kargo verilen ücret', () => {
  const t = computeOrderTotals({ subtotal: 900, paymentMethod: 'card', shippingFee: 50 })
  assert.equal(t.paymentDiscount, 0)
  assert.equal(t.tax, 180)
  assert.equal(t.shipping, 50)
  assert.equal(t.total, 1130)
})

test('havale: ara toplam üzerinden %3 indirim, KDV indirimli matrahtan', () => {
  const t = computeOrderTotals({ subtotal: 900, paymentMethod: 'bank_transfer', shippingFee: 0 })
  assert.equal(t.paymentDiscount, 27)
  assert.equal(t.taxableAmount, 873)
  assert.equal(t.tax, 174.6)
  assert.equal(t.total, 1047.6)
})

test('kupon + havale birlikte, toplam indirim ara toplamı aşamaz', () => {
  const t = computeOrderTotals({ subtotal: 1000, couponDiscount: 100, paymentMethod: 'bank_transfer', shippingFee: 0 })
  assert.equal(t.couponDiscount, 100)
  assert.equal(t.paymentDiscount, 30)
  assert.equal(t.discount, 130)
  const capped = computeOrderTotals({ subtotal: 100, couponDiscount: 500, paymentMethod: 'bank_transfer', shippingFee: 0 })
  assert.equal(capped.discount, 100)
  assert.equal(capped.tax, 0)
})

test('kargo: fiyat listesi (desi), 30 üstü +20 ₺/desi, ağır yük, vergiler %22,35', () => {
  assert.equal(shippingFeeFor({ desi: 0, kg: 0 }), 110.42) // 90,25 × 1,2235
  assert.equal(shippingFeeFor({ desi: 4.2, kg: 0 }), 137.64) // 5 desiye yuvarlanır: 112,5 × 1,2235
  assert.equal(shippingFeeFor({ desi: 30, kg: 0 }), 325.76) // 266,25 × 1,2235
  assert.equal(shippingFeeFor({ desi: 35, kg: 0 }), 448.11) // (266,25 + 5×20) × 1,2235
  assert.equal(shippingFeeFor({ desi: 10, kg: 120 }), 5348.53) // ağır yük (kg): (125,25 + 4246,25) × 1,2235
  const l = cartLogistics([{ id: 'yok', quantity: 3 }])
  assert.deepEqual(l, { desi: 0, kg: 0 })
})

test('negatif / sıfır girişler güvenli', () => {
  assert.equal(computeOrderTotals({ subtotal: -5, shippingFee: 100 }).total, 0)
  assert.equal(computeOrderTotals({ subtotal: 0, shippingFee: 100 }).shipping, 0)
  assert.equal(computeOrderTotals({ subtotal: 100, couponDiscount: -50, shippingFee: 0 }).couponDiscount, 0)
})

test('safeRedirect yalnızca site içi yollara izin verir', () => {
  assert.equal(safeRedirect('/checkout'), '/checkout')
  assert.equal(safeRedirect('//evil.com'), '/profile')
  assert.equal(safeRedirect('/\\evil.com'), '/profile')
  assert.equal(safeRedirect('https://evil.com'), '/profile')
  assert.equal(safeRedirect(null, '/'), '/')
})
