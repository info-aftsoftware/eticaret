/**
 * Ürün sayfası önerilen ürünleri: { recommended } (liste biçiminde, güncel fiyatla). "Uyumlu ürünler" bölümü kaldırıldı.
 * Panelde girilen sistem voltajı ve kategori değişiklikleri hemen yansısın diye sunucuda hesaplanır (lib/related-products).
 */

export const dynamic = 'force-dynamic'

import { NextRequest, NextResponse } from 'next/server'
import { getStorefrontProducts } from '@/lib/discounts'
import { toListItem } from '@/lib/products-listing'
import { relatedProductIds } from '@/lib/related-products'

export async function GET(_request: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  try {
    const { id } = await params
    const products = await getStorefrontProducts()
    const product = products.find((p) => p.id === id || p.slug === id)
    if (!product) return NextResponse.json({ error: 'Ürün bulunamadı' }, { status: 404 })
    const ids = relatedProductIds(product, products)
    const byId = new Map(products.map((p) => [p.id, p]))
    const pick = (list: string[]) => list.map((x) => byId.get(x)).filter((p) => !!p).map((p) => toListItem(p!))
    return NextResponse.json({ recommended: pick(ids.recommended) })
  } catch (error) {
    console.error('Related products GET error:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}
