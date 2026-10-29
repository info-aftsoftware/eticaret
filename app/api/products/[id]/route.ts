export const dynamic = 'force-dynamic'

/**
 * Product Detail API by ID
 * Site kataloğu (lib/catalog + ProductOverride + kampanya) — HTML açıklama ve güncel kurla TL fiyat dahil.
 */

import { NextRequest, NextResponse } from 'next/server'
import { getStorefrontProductById } from '@/lib/discounts'
import { localizeProduct, toCatalogLocale } from '@/lib/catalog-en'
import { localizeDescriptionHtml } from '@/lib/catalog-en/descriptions.server'

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
      // Ziyaretçinin dili (NEXT_LOCALE çerezi): İngilizcede ad, kısa açıklama, varyant adları ve HTML açıklama çevrilir
      const locale = toCatalogLocale(request.nextUrl.searchParams.get('locale') ?? request.cookies.get('NEXT_LOCALE')?.value)
      const body =
        locale === 'en'
          ? { ...localizeProduct(merged, locale), descriptionHtml: localizeDescriptionHtml(merged.descriptionHtml, locale) }
          : merged
      return NextResponse.json(body, { headers: { Vary: 'Cookie' } })
    }

    return NextResponse.json({ error: 'Product not found' }, { status: 404 })
  } catch (error) {
    console.error('Product GET error:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}
