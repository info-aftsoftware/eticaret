export const dynamic = 'force-dynamic'

import { NextRequest, NextResponse } from 'next/server'
import QRCode from 'qrcode'
import { checkAdmin, logAdminAction } from '@/lib/adminAuth'
import { newTotpSecret, otpauthUrl } from '@/lib/admin-users'
import { verifyTotp } from '@/lib/totp'
import { prisma } from '@/lib/prisma'
import { getClientIp } from '@/lib/rate-limit'

/**
 * Kişiye özel iki adımlı doğrulama.
 * POST: yeni anahtar üretir (henüz açılmaz), QR kodu döner. PUT { code }: kodu doğrulayıp açar. DELETE { code }: kapatır.
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

const codeOf = async (request: NextRequest) => {
  const body = await request.json().catch(() => ({}))
  return typeof body?.code === 'string' ? body.code.trim() : ''
}

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
  const code = await codeOf(request)
  if (!r.user.totpSecret || !verifyTotp(r.user.totpSecret, code)) {
    return NextResponse.json(
      { success: false, error: 'Kod hatalı veya süresi dolmuş. Uygulamadaki güncel kodu girin.' },
      { status: 400 }
    )
  }
  await prisma.adminUser.update({ where: { id: r.user.id }, data: { totpEnabled: true } })
  void logAdminAction(r.actor, 'İki adımlı doğrulama açıldı', { ip: getClientIp(request) })
  return NextResponse.json({ success: true })
}

export async function DELETE(request: NextRequest) {
  const r = await self(request)
  if ('res' in r) return r.res
  const code = await codeOf(request)
  if (!r.user.totpEnabled || !r.user.totpSecret || !verifyTotp(r.user.totpSecret, code)) {
    return NextResponse.json({ success: false, error: 'Kapatmak için uygulamadaki güncel kodu girin.' }, { status: 400 })
  }
  await prisma.adminUser.update({ where: { id: r.user.id }, data: { totpEnabled: false, totpSecret: null } })
  void logAdminAction(r.actor, 'İki adımlı doğrulama kapatıldı', { ip: getClientIp(request) })
  return NextResponse.json({ success: true })
}
