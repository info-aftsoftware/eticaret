/**
 * Kart ödemesi dönüşünün ortak işlenmesi (banka sanal POS ve iyzico). Sonuç sağlayıcıdan doğrulanmış olarak gelir.
 * - Onaylıysa: tutar kontrollü ve idempotent olarak sipariş "ödendi" yapılır → başarı sayfası.
 * - Onaylanmadıysa: bekleyen sipariş iptal edilir (stok ve kupon geri verilir) → sepet korunur, tekrar denenebilir.
 * - İptal edilmiş siparişe onay gelirse: yöneticiye acil uyarı, sağlayıcı panelinden iade gerekir.
 * Müşteriye gösterilen mesajlar sabit kodlarla seçilir (adres çubuğundan keyfi metin gösterilmez).
 */
import { NextResponse } from 'next/server'
import type { Order } from '@prisma/client'
import { reportError } from '@/lib/alerts'
import { applyPaymentResult } from '@/lib/payment-webhook'
import { changeOrderStatus, logOrderEvent, markPaymentFailed, OrderTransitionError } from '@/lib/order-service'
import type { PosFailCode } from '@/lib/payments/pos-messages'

export function siteUrl(path: string) {
  const base = (process.env.NEXT_PUBLIC_SITE_URL || process.env.NEXT_PUBLIC_BASE_URL || 'https://voltekno.com').replace(/\/$/, '')
  return `${base}${path}`
}

export function failRedirect(code: PosFailCode, orderNo: string | null = null, cancelled = false) {
  const qs = new URLSearchParams({ reason: code })
  if (orderNo) qs.set('order_id', orderNo)
  if (cancelled) qs.set('cancelled', '1')
  return NextResponse.redirect(siteUrl(`/checkout/cancel?${qs}`), 303)
}

export type CardSettlement = {
  approved: boolean
  amount: number
  currency: string
  /** Kayıt için sağlayıcı referansı (ör. "işlem no …, provizyon …" / "iyzico ödeme no …") */
  providerRef: string
  /** Sipariş geçmişindeki etiket ("Sanal POS" / "iyzico") */
  label: string
  errorMessage: string | null
  threeDFailed: boolean
  /** Hata kaydı anahtarı öneki (ör. "sanal-pos", "iyzico") */
  logKey: string
}

export async function settleCardPayment(order: Order, r: CardSettlement): Promise<NextResponse> {
  try {
    if (r.approved) {
      if (order.status === 'CANCELLED') {
        await reportError('IPTAL-EDILMIS-SIPARISE-ODEME', new Error(`İptal edilmiş siparişe kart ödemesi onaylandı — ${r.label} panelinden iade/iptal gerekli`), {
          orderNo: order.orderNo,
          amount: `${r.amount} ${r.currency}`,
          ref: r.providerRef || null,
        })
        await logOrderEvent(order.id, {
          type: 'payment',
          message: `UYARI: İptal edilmiş siparişe ${r.amount} ${r.currency} kart ödemesi onaylandı (${r.providerRef || 'ref. yok'}). ${r.label} panelinden iade/iptal yapılmalı.`,
          visibleToCustomer: false,
        })
        return failRedirect('paid_cancelled', order.orderNo)
      }

      let applied: Awaited<ReturnType<typeof applyPaymentResult>>
      try {
        applied = await applyPaymentResult({
          orderId: order.id,
          status: 'PAID',
          providerRef: order.paymentProviderRef ?? '',
          amount: r.amount,
          currency: r.currency,
        })
      } catch (e) {
        if (e instanceof OrderTransitionError) {
          await reportError('IPTAL-EDILMIS-SIPARISE-ODEME', new Error(`Ödeme onayı sırasında sipariş iptal edilmiş — ${r.label} panelinden iade/iptal gerekli`), {
            orderNo: order.orderNo,
            amount: `${r.amount} ${r.currency}`,
            ref: r.providerRef || null,
          })
          return failRedirect('paid_cancelled', order.orderNo)
        }
        throw e
      }
      if (applied === 'paid' && r.providerRef) {
        await logOrderEvent(order.id, { type: 'payment', message: `${r.label} onayı: ${r.providerRef}.`, visibleToCustomer: false })
      }
      if (applied === 'paid' || applied === 'already_paid') {
        const qs = new URLSearchParams({ order_id: order.orderNo, payment: 'card', session_id: order.paymentProviderRef ?? '' })
        return NextResponse.redirect(siteUrl(`/checkout/success?${qs}`), 303)
      }
      // Tutar uyuşmazlığı: sipariş ödendi yapılmadı, yöneticiye bildirim gitti
      return failRedirect('amount', order.orderNo)
    }

    let cancelled = false
    if (order.paymentStatus !== 'PAID') {
      await markPaymentFailed(order.id, `Kart ödemesi başarısız: ${r.errorMessage}${r.providerRef ? ` (${r.providerRef})` : ''}`)
      if (order.status === 'PENDING') {
        try {
          await changeOrderStatus(order.id, 'CANCELLED', { actor: 'system', reason: 'Kart ödemesi tamamlanmadı', notifyCustomer: false })
          cancelled = true
        } catch (e) {
          await reportError(`${r.logKey}-iptal`, e, { orderNo: order.orderNo })
        }
      }
    }
    return failRedirect(r.threeDFailed ? '3d' : 'declined', order.orderNo, cancelled)
  } catch (e) {
    await reportError(`${r.logKey}-donus`, e, { orderNo: order.orderNo })
    return failRedirect('server', order.orderNo)
  }
}
