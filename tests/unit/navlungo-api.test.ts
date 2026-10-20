/**
 * Navlungo Domestic API istemcisi: sahte HTTP (fetch) ile. Gerçek API'ye istek atılmaz.
 * Yanıt örnekleri tcgunel/omniship-navlungo paketinin test verilerinden (belge + QA biçimleri).
 * Çalıştırma: npm run test:unit
 */
import { test } from 'node:test'
import assert from 'node:assert/strict'
import {
  NAVLUNGO_API_URL,
  NAVLUNGO_QA_API_URL,
  NavlungoError,
  createNavlungoClient,
  navlungoConfigFromEnv,
  normalizeNavlungoPhone,
  planTrackingUpdate,
  type FetchLike,
  type NavlungoConfig,
  type NavlungoTracking,
  type TokenCache,
} from '../../lib/shipping/navlungo-api'
import { orderTrackingUrl } from '../../lib/shipping/carriers'

const CONFIG: NavlungoConfig = { username: 'api-user', password: 'secret', senderAddressId: 56027, testMode: true, carrierId: 1, platform: 'Voltekno' }

type Call = { url: string; method: string; headers: Record<string, string>; body: any }
type Reply = { status?: number; json?: unknown; text?: string } | ((call: Call) => { status?: number; json?: unknown; text?: string })

/** Sıralı yanıt veren sahte fetch; her isteği kaydeder */
function fakeFetch(replies: Reply[]) {
  const calls: Call[] = []
  const fetch: FetchLike = async (url, init) => {
    const call: Call = {
      url,
      method: init.method ?? 'GET',
      headers: init.headers as Record<string, string>,
      body: typeof init.body === 'string' ? JSON.parse(init.body) : null,
    }
    calls.push(call)
    const r = replies.shift()
    if (!r) throw new Error(`beklenmeyen istek: ${call.method} ${url}`)
    const res = typeof r === 'function' ? r(call) : r
    const text = res.text ?? (res.json !== undefined ? JSON.stringify(res.json) : '')
    return new Response(text, { status: res.status ?? 200, headers: { 'Content-Type': 'application/json' } })
  }
  return { fetch, calls }
}

const authOk = (token = 'tok-1', expiresIn?: string): Reply => ({
  json: { status: true, data: { access_token: token, expires_in: expiresIn ?? '2026-10-21 04:00:00' } },
})

const trackingPayload = (over: Record<string, unknown> = {}, status: Record<string, unknown> = {}) => ({
  status: true,
  message: null,
  data: {
    post_number: 'MFYS29970',
    reference_id: 'VT-2026-00042',
    tracking_url: 'https://domestic-track.navlungo.com/check/MFYS29970',
    carrier_tracking_code: '3547896654321',
    carrier_tracking_url: 'https://kargotakip.example/?no=3547896654321',
    barcode_status: 1,
    post: { carrier_id: 9, carrier_name: 'Sürat Kargo', post_type: 2 },
    status: { status_code: 2, status_name: 'Teslim Edildi', delivered_date: '2026-10-22 09:47:41', delivered_person_name: 'Ayşe Yılmaz', ...status },
    logs: [
      { status_code: 2, action: 'webhook_delivered', action_result: 'Teslim Edildi', created_at: '2026-10-22 12:47:41' },
      { status_code: 16, action: 'webhook_picked_up', action_result: 'Teslim Alındı', created_at: '2026-10-21 17:27:37' },
    ],
    ...over,
  },
})

// 20.10.2026 12:00 İstanbul
const NOW = Date.parse('2026-10-20T12:00:00+03:00')

test('yapılandırma: zorunlu değişken eksikse kapalı; test modu varsayılan açık', () => {
  assert.equal(navlungoConfigFromEnv({}), null)
  assert.equal(navlungoConfigFromEnv({ NAVLUNGO_API_USERNAME: 'u', NAVLUNGO_API_PASSWORD: 'p' }), null)
  assert.equal(navlungoConfigFromEnv({ NAVLUNGO_API_USERNAME: 'u', NAVLUNGO_API_PASSWORD: 'p', NAVLUNGO_SENDER_ADDRESS_ID: 'abc' }), null)
  const c = navlungoConfigFromEnv({ NAVLUNGO_API_USERNAME: 'u', NAVLUNGO_API_PASSWORD: 'p', NAVLUNGO_SENDER_ADDRESS_ID: '56027' })!
  assert.equal(c.testMode, true)
  assert.equal(c.carrierId, 1)
  assert.equal(c.senderAddressId, 56027)
  const prod = navlungoConfigFromEnv({ NAVLUNGO_API_USERNAME: 'u', NAVLUNGO_API_PASSWORD: 'p', NAVLUNGO_SENDER_ADDRESS_ID: '1', NAVLUNGO_TEST_MODE: 'false', NAVLUNGO_CARRIER_ID: '9' })!
  assert.equal(prod.testMode, false)
  assert.equal(prod.carrierId, 9)
})

