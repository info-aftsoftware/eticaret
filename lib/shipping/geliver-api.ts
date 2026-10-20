/**
 * Geliver API (https://docs.geliver.io): gönderi takibi.
 * Gönderiler şimdilik Geliver panelinde açılır; site gönderiyi siparişe bağlar ve durumunu çeker.
 * Yetki: Authorization: Bearer <GELIVER_API_TOKEN> (app.geliver.io/apitokens). Token yoksa özellik kapalıdır.
 *
 * Kullanılan uçlar (yalnızca okuma):
 *   GET /shipments/{id}                 tek gönderi: trackingNumber, trackingUrl, trackingStatus
 *   GET /shipments?orderNumber=…&filter=…  listeleme (sipariş no / takip no ile arama)
 * Takip sayfası: gönderide trackingUrl yoksa https://app.geliver.io/tracking/{shipmentID}
 */
import { getCarrier } from '@/lib/shipping/carriers'

const BASE_URL = 'https://api.geliver.io/api/v1'
export const GELIVER_TRACKING_PAGE = (id: string) => `https://app.geliver.io/tracking/${encodeURIComponent(id)}`

export type GeliverConfig = { token: string }

export function geliverConfigFromEnv(env: Partial<Record<string, string>> = process.env): GeliverConfig | null {
  const token = env.GELIVER_API_TOKEN?.trim()
  return token ? { token } : null
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

/**
 * Geliver'den gelen durumu siparişe uygulama planı (saf fonksiyon, testli).
 * - Takip numarası / linki / firma gelince yazılır.
 * - Kargo firması teslim aldığında (TRANSIT veya sonrası) ödemesi alınmış sipariş "Kargoda" olur, müşteriye e-posta gider.
 * - Teslimde "Teslim Edildi". İade, kayıp, iptal otomatik uygulanmaz: not ve uyarı.
 * - Test gönderisi siparişin durumunu değiştirmez.
 */
export function planGeliverUpdate(order: OrderLike, s: GeliverShipment, now = new Date()): GeliverPlan {
  const label = geliverStatusLabel(s)
  const data: Record<string, unknown> = { geliverStatusLabel: label, geliverStatusCode: s.trackingCode ?? s.statusCode, geliverSyncedAt: now }
  const events: GeliverPlan['events'] = []
  if (s.trackingNumber && s.trackingNumber !== order.trackingNumber) data.trackingNumber = s.trackingNumber
  if (s.trackingUrl !== order.trackingUrl) data.trackingUrl = s.trackingUrl
  if (s.carrierId && s.carrierId !== order.shippingCarrier) data.shippingCarrier = s.carrierId
  if (label !== order.geliverStatusLabel && order.geliverStatusLabel !== null) {
    events.push({ message: `Kargo durumu (Geliver): ${label}`, visibleToCustomer: true })
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

type FetchLike = (url: string, init?: { headers?: Record<string, string> }) => Promise<{ status: number; json(): Promise<any> }>

export type GeliverClient = {
  getShipment(id: string): Promise<GeliverShipment>
  /** Sipariş numarasıyla açılmış gönderiler (yeniden eskiye) */
  findByOrderNumber(orderNo: string): Promise<GeliverShipment[]>
  /** Genel arama (takip no, gönderi no, alıcı) */
  search(text: string): Promise<GeliverShipment[]>
}

export function createGeliverClient(config: GeliverConfig, fetchImpl: FetchLike = fetch as unknown as FetchLike): GeliverClient {
  async function get(path: string): Promise<any> {
    let res: { status: number; json(): Promise<any> }
    try {
      res = await fetchImpl(`${BASE_URL}${path}`, { headers: { Authorization: `Bearer ${config.token}`, Accept: 'application/json' } })
    } catch (e) {
      throw new GeliverError('network', `Geliver'e ulaşılamadı (${e instanceof Error ? e.message : 'ağ hatası'})`)
    }
    const body = await res.json().catch(() => null)
    if (res.status === 401 || res.status === 403) throw new GeliverError('auth', 'Geliver API anahtarı geçersiz veya yetkisiz')
    if (res.status === 404) throw new GeliverError('not_found', 'Geliver gönderisi bulunamadı')
    if (res.status >= 400 || body?.result === false) {
      throw new GeliverError('http', String(body?.additionalMessage ?? body?.message ?? `HTTP ${res.status}`))
    }
    return body
  }
  const list = async (q: string) => {
    const body = await get(`/shipments?limit=20&page=1&sortBy=${encodeURIComponent('updated_at desc')}&${q}`)
    return (Array.isArray(body?.data) ? body.data : []).map(parseGeliverShipment)
  }
  return {
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
