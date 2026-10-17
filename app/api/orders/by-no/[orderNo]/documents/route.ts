export const dynamic = 'force-dynamic'

/**
 * Müşteri belgeleri (PDF): ?type=contract (Ön Bilgilendirme + Mesafeli Satış Sözleşmesi) | ?type=invoice (yalnızca ödenmiş sipariş)
 * Yetki: sipariş sahibi (Bearer token) veya misafir için e-posta + telefon eşleşmesi.
 * Tercih edilen: POST { type, email, phone } (kişisel veri URL'de kalmaz). GET ?type=&email=&phone= eski istemciler için.
 */

import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import { getCustomerFromRequest } from '@/lib/customerAuth'
import { isRateLimited } from '@/lib/rate-limit'
import { canAccessOrder } from '@/lib/customer-order'
import { generateContractPdf } from '@/lib/legal/contract-pdf'
import { generateInvoicePDF } from '@/lib/pdf'
import { buildInvoiceDataFromPrisma } from '@/lib/invoice-data'

export async function GET(request: NextRequest, props: { params: Promise<{ orderNo: string }> }) {
  const params = await props.params
  const sp = request.nextUrl.searchParams
  return serveDocument(request, params.orderNo, sp.get('type'), { email: sp.get('email'), phone: sp.get('phone') })
}

export async function POST(request: NextRequest, props: { params: Promise<{ orderNo: string }> }) {
  const params = await props.params
  const body = await request.json().catch(() => ({}))
  const str = (v: unknown) => (typeof v === 'string' ? v.slice(0, 200) : null)
  return serveDocument(request, params.orderNo, str(body?.type), { email: str(body?.email), phone: str(body?.phone) })
}

async function serveDocument(
  request: NextRequest,
  orderNo: string,
  type: string | null,
  creds: { email: string | null; phone: string | null }
) {
  if (isRateLimited(request, 'order-documents', 20, 60_000)) {
    return NextResponse.json({ error: 'Çok fazla istek.' }, { status: 429 })
  }
  if (type !== 'contract' && type !== 'invoice') {
    return NextResponse.json({ error: 'Geçersiz belge türü' }, { status: 400 })
  }
  const order = await prisma.order.findUnique({ where: { orderNo }, include: { lines: true } })
  const userId = (await getCustomerFromRequest(request))?.userId ?? null
  if (!order || !canAccessOrder(order, userId, creds)) {
    return NextResponse.json({ error: 'Sipariş bulunamadı' }, { status: 404 })
  }
  if (type === 'invoice' && order.paymentStatus !== 'PAID') {
    return NextResponse.json({ error: 'Fatura, ödeme onaylandıktan sonra oluşturulur.' }, { status: 409 })
  }

  try {
    const pdf = type === 'contract'
      ? await generateContractPdf(order)
      : await generateInvoicePDF(order.orderNo, buildInvoiceDataFromPrisma(order))
    const filename = `${type === 'contract' ? 'sozlesme' : 'fatura'}-${order.orderNo}.pdf`
    return new NextResponse(new Uint8Array(pdf), {
      headers: {
        'Content-Type': 'application/pdf',
        'Content-Disposition': `attachment; filename="${filename}"`,
        'Cache-Control': 'private, no-store',
      },
    })
  } catch (e) {
    console.error('Order document error:', e)
    return NextResponse.json({ error: 'Belge oluşturulamadı' }, { status: 500 })
  }
}
