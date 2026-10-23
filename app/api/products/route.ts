/**
 * Public Products API (site kataloğu)
 * GET: Mock + ProductOverride merge listesi. Query: category?, q? (arama), brand?.
 */

export const dynamic = 'force-dynamic'

import { NextRequest, NextResponse } from 'next/server'
import { getStorefrontProducts } from '@/lib/discounts'
import { searchProducts } from '@/lib/search-product'
import { toListItem } from '@/lib/products-listing'

export async function GET(request: NextRequest) {
  try {
    const products = await getStorefrontProducts()
    const { searchParams } = request.nextUrl
    const category = searchParams.get('category')
    const q = searchParams.get('q')?.trim()
    const brand = searchParams.get('brand')
    // ids: ürün sayfasındaki öneri/uyumlu ürünler güncel fiyatla (en fazla 40)
    const ids = searchParams.get('ids')?.split(',').map((s) => s.trim()).filter(Boolean).slice(0, 40)

    let result = products

    if (ids?.length) {
      const wanted = new Set(ids)
      result = result.filter((p) => wanted.has(p.id))
    }

    if (category) {
      const decoded = decodeURIComponent(category)
      result = result.filter((p) => p.category === decoded)
    }

    if (brand) {
      result = result.filter((p) => p.brand === brand)
    }

    if (q) {
      result = searchProducts(result, q)
    }

    // Liste yanıtı hafif tutulur: varyant özellikleri, döviz fiyatı ve kargo kaynağı yalnızca ürün detay API'sinde
    return NextResponse.json(result.map(toListItem))
  } catch (error) {
    console.error('Products GET error:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}
