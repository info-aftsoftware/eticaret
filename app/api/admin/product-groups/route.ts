export const dynamic = 'force-dynamic'

/**
 * Ürün grupları
 * GET: gruplar (üye sayısı, kampanya sayısı, satış durumu) + seçim için marka/kategori listesi
 * POST: { name, productIds?, brands?, categories? } yeni grup
 */
import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import { checkAdmin, logAdminAction } from '@/lib/adminAuth'
import { getMergedProducts } from '@/lib/catalog-merge'
import { groupMembers, groupRules, groupRulesError } from '@/lib/product-groups'
import { groupView } from '@/lib/product-groups-admin'

export async function GET(request: NextRequest) {
  const auth = await checkAdmin(request)
  if ('error' in auth) return NextResponse.json({ error: auth.error }, { status: auth.status })
  const [groups, products, discountCounts] = await Promise.all([
    prisma.productGroup.findMany({ orderBy: { createdAt: 'desc' } }),
    getMergedProducts(),
    prisma.discount.groupBy({ by: ['groupId'], where: { groupId: { not: null } }, _count: { _all: true } }),
  ])
  const counts = new Map(discountCounts.map((d) => [d.groupId, d._count._all]))
  return NextResponse.json({
    groups: groups.map((g) => groupView(g, groupMembers(groupRules(g), products), counts.get(g.id) ?? 0)),
    brands: [...new Set(products.map((p) => p.brand).filter(Boolean) as string[])].sort((a, b) => a.localeCompare(b, 'tr')),
    categories: [...new Set(products.map((p) => p.category).filter(Boolean))].sort((a, b) => a.localeCompare(b, 'tr')),
  })
}

export async function POST(request: NextRequest) {
  const auth = await checkAdmin(request)
  if ('error' in auth) return NextResponse.json({ error: auth.error }, { status: auth.status })
  const body = await request.json().catch(() => ({}))
  const rules = groupRules(body)
  const error = groupRulesError(body.name, rules)
  if (error) return NextResponse.json({ error }, { status: 400 })
  const group = await prisma.productGroup.create({ data: { name: String(body.name).trim(), ...rules } })
  void logAdminAction(auth.actor, 'Ürün grubu oluşturuldu', {
    method: 'POST',
    path: '/admin/urun-gruplari',
    details: `${group.name}: ${rules.productIds.length} ürün, markalar: ${rules.brands.join(', ') || '—'}, kategoriler: ${rules.categories.join(', ') || '—'}`,
  })
  return NextResponse.json({ id: group.id })
}
