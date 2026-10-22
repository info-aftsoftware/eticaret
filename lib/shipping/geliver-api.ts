/**
 * Geliver API (https://docs.geliver.io): gönderi oluşturma, etiket satın alma ve takip.
 * Yetki: Authorization: Bearer <GELIVER_API_TOKEN> (app.geliver.io/apitokens). Token yoksa özellik kapalıdır.
 * GELIVER_TEST_MODE: "0" / "false" yazılmadıkça gönderiler test gönderisi olarak açılır (ücretsiz, gerçek kargo çıkmaz).
 * GELIVER_SENDER_ADDRESS_ID: isteğe bağlı; yoksa hesabın varsayılan gönderici adresi kullanılır.
 *
 * Kullanılan uçlar:
 *   POST   /shipments                    gönderi oluştur, teklifleri al (iki aşamalı akış)
 *   POST   /transactions {offerID}       teklifi kabul et: etiket satın alınır, barkod ve etiket bağlantısı gelir
 *   DELETE /shipments/{id}               gönderiyi iptal et (etiket alınmadan)
 *   GET    /shipments/{id}               tek gönderi: teklifler, trackingNumber, trackingUrl, trackingStatus
 *   GET    /shipments?orderNumber=…&filter=…  listeleme (sipariş no / takip no ile arama)
 * Test gönderisinde tek teklif gelir (GELIVER_STANDART, 0 TL), tamamlanma yüzdesi 99'da kalır ve "en ucuz" alanı boştur;
 * bu yüzden teklifler her zaman listeden okunur. Test gönderisinin durumu her sorguda bir adım ilerler.
 * Takip sayfası: gönderide trackingUrl yoksa https://app.geliver.io/tracking/{shipmentID}
 */
import { getCarrier } from '@/lib/shipping/carriers'

const BASE_URL = 'https://api.geliver.io/api/v1'
export const GELIVER_TRACKING_PAGE = (id: string) => `https://app.geliver.io/tracking/${encodeURIComponent(id)}`

export type GeliverConfig = { token: string; testMode: boolean; senderAddressId: string | null }

export function geliverConfigFromEnv(env: Partial<Record<string, string>> = process.env): GeliverConfig | null {
  const token = env.GELIVER_API_TOKEN?.trim()
  if (!token) return null
  const test = env.GELIVER_TEST_MODE?.trim().toLowerCase()
  return { token, testMode: !(test === '0' || test === 'false'), senderAddressId: env.GELIVER_SENDER_ADDRESS_ID?.trim() || null }
}

export const isGeliverEnabled = () => geliverConfigFromEnv() !== null

export class GeliverError extends Error {
  constructor(public kind: 'auth' | 'not_found' | 'http' | 'network', message: string) {
    super(message)
  }
}

/** Geliver genel durum kodu (trackingStatus.trackingStatusCode) */
export type GeliverTrackingCode = 'PRE_TRANSIT' | 'TRANSIT' | 'DELIVERED' | 'RETURNED' | 'FAILURE' | 'UNKNOWN'

export type GeliverShipment = {
  id: string
  /** Gönderinin Geliver'deki sıra numarası (panelde görünen) */
  number: number | null
  orderNumber: string | null
  /** Gönderi durumu: CREATED, OFFER_ACCEPTED, LABEL_PRINTED, SHIPPED, DELIVERED, CANCELED … */
  statusCode: string | null
  trackingCode: GeliverTrackingCode | null
  trackingSubCode: string | null
  /** Kargo firmasının yazdığı durum ("Teslim Edildi" gibi) */
  statusText: string | null
  statusDate: string | null
  trackingNumber: string | null
  /** Takip sayfası: firmanın linki, yoksa Geliver'in takip sayfası */
  trackingUrl: string
  providerServiceCode: string | null
  /** carriers.ts kimliği (SURAT_STANDART → surat) */
  carrierId: string | null
  isTest: boolean
  isReturn: boolean
  /** Etiket alındıysa PDF bağlantısı ve barkod */
  labelUrl: string | null
  barcode: string | null
  /** Teklifler (etiket alınana kadar) */
  offers: GeliverOffer[]
}

