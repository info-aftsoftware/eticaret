export const dynamic = 'force-dynamic'

/**
 * PayTR Webhook (Bildirim URL) Handler
 * Hash doğrulanır; sonuç applyPaymentResult ile idempotent ve tutar kontrollü uygulanır.
 * PayTR, işlenen her bildirime düz metin "OK" yanıtı bekler; aksi halde bildirimi tekrarlar.
 */

import { NextRequest, NextResponse } from 'next/server'
import { reportError } from '@/lib/alerts'
import { getPaymentAdapter } from '@/lib/adapters/payments'
import { applyPaymentResult } from '@/lib/payment-webhook'

export async function POST(request: NextRequest) {
  let result
  try {
    result = await getPaymentAdapter('paytr').verifyWebhook(request)
  } catch (error) {
    console.error('PayTR webhook verification error:', error)
    return new NextResponse('PAYTR notification failed: bad hash', { status: 400 })
  }

  try {
    await applyPaymentResult(result)
    return new NextResponse('OK', { status: 200, headers: { 'Content-Type': 'text/plain' } })
  } catch (error) {
    await reportError('paytr-webhook', error, { providerRef: result.providerRef })
    return new NextResponse('ERROR', { status: 500 })
  }
}
