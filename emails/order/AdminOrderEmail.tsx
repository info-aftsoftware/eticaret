import React from 'react'
import { Text, Section } from '@react-email/components'
import { EmailLayout, OrderSummary, CtaButton, AmountRow, s, fmtTRY, paymentMethodLabel, type OrderEmailData } from './shared'

export type AdminOrderEvent = 'new_order' | 'payment_received' | 'customer_cancelled' | 'cancel_request'

export const ADMIN_ORDER_EMAIL_SUBJECTS: Record<AdminOrderEvent, (orderNo: string) => string> = {
  new_order: (n) => `Yeni sipariş - ${n}`,
  payment_received: (n) => `Ödeme alındı - ${n}`,
  customer_cancelled: (n) => `Müşteri siparişi iptal etti - ${n}`,
  cancel_request: (n) => `İptal talebi (ödenmiş sipariş) - ${n}`,
}

const TITLES: Record<AdminOrderEvent, string> = {
  new_order: 'Yeni sipariş',
  payment_received: 'Ödeme alındı',
  customer_cancelled: 'Müşteri siparişi iptal etti',
  cancel_request: 'İptal talebi — onay bekliyor',
}

/** Admin bildirimi: yeni sipariş, ödeme, müşteri iptali, ödenmiş sipariş için iptal talebi. */
export default function AdminOrderEmail({ order, event, reason }: { order: OrderEmailData; event: AdminOrderEvent; reason?: string | null }) {
  const awaitingTransfer = order.paymentMethod === 'bank_transfer' && order.paymentStatus === 'PENDING'
  const tone = event === 'customer_cancelled' ? 'red' : event === 'cancel_request' ? 'amber' : event === 'payment_received' ? 'green' : 'navy'
  return (
    <EmailLayout
      preview={`${TITLES[event]}: ${order.orderNo} — ${fmtTRY(order.total)} · ${order.customerName}`}
      title={TITLES[event]}
      subtitle={<>Sipariş no: <strong style={{ color: '#ffffff' }}>{order.orderNo}</strong> · {fmtTRY(order.total)} · {order.createdAt}</>}
      tone={tone}
    >
      {event === 'cancel_request' && (
        <Section style={s.boxAmber}>
          <Text style={s.boxTitle}>Müşteri ödenmiş siparişi için iptal istiyor</Text>
          {reason && <Text style={s.row}><strong>Neden:</strong> {reason}</Text>}
          <Text style={s.row}>
            Sipariş kargoya verilmeden panelden talebi onaylayın veya gerekçeyle reddedin. Onaylarsanız sipariş iptal edilir, stok ve kupon
            geri alınır ve müşteriye {fmtTRY(order.total)} ücret iadesi bildirilir — iadeyi {order.paymentMethod === 'bank_transfer' ? 'havale yapılan hesaba' : 'banka sanal POS panelinden'} yapmayı unutmayın.
          </Text>
        </Section>
      )}
      {event === 'customer_cancelled' && (
        <Section style={s.boxRed}>
          <Text style={s.row}>
            Müşteri, ödemesi alınmamış siparişini iptal etti. Stok ve kupon kullanımı otomatik geri alındı; yapılacak bir işlem yok.
          </Text>
          {reason && <Text style={s.row}><strong>Neden:</strong> {reason}</Text>}
        </Section>
      )}
      {(event === 'new_order' || event === 'payment_received') && (
        <Section style={awaitingTransfer ? s.boxAmber : s.boxGreen}>
          <AmountRow label="Ödeme" value={paymentMethodLabel(order.paymentMethod)} />
          <AmountRow label="Durum" value={awaitingTransfer ? 'Havale bekleniyor' : 'Ödendi'} />
          {awaitingTransfer && <Text style={s.note}>Havale hesaba geçince panelden “Ödeme alındı” olarak işaretleyin.</Text>}
        </Section>
      )}
      <Section style={s.box}>
        <Text style={s.boxTitle}>Müşteri</Text>
        <Text style={s.row}>{order.customerName}</Text>
        <Text style={s.row}>{order.customerEmail} · {order.customerPhone}</Text>
        <Text style={s.row}>
          Fatura: {order.billingName}
          {order.billingType === 'company'
            ? ` (Kurumsal · VKN ${order.billingTaxId ?? '—'} · ${order.billingTaxOffice ?? '—'} V.D.)`
            : order.billingTaxId ? ` (TCKN ${order.billingTaxId})` : ' (Bireysel)'}
        </Text>
        {order.customerNote && <Text style={s.row}><strong>Müşteri notu:</strong> {order.customerNote}</Text>}
      </Section>
      <OrderSummary order={order} />
      <CtaButton href={order.adminUrl} secondary>Panelde aç</CtaButton>
    </EmailLayout>
  )
}
