export const dynamic = 'force-dynamic'

/**
 * iyzico Ödeme Formu dönüşü. iyzico, müşterinin tarayıcısı üzerinden callbackUrl'e yalnızca `token` POST eder.
 * Sonuç tarayıcıdan gelen alanlardan değil, token ile iyzico'ya sunucudan sunucuya sorularak alınır
 * (lib/payments/iyzico.ts → retrieveCheckoutForm). Doğrulanan sonuç ortak işleyiciye gider (settle-card.ts).
 */

import { NextRequest } from 'next/server'
import { prisma } from '@/lib/prisma'
import { reportError } from '@/lib/alerts'
import { retrieveCheckoutForm } from '@/lib/payments/iyzico'
import { failRedirect, settleCardPayment } from '@/lib/payments/settle-card'

export async function POST(request: NextRequest) {
  let token = ''
  try {
    const form = await request.formData()
    const t = form.get('token')
    token = typeof t === 'string' ? t.trim() : ''
  } catch {
    return failRedirect('verify')
  }
  if (!token) return failRedirect('verify')

  let result: Awaited<ReturnType<typeof retrieveCheckoutForm>>
  try {
    result = await retrieveCheckoutForm(token)
  } catch (e) {
    await reportError('iyzico-sorgu', e)
    return failRedirect('server')
  }
  if (!result.valid) {
    // Sahte / geçersiz token sistem hatası değildir (herkes bu adrese istek atabilir): yalnız günlüğe yazılır
    console.warn('iyzico dönüşü reddedildi:', result.reason)
    return failRedirect('verify')
  }

  const order = await prisma.order.findUnique({ where: { orderNo: result.orderNo } })
  if (!order) {
    await reportError('iyzico-donus', new Error('Sipariş bulunamadı'), { orderNo: result.orderNo })
    return failRedirect('verify')
  }

  return settleCardPayment(order, {
    approved: result.approved,
    underReview: result.underReview,
    amount: result.amount,
    currency: result.currency,
    providerRef: [result.paymentId && `iyzico ödeme no ${result.paymentId}`, result.paidPrice != null && result.paidPrice !== result.amount && `çekilen ${result.paidPrice} TL (taksit farkı dahil)`].filter(Boolean).join(', '),
    label: 'iyzico',
    errorMessage: result.errorMessage,
    threeDFailed: result.threeDFailed,
    logKey: 'iyzico',
  })
}
