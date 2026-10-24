/**
 * Ürün listesi / kategori sayfası özellik filtreleri.
 *
 * 1) Türetilmiş filtreler (madde 12): ham teknik özellik değerleri ürünler arasında dağınık olduğundan (ör. "12,8 V",
 *    "12V", "24 / 48 VDC") temel seçim ölçütleri ürün adı, varyant adları ve teknik özelliklerden ortak aralıklara
 *    çevrilir: akü ve depolamada sistem voltajı, kapasite (Ah), enerji (kWh), kimya; inverterde voltaj, güç, faz;
 *    panelde güç ve hücre tipi; şarj kontrolde voltaj ve akım. Bir ürün birden çok değere girebilir (varyantlar).
 * 2) Genel filtreler: listedeki ürünlerin en az %30'unda bulunan, 2–12 farklı ve kısa (≤ 32 karakter) değeri olan
 *    teknik özellik anahtarları. Toplam en fazla 6 filtre, türetilmişler önce.
 */

import { DC_SYSTEM_CATEGORIES, voltageClasses } from '@/lib/compat'

export type SpecFacet = { key: string; values: string[] }

type WithSpecs = {
  name?: string
  category?: string | null
  specifications?: Record<string, string>
  variants?: { label?: string }[] | null
}

const MIN_COVERAGE = 0.3
const MAX_VALUES = 12
const MAX_VALUE_LENGTH = 32
const MAX_FACETS = 6
/** Filtre olarak anlamsız anahtarlar (marka için ayrı filtre var; model/garanti her üründe farklı veya bilgi amaçlı) */
const EXCLUDED_KEYS = new Set(['model', 'marka', 'garanti', 'seri', 'ürün', 'ağırlık', 'net ağırlık', 'boyutlar', 'boyut', 'parça no', 'sku', 'vmp / imp', 'voc / isc', 'maksimum seri sigorta', 'çalışma sıcaklığı'])

const BATTERY = new Set(['Lityum Akü', 'Jel Akü'])
const STORAGE = new Set([...BATTERY, 'Taşınabilir Güç İstasyonu'])
const INVERTER = new Set(['On-Grid İnverter', 'Hibrit İnverter', 'Tam Sinüs MPPT Akıllı İnverter', 'Tam Sinüs İnverter', 'Modifiye Sinüs İnverter', 'Şarjlı Tam Sinüs İnverter'])
const PANEL = new Set(['TopCon Güneş Paneli', 'Monokristal Güneş Paneli', 'Esnek ve Katlanabilir Panel'])
const CONTROLLER = new Set(['MPPT Şarj Kontrol Cihazı', 'PWM Şarj Kontrol Cihazı', 'Rüzgar Şarj Kontrol Cihazı', 'Akü Şarj Cihazı'])

type Bucket = { label: string; max: number }
const bucketsOf = (list: [string, number][]): Bucket[] => list.map(([label, max]) => ({ label, max }))
const AH = bucketsOf([['50 Ah ve altı', 50], ['51–100 Ah', 100], ['101–200 Ah', 200], ['200 Ah üzeri', Infinity]])
const KWH = bucketsOf([['2 kWh ve altı', 2], ['2–5,5 kWh', 5.5], ['5,5–10 kWh', 10], ['10 kWh üzeri', Infinity]])
const KW = bucketsOf([['1 kW ve altı', 1], ['1–3 kW', 3], ['3–6 kW', 6], ['6–12 kW', 12], ['12 kW üzeri', Infinity]])
const WP = bucketsOf([['200 Wp ve altı', 200], ['201–450 Wp', 450], ['451–600 Wp', 600], ['600 Wp üzeri', Infinity]])
const AMP = bucketsOf([['20 A ve altı', 20], ['21–40 A', 40], ['41–60 A', 60], ['60 A üzeri', Infinity]])
const VOLT_LABEL: Record<string, string> = { '12': '12 V', '24': '24 V', '48': '48 V', HV: 'Yüksek gerilim (HV)' }

/** Türetilmiş filtre anahtarları ve değer sırası (alfabetik değil, küçükten büyüğe) */
const DERIVED_ORDER: Record<string, string[]> = {
  'Sistem voltajı': Object.values(VOLT_LABEL),
  'Kapasite (Ah)': AH.map((b) => b.label),
  'Enerji (kWh)': KWH.map((b) => b.label),
  Kimya: ['LiFePO4 (LFP)', 'Lityum', 'Jel', 'AGM'],
  Güç: [...KW.map((b) => b.label), ...WP.map((b) => b.label)],
  Faz: ['Tek faz', 'Üç faz'],
  'Hücre tipi': ['TOPCon', 'Monokristal', 'Bifacial (çift yüzlü)', 'Esnek / katlanabilir'],
  Akım: AMP.map((b) => b.label),
}
/** Türetilmiş filtre varken aynı bilgiyi taşıyan ham anahtarlar ayrıca listelenmez */
const SHADOWED = /^(nominal voltaj|nominal gerilim|(nominal )?akü gerilimi|voltaj|sistem voltajı|kapasite|artırılabilir kapasite|enerji|güç|nominal güç|faz|hücre tipi|akım|şarj akımı)$/i

