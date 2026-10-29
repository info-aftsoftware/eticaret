import { NextResponse } from 'next/server'
import type { NextRequest } from 'next/server'
import * as jose from 'jose'
import { LEGACY_CATEGORY_REDIRECTS } from '@/lib/categories'
import { isLocalizablePath, localizePath, stripLocale } from '@/lib/i18n/locale-path'

const JWT_SECRET = process.env.JWT_SECRET
const LOCALE_COOKIE = 'NEXT_LOCALE'

export async function middleware(request: NextRequest) {
  const { pathname, search } = request.nextUrl
  // Dil adresten: /en/... İngilizce, diğerleri Türkçe (lib/i18n/locale-path.ts)
  const { locale, path } = stripLocale(pathname)

  // /en/api, /en/admin, /en/robots.txt gibi dile göre ayrılmayan adresler öneksiz adrese
  if (locale === 'en' && !isLocalizablePath(path)) {
    return NextResponse.redirect(new URL(path + search, request.url), 308)
  }

  // Pass pathname to Server Components via request header (used by IntlProvider)
  const requestHeaders = new Headers(request.headers)
  requestHeaders.set('x-pathname', path)

  // Eski kategori adresleri: sunucuda kalıcı yönlendirme (sayfa içi redirect() akış başladıktan sonra istemcide kalıyordu)
  if (path.startsWith('/category/')) {
    const slug = path.slice('/category/'.length).replace(/\/$/, '')
    if (slug in LEGACY_CATEGORY_REDIRECTS) {
      const target = LEGACY_CATEGORY_REDIRECTS[slug]
      return NextResponse.redirect(new URL(localizePath(target ? `/category/${target}` : '/products', locale), request.url), 308)
    }
  }

  if (path.startsWith('/admin')) {
    if (path === '/admin/auth') {
      return NextResponse.next({ request: { headers: requestHeaders } })
    }

    const sessionCookie = request.cookies.get('admin_session')?.value
    if (!sessionCookie) {
      return NextResponse.redirect(new URL('/admin/auth', request.url))
    }

    if (!JWT_SECRET) {
      return NextResponse.redirect(new URL('/admin/auth', request.url))
    }

    try {
      const secret = new TextEncoder().encode(JWT_SECRET)
      const { payload } = await jose.jwtVerify(sessionCookie, secret, { algorithms: ['HS256'] })
      if (payload.admin === true && payload.sub) {
        return NextResponse.next({ request: { headers: requestHeaders } })
      }
    } catch (_err) {
      // JWT geçersiz veya süresi dolmuş — login sayfasına yönlendir
    }
    return NextResponse.redirect(new URL('/admin/auth', request.url))
  }

  // API ve dosyalar dile göre ayrılmaz; dili sayfanın bıraktığı çerezden okurlar (i18n/request.ts)
  if (!isLocalizablePath(path)) {
    return NextResponse.next({ request: { headers: requestHeaders } })
  }

  // Sayfa: dil başlığı sunucu bileşenlerine (i18n/request.ts), /en/... aynı sayfaya önek olmadan yeniden yazılır
  requestHeaders.set('x-locale', locale)
  const response =
    locale === 'en'
      ? NextResponse.rewrite(new URL(path + search, request.url), { request: { headers: requestHeaders } })
      : NextResponse.next({ request: { headers: requestHeaders } })
  // Sayfanın dili çereze yazılır: sayfadan yapılan API çağrıları (arama, sipariş e-postası) aynı dilde yanıt verir
  if (request.cookies.get(LOCALE_COOKIE)?.value !== locale) {
    response.cookies.set(LOCALE_COOKIE, locale, { path: '/', sameSite: 'lax' })
  }
  return response
}

export const config = {
  // Run on all routes except Next.js internals and static assets
  matcher: ['/((?!_next/static|_next/image|favicon\\.ico|.*\\.(?:svg|png|jpg|jpeg|gif|webp)$).*)'],
}
