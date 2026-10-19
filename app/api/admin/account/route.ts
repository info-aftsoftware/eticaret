export const dynamic = 'force-dynamic'

import { NextRequest, NextResponse } from 'next/server'
import { checkAdmin, logAdminAction } from '@/lib/adminAuth'
import { hashPassword, passwordProblem, verifyPassword } from '@/lib/admin-users'
import { prisma } from '@/lib/prisma'
import { getClientIp, isRateLimited } from '@/lib/rate-limit'

/** Kendi şifresini değiştirme (mevcut şifre zorunlu) */
export async function POST(request: NextRequest) {
  const auth = await checkAdmin(request)
  if (!('ok' in auth)) return NextResponse.json({ success: false, error: auth.error }, { status: auth.status })
  const { actor } = auth
  if (!actor.userId) {
    return NextResponse.json(
      { success: false, error: 'Ana yönetici şifresi burada değiştirilemez; kişisel bir hesapla giriş yapın.' },
      { status: 400 }
    )
  }
  if (isRateLimited(request, 'admin-password', 5, 15 * 60_000)) {
    return NextResponse.json({ success: false, error: 'Çok fazla deneme. 15 dakika sonra tekrar deneyin.' }, { status: 429 })
  }
  const body = await request.json().catch(() => ({}))
  const current = typeof body?.currentPassword === 'string' ? body.currentPassword : ''
  const next = typeof body?.newPassword === 'string' ? body.newPassword : ''
  const user = await prisma.adminUser.findUnique({ where: { id: actor.userId } })
  if (!user || !verifyPassword(current, user.passwordHash)) {
    return NextResponse.json({ success: false, error: 'Mevcut şifre hatalı.' }, { status: 400 })
  }
  const problem = passwordProblem(next)
  if (problem) return NextResponse.json({ success: false, error: problem }, { status: 400 })
  if (verifyPassword(next, user.passwordHash)) {
    return NextResponse.json({ success: false, error: 'Yeni şifre eskisiyle aynı olamaz.' }, { status: 400 })
  }
  await prisma.adminUser.update({
    where: { id: user.id },
    data: { passwordHash: hashPassword(next), mustChangePassword: false },
  })
  void logAdminAction(actor, 'Şifre değiştirildi', { ip: getClientIp(request) })
  return NextResponse.json({ success: true })
}