const num = (s: string) => Number(s.replace(',', '.'))
const bucket = (v: number, list: Bucket[]) => list.find((b) => v <= b.max)?.label

function texts(p: WithSpecs, keyPattern?: RegExp): string {
  const specs = Object.entries(p.specifications ?? {})
    .filter(([k]) => !keyPattern || keyPattern.test(k))
    .map(([, v]) => v)
  return [p.name ?? '', ...(p.variants ?? []).map((v) => v.label ?? ''), ...specs].join(' · ')
}

/** "105 / 206 Ah", "100Ah", "5,4 – 172 kWh" gibi ifadelerdeki sayılar (birimden önceki "/" ve aralık listeleri dahil) */
function numbersWithUnit(text: string, unit: string): number[] {
  const re = new RegExp(`((?:\\d+(?:[.,]\\d+)?\\s*(?:/|–|-)\\s*)*\\d+(?:[.,]\\d+)?)\\s*${unit}(?![a-zğüşıöç])`, 'gi')
  const out: number[] = []
  for (const m of text.matchAll(re)) for (const part of m[1].split(/\/|–|-/)) out.push(num(part.trim()))
  return out.filter((n) => Number.isFinite(n) && n > 0)
}

function bucketsFor(values: number[], list: Bucket[]): string[] {
  return [...new Set(values.map((v) => bucket(v, list)).filter((x): x is string => !!x))]
}

/** Akü ve taşınabilir depolamanın enerji değerleri (kWh); depolama ürünü değilse veya bilinmiyorsa boş */
export function storageKwh(p: WithSpecs): number[] {
  const cat = p.category ?? ''
  if (!STORAGE.has(cat)) return []
  const kwh = numbersWithUnit(texts(p), 'kWh')
  if (kwh.length || !BATTERY.has(cat)) return kwh
  // kWh yazmayan akü: tek sistem voltajı varsa nominal gerilim × Ah (LiFePO4 12,8 / 25,6 / 51,2 V; jel/AGM 12 / 24 / 48 V)
  const ah = numbersWithUnit(texts(p), 'Ah')
  const classes = [...voltageClasses({ ...p, name: p.name ?? '', category: cat })]
  if (!ah.length || classes.length !== 1 || classes[0] === 'HV') return []
  const lfp = /LiFePO4|\bLFP\b|lityum/i.test(texts(p)) || cat === 'Lityum Akü'
  const nominal = { '12': lfp ? 12.8 : 12, '24': lfp ? 25.6 : 24, '48': lfp ? 51.2 : 48 }[classes[0] as '12' | '24' | '48']
  return ah.map((a) => (a * nominal) / 1000)
}

