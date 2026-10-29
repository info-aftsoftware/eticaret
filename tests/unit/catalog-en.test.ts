import { test } from 'node:test'
import assert from 'node:assert/strict'
import React from 'react'
import { render } from '@react-email/render'
import products from '../../lib/catalog/products.json'
import descriptions from '../../lib/catalog/descriptions.json'
import details from '../../lib/catalog/product-details.json'
import {
  enNumbers,
  lineItemName,
  localizeProduct,
  localizeSpecs,
  productName,
  specKeyLabel,
  specValueLabel,
} from '../../lib/catalog-en'
import { htmlSegments, mapHtmlSegments } from '../../lib/catalog-en/html-segments'
import { localizeDescriptionHtml } from '../../lib/catalog-en/descriptions.server'
import OrderStatusEmail from '../../emails/order/OrderStatusEmail'
import OrderReceivedEmail from '../../emails/order/OrderReceivedEmail'
import type { OrderEmailData } from '../../emails/order/shared'

type P = { id: string; name: string; description?: string; variants?: { key: string; label: string }[] }
const catalog = products as P[]
const TR_CHARS = /[çğıöşüÇĞİÖŞÜ]/
/** Marka, model kodu, yer adları ve şirketin yasal unvanı Türkçe karakter içerebilir */
const ALLOWED =
  /İstabreeze|SLM-DİYOD|SOLAR-WİFİ|Türkiye|ELAZIĞ|Elazığ|MERSİS|TEKNOLOJİLERİ|TİCARET|TİC\.|SAN\.|SANAYİ|LİMİTED|ŞİRKETİ|ŞTİ\.|Gönderi Takip|Çaydaçıra|İzmir|İstanbul|Aras Kargo|Yurtiçi Kargo|Sürat Kargo|PTT Kargo|MNG Kargo/g

test('sayı biçimi: ondalık virgül, binlik nokta, yüzde', () => {
  assert.equal(enNumbers('33,14 V'), '33.14 V')
  assert.equal(enNumbers('12.000 W'), '12,000 W')
  assert.equal(enNumbers('11.000 VA / 11.000 W'), '11,000 VA / 11,000 W')
  assert.equal(enNumbers('%23,04'), '23.04%')
  assert.equal(enNumbers('-0,30 / -0,26 / +0,040 %/°C'), '-0.30 / -0.26 / +0.040 %/°C')
  assert.equal(enNumbers('IEC 61215, IEC 61730-1'), 'IEC 61215, IEC 61730-1')
  assert.equal(enNumbers('51.2V'), '51.2V')
})

test('her katalog ürününün İngilizce adı ve kısa açıklaması var, Türkçe karakter içermez', () => {
  for (const p of catalog) {
    const en = localizeProduct(p, 'en')
    assert.notEqual(en.name, '', p.id)
    assert.ok(!TR_CHARS.test(en.name.replace(ALLOWED, '')), `${p.id}: ${en.name}`)
    if (p.description) assert.ok(!TR_CHARS.test((en.description ?? '').replace(ALLOWED, '')), `${p.id}: ${en.description}`)
    for (const v of en.variants ?? []) assert.ok(!TR_CHARS.test(v.label.replace(ALLOWED, '')), `${p.id}/${v.key}: ${v.label}`)
  }
})

test('Türkçede katalog metni değişmez; panelde değiştirilen ad çevrilmez', () => {
  const p = catalog[0]
  assert.equal(localizeProduct(p, 'tr'), p)
  assert.equal(productName({ id: p.id, name: 'Panelde yazılmış ad' }, 'en'), 'Panelde yazılmış ad')
})

test('teknik özellik başlık ve değerleri İngilizce', () => {
  const map = details as Record<string, { specifications?: Record<string, string> }>
  for (const [id, d] of Object.entries(map)) {
    for (const [k, v] of Object.entries(localizeSpecs(d.specifications, 'en') ?? {})) {
      assert.ok(!TR_CHARS.test(k.replace(ALLOWED, '')), `${id}: ${k}`)
      assert.ok(!TR_CHARS.test(v.replace(ALLOWED, '')), `${id}: ${k} = ${v}`)
    }
  }
  assert.equal(specKeyLabel('Maksimum sistem gerilimi', 'tr'), 'Maksimum sistem gerilimi')
  assert.equal(specValueLabel('33,14 V', 'en'), '33.14 V')
})

