export const dynamic = 'force-dynamic'

import { NextRequest, NextResponse } from 'next/server'
import { checkAdmin } from '@/lib/adminAuth'
import { prisma } from '@/lib/prisma'
import { renderShippingLabels } from '@/lib/shipping-label'

/**
 * Kargo etiketleri (PDF, 10×15 cm): ?ids=ID1,ID2 seçili siparişler · ?status=PICKING hazırlanan tüm siparişler (en fazla 100).
 */
export async function GET(request: NextRequest) {
  const auth = await checkAdmin(request)
  if ('error' in auth) return NextResponse.json({ error: auth.error }, { status: auth.status })
  const sp = request.nextUrl.searchParams
  const ids = (sp.get('ids') ?? '').split(',').map((s) => s.trim()).filter(Boolean).slice(0, 100)
  const status = sp.get('status')
  if (!ids.length && status !== 'PICKING') return NextResponse.json({ error: 'ids veya status=PICKING gereklidir' }, { status: 400 })
  const orders = await prisma.order.findMany({
    where: ids.length ? { id: { in: ids } } : { status: 'PICKING' },
    include: { lines: true },
    orderBy: { createdAt: 'asc' },
    take: 100,
  })
  if (!orders.length) return NextResponse.json({ error: 'Etiket basılacak sipariş yok.' }, { status: 404 })
  const pdf = await renderShippingLabels(orders)
  return new NextResponse(new Uint8Array(pdf), {
    headers: {
      'Content-Type': 'application/pdf',
      'Content-Disposition': `inline; filename="kargo-etiketi-${orders.length === 1 ? orders[0].orderNo : orders.length}.pdf"`,
      'Cache-Control': 'no-store',
    },
  })
}
