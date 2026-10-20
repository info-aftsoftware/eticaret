/**
 * Siparişin Geliver gönderisi: bağlama ve durum takibi (gönderi Geliver panelinde açılır).
 * API istemcisi lib/shipping/geliver-api.ts; durum geçişleri lib/order-service üzerinden yapılır
 * (zaman çizelgesi, müşteri e-postası orada).
 *
 * Eşleştirme:
 *  1) Kendiliğinden: Geliver'de gönderinin sipariş numarası alanına sitedeki sipariş no (ör. ORD-2026-02356) yazılırsa
 *     zamanlayıcı ödemesi alınmış siparişlerde bu numarayla arar ve bağlar.
 *  2) Elle: yönetim panelinde sipariş sayfasına Geliver gönderi linki / kimliği / takip numarası yapıştırılır.
 * Bağlandıktan sonra: takip numarası ve linki siparişe yazılır; kargo firması teslim alınca sipariş "Kargoda" olur
 * ve müşteriye takip linkiyle e-posta gider; teslimde "Teslim Edildi". İade / kayıp / iptal: not ve yönetici uyarısı.
 */
import type { Order } from '@prisma/client'
import { reportError } from '@/lib/alerts'
import { prisma } from '@/lib/prisma'
import {
  GeliverError,
  geliverConfigFromEnv,
  getGeliverClient,
  planGeliverUpdate,
  resolveGeliverShipment,
  type GeliverClient,
  type GeliverShipment,
} from '@/lib/shipping/geliver-api'
import { allowedNextStatuses, changeOrderStatus, logOrderEvent, OrderTransitionError } from '@/lib/order-service'

const DAY = 86_400_000
/** Kargoya verildikten sonra bu kadar gün durum sorgulanır */
const TRACK_DAYS = 45
/** Ödemesi alınmış ama bağlanmamış siparişler bu kadar gün Geliver'de sipariş no ile aranır */
const DISCOVER_DAYS = 30
const OPEN_FOR_SHIPPING = ['PAID', 'CONFIRMED', 'PROCESSING', 'PICKING'] as const

/** Yönetim paneli için Geliver bilgisi */
export function geliverShipmentView(order: Order) {
  return {
    enabled: geliverConfigFromEnv() !== null,
    shipmentId: order.geliverShipmentId,
    statusCode: order.geliverStatusCode,
    statusLabel: order.geliverStatusLabel,
    syncedAt: order.geliverSyncedAt?.toISOString() ?? null,
    trackingUrl: order.geliverShipmentId ? order.trackingUrl : null,
  }
}

function requireClient(): GeliverClient {
  const client = getGeliverClient()
  if (!client) throw new OrderTransitionError('Geliver entegrasyonu yapılandırılmamış (GELIVER_API_TOKEN).')
  return client
}

async function load(orderId: string): Promise<Order> {
  const order = await prisma.order.findUnique({ where: { id: orderId } })
  if (!order) throw new OrderTransitionError('Sipariş bulunamadı')
  return order
}

const asTransitionError = (e: unknown) => (e instanceof GeliverError ? new OrderTransitionError(`Geliver: ${e.message}`) : e)

export type GeliverSyncResult = { orderNo: string; statusLabel: string | null; shipped: boolean; delivered: boolean; alert: string | null }

