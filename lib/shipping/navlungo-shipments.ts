/**
 * Siparişin Navlungo gönderisi: "Kargoya ver" adımında gönderi oluşturma, etiket ve durum takibi.
 * API istemcisi lib/shipping/navlungo-api.ts; durum geçişleri lib/order-service üzerinden yapılır
 * (zaman çizelgesi, müşteri e-postası, iptal talebi kapatma orada).
 *
 * Akış: gönderi oluşturulur (reference_id = sipariş no) → post_number ve Navlungo takip linki siparişe yazılır →
 * sipariş "Kargoda" olur, müşteriye Navlungo linkiyle e-posta gider → zamanlayıcı (lib/cron-jobs.ts) durumu çeker,
 * taşıyıcı takip numarası gelince günceller, teslimde "Teslim Edildi"ye geçirir.
 * İade / iptal / tazmin durumları otomatik uygulanmaz; zaman çizelgesine not ve yöneticiye uyarı düşer.
 */
import type { Order, OrderLine } from '@prisma/client'
import { reportError } from '@/lib/alerts'
import { prisma } from '@/lib/prisma'
import { matchCarrier } from '@/lib/bulk-shipping'
import { cartLogistics } from '@/lib/shipping/fee'
import {
  NavlungoError,
  getNavlungoClient,
  navlungoConfigFromEnv,
  planTrackingUpdate,
  type NavlungoClient,
  type NavlungoLabel,
} from '@/lib/shipping/navlungo-api'
import { allowedNextStatuses, changeOrderStatus, logOrderEvent, OrderTransitionError } from '@/lib/order-service'

const DAY = 86_400_000
/** Kargoya verildikten sonra bu kadar gün durum sorgulanır (takılı kalan gönderi sonsuza dek sorgulanmasın) */
const TRACK_DAYS = 45

type OrderWithLines = Order & { lines: OrderLine[] }

const carrierIdFor = (name: string | null | undefined) => (name ? matchCarrier(name)?.id ?? null : null)

/** Gönderi desisi: sipariş anındaki kargo teklifi, yoksa ürünlerin desi/kg bilgisi. Ağırlık desiden büyükse ağırlık. */
export function navlungoDefaultDesi(order: OrderWithLines): number {
  const q = (order.shippingQuote && typeof order.shippingQuote === 'object' ? order.shippingQuote : null) as { desi?: number; kg?: number } | null
  let desi = typeof q?.desi === 'number' ? q.desi : null
  let kg = typeof q?.kg === 'number' ? q.kg : null
  if (desi === null) {
    const l = cartLogistics(
      order.lines.map((line) => {
        const productId = (line.variantMatrix as { productId?: string } | null)?.productId ?? line.id
        return { id: productId, productId, quantity: line.quantity }
      })
    )
    desi = l.desiExact ?? l.desi
    kg = l.kg
  }
  return Math.max(1, Math.ceil(Math.max(desi, kg ?? 0)))
}

/** Yönetim paneli için Navlungo bilgisi */
export function navlungoShipmentView(order: OrderWithLines) {
  const config = navlungoConfigFromEnv()
  return {
    enabled: config !== null,
    testMode: config?.testMode ?? null,
    postNumber: order.navlungoPostNumber,
    statusCode: order.navlungoStatusCode,
    statusName: order.navlungoStatusName,
    labelUrl: order.navlungoLabelUrl,
    createdInTestMode: order.navlungoTestMode,
    syncedAt: order.navlungoSyncedAt?.toISOString() ?? null,
    /** Gönderi şimdiki ortamdan farklı ortamda (QA / üretim) açıldıysa sorgu yapılamaz */
    envMismatch: config !== null && order.navlungoTestMode !== null && order.navlungoTestMode !== config.testMode,
    defaultDesi: navlungoDefaultDesi(order),
  }
}

function requireClient(): NavlungoClient {
  const client = getNavlungoClient()
  if (!client) {
    throw new OrderTransitionError(
      'Navlungo entegrasyonu yapılandırılmamış (NAVLUNGO_API_USERNAME, NAVLUNGO_API_PASSWORD, NAVLUNGO_SENDER_ADDRESS_ID).'
    )
  }
  return client
}

