/**
 * Siparişin Geliver gönderisi: siteden oluşturma (teklif → etiket), panelde açılan gönderiyi bağlama ve durum takibi.
 *
 * Siteden oluşturma (yönetim paneli, sipariş sayfası → Kargo):
 *  1) "Teklifleri al": siparişin alıcı adresi (il plaka kodu + Geliver ilçe kimliği, lib/shipping/geliver-districts.json),
 *     desi/ağırlık ve ürünlerle Geliver'de gönderi açılır; teklifler siparişe kaydedilir.
 *  2) "Etiketi satın al": seçilen teklif kabul edilir, etiket PDF'i ve barkod gelir.
 *  3) Kargo firması paketi teslim alınca takip (aşağıda) siparişi "Kargoda" yapar.
 *  Etiket alınmadan gönderi iptal edilebilir ya da yeni ölçüyle yeniden teklif alınabilir.
 *  GELIVER_TEST_MODE kapatılmadıkça gönderiler test gönderisidir (ücretsiz, sipariş durumunu değiştirmez).
 *
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
import { Prisma, type Order, type OrderLine } from '@prisma/client'
import { reportError } from '@/lib/alerts'
import { prisma } from '@/lib/prisma'
import {
  GeliverError,
  geliverConfigFromEnv,
  getGeliverClient,
  planGeliverUpdate,
  resolveGeliverShipment,
  type GeliverClient,
  type GeliverOffer,
  type GeliverShipment,
} from '@/lib/shipping/geliver-api'
import { geliverLocation } from '@/lib/shipping/geliver-location'
import { orderParcel, parcelDimensions } from '@/lib/shipping/order-parcel'
import { getCarrier } from '@/lib/shipping/carriers'
import { allowedNextStatuses, changeOrderStatus, logOrderEvent, OrderTransitionError } from '@/lib/order-service'

const DAY = 86_400_000
/** Kargoya verildikten sonra bu kadar gün durum sorgulanır */
const TRACK_DAYS = 45
/** Ödemesi alınmış ama bağlanmamış siparişler bu kadar gün Geliver'de sipariş no ile aranır */
const DISCOVER_DAYS = 30
const OPEN_FOR_SHIPPING = ['PAID', 'CONFIRMED', 'PROCESSING', 'PICKING'] as const

type OrderWithLines = Order & { lines: OrderLine[] }

/** "GELIVER_STANDART" → "Geliver Standart" (carriers.ts'te olmayan servisler için) */
const prettyService = (code: string | null) =>
  code ? code.split('_').map((w) => w.charAt(0) + w.slice(1).toLocaleLowerCase('tr')).join(' ') : null

/** Teklif yönetim panelinde: firma adıyla */
export type GeliverOfferView = GeliverOffer & { carrierName: string }

const offerView = (o: GeliverOffer): GeliverOfferView => ({
  ...o,
  carrierName: (o.carrierId && getCarrier(o.carrierId)?.name) || prettyService(o.providerServiceCode ?? o.providerCode) || 'Kargo firması',
})

function storedOffers(order: Order): GeliverOfferView[] {
  return Array.isArray(order.geliverOffers) ? (order.geliverOffers as unknown as GeliverOfferView[]) : []
}

/** Varsayılan teklif: sipariş anında fiyatı verilen firma, yoksa en ucuz */
export function recommendedOffer(offers: GeliverOfferView[], quotedCarrier: string | null): GeliverOfferView | null {
  if (offers.length === 0) return null
  return (quotedCarrier && offers.find((o) => o.carrierId === quotedCarrier)) || [...offers].sort((a, b) => a.totalAmount - b.totalAmount)[0]
}

/** Yönetim paneli için Geliver bilgisi */
export function geliverShipmentView(order: OrderWithLines) {
  const config = geliverConfigFromEnv()
  const offers = order.geliverLabelUrl ? [] : storedOffers(order)
  const parcel = orderParcel(order)
  return {
    enabled: config !== null,
    testMode: config?.testMode ?? null,
    createdInTestMode: order.geliverTestMode,
    shipmentId: order.geliverShipmentId,
    statusCode: order.geliverStatusCode,
    statusLabel: order.geliverStatusLabel,
    syncedAt: order.geliverSyncedAt?.toISOString() ?? null,
    trackingUrl: order.geliverShipmentId ? order.trackingUrl : null,
    labelUrl: order.geliverLabelUrl,
    offers,
    recommendedOfferId: recommendedOffer(offers, order.shippingQuoteCarrier)?.id ?? null,
    defaultDesi: Math.max(1, Math.ceil(parcel.desi)),
    defaultKg: parcel.kg != null ? Math.round(parcel.kg * 10) / 10 : null,
  }
}

