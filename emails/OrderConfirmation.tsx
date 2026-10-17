import React from 'react'
import { Text } from '@react-email/components'
import { EmailLayout, OrderSummary, BankTransferBox, CtaButton, s } from './order/shared'
import { legacyToOrderEmailData } from './legacy-order-data'

interface OrderConfirmationProps {
  orderId: string
  orderData: any
}

/** Eski bildirim akışı (lib/notifications) için "Siparişiniz oluşturuldu" — ortak sipariş e-postası tasarımıyla. */
export default function OrderConfirmation({ orderId, orderData }: OrderConfirmationProps) {
  const order = legacyToOrderEmailData(orderId, orderData)
  const isBankTransfer = order.paymentMethod === 'bank_transfer'
  return (
    <EmailLayout
      preview={`Siparişiniz oluşturuldu — ${orderId}`}
      title="Siparişiniz oluşturuldu"
      subtitle={<>Sipariş no: <strong style={{ color: '#ffffff' }}>{orderId}</strong></>}
      tone={isBankTransfer ? 'amber' : 'green'}
    >
      <Text style={s.p}>Merhaba {order.customerName},</Text>
      <Text style={s.p}>Siparişiniz başarıyla oluşturuldu. Siparişiniz hazırlandığında e-posta ile bilgilendirileceksiniz.</Text>
      {isBankTransfer && <BankTransferBox order={order} />}
      <OrderSummary order={order} />
      <CtaButton href={order.orderUrl} secondary>Siparişimi görüntüle</CtaButton>
    </EmailLayout>
  )
}
