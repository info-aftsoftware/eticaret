export const dynamic = 'force-dynamic'

/**
 * Yönetim: iletişim formu mesajları (Prisma ContactMessage)
 * GET    — son 300 mesaj
 * PATCH  — { id, status: 'new' | 'read' | 'archived' }
 * DELETE — ?id=
 */

import { NextRequest, NextResponse } from 'next/server'
import { checkAdmin } from '@/lib/adminAuth'
import { prisma } from '@/lib/prisma'
import { getMergedProductById } from '@/lib/catalog-merge'

export async function GET(request: NextRequest) {
  const auth = await checkAdmin(request)
  if ('error' in auth) return NextResponse.json({ error: auth.error }, { status: auth.status })
  const rows = await prisma.contactMessage.findMany({ orderBy: { createdAt: 'desc' }, take: 300 })
  const names = new Map<string, string>()
  await Promise.all(
    [...new Set(rows.map((r) => r.productId).filter(Boolean) as string[])].map(async (id) => {
      const p = await getMergedProductById(id).catch(() => null)
      if (p) names.set(id, p.name)
    })
  )
  return NextResponse.json({
    messages: rows.map((r) => ({
      ...r,
      createdAt: r.createdAt.toISOString(),
      productName: (r.productId && names.get(r.productId)) || r.message.match(/\[Ürün: ([^\]]+)\]/)?.[1] || null,
    })),
  })
}

export async function PATCH(request: NextRequest) {
  const auth = await checkAdmin(request)
  if ('error' in auth) return NextResponse.json({ error: auth.error }, { status: auth.status })
  const body = await request.json().catch(() => ({}))
  if (!body?.id || !['new', 'read', 'archived'].includes(body?.status)) {
    return NextResponse.json({ error: 'id ve geçerli status gereklidir' }, { status: 400 })
  }
  await prisma.contactMessage.update({ where: { id: body.id }, data: { status: body.status } })
  return NextResponse.json({ success: true })
}

export async function DELETE(request: NextRequest) {
  const auth = await checkAdmin(request)
  if ('error' in auth) return NextResponse.json({ error: auth.error }, { status: auth.status })
  const id = request.nextUrl.searchParams.get('id')
  if (!id) return NextResponse.json({ error: 'id gereklidir' }, { status: 400 })
  await prisma.contactMessage.delete({ where: { id } })
  return NextResponse.json({ success: true })
}
