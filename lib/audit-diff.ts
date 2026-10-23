/**
 * İşlem kaydı için alan bazında değişiklik dökümü (A09): hangi alan, hangi değerden hangi değere.
 * Parola, gizli anahtar ve token içeren alanlar hiç yazılmaz; uzun değerler kısaltılır. Saf modül (birim testli).
 */

export type FieldChange = { field: string; label: string; from: string | null; to: string | null }

const SECRET = /pass(word)?|secret|token|totp|apikey|api_key|privatekey/i
const MAX = 200

/** Değeri kayda yazılacak kısa metne çevirir */
export function auditValue(v: unknown): string | null {
  if (v === null || v === undefined || v === '') return null
  if (typeof v === 'boolean') return v ? 'Evet' : 'Hayır'
  if (typeof v === 'number') return Number.isFinite(v) ? String(Math.round(v * 10000) / 10000) : null
  if (typeof v === 'string') return v.length > MAX ? `${v.slice(0, MAX)}…` : v
  if (Array.isArray(v) && v.every((x) => typeof x === 'number')) return v.join(' × ')
  const json = JSON.stringify(v)
  return json.length > MAX ? `${json.slice(0, MAX)}…` : json
}

/** labels'taki alanlar için önce/sonra farkları (yalnız değişenler, labels sırasıyla) */
export function diffFields(before: Record<string, unknown>, after: Record<string, unknown>, labels: Record<string, string>): FieldChange[] {
  const out: FieldChange[] = []
  for (const [field, label] of Object.entries(labels)) {
    if (SECRET.test(field)) continue
    const from = auditValue(before[field])
    const to = auditValue(after[field])
    if (from !== to) out.push({ field, label, from, to })
  }
  return out
}

type VariantLike = { key: string; label?: string; price?: number; basePrice?: number; sku?: string; stock?: number }

/** Varyant listesi farkı: eklenen, kaldırılan ve fiyatı/adı/SKU'su/stoğu değişen varyantlar */
export function diffVariants(before: VariantLike[] | undefined | null, after: VariantLike[] | undefined | null): FieldChange[] {
  const out: FieldChange[] = []
  const b = new Map((before ?? []).map((v) => [v.key, v]))
  const a = new Map((after ?? []).map((v) => [v.key, v]))
  for (const [key, v] of a) {
    const o = b.get(key)
    const name = v.label ?? key
    if (!o) {
      out.push({ field: `variants.${key}`, label: `Varyant eklendi`, from: null, to: name })
      continue
    }
    const fields: [keyof VariantLike, string][] = [['label', 'adı'], ['price', 'fiyatı (TL)'], ['basePrice', 'döviz fiyatı'], ['sku', 'SKU'], ['stock', 'stoğu']]
    for (const [f, l] of fields) {
      const from = auditValue(o[f])
      const to = auditValue(v[f])
      if (from !== to) out.push({ field: `variants.${key}.${f}`, label: `Varyant “${o.label ?? key}” ${l}`, from, to })
    }
  }
  for (const [key, o] of b) if (!a.has(key)) out.push({ field: `variants.${key}`, label: 'Varyant kaldırıldı', from: o.label ?? key, to: null })
  return out
}

/** Kayıt satırında gösterilen özet: "Fiyat: 100 → 110 · Stok: 5 → 4" */
export function summarizeChanges(changes: FieldChange[], max = 6): string {
  const parts = changes.slice(0, max).map((c) => `${c.label}: ${c.from ?? '—'} → ${c.to ?? '—'}`)
  if (changes.length > max) parts.push(`+${changes.length - max} alan`)
  return parts.join(' · ')
}
