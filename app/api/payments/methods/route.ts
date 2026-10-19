export const dynamic = 'force-dynamic'

/**
 * Ödeme sayfası için kullanılabilir ödeme yöntemleri. Banka sanal POS bilgileri girilmemişse kart seçeneği
 * pasif gösterilir (müşteri formu doldurup en sonda "kartla ödeme kullanılamıyor" hatası almasın).
 */
import { NextResponse } from 'next/server'
import { isBankPosConfigured } from '@/lib/payments/bank-pos'

export async function GET() {
  return NextResponse.json({ bankTransfer: true, card: isBankPosConfigured() })
}