test('HTML açıklama: segmentler kayıpsız yeniden kurulur, çeviride etiketler korunur, Türkçe kalmaz', () => {
  const map = descriptions as Record<string, string>
  for (const [id, html] of Object.entries(map)) {
    assert.equal(mapHtmlSegments(html, (c) => c), html, `${id} yeniden kurulum`)
    const en = localizeDescriptionHtml(html, 'en')!
    assert.ok(!en.includes('lang="tr"'), `${id}: çevrilmemiş segment var`)
    for (const seg of htmlSegments(en)) {
      const text = seg.replace(/<[^>]+>/g, '').replace(/https?:\/\/\S+/g, '').replace(ALLOWED, '')
      assert.ok(!TR_CHARS.test(text), `${id}: ${seg.slice(0, 120)}`)
    }
  }
})

test('sepet / sipariş kalem adı her iki dilden de doğru dile çevrilir', () => {
  const p = catalog.find((x) => x.variants?.length)!
  const v = p.variants![0]
  const trName = `${p.name} (${v.label})`
  const en = localizeProduct(p, 'en')
  const enName = `${en.name} (${en.variants![0].label})`
  assert.equal(lineItemName({ name: trName, productId: p.id, id: `${p.id}-${v.key}` }, 'en'), enName)
  assert.equal(lineItemName({ name: enName, productId: p.id, id: `${p.id}-${v.key}` }, 'tr'), trName)
  // Ürün id'si saklanmayan kayıt (iade kalemi): adından bulunur
  assert.equal(lineItemName({ name: trName }, 'en'), enName)
  assert.equal(lineItemName({ name: 'Özel teklif kalemi' }, 'en'), 'Özel teklif kalemi')
})

const baseOrder: OrderEmailData = {
  locale: 'en',
  orderNo: 'ORD-2026-00001',
  createdAt: '10/19/2026, 10:00:00 AM',
  customerName: 'Jane Doe',
  customerEmail: 'jane@example.com',
  customerPhone: '5320000000',
  shippingAddress: 'Test St. 1, Kadikoy / Istanbul',
  billingName: 'Jane Doe',
  billingType: 'individual',
  paymentMethod: 'bank_transfer',
  paymentStatus: 'PENDING',
  status: 'PENDING',
  lines: [{ name: 'TommaTech 16BB TOPCon Solar Panel', quantity: 1, lineTotal: 1000 }],
  subtotal: 800,
  couponDiscount: 0,
  paymentDiscount: 24,
  tax: 160,
  shipping: 0,
  total: 936,
  carrierName: 'Aras Kargo',
  trackingNumber: '123',
  trackingUrl: 'https://example.com/t/123',
  orderUrl: 'https://voltekno.com/orders/ORD-2026-00001',
  adminUrl: 'https://voltekno.com/admin/orders/x',
  siteUrl: 'https://voltekno.com',
  paymentDueDate: 'October 22, 2026',
}

/** Görünür metindeki Türkçe sözcükler (yasal ad / adres / marka ve banka adları hariç) */
function turkishLeft(html: string): string[] {
  const text = html
    .replace(/<style[\s\S]*?<\/style>/g, '')
    .replace(/<[^>]+>/g, ' ')
    .replace(/&[a-z#0-9]+;/gi, ' ')
  const lines = text.split(/\s{2,}|\n/).map((l) => l.trim()).filter(Boolean)
  return lines.filter((l) => /[çğıöşüÇĞİÖŞÜ]|\b(ve|ile|için|Sipariş|Ödeme|Kargo)\b/.test(l.replace(ALLOWED, '')))
}

test('İngilizce sipariş e-postaları Türkçe metin içermez (banka/yasal bilgiler hariç)', async () => {
  const kinds = ['payment_reminder', 'payment_received', 'confirmed', 'shipped', 'delivered', 'cancelled', 'cancel_requested', 'cancel_rejected', 'returned'] as const
  const htmls = [await render(React.createElement(OrderReceivedEmail, { order: baseOrder }))]
  for (const kind of kinds) htmls.push(await render(React.createElement(OrderStatusEmail, { order: baseOrder, kind, reason: null })))
  for (const html of htmls) {
    assert.match(html, /<html[^>]*lang="en"/)
    const left = turkishLeft(html).filter((l) => !/Bank|Banka|A\.Ş\.|Mah\.|Sok\.|Cad\.|No:/i.test(l))
    assert.deepEqual(left, [])
  }
})

test('Türkçe sipariş e-postası Türkçe kalır', async () => {
  const html = await render(React.createElement(OrderStatusEmail, { order: { ...baseOrder, locale: 'tr' }, kind: 'shipped', reason: null }))
  assert.match(html, /Siparişiniz kargoda/)
  assert.match(html, /<html[^>]*lang="tr"/)
})
