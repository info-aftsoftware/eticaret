/**
 * iyzico Ödeme Formu (Checkout Form) — kart bilgisi sitemize hiç gelmez.
 *
 * Akış: sipariş oluşur → sunucu /payment/iyzipos/checkoutform/initialize/auth/ecom ile ödeme sayfası açar →
 * müşteri iyzico'nun barındırdığı sayfada (3D Secure dahil) öder → iyzico tarayıcı üzerinden callbackUrl'e
 * `token` POST eder → /api/payments/iyzico/callback sonucu iyzico'dan SUNUCUDAN SUNUCUYA sorgular
 * (/payment/iyzipos/checkoutform/auth/ecom/detail) ve tutarı doğrulayıp siparişi işler. Tarayıcıdan gelen
 * hiçbir alan sonuç olarak kabul edilmez; yalnızca token iyzico'ya sorulur.
 *
 * Ortam değişkenleri (iyzico üye işyeri panelinden):
 *   IYZICO_API_KEY     — API anahtarı
 *   IYZICO_SECRET_KEY  — güvenlik anahtarı (gizli)
 *   IYZICO_BASE_URL    — https://api.iyzipay.com (canlı) | https://sandbox-api.iyzipay.com (test)
 * Üçü de tanımlıysa kartlı ödeme iyzico ile alınır (lib/payments/card.ts); değilse banka sanal POS'una düşülür.
 */

import crypto from 'node:crypto'

export type IyzicoConfig = { apiKey: string; secretKey: string; baseUrl: string; sandbox: boolean }

const ALLOWED_HOSTS = new Set(['api.iyzipay.com', 'sandbox-api.iyzipay.com'])

export function getIyzicoConfig(): IyzicoConfig | null {
  const apiKey = process.env.IYZICO_API_KEY?.trim()
  const secretKey = process.env.IYZICO_SECRET_KEY?.trim()
  const baseUrl = (process.env.IYZICO_BASE_URL?.trim() || '').replace(/\/$/, '')
  if (!apiKey || !secretKey || !baseUrl) return null
  let host: string
  try {
    const u = new URL(baseUrl)
    if (u.protocol !== 'https:') return null
    host = u.host
  } catch {
    return null
  }
  if (!ALLOWED_HOSTS.has(host)) return null
  return { apiKey, secretKey, baseUrl, sandbox: host.startsWith('sandbox-') }
}

export const isIyzicoConfigured = () => getIyzicoConfig() !== null

/**
 * IYZWSv2 yetkilendirme başlığı: HMAC-SHA256(secretKey, randomKey + uriPath + body) → hex;
 * "apiKey:…&randomKey:…&signature:…" Base64 → "IYZWSv2 <base64>".
 */
export function iyzicoAuthorization(config: Pick<IyzicoConfig, 'apiKey' | 'secretKey'>, uriPath: string, body: string, randomKey: string): string {
  const signature = crypto.createHmac('sha256', config.secretKey).update(randomKey + uriPath + body, 'utf8').digest('hex')
  const auth = `apiKey:${config.apiKey}&randomKey:${randomKey}&signature:${signature}`
  return `IYZWSv2 ${Buffer.from(auth, 'utf8').toString('base64')}`
}

async function iyzicoPost<T>(config: IyzicoConfig, uriPath: string, payload: unknown): Promise<T> {
  const body = JSON.stringify(payload)
  const randomKey = `${Date.now()}${crypto.randomBytes(6).toString('hex')}`
  const res = await fetch(`${config.baseUrl}${uriPath}`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      Accept: 'application/json',
      Authorization: iyzicoAuthorization(config, uriPath, body, randomKey),
      'x-iyzi-rnd': randomKey,
    },
    body,
    signal: AbortSignal.timeout(20_000),
  })
  const json = (await res.json().catch(() => null)) as T | null
  if (!json) throw new Error(`iyzico yanıtı okunamadı (HTTP ${res.status})`)
  return json
}

const money = (n: number) => (Math.round(n * 100) / 100).toFixed(2)

/** "5xx xxx xx xx" → "+905xxxxxxxxx" */
export function toIyzicoGsm(phone: string): string {
  const d = phone.replace(/\D/g, '').replace(/^90/, '').replace(/^0/, '')
  return `+90${d}`
}

