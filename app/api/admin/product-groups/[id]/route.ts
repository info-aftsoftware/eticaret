export const dynamic = 'force-dynamic'

/**
 * Tek ürün grubu
 * GET: grup, üyeleri (ad, marka, kategori, fiyat) ve silme etkisi
 * PATCH: { name?, productIds?, brands?, categories?, salesActive? } — salesActive false: gruptaki ürünler satışa kapalı
 * DELETE ?confirm=1: grubu ve kampanyalarını siler; gruptaki panel ürünlerini kalıcı siler, katalog ürünlerini satışa kapatır
 */
import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import { checkAdmin, logAdminAction } from '@/lib/adminAuth'
import { groupRules, groupRulesError } from '@/lib/product-groups'
import { deleteGroup, deletionImpact, groupMembersOf } from '@/lib/product-groups-admin'
import { invalidateProductGroupCache } from '@/lib/product-groups-db'
import { invalidateCampaignCache } from '@/lib/discounts'
import { revalidateStorefront } from '@/lib/storefront-revalidate'

type Ctx = { params: Promise<{ id: string }> }

export async function GET(request: NextRequest, { params }: Ctx) {
  const auth = await checkAdmin(request)
  if ('error' in auth) return NextResponse.json({ error: auth.error }, { status: auth.status })
  const { id } = await params
  const group = await prisma.productGroup.findUnique({ where: { id } })
  if (!group) return NextResponse.json({ error: 'Grup bulunamadı' }, { status: 404 })
  const members = await groupMembersOf(group)
  return NextResponse.json({
    id: group.id,
    name: group.name,
    ...groupRules(group),
    salesActive: group.salesActive,
    members: members.map((m) => ({ id: m.id, name: m.name, brand: m.brand ?? null, category: m.category, price: m.price, priceMode: m.priceMode ?? 'fixed', basePrice: m.basePrice ?? null, priceCurrency: m.priceCurrency ?? 'TRY' })),
    impact: await deletionImpact(group),
  })
}

export async function PATCH(request: NextRequest, { params }: Ctx) {
  const auth = await checkAdmin(request)
  if ('error' in auth) return NextResponse.json({ error: auth.error }, { status: auth.status })
  const { id } = await params
  const group = await prisma.productGroup.findUnique({ where: { id } })
  if (!group) return NextResponse.json({ error: 'Grup bulunamadı' }, { status: 404 })
  const body = await request.json().catch(() => ({}))
  const data: Record<string, unknown> = {}
  const notes: string[] = []
  if (body.name !== undefined || body.productIds !== undefined || body.brands !== undefined || body.categories !== undefined) {
    const current = groupRules(group)
    const rules = {
      productIds: body.productIds !== undefined ? groupRules({ productIds: body.productIds }).productIds : current.productIds,
      brands: body.brands !== undefined ? groupRules({ brands: body.brands }).brands : current.brands,
      categories: body.categories !== undefined ? groupRules({ categories: body.categories }).categories : current.categories,
    }
    const name = body.name !== undefined ? body.name : group.name
    const error = groupRulesError(name, rules)
    if (error) return NextResponse.json({ error }, { status: 400 })
    Object.assign(data, { name: String(name).trim(), ...rules })
    notes.push(`kapsam: ${rules.productIds.length} ürün, markalar: ${rules.brands.join(', ') || '—'}, kategoriler: ${rules.categories.join(', ') || '—'}`)
  }
  if (body.salesActive !== undefined) {
    data.salesActive = body.salesActive === true
    if (data.salesActive !== group.salesActive) notes.push(data.salesActive ? 'satışa açıldı' : 'satışa kapatıldı')
  }
  await prisma.productGroup.update({ where: { id }, data })
  invalidateProductGroupCache()
  invalidateCampaignCache()
  revalidateStorefront()
  if (notes.length) void logAdminAction(auth.actor, 'Ürün grubu güncellendi', { method: 'PATCH', path: '/admin/urun-gruplari', details: `${String(data.name ?? group.name)}: ${notes.join(' · ')}` })
  return NextResponse.json({ success: true })
}

export async function DELETE(request: NextRequest, { params }: Ctx) {
  const auth = await checkAdmin(request)
  if ('error' in auth) return NextResponse.json({ error: auth.error }, { status: auth.status })
  const { id } = await params
  const group = await prisma.productGroup.findUnique({ where: { id } })
  if (!group) return NextResponse.json({ error: 'Grup bulunamadı' }, { status: 404 })
  // Geri alınamaz işlem: istemci etkiyi gösterip açık onay göndermeli
  if (request.nextUrl.searchParams.get('confirm') !== '1') {
    return NextResponse.json({ error: 'Silme onayı gerekli.', impact: await deletionImpact(group) }, { status: 409 })
  }
  const r = await deleteGroup(group)
  invalidateProductGroupCache()
  invalidateCampaignCache()
  revalidateStorefront()
  void logAdminAction(auth.actor, 'Ürün grubu silindi', {
    method: 'DELETE',
    path: '/admin/urun-gruplari',
    details: `${group.name}: ${r.deletedProducts.length} panel ürünü silindi (${r.deletedProducts.join(', ') || '—'}), ${r.closedProducts} katalog ürünü satışa kapatıldı, grup kampanyaları silindi`,
  })
  return NextResponse.json({ success: true, ...r })
}
