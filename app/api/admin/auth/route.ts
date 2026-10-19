export const dynamic = 'force-dynamic'

import { NextRequest, NextResponse } from 'next/server'
import jwt from 'jsonwebtoken'
import crypto from 'crypto'
import { isRateLimited } from '@/lib/rate-limit'
import { verifyTotp } from '@/lib/totp'
import { getAdminAuth, isFirebaseAdminConfigured } from '@/lib/firebaseAdminServer'
import { prisma } from '@/lib/prisma'
import { verifyPassword } from '@/lib/admin-users'
import { logAdminAction, MASTER_SESSION_SUB, type AdminActor } from '@/lib/adminAuth'
import { getClientIp } from '@/lib/rate-limit'

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

/** Var olmayan e-postada da aynı süre harcansın diye karşılaştırılan sahte özet */
const DUMMY_HASH = 'scrypt$16384$8$1$AAAAAAAAAAAAAAAAAAAAAA==$' + 'A'.repeat(86) + '=='

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
    const email = typeof body?.email === 'string' ? body.email.trim().toLocaleLowerCase('tr') : ''
    const password = typeof body?.password === 'string' ? body.password.trim() : ''
    const otp = typeof body?.otp === 'string' ? body.otp.trim() : ''
    const ip = getClientIp(request)

    if (!password) {
      return NextResponse.json({ success: false, error: 'Şifre gerekli.' }, { status: 400 })
    }
    if (!JWT_SECRET) {
      return NextResponse.json({ success: false, error: 'Sunucu yapılandırma hatası.' }, { status: 503 })
    }

    let actor: AdminActor
    let sessionPayload: { sub: string; admin: true; uid?: string }

    if (email) {
      // Kişisel hesapla giriş: e-posta + şifre (+ hesapta açıksa doğrulama kodu)
      const user = await prisma.adminUser.findUnique({ where: { email } })
      // Kullanıcı yoksa da şifre özeti hesaplanır: yanıt süresinden hesabın varlığı anlaşılmasın
      const passwordOk = user ? verifyPassword(password, user.passwordHash) : (verifyPassword(password, DUMMY_HASH), false)
      if (!user || !user.active || !passwordOk) {
        recordFailure(now)
        if (user) void logAdminAction(null, 'Başarısız giriş', { ip, details: email })
        return NextResponse.json({ success: false, error: 'E-posta veya şifre hatalı.' }, { status: 401 })
      }
      if (user.totpEnabled && user.totpSecret) {
        if (!otp) {
          return NextResponse.json({ success: false, requiresOtp: true, error: 'Doğrulama uygulamasındaki 6 haneli kodu girin.' }, { status: 401 })
        }
        if (!verifyTotp(user.totpSecret, otp)) {
          recordFailure(now)
          return NextResponse.json({ success: false, requiresOtp: true, error: 'Doğrulama kodu hatalı veya süresi dolmuş.' }, { status: 401 })
        }
      }
      await prisma.adminUser.update({ where: { id: user.id }, data: { lastLoginAt: new Date() } })
      actor = { userId: user.id, role: user.role as AdminActor['role'], name: user.name, email: user.email, mustChangePassword: user.mustChangePassword }
      sessionPayload = { sub: user.id, uid: user.id, admin: true }
    } else {
      // Ana yönetici şifresi (ADMIN_TOKEN): acil durum girişi, "Sahip" yetkisiyle; işlem kaydına yazılır
      if (!ADMIN_TOKEN) {
        return NextResponse.json({ success: false, error: 'E-posta adresinizi girin.' }, { status: 400 })
      }
      if (!safeEqual(password, ADMIN_TOKEN)) {
        recordFailure(now)
        return NextResponse.json({ success: false, error: 'Şifre hatalı.' }, { status: 401 })
      }
      if (ADMIN_TOTP_SECRET) {
        if (!otp) {
          return NextResponse.json({ success: false, requiresOtp: true, error: 'Doğrulama uygulamasındaki 6 haneli kodu girin.' }, { status: 401 })
        }
        if (!verifyTotp(ADMIN_TOTP_SECRET, otp)) {
          recordFailure(now)
          return NextResponse.json({ success: false, requiresOtp: true, error: 'Doğrulama kodu hatalı veya süresi dolmuş.' }, { status: 401 })
        }
      }
      actor = { userId: null, role: 'owner', name: 'Ana yönetici şifresi', email: null, mustChangePassword: false }
      sessionPayload = { sub: MASTER_SESSION_SUB, admin: true }
    }

    void logAdminAction(actor, 'Giriş', { ip })
    const sessionToken = jwt.sign(sessionPayload, JWT_SECRET, { expiresIn: SESSION_MAX_AGE })

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

    const response = NextResponse.json({ success: true, firebaseCustomToken, mustChangePassword: actor.mustChangePassword })
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
