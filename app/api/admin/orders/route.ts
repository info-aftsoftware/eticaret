export const dynamic = 'force-dynamic'

/**
 * Admin: Sipariş listesi (yalnızca Prisma siparişleri).
 * Eski Firestore users/{uid}/orders yolu artık listelenmez (istemciden yazılabildiği için güvenilir değil).
 *
 * Query: page, pageSize (≤100), q (sipariş no, ad, e-posta, telefon), tab, paymentStatus,
 *        paymentMethod, from, to (YYYY-MM-DD), sort (createdAt_desc | createdAt_asc | total_desc | total_asc)
 * Yanıt: { orders, total, page, pageSize, counts }
 */

import { NextRequest, NextResponse } from 'next/server'
import type { Prisma, OrderStatus, PaymentStatus } from '@prisma/client'
import { prisma } from '@/lib/prisma'
import { checkAdmin } from '@/lib/adminAuth'
import { allowedNextStatuses, getCancellationRequest } from '@/lib/order-service'

const OPEN_RETURN_STATUSES = ['REQUESTED', 'APPROVED', 'RECEIVED']
/** Açık müşteri iptal talebi (lib/order-service: notes.cancelRequest.status === 'REQUESTED') */
const OPEN_CANCEL_REQUEST_WHERE: Prisma.OrderWhereInput = { notes: { contains: '"cancelRequest":{"status":"REQUESTED"' } }
const PAYMENT_STATUSES: PaymentStatus[] = ['PENDING', 'PAID', 'FAILED', 'REFUNDED', 'PARTIALLY_REFUNDED']

/** Durum sekmeleri → Prisma koşulu */
const TABS: Record<string, Prisma.OrderWhereInput> = {
  all: {},
  awaiting_payment: { status: 'PENDING', paymentStatus: { not: 'PAID' } },
  /** Havale/EFT ile verilip ödemesi onay bekleyen siparişler */
  awaiting_transfer: { status: 'PENDING', paymentMethod: 'bank_transfer', paymentStatus: { not: 'PAID' } },
  to_prepare: { paymentStatus: 'PAID', status: { in: ['PENDING', 'PAID', 'CONFIRMED', 'PROCESSING'] } },
  picking: { status: 'PICKING' },
  shipped: { status: 'SHIPPED' },
  delivered: { status: 'DELIVERED' },
  cancelled: { status: 'CANCELLED' },
  returned: { status: 'RETURNED' },
  cancel_requests: OPEN_CANCEL_REQUEST_WHERE,
  open_returns: { returnRequests: { some: { status: { in: OPEN_RETURN_STATUSES } } } },
}

function parseDay(s: string | null, endOfDay = false): Date | undefined {
  if (!s || !/^\d{4}-\d{2}-\d{2}$/.test(s)) return undefined
  const d = new Date(`${s}T${endOfDay ? '23:59:59.999' : '00:00:00.000'}`)
  return Number.isNaN(d.getTime()) ? undefined : d
}

function baseWhere(sp: URLSearchParams): Prisma.OrderWhereInput {
  const and: Prisma.OrderWhereInput[] = []
  const q = (sp.get('q') || '').trim().slice(0, 100)
  if (q) {
    const digits = q.replace(/\D/g, '')
    const or: Prisma.OrderWhereInput[] = [
      { orderNo: { contains: q.toUpperCase() } },
      { shippingName: { contains: q } },
      { shippingEmail: { contains: q.toLowerCase() } },
      { user: { email: { contains: q.toLowerCase() } } },
      { shippingPhone: { contains: q } },
    ]
    // Telefon "0532 123 45 67" ↔ "5321234567" gibi yazımlar: son 7+ hane ile ara
    if (digits.length >= 7) or.push({ shippingPhone: { contains: digits.slice(-7) } })
    and.push({ OR: or })
  }
  const ps = (sp.get('paymentStatus') || '').toUpperCase()
  if (PAYMENT_STATUSES.includes(ps as PaymentStatus)) and.push({ paymentStatus: ps as PaymentStatus })
  const pm = sp.get('paymentMethod')
  if (pm === 'bank_transfer') and.push({ paymentMethod: 'bank_transfer' })
  else if (pm === 'card') and.push({ paymentMethod: { in: ['card', 'stripe', 'paytr'] } })
  const from = parseDay(sp.get('from'))
  const to = parseDay(sp.get('to'), true)
  if (from || to) and.push({ createdAt: { ...(from && { gte: from }), ...(to && { lte: to }) } })
  return and.length ? { AND: and } : {}
}

