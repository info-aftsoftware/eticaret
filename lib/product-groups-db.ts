/**
 * Ürün gruplarının veritabanı tarafı: satışa kapalı ürünlerin bulunması (vitrin ve sipariş) ve grup listesi.
 * Kurallar ve hesaplar lib/product-groups.ts'de.
 */
import { prisma } from '@/lib/prisma'
import { groupRules, isGroupMember, type GroupProduct } from '@/lib/product-groups'

const CACHE_MS = 30_000
let cache: { at: number; groups: { id: string; name: string; rules: ReturnType<typeof groupRules> }[] } | null = null

/** Satışa kapatılmış gruplar (kısa süre önbellekli; grup değişince invalidateProductGroupCache) */
async function closedGroups() {
  if (cache && Date.now() - cache.at < CACHE_MS) return cache.groups
  const rows = await prisma.productGroup.findMany({ where: { salesActive: false }, select: { id: true, name: true, productIds: true, brands: true, categories: true } })
  cache = { at: Date.now(), groups: rows.map((g) => ({ id: g.id, name: g.name, rules: groupRules(g) })) }
  return cache.groups
}

export function invalidateProductGroupCache() {
  cache = null
}

/** Ürünü satışa kapatan grubun adı (yoksa null) */
export async function closingGroupName(p: GroupProduct): Promise<string | null> {
  for (const g of await closedGroups()) if (isGroupMember(g.rules, p)) return g.name
  return null
}

/** Ürün listesinde satışa kapalı olanlar: id → kapatan grup adı */
export async function closedByGroups(products: GroupProduct[]): Promise<Map<string, string>> {
  const out = new Map<string, string>()
  const groups = await closedGroups()
  if (!groups.length) return out
  for (const p of products) {
    const g = groups.find((x) => isGroupMember(x.rules, p))
    if (g) out.set(p.id, g.name)
  }
  return out
}
