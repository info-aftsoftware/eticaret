export const dynamic = 'force-dynamic'

/**
 * Ürün grubuna toplu fiyat değişikliği (zam)
 * POST { percent, apply?: boolean } — apply olmadan önizleme (ürün bazında eski → yeni), apply: true ile uygular.
 * Dövize bağlı üründe döviz fiyatı, sabit TL üründe TL fiyatı değişir; varyant fiyatları birlikte; teklifli ürünler atlanır.
 */
import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import { checkAdmin, logAdminAction } from '@/lib/adminAuth'
import { priceChangeError } from '@/lib/product-groups'
import { applyPriceChange, priceChangePlan } from '@/lib/product-groups-admin'
import { revalidateStorefront } from '@/lib/storefront-revalidate'

export async function POST(request: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const auth = await checkAdmin(request)
  if ('error' in auth) return NextResponse.json({ error: auth.error }, { status: auth.status })
  const { id } = await params
  const group = await prisma.productGroup.findUnique({ where: { id } })
  if (!group) return NextResponse.json({ error: 'Grup bulunamadı' }, { status: 404 })
  const body = await request.json().catch(() => ({}))
  const error = priceChangeError(body.percent)
  if (error) return NextResponse.json({ error }, { status: 400 })
  const percent = Number(body.percent)
  if (body.apply !== true) return NextResponse.json({ applied: false, ...(await priceChangePlan(group, percent)) })
  const { rows, changes } = await applyPriceChange(group, percent)
  revalidateStorefront()
  void logAdminAction(auth.actor, `Ürün grubu toplu fiyat değişikliği (%${percent > 0 ? '+' : ''}${percent})`, {
    method: 'POST',
    path: '/admin/urun-gruplari',
    objectType: 'product',
    changes,
    details: `${group.name}: ${changes.length} ürün, %${percent > 0 ? '+' : ''}${percent}`,
  })
  return NextResponse.json({ applied: true, changed: changes.length, rows })
}
