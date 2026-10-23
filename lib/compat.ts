/**
 * Uyumlu ürün önerilerinde teknik kontrol (madde 6): DC sistem ürünleri (akü, BMS, inverter, şarj kontrol, akü şarj)
 * yalnız sistem voltajı sınıfları kesişiyorsa uyumlu sayılır. Voltajı okunamayan DC ürünü "uyumlu" diye önerilmez
 * (teknik onayı olmayan ilişki yayımlanmaz). Sınıflar: 12 V (12–13,6), 24 V (24–27,6), 48 V (48–58), HV (yüksek gerilim).
 * Saf modül (birim testli).
 */

export type VoltageClass = '12' | '24' | '48' | 'HV'

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
  name: string
  category?: string | null
  specifications?: Record<string, string> | null
  /** Varyantlı üründe voltaj çoğu zaman varyant adında/özelliğinde ("12,8V 100Ah") */
  variants?: { label?: string; specifications?: Record<string, string> }[] | null
}

export function voltageClasses(p: CompatProduct): Set<VoltageClass> {
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
  const va = voltageClasses(a)
  const vb = voltageClasses(b)
  if (!va.size || !vb.size) return false
  for (const c of va) if (vb.has(c)) return true
  return false
}
