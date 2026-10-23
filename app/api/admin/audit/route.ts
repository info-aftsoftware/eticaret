export const dynamic = 'force-dynamic'

import { NextRequest, NextResponse } from 'next/server'
import type { Prisma } from '@prisma/client'
import { checkAdmin } from '@/lib/adminAuth'
import { prisma } from '@/lib/prisma'
import { addDaysToKey, businessDayStartOf, isDateKey } from '@/lib/business-time'
import { AUDIT_RETENTION_DAYS } from '@/lib/audit-retention'

/**
 * İşlem kaydı (A09), sayfalı. Süzgeçler: q (kişi, işlem, yol, ayrıntı), object (ürün id'si / sipariş no),
 * type (product | order), from/to (YYYY-MM-DD, Türkiye günü), page, pageSize (≤100).
 * Ekran sayfa sayfa gösterir; kayıtlar AUDIT_RETENTION_DAYS gün saklanır (lib/audit-retention.ts).
 */
export async function GET(request: NextRequest) {
  const auth = await checkAdmin(request)
  if (!('ok' in auth)) return NextResponse.json({ success: false, error: auth.error }, { status: auth.status })
  const sp = request.nextUrl.searchParams
  const q = sp.get('q')?.trim()
  const object = sp.get('object')?.trim()
  const type = sp.get('type')
  const from = sp.get('from')
  const to = sp.get('to')
  if (isDateKey(from) && isDateKey(to) && from > to) {
    return NextResponse.json({ success: false, error: 'Başlangıç tarihi bitişten sonra olamaz.' }, { status: 400 })
  }
  const pageSize = Math.min(100, Math.max(10, Number(sp.get('pageSize')) || 50))
  const page = Math.max(1, Number(sp.get('page')) || 1)

  const and: Prisma.AdminAuditLogWhereInput[] = []
  if (q) and.push({ OR: [{ actor: { contains: q } }, { action: { contains: q } }, { path: { contains: q } }, { details: { contains: q } }] })
  if (object) and.push({ OR: [{ objectId: object }, { details: { contains: object } }] })
  if (type === 'product' || type === 'order') and.push({ objectType: type })
  if (isDateKey(from)) and.push({ createdAt: { gte: businessDayStartOf(from) } })
  if (isDateKey(to)) and.push({ createdAt: { lt: businessDayStartOf(addDaysToKey(to, 1)) } })
  const where: Prisma.AdminAuditLogWhereInput = and.length ? { AND: and } : {}

  const [total, logs] = await Promise.all([
    prisma.adminAuditLog.count({ where }),
    prisma.adminAuditLog.findMany({ where, orderBy: { createdAt: 'desc' }, skip: (page - 1) * pageSize, take: pageSize }),
  ])
  return NextResponse.json({ success: true, logs, total, page, pageSize, retentionDays: AUDIT_RETENTION_DAYS })
}
