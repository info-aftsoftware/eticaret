/**
 * GES (Güneş Enerjisi Santrali) ortak sabitler – hesaplama ve teklif sayfalarında kullanılır.
 */

/** Türkiye bölgeleri ve ortalama günlük peak güneşlenme saati (kWh/kWp/gün) */
export const GES_REGIONS: { id: string; sunHours: number }[] = [
  { id: 'akdeniz', sunHours: 5.5 },
  { id: 'ege', sunHours: 5.3 },
  { id: 'guneydogu', sunHours: 5.4 },
  { id: 'icanadolu', sunHours: 4.8 },
  { id: 'marmara', sunHours: 4.2 },
  { id: 'karadeniz', sunHours: 3.9 },
  { id: 'doguanadolu', sunHours: 4.7 },
]

/**
 * Anahtar teslim GES TL/kWp bandı (KDV hariç, Ekim 2026). Katalogdan türetildi:
 * panel ≈ 16.700 TL/kWp + on-grid inverter ≈ 3.200 TL/kW + konstrüksiyon/kablo/koruma ≈ 4–6 bin + işçilik/proje ≈ 3–5 bin.
 * Fiyat listesi değişince güncelleyin (hibrit/akülü sistemler bu bandın üstündedir).
 */
export const GES_PRICE_PER_KWP_MIN = 27_000
export const GES_PRICE_PER_KWP_MAX = 40_000

/** Elektrik birim fiyatı (TL/kWh, vergiler dahil; mesken–ticarethane bandı, Ekim 2026) – yıllık tasarruf hesabı için */
export const ELECTRICITY_PRICE_TL_PER_KWH_MIN = 3.8
export const ELECTRICITY_PRICE_TL_PER_KWH_MAX = 5.2

/** Hesaplama çıktısı için aralık katsayıları (min/max) */
export const GES_KWP_RANGE_FACTOR_MIN = 0.85
export const GES_KWP_RANGE_FACTOR_MAX = 1.15

/** Tipik panel gücü aralığı (Wp) – sayısal tutarlılık kontrolü */
export const PANEL_WP_TYPICAL_MIN = 250
export const PANEL_WP_TYPICAL_MAX = 450
export const PANEL_WP_LARGE_MAX = 550

/** Performans oranı (PR) varsayılan */
export const GES_DEFAULT_PR = 0.82

/** Hesaplama sayfası için aralıklar */
export const MONTHLY_KWH_MIN = 50
export const MONTHLY_KWH_MAX = 5000
export const SUN_HOURS_MIN = 2.5
export const SUN_HOURS_MAX = 7
export const PR_MIN = 0.5
export const PR_MAX = 1

export function getSunHoursByRegionId(regionId: string): number | undefined {
  return GES_REGIONS.find((r) => r.id === regionId)?.sunHours
}
