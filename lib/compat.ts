/**
 * Uyumlu ürün önerilerinde teknik kontrol (madde 6): DC sistem ürünleri (akü, BMS, inverter, şarj kontrol, akü şarj)
 * yalnız sistem voltajı sınıfları kesişiyorsa uyumlu sayılır. Voltajı okunamayan DC ürünü "uyumlu" diye önerilmez
 * (teknik onayı olmayan ilişki yayımlanmaz). Sınıflar: 12 V (12–13,6), 24 V (24–27,6), 48 V (48–58), HV (yüksek gerilim).
 * Saf modül (birim testli).
 */

import voltageMap from '@/lib/catalog/system-voltage.json'

export type VoltageClass = '12' | '24' | '48' | 'HV'

/** Panelde girilebilen değerler: sınıflar veya "any" (voltajdan bağımsız aksesuar) */
export const SYSTEM_VOLTAGE_OPTIONS = ['12', '24', '48', 'HV', 'any'] as const
export type SystemVoltageValue = (typeof SYSTEM_VOLTAGE_OPTIONS)[number]

const MAP = voltageMap as unknown as Record<string, { v: VoltageClass[] | 'any'; src: string } | string>

/** Sistem voltajının belirleyici olduğu kategoriler */
export const DC_SYSTEM_CATEGORIES = new Set([
  'Lityum Akü',
  'Jel Akü',
  'Batarya Yönetimi ve Aksesuar',
  'Tam Sinüs İnverter',
  'Şarjlı Tam Sinüs İnverter',
  'Modifiye Sinüs İnverter',
  'Tam Sinüs MPPT Akıllı İnverter',
  'Hibrit İnverter',
  'MPPT Şarj Kontrol Cihazı',
  'PWM Şarj Kontrol Cihazı',
  'Akü Şarj Cihazı',
  'Rüzgar Şarj Kontrol Cihazı',
])

function classOf(v: number): VoltageClass | null {
  if (v >= 11.5 && v <= 14.6) return '12'
  if (v >= 23 && v <= 29.2) return '24'
  if (v >= 46 && v <= 58.4) return '48'
  if (v >= 90 && v <= 1000) return 'HV'
  return null
}

/**
 * Ürünün sistem voltajı sınıfları: addaki ve teknik özellikteki "12V", "12,8 V", "24/48 VDC", "51.2V", "HV" ifadelerinden.
 * VA (güç), Vac/230V (şebeke) ve panel gerilimleri (Voc/Vmp) sayılmaz.
 */
type CompatProduct = {
  id?: string
  name: string
  /** Panelde girilen sistem voltajı (ProductOverride.systemVoltage); doluysa her şeyin önüne geçer */
  systemVoltage?: string[] | null
  category?: string | null
  specifications?: Record<string, string> | null
  /** Varyantlı üründe voltaj çoğu zaman varyant adında/özelliğinde ("12,8V 100Ah") */
  variants?: { label?: string; specifications?: Record<string, string> }[] | null
}

/** Kaynağa göre sistem voltajı: panel değeri → veri dosyası (lib/catalog/system-voltage.json) → ad/varyant/özellik */
export function systemVoltageOf(p: CompatProduct): { any: true } | { any: false; classes: Set<VoltageClass>; source: 'panel' | 'veri' | 'ad' } {
  const panel = (p.systemVoltage ?? []).filter((v): v is SystemVoltageValue => (SYSTEM_VOLTAGE_OPTIONS as readonly string[]).includes(v))
  if (panel.length) return panel.includes('any') ? { any: true } : { any: false, classes: new Set(panel as VoltageClass[]), source: 'panel' }
  const m = p.id ? MAP[p.id] : undefined
  if (m && typeof m === 'object') return m.v === 'any' ? { any: true } : { any: false, classes: new Set(m.v), source: 'veri' }
  return { any: false, classes: parseVoltageClasses(p), source: 'ad' }
}

/** Sistem voltajı sınıfları (panel/veri dosyası dahil; "any" boş küme döner, uyum kontrolünde ayrıca ele alınır) */
export function voltageClasses(p: CompatProduct): Set<VoltageClass> {
  const v = systemVoltageOf(p)
  return v.any ? new Set() : v.classes
}

