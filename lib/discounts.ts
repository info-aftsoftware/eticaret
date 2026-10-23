/**
 * Kampanya motoru — admin "İndirimler" (Prisma Discount) kayıtlarını mağaza fiyatlarına uygular.
 * Kapsam: ALL (tüm ürünler) | CATEGORY (kategori adı) | PRODUCT (ürün id listesi) | BRAND (marka) | GROUP (ürün grubu:
 * tek tek ürünler + marka + kategori, üyelik dinamik; lib/product-groups)
 * Tür: PERCENT (yüzde) | FIXED (KDV hariç birim fiyattan TL)
 * Bir ürüne birden fazla kampanya uyuyorsa müşteri için en avantajlısı uygulanır (kampanyalar toplanmaz).
 * Admin kataloğu indirimsiz taban fiyatla çalışır; mağaza, sipariş fiyatlandırması ve ürün akışı getStorefront* kullanır.
 */

import { prisma } from '@/lib/prisma'
import { getMergedProducts, getMergedProductById, type MergedProduct } from '@/lib/catalog-merge'
import { closedByGroups, closingGroupName } from '@/lib/product-groups-db'
import { groupRules, isGroupMember, type GroupRules } from '@/lib/product-groups'

export type ActiveCampaign = {
  id: string
  name: string
  scope: string
  categoryName: string | null
  productIds: string[]
  brandName: string | null
  /** GROUP kapsamında grubun kuralları */
  group: GroupRules | null
  type: 'PERCENT' | 'FIXED'
  value: number
  endDate: Date | null
}

export type StorefrontProduct = MergedProduct & {
  /** Kampanya öncesi fiyat (KDV hariç) — yalnızca kampanya varsa */
  oldPrice?: number
  /** Yuvarlanmış indirim yüzdesi (rozet için) */
  discount?: number
  campaign?: { id: string; name: string; endsAt: string | null }
}

const CACHE_MS = 60_000
let cache: { at: number; list: ActiveCampaign[] } | null = null

const round2 = (n: number) => Math.round(n * 100) / 100

export async function getActiveCampaigns(): Promise<ActiveCampaign[]> {
  if (cache && Date.now() - cache.at < CACHE_MS) return cache.list
  const now = new Date()
  const rows = await prisma.discount.findMany({
    where: {
      active: true,
      AND: [
        { OR: [{ startDate: null }, { startDate: { lte: now } }] },
        { OR: [{ endDate: null }, { endDate: { gte: now } }] },
      ],
    },
  })
  // GROUP kampanyalarının grupları (silinmiş grup kampanyası uygulanmaz)
  const groupIds = [...new Set(rows.map((d) => d.groupId).filter(Boolean) as string[])]
  const groups = groupIds.length ? await prisma.productGroup.findMany({ where: { id: { in: groupIds } } }) : []
  const groupMap = new Map(groups.map((g) => [g.id, groupRules(g)]))
  const list: ActiveCampaign[] = rows
    .filter((d) => (d.type === 'PERCENT' || d.type === 'FIXED') && d.value > 0)
    .filter((d) => d.scope !== 'GROUP' || (d.groupId && groupMap.has(d.groupId)))
    .map((d) => ({
      id: d.id,
      name: d.name,
      scope: d.scope,
      categoryName: d.categoryName,
      productIds: Array.isArray(d.productIds) ? (d.productIds as unknown[]).map(String) : [],
      brandName: d.brandName,
      group: d.groupId ? groupMap.get(d.groupId) ?? null : null,
      type: d.type as 'PERCENT' | 'FIXED',
      value: d.value,
      endDate: d.endDate,
    }))
  cache = { at: Date.now(), list }
  return list
}

/** Admin kampanya ekleyip/değiştirince önbelleği boşalt */
export function invalidateCampaignCache() {
  cache = null
}

function applies(c: ActiveCampaign, p: MergedProduct): boolean {
  if (c.scope === 'ALL') return true
  if (c.scope === 'CATEGORY') return !!c.categoryName && p.category === c.categoryName
  if (c.scope === 'PRODUCT') return c.productIds.includes(p.id)
  if (c.scope === 'BRAND') return !!c.brandName && p.brand === c.brandName
  if (c.scope === 'GROUP') return !!c.group && isGroupMember(c.group, p)
  return false
}

function discounted(price: number, c: ActiveCampaign): number {
  const next = c.type === 'PERCENT' ? price * (1 - Math.min(c.value, 99) / 100) : price - c.value
  // Ürün 0 TL'ye inemez: en fazla %99 indirim.
  // Katalog fiyatları tam TL (lib/fx-rates.ts); kampanyalı fiyat da tam TL'ye yukarı yuvarlanır
  const floor = Math.max(next, price * 0.01)
  return Number.isInteger(price) ? Math.ceil(floor - 1e-9) : round2(floor)
}

/** Ürüne en avantajlı kampanyayı uygular (taban fiyat ve varyant fiyatları). */
export function applyCampaigns(p: MergedProduct, campaigns: ActiveCampaign[]): StorefrontProduct {
  if (!(p.price > 0)) return p
  const candidates = campaigns.filter((c) => applies(c, p))
  if (candidates.length === 0) return p
  const best = candidates.reduce((a, b) => (discounted(p.price, b) < discounted(p.price, a) ? b : a))
  const price = discounted(p.price, best)
  if (price >= p.price) return p
  return {
    ...p,
    price,
    oldPrice: p.price,
    discount: Math.round((1 - price / p.price) * 100),
    variants: p.variants?.map((v) => ({ ...v, price: discounted(v.price, best) })),
    campaign: { id: best.id, name: best.name, endsAt: best.endDate?.toISOString() ?? null },
  }
}

/** Vitrin ürünleri: taslaklar (A08) liste, arama, akış ve sepette görünmez */
export async function getStorefrontProducts(): Promise<StorefrontProduct[]> {
  const [all, campaigns] = await Promise.all([getMergedProducts(), getActiveCampaigns()])
  const products = all.filter((p) => p.status !== 'draft')
  const closed = await closedByGroups(products)
  const open = products.map((p) => closeSales(p, closed.get(p.id)))
  return campaigns.length ? open.map((p) => applyCampaigns(p, campaigns)) : open
}

/**
 * Satışa kapalı ürün (grup kapatıldı veya ürün kapatıldı): vitrinde stoksuz görünür (kart, sepet ve sipariş korumaları
 * mevcut stok kuralıyla çalışır), ürün sayfası ve sipariş "satışa kapalı" der. Panel verisi (getMergedProducts) etkilenmez.
 */
function closeSales<T extends MergedProduct>(p: T, groupName?: string): T {
  const reason = p.salesClosed ?? (groupName ? `Satışa kapalı (${groupName})` : undefined)
  if (!reason) return p
  return { ...p, salesClosed: reason, stock: 0, variants: p.variants?.map((v) => (typeof v.stock === 'number' ? { ...v, stock: 0 } : v)) }
}

/** Vitrin ürünü; taslak ürün yalnız `includeDraft` ile (yönetici önizlemesi) döner */
export async function getStorefrontProductById(id: string, opts: { includeDraft?: boolean } = {}): Promise<StorefrontProduct | null> {
  const [product, campaigns] = await Promise.all([getMergedProductById(id), getActiveCampaigns()])
  if (!product || (product.status === 'draft' && !opts.includeDraft)) return null
  const open = closeSales(product, (await closingGroupName(product)) ?? undefined)
  return campaigns.length ? applyCampaigns(open, campaigns) : open
}
