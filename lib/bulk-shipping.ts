/**
 * Toplu kargolama: "Sipariş no; Kargo firması; Takip no" içeren CSV (kargo firmasının gönderi listesi dökümünden
 * kolayca hazırlanır). Önce ön izleme, sonra uygulama: sipariş "Kargoya verildi" olur, müşteriye takip e-postası gider.
 */
import { headerKey, parseCsv } from '@/lib/csv'
import { getAllCarriers } from '@/lib/shipping/carriers'

export type ShipOrder = { id: string; orderNo: string; status: string; paymentStatus: string }
export type ShipRow = {
  line: number
  orderNo: string
  orderId: string | null
  carrierId: string | null
  carrierName: string | null
  trackingNumber: string
  status: 'ship' | 'error'
  message?: string
}

const fold = (s: string) => headerKey(s).replace(/\s+/g, '')

/** "Yurtiçi", "yurtici kargo", "MNG", "aras" → kargo firması kimliği */
export function matchCarrier(input: string): { id: string; name: string } | null {
  const q = fold(input)
  if (!q) return null
  for (const c of getAllCarriers()) {
    const id = fold(c.id)
    const name = fold(c.name)
    if (q === id || name.startsWith(q) || q.startsWith(id) || name.includes(q)) return { id: c.id, name: c.name }
  }
  return null
}

// Ödemesi alınmış (paymentStatus PAID) ve henüz kargolanmamış; PICKING dışındakiler önce "hazırlanıyor" adımına alınır
const SHIPPABLE = new Set(['PENDING', 'PAID', 'CONFIRMED', 'PROCESSING', 'PICKING'])
const STATUS_REASON: Record<string, string> = {
  SHIPPED: 'Sipariş zaten kargoda',
  DELIVERED: 'Sipariş teslim edilmiş',
  CANCELLED: 'Sipariş iptal edilmiş',
  RETURNED: 'Sipariş iade alınmış',
}

export function planBulkShipping(csv: string, orders: ShipOrder[]): { rows: ShipRow[]; ready: number; errors: number } | { error: string } {
  const table = parseCsv(csv)
  if (table.length < 2) return { error: 'Dosyada başlık satırı ve en az bir sipariş satırı olmalı.' }
  const h = table[0].map(headerKey)
  const col = (...keys: string[]) => h.findIndex((x) => keys.includes(x))
  const orderCol = col('siparis no', 'siparis', 'order', 'order no', 'referans', 'referans no')
  const carrierCol = col('kargo firmasi', 'kargo', 'firma', 'carrier')
  const trackCol = col('takip no', 'takip numarasi', 'kargo takip no', 'gonderi no', 'barkod', 'tracking')
  if (orderCol < 0 || trackCol < 0) return { error: '"Sipariş no" ve "Takip no" sütunları gerekli ("Kargo firması" isteğe bağlı, yoksa her satırda istenir).' }
  const byNo = new Map(orders.map((o) => [o.orderNo.toUpperCase(), o]))
  const seen = new Set<string>()
  const rows: ShipRow[] = table.slice(1).map((cells, i) => {
    const line = i + 2
    const orderNo = (cells[orderCol] ?? '').trim().toUpperCase()
    const trackingNumber = (cells[trackCol] ?? '').trim()
    const carrier = carrierCol >= 0 ? matchCarrier(cells[carrierCol] ?? '') : null
    const o = byNo.get(orderNo)
    const base = { line, orderNo, orderId: o?.id ?? null, carrierId: carrier?.id ?? null, carrierName: carrier?.name ?? null, trackingNumber }
    const err = (message: string): ShipRow => ({ ...base, status: 'error', message })
    if (!o) return err('Sipariş bulunamadı')
    if (seen.has(o.id)) return err('Sipariş dosyada birden fazla kez var')
    seen.add(o.id)
    if (!trackingNumber) return err('Takip no boş')
    if (!carrier) return err('Kargo firması tanınmadı')
    if (!SHIPPABLE.has(o.status)) return err(STATUS_REASON[o.status] ?? `Sipariş bu durumda kargoya verilemez (${o.status})`)
    if (o.paymentStatus !== 'PAID') return err('Ödemesi alınmamış sipariş kargoya verilemez')
    return { ...base, status: 'ship' }
  })
  return { rows, ready: rows.filter((r) => r.status === 'ship').length, errors: rows.filter((r) => r.status === 'error').length }
}
