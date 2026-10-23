/**
 * Yönetim paneli denetimi A01–A05 kapanış senaryoları (saf hesaplar).
 */
import { test } from 'node:test'
import assert from 'node:assert/strict'
import { addDaysToKey, businessDateKey, businessDayRange, businessDayStart, businessDayStartOf, businessMonthStart, isDateKey } from '../../lib/business-time'
import { isCollectedOrder } from '../../lib/revenue'
import { applyVariantStock, lineStock, parseStockKey, stockKeyFor, variantStockKey } from '../../lib/variant-stock'
import { compactCode, matchProduct } from '../../lib/admin-product-search'
import { effectivePriceMode } from '../../lib/catalog-merge'

// ── A02: gün sınırı Türkiye saatine göre ──────────────────────────────────

test('A02: 22 Ekim 23.59 ve 23 Ekim 00.01 (TR) ayrı günlere düşer', () => {
  assert.equal(businessDateKey(new Date('2026-10-22T23:59:00+03:00')), '2026-10-22')
  assert.equal(businessDateKey(new Date('2026-10-23T00:01:00+03:00')), '2026-10-23')
  // Sunucu UTC iken 21.30Z, Türkiye'de ertesi gün 00.30'dur
  assert.equal(businessDateKey(new Date('2026-10-22T21:30:00Z')), '2026-10-23')
})

test('A02: gün ve ay başlangıcı İstanbul gece yarısıdır', () => {
  const now = new Date('2026-10-22T22:15:00Z') // TR 23 Ekim 01.15
  assert.equal(businessDayStart(now).toISOString(), '2026-10-22T21:00:00.000Z')
  assert.equal(businessMonthStart(now).toISOString(), '2026-09-30T21:00:00.000Z')
  assert.equal(businessDayStartOf('2027-01-01').toISOString(), '2026-12-31T21:00:00.000Z')
})

test('A02: "Bugün" yalnız bugünü, 30 gün bugün dahil 30 günü kapsar; ay ve yıl sonu', () => {
  const now = new Date('2026-10-22T21:30:00Z')
  const today = businessDayRange(1, now)
  assert.deepEqual(today.keys, ['2026-10-23'])
  assert.equal(today.start.toISOString(), '2026-10-22T21:00:00.000Z')
  const m = businessDayRange(30, now)
  assert.equal(m.keys.length, 30)
  assert.equal(m.keys[0], '2026-09-24')
  assert.equal(m.keys[29], '2026-10-23')
  assert.equal(addDaysToKey('2026-12-31', 1), '2027-01-01')
  assert.equal(addDaysToKey('2026-03-01', -1), '2026-02-28')
})

test('A02: geçersiz tarih anahtarı reddedilir', () => {
  assert.equal(isDateKey('2026-10-23'), true)
  assert.equal(isDateKey('2026-02-30'), false)
  assert.equal(isDateKey('23.10.2026'), false)
  assert.equal(isDateKey(null), false)
})

// ── A01: tahsilat tanımı ─────────────────────────────────────────────────

test('A01: ödeme bekleyen, iptal ve iade edilen sipariş tahsilata girmez', () => {
  assert.equal(isCollectedOrder({ paymentStatus: 'PENDING', status: 'PENDING' }), false)
  assert.equal(isCollectedOrder({ paymentStatus: 'PAID', status: 'PAID' }), true)
  assert.equal(isCollectedOrder({ paymentStatus: 'PARTIALLY_REFUNDED', status: 'DELIVERED' }), true)
  assert.equal(isCollectedOrder({ paymentStatus: 'REFUNDED', status: 'DELIVERED' }), false)
  assert.equal(isCollectedOrder({ paymentStatus: 'PAID', status: 'CANCELLED' }), false)
  assert.equal(isCollectedOrder({ paymentStatus: 'PAID', status: 'RETURNED' }), false)
})

// ── A03: varyant bazında stok ────────────────────────────────────────────

const panel = () => ({
  id: 'tommatech-450-600',
  stock: 17,
  variants: [{ key: 'w450' }, { key: 'w600' }] as { key: string; stock?: number }[],
  variantStock: undefined as boolean | undefined,
})

test('A03: 450 Wp stoğu 2, 600 Wp stoğu 0 → yalnız 450 Wp satılabilir', () => {
  const p = applyVariantStock(panel(), true, new Map([[variantStockKey('tommatech-450-600', 'w450'), 2]]))
  assert.equal(p.variantStock, true)
  assert.equal(p.stock, 2, 'ürün stoğu varyant toplamı')
  assert.equal(lineStock(p, 'w450'), 2)
  assert.equal(lineStock(p, 'w600'), 0, 'satırı olmayan varyant stoksuz')
  assert.equal(stockKeyFor(p, 'w450'), 'tommatech-450-600::w450')
  assert.notEqual(stockKeyFor(p, 'w450'), stockKeyFor(p, 'w600'), 'bir varyantın satışı diğerinin stoğunu düşürmez')
})

