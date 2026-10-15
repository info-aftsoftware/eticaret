export const dynamic = 'force-dynamic'

/**
 * Admin Stock Management API
 * Handles stock updates (Prisma Variant/Stock).
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
    const { searchParams } = new URL(request.url)
    const variantId = searchParams.get('variantId')

    if (variantId) {
      const stock = await prisma.stock.findUnique({
        where: { variantId },
        include: {
          variant: {
            include: {
              product: true,
            },
          },
        },
      })
      return NextResponse.json(stock)
    }

    const stocks = await prisma.stock.findMany({
      include: {
        variant: {
          include: {
            product: true,
          },
        },
      },
      orderBy: { updatedAt: 'desc' },
    })

    return NextResponse.json(stocks)
  } catch (error) {
    console.error('Admin stock GET error:', error)
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
    const { variantId, onHand, incoming, lot, location } = body

    // Update or create stock
    const stock = await prisma.stock.upsert({
      where: { variantId },
      update: {
        onHand: onHand !== undefined ? parseInt(onHand) : undefined,
        incoming: incoming !== undefined ? parseInt(incoming) : undefined,
        lot: lot || undefined,
        location: location || undefined,
      },
      create: {
        variantId,
        onHand: parseInt(onHand) || 0,
        reserved: 0,
        incoming: parseInt(incoming) || 0,
        lot: lot || null,
        location: location || null,
      },
    })

    return NextResponse.json(stock)
  } catch (error) {
    console.error('Admin stock POST error:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}

