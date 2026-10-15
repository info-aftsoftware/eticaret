import React from 'react'
import { Text, Section } from '@react-email/components'
import { EmailLayout, OrderSummary, BankTransferBox, CtaButton, s, fmtTRY, type OrderEmailData } from './shared'
import { BANK_TRANSFER_PAYMENT_DAYS } from '../../lib/store-config'

/** Müşteriye "Siparişiniz alındı". Havale/EFT'de ödeme talimatı + IBAN; kartta ödeme onayı. */
export default function OrderReceivedEmail({ order }: { order: OrderEmailData }) {
  const awaitingTransfer = order.paymentMethod === 'bank_transfer' && order.paymentStatus !== 'PAID'
  return (
    <EmailLayout
      preview={awaitingTransfer
        ? `Siparişiniz alındı — onay için ${fmtTRY(order.total)} havale/EFT bekleniyor`
        : `Siparişiniz alındı — ${order.orderNo}`}
      title="Siparişiniz Alındı"
      subtitle={<>Sipariş No: <strong>{order.orderNo}</strong></>}
    >
      <Text style={s.p}>Merhaba {order.customerName},</Text>
      {awaitingTransfer ? (
        <>
          <Text style={s.p}>
            Siparişiniz oluşturuldu. <strong>Siparişinizin onaylanması için</strong> aşağıdaki hesaba{' '}
            <strong>{fmtTRY(order.total)}</strong> tutarında havale/EFT yapmanız gerekmektedir.
          </Text>
          <BankTransferBox order={order} />
          <Text style={s.p}>
            {BANK_TRANSFER_PAYMENT_DAYS} gün içinde ödemesi yapılmayan siparişler iptal edilebilir. Ödemeniz onaylandığında
            ikinci bir e-posta alacaksınız.
          </Text>
        </>
      ) : (
        <Section style={s.boxGreen}>
          <Text style={s.row}>Ödemeniz alındı. Siparişiniz en kısa sürede hazırlanıp kargoya verilecektir.</Text>
        </Section>
      )}
      <OrderSummary order={order} />
      <CtaButton href={order.orderUrl}>Siparişimi Görüntüle</CtaButton>
      <Text style={s.note}>
        Onayladığınız Ön Bilgilendirme Formu ve Mesafeli Satış Sözleşmesi bu e-postanın ekinde (PDF) yer almaktadır.
        Teslimattan itibaren 14 gün içinde cayma hakkınızı kullanabilirsiniz.
      </Text>
      <Text style={s.note}>
        Üye girişi yapmadan verdiğiniz siparişleri, sipariş sayfasında e-posta adresiniz ve telefon numaranızla görüntüleyebilirsiniz.
      </Text>
    </EmailLayout>
  )
}
