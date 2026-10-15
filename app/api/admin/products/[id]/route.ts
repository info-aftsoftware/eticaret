/**
 * Admin Product Detail API
 * Get, update, delete individual products (Prisma).
 * Auth: admin_session cookie veya Bearer JWT (Prisma user.role === 'admin').
 */

import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import { checkAdmin } from '@/lib/adminAuth'

export function generateStaticParams() {
  return []
}

export async function GET(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  const auth = await checkAdmin(request)
  if ('error' in auth) {
    return NextResponse.json({ error: auth.error }, { status: auth.status })
  }

  try {
    const product = await prisma.product.findUnique({
      where: { id: params.id },
      include: {
        category: true,
        variants: {
          include: {
            stock: true,
          },
        },
        priceRules: true,
      },
    })

    if (!product) {
      return NextResponse.json({ error: 'Product not found' }, { status: 404 })
    }

    return NextResponse.json(product)
  } catch (error) {
    console.error('Admin product GET error:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}

export async function PATCH(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  const auth = await checkAdmin(request)
  if ('error' in auth) {
    return NextResponse.json({ error: auth.error }, { status: auth.status })
  }

  try {
    const body = await request.json()
    const { name, description, active, featured, isFeatured, categoryId, specs } = body
    const featuredVal = featured !== undefined ? featured : isFeatured

    const product = await prisma.product.update({
      where: { id: params.id },
      data: {
        ...(name && { name }),
        ...(description !== undefined && { description }),
        ...(active !== undefined && { active }),
        ...(featuredVal !== undefined && { isFeatured: !!featuredVal }),
        ...(categoryId && { categoryId }),
        ...(specs && { specs }),
      },
    })

    return NextResponse.json(product)
  } catch (error) {
    console.error('Admin product PATCH error:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}

export async function DELETE(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  const auth = await checkAdmin(request)
  if ('error' in auth) {
    return NextResponse.json({ error: auth.error }, { status: auth.status })
  }

  try {
    await prisma.product.delete({
      where: { id: params.id },
    })

    return NextResponse.json({ success: true })
  } catch (error) {
    console.error('Admin product DELETE error:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}