async function load(orderId: string): Promise<OrderWithLines> {
  const order = await prisma.order.findUnique({ where: { id: orderId }, include: { lines: true } })
  if (!order) throw new OrderTransitionError('Sipariş bulunamadı')
  return order
}

const asTransitionError = (e: unknown) =>
  e instanceof NavlungoError ? new OrderTransitionError(`Navlungo: ${e.message}`) : e

/**
 * "Kargoya ver": Navlungo'da gönderi oluşturur ve siparişi "Kargoda" yapar.
 * Gönderi daha önce oluşturulduysa (ör. durum geçişi yarıda kaldıysa) yeniden oluşturulmaz.
 */
export async function createNavlungoShipment(
  orderId: string,
  opts: { desi?: number; packageCount?: number; notifyCustomer?: boolean; client?: NavlungoClient } = {}
): Promise<OrderWithLines> {
  const client = opts.client ?? requireClient()
  let order = await load(orderId)
  if (order.paymentStatus !== 'PAID') throw new OrderTransitionError('Ödemesi alınmamış sipariş kargoya verilemez.')
  if (!allowedNextStatuses(order.status).includes('SHIPPED')) {
    throw new OrderTransitionError('Bu durumdaki sipariş kargoya verilemez.')
  }

  let carrierName: string | null = null
  if (!order.navlungoPostNumber) {
    const desi = opts.desi && opts.desi > 0 ? opts.desi : navlungoDefaultDesi(order)
    const packageCount = opts.packageCount && opts.packageCount > 0 ? Math.floor(opts.packageCount) : 1
    let created: { postNumber: string; trackingUrl: string | null; labelUrl: string | null; carrierName: string | null }
    try {
      created = await client.createPost({
        referenceId: order.orderNo,
        recipient: {
          name: order.shippingName,
          phone: order.shippingPhone,
          email: order.shippingEmail,
          address: order.shippingAddress,
          city: order.shippingCity,
          district: order.shippingDistrict,
          postCode: order.shippingPostalCode,
        },
        desi,
        packageCount,
        note: `Sipariş ${order.orderNo}`,
      })
    } catch (e) {
      if (!(e instanceof NavlungoError && e.kind === 'duplicate')) throw asTransitionError(e)
      // Bu sipariş no ile gönderi zaten açılmış (önceki deneme yanıtı kaybolmuş olabilir): mevcut gönderiyi kullan
      const t = await client.checkPost(order.orderNo).catch((err) => {
        throw asTransitionError(err)
      })
      created = { postNumber: t.postNumber, trackingUrl: t.trackingUrl, labelUrl: null, carrierName: t.carrierName }
    }
    await prisma.order.update({
      where: { id: orderId },
      data: {
        navlungoPostNumber: created.postNumber,
        navlungoTestMode: client.config.testMode,
        navlungoLabelUrl: created.labelUrl,
        trackingUrl: created.trackingUrl,
        navlungoSyncedAt: new Date(),
      },
    })
    await logOrderEvent(orderId, {
      type: 'shipment',
      message: `Navlungo gönderisi oluşturuldu: ${created.postNumber}${created.carrierName ? ` (${created.carrierName})` : ''}, ${desi} desi, ${packageCount} koli${client.config.testMode ? ' — QA (test) ortamı' : ''}.`,
      actor: 'admin',
      visibleToCustomer: false,
    })
    carrierName = created.carrierName
    order = await load(orderId)
  } else {
    carrierName = (await client.checkPost(order.navlungoPostNumber).catch(() => null))?.carrierName ?? null
  }

  return changeOrderStatus(orderId, 'SHIPPED', {
    actor: 'admin',
    carrier: carrierIdFor(carrierName) ?? (order.shippingCarrier || 'navlungo'),
    trackingNumber: order.trackingNumber || order.navlungoPostNumber!,
    notifyCustomer: opts.notifyCustomer !== false,
  })
}

export type SyncResult = { orderNo: string; statusName: string | null; delivered: boolean; alert: string | null; skipped?: string }

