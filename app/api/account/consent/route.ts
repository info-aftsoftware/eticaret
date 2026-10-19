export const dynamic = 'force-dynamic'

import { NextRequest, NextResponse } from 'next/server'
import { verifyFirebaseIdToken } from '@/lib/firebase-id-token'
import { getMarketingConsent, setMarketingConsent, type ConsentSource } from '@/lib/marketing-consent'
import { getClientIp, isRateLimited } from '@/lib/rate-limit'

/**
 * Üyenin ticari ileti izni. Authorization: Bearer <Firebase ID token>.
 * GET → { accepted: boolean | null } · POST { accepted, source: 'kayit' | 'hesap' } → kaydeder (tarihli kayıt tutulur)
 */
async function member(request: NextRequest) {
  const token = request.headers.get('authorization')?.replace(/^Bearer\s+/i, '')
  return token ? verifyFirebaseIdToken(token) : null
}

export async function GET(request: NextRequest) {
  const user = await member(request)
  if (!user) return NextResponse.json({ success: false, error: 'Giriş yapmanız gerekiyor.' }, { status: 401 })
  const accepted = await getMarketingConsent({ userId: user.uid, email: user.email })
  return NextResponse.json({ success: true, accepted })
}

export async function POST(request: NextRequest) {
  if (isRateLimited(request, 'consent', 20, 10 * 60_000)) {
    return NextResponse.json({ success: false, error: 'Çok fazla istek.' }, { status: 429 })
  }
  const user = await member(request)
  if (!user?.email) return NextResponse.json({ success: false, error: 'Giriş yapmanız gerekiyor.' }, { status: 401 })
  const body = await request.json().catch(() => ({}))
  if (typeof body?.accepted !== 'boolean') return NextResponse.json({ success: false, error: 'Geçersiz istek.' }, { status: 400 })
  const source: ConsentSource = body?.source === 'kayit' ? 'kayit' : 'hesap'
  await setMarketingConsent({
    email: user.email,
    userId: user.uid,
    name: user.name ?? null,
    accepted: body.accepted,
    source,
    ip: getClientIp(request),
    userAgent: request.headers.get('user-agent'),
  })
  return NextResponse.json({ success: true, accepted: body.accepted })
}
