/**
 * Yerel staging testlerinde (kontrol listesi 23–34) bulunan hataların düzeltmeleri: eski iKAS kök adresleri,
 * kurulumlu siparişin e-posta notu ve yönetici bildirim alıcısı.
 */
import { test } from 'node:test'
import assert from 'node:assert/strict'
import fs from 'node:fs'
import path from 'node:path'
import { orderHasInstall } from '../../lib/order-install'
import { adminNotifyEmail } from '../../lib/store-config'

type Redirect = { source: string; destination: string; permanent: boolean }

test('32: katalogdaki her ürünün kök adresi ürün sayfasına; uygulama sayfalarıyla çakışma yok; kaldırılanlar kategoriye', async () => {
  // eslint-disable-next-line @typescript-eslint/no-require-imports
  const cfg = require('../../next.config.js') as { redirects?: () => Promise<Redirect[]> }
  assert.ok(cfg.redirects, 'redirects tanımlı')
  const list = await cfg.redirects!()
  const bySource = new Map(list.map((r) => [r.source, r]))
  const raw = JSON.parse(fs.readFileSync('lib/catalog/products.json', 'utf8'))
  const products: { id: string }[] = Array.isArray(raw) ? raw : raw.products
  for (const p of products) {
    const r = bySource.get(`/${p.id}`)
    assert.ok(r, `kök yönlendirme yok: ${p.id}`)
    assert.equal(r!.permanent, true)
  }
  const appRoutes = new Set(fs.readdirSync('app').filter((d) => fs.statSync(path.join('app', d)).isDirectory()).map((d) => `/${d}`))
  const clash = list.filter((r) => appRoutes.has(r.source))
  assert.deepEqual(clash, [], 'uygulama sayfasının üstüne yazan yönlendirme')
  assert.equal(bySource.get('/victron-multiplus-ii-48-3000-35-50-inverter-sarj-cihazi-48v-3000va-120v-ul-1741')?.destination, '/category/solar-inverter')
  assert.equal(bySource.get('/products/victron-blue-smart-ip67-24-8-aku-sarj-cihazi-24v-8a-1-cikis-120v')?.destination, '/category/solar-sarj-kontrol')
})

test('26: kurulumlu ürün içeren sipariş e-postası notu', () => {
  const line = (productId: string, variantKey?: string, logistics?: { desi: number; kg: number; install?: boolean }) =>
    ({ quantity: 1, variantMatrix: { productId, ...(variantKey ? { variantKey } : {}), ...(logistics ? { logistics } : {}) } }) as never
  assert.equal(orderHasInstall({ lines: [line('aft-dc-hizli-elektrikli-arac-sarj-istasyonu-45-180kw', 'aftgc45')] }), true)
  assert.equal(orderHasInstall({ lines: [line('tommatech-v-serisi-guc-istasyonu-panel-baglanti-kablosu-mc4-xt60')] }), false)
  // Panel lojistiği (ProductOverride) sipariş anında satıra yazılır ve önceliklidir
  assert.equal(orderHasInstall({ lines: [line('panel-urunu', undefined, { desi: 10, kg: 5, install: true })] }), true)
})

test('30: yönetici bildirimleri tek alıcıda: ADMIN_EMAIL, yoksa gönderen kutusu', () => {
  const keep = { a: process.env.ADMIN_EMAIL, s: process.env.SMTP_EMAIL, u: process.env.SMTP_USER }
  try {
    process.env.ADMIN_EMAIL = 'yonetim@ornek.com.tr'
    process.env.SMTP_EMAIL = 'gonderen@ornek.com.tr'
    assert.equal(adminNotifyEmail(), 'yonetim@ornek.com.tr')
    delete process.env.ADMIN_EMAIL
    assert.equal(adminNotifyEmail(), 'gonderen@ornek.com.tr')
  } finally {
    for (const [k, v] of [['ADMIN_EMAIL', keep.a], ['SMTP_EMAIL', keep.s], ['SMTP_USER', keep.u]] as const) {
      if (v === undefined) delete process.env[k]
      else process.env[k] = v
    }
  }
})