/** Tek siparişin Navlungo durumunu çeker ve uygular. dry: hiçbir şey yazmaz. */
export async function syncNavlungoShipment(orderId: string, opts: { dry?: boolean; client?: NavlungoClient } = {}): Promise<SyncResult> {
  const client = opts.client ?? requireClient()
  const order = await load(orderId)
  const base = { orderNo: order.orderNo, statusName: order.navlungoStatusName, delivered: false, alert: null }
  if (!order.navlungoPostNumber) return { ...base, skipped: 'Navlungo gönderisi yok' }
  if (order.navlungoTestMode !== null && order.navlungoTestMode !== client.config.testMode) {
    return { ...base, skipped: `gönderi ${order.navlungoTestMode ? 'QA' : 'üretim'} ortamında açılmış` }
  }

  const tracking = await client.checkPost(order.navlungoPostNumber)
  const plan = planTrackingUpdate(order, tracking, carrierIdFor)
  const result: SyncResult = { orderNo: order.orderNo, statusName: tracking.statusName, delivered: plan.deliver, alert: plan.alert }
  if (opts.dry) return result

  await prisma.order.update({ where: { id: orderId }, data: plan.data })
  for (const e of plan.events) {
    await logOrderEvent(orderId, { type: 'shipment', message: e.message, actor: 'system', visibleToCustomer: e.visibleToCustomer })
  }
  if (plan.alert) await reportError('navlungo-gonderi-durumu', new Error(plan.alert), { orderNo: order.orderNo, postNumber: order.navlungoPostNumber })
  if (plan.deliver) await changeOrderStatus(orderId, 'DELIVERED', { actor: 'system' })
  return result
}

/** Zamanlayıcı: kargodaki Navlungo gönderilerinin durumunu çeker (lib/cron-jobs.ts → runNavlungoTracking). */
export async function syncNavlungoShipments({ dry = false, limit = 100 }: { dry?: boolean; limit?: number } = {}) {
  const client = getNavlungoClient()
  if (!client) return { enabled: false, checked: 0, delivered: [] as string[], alerts: [] as string[], skipped: [] as string[], errors: [] as string[] }
  const orders = await prisma.order.findMany({
    where: { status: 'SHIPPED', navlungoPostNumber: { not: null }, shippedAt: { gte: new Date(Date.now() - TRACK_DAYS * DAY) } },
    select: { id: true, orderNo: true },
    // En uzun süredir sorgulanmayan önce
    orderBy: [{ navlungoSyncedAt: 'asc' }, { shippedAt: 'asc' }],
    take: limit,
  })
  const out = { enabled: true, checked: 0, delivered: [] as string[], alerts: [] as string[], skipped: [] as string[], errors: [] as string[] }
  for (const o of orders) {
    try {
      const r = await syncNavlungoShipment(o.id, { dry, client })
      if (r.skipped) {
        out.skipped.push(`${o.orderNo}: ${r.skipped}`)
        continue
      }
      out.checked++
      if (r.delivered) out.delivered.push(o.orderNo)
      if (r.alert) out.alerts.push(o.orderNo)
    } catch (e) {
      out.errors.push(`${o.orderNo}: ${e instanceof Error ? e.message : 'hata'}`)
      // Kimlik bilgisi yanlışsa her siparişte aynı hata: turu kes
      if (e instanceof NavlungoError && e.kind === 'auth') break
    }
  }
  if (!dry && out.errors.length) {
    await reportError('navlungo-takip', new Error(`${out.errors.length} gönderinin durumu alınamadı`), { errors: out.errors.slice(0, 5).join('; ') })
  }
  return out
}

/** Etiket PDF'i (oluşturma asenkron; hazır değilse OrderTransitionError) */
export async function getNavlungoLabel(orderId: string): Promise<NavlungoLabel & { orderNo: string }> {
  const client = requireClient()
  const order = await load(orderId)
  if (!order.navlungoPostNumber) throw new OrderTransitionError('Bu sipariş için Navlungo gönderisi yok.')
  try {
    const label = await client.getLabel(order.navlungoPostNumber)
    if (label.url && label.url !== order.navlungoLabelUrl) {
      await prisma.order.update({ where: { id: orderId }, data: { navlungoLabelUrl: label.url } })
    }
    return { ...label, orderNo: order.orderNo }
  } catch (e) {
    if (e instanceof NavlungoError && e.kind === 'label_pending') {
      throw new OrderTransitionError('Etiket henüz hazırlanıyor. Birkaç dakika sonra tekrar deneyin.')
    }
    throw asTransitionError(e)
  }
}