/** Ürünün türetilmiş filtre değerleri: anahtar → değerler (boşsa ürün o filtrede yer almaz) */
export function derivedFacetValues(p: WithSpecs): Record<string, string[]> {
  const cat = p.category ?? ''
  const out: Record<string, string[]> = {}
  const put = (key: string, values: string[]) => {
    if (values.length) out[key] = values
  }
  if (DC_SYSTEM_CATEGORIES.has(cat)) {
    put('Sistem voltajı', [...voltageClasses({ ...p, name: p.name ?? '', category: cat })].map((c) => VOLT_LABEL[c]))
  }
  if (STORAGE.has(cat)) {
    if (BATTERY.has(cat)) put('Kapasite (Ah)', bucketsFor(numbersWithUnit(texts(p), 'Ah'), AH))
    put('Enerji (kWh)', bucketsFor(storageKwh(p), KWH))
  }
  if (BATTERY.has(cat)) {
    const t = texts(p)
    put('Kimya', [/LiFePO4|\bLFP\b/i.test(t) ? 'LiFePO4 (LFP)' : /\bAGM\b/i.test(t) ? 'AGM' : /\bjel\b|\bgel\b/i.test(t) || cat === 'Jel Akü' ? 'Jel' : 'Lityum'])
  }
  if (INVERTER.has(cat)) {
    const t = texts(p, /güç|power|nominal|çıkış/i)
    const kw = [...numbersWithUnit(t, 'kW'), ...numbersWithUnit(t, 'kVA'), ...numbersWithUnit(t, 'W').map((w) => w / 1000), ...numbersWithUnit(t, 'VA').map((w) => w / 1000)]
    // Panel/şarj gibi yan değerler (ör. "100 W" ek çıkış) değil, ana güç: en az 0,1 kW
    put('Güç', bucketsFor(kw.filter((v) => v >= 0.1 && v <= 500), KW))
    const all = texts(p)
    const phases = [/tek faz|monofaze|single[- ]phase|\b1 ?faz/i.test(all) && 'Tek faz', /üç faz|trifaze|three[- ]phase|\b3 ?faz/i.test(all) && 'Üç faz'].filter((x): x is string => !!x)
    put('Faz', phases)
  }
  if (PANEL.has(cat)) {
    const t = texts(p, /güç|power|maksimum/i)
    put('Güç', bucketsFor([...numbersWithUnit(t, 'Wp'), ...numbersWithUnit(t, 'W')].filter((w) => w >= 5 && w <= 1000), WP))
    const all = texts(p)
    const types = [
      /topcon/i.test(all) || cat === 'TopCon Güneş Paneli' ? 'TOPCon' : /mono/i.test(all) || cat === 'Monokristal Güneş Paneli' ? 'Monokristal' : null,
      /bifacial|çift yüz/i.test(all) ? 'Bifacial (çift yüzlü)' : null,
      cat === 'Esnek ve Katlanabilir Panel' ? 'Esnek / katlanabilir' : null,
    ].filter((x): x is string => !!x)
    put('Hücre tipi', types)
  }
  if (CONTROLLER.has(cat)) put('Akım', bucketsFor(numbersWithUnit(texts(p), 'A').filter((a) => a >= 1 && a <= 500), AMP))
  return out
}

/** Ürün bu filtrede seçili değerlerden birini taşıyor mu (türetilmiş veya ham özellik) */
export function matchesSpecFilter(p: WithSpecs, key: string, selected: string[]): boolean {
  if (!selected.length) return true
  if (key in DERIVED_ORDER) return (derivedFacetValues(p)[key] ?? []).some((v) => selected.includes(v))
  const value = p.specifications?.[key]
  return !!value && selected.includes(value)
}

export function buildSpecFacets(products: WithSpecs[]): SpecFacet[] {
  const minCount = Math.max(2, Math.ceil(products.length * MIN_COVERAGE))

  // 1) Türetilmiş filtreler
  const derived = new Map<string, { values: Set<string>; count: number }>()
  for (const product of products) {
    for (const [key, values] of Object.entries(derivedFacetValues(product))) {
      const entry = derived.get(key) ?? { values: new Set<string>(), count: 0 }
      values.forEach((v) => entry.values.add(v))
      entry.count++
      derived.set(key, entry)
    }
  }
  const derivedFacets = Object.keys(DERIVED_ORDER)
    .map((key) => [key, derived.get(key)] as const)
    .filter(([, e]) => e && e.count >= minCount && e.values.size >= 2)
    .map(([key, e]) => ({ key, values: DERIVED_ORDER[key].filter((v) => e!.values.has(v)) }))

  // 2) Genel filtreler (türetilmişin gölgelediği anahtarlar hariç)
  const map = new Map<string, { values: Set<string>; count: number }>()
  for (const product of products) {
    for (const [keyRaw, valueRaw] of Object.entries(product.specifications ?? {})) {
      const key = keyRaw.trim()
      const value = String(valueRaw).trim()
      if (!key || !value || EXCLUDED_KEYS.has(key.toLocaleLowerCase('tr'))) continue
      if (key in DERIVED_ORDER || (derivedFacets.length && SHADOWED.test(key))) continue
      const entry = map.get(key) ?? { values: new Set<string>(), count: 0 }
      entry.values.add(value)
      entry.count++
      map.set(key, entry)
    }
  }
  const generic = Array.from(map.entries())
    .filter(([, e]) => e.count >= minCount && e.values.size >= 2 && e.values.size <= MAX_VALUES)
    .filter(([, e]) => Array.from(e.values).every((v) => v.length <= MAX_VALUE_LENGTH))
    .sort((a, b) => b[1].count - a[1].count || a[1].values.size - b[1].values.size || a[0].localeCompare(b[0], 'tr'))
    .map(([key, e]) => ({ key, values: Array.from(e.values).sort((a, b) => a.localeCompare(b, 'tr', { numeric: true })) }))

  return [...derivedFacets, ...generic].slice(0, MAX_FACETS)
}
