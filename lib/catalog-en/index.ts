/**
 * Katalog verisinin İngilizce katmanı (istemci + sunucu). Türkçe katalog kanoniktir: id/URL, filtre anahtarları,
 * sipariş kalemleri ve yasal belgeler Türkçe kalır; İngilizce yalnızca gösterimde uygulanır.
 *
 * - lib/catalog/en/products.json: ürün adı, kısa açıklama, varyant adları (scripts/catalog-en.ts ile bakılır)
 * - lib/catalog/en/specs.json: teknik özellik başlıkları ve sözcük içeren değerler (TR → EN sözlüğü)
 * - HTML açıklamalar: lib/catalog-en/descriptions.server.ts (yalnızca sunucu, büyük çeviri belleği)
 *
 * Panelde (ProductOverride) değiştirilmiş metin katalogdaki Türkçeyle eşleşmediği için çevrilmez, Türkçe gösterilir;
 * çevrilmeyen metin `lang="tr"` ile işaretlenir (bkz. textLang).
 */

import enProductsJson from '@/lib/catalog/en/products.json'
import enSpecsJson from '@/lib/catalog/en/specs.json'
import catalog from '@/lib/catalog/products.json'

export type CatalogLocale = 'tr' | 'en'

type EnProduct = { name: string; description?: string; variants?: Record<string, string> }
type SourceProduct = { id: string; name: string; description?: string; variants?: { key: string; label: string }[] }

const enProducts = enProductsJson as Record<string, EnProduct>
const enSpecs = enSpecsJson as { keys: Record<string, string>; values: Record<string, string> }
const sourceById = new Map((catalog as SourceProduct[]).map((p) => [p.id, p]))

export const toCatalogLocale = (locale: string | undefined | null): CatalogLocale => (locale === 'en' ? 'en' : 'tr')

/**
 * Türkçe sayı biçimini İngilizceye çevirir: ondalık virgül → nokta, binlik nokta → virgül, %23 → 23%.
 * Yalnızca rakamlar arasındaki ayırıcılara dokunur ("IEC 61215, IEC 61730" gibi listeler değişmez).
 */
export function enNumbers(text: string): string {
  return text
    .replace(/\d+(?:[.,]\d+)+/g, (num) => {
      // Binlik ayırıcı nokta: ardından tam 3 rakam ve sayı sonu / başka ayırıcı gelir
      const parts = num.split(/([.,])/)
      let out = ''
      for (let i = 0; i < parts.length; i++) {
        const p = parts[i]
        if (p === '.') out += /^\d{3}$/.test(parts[i + 1] ?? '') && parts[i + 2] !== '.' ? ',' : '.'
        else if (p === ',') out += '.'
        else out += p
      }
      return out
    })
    .replace(/%\s?(\d+(?:\.\d+)?)/g, '$1%')
}

function translated(tr: string | undefined, en: string | undefined): string | undefined {
  return tr != null && en ? en : undefined
}

/** Ürün adı: katalog adıyla aynıysa İngilizcesi (panelde değiştirilmiş ad Türkçe kalır) */
export function productName(p: { id: string; name: string }, locale: CatalogLocale): string {
  if (locale !== 'en') return p.name
  const src = sourceById.get(p.id)
  return (src && src.name === p.name && translated(src.name, enProducts[p.id]?.name)) || p.name
}

export function productDescription(p: { id: string; description?: string }, locale: CatalogLocale): string | undefined {
  if (locale !== 'en' || !p.description) return p.description
  const src = sourceById.get(p.id)
  return (src && src.description === p.description && enProducts[p.id]?.description) || p.description
}

export function variantLabel(productId: string, v: { key: string; label: string }, locale: CatalogLocale): string {
  if (locale !== 'en') return v.label
  const src = sourceById.get(productId)?.variants?.find((x) => x.key === v.key)
  return (src && src.label === v.label && enProducts[productId]?.variants?.[v.key]) || v.label
}

/** Metin Türkçe kaldıysa (İngilizce sayfada) `lang="tr"`; aksi hâlde öznitelik verilmez */
export function textLang(original: string | undefined, shown: string | undefined, locale: CatalogLocale): 'tr' | undefined {
  if (locale !== 'en' || !original) return undefined
  return original === shown && /[çğıöşüÇĞİÖŞÜ]|\b(ve|ile|için)\b/.test(original) ? 'tr' : undefined
}

/**
 * Türetilmiş filtrelerin (lib/spec-facets.ts) adları ve sabit değerleri: katalogda geçmedikleri için çeviri
 * dosyasında (specs.json) yoklar. Aralık etiketleri ("50 Ah ve altı", "200 Ah üzeri") kuralla çevrilir.
 */
