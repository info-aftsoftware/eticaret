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
import { checkAdmin, logAdminAction } from '@/lib/adminAuth'
import { getMergedProducts, variantStockedIds } from '@/lib/catalog-merge'
import { notifyLowStockTransitions, readStocks } from '@/lib/low-stock'
import { revalidateStorefront } from '@/lib/storefront-revalidate'

export async function PATCH(request: NextRequest) {
  const auth = await checkAdmin(request)
  if ('error' in auth) {
    return NextResponse.json({ error: auth.error }, { status: auth.status })
  }

  try {
    const body = await request.json()
    const { ids, action, value } = body as {
      ids: string[]
      action: 'feature' | 'unfeature' | 'apply_discount' | 'reset_stock' | 'set_stock' | 'adjust_stock'
      /** adjust_stock: eklenecek (+) veya çıkarılacak (−) adet (A16); stok 0'ın altına inmez */
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
    const isStock = action === 'reset_stock' || action === 'set_stock' || action === 'adjust_stock'
    // Varyantları ayrı stoklanan ürünlerde stok varyant bazında düzenlenir; ürün bazında toplu stok atlanır
    const skipped = isStock ? await variantStockedIds(ids.map(String)) : new Set<string>()
    const stockIds = ids.map(String).filter((id) => !skipped.has(id))
    const before = isStock ? await readStocks(stockIds) : null

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
        stockIds.map((productId) =>
          prisma.stockOverride.upsert({
            where: { productId },
            update: { stock: 0 },
            create: { productId, stock: 0 },
          })
        )
      )
      affected = stockIds.length
    }

    else if (action === 'adjust_stock') {
      const delta = typeof value === 'number' && Number.isFinite(value) ? Math.trunc(value) : 0
      if (!delta) return NextResponse.json({ error: 'value: eklenecek veya çıkarılacak adet gerekli.' }, { status: 400 })
      await prisma.$transaction(
        stockIds.map((productId) => {
          const next = Math.max(0, (before?.get(productId)?.stock ?? 0) + delta)
          return prisma.stockOverride.upsert({ where: { productId }, update: { stock: next }, create: { productId, stock: next } })
        })
      )
      affected = stockIds.length
    }

    else if (action === 'set_stock') {
      const stockVal = typeof value === 'number' && value >= 0 ? Math.floor(value) : 0
      await prisma.$transaction(
        stockIds.map((productId) =>
          prisma.stockOverride.upsert({
            where: { productId },
            update: { stock: stockVal },
            create: { productId, stock: stockVal },
          })
        )
      )
      affected = stockIds.length
    }

    else {
      return NextResponse.json({ error: 'Bilinmeyen action.' }, { status: 400 })
    }

    const newStockOf = (id: string) =>
      action === 'reset_stock' ? 0
        : action === 'adjust_stock' ? Math.max(0, (before?.get(id)?.stock ?? 0) + Math.trunc(Number(value) || 0))
          : typeof value === 'number' && value >= 0 ? Math.floor(value) : 0

    // Stoğa giren ürünler için "stok gelince haber ver" e-postaları (yanıtı bekletmeden)
    processStockAlerts(ids.map(String)).catch((e) => console.error('Stock alert error:', e))
    if (before) {
      void notifyLowStockTransitions(stockIds.map((id) => ({ productId: id, before: before.get(id)?.stock, after: newStockOf(id), name: before.get(id)?.name })))
    }
    // İşlem kaydı (A09): toplu işlemde etkilenen her ürün (stokta eski → yeni) aranabilir olsun
    const ACTION_TR: Record<string, string> = { feature: 'Öne çıkarıldı', unfeature: 'Öne çıkarma kaldırıldı', apply_discount: `%${value} indirim kampanyası`, reset_stock: 'Stok sıfırlandı', set_stock: `Stok ${value} adede eşitlendi`, adjust_stock: `Stok ${Number(value) > 0 ? '+' : ''}${value} adet` }
    const targetIds = before ? stockIds : ids.map(String)
    void logAdminAction(auth.actor, `Toplu ürün işlemi: ${ACTION_TR[action] ?? action}`, {
      method: 'PATCH',
      path: '/api/admin/catalog/bulk',
      objectType: 'product',
      objectId: targetIds.length === 1 ? targetIds[0] : undefined,
      changes: targetIds.map((pid) =>
        before
          ? { field: `stock.${pid}`, label: `${before.get(pid)?.name ?? pid} stok`, from: before.get(pid)?.stock != null ? String(before.get(pid)!.stock) : null, to: String(newStockOf(pid)) }
          : { field: `${action}.${pid}`, label: ACTION_TR[action] ?? action, from: null, to: pid }
      ),
      details: `${affected} ürün: ${targetIds.slice(0, 20).join(', ')}${targetIds.length > 20 ? ` +${targetIds.length - 20}` : ''}${skipped.size ? ` · ayrı varyant stoklu ${skipped.size} ürün atlandı` : ''}`,
    })
    revalidateStorefront()
    return NextResponse.json({ success: true, affected, skippedVariantStock: [...skipped] })
  } catch (error) {
    console.error('Admin bulk PATCH error:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}
