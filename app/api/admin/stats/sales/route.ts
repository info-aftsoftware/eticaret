/**
 * Admin Sales Stats API
 * GET /api/admin/stats/sales?period=7d|30d|today|90d
 * Satış istatistikleri: günlük ciro, en çok satan ürünler, sipariş durum dağılımı
 */

import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import { checkAdmin } from '@/lib/adminAuth'

function startOfDay(date: Date): Date {
  const d = new Date(date)
  d.setHours(0, 0, 0, 0)
  return d
}

export async function GET(request: NextRequest) {
  const auth = await checkAdmin(request)
  if ('error' in auth) {
    return NextResponse.json({ error: auth.error }, { status: auth.status })
  }

  try {
    const { searchParams } = new URL(request.url)
    const period = searchParams.get('period') ?? '30d'

    const now = new Date()
    let startDate: Date
    let days: number

    if (period === 'today') {
      startDate = startOfDay(now)
      days = 1
    } else if (period === '7d') {
      startDate = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000)
      days = 7
    } else if (period === '90d') {
      startDate = new Date(now.getTime() - 90 * 24 * 60 * 60 * 1000)
      days = 90
    } else {
      // 30d default
      startDate = new Date(now.getTime() - 30 * 24 * 60 * 60 * 1000)
      days = 30
    }

    // İptal ve iade edilen siparişler ciroya, sipariş sayısına ve en çok satanlara girmez; yalnızca durum dağılımında görünür
    const counted = { createdAt: { gte: startDate }, status: { notIn: ['CANCELLED' as const, 'RETURNED' as const] } }

    // Paralel sorgular
    const [orders, orderLines, statusCounts] = await Promise.all([
      prisma.order.findMany({
        where: counted,
        select: { id: true, total: true, createdAt: true, status: true },
        orderBy: { createdAt: 'asc' },
      }),
      prisma.orderLine.findMany({
        where: { order: counted },
        select: { productName: true, quantity: true, lineTotal: true, unitPrice: true },
      }),
      prisma.order.groupBy({
        by: ['status'],
        where: { createdAt: { gte: startDate } },
        _count: { _all: true },
        _sum: { total: true },
      }),
    ])

    // Günlük ciro dizisi (seçilen periyod)
    const dailyMap = new Map<string, { revenue: number; orderCount: number }>()

    // Günleri önceden doldur (boş günler de 0 gösterilsin)
    for (let i = days - 1; i >= 0; i--) {
      const d = new Date(now.getTime() - i * 24 * 60 * 60 * 1000)
      const key = d.toISOString().slice(0, 10)
      dailyMap.set(key, { revenue: 0, orderCount: 0 })
    }

    for (const o of orders) {
      const key = new Date(o.createdAt).toISOString().slice(0, 10)
      const existing = dailyMap.get(key)
      if (existing) {
        existing.revenue += o.total ?? 0
        existing.orderCount += 1
      }
    }

    const dailyRevenue = Array.from(dailyMap.entries()).map(([date, v]) => ({
      date,
      revenue: Math.round(v.revenue * 100) / 100,
      orderCount: v.orderCount,
    }))

    // En çok satan ürünler
    const productMap = new Map<string, { name: string; soldQty: number; revenue: number }>()
    for (const line of orderLines) {
      const existing = productMap.get(line.productName)
      if (existing) {
        existing.soldQty += line.quantity
        existing.revenue += line.lineTotal
      } else {
        productMap.set(line.productName, {
          name: line.productName,
          soldQty: line.quantity,
          revenue: line.lineTotal,
        })
      }
    }

    const topProducts = Array.from(productMap.values())
      .sort((a, b) => b.revenue - a.revenue)
      .slice(0, 10)
      .map((p) => ({ ...p, revenue: Math.round(p.revenue * 100) / 100 }))

    // Sipariş durum dağılımı
    const ordersByStatus = statusCounts.map((s) => ({
      status: s.status,
      count: s._count._all,
      revenue: Math.round((s._sum.total ?? 0) * 100) / 100,
    }))

    // Özet
    const totalRevenue = orders.reduce((sum, o) => sum + (o.total ?? 0), 0)
    const totalOrders = orders.length
    const avgOrderValue = totalOrders > 0 ? totalRevenue / totalOrders : 0

    return NextResponse.json({
      period,
      startDate: startDate.toISOString(),
      summary: {
        totalRevenue: Math.round(totalRevenue * 100) / 100,
        totalOrders,
        avgOrderValue: Math.round(avgOrderValue * 100) / 100,
      },
      dailyRevenue,
      topProducts,
      ordersByStatus,
    })
  } catch (error) {
    console.error('Admin stats/sales GET error:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}
