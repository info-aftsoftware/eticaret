export const dynamic = 'force-dynamic'

/**
 * Admin: Stok override yönetimi (site mock ürünleri için).
 * Auth: Bearer JWT (firebase-session sonrası).
 */

import { NextRequest, NextResponse } from 'next/server'
import { processStockAlerts } from '@/lib/stock-alerts'
import { prisma } from '@/lib/prisma'
import { checkAdmin, logAdminAction } from '@/lib/adminAuth'
import { getClientIp } from '@/lib/rate-limit'
import { variantStockedIds } from '@/lib/catalog-merge'
import { notifyLowStockTransitions, readStocks } from '@/lib/low-stock'
import { revalidateStorefront } from '@/lib/storefront-revalidate'

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

    if ((await variantStockedIds([productId.trim()])).size) {
      return NextResponse.json({ error: 'Bu ürünün varyantları ayrı stoklanıyor; stoğu ürün düzenleyicisindeki varyant satırlarından girin.' }, { status: 409 })
    }
    const before = (await readStocks([productId.trim()])).get(productId.trim())
    const row = await prisma.stockOverride.upsert({
      where: { productId: productId.trim() },
      update: { stock: value },
      create: { productId: productId.trim(), stock: value },
    })
    // Stoğa giren ürünler için "stok gelince haber ver" e-postaları (yanıtı bekletmeden)
    if (value > 0) processStockAlerts([row.productId]).catch((e) => console.error('Stock alert error:', e))
    void notifyLowStockTransitions([{ productId: row.productId, before: before?.stock, after: value, name: before?.name }])
    // İşlem kaydı (A09): eski → yeni stok
    void logAdminAction(auth.actor, 'Stok güncellendi', {
      method: 'PATCH',
      path: '/api/admin/stock-overrides',
      ip: getClientIp(request),
      objectType: 'product',
      objectId: row.productId,
      changes: [{ field: 'stock', label: 'Stok', from: before?.stock != null ? String(before.stock) : null, to: String(value) }],
      details: `${before?.name ?? row.productId}: Stok ${before?.stock ?? '—'} → ${value}`,
    })
    revalidateStorefront()
    return NextResponse.json(row)
  } catch (error) {
    console.error('Admin stock-overrides PATCH error:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}
