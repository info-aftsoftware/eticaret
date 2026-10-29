/**
 * Uçtan uca alışveriş senaryoları: misafir havale siparişi, takip, havale bildirimi, admin kargo/iptal/iade,
 * stok düşümü ve iadesi, sınırlar, İngilizce akış ve İngilizce sayfalarda Türkçe metin taraması.
 *
 * Gerçek sipariş oluşturur ve e-posta tetikler: yalnızca SMTP'si kapalı, kopya veritabanlı sunucuya karşı çalıştırın.
 *   FLOW_TESTS=1 PLAYWRIGHT_BASE_URL=http://localhost:3009 DATABASE_URL=file:<kopya.db> playwright test tests/flows.spec.ts
 */
import fs from 'node:fs'
import { test, expect, type APIRequestContext, type Page } from '@playwright/test'
import { E2E_PRODUCT_ID } from './e2e-catalog'

test.skip(!process.env.FLOW_TESTS, 'FLOW_TESTS=1 ile (e-postasız test sunucusunda) çalıştırın')
// Misafir siparişi adımları sırayla çalışır (aynı siparişi kullanır)

const VARIANT_ID = `${E2E_PRODUCT_ID}-10w`
const RUN = Date.now().toString(36)
let phoneSeq = 0
/** Her senaryoya ayrı müşteri: açık sipariş sınırı (3) senaryolar arasında birikmesin */
function customer(tag: string) {
  phoneSeq += 1
  const tail = String((Date.now() + phoneSeq * 7919) % 10_000_000).padStart(7, '0')
  return {
    name: 'Test Müşteri',
    email: `flow-${tag}-${RUN}@example.com`,
    phone: `532${tail}`,
    city: 'İstanbul',
    district: 'Kadıköy',
    addressLine: 'Test Mah. Deneme Sok. No:1 D:2',
  }
}

