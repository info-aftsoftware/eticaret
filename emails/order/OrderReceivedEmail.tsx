import React from 'react'
import { Text } from '@react-email/components'
import { EmailLayout, OrderSummary, OrderProgress, BankTransferBox, CtaButton, s, fmtTRY, tx, type EmailLocale, type OrderEmailData } from './shared'
import { BANK_TRANSFER_PAYMENT_DAYS } from '../../lib/store-config'

export function orderReceivedSubject(orderNo: string, awaitingTransfer: boolean, locale?: EmailLocale | null): string {
  const L = tx(locale)
  return awaitingTransfer
    ? L(`Siparişiniz alındı, ödemeniz bekleniyor - ${orderNo}`, `Order received, awaiting your payment - ${orderNo}`)
    : L(`Siparişiniz alındı - ${orderNo}`, `Order received - ${orderNo}`)
}

/** Müşteriye "Siparişiniz alındı" (siparişin dilinde). Havale/EFT'de ödeme talimatı + IBAN; kartta ödeme onayı. */
export default function OrderReceivedEmail({ order }: { order: OrderEmailData }) {
  const en = order.locale === 'en'
  const L = tx(order.locale)
  const fmt = (n: number) => fmtTRY(n, order.locale)
  const awaitingTransfer = order.paymentMethod === 'bank_transfer' && order.paymentStatus !== 'PAID'
  return (
    <EmailLayout
      locale={order.locale}
      preview={awaitingTransfer
        ? L(`Siparişiniz alındı — onay için ${fmt(order.total)} havale/EFT bekleniyor`, `Order received — awaiting a ${fmt(order.total)} bank transfer to confirm it`)
        : L(`Siparişiniz alındı, ödemeniz onaylandı — ${order.orderNo}`, `Order received, payment confirmed — ${order.orderNo}`)}
      title={awaitingTransfer ? L('Siparişiniz alındı, ödemeniz bekleniyor', 'Order received, awaiting your payment') : L('Siparişiniz alındı', 'Order received')}
      subtitle={<>{L('Sipariş no', 'Order no.')}: <strong style={{ color: '#ffffff' }}>{order.orderNo}</strong> · {order.createdAt}</>}
      tone={awaitingTransfer ? 'amber' : 'green'}
    >
      <Text style={s.p}>{L(`Merhaba ${order.customerName},`, `Hello ${order.customerName},`)}</Text>
      <OrderProgress step={awaitingTransfer ? 0 : 1} locale={order.locale} />
      {awaitingTransfer ? (
        <>
          {en ? (
            <Text style={s.p}>
              Thank you for your order. To confirm it, simply transfer <strong>{fmt(order.total)}</strong> to one of the accounts below by{' '}
              <strong>{order.paymentDueDate ?? `within ${BANK_TRANSFER_PAYMENT_DAYS} days`}</strong>.
            </Text>
          ) : (
            <Text style={s.p}>
              Siparişiniz için teşekkür ederiz. Siparişinizin onaylanması için <strong>{order.paymentDueDate ?? `${BANK_TRANSFER_PAYMENT_DAYS} gün içinde`}</strong>{' '}
              tarihine kadar aşağıdaki hesaplardan birine <strong>{fmt(order.total)}</strong> havale/EFT yapmanız yeterli.
            </Text>
          )}
          <BankTransferBox order={order} />
          <Text style={s.p}>
            {L(
              `${BANK_TRANSFER_PAYMENT_DAYS} gün içinde ödemesi alınmayan siparişler otomatik iptal edilir. Ödemeniz onaylandığında ikinci bir e-posta alacaksınız.`,
              `Orders not paid within ${BANK_TRANSFER_PAYMENT_DAYS} days are cancelled automatically. You will receive a second email once your payment is confirmed.`
            )}
          </Text>
        </>
      ) : en ? (
        <Text style={s.p}>
          Thank you for your order. Your payment of <strong>{fmt(order.total)}</strong> has been received; your order will be prepared and
          shipped as soon as possible.
          {order.estimatedDelivery && (<> Estimated delivery: <strong>{order.estimatedDelivery}</strong>.</>)}
        </Text>
      ) : (
        <Text style={s.p}>
          Siparişiniz için teşekkür ederiz. <strong>{fmt(order.total)}</strong> tutarındaki ödemeniz alındı; siparişiniz en kısa sürede
          hazırlanıp kargoya verilecek.
          {order.estimatedDelivery && (<> Tahmini teslimat aralığınız: <strong>{order.estimatedDelivery}</strong>.</>)}
        </Text>
      )}
      <OrderSummary order={order} />
      <CtaButton href={order.orderUrl} secondary>{L('Siparişimi görüntüle', 'View my order')}</CtaButton>
      <Text style={s.note}>
        {L(
          'Onayladığınız Ön Bilgilendirme Formu ve Mesafeli Satış Sözleşmesi bu e-postanın ekinde (PDF) yer almaktadır. Teslimattan itibaren 14 gün içinde cayma hakkınızı kullanabilirsiniz.',
          'The Preliminary Information Form and Distance Sales Agreement you accepted are attached to this email (PDF, in Turkish, the legally binding version). You may exercise your right of withdrawal within 14 days of delivery.'
        )}
      </Text>
      <Text style={s.note}>
        {L(
          'Üye girişi yapmadan verdiğiniz siparişi, sipariş sayfasında e-posta adresiniz ve telefon numaranızla görüntüleyebilirsiniz.',
          'If you ordered without signing in, you can view your order on the order page using your email address and phone number.'
        )}
      </Text>
    </EmailLayout>
  )
}
