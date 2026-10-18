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
    if (!['ALL', 'CATEGORY', 'PRODUCT'].includes(scope)) {
      return NextResponse.json({ error: 'scope ALL, CATEGORY veya PRODUCT olmalı' }, { status: 400 })
    }
    if (!['PERCENT', 'FIXED'].includes(type)) {
      return NextResponse.json({ error: 'type PERCENT veya FIXED olmalı' }, { status: 400 })
    }

    const discount = await prisma.discount.create({
      data: {
        name: String(name),
        scope: String(scope),
        categoryName: scope === 'CATEGORY' ? (categoryName ?? null) : null,
        productIds: scope === 'PRODUCT' && Array.isArray(productIds) ? productIds : Prisma.JsonNull,
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
