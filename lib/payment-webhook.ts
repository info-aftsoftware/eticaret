/**
 * Doğrulanmış ödeme webhook sonucunu siparişe uygular (Stripe ve PayTR ortak).
 * - Idempotent: PAID olmuş sipariş tekrar işlenmez, FAILED'a düşürülmez.
 * - Tutar kontrolü: ödenen tutar sipariş toplamıyla eşleşmezse sipariş PAID yapılmaz.
 * - PAID: lib/order-service markOrderPaid (zaman çizelgesi, e-postalar, fatura).
 */

import { prisma } from '@/lib/prisma'
import { reportError } from '@/lib/alerts'
import type { PaymentWebhookResult } from '@/lib/adapters/payments/base'
import { markOrderPaid, markPaymentFailed, logOrderEvent } from '@/lib/order-service'

export type ApplyResult = 'ignored' | 'not_found' | 'already_paid' | 'amount_mismatch' | 'paid' | 'failed'

export async function applyPaymentResult(result: PaymentWebhookResult): Promise<ApplyResult> {
  if (result.status !== 'PAID' && result.status !== 'FAILED') return 'ignored'

  const or: { id?: string; paymentProviderRef?: string }[] = []
  if (result.orderId) or.push({ id: result.orderId })
  if (result.providerRef) or.push({ paymentProviderRef: result.providerRef })
  if (or.length === 0) return 'not_found'

  const order = await prisma.order.findFirst({ where: { OR: or } })
  if (!order) return 'not_found'
  if (order.paymentStatus === 'PAID') return 'already_paid'

  if (result.status === 'FAILED') {
    await markPaymentFailed(order.id, 'Kart ödemesi tamamlanmadı veya ödeme oturumu sona erdi.')
    return 'failed'
  }

  if (!Number.isFinite(result.amount) || Math.abs(result.amount - order.total) > 0.01 || result.currency.toUpperCase() !== order.currency.toUpperCase()) {
    await reportError('odeme-tutari-uyusmazligi', new Error('Ödenen tutar sipariş toplamıyla eşleşmiyor'), {
      orderNo: order.orderNo,
      paid: `${result.amount} ${result.currency}`,
      expected: `${order.total} ${order.currency}`,
    })
    await logOrderEvent(order.id, {
      type: 'payment',
      message: `UYARI: Ödeme tutarı uyuşmuyor (ödenen ${result.amount} ${result.currency}, beklenen ${order.total} ${order.currency}). Sipariş ödendi olarak işaretlenmedi.`,
      visibleToCustomer: false,
    })
    return 'amount_mismatch'
  }

  const paid = await markOrderPaid(order.id, { actor: 'system' })
  return paid ? 'paid' : 'already_paid'
}
