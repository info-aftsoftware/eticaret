/**
 * Search API Route
 * Site kataloğunda (mock + ProductOverride) arama yapar; /api/products ile aynı kaynak ve eşleştirme.
 * Query: q, category?, brand?, priceMin?, priceMax?, inStock?, featured?, page?, pageSize|limit?
 */

import { NextRequest, NextResponse } from 'next/server'
import { getStorefrontProducts } from '@/lib/discounts'
import { searchProducts } from '@/lib/search-product'

export const dynamic = 'force-dynamic'

export async function GET(request: NextRequest) {
  try {
    const sp = request.nextUrl.searchParams
    const q = sp.get('q')?.trim()
    const category = sp.get('category')
    const brand = sp.get('brand')
    const priceMin = sp.get('priceMin') ? parseFloat(sp.get('priceMin')!) : undefined
    const priceMax = sp.get('priceMax') ? parseFloat(sp.get('priceMax')!) : undefined

    let products = await getStorefrontProducts()
    if (q) products = searchProducts(products, q)
    if (category) products = products.filter((p) => p.category === category)
    if (brand) products = products.filter((p) => p.brand === brand)
    if (priceMin !== undefined && !isNaN(priceMin)) products = products.filter((p) => p.price >= priceMin)
    if (priceMax !== undefined && !isNaN(priceMax)) products = products.filter((p) => p.price <= priceMax)
    if (sp.get('inStock') === 'true') products = products.filter((p) => (p.stock ?? 0) > 0)
    if (sp.get('featured') === 'true') products = products.filter((p) => p.featured)

    const page = Math.max(1, parseInt(sp.get('page') || '1', 10) || 1)
    const pageSize = Math.min(100, Math.max(1, parseInt(sp.get('limit') || sp.get('pageSize') || '24', 10) || 24))
    const total = products.length

    // lite=1: başlıktaki canlı öneri kutusu için hafif yanıt (+ eşleşen kategoriler)
    if (sp.get('lite') === '1') {
      const categories = [...new Set(products.map((p) => p.category).filter(Boolean))].slice(0, 3)
      return NextResponse.json({
        total,
        categories,
        products: products.slice(0, pageSize).map((p) => ({
          id: p.id,
          slug: p.slug,
          name: p.name,
          brand: p.brand,
          image: p.image,
          price: p.price,
          oldPrice: (p as { oldPrice?: number }).oldPrice,
          stock: p.stock,
        })),
      })
    }

    return NextResponse.json({
      products: products.slice((page - 1) * pageSize, page * pageSize),
      total,
      page,
      pageSize,
      totalPages: Math.ceil(total / pageSize),
    })
  } catch (error) {
    console.error('Search error:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}
