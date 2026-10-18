import { useLocale } from 'next-intl'

/**
 * Sabit arayüz metinleri için iki dilli kısayol: L('Türkçe', 'English').
 * messages/*.json anahtarına değmeyecek kısa, tek yerde kullanılan metinler içindir
 * (çok yerde tekrarlanan metinler için useTranslations ve JSON anahtarı tercih edilir).
 */
const pickTr = (tr: string, _en: string) => tr
const pickEn = (_tr: string, en: string) => en

/** Sabit kimlikli seçici döner (her render'da yeni fonksiyon oluşmaz) */
export function useL(): (tr: string, en: string) => string {
  return useLocale() === 'en' ? pickEn : pickTr
}