test('token: bir kez alınır, önbellekten kullanılır, süresi dolunca yenilenir', async () => {
  let now = NOW
  const { fetch, calls } = fakeFetch([
    authOk('tok-1', '2026-10-20 20:00:00'), // 8 saat
    { json: trackingPayload() },
    { json: trackingPayload() },
    authOk('tok-2', '2026-10-21 04:00:00'),
    { json: trackingPayload() },
  ])
  const client = createNavlungoClient(CONFIG, { fetch, tokenCache: new Map(), now: () => now })
  await client.checkPost('MFYS29970')
  await client.checkPost('MFYS29970')
  assert.equal(calls.filter((c) => c.url.endsWith('/auth/api')).length, 1)
  assert.deepEqual(calls[0].body, { username: 'api-user', password: 'secret' })
  assert.equal(calls[1].headers.Authorization, 'Bearer tok-1')
  assert.equal(calls[2].headers.Authorization, 'Bearer tok-1')
  // Bitişten 5 dk önce yenilenir
  now = Date.parse('2026-10-20T19:56:00+03:00')
  await client.checkPost('MFYS29970')
  assert.equal(calls[3].url, `${NAVLUNGO_QA_API_URL}/auth/api`)
  assert.equal(calls[4].headers.Authorization, 'Bearer tok-2')
})

test('token: eşzamanlı istekler tek kimlik doğrulaması yapar; 401 gelince token yenilenip bir kez tekrarlanır', async () => {
  const cache: TokenCache = new Map()
  const a = fakeFetch([authOk('tok-1'), { json: trackingPayload() }, { json: trackingPayload() }])
  const c1 = createNavlungoClient(CONFIG, { fetch: a.fetch, tokenCache: cache, now: () => NOW })
  await Promise.all([c1.checkPost('A'), c1.checkPost('B')])
  assert.equal(a.calls.filter((c) => c.url.endsWith('/auth/api')).length, 1)

  const b = fakeFetch([{ status: 401, json: { status: false, message: 'Unauthenticated.' } }, authOk('tok-new'), { json: trackingPayload() }])
  const c2 = createNavlungoClient(CONFIG, { fetch: b.fetch, tokenCache: cache, now: () => NOW })
  const t = await c2.checkPost('MFYS29970')
  assert.equal(t.postNumber, 'MFYS29970')
  assert.equal(b.calls[0].headers.Authorization, 'Bearer tok-1')
  assert.equal(b.calls[2].headers.Authorization, 'Bearer tok-new')
})

test('token: yanlış kimlik bilgisi → auth hatası, Navlungo mesajıyla', async () => {
  const { fetch } = fakeFetch([{ status: 422, json: { status: false, error: 'Geçersiz kullanıcı bilgileri.' } }])
  const client = createNavlungoClient(CONFIG, { fetch, tokenCache: new Map(), now: () => NOW })
  await assert.rejects(client.checkPost('X'), (e: unknown) => {
    assert.ok(e instanceof NavlungoError)
    assert.equal(e.kind, 'auth')
    assert.match(e.message, /Geçersiz kullanıcı bilgileri/)
    return true
  })
})

test('üretim / QA adresi test moduna göre seçilir', async () => {
  const { fetch, calls } = fakeFetch([authOk(), { json: trackingPayload() }])
  const client = createNavlungoClient({ ...CONFIG, testMode: false }, { fetch, tokenCache: new Map(), now: () => NOW })
  await client.checkPost('VT-2026/42')
  assert.equal(calls[0].url, `${NAVLUNGO_API_URL}/auth/api`)
  assert.equal(calls[1].url, `${NAVLUNGO_API_URL}/post/check/VT-2026%2F42`)
  assert.equal(calls[1].method, 'GET')
  assert.equal(calls[1].headers['X-localization'], 'tr')
})

