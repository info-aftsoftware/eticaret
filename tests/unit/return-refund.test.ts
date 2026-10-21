/**
 * İade tutarı önerisi: kısmi iadelerde kargo ücreti yalnızca siparişi tamamlayan talebe eklenir.
 * Çalıştırma: npm run test:unit
 */
import { test } from 'node:test'
import assert from 'node:assert/strict'
import { suggestedRefund } from '../../lib/return-refund'

// 2 satır: A (2 adet × 100), B (1 adet × 200); ara toplam 400, kargo 50, toplam 530 (KDV ve indirim dahil örnek)
const order = (requests: { id: string; status: string; items: { lineId: string; name: string; quantity: number }[] }[] = []) =>
  ({
    subtotal: 400,
    total: 530,
    shippingCost: 50,
    lines: [
      { id: 'A', unitPrice: 100, quantity: 2 },
      { id: 'B', unitPrice: 200, quantity: 1 },
    ],
    returnRequests: requests,
  }) as unknown as Parameters<typeof suggestedRefund>[0]

test('tek seferde tam iade: ürünler + kargo', () => {
  assert.equal(suggestedRefund(order(), [{ lineId: 'A', name: 'A', quantity: 2 }, { lineId: 'B', name: 'B', quantity: 1 }]), 530)
})

test('kısmi iade: kargo yok', () => {
  assert.equal(suggestedRefund(order(), [{ lineId: 'B', name: 'B', quantity: 1 }]), 240) // 480 × 0,5
})

test('son talep siparişi tamamlıyorsa kargo bu talebe eklenir', () => {
  const first = { id: 'r1', status: 'REFUNDED', items: [{ lineId: 'A', name: 'A', quantity: 2 }] }
  const second = [{ lineId: 'B', name: 'B', quantity: 1 }]
  assert.equal(suggestedRefund(order([first, { id: 'r2', status: 'RECEIVED', items: second }]), second, 'r2'), 290) // 240 + 50
  // İlk talebin kendi önerisi değişmez (kendisi hariç tutulur, diğer talep tamamlamıyorsa kargo yok)
  assert.equal(suggestedRefund(order([first]), first.items, 'r1'), 240)
})

test('reddedilen / iptal edilen talepler sayılmaz', () => {
  const rejected = { id: 'r1', status: 'REJECTED', items: [{ lineId: 'A', name: 'A', quantity: 2 }] }
  assert.equal(suggestedRefund(order([rejected]), [{ lineId: 'B', name: 'B', quantity: 1 }], 'r2'), 240)
})
