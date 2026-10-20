/**
 * Kargo fiyat kaynakları. Fiyat teklifi iki kaynaktan hesaplanır, sepete en ucuzu yansır (lib/shipping/fee.ts):
 *
 * 1) Geliver: "Fiyat Listesi", app.geliver.io, 3.10.2026, şehirler arası, "En iyi fiyatlar" sekmesi.
 *    Her desi için en ucuz firma ve fiyatı (vergiler hariç). Vergiler: KDV %20 + EPH %2,35 eklenir.
 *    30 desi üstü: her ek desi +20 ₺ (+ vergiler). Ağır yük (100 desi/kg üzeri tek parça) bu listede ancak Aras,
 *    Sürat, Yurtiçi taşır; o firmaların taban fiyatı listede olmadığından ağır parçalı sepete Geliver teklifi verilmez.
 *    Firma koşulları: Hepsijet ≤40 desi ve ≤20 kg, Kolay Gelsin ≤100 desi ve ≤30 kg.
 *
 * 2) Navlungo: "Domestic Fiyat Teklifi 2026" (taşıyıcı tarifeleri 17.07.2026'dan itibaren), KDV ve EPH dahil,
 *    81 ile tek fiyat. Ağır taşıma: tek parça 100 desiyi aşarsa parça başına; toplam desi 100'ü aşınca uygulanmaz.
 *    Kapıda ödeme ve iade bedelleri burada yok (sitede kapıda ödeme sunulmuyor).
 *
 * Fiyatlar değişince yalnızca bu dosyadaki tablolar güncellenir.
 */

export type ShippingProvider = 'geliver' | 'navlungo'

export const SHIPPING_PROVIDER_LABELS: Record<ShippingProvider, string> = {
  geliver: 'Geliver',
  navlungo: 'Navlungo',
}

/** Fiyat tablolarının sürümü (siparişteki teklif kaydına yazılır) */
export const SHIPPING_RATES_VERSION = 'geliver-2026-10-03+navlungo-2026-07-17'

// ---------------------------------------------------------------------------------------------------------------
// Geliver

/** KDV %20 + Evrensel Posta Taşıma Bedeli %2,35 (Geliver fiyatlarının üzerine) */
export const GELIVER_TAX_RATE = 22.35

/** Desi 0..30 için [firma, vergiler hariç fiyat]; indeks = desi (Geliver "En iyi fiyatlar") */
export const GELIVER_BEST: readonly (readonly [string, number])[] = [
  ['surat', 90.25], ['surat', 90.25], ['surat', 90.25], // 0–2
  ['hepsijet', 90.75], ['hepsijet', 90.75], // 3–4
  ['kolaygelsin', 112.5], ['kolaygelsin', 125.25], ['kolaygelsin', 125.25], ['kolaygelsin', 125.25], ['kolaygelsin', 125.25], ['kolaygelsin', 125.25], // 5–10
  ['surat', 188.5], ['surat', 190.25], ['surat', 192.5], // 11–13
  ...Array.from({ length: 7 }, () => ['kolaygelsin', 197.25] as const), // 14–20
  ...Array.from({ length: 10 }, () => ['kolaygelsin', 266.25] as const), // 21–30
]
export const GELIVER_PER_DESI_OVER_30 = 20
/** Geliver firma kabul sınırları */
export const GELIVER_LIMITS: Record<string, { maxDesi: number; maxKg: number }> = {
  hepsijet: { maxDesi: 40, maxKg: 20 },
  kolaygelsin: { maxDesi: 100, maxKg: 30 },
}

// ---------------------------------------------------------------------------------------------------------------
// Navlungo (KDV ve EPH dahil)

export type NavlungoRate = {
  carrierId: string
  /** [üst sınır desi (dahil), fiyat ₺]; sıralı */
  brackets?: readonly (readonly [number, number])[]
  /** Son basamaktan sonra her ek desi (yoksa bu desinin üstü taşınmaz / fiyat verilmez) */
  perDesiOver?: number
  /** Desi basamakları tam sayı aralığı mı (PTT: 1–2, 3–4 …); öyleyse desi yukarı yuvarlanır */
  integerDesi?: boolean
  /** Toplam desi başına tek fiyat (hepsiJET XL) */
  flatPerDesi?: number
  minDesi?: number
  /** Paket başına en fazla kg */
  maxKg?: number
  /** 100 desiyi aşan tek parça için parça başı ağır taşıma bedeli; tanımsızsa ağır parça taşınmaz */
  heavyPerPiece?: number
  /** Ağır parça sınırı yok (toplam desiyle fiyatlanır) */
  heavyFree?: boolean
}

export const NAVLUNGO_RATES: readonly NavlungoRate[] = [
  {
    carrierId: 'aras',
    brackets: [[2.1, 119], [3.1, 129], [4.1, 157], [5.1, 169], [6.1, 199], [7.1, 215], [10.1, 227], [12.1, 259], [15.1, 289], [16.1, 299], [17.1, 339], [20.1, 349], [25.1, 399], [30.1, 479]],
    perDesiOver: 13,
    heavyPerPiece: 5610,
  },
  {
    carrierId: 'hepsijet',
    brackets: [[2.1, 109], [4.1, 110], [10.1, 155], [20.1, 233], [30.1, 315], [40.1, 420]],
    maxKg: 25,
  },
  { carrierId: 'hepsijet-xl', flatPerDesi: 21, minDesi: 42, heavyFree: true },
  {
    carrierId: 'surat',
    brackets: [[3.1, 127], [5.1, 161], [10.1, 205], [11.1, 266], [12.1, 287], [13.1, 303], [14.1, 311], [15.1, 319], [16.1, 363], [17.1, 370], [18.1, 377], [19.1, 384], [20.1, 390], [21.1, 403], [22.1, 419], [23.1, 438], [24.1, 457], [25.1, 476], [26.1, 495], [27.1, 514], [28.1, 533], [29.1, 552], [30.1, 571]],
    perDesiOver: 15,
    heavyPerPiece: 5940,
  },
  {
    carrierId: 'yurtici',
    brackets: [[1.1, 175], [3.1, 219], [5.1, 252], [10.1, 327], [15.1, 447], [20.1, 535], [25.1, 665], [30.1, 738]],
    perDesiOver: 18,
    heavyPerPiece: 7062,
  },
  {
    carrierId: 'kolaygelsin',
    brackets: [[3.1, 150], [6.1, 176], [10.1, 213], [20.1, 313], [30.1, 489]],
    perDesiOver: 14,
  },
  {
    carrierId: 'ptt',
    brackets: [[2, 99], [4, 106], [5, 120], [10, 149], [15, 225], [20, 299], [25, 349], [30, 399]],
    integerDesi: true,
    heavyPerPiece: 4700,
  },
]

/** Tek parçanın "ağır" sayıldığı sınır (bu değeri aşan) */
export const HEAVY_PIECE_DESI = 100
export const HEAVY_PIECE_KG = 100
