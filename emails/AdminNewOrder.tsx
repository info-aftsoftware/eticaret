import React from 'react'
import AdminOrderEmail from './order/AdminOrderEmail'
import { legacyToOrderEmailData } from './legacy-order-data'

interface AdminNewOrderProps {
  orderId: string
  orderData: any
}

/** Eski bildirim akışı (lib/notifications) için admin "Yeni sipariş" — ortak admin e-postasıyla aynı tasarım. */
export default function AdminNewOrder({ orderId, orderData }: AdminNewOrderProps) {
  return <AdminOrderEmail order={legacyToOrderEmailData(orderId, orderData)} event="new_order" />
}