/** Gönderiye gelen kargo teklifi */
export type GeliverOffer = {
  id: string
  /** KDV ve vergiler dahil toplam */
  totalAmount: number
  currency: string
  providerCode: string | null
  providerServiceCode: string | null
  /** carriers.ts kimliği; bilinmiyorsa null */
  carrierId: string | null
  /** "01 gün 00 saat" */
  estimate: string | null
}

/** Alt durum kodlarının Türkçesi (docs: Kargo Durum Değerleri) */
export const GELIVER_SUB_STATUS_TR: Record<string, string> = {
  information_received: 'Kargo sistemde oluşturuldu',
  package_accepted: 'Kargo şubeye teslim edildi',
  package_departed: 'Kargo aktarma merkezinden ayrıldı',
  package_processing: 'Kargo aktarma merkezinde',
  delivery_scheduled: 'Kargo alıcı şubede',
  out_for_delivery: 'Kargo dağıtımda',
  package_damaged: 'Paket hasarlı',
  package_forwarded_to_another_carrier: 'Kargo aracı firmaya verildi',
  delivery_rescheduled: 'Dağıtım zamanı değişti',
  delivered: 'Teslim edildi',
  package_lost: 'Paket kayboldu',
  package_undeliverable: 'Kargo dağıtılamıyor',
  return_to_sender: 'Kargo iade edildi',
  other: 'Bilinmeyen durum',
}

const PROVIDER_TO_CARRIER: Record<string, string> = {
  SURAT: 'surat',
  ARAS: 'aras',
  YURTICI: 'yurtici',
  MNG: 'mng',
  DHL: 'mng',
  PTT: 'ptt',
  HEPSIJET: 'hepsijet',
  KOLAYGELSIN: 'kolaygelsin',
  UPS: 'ups',
}

/** "SURAT_STANDART" → "surat"; bilinmiyorsa null */
export function carrierFromProviderCode(code: string | null | undefined): string | null {
  if (!code) return null
  const key = code.toUpperCase().replace(/[^A-Z]/g, '_').split('_')[0]
  const id = PROVIDER_TO_CARRIER[key] ?? (key.startsWith('HEPSIJET') ? 'hepsijet' : null)
  return id && getCarrier(id) ? id : null
}

const str = (v: unknown) => (typeof v === 'string' && v.trim() ? v.trim() : null)

const num = (v: unknown) => {
  const n = typeof v === 'number' ? v : Number.parseFloat(String(v ?? ''))
  return Number.isFinite(n) ? n : 0
}

export function parseGeliverOffer(raw: unknown): GeliverOffer | null {
  const o = (raw ?? {}) as Record<string, any>
  const id = str(o.id)
  if (!id) return null
  const service = str(o.providerServiceCode)
  return {
    id,
    totalAmount: num(o.totalAmount),
    currency: str(o.currency) ?? 'TL',
    providerCode: str(o.providerCode),
    providerServiceCode: service,
    carrierId: carrierFromProviderCode(service ?? str(o.providerCode)),
    estimate: str(o.averageEstimatedTimeHumanReadible) ?? str(o.averageEstimatedTimeHumanReadable),
  }
}

/** API yanıtındaki gönderi nesnesini sade biçime çevirir */
export function parseGeliverShipment(raw: unknown): GeliverShipment {
  const s = (raw ?? {}) as Record<string, any>
  const id = str(s.id)
  if (!id) throw new GeliverError('http', 'Geliver yanıtında gönderi kimliği yok')
  const ts = (s.trackingStatus ?? {}) as Record<string, any>
  const provider = str(s.providerServiceCode) ?? str(s.acceptedOffer?.providerServiceCode) ?? str(s.order?.buyerShipmentMethod)
  const code = str(ts.trackingStatusCode)?.toUpperCase() as GeliverTrackingCode | undefined
  return {
    id,
    number: typeof s.organizationShipmentID === 'number' ? s.organizationShipmentID : null,
    orderNumber: str(s.order?.orderNumber),
    statusCode: str(s.statusCode),
    trackingCode: code ?? null,
    trackingSubCode: str(ts.trackingSubStatusCode),
    statusText: str(ts.statusDetails),
    statusDate: str(ts.statusDate),
    trackingNumber: str(s.trackingNumber) ?? str(s.barcode),
    trackingUrl: str(s.trackingUrl) ?? GELIVER_TRACKING_PAGE(id),
    providerServiceCode: provider,
    carrierId: carrierFromProviderCode(provider),
    isTest: s.test === true,
    isReturn: s.isReturn === true,
    labelUrl: str(s.labelURL),
    barcode: str(s.barcode),
    offers: (Array.isArray(s.offers?.list) ? s.offers.list : [])
      .map(parseGeliverOffer)
      .filter((o: GeliverOffer | null): o is GeliverOffer => o !== null)
      .sort((a: GeliverOffer, b: GeliverOffer) => a.totalAmount - b.totalAmount),
  }
}

