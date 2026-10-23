/**
 * Kargo ücreti teklifi. İki kaynaktan (Geliver ve Navlungo, tablolar lib/shipping/rates.ts) teklif alınır,
 * müşteriye en ucuzu yansır. Akü / batarya içeren sepette yalnızca Navlungo fiyatı verilir.
 * Hangi kaynağın ve firmanın seçildiği siparişe yazılır ve yönetim panelinde gösterilir.
 * Hem istemci (sepet, ödeme, ürün sayfası) hem sunucu (sipariş) bu dosyayı kullanır.
 *
 * Sepet tek gönderi sayılır: fiyat toplam desiye göre. Ağır taşıma tek parça üzerinden değerlendirilir.
 */
import desiMap from '@/lib/catalog/desi.json'
import { round2 } from '@/lib/store-config'
import { getCarrier } from '@/lib/shipping/carriers'
import {
  GELIVER_BEST,
  GELIVER_LIMITS,
  GELIVER_PER_DESI_OVER_30,
  GELIVER_TAX_RATE,
  HEAVY_PIECE_DESI,
  HEAVY_PIECE_KG,
  NAVLUNGO_RATES,
  SHIPPING_PROVIDER_LABELS,
  SHIPPING_RATES_VERSION,
  type NavlungoRate,
  type ShippingProvider,
} from '@/lib/shipping/rates'

export { SHIPPING_PROVIDER_LABELS, type ShippingProvider }

/** Geliver fiyatlarına eklenen vergiler (KDV + EPH), geriye dönük ad */
export const SHIPPING_TAX_RATE = GELIVER_TAX_RATE

export type Logistics = {
  /** Toplam desi, yukarı yuvarlanmış */
  desi: number
  /** Toplam ağırlık (kg) */
  kg: number
  /** Toplam desi, yuvarlanmamış (Navlungo basamakları 2,1 / 3,1 … sınırlı) */
  desiExact?: number
  /** 100 desiyi aşan tek parça sayısı */
  heavyPieces?: number
  /** 100 kg'ı aşan tek parça sayısı */
  heavyKgPieces?: number
  /** Sepette akü / batarya var mı (yalnızca Navlungo fiyatı verilir) */
  battery?: boolean
  /** Sepette yalnızca kurulumlu ürün var (lib/sale-mode.ts 'install'): kargo ücreti yok, nakliye ayrıca konuşulur */
  installOnly?: boolean
  /** Kurulumlu ürün var mı */
  hasInstall?: boolean
}

export type ShippingCandidate = {
  provider: ShippingProvider
  carrierId: string | null
  carrierName: string
  /** Vergiler dahil ücret; teklif verilemiyorsa null */
  fee: number | null
  /** Teklif verilemiyorsa nedeni */
  reason?: string
}

export type ShippingQuote = {
  fee: number
  provider: ShippingProvider
  carrierId: string | null
  carrierName: string
  candidates: ShippingCandidate[]
  desi: number
  kg: number
  battery: boolean
  version: string
}

/** desi.json: satır id -> [desi, kg, akü mü (1), kurulumlu mu (1)] */
const MAP = desiMap as unknown as Record<string, [number, number, number?, number?]>

/**
 * Panelden tanımlanan tek adet lojistik (A07): desi.json'daki değerin yerine geçer.
 * desi/kg bir adedin toplamıdır (koli sayısı dahil); install: kurulum ve nakliye ayrıca (kargoya girmez).
 */
export type LineLogisticsOverride = { desi: number; kg: number; install?: boolean }

/** Koli ölçüsü ve ağırlığından bir adedin desisi: koli sayısı × max(U×G×Y/3000, kg), koli başına yukarı yuvarlanır */
export function packageDesi(dimensionsCm: number[] | null | undefined, weightKg: number | null | undefined, packageCount = 1): number {
  const [l = 0, w = 0, h = 0] = dimensionsCm ?? []
  const perPackage = Math.ceil(Math.max((l * w * h) / 3000, weightKg ?? 0) - 1e-9)
  return Math.max(0, perPackage) * Math.max(1, Math.floor(packageCount))
}

