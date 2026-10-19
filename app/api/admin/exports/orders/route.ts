export const dynamic = 'force-dynamic'

import { NextRequest, NextResponse } from 'next/server'
import { checkAdmin, logAdminAction } from '@/lib/adminAuth'
import { prisma } from '@/lib/prisma'
import { ORDER_STATUS_LABELS_TR } from '@/lib/order-service'
import { getCarrier } from '@/lib/shipping/carriers'
import { csvResponseHeaders, toCsv } from '@/lib/csv'

const PAYMENT_STATUS_TR: Record<string, string> = {
  PENDING: 'Bekliyor',
  PAID: 'Ödendi',
  FAILED: 'Başarısız',
  REFUNDED: 'İade edildi',
  PARTIALLY_REFUNDED: 'Kısmi iade',
}
const PAYMENT_METHOD_TR: Record<string, string> = { bank_transfer: 'Havale/EFT', card: 'Kredi kartı' }

/**
 * Muhasebe dökümü (Excel uyumlu CSV): ?from=YYYY-MM-DD&to=YYYY-MM-DD (sipariş tarihi, İstanbul günü; varsayılan son 31 gün)
 * &detail=lines ile sipariş satırları (ürün, adet, birim fiyat, KDV oranı, satır toplamı).
 * Tutarlar TL; ara toplam KDV hariçtir, indirimler KDV matrahından düşülmüştür (lib/store-config computeOrderTotals).
 */
export async function GET(request: NextRequest) {
  const auth = await checkAdmin(request)
  if ('error' in auth) return NextResponse.json({ error: auth.error }, { status: auth.status })
  const sp = request.nextUrl.searchParams
  const day = /^\d{4}-\d{2}-\d{2}$/
  const to = day.test(sp.get('to') ?? '') ? new Date(`${sp.get('to')}T23:59:59.999+03:00`) : new Date()
  const from = day.test(sp.get('from') ?? '') ? new Date(`${sp.get('from')}T00:00:00+03:00`) : new Date(to.getTime() - 31 * 86_400_000)
  if (!(from <= to)) return NextResponse.json({ error: 'Başlangıç tarihi bitişten sonra olamaz.' }, { status: 400 })
  const lines = sp.get('detail') === 'lines'

  const orders = await prisma.order.findMany({
    where: { createdAt: { gte: from, lte: to } },
    include: { lines: lines },
    orderBy: { createdAt: 'asc' },
    take: 10_000,
  })
  const tr = (d: Date | null) => (d ? new Date(d).toLocaleString('tr-TR', { timeZone: 'Europe/Istanbul' }) : '')
  const range = `${from.toISOString().slice(0, 10)}_${to.toISOString().slice(0, 10)}`

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
        'Kargo firması', 'Takip no', 'e-Arşiv no', 'Kargoya veriliş', 'Teslim', 'İptal',
      ],
      orders.map((o) => [
        o.orderNo, tr(o.createdAt), ORDER_STATUS_LABELS_TR[o.status],
        PAYMENT_METHOD_TR[o.paymentMethod ?? ''] ?? o.paymentMethod ?? '', PAYMENT_STATUS_TR[o.paymentStatus] ?? o.paymentStatus, tr(o.paidAt),
        o.billingType === 'company' ? 'Kurumsal' : 'Bireysel', o.billingName, o.billingTaxId ?? '', o.billingTaxOffice ?? '',
        o.billingAddress ?? o.shippingAddress, o.billingCity ?? o.shippingCity, o.billingDistrict ?? o.shippingDistrict,
        o.shippingEmail ?? '', o.shippingPhone,
        o.subtotal, o.couponCode ?? '', o.couponDiscount, o.paymentDiscount, o.discount, Math.round((o.subtotal - o.discount) * 100) / 100, o.vatTotal, o.shippingCost, o.total,
        o.shippingCarrier ? getCarrier(o.shippingCarrier)?.name ?? o.shippingCarrier : '', o.trackingNumber ?? '', o.eArsivRef ?? '',
        tr(o.shippedAt), tr(o.deliveredAt), tr(o.cancelledAt),
      ])
    )
  }
  void logAdminAction(auth.actor, 'Muhasebe dökümü alındı', { details: `${range} · ${orders.length} sipariş${lines ? ' (satır detayı)' : ''}` })
  return new NextResponse(csv, { headers: csvResponseHeaders(`voltekno-siparisler-${lines ? 'satirlar-' : ''}${range}.csv`) })
}
