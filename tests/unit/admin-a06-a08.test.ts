/**
 * Yönetim paneli denetimi A06–A08 kapanış senaryoları (saf hesaplar).
 */
import { test } from 'node:test'
import assert from 'node:assert/strict'
import { cartLogistics, lineLogistics, packageDesi, panelLineLogistics, quoteShipping } from '../../lib/shipping/fee'
import { sanitizeCost, sanitizeLogistics, sanitizeNewProductCurrency } from '../../lib/product-admin-fields'
import { publishProblems } from '../../lib/product-publish'
import { canSeeCost } from '../../lib/admin-users'

// ── A06: para birimi ve maliyet ──────────────────────────────────────────

test('A06: yeni ürün USD/EUR ile dövize bağlı, TL ile sabit oluşturulur', () => {
  assert.deepEqual(sanitizeNewProductCurrency({ priceCurrency: 'USD', basePrice: '120,5'.replace(',', '.') }), { priceCurrency: 'USD', basePrice: 120.5 })
  assert.deepEqual(sanitizeNewProductCurrency({}), { priceCurrency: 'TRY', basePrice: null })
  assert.ok('error' in sanitizeNewProductCurrency({ priceCurrency: 'USD' }), 'döviz fiyatı zorunlu')
  assert.ok('error' in sanitizeNewProductCurrency({ priceCurrency: 'GBP', basePrice: 10 }))
})

test('A06: maliyet yalnız Sahip/Yönetici için yazılır; tutar işlem kaydına girmez', () => {
  assert.equal(canSeeCost('owner'), true)
  assert.equal(canSeeCost('manager'), true)
  assert.equal(canSeeCost('editor'), false)
  assert.equal(canSeeCost('operator'), false)
  const denied = sanitizeCost({ costPrice: 100 }, false)
  assert.ok(!('error' in denied) && Object.keys(denied.data).length === 0, 'yetkisiz rolün gönderdiği maliyet yok sayılır')
  const ok = sanitizeCost({ costPrice: 100, costCurrency: 'USD', targetMargin: 25 }, true)
  assert.ok(!('error' in ok))
  if (!('error' in ok)) {
    assert.deepEqual(ok.data, { costPrice: 100, costCurrency: 'USD', targetMargin: 25 })
    assert.ok(ok.audit.every((a) => !a.includes('100')))
  }
  assert.ok('error' in sanitizeCost({ targetMargin: 100 }, true))
  assert.ok('error' in sanitizeCost({ costPrice: -5 }, true))
})

// ── A07: lojistik ────────────────────────────────────────────────────────

test('A07: desi = koli sayısı × max(hacim/3000, kg), koli başına yukarı yuvarlanır', () => {
  assert.equal(packageDesi([30, 20, 10], 0.5), 2) // küçük aksesuar: 6000/3000 = 2
  assert.equal(packageDesi([120, 80, 100], 490), 490) // ağır cihaz: ağırlık baskın
  assert.equal(packageDesi([200, 100, 120], 80, 2), 1600) // paletli iki koli: 800 desi × 2
  assert.equal(packageDesi(null, 3.2), 4)
})

test('A07: panel lojistiği desi.json yerine kargo hesabına girer; ağır parça ve kurulum', () => {
  const small = panelLineLogistics({ logisticsSource: 'panel', desi: 2, weightKg: 0.5, packageCount: 1 })
  assert.deepEqual(small, { desi: 2, kg: 0.5 })
  const heavy = lineLogistics('yok-boyle-urun', undefined, { desi: 490, kg: 490 })
  assert.equal(heavy.heavyPieces, 1)
  assert.equal(heavy.heavyKgPieces, 1)
  // Panel lojistiği olmayan ve desi.json'da bulunmayan ürün eskisi gibi 0 desi
  assert.equal(panelLineLogistics({ desi: 5 }), undefined)
  // Kurulumlu ürün kargoya girmez; yalnız kurulumlu sepette kargo ücreti yok
  const install = panelLineLogistics({ logisticsSource: 'panel', desi: 50, weightKg: 40, saleMode: 'install' })
  assert.deepEqual(install, { desi: 0, kg: 0, install: true })
  const cart = cartLogistics([{ id: 'x', quantity: 1, logistics: install }])
  assert.equal(cart.installOnly, true)
  assert.equal(quoteShipping(cart).fee, 0)
  // Ölçü değişikliği sepet hesabını değiştirir
  const a = cartLogistics([{ id: 'x', quantity: 2, logistics: { desi: 2, kg: 0.5 } }])
  const b = cartLogistics([{ id: 'x', quantity: 2, logistics: { desi: 30, kg: 12 } }])
  assert.equal(a.desi, 4)
  assert.equal(b.desi, 60)
  assert.ok(quoteShipping(b).fee > quoteShipping(a).fee)
})

test('A07: geçersiz lojistik reddedilir; gönderilmeyen alan mevcut değerden alınır', () => {
  assert.ok('error' in sanitizeLogistics({ dimensionsCm: [10, 0, 5] }, {}))
  assert.ok('error' in sanitizeLogistics({ packageCount: 0 }, {}))
  assert.ok('error' in sanitizeLogistics({ saleMode: 'uçak' }, {}))
  const r = sanitizeLogistics({ weightKg: 12 }, { dimensionsCm: [40, 30, 20], packageCount: 1, desi: 8 })
  assert.ok(!('error' in r))
  if (!('error' in r)) {
    assert.equal(r.data.desi, 12)
    assert.ok(r.audit.includes('Desi: 8 → 12'))
  }
})

// ── A08: taslak ve yayın ─────────────────────────────────────────────────

test('A08: eksik taslak yayına alınamaz; eksikler adlarıyla listelenir', () => {
  const draft = { name: 'Yeni inverter', category: 'Hibrit İnverter', price: 0, images: [], desi: null, weightKg: null }
  assert.deepEqual(publishProblems(draft), ['Fiyat', 'En az bir görsel', 'Kargo bilgisi (koli ölçüsü ve ağırlık)'])
  const ready = { ...draft, price: 15000, images: ['/media/products/a.webp'], desi: 12, weightKg: 10 }
  assert.deepEqual(publishProblems(ready), [])
  // Dövizli üründe döviz fiyatı aranır; kurulumlu üründe kargo bilgisi aranmaz; teklifli üründe fiyat aranmaz
  assert.deepEqual(publishProblems({ ...ready, price: 0, priceCurrency: 'USD', basePrice: 300 }), [])
  assert.deepEqual(publishProblems({ ...ready, desi: null, weightKg: null, saleMode: 'install' }), [])
  assert.deepEqual(publishProblems({ ...ready, price: 0, desi: null, saleMode: 'quote' }), [])
  assert.ok(publishProblems({ ...ready, variants: [{ label: '5 kW', price: 0 }] }).includes('Varyant fiyatları'))
})
