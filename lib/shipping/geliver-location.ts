/**
 * Sipariş adresindeki il/ilçe → Geliver il plaka kodu ve ilçe kimliği.
 * Tablo scripts/build-geliver-districts.mjs ile Geliver'in /cities ve /districts uçlarından üretilir
 * (sitenin il/ilçe listesindeki 81 il ve 973 ilçenin hepsi eşleşiyor).
 */
import geliverDistricts from '@/lib/shipping/geliver-districts.json'

const DISTRICTS = geliverDistricts as Record<string, { code: string; districts: Record<string, number> }>
// Şapkalı harfler denk sayılır (Elâzığ = Elazığ)
const fold = (s: string) => s.trim().toLocaleLowerCase('tr').replace(/â/g, 'a').replace(/î/g, 'i').replace(/û/g, 'u')

export function geliverLocation(city: string, district: string): { cityCode: string; districtID: number } | null {
  const cityKey = Object.keys(DISTRICTS).find((c) => fold(c) === fold(city))
  if (!cityKey) return null
  const c = DISTRICTS[cityKey]
  const districtKey = Object.keys(c.districts).find((d) => fold(d) === fold(district))
  return districtKey ? { cityCode: c.code, districtID: c.districts[districtKey] } : null
}
