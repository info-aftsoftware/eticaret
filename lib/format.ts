/**
 * Sayısal değerleri formatlama helper fonksiyonları
 */

/**
 * Voltaj formatı: "14.8 V"
 */
export function fmtV(voltage: number | undefined | null): string {
  if (voltage === undefined || voltage === null) return '-'
  const num = Number(voltage)
  if (isNaN(num) || !isFinite(num)) return '-'
  return `${num.toFixed(1)} V`
}

/**
 * Akım formatı: "20 A"
 */
export function fmtA(current: number | undefined | null): string {
  if (current === undefined || current === null) return '-'
  const num = Number(current)
  if (isNaN(num) || !isFinite(num)) return '-'
  return `${num.toFixed(1)} A`
}

/**
 * Kapasite formatı: "16 Ah"
 */
export function fmtAh(capacity: number | undefined | null): string {
  if (capacity === undefined || capacity === null) return '-'
  const num = Number(capacity)
  if (isNaN(num) || !isFinite(num)) return '-'
  return `${num.toFixed(1)} Ah`
}

/**
 * Enerji formatı: "237 Wh"
 */
export function fmtWh(energy: number | undefined | null): string {
  if (energy === undefined || energy === null) return '-'
  const num = Number(energy)
  if (isNaN(num) || !isFinite(num)) return '-'
  return `${Math.round(num)} Wh`
}

/**
 * Ağırlık formatı: "4 350 g" (binlik ayırıcı ile)
 */
export function fmtG(weight: number | undefined | null): string {
  if (weight === undefined || weight === null) return '-'
  const num = Number(weight)
  if (isNaN(num) || !isFinite(num)) return '-'
  return `${Math.round(num).toLocaleString('tr-TR')} g`
}

/**
 * Boyut formatı: "L×W×H mm"
 */
export function fmtMM(dimensions: { L: number; W: number; H: number } | undefined | null): string {
  if (!dimensions || typeof dimensions !== 'object') return '-'
  const L = Number(dimensions.L)
  const W = Number(dimensions.W)
  const H = Number(dimensions.H)
  if (isNaN(L) || isNaN(W) || isNaN(H) || !isFinite(L) || !isFinite(W) || !isFinite(H)) return '-'
  return `${Math.round(L)}×${Math.round(W)}×${Math.round(H)} mm`
}

/**
 * Para formatı: "₺12.345,00" (Türk Lirası)
 */
export function fmtTRY(amount: number | undefined | null): string {
  if (amount === undefined || amount === null) return '-'
  const num = Number(amount)
  if (isNaN(num) || !isFinite(num)) return '-'
  return new Intl.NumberFormat('tr-TR', {
    style: 'currency',
    currency: 'TRY',
    minimumFractionDigits: 2,
    maximumFractionDigits: 2
  }).format(num)
}

export type CurrencyCode = 'TRY' | 'USD' | 'EUR'

/** 1 TRY = rates[code] (örn. rates.USD = 0.028) */
export type RatesMap = { TRY: number; USD: number; EUR: number }

/**
 * TRY cinsinden tutarı seçilen para birimine çevirir ve formatlar.
 * rates: 1 TRY = rates.USD USD, 1 TRY = rates.EUR EUR
 * locale 'en': İngilizce sayı biçimi (₺76,381.00); verilmezse Türkçe (₺76.381,00)
 */
export function fmtPrice(
  amountTRY: number | undefined | null,
  currency: CurrencyCode,
  rates: RatesMap | null,
  locale?: string
): string {
  if (amountTRY === undefined || amountTRY === null) return '-'
  const num = Number(amountTRY)
  if (isNaN(num) || !isFinite(num)) return '-'
  const en = locale === 'en'
  if (currency === 'TRY' || !rates) {
    return new Intl.NumberFormat(en ? 'en-US' : 'tr-TR', {
      style: 'currency',
      currency: 'TRY',
      currencyDisplay: 'narrowSymbol',
      minimumFractionDigits: 2,
      maximumFractionDigits: 2
    }).format(num)
  }
  const converted = num * (rates[currency] || 0)
  return new Intl.NumberFormat(en ? 'en-US' : currency === 'EUR' ? 'de-DE' : 'en-US', {
    style: 'currency',
    currency,
    minimumFractionDigits: 2,
    maximumFractionDigits: 2
  }).format(converted)
}

