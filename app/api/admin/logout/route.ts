export const dynamic = 'force-dynamic'

/**
 * Admin çıkışı: admin_session cookie'sini siler ve oturum sürümünü artırır (kişisel hesap ya da ana şifre);
 * kopyalanmış bir çerez de çıkıştan sonra çalışmaz (aynı hesabın diğer cihazlardaki oturumları da kapanır).
 */

import { NextRequest, NextResponse } from 'next/server'
import { revokeAdminSession } from '@/lib/adminAuth'

export async function POST(request: NextRequest) {
  await revokeAdminSession(request).catch(() => null)
  const response = NextResponse.json({ success: true })
  response.cookies.set('admin_session', '', {
    httpOnly: true,
    secure: process.env.NODE_ENV === 'production',
    sameSite: 'strict',
    maxAge: 0,
    path: '/',
  })
  return response
}
