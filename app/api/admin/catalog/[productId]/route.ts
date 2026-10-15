/**
 * Admin Catalog API (single product)
 * GET: merged product (mock + ProductOverride)
 * PATCH: upsert ProductOverride for this productId
 * DELETE: remove ProductOverride (product stays from mock if exists)
 */

import { NextRequest, NextResponse } from 'next/server'
import { processStockAlerts } from '@/lib/stock-alerts'
import { Prisma } from '@prisma/client'
import { prisma } from '@/lib/prisma'
import { checkAdmin } from '@/lib/adminAuth'
import { getMergedProductById } from '@/lib/catalog-merge'

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ productId: string }> }
) {
  const auth = await checkAdmin(request)
  if ('error' in auth) {
    return NextResponse.json({ error: auth.error }, { status: auth.status })
  }

  try {
    const { productId } = await params
    const product = await getMergedProductById(productId)
    if (!product) {
      return NextResponse.json({ error: 'Ürün bulunamadı' }, { status: 404 })
    }
    return NextResponse.json(product)
  } catch (error) {
    console.error('Admin catalog GET [productId] error:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}

export async function PATCH(
  request: NextRequest,
  { params }: { params: Promise<{ productId: string }> }
) {
  const auth = await checkAdmin(request)
  if ('error' in auth) {
    return NextResponse.json({ error: auth.error }, { status: auth.status })
  }

  try {
    const { productId } = await params
    const body = await request.json()
    const {
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

    const data: Record<string, unknown> = {}
    if (name !== undefined) data.name = name
    if (slug !== undefined) data.slug = slug
    if (description !== undefined) data.description = description
    if (fullDescription !== undefined) data.fullDescription = fullDescription
    if (price !== undefined) data.price = Number(price)
    if (image !== undefined) data.image = image
    if (images !== undefined) data.images = Array.isArray(images) ? images : Prisma.JsonNull
    if (category !== undefined) data.category = category
    if (stock !== undefined) data.stock = Math.max(0, Math.floor(Number(stock)))
    if (featured !== undefined) data.featured = Boolean(featured)
    if (specifications !== undefined) data.specifications =
      specifications != null && typeof specifications === 'object' ? specifications : Prisma.JsonNull
    if (features !== undefined) data.features = Array.isArray(features) ? features : Prisma.JsonNull
    if (variants !== undefined) data.variants = Array.isArray(variants) ? variants : Prisma.JsonNull
    if (brand !== undefined) data.brand = brand
    if (sku !== undefined) data.sku = sku
    if (tags !== undefined) data.tags = Array.isArray(tags) ? tags : Prisma.JsonNull
    if (slogan !== undefined) data.slogan = slogan
    if (warranty !== undefined) data.warranty = warranty

    // StockOverride'ı da güncelle — getMergedProducts önceliği StockOverride > ProductOverride.stock
    // Böylece her iki kaynaktan da doğru stok görünür.
    if (stock !== undefined) {
      const stockVal = Math.max(0, Math.floor(Number(stock)))
      await prisma.stockOverride.upsert({
        where: { productId },
        update: { stock: stockVal },
        create: { productId, stock: stockVal },
      })
    }

    const updated = await prisma.productOverride.upsert({
      where: { productId },
      update: data as Parameters<typeof prisma.productOverride.update>[0]['data'],
      create: {
        productId,
        name: (name as string) ?? 'İsimsiz',
        price: typeof price === 'number' ? price : 0,
        category: (category as string) ?? 'Diğer',
        ...(data as object),
      },
    })

    // Stoğa giren ürünler için "stok gelince haber ver" e-postaları (yanıtı bekletmeden)
    processStockAlerts([productId]).catch((e) => console.error('Stock alert error:', e))
    return NextResponse.json(updated)
  } catch (error) {
    console.error('Admin catalog PATCH error:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}

export async function DELETE(
  request: NextRequest,
  { params }: { params: Promise<{ productId: string }> }
) {
  const auth = await checkAdmin(request)
  if ('error' in auth) {
    return NextResponse.json({ error: auth.error }, { status: auth.status })
  }

  try {
    const { productId } = await params
    await prisma.productOverride.delete({
      where: { productId },
    })
    return NextResponse.json({ success: true })
  } catch (error) {
    console.error('Admin catalog DELETE error:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}
