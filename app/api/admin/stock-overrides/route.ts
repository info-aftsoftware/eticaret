export const dynamic = 'force-dynamic'

/**
 * Admin: Stok override yönetimi (site mock ürünleri için).
 * Auth: Bearer JWT (firebase-session sonrası).
 */

import { NextRequest, NextResponse } from 'next/server'
import { processStockAlerts } from '@/lib/stock-alerts'
import { prisma } from '@/lib/prisma'
import { checkAdmin } from '@/lib/adminAuth'

export async function GET(request: NextRequest) {
  const auth = await checkAdmin(request)
  if ('error' in auth) return NextResponse.json({ error: auth.error }, { status: auth.status })

  try {
    const list = await prisma.stockOverride.findMany({
      orderBy: { productId: 'asc' },
    })
    return NextResponse.json(list)
  } catch (error) {
    console.error('Admin stock-overrides GET error:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}

export async function PATCH(request: NextRequest) {
  const auth = await checkAdmin(request)
  if ('error' in auth) return NextResponse.json({ error: auth.error }, { status: auth.status })

  try {
    const body = await request.json()
    const { productId, stock } = body as { productId?: string; stock?: number }
    if (!productId || typeof productId !== 'string' || productId.trim() === '') {
      return NextResponse.json({ error: 'productId gerekli' }, { status: 400 })
    }
    const value = typeof stock === 'number' ? Math.max(0, Math.floor(stock)) : 0

    const row = await prisma.stockOverride.upsert({
      where: { productId: productId.trim() },
      update: { stock: value },
      create: { productId: productId.trim(), stock: value },
    })
    // Stoğa giren ürünler için "stok gelince haber ver" e-postaları (yanıtı bekletmeden)
    if (value > 0) processStockAlerts([row.productId]).catch((e) => console.error('Stock alert error:', e))
    return NextResponse.json(row)
  } catch (error) {
    console.error('Admin stock-overrides PATCH error:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}
