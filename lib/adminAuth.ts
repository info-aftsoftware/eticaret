import { NextRequest } from 'next/server'
import jwt from 'jsonwebtoken'
import { prisma } from '@/lib/prisma'

const JWT_SECRET = process.env.JWT_SECRET ?? ''

/** Admin session cookie (Firebase doğrulama sonrası set edilen JWT) geçerli mi? */
export function verifyAdminCookie(request: NextRequest): boolean {
  const sessionCookie = request.cookies.get('admin_session')?.value
  if (!sessionCookie) return false
  try {
    const decoded = jwt.verify(sessionCookie, JWT_SECRET) as { sub?: string; admin?: boolean }
    return decoded.admin === true && Boolean(decoded.sub)
  } catch {
    return false
  }
}

/** Eski token tabanlı doğrulama (artık kullanılmıyor; geriye dönük uyumluluk için bırakılabilir) */
export function verifyAdminToken(request: NextRequest): boolean {
  const token = request.headers.get('authorization')?.replace('Bearer ', '') ||
                request.nextUrl?.searchParams?.get('token')
  if (!token) return false
  try {
    const decoded = jwt.verify(token, JWT_SECRET) as { userId?: string; role?: string }
    return decoded.role === 'admin'
  } catch {
    return false
  }
}

export function getAdminTokenFromRequest(request: NextRequest): string | null {
  return request.headers.get('authorization')?.replace('Bearer ', '') ||
         request.nextUrl?.searchParams?.get('token')
}

export type CheckAdminResult =
  | { ok: true; userId?: string }
  | { error: string; status: number }

/**
 * Admin yetkisi: önce admin_session cookie (Firebase ile doğrulanmış), sonra Bearer JWT (rol Prisma'dan doğrulanır).
 */
export async function checkAdmin(request: NextRequest): Promise<CheckAdminResult> {
  if (verifyAdminCookie(request)) {
    return { ok: true }
  }
  const token = request.headers.get('authorization')?.replace('Bearer ', '')
  if (token) {
    try {
      const decoded = jwt.verify(token, JWT_SECRET) as { userId: string; role?: string }
      const user = await prisma.user.findUnique({ where: { id: decoded.userId } })
      if (user && user.role === 'admin') return { ok: true, userId: user.id }
    } catch {
      // ignore
    }
  }
  return { error: 'Unauthorized', status: 401 }
}

export function requireAdminAuth(handler: Function) {
  return async (request: NextRequest, ...args: any[]) => {
    if (!verifyAdminCookie(request)) {
      return new Response(
        JSON.stringify({ success: false, error: 'Unauthorized' }),
        { status: 401, headers: { 'Content-Type': 'application/json' } }
      )
    }
    return handler(request, ...args)
  }
}
