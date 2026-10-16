export const dynamic = 'force-dynamic'

/** Admin: paketleme / sevk formu PDF'i (Prisma siparişleri). */

import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import { checkAdmin } from '@/lib/adminAuth'
import { generatePackingSlipPdf } from '@/lib/packing-slip'

export async function GET(request: NextRequest, props: { params: Promise<{ id: string }> }) {
  const params = await props.params;
  const auth = await checkAdmin(request)
  if ('error' in auth) return NextResponse.json({ error: auth.error }, { status: auth.status })

  const order = await prisma.order.findUnique({ where: { id: params.id }, include: { lines: true } })
  if (!order) return NextResponse.json({ error: 'Sipariş bulunamadı' }, { status: 404 })
  try {
    const pdf = await generatePackingSlipPdf(order)
    return new NextResponse(new Uint8Array(pdf), {
      headers: {
        'Content-Type': 'application/pdf',
        'Content-Disposition': `inline; filename="paketleme-${order.orderNo}.pdf"`,
        'Cache-Control': 'private, no-store',
      },
    })
  } catch (e) {
    console.error('Packing slip error:', e)
    return NextResponse.json({ error: 'Form oluşturulamadı' }, { status: 500 })
  }
}
