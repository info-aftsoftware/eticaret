/**
 * Geliver gönderi oluşturma: istek gövdesi, teklif bekleme, teklif kabulü, iptal, adres eşleme, koli ölçüsü (sahte HTTP).
 * Çalıştırma: npm run test:unit
 */
import { test } from 'node:test'
import assert from 'node:assert/strict'
import { createGeliverClient, geliverConfigFromEnv, geliverPhone, parseGeliverShipment, planGeliverUpdate } from '../../lib/shipping/geliver-api'
import { geliverLocation } from '../../lib/shipping/geliver-location'
import { parcelDimensions } from '../../lib/shipping/order-parcel'

const ID = '37ceb9d3-7300-4b31-8a8e-efbc29aa6b4e'
const offer = (id: string, total: string, code: string) => ({ id, totalAmount: total, currency: 'TL', providerCode: code.split('_')[0], providerServiceCode: code, averageEstimatedTimeHumanReadible: '01 gün 00 saat' })
const shipment = (over: Record<string, unknown> = {}) => ({ id: ID, statusCode: 'GOT_OFFERS', test: true, order: { orderNumber: 'ORD-2026-00001' }, trackingStatus: null, ...over })

test('Geliver ayarı: test modu varsayılan açık, yalnızca 0/false ile kapanır', () => {
  assert.equal(geliverConfigFromEnv({}), null)
  assert.equal(geliverConfigFromEnv({ GELIVER_API_TOKEN: 't' })?.testMode, true)
  assert.equal(geliverConfigFromEnv({ GELIVER_API_TOKEN: 't', GELIVER_TEST_MODE: 'false' })?.testMode, false)
  assert.equal(geliverConfigFromEnv({ GELIVER_API_TOKEN: 't', GELIVER_TEST_MODE: '0', GELIVER_SENDER_ADDRESS_ID: 'adr' })?.senderAddressId, 'adr')
})

test('Geliver: telefon +90 biçimine, adres il plaka kodu ve ilçe kimliğine çevrilir', () => {
  assert.equal(geliverPhone('0532 123 45 67'), '+905321234567')
  assert.equal(geliverPhone('5321234567'), '+905321234567')
  assert.equal(geliverPhone('+90 (532) 123-45-67'), '+905321234567')
  const kadikoy = geliverLocation('İstanbul', 'Kadıköy')
  assert.equal(kadikoy?.cityCode, '34')
  assert.ok(typeof kadikoy?.districtID === 'number')
  assert.equal(geliverLocation('istanbul', 'KADIKÖY')?.districtID, kadikoy?.districtID)
  assert.equal(geliverLocation('Elazığ', 'Merkez')?.cityCode, '23')
  assert.equal(geliverLocation('Afyonkarahisar', 'İhsaniye')?.cityCode, '03')
  assert.equal(geliverLocation('Atlantis', 'Merkez'), null)
})

test('Koli ölçüsü: desiyi veren küp, ağırlık yoksa desi', () => {
  const d = parcelDimensions(5, 4)
  assert.ok(Math.abs((d.lengthCm * d.widthCm * d.heightCm) / 3000 - 5) < 1.2)
  assert.equal(d.weightKg, 4)
  assert.equal(parcelDimensions(12, null).weightKg, 12)
})

