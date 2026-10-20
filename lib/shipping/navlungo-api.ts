/**
 * Navlungo Domestic API v2.1 istemcisi: gönderi oluşturma, durum sorgulama, etiket ve iptal.
 * Fiyat sorgulama ucu yok; kargo ücreti lib/shipping/rates.ts tablolarından gelmeye devam eder.
 *
 * Kimlik bilgisi panelde Entegrasyonlar bölümünden açılan API kullanıcısıdır (şifre yalnızca bir kez gösterilir;
 * panel girişi API'de çalışmaz). QA ve üretim ayrı hesaplardır:
 *   üretim https://domestic-api.navlungo.com/v2.1 · QA https://domestic-api-qa.navlungo.com/v2.1
 *
 * Ortam değişkenleri (biri eksikse özellik kapalı kalır):
 *   NAVLUNGO_API_USERNAME, NAVLUNGO_API_PASSWORD, NAVLUNGO_SENDER_ADDRESS_ID (Adres Defteri → Depo Konumları kaydının id'si)
 *   NAVLUNGO_TEST_MODE: "0" / "false" değilse QA ortamı kullanılır (yanlışlıkla gerçek gönderi açılmasın)
 *   NAVLUNGO_CARRIER_ID: isteğe bağlı, 1 = Navlungo en uygun firmayı seçer (varsayılan) ya da somut anlaşma id'si
 *
 * Bearer token 8 saat geçerlidir; süre bitmeden 5 dk önce yenilenir, 401 gelirse bir kez yeniden alınır.
 * İstek/yanıt alanları tcgunel/omniship-navlungo paketinin kaynağı ve test verileriyle doğrulandı (20.10.2026);
 * gerçek API ile henüz denenmedi (kimlik bilgisi yok).
 * Sunucuya özeldir: istemci bileşenlerinden içe aktarılmamalı.
 */

export const NAVLUNGO_API_URL = 'https://domestic-api.navlungo.com/v2.1'
export const NAVLUNGO_QA_API_URL = 'https://domestic-api-qa.navlungo.com/v2.1'

export type NavlungoConfig = {
  username: string
  password: string
  senderAddressId: number
  testMode: boolean
  /** 1 = otomatik firma seçimi */
  carrierId: number
  /** Gönderi belgesinde görünen platform adı */
  platform: string
}

type Env = Record<string, string | undefined>

/** Ortamdan yapılandırma; zorunlu alanlardan biri eksikse null (özellik kapalı). */
export function navlungoConfigFromEnv(env: Env = process.env): NavlungoConfig | null {
  const username = env.NAVLUNGO_API_USERNAME?.trim()
  const password = env.NAVLUNGO_API_PASSWORD?.trim()
  const senderAddressId = Number(env.NAVLUNGO_SENDER_ADDRESS_ID)
  if (!username || !password || !Number.isInteger(senderAddressId) || senderAddressId <= 0) return null
  const test = (env.NAVLUNGO_TEST_MODE ?? '').trim().toLowerCase()
  const carrierId = Number(env.NAVLUNGO_CARRIER_ID)
  return {
    username,
    password,
    senderAddressId,
    testMode: test !== '0' && test !== 'false',
    carrierId: Number.isInteger(carrierId) && carrierId > 0 ? carrierId : 1,
    platform: env.NAVLUNGO_PLATFORM?.trim() || 'Voltekno',
  }
}

export function isNavlungoEnabled(env: Env = process.env): boolean {
  return navlungoConfigFromEnv(env) !== null
}

// ── Durum kodları (post/check → status.status_code) ─────────────────────────────────────────

export type NavlungoPhase =
  | 'preparing'
  | 'awaiting_pickup'
  | 'picked_up'
  | 'in_transit'
  | 'out_for_delivery'
  | 'delivered'
  | 'returning'
  | 'cancelled'
  | 'claim'
  | 'unknown'

export const NAVLUNGO_STATUS: Record<number, { label: string; phase: NavlungoPhase }> = {
  1: { label: 'Teslim Alınacak', phase: 'awaiting_pickup' },
  2: { label: 'Teslim Edildi', phase: 'delivered' },
  3: { label: 'Teslim Edilecek', phase: 'out_for_delivery' },
  4: { label: 'Dağıtıma Çıktı', phase: 'out_for_delivery' },
  5: { label: 'Tekrar Sevk', phase: 'in_transit' },
  6: { label: 'Dağıtım Planlandı', phase: 'in_transit' },
  7: { label: 'İade Edilecek', phase: 'returning' },
  9: { label: 'İade Edildi', phase: 'returning' },
  10: { label: 'İptal', phase: 'cancelled' },
  14: { label: 'Hazırlanıyor', phase: 'preparing' },
  16: { label: 'Teslim Alındı', phase: 'picked_up' },
  17: { label: 'Transfer Aşamasında', phase: 'in_transit' },
  18: { label: 'Şubede Beklemede', phase: 'in_transit' },
  19: { label: 'Tazmin Durumu Değerlendiriliyor', phase: 'claim' },
  20: { label: 'Tazmin Süreci Tamamlandı', phase: 'claim' },
  21: { label: 'Depoya İade Edildi', phase: 'returning' },
}

