/**
 * Siparişin kargo ölçüsü (Navlungo ve Geliver gönderisi için ortak): sipariş anındaki kargo teklifindeki desi/kg,
 * yoksa ürünlerin desi/kg bilgisi (sipariş satırındaki panel lojistiği, yoksa lib/catalog/desi.json).
 */
import type { Order, OrderLine } from '@prisma/client'
import { cartLogistics, type LineLogisticsOverride } from '@/lib/shipping/fee'

type OrderWithLines = Pick<Order, 'shippingQuote'> & { lines: Pick<OrderLine, 'id' | 'quantity' | 'variantMatrix'>[] }

export function orderParcel(order: OrderWithLines): { desi: number; kg: number | null } {
  const q = (order.shippingQuote && typeof order.shippingQuote === 'object' ? order.shippingQuote : null) as { desi?: number; kg?: number } | null
  if (typeof q?.desi === 'number') return { desi: q.desi, kg: typeof q.kg === 'number' ? q.kg : null }
  const l = cartLogistics(
    order.lines.map((line) => {
      // Panel lojistiği (A07) sipariş satırına yazılır
      const vm = line.variantMatrix as { productId?: string; logistics?: LineLogisticsOverride } | null
      const productId = vm?.productId ?? line.id
      return { id: productId, productId, quantity: line.quantity, logistics: vm?.logistics }
    })
  )
  return { desi: l.desiExact ?? l.desi, kg: l.kg }
}

/**
 * Desi ve ağırlıktan koli ölçüsü: kenarları desiyi veren küp (en×boy×yükseklik / 3000 = desi).
 * Kargo firması ücreti hacim desisi ile ağırlığın büyüğünden alır; gerçek koli ölçüsü bilinmediği için küp yeterli.
 */
export function parcelDimensions(desi: number, kg: number | null) {
  const side = Math.max(1, Math.ceil(Math.cbrt(Math.max(desi, 0.1) * 3000)))
  return { lengthCm: side, widthCm: side, heightCm: side, weightKg: Math.max(0.1, Math.round((kg ?? desi) * 100) / 100) }
}