/** "Ad İkinci Soyad" → { name: "Ad İkinci", surname: "Soyad" } (tek kelimede soyad = ad) */
export function splitName(full: string): { name: string; surname: string } {
  const parts = full.trim().split(/\s+/).filter(Boolean)
  if (parts.length <= 1) return { name: parts[0] || 'Müşteri', surname: parts[0] || 'Müşteri' }
  return { name: parts.slice(0, -1).join(' '), surname: parts[parts.length - 1] }
}

export type IyzicoLine = { id: string; name: string; category: string; amount: number }

/**
 * Sepet kalemleri: iyzico, kalem fiyatları toplamının "price" ile kuruşu kuruşuna eşit olmasını ister.
 * Kupon / havale indirimi ve kargo sipariş toplamına yansıdığı için kalemler toplamla orantılanır;
 * yuvarlama farkı en büyük kaleme eklenir. Sıfır tutarlı kalem gönderilmez (iyzico reddeder).
 */
export function buildBasketItems(lines: IyzicoLine[], total: number): { id: string; name: string; category1: string; itemType: 'PHYSICAL'; price: string }[] {
  const positive = lines.filter((l) => l.amount > 0)
  const sum = positive.reduce((s, l) => s + l.amount, 0)
  if (!(sum > 0) || !(total > 0)) throw new Error('Sepet tutarı geçersiz')
  const totalCents = Math.round(total * 100)
  const cents = positive.map((l) => Math.max(1, Math.floor((l.amount / sum) * totalCents)))
  const diff = totalCents - cents.reduce((s, c) => s + c, 0)
  cents[cents.indexOf(Math.max(...cents))] += diff
  return positive.map((l, i) => ({
    id: l.id.slice(0, 50),
    name: l.name.slice(0, 120),
    category1: (l.category || 'Enerji Ürünleri').slice(0, 60),
    itemType: 'PHYSICAL' as const,
    price: (cents[i] / 100).toFixed(2),
  }))
}

export type IyzicoCheckoutInput = {
  orderNo: string
  total: number
  callbackUrl: string
  locale?: 'tr' | 'en'
  ip: string | null
  buyer: { id: string; name: string; email: string; phone: string; identityNumber?: string | null; registeredAt?: Date | null }
  shipping: { name: string; address: string; city: string; district?: string | null; country: string; zipCode?: string | null }
  billing: { name: string; address: string; city: string; district?: string | null; country: string; zipCode?: string | null }
  lines: IyzicoLine[]
}

/** Ödeme formu başlatma isteğinin gövdesi (saf fonksiyon; birim testli) */
export function buildCheckoutFormRequest(input: IyzicoCheckoutInput) {
  const { name, surname } = splitName(input.buyer.name)
  // TC kimlik no iyzico'da zorunlu alan; müşteri girmediyse iyzico'nun kabul ettiği yer tutucu gönderilir
  const identityNumber = /^\d{11}$/.test(input.buyer.identityNumber ?? '') ? input.buyer.identityNumber! : '11111111111'
  const addr = (a: IyzicoCheckoutInput['shipping']) => ({
    contactName: a.name.slice(0, 100),
    city: a.city.slice(0, 50),
    country: a.country || 'Türkiye',
    address: [a.address, a.district, a.city].filter(Boolean).join(', ').slice(0, 250),
    ...(a.zipCode ? { zipCode: a.zipCode } : {}),
  })
  const fmtDate = (d: Date) => d.toISOString().slice(0, 19).replace('T', ' ')
  return {
    locale: input.locale === 'en' ? 'en' : 'tr',
    conversationId: input.orderNo,
    price: money(input.total),
    paidPrice: money(input.total),
    currency: 'TRY',
    basketId: input.orderNo,
    paymentGroup: 'PRODUCT',
    callbackUrl: input.callbackUrl,
    enabledInstallments: [1, 2, 3, 6, 9],
    buyer: {
      id: input.buyer.id.slice(0, 50),
      name: name.slice(0, 50),
      surname: surname.slice(0, 50),
      gsmNumber: toIyzicoGsm(input.buyer.phone),
      email: input.buyer.email,
      identityNumber,
      registrationAddress: addr(input.billing).address,
      ip: input.ip || '85.34.78.112',
      city: input.billing.city.slice(0, 50),
      country: input.billing.country || 'Türkiye',
      ...(input.buyer.registeredAt ? { registrationDate: fmtDate(input.buyer.registeredAt) } : {}),
      lastLoginDate: fmtDate(new Date()),
    },
    shippingAddress: addr(input.shipping),
    billingAddress: addr(input.billing),
    basketItems: buildBasketItems(input.lines, input.total),
  }
}

