export const dynamic = 'force-dynamic'

import { NextRequest, NextResponse } from 'next/server'
import { checkAdmin } from '@/lib/adminAuth'
import { prisma } from '@/lib/prisma'

/** İşlem kaydı: son 300 kayıt; ?q= ile kişi, işlem, yol veya ayrıntı içinde arama */
export async function GET(request: NextRequest) {
  const auth = await checkAdmin(request)
  if (!('ok' in auth)) return NextResponse.json({ success: false, error: auth.error }, { status: auth.status })
  const q = request.nextUrl.searchParams.get('q')?.trim()
  const logs = await prisma.adminAuditLog.findMany({
    where: q
      ? { OR: [{ actor: { contains: q } }, { action: { contains: q } }, { path: { contains: q } }, { details: { contains: q } }] }
      : undefined,
    orderBy: { createdAt: 'desc' },
    take: 300,
  })
  return NextResponse.json({ success: true, logs })
}
