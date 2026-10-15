/**
 * Müşteriye dönen sipariş yanıtından iç alanları çıkarır
 * (admin notu, onay kaydı/IP, ödeme sağlayıcı referansı, e-arşiv referansı).
 */
import type { Order, OrderLine, ReturnRequest } from '@prisma/client'
import { returnEligibility, toCustomerReturn } from '@/lib/return-service'

export function toCustomerOrder<T extends Order & { lines?: OrderLine[]; returnRequests?: ReturnRequest[] }>(order: T) {
  const { adminNote: _a, notes: _n, paymentProviderRef: _p, eArsivRef: _e, returnRequests, ...rest } = order
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
  creds: { email?: string | null; phone?: string | null }
): boolean {
  if (order.userId && userId && order.userId === userId) return true
  const email = creds.email?.trim().toLowerCase()
  const phone = normalizePhone(creds.phone)
  return (
    !!email && !!order.shippingEmail && order.shippingEmail.trim().toLowerCase() === email &&
    phone.length >= 10 && normalizePhone(order.shippingPhone) === phone
  )
}
