/**
 * Sunucu bileşenleri için dil yardımcıları: geçerli istek dilindeki site içi adres (yönlendirme, yapılandırılmış veri).
 */
import { getLocale } from 'next-intl/server'
import { localizePath, toSiteLocale, type SiteLocale } from '@/lib/i18n/locale-path'

export async function requestLocale(): Promise<SiteLocale> {
  return toSiteLocale(await getLocale().catch(() => 'tr'))
}

/** Geçerli istek dilinde site içi adres: İngilizce sayfada /en önekli */
export async function localHref(path: string): Promise<string> {
  return localizePath(path, await requestLocale())
}
