/**
 * Admin Discount API (single)
 * GET: get one discount
 * PATCH: update discount
 * DELETE: delete discount
 */

import { NextRequest, NextResponse } from 'next/server'
import { invalidateCampaignCache } from '@/lib/discounts'
import { Prisma } from '@prisma/client'
import { dateRangeError, discountValueError } from '@/lib/campaign-rules'
import { prisma } from '@/lib/prisma'
import { checkAdmin } from '@/lib/adminAuth'
import { revalidateStorefront } from '@/lib/storefront-revalidate'

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const auth = await checkAdmin(request)
  if ('error' in auth) {
    return NextResponse.json({ error: auth.error }, { status: auth.status })
  }

  try {
    const { id } = await params
    const discount = await prisma.discount.findUnique({
      where: { id },
    })
    if (!discount) {
      return NextResponse.json({ error: 'İndirim bulunamadı' }, { status: 404 })
    }
    return NextResponse.json(discount)
  } catch (error) {
    console.error('Admin discount GET error:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}

export async function PATCH(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const auth = await checkAdmin(request)
  if ('error' in auth) {
    return NextResponse.json({ error: auth.error }, { status: auth.status })
  }

  try {
    const { id } = await params
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

    const data: Record<string, unknown> = {}
    if (name !== undefined) data.name = String(name)
    if (scope !== undefined) {
      if (!['ALL', 'CATEGORY', 'PRODUCT'].includes(scope)) {
        return NextResponse.json({ error: 'Geçersiz scope' }, { status: 400 })
      }
      data.scope = scope
    }
    if (categoryName !== undefined) data.categoryName = categoryName
    if (productIds !== undefined) data.productIds = Array.isArray(productIds) ? productIds : Prisma.JsonNull
    if (type !== undefined) {
      if (!['PERCENT', 'FIXED'].includes(type)) {
        return NextResponse.json({ error: 'Geçersiz type' }, { status: 400 })
      }
      data.type = type
    }
    if (value !== undefined) data.value = Number(value)
    if (startDate !== undefined) data.startDate = startDate ? new Date(startDate) : null
    if (endDate !== undefined) data.endDate = endDate ? new Date(endDate) : null
    if (active !== undefined) data.active = Boolean(active)

    // Ortak kural (A14): kayıttaki değerlerle birleştirilip sunucuda doğrulanır (tarayıcı doğrulaması tek başına yetmez)
    const current = await prisma.discount.findUnique({ where: { id } })
    if (!current) return NextResponse.json({ error: 'Kampanya bulunamadı' }, { status: 404 })
    const valueError = discountValueError(data.type ?? current.type, data.value ?? current.value)
    if (valueError) return NextResponse.json({ error: valueError }, { status: 400 })
    const rangeError = dateRangeError(
      (data.startDate !== undefined ? data.startDate : current.startDate) as Date | null,
      (data.endDate !== undefined ? data.endDate : current.endDate) as Date | null
    )
    if (rangeError) return NextResponse.json({ error: rangeError }, { status: 400 })

    const discount = await prisma.discount.update({
      where: { id },
      data: data as Parameters<typeof prisma.discount.update>[0]['data'],
    })
    invalidateCampaignCache()

    revalidateStorefront()
    return NextResponse.json(discount)
  } catch (error) {
    console.error('Admin discount PATCH error:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}

export async function DELETE(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const auth = await checkAdmin(request)
  if ('error' in auth) {
    return NextResponse.json({ error: auth.error }, { status: auth.status })
  }

  try {
    const { id } = await params
    await prisma.discount.delete({
      where: { id },
    })
    invalidateCampaignCache()
    revalidateStorefront()
    return NextResponse.json({ success: true })
  } catch (error) {
    console.error('Admin discount DELETE error:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}