/** Müşteriye / panele gösterilecek kısa durum */
export function geliverStatusLabel(s: Pick<GeliverShipment, 'trackingSubCode' | 'statusText' | 'statusCode'>): string {
  if (s.trackingSubCode && GELIVER_SUB_STATUS_TR[s.trackingSubCode]) return GELIVER_SUB_STATUS_TR[s.trackingSubCode]
  if (s.statusText) return s.statusText
  switch (s.statusCode) {
    case 'CANCELED':
      return 'Gönderi iptal edildi'
    case 'LABEL_PRINTED':
    case 'TRACKING_CODE_CREATED':
    case 'OFFER_ACCEPTED':
      return 'Kargo etiketi hazır, teslim alınmayı bekliyor'
    default:
      return 'Gönderi oluşturuldu'
  }
}

type OrderLike = {
  status: string
  paymentStatus: string
  trackingNumber: string | null
  trackingUrl: string | null
  shippingCarrier: string | null
  geliverStatusLabel: string | null
}

export type GeliverPlan = {
  /** Siparişe yazılacak alanlar */
  data: Record<string, unknown>
  /** Zaman çizelgesine düşülecek notlar */
  events: { message: string; visibleToCustomer: boolean }[]
  /** Sipariş "Kargoda" yapılsın mı (kargo firması teslim aldı) */
  ship: boolean
  /** Sipariş "Teslim Edildi" yapılsın mı */
  deliver: boolean
  /** Yöneticiye uyarı (iade, kayıp, iptal) */
  alert: string | null
}

const SHIPPED_STATES = new Set(['SHIPPED', 'DELIVERED'])
/** Gönderi açıldı, teklif seçilmedi (etiket yok) */
export const PRE_LABEL_STATES = new Set(['CREATED', 'GOT_OFFERS'])

/**
 * Geliver'den gelen durumu siparişe uygulama planı (saf fonksiyon, testli).
 * - Takip numarası / linki / firma gelince yazılır.
 * - Kargo firması teslim aldığında (TRANSIT veya sonrası) ödemesi alınmış sipariş "Kargoda" olur, müşteriye e-posta gider.
 * - Teslimde "Teslim Edildi". İade, kayıp, iptal otomatik uygulanmaz: not ve uyarı.
 * - Test gönderisi siparişin durumunu değiştirmez, takip numarası ve linki siparişe yazılmaz.
 */
export function planGeliverUpdate(order: OrderLike, s: GeliverShipment, now = new Date()): GeliverPlan {
  const label = geliverStatusLabel(s)
  const data: Record<string, unknown> = { geliverStatusLabel: label, geliverStatusCode: s.trackingCode ?? s.statusCode, geliverSyncedAt: now }
  const events: GeliverPlan['events'] = []
  // Test gönderisinin takip numarası ve linki rastgeledir (example.com); etiketi alınmamış gönderinin takibi yoktur
  const hasTracking = !s.isTest && !PRE_LABEL_STATES.has(s.statusCode ?? '')
  if (hasTracking && s.trackingNumber && s.trackingNumber !== order.trackingNumber) data.trackingNumber = s.trackingNumber
  if (hasTracking && s.trackingUrl !== order.trackingUrl) data.trackingUrl = s.trackingUrl
  if (hasTracking && s.carrierId && s.carrierId !== order.shippingCarrier) data.shippingCarrier = s.carrierId
  if (label !== order.geliverStatusLabel && order.geliverStatusLabel !== null) {
    // Test gönderisinin ilerleyişi müşteriye gösterilmez
    events.push({ message: `Kargo durumu (Geliver): ${label}`, visibleToCustomer: !s.isTest })
  }

  let alert: string | null = null
  if (s.statusCode === 'CANCELED') alert = 'Geliver gönderisi iptal edilmiş'
  else if (s.trackingCode === 'RETURNED') alert = 'Kargo iade ediliyor / edildi'
  else if (s.trackingCode === 'FAILURE') alert = `Kargo sorunu: ${label}`
  if (alert) events.push({ message: `Uyarı (Geliver): ${alert}`, visibleToCustomer: false })

  const carrierHasIt = s.trackingCode === 'TRANSIT' || s.trackingCode === 'DELIVERED' || s.statusCode === 'SHIPPED' || s.statusCode === 'DELIVERED'
  const testNote = s.isTest ? 'Test gönderisi: sipariş durumu değiştirilmedi' : null
  if (testNote && carrierHasIt) events.push({ message: testNote, visibleToCustomer: false })
  const live = !s.isTest && !s.isReturn && !alert
  const ship = live && carrierHasIt && !SHIPPED_STATES.has(order.status) && order.paymentStatus === 'PAID'
  const deliver = live && s.trackingCode === 'DELIVERED' && order.status !== 'DELIVERED'
  return { data, events, ship, deliver, alert }
}

