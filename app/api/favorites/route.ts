export const dynamic = 'force-dynamic'

/**
 * Favori ürün özetleri (favoriler sayfası / profil sekmesi).
 * Favori listesi tarayıcıda tutulur (üye: Firestore, misafir: localStorage); bu uç yalnızca güncel
 * katalog bilgisini (kampanyalı fiyat, stok, görsel, varyantlar) döner.
 * GET ?ids=a,b,c  →  { products: [...], missing: [...] }
 */

import { NextRequest, NextResponse } from 'next/server'
import { getStorefrontProducts } from '@/lib/discounts'
import { isRateLimited } from '@/lib/rate-limit'

export async function GET(request: NextRequest) {
  if (isRateLimited(request, 'favorites', 60, 60_000)) {
    return NextResponse.json({ error: 'Çok fazla istek.' }, { status: 429 })
  }
  const ids = Array.from(
    new Set(
      (request.nextUrl.searchParams.get('ids') || '')
        .split(',')
        .map((s) => s.trim())
        .filter(Boolean)
    )
  ).slice(0, 200)
  if (ids.length === 0) return NextResponse.json({ products: [], missing: [] })

  try {
    const all = await getStorefrontProducts()
    const byId = new Map(all.map((p) => [p.id, p]))
    const products = []
    const missing: string[] = []
    for (const id of ids) {
      const p = byId.get(id) ?? all.find((x) => x.slug === id)
      if (!p) {
        missing.push(id)
        continue
      }
      products.push({
        id: p.id,
        slug: p.slug ?? null,
        name: p.name,
        description: p.description,
        brand: p.brand ?? null,
        category: p.category,
        price: p.price,
        oldPrice: p.oldPrice ?? null,
        discount: p.discount ?? null,
        campaign: p.campaign?.name ?? null,
        image: p.images?.[0] ?? p.image ?? null,
        stock: typeof p.stock === 'number' ? p.stock : null,
        variants: (p.variants ?? []).map((v) => ({ key: v.key, label: v.label, price: v.price })),
        defaultVariantKey: p.defaultVariantKey ?? null,
      })
    }
    return NextResponse.json({ products, missing })
  } catch (error) {
    console.error('Favorites GET error:', error)
    return NextResponse.json({ error: 'Ürün bilgileri alınamadı.' }, { status: 500 })
  }
}
