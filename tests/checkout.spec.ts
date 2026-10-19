/**
 * Sipariş süreci ve yasal gereklilikler — uçtan uca testler.
 * Hiçbir test sipariş oluşturmaz ve e-posta göndermez (yalnızca doğrulama/arayüz yolları).
 * Çalıştırma: PLAYWRIGHT_BASE_URL=http://localhost:3005 npx playwright test tests/checkout.spec.ts --project=chromium
 */
import { test, expect, type Page } from '@playwright/test'
import { computeOrderTotals } from '../lib/store-config'
import { shippingFeeFor } from '../lib/shipping/fee'

/** Test ürününün ölçü/ağırlık verisi yok (0 desi): kargo, desi tarifesinin en düşük basamağıdır */
const E2E_SHIPPING = shippingFeeFor({ desi: 0, kg: 0 })
const tl = (n: number) => n.toLocaleString('tr-TR', { minimumFractionDigits: 2, maximumFractionDigits: 2 })

const LEGAL_SLUGS = [
  'mesafeli-satis-sozlesmesi',
  'on-bilgilendirme-formu',
  'iade-ve-cayma-kosullari',
  'gizlilik-ve-cerez-politikasi',
  'kvkk',
  'acik-riza-metni',
  'ticari-elektronik-ileti-onayi',
  'uyelik-ve-kullanim-kosullari',
]

/**
 * Fiyat kontrolleri kampanyasız katalog varsayar (tests/e2e-catalog.ts: E2E Test Ürünü 10W = 450 TL).
 * Veritabanında aktif bir kampanya varsa bu testler gerekçesiyle atlanır.
 */
async function skipIfCampaign(request: import('@playwright/test').APIRequestContext) {
  const list = await (await request.get('/api/products')).json()
  const p = list.find((x: { id: string }) => x.id === 'e2e-test-urunu')
  test.skip(!!p?.oldPrice, `Aktif kampanya var (${p?.campaign?.name}); kesin fiyat testleri atlandı`)
}

/** Misafir sepetini (sessionStorage) doğrudan doldurur: 2 × 450 TL = 900 TL */
/** Kart seçeneği yalnızca sanal POS tanımlıysa açılır; testler POS'u açık varsayar. */
async function enableCard(page: Page) {
  await page.route('**/api/payments/methods', (route) => route.fulfill({ json: { bankTransfer: true, card: true } }))
}

async function seedCart(page: Page) {
  await page.addInitScript(() => {
    sessionStorage.setItem('cart-storage', JSON.stringify({
      state: {
        items: [{ id: 'e2e-test-urunu-10w', name: 'E2E Test Ürünü (10W)', price: 450, quantity: 2 }],
        couponCode: null,
      },
      version: 0,
    }))
    localStorage.setItem('voltekno_cookie_consent', 'dismissed')
  })
}

test.describe('yasal metinler', () => {
  for (const slug of LEGAL_SLUGS) {
    test(`/pages/${slug} satıcı bilgisiyle açılır`, async ({ page }) => {
      const res = await page.goto(`/pages/${slug}`)
      expect(res?.status()).toBe(200)
      await expect(page.locator('h1')).toBeVisible()
      await expect(page.locator('article')).toContainText('AFET TEKNOLOJİLERİ')
    })
  }

  test('footer zorunlu satıcı bilgilerini içerir', async ({ page }) => {
    await page.goto('/faq')
    const footer = page.locator('footer')
    await expect(footer).toContainText('MERSİS')
    await expect(footer).toContainText('KEP')
    await expect(footer).toContainText('Hazar Vergi Dairesi')
    await expect(footer).toContainText('ELAZIĞ')
  })

  test('eski adresler güncel metni gösterir', async ({ page }) => {
    await page.goto('/terms')
    await expect(page.locator('article')).toContainText('AFET TEKNOLOJİLERİ')
    await expect(page.locator('body')).not.toContainText('Yılmaz Uzun')
  })
})