export { geliverLocation }

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

async function loadWithLines(orderId: string): Promise<OrderWithLines> {
  const order = await prisma.order.findUnique({ where: { id: orderId }, include: { lines: true } })
  if (!order) throw new OrderTransitionError('Sipariş bulunamadı')
  return order
}

/** Aynı sipariş için eşzamanlı iki istek iki gönderi açmasın (çift tıklama) */
const busyOrders = new Set<string>()
async function exclusive<T>(orderId: string, fn: () => Promise<T>): Promise<T> {
  if (busyOrders.has(orderId)) throw new OrderTransitionError('Bu sipariş için Geliver işlemi sürüyor, birkaç saniye sonra tekrar deneyin.')
  busyOrders.add(orderId)
  try {
    return await fn()
  } finally {
    busyOrders.delete(orderId)
  }
}

const fmtTl = (n: number) => n.toLocaleString('tr-TR', { minimumFractionDigits: 2, maximumFractionDigits: 2 })

/**
 * "Teklifleri al": Geliver'de gönderi açar ve teklifleri siparişe kaydeder. Gönderi zaten açıksa (etiket alınmamış)
 * teklifleri yeniden okur; refresh: eski gönderi iptal edilip verilen ölçüyle yenisi açılır.
 */
export async function getGeliverOffers(
  orderId: string,
  opts: { desi?: number; kg?: number; refresh?: boolean; client?: GeliverClient } = {}
): Promise<GeliverOfferView[]> {
  const client = opts.client ?? requireClient()
  return exclusive(orderId, async () => {
    const order = await loadWithLines(orderId)
    if (order.paymentStatus !== 'PAID') throw new OrderTransitionError('Ödemesi alınmamış sipariş için kargo gönderisi açılamaz.')
    if (!(OPEN_FOR_SHIPPING as readonly string[]).includes(order.status)) throw new OrderTransitionError('Bu durumdaki sipariş için kargo gönderisi açılamaz.')
    if (order.navlungoPostNumber) throw new OrderTransitionError('Bu sipariş için Navlungo gönderisi açılmış.')
    if (order.geliverLabelUrl) throw new OrderTransitionError('Bu siparişin Geliver etiketi zaten alındı.')

    if (order.geliverShipmentId && !opts.refresh) {
      const s = await client.getShipment(order.geliverShipmentId).catch((e) => {
        throw asTransitionError(e)
      })
      const offers = s.offers.map(offerView)
      await prisma.order.update({ where: { id: orderId }, data: { geliverOffers: offers as unknown as Prisma.InputJsonValue, geliverSyncedAt: new Date() } })
      return offers
    }
    if (order.geliverShipmentId && opts.refresh) {
      await client.cancelShipment(order.geliverShipmentId).catch((e) => {
        if (!(e instanceof GeliverError && e.kind === 'not_found')) throw asTransitionError(e)
      })
      await logOrderEvent(orderId, { type: 'shipment', message: 'Geliver gönderisi yeni ölçüyle teklif almak için iptal edildi.', actor: 'admin', visibleToCustomer: false })
    }

    const location = geliverLocation(order.shippingCity, order.shippingDistrict)
    if (!location) throw new OrderTransitionError(`Geliver'de il/ilçe bulunamadı: ${order.shippingCity} / ${order.shippingDistrict}. Sipariş adresini düzeltin.`)
    // Geliver alıcı e-postasını zorunlu tutar
    const email = order.shippingEmail?.trim()
    if (!email) throw new OrderTransitionError('Siparişte alıcı e-postası yok; Geliver gönderisi açılamaz.')
    const parcel = orderParcel(order)
    const desi = opts.desi && opts.desi > 0 ? opts.desi : parcel.desi
    const kg = opts.kg && opts.kg > 0 ? opts.kg : parcel.kg
    const s = await client
      .createShipment({
        orderNumber: order.orderNo,
        orderTotal: order.total,
        recipient: {
          name: order.shippingName,
          email,
          phone: order.shippingPhone,
          address: [order.shippingAddress, order.shippingDistrict, order.shippingCity].filter(Boolean).join(', '),
          ...location,
          zip: order.shippingPostalCode,
        },
        parcel: parcelDimensions(desi, kg),
        items: order.lines.map((l) => ({ title: l.productName, quantity: l.quantity })),
      })
      .catch((e) => {
        throw asTransitionError(e)
      })
    const offers = s.offers.map(offerView)
    await prisma.order.update({
      where: { id: orderId },
      data: {
        geliverShipmentId: s.id,
        geliverTestMode: s.isTest,
        geliverOffers: offers as unknown as Prisma.InputJsonValue,
        geliverLabelUrl: null,
        geliverStatusCode: s.statusCode,
        geliverStatusLabel: 'Teklifler alındı, etiket bekleniyor',
        geliverSyncedAt: new Date(),
      },
    })
    const best = recommendedOffer(offers, order.shippingQuoteCarrier)
    await logOrderEvent(orderId, {
      type: 'shipment',
      message: `Geliver gönderisi oluşturuldu (${Math.ceil(desi)} desi${kg ? `, ${kg} kg` : ''}): ${offers.length} teklif${best ? `, önerilen ${best.carrierName} ${fmtTl(best.totalAmount)} TL` : ''}${s.isTest ? ' — test gönderisi' : ''}.`,
      actor: 'admin',
      visibleToCustomer: false,
    })
    return offers
  })
}