const FACET_KEYS_EN: Record<string, string> = {
  'Sistem voltajı': 'System voltage',
  'Kapasite (Ah)': 'Capacity (Ah)',
  'Enerji (kWh)': 'Energy (kWh)',
  Kimya: 'Chemistry',
  Güç: 'Power',
  Faz: 'Phase',
  'Hücre tipi': 'Cell type',
  Akım: 'Current',
}
const FACET_VALUES_EN: Record<string, string> = {
  'Yüksek gerilim (HV)': 'High voltage (HV)',
  Lityum: 'Lithium',
  Jel: 'Gel',
  'Tek faz': 'Single phase',
  'Üç faz': 'Three phase',
  Monokristal: 'Monocrystalline',
  'Bifacial (çift yüzlü)': 'Bifacial (double-sided)',
  'Esnek / katlanabilir': 'Flexible / foldable',
}

export function specKeyLabel(key: string, locale: CatalogLocale): string {
  if (locale !== 'en') return key
  const k = key.trim()
  return enSpecs.keys[k] ?? FACET_KEYS_EN[k] ?? key
}

export function specValueLabel(value: string, locale: CatalogLocale): string {
  if (locale !== 'en') return value
  const v = String(value).trim()
  const known = enSpecs.values[v] ?? FACET_VALUES_EN[v]
  if (known) return known
  const upTo = /^(.+) ve altı$/.exec(v)
  if (upTo) return `up to ${enNumbers(upTo[1])}`
  const over = /^(.+) üzeri$/.exec(v)
  if (over) return `over ${enNumbers(over[1])}`
  return enNumbers(v)
}

/** Gösterim için özellik tablosu (filtre/karşılaştırma mantığı Türkçe anahtarlarla çalışmaya devam eder) */
export function localizeSpecs(specs: Record<string, string> | undefined, locale: CatalogLocale): Record<string, string> | undefined {
  if (!specs || locale !== 'en') return specs
  const out: Record<string, string> = {}
  for (const [k, v] of Object.entries(specs)) out[specKeyLabel(k, locale)] = specValueLabel(String(v), locale)
  return out
}

/** Ürünün ad / kısa açıklama / varyant adlarını dile göre döner (fiyat, stok, id değişmez) */
export function localizeProduct<
  T extends { id: string; name: string; description?: string; variants?: { key: string; label: string }[] },
>(p: T, locale: CatalogLocale): T {
  if (locale !== 'en') return p
  return {
    ...p,
    name: productName(p, locale),
    description: productDescription(p, locale),
    ...(p.variants ? { variants: p.variants.map((v) => ({ ...v, label: variantLabel(p.id, v, locale) })) } : {}),
  }
}

/** Türkçe kalem adı ("Ürün" / "Ürün (Varyant)") → ürün id'si: ürün id'si saklanmayan kayıtlar (iade kalemleri) için */
let nameIndexCache: Map<string, string> | null = null
function nameIndex(): Map<string, string> {
  if (nameIndexCache) return nameIndexCache
  const map = new Map<string, string>()
  for (const p of sourceById.values()) {
    map.set(p.name, p.id)
    for (const v of p.variants ?? []) map.set(`${p.name} (${v.label})`, p.id)
  }
  nameIndexCache = map
  return map
}

/**
 * Sepet / sipariş kalemi adı. Kalem adı ekleme anındaki "Ürün (Varyant)" metnidir; katalogdaki Türkçeyle
 * eşleşirse seçili dilde yeniden kurulur, eşleşmezse (eski sepet, panel değişikliği) olduğu gibi kalır.
 */
export function lineItemName(
  item: { name: string; productId?: string | null; variantKey?: string | null; id?: string },
  locale: CatalogLocale,
): string {
  const productId = item.productId ?? nameIndex().get(item.name)
  if (!productId) return item.name
  const src = sourceById.get(productId)
  if (!src) return item.name
  const en = enProducts[productId]
  const trBase = src.name
  const enBase = en?.name ?? src.name
  // Kalem herhangi bir dilde eklenmiş olabilir: adı katalogdaki biçimlerden biriyle eşleşiyorsa istenen dildeki karşılığı
  if (item.name === trBase || item.name === enBase) return locale === 'en' ? enBase : trBase
  const variantKey = item.variantKey ?? (item.id && item.id.startsWith(`${productId}-`) ? item.id.slice(productId.length + 1) : undefined)
  const candidates = variantKey ? (src.variants ?? []).filter((v) => v.key === variantKey) : src.variants ?? []
  for (const v of candidates) {
    const trFull = `${trBase} (${v.label})`
    const enFull = `${enBase} (${en?.variants?.[v.key] ?? v.label})`
    if (item.name === trFull || item.name === enFull) return locale === 'en' ? enFull : trFull
  }
  return item.name
}
