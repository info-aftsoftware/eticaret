export const dynamic = 'force-dynamic'

/**
 * Ödeme sayfası için kullanılabilir ödeme yöntemleri. Kart sağlayıcısı (iyzico veya banka sanal POS) tanımlı
 * değilse kart seçeneği pasif gösterilir (müşteri formu doldurup en sonda "kartla ödeme kullanılamıyor" hatası almasın).
 */
import { NextResponse } from 'next/server'
import { getCardProvider } from '@/lib/payments/card'

export async function GET() {
  const provider = getCardProvider()
  return NextResponse.json({ bankTransfer: true, card: provider !== null, cardProvider: provider })
}
