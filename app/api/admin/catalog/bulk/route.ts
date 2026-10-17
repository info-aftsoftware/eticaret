/**
 * Admin Bulk Catalog API
 * PATCH /api/admin/catalog/bulk
 * Seçilen N ürüne tek istekle toplu işlem uygular.
 *
 * Body: {
 *   ids: string[]
 *   action: 'feature' | 'unfeature' | 'apply_discount' | 'reset_stock' | 'set_stock'
 *   value?: number  // apply_discount → % oran (0-99), set_stock → adet
 * }
 */

import { NextRequest, NextResponse } from 'next/server'
import { invalidateCampaignCache } from '@/lib/discounts'
import { processStockAlerts } from '@/lib/stock-alerts'
import { prisma } from '@/lib/prisma'
import { checkAdmin } from '@/lib/adminAuth'
import { getMergedProducts } from '@/lib/catalog-merge'
import { notifyLowStockTransitions, readStocks } from '@/lib/low-stock'

export async function PATCH(request: NextRequest) {
  const auth = await checkAdmin(request)
  if ('error' in auth) {
    return NextResponse.json({ error: auth.error }, { status: auth.status })
  }

  try {
    const body = await request.json()
    const { ids, action, value } = body as {
      ids: string[]
      action: 'feature' | 'unfeature' | 'apply_discount' | 'reset_stock' | 'set_stock'
      value?: number
    }

    if (!Array.isArray(ids) || ids.length === 0) {
      return NextResponse.json({ error: 'ids gerekli.' }, { status: 400 })
    }
    if (!action) {
      return NextResponse.json({ error: 'action gerekli.' }, { status: 400 })
    }

    let affected = 0
    // Düşük stok uyarısı için değişiklik öncesi stoklar
    const before = action === 'reset_stock' || action === 'set_stock' ? await readStocks(ids.map(String)) : null

    if (action === 'feature' || action === 'unfeature') {
      const featured = action === 'feature'
      // Upsert her ID için — transaction içinde
      await prisma.$transaction(
        ids.map((productId) =>
          prisma.productOverride.upsert({
            where: { productId },
            update: { featured },
            create: { productId, featured },
          })
        )
      )
      affected = ids.length
    }

    else if (action === 'apply_discount') {
      if (typeof value !== 'number' || value <= 0 || value >= 100) {
        return NextResponse.json({ error: 'value: 1-99 arası indirim oranı gerekli.' }, { status: 400 })
      }
      // Fiyatı kalıcı değiştirmek yerine geri alınabilir bir kampanya oluşturulur (Admin > İndirimler'den
      // kapatılabilir/silinebilir; üst üste uygulanınca indirimler birikmez, en avantajlısı geçerlidir).
      const allProducts = await getMergedProducts()
      const idSet = new Set(ids)
      const productIds = allProducts.filter((p) => idSet.has(p.id)).map((p) => p.id)
      if (productIds.length > 0) {
        await prisma.discount.create({
          data: {
            name: `Toplu indirim %${value} (${productIds.length} ürün, ${new Date().toLocaleDateString('tr-TR')})`,
            scope: 'PRODUCT',
            productIds,
            type: 'PERCENT',
            value,
            active: true,
          },
        })
        invalidateCampaignCache()
      }
      affected = productIds.length
    }

    else if (action === 'reset_stock') {
      await prisma.$transaction(
        ids.map((productId) =>
          prisma.stockOverride.upsert({
            where: { productId },
            update: { stock: 0 },
            create: { productId, stock: 0 },
          })
        )
      )
      affected = ids.length
    }

    else if (action === 'set_stock') {
      const stockVal = typeof value === 'number' && value >= 0 ? Math.floor(value) : 0
      await prisma.$transaction(
        ids.map((productId) =>
          prisma.stockOverride.upsert({
            where: { productId },
            update: { stock: stockVal },
            create: { productId, stock: stockVal },
          })
        )
      )
      affected = ids.length
    }

    else {
      return NextResponse.json({ error: 'Bilinmeyen action.' }, { status: 400 })
    }

    // Stoğa giren ürünler için "stok gelince haber ver" e-postaları (yanıtı bekletmeden)
    processStockAlerts(ids.map(String)).catch((e) => console.error('Stock alert error:', e))
    if (before) {
      const after = action === 'reset_stock' ? 0 : typeof value === 'number' && value >= 0 ? Math.floor(value) : 0
      void notifyLowStockTransitions(ids.map((id) => ({ productId: id, before: before.get(id)?.stock, after, name: before.get(id)?.name })))
    }
    return NextResponse.json({ success: true, affected })
  } catch (error) {
    console.error('Admin bulk PATCH error:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}
