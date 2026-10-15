/**
 * Prisma Order (API yanıtı) → müşteri arayüzünün kullandığı sipariş görünümü.
 * Profil > Siparişlerim ve /orders/[id] aynı biçimi (eski Firestore siparişleriyle uyumlu) kullanır.
 */

import { getCarrier } from '@/lib/shipping/carriers'

type ApiOrderLine = { id: string; productName: string; quantity: number; lineTotal: number; variantMatrix?: { productId?: string } | null }
export type ApiReturnRequest = {
  id: string
  requestNo: string
  type: string
  typeLabel: string
  status: string
  statusLabel: string
  items: { lineId: string; name: string; quantity: number }[]
  reason: string | null
  rejectReason: string | null
  carrierName: string | null
  returnCode: string | null
  refundAmount: number | null
  createdAt: string
}
type ApiOrderEvent = { id: string; type: string; status: string | null; message: string; createdAt: string }
type ApiOrder = {
  id: string
  orderNo: string
  status: string
  paymentStatus?: string
  paymentMethod?: string | null
  createdAt: string
  paidAt?: string | null
  shippedAt?: string | null
  deliveredAt?: string | null
  cancelledAt?: string | null
  trackingNumber?: string | null
  shippingCarrier?: string | null
  shippingName?: string
  shippingPhone?: string
  shippingAddress?: string
  shippingCity?: string
  shippingDistrict?: string
  shippingPostalCode?: string
  billingName?: string
  billingType?: string
  subtotal?: number
  couponCode?: string | null
  couponDiscount?: number
  paymentDiscount?: number
  vatTotal?: number
  shippingCost?: number
  total: number
  customerNote?: string | null
  canCancel?: boolean
  returns?: { canWithdraw: boolean; canReportDefect: boolean; withdrawalUntil: string | null; returnable: Record<string, number> } | null
  returnRequests?: ApiReturnRequest[]
  lines?: ApiOrderLine[]
  events?: ApiOrderEvent[]
}

const STATUS_MAP: Record<string, string> = {
  PENDING: 'pending',
  CONFIRMED: 'confirmed',
  PICKING: 'confirmed',
  PROCESSING: 'processing',
  PAID: 'paid',
  SHIPPED: 'shipped',
  DELIVERED: 'delivered',
  CANCELLED: 'cancelled',
  RETURNED: 'returned',
}

export const ORDER_STATUS_LABELS: Record<string, string> = {
  pending: 'Beklemede',
  paid: 'Ödendi',
  confirmed: 'Hazırlanıyor',
  processing: 'Hazırlanıyor',
  shipped: 'Kargoda',
  delivered: 'Teslim Edildi',
  cancelled: 'İptal',
  returned: 'İade',
}

export function toOrderView(o: ApiOrder) {
  const carrier = o.shippingCarrier ? getCarrier(o.shippingCarrier) : undefined
  const paymentMethod = o.paymentMethod === 'stripe' || o.paymentMethod === 'paytr' ? 'card' : o.paymentMethod ?? null
  return {
    id: o.orderNo,
    orderId: o.orderNo,
    createdAt: new Date(o.createdAt),
    status: STATUS_MAP[o.status] ?? o.status.toLowerCase(),
    paymentStatus: o.paymentStatus,
    paymentMethod,
    awaitingTransfer: paymentMethod === 'bank_transfer' && o.paymentStatus !== 'PAID' && o.status === 'PENDING',
    canCancel: !!o.canCancel,
    trackingNumber: o.trackingNumber,
    carrierName: carrier?.name ?? o.shippingCarrier ?? null,
    trackingUrl: carrier && o.trackingNumber ? carrier.trackingUrl(o.trackingNumber) : null,
    dates: {
      paidAt: o.paidAt ? new Date(o.paidAt) : null,
      shippedAt: o.shippedAt ? new Date(o.shippedAt) : null,
      deliveredAt: o.deliveredAt ? new Date(o.deliveredAt) : null,
      cancelledAt: o.cancelledAt ? new Date(o.cancelledAt) : null,
    },
    customer: {
      name: o.shippingName,
      phone: o.shippingPhone,
      addressLine: o.shippingAddress,
      city: o.shippingCity,
      district: o.shippingDistrict,
      postalCode: o.shippingPostalCode,
    },
    customerNote: o.customerNote ?? null,
    // price × quantity = KDV dahil satır toplamı
    items: (o.lines ?? []).map((l) => ({
      id: l.id,
      productId: l.variantMatrix?.productId ?? null,
      name: l.productName,
      quantity: l.quantity,
      price: l.quantity ? l.lineTotal / l.quantity : l.lineTotal,
    })),
    pricing: {
      subtotal: o.subtotal ?? 0,
      couponCode: o.couponCode ?? null,
      couponDiscount: o.couponDiscount ?? 0,
      paymentDiscount: o.paymentDiscount ?? 0,
      tax: o.vatTotal ?? 0,
      shipping: o.shippingCost ?? 0,
      total: o.total,
    },
    events: (o.events ?? []).map((e) => ({ ...e, createdAt: new Date(e.createdAt) })),
    returns: o.returns
      ? { ...o.returns, withdrawalUntil: o.returns.withdrawalUntil ? new Date(o.returns.withdrawalUntil) : null }
      : null,
    returnRequests: o.returnRequests ?? [],
  }
}

export type OrderView = ReturnType<typeof toOrderView>
