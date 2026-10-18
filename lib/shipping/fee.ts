/**
 * Kargo ücreti — kargo entegratörü fiyat listesine göre (Kargo Fiyat Listesi, 3.10.2026, şehirler arası,
 * her desi için en uygun firma). Hem istemci (sepet, ödeme) hem sunucu (sipariş) bu dosyayı kullanır.
 *
 * - 0–30 desi: tablo fiyatı (vergiler hariç)
 * - 30 desi üstü: 30 desi fiyatı + her ek desi için 20 ₺
 * - 100 desi veya 100 kg ve üzeri: ağır yük taşıma bedeli eklenir (en uygun firma: Yurtiçi 4.246,25 ₺)
 * - Vergiler: KDV %20 + Evrensel Posta Taşıma Bedeli %2,35 (fiyatın üzerine)
 * Fiyatlar 1 Ocak / 1 Temmuz'da güncellenir: tabloyu yeni listeyle değiştirin.
 */
import desiMap from '@/lib/catalog/desi.json'
import { round2 } from '@/lib/store-config'

export type Logistics = { desi: number; kg: number }

/** Desi 0..30 için vergiler hariç fiyat (₺); indeks = desi */
const PRICE_BY_DESI: readonly number[] = [
  90.25, 90.25, 90.25, 90.75, 90.75, // 0–4
  112.5, 125.25, 125.25, 125.25, 125.25, 125.25, // 5–10
  188.5, 190.25, 192.5, // 11–13
  197.25, 197.25, 197.25, 197.25, 197.25, 197.25, 197.25, // 14–20
  266.25, 266.25, 266.25, 266.25, 266.25, 266.25, 266.25, 266.25, 266.25, 266.25, // 21–30
]
const PER_DESI_OVER_30 = 20
const HEAVY_LIMIT = 100
const HEAVY_SURCHARGE = 4246.25
/** KDV %20 + Evrensel Posta Taşıma Bedeli %2,35 */
export const SHIPPING_TAX_RATE = 22.35

const MAP = desiMap as unknown as Record<string, [number, number]>

/** Sepet satırının desi ve ağırlığı (varyant satırı yoksa ürünün varsayılanı) */
export function lineLogistics(lineId: string, productId?: string): Logistics {
  const hit = MAP[lineId] ?? (productId ? MAP[productId] : undefined)
  return { desi: hit?.[0] ?? 0, kg: hit?.[1] ?? 0 }
}

/** Sepetin toplam desisi ve ağırlığı */
export function cartLogistics(items: { id: string; productId?: string; quantity: number }[]): Logistics {
  let desi = 0
  let kg = 0
  for (const it of items) {
    const l = lineLogistics(it.id, it.productId)
    desi += l.desi * it.quantity
    kg += l.kg * it.quantity
  }
  return { desi: Math.ceil(desi), kg: round2(kg) }
}

/** Kargo ücreti (vergiler dahil, ₺). Desi 0 olsa da en düşük tarife uygulanır (zarf/küçük paket). */
export function shippingFeeFor({ desi, kg }: Logistics): number {
  const d = Math.max(0, Math.ceil(desi))
  let base = d <= 30 ? PRICE_BY_DESI[d] : PRICE_BY_DESI[30] + (d - 30) * PER_DESI_OVER_30
  if (d >= HEAVY_LIMIT || kg >= HEAVY_LIMIT) base += HEAVY_SURCHARGE
  return round2(base * (1 + SHIPPING_TAX_RATE / 100))
}