/** Ürünün panel lojistiği (yoksa undefined: desi.json kullanılır). İstemci ve sunucu aynı kuralı kullanır. */
export function panelLineLogistics(p: { logisticsSource?: string; desi?: number; weightKg?: number; packageCount?: number; saleMode?: string } | null | undefined): LineLogisticsOverride | undefined {
  // Kurulumlu ürün kargoya girmez (panelde seçilmiş olabilir; desi.json'da yoksa da geçerli)
  if (p?.saleMode === 'install') return { desi: 0, kg: 0, install: true }
  if (!p || p.logisticsSource !== 'panel') return undefined
  return { desi: p.desi ?? 0, kg: round2((p.weightKg ?? 0) * Math.max(1, p.packageCount ?? 1)) }
}

/** Sepet satırının tek adet lojistik bilgisi (varyant satırı yoksa ürünün varsayılanı; panel lojistiği varsa o) */
export function lineLogistics(lineId: string, productId?: string, override?: LineLogisticsOverride): Logistics {
  const hit = MAP[lineId] ?? (productId ? MAP[productId] : undefined)
  const desi = override ? override.desi : hit?.[0] ?? 0
  const kg = override ? override.kg : hit?.[1] ?? 0
  return {
    desi,
    kg,
    desiExact: desi,
    heavyPieces: desi > HEAVY_PIECE_DESI ? 1 : 0,
    heavyKgPieces: kg > HEAVY_PIECE_KG ? 1 : 0,
    battery: hit?.[2] === 1,
    hasInstall: override ? !!override.install : hit?.[3] === 1,
  }
}

/** Sepetin toplam desisi, ağırlığı, ağır parça sayısı ve akü bilgisi */
export function cartLogistics(items: { id: string; productId?: string; quantity: number; logistics?: LineLogisticsOverride }[]): Logistics {
  let desi = 0
  let kg = 0
  let heavyPieces = 0
  let heavyKgPieces = 0
  let battery = false
  let installLines = 0
  for (const it of items) {
    const l = lineLogistics(it.id, it.productId, it.logistics)
    if (l.hasInstall) installLines++
    desi += l.desi * it.quantity
    kg += l.kg * it.quantity
    heavyPieces += (l.heavyPieces ?? 0) * it.quantity
    heavyKgPieces += (l.heavyKgPieces ?? 0) * it.quantity
    battery ||= Boolean(l.battery)
  }
  return {
    desi: Math.ceil(desi),
    kg: round2(kg),
    desiExact: round2(desi),
    heavyPieces,
    heavyKgPieces,
    battery,
    hasInstall: installLines > 0,
    installOnly: installLines > 0 && installLines === items.length,
  }
}

const carrierName = (id: string | null) => (id ? getCarrier(id)?.name ?? id : 'En uygun firma')

/** Geliver "En iyi fiyatlar" listesinden teklif (vergiler eklenmiş) */
export function geliverQuote(l: Logistics): ShippingCandidate {
  const d = Math.max(0, Math.ceil(l.desi))
  const base = { provider: 'geliver' as const }
  if ((l.heavyPieces ?? 0) > 0 || (l.heavyKgPieces ?? 0) > 0) {
    return { ...base, carrierId: null, carrierName: carrierName(null), fee: null, reason: '100 desi/kg üzeri parça: listede bu firmaların taban fiyatı yok' }
  }
  if (d > 30) {
    // Liste 30 desi üstü için firma belirtmiyor: "her ek desi 20 ₺ + vergiler"
    const price = GELIVER_BEST[30][1] + (d - 30) * GELIVER_PER_DESI_OVER_30
    return { ...base, carrierId: null, carrierName: carrierName(null), fee: round2(price * (1 + GELIVER_TAX_RATE / 100)) }
  }
  const [carrierId, price] = GELIVER_BEST[d]
  const lim = GELIVER_LIMITS[carrierId]
  if (lim && (d > lim.maxDesi || l.kg > lim.maxKg)) {
    return { ...base, carrierId, carrierName: carrierName(carrierId), fee: null, reason: `${carrierName(carrierId)} ${lim.maxKg} kg üstünü almıyor` }
  }
  return { ...base, carrierId, carrierName: carrierName(carrierId), fee: round2(price * (1 + GELIVER_TAX_RATE / 100)) }
}

