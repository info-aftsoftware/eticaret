import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import { toCustomerOrder } from '@/lib/customer-order'
import { getCustomerFromRequest } from '@/lib/customerAuth'
import { isRateLimited } from '@/lib/rate-limit'

/**
 * Sipariş detayı – orderNo ile. Sipariş numaraları sıralı olduğu için tek başına yetki sayılmaz.
 * Erişim yolları:
 *  1) Bearer token ile sipariş sahibi → tam sipariş
 *  2) ?email=&phone= ikisi de siparişle eşleşirse (misafir takibi) → tam sipariş
 *  3) ?session_id= ödeme sağlayıcısı referansıyla eşleşirse (ödeme dönüş sayfası) → yalnızca durum
 */
function normalizePhone(s: string | null | undefined): string {
  if (!s || typeof s !== 'string') return ''
  return s.replace(/\D/g, '').replace(/^90/, '').replace(/^0/, '')
}

const notFound = () =>
  NextResponse.json({ success: false, error: 'Sipariş bulunamadı' }, { status: 404 })

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ orderNo: string }> }
) {
  try {
    if (isRateLimited(request, 'order-by-no', 20, 60_000)) {
      return NextResponse.json(
        { success: false, error: 'Çok fazla istek. Lütfen kısa süre sonra tekrar deneyin.' },
        { status: 429 }
      )
    }

    const { orderNo } = await params
    if (!orderNo) {
      return NextResponse.json({ error: 'orderNo gerekli' }, { status: 400 })
    }

    const order = await prisma.order.findUnique({
      where: { orderNo },
      include: { lines: true, events: { where: { visibleToCustomer: true }, orderBy: { createdAt: 'asc' } }, returnRequests: { orderBy: { createdAt: 'asc' } } },
    })
    if (!order) return notFound()

    const userId = (await getCustomerFromRequest(request))?.userId ?? null
    if (order.userId && userId && order.userId === userId) {
      return NextResponse.json({ success: true, order: toCustomerOrder(order) })
    }

    const sp = request.nextUrl.searchParams

    const sessionId = sp.get('session_id')
    if (sessionId && order.paymentProviderRef && sessionId === order.paymentProviderRef) {
      return NextResponse.json({
        success: true,
        order: {
          orderNo: order.orderNo,
          status: order.status,
          paymentStatus: order.paymentStatus,
          total: order.total,
        },
      })
    }

    const email = sp.get('email')?.trim().toLowerCase()
    const phone = normalizePhone(sp.get('phone'))
    const emailMatch = !!email && !!order.shippingEmail && order.shippingEmail.trim().toLowerCase() === email
    const phoneMatch = phone.length >= 10 && normalizePhone(order.shippingPhone) === phone
    if (emailMatch && phoneMatch) {
      return NextResponse.json({ success: true, order: toCustomerOrder(order) })
    }

    // Yetkisiz isteklerde siparişin varlığını sızdırma
    return notFound()
  } catch (error) {
    console.error('Error fetching order by no:', error)
    return NextResponse.json(
      { success: false, error: 'Sipariş getirilirken bir hata oluştu' },
      { status: 500 }
    )
  }
}