test('Geliver istemcisi: gönderi açar, teklifler tamamlanana kadar bekler, teklifi kabul eder, iptal eder', async () => {
  const calls: { method: string; url: string; body?: any }[] = []
  let polls = 0
  const fake = async (url: string, init?: { method?: string; body?: string }) => {
    const method = init?.method ?? 'GET'
    calls.push({ method, url, body: init?.body ? JSON.parse(init.body) : undefined })
    if (method === 'POST' && url.endsWith('/shipments')) {
      return { status: 201, json: async () => ({ result: true, data: shipment({ offers: { percentageCompleted: 40, list: [offer('o2', '120.50', 'ARAS_STANDART')] } }) }) }
    }
    if (method === 'GET' && url.endsWith(`/shipments/${ID}`)) {
      polls++
      return { status: 200, json: async () => ({ result: true, data: shipment({ offers: { percentageCompleted: 100, list: [offer('o2', '120.50', 'ARAS_STANDART'), offer('o1', '99.90', 'SURAT_STANDART')] } }) }) }
    }
    if (method === 'POST' && url.endsWith('/transactions')) {
      return { status: 201, json: async () => ({ result: true, data: { shipment: shipment({ statusCode: 'TRACKING_CODE_CREATED', barcode: '75466218795', labelURL: 'https://labels3.geliver.io/labels/x.pdf' }) } }) }
    }
    if (method === 'DELETE') return { status: 200, json: async () => ({ result: true }) }
    return { status: 404, json: async () => ({ result: false }) }
  }
  const c = createGeliverClient({ token: 'tkn', testMode: true, senderAddressId: null }, fake, { pollMs: 1, offerWaitMs: 1000 })
  const s = await c.createShipment({
    orderNumber: 'ORD-2026-00001',
    orderTotal: 1234.56,
    recipient: { name: 'Test', email: 't@example.com', phone: '05321234567', address: 'Moda Cad. 1', cityCode: '34', districtID: 107000 },
    parcel: { lengthCm: 25, widthCm: 25, heightCm: 25, weightKg: 4 },
    items: [{ title: 'Panel', quantity: 2 }],
  })
  const sent = calls[0].body
  assert.equal(sent.test, true)
  assert.equal(sent.senderAddressID, undefined)
  assert.equal(sent.recipientAddress.phone, '+905321234567')
  assert.equal(sent.recipientAddress.districtID, 107000)
  assert.equal(sent.order.orderNumber, 'ORD-2026-00001')
  assert.equal(sent.order.totalAmount, 1235)
  assert.equal(sent.length, '25')
  assert.equal(polls, 1)
  // Teklifler fiyata göre sıralı, firma eşlenmiş
  assert.deepEqual(s.offers.map((o) => [o.id, o.totalAmount, o.carrierId]), [['o1', 99.9, 'surat'], ['o2', 120.5, 'aras']])

  const bought = await c.acceptOffer('o1')
  assert.deepEqual(calls[calls.length - 1]?.body, { offerID: 'o1' })
  assert.equal(bought.labelUrl, 'https://labels3.geliver.io/labels/x.pdf')
  assert.equal(bought.barcode, '75466218795')

  await c.cancelShipment(ID)
  assert.equal(calls[calls.length - 1]?.method, 'DELETE')
})

test('Geliver hata kodu anlaşılır mesajla gelir (bakiye yetersiz)', async () => {
  const fake = async () => ({ status: 400, json: async () => ({ result: false, code: 'E1066', message: 'Organizasyonun yeterli bakiyesi yok.', additionalMessage: 'balance' }) })
  const c = createGeliverClient({ token: 'tkn', testMode: false, senderAddressId: null }, fake)
  await assert.rejects(() => c.acceptOffer('o1'), /yeterli bakiyesi yok.*E1066/)
})

test('Test gönderisi ve etiketi alınmamış gönderi siparişe takip numarası/linki yazmaz', () => {
  const order = { status: 'PICKING', paymentStatus: 'PAID', trackingNumber: null, trackingUrl: null, shippingCarrier: null, geliverStatusLabel: null }
  const testShip = parseGeliverShipment(shipment({ statusCode: 'SHIPPED', trackingNumber: '63717355', trackingUrl: 'https://example.com/tracking/63717355', providerServiceCode: 'GELIVER_STANDART' }))
  const p1 = planGeliverUpdate(order, testShip)
  assert.equal(p1.data.trackingNumber, undefined)
  assert.equal(p1.data.trackingUrl, undefined)
  assert.equal(p1.ship, false)
  const preLabel = parseGeliverShipment(shipment({ test: false, statusCode: 'GOT_OFFERS' }))
  assert.equal(planGeliverUpdate(order, preLabel).data.trackingUrl, undefined)
  const live = parseGeliverShipment(shipment({ test: false, statusCode: 'TRACKING_CODE_CREATED', trackingNumber: '123', trackingUrl: 'https://kargo.example/123' }))
  assert.equal(planGeliverUpdate(order, live).data.trackingNumber, '123')
})
