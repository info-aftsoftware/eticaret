/**
 * Sayfanın dil eşleri (hreflang) ve dilindeki canonical: Türkçe sayfa kendi adresini, İngilizce sayfa /en adresini
 * canonical verir; ikisi de birbirini tr / en olarak, Türkçeyi x-default olarak gösterir.
 */
import type { Metadata } from 'next'
import { localizePath, type SiteLocale } from '@/lib/i18n/locale-path'

const SITE_URL = (process.env.NEXT_PUBLIC_SITE_URL || process.env.NEXT_PUBLIC_BASE_URL || 'https://voltekno.com').replace(/\/$/, '')

/** "/faq" ya da "https://voltekno.com/faq" → "/faq"; site dışı adres null */
function sitePath(url: string): string | null {
  if (url.startsWith('/')) return url
  try {
    const u = new URL(url)
    const site = new URL(SITE_URL)
    return u.hostname.replace(/^www\./, '') === site.hostname.replace(/^www\./, '') ? u.pathname + u.search : null
  } catch {
    return null
  }
}

/** canonical (göreli ya da mutlak) → bu dilin canonical'ı ve dil eşleri; adres biçimi korunur */
export function localeAlternates(canonical: string, locale: SiteLocale): NonNullable<Metadata['alternates']> {
  const path = sitePath(canonical)
  if (!path) return { canonical }
  const absolute = !canonical.startsWith('/')
  const fmt = (p: string) => (absolute ? `${SITE_URL}${p === '/' ? '' : p}` || SITE_URL : p)
  const tr = localizePath(path, 'tr')
  const en = localizePath(path, 'en')
  return {
    canonical: fmt(locale === 'en' ? en : tr),
    languages: { tr: fmt(tr), en: fmt(en), 'x-default': fmt(tr) },
  }
}

/**
 * Yapılandırılmış verideki (JSON-LD) site adreslerini bu dile çevirir: İngilizce sayfada ürün, teklif ve kırıntı
 * adresleri /en önekli olur; görsel, medya ve dosya adresleri ile site dışı adresler değişmez.
 */
export function localizeSiteUrls<T>(data: T, locale: SiteLocale): T {
  if (locale !== 'en') return data
  const walk = (v: unknown): unknown => {
    if (typeof v === 'string') {
      if (!v.startsWith(SITE_URL)) return v
      const path = v.slice(SITE_URL.length) || '/'
      return path.startsWith('/') ? `${SITE_URL}${localizePath(path, 'en')}` : v
    }
    if (Array.isArray(v)) return v.map(walk)
    if (v && typeof v === 'object') return Object.fromEntries(Object.entries(v).map(([k, x]) => [k, walk(x)]))
    return v
  }
  return walk(data) as T
}

/** Meta verideki canonical, dil eşleri ve paylaşım adresi bu dile göre */
export function withLocaleAlternates(m: Metadata, locale: SiteLocale): Metadata {
  const canonical = m.alternates?.canonical
  if (typeof canonical !== 'string') return m
  const alternates = { ...m.alternates, ...localeAlternates(canonical, locale) }
  const ogUrl = m.openGraph?.url
  const openGraph =
    m.openGraph && typeof ogUrl === 'string' && sitePath(ogUrl) !== null
      ? { ...m.openGraph, url: ogUrl.startsWith('/') ? localizePath(ogUrl, locale) : `${SITE_URL}${localizePath(sitePath(ogUrl)!, locale)}` }
      : m.openGraph
  return { ...m, alternates, ...(openGraph && { openGraph }) }
}
