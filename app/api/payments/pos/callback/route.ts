export const dynamic = 'force-dynamic'

/**
 * Banka sanal POS dönüşü (okUrl / failUrl). Banka, müşterinin tarayıcısı üzerinden form POST eder.
 * - İmza (hash ver3) doğrulanmadan hiçbir işlem yapılmaz.
 * - Doğrulanan sonuç ortak işleyiciye gider (lib/payments/settle-card.ts): onayda tutar kontrollü "ödendi",
 *   ret durumunda sipariş iptali ve stok/kupon iadesi, iptal edilmiş siparişe onayda yöneticiye acil uyarı.
 */

import { NextRequest } from 'next/server'
import { prisma } from '@/lib/prisma'
import { reportError } from '@/lib/alerts'
import { verifyPosCallback } from '@/lib/payments/bank-pos'
import { failRedirect, settleCardPayment } from '@/lib/payments/settle-card'

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
    // İmzasız/sahte istek veya POS kapalıyken gelen istek sistem hatası değildir: yöneticiye e-posta gitmez, yalnız günlüğe
    // yazılır (dışarıdan herkes bu adrese istek atabilir; kontrol listesi 31)
    console.warn('Sanal POS dönüşü reddedildi:', result.reason, params.oid ?? '')
    return failRedirect('verify')
  }

  const order = await prisma.order.findUnique({ where: { orderNo: result.orderNo } })
  if (!order) {
    await reportError('sanal-pos-donus', new Error('Sipariş bulunamadı'), { oid: result.orderNo })
    return failRedirect('verify')
  }

  const bankRef = [result.transId && `işlem no ${result.transId}`, result.authCode && `provizyon ${result.authCode}`].filter(Boolean).join(', ')
  return settleCardPayment(order, {
    approved: result.approved,
    amount: result.amount,
    currency: result.currency,
    providerRef: bankRef,
    label: 'Sanal POS',
    errorMessage: result.errorMessage,
    threeDFailed: result.errorMessage?.startsWith('3D') ?? false,
    logKey: 'sanal-pos',
  })
}
