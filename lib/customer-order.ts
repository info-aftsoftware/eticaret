/**
 * Müşteriye dönen sipariş yanıtından iç alanları çıkarır
 * (admin notu, onay kaydı/IP, ödeme sağlayıcı referansı, e-arşiv referansı).
 */
import type { Order, OrderLine, ReturnRequest } from '@prisma/client'
import { returnEligibility, toCustomerReturn } from '@/lib/return-service'

export function toCustomerOrder<T extends Order & { lines?: OrderLine[]; returnRequests?: ReturnRequest[] }>(order: T) {
  const {
    adminNote: _a, notes: _n, paymentProviderRef: _p, eArsivRef: _e,
    navlungoLabelUrl: _l, navlungoTestMode: _t, navlungoSyncedAt: _s, navlungoStatusCode: _c,
    returnRequests, ...rest
  } = order
  const elig = order.lines && returnRequests
    ? returnEligibility({ ...order, lines: order.lines, returnRequests })
    : null
  return {
    ...rest,
    /** Müşteri yalnızca ödenmemiş, beklemedeki siparişini iptal edebilir */
    canCancel: order.status === 'PENDING' && order.paymentStatus !== 'PAID',
    returnRequests: (returnRequests ?? []).map(toCustomerReturn),
    returns: elig
      ? {
          canWithdraw: elig.withdrawal,
          canReportDefect: elig.defective,
          withdrawalUntil: elig.withdrawalUntil,
          returnable: elig.returnable,
        }
      : null,
  }
}

const normalizePhone = (s: unknown) =>
  typeof s === 'string' ? s.replace(/\D/g, '').replace(/^90/, '').replace(/^0/, '') : ''

/**
 * Müşterinin siparişe erişim yetkisi: sipariş sahibi (userId eşleşmesi) veya
 * misafir için e-posta + telefonun ikisinin de siparişle eşleşmesi.
 */
export function canAccessOrder(
  order: Pick<Order, 'userId' | 'shippingEmail' | 'shippingPhone'>,
  userId: string | null,
  creds: { email?: unknown; phone?: unknown }
): boolean {
  if (order.userId && userId && order.userId === userId) return true
  // Gövdeden gelen değerler metin olmayabilir (ör. dizi/nesne): metin değilse eşleşme yok sayılır, 500 verilmez
  const email = typeof creds.email === 'string' ? creds.email.trim().toLowerCase() : ''
  const phone = normalizePhone(typeof creds.phone === 'string' ? creds.phone : null)
  return (
    !!email && !!order.shippingEmail && order.shippingEmail.trim().toLowerCase() === email &&
    phone.length >= 10 && normalizePhone(order.shippingPhone) === phone
  )
}
