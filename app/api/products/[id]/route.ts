export const dynamic = 'force-dynamic'

/**
 * Product Detail API by ID
 * Site kataloğu (lib/catalog + ProductOverride + kampanya) — HTML açıklama ve güncel kurla TL fiyat dahil.
 */

import { NextRequest, NextResponse } from 'next/server'
import { getStorefrontProductById } from '@/lib/discounts'

export function generateStaticParams() {
  return []
}

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params

    const merged = await getStorefrontProductById(id)
    if (merged) {
      return NextResponse.json(merged)
    }

    return NextResponse.json({ error: 'Product not found' }, { status: 404 })
  } catch (error) {
    console.error('Product GET error:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}