type FetchLike = (
  url: string,
  init?: { method?: string; headers?: Record<string, string>; body?: string }
) => Promise<{ status: number; json(): Promise<any> }>

/** Gönderi oluşturma girdisi (ölçüler cm, ağırlık kg) */
export type GeliverCreateInput = {
  orderNumber: string
  /** Ürünlerin toplam tutarı (TL) */
  orderTotal: number
  recipient: { name: string; email: string; phone: string; address: string; cityCode: string; districtID: number; zip?: string | null }
  parcel: { lengthCm: number; widthCm: number; heightCm: number; weightKg: number }
  items: { title: string; quantity: number }[]
}

export type GeliverClient = {
  readonly config: GeliverConfig
  /** Gönderi açar ve teklifleri bekler (en fazla birkaç saniye) */
  createShipment(input: GeliverCreateInput): Promise<GeliverShipment>
  /** Teklifi kabul eder: etiket satın alınır. Dönen gönderide etiket ve barkod vardır */
  acceptOffer(offerId: string): Promise<GeliverShipment>
  cancelShipment(id: string): Promise<void>
  getShipment(id: string): Promise<GeliverShipment>
  /** Sipariş numarasıyla açılmış gönderiler (yeniden eskiye) */
  findByOrderNumber(orderNo: string): Promise<GeliverShipment[]>
  /** Genel arama (takip no, gönderi no, alıcı) */
  search(text: string): Promise<GeliverShipment[]>
}

/** "0532 123 45 67" / "5321234567" → "+905321234567" */
export function geliverPhone(phone: string): string {
  const digits = phone.replace(/\D/g, '')
  return `+90${digits.slice(-10)}`
}

