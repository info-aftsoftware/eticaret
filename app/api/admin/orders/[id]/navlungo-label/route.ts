export const dynamic = 'force-dynamic'

/**
 * Admin: Navlungo gönderi etiketi (PDF). Navlungo PDF'i base64 verirse doğrudan döner, yalnızca bağlantı verirse
 * oraya yönlendirir. Etiket gönderi oluşturulduktan biraz sonra hazır olur; o zamana kadar 409.
 */

import { NextRequest, NextResponse } from 'next/server'
import { checkAdmin } from '@/lib/adminAuth'
import { reportError } from '@/lib/alerts'
import { OrderTransitionError } from '@/lib/order-service'
import { getNavlungoLabel } from '@/lib/shipping/navlungo-shipments'

export async function GET(request: NextRequest, props: { params: Promise<{ id: string }> }) {
  const params = await props.params
  const auth = await checkAdmin(request)
  if ('error' in auth) return NextResponse.json({ error: auth.error }, { status: auth.status })

  try {
    const label = await getNavlungoLabel(params.id)
    if (label.pdf) {
      return new NextResponse(new Uint8Array(label.pdf), {
        headers: {
          'Content-Type': 'application/pdf',
          'Content-Disposition': `inline; filename="navlungo-etiket-${label.orderNo}.pdf"`,
          'Cache-Control': 'private, no-store',
        },
      })
    }
    return NextResponse.redirect(label.url!, 302)
  } catch (e) {
    if (e instanceof OrderTransitionError) return NextResponse.json({ error: e.message }, { status: 409 })
    await reportError('navlungo-etiket', e, { orderId: params.id })
    return NextResponse.json({ error: 'Etiket alınamadı' }, { status: 500 })
  }
}
