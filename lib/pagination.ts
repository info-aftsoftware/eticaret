/**
 * Sayfalama düğmeleri: ilk ve son sayfa her zaman, seçili sayfanın iki yanında birer komşu, aradaki boşluklar "…".
 * Ör. 15 sayfada 7. sayfa → 1 … 6 7 8 … 15. 7 sayfaya kadar hepsi gösterilir.
 */
export type PageItem = number | 'gap'

export function pageItems(current: number, total: number): PageItem[] {
  if (total <= 7) return Array.from({ length: total }, (_, i) => i + 1)
  const c = Math.min(Math.max(current, 1), total)
  // Başta ya da sonda ise ilk/son beş sayfa, ortadaysa komşular
  const start = c <= 4 ? 2 : c >= total - 3 ? total - 4 : c - 1
  const end = c <= 4 ? 5 : c >= total - 3 ? total - 1 : c + 1
  const items: PageItem[] = [1]
  if (start > 2) items.push('gap')
  for (let p = start; p <= end; p++) items.push(p)
  if (end < total - 1) items.push('gap')
  items.push(total)
  return items
}

/** URL'deki ?page= değeri: geçersizse 1 */
export function parsePageParam(value: string | null | undefined): number {
  const n = Number.parseInt(value ?? '', 10)
  return Number.isFinite(n) && n >= 1 ? n : 1
}
