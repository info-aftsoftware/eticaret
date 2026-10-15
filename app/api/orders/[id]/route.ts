export const dynamic = 'force-dynamic'

import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import { toCustomerOrder } from '@/lib/customer-order'
import { getCustomerFromRequest } from '@/lib/customerAuth'

// Static export için gerekli - Next.js 14 nested route support
export function generateStaticParams() {
  return []
}

/**
 * Müşterinin kendi siparişi (id ile). Auth zorunlu; yalnızca sipariş sahibi görebilir.
 * Durum güncelleme yalnızca admin API'sinden yapılır: PATCH /api/admin/orders/[id].
 */
export async function GET(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const userId = (await getCustomerFromRequest(request))?.userId ?? null
    if (!userId) {
      return NextResponse.json(
        { success: false, error: 'Giriş yapmanız gerekiyor' },
        { status: 401 }
      )
    }

    const order = await prisma.order.findUnique({
      where: { id: params.id },
      include: { lines: true, events: { where: { visibleToCustomer: true }, orderBy: { createdAt: 'asc' } }, returnRequests: { orderBy: { createdAt: 'asc' } } },
    })

    // Başkasının siparişi için de 404 dön (varlığını sızdırma)
    if (!order || order.userId !== userId) {
      return NextResponse.json(
        { success: false, error: 'Sipariş bulunamadı' },
        { status: 404 }
      )
    }

    return NextResponse.json({
      success: true,
      order: toCustomerOrder(order),
    })
  } catch (error) {
    console.error('Error fetching order:', error)
    return NextResponse.json(
      { success: false, error: 'Sipariş getirilirken bir hata oluştu' },
      { status: 500 }
    )
  }
}
