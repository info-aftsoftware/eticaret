'use client'

/**
 * Dile duyarlı gezinme (vitrin): next/link ve next/navigation yerine bunlar kullanılır. İngilizce sayfada site içi
 * adreslere /en öneki eklenir; usePathname öneksiz yolu döner (menüde etkin sayfa, sayfa kontrolleri dilden bağımsız).
 * Yönetim paneli dile göre ayrılmadığı için doğrudan next/link kullanır.
 */
import React from 'react'
import NextLink from 'next/link'
import { usePathname as useNextPathname, useRouter as useNextRouter } from 'next/navigation'
import { useLocale } from 'next-intl'
import { localizePath, stripLocale, toSiteLocale, type SiteLocale } from '@/lib/i18n/locale-path'

type NextLinkProps = React.ComponentProps<typeof NextLink>

function localizeHref(href: NextLinkProps['href'], locale: SiteLocale): NextLinkProps['href'] {
  if (typeof href === 'string') return localizePath(href, locale)
  if (href && typeof href === 'object' && typeof href.pathname === 'string') return { ...href, pathname: localizePath(href.pathname, locale) }
  return href
}

/**
 * Sayfanın dili. Dil sağlayıcısının dışında çizilen yerlerde (ör. dynamicParams=false rotalarının 404'ü) useLocale
 * hata verir; o zaman dil adresten okunur.
 */
function useSiteLocale(): SiteLocale {
  const pathname = useNextPathname()
  try {
    return toSiteLocale(useLocale())
  } catch {
    return stripLocale(pathname ?? '/').locale
  }
}

/** next/link ile aynı; href ziyaretçinin dilinde (/en öneki) */
const Link = React.forwardRef<HTMLAnchorElement, NextLinkProps>(function Link({ href, ...rest }, ref) {
  const locale = useSiteLocale()
  return <NextLink ref={ref} href={localizeHref(href, locale)} {...rest} />
})
export default Link

/** Geçerli dildeki adres (ör. window.location, paylaşım bağlantısı için) */
export function useLocalizedHref() {
  const locale = useSiteLocale()
  return React.useCallback((href: string) => localizePath(href, locale), [locale])
}

/** next/navigation useRouter; push/replace/prefetch adresleri dile göre */
export function useRouter(): ReturnType<typeof useNextRouter> {
  const router = useNextRouter()
  const to = useLocalizedHref()
  return React.useMemo(
    () => ({
      ...router,
      push: (href, options) => router.push(to(href), options),
      replace: (href, options) => router.replace(to(href), options),
      prefetch: (href, options) => router.prefetch(to(href), options),
    }),
    [router, to]
  )
}

/** Dil öneki olmadan geçerli yol: /en/products → /products */
export function usePathname(): string {
  const pathname = useNextPathname()
  return pathname ? stripLocale(pathname).path : pathname
}
