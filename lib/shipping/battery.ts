/**
 * Akü ve batarya gönderim kısıtı (20.10.2026): kargo firmalarının akü/batarya taşıma kısıtları kontrol edilene kadar
 * bu ürünler sitede çevrim içi satılmaz; ürün sayfasında "kargo ve nakliye için iletişime geçin" kutusu gösterilir,
 * sepete eklenemez, sipariş sunucuda reddedilir, Google Merchant akışına girmez.
 *
 * Kategoriler içe aktarıcıdaki listeyle aynı olmalı (scripts/import-ikas-excel.py → BATTERY_CATEGORIES;
 * desi.json'daki 3. alan = 1). Kısıt kalkınca BATTERY_CONTACT_ONLY = false yapın.
 */
import { lineLogistics } from '@/lib/shipping/fee'

export const BATTERY_CONTACT_ONLY = true

export const BATTERY_CATEGORIES: readonly string[] = ['Lityum Akü', 'Jel Akü', 'Taşınabilir Güç İstasyonu']

export function isBatteryCategory(category: string | null | undefined): boolean {
  return Boolean(category) && BATTERY_CATEGORIES.includes(category as string)
}

/** Ürün (kategori bilgisiyle) iletişimle satılıyor mu */
export function isContactOnlyProduct(p: { category?: string | null } | null | undefined): boolean {
  return BATTERY_CONTACT_ONLY && isBatteryCategory(p?.category)
}

/** Sepet satırı (id = ürün id veya ürün-varyant) iletişimle satılıyor mu (desi.json akü işareti) */
export function isContactOnlyLine(lineId: string, productId?: string): boolean {
  return BATTERY_CONTACT_ONLY && Boolean(lineLogistics(lineId, productId).battery)
}

export const BATTERY_CONTACT_MESSAGE_TR =
  'Akü ve bataryalarda kargo ve nakliye için bizimle iletişime geçin.'
export const BATTERY_CONTACT_MESSAGE_EN =
  'For batteries, please contact us about shipping and delivery.'
