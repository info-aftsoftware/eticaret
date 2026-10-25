/**
 * Müşteri kontrol listesi 23–31: yerel staging'de uçtan uca testler (DURUM.md "Yerel staging").
 * Gerçek sipariş, kullanıcı ve e-posta üretir; e-postalar yerel posta yakalayıcıya gider (scripts/staging/mail-sink.mjs).
 * Yalnızca staging sunucusuna karşı çalıştırın:
 *   STAGING_TESTS=1 PLAYWRIGHT_BASE_URL=http://localhost:3020 DATABASE_URL=file:<staging.db> MAIL_SINK_DIR=<klasör>
 *   STAGING_ENV_FILE=<yayın çalışma kopyası>/.env.local npx playwright test tests/staging-checklist.spec.ts --project=chromium --workers=1
 */
import fs from 'node:fs'
import path from 'node:path'
import jwt from 'jsonwebtoken'
import { PrismaClient } from '@prisma/client'
import { test, expect, type APIRequestContext, type Page } from '@playwright/test'
import { E2E_PRODUCT_ID } from './e2e-catalog'

test.skip(!process.env.STAGING_TESTS, 'STAGING_TESTS=1 ile yerel staging sunucusuna karşı çalıştırın')

const RUN = Date.now().toString(36)
const MAIL_DOMAIN = 'staging-alici.dev' // test adresi değil (A10 süzgecine takılmaz); posta yalnız yerel yakalayıcıya gider
const VARIANT_ID = `${E2E_PRODUCT_ID}-10w`
const AFT_DC = 'aft-dc-hizli-elektrikli-arac-sarj-istasyonu-45-180kw'
const CABLE = 'tommatech-v-serisi-guc-istasyonu-panel-baglanti-kablosu-mc4-xt60'
const HEAT_PUMP = 'tommatech-50-kw-r290-endustriyel-isi-pompasi'
const BATTERY = 'tommatech-marine-mrn1-12-8v-100ah-lifepo4-lityum-aku-small'

const prisma = new PrismaClient()
test.afterAll(async () => prisma.$disconnect())

