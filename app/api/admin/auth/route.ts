export const dynamic = 'force-dynamic'

import { NextRequest, NextResponse } from 'next/server'
import jwt from 'jsonwebtoken'
import crypto from 'crypto'
import { isRateLimited } from '@/lib/rate-limit'
import { verifyTotp } from '@/lib/totp'
import { getAdminAuth, isFirebaseAdminConfigured } from '@/lib/firebaseAdminServer'

const ADMIN_TOKEN = process.env.ADMIN_TOKEN
const JWT_SECRET = process.env.JWT_SECRET
const SESSION_MAX_AGE = 60 * 60 * 24 * 7 // 7 gün
const ADMIN_UID = 'admin-panel-user'
/** Tanımlıysa şifreye ek olarak doğrulama uygulaması kodu istenir (iki adımlı doğrulama) */
const ADMIN_TOTP_SECRET = process.env.ADMIN_TOTP_SECRET

/**
 * IP'den bağımsız genel kilit: istek sınırı IP başlığına dayanır ve vekil sunucu bu başlığı ezmiyorsa taklit
 * edilebilir. Tüm istemcilerden 15 dakikada 20 hatalı şifre/kod gelirse giriş 15 dakika kapanır.
 */
const GLOBAL_FAIL_LIMIT = 20
const GLOBAL_FAIL_WINDOW_MS = 15 * 60_000
const globalFailures: number[] = []
function globalLocked(now: number): boolean {
  while (globalFailures.length && now - globalFailures[0] > GLOBAL_FAIL_WINDOW_MS) globalFailures.shift()
  return globalFailures.length >= GLOBAL_FAIL_LIMIT
}
function recordFailure(now: number) {
  globalFailures.push(now)
}

/** Sabit zamanlı karşılaştırma (zamanlama saldırısına karşı). */
function safeEqual(a: string, b: string): boolean {
  const ha = crypto.createHash('sha256').update(a).digest()
  const hb = crypto.createHash('sha256').update(b).digest()
  return crypto.timingSafeEqual(ha, hb)
}

export async function POST(request: NextRequest) {
  try {
    // Kaba kuvvet denemelerine karşı: IP başına 15 dakikada en fazla 5 deneme
    if (isRateLimited(request, 'admin-auth', 5, 15 * 60_000)) {
      return NextResponse.json(
        { success: false, error: 'Çok fazla deneme. Lütfen 15 dakika sonra tekrar deneyin.' },
        { status: 429 }
      )
    }

    const now = Date.now()
    if (globalLocked(now)) {
      return NextResponse.json(
        { success: false, error: 'Çok fazla hatalı deneme. Lütfen 15 dakika sonra tekrar deneyin.' },
        { status: 429 }
      )
    }

    const body = await request.json()
    const password = typeof body?.password === 'string' ? body.password.trim() : ''

    if (!password) {
      return NextResponse.json({ success: false, error: 'Şifre gerekli.' }, { status: 400 })
    }

    if (!ADMIN_TOKEN || !JWT_SECRET) {
      return NextResponse.json({ success: false, error: 'Sunucu yapılandırma hatası.' }, { status: 503 })
    }

    if (!safeEqual(password, ADMIN_TOKEN)) {
      recordFailure(now)
      return NextResponse.json({ success: false, error: 'Şifre hatalı.' }, { status: 401 })
    }

    if (ADMIN_TOTP_SECRET) {
      const otp = typeof body?.otp === 'string' ? body.otp.trim() : ''
      if (!otp) {
        return NextResponse.json({ success: false, requiresOtp: true, error: 'Doğrulama uygulamasındaki 6 haneli kodu girin.' }, { status: 401 })
      }
      if (!verifyTotp(ADMIN_TOTP_SECRET, otp)) {
        recordFailure(now)
        return NextResponse.json({ success: false, requiresOtp: true, error: 'Doğrulama kodu hatalı veya süresi dolmuş.' }, { status: 401 })
      }
    }

    const sessionToken = jwt.sign(
      { sub: 'admin', admin: true },
      JWT_SECRET,
      { expiresIn: SESSION_MAX_AGE }
    )

    // Firebase custom token oluştur (Firestore client okumalarında kullanılır)
    let firebaseCustomToken: string | null = null
    if (isFirebaseAdminConfigured()) {
      const auth = getAdminAuth()
      if (auth) {
        try {
          firebaseCustomToken = await auth.createCustomToken(ADMIN_UID, { admin: true })
        } catch {}
      }
    }

    const response = NextResponse.json({ success: true, firebaseCustomToken })
    response.cookies.set('admin_session', sessionToken, {
      httpOnly: true,
      secure: process.env.NODE_ENV === 'production',
      sameSite: 'strict',
      maxAge: SESSION_MAX_AGE,
      path: '/',
    })
    return response
  } catch (err: any) {
    console.error('Admin auth error:', err)
    return NextResponse.json({ success: false, error: 'Giriş başarısız.' }, { status: 500 })
  }
}
