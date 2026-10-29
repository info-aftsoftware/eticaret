export const dynamic = 'force-dynamic'

import { NextRequest, NextResponse } from 'next/server'
import QRCode from 'qrcode'
import { bumpAdminSessions, checkAdmin, logAdminAction, setAdminSessionCookie } from '@/lib/adminAuth'
import { newTotpSecret, otpauthUrl, verifyPassword } from '@/lib/admin-users'
import { totpStep } from '@/lib/totp'
import { prisma } from '@/lib/prisma'
import { getClientIp, isRateLimited } from '@/lib/rate-limit'

/**
 * Kişiye özel iki adımlı doğrulama.
 * POST: yeni anahtar üretir (henüz açılmaz), QR kodu döner. PUT { code, currentPassword }: kodu doğrulayıp açar.
 * DELETE { code, currentPassword }: kapatır. Mevcut şifre: çalınmış bir oturumla 2FA'yı saldırganın uygulamasına
 * bağlayıp hesap sahibini dışarıda bırakmak mümkün olmasın (29.10.2026 kararı).
 */
async function self(request: NextRequest) {
  const auth = await checkAdmin(request)
  if (!('ok' in auth)) return { res: NextResponse.json({ success: false, error: auth.error }, { status: auth.status }) }
  if (!auth.actor.userId) {
    return { res: NextResponse.json({ success: false, error: 'Kişisel bir hesapla giriş yapın.' }, { status: 400 }) }
  }
  const user = await prisma.adminUser.findUnique({ where: { id: auth.actor.userId } })
  if (!user) return { res: NextResponse.json({ success: false, error: 'Hesap bulunamadı.' }, { status: 404 }) }
  return { user, actor: auth.actor }
}

/** Kod doğru ve daha önce kullanılmamışsa adımı kaydeder (aynı kod ikinci kez kabul edilmez) */
async function claimCode(user: { id: string; totpLastStep: number | null }, secret: string, code: string): Promise<boolean> {
  const step = totpStep(secret, code, Date.now(), 1, user.totpLastStep)
  if (step === null) return false
  const r = await prisma.adminUser.updateMany({
    where: { id: user.id, OR: [{ totpLastStep: null }, { totpLastStep: { lt: step } }] },
    data: { totpLastStep: step },
  })
  return r.count > 0
}

/** Diğer oturumlar düşer, bu cihaz yeni oturumla devam eder */
async function renewSession(userId: string) {
  const sv = await bumpAdminSessions(userId)
  const response = NextResponse.json({ success: true })
  setAdminSessionCookie(response, { sub: userId, uid: userId, sv })
  return response
}

const tooMany = () => NextResponse.json({ success: false, error: 'Çok fazla deneme. 15 dakika sonra tekrar deneyin.' }, { status: 429 })

const inputOf = async (request: NextRequest) => {
  const body = await request.json().catch(() => ({}))
  return {
    code: typeof body?.code === 'string' ? body.code.trim() : '',
    password: typeof body?.currentPassword === 'string' ? body.currentPassword : '',
  }
}

const wrongPassword = () => NextResponse.json({ success: false, error: 'Mevcut şifre hatalı.' }, { status: 400 })

export async function POST(request: NextRequest) {
  const r = await self(request)
  if ('res' in r) return r.res
  if (r.user.totpEnabled) {
    return NextResponse.json({ success: false, error: 'İki adımlı doğrulama zaten açık.' }, { status: 400 })
  }
  const secret = newTotpSecret()
  await prisma.adminUser.update({ where: { id: r.user.id }, data: { totpSecret: secret, totpEnabled: false } })
  const url = otpauthUrl(secret, r.user.email)
  const qr = await QRCode.toDataURL(url, { margin: 1, width: 220 })
  return NextResponse.json({ success: true, secret, otpauthUrl: url, qr })
}

export async function PUT(request: NextRequest) {
  const r = await self(request)
  if ('res' in r) return r.res
  if (isRateLimited(request, `admin-2fa:${r.user.id}`, 5, 15 * 60_000)) return tooMany()
  const { code, password } = await inputOf(request)
  if (!verifyPassword(password, r.user.passwordHash)) return wrongPassword()
  if (!r.user.totpSecret || !(await claimCode(r.user, r.user.totpSecret, code))) {
    return NextResponse.json(
      { success: false, error: 'Kod hatalı veya süresi dolmuş. Uygulamadaki güncel kodu girin.' },
      { status: 400 }
    )
  }
  await prisma.adminUser.update({ where: { id: r.user.id }, data: { totpEnabled: true } })
  void logAdminAction(r.actor, 'İki adımlı doğrulama açıldı', { ip: getClientIp(request) })
  return renewSession(r.user.id)
}

export async function DELETE(request: NextRequest) {
  const r = await self(request)
  if ('res' in r) return r.res
  if (isRateLimited(request, `admin-2fa:${r.user.id}`, 5, 15 * 60_000)) return tooMany()
  const { code, password } = await inputOf(request)
  if (!verifyPassword(password, r.user.passwordHash)) return wrongPassword()
  if (!r.user.totpEnabled || !r.user.totpSecret || !(await claimCode(r.user, r.user.totpSecret, code))) {
    return NextResponse.json({ success: false, error: 'Kapatmak için uygulamadaki güncel kodu girin.' }, { status: 400 })
  }
  await prisma.adminUser.update({ where: { id: r.user.id }, data: { totpEnabled: false, totpSecret: null } })
  void logAdminAction(r.actor, 'İki adımlı doğrulama kapatıldı', { ip: getClientIp(request) })
  return renewSession(r.user.id)
}
