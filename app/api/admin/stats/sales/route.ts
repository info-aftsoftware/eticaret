/**
 * Admin Sales Stats API
 * GET /api/admin/stats/sales?period=7d|30d|today|90d
 * Tahsilat (ödenmiş, iadeler düşülmüş), sipariş hacmi (ödeme bekleyenler dahil), en çok satanlar ve durum dağılımı.
 * Tanımlar lib/revenue.ts'de; gün sınırları Türkiye saatine göre (lib/business-time.ts).
 * Dönemler bugün dahil son N İstanbul günüdür ("Bugün" yalnız bugünün 00.00'ından itibaren).
 */

import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import { checkAdmin } from '@/lib/adminAuth'
import { businessDateKey, businessDayRange } from '@/lib/business-time'
import { collectedOrderWhere, collectedOrders, volumeOrderWhere } from '@/lib/revenue'

const PERIOD_DAYS: Record<string, number> = { today: 1, '7d': 7, '30d': 30, '90d': 90 }
const round2 = (n: number) => Math.round(n * 100) / 100

export async function GET(request: NextRequest) {
  const auth = await checkAdmin(request)
  if ('error' in auth) {
    return NextResponse.json({ error: auth.error }, { status: auth.status })
  }

  try {
    const { searchParams } = new URL(request.url)
    const requested = searchParams.get('period') ?? '30d'
    const period = requested in PERIOD_DAYS ? requested : '30d'
    const { start: startDate, keys } = businessDayRange(PERIOD_DAYS[period])

    const [collected, volumeOrders, soldLines, statusCounts] = await Promise.all([
      collectedOrders({ gte: startDate }),
      prisma.order.findMany({ where: volumeOrderWhere({ gte: startDate }), select: { total: true, createdAt: true } }),
      // En çok satanlar: tahsil edilmiş siparişlerin satırları (ödeme bekleyen sipariş satış sayılmaz)
      prisma.orderLine.findMany({
        where: { order: collectedOrderWhere({ gte: startDate }) },
        select: { productName: true, quantity: true, lineTotal: true },
      }),
      // Durum dağılımı: dönemde oluşturulan tüm siparişler (iptal ve iade dahil)
      prisma.order.groupBy({
        by: ['status'],
        where: { createdAt: { gte: startDate } },
        _count: { _all: true },
        _sum: { total: true },
      }),
    ])

    // Günlük seriler: tahsilat ödeme gününe, sipariş hacmi sipariş gününe yazılır
    const daily = new Map(keys.map((k) => [k, { collected: 0, paidCount: 0, volume: 0, orderCount: 0 }]))
    for (const o of collected.orders) {
      const d = o.paidAt ? daily.get(businessDateKey(o.paidAt)) : undefined
      if (d) {
        d.collected += o.net
        d.paidCount += 1
      }
    }
    for (const o of volumeOrders) {
      const d = daily.get(businessDateKey(o.createdAt))
      if (d) {
        d.volume += o.total
        d.orderCount += 1
      }
    }
    const dailySeries = [...daily.entries()].map(([date, v]) => ({
      date,
      collected: round2(v.collected),
      paidCount: v.paidCount,
      volume: round2(v.volume),
      orderCount: v.orderCount,
    }))

    const productMap = new Map<string, { name: string; soldQty: number; grossAmount: number }>()
    for (const line of soldLines) {
      const row = productMap.get(line.productName) ?? { name: line.productName, soldQty: 0, grossAmount: 0 }
      row.soldQty += line.quantity
      row.grossAmount += line.lineTotal
      productMap.set(line.productName, row)
    }
    const topProducts = [...productMap.values()]
      .sort((a, b) => b.grossAmount - a.grossAmount)
      .slice(0, 10)
      .map((p) => ({ ...p, grossAmount: round2(p.grossAmount) }))

    const ordersByStatus = statusCounts.map((s) => ({
      status: s.status,
      count: s._count._all,
      total: round2(s._sum.total ?? 0),
    }))

    const volume = round2(volumeOrders.reduce((s, o) => s + o.total, 0))
    const paidCount = collected.orders.length

    return NextResponse.json({
      period,
      startDate: startDate.toISOString(),
      startDay: keys[0],
      endDay: keys[keys.length - 1],
      summary: {
        collected: collected.net,
        collectedGross: collected.gross,
        refunded: collected.refunded,
        paidCount,
        avgPaidOrder: paidCount ? round2(collected.net / paidCount) : 0,
        volume,
        orderCount: volumeOrders.length,
        allOrderCount: ordersByStatus.reduce((n, s) => n + s.count, 0),
      },
      dailySeries,
      topProducts,
      ordersByStatus,
    })
  } catch (error) {
    console.error('Admin stats/sales GET error:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}