test('post/create: gövde (adres defteri gönderici, reference_id, telefon, desi) ve iki yanıt biçimi', async () => {
  const { fetch, calls } = fakeFetch([
    authOk(),
    {
      status: 201,
      json: {
        status: true,
        message: null,
        post_number: 'MFYS29970',
        reference_id: 'VT-2026-00042',
        tracking_url: 'https://domestic-track.navlungo.com/check/MFYS29970',
        barcode_url: 'https://domestic-qa-barcode.navlungo.com/MFYS29970.pdf',
        post: { carrier_id: 9, carrier_name: 'Sürat Kargo', post_type: 2 },
      },
    },
    {
      status: 201,
      json: {
        status: true,
        message: 'Gönderiniz, cüzdan bakiyenizin yeterli olması durumunda başarılı bir şekilde oluşturulacaktır.',
        data: [
          {
            post_number: '5TV84M7G7DPO',
            reference_id: 'VT-2026-00043',
            tracking_url: 'https://domestic-track-qa.navlungo.com/check/5TV84M7G7DPO-dev',
            barcode: 'https://domestic-qa-barcode.navlungo.com/5TV84M7G7DPO.pdf',
            post: { carrier_id: 9, carrier_name: 'Aras Kargo' },
          },
        ],
      },
    },
  ])
  const client = createNavlungoClient(CONFIG, { fetch, tokenCache: new Map(), now: () => NOW })
  const input = {
    referenceId: 'VT-2026-00042',
    recipient: { name: 'Ayşe Yılmaz ', phone: '0532 123 45 67', email: 'ayse@example.com', address: 'Örnek Mah. 5. Sok. No:7', city: 'İstanbul', district: 'Kadıköy', postCode: '34710' },
    desi: 3.456,
    packageCount: 2,
    note: 'Sipariş VT-2026-00042',
  }
  const a = await client.createPost(input)
  const post = calls[1].body.posts[0]
  assert.equal(calls[1].url, `${NAVLUNGO_QA_API_URL}/post/create`)
  assert.equal(calls[1].body.platform, 'Voltekno')
  assert.equal(post.reference_id, 'VT-2026-00042')
  assert.equal(post.carrier_id, 1)
  assert.equal(post.post_type, 2)
  assert.deepEqual(post.sender, { addressId: 56027 })
  assert.equal(post.recipient.name, 'Ayşe Yılmaz')
  assert.equal(post.recipient.phone, '+90 532 123 45 67')
  assert.equal(post.recipient.country, 'tr')
  assert.equal(post.recipient.post_code, '34710')
  assert.deepEqual({ desi: post.post.desi, package_count: post.post.package_count }, { desi: 3.46, package_count: 2 })
  assert.equal(post.cod_payment_type, '')
  assert.deepEqual(a, {
    postNumber: 'MFYS29970',
    referenceId: 'VT-2026-00042',
    trackingUrl: 'https://domestic-track.navlungo.com/check/MFYS29970',
    labelUrl: 'https://domestic-qa-barcode.navlungo.com/MFYS29970.pdf',
    carrierName: 'Sürat Kargo',
    message: null,
  })
  // QA biçimi: data: [ {...} ], etiket bağlantısı "barcode" anahtarında
  const b = await client.createPost({ ...input, referenceId: 'VT-2026-00043' })
  assert.equal(b.postNumber, '5TV84M7G7DPO')
  assert.equal(b.trackingUrl, 'https://domestic-track-qa.navlungo.com/check/5TV84M7G7DPO-dev')
  assert.equal(b.labelUrl, 'https://domestic-qa-barcode.navlungo.com/5TV84M7G7DPO.pdf')
  assert.equal(b.carrierName, 'Aras Kargo')
})

test('post/create: aynı reference_id → duplicate; doğrulama hataları birleştirilir', async () => {
  const { fetch } = fakeFetch([
    authOk(),
    { status: 422, json: { status: false, error: 'Bu gönderi numarası zaten mevcuttur.' } },
    { status: 422, json: { status: false, error: { 'posts.0.recipient.phone': ['Telefon geçersiz.'], 'posts.0.recipient.city': ['İl zorunludur.'] } } },
  ])
  const client = createNavlungoClient(CONFIG, { fetch, tokenCache: new Map(), now: () => NOW })
  const input = { referenceId: 'VT-1', recipient: { name: 'A', phone: '5', address: 'x', city: '', district: 'y' }, desi: 1 }
  await assert.rejects(client.createPost(input), (e: unknown) => e instanceof NavlungoError && e.kind === 'duplicate')
  await assert.rejects(client.createPost(input), (e: unknown) => {
    assert.ok(e instanceof NavlungoError)
    assert.equal(e.kind, 'api')
    assert.equal(e.status, 422)
    assert.equal(e.message, 'Telefon geçersiz. İl zorunludur.')
    return true
  })
})

