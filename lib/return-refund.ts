/**
 * İade tutarı önerisi (saf hesap; lib/return-service.ts yeniden dışa aktarır, birim testli).
 */
import type { Order, OrderLine, ReturnRequest } from '@prisma/client'

/** Açık veya tamamlanmış talepler (reddedilen / iptal edilenler sayılmaz) */
const COUNTED_STATUSES = ['REQUESTED', 'APPROVED', 'RECEIVED', 'REFUNDED']

type ReturnItem = { lineId: string; name: string; quantity: number }
type OrderWithReturns = Pick<Order, 'subtotal' | 'total' | 'shippingCost'> & {
  lines: Pick<OrderLine, 'id' | 'unitPrice' | 'quantity'>[]
  returnRequests?: Pick<ReturnRequest, 'id' | 'status' | 'items'>[]
}

const round2 = (n: number) => Math.round(n * 100) / 100
const itemsOf = (r: Pick<ReturnRequest, 'items'>) => (Array.isArray(r.items) ? (r.items as ReturnItem[]) : [])

/**
 * Önerilen iade tutarı: iade edilen satırların indirimli payı (+ siparişin tamamı iade edilmiş oluyorsa kargo ücreti).
 * Ürünler birkaç ayrı taleple dönebilir: bu talep, diğer açık/tamamlanmış taleplerle birlikte siparişin hepsini
 * kapatıyorsa kargo ücreti bu son talebe eklenir (requestId: bu talep, diğerlerinden ayırmak için).
 */
export function suggestedRefund(order: OrderWithReturns, items: ReturnItem[], requestId?: string): number {
  const unit = Object.fromEntries(order.lines.map((l) => [l.id, l.unitPrice]))
  const returnedSubtotal = items.reduce((s, i) => s + (unit[i.lineId] ?? 0) * i.quantity, 0)
  if (order.subtotal <= 0) return 0
  const ratio = Math.min(1, returnedSubtotal / order.subtotal)
  const goods = (order.total - order.shippingCost) * ratio
  const other: Record<string, number> = {}
  for (const r of order.returnRequests ?? []) {
    if (r.id === requestId || !COUNTED_STATUSES.includes(r.status)) continue
    for (const i of itemsOf(r)) other[i.lineId] = (other[i.lineId] ?? 0) + i.quantity
  }
  const thisQty = (lineId: string) => items.filter((i) => i.lineId === lineId).reduce((n, i) => n + i.quantity, 0)
  const fullReturn = order.lines.every((l) => (other[l.id] ?? 0) + thisQty(l.id) >= l.quantity)
  return round2(goods + (fullReturn ? order.shippingCost : 0))
}
