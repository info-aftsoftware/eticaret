import React from 'react'
import { Text } from '@react-email/components'
import { EmailLayout, OrderSummary, OrderProgress, BankTransferBox, CtaButton, s, fmtTRY, type OrderEmailData } from './shared'
import { BANK_TRANSFER_PAYMENT_DAYS } from '../../lib/store-config'

/** Müşteriye "Siparişiniz alındı". Havale/EFT'de ödeme talimatı + IBAN; kartta ödeme onayı. */
export default function OrderReceivedEmail({ order }: { order: OrderEmailData }) {
  const awaitingTransfer = order.paymentMethod === 'bank_transfer' && order.paymentStatus !== 'PAID'
  return (
    <EmailLayout
      preview={awaitingTransfer
        ? `Siparişiniz alındı — onay için ${fmtTRY(order.total)} havale/EFT bekleniyor`
        : `Siparişiniz alındı, ödemeniz onaylandı — ${order.orderNo}`}
      title={awaitingTransfer ? 'Siparişiniz alındı, ödemeniz bekleniyor' : 'Siparişiniz alındı'}
      subtitle={<>Sipariş no: <strong style={{ color: '#ffffff' }}>{order.orderNo}</strong> · {order.createdAt}</>}
      tone={awaitingTransfer ? 'amber' : 'green'}
    >
      <Text style={s.p}>Merhaba {order.customerName},</Text>
      <OrderProgress step={awaitingTransfer ? 0 : 1} />
      {awaitingTransfer ? (
        <>
          <Text style={s.p}>
            Siparişiniz için teşekkür ederiz. Siparişinizin onaylanması için <strong>{order.paymentDueDate ?? `${BANK_TRANSFER_PAYMENT_DAYS} gün içinde`}</strong>{' '}
            tarihine kadar aşağıdaki hesaplardan birine <strong>{fmtTRY(order.total)}</strong> havale/EFT yapmanız yeterli.
          </Text>
          <BankTransferBox order={order} />
          <Text style={s.p}>
            {BANK_TRANSFER_PAYMENT_DAYS} gün içinde ödemesi alınmayan siparişler otomatik iptal edilir. Ödemeniz onaylandığında ikinci bir
            e-posta alacaksınız.
          </Text>
        </>
      ) : (
        <Text style={s.p}>
          Siparişiniz için teşekkür ederiz. <strong>{fmtTRY(order.total)}</strong> tutarındaki ödemeniz alındı; siparişiniz en kısa sürede
          hazırlanıp kargoya verilecek.
          {order.estimatedDelivery && (<> Tahmini teslimat aralığınız: <strong>{order.estimatedDelivery}</strong>.</>)}
        </Text>
      )}
      <OrderSummary order={order} />
      <CtaButton href={order.orderUrl} secondary>Siparişimi görüntüle</CtaButton>
      <Text style={s.note}>
        Onayladığınız Ön Bilgilendirme Formu ve Mesafeli Satış Sözleşmesi bu e-postanın ekinde (PDF) yer almaktadır.
        Teslimattan itibaren 14 gün içinde cayma hakkınızı kullanabilirsiniz.
      </Text>
      <Text style={s.note}>
        Üye girişi yapmadan verdiğiniz siparişi, sipariş sayfasında e-posta adresiniz ve telefon numaranızla görüntüleyebilirsiniz.
      </Text>
    </EmailLayout>
  )
}