test('post/check: durum, taşıyıcı takip kodu, takip linki, loglar', async () => {
  const { fetch } = fakeFetch([
    authOk(),
    { json: trackingPayload() },
    { json: trackingPayload({ carrier_tracking_code: null, barcode_status: 0, logs: [] }, { status_code: 1, status_name: 'Teslim Alınacak', delivered_date: null }) },
  ])
  const client = createNavlungoClient(CONFIG, { fetch, tokenCache: new Map(), now: () => NOW })
  const t = await client.checkPost('MFYS29970')
  assert.equal(t.statusCode, 2)
  assert.equal(t.phase, 'delivered')
  assert.equal(t.statusName, 'Teslim Edildi')
  assert.equal(t.carrierTrackingCode, '3547896654321')
  assert.equal(t.trackingUrl, 'https://domestic-track.navlungo.com/check/MFYS29970')
  assert.equal(t.carrierName, 'Sürat Kargo')
  assert.equal(t.labelReady, true)
  assert.equal(t.deliveredTo, 'Ayşe Yılmaz')
  assert.deepEqual(t.logs[1], { statusCode: 16, text: 'Teslim Alındı', at: '2026-10-21 17:27:37' })
  const pending = await client.checkPost('MFYS29970')
  assert.equal(pending.phase, 'awaiting_pickup')
  assert.equal(pending.carrierTrackingCode, null)
  assert.equal(pending.labelReady, false)
})

test('etiket: base64 PDF çözülür; üretilmemiş etiket (500 + file_get_contents 404) → label_pending', async () => {
  const pdf = '%PDF-1.4 sahte etiket'
  const { fetch, calls } = fakeFetch([
    authOk(),
    { status: 201, json: { status: true, data: { barcode_type: 'pdf', barcode_url: 'https://barcode.example/MFYS29970.pdf', barcode_pdf: Buffer.from(pdf).toString('base64') } } },
    { status: 500, json: { status: false, message: 'file_get_contents(https://barcode.example/X.pdf): Failed to open stream: HTTP request failed! HTTP/1.1 404 Not Found' } },
  ])
  const client = createNavlungoClient(CONFIG, { fetch, tokenCache: new Map(), now: () => NOW })
  const label = await client.getLabel('MFYS29970')
  assert.deepEqual(calls[1].body, { post_number: 'MFYS29970', barcode_type: 'pdf' })
  assert.equal(label.pdf?.toString(), pdf)
  assert.equal(label.url, 'https://barcode.example/MFYS29970.pdf')
  await assert.rejects(client.getLabel('X'), (e: unknown) => e instanceof NavlungoError && e.kind === 'label_pending')
})

test('iptal: post_number gönderilir; reddedilirse Navlungo mesajı', async () => {
  const { fetch, calls } = fakeFetch([
    authOk(),
    { json: { status: true, message: 'Gönderi iptal edildi.' } },
    { status: 422, json: { status: false, message: 'İşlemdeki gönderi iptal edilemez.' } },
  ])
  const client = createNavlungoClient(CONFIG, { fetch, tokenCache: new Map(), now: () => NOW })
  assert.deepEqual(await client.cancelPost('MFYS29970'), { message: 'Gönderi iptal edildi.' })
  assert.deepEqual(calls[1].body, { post_number: 'MFYS29970' })
  await assert.rejects(client.cancelPost('MFYS29970'), /İşlemdeki gönderi iptal edilemez/)
})

test('ağ hatası ve JSON olmayan yanıt ayrı türde hata verir', async () => {
  const net = createNavlungoClient(CONFIG, {
    fetch: async () => {
      throw new TypeError('fetch failed')
    },
    tokenCache: new Map(),
  })
  await assert.rejects(net.checkPost('X'), (e: unknown) => e instanceof NavlungoError && e.kind === 'network')
  const { fetch } = fakeFetch([authOk(), { status: 502, text: '<html>Bad Gateway</html>' }])
  const html = createNavlungoClient(CONFIG, { fetch, tokenCache: new Map(), now: () => NOW })
  await assert.rejects(html.checkPost('X'), (e: unknown) => e instanceof NavlungoError && e.kind === 'http' && e.status === 502)
})

