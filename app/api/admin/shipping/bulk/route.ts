export const dynamic = 'force-dynamic'

import { NextRequest, NextResponse } from 'next/server'
import { checkAdmin, logAdminAction } from '@/lib/adminAuth'
import { prisma } from '@/lib/prisma'
import { planBulkShipping } from '@/lib/bulk-shipping'
import { changeOrderStatus } from '@/lib/order-service'

/**
 * Toplu kargolama. Body: { csv, apply? }. apply olmadan ön izleme; apply: true ile "kargoya verilebilir" satırlar
 * sırayla işlenir (sipariş durumu + müşteriye kargo e-postası), hatalı satırlar atlanır.
 */
export async function POST(request: NextRequest) {
  const auth = await checkAdmin(request)
  if ('error' in auth) return NextResponse.json({ error: auth.error }, { status: auth.status })
  const body = await request.json().catch(() => ({}))
  const csv = typeof body?.csv === 'string' ? body.csv : ''
  if (!csv.trim()) return NextResponse.json({ error: 'Dosya boş.' }, { status: 400 })
  if (csv.length > 1_000_000) return NextResponse.json({ error: 'Dosya çok büyük (en fazla 1 MB).' }, { status: 400 })

  // Tüm siparişler: kargolanamayanlar (iptal, zaten kargoda) "bulunamadı" yerine gerçek nedenle raporlansın
  const orders = await prisma.order.findMany({ select: { id: true, orderNo: true, status: true, paymentStatus: true } })
  const plan = planBulkShipping(csv, orders)
  if ('error' in plan) return NextResponse.json({ error: plan.error }, { status: 400 })
  if (body?.apply !== true) return NextResponse.json({ success: true, applied: false, ...plan })

  const results: { orderNo: string; ok: boolean; message?: string }[] = []
  for (const r of plan.rows) {
    if (r.status !== 'ship' || !r.orderId) continue
    try {
      // Kargoya verilmek için önce "hazırlanıyor" olmalı (geçiş kuralları lib/order-service)
      const current = orders.find((o) => o.id === r.orderId)
      if (current && current.status !== 'PICKING') await changeOrderStatus(r.orderId, 'PICKING', { actor: 'admin', notifyCustomer: false })
      await changeOrderStatus(r.orderId, 'SHIPPED', { actor: 'admin', carrier: r.carrierId, trackingNumber: r.trackingNumber })
      results.push({ orderNo: r.orderNo, ok: true })
    } catch (e) {
      results.push({ orderNo: r.orderNo, ok: false, message: e instanceof Error ? e.message : 'Hata' })
    }
  }
  const shipped = results.filter((x) => x.ok).length
  void logAdminAction(auth.actor, 'Toplu kargolama', { details: `${shipped} sipariş kargoya verildi; ${results.length - shipped} başarısız, ${plan.errors} satır atlandı` })
  return NextResponse.json({ success: true, applied: true, ...plan, shipped, results })
}
