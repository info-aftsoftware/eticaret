export const dynamic = 'force-dynamic'

/**
 * Ürünü olan kategori değerlerini döndürür (header/sidebar filtreleme için; boş kategoriler menüde gizlenir).
 * Sayılar kategori sayfalarıyla aynı listeden gelir (panel kategorisi, panelde eklenen ürün; taslaklar hariç).
 * Veritabanı okunamazsa statik kataloğa düşer; 500 oluşmaz.
 */

import { NextResponse } from 'next/server'
import { ALL_CATEGORY_VALUES } from '@/lib/categories'
import { mockProducts } from '@/lib/products-mock'
import { getMergedProducts } from '@/lib/catalog-merge'

export async function GET() {
  try {
    const counts: Record<string, number> = {}
    const products: { category: string }[] = await getMergedProducts()
      .then((all) => all.filter((p) => p.status !== 'draft'))
      .catch(() => mockProducts)
    for (const p of products) counts[p.category] = (counts[p.category] ?? 0) + 1
    const categoryValues = ALL_CATEGORY_VALUES.filter((v) => counts[v])
    // counts: header açılır menüsündeki alt kategori ürün sayıları
    return NextResponse.json({ categoryValues, counts: Object.fromEntries(categoryValues.map((v) => [v, counts[v]])) })
  } catch {
    return NextResponse.json({ categoryValues: [] })
  }
}
