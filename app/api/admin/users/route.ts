export const dynamic = 'force-dynamic'

import { NextRequest, NextResponse } from 'next/server'
import { checkAdmin, logAdminAction } from '@/lib/adminAuth'
import { ADMIN_ROLES, hashPassword, isAdminRole, temporaryPassword } from '@/lib/admin-users'
import { adminUserView } from '@/lib/admin-user-view'
import { prisma } from '@/lib/prisma'

import { EMAIL_RE } from '@/lib/checkout-validation'

/** Yönetim kullanıcıları (yalnızca Sahip) */
export async function GET(request: NextRequest) {
  const auth = await checkAdmin(request)
  if (!('ok' in auth)) return NextResponse.json({ success: false, error: auth.error }, { status: auth.status })
  const users = await prisma.adminUser.findMany({ orderBy: [{ active: 'desc' }, { createdAt: 'asc' }] })
  return NextResponse.json({
    success: true,
    users: users.map(adminUserView),
    roles: Object.entries(ADMIN_ROLES).map(([value, r]) => ({ value, ...r })),
  })
}

/** Yeni kullanıcı: geçici şifre yalnızca bu yanıtta döner, ilk girişte değiştirilmesi zorunludur */
export async function POST(request: NextRequest) {
  const auth = await checkAdmin(request)
  if (!('ok' in auth)) return NextResponse.json({ success: false, error: auth.error }, { status: auth.status })
  const body = await request.json().catch(() => ({}))
  const email = typeof body?.email === 'string' ? body.email.trim().toLocaleLowerCase('tr') : ''
  const name = typeof body?.name === 'string' ? body.name.trim() : ''
  const role = body?.role
  if (!EMAIL_RE.test(email)) return NextResponse.json({ success: false, error: 'Geçerli bir e-posta girin.' }, { status: 400 })
  if (name.length < 2) return NextResponse.json({ success: false, error: 'Ad soyad girin.' }, { status: 400 })
  if (!isAdminRole(role)) return NextResponse.json({ success: false, error: 'Geçersiz rol.' }, { status: 400 })
  if (await prisma.adminUser.findUnique({ where: { email } })) {
    return NextResponse.json({ success: false, error: 'Bu e-postayla bir kullanıcı zaten var.' }, { status: 409 })
  }
  const password = temporaryPassword()
  const user = await prisma.adminUser.create({
    data: { email, name, role, passwordHash: hashPassword(password), mustChangePassword: true },
  })
  void logAdminAction(auth.actor, 'Kullanıcı eklendi', { details: `${name} <${email}> · ${ADMIN_ROLES[role].label}` })
  return NextResponse.json({ success: true, user: adminUserView(user), temporaryPassword: password })
}
