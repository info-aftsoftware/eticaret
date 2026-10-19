/**
 * Kargo etiketi PDF'i: 10×15 cm (termal etiket yazıcısı / A6), sipariş başına bir sayfa.
 * Gönderici, alıcı, telefon, adres, desi/kg, parça sayısı, kargo firması ve sipariş numarası (yazı + QR).
 * Kargo firması API'si bağlanana kadar anlaşmalı şubeye teslimde pakete yapıştırılır; firma kendi barkodunu ayrıca basar.
 */
import React from 'react'
import QRCode from 'qrcode'
import { Document, Page, Text, View, Image, StyleSheet, renderToBuffer } from '@react-pdf/renderer'
import type { Order, OrderLine } from '@prisma/client'
import './invoice' // Roboto (Türkçe karakter) font kaydı
import { SELLER } from './legal/company'
import { getCarrier } from './shipping/carriers'
import { cartLogistics } from './shipping/fee'

const MM = 72 / 25.4
const s = StyleSheet.create({
  page: { padding: 14, fontFamily: 'Roboto', fontSize: 9, color: '#000' },
  box: { borderWidth: 1, borderColor: '#000', padding: 6, marginBottom: 6 },
  label: { fontSize: 7, marginBottom: 2 },
  name: { fontSize: 13, fontWeight: 700 },
  big: { fontSize: 11 },
  row: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' },
  orderNo: { fontSize: 16, fontWeight: 700 },
})

type LabelOrder = Order & { lines: OrderLine[] }

function Label({ order, qr }: { order: LabelOrder; qr: string }) {
  const items = order.lines.map((l) => {
    const vm = l.variantMatrix as { productId?: string; variantKey?: string } | null
    const productId = vm?.productId
    return { id: vm?.variantKey ? `${productId}-${vm.variantKey}` : productId ?? '', productId, quantity: l.quantity }
  })
  const { desi, kg } = cartLogistics(items)
  const pieces = order.lines.reduce((n, l) => n + l.quantity, 0)
  const carrier = order.shippingCarrier ? getCarrier(order.shippingCarrier)?.name ?? order.shippingCarrier : null
  return (
    <Page size={[100 * MM, 150 * MM]} style={s.page}>
      <View style={s.box}>
        <Text style={s.label}>GÖNDERİCİ</Text>
        <Text style={s.big}>{SELLER.brand} · {SELLER.shortLegalName}</Text>
        <Text>{SELLER.address}</Text>
        <Text>Tel: {SELLER.phone}</Text>
      </View>
      <View style={[s.box, { borderWidth: 2 }]}>
        <Text style={s.label}>ALICI</Text>
        <Text style={s.name}>{order.shippingName}</Text>
        <Text style={s.big}>{order.shippingAddress}</Text>
        <Text style={s.big}>
          {order.shippingDistrict} / {order.shippingCity} {order.shippingPostalCode}
        </Text>
        <Text style={[s.big, { marginTop: 3 }]}>Tel: {order.shippingPhone}</Text>
      </View>
      <View style={[s.box, s.row]}>
        <View>
          <Text style={s.label}>SİPARİŞ NO</Text>
          <Text style={s.orderNo}>{order.orderNo}</Text>
          <Text style={{ marginTop: 4 }}>Parça: {pieces} · Desi: {desi || '—'} · {kg ? `${kg.toLocaleString('tr-TR')} kg` : 'kg —'}</Text>
          {carrier && <Text style={{ marginTop: 2 }}>Kargo: {carrier}{order.trackingNumber ? ` · ${order.trackingNumber}` : ''}</Text>}
        </View>
        {/* eslint-disable-next-line jsx-a11y/alt-text */}
        <Image src={qr} style={{ width: 62, height: 62 }} />
      </View>
      <View style={s.box}>
        <Text style={s.label}>İÇERİK</Text>
        {order.lines.slice(0, 6).map((l) => (
          <Text key={l.id}>
            {l.quantity} × {l.productName.length > 70 ? `${l.productName.slice(0, 68)}…` : l.productName}
          </Text>
        ))}
        {order.lines.length > 6 && <Text>… ve {order.lines.length - 6} kalem daha</Text>}
      </View>
    </Page>
  )
}

export async function renderShippingLabels(orders: LabelOrder[]): Promise<Buffer> {
  const qrs = await Promise.all(orders.map((o) => QRCode.toDataURL(o.orderNo, { margin: 0, width: 240 })))
  return renderToBuffer(
    <Document title={orders.length === 1 ? `Kargo etiketi ${orders[0].orderNo}` : `Kargo etiketleri (${orders.length})`} author={SELLER.legalName}>
      {orders.map((o, i) => (
        <Label key={o.id} order={o} qr={qrs[i]} />
      ))}
    </Document>
  )
}