test('telefon biçimi', () => {
  assert.equal(normalizeNavlungoPhone('05321234567'), '+90 532 123 45 67')
  assert.equal(normalizeNavlungoPhone('+90 (532) 123-45-67'), '+90 532 123 45 67')
  assert.equal(normalizeNavlungoPhone('5321234567'), '+90 532 123 45 67')
  assert.equal(normalizeNavlungoPhone('123'), '123')
})

// ── Takip güncellemesi (zamanlayıcının kararı) ────────────────────────────────────────────

const tracking = (over: Partial<NavlungoTracking> = {}): NavlungoTracking => ({
  postNumber: 'MFYS29970',
  referenceId: 'VT-1',
  trackingUrl: 'https://domestic-track.navlungo.com/check/MFYS29970',
  carrierTrackingCode: null,
  carrierTrackingUrl: null,
  carrierName: 'Sürat Kargo',
  statusCode: 1,
  statusName: 'Teslim Alınacak',
  phase: 'awaiting_pickup',
  labelReady: false,
  deliveredAt: null,
  deliveredTo: null,
  logs: [],
  ...over,
})
const shipped = { status: 'SHIPPED', trackingNumber: 'MFYS29970', trackingUrl: 'https://domestic-track.navlungo.com/check/MFYS29970', shippingCarrier: 'navlungo', navlungoStatusCode: 1 }
const match = (name: string) => (/sürat/i.test(name) ? 'surat' : null)

test('takip: teslimde yalnızca "Kargoda" sipariş Teslim Edildi olur', () => {
  const t = tracking({ statusCode: 2, statusName: 'Teslim Edildi', phase: 'delivered' })
  const p = planTrackingUpdate(shipped, t, match)
  assert.equal(p.deliver, true)
  assert.equal(p.alert, null)
  assert.equal(p.data.navlungoStatusCode, 2)
  assert.equal(p.events.some((e) => e.visibleToCustomer), false) // teslim olayını order-service yazar
  assert.equal(planTrackingUpdate({ ...shipped, status: 'DELIVERED' }, t, match).deliver, false)
  assert.equal(planTrackingUpdate({ ...shipped, status: 'RETURNED' }, t, match).deliver, false)
})

test('takip: taşıyıcı takip numarası ve firma güncellenir, yolda durumu müşteriye görünür', () => {
  const p = planTrackingUpdate(shipped, tracking({ statusCode: 16, statusName: 'Teslim Alındı', phase: 'picked_up', carrierTrackingCode: '3547896654321' }), match)
  assert.equal(p.deliver, false)
  assert.equal(p.data.trackingNumber, '3547896654321')
  assert.equal(p.data.shippingCarrier, 'surat')
  assert.equal(p.data.trackingUrl, undefined) // değişmedi
  assert.deepEqual(p.events.find((e) => e.visibleToCustomer), { message: 'Kargo durumu: Teslim Alındı', visibleToCustomer: true })
  assert.equal(p.events.find((e) => !e.visibleToCustomer)?.message, 'Taşıyıcı takip numarası: 3547896654321 (Sürat Kargo)')
})

test('takip: durum değişmediyse olay yazılmaz; iade/iptal yöneticiye uyarı, sipariş değişmez', () => {
  const same = planTrackingUpdate({ ...shipped, shippingCarrier: 'surat' }, tracking(), match)
  assert.equal(same.statusChanged, false)
  assert.deepEqual(same.events, [])
  for (const [code, phase] of [[7, 'returning'], [10, 'cancelled'], [19, 'claim']] as const) {
    const p = planTrackingUpdate(shipped, tracking({ statusCode: code, statusName: 'x', phase }), match)
    assert.equal(p.deliver, false)
    assert.match(p.alert ?? '', /otomatik değiştirilmedi/)
    assert.equal(p.events[0].visibleToCustomer, false)
  }
})

test('takip linki: Navlungo linki firma sayfasından önce gelir', () => {
  assert.equal(
    orderTrackingUrl({ trackingUrl: 'https://domestic-track.navlungo.com/check/MFYS29970', shippingCarrier: 'surat', trackingNumber: '123' }),
    'https://domestic-track.navlungo.com/check/MFYS29970'
  )
  assert.equal(orderTrackingUrl({ trackingUrl: null, shippingCarrier: 'surat', trackingNumber: '123' }), 'https://www.suratkargo.com.tr/KargoTakip/?kargotakipno=123')
  assert.equal(orderTrackingUrl({ shippingCarrier: 'surat', trackingNumber: null }), null)
})
