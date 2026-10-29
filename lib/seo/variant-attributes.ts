/**
 * Varyantın ayırt edici değeri (ör. "5 kW", "25,6V 204Ah", "24V 30A"): sayfadaki seçenek etiketinden, tüm
 * etiketlerde ortak olan baş/son kelimeler atılarak bulunur. Ürün sayfası JSON-LD'si (ProductGroup → size) ve
 * /llms-full.txt bunu kullanır; değer her zaman sayfada görünen etiketin bir parçasıdır, yeni bilgi üretilmez.
 */

/** Birim kelimeleri ortak olsa da atılmaz ("90 kW" / "180 kW" → "kW" kalır) */
const UNIT_TOKEN = /^(k?wp?|kwh|wh|mah|ah|v|a|kva|va|hp|mm|cm|m|kg|g|w)$/i

const norm = (s: string) => s.toLocaleLowerCase('tr-TR')

/** Her etiketin ayırt edici kısmı (etiketlerle aynı sırada). Tek varyantta veya kısaltılamazsa etiketin tamamı. */
export function variantDistinctLabels(labels: string[]): string[] {
  const tokens = labels.map((l) => l.trim().split(/\s+/))
  if (tokens.length < 2) return labels.map((l) => l.trim())
  const common = (pick: (t: string[], i: number) => string | undefined) => {
    let n = 0
    for (;;) {
      const first = pick(tokens[0], n)
      if (!first || UNIT_TOKEN.test(first) || /^\d+([.,]\d+)?$/.test(first)) return n
      if (!tokens.every((t) => t.length > n + 1 && pick(t, n) !== undefined && norm(pick(t, n) as string) === norm(first))) return n
      n++
    }
  }
  const head = common((t, i) => t[i])
  const tail = common((t, i) => t[t.length - 1 - i])
  return tokens.map((t, i) => {
    let part = t.slice(head, t.length - tail).join(' ').replace(/^[-–/,\s]+|[-–/,\s]+$/g, '')
    // Ortak son kelimeyle birlikte atılan kapanış parantezi geri eklenir ("… (1800W AC Şarj" → "… (1800W AC Şarj)")
    const open = (part.match(/\(/g) ?? []).length - (part.match(/\)/g) ?? []).length
    if (open > 0) part += ')'.repeat(open)
    return part || labels[i].trim()
  })
}

const UNIT_PROPERTY: Record<string, string> = {
  kwp: 'Güç', wp: 'Güç', kw: 'Güç', w: 'Güç', kva: 'Güç', va: 'Güç', hp: 'Güç',
  v: 'Gerilim',
  a: 'Akım',
  ah: 'Kapasite',
  kwh: 'Enerji', wh: 'Enerji',
}

/**
 * Etiketteki ölçülü değerler (ör. "24V 30A" → Gerilim 24 V, Akım 30 A). Varyantın kendi teknik özellik tablosu
 * yoksa JSON-LD'de additionalProperty olarak verilir; her ad bir kez (ilk geçen değer) alınır.
 */
export function labelMeasurements(label: string): { name: string; value: string }[] {
  const out: { name: string; value: string }[] = []
  const seen = new Set<string>()
  // Aralık ve çoklu değer tek değer sayılır ("12/24V", "8-12 kW"); model kodundaki birim ("MDK55A") alınmaz
  const num = String.raw`\d+(?:[.,]\d+)?`
  const re = new RegExp(String.raw`(?<![\p{L}\d.,/-])(${num}(?:\s*[-–/]\s*${num})*)\s*(kWp|Wp|kWh|Wh|kVA|VA|kW|HP|Ah|W|V|A)(?![\p{L}\d])`, 'gu')
  for (const m of label.matchAll(re)) {
    const name = UNIT_PROPERTY[m[2].toLowerCase()]
    if (!name || seen.has(name)) continue
    seen.add(name)
    out.push({ name, value: `${m[1]} ${m[2]}` })
  }
  return out
}
