export const dynamic = 'force-dynamic'

/**
 * Admin Stats API
 * GET /api/admin/stats
 * Dashboard için gerçek zamanlı metrikler döner.
 */

import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import { checkAdmin } from '@/lib/adminAuth'
import { getMergedProducts } from '@/lib/catalog-merge'
import { businessDayRange, businessDayStart, businessMonthStart } from '@/lib/business-time'
import { collectedOrderWhere, collectedOrders } from '@/lib/revenue'

export async function GET(request: NextRequest) {
  const auth = await checkAdmin(request)
  if ('error' in auth) {
    return NextResponse.json({ error: auth.error }, { status: auth.status })
  }

  try {
    // Bugünün ve ayın başlangıcı Türkiye saatine göre (sunucu UTC çalışsa da gece 00.00–03.00 önceki güne kaymaz)
    const todayStart = businessDayStart()
    const monthStart = businessMonthStart()

    // Paralel sorgular
    const [products, activeCoupons, todayOrders, pendingOrders, totalOrders] = await Promise.all([
      getMergedProducts(),
      prisma.discount.count({ where: { active: true } }),
      prisma.order.count({ where: { createdAt: { gte: todayStart } } }),
      prisma.order.count({ where: { status: 'PENDING' } }),
      prisma.order.count(),
    ])

    const totalProducts = products.length
    const outOfStockProducts = products.filter((p) => (p.stock ?? 0) === 0).length

    // Tahsilat: ödemesi alınmış, iptal/iade edilmemiş siparişler, ödeme tarihine göre, ücret iadeleri düşülmüş (lib/revenue)
    const [todayCollected, monthCollected] = await Promise.all([
      collectedOrders({ gte: todayStart }),
      collectedOrders({ gte: monthStart }),
    ])

    const [awaitingPayment, toShip] = await Promise.all([
      prisma.order.count({ where: { status: 'PENDING', paymentStatus: { not: 'PAID' } } }),
      prisma.order.count({ where: { status: { in: ['PAID', 'PICKING'] } } }),
    ])

    // En çok satanlar (son 30 gün, ödenmiş ve iade/iptal edilmemiş siparişler)
    const since = businessDayRange(30).start
    const soldLines = await prisma.orderLine.findMany({
      where: { order: collectedOrderWhere({ gte: since }) },
      select: { productName: true, quantity: true, lineTotal: true, variantMatrix: true },
    })
    const byProduct = new Map<string, { productId: string | null; name: string; quantity: number; revenue: number }>()
    for (const l of soldLines) {
      const productId = (l.variantMatrix as { productId?: string } | null)?.productId ?? null
      const key = productId ?? l.productName
      const row = byProduct.get(key) ?? { productId, name: l.productName, quantity: 0, revenue: 0 }
      row.quantity += l.quantity
      row.revenue += l.lineTotal
      byProduct.set(key, row)
    }
    const topProducts = [...byProduct.values()].sort((a, b) => b.quantity - a.quantity).slice(0, 5)

    // Düşük stok ve "stok gelince haber ver" talep sinyali
    const pendingAlerts = await prisma.stockAlert.groupBy({ by: ['productId'], where: { notifiedAt: null }, _count: { _all: true } })
    const alertMap = new Map(pendingAlerts.map((a) => [a.productId, a._count._all]))
    const lowStock = products
      .filter((p) => (p.stock ?? 0) <= 5)
      .map((p) => ({ id: p.id, name: p.name, stock: p.stock ?? 0, waiting: alertMap.get(p.id) ?? 0 }))
      .sort((a, b) => b.waiting - a.waiting || a.stock - b.stock)
      .slice(0, 8)

    return NextResponse.json({
      topProducts,
      lowStock,
      totalProducts,
      outOfStockProducts,
      activeCoupons,
      todayOrders,
      pendingOrders,
      totalOrders,
      todayRevenue: todayCollected.net,
      monthRevenue: monthCollected.net,
      monthRefunded: monthCollected.refunded,
      awaitingPayment,
      toShip,
    })
  } catch (error) {
    console.error('Admin stats GET error:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}
