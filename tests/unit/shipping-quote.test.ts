/**
 * Kargo teklifi: Geliver (önceki firma listesi) ve Navlungo (Domestic Fiyat Teklifi 2026) kıyası.
 * Çalıştırma: npm run test:unit
 */
import { test } from 'node:test'
import assert from 'node:assert/strict'
import { geliverQuote, navlungoQuotes, quoteShipping, cartLogistics } from '../../lib/shipping/fee'
import { matchCarrier } from '../../lib/bulk-shipping'

const nav = (desi: number, kg = 1, extra = {}) =>
  Object.fromEntries(navlungoQuotes({ desi: Math.ceil(desi), kg, desiExact: desi, ...extra }).map((c) => [c.carrierId, c.fee]))

test('Geliver: en iyi fiyat listesi + vergiler %22,35, firma koşulları', () => {
  const g0 = geliverQuote({ desi: 0, kg: 0 })
  assert.equal(g0.fee, 110.42) // 90,25 × 1,2235 (Sürat)
  assert.equal(g0.carrierId, 'surat')
  assert.equal(geliverQuote({ desi: 5, kg: 1 }).carrierId, 'kolaygelsin')
  assert.equal(geliverQuote({ desi: 35, kg: 1 }).fee, 448.11) // (266,25 + 5×20) × 1,2235, firma belirtilmez
  assert.equal(geliverQuote({ desi: 35, kg: 1 }).carrierId, null)
  // Kolay Gelsin 30 kg üstünü almıyor: listede başka firma fiyatı olmadığından teklif yok
  assert.equal(geliverQuote({ desi: 20, kg: 31 }).fee, null)
  // Ağır parça: teklif yok
  assert.equal(geliverQuote({ desi: 120, kg: 50, heavyPieces: 1 }).fee, null)
})

test('Navlungo: taşıyıcı basamakları (KDV ve EPH dahil)', () => {
  const a = nav(2.1)
  assert.equal(a.aras, 119)
  assert.equal(a.hepsijet, 109)
  assert.equal(a.surat, 127)
  assert.equal(a.yurtici, 219) // 1,1–3,1
  assert.equal(a.kolaygelsin, 150)
  assert.equal(a.ptt, 106) // tam sayı aralığı: 2,1 → 3 desi
  assert.equal(a['hepsijet-xl'], null) // 42 desi altı
  assert.equal(nav(2).ptt, 99)
  assert.equal(nav(31).aras, 492) // 479 + 1 × 13
  assert.equal(nav(31).ptt, null) // PTT 30 desi üstü fiyat vermiyor
  assert.equal(nav(41).hepsijet, null) // hepsiJET en fazla 40,1 desi
  assert.equal(nav(45)['hepsijet-xl'], 945) // 45 × 21
  assert.equal(nav(10, 26).hepsijet, null) // paket başı en fazla 25 kg
})

test('Navlungo: ağır taşıma tek parça 100 desiyi aşınca, parça başına', () => {
  const one = nav(120, 60, { heavyPieces: 1 })
  assert.equal(one.aras, 479 + 90 * 13 + 5610)
  assert.equal(one.kolaygelsin, null) // ağır taşıma yok
  assert.equal(one['hepsijet-xl'], 120 * 21) // XL'de sınır yok
  // Toplam 120 desi ama hiçbir parça 100'ü aşmıyor: ağır bedel yok
  assert.equal(nav(120, 60).aras, 479 + 90 * 13)
})

test('Teklif: en ucuz seçilir, akülü sepette yalnızca Navlungo', () => {
  const q = quoteShipping({ desi: 2, kg: 1, desiExact: 2 })
  assert.equal(q.provider, 'navlungo')
  assert.equal(q.carrierId, 'ptt')
  assert.equal(q.fee, 99)
  // 35 desi, 10 kg: Navlungo hepsiJET 420 < Geliver 448,11
  assert.equal(quoteShipping({ desi: 35, kg: 10, desiExact: 35 }).carrierId, 'hepsijet')
  // 35 desi, 26 kg: hepsiJET dışı → Geliver 448,11 < Aras 544
  const g = quoteShipping({ desi: 35, kg: 26, desiExact: 35 })
  assert.equal(g.provider, 'geliver')
  assert.equal(g.fee, 448.11)
  // Aynı sepet akülü: Geliver teklif dışı, gerekçesiyle
  const b = quoteShipping({ desi: 35, kg: 26, desiExact: 35, battery: true })
  assert.equal(b.provider, 'navlungo')
  assert.equal(b.carrierId, 'aras')
  assert.equal(b.fee, 544)
  assert.match(b.candidates[0].reason ?? '', /Akü/)
  assert.equal(b.battery, true)
})

test('Sepet lojistiği: ağır parça adet kadar sayılır', () => {
  const l = cartLogistics([{ id: 'yok', quantity: 2 }])
  assert.equal(l.heavyPieces, 0)
})

test('Toplu kargo: "hepsiJET XL" XL\'e, "Kolay Gelsin" doğru firmaya eşlenir', () => {
  assert.equal(matchCarrier('hepsiJET XL')?.id, 'hepsijet-xl')
  assert.equal(matchCarrier('hepsijet')?.id, 'hepsijet')
  assert.equal(matchCarrier('Kolay Gelsin')?.id, 'kolaygelsin')
  assert.equal(matchCarrier('aras')?.id, 'aras')
})