/** "Etiketi satın al": teklifi kabul eder; etiket ve barkod siparişe yazılır, durum Geliver'den uygulanır */
export async function buyGeliverLabel(orderId: string, offerId: string, opts: { client?: GeliverClient } = {}): Promise<GeliverSyncResult> {
  const client = opts.client ?? requireClient()
  return exclusive(orderId, async () => {
    const order = await load(orderId)
    if (!order.geliverShipmentId) throw new OrderTransitionError('Önce Geliver tekliflerini alın.')
    if (order.geliverLabelUrl) throw new OrderTransitionError('Bu siparişin Geliver etiketi zaten alındı.')
    const offer = storedOffers(order).find((o) => o.id === offerId)
    if (!offer) throw new OrderTransitionError('Teklif bulunamadı; teklifleri yeniden alın.')
    const s = await client.acceptOffer(offer.id).catch((e) => {
      throw asTransitionError(e)
    })
    await prisma.order.update({
      where: { id: orderId },
      data: { geliverLabelUrl: s.labelUrl ?? `https://labels3.geliver.io/labels/${order.geliverShipmentId}.pdf`, geliverOffers: Prisma.DbNull },
    })
    await logOrderEvent(orderId, {
      type: 'shipment',
      message: `Geliver etiketi satın alındı: ${offer.carrierName}, ${fmtTl(offer.totalAmount)} TL${s.barcode ? `, barkod ${s.barcode}` : ''}${s.isTest ? ' — test gönderisi' : ''}.`,
      actor: 'admin',
      visibleToCustomer: false,
    })
    // Kabul yanıtında takip durumu henüz olmayabilir: gönderi yeniden okunur
    const fresh = await client.getShipment(order.geliverShipmentId).catch(() => s)
    return apply(await load(orderId), fresh, 'admin')
  })
}

/** Geliver gönderisini iptal eder (kargo firması teslim almadan) ve siparişten kaldırır */
export async function cancelGeliverShipment(orderId: string, opts: { client?: GeliverClient } = {}) {
  const client = opts.client ?? requireClient()
  return exclusive(orderId, async () => {
    const order = await load(orderId)
    if (!order.geliverShipmentId) throw new OrderTransitionError('Bu siparişe bağlı Geliver gönderisi yok.')
    if (order.status === 'SHIPPED' || order.status === 'DELIVERED') {
      throw new OrderTransitionError('Kargoya verilmiş gönderi buradan iptal edilemez; Geliver panelinden iade süreci başlatın.')
    }
    await client.cancelShipment(order.geliverShipmentId).catch((e) => {
      if (!(e instanceof GeliverError && e.kind === 'not_found')) throw asTransitionError(e)
    })
    await prisma.order.update({
      where: { id: orderId },
      data: {
        geliverShipmentId: null,
        geliverOffers: Prisma.DbNull,
        geliverLabelUrl: null,
        geliverTestMode: null,
        geliverStatusCode: null,
        geliverStatusLabel: null,
        geliverSyncedAt: null,
        // Takip bilgisi Geliver'den geldiyse kaldırılır (sipariş kargoya verilmedi)
        ...(order.trackingUrl?.includes('geliver') ? { trackingUrl: null, trackingNumber: null } : {}),
      },
    })
    await logOrderEvent(orderId, {
      type: 'shipment',
      message: `Geliver gönderisi iptal edildi${order.geliverLabelUrl ? ' (etiket alınmıştı; ücret iadesi Geliver bakiyesine yapılır)' : ''}.`,
      actor: 'admin',
      visibleToCustomer: false,
    })
  })
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
