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
    const counts: Record<string, number> = {}
    for (const p of mockProducts) counts[p.category] = (counts[p.category] ?? 0) + 1
    const categoryValues = ALL_CATEGORY_VALUES.filter((v) => counts[v])
    // counts: header açılır menüsündeki alt kategori ürün sayıları
    return NextResponse.json({ categoryValues, counts: Object.fromEntries(categoryValues.map((v) => [v, counts[v]])) })
  } catch {
    return NextResponse.json({ categoryValues: [] })
  }
}
