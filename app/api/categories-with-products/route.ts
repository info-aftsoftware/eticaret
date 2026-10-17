export const dynamic = 'force-dynamic'

/**
 * Ürünü olan kategori değerlerini döndürür (header/sidebar filtreleme için; boş kategoriler menüde gizlenir).
 * Statik katalogdan okur; Prisma/DB yok, production'da 500 oluşmaz.
 */

import { NextResponse } from 'next/server'
import { ALL_CATEGORY_VALUES } from '@/lib/categories'
import { mockProducts } from '@/lib/products-mock'

export async function GET() {
  try {
    const inCatalog = new Set(mockProducts.map((p) => p.category))
    const categoryValues = ALL_CATEGORY_VALUES.filter((v) => inCatalog.has(v))
    return NextResponse.json({ categoryValues })
  } catch {
    return NextResponse.json({ categoryValues: [] })
  }
}
