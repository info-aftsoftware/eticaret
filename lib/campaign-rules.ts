/**
 * Kampanya ve kupon için ortak kurallar (A13, A14): indirim değeri, tarih aralığı ve geçerlilik durumu.
 * Panel formu, sunucu uçları ve mağaza fiyatlandırması aynı kuralı kullanır. Saf modül (birim testli).
 *
 * İş kuralı: yüzde indirim 0'dan büyük, en fazla %99 (tam %100, yani ücretsiz ürün/sipariş kabul edilmez;
 * fiyatlandırma da ürünü en az %1'de tutar). Sabit tutar 0'dan büyük olmalı; sepet/ürün tutarını aşan indirim
 * toplamı negatife indirmez (kupon ara toplamla, kampanya fiyatın %1'iyle sınırlıdır).
 */

export const PERCENT_MAX = 99
export const FIXED_MAX = 1_000_000

export type DiscountType = 'PERCENT' | 'FIXED'

/** İndirim değeri geçerli mi; değilse Türkçe hata */
export function discountValueError(type: unknown, value: unknown): string | null {
  if (type !== 'PERCENT' && type !== 'FIXED') return 'İndirim türü yüzde veya sabit tutar olmalı.'
  const n = Number(value)
  if (value === '' || value === null || value === undefined || !Number.isFinite(n) || n <= 0) return 'İndirim değeri sıfırdan büyük olmalı.'
  if (type === 'PERCENT' && n > PERCENT_MAX) return `Yüzde indirim en fazla %${PERCENT_MAX} olabilir (tam %100 kabul edilmez).`
  if (type === 'FIXED' && n > FIXED_MAX) return 'Sabit indirim çok yüksek.'
  return null
}

/** Başlangıç bitişten sonra mı (ikisi de varsa) */
export function dateRangeError(start: Date | null, end: Date | null): string | null {
  if ((start && isNaN(start.getTime())) || (end && isNaN(end.getTime()))) return 'Tarih geçersiz.'
  if (start && end && end < start) return 'Bitiş tarihi başlangıçtan önce olamaz.'
  return null
}

export type CampaignStatus = 'off' | 'planned' | 'running' | 'expired'

export const CAMPAIGN_STATUS_TR: Record<CampaignStatus, string> = {
  off: 'Kapalı',
  planned: 'Planlandı',
  running: 'Devam ediyor',
  expired: 'Süresi doldu',
}

/**
 * Kampanyanın şu anki durumu: açık/kapalı ayarı ile tarih geçerliliği birlikte.
 * Mağaza fiyatlandırması da aynı kuralla seçer (lib/discounts getActiveCampaigns: açık ve başlangıç ≤ şimdi ≤ bitiş).
 */
export function campaignStatus(c: { active: boolean; startDate?: Date | string | null; endDate?: Date | string | null }, now: Date = new Date()): CampaignStatus {
  if (!c.active) return 'off'
  const t = now.getTime()
  if (c.startDate && new Date(c.startDate).getTime() > t) return 'planned'
  if (c.endDate && new Date(c.endDate).getTime() < t) return 'expired'
  return 'running'
}
