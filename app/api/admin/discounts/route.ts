export const dynamic = 'force-dynamic'

/**
 * Admin Discounts API
 * GET: list all discounts
 * POST: create discount
 * Auth: checkAdmin (Bearer JWT / cookie)
 */

import { NextRequest, NextResponse } from 'next/server'
import { invalidateCampaignCache } from '@/lib/discounts'
import { Prisma } from '@prisma/client'
import { dateRangeError, discountValueError } from '@/lib/campaign-rules'
import { prisma } from '@/lib/prisma'
import { checkAdmin } from '@/lib/adminAuth'
import { revalidateStorefront } from '@/lib/storefront-revalidate'

export async function GET(request: NextRequest) {
  const auth = await checkAdmin(request)
  if ('error' in auth) {
    return NextResponse.json({ error: auth.error }, { status: auth.status })
  }

  try {
    const discounts = await prisma.discount.findMany({
      orderBy: { createdAt: 'desc' },
    })
    return NextResponse.json(discounts)
  } catch (error) {
    console.error('Admin discounts GET error:', error)
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
      name,
      scope,
      categoryName,
      productIds,
      brandName,
      groupId,
      type,
      value,
      startDate,
      endDate,
      active,
    } = body

    if (!name || !scope || !type || value == null) {
      return NextResponse.json(
        { error: 'name, scope, type ve value gerekli' },
        { status: 400 }
      )
    }
    if (!['ALL', 'CATEGORY', 'PRODUCT', 'BRAND', 'GROUP'].includes(scope)) {
      return NextResponse.json({ error: 'scope ALL, CATEGORY, PRODUCT, BRAND veya GROUP olmalı' }, { status: 400 })
    }
    if (scope === 'BRAND' && !String(brandName ?? '').trim()) return NextResponse.json({ error: 'Marka seçin.' }, { status: 400 })
    if (scope === 'GROUP' && !(groupId && (await prisma.productGroup.findUnique({ where: { id: String(groupId) } })))) {
      return NextResponse.json({ error: 'Ürün grubu bulunamadı.' }, { status: 400 })
    }
    if (!['PERCENT', 'FIXED'].includes(type)) {
      return NextResponse.json({ error: 'type PERCENT veya FIXED olmalı' }, { status: 400 })
    }
    // Kuponla ortak kural (A14): yüzde en fazla %99, sabit > 0, bitiş başlangıçtan önce olamaz
    const valueError = discountValueError(type, value)
    if (valueError) return NextResponse.json({ error: valueError }, { status: 400 })
    const rangeError = dateRangeError(startDate ? new Date(startDate) : null, endDate ? new Date(endDate) : null)
    if (rangeError) return NextResponse.json({ error: rangeError }, { status: 400 })

    const discount = await prisma.discount.create({
      data: {
        name: String(name),
        scope: String(scope),
        categoryName: scope === 'CATEGORY' ? (categoryName ?? null) : null,
        productIds: scope === 'PRODUCT' && Array.isArray(productIds) ? productIds : Prisma.JsonNull,
        brandName: scope === 'BRAND' ? String(brandName).trim() : null,
        groupId: scope === 'GROUP' ? String(groupId) : null,
        type: String(type),
        value: Number(value),
        startDate: startDate ? new Date(startDate) : null,
        endDate: endDate ? new Date(endDate) : null,
        active: active !== false,
      },
    })

    invalidateCampaignCache()
    revalidateStorefront()
    return NextResponse.json(discount)
  } catch (error) {
    console.error('Admin discounts POST error:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}
