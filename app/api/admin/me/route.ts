export const dynamic = 'force-dynamic'

import { NextRequest, NextResponse } from 'next/server'
import { checkAdmin } from '@/lib/adminAuth'
import { ADMIN_PAGE_API, ADMIN_ROLES, canAccess } from '@/lib/admin-users'
import { prisma } from '@/lib/prisma'

/** Oturumdaki yönetici: ad, rol, menüde görebileceği sayfalar, 2FA durumu */
export async function GET(request: NextRequest) {
  const auth = await checkAdmin(request)
  if (!('ok' in auth)) return NextResponse.json({ success: false, error: auth.error }, { status: auth.status })
  const { actor } = auth
  const user = actor.userId
    ? await prisma.adminUser.findUnique({ where: { id: actor.userId }, select: { totpEnabled: true } })
    : null
  const pages = Object.entries(ADMIN_PAGE_API)
    .filter(([, api]) => canAccess(actor.role, api, 'GET'))
    .map(([page]) => page)
  return NextResponse.json({
    success: true,
    user: {
      name: actor.name,
      email: actor.email,
      role: actor.role,
      roleLabel: ADMIN_ROLES[actor.role].label,
      isMaster: actor.userId === null,
      totpEnabled: Boolean(user?.totpEnabled),
      mustChangePassword: actor.mustChangePassword,
    },
    pages,
  })
}
