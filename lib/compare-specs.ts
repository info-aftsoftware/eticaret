/**
 * Karşılaştırma tablosunda ortak özellik adları (madde 13): katalogda aynı bilgi farklı adlarla geçer
 * ("Nominal Voltaj" / "Nominal gerilim", "Artırılabilir Kapasite" / "Kapasite", ayrı "Uzunluk / Genişlik / Yükseklik"
 * ya da tek "Boyutlar"). Karşılaştırmada ortak ada çevrilir; ayrı ölçüler tek "Boyutlar (U × G × Y)" satırında birleşir.
 * Eksik değer ikiye ayrılır: ürünün kategorisinde bu bilgi başka ürünlerde varsa "Belirtilmemiş", hiç yoksa
 * "Bu kategoride verilmez" (alan o ürün türünde kullanılmıyor).
 * Saf modül (birim testli).
 */

const ALIASES: [RegExp, string][] = [
  [/^(nominal (voltaj|gerilim)|voltaj|(nominal )?akü gerilimi|sistem voltajı)$/i, 'Nominal gerilim'],
  [/^(artırılabilir kapasite|kapasite|nominal kapasite)$/i, 'Kapasite'],
  [/^(enerji|enerji kapasitesi|toplam enerji)$/i, 'Enerji'],
  [/^(boyutlar|boyut|ölçüler|ölçü|boyutlar \(u × g × y\))$/i, 'Boyutlar (U × G × Y)'],
  [/^(ağırlık|net ağırlık)$/i, 'Ağırlık'],
  [/^(batarya ömrü|çevrim ömrü|döngü ömrü)$/i, 'Çevrim ömrü'],
  [/^(koruma sınıfı|ip sınıfı|ip koruma)$/i, 'Koruma sınıfı'],
  [/^(nominal güç|güç|çıkış gücü|nominal çıkış gücü)$/i, 'Güç'],
]

const DIMENSION_PARTS: [RegExp, 'u' | 'g' | 'y'][] = [
  [/^uzunluk$/i, 'u'],
  [/^genişlik$/i, 'g'],
  [/^yükseklik$/i, 'y'],
]

export function canonicalSpecKey(key: string): string {
  const k = key.trim()
  return ALIASES.find(([re]) => re.test(k))?.[1] ?? k
}

/** "400 mm" → "400"; birim ayrı tutulur ki "400 × 391 × 365 mm" yazılabilsin */
function splitUnit(v: string): { n: string; unit: string } | null {
  const m = v.trim().match(/^(\d+(?:[.,]\d+)?)\s*(mm|cm|m)$/i)
  return m ? { n: m[1], unit: m[2].toLowerCase() } : null
}

/** Teknik özellikleri ortak adlara çevirir (sıra korunur; ilk görülen değer geçerli) */
export function normalizeSpecs(specs: Record<string, string> | undefined | null): Record<string, string> {
  const out: Record<string, string> = {}
  const dims: Partial<Record<'u' | 'g' | 'y', string>> = {}
  let dimsAt = -1
  const entries = Object.entries(specs ?? {})
  entries.forEach(([key, value], i) => {
    const part = DIMENSION_PARTS.find(([re]) => re.test(key.trim()))?.[1]
    if (part) {
      dims[part] = String(value).trim()
      if (dimsAt < 0) dimsAt = i
      return
    }
    const k = canonicalSpecKey(key)
    if (!(k in out)) out[k] = String(value).trim()
  })
  if (dimsAt >= 0 && !('Boyutlar (U × G × Y)' in out)) {
    const parts = (['u', 'g', 'y'] as const).map((p) => dims[p])
    const split = parts.map((p) => (p ? splitUnit(p) : null))
    const sameUnit = split.every((s) => s) && new Set(split.map((s) => s!.unit)).size === 1
    out['Boyutlar (U × G × Y)'] = sameUnit
      ? `${split.map((s) => s!.n).join(' × ')} ${split[0]!.unit}`
      : `U: ${parts[0] ?? '—'} · G: ${parts[1] ?? '—'} · Y: ${parts[2] ?? '—'}`
  }
  return out
}

/** Kategori → o kategorideki ürünlerde geçen ortak özellik adları ("Belirtilmemiş" / "Bu kategoride verilmez" ayrımı için) */
export function keysByCategory(catalog: { category?: string; specifications?: Record<string, string> }[]): Map<string, Set<string>> {
  const map = new Map<string, Set<string>>()
  for (const p of catalog) {
    const set = map.get(p.category ?? '') ?? new Set<string>()
    for (const k of Object.keys(normalizeSpecs(p.specifications))) set.add(k)
    map.set(p.category ?? '', set)
  }
  return map
}

export type MissingKind = 'unspecified' | 'not-applicable'

export function missingKind(category: string | undefined, key: string, byCategory: Map<string, Set<string>>): MissingKind {
  return byCategory.get(category ?? '')?.has(key) ? 'unspecified' : 'not-applicable'
}
