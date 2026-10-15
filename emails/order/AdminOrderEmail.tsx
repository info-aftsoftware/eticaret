import React from 'react'
import { Text, Section } from '@react-email/components'
import { EmailLayout, OrderSummary, CtaButton, s, fmtTRY, paymentMethodLabel, type OrderEmailData } from './shared'

/** Admin'e yeni sipariş / ödeme bildirimi. */
export default function AdminOrderEmail({ order, event }: { order: OrderEmailData; event: 'new_order' | 'payment_received' }) {
  const awaitingTransfer = order.paymentMethod === 'bank_transfer' && order.paymentStatus !== 'PAID'
  return (
    <EmailLayout
      preview={`${event === 'new_order' ? 'Yeni sipariş' : 'Ödeme alındı'}: ${order.orderNo} — ${fmtTRY(order.total)}`}
      title={event === 'new_order' ? 'Yeni Sipariş' : 'Ödeme Alındı'}
      subtitle={<>Sipariş No: <strong>{order.orderNo}</strong> · {fmtTRY(order.total)}</>}
    >
      <Section style={awaitingTransfer ? s.boxAmber : s.boxGreen}>
        <Text style={s.row}>
          <strong>Ödeme:</strong> {paymentMethodLabel(order.paymentMethod)} —{' '}
          {awaitingTransfer ? 'Havale bekleniyor (gelince panelden “Ödeme alındı” işaretleyin)' : 'Ödendi'}
        </Text>
      </Section>
      <Section style={s.box}>
        <Text style={s.boxTitle}>Müşteri</Text>
        <Text style={s.row}>{order.customerName} · {order.customerEmail} · {order.customerPhone}</Text>
        <Text style={s.row}>Fatura: {order.billingName}{order.billingType === 'company' ? ` (Kurumsal, VKN ${order.billingTaxId ?? '—'}, ${order.billingTaxOffice ?? '—'})` : order.billingTaxId ? ` (TCKN ${order.billingTaxId})` : ''}</Text>
        {order.customerNote && <Text style={s.row}><strong>Müşteri notu:</strong> {order.customerNote}</Text>}
      </Section>
      <OrderSummary order={order} />
      <CtaButton href={order.adminUrl}>Panelde Aç</CtaButton>
    </EmailLayout>
  )
}
