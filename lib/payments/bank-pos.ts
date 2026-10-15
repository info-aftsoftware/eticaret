/**
 * Banka sanal POS — NestPay (Payten / EST) 3D Pay Hosting.
 * Ziraat Bankası, Türkiye Finans, Halkbank, İşbank, Akbank ve birçok banka bu altyapıyı kullanır.
 *
 * Akış: sipariş oluşur → tarayıcı imzalı formla bankanın 3D ödeme sayfasına gönderilir
 * (kart bilgisi sitemize hiç gelmez) → banka sonucu okUrl/failUrl'e POST eder →
 * /api/payments/pos/callback imzayı (hash ver3) ve tutarı doğrular, siparişi işler.
 *
 * Ortam değişkenleri (bankanın verdiği bilgiler, panelde ayarlanır):
 *   POS_CLIENT_ID    — mağaza numarası (Client ID / Merchant ID)
 *   POS_STORE_KEY    — 3D anahtarı (Store Key) — gizli
 *   POS_GATEWAY_URL  — bankanın 3D ödeme adresi (…/fim/est3Dgate); test için entegrasyon adresi
 *   POS_BANK_NAME    — müşteriye gösterilecek banka adı (ör. "Ziraat Bankası")
 */

import crypto from 'node:crypto'

export const POS_CURRENCY_TRY = '949'

export type BankPosConfig = { clientId: string; storeKey: string; gatewayUrl: string; bankName: string }