function navlungoCarrierQuote(rate: NavlungoRate, l: Logistics): ShippingCandidate {
  const exact = Math.max(0, l.desiExact ?? l.desi)
  const base = { provider: 'navlungo' as const, carrierId: rate.carrierId, carrierName: carrierName(rate.carrierId) }
  const heavy = l.heavyPieces ?? 0
  if (rate.flatPerDesi) {
    if (exact < (rate.minDesi ?? 0)) return { ...base, fee: null, reason: `${rate.minDesi} desi altı gönderi almıyor` }
    return { ...base, fee: round2(Math.ceil(exact) * rate.flatPerDesi) }
  }
  if (heavy > 0 && !rate.heavyFree && rate.heavyPerPiece == null) return { ...base, fee: null, reason: 'Ağır taşıma (100 desi üstü parça) yok' }
  if (rate.maxKg != null && l.kg > rate.maxKg) return { ...base, fee: null, reason: `Paket başı en fazla ${rate.maxKg} kg` }
  const brackets = rate.brackets ?? []
  const d = rate.integerDesi ? Math.ceil(exact) : exact
  const hit = brackets.find(([max]) => d <= max)
  let price: number
  if (hit) price = hit[1]
  else {
    const [lastMax, lastPrice] = brackets[brackets.length - 1]
    if (rate.perDesiOver == null) return { ...base, fee: null, reason: `${lastMax} desi üstü için fiyat yok` }
    price = lastPrice + Math.ceil(round2(exact - lastMax)) * rate.perDesiOver
  }
  if (heavy > 0 && rate.heavyPerPiece) price += heavy * rate.heavyPerPiece
  return { ...base, fee: round2(price) }
}

/** Navlungo taşıyıcılarının tek tek teklifleri (KDV ve EPH dahil) */
export function navlungoQuotes(l: Logistics): ShippingCandidate[] {
  return NAVLUNGO_RATES.map((r) => navlungoCarrierQuote(r, l))
}

/** Sepet için tüm teklifler ve en ucuzu. Akülü sepette Geliver teklif dışı bırakılır. */
export function quoteShipping(l: Logistics): ShippingQuote {
  const battery = Boolean(l.battery)
  // Yalnızca kurulumlu ürün (şarj istasyonu): kargo ücreti alınmaz, nakliye siparişten sonra konuşulur
  if (l.installOnly) {
    return { fee: 0, provider: 'navlungo', carrierId: null, carrierName: 'Kurulum ve nakliye ayrıca planlanır', candidates: [], desi: 0, kg: 0, battery, version: SHIPPING_RATES_VERSION }
  }
  const geliver = geliverQuote(l)
  const candidates: ShippingCandidate[] = [
    battery ? { ...geliver, fee: null, reason: 'Akü / batarya: yalnızca Navlungo fiyatı verilir' } : geliver,
    ...navlungoQuotes(l),
  ]
  let best: ShippingCandidate | null = null
  for (const c of candidates) {
    if (c.fee == null) continue
    if (!best || c.fee < (best.fee as number)) best = c
  }
  // Her durumda en az bir Navlungo teklifi vardır (Aras: üst sınır yok, ağır parça bedeliyle); yine de güvenli dönüş
  const chosen = best ?? { provider: 'navlungo' as const, carrierId: 'aras', carrierName: carrierName('aras'), fee: 0 }
  return {
    fee: chosen.fee as number,
    provider: chosen.provider,
    carrierId: chosen.carrierId,
    carrierName: chosen.carrierName,
    candidates,
    desi: Math.ceil(l.desiExact ?? l.desi),
    kg: l.kg,
    battery,
    version: SHIPPING_RATES_VERSION,
  }
}

/** Kargo ücreti (vergiler dahil, ₺): iki kaynağın en ucuzu */
export function shippingFeeFor(l: Logistics): number {
  return quoteShipping(l).fee
}
