/**
 * Ürün grubu yönetim işlemleri (panel API'leri ortak kullanır): üyeler, toplu fiyat değişikliği ve silme etkisi.
 */
import { Prisma } from '@prisma/client'
import { prisma } from '@/lib/prisma'
import { getMergedProducts, type MergedProduct } from '@/lib/catalog-merge'
import { mockProducts } from '@/lib/products-mock'
import { groupMembers, groupRules, planPriceChange, type PriceChangeRow } from '@/lib/product-groups'
import type { FieldChange } from '@/lib/audit-diff'

type GroupRow = { id: string; name: string; productIds: unknown; brands: unknown; categories: unknown; salesActive: boolean }

const catalogIds = new Set(mockProducts.map((p) => p.id))

export async function groupMembersOf(group: GroupRow, products?: MergedProduct[]): Promise<MergedProduct[]> {
  return groupMembers(groupRules(group), products ?? (await getMergedProducts()))
}

/** Grup satırı + üye sayısı ve kapsam özeti (liste ekranı) */
export function groupView(group: GroupRow & { createdAt?: Date; updatedAt?: Date }, members: MergedProduct[], discounts: number) {
  const rules = groupRules(group)
  return {
    id: group.id,
    name: group.name,
    ...rules,
    salesActive: group.salesActive,
    memberCount: members.length,
    panelProductCount: members.filter((m) => !catalogIds.has(m.id)).length,
    discountCount: discounts,
    updatedAt: group.updatedAt?.toISOString() ?? null,
  }
}

/** Toplu fiyat değişikliği planı (önizleme ve uygulama aynı plan) */
export async function priceChangePlan(group: GroupRow, percent: number) {
  const members = await groupMembersOf(group)
  return planPriceChange(members, percent)
}

/** Planı uygular: dövize bağlıda döviz fiyatı, sabit TL'de TL fiyatı; varyant fiyatları birlikte. İşlem kaydı için değişiklikler döner */
export async function applyPriceChange(group: GroupRow, percent: number): Promise<{ rows: PriceChangeRow[]; changes: FieldChange[] }> {
  const members = await groupMembersOf(group)
  const byId = new Map(members.map((m) => [m.id, m]))
  const plan = planPriceChange(members, percent)
  const writes: Prisma.PrismaPromise<unknown>[] = []
  const changes: FieldChange[] = []
  for (const r of plan.rows) {
    if (r.skipped) continue
    const p = byId.get(r.id)!
    const variants = p.variants?.length
      ? p.variants.map((v) => {
          const vr = r.variants.find((x) => x.key === v.key)
          const { stock: _s, ...rest } = v
          if (!vr || !(vr.from > 0)) return rest
          return r.mode === 'fx' ? { ...rest, basePrice: vr.to } : { ...rest, price: vr.to }
        })
      : undefined
    const data: Record<string, unknown> =
      r.mode === 'fx' ? { basePrice: r.to, priceMode: 'fx' } : { price: r.to }
    if (variants) data.variants = variants as unknown as Prisma.InputJsonValue
    writes.push(prisma.productOverride.upsert({ where: { productId: r.id }, update: data, create: { productId: r.id, ...data } }))
    changes.push({ field: `${r.mode === 'fx' ? 'basePrice' : 'price'}.${r.id}`, label: `${r.name} (${r.currency})`, from: String(r.from), to: String(r.to) })
  }
  // Tek işlemde: yarıda kalan toplu zam olmasın
  if (writes.length) await prisma.$transaction(writes)
  return { rows: plan.rows, changes }
}

/** Silme etkisi: kalıcı silinecek panel ürünleri, satışa kapatılacak katalog ürünleri, silinecek kampanyalar */
export async function deletionImpact(group: GroupRow) {
  const members = await groupMembersOf(group)
  const panel = members.filter((m) => !catalogIds.has(m.id))
  const catalog = members.filter((m) => catalogIds.has(m.id))
  const discounts = await prisma.discount.findMany({ where: { groupId: group.id }, select: { id: true, name: true } })
  return {
    panelProducts: panel.map((p) => ({ id: p.id, name: p.name })),
    catalogProducts: catalog.length,
    discounts: discounts.map((d) => d.name),
  }
}

/** Grubu siler: kampanyaları ve panel ürünlerini siler, katalog ürünlerini satışa kapatır (geri alınamaz) */
export async function deleteGroup(group: GroupRow) {
  const members = await groupMembersOf(group)
  const panel = members.filter((m) => !catalogIds.has(m.id)).map((m) => m.id)
  const catalog = members.filter((m) => catalogIds.has(m.id)).map((m) => m.id)
  await prisma.$transaction([
    prisma.discount.deleteMany({ where: { groupId: group.id } }),
    prisma.productOverride.deleteMany({ where: { productId: { in: panel } } }),
    prisma.stockOverride.deleteMany({ where: { OR: [{ productId: { in: panel } }, ...panel.map((id) => ({ productId: { startsWith: `${id}::` } }))] } }),
    ...catalog.map((id) => prisma.productOverride.upsert({ where: { productId: id }, update: { salesClosed: true }, create: { productId: id, salesClosed: true } })),
    prisma.productGroup.delete({ where: { id: group.id } }),
  ])
  return { deletedProducts: panel, closedProducts: catalog.length }
}
