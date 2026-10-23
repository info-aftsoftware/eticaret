/**
 * Ürün grupları: tek tek seçilen ürünler + marka + kategori. Üyelik dinamiktir (seçilen marka/kategoriye sonradan
 * eklenen ürün de gruba girer). Grup kampanya kapsamı olabilir, satışa kapatılabilir ve toplu fiyat değişikliği alabilir.
 * Bu dosyadaki hesaplar saf (birim testli); veritabanı erişimi lib/product-groups-db.ts'de.
 */

export type GroupRules = { productIds?: string[] | null; brands?: string[] | null; categories?: string[] | null }
export type GroupProduct = { id: string; name: string; brand?: string | null; category?: string | null }

const list = (v: unknown): string[] => (Array.isArray(v) ? v.map(String).map((s) => s.trim()).filter(Boolean) : [])

/** Kayıttaki JSON alanlarını kurallara çevirir */
export function groupRules(g: { productIds?: unknown; brands?: unknown; categories?: unknown }): { productIds: string[]; brands: string[]; categories: string[] } {
  return { productIds: list(g.productIds), brands: list(g.brands), categories: list(g.categories) }
}

/** Ürün gruba dahil mi: id listede veya markası/kategorisi seçili */
export function isGroupMember(rules: GroupRules, p: GroupProduct): boolean {
  if (rules.productIds?.includes(p.id)) return true
  if (p.brand && rules.brands?.includes(p.brand)) return true
  if (p.category && rules.categories?.includes(p.category)) return true
  return false
}

export function groupMembers<T extends GroupProduct>(rules: GroupRules, products: T[]): T[] {
  return products.filter((p) => isGroupMember(rules, p))
}

/** Grubun en az bir kuralı olmalı (boş grup her şeyi kapsamaz, hiçbir şeyi kapsar; yanlışlıkla kaydedilmesin) */
export function groupRulesError(name: unknown, rules: GroupRules): string | null {
  if (typeof name !== 'string' || !name.trim()) return 'Grup adı gerekli.'
  if (name.trim().length > 120) return 'Grup adı en fazla 120 karakter.'
  if (!rules.productIds?.length && !rules.brands?.length && !rules.categories?.length) return 'En az bir ürün, marka veya kategori seçin.'
  if ((rules.productIds?.length ?? 0) > 2000) return 'En fazla 2000 ürün seçilebilir.'
  return null
}

// ── Toplu fiyat değişikliği (zam) ──────────────────────────────────────

export const PRICE_CHANGE_MIN = -90
export const PRICE_CHANGE_MAX = 500

export function priceChangeError(percent: unknown): string | null {
  const n = Number(percent)
  if (percent === '' || percent === null || percent === undefined || !Number.isFinite(n) || n === 0) return 'Değişim yüzdesi gerekli (0 olamaz).'
  if (n < PRICE_CHANGE_MIN || n > PRICE_CHANGE_MAX) return `Değişim %${PRICE_CHANGE_MIN} ile %${PRICE_CHANGE_MAX} arasında olmalı.`
  return null
}

type PricedVariant = { key: string; label?: string; price: number; basePrice?: number }
export type PricedProduct = GroupProduct & {
  price: number
  basePrice?: number
  priceCurrency?: string
  priceMode?: 'fx' | 'fixed'
  saleMode?: string
  variants?: PricedVariant[]
}

export type PriceChangeRow = {
  id: string
  name: string
  /** fx: döviz fiyatı değişir (TL kurla); fixed: TL fiyatı değişir */
  mode: 'fx' | 'fixed'
  currency: string
  from: number
  to: number
  variants: { key: string; label: string; from: number; to: number }[]
  skipped?: 'quote' | 'no-price'
}

/** Döviz fiyatı kuruşa, TL fiyatı tam TL'ye yuvarlanır (katalog TL fiyatları tam TL) */
const roundFor = (mode: 'fx' | 'fixed', n: number) => (mode === 'fx' ? Math.round(n * 100) / 100 : Math.max(1, Math.round(n)))

/** Gruptaki ürünlere yüzde değişim planı: dövize bağlıda döviz fiyatı, sabit TL'de TL fiyatı değişir */
export function planPriceChange(products: PricedProduct[], percent: number): { rows: PriceChangeRow[]; changed: number; skipped: number } {
  const k = 1 + percent / 100
  const rows = products.map((p): PriceChangeRow => {
    const fx = p.priceMode === 'fx' && typeof p.basePrice === 'number' && !!p.priceCurrency && p.priceCurrency !== 'TRY'
    const mode: 'fx' | 'fixed' = fx ? 'fx' : 'fixed'
    const currency = fx ? String(p.priceCurrency) : 'TL'
    const from = fx ? (p.basePrice as number) : p.price
    if (p.saleMode === 'quote') return { id: p.id, name: p.name, mode, currency, from, to: from, variants: [], skipped: 'quote' }
    if (!(from > 0)) return { id: p.id, name: p.name, mode, currency, from, to: from, variants: [], skipped: 'no-price' }
    const variants = (p.variants ?? []).map((v) => {
      const vFrom = fx ? (typeof v.basePrice === 'number' ? v.basePrice : 0) : v.price
      return { key: v.key, label: v.label ?? v.key, from: vFrom, to: vFrom > 0 ? roundFor(mode, vFrom * k) : vFrom }
    })
    return { id: p.id, name: p.name, mode, currency, from, to: roundFor(mode, from * k), variants }
  })
  return { rows, changed: rows.filter((r) => !r.skipped).length, skipped: rows.filter((r) => r.skipped).length }
}
