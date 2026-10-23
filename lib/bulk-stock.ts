/**
 * Toplu stok işlemi (A16): eşitle (stoğu X yap), ekle (+X) ve çıkar (−X). Panel kaydetmeden önce aynı hesapla
 * ürün bazında mevcut → yeni → fark önizlemesi gösterir; sunucu da aynı kuralla uygular. Saf modül (birim testli).
 * Varyantları ayrı stoklanan ürünler atlanır (stokları varyant bazında düzenlenir); stok 0'ın altına inmez.
 */

export type BulkStockMode = 'set' | 'add' | 'subtract'

export const BULK_STOCK_MODE_TR: Record<BulkStockMode, string> = {
  set: 'Stoğu eşitle',
  add: 'Stok ekle',
  subtract: 'Stok çıkar',
}

export type BulkStockRow = { id: string; name: string; current: number; next: number; diff: number; skipped?: 'variant-stock' }

export function planBulkStock(
  products: { id: string; name: string; stock: number; variantStock?: boolean }[],
  mode: BulkStockMode,
  amount: number
): { rows: BulkStockRow[]; changed: number; skipped: number } {
  const n = Math.max(0, Math.floor(amount))
  const rows = products.map((p): BulkStockRow => {
    const current = Math.max(0, Math.floor(p.stock ?? 0))
    if (p.variantStock) return { id: p.id, name: p.name, current, next: current, diff: 0, skipped: 'variant-stock' }
    const next = mode === 'set' ? n : mode === 'add' ? current + n : Math.max(0, current - n)
    return { id: p.id, name: p.name, current, next, diff: next - current }
  })
  return { rows, changed: rows.filter((r) => !r.skipped && r.diff !== 0).length, skipped: rows.filter((r) => r.skipped).length }
}
