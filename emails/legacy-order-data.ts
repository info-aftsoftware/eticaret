/**
 * Eski (Firestore) sipariş bildirim verisini ortak sipariş e-postası verisine çevirir.
 * lib/notifications.ts → emails/OrderConfirmation.tsx ve emails/AdminNewOrder.tsx kullanır.
 */
import { STORE_CONTACT } from '../lib/store-config'
import type { OrderEmailData } from './order/shared'

export function legacyToOrderEmailData(orderId: string, orderData: any): OrderEmailData {
  const customer = orderData?.customer ?? {}
  const pricing = orderData?.pricing ?? orderData?.orderData?.pricing ?? {}
  const items: any[] = orderData?.items ?? []
  const num = (v: unknown) => Number(v) || 0
  const site = STORE_CONTACT.siteUrl.replace(/\/$/, '')
  const method = orderData?.paymentMethod === 'pending' ? 'bank_transfer' : orderData?.paymentMethod || 'bank_transfer'
  return {
    orderNo: orderId,
    createdAt: new Date().toLocaleString('tr-TR'),
    customerName: customer.name || 'Müşterimiz',
    customerEmail: customer.email || '',
    customerPhone: customer.phone || '',
    shippingAddress: [customer.addressLine, [customer.district, customer.city].filter(Boolean).join(' / '), customer.postalCode].filter(Boolean).join(', '),
    billingName: customer.companyName || customer.billingName || customer.name || '',
    billingType: customer.billingType || 'individual',
    billingTaxId: customer.taxId || customer.idNumber || null,
    billingTaxOffice: customer.taxOffice || null,
    paymentMethod: method,
    paymentStatus: 'PENDING',
    status: 'PENDING',
    lines: items.map((i) => ({
      name: i.productName || i.name || 'Ürün',
      quantity: num(i.quantity) || 1,
      lineTotal: num(i.lineTotal ?? num(i.unitPrice ?? i.price) * (num(i.quantity) || 1)),
    })),
    subtotal: num(pricing.subtotal),
    couponCode: pricing.couponCode ?? null,
    couponDiscount: num(pricing.couponDiscount),
    paymentDiscount: num(pricing.paymentDiscount),
    tax: num(pricing.tax),
    shipping: num(pricing.shipping),
    total: num(pricing.total),
    orderUrl: `${site}/orders/${encodeURIComponent(orderId)}`,
    adminUrl: `${site}/admin/orders/${encodeURIComponent(orderId)}`,
    siteUrl: site,
  }
}