test.describe('ödeme sayfası', () => {
  test('havale %3 indirimi gösterir, kartta kalkar', async ({ page, request }) => {
    await skipIfCampaign(request)
    await enableCard(page)
    await seedCart(page)
    await page.goto('/checkout')
    const summary = page.locator('text=Havale/EFT indirimi (%3)')
    await expect(summary.first()).toBeVisible({ timeout: 20_000 })
    await expect(page.locator('body')).toContainText(tl(computeOrderTotals({ subtotal: 900, paymentMethod: 'bank_transfer', shippingFee: E2E_SHIPPING }).total))
    await page.locator('input[name=paymentMethod]').nth(1).check()
    await expect(summary).toHaveCount(0)
    await expect(page.locator('body')).toContainText(tl(computeOrderTotals({ subtotal: 900, paymentMethod: 'card', shippingFee: E2E_SHIPPING }).total))
  })

  test('sözleşme onayı olmadan sipariş verilemez', async ({ page }) => {
    await seedCart(page)
    await page.goto('/checkout')
    await page.getByRole('button', { name: /Siparişi onayla/ }).click()
    await expect(page.locator('body')).toContainText('onaylamalısınız')
    await expect(page).toHaveURL(/\/checkout/)
  })

  test('sözleşme bağlantısı metni pencerede açar', async ({ page }) => {
    await seedCart(page)
    await page.goto('/checkout')
    await page.getByRole('button', { name: 'Mesafeli Satış Sözleşmesi' }).click()
    const dialog = page.getByRole('dialog').filter({ hasText: '1. TARAFLAR' })
    await expect(dialog).toBeVisible()
    await expect(dialog).toContainText('MERSİS No: 0009188272600001')
  })
})

test.describe('sepet', () => {
  test('kargo ücreti desiye göre gösterilir', async ({ page, request }) => {
    await skipIfCampaign(request)
    await seedCart(page)
    await page.goto('/cart')
    await expect(page.locator('body')).toContainText('hacim/ağırlığına göre', { timeout: 20_000 })
    await expect(page.locator('body')).toContainText(tl(E2E_SHIPPING))
  })
})

test.describe('sipariş takibi', () => {
  test('geçersiz sipariş numarası biçimi uyarı verir', async ({ page }) => {
    await page.goto('/siparis-takip')
    await page.getByLabel('Sipariş numarası', { exact: true }).fill('12345')
    await page.getByLabel('E-posta', { exact: true }).fill('a@example.com')
    await page.getByLabel('Telefon', { exact: true }).fill('5551112233')
    await page.getByRole('button', { name: 'Siparişimi Göster' }).click()
    await expect(page.locator('form [role=alert]')).toContainText('ORD-')
  })

  test('eşleşmeyen bilgilerle sipariş gösterilmez', async ({ page }) => {
    await page.goto('/siparis-takip')
    await page.getByLabel('Sipariş numarası', { exact: true }).fill('ORD-2026-99999')
    await page.getByLabel('E-posta', { exact: true }).fill('yok@example.com')
    await page.getByLabel('Telefon', { exact: true }).fill('5550000000')
    await page.getByRole('button', { name: 'Siparişimi Göster' }).click()
    await expect(page.locator('form [role=alert]')).toContainText(/bulunamadı|deneme/, { timeout: 20_000 })
  })
})

