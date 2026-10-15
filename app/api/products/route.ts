/**
 * Public Products API (site kataloğu)
 * GET: Mock + ProductOverride merge listesi. Query: category?, q? (arama), brand?.
 */

export const dynamic = 'force-dynamic'

import { NextRequest, NextResponse } from 'next/server'
import { getStorefrontProducts, type StorefrontProduct } from '@/lib/discounts'
import { searchProducts } from '@/lib/search-product'

function toListItem(p: StorefrontProduct) {
  const { basePrice: _basePrice, desiSource: _desiSource, dimensionsCm: _dims, ...rest } = p
  return {
    ...rest,
    variants: p.variants?.map(({ specifications: _s, basePrice: _b, desiSource: _d, dimensionsCm: _dm, ...v }) => v),
  }
}

export async function GET(request: NextRequest) {
  try {
    const products = await getStorefrontProducts()
    const { searchParams } = request.nextUrl
    const category = searchParams.get('category')
    const q = searchParams.get('q')?.trim()
    const brand = searchParams.get('brand')

    let result = products

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
