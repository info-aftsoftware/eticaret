/**
 * Ürün araması için ortak helper'lar.
 * Türkçe karakter normalizasyonu ve aranacak metin oluşturma.
 */

export type ProductLike = {
  id?: string
  name?: string
  description?: string
  category?: string
  sku?: string
  tags?: string[]
  brand?: string
  slogan?: string
  fullDescription?: string
  specifications?: Record<string, string>
  variants?: { label?: string; sku?: string }[]
}

/** Arama için Türkçe karakterleri normalize eder (ı→i, ğ→g, ş→s, ü→u, ö→o, ç→c). */
export function normalizeForSearch(str: string): string {
  if (!str || typeof str !== 'string') return ''
  return str
    .toLowerCase()
    .trim()
    .replace(/ı/g, 'i')
    .replace(/ğ/g, 'g')
    .replace(/ş/g, 's')
    .replace(/ü/g, 'u')
    .replace(/ö/g, 'o')
    .replace(/ç/g, 'c')
    .replace(/İ/g, 'i')
    .replace(/I/g, 'i')
}

/** Ürünün aranacak tek metnini oluşturur (name, description, brand, slogan, fullDescription, specifications). */
export function buildSearchableText(product: ProductLike): string {
  const parts: string[] = [
    product.name,
    product.description,
    product.category,
    product.sku,
    product.id,
    product.brand,
    product.slogan,
    product.fullDescription,
    ...(product.tags || []),
    // Varyantlı ürünlerde model adı ve varyant SKU'su ile de bulunabilsin
    ...(product.variants || []).flatMap((v) => [v.label, v.sku]),
  ].filter(Boolean) as string[]

  if (product.specifications && typeof product.specifications === 'object') {
    const specText = Object.entries(product.specifications)
      .flat()
      .filter(Boolean)
      .join(' ')
    if (specText) parts.push(specText)
  }

  return parts.join(' ')
}

/** Ürün sorguyla eşleşiyor mu? (searchProducts ile aynı kurallar: kelime bazlı, eş anlamlı, yazım hatası toleransı) */
export function productMatchesQuery(product: ProductLike, query: string): boolean {
  if (!normalizeForSearch(query)) return true
  return searchProducts([product], query).length > 0
}

// ─── Puanlı arama (kelime bazlı, eş anlamlılar, tek harf hata toleransı) ─────────────────────────

/** Sık kullanılan eş anlamlı / yazım varyantları (normalize edilmiş) — bir kelime gruptakilerden biriyle eşleşebilir */
const SYNONYM_GROUPS: string[][] = [
  ['inverter', 'invertor', 'inverteri', 'eviric'],
  ['aku', 'batarya', 'battery', 'pil'],
  ['panel', 'gunes', 'solar', 'fotovoltaik'],
  ['sarj', 'charger', 'sarjci'],
  ['lityum', 'lifepo4', 'lithium', 'lfp'],
  ['mppt', 'regulator', 'kontrol'],
  ['pompa', 'pump'],
  ['ruzgar', 'turbin', 'wind'],
]
const SYNONYMS = new Map<string, string[]>()
for (const g of SYNONYM_GROUPS) for (const w of g) SYNONYMS.set(w, g)

const tokenize = (s: string) => normalizeForSearch(s).split(/[^a-z0-9.]+/).filter((t) => t.length > 0)

/** Damerau-Levenshtein ≤ 1 (bir harf eksik/fazla/farklı veya yer değiştirmiş) */
function withinOneEdit(a: string, b: string): boolean {
  if (a === b) return true
  const la = a.length
  const lb = b.length
  if (Math.abs(la - lb) > 1) return false
  if (la === lb) {
    const diff: number[] = []
    for (let i = 0; i < la; i++) if (a[i] !== b[i]) diff.push(i)
    if (diff.length === 1) return true
    return diff.length === 2 && diff[1] === diff[0] + 1 && a[diff[0]] === b[diff[1]] && a[diff[1]] === b[diff[0]]
  }
  const [s, l] = la < lb ? [a, b] : [b, a]
  let i = 0
  let j = 0
  let skipped = false
  while (i < s.length && j < l.length) {
    if (s[i] === l[j]) { i++; j++; continue }
    if (skipped) return false
    skipped = true
    j++
  }
  return true
}

/** Sorgu kelimesi metindeki kelimelerden biriyle eşleşiyor mu (ön ek, eş anlamlı, yazım hatası)? */
function tokenMatches(q: string, words: string[]): 'exact' | 'fuzzy' | null {
  const variants = SYNONYMS.get(q) ?? [q]
  for (const v of variants) if (words.some((w) => w.startsWith(v))) return 'exact'
  if (q.length >= 4) {
    for (const w of words) {
      if (w.length < 4) continue
      // kelimenin başı da yazım hatasına tolere edilir (ör. "invertör" yazımı "inverter")
      if (withinOneEdit(q, w) || withinOneEdit(q, w.slice(0, q.length)) || withinOneEdit(q, w.slice(0, q.length + 1))) return 'fuzzy'
    }
  }
  return null
}

/**
 * Ürünleri sorguya göre puanlayıp sıralar. Tüm sorgu kelimeleri ürün metninde (ad, marka, kategori, açıklama, özellikler)
 * bulunmalıdır. Puan: ad içinde tam ifade > ad içinde kelimeler > diğer alanlar; yazım hatalı eşleşmeler daha düşük.
 */
export function searchProducts<T extends ProductLike>(products: T[], query: string): T[] {
  const qTokens = tokenize(query)
  if (qTokens.length === 0) return products
  const phrase = normalizeForSearch(query)
  const scored: { p: T; score: number }[] = []
  for (const p of products) {
    const nameWords = tokenize(`${p.name ?? ''} ${p.brand ?? ''}`)
    const allWords = tokenize(buildSearchableText(p))
    let score = 0
    let ok = true
    for (const q of qTokens) {
      const inName = tokenMatches(q, nameWords)
      if (inName) { score += inName === 'exact' ? 20 : 8; continue }
      const inText = tokenMatches(q, allWords)
      if (inText) { score += inText === 'exact' ? 6 : 2; continue }
      ok = false
      break
    }
    if (!ok) continue
    if (normalizeForSearch(p.name ?? '').includes(phrase)) score += 50
    if (p.sku && normalizeForSearch(p.sku) === phrase) score += 100
    scored.push({ p, score })
  }
  return scored.sort((a, b) => b.score - a.score).map((x) => x.p)
}