test.describe('sunucu doğrulamaları (sipariş oluşturmadan)', () => {
  const customer = { name: 'Test', email: 'test@example.com', phone: '5551112233', addressLine: 'Adres', city: 'İstanbul', district: 'Kadıköy' }

  test('sözleşme onayı olmayan sipariş 400', async ({ request }) => {
    const res = await request.post('/api/orders', {
      data: { customer, items: [{ id: 'e2e-test-urunu-10w', quantity: 1 }], paymentMethod: 'bank_transfer' },
    })
    expect(res.status()).toBe(400)
  })

  test('katalogda olmayan ürün 400', async ({ request }) => {
    const res = await request.post('/api/orders', {
      data: { customer, items: [{ id: 'olmayan-urun', quantity: 1 }], paymentMethod: 'bank_transfer', acceptedTerms: true },
    })
    expect(res.status()).toBe(400)
  })

  test('geçersiz kupon 400', async ({ request }) => {
    const res = await request.post('/api/coupons/preview', {
      data: { code: 'YOKBOYLEKUPON', items: [{ id: 'e2e-test-urunu-10w', quantity: 1 }] },
    })
    expect(res.status()).toBe(400)
  })

  test('sipariş numarasıyla yetkisiz sorgu 404', async ({ request }) => {
    const res = await request.get('/api/orders/by-no/ORD-2026-00001')
    expect(res.status()).toBe(404)
  })

  test('zamanlanmış görev anahtarsız 401', async ({ request }) => {
    const res = await request.post('/api/cron/expire-orders')
    expect(res.status()).toBe(401)
  })

  test('kaldırılan eski uç noktalar yok', async ({ request }) => {
    for (const path of ['/api/test/email', '/api/auth/register', '/api/upload/design', '/api/checkout']) {
      const res = await request.post(path, { data: {} })
      expect([404, 405]).toContain(res.status())
    }
  })
})

test.describe('faz 4: iade, hesap, stok, SEO', () => {
  test('yetkisiz iade / havale bildirimi / belge istekleri 404', async ({ request }) => {
    expect((await request.post('/api/orders/by-no/ORD-2026-00001/returns', { data: { type: 'withdrawal', items: [] } })).status()).toBe(404)
    expect((await request.post('/api/orders/by-no/ORD-2026-00001/payment-notice', { data: {} })).status()).toBe(404)
    expect((await request.get('/api/orders/by-no/ORD-2026-00001/documents?type=invoice')).status()).toBe(404)
  })

  test('hesap silme oturumsuz 401', async ({ request }) => {
    expect((await request.delete('/api/account')).status()).toBe(401)
  })

  test('stok bildirimi: geçersiz e-posta 400, stoktaki ürün 409', async ({ request }) => {
    expect((await request.post('/api/stock-alerts', { data: { productId: 'e2e-test-urunu', email: 'gecersiz' } })).status()).toBe(400)
    expect((await request.post('/api/stock-alerts', { data: { productId: 'e2e-test-urunu', email: 'a@example.com' } })).status()).toBe(409)
  })

  test('Google Merchant akışı: KDV dahil fiyat ve kargo', async ({ request }) => {
    await skipIfCampaign(request)
    const res = await request.get('/feed/google-merchant.xml')
    expect(res.status()).toBe(200)
    expect(res.headers()['content-type']).toContain('application/xml')
    const body = await res.text()
    expect(body).toContain('<g:id>e2e-test-urunu</g:id>')
    // 450 TL + %20 KDV = 540 TL; kargo desi tarifesinden (test ürünü 0 desi)
    const item = body.split('<item>').find((x) => x.includes('<g:id>e2e-test-urunu</g:id>'))!
    expect(item).toContain('<g:price>540.00 TRY</g:price>')
    expect(item).toContain(`<g:price>${E2E_SHIPPING.toFixed(2)} TRY</g:price></g:shipping>`)
  })

  test('site haritası yasal sayfaları içerir', async ({ request }) => {
    const body = await (await request.get('/sitemap.xml')).text()
    expect(body).toContain('/pages/kvkk')
    expect(body).toContain('/pages/mesafeli-satis-sozlesmesi')
  })

  test('ürün sayfası JSON-LD: KDV dahil fiyat, desi kargosu, iade politikası', async ({ page, request }) => {
    await skipIfCampaign(request)
    await page.goto('/products/e2e-test-urunu')
    const blocks = await page.locator('script[type="application/ld+json"]').evaluateAll((els) => els.map((e) => e.textContent ?? ''))
    const ld = blocks.map((b) => JSON.parse(b)).find((x) => x['@type'] === 'Product')
    expect(ld.offers.price).toBe(540)
    expect(ld.offers.shippingDetails.shippingRate.value).toBe(E2E_SHIPPING)
    expect(ld.offers.hasMerchantReturnPolicy.merchantReturnDays).toBe(14)
    await expect(page).toHaveTitle(/^E2E Test Ürünü \| voltekno$/)
  })
})

