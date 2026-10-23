/**
 * Yönetim paneli denetimi A13–A18 kapanış senaryoları (saf hesaplar).
 */
import { test } from 'node:test'
import assert from 'node:assert/strict'
import { campaignStatus, dateRangeError, discountValueError, PERCENT_MAX } from '../../lib/campaign-rules'
import { fromBusinessDateTimeInput, toBusinessDateTimeInput } from '../../lib/business-time'
import { parseCouponInput } from '../../lib/coupon-input'
import { applyCampaigns, type ActiveCampaign } from '../../lib/discounts'
import { planBulkStock } from '../../lib/bulk-stock'

// ── A13: kampanya durumu ve saat dilimi ──────────────────────────────────

test('A13: geçmiş "Süresi doldu", gelecek "Planlandı", aralıktaki "Devam ediyor", kapalı "Kapalı"', () => {
  const now = new Date('2026-10-23T12:00:00+03:00')
  const new10 = { active: true, startDate: fromBusinessDateTimeInput('2026-10-22T00:00'), endDate: fromBusinessDateTimeInput('2026-10-22T23:59') }
  assert.equal(campaignStatus(new10, now), 'expired')
  assert.equal(campaignStatus({ active: true, startDate: '2026-11-01T00:00:00+03:00' }, now), 'planned')
  assert.equal(campaignStatus({ active: true, startDate: '2026-10-01T00:00:00+03:00', endDate: '2026-10-31T23:59:00+03:00' }, now), 'running')
  assert.equal(campaignStatus({ active: false, endDate: '2027-01-01' }, now), 'off')
  assert.equal(campaignStatus({ active: true }, now), 'running')
})

test('A13: tarih-saat kutusu Türkiye saatini gösterir ve Türkiye saatiyle kaydeder', () => {
  // 22 Ekim 23.59 TR = 20.59 UTC
  const end = fromBusinessDateTimeInput('2026-10-22T23:59')!
  assert.equal(end.toISOString(), '2026-10-22T20:59:00.000Z')
  assert.equal(toBusinessDateTimeInput(end), '2026-10-22T23:59')
  assert.equal(toBusinessDateTimeInput(null), '')
  assert.equal(fromBusinessDateTimeInput(''), null)
})

// ── A14: ortak doğrulama ─────────────────────────────────────────────────

test('A14: 101 ve negatif yüzde reddedilir; tam %100 kabul edilmez; kampanya ve kupon aynı kural', () => {
  assert.ok(discountValueError('PERCENT', 101))
  assert.ok(discountValueError('PERCENT', -5))
  assert.ok(discountValueError('PERCENT', 0))
  assert.ok(discountValueError('PERCENT', 100))
  assert.equal(discountValueError('PERCENT', PERCENT_MAX), null)
  assert.equal(discountValueError('FIXED', 250), null)
  assert.ok(discountValueError('FIXED', ''))
  assert.ok(discountValueError('BOGUS', 10))
  const coupon = parseCouponInput({ code: 'YUZDE100', type: 'PERCENT', value: 100 })
  assert.ok('error' in coupon)
  const ok = parseCouponInput({ code: 'YUZDE10', type: 'PERCENT', value: 10 })
  assert.ok(!('error' in ok))
  assert.ok('error' in parseCouponInput({ code: 'LIMIT0', type: 'FIXED', value: 50, usageLimit: 0 }))
})

test('A14: bitiş başlangıçtan önce olamaz', () => {
  assert.ok(dateRangeError(new Date('2026-10-23'), new Date('2026-10-22')))
  assert.equal(dateRangeError(new Date('2026-10-22'), new Date('2026-10-23')), null)
  assert.equal(dateRangeError(null, null), null)
})

test('A14: ürün fiyatını aşan sabit kampanya ürünü 0 TL yapmaz', () => {
  const c: ActiveCampaign = { id: 'c', name: 'Dev', scope: 'ALL', categoryName: null, productIds: [], type: 'FIXED', value: 5000, endDate: null }
  const p = applyCampaigns({ id: 'p', sku: 'p', name: 'Kablo', description: '', price: 515, category: 'Kablo', stock: 5, featured: false, isVariantProduct: false }, [c])
  assert.ok(p.price > 0)
})

// ── A16: toplu stok ──────────────────────────────────────────────────────

test('A16: 5 adede 3 ekleme 8, stoğu 3\'e eşitleme 3, çıkarma 0\'ın altına inmez; varyant stoklu atlanır', () => {
  const items = [
    { id: 'a', name: 'A', stock: 5 },
    { id: 'b', name: 'B', stock: 2 },
    { id: 'v', name: 'V', stock: 4, variantStock: true },
  ]
  const add = planBulkStock(items, 'add', 3)
  assert.deepEqual(add.rows.map((r) => [r.id, r.next, r.diff]), [['a', 8, 3], ['b', 5, 3], ['v', 4, 0]])
  assert.equal(add.changed, 2)
  assert.equal(add.skipped, 1)
  assert.deepEqual(planBulkStock(items, 'set', 3).rows.map((r) => r.next), [3, 3, 4])
  assert.deepEqual(planBulkStock(items, 'subtract', 4).rows.map((r) => r.next), [1, 0, 4])
  assert.equal(planBulkStock([{ id: 'x', name: 'X', stock: 3 }], 'set', 3).changed, 0, 'değişmeyen kayıt sayılmaz')
})