export function navlungoPhase(code: number | null | undefined): NavlungoPhase {
  return code != null ? NAVLUNGO_STATUS[code]?.phase ?? 'unknown' : 'unknown'
}

// ── Hatalar ─────────────────────────────────────────────────────────────────────────────────

export type NavlungoErrorKind = 'auth' | 'api' | 'http' | 'network' | 'duplicate' | 'label_pending'

export class NavlungoError extends Error {
  constructor(
    message: string,
    readonly kind: NavlungoErrorKind,
    readonly status = 0
  ) {
    super(message)
    this.name = 'NavlungoError'
  }
}

/** Navlungo hata gövdesi: error metin ya da { alan: [mesajlar] }, yoksa message */
export function navlungoErrorMessage(payload: unknown): string {
  if (!payload || typeof payload !== 'object') return ''
  const { error, message } = payload as { error?: unknown; message?: unknown }
  if (typeof error === 'string' && error) return error
  if (error && typeof error === 'object') {
    const parts = Object.values(error as Record<string, unknown>).flatMap((v) =>
      typeof v === 'string' ? [v] : Array.isArray(v) ? v.filter((x): x is string => typeof x === 'string') : []
    )
    if (parts.length) return parts.join(' ')
  }
  return typeof message === 'string' ? message : ''
}

// ── Veri biçimleri ──────────────────────────────────────────────────────────────────────────

export type NavlungoRecipient = {
  name: string
  phone: string
  email?: string | null
  address: string
  city: string
  district: string
  postCode?: string | null
}

export type CreatePostInput = {
  /** Hesap başına benzersiz; sipariş numarası kullanılır */
  referenceId: string
  recipient: NavlungoRecipient
  desi: number
  packageCount?: number
  note?: string
}

export type CreatedPost = {
  postNumber: string
  referenceId: string | null
  trackingUrl: string | null
  labelUrl: string | null
  carrierName: string | null
  message: string | null
}

export type NavlungoLog = { statusCode: number | null; text: string; at: string | null }

export type NavlungoTracking = {
  postNumber: string
  referenceId: string | null
  trackingUrl: string | null
  /** Taşıyıcı gönderiyi kabul edince verilir; o zamana kadar null */
  carrierTrackingCode: string | null
  carrierTrackingUrl: string | null
  carrierName: string | null
  statusCode: number | null
  statusName: string | null
  phase: NavlungoPhase
  /** Etiket hazır mı (barcode_status 1) */
  labelReady: boolean
  deliveredAt: string | null
  deliveredTo: string | null
  logs: NavlungoLog[]
}

export type NavlungoLabel = { pdf: Buffer | null; url: string | null }

const str = (v: unknown): string | null => (typeof v === 'string' && v.trim() ? v.trim() : null)
const num = (v: unknown): number | null => {
  const n = typeof v === 'number' ? v : typeof v === 'string' && v.trim() ? Number(v) : NaN
  return Number.isFinite(n) ? n : null
}
const obj = (v: unknown): Record<string, unknown> => (v && typeof v === 'object' && !Array.isArray(v) ? (v as Record<string, unknown>) : {})

/** Telefon: Navlungo "+90 5XX XXX XX XX" biçimini bekler */
export function normalizeNavlungoPhone(phone: string | null | undefined): string {
  const raw = (phone ?? '').trim()
  const digits = raw.replace(/\D+/g, '')
  let national: string | null = null
  if (digits.length === 12 && digits.startsWith('90')) national = digits.slice(2)
  else if (digits.length === 11 && digits.startsWith('0')) national = digits.slice(1)
  else if (digits.length === 10) national = digits
  if (!national) return raw
  return `+90 ${national.slice(0, 3)} ${national.slice(3, 6)} ${national.slice(6, 8)} ${national.slice(8, 10)}`
}