test.describe('faz 5: operasyon ve bot koruması', () => {
  test('zamanlanmış yedek ve sepet özeti yetkisiz', async ({ request }) => {
    expect((await request.post('/api/cron/backup')).status()).toBe(401)
    expect((await request.put('/api/cart-snapshot', { data: { items: [] } })).status()).toBe(401)
  })

  test('paketleme formu admin olmadan açılmaz', async ({ request }) => {
    expect([401, 403]).toContain((await request.get('/api/admin/orders/x/packing-slip')).status())
  })

  test('iletişim formu eksik alanla 400 (e-posta göndermeden)', async ({ request }) => {
    const res = await request.post('/api/contact', { data: { name: 'Test', email: 'gecersiz' } })
    expect(res.status()).toBe(400)
  })
})

test.describe('kampanya motoru', () => {
  test('aktif kampanyada ürün kartında eski fiyat ve rozet, JSON-LD kampanyalı fiyat', async ({ page, request }) => {
    const list = await (await request.get('/api/products')).json()
    const p = list.find((x: { oldPrice?: number }) => x.oldPrice)
    test.skip(!p, 'Aktif kampanya yok')
    await page.goto(`/products/${p.id}`)
    await expect(page.locator('body')).toContainText(`%${p.discount} İndirim`)
    const blocks = await page.locator('script[type="application/ld+json"]').evaluateAll((els) => els.map((e) => e.textContent ?? ''))
    const ld = blocks.map((b) => JSON.parse(b)).find((x) => x['@type'] === 'Product')
    expect(ld.offers.price).toBeCloseTo(p.price * 1.2, 1)
  })
})

test.describe('mobil ödeme (Pixel 5)', () => {
  test.use({ viewport: { width: 393, height: 851 }, isMobile: true, hasTouch: true })

  test('ödeme sayfasında yatay taşma yok, onay uyarısı görünür', async ({ page }) => {
    await seedCart(page)
    await page.goto('/checkout')
    await expect(page.getByRole('button', { name: /Siparişi onayla/ })).toBeVisible({ timeout: 20_000 })
    const overflow = await page.evaluate(() => document.documentElement.scrollWidth - window.innerWidth)
    expect(overflow).toBeLessThanOrEqual(1)
    await page.getByRole('button', { name: /Siparişi onayla/ }).click()
    await expect(page.locator('body')).toContainText('onaylamalısınız')
  })

})