export function getBankPosConfig(): BankPosConfig | null {
  const clientId = process.env.POS_CLIENT_ID?.trim()
  const storeKey = process.env.POS_STORE_KEY?.trim()
  const gatewayUrl = process.env.POS_GATEWAY_URL?.trim()
  if (!clientId || !storeKey || !gatewayUrl || !/^https:\/\//.test(gatewayUrl)) return null
  return { clientId, storeKey, gatewayUrl, bankName: process.env.POS_BANK_NAME?.trim() || 'Banka' }
}

export const isBankPosConfigured = () => getBankPosConfig() !== null

const escapeValue = (v: string) => v.replace(/\\/g, '\\\\').replace(/\|/g, '\\|')

/** PHP strnatcasecmp karşılığı (bankanın örnek kodu alan adlarını natcasesort ile sıralar) */
function natCaseCompare(a: string, b: string): number {
  const re = /(\d+|\D+)/g
  const ax = a.toLowerCase().match(re) ?? []
  const bx = b.toLowerCase().match(re) ?? []
  for (let i = 0; i < Math.min(ax.length, bx.length); i++) {
    const x = ax[i]
    const y = bx[i]
    if (/^\d/.test(x) && /^\d/.test(y)) {
      const d = Number(x) - Number(y)
      if (d !== 0) return d
    } else if (x !== y) {
      return x < y ? -1 : 1
    }
  }
  return ax.length - bx.length
}

/**
 * NestPay hash ver3: "hash" ve "encoding" dışındaki tüm alanlar ada göre (büyük/küçük harf duyarsız) sıralanır,
 * değerler kaçışlanıp "|" ile birleştirilir, sonuna store key eklenir; SHA-512 → Base64.
 */
export function nestpayHashV3(params: Record<string, string>, storeKey: string): string {
  const keys = Object.keys(params)
    .filter((k) => !['hash', 'encoding'].includes(k.toLowerCase()))
    .sort(natCaseCompare)
  const plain = keys.map((k) => escapeValue(params[k] ?? '')).join('|') + '|' + escapeValue(storeKey)
  return crypto.createHash('sha512').update(plain, 'utf8').digest('base64')
}

export type PosFormInput = {
  orderNo: string
  amount: number
  callbackUrl: string
  customer: { name: string; email: string; phone?: string }
  /** 0/1 = peşin; 2+ taksit sayısı (bankanın tanımladığı taksitler) */
  installment?: number
}

export type PosForm = { action: string; fields: Record<string, string> }

/** Tarayıcının bankaya POST edeceği imzalı form alanları */
export function buildPosForm(input: PosFormInput, config: BankPosConfig = getBankPosConfig()!): PosForm {
  const fields: Record<string, string> = {
    clientid: config.clientId,
    storetype: '3D_PAY_HOSTING',
    hashAlgorithm: 'ver3',
    TranType: 'Auth',
    amount: input.amount.toFixed(2),
    currency: POS_CURRENCY_TRY,
    oid: input.orderNo,
    okUrl: input.callbackUrl,
    failUrl: input.callbackUrl,
    lang: 'tr',
    rnd: crypto.randomBytes(16).toString('hex'),
    Instalment: input.installment && input.installment > 1 ? String(input.installment) : '',
    BillToName: input.customer.name.slice(0, 60),
    email: input.customer.email.slice(0, 64),
    tel: (input.customer.phone ?? '').replace(/[^\d+]/g, '').slice(0, 32),
    // Sonuç ekranında bekleme yok: müşteri sekmeyi kapatmadan siteye döner (dönüş gelmezse ödeme kaybolmasın)
    refreshtime: '0',
    encoding: 'utf-8',
  }
  fields.hash = nestpayHashV3(fields, config.storeKey)
  return { action: config.gatewayUrl, fields }
}

export type PosCallbackResult =
  | { valid: false; reason: string }
  | {
      valid: true
      orderNo: string
      approved: boolean
      amount: number
      currency: 'TRY' | string
      /** Bankanın işlem / provizyon numaraları (kayıt için) */
      transId: string | null
      authCode: string | null
      /** Müşteriye gösterilecek hata (onaylanmadıysa) */
      errorMessage: string | null
    }

/** Bankanın okUrl/failUrl'e gönderdiği alanları doğrular (imza + 3D durumu + onay kodu). */
export function verifyPosCallback(params: Record<string, string>, config: BankPosConfig | null = getBankPosConfig()): PosCallbackResult {
  if (!config) return { valid: false, reason: 'POS yapılandırılmamış' }
  const received = params.HASH ?? params.hash
  if (!received) return { valid: false, reason: 'İmza yok' }
  if (params.clientid && params.clientid !== config.clientId) return { valid: false, reason: 'Mağaza numarası uyuşmuyor' }

  const expected = nestpayHashV3(params, config.storeKey)
  const a = Buffer.from(expected)
  const b = Buffer.from(received)
  if (a.length !== b.length || !crypto.timingSafeEqual(a, b)) return { valid: false, reason: 'İmza geçersiz' }

  const orderNo = params.oid || params.ReturnOid
  if (!orderNo) return { valid: false, reason: 'Sipariş numarası yok' }

  // 3D doğrulama: yalnızca 1 = tam doğrulama (sorumluluk bankada). 2-4 "yarım güvenli"dir (kart 3D'ye kayıtlı değil);
  // ters ibrazda sorumluluk satıcıda kalır — yalnızca POS_ALLOW_HALF_SECURE=true ile kabul edilir.
  const md = params.mdStatus ?? ''
  const threeDOk = md === '1' || (process.env.POS_ALLOW_HALF_SECURE === 'true' && ['2', '3', '4'].includes(md))
  const approved = threeDOk && params.Response === 'Approved' && params.ProcReturnCode === '00'

  const amount = Number(String(params.amount ?? '').replace(',', '.'))
  return {
    valid: true,
    orderNo,
    approved,
    amount: Number.isFinite(amount) ? amount : NaN,
    currency: params.currency === POS_CURRENCY_TRY || !params.currency ? 'TRY' : params.currency,
    transId: params.TransId || null,
    authCode: params.AuthCode || null,
    errorMessage: approved
      ? null
      : !threeDOk
        ? '3D Secure doğrulaması tamamlanmadı.'
        : params.ErrMsg || params.mdErrorMsg || 'Ödeme banka tarafından onaylanmadı.',
  }
}
