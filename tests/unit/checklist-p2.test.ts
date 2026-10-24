/**
 * Müşteri kontrol listesi 2. öncelik (madde 10–17, 22): AFT tabloları, türetilmiş süzgeçler, karşılaştırma alan adları,
 * kullanım alanı uygunluğu ve iletişim talep türleri.
 */
import { test } from 'node:test'
import assert from 'node:assert/strict'
import { mockProducts } from '../../lib/products-mock'
import { withDetails } from '../../lib/catalog-details'
import { buildSpecFacets, derivedFacetValues, matchesSpecFilter, storageKwh } from '../../lib/spec-facets'
import { canonicalSpecKey, keysByCategory, missingKind, normalizeSpecs } from '../../lib/compare-specs'
import { PACKAGE_CATEGORIES, getPackageCategory } from '../../lib/package-categories'
import { fitsPackage, packageProductList } from '../../lib/package-fit'
import { voltageClasses } from '../../lib/compat'
import { composeSubject, contactHref, isContactTopic, productPrefill } from '../../lib/contact-topics'

const pool = mockProducts.map(withDetails)
const byId = (id: string) => pool.find((p) => p.id === id)!

test('madde 10–11: AFT tabloları modül/sistem ve model ayrımıyla', () => {
  const guc = byId('aft-guc-katmani-moduler-lifepo4-enerji-depolama-unitesi').specifications!
  assert.match(guc['Enerji'], /5,4 kWh \(tek modül\).*172 kWh/)
  assert.match(guc['Boyutlar'], /tek modül.*kabin sistemi/)
  assert.ok(guc['Yapılandırma'])
  const b54 = byId('aft-5-4-kwh-lifepo4-lfp-batarya').specifications!
  assert.equal(b54['Kapasite'], '206 Ah (24 V model) · 105 Ah (48 V model)')
  const b27 = byId('aft-2-7-kwh-lifepo4-lfp-batarya').specifications!
  assert.equal(b27['Kapasite'], '206 Ah (12 V model) · 105 Ah (24 V model)')
  // Voltaj sınıfları korunur (uyumlu ürün önerisi)
  assert.deepEqual([...voltageClasses(byId('aft-5-4-kwh-lifepo4-lfp-batarya'))].sort(), ['24', '48'])
})

test('madde 12: akü kategorisinde voltaj, kapasite, enerji ve kimya süzgeçleri', () => {
  const akuler = pool.filter((p) => ['Lityum Akü', 'Jel Akü', 'Batarya Yönetimi ve Aksesuar', 'Taşınabilir Güç İstasyonu'].includes(p.category))
  const keys = buildSpecFacets(akuler).map((f) => f.key)
  for (const k of ['Sistem voltajı', 'Kapasite (Ah)', 'Enerji (kWh)', 'Kimya']) assert.ok(keys.includes(k), `${k} yok: ${keys.join(', ')}`)
  const inverters = pool.filter((p) => p.category === 'Hibrit İnverter')
  assert.ok(buildSpecFacets(inverters).some((f) => f.key === 'Güç'))
  const panels = pool.filter((p) => p.category.includes('Panel'))
  assert.ok(buildSpecFacets(panels).some((f) => f.key === 'Hücre tipi'))
})

test('madde 12: türetilmiş değerler ve süzme', () => {
  const marine = { name: 'Marine 12,8V 100Ah LiFePO4 Lityum Akü', category: 'Lityum Akü' }
  const v = derivedFacetValues(marine)
  assert.deepEqual(v['Sistem voltajı'], ['12 V'])
  assert.deepEqual(v['Kapasite (Ah)'], ['51–100 Ah'])
  assert.deepEqual(v['Kimya'], ['LiFePO4 (LFP)'])
  // kWh yazmayan tek voltajlı akü: 12,8 V × 100 Ah ≈ 1,28 kWh
  assert.ok(Math.abs(storageKwh(marine)[0] - 1.28) < 0.01)
  assert.equal(matchesSpecFilter(marine, 'Sistem voltajı', ['12 V']), true)
  assert.equal(matchesSpecFilter(marine, 'Sistem voltajı', ['48 V']), false)
  // Ham özellik süzgeci eskisi gibi çalışır
  assert.equal(matchesSpecFilter({ specifications: { Protokol: 'OCPP 1.6' } }, 'Protokol', ['OCPP 1.6']), true)
  assert.equal(matchesSpecFilter({ specifications: {} }, 'Protokol', []), true)
})