/** post/create gövdesi (API dizi kabul eder; tek gönderi yollanır) */
export function buildCreatePostBody(config: NavlungoConfig, input: CreatePostInput) {
  const r = input.recipient
  return {
    platform: config.platform,
    posts: [
      {
        reference_id: input.referenceId,
        carrier_id: config.carrierId,
        post_type: 2, // standart teslimat
        cod_payment_type: '', // kapıda ödeme yok (siparişler önceden ödenir)
        sender: { addressId: config.senderAddressId },
        recipient: {
          name: r.name.trim(),
          phone: normalizeNavlungoPhone(r.phone),
          email: r.email?.trim() ?? '',
          address: r.address.trim(),
          country: 'tr',
          city: r.city.trim(),
          district: r.district.trim(),
          post_code: r.postCode?.trim() ?? '',
        },
        post: {
          desi: Math.max(1, Math.round(input.desi * 100) / 100),
          package_count: Math.max(1, Math.floor(input.packageCount ?? 1)),
          price: '',
          note: input.note ?? '',
        },
        barcode_format: 'pdf-A5',
        custom_data_1: input.referenceId,
        custom_data_2: '',
        custom_data_3: '',
        custom_data_4: '',
      },
    ],
  }
}

/** post/create yanıtı: belgede düz nesne (barcode_url), QA'da data: [ {...} ] (barcode) */
export function parseCreatedPost(payload: unknown): CreatedPost | null {
  const p = obj(payload)
  const data = p.data
  const src = Array.isArray(data) ? obj(data[0]) : data && typeof data === 'object' ? obj(data) : p
  const merged = { ...p, ...src }
  const postNumber = str(merged.post_number)
  if (!postNumber) return null
  return {
    postNumber,
    referenceId: str(merged.reference_id),
    trackingUrl: str(merged.tracking_url),
    labelUrl: str(merged.barcode_url) ?? str(merged.barcode),
    carrierName: str(obj(merged.post).carrier_name),
    message: str(p.message),
  }
}

export function parseTracking(payload: unknown): NavlungoTracking | null {
  const d = obj(obj(payload).data)
  const postNumber = str(d.post_number)
  if (!postNumber) return null
  const status = obj(d.status)
  const statusCode = num(status.status_code)
  const logs = (Array.isArray(d.logs) ? d.logs : []).map((l) => {
    const row = obj(l)
    return { statusCode: num(row.status_code), text: str(row.action_result) ?? str(row.action) ?? '', at: str(row.created_at) }
  })
  return {
    postNumber,
    referenceId: str(d.reference_id),
    trackingUrl: str(d.tracking_url),
    carrierTrackingCode: str(d.carrier_tracking_code),
    carrierTrackingUrl: str(d.carrier_tracking_url),
    carrierName: str(obj(d.post).carrier_name),
    statusCode,
    statusName: str(status.status_name) ?? (statusCode != null ? NAVLUNGO_STATUS[statusCode]?.label ?? null : null),
    phase: navlungoPhase(statusCode),
    labelReady: num(d.barcode_status) === 1,
    deliveredAt: str(status.delivered_date),
    deliveredTo: str(status.delivered_person_name),
    logs,
  }
}

// ── İstemci ─────────────────────────────────────────────────────────────────────────────────

export type FetchLike = (url: string, init: RequestInit) => Promise<Response>
export type TokenCache = Map<string, { token: string; expiresAt: number }>

const TOKEN_TTL_MS = 8 * 3_600_000
const TOKEN_BUFFER_MS = 5 * 60_000

/** Süreç genelinde paylaşılan token önbelleği (ortam + kullanıcı adına göre) */
const g = globalThis as typeof globalThis & { __navlungoTokens?: TokenCache }
const sharedTokens: TokenCache = (g.__navlungoTokens ??= new Map())

/** "2026-10-20 23:59:00" (İstanbul saati) → ms; okunamazsa null */
function parseExpiry(v: unknown): number | null {
  const s = str(v)
  if (!s) return null
  const iso = /^\d{4}-\d{2}-\d{2} \d{2}:\d{2}(:\d{2})?$/.test(s) ? `${s.replace(' ', 'T')}+03:00` : s
  const t = Date.parse(iso)
  return Number.isFinite(t) ? t : null
}

export type NavlungoClient = ReturnType<typeof createNavlungoClient>

