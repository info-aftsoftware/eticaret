/**
 * PayTR Payment Adapter
 * Webhook (bildirim URL) doğrulaması PayTR dokümantasyonuna göre yapılır:
 *   hash = base64(HMAC-SHA256(merchant_key, merchant_oid + merchant_salt + status + total_amount))
 * Ödeme başlatma (iFrame token) henüz entegre edilmedi; checkout şu an Stripe kullanır.
 */

import crypto from 'crypto'
import { PaymentAdapter, PaymentInitInput, PaymentInitResult, PaymentWebhookResult } from './base'

function getCredentials() {
  const merchantId = process.env.PAYTR_MERCHANT_ID
  const merchantKey = process.env.PAYTR_MERCHANT_KEY
  const merchantSalt = process.env.PAYTR_MERCHANT_SALT
  if (!merchantId || !merchantKey || !merchantSalt) {
    // Fail-closed: gizli anahtarlar yoksa hiçbir bildirim kabul edilmez.
    throw new Error('PAYTR_MERCHANT_ID / PAYTR_MERCHANT_KEY / PAYTR_MERCHANT_SALT tanımlı değil')
  }
  return { merchantId, merchantKey, merchantSalt }
}

export class PayTRAdapter implements PaymentAdapter {
  async initPayment(_input: PaymentInitInput): Promise<PaymentInitResult> {
    throw new Error('PayTR ödeme başlatma henüz entegre edilmedi')
  }

  async verifyWebhook(req: Request): Promise<PaymentWebhookResult> {
    const { merchantKey, merchantSalt } = getCredentials()

    // PayTR bildirimi application/x-www-form-urlencoded gönderir
    const form = new URLSearchParams(await req.text())
    const merchantOid = form.get('merchant_oid') || ''
    const status = form.get('status') || ''
    const totalAmount = form.get('total_amount') || ''
    const hash = form.get('hash') || ''
    if (!merchantOid || !status || !totalAmount || !hash) {
      throw new Error('Eksik PayTR bildirim alanları')
    }

    const expected = crypto
      .createHmac('sha256', merchantKey)
      .update(merchantOid + merchantSalt + status + totalAmount)
      .digest('base64')
    const a = Buffer.from(expected)
    const b = Buffer.from(hash)
    if (a.length !== b.length || !crypto.timingSafeEqual(a, b)) {
      throw new Error('Invalid PayTR webhook hash')
    }

    return {
      // Sipariş yalnızca kayıtlı paymentProviderRef (merchant_oid) ile eşleştirilir
      orderId: '',
      status: status === 'success' ? 'PAID' : 'FAILED',
      providerRef: merchantOid,
      amount: parseFloat(totalAmount) / 100,
      currency: 'TRY',
    }
  }

  async getPaymentStatus(providerRef: string): Promise<PaymentWebhookResult> {
    return {
      orderId: '',
      status: 'PENDING',
      providerRef,
      amount: 0,
      currency: 'TRY',
    }
  }
}