test('madde 13: karşılaştırmada ortak alan adları ve eksik/uygulanamaz ayrımı', () => {
  assert.equal(canonicalSpecKey('Nominal Voltaj'), 'Nominal gerilim')
  assert.equal(canonicalSpecKey('Artırılabilir Kapasite'), 'Kapasite')
  const n = normalizeSpecs({ Uzunluk: '400 mm', Genişlik: '391 mm', Yükseklik: '365 mm', 'Batarya Ömrü': '6000 Çevrim' })
  assert.equal(n['Boyutlar (U × G × Y)'], '400 × 391 × 365 mm')
  assert.equal(n['Çevrim ömrü'], '6000 Çevrim')
  const mixed = normalizeSpecs({ Uzunluk: '400 / 860 mm', Genişlik: '391 mm', Yükseklik: '365 mm' })
  assert.match(mixed['Boyutlar (U × G × Y)'], /^U: 400 \/ 860 mm · G: 391 mm · Y: 365 mm$/)
  const cats = keysByCategory([{ category: 'Lityum Akü', specifications: { Kapasite: '100 Ah' } }, { category: 'Kablo', specifications: { Kesit: '6 mm²' } }])
  assert.equal(missingKind('Lityum Akü', 'Kapasite', cats), 'unspecified')
  assert.equal(missingKind('Kablo', 'Kapasite', cats), 'not-applicable')
})

test('madde 15: karavan ve marinde HV, büyük depolama ve raf sistemi yok', () => {
  for (const slug of ['karavan-paketleri', 'marin-paketleri']) {
    const item = getPackageCategory(slug)!
    const list = packageProductList(item, pool)
    assert.ok(list.length >= 8, `${slug}: ${list.length}`)
    for (const p of list) {
      assert.ok(!voltageClasses(p).has('HV') || voltageClasses(p).has('12') || voltageClasses(p).has('24'), `${slug}: ${p.name}`)
      assert.ok(!/rack|modüler|alt taban|kabin/i.test(p.name), `${slug}: ${p.name}`)
      const kwh = storageKwh(p)
      if (kwh.length) assert.ok(Math.min(...kwh) <= item.fit!.maxKwh!, `${slug}: ${p.name}`)
    }
  }
  const villa = getPackageCategory('villa-paketleri')!
  assert.equal(fitsPackage({ ...byId(pool.find((p) => p.category === 'Lityum Akü' && /12,8V/.test(p.name))!.id) }, villa), false)
  // Uygunluk kuralı olmayan sulama sayfası kategorinin tamamından seçer
  assert.ok(packageProductList(getPackageCategory('sulama-paketleri')!, pool).length > 0)
  // Hiçbir kullanım alanı başlığında "Paket" iddiası kalmadı
  for (const item of PACKAGE_CATEGORIES) assert.ok(!/paket/i.test(item.title + item.description + item.seoTitle), item.slug)
})

test('madde 17: talep türü konuya eklenir, ürünle açılan form hazır gelir', () => {
  assert.equal(composeSubject('urun', 'AFT 5,4 kWh'), 'Ürün teklifi: AFT 5,4 kWh')
  assert.equal(composeSubject('urun', 'Ürün teklifi: AFT'), 'Ürün teklifi: AFT')
  assert.equal(composeSubject('', 'Merhaba'), 'Merhaba')
  assert.equal(isContactTopic('destek'), true)
  assert.equal(isContactTopic('x'), false)
  assert.equal(contactHref('urun', { productId: 'aft-5-4' }), '/contact?talep=urun&urun=aft-5-4')
  assert.match(productPrefill({ name: 'AFT', sku: 'AFT-1' }).message, /^Ürün: AFT \(AFT-1\)\nAdet:/)
})
