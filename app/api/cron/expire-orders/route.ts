export const dynamic = 'force-dynamic'

/**
 * Havale/EFT ödeme süresi takibi (zamanlanmış görev).
 * - Son ödeme gününden 1 gün önce: müşteriye ödeme hatırlatması (bir kez)
 * - Son ödeme günü geçince: sipariş iptal, stok iadesi, müşteriye iptal e-postası
 * - Stoğa giren ürünler için bekleyen "stok gelince haber ver" e-postaları
 * - Terk edilen sepet hatırlatması (24 saat hareketsiz, ticari ileti izni olan üyeler, sepet başına bir kez)
 * Yetki: Authorization: Bearer <CRON_SECRET>. Hostinger cron örneği (günde 4 kez):
 *   curl -s -X POST -H "Authorization: Bearer $CRON_SECRET" https://voltekno.com/api/cron/expire-orders
 * ?dry=1 ile hiçbir değişiklik yapmadan yapılacakları listeler.
 */

import { reportError } from '@/lib/alerts'
import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import { BANK_TRANSFER_PAYMENT_DAYS } from '@/lib/store-config'
import { changeOrderStatus, logOrderEvent, sendCustomerStatusEmail } from '@/lib/order-service'
import { processStockAlerts } from '@/lib/stock-alerts'
import { processAbandonedCarts } from '@/lib/abandoned-cart'
import { isCronAuthorized } from '@/lib/cron-auth'

const DAY = 86_400_000

/** Kartlı siparişte banka dönüşü bu kadar dakika gelmezse yönetici uyarılır */
const CARD_CHECK_AFTER_MIN = 60

export async function POST(request: NextRequest) {
  if (!isCronAuthorized(request)) {
    return NextResponse.json({ error: 'Yetkisiz' }, { status: 401 })
  }
  const dry = request.nextUrl.searchParams.get('dry') === '1'
  const now = Date.now()
  const expireBefore = new Date(now - BANK_TRANSFER_PAYMENT_DAYS * DAY)
  const remindBefore = new Date(now - (BANK_TRANSFER_PAYMENT_DAYS - 1) * DAY)

  const awaiting = await prisma.order.findMany({
    where: {
      status: 'PENDING',
      paymentMethod: 'bank_transfer',
      paymentStatus: { not: 'PAID' },
      createdAt: { lt: remindBefore },
    },
    include: { lines: true, events: { where: { type: 'reminder' }, select: { id: true } } },
    orderBy: { createdAt: 'asc' },
    take: 200,
  })

  const result = { expired: [] as string[], reminded: [] as string[], errors: [] as string[] }
  for (const order of awaiting) {
    try {
      if (order.createdAt < expireBefore) {
        if (!dry) {
          await changeOrderStatus(order.id, 'CANCELLED', {
            actor: 'system',
            reason: `${BANK_TRANSFER_PAYMENT_DAYS} gün içinde ödeme alınamadı`,
          })
        }
        result.expired.push(order.orderNo)
      } else if (order.events.length === 0) {
        if (!dry) {
          await sendCustomerStatusEmail(order, 'payment_reminder')
          await logOrderEvent(order.id, { type: 'reminder', message: 'Ödeme hatırlatma e-postası gönderildi.', visibleToCustomer: false })
        }
        result.reminded.push(order.orderNo)
      }
    } catch (e) {
      result.errors.push(`${order.orderNo}: ${e instanceof Error ? e.message : 'hata'}`)
      await reportError('cron-havale-takibi', e, { orderNo: order.orderNo })
    }
  }
  // Sonuçlanmamış kart ödemeleri: müşteri banka sayfasını kapattıysa banka dönüşü hiç gelmez.
  // Kart çekilmiş olabileceği için otomatik iptal EDİLMEZ; yöneticiye bir kez uyarı gider,
  // banka panelinden kontrol edilip yönetim panelinden "ödendi" veya "iptal" yapılır (iptal stok + kuponu geri verir).
  const cardBefore = new Date(now - CARD_CHECK_AFTER_MIN * 60_000)
  const staleCard = await prisma.order.findMany({
    where: {
      status: 'PENDING',
      paymentMethod: 'card',
      paymentStatus: { not: 'PAID' },
      createdAt: { lt: cardBefore },
      events: { none: { type: 'card-check' } },
    },
    select: { id: true, orderNo: true, total: true, createdAt: true },
    orderBy: { createdAt: 'asc' },
    take: 100,
  })
  const cardUnresolved: string[] = []
  for (const o of staleCard) {
    cardUnresolved.push(o.orderNo)
    if (dry) continue
    await logOrderEvent(o.id, {
      type: 'card-check',
      message: `Kart ödemesi ${CARD_CHECK_AFTER_MIN} dakikadır sonuçlanmadı (banka dönüşü gelmedi). Banka panelinden kontrol edip ödendi/iptal olarak işaretleyin.`,
      visibleToCustomer: false,
    })
  }
  if (!dry && cardUnresolved.length) {
    await reportError('kart-odemesi-sonuclanmadi', new Error(`${cardUnresolved.length} kartlı sipariş banka dönüşü olmadan bekliyor`), {
      orders: cardUnresolved.join(', '),
    })
  }

  // Yedek: admin dışından (ör. iade/iptal stok iadesi) stoğa giren ürünlerin bekleyen bildirimleri
  const stockAlerts = dry ? null : await processStockAlerts().catch((e) => ({ error: String(e) }))
  // Terk edilen sepet hatırlatması (yalnızca ticari ileti izni olan üyeler)
  const abandonedCarts = await processAbandonedCarts({ dry }).catch((e) => ({ error: String(e) }))
  return NextResponse.json({ ok: true, dry, ...result, cardUnresolved, stockAlerts, abandonedCarts })
}
