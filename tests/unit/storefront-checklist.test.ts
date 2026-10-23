/**
 * Müşteri tarafı kontrol listesi (23.10.2026): uyumlu ürün voltaj kontrolü (madde 6), KDV dahil fiyat süzgeci (madde 4),
 * teklifli ürünlerin önerilmemesi ve voltaj sınıfı uyumsuz ürünlerin uyumlu listesine girmemesi.
 */
import { test } from 'node:test'
import assert from 'node:assert/strict'
import { isTechnicallyCompatible, voltageClasses } from '../../lib/compat'
import { grossInput, grossPrice, netFromGross } from '../../lib/store-config'
import { getComplementaryIds, mockProducts } from '../../lib/products-mock'

const vc = (name: string, extra: Record<string, unknown> = {}) => [...voltageClasses({ name, ...extra })].sort()

test('madde 6: sistem voltajı addan, varyant adından ve teknik özellikten okunur', () => {
  assert.deepEqual(vc('AFT Güç Katmanı 51,2 V 105 Ah'), ['48'])
  assert.deepEqual(vc('TommaTech Marine MRN1 12,8V 100Ah LiFePO4'), ['12'])
  assert.deepEqual(vc('AFT 5,4 kWh LFP Batarya 24/48 VDC'), ['24', '48'])
  assert.deepEqual(vc('Victron Phoenix 24/250 VE.Direct Tam Sinüs İnverter (24V 250VA, Schuko)'), ['24'])
  assert.deepEqual(vc('Havensis MPS Serisi 20A 12/24V MPPT Şarj Kontrol Cihazı (100V PV)'), ['12', '24'], 'panel girişi (PV) sayılmaz')
  assert.deepEqual(vc('İnverter 230V AC çıkış 12V'), ['12'], 'şebeke gerilimi sayılmaz')
  assert.deepEqual(vc('Hightech Power S HV BMS (AIO)'), ['HV'])
  assert.deepEqual(vc('Trio Hybrid S 12 kW LV AIO Hibrit İnverter'), ['48'])
  assert.deepEqual(vc('Marine MRN1 LiFePO4', { variants: [{ label: '12,8V 100Ah' }] }), ['12'])
  assert.deepEqual(vc('Sade inverter', { specifications: { 'Akü Voltajı': '48 V', 'AC Çıkış Gerilimi': '230 V' } }), ['48'])
})

test('madde 6: 51,2 V bataryaya 12 V inverter, 12,8 V aküye HV BMS uyumlu sayılmaz', () => {
  const battery48 = { name: 'AFT Güç Katmanı 51,2 V', category: 'Lityum Akü' }
  const marine12 = { name: 'Marine 12,8V 100Ah', category: 'Lityum Akü' }
  assert.equal(isTechnicallyCompatible(battery48, { name: 'New 1K 12V 1000W Akıllı İnverter', category: 'Tam Sinüs MPPT Akıllı İnverter' }), false)
  assert.equal(isTechnicallyCompatible(battery48, { name: 'New 5K 48V 5000W Akıllı İnverter', category: 'Tam Sinüs MPPT Akıllı İnverter' }), true)
  assert.equal(isTechnicallyCompatible(marine12, { name: 'Hightech Power S HV BMS', category: 'Batarya Yönetimi ve Aksesuar' }), false)
  // Voltajı okunamayan DC ürünü uyumlu diye önerilmez; DC dışı ürün (panel) kontrol edilmez
  assert.equal(isTechnicallyCompatible(marine12, { name: 'MPPT Şarj Kontrol Cihazı (30A / 40A)', category: 'MPPT Şarj Kontrol Cihazı' }), false)
  assert.equal(isTechnicallyCompatible(marine12, { name: 'TOPCon Panel 450Wp', category: 'TopCon Güneş Paneli' }), true)
})

test('madde 6: katalogda uyumlu öneriler voltaj sınıfı kesişen ürünlerden oluşur', () => {
  for (const p of mockProducts.filter((x) => x.category === 'Lityum Akü').slice(0, 40)) {
    for (const id of getComplementaryIds(p)) {
      const c = mockProducts.find((x) => x.id === id)!
      assert.ok(isTechnicallyCompatible(p, c), `${p.name} → ${c.name}`)
    }
  }
})

test('madde 4: fiyat süzgeci kutusu KDV dahil gösterir, süzgeç net fiyatla çalışır', () => {
  assert.equal(grossInput(515), '618')
  assert.equal(netFromGross(618), 515)
  assert.equal(grossPrice(515), 618)
  // Kutu tam TL gösterir: 7079 net → 8495 KDV dahil; sayfa sınırlara ±0,5 TL pay ekler
  const gross = Number(grossInput(7079))
  assert.ok(netFromGross(gross - 0.5) <= 7079 && netFromGross(gross + 0.5) >= 7079)
})