export function createNavlungoClient(
  config: NavlungoConfig,
  opts: { fetch?: FetchLike; tokenCache?: TokenCache; now?: () => number; timeoutMs?: number } = {}
) {
  const doFetch: FetchLike = opts.fetch ?? ((url, init) => fetch(url, init))
  const tokens = opts.tokenCache ?? sharedTokens
  const now = opts.now ?? Date.now
  const timeoutMs = opts.timeoutMs ?? 20_000
  const baseUrl = config.testMode ? NAVLUNGO_QA_API_URL : NAVLUNGO_API_URL
  const cacheKey = `${config.testMode ? 'qa' : 'prod'}:${config.username}`
  let pendingToken: Promise<string> | null = null

  async function call(method: string, path: string, body?: unknown, token?: string) {
    const headers: Record<string, string> = { Accept: 'application/json', 'X-localization': 'tr' }
    if (token) headers.Authorization = `Bearer ${token}`
    if (body !== undefined) headers['Content-Type'] = 'application/json'
    let res: Response
    try {
      res = await doFetch(`${baseUrl}${path}`, {
        method,
        headers,
        body: body !== undefined ? JSON.stringify(body) : undefined,
        signal: AbortSignal.timeout(timeoutMs),
      })
    } catch (e) {
      throw new NavlungoError(`Navlungo'ya ulaşılamadı: ${e instanceof Error ? e.message : String(e)}`, 'network')
    }
    const text = await res.text()
    let payload: unknown = null
    try {
      payload = text ? JSON.parse(text) : null
    } catch {
      payload = null
    }
    return { status: res.status, payload, text }
  }

  async function fetchToken(): Promise<string> {
    const { status, payload, text } = await call('POST', '/auth/api', { username: config.username, password: config.password })
    const data = obj(obj(payload).data)
    const token = str(data.access_token)
    if (!token) {
      const msg = navlungoErrorMessage(payload) || text.slice(0, 200) || `HTTP ${status}`
      throw new NavlungoError(`Navlungo kimlik doğrulaması başarısız: ${msg}`, 'auth', status)
    }
    const expiry = parseExpiry(data.expires_in) ?? now() + TOKEN_TTL_MS
    // En az 1 dk, en çok 8 saat; bitişten 5 dk önce yenilenir
    const expiresAt = Math.min(now() + TOKEN_TTL_MS, Math.max(now() + 60_000, expiry - TOKEN_BUFFER_MS))
    tokens.set(cacheKey, { token, expiresAt })
    return token
  }

  async function getToken(): Promise<string> {
    const hit = tokens.get(cacheKey)
    if (hit && hit.expiresAt > now()) return hit.token
    // Eşzamanlı istekler tek token alır
    pendingToken ??= fetchToken().finally(() => {
      pendingToken = null
    })
    return pendingToken
  }

  /** Yetkili istek; status !== true ise NavlungoError. 401'de token bir kez yenilenir. */
  async function request(method: string, path: string, body?: unknown): Promise<Record<string, unknown>> {
    let res = await call(method, path, body, await getToken())
    if (res.status === 401) {
      tokens.delete(cacheKey)
      res = await call(method, path, body, await getToken())
    }
    const p = obj(res.payload)
    if (res.payload === null) {
      throw new NavlungoError(`Navlungo yanıtı okunamadı (HTTP ${res.status}): ${res.text.slice(0, 200)}`, 'http', res.status)
    }
    if (p.status !== true) {
      const msg = navlungoErrorMessage(p) || `HTTP ${res.status}`
      throw new NavlungoError(msg, res.status === 401 ? 'auth' : 'api', res.status)
    }
    return p
  }

  return {
    config,
    baseUrl,
    getToken,

    /** Gönderi oluşturur. Aynı reference_id daha önce kullanıldıysa kind 'duplicate'. */
    async createPost(input: CreatePostInput): Promise<CreatedPost> {
      try {
        const p = await request('POST', '/post/create', buildCreatePostBody(config, input))
        const created = parseCreatedPost(p)
        if (!created) throw new NavlungoError('Navlungo gönderi numarası döndürmedi.', 'api')
        return created
      } catch (e) {
        if (e instanceof NavlungoError && e.kind === 'api' && /zaten mevcut/i.test(e.message)) {
          throw new NavlungoError(e.message, 'duplicate', e.status)
        }
        throw e
      }
    },

    /** Durum: gönderi numarası ya da reference_id (sipariş no) ile */
    async checkPost(id: string): Promise<NavlungoTracking> {
      const p = await request('GET', `/post/check/${encodeURIComponent(id.trim())}`)
      const t = parseTracking(p)
      if (!t) throw new NavlungoError('Navlungo gönderi bilgisi döndürmedi.', 'api')
      return t
    },

    /** Etiket PDF'i. Oluşturma asenkron: hazır değilse kind 'label_pending'. */
    async getLabel(postNumber: string): Promise<NavlungoLabel> {
      try {
        const d = obj((await request('POST', '/barcode/getBarcode', { post_number: postNumber, barcode_type: 'pdf' })).data)
        const b64 = str(d.barcode_pdf)
        const pdf = b64 ? Buffer.from(b64, 'base64') : null
        const url = str(d.barcode_url)
        if (!pdf?.length && !url) throw new NavlungoError('Etiket henüz hazır değil.', 'label_pending')
        return { pdf: pdf?.length ? pdf : null, url }
      } catch (e) {
        // Etiket üretilmeden çağrılınca API 500 + "file_get_contents(...) 404" döndürüyor
        if (e instanceof NavlungoError && (e.kind === 'api' || e.kind === 'http') && e.status >= 500 && /404|file_get_contents/i.test(e.message)) {
          throw new NavlungoError('Etiket henüz hazır değil.', 'label_pending', e.status)
        }
        throw e
      }
    },

    /** İptal yalnızca "Hazırlanıyor" / "Teslim Alınacak" durumundayken yapılabilir */
    async cancelPost(postNumber: string): Promise<{ message: string | null }> {
      const p = await request('POST', '/post/cancel', { post_number: postNumber })
      return { message: str(p.message) }
    },
  }
}