type IyzicoBase = { status: 'success' | 'failure'; errorCode?: string; errorMessage?: string }

/** Ödeme formunu başlatır; müşteri paymentPageUrl adresine yönlendirilir. */
export async function initializeCheckoutForm(input: IyzicoCheckoutInput, config: IyzicoConfig = getIyzicoConfig()!): Promise<{ token: string; paymentPageUrl: string }> {
  const res = await iyzicoPost<IyzicoBase & { token?: string; paymentPageUrl?: string }>(
    config,
    '/payment/iyzipos/checkoutform/initialize/auth/ecom',
    buildCheckoutFormRequest(input)
  )
  if (res.status !== 'success' || !res.token || !res.paymentPageUrl) {
    throw new Error(`iyzico ödeme formu açılamadı: ${res.errorCode ?? ''} ${res.errorMessage ?? ''}`.trim())
  }
  return { token: res.token, paymentPageUrl: res.paymentPageUrl }
}

export type IyzicoResult =
  | { valid: false; reason: string }
  | {
      valid: true
      orderNo: string
      approved: boolean
      /** Ödeme alındı ama iyzico dolandırıcılık incelemesinde (fraudStatus 0): sipariş beklemede kalır, yönetici kontrol eder */
      underReview: boolean
      amount: number
      /** Müşterinin ödediği tutar (taksit vade farkı dahil olabilir); kayıt için */
      paidPrice: number | null
      currency: string
      paymentId: string | null
      errorMessage: string | null
      /** 3D doğrulaması tamamlanmadıysa true (müşteriye ayrı mesaj) */
      threeDFailed: boolean
    }

type DetailResponse = IyzicoBase & {
  paymentStatus?: 'SUCCESS' | 'FAILURE' | 'INIT_THREEDS' | 'CALLBACK_THREEDS' | 'BKM_POS_SELECTED' | 'CALLBACK_PECCO'
  fraudStatus?: number
  basketId?: string
  conversationId?: string
  price?: number | string
  paidPrice?: number | string
  currency?: string
  paymentId?: string
  mdStatus?: number
}

/** Callback'te gelen token için sonucu iyzico'dan sorgular (tarayıcıdan gelen başka hiçbir alana güvenilmez). */
export async function retrieveCheckoutForm(token: string, config: IyzicoConfig | null = getIyzicoConfig()): Promise<IyzicoResult> {
  if (!config) return { valid: false, reason: 'iyzico yapılandırılmamış' }
  if (!/^[A-Za-z0-9-]{10,100}$/.test(token)) return { valid: false, reason: 'Token geçersiz' }
  const res = await iyzicoPost<DetailResponse>(config, '/payment/iyzipos/checkoutform/auth/ecom/detail', { locale: 'tr', token })
  const orderNo = res.basketId || res.conversationId
  if (!orderNo) return { valid: false, reason: `iyzico sonucu sipariş içermiyor (${res.errorCode ?? res.status})` }
  // fraudStatus: 1 = onaylı, 0 = incelemede, -1 = reddedildi; yalnızca 1 kabul edilir
  const paid = res.status === 'success' && res.paymentStatus === 'SUCCESS'
  const approved = paid && res.fraudStatus === 1
  // Kart çekildi, iyzico inceliyor: iptal edilmez (müşteri ücretlendirildi), yönetici iyzico panelinden onaylar
  const underReview = paid && res.fraudStatus === 0
  // Sipariş tutarıyla karşılaştırılan: sepet tutarı (price). paidPrice taksit vade farkını içerebilir, yalnız kaydedilir
  const amount = Number(res.price ?? res.paidPrice)
  const paidPrice = Number(res.paidPrice)
  return {
    valid: true,
    orderNo,
    approved,
    underReview,
    amount: Number.isFinite(amount) ? amount : NaN,
    paidPrice: Number.isFinite(paidPrice) ? paidPrice : null,
    currency: res.currency || 'TRY',
    paymentId: res.paymentId || null,
    threeDFailed: !approved && typeof res.mdStatus === 'number' && res.mdStatus !== 1,
    errorMessage: approved ? null : res.errorMessage || (res.fraudStatus === 0 ? 'Ödeme incelemede.' : 'Ödeme onaylanmadı.'),
  }
}
