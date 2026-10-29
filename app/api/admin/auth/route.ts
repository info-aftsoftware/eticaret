export const dynamic = 'force-dynamic'

import { NextRequest, NextResponse } from 'next/server'
import crypto from 'crypto'
import { isRateLimited } from '@/lib/rate-limit'
import { totpStep } from '@/lib/totp'
import { masterLoginPolicy } from '@/lib/admin-2fa-policy'
import { prisma } from '@/lib/prisma'
import { verifyPassword } from '@/lib/admin-users'
import { logAdminAction, MASTER_SESSION_SUB, masterSessionVersion, setAdminSessionCookie, type AdminActor } from '@/lib/adminAuth'
import { getClientIp } from '@/lib/rate-limit'

const ADMIN_TOKEN = process.env.ADMIN_TOKEN
const JWT_SECRET = process.env.JWT_SECRET
/** Tanımlıysa şifreye ek olarak doğrulama uygulaması kodu istenir (iki adımlı doğrulama) */
const ADMIN_TOTP_SECRET = process.env.ADMIN_TOTP_SECRET

/**
 * IP'den bağımsız hesap kilidi: istek sınırı IP başlığına dayanır ve vekil sunucu bu başlığı ezmiyorsa taklit
 * edilebilir. Bir hesaba (e-posta ya da ana şifre) 15 dakikada 20 hatalı şifre/kod gelirse yalnız o hesabın girişi
 * 15 dakika kapanır; eskiden kilit site geneliydi ve herkes tüm yöneticileri dışarıda bırakabiliyordu.
 */
