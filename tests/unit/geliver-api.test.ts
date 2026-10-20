/**
 * Geliver gönderi takibi: yanıt çözümleme, firma eşleme, durum planı, istemci (sahte HTTP).
 * Çalıştırma: npm run test:unit
 */
import { test } from 'node:test'
import assert from 'node:assert/strict'
import {
  carrierFromProviderCode,
  createGeliverClient,
  GeliverError,
  parseGeliverShipment,
  planGeliverUpdate,
  resolveGeliverShipment,
} from '../../lib/shipping/geliver-api'

const ID = '186af322-c9ad-407c-b798-64d464816cf4'
const raw = (over: Record<string, unknown> = {}, ts: Record<string, unknown> | null = null) => ({
  id: ID,
  organizationShipmentID: 436,
  statusCode: 'LABEL_PRINTED',
  trackingNumber: '123123123',
  trackingUrl: 'http://kargo.example/123123123',
  providerServiceCode: 'SURAT_STANDART',
  order: { orderNumber: 'ORD-2026-02356' },
  trackingStatus: ts,
  ...over,
})
const order = (over: Record<string, unknown> = {}) => ({
  status: 'PICKING',
  paymentStatus: 'PAID',
  trackingNumber: null,
  trackingUrl: null,
  shippingCarrier: null,
  geliverStatusLabel: null,
  ...over,
})

test('Geliver: firma kodu → carriers.ts', () => {
  assert.equal(carrierFromProviderCode('SURAT_STANDART'), 'surat')
  assert.equal(carrierFromProviderCode('YURTICI_STANDART'), 'yurtici')
  assert.equal(carrierFromProviderCode('HEPSIJET_STANDART'), 'hepsijet')
  assert.equal(carrierFromProviderCode('KOLAYGELSIN_STANDART'), 'kolaygelsin')
  assert.equal(carrierFromProviderCode('MNG_STANDART'), 'mng')
  assert.equal(carrierFromProviderCode('PAKETTAXI_EXPRESS'), null)
  assert.equal(carrierFromProviderCode(null), null)
})

test('Geliver: yanıt çözümleme, takip linki yoksa Geliver takip sayfası', () => {
  const s = parseGeliverShipment(raw())
  assert.equal(s.carrierId, 'surat')
  assert.equal(s.trackingUrl, 'http://kargo.example/123123123')
  assert.equal(s.orderNumber, 'ORD-2026-02356')
  assert.equal(s.number, 436)
  const noUrl = parseGeliverShipment(raw({ trackingUrl: '', trackingNumber: null }))
  assert.equal(noUrl.trackingUrl, `https://app.geliver.io/tracking/${ID}`)
  assert.equal(noUrl.trackingNumber, null)
  assert.throws(() => parseGeliverShipment({}), GeliverError)
})

test('Geliver planı: etiket basıldı → takip bilgisi yazılır, sipariş henüz kargoya verilmez', () => {
  const p = planGeliverUpdate(order(), parseGeliverShipment(raw({}, { trackingStatusCode: 'PRE_TRANSIT', trackingSubStatusCode: 'information_received' })))
  assert.equal(p.ship, false)
  assert.equal(p.deliver, false)
  assert.equal(p.data.trackingNumber, '123123123')
  assert.equal(p.data.shippingCarrier, 'surat')
  assert.equal(p.data.geliverStatusLabel, 'Kargo sistemde oluşturuldu')
})

test('Geliver planı: firma teslim aldı → Kargoda; teslim → Teslim Edildi', () => {
  const transit = parseGeliverShipment(raw({ statusCode: 'SHIPPED' }, { trackingStatusCode: 'TRANSIT', trackingSubStatusCode: 'package_accepted' }))
  assert.equal(planGeliverUpdate(order(), transit).ship, true)
  // Ödemesi alınmamış sipariş kendiliğinden kargoya verilmez
  assert.equal(planGeliverUpdate(order({ paymentStatus: 'PENDING' }), transit).ship, false)
  // Zaten kargodaysa tekrar değil; durum değişince müşteriye görünen not
  const p = planGeliverUpdate(order({ status: 'SHIPPED', geliverStatusLabel: 'Kargo şubeye teslim edildi' }), parseGeliverShipment(raw({}, { trackingStatusCode: 'TRANSIT', trackingSubStatusCode: 'out_for_delivery' })))
  assert.equal(p.ship, false)
  assert.deepEqual(p.events, [{ message: 'Kargo durumu (Geliver): Kargo dağıtımda', visibleToCustomer: true }])
  const d = planGeliverUpdate(order({ status: 'SHIPPED' }), parseGeliverShipment(raw({ statusCode: 'DELIVERED' }, { trackingStatusCode: 'DELIVERED', trackingSubStatusCode: 'delivered' })))
  assert.equal(d.deliver, true)
})

test('Geliver planı: iade / iptal / test gönderisi sipariş durumunu değiştirmez', () => {
  const ret = planGeliverUpdate(order({ status: 'SHIPPED' }), parseGeliverShipment(raw({}, { trackingStatusCode: 'RETURNED', trackingSubStatusCode: 'return_to_sender' })))
  assert.equal(ret.deliver, false)
  assert.match(ret.alert ?? '', /iade/)
  const cancel = planGeliverUpdate(order(), parseGeliverShipment(raw({ statusCode: 'CANCELED' })))
  assert.match(cancel.alert ?? '', /iptal/)
  const t = planGeliverUpdate(order(), parseGeliverShipment(raw({ test: true }, { trackingStatusCode: 'DELIVERED', trackingSubStatusCode: 'delivered' })))
  assert.equal(t.ship, false)
  assert.equal(t.deliver, false)
  assert.match(t.events.map((e) => e.message).join(' '), /Test gönderisi/)
})

test('Geliver istemcisi: Bearer token, 401 → auth hatası, arama ve link çözümleme', async () => {
  const calls: { url: string; auth?: string }[] = []
  const fake = async (url: string, init?: { headers?: Record<string, string> }) => {
    calls.push({ url, auth: init?.headers?.Authorization })
    if (url.endsWith(`/shipments/${ID}`)) return { status: 200, json: async () => ({ result: true, data: raw() }) }
    if (url.includes('filter=123123123')) return { status: 200, json: async () => ({ result: true, data: [raw(), raw({ id: '00000000-0000-0000-0000-000000000000', trackingNumber: '999' })] }) }
    if (url.includes('orderNumber=')) return { status: 200, json: async () => ({ result: true, data: [raw()] }) }
    return { status: 401, json: async () => ({ result: false, additionalMessage: 'Unauthorized' }) }
  }
  const c = createGeliverClient({ token: 'tkn' }, fake)
  assert.equal((await c.getShipment(ID)).id, ID)
  assert.equal(calls[0].auth, 'Bearer tkn')
  assert.equal((await c.findByOrderNumber('ORD-2026-02356')).length, 1)
  assert.equal((await resolveGeliverShipment(c, `https://app.geliver.io/tracking/${ID}`)).id, ID)
  assert.equal((await resolveGeliverShipment(c, '123123123')).trackingNumber, '123123123')
  await assert.rejects(() => resolveGeliverShipment(c, 'yok'), (e: unknown) => e instanceof GeliverError && e.kind === 'auth')
})
