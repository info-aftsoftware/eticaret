import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import { toCustomerOrder, canAccessOrder } from '@/lib/customer-order'
import { getCustomerFromRequest } from '@/lib/customerAuth'
import { isRateLimited } from '@/lib/rate-limit'

/**
 * Sipariş detayı – orderNo ile. Sipariş numaraları sıralı olduğu için tek başına yetki sayılmaz.
 * Erişim yolları:
 *  1) Bearer token ile sipariş sahibi → tam sipariş
 *  2) e-posta + telefon ikisi de siparişle eşleşirse (misafir takibi) → tam sipariş
 *  3) session_id ödeme dönüş anahtarıyla eşleşirse (ödeme dönüş sayfası) → yalnızca durum
 * Tercih edilen: POST { email, phone } / { session_id } (kişisel veri URL'de, sunucu kayıtlarında ve
 * tarayıcı geçmişinde kalmasın). GET ?email=&phone=&session_id= eski istemciler için korunur.
 */

const notFound = () =>
  NextResponse.json({ success: false, error: 'Sipariş bulunamadı' }, { status: 404 })

async function lookup(
  request: NextRequest,
  orderNo: string,
  creds: { email?: string | null; phone?: string | null; sessionId?: string | null }
) {
  try {
    if (isRateLimited(request, 'order-by-no', 20, 60_000)) {
      return NextResponse.json(
        { success: false, error: 'Çok fazla istek. Lütfen kısa süre sonra tekrar deneyin.' },
        { status: 429 }
      )
    }
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

    const sessionId = creds.sessionId
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

    if (canAccessOrder(order, null, { email: creds.email, phone: creds.phone })) {
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

const s = (v: unknown, max = 200) => (typeof v === 'string' ? v.slice(0, max) : null)

export async function POST(request: NextRequest, { params }: { params: Promise<{ orderNo: string }> }) {
  const { orderNo } = await params
  const body = await request.json().catch(() => ({}))
  return lookup(request, orderNo, { email: s(body?.email), phone: s(body?.phone, 40), sessionId: s(body?.session_id) })
}

export async function GET(request: NextRequest, { params }: { params: Promise<{ orderNo: string }> }) {
  const { orderNo } = await params
  const sp = request.nextUrl.searchParams
  return lookup(request, orderNo, { email: sp.get('email'), phone: sp.get('phone'), sessionId: sp.get('session_id') })
}
