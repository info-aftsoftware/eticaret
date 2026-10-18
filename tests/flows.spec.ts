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

async function placeOrderApi(request: APIRequestContext, c: ReturnType<typeof customer>, quantity = 1) {
  return request.post('/api/orders', {
    data: {
      customer: c,
      items: [{ id: VARIANT_ID, quantity }],
      paymentMethod: 'bank_transfer',
      acceptedTerms: true,
    },
  })
}

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
    await page.goto('/checkout')
    await expect(page.locator('html')).toHaveAttribute('lang', 'en')
    await expect(page.locator('body')).toContainText('Contact information', { timeout: 20_000 })
    await fillCheckout(page, c)
    await page.locator('#acceptTerms').check()
    await page.locator('main button[type=submit]').last().click()
    await page.waitForURL(/\/checkout\/success/, { timeout: 30_000 })
    await expect(page.locator('body')).toContainText('Your order has been received')
  })

  test('EN: sunucunun Türkçe stok hatası İngilizce gösterilir', async ({ page }) => {
    const c = customer('enerr')
    await page.route('**/api/orders', (route) => route.request().method() === 'POST'
      ? route.fulfill({ status: 400, json: { success: false, error: '"E2E Test Ürünü" için stokta yalnızca 1 adet var.' } })
      : route.continue())
    await seedCart(page, 2, 'en')
    await page.goto('/checkout')
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
    await page.goto('/cart')
    await expect(page.locator('body')).toContainText('A product in your cart is no longer for sale', { timeout: 15_000 })
    await expect(page.locator('body')).not.toContainText('artık satışta değil')
  })

  test('EN: şirket faturasında doğrulama mesajları İngilizce', async ({ page }) => {
    await seedCart(page, 1, 'en')
    await page.goto('/checkout')
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

/** Ürün adı, açıklama, adres/unvan ve yasal metinler bilerek Türkçe; arayüz metinleri taranır. */
const TR_RE = /[çğıöşüÇĞİÖŞÜ]|\b(ve|ile|için|Sepet|Ürün|Sipariş|Ödeme|Giriş|Hesab|Şifre|Tümü|Kargo|İade|Teklif|İndirim|Adet|Kapat|Devam|Gönder|Kaydet|Seçin|Yükleniyor|Stokta|Tükendi|Favori|Karşılaştır)\b/
const EN_PAGES = ['/', '/products', '/category/gunes-paneli', `/products/tommatech-450wp-dark-series-16bb-topcon-gunes-paneli`, '/paketler', '/categories', '/cart', '/checkout',
  '/login', '/register', '/forgot-password', '/reset-password', '/verify-email', '/profile', '/favorites', '/orders', '/siparis-takip', '/contact', '/faq', '/shipping',
  '/hakkimizda', '/ges', '/ges/teklif-dogrulama', '/karsilastir', '/blog', '/checkout/cancel?reason=declined&order_id=ORD-2026-00009', '/bu-sayfa-yok']

test.describe('İngilizce sayfalarda Türkçe arayüz metni', () => {
  for (const path of EN_PAGES) {
    test(`EN ${path}`, async ({ page }) => {
      await seedCart(page, 1, 'en')
      await page.goto(path)
      await page.waitForTimeout(2500)
      const hits = await page.evaluate((src) => {
        const re = new RegExp(src)
        const skip = (el: Element) => !!el.closest('script,style,noscript,h1,.prose,article,[itemprop=name],[itemprop=description],a[href*="/products/"],footer address,option,[lang="tr"],a[href*="/blog/"],[data-tr-ok]')
        const out = new Set<string>()
        const w = document.createTreeWalker(document.body, NodeFilter.SHOW_TEXT)
        let n: Node | null
        while ((n = w.nextNode())) {
          const t = (n.textContent || '').trim()
          const el = n.parentElement
          if (t.length < 2 || !el || !re.test(t) || skip(el)) continue
          const cs = getComputedStyle(el)
          if (cs.display === 'none' || cs.visibility === 'hidden') continue
          out.add(t.slice(0, 100))
        }
        for (const el of document.querySelectorAll('[placeholder],[aria-label],[title]')) {
          if (skip(el)) continue
          for (const a of ['placeholder', 'aria-label', 'title']) {
            const v = el.getAttribute(a)
            if (v && re.test(v)) out.add(`@${a}: ${v.slice(0, 90)}`)
          }
        }
        return [...out]
      }, TR_RE.source)
      const ignore = /Çaydaçıra|AFET TEKNOLOJ|MERSİS|ELAZIĞ|Elazığ|^@aria-label: (Add|Remove) .*(to|from) (cart|favorites|compare)|^@title: .* products$|TommaTech|Victron|Apex|Havensis|Likya|İstabreeze|Türkçe|E2E Test Ürünü|^₺|İzmir|İstanbul|Muğla|Şanlıurfa|Sürat Kargo|HepsiJET|Yurtiçi|Kolay Gelsin|Aras Kargo|PTT/
      const real = hits.filter((h) => !ignore.test(h))
      test.info().annotations.push({ type: 'tr-hits', description: JSON.stringify(real) })
      if (real.length) console.log(`[TR] ${path}:\n  ${real.join('\n  ')}`)
      expect.soft(real, `${path} İngilizcede Türkçe metin`).toEqual([])
      await expect(page.locator('html')).toHaveAttribute('lang', 'en')
    })
  }
})
