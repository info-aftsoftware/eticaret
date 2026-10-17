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
import { mockProducts } from '@/lib/products-mock'
import { notifyLowStockTransitions } from '@/lib/low-stock'

const VARIANT_KEYS = ['key', 'label', 'price', 'basePrice', 'sku', 'specifications', 'dimensionsCm', 'weightKg', 'desi', 'desiSource'] as const

/** Varyant listesini doğrular; geçersizse hata mesajı döner. Anahtar (key) sepet kimliğinin parçasıdır, değişmemelidir. */
function sanitizeVariants(input: unknown): { value: Record<string, unknown>[] } | { error: string } {
  if (!Array.isArray(input)) return { error: 'variants bir liste olmalı' }
  if (input.length > 200) return { error: 'En fazla 200 varyant eklenebilir' }
  const seen = new Set<string>()
  const out: Record<string, unknown>[] = []
  for (const raw of input) {
    if (!raw || typeof raw !== 'object') return { error: 'Geçersiz varyant' }
    const v = raw as Record<string, unknown>
    const key = typeof v.key === 'string' ? v.key.trim() : ''
    const label = typeof v.label === 'string' ? v.label.trim() : ''
    const price = Number(v.price)
    if (!/^[A-Za-z0-9_-]{1,80}$/.test(key)) return { error: `Geçersiz varyant anahtarı: ${key || '(boş)'}` }
    if (seen.has(key)) return { error: `Aynı varyant anahtarı iki kez kullanılmış: ${key}` }
    seen.add(key)
    if (!label || label.length > 200) return { error: `Varyant adı gerekli (en fazla 200 karakter): ${key}` }
    if (!Number.isFinite(price) || price < 0) return { error: `Varyant fiyatı geçersiz: ${label}` }
    const clean: Record<string, unknown> = {}
    for (const k of VARIANT_KEYS) if (v[k] !== undefined && v[k] !== null && v[k] !== '') clean[k] = v[k]
    clean.key = key
    clean.label = label
    clean.price = Math.round(price * 100) / 100
    if (typeof clean.sku === 'string') clean.sku = clean.sku.trim().slice(0, 100)
    out.push(clean)
  }
  return { value: out }
}

function sanitizeImages(input: unknown): string[] | null {
  if (!Array.isArray(input)) return null
  return input
    .filter((u): u is string => typeof u === 'string' && /^(\/(?!\/)|https:\/\/)/.test(u.trim()))
    .map((u) => u.trim())
    .slice(0, 30)
}

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
    const [product, override] = await Promise.all([
      getMergedProductById(productId),
      prisma.productOverride.findUnique({ where: { productId }, select: { updatedAt: true } }),
    ])
    if (!product) {
      return NextResponse.json({ error: 'Ürün bulunamadı' }, { status: 404 })
    }
    return NextResponse.json({
      ...product,
      // Panel için: katalog (Excel) ürünü mü, panelde düzenlenmiş mi
      _meta: {
        isCatalog: mockProducts.some((p) => p.id === productId),
        hasOverride: !!override,
        overrideUpdatedAt: override?.updatedAt?.toISOString() ?? null,
      },
    })
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
    if (images !== undefined) {
      const clean = sanitizeImages(images)
      data.images = clean && clean.length ? clean : Prisma.JsonNull
    }
    if (category !== undefined) data.category = category
    if (stock !== undefined) data.stock = Math.max(0, Math.floor(Number(stock) || 0))
    if (featured !== undefined) data.featured = Boolean(featured)
    if (specifications !== undefined) data.specifications =
      specifications != null && typeof specifications === 'object' ? specifications : Prisma.JsonNull
    if (features !== undefined) data.features = Array.isArray(features) ? features : Prisma.JsonNull
    if (variants !== undefined) {
      if (variants === null) data.variants = Prisma.JsonNull
      else {
        const res = sanitizeVariants(variants)
        if ('error' in res) return NextResponse.json({ error: res.error }, { status: 400 })
        data.variants = res.value.length ? res.value : Prisma.JsonNull
      }
    }
    if (price !== undefined && (!Number.isFinite(Number(price)) || Number(price) < 0)) {
      return NextResponse.json({ error: 'Fiyat geçersiz' }, { status: 400 })
    }
    if (brand !== undefined) data.brand = brand
    if (sku !== undefined) data.sku = sku
    if (tags !== undefined) data.tags = Array.isArray(tags) ? tags : Prisma.JsonNull
    if (slogan !== undefined) data.slogan = slogan
    if (warranty !== undefined) data.warranty = warranty

    // StockOverride'ı da güncelle — getMergedProducts önceliği StockOverride > ProductOverride.stock
    // Böylece her iki kaynaktan da doğru stok görünür.
    let stockBefore: { stock: number; name: string } | null = null
    if (stock !== undefined) {
      const before = await getMergedProductById(productId)
      stockBefore = before ? { stock: before.stock ?? 0, name: before.name } : null
      const stockVal = Math.max(0, Math.floor(Number(stock) || 0))
      await prisma.stockOverride.upsert({
        where: { productId },
        update: { stock: stockVal },
        create: { productId, stock: stockVal },
      })
    }

    const updated = await prisma.productOverride.upsert({
      where: { productId },
      update: data as Parameters<typeof prisma.productOverride.update>[0]['data'],
      // Yalnızca gönderilen alanlar yazılır: katalog ürününün adı/fiyatı/kategorisi boş değerle ezilmez
      create: { productId, ...(data as object) },
    })

    // Stoğa giren ürünler için "stok gelince haber ver" e-postaları (yanıtı bekletmeden)
    processStockAlerts([productId]).catch((e) => console.error('Stock alert error:', e))
    if (stock !== undefined) {
      void notifyLowStockTransitions([
        { productId, before: stockBefore?.stock, after: Math.max(0, Math.floor(Number(stock) || 0)), name: (name as string) || stockBefore?.name },
      ])
    }
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
    const res = await prisma.productOverride.deleteMany({ where: { productId } })
    if (res.count === 0) return NextResponse.json({ error: 'Bu ürün için kayıtlı düzenleme yok' }, { status: 404 })
    return NextResponse.json({ success: true })
  } catch (error) {
    console.error('Admin catalog DELETE error:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}