/** Gönderinin durumunu siparişe uygular (siparişe zaten bağlı olmalı) */
async function apply(order: Order, s: GeliverShipment, actor: 'admin' | 'system'): Promise<GeliverSyncResult> {
  const plan = planGeliverUpdate(order, s)
  await prisma.order.update({ where: { id: order.id }, data: plan.data })
  for (const e of plan.events) {
    await logOrderEvent(order.id, { type: 'shipment', message: e.message, actor: 'system', visibleToCustomer: e.visibleToCustomer })
  }
  if (plan.alert) await reportError('geliver-gonderi-durumu', new Error(plan.alert), { orderNo: order.orderNo, shipmentId: s.id })

  let shipped = false
  let delivered = false
  const carrier = s.carrierId ?? order.shippingCarrier ?? 'geliver'
  // Firma takip numarası henüz yoksa Geliver gönderi kimliği (Geliver takip sayfası bununla açılır)
  const trackingNumber = s.trackingNumber ?? order.trackingNumber ?? s.id
  // Teslim haberi "Kargoda" adımı atlanmış siparişe de gelebilir: önce kargoya verilir, sonra teslim edilir
  if (plan.ship || (plan.deliver && order.status !== 'SHIPPED' && order.paymentStatus === 'PAID')) {
    let status = order.status
    if (!allowedNextStatuses(status).includes('SHIPPED') && allowedNextStatuses(status).includes('PICKING')) {
      await changeOrderStatus(order.id, 'PICKING', { actor, notifyCustomer: false })
      status = 'PICKING'
    }
    if (allowedNextStatuses(status).includes('SHIPPED')) {
      await changeOrderStatus(order.id, 'SHIPPED', { actor, carrier, trackingNumber })
      shipped = true
    }
  }
  if (plan.deliver) {
    const now = await load(order.id)
    if (allowedNextStatuses(now.status).includes('DELIVERED')) {
      await changeOrderStatus(order.id, 'DELIVERED', { actor })
      delivered = true
    }
  }
  return { orderNo: order.orderNo, statusLabel: (plan.data.geliverStatusLabel as string) ?? null, shipped, delivered, alert: plan.alert }
}

/** Yönetici: Geliver gönderisini siparişe bağlar (link, kimlik, takip no veya gönderi no) ve durumu hemen uygular */
export async function linkGeliverShipment(orderId: string, input: string, opts: { client?: GeliverClient } = {}) {
  const client = opts.client ?? requireClient()
  if (!input.trim()) throw new OrderTransitionError('Geliver gönderi linki, kimliği veya takip numarası girin.')
  const order = await load(orderId)
  const s = await resolveGeliverShipment(client, input).catch((e) => {
    throw asTransitionError(e)
  })
  const other = await prisma.order.findFirst({ where: { geliverShipmentId: s.id, id: { not: orderId } }, select: { orderNo: true } })
  if (other) throw new OrderTransitionError(`Bu Geliver gönderisi ${other.orderNo} siparişine bağlı.`)
  await prisma.order.update({ where: { id: orderId }, data: { geliverShipmentId: s.id } })
  await logOrderEvent(orderId, {
    type: 'shipment',
    message: `Geliver gönderisi bağlandı${s.number != null ? ` (gönderi no ${s.number})` : ''}${s.isTest ? ' — test gönderisi' : ''}.`,
    actor: 'admin',
    visibleToCustomer: false,
  })
  return apply({ ...order, geliverShipmentId: s.id }, s, 'admin')
}

/** Bağlantıyı kaldırır (yanlış gönderi bağlandıysa). Siparişin durumu ve takip numarası değişmez. */
export async function unlinkGeliverShipment(orderId: string) {
  const order = await load(orderId)
  if (!order.geliverShipmentId) return
  await prisma.order.update({
    where: { id: orderId },
    data: { geliverShipmentId: null, geliverStatusCode: null, geliverStatusLabel: null, geliverSyncedAt: null },
  })
  await logOrderEvent(orderId, { type: 'shipment', message: 'Geliver gönderi bağlantısı kaldırıldı.', actor: 'admin', visibleToCustomer: false })
}

/** Tek siparişin Geliver durumunu çeker ve uygular */
export async function syncGeliverShipment(orderId: string, opts: { client?: GeliverClient; actor?: 'admin' | 'system' } = {}) {
  const client = opts.client ?? requireClient()
  const order = await load(orderId)
  if (!order.geliverShipmentId) throw new OrderTransitionError('Bu siparişe bağlı Geliver gönderisi yok.')
  const s = await client.getShipment(order.geliverShipmentId).catch((e) => {
    throw asTransitionError(e)
  })
  return apply(order, s, opts.actor ?? 'admin')
}