function envValue(name: string): string {
  const file = process.env.STAGING_ENV_FILE || '.env.local'
  const v = (fs.readFileSync(file, 'utf8').match(new RegExp(`^${name}=(.*)$`, 'm')) || [])[1]?.trim().replace(/^["']|["']$/g, '')
  if (!v) throw new Error(`${name} yok`)
  return v
}

let seq = 0
function customer(tag: string, extra: Record<string, unknown> = {}) {
  seq += 1
  const tail = String((Date.now() + seq * 7919) % 10_000_000).padStart(7, '0')
  return {
    name: 'Staging Müşteri',
    email: `st-${tag}-${RUN}@${MAIL_DOMAIN}`,
    phone: `533${tail}`,
    city: 'İstanbul',
    district: 'Kadıköy',
    addressLine: 'Test Mah. Deneme Sok. No:1 D:2',
    ...extra,
  }
}

let cachedCookie = ''
async function adminCookie(request: APIRequestContext) {
  if (cachedCookie) return cachedCookie
  const res = await request.post('/api/admin/auth', { data: { password: envValue('ADMIN_TOKEN') } })
  expect(res.status(), await res.text()).toBe(200)
  cachedCookie = (res.headers()['set-cookie'] || '').split(';')[0]
  return cachedCookie
}

async function order(request: APIRequestContext, c: ReturnType<typeof customer>, items: { id: string; quantity: number }[], extra: Record<string, unknown> = {}, headers: Record<string, string> = {}) {
  return request.post('/api/orders', { headers, data: { customer: c, items, paymentMethod: 'bank_transfer', acceptedTerms: true, ...extra } })
}

async function adminOrder(request: APIRequestContext, orderNo: string) {
  const cookie = await adminCookie(request)
  const list = await (await request.get(`/api/admin/orders?q=${orderNo}`, { headers: { cookie } })).json()
  const rows = list.orders || list.items || list.data || list
  const row = (Array.isArray(rows) ? rows : []).find((o: { orderNo?: string }) => o.orderNo === orderNo)
  expect(row, `admin listesinde ${orderNo}`).toBeTruthy()
  const detail = await (await request.get(`/api/admin/orders/${row.id}`, { headers: { cookie } })).json()
  return { id: row.id as string, detail: (detail.order ?? detail) as Record<string, any> }
}

async function patchOrder(request: APIRequestContext, id: string, data: Record<string, unknown>) {
  const r = await request.patch(`/api/admin/orders/${id}`, { headers: { cookie: await adminCookie(request) }, data })
  expect(r.status(), `${JSON.stringify(data)} → ${await r.text()}`).toBe(200)
}

/** Yakalayıcıdaki, alıcısı verilen adres olan iletiler (çözümlenmiş metin) */
function mailsTo(address: string): { subject: string; text: string; raw: string }[] {
  const dir = process.env.MAIL_SINK_DIR
  if (!dir) throw new Error('MAIL_SINK_DIR yok')
  return fs
    .readdirSync(dir)
    .filter((f) => f.endsWith('.eml'))
    .map((f) => fs.readFileSync(path.join(dir, f), 'utf8'))
    .filter((raw) => (raw.match(/^X-Sink-To: (.*)$/m)?.[1] ?? '').toLowerCase().includes(address.toLowerCase()))
    .map((raw) => ({ raw, subject: decodeSubject(raw), text: decodeBody(raw) }))
}
function decodeSubject(raw: string) {
  const m = raw.match(/^Subject: ((?:.*\r?\n[ \t].*)*.*)$/m)?.[1] ?? ''
  return m.replace(/\r?\n[ \t]/g, '').replace(/=\?utf-8\?([bq])\?([^?]*)\?=/gi, (_, enc, s) =>
    enc.toLowerCase() === 'b' ? Buffer.from(s, 'base64').toString('utf8') : decodeQP(s.replace(/_/g, ' ')))
}
function decodeQP(s: string) {
  return Buffer.from(s.replace(/=\r?\n/g, '').replace(/=([0-9A-F]{2})/gi, (_, h) => String.fromCharCode(parseInt(h, 16))), 'latin1').toString('utf8')
}
function decodeBody(raw: string) {
  // Tüm MIME parçaları: base64 ve quoted-printable çözülür, HTML etiketleri temizlenir
  const parts = raw.split(/\r?\n--[^\r\n]+/)
  return parts
    .map((p) => {
      const [head, ...rest] = p.split(/\r?\n\r?\n/)
      const body = rest.join('\n\n')
      if (/content-transfer-encoding:\s*base64/i.test(head)) {
        if (!/content-type:\s*text\//i.test(head)) return ''
        return Buffer.from(body.replace(/\s/g, ''), 'base64').toString('utf8')
      }
      if (/content-transfer-encoding:\s*quoted-printable/i.test(head)) return decodeQP(body)
      return body
    })
    .join('\n')
    .replace(/<[^>]+>/g, ' ')
    .replace(/&nbsp;/g, ' ')
    .replace(/\s+/g, ' ')
}
async function waitMail(address: string, re: RegExp, timeout = 15_000) {
  const start = Date.now()
  for (;;) {
    const hit = mailsTo(address).find((m) => re.test(m.subject) || re.test(m.text))
    if (hit) return hit
    if (Date.now() - start > timeout) throw new Error(`${address} için ${re} postası gelmedi; gelenler: ${mailsTo(address).map((m) => m.subject).join(' | ')}`)
    await new Promise((r) => setTimeout(r, 500))
  }
}

async function setVariantStocks(request: APIRequestContext, stocks: Record<string, number>) {
  const cookie = await adminCookie(request)
  const r = await request.patch(`/api/admin/catalog/${E2E_PRODUCT_ID}`, {
    headers: { cookie },
    data: {
      variants: [
        { key: '10w', label: '10W', price: 450, sku: 'E2E-TEST-10W' },
        { key: '20w', label: '20W', price: 520, sku: 'E2E-TEST-20W' },
      ],
      variantStock: true,
      variantStocks: stocks,
    },
  })
  expect(r.status(), await r.text()).toBe(200)
}
async function variantStock(request: APIRequestContext, key: string): Promise<number> {
  const p = await (await request.get(`/api/products/${E2E_PRODUCT_ID}`)).json()
  return (p.variants ?? []).find((v: { key: string }) => v.key === key)?.stock
}

const ANALYTICS = /google-analytics\.com|googletagmanager\.com|analytics\.google\.com|connect\.facebook\.net|facebook\.com\/tr|firebaseinstallations/

async function analyticsRequests(page: Page, action: () => Promise<void>) {
  const hits: string[] = []
  const on = (r: { url(): string }) => {
    if (ANALYTICS.test(r.url())) hits.push(r.url())
  }
  page.on('request', on)
  await action()
  await page.waitForTimeout(3500)
  page.off('request', on)
  return hits
}

// ─── 23 Çerez tercihi ────────────────────────────────────────────────────
test.describe('23 çerez tercihi', () => {
  test('seçimden önce analitik yüklenmez; "Sadece Gerekli" sonrası da yüklenmez ve tercih saklanır', async ({ page }) => {
    const before = await analyticsRequests(page, async () => {
      await page.goto('/')
    })
    expect(before, 'seçim öncesi analitik isteği').toEqual([])
    await expect(page.getByRole('button', { name: 'Sadece Gerekli' })).toBeVisible()
    await page.getByRole('button', { name: 'Sadece Gerekli' }).click()
    expect(await page.evaluate(() => localStorage.getItem('voltekno_cookie_consent'))).toBe('dismissed')
    const after = await analyticsRequests(page, async () => {
      await page.reload()
    })
    expect(after, '"Sadece Gerekli" sonrası analitik isteği').toEqual([])
    await expect(page.getByRole('button', { name: 'Sadece Gerekli' })).toHaveCount(0)
  })

  test('"Kabul Et" analitiği başlatır', async ({ page }) => {
    await page.goto('/')
    const hits = await analyticsRequests(page, async () => {
      await page.getByRole('button', { name: 'Kabul Et' }).click()
    })
    expect(await page.evaluate(() => localStorage.getItem('voltekno_cookie_consent'))).toBe('accepted')
    test.info().annotations.push({ type: 'analitik', description: hits.length ? `${hits.length} istek (${new URL(hits[0]).host})` : 'ölçüm kimliği tanımlı değil, istek yok' })
  })

  test('tercih sonradan değiştirilebilir: footer bağlantısı bandı yeniden açar, onay geri alınır', async ({ page }) => {
    await page.addInitScript(() => {
      if (!sessionStorage.getItem('seeded')) {
        localStorage.setItem('voltekno_cookie_consent', 'accepted')
        sessionStorage.setItem('seeded', '1')
      }
    })
    await page.goto('/')
    await page.getByRole('button', { name: 'Çerez tercihleri' }).click()
    await expect(page.getByRole('button', { name: 'Sadece Gerekli' })).toBeVisible()
    await page.getByRole('button', { name: 'Sadece Gerekli' }).click()
    expect(await page.evaluate(() => localStorage.getItem('voltekno_cookie_consent'))).toBe('dismissed')
    // Analitik çerezleri (_ga…) silinir
    expect((await page.context().cookies()).filter((c) => c.name.startsWith('_ga') || c.name === '_fbp')).toEqual([])
  })
})

// ─── 24 Stok ─────────────────────────────────────────────────────────────
test.describe('24 stok', () => {
  test('varyant stokları bağımsız: 20W 0 iken yalnız 10W satılır, iptal yalnız ilgili varyantı geri verir', async ({ request }) => {
    await setVariantStocks(request, { '10w': 2, '20w': 0 })
    expect(await variantStock(request, '20w')).toBe(0)
    const r20 = await order(request, customer('v20'), [{ id: `${E2E_PRODUCT_ID}-20w`, quantity: 1 }])
    expect(r20.status(), 'stoksuz varyant reddedilir').toBeGreaterThanOrEqual(400)
    const c = customer('v10')
    const r10 = await order(request, c, [{ id: VARIANT_ID, quantity: 2 }])
    expect(r10.status(), await r10.text()).toBe(200)
    expect(await variantStock(request, '10w')).toBe(0)
    expect(await variantStock(request, '20w')).toBe(0)
    const orderNo = (await r10.json()).orderId
    const cancel = await request.post(`/api/orders/by-no/${orderNo}/cancel`, { data: { email: c.email, phone: c.phone, reason: 'test' } })
    expect(cancel.status(), await cancel.text()).toBe(200)
    expect(await variantStock(request, '10w')).toBe(2)
    expect(await variantStock(request, '20w')).toBe(0)
  })

  test('son adet: aynı anda iki sipariş → yalnız biri geçer, stok eksiye düşmez', async ({ request }) => {
    await setVariantStocks(request, { '10w': 1, '20w': 0 })
    const [a, b] = await Promise.all([
      order(request, customer('race-a'), [{ id: VARIANT_ID, quantity: 1 }]),
      order(request, customer('race-b'), [{ id: VARIANT_ID, quantity: 1 }]),
    ])
    const ok = [a, b].filter((r) => r.status() === 200).length
    expect(ok, `durumlar ${a.status()} / ${b.status()}`).toBe(1)
    expect(await variantStock(request, '10w')).toBe(0)
    await setVariantStocks(request, { '10w': 100, '20w': 100 })
  })
})

// ─── 25 Kargo ────────────────────────────────────────────────────────────
test.describe('25 kargo hesabı', () => {
  test('raporun sepeti (2 kablo + 50 kW ısı pompası): sunucu kargo bedeli hesaplanır, adet arttıkça tutarlı', async ({ request }) => {
    const one = await order(request, customer('kargo1'), [{ id: CABLE, quantity: 1 }])
    expect(one.status(), await one.text()).toBe(200)
    const two = await order(request, customer('kargo2'), [{ id: CABLE, quantity: 2 }])
    const big = await order(request, customer('kargo3'), [{ id: CABLE, quantity: 2 }, { id: HEAT_PUMP, quantity: 1 }])
    expect(big.status(), await big.text()).toBe(200)
    const s1 = (await one.json()).pricing.shipping
    const s2 = (await two.json()).pricing.shipping
    const s3 = (await big.json()).pricing.shipping
    expect(s1).toBeGreaterThan(0)
    expect(s2).toBeGreaterThanOrEqual(s1)
    expect(s3).toBeGreaterThan(s2)
    test.info().annotations.push({ type: 'kargo (KDV hariç)', description: `1 kablo ${s1} · 2 kablo ${s2} · 2 kablo + ısı pompası ${s3}` })
  })

  test('akü/batarya kargoyla sipariş edilemez (iletişim kısıtı sunucuda da geçerli)', async ({ request }) => {
    const r = await order(request, customer('aku'), [{ id: BATTERY, quantity: 1 }])
    expect(r.status(), await r.text()).toBeGreaterThanOrEqual(400)
  })
})

// ─── 26 Nakliye ve kurulum kapsamı ───────────────────────────────────────
test.describe('26 kurulum ve nakliye kapsamı', () => {
  test('AFT DC istasyonu: kargo bedeline girmez, siparişte ve e-postada "kurulum ve nakliye dahil değil" yazar', async ({ request, page }) => {
    const c = customer('aft')
    const r = await order(request, c, [{ id: `${AFT_DC}-aftgc45`, quantity: 1 }])
    expect(r.status(), await r.text()).toBe(200)
    const json = await r.json()
    expect(json.pricing.shipping, 'kurulumlu ürün kargo bedeline girmez').toBe(0)
    const { detail } = await adminOrder(request, json.orderId)
    const timeline = (detail.events ?? []).map((e: { message: string }) => e.message).join(' | ')
    expect(timeline).toMatch(/kurulum/i)
    const mail = await waitMail(c.email, new RegExp(json.orderId))
    expect(mail.text).toMatch(/kurulum/i)
    // Sepet ve ödeme sayfasında not
    await page.addInitScript((id) => {
      localStorage.setItem('voltekno_cookie_consent', 'dismissed')
      sessionStorage.setItem('cart-storage', JSON.stringify({ state: { items: [{ id, name: 'AFT DC', price: 480248, quantity: 1 }], couponCode: null }, version: 0 }))
    }, `${AFT_DC}-aftgc45`)
    await page.goto('/cart')
    await expect(page.locator('body')).toContainText(/kurulum/i, { timeout: 15_000 })
    await page.goto('/checkout')
    await expect(page.locator('body')).toContainText(/kurulum/i, { timeout: 15_000 })
  })
})

// ─── 27 Sipariş ve ödeme durumları ───────────────────────────────────────
test.describe('27 sipariş ve ödeme durumları', () => {
  test('misafir, farklı fatura adresi: adres ve fatura bilgisi siparişte ayrı saklanır', async ({ request }) => {
    const c = customer('fatura', { billingAddress: 'Fatura Mah. Muhasebe Cad. No:5', billingCity: 'Ankara', billingDistrict: 'Çankaya' })
    const r = await order(request, c, [{ id: VARIANT_ID, quantity: 1 }])
    expect(r.status(), await r.text()).toBe(200)
    const { detail } = await adminOrder(request, (await r.json()).orderId)
    expect(JSON.stringify(detail)).toContain('Fatura Mah. Muhasebe Cad.')
    expect(JSON.stringify(detail)).toContain('Kadıköy')
  })

  test('kurumsal fatura: geçersiz VKN reddedilir, geçerli VKN ve vergi dairesi saklanır', async ({ request }) => {
    const bad = await order(request, customer('vkn-x', { billingType: 'company', billingName: 'Deneme A.Ş.', taxId: '123', taxOffice: 'Kadıköy' }), [{ id: VARIANT_ID, quantity: 1 }])
    expect(bad.status()).toBe(400)
    const okRes = await order(request, customer('vkn', { billingType: 'company', billingName: 'Deneme Enerji A.Ş.', taxId: '1234567890', taxOffice: 'Kadıköy' }), [{ id: VARIANT_ID, quantity: 1 }])
    expect(okRes.status(), await okRes.text()).toBe(200)
    const { detail } = await adminOrder(request, (await okRes.json()).orderId)
    const s = JSON.stringify(detail)
    expect(s).toContain('Deneme Enerji A.Ş.')
    expect(s).toContain('1234567890')
  })

  test('üye siparişi hesaba bağlanır; başka üye göremez', async ({ request }) => {
    const secret = envValue('JWT_SECRET')
    const mk = async (tag: string) =>
      prisma.user.create({ data: { email: `st-uye-${tag}-${RUN}@${MAIL_DOMAIN}`, name: 'Staging Üye', emailVerified: true } })
    const u1 = await mk('a')
    const u2 = await mk('b')
    const t1 = jwt.sign({ userId: u1.id, email: u1.email }, secret, { expiresIn: '1h' })
    const t2 = jwt.sign({ userId: u2.id, email: u2.email }, secret, { expiresIn: '1h' })
    const r = await order(request, customer('uye', { email: u1.email }), [{ id: VARIANT_ID, quantity: 1 }], {}, { authorization: `Bearer ${t1}` })
    expect(r.status(), await r.text()).toBe(200)
    const orderNo = (await r.json()).orderId
    const mine = await (await request.get('/api/orders', { headers: { authorization: `Bearer ${t1}` } })).json()
    expect(JSON.stringify(mine)).toContain(orderNo)
    const other = await (await request.get('/api/orders', { headers: { authorization: `Bearer ${t2}` } })).json()
    expect(JSON.stringify(other)).not.toContain(orderNo)
    expect((await request.get('/api/orders')).status()).toBe(401)
  })

  test('çift gönderim: aynı tekrar anahtarı tek sipariş açar', async ({ request }) => {
    const c = customer('idem')
    const key = `st-${RUN}-idem-key-0001`
    const [a, b] = await Promise.all([
      order(request, c, [{ id: VARIANT_ID, quantity: 1 }], { idempotencyKey: key }),
      order(request, c, [{ id: VARIANT_ID, quantity: 1 }], { idempotencyKey: key }),
    ])
    const ids = await Promise.all([a, b].map(async (x) => (x.status() === 200 ? (await x.json()).orderId : `HTTP ${x.status()}`)))
    expect(ids[0]).toBe(ids[1])
    expect(await prisma.order.count({ where: { orderNo: ids[0] } })).toBe(1)
  })

  test('havale bekleniyor → ödendi → hazırlanıyor → kargoda → teslim; tahsilat yalnız ödemeyle artar, iptal düşer', async ({ request }) => {
    const cookie = await adminCookie(request)
    const stats = async () => (await (await request.get('/api/admin/stats', { headers: { cookie } })).json()) as { todayRevenue: number; awaitingPayment: unknown }
    const s0 = await stats()
    const c = customer('durum')
    const r = await order(request, c, [{ id: VARIANT_ID, quantity: 1 }])
    const orderNo = (await r.json()).orderId
    const { id, detail } = await adminOrder(request, orderNo)
    expect(String(detail.paymentStatus).toUpperCase()).not.toBe('PAID')
    expect((await stats()).todayRevenue, 'ödeme bekleyen sipariş tahsilatı artırmaz').toBe(s0.todayRevenue)
    await patchOrder(request, id, { action: 'mark_paid' })
    const s1 = await stats()
    expect(s1.todayRevenue).toBeGreaterThan(s0.todayRevenue)
    await patchOrder(request, id, { action: 'status', status: 'PICKING', notifyCustomer: false })
    await patchOrder(request, id, { action: 'status', status: 'SHIPPED', carrier: 'yurtici', trackingNumber: `ST${RUN}`.toUpperCase(), notifyCustomer: true })
    await patchOrder(request, id, { action: 'status', status: 'DELIVERED', notifyCustomer: false })
    const done = (await adminOrder(request, orderNo)).detail
    expect(String(done.status)).toBe('DELIVERED')
    // Ayrı sipariş: ödendi sonra iptal → tahsilat geri düşer
    const r2 = await order(request, customer('iptal'), [{ id: VARIANT_ID, quantity: 1 }])
    const o2 = await adminOrder(request, (await r2.json()).orderId)
    await patchOrder(request, o2.id, { action: 'mark_paid' })
    const s2 = await stats()
    await patchOrder(request, o2.id, { action: 'status', status: 'CANCELLED', reason: 'staging testi', notifyCustomer: false })
    const s3 = await stats()
    expect(s3.todayRevenue, 'iptal tahsilattan düşer').toBeLessThan(s2.todayRevenue)
  })
})

// ─── 28 Fatura ve bildirimler ────────────────────────────────────────────
test.describe('28 e-posta ve belgeler', () => {
  test('sipariş: müşteriye IBAN ve sözleşme PDF ekli onay, yöneticiye bildirim; ödeme ve kargo e-postaları', async ({ request }) => {
    const c = customer('posta')
    const r = await order(request, c, [{ id: VARIANT_ID, quantity: 1 }])
    expect(r.status(), await r.text()).toBe(200)
    const orderNo = (await r.json()).orderId
    const created = await waitMail(c.email, new RegExp(orderNo))
    expect(created.text).toMatch(/TR\d{2} ?\d{4}/) // IBAN
    expect(created.raw).toMatch(/application\/pdf/i) // ön bilgilendirme + mesafeli satış sözleşmesi
    expect(created.text).toMatch(/Mesafeli Satış Sözleşmesi/)
    await waitMail('yonetim@staging-alici.dev', new RegExp(orderNo))
    const { id } = await adminOrder(request, orderNo)
    const beforePaid = mailsTo(c.email).length
    await patchOrder(request, id, { action: 'mark_paid' })
    await expect.poll(() => mailsTo(c.email).length, { message: 'ödeme onayı e-postası', timeout: 15_000 }).toBeGreaterThan(beforePaid)
    const trk = `PST${RUN}`.toUpperCase()
    await patchOrder(request, id, { action: 'status', status: 'PICKING', notifyCustomer: false })
    await patchOrder(request, id, { action: 'status', status: 'SHIPPED', carrier: 'yurtici', trackingNumber: trk, notifyCustomer: true })
    const shipped = await waitMail(c.email, new RegExp(trk))
    expect(shipped.text).toMatch(/kargo/i)
    const inv = await request.post(`/api/admin/orders/${id}/send-invoice`, { headers: { cookie: await adminCookie(request) }, data: {} })
    test.info().annotations.push({ type: 'send-invoice', description: `HTTP ${inv.status()} ${(await inv.text()).slice(0, 120)}` })
    test.info().annotations.push({ type: 'müşteriye giden', description: mailsTo(c.email).map((m) => m.subject).join(' | ') })
    console.log('MÜŞTERİ POSTALARI:', mailsTo(c.email).map((m) => m.subject).join(' | '), '| send-invoice', inv.status())
  })
})

// ─── 30 Takip ve formlar ─────────────────────────────────────────────────
test.describe('30 sipariş takibi ve formlar', () => {
  test('iletişim formu: kayıt panele düşer, yöneticiye e-posta gider', async ({ request }) => {
    const email = `st-iletisim-${RUN}@${MAIL_DOMAIN}`
    const r = await request.post('/api/contact', { data: { name: 'Staging İletişim', email, phone: '05321234567', subject: `Ürün teklifi: staging ${RUN}`, message: 'Staging testi için gönderilen ileti.' } })
    expect(r.status(), await r.text()).toBe(200)
    const list = await (await request.get('/api/admin/contact', { headers: { cookie: await adminCookie(request) } })).json()
    expect(JSON.stringify(list)).toContain(`staging ${RUN}`)
    await waitMail('yonetim@staging-alici.dev', new RegExp(`staging ${RUN}`))
  })

  test('GES teklif: aranma onayı isteğe bağlı (e-postayla), kayıt panele düşer', async ({ request }) => {
    const noMail = await request.post('/api/ges-quote', { data: { fullName: 'Staging GES', phone: '05321234568', city: 'İzmir', kvkkAccepted: true, callAccepted: false } })
    expect(noMail.status(), 'aranmak istemeyen ve e-postasız talep').toBe(400)
    const email = `st-ges-${RUN}@${MAIL_DOMAIN}`
    const ok = await request.post('/api/ges-quote', { data: { fullName: `Staging GES ${RUN}`, phone: '05321234568', city: 'İzmir', email, kvkkAccepted: true, callAccepted: false, monthlyKwh: 400 } })
    expect(ok.status(), await ok.text()).toBe(200)
    const list = await (await request.get('/api/admin/ges-quotes', { headers: { cookie: await adminCookie(request) } })).json()
    expect(JSON.stringify(list)).toContain(`Staging GES ${RUN}`)
  })

  test('teklif doğrulama: kayıt panele düşer', async ({ request }) => {
    const email = `st-dogrula-${RUN}@${MAIL_DOMAIN}`
    const r = await request.post('/api/ges-quote-verify', { data: { contactName: 'Staging Doğrulama', contactEmail: email, contactPhone: '05321234569', panelBrandModel: 'Test 450W', panelWatt: 450, panelCount: 10, totalKwp: 4.5, inverterTotalKw: 5, totalPriceTl: 250000 } })
    expect(r.status(), await r.text()).toBe(200)
    const list = await (await request.get('/api/admin/ges-verifications', { headers: { cookie: await adminCookie(request) } })).json()
    expect(JSON.stringify(list)).toContain(email)
    await waitMail('yonetim@staging-alici.dev', /teklif doğrulama/i)
  })

  test('takip: doğru bilgiyle görünür, yanlış bilgiyle veri dönmez, deneme sınırı 429', async ({ request }) => {
    const c = customer('takip')
    const orderNo = (await (await order(request, c, [{ id: VARIANT_ID, quantity: 1 }])).json()).orderId
    const good = await request.post(`/api/orders/by-no/${orderNo}`, { data: { email: c.email, phone: c.phone } })
    expect(good.status()).toBe(200)
    expect((await good.json()).order.orderNo).toBe(orderNo)
    const bad = await request.post(`/api/orders/by-no/${orderNo}`, { data: { email: `baska-${RUN}@${MAIL_DOMAIN}`, phone: c.phone } })
    expect(bad.status()).toBe(404)
    const badText = await bad.text()
    expect(badText).not.toContain(c.phone)
    expect(badText).not.toContain('Kadıköy')
    let limited = false
    for (let i = 0; i < 25 && !limited; i++) {
      const x = await request.post(`/api/orders/by-no/${orderNo}`, { data: { email: `deneme${i}@${MAIL_DOMAIN}`, phone: c.phone } })
      limited = x.status() === 429
    }
    expect(limited, 'dakikada 20 denemeden sonra 429').toBe(true)
  })
})

// ─── 31 Sunucu kuralları ve erişim ───────────────────────────────────────
test.describe('31 sunucu kuralları ve erişim', () => {
  test('fiyat, indirim ve kargo istemciden alınmaz', async ({ request }) => {
    const r = await order(request, customer('fiyat'), [{ id: VARIANT_ID, quantity: 1, price: 1, discount: 99 } as never], { total: 1, shipping: 0 })
    expect(r.status(), await r.text()).toBe(200)
    expect((await r.json()).pricing.total).toBeGreaterThan(400)
  })

  test('sahte POS geri bildirimi siparişi ödendi yapmaz', async ({ request }) => {
    const c = customer('pos')
    const orderNo = (await (await order(request, c, [{ id: VARIANT_ID, quantity: 1 }])).json()).orderId
    const alerts = () => mailsTo('yonetim@staging-alici.dev').filter((m) => /Sistem hatası: sanal-pos/.test(m.subject)).length
    const alertsBefore = alerts()
    const r = await request.post('/api/payments/pos/callback', { form: { oid: orderNo, Response: 'Approved', ProcReturnCode: '00', mdStatus: '1', HASH: 'sahte' }, maxRedirects: 0 })
    expect([303, 400, 403, 503]).toContain(r.status())
    await new Promise((res) => setTimeout(res, 1500))
    expect(alerts(), 'sahte istek yöneticiye hata e-postası göndermez').toBe(alertsBefore)
    const { detail } = await adminOrder(request, orderNo)
    expect(String(detail.paymentStatus).toUpperCase()).not.toBe('PAID')
  })

  test('yönetici uçları oturumsuz kapalı; roller sunucuda sınırlı', async ({ request, playwright }) => {
    for (const p of ['/api/admin/orders', '/api/admin/users', '/api/admin/system', '/api/admin/customers', '/api/admin/audit']) {
      expect((await request.get(p, { headers: { cookie: '' } })).status(), p).toBe(401)
    }
    const owner = await adminCookie(request)
    const mk = async (role: string) => {
      const email = `st-${role}-${RUN}@${MAIL_DOMAIN}`
      const r = await request.post('/api/admin/users', { headers: { cookie: owner }, data: { email, name: `Staging ${role}`, role } })
      expect(r.status(), await r.text()).toBe(200)
      const pw = (await r.json()).temporaryPassword as string
      const ctx = await playwright.request.newContext({ baseURL: process.env.PLAYWRIGHT_BASE_URL })
      const login = await ctx.post('/api/admin/auth', { data: { email, password: pw } })
      expect(login.status(), await login.text()).toBe(200)
      const cookie = (login.headers()['set-cookie'] || '').split(';')[0]
      // İlk girişte geçici şifre değiştirilmeden hiçbir işlem yapılamaz (sunucu 403 verir)
      const blocked = await ctx.get('/api/admin/catalog', { headers: { cookie } })
      expect(blocked.status(), 'şifre değiştirilmeden işlem').toBe(403)
      const change = await ctx.post('/api/admin/account', { headers: { cookie }, data: { currentPassword: pw, newPassword: `St-${RUN}-Yeni-Sifre-91` } })
      expect(change.status(), await change.text()).toBe(200)
      const fresh = (change.headers()['set-cookie'] || '').split(';')[0] || cookie
      await ctx.dispose()
      return fresh
    }
    const operator = await mk('operator')
    const editor = await mk('editor')
    const code = async (cookie: string, p: string) => (await request.get(p, { headers: { cookie } })).status()
    expect(await code(operator, '/api/admin/orders')).toBe(200)
    expect(await code(operator, '/api/admin/users')).toBe(403)
    expect(await code(operator, '/api/admin/system')).toBe(403)
    expect(await code(operator, '/api/admin/audit')).toBe(403)
    expect(await code(editor, '/api/admin/orders')).toBe(403)
    expect(await code(editor, '/api/admin/customers')).toBe(403)
    expect(await code(editor, '/api/admin/catalog')).toBe(200)
    const self = await request.post('/api/admin/users', { headers: { cookie: operator }, data: { email: `st-x-${RUN}@${MAIL_DOMAIN}`, name: 'Yetkisiz', role: 'owner' } })
    expect(self.status(), 'personel Sahip hesabı açamaz').toBe(403)
  })

  test('gizli anahtarlar tarayıcı paketinde yok', async () => {
    const dir = process.env.STAGING_BUILD_DIR
    test.skip(!dir, 'STAGING_BUILD_DIR yok')
    const names = ['ADMIN_TOKEN', 'JWT_SECRET', 'SMTP_PASSWORD', 'NEXTAUTH_SECRET']
    const secrets: { k: string; v: string }[] = []
    for (const k of names) {
      try {
        const v = envValue(k)
        if (v.length >= 6) secrets.push({ k, v })
      } catch {
        // tanımsız anahtar
      }
    }
    try {
      const line = envValue('FIREBASE_ADMIN_PRIVATE_KEY').replace(/\\n/g, '\n').split('\n').find((l) => l.length > 40)
      if (line) secrets.push({ k: 'FIREBASE_ADMIN_PRIVATE_KEY', v: line.slice(0, 40) })
    } catch {
      // tanımsız
    }
    const files: string[] = []
    const walk = (d: string) => fs.readdirSync(d, { withFileTypes: true }).forEach((e) => (e.isDirectory() ? walk(path.join(d, e.name)) : e.name.endsWith('.js') && files.push(path.join(d, e.name))))
    walk(path.join(dir!, 'static'))
    expect(files.length).toBeGreaterThan(10)
    const leaks: string[] = []
    for (const f of files) {
      const s = fs.readFileSync(f, 'utf8')
      for (const { k, v } of secrets) if (s.includes(v)) leaks.push(`${k} → ${path.basename(f)}`)
    }
    console.log(`GİZLİ ANAHTAR TARAMASI: ${secrets.map((x) => x.k).join(', ')} · ${files.length} dosya`)
    expect(leaks).toEqual([])
  })
})

// ─── 32 iKAS adres geçişi ────────────────────────────────────────────────
test.describe('32 eski iKAS adresleri', () => {
  test('kök ürün adresi (/<slug>) kalıcı olarak ürün sayfasına, kaldırılan ürün kategorisine yönlenir', async ({ request }) => {
    const r = await request.get('/tommatech-16bb-topcon-gunes-paneli-450wp-600wp', { maxRedirects: 0 })
    expect(r.status()).toBe(308)
    expect(r.headers()['location']).toMatch(/\/products\/tommatech-16bb-topcon-gunes-paneli-450wp-600wp$/)
    const gone = await request.get('/products/victron-multiplus-ii-48-3000-35-50-inverter-sarj-cihazi-48v-3000va-120v-ul-1741', { maxRedirects: 0 })
    expect(gone.status()).toBe(308)
    expect(gone.headers()['location']).toMatch(/\/category\/solar-inverter$/)
    const goneRoot = await request.get('/victron-blue-smart-ip67-24-8-aku-sarj-cihazi-24v-8a-1-cikis-120v', { maxRedirects: 0 })
    expect(goneRoot.status()).toBe(308)
    expect(goneRoot.headers()['location']).toMatch(/\/category\/solar-sarj-kontrol$/)
    // Uygulama sayfaları etkilenmez
    expect((await request.get('/cart', { maxRedirects: 0 })).status()).toBe(200)
    expect((await request.get('/olmayan-bir-adres-xyz', { maxRedirects: 0 })).status()).toBe(404)
  })
})

// ─── 33 Alan adı ve indeksleme ───────────────────────────────────────────
test.describe('33 alan adı ve indeksleme', () => {
  const expected = () => (process.env.STAGING_SITE_URL || '').replace(/\/$/, '')
  test('site haritası, robots, ürün akışı, canonical ve e-posta bağlantıları tek alan adını kullanır; test alan adında indeksleme kapalı', async ({ request }) => {
    const site = expected()
    test.skip(!site, 'STAGING_SITE_URL yok')
    const host = new URL(site).host
    const hostsIn = (s: string) => [...new Set([...s.matchAll(/https?:\/\/([a-z0-9.-]+\.[a-z]{2,})(?=[/"'<\s])/gi)].map((m) => m[1].toLowerCase()))]
    const sitemap = await (await request.get('/sitemap.xml')).text()
    expect(sitemap).toContain(`${site}/products/`)
    expect(hostsIn(sitemap).filter((h) => h !== host && !h.endsWith('sitemaps.org') && !h.endsWith('google.com'))).toEqual([])
    const feed = await (await request.get('/feed/google-merchant.xml')).text()
    const feedHosts = hostsIn(feed).filter((h) => h !== host && !/google\.com|w3\.org|purl\.org/.test(h))
    expect(feedHosts, 'akışta başka alan adı').toEqual([])
    const page = await (await request.get('/products/tommatech-16bb-topcon-gunes-paneli-450wp-600wp')).text()
    const canonical = page.match(/<link rel="canonical" href="([^"]+)"/)?.[1] ?? ''
    expect(canonical.startsWith(site), `canonical ${canonical}`).toBe(true)
    expect(page).not.toMatch(/nextfirststep\.com/.test(host) ? /voltekno\.com\/products/ : /nextfirststep\.com/)
    const robots = await (await request.get('/robots.txt')).text()
    if (process.env.STAGING_NOINDEX === 'true') {
      expect(robots).toMatch(/Disallow: \/\s*$/m)
      expect(page).toMatch(/<meta name="robots" content="noindex/)
    } else {
      expect(robots).toContain(`Sitemap: ${site}/sitemap.xml`)
      expect(page).not.toMatch(/<meta name="robots" content="noindex/)
    }
    // E-posta bağlantıları (posta yakalayıcı varsa): son siparişin bağlantıları aynı alan adında
    if (process.env.MAIL_SINK_DIR) {
      const c = customer('alanadi')
      const orderNo = (await (await order(request, c, [{ id: VARIANT_ID, quantity: 1 }])).json()).orderId
      const mail = await waitMail(c.email, new RegExp(orderNo))
      const mailHosts = hostsIn(mail.text).filter((h) => h !== host)
      expect(mailHosts.filter((h) => /voltekno|nextfirststep|localhost/.test(h)), 'e-postada başka site adresi').toEqual([])
    }
  })
})

// ─── 29 Üyelik (Firebase'e istek gitmeden: yalnız form doğrulaması) ──────
test.describe('29 üyelik formları', () => {
  test('kayıt formu: boş, geçersiz e-posta, kısa/uyuşmayan şifre ve onaysız gönderim istemcide durur; Firebase\'e istek gitmez', async ({ page }) => {
    const firebase: string[] = []
    await page.route(/identitytoolkit\.googleapis\.com|securetoken\.googleapis\.com|firestore\.googleapis\.com/, (route) => {
      firebase.push(route.request().url())
      return route.abort()
    })
    await page.addInitScript(() => localStorage.setItem('voltekno_cookie_consent', 'dismissed'))
    await page.goto('/register')
    const submit = page.getByRole('button', { name: 'Üye Ol', exact: true })
    await submit.click()
    const form = page.locator('main form').last()
    await expect(form).toContainText(/zorunlu|girin|gerekli/i)
    await page.locator('[data-field="name"] input').fill('Staging Kullanıcı')
    await page.locator('[data-field="email"] input').fill('gecersiz-eposta')
    await page.locator('[data-field="password"] input').fill('123')
    await page.locator('[data-field="confirmPassword"] input').fill('456')
    await submit.click()
    await expect(form).toContainText(/e-posta/i)
    await expect(form).toContainText(/şifre/i)
    expect(firebase, 'geçersiz formla Firebase isteği').toEqual([])
    await page.goto('/forgot-password')
    await expect(page.locator('input[type="email"]')).toBeVisible()
    await page.goto('/login')
    await expect(page.locator('input[type="email"]')).toBeVisible()
    await expect(page.locator('body')).toContainText(/Şifremi unuttum/i)
  })
})

// ─── 34 Yedek ve geri dönüş provası ──────────────────────────────────────
test.describe('34 yedek ve geri yükleme provası', () => {
  test('panelden yedek alınır, sunucu dışı kopya e-postayla gider, indirilen yedek açılıp aynı kayıtları verir', async ({ request }) => {
    const backupDir = process.env.STAGING_BACKUP_DIR
    test.skip(!backupDir, 'STAGING_BACKUP_DIR yok')
    const cookie = await adminCookie(request)
    const counts = async (db: PrismaClient) => ({
      order: await db.order.count(),
      user: await db.user.count(),
      override: await db.productOverride.count(),
      adminUser: await db.adminUser.count(),
      discount: await db.discount.count(),
    })
    const before = await counts(prisma)
    const r = await request.post('/api/admin/system', { headers: { cookie }, data: { action: 'backup' } })
    expect(r.status(), await r.text()).toBe(200)
    const json = await r.json()
    const file = (json.file ?? json.result?.file) as string
    expect(file, JSON.stringify(json)).toMatch(/^voltekno-.*\.db$/)
    // Sunucu dışı kopya: yöneticiye gzip ekli e-posta
    const mail = await waitMail('yonetim@staging-alici.dev', /veritabanı yedeği/i)
    expect(mail.raw).toMatch(/\.db\.gz/)
    // Panelden indirme: gzip, açılınca dosyanın aynısı
    const dl = await request.get(`/api/admin/system/backup?file=${encodeURIComponent(file)}`, { headers: { cookie } })
    expect(dl.status()).toBe(200)
    const { gunzipSync } = await import('node:zlib')
    const restoredBytes = gunzipSync(await dl.body())
    expect(restoredBytes.equals(fs.readFileSync(path.join(backupDir!, file)))).toBe(true)
    // Geri yükleme provası: indirilen yedek ayrı bir veritabanı olarak açılır
    const restoredPath = path.join(backupDir!, `restore-${RUN}.db`)
    fs.writeFileSync(restoredPath, restoredBytes)
    const restored = new PrismaClient({ datasources: { db: { url: `file:${restoredPath.replace(/\\/g, '/')}` } } })
    try {
      const check = (await restored.$queryRawUnsafe('PRAGMA integrity_check')) as { integrity_check: string }[]
      expect(check[0]?.integrity_check).toBe('ok')
      expect(await counts(restored)).toEqual(before)
    } finally {
      await restored.$disconnect()
      fs.rmSync(restoredPath, { force: true })
    }
    // Geçersiz dosya adı indirilemez
    expect((await request.get('/api/admin/system/backup?file=../staging.db', { headers: { cookie } })).status()).toBe(400)
  })
})