function adminToken(): string {
  const env = fs.readFileSync('.env.local', 'utf8')
  const v = (env.match(/^ADMIN_TOKEN=(.*)$/m) || [])[1]?.trim().replace(/^["']|["']$/g, '')
  if (!v) throw new Error('ADMIN_TOKEN yok')
  return v
}

/** Admin girişi IP başına 15 dakikada 5 denemeyle sınırlı: oturum çerezi bir kez alınıp tekrar kullanılır */
let cachedAdminCookie = ''
async function adminCookie(request: APIRequestContext): Promise<string> {
  if (cachedAdminCookie) return cachedAdminCookie
  const res = await request.post('/api/admin/auth', { data: { password: adminToken() } })
  expect(res.status()).toBe(200)
  const c = (res.headers()['set-cookie'] || '').split(';')[0]
  expect(c).toContain('admin_session=')
  cachedAdminCookie = c
  return c
}

async function productStock(request: APIRequestContext): Promise<number> {
  const res = await request.get('/api/products')
  const json = await res.json()
  const list = Array.isArray(json) ? json : json.products || json.items || []
  const p = list.find((x: { id: string }) => x.id === E2E_PRODUCT_ID)
  expect(p, 'test ürünü vitrinde').toBeTruthy()
  return p.stock
}

async function setStock(request: APIRequestContext, cookie: string, stock: number) {
  const res = await request.patch('/api/admin/stock-overrides', { headers: { cookie }, data: { productId: E2E_PRODUCT_ID, stock } })
  expect(res.status()).toBe(200)
}

/**
 * Müşteriye özgü istemci IP'si: havale siparişlerinde IP başına saatte 3 sınırı var; yerelde vekil sunucu olmadığı
 * için x-real-ip testten gelir, her test müşterisi kendi "IP"sinden sipariş verir
 */
const ipFor = (c: { email: string }) => {
  let h = 0
  for (const ch of c.email) h = (h * 31 + ch.charCodeAt(0)) >>> 0
  return `10.${(h >> 16) & 255}.${(h >> 8) & 255}.${h & 255}`
}

async function placeOrderApi(request: APIRequestContext, c: ReturnType<typeof customer>, quantity = 1) {
  return request.post('/api/orders', {
    headers: { 'x-real-ip': ipFor(c) },
    data: {
      customer: c,
      items: [{ id: VARIANT_ID, quantity }],
      paymentMethod: 'bank_transfer',
      acceptedTerms: true,
    },
  })
}

/** İngilizce sayfa adresi: dil adresten gelir (/en önekli), çerez yalnız API çağrıları için */
const enPath = (p: string) => (p === '/' ? '/en' : p.startsWith('/?') ? `/en${p.slice(1)}` : `/en${p}`)

async function seedCart(page: Page, quantity = 2, locale: 'tr' | 'en' = 'tr') {
  await page.context().addCookies([{ name: 'NEXT_LOCALE', value: locale, url: process.env.PLAYWRIGHT_BASE_URL || 'http://localhost:3009' }])
  await page.addInitScript((q) => {
    sessionStorage.setItem('cart-storage', JSON.stringify({
      state: { items: [{ id: 'e2e-test-urunu-10w', name: 'E2E Test Ürünü (10W)', price: 450, quantity: q }], couponCode: null },
      version: 0,
    }))
    localStorage.setItem('voltekno_cookie_consent', 'dismissed')
  }, quantity)
}

async function fillCheckout(page: Page, c: ReturnType<typeof customer>) {
  await page.locator('#name').fill(c.name)
  await page.locator('#email').fill(c.email)
  await page.locator('#phone').fill(c.phone)
  await page.locator('select#city').selectOption({ label: c.city })
  await page.locator('select#district').selectOption({ label: c.district })
  await page.locator('#addressLine').fill(c.addressLine)
}

test.describe('misafir havale siparişi (arayüz)', () => {
  test.describe.configure({ mode: 'serial' })
  let orderNo = ''
  const c = customer('ui')

  test('sepet → ödeme: zorunlu alan ve sözleşme kontrolü, sonra sipariş', async ({ page, request }) => {
    const before = await productStock(request)
    await seedCart(page, 2)
    await page.goto('/checkout')
    await expect(page.locator('#name')).toBeVisible({ timeout: 20_000 })

    // Boş formla gönderim: hata mesajları, sipariş oluşmaz
    await page.locator('main button[type=submit]').last().click()
    await expect(page.locator('[role=alert], [id$="-error"]').first()).toBeVisible()
    expect(page.url()).toContain('/checkout')

    // Geçersiz e-posta ve telefon
    await page.locator('#email').fill('gecersiz@')
    await page.locator('#email').blur()
    await expect(page.locator('#email-error')).toBeVisible()

    await fillCheckout(page, c)
    // Sözleşme onayı olmadan gönderilemez
    await page.locator('main button[type=submit]').last().click()
    await expect(page).toHaveURL(/\/checkout(\?|$)/)
    await page.locator('#acceptTerms').check()
    await page.locator('main button[type=submit]').last().click()

    await page.waitForURL(/\/checkout\/success/, { timeout: 30_000 })
    orderNo = new URL(page.url()).searchParams.get('order_id') || ''
    expect(orderNo).toMatch(/^ORD-\d{4}-\d{5}$/)
    await expect(page.locator('body')).toContainText(orderNo)
    await expect(page.locator('body')).toContainText('TR')  // IBAN
    await expect(page.locator('body')).toContainText('Siparişiniz alındı')

    // Stok ödeme beklerken ayrılır (2 adet)
    expect(await productStock(request)).toBe(before - 2)
  })

  test('sipariş takibi: doğru bilgilerle görünür, yanlış e-postayla görünmez', async ({ page, request }) => {
    expect(orderNo).not.toBe('')
    const ok = await request.post(`/api/orders/by-no/${orderNo}`, { data: { email: c.email, phone: c.phone } })
    expect(ok.status()).toBe(200)
    const bad = await request.post(`/api/orders/by-no/${orderNo}`, { data: { email: 'baska@example.com', phone: c.phone } })
    expect(bad.status()).toBe(404)

    await page.addInitScript(() => localStorage.setItem('voltekno_cookie_consent', 'dismissed'))
    await page.goto('/siparis-takip')
    await page.locator('#orderNo').fill(orderNo)
    await page.locator('#email').fill(c.email)
    await page.locator('#phone').fill(c.phone)
    await page.locator('main button[type=submit]').last().click()
    await expect(page.locator('body')).toContainText(orderNo, { timeout: 20_000 })
    await expect(page.locator('body')).toContainText(/Ödeme bekleniyor|Havale|ödeme/i)
  })

  test('havale bildirimi: eksik alan 400, doğru bildirim kabul, ikinci kez reddedilir veya güncellenir', async ({ request }) => {
    const order = await (await request.post(`/api/orders/by-no/${orderNo}`, { data: { email: c.email, phone: c.phone } })).json()
    const total = order.order.total ?? order.order.totals?.total
    expect(typeof total).toBe('number')
    const empty = await request.post(`/api/orders/by-no/${orderNo}/payment-notice`, { data: { email: c.email, phone: c.phone } })
    expect(empty.status()).toBe(400)
    const today = new Date().toISOString().slice(0, 10)
    const ok = await request.post(`/api/orders/by-no/${orderNo}/payment-notice`, {
      data: { email: c.email, phone: c.phone, senderName: 'Test Müşteri', bank: 'Ziraat Bankası', amount: total, paidOn: today },
    })
    expect([200, 201]).toContain(ok.status())
  })

  test('admin: ödeme onayı → kargoya ver (takip no) → müşteri takip numarasını görür', async ({ request, page }) => {
    const cookie = await adminCookie(request)
    const list = await (await request.get(`/api/admin/orders?q=${orderNo}`, { headers: { cookie } })).json()
    const rows = list.orders || list.items || list.data || list
    const row = (Array.isArray(rows) ? rows : []).find((o: { orderNo?: string; orderNumber?: string }) => (o.orderNo || o.orderNumber) === orderNo)
    expect(row, 'admin listesinde sipariş').toBeTruthy()
    const id = row.id

    expect((await request.patch(`/api/admin/orders/${id}`, { headers: { cookie }, data: { action: 'mark_paid', note: 'test' } })).status()).toBe(200)
    expect((await request.patch(`/api/admin/orders/${id}`, { headers: { cookie }, data: { action: 'status', status: 'PROCESSING', notifyCustomer: false } })).status()).toBe(200)
    const ship = await request.patch(`/api/admin/orders/${id}`, {
      headers: { cookie },
      data: { action: 'status', status: 'SHIPPED', carrier: 'yurtici', trackingNumber: `TRK${RUN}`.toUpperCase(), notifyCustomer: false },
    })
    expect(ship.status(), await ship.text()).toBe(200)

    const after = await (await request.post(`/api/orders/by-no/${orderNo}`, { data: { email: c.email, phone: c.phone } })).json()
    expect(after.order.trackingNumber).toBe(`TRK${RUN}`.toUpperCase())

    await page.addInitScript(() => localStorage.setItem('voltekno_cookie_consent', 'dismissed'))
    await page.goto('/siparis-takip')
    await page.locator('#orderNo').fill(orderNo)
    await page.locator('#email').fill(c.email)
    await page.locator('#phone').fill(c.phone)
    await page.locator('main button[type=submit]').last().click()
    await expect(page.locator('body')).toContainText(`TRK${RUN}`.toUpperCase(), { timeout: 20_000 })
    await expect(page.locator('body')).toContainText('Kargo bilgisi')
  })
})

test.describe('stok ve sınır senaryoları (API)', () => {
  test('stoktan fazla adet reddedilir; tükenen ürün siparişe girmez', async ({ request }) => {
    const cookie = await adminCookie(request)
    const original = await productStock(request)
    await setStock(request, cookie, 3)
    expect(await productStock(request)).toBe(3)
    const over = await placeOrderApi(request, customer('over'), 4)
    expect(over.status(), await over.text()).toBeGreaterThanOrEqual(400)
    await setStock(request, cookie, 0)
    const out = await placeOrderApi(request, customer('out'), 1)
    expect(out.status()).toBeGreaterThanOrEqual(400)
    await setStock(request, cookie, original)
    expect(await productStock(request)).toBe(original)
  })

  test('fiyat istemciden alınmaz: gönderilen fiyat yok sayılır', async ({ request }) => {
    const c = customer('price')
    const res = await request.post('/api/orders', {
      headers: { 'x-real-ip': ipFor(c) },
      data: { customer: c, items: [{ id: VARIANT_ID, quantity: 1, price: 1 }], paymentMethod: 'bank_transfer', acceptedTerms: true, total: 1 },
    })
    expect(res.status(), await res.text()).toBe(200)
    const json = await res.json()
    const orderNo = json.orderId || json.orderNo
    const o = await (await request.post(`/api/orders/by-no/${orderNo}`, { data: { email: c.email, phone: c.phone } })).json()
    const total = o.order.total ?? o.order.totals?.total
    expect(total).toBeGreaterThan(400)
  })

  test('aynı müşteriye en fazla 3 ödenmemiş havale siparişi', async ({ request }) => {
    const c = customer('limit')
    for (let i = 0; i < 3; i++) expect((await placeOrderApi(request, c)).status()).toBe(200)
    const fourth = await placeOrderApi(request, c)
    expect(fourth.status()).toBe(429)
    expect((await fourth.json()).code).toBe('TOO_MANY_OPEN_ORDERS')
  })

  test('misafir iptali: yanlış bilgiyle 404, doğru bilgiyle iptal ve stok geri gelir', async ({ request }) => {
    const c = customer('cancel')
    const before = await productStock(request)
    const res = await placeOrderApi(request, c, 2)
    expect(res.status()).toBe(200)
    const orderNo = (await res.json()).orderId
    expect(await productStock(request)).toBe(before - 2)
    expect((await request.post(`/api/orders/by-no/${orderNo}/cancel`, { data: { email: 'yanlis@example.com', phone: c.phone } })).status()).toBe(404)
    const ok = await request.post(`/api/orders/by-no/${orderNo}/cancel`, { data: { email: c.email, phone: c.phone, reason: 'test' } })
    expect(ok.status(), await ok.text()).toBe(200)
    expect(await productStock(request)).toBe(before)
  })

  test('teslim edilen siparişte cayma: talep → admin onay → teslim alındı → stok geri gelir', async ({ request }) => {
    const cookie = await adminCookie(request)
    const c = customer('return')
    const before = await productStock(request)
    const orderNo = (await (await placeOrderApi(request, c, 1)).json()).orderId
    const list = await (await request.get(`/api/admin/orders?q=${orderNo}`, { headers: { cookie } })).json()
    const rows = list.orders || list.items || list.data || list
    const id = (Array.isArray(rows) ? rows : []).find((o: { orderNo?: string; orderNumber?: string }) => (o.orderNo || o.orderNumber) === orderNo)?.id
    expect(id).toBeTruthy()
    for (const data of [
      { action: 'mark_paid' },
      { action: 'status', status: 'PROCESSING', notifyCustomer: false },
      { action: 'status', status: 'SHIPPED', carrier: 'yurtici', trackingNumber: 'TRKRET1', notifyCustomer: false },
      { action: 'status', status: 'DELIVERED', notifyCustomer: false },
    ]) {
      const r = await request.patch(`/api/admin/orders/${id}`, { headers: { cookie }, data })
      expect(r.status(), `${JSON.stringify(data)} → ${await r.text()}`).toBe(200)
    }
    expect(await productStock(request)).toBe(before - 1)

    const o = await (await request.post(`/api/orders/by-no/${orderNo}`, { data: { email: c.email, phone: c.phone } })).json()
    const line = o.order.lines[0]
    const ret = await request.post(`/api/orders/by-no/${orderNo}/returns`, {
      data: { email: c.email, phone: c.phone, type: 'withdrawal', items: [{ lineId: line.id, quantity: 1 }], reason: 'Vazgeçtim' },
    })
    expect(ret.status(), await ret.text()).toBe(200)
    const after = await (await request.post(`/api/orders/by-no/${orderNo}`, { data: { email: c.email, phone: c.phone } })).json()
    const rr = (after.order.returnRequests || [])[0]
    expect(rr, 'iade talebi siparişte').toBeTruthy()
    for (const op of ['approve', 'receive']) {
      const r = await request.patch(`/api/admin/orders/${id}`, { headers: { cookie }, data: { action: 'return', op, returnId: rr.id, carrier: 'yurtici', code: 'RET123' } })
      expect(r.status(), `${op} → ${await r.text()}`).toBe(200)
    }
    expect(await productStock(request)).toBe(before)
  })
})

test.describe('admin ↔ vitrin senkronu', () => {
  test('admin stok değişikliği ürün sayfasına ilk istekte yansır', async ({ request }) => {
    const cookie = await adminCookie(request)
    const original = await productStock(request)
    const pageStock = async () => {
      const html = await (await request.get(`/products/${E2E_PRODUCT_ID}`)).text()
      const m = html.match(/\\"stock\\":(\d+)/) || html.match(/"stock":(\d+)/)
      return m ? Number(m[1]) : null
    }
    await pageStock() // önbelleği ısıt
    await setStock(request, cookie, original + 11)
    expect(await pageStock()).toBe(original + 11)
    await setStock(request, cookie, original)
    expect(await pageStock()).toBe(original)
  })

  test('admin kampanyası (%10, ürün) vitrinde ve siparişte uygulanır, silinince kalkar', async ({ request }) => {
    const cookie = await adminCookie(request)
    const res = await request.post('/api/admin/discounts', {
      headers: { cookie },
      data: { name: `E2E Kampanya ${RUN}`, scope: 'PRODUCT', productIds: [E2E_PRODUCT_ID], type: 'PERCENT', value: 10, active: true },
    })
    expect(res.status(), await res.text()).toBe(200)
    const discount = await res.json()
    try {
      const list = await (await request.get('/api/products')).json()
      const p = (Array.isArray(list) ? list : list.products).find((x: { id: string }) => x.id === E2E_PRODUCT_ID)
      expect(p.oldPrice).toBeTruthy()
      expect(p.price).toBeLessThan(p.oldPrice)

      const c = customer('camp')
      const order = await placeOrderApi(request, c, 1)
      expect(order.status(), await order.text()).toBe(200)
      const orderNo = (await order.json()).orderId
      const o = await (await request.post(`/api/orders/by-no/${orderNo}`, { data: { email: c.email, phone: c.phone } })).json()
      const unit = o.order.lines[0].unitPrice ?? o.order.lines[0].price
      expect(unit).toBeCloseTo(405, 0) // 450 TL − %10
    } finally {
      expect((await request.delete(`/api/admin/discounts/${discount.id}`, { headers: { cookie } })).status()).toBe(200)
    }
    const after = await (await request.get('/api/products')).json()
    const p2 = (Array.isArray(after) ? after : after.products).find((x: { id: string }) => x.id === E2E_PRODUCT_ID)
    expect(p2.oldPrice ?? null).toBeNull()
  })
})

test.describe('mobil (Pixel 5)', () => {
  test.use({ viewport: { width: 393, height: 851 }, isMobile: true, hasTouch: true })

  test('mobilde ödeme formu doldurulur, sipariş verilir, yatay taşma olmaz', async ({ page }) => {
    const c = customer('mobile')
    await seedCart(page, 1)
    await page.goto('/checkout')
    await expect(page.locator('#name')).toBeVisible({ timeout: 20_000 })
    const overflow = await page.evaluate(() => document.documentElement.scrollWidth - window.innerWidth)
    expect(overflow).toBeLessThanOrEqual(1)
    await fillCheckout(page, c)
    await page.locator('#acceptTerms').check()
    await page.locator('main button[type=submit]').last().click()
    await page.waitForURL(/\/checkout\/success/, { timeout: 30_000 })
    await expect(page.locator('body')).toContainText('Siparişiniz alındı')
    const overflow2 = await page.evaluate(() => document.documentElement.scrollWidth - window.innerWidth)
    expect(overflow2).toBeLessThanOrEqual(1)
  })
})

test.describe('İngilizce akış', () => {
  test('EN: ödeme sayfası ve başarı sayfası İngilizce, sunucu hatası İngilizce', async ({ page }) => {
    const c = customer('en')
    await seedCart(page, 1, 'en')
    await page.goto('/en/checkout')
    await expect(page.locator('html')).toHaveAttribute('lang', 'en')
    await expect(page.locator('body')).toContainText('Contact information', { timeout: 20_000 })
    await fillCheckout(page, c)
    await page.locator('#acceptTerms').check()
    await page.locator('main button[type=submit]').last().click()
    await page.waitForURL(/\/checkout\/success/, { timeout: 30_000 })
    await expect(page.locator('body')).toContainText('Your order has been received')
    // Sipariş müşterinin dilini saklar: sipariş/kargo/iptal e-postaları İngilizce gönderilir
    const orderNo = new URL(page.url()).searchParams.get('order_id') || ''
    expect(orderNo).toBeTruthy()
    const o = await (await page.request.post(`/api/orders/by-no/${orderNo}`, { data: { email: c.email, phone: c.phone } })).json()
    expect(o.order?.locale).toBe('en')
  })

  test('EN: sunucunun Türkçe stok hatası İngilizce gösterilir', async ({ page }) => {
    const c = customer('enerr')
    await page.route('**/api/orders', (route) => route.request().method() === 'POST'
      ? route.fulfill({ status: 400, json: { success: false, error: '"E2E Test Ürünü" için stokta yalnızca 1 adet var.' } })
      : route.continue())
    await seedCart(page, 2, 'en')
    await page.goto('/en/checkout')
    await fillCheckout(page, c)
    await page.locator('#acceptTerms').check()
    await page.locator('main button[type=submit]').last().click()
    await expect(page.locator('body')).toContainText('Only 1 of "E2E Test Ürünü" are in stock.', { timeout: 15_000 })
    await expect(page.locator('body')).not.toContainText('için stokta yalnızca')
  })

  test('EN: sepette satıştan kalkmış ürün uyarısı İngilizce', async ({ page }) => {
    await page.context().addCookies([{ name: 'NEXT_LOCALE', value: 'en', url: process.env.PLAYWRIGHT_BASE_URL || 'http://localhost:3009' }])
    await page.addInitScript(() => {
      sessionStorage.setItem('cart-storage', JSON.stringify({
        state: { items: [{ id: 'satistan-kalkmis-urun-xyz', name: 'Eski Ürün', price: 100, quantity: 1 }], couponCode: null },
        version: 0,
      }))
      localStorage.setItem('voltekno_cookie_consent', 'dismissed')
    })
    await page.goto('/en/cart')
    await expect(page.locator('body')).toContainText('A product in your cart is no longer for sale', { timeout: 15_000 })
    await expect(page.locator('body')).not.toContainText('artık satışta değil')
  })

  test('EN: şirket faturasında doğrulama mesajları İngilizce', async ({ page }) => {
    await seedCart(page, 1, 'en')
    await page.goto('/en/checkout')
    await expect(page.locator('#name')).toBeVisible({ timeout: 20_000 })
    await page.getByRole('radio', { name: 'Corporate' }).click()
    await page.locator('#taxId').fill('123')
    await page.locator('#taxId').blur()
    await expect(page.locator('#taxId-error')).toHaveText('The tax number must be 10 digits.')
    await page.getByRole('radio', { name: 'Individual' }).click()
    await page.locator('#idNumber').fill('12345678901')
    await page.locator('#idNumber').blur()
    await expect(page.locator('#idNumber-error')).toHaveText('Enter a valid Turkish ID number.')
  })
})

/**
 * İngilizce seçiliyken görünür Türkçe metin taraması: arayüz, katalog (ürün adı, açıklama, teknik özellikler, filtreler),
 * yasal metinler, blog, paketler, marka ve ürün türü sayfaları, sekme başlığı ve erişilebilirlik öznitelikleri.
 * Türkçe kalabilen özel adlar: şirket unvanı ve adresi, il/ilçe adları (seçim listeleri), kargo firmaları, marka adları,
 * kanun bent harfleri (KVKK md. 5/2-ç, md. 11 a–ğ: yasal atıf olduğu için çeviride de aynen kalır).
 */
const TR_RE = /[çğıöşüÇĞİÖŞÜ]|\b(ve|ile|için|bir|bu|Sepet|Sepete|Ürün|Ürünler|Sipariş|Ödeme|Giriş|Hesab|Şifre|Tümü|Kargo|İade|Teklif|İndirim|Adet|Kapat|Devam|Gönder|Kaydet|Seçin|Yükleniyor|Stokta|Tükendi|Favori|Karşılaştır|Fiyat|Fiyatları|Detay|Kategori|Marka|Paket|Hakkımızda|İletişim|Tahmini|Toplam|Ücretsiz|Teslimat|Güneş|Akü|Şarj)\b/
/** Özel adlar metinden çıkarılır, kalan kısım taranır */
const TR_NAMES = /Türkiye|İstabreeze|Çaydaçıra|AFET TEKNOLOJ\S*|TİCARET VE SANAYİ LİMİTED ŞİRKETİ|TİC\. VE SAN\. LTD\. ŞTİ\.|MERSİS|ELAZIĞ|Elazığ|Elâzığ|İzmir|İstanbul|Muğla|Şanlıurfa|Aydın|Kadıköy|Prof\. Dr\. Nuri Orhan Bul\.|İç Kapı|Mah\.|Sürat Kargo|Yurtiçi Kargo|Yurtiçi|Kolay Gelsin|Aras Kargo|PTT Kargo|Türkçe|E2E Test Ürünü|Otomatik testler için geçici ürün|Test Müşteri|Gönderi Takip|Takip No|TEDAŞ|EDAŞ|İkas Bilişim A\.Ş\.|İYS|TÜBİS|\([çğ]\)|(?:^|[;\s])[çğ]\)/g
const EN_PRODUCTS = [
  'tommatech-450wp-dark-series-16bb-topcon-gunes-paneli',
  'tommatech-16bb-topcon-gunes-paneli-450wp-600wp',
  'tommatech-marine-mrn1-12-8v-100ah-lifepo4-lityum-aku-small',
  'tommatech-uno-hybrid-n6k-6-kw-monofaze-lv-hibrit-inverter',
  'np-power-mppt-sarj-kontrol-cihazi-30a-40a',
  'tommatech-spi-serisi-solar-pompa-surucusu-2-2-kw-630-kw',
  'altech-boreas-2000-2-kw-48v-off-grid-ruzgar-turbini',
  'tommatech-likya-22-kw-ac-arac-sarj-istasyonu-soketli-led-bluetooth',
  'tommatech-triome-10-kw-r290-monofaze-isi-pompasi-130-l-tank-dahil',
  'apex-safepower-12v-jel-aku-100ah-150ah-200ah',
  'alpex-modifiye-sinus-inverter-300w-2000w-12v-24v',
]
const EN_PAGES = [
  '/', '/products', `/products?category=${encodeURIComponent('TopCon Güneş Paneli')}`, '/products?q=inverter', '/categories',
  '/category/gunes-paneli', '/category/solar-aku', '/category/solar-inverter', '/category/solar-sarj-kontrol', '/category/solar-baglanti-ekipmani',
  '/category/ruzgar-enerjisi', '/category/isi-pompasi', '/category/elektrikli-arac-sarj',
  '/category/solar-aku/lityum-aku', '/category/solar-inverter/hibrit-inverter', '/marka/tommatech', '/marka/victron',
  ...EN_PRODUCTS.map((id) => `/products/${id}`),
  '/paketler', '/paketler/bag-evi-paketleri', '/paketler/villa-paketleri', '/paketler/karavan-paketleri',
  '/cart', '/checkout', '/checkout/cancel?reason=declined&order_id=ORD-2026-00009',
  '/login', '/register', '/forgot-password', '/reset-password', '/verify-email', '/profile', '/favorites', '/orders', '/siparis-takip',
  '/contact', '/faq', '/shipping', '/hakkimizda', '/ges', '/ges/teklif-dogrulama', '/karsilastir',
  '/blog', '/blog/ev-sarj-istasyonu-secimi', '/blog/lityum-vs-kursum-asit', '/blog/ges-nasil-kurulur', '/blog/karavan-enerji-paketi',
  '/privacy', '/terms', '/returns', '/cookies', '/pages/on-bilgilendirme-formu', '/pages/kvkk', '/pages/acik-riza-metni',
  '/pages/ticari-elektronik-ileti-onayi', '/pages/uyelik-ve-kullanim-kosullari', '/bu-sayfa-yok',
]

/** Sayfada görünen (ve erişilebilirlik özniteliklerindeki) Türkçe metinler */
async function turkishOnPage(page: Page): Promise<string[]> {
  return page.evaluate(([src, names]) => {
    const re = new RegExp(src)
    const nm = new RegExp(names, 'g')
    const isTr = (t: string) => re.test(t.replace(nm, ''))
    // option: il / ilçe adları; data-tr-ok: bilerek Türkçe bırakılan özel ad
    const skip = (el: Element) => !!el.closest('script,style,noscript,option,[data-tr-ok]')
    const out = new Set<string>()
    const w = document.createTreeWalker(document.body, NodeFilter.SHOW_TEXT)
    let n: Node | null
    while ((n = w.nextNode())) {
      const t = (n.textContent || '').trim()
      const el = n.parentElement
      if (t.length < 2 || !el || skip(el) || !isTr(t)) continue
      const cs = getComputedStyle(el)
      if (cs.display === 'none' || cs.visibility === 'hidden') continue
      out.add(t.slice(0, 120))
    }
    for (const el of document.querySelectorAll('[placeholder],[aria-label],[title],img[alt]')) {
      if (skip(el)) continue
      for (const a of ['placeholder', 'aria-label', 'title', 'alt']) {
        const v = el.getAttribute(a)
        if (v && isTr(v)) out.add(`@${a}: ${v.slice(0, 100)}`)
      }
    }
    if (isTr(document.title)) out.add(`<title>: ${document.title}`)
    return [...out]
  }, [TR_RE.source, TR_NAMES.source] as const)
}

test.describe('İngilizce sayfalarda Türkçe metin', () => {
  for (const path of EN_PAGES) {
    test(`EN ${path}`, async ({ page }) => {
      test.setTimeout(60_000)
      await seedCart(page, 1, 'en')
      await page.goto(enPath(path))
      // Açık kalan bağlantılar (sohbet, analitik) yüzünden networkidle hiç gelmeyebilir: kısa sınırla beklenir
      await page.waitForLoadState('networkidle', { timeout: 8_000 }).catch(() => {})
      await page.waitForTimeout(1500)
      const hits = await turkishOnPage(page)
      test.info().annotations.push({ type: 'tr-hits', description: JSON.stringify(hits) })
      if (hits.length) console.log(`[TR] ${path}:\n  ${hits.join('\n  ')}`)
      expect.soft(hits, `${path} İngilizcede Türkçe metin`).toEqual([])
      await expect(page.locator('html')).toHaveAttribute('lang', 'en')
    })
  }

  test('EN: ürün sayfası sekmeleri ve sepete ekleme bildirimi', async ({ page }) => {
    await seedCart(page, 1, 'en')
    await page.goto('/en/products/tommatech-16bb-topcon-gunes-paneli-450wp-600wp')
    await expect(page.locator('h1')).toContainText('Solar Panel', { timeout: 20_000 })
    for (const tab of await page.getByRole('tab').all()) {
      await tab.click()
      await page.waitForTimeout(300)
      expect.soft(await turkishOnPage(page), `sekme ${await tab.textContent()}`).toEqual([])
    }
    const add = page.getByRole('button', { name: /add to cart/i }).first()
    if (await add.isVisible()) {
      await add.click()
      await page.waitForTimeout(800)
      expect.soft(await turkishOnPage(page), 'sepete ekleme sonrası').toEqual([])
    }
  })

  test('EN: ödeme sayfasında zorunlu alan uyarıları ve sözleşme penceresi İngilizce', async ({ page }) => {
    await seedCart(page, 1, 'en')
    await page.goto('/en/checkout')
    await expect(page.locator('#name')).toBeVisible({ timeout: 20_000 })
    // Boş form gönderimi: alan uyarıları
    await page.locator('main button[type=submit]').last().click()
    await page.waitForTimeout(500)
    expect.soft(await turkishOnPage(page), 'boş form uyarıları').toEqual([])
    // Mesafeli satış sözleşmesi penceresi: İngilizce çeviri ve Türkçe metnin bağlayıcı olduğu notu
    await page.getByRole('button', { name: /Distance Sales Agreement/i }).first().click()
    await expect(page.getByRole('dialog')).toContainText('legally binding', { timeout: 10_000 })
    expect.soft(await turkishOnPage(page), 'sözleşme penceresi').toEqual([])
  })
})