const TARGET_FAIL_LIMIT = 20
const TARGET_FAIL_WINDOW_MS = 15 * 60_000
const failuresByTarget = new Map<string, number[]>()
function targetLocked(target: string, now: number): boolean {
  const list = (failuresByTarget.get(target) ?? []).filter((t) => now - t <= TARGET_FAIL_WINDOW_MS)
  if (list.length) failuresByTarget.set(target, list)
  else failuresByTarget.delete(target)
  return list.length >= TARGET_FAIL_LIMIT
}
function recordFailure(target: string, now: number) {
  if (failuresByTarget.size > 5_000) {
    // Süresi dolanlar, yetmezse en eskiler silinir (hepsini silmek toplu denemeyle kilitleri sıfırlatırdı)
    for (const [k, list] of failuresByTarget) if (now - list[list.length - 1] > TARGET_FAIL_WINDOW_MS) failuresByTarget.delete(k)
    for (const k of failuresByTarget.keys()) {
      if (failuresByTarget.size <= 4_000) break
      if (k !== 'master') failuresByTarget.delete(k)
    }
  }
  failuresByTarget.set(target, [...(failuresByTarget.get(target) ?? []), now])
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
    const body = await request.json()
    const email = typeof body?.email === 'string' ? body.email.trim().toLocaleLowerCase('tr').slice(0, 254) : ''
    // Kişisel hesabı olmayan bir e-postayla ana yönetici şifresi girilirse ana şifre girişi sayılır
    // (e-posta alanını boş bırakmak gerektiğini bilmeyen yönetici "E-posta veya şifre hatalı" görmesin)
    const emailUser = email ? await prisma.adminUser.findUnique({ where: { email } }) : null
    // Kilit hedefi: kayıtlı hesap ya da ana şifre. Var olmayan e-postayla yapılan her deneme ana şifreye sayılır;
    // yoksa her istekte yeni e-posta uydurarak ana şifre kilitsiz denenebilirdi
    const target = emailUser ? `user:${emailUser.id}` : 'master'
    if (targetLocked(target, now)) {
      return NextResponse.json(
        { success: false, error: 'Çok fazla hatalı deneme. Lütfen 15 dakika sonra tekrar deneyin.' },
        { status: 429 }
      )
    }
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
    let sessionPayload: { sub: string; uid?: string; sv?: number }

    const masterLogin = !email || (!emailUser && Boolean(ADMIN_TOKEN) && safeEqual(password, ADMIN_TOKEN as string))

    if (!masterLogin) {
      // Kişisel hesapla giriş: e-posta + şifre (+ hesapta açıksa doğrulama kodu)
      const user = emailUser
      // Kullanıcı yoksa da şifre özeti hesaplanır: yanıt süresinden hesabın varlığı anlaşılmasın
      const passwordOk = user ? verifyPassword(password, user.passwordHash) : (verifyPassword(password, DUMMY_HASH), false)
      if (!user || !user.active || !passwordOk) {
        recordFailure(target, now)
        if (user) void logAdminAction(null, 'Başarısız giriş', { ip, details: email })
        return NextResponse.json({ success: false, error: 'E-posta veya şifre hatalı.' }, { status: 401 })
      }
      if (user.totpEnabled && user.totpSecret) {
        if (!otp) {
          return NextResponse.json({ success: false, requiresOtp: true, error: 'Doğrulama uygulamasındaki 6 haneli kodu girin.' }, { status: 401 })
        }
        // Yanlış veya daha önce kullanılmış kod reddedilir (A12); adım koşullu yazılır, aynı kodla eşzamanlı iki giriş tek kabul
        const step = totpStep(user.totpSecret, otp, now, 1, user.totpLastStep)
        const claimed = step === null ? 0 : (await prisma.adminUser.updateMany({ where: { id: user.id, OR: [{ totpLastStep: null }, { totpLastStep: { lt: step } }] }, data: { totpLastStep: step } })).count
        if (!claimed) {
          recordFailure(target, now)
          void logAdminAction(null, 'Başarısız giriş', { ip, details: `${email}: doğrulama kodu hatalı veya tekrar kullanıldı` })
          return NextResponse.json({ success: false, requiresOtp: true, error: 'Doğrulama kodu hatalı, süresi dolmuş veya daha önce kullanılmış.' }, { status: 401 })
        }
      }
      await prisma.adminUser.update({ where: { id: user.id }, data: { lastLoginAt: new Date() } })
      actor = { userId: user.id, role: user.role as AdminActor['role'], name: user.name, email: user.email, mustChangePassword: user.mustChangePassword }
      sessionPayload = { sub: user.id, uid: user.id, sv: user.sessionVersion }
    } else {
      // Ana yönetici şifresi (ADMIN_TOKEN): acil durum girişi, "Sahip" yetkisiyle; işlem kaydına yazılır
      if (!ADMIN_TOKEN) {
        return NextResponse.json({ success: false, error: 'E-posta adresinizi girin.' }, { status: 400 })
      }
      if (!safeEqual(password, ADMIN_TOKEN)) {
        recordFailure(target, now)
        return NextResponse.json({ success: false, error: 'Şifre hatalı.' }, { status: 401 })
      }
      // Ana şifre, kişisel hesaplardaki iki adımlı doğrulamayı aşan bir yol olmasın (A12, lib/admin-2fa-policy.ts)
      const policy = masterLoginPolicy({
        mode: process.env.ADMIN_MASTER_LOGIN,
        hasMasterTotp: Boolean(ADMIN_TOTP_SECRET),
        ownersWith2fa: await prisma.adminUser.count({ where: { active: true, role: 'owner', totpEnabled: true } }),
      })
      if (!policy.allowed) {
        void logAdminAction(null, 'Başarısız giriş', { ip, details: 'Ana yönetici şifresi: giriş kuralı engelledi' })
        return NextResponse.json({ success: false, error: policy.reason }, { status: 403 })
      }
      if (ADMIN_TOTP_SECRET) {
        if (!otp) {
          return NextResponse.json({ success: false, requiresOtp: true, error: 'Doğrulama uygulamasındaki 6 haneli kodu girin.' }, { status: 401 })
        }
        // Kullanılan adım veritabanında tutulur (Sequence "adminMasterTotpStep"): aynı kod ikinci kez kabul edilmez
        const last = await prisma.sequence.findUnique({ where: { name: 'adminMasterTotpStep' } })
        const step = totpStep(ADMIN_TOTP_SECRET, otp, now, 1, last?.value ?? null)
        let claimed = 0
        if (step !== null) {
          claimed = last
            ? (await prisma.sequence.updateMany({ where: { name: 'adminMasterTotpStep', value: { lt: step } }, data: { value: step } })).count
            : await prisma.sequence.create({ data: { name: 'adminMasterTotpStep', value: step } }).then(() => 1, () => 0)
        }
        if (!claimed) {
          recordFailure(target, now)
          void logAdminAction(null, 'Başarısız giriş', { ip, details: 'Ana yönetici şifresi: doğrulama kodu hatalı veya tekrar kullanıldı' })
          return NextResponse.json({ success: false, requiresOtp: true, error: 'Doğrulama kodu hatalı, süresi dolmuş veya daha önce kullanılmış.' }, { status: 401 })
        }
      }
      actor = { userId: null, role: 'owner', name: 'Ana yönetici şifresi', email: null, mustChangePassword: false }
      sessionPayload = { sub: MASTER_SESSION_SUB, sv: await masterSessionVersion() }
    }

    void logAdminAction(actor, 'Giriş', { ip })
    // Panel Firestore'u istemciden okumuyor; eskiden verilen ortak Firebase kimliği (admin-panel-user) rol
    // ayrımını aşıp tüm müşteri verisine erişim veriyordu, artık üretilmiyor (veri yalnız yetkili API uçlarından)
    const response = NextResponse.json({ success: true, mustChangePassword: actor.mustChangePassword })
    setAdminSessionCookie(response, sessionPayload)
    return response
  } catch (err: any) {
    console.error('Admin auth error:', err)
    return NextResponse.json({ success: false, error: 'Giriş başarısız.' }, { status: 500 })
  }
}
