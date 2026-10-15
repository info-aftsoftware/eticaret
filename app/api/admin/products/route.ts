export const dynamic = 'force-dynamic'

/**
 * Admin Products API
 * CRUD operations for products (Prisma).
 * Auth: admin_session cookie veya Bearer JWT (Prisma user.role === 'admin').
 */

import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import { checkAdmin } from '@/lib/adminAuth'

export async function GET(request: NextRequest) {
  const auth = await checkAdmin(request)
  if ('error' in auth) {
    return NextResponse.json({ error: auth.error }, { status: auth.status })
  }

  try {
    const products = await prisma.product.findMany({
      include: {
        category: true,
        variants: {
          include: {
            stock: true,
          },
        },
      },
      orderBy: { createdAt: 'desc' },
    })

    return NextResponse.json(products)
  } catch (error) {
    console.error('Admin products GET error:', error)
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
      nameEn,
      slug,
      brand,
      mpn,
      sku,
      description,
      categoryId,
      specs,
      certifications,
      lifecycle,
      moq,
      orderStep,
      leadTimeDays,
    } = body

    const product = await prisma.product.create({
      data: {
        name,
        nameEn,
        slug,
        brand,
        mpn,
        sku,
        description,
        categoryId,
        specs: specs || {},
        certifications: certifications || {},
        lifecycle: lifecycle || 'ACTIVE',
        moq,
        orderStep,
        leadTimeDays,
      },
    })

    return NextResponse.json(product)
  } catch (error) {
    console.error('Admin products POST error:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}

