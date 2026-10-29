/**
 * Akü / batarya gönderim kısıtı: çevrim içi satılmaz, iletişim yolu gösterilir (lib/shipping/battery.ts).
 * Çalıştırma: npm run test:unit
 */
import { test } from 'node:test'
import assert from 'node:assert/strict'
import { BATTERY_CONTACT_ONLY, isBatteryCategory, isContactOnlyLine, isContactOnlyProduct } from '../../lib/shipping/battery'
import { localizeServerError } from '../../lib/server-error-i18n'
import desi from '../../lib/catalog/desi.json'

test('akü kategorileri iletişimle satılır', () => {
  assert.equal(BATTERY_CONTACT_ONLY, true)
  for (const c of ['Lityum Akü', 'Jel Akü', 'Taşınabilir Güç İstasyonu']) {
    assert.equal(isBatteryCategory(c), true)
    assert.equal(isContactOnlyProduct({ category: c }), true)
  }
  // BMS ve aksesuarlar, şarj cihazları akü değil
  for (const c of ['Batarya Yönetimi ve Aksesuar', 'Akü Şarj Cihazı', 'Güneş Paneli', undefined, null]) {
    assert.equal(isContactOnlyProduct({ category: c }), false)
  }
})

test('sepet satırı: desi.json akü işaretiyle (varyant satırı dahil)', () => {
  const map = desi as unknown as Record<string, [number, number, number?]>
  const battery = Object.keys(map).filter((k) => map[k][2] === 1)
  const other = Object.keys(map).find((k) => map[k].length === 2)!
  assert.ok(battery.length >= 25)
  for (const id of battery) assert.equal(isContactOnlyLine(id), true, id)
  assert.equal(isContactOnlyLine(other), false)
  assert.equal(isContactOnlyLine('olmayan-urun'), false)
})

test('sunucu hata mesajı İngilizceye çevrilir', () => {
  const tr = '"Apex 51,2V 100Ah LiFePO4 Lityum Akü" çevrim içi sipariş edilemiyor. Akü ve bataryalarda kargo ücreti teklifle belirlenir; lütfen teklif alın.'
  assert.equal(localizeServerError(tr, 'tr'), tr)
  assert.match(localizeServerError(tr, 'en') ?? '', /cannot be ordered online/)
})
