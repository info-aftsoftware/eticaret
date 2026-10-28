/**
 * /llms.txt — yapay zekâ asistanları (ChatGPT, Perplexity, Claude…) için sitenin kısa, bağlantılı özeti (llmstxt.org biçimi).
 * Google Search bu dosyayı kullanmaz (2026 rehberi); diğer motorlar ve ajanlar için isteğe bağlı, zararsız bir ek.
 * İçerik sitedeki tek kaynaklardan üretilir (firma bilgisi, ürün türleri, markalar, rehberler); elle tutulan metin yok.
 * Test alan adında (NEXT_PUBLIC_NOINDEX=true) site arama motorlarına kapalı olduğu için 404 döner.
 */
import { SELLER } from '@/lib/legal/company'
import { BANK_TRANSFER_DISCOUNT_RATE, BANK_TRANSFER_PAYMENT_DAYS, VAT_RATE } from '@/lib/store-config'
import { CATEGORY_GROUPS } from '@/lib/categories'
import { CATEGORY_META } from '@/app/category/[id]/category-meta'
import { PRODUCT_TYPES } from '@/lib/seo/product-types'
import { BRANDS } from '@/lib/seo/brands'
import { BLOG_POSTS } from '@/lib/blog-posts'
import { PACKAGE_CATEGORIES } from '@/lib/package-categories'
import { LEGAL_SLUGS, legalHref, getLegalDocument } from '@/lib/legal/documents'
import { getMergedProducts } from '@/lib/catalog-merge'

export const revalidate = 3600

const SITE_URL = (process.env.NEXT_PUBLIC_SITE_URL || process.env.NEXT_PUBLIC_BASE_URL || 'https://voltekno.com').replace(/\/$/, '')
const NOINDEX = process.env.NEXT_PUBLIC_NOINDEX === 'true'

const link = (title: string, path: string, note?: string) => `- [${title}](${SITE_URL}${path})${note ? `: ${note}` : ''}`

export async function GET() {
  if (NOINDEX) return new Response('Not found', { status: 404 })

  let products: { category?: string; brand?: string; status?: string }[] = []
  try {
    products = (await getMergedProducts()).filter((p) => p.status !== 'draft')
  } catch (e) {
    console.error('llms.txt catalog error:', e)
  }
  const categories = new Set(products.map((p) => p.category))
  const brands = new Set(products.map((p) => p.brand))
  const countIn = (values: readonly string[]) => products.filter((p) => p.category && values.includes(p.category)).length

  const groups = CATEGORY_GROUPS.filter((g) => g.categoryValues.some((c) => categories.has(c)) && CATEGORY_META[g.id])
  const lines: string[] = [
    `# ${SELLER.brand}`,
    '',
    `> ${SELLER.brand}, Türkiye'de güneş enerjisi ve enerji depolama ürünleri satan bir e-ticaret sitesidir: güneş paneli, lityum ve jel akü, solar inverter, MPPT/PWM şarj kontrol cihazı, rüzgar türbini, ısı pompası ve elektrikli araç şarj istasyonu. Satıcı ${SELLER.legalName} (${SELLER.city}). Fiyatlar Türk lirası ve KDV (%${VAT_RATE}) dahildir; teslimat Türkiye geneline yapılır.`,
    '',
    'Site Türkçedir; ürün adları, açıklamalar ve teknik özellikler Türkçe yazılır. Fiyat, stok ve kampanyalar sık değişir: güncel değer için ürün sayfasına bakın.',
    '',
    '## Firma',
    '',
    `- Unvan: ${SELLER.legalName}`,
    `- Adres: ${SELLER.address}`,
    `- Telefon / WhatsApp: ${SELLER.phone}`,
    `- E-posta: ${SELLER.email}`,
    `- MERSİS: ${SELLER.mersisNo} · Vergi: ${SELLER.taxOffice}, ${SELLER.taxNo}`,
    link('Hakkımızda', '/hakkimizda'),
    link('İletişim ve teklif formu', '/contact'),
    '',
    '## Alışveriş koşulları',
    '',
    `- Ödeme: havale/EFT (sepette %${BANK_TRANSFER_DISCOUNT_RATE} indirim, ${BANK_TRANSFER_PAYMENT_DAYS} gün içinde ödeme). Kartla ödeme banka sanal POS'u tanımlandığında açılır.`,
    '- Kargo ücreti ürünün desisine göre hesaplanır ve sepette gösterilir; akü/batarya ve kurulumlu ürünlerde gönderim için iletişime geçilir.',
    '- Cayma hakkı: teslimattan itibaren 14 gün.',
    '- Bazı projelik ürünler (büyük depolama sistemleri, sürücüler) teklifle satılır; fiyat sayfada gösterilmez.',
    link('Kargo ve teslimat', '/shipping'),
    link('Sık sorulan sorular', '/faq'),
    link('Sipariş takibi', '/siparis-takip'),
    '',
    '## Ürün grupları',
    '',
    ...groups.map((g) => link(CATEGORY_META[g.id].title, `/category/${g.id}`, `${CATEGORY_META[g.id].description} (${countIn(g.categoryValues)} ürün)`)),
    '',
    '## Ürün türleri',
    '',
    'Her tür sayfasında ürünlerin listesi, alım rehberi ve sık sorulan sorular vardır.',
    '',
    ...PRODUCT_TYPES.filter((t) => categories.has(t.category)).map((t) => link(t.title, `/category/${t.group}/${t.slug}`, t.description)),
    '',
    '## Markalar',
    '',
    ...BRANDS.filter((b) => brands.has(b.name)).map((b) => link(b.name, `/marka/${b.slug}`)),
    '',
    '## Hazır çözümler',
    '',
    ...PACKAGE_CATEGORIES.map((p) => link(p.title, `/paketler/${p.slug}`)),
    link('GES (güneş enerjisi sistemi) hesaplama ve teklif', '/ges'),
    '',
    '## Rehberler',
    '',
    ...Object.entries(BLOG_POSTS).map(([slug, post]) => link(post.title, `/blog/${slug}`)),
    '',
    '## Yasal metinler',
    '',
    ...LEGAL_SLUGS.map((slug) => link(getLegalDocument(slug)?.title ?? slug, legalHref(slug))),
    '',
    '## Optional',
    '',
    link('Tüm ürünler', '/products'),
    link('Site haritası (XML)', '/sitemap.xml'),
    link('Ürün akışı (Google Merchant XML)', '/feed/google-merchant.xml'),
    '',
  ]

  return new Response(lines.join('\n'), {
    headers: { 'Content-Type': 'text/markdown; charset=utf-8', 'Cache-Control': 'public, max-age=3600' },
  })
}
