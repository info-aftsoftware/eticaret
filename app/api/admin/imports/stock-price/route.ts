export const dynamic = 'force-dynamic'

import { NextRequest, NextResponse } from 'next/server'
import { checkAdmin, logAdminAction } from '@/lib/adminAuth'
import { getMergedProducts } from '@/lib/catalog-merge'
import { prisma } from '@/lib/prisma'
import { planStockPriceImport } from '@/lib/stock-price-import'
import { notifyLowStockTransitions } from '@/lib/low-stock'
import { processStockAlerts } from '@/lib/stock-alerts'
import { revalidateStorefront } from '@/lib/storefront-revalidate'

/**
 * Toplu stok/fiyat içe aktarma. Body: { csv: string, apply?: boolean }.
 * apply olmadan yalnızca ön izleme planı döner. apply: true ile yalnızca "değişecek" satırlar yazılır, hatalı satırlar atlanır.
 */
export async function POST(request: NextRequest) {
  const auth = await checkAdmin(request)
  if ('error' in auth) return NextResponse.json({ error: auth.error }, { status: auth.status })
  const body = await request.json().catch(() => ({}))
  const csv = typeof body?.csv === 'string' ? body.csv : ''
  if (!csv.trim()) return NextResponse.json({ error: 'Dosya boş.' }, { status: 400 })
  if (csv.length > 2_000_000) return NextResponse.json({ error: 'Dosya çok büyük (en fazla 2 MB).' }, { status: 400 })

  const products = await getMergedProducts()
  const plan = planStockPriceImport(
    csv,
    products.map((p) => ({ id: p.id, sku: p.sku, name: p.name, price: p.price, stock: p.stock ?? null, isVariantProduct: p.isVariantProduct }))
  )
  if ('error' in plan) return NextResponse.json({ error: plan.error }, { status: 400 })
  if (body?.apply !== true) return NextResponse.json({ success: true, applied: false, ...plan })

  const changes = plan.rows.filter((r) => r.status === 'change' && r.id)
  const stockChanges = changes.filter((r) => r.newStock !== null && r.newStock !== r.oldStock)
  const priceChanges = changes.filter((r) => r.newPrice !== null && r.newPrice !== r.oldPrice)
  await prisma.$transaction([
    ...stockChanges.map((r) =>
      prisma.stockOverride.upsert({ where: { productId: r.id! }, update: { stock: r.newStock! }, create: { productId: r.id!, stock: r.newStock! } })
    ),
    ...priceChanges.map((r) =>
      prisma.productOverride.upsert({ where: { productId: r.id! }, update: { price: r.newPrice! }, create: { productId: r.id!, price: r.newPrice! } })
    ),
  ])

  void notifyLowStockTransitions(stockChanges.map((r) => ({ productId: r.id!, before: r.oldStock, after: r.newStock!, name: r.name ?? undefined })))
  processStockAlerts(stockChanges.map((r) => r.id!)).catch((e) => console.error('Stock alert error:', e))
  revalidateStorefront()
  void logAdminAction(auth.actor, 'Toplu stok/fiyat içe aktarıldı', {
    details: `${stockChanges.length} stok, ${priceChanges.length} fiyat değişikliği; ${plan.errors} satır atlandı`,
  })
  return NextResponse.json({ success: true, applied: true, ...plan, stockUpdated: stockChanges.length, priceUpdated: priceChanges.length })
}
