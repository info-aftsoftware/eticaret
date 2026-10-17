/**
 * Düşük stok uyarısı: ürün stoğu eşiğin (LOW_STOCK_THRESHOLD, varsayılan 5) altına indiği anda
 * admin'e e-posta (lib/notifications sendLowStockNotification). Yalnızca eşik aşağı doğru geçildiğinde
 * gönderilir; aynı ürün için 12 saat içinde tekrar gönderilmez.
 *
 * Tetikleyiciler: admin stok değişiklikleri (catalog PATCH, bulk, stock-overrides) ve sipariş sonrası
 * stok düşümü (notifyLowStockAfterOrder — sipariş oluşturma akışından çağrılmalı).
 */

import { getMergedProductById, getMergedProducts } from '@/lib/catalog-merge'
import { sendLowStockNotification } from '@/lib/notifications'

export const LOW_STOCK_THRESHOLD = Math.max(0, Number(process.env.LOW_STOCK_THRESHOLD) || 5)
const COOLDOWN_MS = 12 * 60 * 60 * 1000
const lastSent = new Map<string, number>()

export type StockChange = { productId: string; before: number | null | undefined; after: number; name?: string }

/** Eşiği aşağı doğru geçen ürünler için uyarı gönderir; gönderilen ürün id'lerini döner. Hata fırlatmaz. */
export async function notifyLowStockTransitions(changes: StockChange[]): Promise<string[]> {
  const sent: string[] = []
  for (const c of changes) {
    try {
      const crossed = c.after <= LOW_STOCK_THRESHOLD && (c.before == null || c.before > LOW_STOCK_THRESHOLD)
      if (!crossed) continue
      const last = lastSent.get(c.productId)
      if (last && Date.now() - last < COOLDOWN_MS) continue
      const name = c.name ?? (await getMergedProductById(c.productId))?.name ?? c.productId
      lastSent.set(c.productId, Date.now())
      const ok = await sendLowStockNotification(name, c.after, LOW_STOCK_THRESHOLD)
      if (ok) sent.push(c.productId)
      else lastSent.delete(c.productId)
    } catch (e) {
      console.error('Low stock notification error:', e)
    }
  }
  return sent
}

/** Mevcut (birleşik) stokları okur: önce/sonra karşılaştırması için admin değişikliğinden ÖNCE çağrılır */
export async function readStocks(productIds: string[]): Promise<Map<string, { stock: number; name: string }>> {
  const out = new Map<string, { stock: number; name: string }>()
  const ids = [...new Set(productIds)]
  if (ids.length > 5) {
    const wanted = new Set(ids)
    for (const p of await getMergedProducts()) if (wanted.has(p.id)) out.set(p.id, { stock: p.stock ?? 0, name: p.name })
    return out
  }
  for (const id of ids) {
    const p = await getMergedProductById(id).catch(() => null)
    if (p) out.set(id, { stock: p.stock ?? 0, name: p.name })
  }
  return out
}

/**
 * Sipariş sonrası: düşülen satırlar için uyarı. `lines` yalnızca stoğu gerçekten düşülen kalemler olmalı.
 * Sipariş yanıtını bekletmemek için çağıran taraf `void notifyLowStockAfterOrder(...)` kullanabilir.
 */
export async function notifyLowStockAfterOrder(lines: { productId: string; quantity: number }[]): Promise<string[]> {
  const qty = new Map<string, number>()
  for (const l of lines) qty.set(l.productId, (qty.get(l.productId) ?? 0) + l.quantity)
  const now = await readStocks([...qty.keys()])
  return notifyLowStockTransitions(
    [...qty.entries()]
      .filter(([id]) => now.has(id))
      .map(([id, q]) => ({ productId: id, after: now.get(id)!.stock, before: now.get(id)!.stock + q, name: now.get(id)!.name }))
  )
}
