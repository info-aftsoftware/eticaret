/**
 * Kartlı ödeme sağlayıcısı seçimi: iyzico anahtarları tanımlıysa iyzico Ödeme Formu, değilse banka sanal POS'u
 * (NestPay 3D Pay Hosting). İkisi de yoksa kartla ödeme kapalıdır (ödeme sayfasında pasif gösterilir).
 */
import { isIyzicoConfigured } from '@/lib/payments/iyzico'
import { isBankPosConfigured } from '@/lib/payments/bank-pos'

export type CardProvider = 'iyzico' | 'bank'

export function getCardProvider(): CardProvider | null {
  if (isIyzicoConfigured()) return 'iyzico'
  if (isBankPosConfigured()) return 'bank'
  return null
}

export const isCardPaymentAvailable = () => getCardProvider() !== null
