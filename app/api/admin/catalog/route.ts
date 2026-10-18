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
import { getMergedProducts } from '@/lib/catalog-merge'
import { revalidateStorefront } from '@/lib/storefront-revalidate'

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
    if (price == null || Number(price) < 0) {
      return NextResponse.json({ error: 'price gerekli ve 0 veya üzeri olmalı' }, { status: 400 })
    }
    if (!category || typeof category !== 'string' || !category.trim()) {
      return NextResponse.json({ error: 'category gerekli' }, { status: 400 })
    }

    const finalId = id || `custom-${Date.now()}-${Math.random().toString(36).slice(2, 9)}`

    const created = await prisma.productOverride.create({
      data: {
        productId: finalId,
        name: String(name).trim(),
        slug: slug != null ? String(slug).trim() : null,
        description: description != null ? String(description) : null,
        fullDescription: fullDescription != null ? String(fullDescription) : null,
        price: Number(price),
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
        tags: Array.isArray(tags) ? tags : Prisma.JsonNull,
        slogan: slogan != null ? String(slogan) : null,
        warranty: warranty != null ? String(warranty) : null,
      },
    })

    revalidateStorefront()
    return NextResponse.json(created)
  } catch (error) {
    console.error('Admin catalog POST error:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}