export async function GET(request: NextRequest) {
  const auth = await checkAdmin(request)
  if ('error' in auth) {
    return NextResponse.json({ error: auth.error }, { status: auth.status })
  }

  try {
    const sp = new URL(request.url).searchParams
    const pageSize = Math.min(Math.max(parseInt(sp.get('pageSize') || '25', 10) || 25, 1), 100)
    const page = Math.max(parseInt(sp.get('page') || '1', 10) || 1, 1)
    const tab = sp.get('tab') && TABS[sp.get('tab')!] ? sp.get('tab')! : 'all'
    // Geriye dönük: ?status=PENDING
    const rawStatus = (sp.get('status') || '').toUpperCase()
    const base = baseWhere(sp)
    const statusWhere: Prisma.OrderWhereInput = rawStatus ? { status: rawStatus as OrderStatus } : TABS[tab]
    const where: Prisma.OrderWhereInput = { AND: [base, statusWhere] }

    const sort = sp.get('sort') || 'createdAt_desc'
    const orderBy: Prisma.OrderOrderByWithRelationInput =
      sort === 'createdAt_asc' ? { createdAt: 'asc' } : sort === 'total_desc' ? { total: 'desc' } : sort === 'total_asc' ? { total: 'asc' } : { createdAt: 'desc' }

    const [total, rows, countEntries] = await Promise.all([
      prisma.order.count({ where }),
      prisma.order.findMany({
        where,
        orderBy,
        skip: (page - 1) * pageSize,
        take: pageSize,
        select: {
          id: true,
          orderNo: true,
          createdAt: true,
          userId: true,
          shippingName: true,
          shippingEmail: true,
          shippingPhone: true,
          shippingCity: true,
          total: true,
          status: true,
          paymentStatus: true,
          paymentMethod: true,
          trackingNumber: true,
          shippingQuoteProvider: true,
          notes: true,
          user: { select: { email: true, customerNo: true } },
          _count: { select: { lines: true } },
          returnRequests: { where: { status: { in: OPEN_RETURN_STATUSES } }, select: { id: true } },
          events: { where: { type: 'payment_notice' }, select: { id: true }, take: 1 },
        },
      }),
      Promise.all(Object.entries(TABS).map(async ([key, w]) => [key, await prisma.order.count({ where: { AND: [base, w] } })] as const)),
    ])

    const orders = rows.map((o) => ({
      id: o.id,
      orderNo: o.orderNo,
      createdAt: o.createdAt.toISOString(),
      userId: o.userId,
      customerNo: o.user?.customerNo ?? null,
      customerName: o.shippingName,
      customerEmail: o.shippingEmail || o.user?.email || null,
      phone: o.shippingPhone,
      city: o.shippingCity,
      total: o.total,
      status: o.status,
      paymentStatus: o.paymentStatus,
      paymentMethod: o.paymentMethod,
      trackingNumber: o.trackingNumber,
      // Kargo ücretinin kaynağı; kayıt öncesi siparişler Geliver listesiyle fiyatlanmıştı
      shippingProvider: o.shippingQuoteProvider === 'navlungo' ? 'Navlungo' : 'Geliver',
      itemCount: o._count.lines,
      openReturns: o.returnRequests.length,
      paymentNotified: o.events.length > 0,
      cancelRequested: getCancellationRequest(o)?.status === 'REQUESTED',
      allowed: allowedNextStatuses(o.status),
    }))

    return NextResponse.json({ orders, total, page, pageSize, counts: Object.fromEntries(countEntries) })
  } catch (error) {
    console.error('Admin orders list error:', error)
    return NextResponse.json({ error: 'Siparişler getirilirken bir hata oluştu' }, { status: 500 })
  }
}
