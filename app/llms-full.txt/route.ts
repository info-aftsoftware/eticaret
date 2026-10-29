/**
 * /llms-full.txt — yapay zekâ asistanları için ürün düzeyinde dizin (llmstxt.org "full" eki). /llms.txt kategorilere
 * bağlanır; bu dosya her ürün türünün altında ürün adı, marka, temel teknik özellikler, seçenekler, fiyat ve adresi verir.
 * Değerler ürün sayfasındaki tablodan (vitrin verisi: kur, kampanya, satış durumu) üretilir; elle tutulan metin yok.
 * Test alan adında (NEXT_PUBLIC_NOINDEX=true) site arama motorlarına kapalı olduğu için 404 döner.
 */
import { SELLER } from '@/lib/legal/company'
import { VAT_RATE, grossPrice } from '@/lib/store-config'
import { CATEGORY_GROUPS } from '@/lib/categories'
import { CATEGORY_META } from '@/app/category/[id]/category-meta'
import { categoryHref } from '@/lib/seo/type-paths'
import { getStorefrontProducts, type StorefrontProduct } from '@/lib/discounts'
import { isBatteryCategory, BATTERY_CONTACT_ONLY } from '@/lib/shipping/battery'
import { isInstallShipping, isQuoteOnly } from '@/lib/sale-mode'
import { variantDistinctLabels } from '@/lib/seo/variant-attributes'

export const revalidate = 3600

const SITE_URL = (process.env.NEXT_PUBLIC_SITE_URL || process.env.NEXT_PUBLIC_BASE_URL || 'https://voltekno.com').replace(/\/$/, '')
const NOINDEX = process.env.NEXT_PUBLIC_NOINDEX === 'true'

/** Satır başına en fazla bu kadar özellik; ölçü, ağırlık, model, garanti ve (satırda zaten olan) marka dizinde gereksiz */
const MAX_SPECS = 5
const SKIP_SPECS = /^(model|marka|boyut|ölçü|ağırlık|garanti|sertifika|renk)/i

const tl = (n: number) => `${new Intl.NumberFormat('tr-TR', { maximumFractionDigits: 0 }).format(Math.round(grossPrice(n)))} ₺`

function keySpecs(p: StorefrontProduct): string[] {
  let specs = p.specifications
  // Ürün tablosu yoksa (özellikler varyantlarda) tüm varyantlarda aynı olan değerler
  if (!specs && p.variants?.length && p.variants.every((v) => v.specifications)) {
    const [first, ...rest] = p.variants.map((v) => v.specifications as Record<string, string>)
    specs = Object.fromEntries(Object.entries(first).filter(([k, v]) => rest.every((s) => s[k] === v)))
  }
  return Object.entries(specs ?? {})
    .filter(([k, v]) => !SKIP_SPECS.test(k.trim()) && String(v).trim() && String(v).length <= 60)
    .slice(0, MAX_SPECS)
    .map(([k, v]) => `${k.trim()}: ${String(v).trim()}`)
}

function priceNote(p: StorefrontProduct): string {
  if (isQuoteOnly(p)) return 'fiyat teklifle'
  const prices = p.variants?.length ? p.variants.map((v) => v.price) : [p.price]
  const min = Math.min(...prices)
  if (!(min > 0)) return 'fiyat için iletişime geçin'
  const price = prices.length > 1 && Math.max(...prices) !== min ? `${tl(min)}'den başlayan` : tl(min)
  const notes = [
    BATTERY_CONTACT_ONLY && isBatteryCategory(p.category) ? 'kargo için iletişim, çevrim içi sipariş kapalı' : '',
    isInstallShipping(p) ? 'kurulum ve nakliye ayrıca' : '',
    (p.stock ?? 0) > 0 ? '' : 'stokta yok',
  ].filter(Boolean)
  return `${price} (KDV dahil)${notes.length ? `; ${notes.join('; ')}` : ''}`
}

function productLine(p: StorefrontProduct): string {
  const parts = [p.brand, ...keySpecs(p)].filter(Boolean)
  const options = p.variants?.length ? `Seçenekler: ${variantDistinctLabels(p.variants.map((v) => v.label)).join(', ')}` : ''
  return `- [${p.name}](${SITE_URL}/products/${p.id}): ${[...parts, options, priceNote(p)].filter(Boolean).join(' · ')}`
}

export async function GET() {
  if (NOINDEX) return new Response('Not found', { status: 404 })

  let products: StorefrontProduct[] = []
  try {
    products = await getStorefrontProducts()
  } catch (e) {
    console.error('llms-full.txt catalog error:', e)
  }
  const sorted = [...products].sort((a, b) => a.name.localeCompare(b.name, 'tr'))
  const byCategory = new Map<string, StorefrontProduct[]>()
  for (const p of sorted) byCategory.set(p.category, [...(byCategory.get(p.category) ?? []), p])

  const lines: string[] = [
    `# ${SELLER.brand} — ürün dizini`,
    '',
    `> ${SELLER.brand} kataloğundaki tüm ürünler, ürün türüne göre: ad, marka, temel teknik özellikler, seçenekler, fiyat ve ürün sayfası. Fiyatlar Türk lirası, KDV (%${VAT_RATE}) dahil ve bu dosyanın üretildiği andaki değerdir; fiyat, stok ve kampanya sık değişir, güncel değer ürün sayfasındadır. Sitenin özeti: ${SITE_URL}/llms.txt`,
    '',
    `Toplam ${sorted.length} ürün.`,
    '',
  ]
  const listed = new Set<string>()
  for (const g of CATEGORY_GROUPS) {
    const cats = g.categoryValues.filter((c) => byCategory.has(c))
    if (!cats.length) continue
    lines.push(`## ${CATEGORY_META[g.id]?.title ?? g.id}`, '')
    for (const c of cats) {
      const list = byCategory.get(c) ?? []
      listed.add(c)
      lines.push(`### [${c}](${SITE_URL}${categoryHref(c)}) (${list.length} ürün)`, '', ...list.map(productLine), '')
    }
  }
  // Gruba bağlanmamış tür (panelde yeni açılan kategori) dizinden düşmesin
  for (const [c, list] of byCategory) {
    if (listed.has(c)) continue
    lines.push(`### [${c}](${SITE_URL}${categoryHref(c)}) (${list.length} ürün)`, '', ...list.map(productLine), '')
  }

  return new Response(lines.join('\n'), {
    headers: { 'Content-Type': 'text/markdown; charset=utf-8', 'Cache-Control': 'public, max-age=3600' },
  })
}