test('A03: ayrı stok kapalıyken varyantlar ürün stoğunu paylaşır (eski davranış)', () => {
  const p = applyVariantStock(panel(), false, new Map([['tommatech-450-600::w450', 2]]))
  assert.equal(p.variantStock, undefined)
  assert.equal(p.stock, 17)
  assert.equal(lineStock(p, 'w450'), 17)
  assert.equal(stockKeyFor(p, 'w450'), 'tommatech-450-600')
  assert.equal(p.variants[0].stock, undefined)
})

test('A03: stok anahtarı çözülür (tireli ürün id’leri dahil)', () => {
  assert.deepEqual(parseStockKey('a-b-c::w600'), { productId: 'a-b-c', variantKey: 'w600' })
  assert.deepEqual(parseStockKey('a-b-c'), { productId: 'a-b-c' })
})

// ── A04: varyant SKU araması ─────────────────────────────────────────────

const tomma = {
  id: 'tommatech-16bb-topcon',
  name: 'TommaTech 16BB TOPCon 450/600 Wp Güneş Paneli',
  sku: 'TOMMAT-TT450108TN10-00071',
  brand: 'TommaTech',
  variants: [
    { key: 'w450', label: '450Wp', sku: 'TOMMAT-TT450108TN10-00071' },
    { key: 'w600', label: '600Wp', sku: 'TOMMAT-TT600144TN10-00073' },
  ],
}

test('A04: tam varyant SKU ürünü getirir ve eşleşen varyantı belirtir', () => {
  const m = matchProduct(tomma, 'TOMMAT-TT600144TN10-00073')
  assert.equal(m?.field, 'variant-sku')
  assert.equal(m?.variant?.key, 'w600')
  // küçük harf, boşluk ve farklı ayırıcı
  assert.equal(matchProduct(tomma, 'tommat tt600144tn10 00073')?.variant?.key, 'w600')
})

test('A04: ana SKU, varyant adı, marka ve bulunamayan kod', () => {
  assert.ok(matchProduct(tomma, 'TOMMAT-TT450108TN10-00071'))
  assert.equal(matchProduct(tomma, '600Wp')?.variant?.key, 'w600')
  assert.equal(matchProduct(tomma, '600 wp')?.variant?.key, 'w600')
  assert.equal(matchProduct(tomma, 'tommatech')?.field, 'name')
  assert.equal(matchProduct(tomma, 'TOMMAT-TT999999'), null)
  assert.equal(compactCode('TT-600/144 tn'), 'tt600144tn')
})

// ── A05: fiyatlandırma modu ──────────────────────────────────────────────

test('A05: mod değiştirilmeden kurla fiyatlanan ürün dövize bağlı kalır', () => {
  const usd = { priceCurrency: 'USD' as const, basePrice: 120 }
  assert.equal(effectivePriceMode(usd), 'fx')
  assert.equal(effectivePriceMode(usd, { price: null, priceMode: null }), 'fx')
  // Eski kayıt: panelde TL fiyat girilmiş → sabit TL
  assert.equal(effectivePriceMode(usd, { price: 5000, priceMode: null }), 'fixed')
  // Açık seçim her zaman geçerli; dövize dönüşte kayıtlı TL fiyat yok sayılır
  assert.equal(effectivePriceMode(usd, { price: 5000, priceMode: 'fx' }), 'fx')
  assert.equal(effectivePriceMode(usd, { price: null, priceMode: 'fixed' }), 'fixed')
  // Döviz fiyatı olmayan ürün yalnız sabit TL
  assert.equal(effectivePriceMode({ priceCurrency: 'TRY', basePrice: undefined }, { priceMode: 'fx' }), 'fixed')
})

test('A05: katalog ürünlerinin döviz fiyatı ayrıntı dosyasından gelir; ürün dövize bağlı görünür', async () => {
  const { mockProducts } = await import('../../lib/products-mock')
  const { withDetails } = await import('../../lib/catalog-details')
  const raw = mockProducts.find((p) => p.id === 'tommatech-16bb-topcon-gunes-paneli-450wp-600wp')!
  assert.equal(raw.basePrice, undefined, 'ham kayıtta döviz fiyatı yok')
  const detailed = withDetails(raw)
  assert.equal(typeof detailed.basePrice, 'number')
  assert.equal(effectivePriceMode(detailed), 'fx')
})
