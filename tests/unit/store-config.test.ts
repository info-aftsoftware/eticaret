/**
 * Birim testleri: sipariş toplamı (lib/store-config) ve güvenli yönlendirme (lib/safe-redirect).
 * Çalıştırma: npm run test:unit
 */
import { test } from 'node:test'
import assert from 'node:assert/strict'
import { computeOrderTotals, bankTransferDeadline } from '../../lib/store-config'
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

test('kargo: iki kaynağın en ucuzu (ayrıntılı testler shipping-quote.test.ts)', () => {
  assert.equal(shippingFeeFor({ desi: 0, kg: 0 }), 99) // Navlungo PTT 1–2 desi
  const l = cartLogistics([{ id: 'yok', quantity: 3 }])
  assert.deepEqual(l, { desi: 0, kg: 0, desiExact: 0, heavyPieces: 0, heavyKgPieces: 0, battery: false, hasInstall: false, installOnly: false })
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
  // tarayıcı kontrol karakterini atınca //evil.com olurdu
  assert.equal(safeRedirect('/\t/evil.com'), '/profile')
  assert.equal(safeRedirect('/\n/evil.com'), '/profile')
  assert.equal(safeRedirect('/orders/ORD-1?x=1'), '/orders/ORD-1?x=1')
})

test('havale son ödeme anı: 3 gün sonrasının sonu, İstanbul saatiyle', () => {
  // 01.10 15:00 İstanbul → 04.10 23:59:59 İstanbul
  assert.equal(bankTransferDeadline('2026-10-01T12:00:00Z').toISOString(), '2026-10-04T20:59:59.999Z')
  // 02.10 01:30 İstanbul (UTC hâlâ 01.10) → 05.10 sonu
  assert.equal(bankTransferDeadline('2026-10-01T22:30:00Z').toISOString(), '2026-10-05T20:59:59.999Z')
})

test('kurulumlu ürün (şarj istasyonu) kargo ücretine girmez; yalnızca o varsa kargo 0', () => {
  const station = 'aft-pro-v2-dc-hizli-elektrikli-arac-sarj-istasyonu-90-270kw-aftprov290'
  const only = cartLogistics([{ id: station, quantity: 2 }])
  assert.equal(only.installOnly, true)
  assert.equal(shippingFeeFor(only), 0)
  const mixed = cartLogistics([{ id: station, quantity: 1 }, { id: 'tommatech-450wp-dark-series-16bb-topcon-gunes-paneli', quantity: 1 }])
  assert.equal(mixed.installOnly, false)
  assert.equal(mixed.hasInstall, true)
  assert.equal(mixed.desi, cartLogistics([{ id: 'tommatech-450wp-dark-series-16bb-topcon-gunes-paneli', quantity: 1 }]).desi)
  assert.ok(shippingFeeFor(mixed) > 0)
})