/**
 * Zamanlayıcı (lib/cron-jobs.ts → runGeliverTracking):
 *  1) Ödemesi alınmış, kargoya verilmemiş ve bağlanmamış siparişleri Geliver'de sipariş no ile arar, tek eşleşmeyi bağlar.
 *  2) Bağlı ve teslim edilmemiş siparişlerin durumunu çeker.
 */
export async function syncGeliverShipments({ dry = false, limit = 100, client: given }: { dry?: boolean; limit?: number; client?: GeliverClient } = {}) {
  const client = given ?? getGeliverClient()
  const out = { enabled: Boolean(client), linked: [] as string[], checked: 0, shipped: [] as string[], delivered: [] as string[], alerts: [] as string[], errors: [] as string[] }
  if (!client) return out

  const now = Date.now()
  const unlinked = await prisma.order.findMany({
    where: {
      geliverShipmentId: null,
      navlungoPostNumber: null,
      paymentStatus: 'PAID',
      status: { in: [...OPEN_FOR_SHIPPING] },
      createdAt: { gte: new Date(now - DISCOVER_DAYS * DAY) },
    },
    select: { id: true, orderNo: true },
    orderBy: { createdAt: 'desc' },
    take: limit,
  })
  for (const o of unlinked) {
    try {
      const hits = (await client.findByOrderNumber(o.orderNo)).filter((s) => s.orderNumber === o.orderNo && s.statusCode !== 'CANCELED' && !s.isReturn)
      if (hits.length !== 1) continue
      if (dry) {
        out.linked.push(`${o.orderNo} (deneme)`)
        continue
      }
      const taken = await prisma.order.findFirst({ where: { geliverShipmentId: hits[0].id }, select: { id: true } })
      if (taken) continue
      await prisma.order.update({ where: { id: o.id }, data: { geliverShipmentId: hits[0].id } })
      await logOrderEvent(o.id, { type: 'shipment', message: 'Geliver gönderisi sipariş numarasıyla bulundu ve bağlandı.', actor: 'system', visibleToCustomer: false })
      out.linked.push(o.orderNo)
    } catch (e) {
      out.errors.push(`${o.orderNo}: ${e instanceof Error ? e.message : 'hata'}`)
      if (e instanceof GeliverError && e.kind === 'auth') return out
    }
  }

  const tracked = await prisma.order.findMany({
    where: {
      geliverShipmentId: { not: null },
      OR: [
        { status: { in: [...OPEN_FOR_SHIPPING] } },
        { status: 'SHIPPED', shippedAt: { gte: new Date(now - TRACK_DAYS * DAY) } },
      ],
    },
    select: { id: true, orderNo: true },
    orderBy: [{ geliverSyncedAt: 'asc' }],
    take: limit,
  })
  for (const o of tracked) {
    try {
      if (dry) {
        const order = await load(o.id)
        const s = await client.getShipment(order.geliverShipmentId!)
        const plan = planGeliverUpdate(order, s)
        out.checked++
        if (plan.ship) out.shipped.push(o.orderNo)
        if (plan.deliver) out.delivered.push(o.orderNo)
        if (plan.alert) out.alerts.push(o.orderNo)
        continue
      }
      const r = await syncGeliverShipment(o.id, { client, actor: 'system' })
      out.checked++
      if (r.shipped) out.shipped.push(o.orderNo)
      if (r.delivered) out.delivered.push(o.orderNo)
      if (r.alert) out.alerts.push(o.orderNo)
    } catch (e) {
      out.errors.push(`${o.orderNo}: ${e instanceof Error ? e.message : 'hata'}`)
      if (e instanceof OrderTransitionError && /anahtarı geçersiz/.test(e.message)) break
    }
  }
  if (!dry && out.errors.length) {
    await reportError('geliver-takip', new Error(`${out.errors.length} Geliver gönderisi işlenemedi`), { errors: out.errors.slice(0, 5).join('; ') })
  }
  return out
}