/** Voltaj biliniyor mu (sınıf veya voltajdan bağımsız) — panelde "Voltajı tanımsız" süzgeci */
export function hasKnownVoltage(p: CompatProduct): boolean {
  const v = systemVoltageOf(p)
  return v.any || v.classes.size > 0
}

/** Panelden gelen sistem voltajı: boş/null siler; "any" tek başına; tekrarlar ve sıra düzeltilir */
export function sanitizeSystemVoltage(input: unknown): { value: SystemVoltageValue[] | null } | { error: string } {
  if (input == null) return { value: null }
  if (!Array.isArray(input)) return { error: 'Sistem voltajı geçersiz' }
  const bad = input.find((v) => !(SYSTEM_VOLTAGE_OPTIONS as readonly unknown[]).includes(v))
  if (bad !== undefined) return { error: `Sistem voltajı geçersiz: ${String(bad)}` }
  if (!input.length) return { value: null }
  if (input.includes('any')) return input.length === 1 ? { value: ['any'] } : { error: '"Voltajdan bağımsız" diğer voltajlarla birlikte seçilemez' }
  return { value: SYSTEM_VOLTAGE_OPTIONS.filter((o) => input.includes(o)) }
}

/** Panel değeri yokken geçerli olan voltaj (düzenleyicide gösterilir) */
export function describeFallbackVoltage(p: CompatProduct): { any: boolean; classes: VoltageClass[]; source: 'veri' | 'ad' | null } {
  const v = systemVoltageOf({ ...p, systemVoltage: null })
  if (v.any) return { any: true, classes: [], source: 'veri' }
  return { any: false, classes: [...v.classes], source: v.classes.size ? (v.source as 'veri' | 'ad') : null }
}

function parseVoltageClasses(p: CompatProduct): Set<VoltageClass> {
  const out = new Set<VoltageClass>()
  const specs = [p.specifications ?? {}, ...(p.variants ?? []).map((v) => v.specifications ?? {})]
  const specText = specs
    .flatMap((sp) => Object.entries(sp))
    .filter(([k]) => /(nominal|sistem|akü|batarya|battery|giriş gerilimi|dc giriş|voltaj|gerilim)/i.test(k) && !/(ac|çıkış|şebeke|voc|vmp|panel|pv)/i.test(k))
    .map(([, v]) => v)
    .join(' ')
  const labels = (p.variants ?? []).map((v) => v.label ?? '').join(' ')
  const text = `${p.name} ${labels} ${specText}`.replace(/(\d),(\d)/g, '$1.$2')
  if (/\bHV\b|yüksek (gerilim|voltaj)/i.test(text)) out.add('HV')
  // LV (düşük gerilim) hibrit/AIO sistemleri 48 V batarya kullanır
  if (/\bLV\b/.test(text)) out.add('48')
  // "24/48 VDC", "12/24V", "12V", "51.2 V" (VA ve Vac hariç)
  const re = /((?:\d+(?:\.\d+)?\s*\/\s*)*\d+(?:\.\d+)?)\s*V(?:DC)?(?![a-z0-9])/gi
  for (const m of text.matchAll(re)) {
    const after = text.slice((m.index ?? 0) + m[0].length, (m.index ?? 0) + m[0].length + 4)
    // Şebeke (Vac) ve panel giriş gerilimi ("100V PV") sistem voltajı değildir
    if (/^\s*(ac|a\b|pv)/i.test(after)) continue
    for (const part of m[1].split('/')) {
      const c = classOf(Number(part.trim()))
      if (c) out.add(c)
    }
  }
  return out
}

/** İki ürün teknik olarak uyumlu öneri olabilir mi (yalnız ikisi de DC sistem kategorisindeyse voltaj kontrol edilir) */
export function isTechnicallyCompatible(a: CompatProduct, b: CompatProduct): boolean {
  if (!DC_SYSTEM_CATEGORIES.has(a.category ?? '') || !DC_SYSTEM_CATEGORIES.has(b.category ?? '')) return true
  const va = systemVoltageOf(a)
  const vb = systemVoltageOf(b)
  if (va.any || vb.any) return true
  if (!va.classes.size || !vb.classes.size) return false
  for (const c of va.classes) if (vb.classes.has(c)) return true
  return false
}
