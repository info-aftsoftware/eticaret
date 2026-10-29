export const dynamic = 'force-dynamic'

/**
 * Admin Catalog API
 * GET: merged list (mock + ProductOverride)
 * POST: create new product (ProductOverride only)
 * Auth: checkAdmin
 */

import { NextRequest, NextResponse } from 'next/server'
import { Prisma } from '@prisma/client'
import { prisma } from '@/lib/prisma'
import { checkAdmin } from '@/lib/adminAuth'
import { canSeeCost } from '@/lib/admin-users'
import { sanitizeCost, sanitizeLogistics, sanitizeNewProductCurrency } from '@/lib/product-admin-fields'
import { getMergedProducts } from '@/lib/catalog-merge'
import { revalidateStorefront } from '@/lib/storefront-revalidate'
import { gtinProblem, normalizeGtin } from '@/lib/gtin'

export async function GET(request: NextRequest) {
  const auth = await checkAdmin(request)
  if ('error' in auth) {
    return NextResponse.json({ error: auth.error }, { status: auth.status })
  }

  try {
    const products = await getMergedProducts()
    return NextResponse.json(products)
  } catch (error) {
    console.error('Admin catalog GET error:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}

export async function POST(request: NextRequest) {
  const auth = await checkAdmin(request)
  if ('error' in auth) {
    return NextResponse.json({ error: auth.error }, { status: auth.status })
  }

  try {
    const body = await request.json()
    const {
      productId,
      name,
      slug,
      description,
      fullDescription,
      price,
      image,
      images,
      category,
      stock,
      featured,
      specifications,
      features,
      variants,
      brand,
      sku,
      tags,
      slogan,
      warranty,
    } = body

    const id = typeof productId === 'string' && productId.trim()
      ? productId.trim()
      : undefined

    if (!name || typeof name !== 'string' || !name.trim()) {
      return NextResponse.json({ error: 'name gerekli' }, { status: 400 })
    }
    // Para birimi (A06): USD/EUR ürün dövize bağlı oluşturulur (TL fiyatı kurla hesaplanır)
    const currency = sanitizeNewProductCurrency(body)
    if ('error' in currency) return NextResponse.json({ error: currency.error }, { status: 400 })
    const fx = currency.priceCurrency !== 'TRY'
    if (!fx && (price == null || !(Number(price) >= 0))) {
      return NextResponse.json({ error: 'price gerekli ve 0 veya üzeri olmalı' }, { status: 400 })
    }
    if (!category || typeof category !== 'string' || !category.trim()) {
      return NextResponse.json({ error: 'category gerekli' }, { status: 400 })
    }
    const cost = sanitizeCost(body, canSeeCost(auth.actor.role))
    if ('error' in cost) return NextResponse.json({ error: cost.error }, { status: 400 })
    const logistics = sanitizeLogistics(body, {})
    if ('error' in logistics) return NextResponse.json({ error: logistics.error }, { status: 400 })
    const gtinError = gtinProblem(body.gtin)
    if (gtinError) return NextResponse.json({ error: gtinError }, { status: 400 })

    const finalId = id || `custom-${Date.now()}-${Math.random().toString(36).slice(2, 9)}`

    const created = await prisma.productOverride.create({
      data: {
        productId: finalId,
        // Yeni ürün taslak olarak başlar (A08): görsel, kargo ve fiyat tamamlanıp "Yayına al" denene kadar vitrinde yok
        status: body.publish === true ? null : 'draft',
        priceCurrency: currency.priceCurrency,
        ...(fx ? { priceMode: 'fx', basePrice: currency.basePrice } : {}),
        ...cost.data,
        ...logistics.data,
        name: String(name).trim(),
        slug: slug != null ? String(slug).trim() : null,
        description: description != null ? String(description) : null,
        fullDescription: fullDescription != null ? String(fullDescription) : null,
        price: fx ? null : Number(price),
        image: image != null ? String(image) : null,
        images: Array.isArray(images) ? images : Prisma.JsonNull,
        category: String(category).trim(),
        stock: stock != null ? Math.max(0, Math.floor(Number(stock))) : null,
        featured: featured === true,
        specifications:
          specifications != null && typeof specifications === 'object'
            ? (specifications as Prisma.InputJsonValue)
            : Prisma.JsonNull,
        features: Array.isArray(features) ? features : Prisma.JsonNull,
        variants: Array.isArray(variants) ? variants : Prisma.JsonNull,
        brand: brand != null ? String(brand) : null,
        sku: sku != null ? String(sku) : null,
        gtin: normalizeGtin(body.gtin),
        tags: Array.isArray(tags) ? tags : Prisma.JsonNull,
        slogan: slogan != null ? String(slogan) : null,
        warranty: warranty != null ? String(warranty) : null,
      },
    })

    revalidateStorefront()
    // Maliyet alanları yanıtta dönmez
    const { costPrice: _c, costCurrency: _cc, targetMargin: _t, ...rest } = created
    return NextResponse.json(rest)
  } catch (error) {
    console.error('Admin catalog POST error:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}
