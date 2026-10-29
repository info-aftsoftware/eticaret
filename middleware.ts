import { NextResponse } from 'next/server'
import type { NextRequest } from 'next/server'
import * as jose from 'jose'
import { LEGACY_CATEGORY_REDIRECTS } from '@/lib/categories'

const JWT_SECRET = process.env.JWT_SECRET

export async function middleware(request: NextRequest) {
  const { pathname } = request.nextUrl

  // Pass pathname to Server Components via request header (used by IntlProvider)
  const requestHeaders = new Headers(request.headers)
  requestHeaders.set('x-pathname', pathname)

  // Eski kategori adresleri: sunucuda kalıcı yönlendirme (sayfa içi redirect() akış başladıktan sonra istemcide kalıyordu)
  if (pathname.startsWith('/category/')) {
    const slug = pathname.slice('/category/'.length).replace(/\/$/, '')
    if (slug in LEGACY_CATEGORY_REDIRECTS) {
      const target = LEGACY_CATEGORY_REDIRECTS[slug]
      return NextResponse.redirect(new URL(target ? `/category/${target}` : '/products', request.url), 308)
    }
  }

  if (pathname.startsWith('/admin')) {
    if (pathname === '/admin/auth') {
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

  return NextResponse.next({ request: { headers: requestHeaders } })
}

export const config = {
  // Run on all routes except Next.js internals and static assets
  matcher: ['/((?!_next/static|_next/image|favicon\\.ico|.*\\.(?:svg|png|jpg|jpeg|gif|webp)$).*)'],
}
