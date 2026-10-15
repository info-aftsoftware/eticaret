/**
 * Paketleme / sevk formu (PDF) — depoda siparişi hazırlarken ve kolinin içine koymak için.
 * Resmî e-İrsaliye değildir; fiyat içermez.
 */

import React from 'react'
import { Document, Page, Text, View, StyleSheet, renderToBuffer } from '@react-pdf/renderer'
import type { Order, OrderLine } from '@prisma/client'
import './invoice' // Roboto (Türkçe karakter) font kaydı
import { SELLER } from './legal/company'
import { getCarrier } from './shipping/carriers'

const s = StyleSheet.create({
  page: { padding: 32, fontFamily: 'Roboto', fontSize: 10, color: '#111827' },
  header: { flexDirection: 'row', justifyContent: 'space-between', borderBottom: '2 solid #111827', paddingBottom: 8, marginBottom: 12 },
  title: { fontSize: 16, fontWeight: 700 },
  muted: { color: '#6b7280', fontSize: 9 },
  cols: { flexDirection: 'row', gap: 12, marginBottom: 12 },
  box: { flex: 1, border: '1 solid #d1d5db', borderRadius: 4, padding: 8 },
  boxTitle: { fontSize: 9, fontWeight: 700, color: '#6b7280', marginBottom: 4 },
  bold: { fontWeight: 700 },
  th: { flexDirection: 'row', borderBottom: '1 solid #111827', paddingVertical: 4, fontWeight: 700 },
  tr: { flexDirection: 'row', borderBottom: '1 solid #e5e7eb', paddingVertical: 6 },
  cCheck: { width: 24 },
  cName: { flex: 1, paddingRight: 8 },
  cQty: { width: 50, textAlign: 'right' },
  check: { width: 10, height: 10, border: '1 solid #111827' },
  note: { marginTop: 12, padding: 8, backgroundColor: '#fef3c7', borderRadius: 4 },
  sign: { flexDirection: 'row', gap: 24, marginTop: 32 },
  signBox: { flex: 1, borderTop: '1 solid #9ca3af', paddingTop: 4, fontSize: 9, color: '#6b7280' },
})

export function PackingSlip({ order }: { order: Order & { lines: OrderLine[] } }) {
  const carrier = order.shippingCarrier ? getCarrier(order.shippingCarrier)?.name ?? order.shippingCarrier : null
  const totalQty = order.lines.reduce((n, l) => n + l.quantity, 0)
  return (
    <Document title={`Paketleme Formu ${order.orderNo}`} author={SELLER.legalName}>
      <Page size="A4" style={s.page}>
        <View style={s.header}>
          <View>
            <Text style={s.title}>Paketleme / Sevk Formu</Text>
            <Text style={s.muted}>Resmî irsaliye yerine geçmez · Fiyat bilgisi içermez</Text>
          </View>
          <View style={{ alignItems: 'flex-end' }}>
            <Text style={s.bold}>{order.orderNo}</Text>
            <Text style={s.muted}>Sipariş: {order.createdAt.toLocaleDateString('tr-TR')}</Text>
            <Text style={s.muted}>Yazdırma: {new Date().toLocaleString('tr-TR')}</Text>
          </View>
        </View>

        <View style={s.cols}>
          <View style={s.box}>
            <Text style={s.boxTitle}>GÖNDERİCİ</Text>
            <Text style={s.bold}>{SELLER.shortLegalName}</Text>
            <Text>{SELLER.address}</Text>
            <Text>{SELLER.phone}</Text>
          </View>
          <View style={s.box}>
            <Text style={s.boxTitle}>ALICI / TESLİMAT ADRESİ</Text>
            <Text style={s.bold}>{order.shippingName}</Text>
            <Text>{order.shippingAddress}</Text>
            <Text>{order.shippingDistrict} / {order.shippingCity} {order.shippingPostalCode}</Text>
            <Text>Tel: {order.shippingPhone}</Text>
          </View>
        </View>

        {(carrier || order.trackingNumber) && (
          <Text style={{ marginBottom: 8 }}>Kargo: {carrier ?? '—'}{order.trackingNumber ? ` · Takip no: ${order.trackingNumber}` : ''}</Text>
        )}

        <View style={s.th}>
          <Text style={s.cCheck}>✓</Text>
          <Text style={s.cName}>Ürün</Text>
          <Text style={s.cQty}>Adet</Text>
        </View>
        {order.lines.map((l) => (
          <View key={l.id} style={s.tr}>
            <View style={s.cCheck}><View style={s.check} /></View>
            <Text style={s.cName}>{l.productName}</Text>
            <Text style={[s.cQty, s.bold]}>{l.quantity}</Text>
          </View>
        ))}
        <View style={[s.tr, { borderBottom: '0' }]}>
          <Text style={s.cCheck} />
          <Text style={[s.cName, s.bold]}>Toplam kalem / adet</Text>
          <Text style={[s.cQty, s.bold]}>{order.lines.length} / {totalQty}</Text>
        </View>

        {order.customerNote && (
          <View style={s.note}>
            <Text style={s.bold}>Müşteri notu</Text>
            <Text>{order.customerNote}</Text>
          </View>
        )}

        <View style={s.sign}>
          <Text style={s.signBox}>Hazırlayan / Tarih</Text>
          <Text style={s.signBox}>Kontrol eden</Text>
          <Text style={s.signBox}>Teslim alan (kargo)</Text>
        </View>
      </Page>
    </Document>
  )
}

export async function generatePackingSlipPdf(order: Order & { lines: OrderLine[] }): Promise<Buffer> {
  return renderToBuffer(<PackingSlip order={order} />)
}
