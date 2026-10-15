import React from 'react'
import { Text, Section, Link } from '@react-email/components'
import { EmailLayout, OrderSummary, CtaButton, BankTransferBox, s, fmtTRY, type OrderEmailData } from './shared'

export type OrderEmailKind = 'payment_reminder' | 'payment_received' | 'confirmed' | 'shipped' | 'delivered' | 'cancelled'

export const ORDER_EMAIL_SUBJECTS: Record<OrderEmailKind, (orderNo: string) => string> = {
  payment_reminder: (n) => `Ödemenizi bekliyoruz - ${n}`,
  payment_received: (n) => `Ödemeniz alındı - ${n}`,
  confirmed: (n) => `Siparişiniz hazırlanıyor - ${n}`,
  shipped: (n) => `Siparişiniz kargoya verildi - ${n}`,
  delivered: (n) => `Siparişiniz teslim edildi - ${n}`,
  cancelled: (n) => `Siparişiniz iptal edildi - ${n}`,
}

const TITLES: Record<OrderEmailKind, string> = {
  payment_reminder: 'Ödemenizi Bekliyoruz',
  payment_received: 'Ödemeniz Alındı',
  confirmed: 'Siparişiniz Hazırlanıyor',
  shipped: 'Siparişiniz Kargoda',
  delivered: 'Siparişiniz Teslim Edildi',
  cancelled: 'Siparişiniz İptal Edildi',
}

/** Sipariş durum e-postaları (ödeme onayı, hazırlanıyor, kargo, teslim, iptal). */
export default function OrderStatusEmail({ order, kind, reason }: {
  order: OrderEmailData
  kind: OrderEmailKind
  reason?: string | null
}) {
  return (
    <EmailLayout preview={`${TITLES[kind]} — ${order.orderNo}`} title={TITLES[kind]} subtitle={<>Sipariş No: <strong>{order.orderNo}</strong></>}>
      <Text style={s.p}>Merhaba {order.customerName},</Text>

      {kind === 'payment_reminder' && (
        <>
          <Text style={s.p}>
            Siparişiniz için havale/EFT ödemeniz henüz hesabımıza ulaşmadı. Siparişinizin iptal edilmemesi için lütfen{' '}
            <strong>{order.paymentDueDate}</strong> tarihine kadar <strong>{fmtTRY(order.total)}</strong> ödeme yapın.
            Ödemeyi yaptıysanız bu e-postayı dikkate almayın.
          </Text>
          <BankTransferBox order={order} />
        </>
      )}

      {kind === 'payment_received' && (
        <Section style={s.boxGreen}>
          <Text style={s.row}>
            <strong>{fmtTRY(order.total)}</strong> tutarındaki ödemeniz alındı ve siparişiniz onaylandı.
            Siparişiniz hazırlanıp kargoya verildiğinde takip bilgilerini ayrıca göndereceğiz.
          </Text>
        </Section>
      )}

      {kind === 'confirmed' && (
        <Text style={s.p}>Siparişiniz onaylandı ve depomuzda hazırlanmaya başlandı. Kargoya verildiğinde size haber vereceğiz.</Text>
      )}

      {kind === 'shipped' && (
        <Section style={s.boxBlue}>
          <Text style={s.boxTitle}>Kargo Bilgileri</Text>
          {order.carrierName && <Text style={s.row}><strong>Kargo firması:</strong> {order.carrierName}</Text>}
          {order.trackingNumber && <Text style={s.row}><strong>Takip numarası:</strong> <span style={s.mono}>{order.trackingNumber}</span></Text>}
          {order.trackingUrl && (
            <Text style={s.row}>
              <Link href={order.trackingUrl} style={s.link}>Kargonuzu takip edin →</Link>
            </Text>
          )}
          <Text style={s.note}>Kargo firmasının sistemine kaydın düşmesi birkaç saat sürebilir.</Text>
        </Section>
      )}

      {kind === 'delivered' && (
        <Text style={s.p}>
          Siparişiniz teslim edildi. Bizi tercih ettiğiniz için teşekkür ederiz. Ürünlerle ilgili deneyiminizi ürün sayfasında
          değerlendirme olarak paylaşabilirsiniz. Teslimattan itibaren 14 gün içinde cayma hakkınızı kullanabilirsiniz.
        </Text>
      )}

      {kind === 'cancelled' && (
        <>
          <Text style={s.p}>Siparişiniz iptal edildi.{reason ? ` Neden: ${reason}` : ''}</Text>
          {order.paymentStatus === 'PAID' || order.paymentStatus === 'REFUNDED' ? (
            <Text style={s.p}>Yaptığınız ödemenin iadesi için sizinle iletişime geçeceğiz.</Text>
          ) : null}
        </>
      )}

      <OrderSummary order={order} />
      <CtaButton href={order.orderUrl}>Siparişimi Görüntüle</CtaButton>
    </EmailLayout>
  )
}
