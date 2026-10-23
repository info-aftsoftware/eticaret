/**
 * Yönetim raporlarının ortak tanımları (Genel Bakış, İstatistikler, müşteri kartı aynı kuralları kullanır).
 *
 * - Tahsilat: ödemesi alınmış (Ödendi / Kısmi iade) ve iptal/iade durumunda olmayan siparişlerin toplamı,
 *   ödeme tarihine (paidAt) göre; tamamlanmış ücret iadeleri (ReturnRequest REFUNDED) düşülür.
 *   Sipariş toplamı KDV ve kargo dahil, indirimler (kupon + havale) düşülmüş tutardır.
 * - Sipariş hacmi: dönemde oluşturulan, iptal/iade edilmemiş tüm siparişlerin toplamı (ödeme bekleyenler dahil),
 *   sipariş tarihine (createdAt) göre. Tahsil edilmiş gelir değildir.
 * - Ürün bedeli (en çok satanlar): sipariş satırı toplamı, KDV dahil ve indirim öncesi.
 */

import type { Prisma } from '@prisma/client'
import { prisma } from '@/lib/prisma'

export const EXCLUDED_ORDER_STATUSES = ['CANCELLED', 'RETURNED'] as const
export const COLLECTED_PAYMENT_STATUSES = ['PAID', 'PARTIALLY_REFUNDED'] as const

type Range = { gte: Date; lt?: Date }

/** Tahsilata giren siparişler (ödeme tarihi aralığı verilirse ona göre) */
export function collectedOrderWhere(paidAt?: Range): Prisma.OrderWhereInput {
  return {
    paymentStatus: { in: [...COLLECTED_PAYMENT_STATUSES] },
    status: { notIn: [...EXCLUDED_ORDER_STATUSES] },
    ...(paidAt ? { paidAt } : {}),
  }
}

/** Sipariş hacmine giren siparişler (sipariş tarihi aralığı) */
export function volumeOrderWhere(createdAt: Range): Prisma.OrderWhereInput {
  return { createdAt, status: { notIn: [...EXCLUDED_ORDER_STATUSES] } }
}

/** Saf kural: sipariş tahsilata girer mi (müşteri kartı gibi bellek içi hesaplar için) */
export function isCollectedOrder(o: { paymentStatus: string; status: string }): boolean {
  return (
    (COLLECTED_PAYMENT_STATUSES as readonly string[]).includes(o.paymentStatus) &&
    !(EXCLUDED_ORDER_STATUSES as readonly string[]).includes(o.status)
  )
}

const round2 = (n: number) => Math.round(n * 100) / 100

/** Siparişlere yapılmış (tamamlanmış) ücret iadeleri, sipariş id'sine göre */
export async function refundedByOrder(orderIds: string[]): Promise<Map<string, number>> {
  const map = new Map<string, number>()
  if (!orderIds.length) return map
  const rows = await prisma.returnRequest.findMany({
    where: { orderId: { in: orderIds }, status: 'REFUNDED' },
    select: { orderId: true, refundAmount: true },
  })
  for (const r of rows) map.set(r.orderId, (map.get(r.orderId) ?? 0) + (r.refundAmount ?? 0))
  return map
}

export type CollectedOrder = { id: string; total: number; paidAt: Date | null }

/** Tahsilat: siparişler, iadeler düşülmüş net tutarlarıyla */
export async function collectedOrders(paidAt?: Range): Promise<{ orders: (CollectedOrder & { net: number })[]; gross: number; refunded: number; net: number }> {
  const orders = await prisma.order.findMany({ where: collectedOrderWhere(paidAt), select: { id: true, total: true, paidAt: true } })
  const refunds = await refundedByOrder(orders.map((o) => o.id))
  const rows = orders.map((o) => ({ ...o, net: round2(Math.max(0, o.total - (refunds.get(o.id) ?? 0))) }))
  const gross = round2(orders.reduce((s, o) => s + o.total, 0))
  const net = round2(rows.reduce((s, o) => s + o.net, 0))
  return { orders: rows, gross, refunded: round2(gross - net), net }
}
