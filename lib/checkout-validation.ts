/**
 * Telefon, e-posta ve fatura doğrulamaları: sitedeki bütün formlar (ödeme, iletişim, GES teklifi, kayıt, profil, adres,
 * stok uyarısı, soru) ve ilgili API'ler aynı kuralları kullanır.
 */

export const onlyDigits = (value: string) => value.replace(/\D/g, '')

/** Türkiye telefon numarası → 10 hane (başındaki +90 / 90 / 0 atılır). */
export function normalizeTrPhone(value: unknown): string {
  if (typeof value !== 'string') return ''
  let d = onlyDigits(value)
  if (d.length > 10 && d.startsWith('90')) d = d.slice(2)
  if (d.length > 10 && d.startsWith('0')) d = d.slice(1)
  if (d.length === 11 && d.startsWith('0')) d = d.slice(1)
  return d
}

/** 5xx xxx xx xx biçimi (yazarken kademeli). */
export function formatTrPhone(value: string): string {
  let d = onlyDigits(value)
  if (d.startsWith('90') && d.length > 10) d = d.slice(2)
  if (d.startsWith('0')) d = d.slice(1)
  d = d.slice(0, 10)
  return [d.slice(0, 3), d.slice(3, 6), d.slice(6, 8), d.slice(8, 10)].filter(Boolean).join(' ')
}

/**
 * Türkiye telefonu: başında 0 ile 11 hane (0 5xx xxx xx xx), 0'sız 10 hane ya da +90 ile; cep (5xx) veya sabit hat
 * (2xx, 3xx, 4xx). Fazla ya da eksik hane, harf veya başka ülke kodu geçersiz.
 */
export function isValidTrPhone(value: unknown): boolean {
  if (typeof value !== 'string') return false
  const raw = value.trim()
  if (!/^\+?[\d\s().-]+$/.test(raw)) return false
  const digits = onlyDigits(raw)
  const ok =
    (digits.length === 10 && !digits.startsWith('0')) ||
    (digits.length === 11 && digits.startsWith('0')) ||
    (digits.length === 12 && digits.startsWith('90'))
  return ok && /^[2-5]\d{9}$/.test(normalizeTrPhone(raw))
}

export const PHONE_ERROR_TR = 'Geçerli bir telefon numarası girin (11 hane, örn. 0532 123 45 67).'
export const PHONE_ERROR_EN = 'Enter a valid phone number (11 digits, e.g. 0532 123 45 67).'

/** T.C. kimlik numarası algoritma kontrolü (11 hane, ilk hane 0 değil, 10. ve 11. hane sağlaması). */
export function isValidTckn(value: unknown): boolean {
  if (typeof value !== 'string' || !/^[1-9]\d{10}$/.test(value)) return false
  const d = value.split('').map(Number)
  const odd = d[0] + d[2] + d[4] + d[6] + d[8]
  const even = d[1] + d[3] + d[5] + d[7]
  const d10 = (((odd * 7 - even) % 10) + 10) % 10
  if (d10 !== d[9]) return false
  const d11 = d.slice(0, 10).reduce((a, b) => a + b, 0) % 10
  return d11 === d[10]
}

/** Vergi kimlik numarası: 10 hane. */
export function isValidVkn(value: unknown): boolean {
  return typeof value === 'string' && /^\d{10}$/.test(value)
}

export function isValidPostalCode(value: unknown): boolean {
  return typeof value === 'string' && /^(0[1-9]|[1-7]\d|8[01])\d{3}$/.test(value)
}

/**
 * E-posta: ad@alan.uzantı. Ad kısmında harf, rakam ve . _ % + - (başta/sonda ya da art arda nokta yok);
 * alan adında harf, rakam ve tire; uzantı en az 2 harf. Toplam en fazla 254 karakter.
 */
export const EMAIL_RE =
  /^(?=.{6,254}$)(?!\.)(?!.*\.\.)[A-Za-z0-9._%+-]+(?<!\.)@(?:[A-Za-z0-9](?:[A-Za-z0-9-]{0,61}[A-Za-z0-9])?\.)+[A-Za-z]{2,24}$/

export function isValidEmail(value: unknown): boolean {
  return typeof value === 'string' && EMAIL_RE.test(value.trim())
}

export const EMAIL_ERROR_TR = 'Geçerli bir e-posta adresi girin (örn. ad@ornek.com).'
export const EMAIL_ERROR_EN = 'Enter a valid email address (e.g. name@example.com).'

export type BillingInput = {
  billingType: 'individual' | 'company'
  idNumber?: string
  companyName?: string
  taxId?: string
  taxOffice?: string
}

/** Fatura bilgisi hataları (alan adı → mesaj). Bireyselde TCKN isteğe bağlıdır, girilirse doğrulanır. */
export function validateBilling(b: BillingInput): Record<string, string> {
  const err: Record<string, string> = {}
  if (b.billingType === 'company') {
    if (!b.companyName?.trim()) err.companyName = 'Firma ünvanı zorunludur.'
    if (!b.taxId?.trim()) err.taxId = 'Vergi numarası zorunludur.'
    else if (!isValidVkn(b.taxId.trim())) err.taxId = 'Vergi numarası 10 haneli olmalıdır.'
    if (!b.taxOffice?.trim()) err.taxOffice = 'Vergi dairesi zorunludur.'
  } else if (b.idNumber?.trim() && !isValidTckn(b.idNumber.trim())) {
    err.idNumber = 'Geçerli bir T.C. kimlik numarası girin.'
  }
  return err
}

/**
 * x-forwarded-for başlığından ilk (istemci) IP'yi güvenle çıkarır; geçersizse x-real-ip, o da yoksa null.
 */
export function clientIpFromHeaders(headers: { get(name: string): string | null }): string | null {
  const pick = (raw: string | null | undefined) => {
    if (!raw) return null
    let ip = raw.trim().slice(0, 64)
    if (!ip) return null
    // [IPv6]:port ve IPv4:port biçimleri
    const bracket = /^\[([0-9a-fA-F:.]+)\](?::\d+)?$/.exec(ip)
    if (bracket) ip = bracket[1]
    else if (/^\d{1,3}(\.\d{1,3}){3}:\d+$/.test(ip)) ip = ip.split(':')[0]
    if (ip.toLowerCase().startsWith('::ffff:') && /\d+\.\d+\.\d+\.\d+$/.test(ip)) ip = ip.slice(7)
    const v4 = /^(25[0-5]|2[0-4]\d|1?\d?\d)(\.(25[0-5]|2[0-4]\d|1?\d?\d)){3}$/.test(ip)
    const v6 = !v4 && /^[0-9a-fA-F:]+$/.test(ip) && ip.includes(':') && ip.length <= 45
    return v4 || v6 ? ip : null
  }
  const xff = headers.get('x-forwarded-for')
  const first = xff ? pick(xff.split(',')[0]) : null
  return first ?? pick(headers.get('x-real-ip'))
}