export function createGeliverClient(
  config: GeliverConfig,
  fetchImpl: FetchLike = fetch as unknown as FetchLike,
  opts: { offerWaitMs?: number; pollMs?: number } = {}
): GeliverClient {
  async function call(method: 'GET' | 'POST' | 'DELETE', path: string, payload?: unknown): Promise<any> {
    let res: { status: number; json(): Promise<any> }
    try {
      res = await fetchImpl(`${BASE_URL}${path}`, {
        method,
        headers: {
          Authorization: `Bearer ${config.token}`,
          Accept: 'application/json',
          ...(payload !== undefined ? { 'Content-Type': 'application/json' } : {}),
        },
        ...(payload !== undefined ? { body: JSON.stringify(payload) } : {}),
      })
    } catch (e) {
      throw new GeliverError('network', `Geliver'e ulaşılamadı (${e instanceof Error ? e.message : 'ağ hatası'})`)
    }
    const body = await res.json().catch(() => null)
    if (res.status === 401 || res.status === 403) throw new GeliverError('auth', 'Geliver API anahtarı geçersiz veya yetkisiz')
    if (res.status === 404) throw new GeliverError('not_found', 'Geliver gönderisi bulunamadı')
    if (res.status >= 400 || body?.result === false) {
      // Hata kodlu yanıtta açıklama "message"da, "additionalMessage" teknik ayrıntıdır
      const msg = body?.code ? `${body.message ?? body.additionalMessage} (${body.code})` : body?.additionalMessage ?? body?.message
      throw new GeliverError('http', String(msg ?? `HTTP ${res.status}`))
    }
    return body
  }
  const get = (path: string) => call('GET', path)
  const sleep = (ms: number) => new Promise((r) => setTimeout(r, ms))
  const offerWaitMs = opts.offerWaitMs ?? 8000
  const pollMs = opts.pollMs ?? 1000
  const list = async (q: string) => {
    const body = await get(`/shipments?limit=20&page=1&sortBy=${encodeURIComponent('updated_at desc')}&${q}`)
    return (Array.isArray(body?.data) ? body.data : []).map(parseGeliverShipment)
  }
  return {
    config,
    async createShipment(input) {
      const body = await call('POST', '/shipments', {
        test: config.testMode,
        ...(config.senderAddressId ? { senderAddressID: config.senderAddressId } : {}),
        length: String(input.parcel.lengthCm),
        width: String(input.parcel.widthCm),
        height: String(input.parcel.heightCm),
        distanceUnit: 'cm',
        weight: String(input.parcel.weightKg),
        massUnit: 'kg',
        items: input.items.map((i) => ({ title: i.title.slice(0, 120), quantity: i.quantity })),
        recipientAddress: {
          name: input.recipient.name,
          email: input.recipient.email,
          phone: geliverPhone(input.recipient.phone),
          address1: input.recipient.address.slice(0, 250),
          countryCode: 'TR',
          cityCode: input.recipient.cityCode,
          districtID: input.recipient.districtID,
          ...(input.recipient.zip ? { zip: input.recipient.zip } : {}),
        },
        productPaymentOnDelivery: false,
        order: {
          sourceCode: 'API',
          sourceIdentifier: process.env.NEXT_PUBLIC_SITE_URL || 'https://voltekno.com',
          orderNumber: input.orderNumber,
          totalAmount: Math.round(input.orderTotal),
          totalAmountCurrency: 'TL',
        },
      })
      let shipment = parseGeliverShipment(body?.data ?? body)
      // Teklifler anlık toplanır: tamamlanana (ya da süre dolana) kadar gönderi yeniden okunur
      const started = Date.now()
      let pct = Number(body?.data?.offers?.percentageCompleted ?? 100)
      while (pct < 100 && Date.now() - started < offerWaitMs) {
        await sleep(pollMs)
        const again = await get(`/shipments/${encodeURIComponent(shipment.id)}`)
        shipment = parseGeliverShipment(again?.data ?? again)
        pct = Number(again?.data?.offers?.percentageCompleted ?? 100)
      }
      return shipment
    },
    async acceptOffer(offerId) {
      const body = await call('POST', '/transactions', { offerID: offerId })
      return parseGeliverShipment(body?.data?.shipment)
    },
    async cancelShipment(id) {
      await call('DELETE', `/shipments/${encodeURIComponent(id)}`)
    },
    async getShipment(id) {
      const body = await get(`/shipments/${encodeURIComponent(id)}`)
      return parseGeliverShipment(body?.data ?? body)
    },
    findByOrderNumber: (orderNo) => list(`orderNumber=${encodeURIComponent(orderNo)}`),
    search: (text) => list(`filter=${encodeURIComponent(text)}`),
  }
}

export function getGeliverClient(): GeliverClient | null {
  const config = geliverConfigFromEnv()
  return config ? createGeliverClient(config) : null
}

const UUID_RE = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i

/**
 * Yöneticinin yapıştırdığı değeri gönderiye çevirir: Geliver gönderi kimliği (UUID), takip linki
 * (app.geliver.io/tracking/…), takip numarası ya da Geliver gönderi numarası.
 */
export async function resolveGeliverShipment(client: GeliverClient, input: string): Promise<GeliverShipment> {
  const raw = input.trim()
  const fromUrl = raw.match(/tracking\/([0-9a-f-]{36})/i)?.[1]
  const id = fromUrl ?? (UUID_RE.test(raw) ? raw : null)
  if (id) return client.getShipment(id)
  const hits = await client.search(raw)
  const exact = hits.filter((s) => s.trackingNumber === raw || String(s.number ?? '') === raw || s.orderNumber === raw)
  const pick = exact.length ? exact : hits
  if (pick.length === 0) throw new GeliverError('not_found', `Geliver'de "${raw}" ile gönderi bulunamadı`)
  if (pick.length > 1) throw new GeliverError('http', `"${raw}" birden fazla gönderiyle eşleşti; Geliver gönderi linkini yapıştırın`)
  return pick[0]
}
