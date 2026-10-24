/**
 * Sistem voltajı (uyumlu ürün önerisi): panel değeri → veri dosyası → ad/özellik sırası, "voltajdan bağımsız",
 * panel girdisinin doğrulanması ve sunucudaki ilişkili ürün hesabı.
 */
import { test } from 'node:test'
import assert from 'node:assert/strict'
import { describeFallbackVoltage, hasKnownVoltage, isTechnicallyCompatible, sanitizeSystemVoltage, systemVoltageOf, voltageClasses, DC_SYSTEM_CATEGORIES } from '../../lib/compat'
import { mockProducts, type MockProduct } from '../../lib/products-mock'
import { withDetails } from '../../lib/catalog-details'
import { relatedProductIds } from '../../lib/related-products'
import voltageMap from '../../lib/catalog/system-voltage.json'

const akü12 = { name: 'Lityum Akü 12,8V 100Ah', category: 'Lityum Akü' }
const akü48 = { name: 'Lityum Akü 51,2V 100Ah', category: 'Lityum Akü' }
const bilinmeyen = { name: 'Akıllı İnverter 3000W', category: 'Tam Sinüs İnverter' }

test('panel değeri addan okunanın önüne geçer', () => {
  assert.deepEqual([...voltageClasses({ ...akü12, systemVoltage: ['48'] })], ['48'])
  assert.equal(systemVoltageOf({ ...akü12, systemVoltage: ['48'] }).any, false)
  assert.equal(isTechnicallyCompatible({ ...bilinmeyen, systemVoltage: ['48'] }, akü48), true)
  assert.equal(isTechnicallyCompatible({ ...bilinmeyen, systemVoltage: ['24'] }, akü48), false)
})

test('voltajı bilinmeyen DC ürünü uyumlu önerilmez; "any" her voltajla uyumludur', () => {
  assert.equal(hasKnownVoltage(bilinmeyen), false)
  assert.equal(isTechnicallyCompatible(bilinmeyen, akü12), false)
  const kablo = { ...bilinmeyen, category: 'Batarya Yönetimi ve Aksesuar', systemVoltage: ['any'] }
  assert.equal(hasKnownVoltage(kablo), true)
  assert.equal(isTechnicallyCompatible(kablo, akü12), true)
  assert.equal(isTechnicallyCompatible(akü48, kablo), true)
  // "any" tek başına bile bilinmeyen ürünle eşleşir (aksesuar)
  assert.equal(isTechnicallyCompatible(kablo, bilinmeyen), true)
})

test('veri dosyasındaki ürünler id ile tanınır', () => {
  const pwm = mockProducts.find((p) => p.id === 'electrozirve-hp2410-10a-pwm-sarj-kontrol-cihazi')
  assert.ok(pwm, 'veri dosyasındaki ürün katalogda olmalı')
  assert.deepEqual([...voltageClasses(pwm!)].sort(), ['12', '24'])
  assert.deepEqual(describeFallbackVoltage(pwm!), { any: false, classes: ['12', '24'], source: 'veri' })
  const kablo = mockProducts.find((p) => p.id === 'tommatech-tpe-50-mm2-kirmizi-batarya-guc-kablosu-1-5-m')
  assert.ok(kablo)
  assert.equal(systemVoltageOf(kablo!).any, true)
})

test('veri dosyasının her kaydı katalogda var ve geçerli', () => {
  const ids = new Set(mockProducts.map((p) => p.id))
  for (const [id, row] of Object.entries(voltageMap as Record<string, unknown>)) {
    if (id.startsWith('_')) continue
    assert.ok(ids.has(id), `katalogda yok: ${id}`)
    const v = (row as { v: unknown }).v
    assert.ok(v === 'any' || (Array.isArray(v) && v.length && v.every((x) => ['12', '24', '48', 'HV'].includes(x))), `geçersiz: ${id}`)
  }
})

test('veri dosyasıyla voltajı tanımsız DC ürünü sayısı azalır (38 → 20)', () => {
  const unknown = mockProducts.map(withDetails).filter((p) => DC_SYSTEM_CATEGORIES.has(p.category) && !hasKnownVoltage(p))
  assert.ok(unknown.length <= 20, `tanımsız: ${unknown.length}`)
})

test('panel girdisi doğrulanır', () => {
  assert.deepEqual(sanitizeSystemVoltage(['48', '12', '12']), { value: ['12', '48'] })
  assert.deepEqual(sanitizeSystemVoltage([]), { value: null })
  assert.deepEqual(sanitizeSystemVoltage(null), { value: null })
  assert.deepEqual(sanitizeSystemVoltage(['any']), { value: ['any'] })
  assert.ok('error' in sanitizeSystemVoltage(['any', '12']))
  assert.ok('error' in sanitizeSystemVoltage(['36']))
  assert.ok('error' in sanitizeSystemVoltage('12'))
})

test('ilişkili ürünler verilen havuzdan ve paneldeki voltajla hesaplanır', () => {
  const pool = mockProducts.map(withDetails) as MockProduct[]
  const inv = pool.find((p) => DC_SYSTEM_CATEGORIES.has(p.category) && p.category.includes('İnverter') && !hasKnownVoltage(p))
  assert.ok(inv, 'voltajı tanımsız bir inverter olmalı')
  const before = relatedProductIds(inv!, pool)
  // Uyumlu listede DC ürünü yok (voltajı bilinmiyor); öneriler yine dolu
  assert.ok(before.compatible.every((id) => !DC_SYSTEM_CATEGORIES.has(pool.find((p) => p.id === id)!.category)))
  assert.ok(before.recommended.length >= 5)
  const after = relatedProductIds({ ...inv!, systemVoltage: ['12'] }, pool)
  const dc = after.compatible.map((id) => pool.find((p) => p.id === id)!).filter((p) => DC_SYSTEM_CATEGORIES.has(p.category))
  assert.ok(dc.length > 0, 'panelde 12 V girilince DC uyumlu ürün çıkmalı')
  for (const p of dc) assert.ok(isTechnicallyCompatible({ ...inv!, systemVoltage: ['12'] }, p))
})
