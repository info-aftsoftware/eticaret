/** Sipariş durum/ödeme etiketleri ve renkleri (istemci tarafı; lib/order-service ile aynı anlamlar) */

import type { PillTone } from './ui'

export const ORDER_STATUS_LABEL: Record<string, string> = {
  PENDING: 'Beklemede',
  CONFIRMED: 'Onaylandı',
  PROCESSING: 'İşleniyor',
  PAID: 'Ödendi',
  PICKING: 'Hazırlanıyor',
  SHIPPED: 'Kargoda',
  DELIVERED: 'Teslim Edildi',
  CANCELLED: 'İptal',
  RETURNED: 'İade',
}

export const ORDER_STATUS_TONE: Record<string, PillTone> = {
  PENDING: 'amber',
  CONFIRMED: 'blue',
  PROCESSING: 'blue',
  PAID: 'navy',
  PICKING: 'violet',
  SHIPPED: 'blue',
  DELIVERED: 'green',
  CANCELLED: 'red',
  RETURNED: 'slate',
}

export const PAYMENT_STATUS_LABEL: Record<string, string> = {
  PENDING: 'Ödeme bekleniyor',
  PAID: 'Ödendi',
  FAILED: 'Başarısız',
  REFUNDED: 'İade edildi',
  PARTIALLY_REFUNDED: 'Kısmi iade',
}

export const PAYMENT_STATUS_TONE: Record<string, PillTone> = {
  PENDING: 'amber',
  PAID: 'green',
  FAILED: 'red',
  REFUNDED: 'slate',
  PARTIALLY_REFUNDED: 'slate',
}

export const PAYMENT_METHOD_LABEL: Record<string, string> = {
  bank_transfer: 'Havale/EFT',
  card: 'Kart',
  stripe: 'Kart (Stripe)',
  paytr: 'Kart (PayTR)',
}

export const statusLabel = (s?: string | null) => (s ? ORDER_STATUS_LABEL[s.toUpperCase()] ?? s : '—')
export const paymentLabel = (s?: string | null) => (s ? PAYMENT_STATUS_LABEL[s.toUpperCase()] ?? s : '—')
export const methodLabel = (s?: string | null) => (s ? PAYMENT_METHOD_LABEL[s] ?? s : '—')

/** GET /api/admin/orders satırı */
export type AdminOrderRow = {
  id: string
  orderNo: string
  createdAt: string
  userId: string | null
  customerNo: string | null
  customerName: string
  customerEmail: string | null
  phone: string
  city: string
  total: number
  status: string
  paymentStatus: string
  paymentMethod: string | null
  trackingNumber: string | null
  itemCount: number
  openReturns: number
  paymentNotified: boolean
  cancelRequested: boolean
  allowed: string[]
}
