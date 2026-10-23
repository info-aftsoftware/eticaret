/**
 * Excel/CSV ile toplu stok ve fiyat güncelleme — önce ön izleme planı (değişmeden hiçbir şey yazılmaz), sonra uygulama.
 * Eşleme: "Ürün kodu" (katalog id) veya "SKU". Sütunlar: "Stok" ve/veya "Fiyat (KDV hariç)" (TL).
 * Varyantlı ürünlerde fiyat varyant bazlı olduğundan CSV ile değiştirilmez (stok değiştirilir).
 * Dışa aktarılan katalog dosyası (Ürünler & Stok > Dışa aktar) doğrudan düzenlenip geri yüklenebilir.
 */
import { headerKey, parseCsv, parseNumber } from '@/lib/csv'

export type ImportProduct = { id: string; sku?: string | null; name: string; price: number; stock: number | null; isVariantProduct?: boolean; variantStock?: boolean }
export type ImportRow = {
  line: number
  id: string | null
  name: string | null
  oldStock: number | null
  newStock: number | null
  oldPrice: number | null
  newPrice: number | null
  status: 'change' | 'same' | 'error'
  message?: string
}
export type ImportPlan = { rows: ImportRow[]; changes: number; errors: number; columns: { stock: boolean; price: boolean } }

const ID_KEYS = ['urun kodu', 'id', 'urun id', 'kod']
const SKU_KEYS = ['sku', 'stok kodu']
const STOCK_KEYS = ['stok', 'stock', 'adet', 'miktar']
const PRICE_KEYS = ['fiyat', 'kdv haric fiyat', 'net fiyat', 'price']

const findCol = (headers: string[], keys: string[]) => headers.findIndex((h) => keys.includes(headerKey(h)))

export function planStockPriceImport(csv: string, products: ImportProduct[]): ImportPlan | { error: string } {
  const table = parseCsv(csv)
  if (table.length < 2) return { error: 'Dosyada başlık satırı ve en az bir ürün satırı olmalı.' }
  const headers = table[0]
  const idCol = findCol(headers, ID_KEYS)
  const skuCol = findCol(headers, SKU_KEYS)
  const stockCol = findCol(headers, STOCK_KEYS)
  const priceCol = findCol(headers, PRICE_KEYS)
  if (idCol < 0 && skuCol < 0) return { error: 'Ürünü bulmak için "Ürün kodu" veya "SKU" sütunu gerekli.' }
  if (stockCol < 0 && priceCol < 0) return { error: '"Stok" veya "Fiyat (KDV hariç)" sütunu gerekli.' }

  const byId = new Map(products.map((p) => [p.id.toLowerCase(), p]))
  const bySku = new Map(products.filter((p) => p.sku).map((p) => [String(p.sku).toLowerCase(), p]))
  const seen = new Set<string>()
  const rows: ImportRow[] = []

  table.slice(1).forEach((cells, i) => {
    const line = i + 2
    const idVal = idCol >= 0 ? cells[idCol]?.trim() : ''
    const skuVal = skuCol >= 0 ? cells[skuCol]?.trim() : ''
    const p = (idVal && byId.get(idVal.toLowerCase())) || (skuVal && bySku.get(skuVal.toLowerCase())) || null
    const base = { line, id: p?.id ?? (idVal || skuVal || null), name: p?.name ?? null, oldStock: p?.stock ?? null, oldPrice: p?.price ?? null, newStock: null, newPrice: null }
    if (!p) return rows.push({ ...base, status: 'error', message: 'Ürün bulunamadı' })
    if (seen.has(p.id)) return rows.push({ ...base, status: 'error', message: 'Bu ürün dosyada birden fazla kez var' })
    seen.add(p.id)

    let newStock: number | null = null
    let newPrice: number | null = null
    const problems: string[] = []
    if (stockCol >= 0 && cells[stockCol]?.trim()) {
      const n = parseNumber(cells[stockCol])
      if (n === null || n < 0 || !Number.isInteger(n)) problems.push('Stok 0 veya pozitif tam sayı olmalı')
      else if (p.variantStock) {
        if (n !== p.stock) problems.push('Varyantları ayrı stoklanan ürünün stoğu ürün düzenleyiciden değiştirilir')
      }
      else newStock = n
    }
    if (priceCol >= 0 && cells[priceCol]?.trim()) {
      const n = parseNumber(cells[priceCol])
      if (n === null || n <= 0) problems.push('Fiyat pozitif sayı olmalı')
      else if (p.isVariantProduct) {
        if (Math.abs(n - p.price) >= 0.005) problems.push('Varyantlı ürünün fiyatı ürün düzenleyiciden değiştirilir')
      } else newPrice = Math.round(n * 100) / 100
    }
    // Fiyatta ani büyük değişiklik (×3 veya ⅓) çoğunlukla yanlış sütun / birim hatasıdır
    if (newPrice !== null && p.price > 0 && (newPrice > p.price * 3 || newPrice < p.price / 3)) {
      problems.push(`Fiyat ${Math.round(p.price)} → ${Math.round(newPrice)} TL: çok büyük değişiklik, birimi kontrol edin (KDV hariç TL)`)
    }
    if (problems.length) return rows.push({ ...base, newStock, newPrice, status: 'error', message: problems.join('; ') })
    const stockChanges = newStock !== null && newStock !== p.stock
    const priceChanges = newPrice !== null && Math.abs(newPrice - p.price) >= 0.005
    rows.push({ ...base, newStock, newPrice, status: stockChanges || priceChanges ? 'change' : 'same' })
  })

  return {
    rows,
    changes: rows.filter((r) => r.status === 'change').length,
    errors: rows.filter((r) => r.status === 'error').length,
    columns: { stock: stockCol >= 0, price: priceCol >= 0 },
  }
}