test.describe('arama ve karşılaştırma', () => {
  test('başlık araması: yazım hatasıyla öneri, ok tuşu ve Enter ile ürüne gider', async ({ page }) => {
    await page.goto('/')
    const box = page.getByRole('combobox').first()
    await box.fill('invertör')
    const list = page.getByRole('listbox').first()
    await expect(list.getByRole('option').first()).toBeVisible({ timeout: 20_000 })
    await expect(box).toHaveAttribute('aria-expanded', 'true')
    await box.press('ArrowDown')
    await expect(list.getByRole('option').first()).toHaveAttribute('aria-selected', 'true')
    await box.press('Enter')
    await expect(page).toHaveURL(/\/products\//, { timeout: 20_000 })
  })

  test('karşılaştırma: iki ürün eklenir, tabloda yan yana görünür', async ({ page }) => {
    await page.addInitScript(() => {
      localStorage.setItem('compare-storage', JSON.stringify({ state: { ids: ['e2e-test-urunu', 'tommatech-450wp-dark-series-16bb-topcon-gunes-paneli'] }, version: 0 }))
      localStorage.setItem('voltekno_cookie_consent', 'dismissed')
    })
    await page.goto('/karsilastir')
    const table = page.getByRole('table')
    await expect(table).toBeVisible({ timeout: 20_000 })
    await expect(table.locator('thead th')).toHaveCount(3)
    await expect(page.locator('meta[name="robots"]')).toHaveAttribute('content', /noindex/)
  })
})

test.describe('banka hesapları ve WhatsApp', () => {
  test('havale sonrası sayfada iki şirket hesabı ve kopyalama düğmesi', async ({ page }) => {
    await page.addInitScript(() => localStorage.setItem('voltekno_cookie_consent', 'dismissed'))
    await page.goto('/checkout/success?order_id=ORD-2026-00001&payment=bank_transfer')
    const body = page.locator('body')
    await expect(body).toContainText('TR37 0001 0001 8697 8290 8650 01')
    await expect(body).toContainText('TR05 0020 6000 2505 7595 1700 03')
    await expect(body).toContainText('AFET TEKNOLOJİLERİ TİC. VE SAN. LTD. ŞTİ.')
    await expect(body).not.toContainText('Halkbank')
    await expect(page.getByRole('button', { name: /Ziraat Bankası IBAN/ })).toBeVisible()
  })

  test('WhatsApp düğmesi: ürün sayfasında var, ödeme sayfasında yok', async ({ page }) => {
    // Sepet boşken ödeme sayfası /cart'a yönlenir; ödeme sayfasının kendisini sınamak için sepet doldurulur
    await seedCart(page)
    await page.goto('/products/e2e-test-urunu')
    // Sabit düğme (footer'daki genel bağlantı değil): ürün adresiyle hazır mesaj içerir
    const wa = page.locator('a.fixed[href^="https://wa.me/"]')
    await expect(wa).toHaveAttribute('href', /^https:\/\/wa\.me\/905518291613\?text=/)
    await page.goto('/checkout')
    await expect(page.getByRole('button', { name: /Siparişi onayla/ })).toBeVisible({ timeout: 20_000 })
    await expect(page.locator('a.fixed[href^="https://wa.me/"]')).toHaveCount(0)
  })
})

test.describe('kart ödemesi (banka sanal POS)', () => {
  const customer = { name: 'Test', email: 'test@example.com', phone: '5551112233', addressLine: 'Adres', city: 'İstanbul', district: 'Kadıköy' }

  test('POS bilgileri yokken kartlı sipariş oluşturulmaz (503)', async ({ request }) => {
    test.skip(!!process.env.POS_CLIENT_ID, 'POS yapılandırılmış ortam')
    const res = await request.post('/api/orders', {
      data: { customer, items: [{ id: 'e2e-test-urunu-10w', quantity: 1 }], paymentMethod: 'card', acceptedTerms: true },
    })
    expect(res.status()).toBe(503)
    const body = await res.json()
    expect(body.code).toBe('CARD_UNAVAILABLE')
  })

  test('iptal sayfası adres çubuğundan keyfi metin göstermez', async ({ page }) => {
    await page.goto('/checkout/cancel?reason=Hesabiniz%20kapatildi&error=Sahte%20mesaj')
    await expect(page.locator('p[role=alert]')).toHaveCount(0)
    await expect(page.locator('body')).not.toContainText('Sahte mesaj')
  })

  test('imzasız banka dönüşü reddedilir, iptal sayfasına yönlenir', async ({ request }) => {
    const res = await request.post('/api/payments/pos/callback', {
      form: { oid: 'ORD-2026-00001', Response: 'Approved', ProcReturnCode: '00', mdStatus: '1', amount: '1.00' },
      maxRedirects: 0,
    })
    expect(res.status()).toBe(303)
    expect(res.headers()['location']).toContain('/checkout/cancel')
  })

  test('iptal sayfası banka hata mesajını gösterir, sepete dönüş sunar', async ({ page }) => {
    await page.goto('/checkout/cancel?reason=declined&order_id=ORD-2026-00009&cancelled=1')
    await expect(page.locator('p[role=alert]')).toContainText('Bankanız ödemeyi onaylamadı')
    await expect(page.locator('body')).toContainText('ORD-2026-00009 numaralı sipariş iptal edildi')
    await expect(page.getByRole('link', { name: 'Ödemeye Dön' })).toBeVisible()
  })

  test('ödeme sayfasında kart seçeneği 3D Secure açıklamasıyla görünür; footerda kart rozetleri', async ({ page }) => {
    await enableCard(page)
    await seedCart(page)
    await page.goto('/checkout')
    await page.locator('input[name=paymentMethod]').nth(1).check()
    await expect(page.locator('body')).toContainText('güvenli ödeme sayfasına yönlendirilirsiniz')
    await expect(page.locator('body')).not.toContainText('Stripe')
    const badges = page.getByRole('list', { name: 'Kabul edilen kartlar ve ödeme güvenliği' })
    await expect(badges).toContainText('VISA')
    await expect(badges).toContainText('troy')
  })
})

test.describe('kupon kodları', () => {
  // Ortak test kuponları: işçiler arasında yarış olmasın diye tek işçide sırayla
  test.describe.configure({ mode: 'serial' })
  // Test kuponu doğrudan geliştirme veritabanına yazılır, test sonunda silinir
  let prisma: import('@prisma/client').PrismaClient
  test.beforeAll(async () => {
    const { PrismaClient } = await import('@prisma/client')
    prisma = new PrismaClient()
    await prisma.coupon.deleteMany({ where: { code: { in: ['E2EYUZDE10', 'E2ELIMIT', 'E2EMIN'] } } })
    await prisma.coupon.createMany({
      data: [
        { code: 'E2EYUZDE10', type: 'PERCENT', value: 10, maxDiscount: 50 },
        { code: 'E2ELIMIT', type: 'FIXED', value: 20, usageLimit: 1, usedCount: 1 },
        { code: 'E2EMIN', type: 'FIXED', value: 20, minAmount: 5000 },
      ],
    })
  })
  test.afterAll(async () => {
    await prisma.coupon.deleteMany({ where: { code: { in: ['E2EYUZDE10', 'E2ELIMIT', 'E2EMIN'] } } })
    await prisma.$disconnect()
  })

  const preview = (request: import('@playwright/test').APIRequestContext, code: string, quantity = 2) =>
    request.post('/api/coupons/preview', { data: { code, items: [{ id: 'e2e-test-urunu-10w', quantity }] } })

  test('yüzde kupon küçük harfle de uygulanır, en fazla indirim sınırı geçerli', async ({ request }) => {
    const res = await preview(request, ' e2eyuzde10 ', 20)
    expect(res.status()).toBe(200)
    const body = await res.json()
    expect(body.couponCode).toBe('E2EYUZDE10')
    expect(body.discount).toBe(50)
  })

  test('kullanım sınırı dolan kupon reddedilir', async ({ request }) => {
    const res = await preview(request, 'E2ELIMIT')
    expect(res.status()).toBe(400)
    expect((await res.json()).error).toContain('limit')
  })

  test('en az sepet tutarı altında kupon reddedilir', async ({ request }) => {
    const res = await preview(request, 'E2EMIN')
    expect(res.status()).toBe(400)
    expect((await res.json()).error).toContain('en az')
  })

  test('yönetim paneli kupon API yetkisiz erişimi reddeder', async ({ request }) => {
    expect((await request.get('/api/admin/coupons')).status()).toBe(401)
    expect((await request.post('/api/admin/coupons', { data: { code: 'HACK', type: 'FIXED', value: 999 } })).status()).toBe(401)
  })
})
