export const dynamic = 'force-dynamic'

import { NextRequest, NextResponse } from 'next/server'
import { checkAdmin, logAdminAction } from '@/lib/adminAuth'
import { ADMIN_ROLES, hashPassword, isAdminRole, temporaryPassword } from '@/lib/admin-users'
import { adminUserView } from '@/lib/admin-user-view'
import { prisma } from '@/lib/prisma'

/**
 * Kullanıcı güncelleme (yalnızca Sahip): { role } | { active } | { resetPassword: true } | { resetTwoFactor: true }.
 * Kişi kendi rolünü değiştiremez, kendini pasifleştiremez; son aktif Sahip korunur.
 */
export async function PATCH(request: NextRequest, props: { params: Promise<{ id: string }> }) {
  const auth = await checkAdmin(request)
  if (!('ok' in auth)) return NextResponse.json({ success: false, error: auth.error }, { status: auth.status })
  const { id } = await props.params
  const user = await prisma.adminUser.findUnique({ where: { id } })
  if (!user) return NextResponse.json({ success: false, error: 'Kullanıcı bulunamadı.' }, { status: 404 })
  const body = await request.json().catch(() => ({}))
  const self = auth.actor.userId === id
  const isLastOwner = async () =>
    user.role === 'owner' && user.active && (await prisma.adminUser.count({ where: { role: 'owner', active: true } })) <= 1
  const fail = (error: string) => NextResponse.json({ success: false, error }, { status: 400 })

  if (body?.role !== undefined) {
    if (!isAdminRole(body.role)) return fail('Geçersiz rol.')
    if (self) return fail('Kendi rolünüzü değiştiremezsiniz.')
    if (body.role !== 'owner' && (await isLastOwner())) return fail('Son aktif Sahip\'in rolü değiştirilemez.')
    const u = await prisma.adminUser.update({ where: { id }, data: { role: body.role } })
    void logAdminAction(auth.actor, 'Rol değiştirildi', { details: `${u.email}: ${ADMIN_ROLES[body.role as keyof typeof ADMIN_ROLES].label}` })
    return NextResponse.json({ success: true, user: adminUserView(u) })
  }
  if (typeof body?.active === 'boolean') {
    if (self) return fail('Kendi hesabınızı pasifleştiremezsiniz.')
    if (!body.active && (await isLastOwner())) return fail('Son aktif Sahip pasifleştirilemez.')
    const u = await prisma.adminUser.update({ where: { id }, data: { active: body.active } })
    void logAdminAction(auth.actor, body.active ? 'Kullanıcı etkinleştirildi' : 'Kullanıcı pasifleştirildi', { details: u.email })
    return NextResponse.json({ success: true, user: adminUserView(u) })
  }
  if (body?.resetPassword === true) {
    const password = temporaryPassword()
    const u = await prisma.adminUser.update({
      where: { id },
      data: { passwordHash: hashPassword(password), mustChangePassword: true },
    })
    void logAdminAction(auth.actor, 'Şifre sıfırlandı', { details: u.email })
    return NextResponse.json({ success: true, user: adminUserView(u), temporaryPassword: password })
  }
  if (body?.resetTwoFactor === true) {
    const u = await prisma.adminUser.update({ where: { id }, data: { totpEnabled: false, totpSecret: null } })
    void logAdminAction(auth.actor, 'İki adımlı doğrulama sıfırlandı', { details: u.email })
    return NextResponse.json({ success: true, user: adminUserView(u) })
  }
  return fail('Geçersiz istek.')
}
