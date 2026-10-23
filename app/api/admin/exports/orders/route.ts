export const dynamic = 'force-dynamic'

import { NextRequest, NextResponse } from 'next/server'
import { checkAdmin, logAdminAction } from '@/lib/adminAuth'
import { prisma } from '@/lib/prisma'
import { ORDER_STATUS_LABELS_TR } from '@/lib/order-service'
import { shippingQuoteView } from '@/lib/shipping/quote-view'
import { getCarrier } from '@/lib/shipping/carriers'
import { csvResponseHeaders, toCsv } from '@/lib/csv'
import { addDaysToKey, businessDateKey, businessDayStartOf, isDateKey } from '@/lib/business-time'

const PAYMENT_STATUS_TR: Record<string, string> = {
  PENDING: 'Bekliyor',
  PAID: 'Ödendi',
  FAILED: 'Başarısız',
  REFUNDED: 'İade edildi',
  PARTIALLY_REFUNDED: 'Kısmi iade',
}
const PAYMENT_METHOD_TR: Record<string, string> = { bank_transfer: 'Havale/EFT', card: 'Kredi kartı' }

/**
 * Muhasebe dökümü (Excel uyumlu CSV): ?from=YYYY-MM-DD&to=YYYY-MM-DD (sipariş tarihi, İstanbul günü; varsayılan bugün dahil son 31 gün)
 * &detail=lines ile sipariş satırları (ürün, adet, birim fiyat, KDV oranı, satır toplamı).
 * Tutarlar TL; ara toplam KDV hariçtir, indirimler KDV matrahından düşülmüştür (lib/store-config computeOrderTotals).
 */
export async function GET(request: NextRequest) {
  const auth = await checkAdmin(request)
  if ('error' in auth) return NextResponse.json({ error: auth.error }, { status: auth.status })
  const sp = request.nextUrl.searchParams
  // Gün sınırları Türkiye saatine göre (lib/business-time); bitiş günü dahil
  const toKey = isDateKey(sp.get('to')) ? sp.get('to')! : businessDateKey()
  const fromKey = isDateKey(sp.get('from')) ? sp.get('from')! : addDaysToKey(toKey, -30)
  if (fromKey > toKey) return NextResponse.json({ error: 'Başlangıç tarihi bitişten sonra olamaz.' }, { status: 400 })
  const from = businessDayStartOf(fromKey)
  const toExclusive = businessDayStartOf(addDaysToKey(toKey, 1))
  const lines = sp.get('detail') === 'lines'

  const orders = await prisma.order.findMany({
    where: { createdAt: { gte: from, lt: toExclusive } },
    include: { lines: lines },
    orderBy: { createdAt: 'asc' },
    take: 10_000,
  })
  const tr = (d: Date | null) => (d ? new Date(d).toLocaleString('tr-TR', { timeZone: 'Europe/Istanbul' }) : '')
  const range = `${fromKey}_${toKey}`

  let csv: string
  if (lines) {
    csv = toCsv(
      ['Sipariş no', 'Tarih', 'Durum', 'Fatura adı / unvan', 'VKN / TCKN', 'Ürün', 'Adet', 'Birim fiyat (KDV hariç)', 'KDV oranı (%)', 'Satır toplamı (KDV hariç)'],
      orders.flatMap((o) =>
        (o.lines ?? []).map((l) => [o.orderNo, tr(o.createdAt), ORDER_STATUS_LABELS_TR[o.status], o.billingName, o.billingTaxId ?? '', l.productName, l.quantity, l.unitPrice, l.vatRate, l.lineTotal])
      )
    )
  } else {
    csv = toCsv(
      [
        'Sipariş no', 'Tarih', 'Durum', 'Ödeme yöntemi', 'Ödeme durumu', 'Ödeme tarihi',
        'Fatura tipi', 'Fatura adı / unvan', 'VKN / TCKN', 'Vergi dairesi', 'Fatura adresi', 'Fatura il', 'Fatura ilçe',
        'E-posta', 'Telefon',
        'Ara toplam (KDV hariç)', 'Kupon', 'Kupon indirimi', 'Havale indirimi', 'Toplam indirim (kupon + havale)', 'KDV matrahı', 'KDV', 'Kargo', 'Toplam',
        'Kargo fiyat kaynağı', 'Fiyatı veren firma', 'Kargo firması', 'Takip no', 'e-Arşiv no', 'Kargoya veriliş', 'Teslim', 'İptal',
      ],
      orders.map((o) => [
        o.orderNo, tr(o.createdAt), ORDER_STATUS_LABELS_TR[o.status],
        PAYMENT_METHOD_TR[o.paymentMethod ?? ''] ?? o.paymentMethod ?? '', PAYMENT_STATUS_TR[o.paymentStatus] ?? o.paymentStatus, tr(o.paidAt),
        o.billingType === 'company' ? 'Kurumsal' : 'Bireysel', o.billingName, o.billingTaxId ?? '', o.billingTaxOffice ?? '',
        o.billingAddress ?? o.shippingAddress, o.billingCity ?? o.shippingCity, o.billingDistrict ?? o.shippingDistrict,
        o.shippingEmail ?? '', o.shippingPhone,
        o.subtotal, o.couponCode ?? '', o.couponDiscount, o.paymentDiscount, o.discount, Math.round((o.subtotal - o.discount) * 100) / 100, o.vatTotal, o.shippingCost, o.total,
        shippingQuoteView(o).summary, shippingQuoteView(o).carrierName ?? '',
        o.shippingCarrier ? getCarrier(o.shippingCarrier)?.name ?? o.shippingCarrier : '', o.trackingNumber ?? '', o.eArsivRef ?? '',
        tr(o.shippedAt), tr(o.deliveredAt), tr(o.cancelledAt),
      ])
    )
  }
  void logAdminAction(auth.actor, 'Muhasebe dökümü alındı', { details: `${range} · ${orders.length} sipariş${lines ? ' (satır detayı)' : ''}` })
  return new NextResponse(csv, { headers: csvResponseHeaders(`voltekno-siparisler-${lines ? 'satirlar-' : ''}${range}.csv`) })
}
