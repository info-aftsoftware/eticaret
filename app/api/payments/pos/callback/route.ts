export const dynamic = 'force-dynamic'

/**
 * Banka sanal POS dönüşü (okUrl / failUrl). Banka, müşterinin tarayıcısı üzerinden form POST eder.
 * - İmza (hash ver3) doğrulanmadan hiçbir işlem yapılmaz.
 * - Onaylıysa: tutar kontrollü ve idempotent olarak sipariş "ödendi" yapılır → başarı sayfası.
 * - Onaylanmadıysa: bekleyen sipariş iptal edilir (stok ve kupon geri verilir) → sepet korunur, tekrar denenebilir.
 * - İptal edilmiş siparişe onay gelirse (ör. geri tuşuyla aynı form yeniden gönderildi): yöneticiye acil uyarı, iade gerekir.
 * Müşteriye gösterilen mesajlar sabit kodlarla seçilir (adres çubuğundan keyfi metin gösterilmez).
 */

import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import { reportError } from '@/lib/alerts'
import { verifyPosCallback } from '@/lib/payments/bank-pos'
import { applyPaymentResult } from '@/lib/payment-webhook'
import { changeOrderStatus, logOrderEvent, markPaymentFailed } from '@/lib/order-service'
import type { PosFailCode } from '@/lib/payments/pos-messages'

function siteUrl(path: string) {
  const base = (process.env.NEXT_PUBLIC_SITE_URL || process.env.NEXT_PUBLIC_BASE_URL || 'https://voltekno.com').replace(/\/$/, '')
  return `${base}${path}`
}

function failRedirect(code: PosFailCode, orderNo: string | null = null, cancelled = false) {
  const qs = new URLSearchParams({ reason: code })
  if (orderNo) qs.set('order_id', orderNo)
  if (cancelled) qs.set('cancelled', '1')
  return NextResponse.redirect(siteUrl(`/checkout/cancel?${qs}`), 303)
}

export async function POST(request: NextRequest) {
  const params: Record<string, string> = {}
  try {
    const form = await request.formData()
    form.forEach((v, k) => {
      if (typeof v === 'string') params[k] = v
    })
  } catch {
    return failRedirect('verify')
  }

  const result = verifyPosCallback(params)
  if (!result.valid) {
    await reportError('sanal-pos-donus', new Error(result.reason), { oid: params.oid ?? null })
    return failRedirect('verify')
  }

  const order = await prisma.order.findUnique({ where: { orderNo: result.orderNo } })
  if (!order) {
    await reportError('sanal-pos-donus', new Error('Sipariş bulunamadı'), { oid: result.orderNo })
    return failRedirect('verify')
  }

  const bankRef = [result.transId && `işlem no ${result.transId}`, result.authCode && `provizyon ${result.authCode}`].filter(Boolean).join(', ')

  try {
    if (result.approved) {
      // İptal edilmiş siparişe gelen onay: para çekildi, stok/kupon zaten iade edildi → elle iade/iptal gerekir
      if (order.status === 'CANCELLED') {
        await reportError('IPTAL-EDILMIS-SIPARISE-ODEME', new Error('İptal edilmiş siparişe kart ödemesi onaylandı — bankadan iade/iptal gerekli'), {
          orderNo: order.orderNo,
          amount: `${result.amount} ${result.currency}`,
          bankRef: bankRef || null,
        })
        await logOrderEvent(order.id, {
          type: 'payment',
          message: `UYARI: İptal edilmiş siparişe ${result.amount} ${result.currency} kart ödemesi onaylandı (${bankRef || 'banka ref. yok'}). Banka panelinden iade/iptal yapılmalı.`,
          visibleToCustomer: false,
        })
        return failRedirect('paid_cancelled', order.orderNo)
      }

      const applied = await applyPaymentResult({
        orderId: order.id,
        status: 'PAID',
        providerRef: order.paymentProviderRef ?? '',
        amount: result.amount,
        currency: result.currency,
      })
      if (applied === 'paid' && bankRef) {
        await logOrderEvent(order.id, { type: 'payment', message: `Sanal POS onayı: ${bankRef}.`, visibleToCustomer: false })
      }
      if (applied === 'paid' || applied === 'already_paid') {
        const qs = new URLSearchParams({ order_id: order.orderNo, payment: 'card', session_id: order.paymentProviderRef ?? '' })
        return NextResponse.redirect(siteUrl(`/checkout/success?${qs}`), 303)
      }
      // Tutar uyuşmazlığı: sipariş ödendi yapılmadı, yöneticiye bildirim gitti
      return failRedirect('amount', order.orderNo)
    }

    // Onaylanmadı: bekleyen siparişi iptal et (stok + kupon iadesi), müşteri sepetinden tekrar deneyebilir
    let cancelled = false
    if (order.paymentStatus !== 'PAID') {
      await markPaymentFailed(order.id, `Kart ödemesi başarısız: ${result.errorMessage}${bankRef ? ` (${bankRef})` : ''}`)
      if (order.status === 'PENDING') {
        try {
          await changeOrderStatus(order.id, 'CANCELLED', { actor: 'system', reason: 'Kart ödemesi tamamlanmadı', notifyCustomer: false })
          cancelled = true
        } catch (e) {
          await reportError('sanal-pos-iptal', e, { orderNo: order.orderNo })
        }
      }
    }
    const threeDFailed = result.errorMessage?.startsWith('3D') ?? false
    return failRedirect(threeDFailed ? '3d' : 'declined', order.orderNo, cancelled)
  } catch (e) {
    await reportError('sanal-pos-donus', e, { orderNo: order.orderNo })
    return failRedirect('server', order.orderNo)
  }
}
