/**
 * Kampanya motoru — admin "İndirimler" (Prisma Discount) kayıtlarını mağaza fiyatlarına uygular.
 * Kapsam: ALL (tüm ürünler) | CATEGORY (kategori adı) | PRODUCT (ürün id listesi)
 * Tür: PERCENT (yüzde) | FIXED (KDV hariç birim fiyattan TL)
 * Bir ürüne birden fazla kampanya uyuyorsa müşteri için en avantajlısı uygulanır (kampanyalar toplanmaz).
 * Admin kataloğu indirimsiz taban fiyatla çalışır; mağaza, sipariş fiyatlandırması ve ürün akışı getStorefront* kullanır.
 */

import { prisma } from '@/lib/prisma'
import { getMergedProducts, getMergedProductById, type MergedProduct } from '@/lib/catalog-merge'

export type ActiveCampaign = {
  id: string
  name: string
  scope: string
  categoryName: string | null
  productIds: string[]
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
  const list: ActiveCampaign[] = rows
    .filter((d) => (d.type === 'PERCENT' || d.type === 'FIXED') && d.value > 0)
    .map((d) => ({
      id: d.id,
      name: d.name,
      scope: d.scope,
      categoryName: d.categoryName,
      productIds: Array.isArray(d.productIds) ? (d.productIds as unknown[]).map(String) : [],
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
  return campaigns.length ? products.map((p) => applyCampaigns(p, campaigns)) : products
}

/** Vitrin ürünü; taslak ürün yalnız `includeDraft` ile (yönetici önizlemesi) döner */
export async function getStorefrontProductById(id: string, opts: { includeDraft?: boolean } = {}): Promise<StorefrontProduct | null> {
  const [product, campaigns] = await Promise.all([getMergedProductById(id), getActiveCampaigns()])
  if (!product || (product.status === 'draft' && !opts.includeDraft)) return null
  return campaigns.length ? applyCampaigns(product, campaigns) : product
}
