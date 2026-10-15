/**
 * Siparişe özel sözleşme PDF'i: Ön Bilgilendirme Formu + Mesafeli Satış Sözleşmesi.
 * Mesafeli Sözleşmeler Yönetmeliği gereği sözleşme alıcıya kalıcı veri saklayıcısıyla iletilir;
 * bu PDF "Siparişiniz alındı" e-postasına eklenir. Başında alıcı, ürün ve tutar bilgileri yer alır.
 */

import React from 'react'
import { Document, Page, Text, View, StyleSheet, renderToBuffer } from '@react-pdf/renderer'
import type { Order, OrderLine } from '@prisma/client'
import '../invoice' // Roboto (Türkçe karakter) font kaydı
import { SELLER } from './company'
import { getLegalDocument, type LegalSlug } from './documents'
import { BANK_TRANSFER_DISCOUNT_RATE } from '../store-config'

const s = StyleSheet.create({
  page: { padding: 32, fontFamily: 'Roboto', fontSize: 9, color: '#1f2937', lineHeight: 1.45 },
  title: { fontSize: 15, fontWeight: 700, marginBottom: 4 },
  sub: { fontSize: 9, color: '#6b7280', marginBottom: 12 },
  h: { fontSize: 11, fontWeight: 700, marginTop: 10, marginBottom: 4 },
  docTitle: { fontSize: 13, fontWeight: 700, marginTop: 4, marginBottom: 2 },
  box: { border: '1 solid #e5e7eb', borderRadius: 4, padding: 8, marginBottom: 8 },
  row: { flexDirection: 'row', justifyContent: 'space-between', marginBottom: 2 },
  bold: { fontWeight: 700 },
  p: { marginBottom: 4 },
  li: { marginBottom: 2, paddingLeft: 8 },
  muted: { color: '#6b7280' },
})

const tl = (n: number) => (Number(n) || 0).toLocaleString('tr-TR', { style: 'currency', currency: 'TRY' })

function DocText({ slug }: { slug: LegalSlug }) {
  const doc = getLegalDocument(slug)!
  return (
    <View>
      <Text style={s.docTitle}>{doc.title}</Text>
      {doc.updated && <Text style={[s.muted, { marginBottom: 6 }]}>Son güncelleme: {doc.updated}</Text>}
      {doc.blocks.map((b, i) =>
        b.t === 'h' ? <Text key={i} style={s.h}>{b.x}</Text>
          : b.t === 'li' ? <Text key={i} style={s.li}>• {b.x}</Text>
            : <Text key={i} style={s.p}>{b.x}</Text>
      )}
    </View>
  )
}

export function ContractDocument({ order, acceptedAt }: { order: Order & { lines: OrderLine[] }; acceptedAt: string | null }) {
  const payment = order.paymentMethod === 'bank_transfer' ? 'Havale / EFT' : 'Kredi / Banka Kartı'
  return (
    <Document title={`Sözleşme ${order.orderNo}`} author={SELLER.legalName}>
      <Page size="A4" style={s.page}>
        <Text style={s.title}>Ön Bilgilendirme Formu ve Mesafeli Satış Sözleşmesi</Text>
        <Text style={s.sub}>
          Sipariş No: {order.orderNo} · Sipariş tarihi: {order.createdAt.toLocaleString('tr-TR')}
          {acceptedAt ? ` · Alıcı onayı: ${new Date(acceptedAt).toLocaleString('tr-TR')}` : ''}
        </Text>

        <View style={s.box}>
          <Text style={s.bold}>SATICI</Text>
          <Text>{SELLER.legalName} ({SELLER.brand})</Text>
          <Text>{SELLER.address}</Text>
          <Text>MERSİS: {SELLER.mersisNo} · {SELLER.taxOffice} / {SELLER.taxNo}</Text>
          <Text>Tel: {SELLER.phone} · E-posta: {SELLER.email} · KEP: {SELLER.kep}</Text>
        </View>

        <View style={s.box}>
          <Text style={s.bold}>ALICI</Text>
          <Text>{order.billingType === 'company' ? order.billingName : order.shippingName}</Text>
          {order.billingType === 'company' && order.billingTaxId && (
            <Text>VKN: {order.billingTaxId}{order.billingTaxOffice ? ` · ${order.billingTaxOffice}` : ''}</Text>
          )}
          <Text>Teslimat adresi: {order.shippingAddress}, {order.shippingDistrict} / {order.shippingCity} {order.shippingPostalCode}</Text>
          <Text>Fatura adresi: {[order.billingAddress, order.billingDistrict, order.billingCity].filter(Boolean).join(', ')}</Text>
          <Text>Telefon: {order.shippingPhone} · E-posta: {order.shippingEmail ?? '—'}</Text>
        </View>

        <View style={s.box}>
          <Text style={s.bold}>SÖZLEŞME KONUSU ÜRÜNLER VE BEDEL</Text>
          {order.lines.map((l) => (
            <View key={l.id} style={s.row}>
              <Text style={{ flex: 1, paddingRight: 8 }}>{l.productName} × {l.quantity}</Text>
              <Text>{tl(l.lineTotal)}</Text>
            </View>
          ))}
          <View style={[s.row, { marginTop: 4 }]}><Text>Ara toplam (KDV hariç)</Text><Text>{tl(order.subtotal)}</Text></View>
          {order.couponDiscount > 0 && <View style={s.row}><Text>Kupon indirimi{order.couponCode ? ` (${order.couponCode})` : ''}</Text><Text>-{tl(order.couponDiscount)}</Text></View>}
          {order.paymentDiscount > 0 && <View style={s.row}><Text>Havale/EFT indirimi (%{BANK_TRANSFER_DISCOUNT_RATE})</Text><Text>-{tl(order.paymentDiscount)}</Text></View>}
          <View style={s.row}><Text>KDV</Text><Text>{tl(order.vatTotal)}</Text></View>
          <View style={s.row}><Text>Kargo</Text><Text>{order.shippingCost > 0 ? tl(order.shippingCost) : 'Ücretsiz'}</Text></View>
          <View style={s.row}><Text style={s.bold}>Toplam (KDV dahil)</Text><Text style={s.bold}>{tl(order.total)}</Text></View>
          <Text style={{ marginTop: 4 }}>Ödeme yöntemi: {payment}</Text>
        </View>

        <DocText slug="on-bilgilendirme-formu" />
      </Page>
      <Page size="A4" style={s.page}>
        <DocText slug="mesafeli-satis-sozlesmesi" />
      </Page>
    </Document>
  )
}

export function readConsentAcceptedAt(order: Order): string | null {
  try {
    return order.notes ? JSON.parse(order.notes)?.consents?.acceptedAt ?? null : null
  } catch {
    return null
  }
}

export async function generateContractPdf(order: Order & { lines: OrderLine[] }): Promise<Buffer> {
  return renderToBuffer(<ContractDocument order={order} acceptedAt={readConsentAcceptedAt(order)} />)
}
