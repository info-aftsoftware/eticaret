/**
 * Admin Discount API (single)
 * GET: get one discount
 * PATCH: update discount
 * DELETE: delete discount
 */

import { NextRequest, NextResponse } from 'next/server'
import { invalidateCampaignCache } from '@/lib/discounts'
import { Prisma } from '@prisma/client'
import { prisma } from '@/lib/prisma'
import { checkAdmin } from '@/lib/adminAuth'

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

    const discount = await prisma.discount.update({
      where: { id },
      data: data as Parameters<typeof prisma.discount.update>[0]['data'],
    })
    invalidateCampaignCache()

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
    return NextResponse.json({ success: true })
  } catch (error) {
    console.error('Admin discount DELETE error:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}
