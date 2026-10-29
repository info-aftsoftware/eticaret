/**
 * Dil adresleri: Türkçe kökte (/products), İngilizce /en önekiyle (/en/products). Dil adresten okunur; aynı sayfa iki
 * adreste iki dilde sunulur, arama motorları ikisini ayrı dizinler (hreflang: lib/i18n/alternates.ts).
 * API, yönetim paneli ve dosyalar dile göre ayrılmaz (önek almaz). İstemci ve sunucu ortak; bağımlılık yok.
 */

export type SiteLocale = 'tr' | 'en'
export const DEFAULT_LOCALE: SiteLocale = 'tr'
export const EN_PREFIX = '/en'

/** Dil öneki almayan yollar: API, yönetim paneli, Next iç dosyaları, medya ve tek dosyalar (robots.txt, llms.txt…) */
const UNLOCALIZED = /^\/(api|admin|_next|media|feed|og|images|onizleme)(\/|$)/

export function isLocalizablePath(path: string): boolean {
  if (!path.startsWith('/') || path.startsWith('//')) return false
  if (UNLOCALIZED.test(path)) return false
  // Uzantılı tek dosya (/favicon.ico, /llms.txt, /sitemap.xml)
  const first = path.split(/[?#]/)[0].split('/')[1] ?? ''
  return !first.includes('.')
}

/** /en/products?x → { locale: 'en', path: '/products?x' }; önek yoksa Türkçe */
export function stripLocale(pathname: string): { locale: SiteLocale; path: string } {
  if (pathname === EN_PREFIX || pathname.startsWith(`${EN_PREFIX}/`) || pathname.startsWith(`${EN_PREFIX}?`) || pathname.startsWith(`${EN_PREFIX}#`)) {
    const rest = pathname.slice(EN_PREFIX.length)
    return { locale: 'en', path: rest.startsWith('/') ? rest : `/${rest}` }
  }
  return { locale: 'tr', path: pathname }
}

/**
 * Site içi adresi dile göre yazar: İngilizcede /en öneki eklenir (zaten varsa dokunulmaz), Türkçede öneki kaldırır.
 * Dış adres, API, panel ve dosya adresleri olduğu gibi döner.
 */
export function localizePath(href: string, locale: SiteLocale): string {
  if (!href.startsWith('/') || href.startsWith('//')) return href
  const { path } = stripLocale(href)
  if (locale !== 'en' || !isLocalizablePath(path)) return path
  if (path === '/') return EN_PREFIX
  if (path.startsWith('/?') || path.startsWith('/#')) return `${EN_PREFIX}${path.slice(1)}`
  return `${EN_PREFIX}${path}`
}

export const toSiteLocale = (v: string | null | undefined): SiteLocale => (v === 'en' ? 'en' : 'tr')
