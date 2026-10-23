/**
 * Panelde ürün oluşturma/düzenlemede para birimi ve maliyet (A06), lojistik (A07) ve yayın durumu (A08) alanlarının
 * doğrulaması. Yeni ürün (POST /api/admin/catalog) ve düzenleme (PATCH /api/admin/catalog/[id]) aynı kuralları kullanır.
 */

import { packageDesi } from '@/lib/shipping/fee'

type Body = Record<string, unknown>
type Result = { data: Record<string, unknown>; audit: string[] } | { error: string }

const CURRENCIES = ['TRY', 'USD', 'EUR'] as const
const SALE_MODES = ['normal', 'install', 'quote'] as const
const SALE_MODE_TR = { normal: 'Kargo ile gönderilir', install: 'Kurulum ve nakliye ayrıca', quote: 'Teklifle satılır' } as const

const positive = (v: unknown) => {
  const n = Number(v)
  return Number.isFinite(n) && n > 0 ? n : null
}

/** Maliyet alanları (yalnız maliyet yetkisi olan role sorulur; diğer roller gönderse de yok sayılır) */
export function sanitizeCost(body: Body, allowed: boolean): Result {
  const data: Record<string, unknown> = {}
  if (!allowed) return { data, audit: [] }
  if (body.costPrice !== undefined) {
    if (body.costPrice === null || body.costPrice === '') data.costPrice = null
    else {
      const n = positive(body.costPrice)
      if (n === null) return { error: 'Alış maliyeti geçersiz' }
      data.costPrice = Math.round(n * 10000) / 10000
    }
  }
  if (body.costCurrency !== undefined) {
    if (body.costCurrency !== null && !(CURRENCIES as readonly unknown[]).includes(body.costCurrency)) return { error: 'Maliyet para birimi geçersiz' }
    data.costCurrency = body.costCurrency
  }
  if (body.targetMargin !== undefined) {
    if (body.targetMargin === null || body.targetMargin === '') data.targetMargin = null
    else {
      const n = Number(body.targetMargin)
      if (!Number.isFinite(n) || n < 0 || n >= 100) return { error: 'Hedef kâr marjı 0 ile 100 arasında olmalı (%)' }
      data.targetMargin = n
    }
  }
  // Tutarın kendisi işlem kaydına yazılmaz (maliyet gizliliği)
  return { data, audit: Object.keys(data).length ? ['Maliyet bilgisi güncellendi'] : [] }
}

/**
 * Lojistik: koli ölçüsü, koli ağırlığı, koli sayısı ve satış biçimi. Desi her kayıtta yeniden hesaplanır;
 * gönderilmeyen alanlar mevcut değerden alınır (current).
 */
export function sanitizeLogistics(
  body: Body,
  current: { dimensionsCm?: number[] | null; weightKg?: number | null; packageCount?: number | null; saleMode?: string | null; desi?: number | null }
): Result {
  const data: Record<string, unknown> = {}
  const audit: string[] = []
  let dims = current.dimensionsCm ?? null
  let kg = current.weightKg ?? null
  let count = current.packageCount ?? 1
  let touched = false
  if (body.dimensionsCm !== undefined) {
    if (body.dimensionsCm === null) dims = null
    else {
      const arr = Array.isArray(body.dimensionsCm) ? body.dimensionsCm.map(positive) : []
      if (arr.length !== 3 || arr.some((n) => n === null || n > 1000)) return { error: 'Koli ölçüsü üç pozitif sayı olmalı (cm, en fazla 1000)' }
      dims = arr as number[]
    }
    data.dimensionsCm = dims
    touched = true
  }
  if (body.weightKg !== undefined) {
    if (body.weightKg === null || body.weightKg === '') kg = null
    else {
      const n = positive(body.weightKg)
      if (n === null || n > 5000) return { error: 'Koli ağırlığı geçersiz (kg)' }
      kg = Math.round(n * 1000) / 1000
    }
    data.weightKg = kg
    touched = true
  }
  if (body.packageCount !== undefined) {
    const n = Number(body.packageCount)
    if (!Number.isInteger(n) || n < 1 || n > 50) return { error: 'Koli sayısı 1 ile 50 arasında tam sayı olmalı' }
    count = n
    data.packageCount = n
    touched = true
  }
  if (touched) {
    const desi = dims || kg ? packageDesi(dims, kg, count) : null
    data.desi = desi
    if (desi !== (current.desi ?? null)) audit.push(`Desi: ${current.desi ?? '—'} → ${desi ?? '—'}`)
  }
  if (body.saleMode !== undefined) {
    if (!(SALE_MODES as readonly unknown[]).includes(body.saleMode)) return { error: 'Satış biçimi geçersiz' }
    data.saleMode = body.saleMode
    const before = (current.saleMode ?? 'normal') as keyof typeof SALE_MODE_TR
    if (before !== body.saleMode) audit.push(`Satış biçimi: ${SALE_MODE_TR[before] ?? before} → ${SALE_MODE_TR[body.saleMode as keyof typeof SALE_MODE_TR]}`)
  }
  return { data, audit }
}

/** Panelde eklenen ürünün para birimi (A06); yalnız yeni üründe seçilir */
export function sanitizeNewProductCurrency(body: Body): { priceCurrency: 'TRY' | 'USD' | 'EUR'; basePrice: number | null } | { error: string } {
  const c = body.priceCurrency ?? 'TRY'
  if (!(CURRENCIES as readonly unknown[]).includes(c)) return { error: 'Para birimi geçersiz' }
  if (c === 'TRY') return { priceCurrency: 'TRY', basePrice: null }
  const n = positive(body.basePrice)
  if (n === null) return { error: `${c} fiyatı gerekli ve 0'dan büyük olmalı` }
  return { priceCurrency: c as 'USD' | 'EUR', basePrice: Math.round(n * 10000) / 10000 }
}
