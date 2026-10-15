import { test } from 'node:test'
import assert from 'node:assert/strict'
import { estimateDelivery, formatDeliveryRange } from '../../lib/delivery-estimate'

const iso = (d: Date) => d.toISOString().slice(0, 10)

test('iş günü 15:00 öncesi: aynı gün kargo, 1–3 iş günü teslim', () => {
  // Perşembe 16.10.2026 10:00 TR (07:00 UTC)
  const r = estimateDelivery(new Date('2026-10-15T07:00:00Z'))
  assert.equal(iso(r.shipDate), '2026-10-15')
  assert.equal(iso(r.from), '2026-10-16')
  assert.equal(iso(r.to), '2026-10-20') // Cuma + hafta sonu atlanır
})

test('15:00 sonrası ertesi iş günü kargo', () => {
  const r = estimateDelivery(new Date('2026-10-16T13:30:00Z')) // Cuma 16:30 TR
  assert.equal(iso(r.shipDate), '2026-10-19') // Pazartesi
  assert.equal(iso(r.from), '2026-10-20')
  assert.equal(iso(r.to), '2026-10-22')
})

test('hafta sonu verilen sipariş pazartesi kargoda', () => {
  const r = estimateDelivery(new Date('2026-10-18T08:00:00Z')) // Pazar
  assert.equal(iso(r.shipDate), '2026-10-19')
})

test('tarih aralığı biçimi', () => {
  assert.equal(formatDeliveryRange(new Date('2026-10-16T00:00:00Z'), new Date('2026-10-20T00:00:00Z')), '16–20 Ekim')
  assert.equal(formatDeliveryRange(new Date('2026-10-30T00:00:00Z'), new Date('2026-11-03T00:00:00Z')), '30 Ekim – 3 Kasım')
})