/** Ortam yapılandırmasıyla istemci; özellik kapalıysa null */
export function getNavlungoClient(): NavlungoClient | null {
  const config = navlungoConfigFromEnv()
  return config ? createNavlungoClient(config) : null
}

// ── Takip güncellemesi (saf karar; veritabanı işi lib/shipping/navlungo-shipments.ts) ─────────

export type TrackedOrder = {
  status: string
  trackingNumber: string | null
  trackingUrl: string | null
  shippingCarrier: string | null
  navlungoStatusCode: number | null
}

export type TrackingPlan = {
  /** Order'a yazılacak alanlar */
  data: {
    navlungoStatusCode: number | null
    navlungoStatusName: string | null
    navlungoSyncedAt: Date
    trackingNumber?: string
    trackingUrl?: string
    shippingCarrier?: string
  }
  statusChanged: boolean
  /** Sipariş "Teslim Edildi"ye geçirilmeli */
  deliver: boolean
  /** Zaman çizelgesine yazılacak olaylar */
  events: { message: string; visibleToCustomer: boolean }[]
  /** Yöneticinin ilgilenmesi gereken durum (iade, iptal, tazmin) */
  alert: string | null
}

/**
 * post/check sonucuna göre siparişte ne değişeceği.
 * Teslimde DELIVERED'a geçiş lib/order-service üzerinden yapılır (e-posta + zaman çizelgesi orada).
 * İade/iptal otomatik uygulanmaz (stok ve ücret iadesi yönetici kararıdır); yalnızca uyarı üretilir.
 */
export function planTrackingUpdate(
  order: TrackedOrder,
  t: NavlungoTracking,
  matchCarrierId: (carrierName: string) => string | null,
  now = new Date()
): TrackingPlan {
  const data: TrackingPlan['data'] = { navlungoStatusCode: t.statusCode, navlungoStatusName: t.statusName, navlungoSyncedAt: now }
  const events: TrackingPlan['events'] = []
  const statusChanged = t.statusCode !== order.navlungoStatusCode

  if (t.carrierTrackingCode && t.carrierTrackingCode !== order.trackingNumber) {
    data.trackingNumber = t.carrierTrackingCode
    events.push({ message: `Taşıyıcı takip numarası: ${t.carrierTrackingCode}${t.carrierName ? ` (${t.carrierName})` : ''}`, visibleToCustomer: false })
  }
  if (t.trackingUrl && t.trackingUrl !== order.trackingUrl) data.trackingUrl = t.trackingUrl
  const carrierId = t.carrierName ? matchCarrierId(t.carrierName) : null
  if (carrierId && carrierId !== order.shippingCarrier) data.shippingCarrier = carrierId

  let alert: string | null = null
  if (statusChanged && t.statusCode != null) {
    const label = t.statusName ?? `kod ${t.statusCode}`
    switch (t.phase) {
      case 'picked_up':
      case 'in_transit':
      case 'out_for_delivery':
        events.push({ message: `Kargo durumu: ${label}`, visibleToCustomer: true })
        break
      case 'returning':
      case 'cancelled':
      case 'claim':
        alert = `Navlungo gönderi durumu "${label}". Gönderiyi Navlungo panelinden kontrol edin; sipariş durumu otomatik değiştirilmedi.`
        events.push({ message: alert, visibleToCustomer: false })
        break
      case 'delivered':
        break // DELIVERED geçişi kendi olayını yazar
      default:
        events.push({ message: `Navlungo durumu: ${label}`, visibleToCustomer: false })
    }
  }
  return { data, statusChanged, deliver: t.phase === 'delivered' && order.status === 'SHIPPED', events, alert }
}
