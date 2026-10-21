/**
 * Google Merchant Center ürün akışı (RSS 2.0 + g: alanları).
 * Merchant Center > Ürünler > Akışlar > Planlanmış getirme: https://voltekno.com/feed/google-merchant.xml
 * Fiyat KDV dahildir (sitede gösterilen satış fiyatı); kargo ücreti lib/store-config ile aynıdır.
 */

import { getStorefrontProducts } from '@/lib/discounts'
import { VAT_RATE } from '@/lib/store-config'
import { lineLogistics, shippingFeeFor } from '@/lib/shipping/fee'
import { isContactOnlyProduct } from '@/lib/shipping/battery'
import { SELLER } from '@/lib/legal/company'
import { PLACEHOLDER_PRODUCT_IMAGE } from '@/lib/products-mock'
import { getGroupIdForCategory } from '@/lib/categories'
import { CATEGORY_META } from '@/app/category/[id]/category-meta'

export const revalidate = 3600

const SITE_URL = (process.env.NEXT_PUBLIC_SITE_URL || process.env.NEXT_PUBLIC_BASE_URL || 'https://voltekno.com').replace(/\/$/, '')

const xml = (v: unknown) =>
  String(v ?? '')
    .replace(/[\u0000-\u0008\u000B\u000C\u000E-\u001F]/g, '')
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
const abs = (u?: string) => (!u ? '' : u.startsWith('http') ? u : `${SITE_URL}${u.startsWith('/') ? '' : '/'}${u}`)
const money = (n: number) => `${(Math.round(n * 100) / 100).toFixed(2)} TRY`

/** "Güneş Paneli > Panel" biçiminde ürün türü (Excel'deki kategori hiyerarşisi) */
function productType(category: string): string {
  const groupId = getGroupIdForCategory(category)
  const group = groupId ? CATEGORY_META[groupId]?.title : undefined
  return group && group !== category ? `${group} > ${category}` : category
}

export async function GET() {
  // Merchant Center görselsiz ürünü reddeder: placeholder görselli ürünler akışa girmez
  // "Görsel hazırlanıyor" kartları (override/pending-*) gerçek ürün görseli değildir; Merchant Center bunları reddeder
  // Akü / batarya şimdilik çevrim içi satılmıyor (lib/shipping/battery.ts): satın alınamayan ürün akışa girmez
  const products = (await getStorefrontProducts()).filter((p) => p.price > 0 && p.name && p.image && p.image !== PLACEHOLDER_PRODUCT_IMAGE && !p.image.includes('/pending-') && !isContactOnlyProduct(p))
  const items = products.map((p) => {
    const image = abs((p.images && p.images[0]) || p.image)
    const extra = (p.images ?? []).slice(1, 10).map(abs)
    // Kampanyada: g:price = normal fiyat, g:sale_price = kampanyalı fiyat (KDV dahil)
    const regular = (p.oldPrice ?? p.price) * (1 + VAT_RATE / 100)
    const sale = p.oldPrice ? p.price * (1 + VAT_RATE / 100) : null
    const shipping = shippingFeeFor(lineLogistics(p.id))
    return `    <item>
      <g:id>${xml(p.id)}</g:id>
      <title>${xml(p.name.slice(0, 150))}</title>
      <description>${xml((p.fullDescription || p.description || p.name).slice(0, 5000))}</description>
      <link>${xml(`${SITE_URL}/products/${p.slug ?? p.id}`)}</link>
      ${image ? `<g:image_link>${xml(image)}</g:image_link>` : ''}
      ${extra.map((u) => `<g:additional_image_link>${xml(u)}</g:additional_image_link>`).join('')}
      <g:availability>${(p.stock ?? 0) > 0 ? 'in_stock' : 'out_of_stock'}</g:availability>
      <g:price>${money(regular)}</g:price>
      ${sale ? `<g:sale_price>${money(sale)}</g:sale_price>` : ''}${sale && p.campaign?.endsAt ? `<g:sale_price_effective_date>${new Date().toISOString()}/${p.campaign.endsAt}</g:sale_price_effective_date>` : ''}
      <g:condition>new</g:condition>
      ${p.brand ? `<g:brand>${xml(p.brand)}</g:brand>` : ''}
      ${/* SKU mağazanın iç kodu (TOMMAT-…), üretici parça no / GTIN değil: Google'a tanımlayıcı yok bildirilir */ ''}<g:identifier_exists>no</g:identifier_exists>
      ${p.category ? `<g:product_type>${xml(productType(p.category))}</g:product_type>` : ''}
      ${p.weightKg ? `<g:shipping_weight>${p.weightKg} kg</g:shipping_weight>` : ''}
      <g:shipping><g:country>TR</g:country><g:price>${money(shipping)}</g:price></g:shipping>
    </item>`
  })

  const body = `<?xml version="1.0" encoding="UTF-8"?>
<rss version="2.0" xmlns:g="http://base.google.com/ns/1.0">
  <channel>
    <title>${xml(SELLER.brand)}</title>
    <link>${SITE_URL}</link>
    <description>${xml(`${SELLER.brand} ürün akışı`)}</description>
${items.join('\n')}
  </channel>
</rss>`

  return new Response(body, {
    headers: { 'Content-Type': 'application/xml; charset=utf-8', 'Cache-Control': 'public, max-age=3600' },
  })
}
