/**
 * Admin sipariş detayı ve işlemleri (Prisma siparişleri).
 * İşlemler lib/order-service üzerinden yapılır; böylece zaman çizelgesi, e-postalar ve stok tutarlı kalır.
 */

import { NextResponse } from 'next/server'
import { reportError } from '@/lib/alerts'
import type { OrderStatus } from '@prisma/client'
import { prisma } from '@/lib/prisma'
import { getAllCarriers, getCarrier, orderTrackingUrl } from '@/lib/shipping/carriers'
import { shippingQuoteView } from '@/lib/shipping/quote-view'
import { NavlungoError } from '@/lib/shipping/navlungo-api'
import { createNavlungoShipment, navlungoShipmentView, syncNavlungoShipment } from '@/lib/shipping/navlungo-shipments'
import { GeliverError } from '@/lib/shipping/geliver-api'
import {
  buyGeliverLabel,
  cancelGeliverShipment,
  geliverShipmentView,
  getGeliverOffers,
  linkGeliverShipment,
  syncGeliverShipment,
  unlinkGeliverShipment,
} from '@/lib/shipping/geliver-shipments'
import {
  allowedNextStatuses,
  approveCancellationRequest,
  changeOrderStatus,
  getCancellationRequest,
  rejectCancellationRequest,
  logOrderEvent,
  markOrderPaid,
  updateShipment,
  OrderTransitionError,
  ORDER_STATUS_LABELS_TR,
} from '@/lib/order-service'
import { customerKeyForOrder, userKey } from '@/lib/admin-customers'
import { updateReturnRequest, suggestedRefund, RETURN_TYPES, RETURN_STATUS_LABELS, type ReturnType } from '@/lib/return-service'

const ORDER_STATUSES: OrderStatus[] = ['PENDING', 'CONFIRMED', 'PROCESSING', 'PAID', 'PICKING', 'SHIPPED', 'DELIVERED', 'CANCELLED', 'RETURNED']

/** Eski admin arayüzünden gelen küçük harfli değerler → OrderStatus */
function normalizeStatus(s: unknown): OrderStatus | undefined {
  if (typeof s !== 'string' || !s) return undefined
  const map: Record<string, OrderStatus> = { confirmed: 'PICKING', processing: 'PICKING', preparing: 'PICKING' }
  const up = (map[s.toLowerCase()] ?? s.toUpperCase()) as OrderStatus
  return ORDER_STATUSES.includes(up) ? up : undefined
}

function parseConsents(notes: string | null) {
  try {
    const n = notes ? JSON.parse(notes) : null
    return n?.consents ?? null
  } catch {
    return null
  }
}

export async function getAdminOrderDetail(id: string) {
  const order = await prisma.order.findUnique({
    where: { id },
    include: {
      lines: true,
      events: { orderBy: { createdAt: 'asc' } },
      returnRequests: { orderBy: { createdAt: 'asc' } },
      user: { select: { id: true, email: true, name: true, customerNo: true } },
    },
  })
  if (!order) return null
  const carrier = order.shippingCarrier ? getCarrier(order.shippingCarrier) : undefined
  // Müşteri kartı: misafir siparişi üye e-postasıyla eşleşiyorsa üyenin kartı
  let customerKey = customerKeyForOrder(order)
  if (!order.userId && order.shippingEmail) {
    const u = await prisma.user.findUnique({ where: { email: order.shippingEmail.toLowerCase() }, select: { id: true } })
    if (u) customerKey = userKey(u.id)
  }
  return {
    customerKey,
    id: order.id,
    source: 'prisma' as const,
    orderId: order.orderNo,
    userId: order.userId ?? undefined,
    customerNo: order.user?.customerNo ?? null,
    customer: {
      name: order.shippingName,
      email: order.shippingEmail ?? order.user?.email ?? '',
      phone: order.shippingPhone,
      addressLine: order.shippingAddress,
      city: order.shippingCity,
      district: order.shippingDistrict,
      postalCode: order.shippingPostalCode,
      country: order.shippingCountry,
      billingType: order.billingType,
      companyName: order.billingName,
      billingName: order.billingName,
      taxId: order.billingTaxId,
      taxOffice: order.billingTaxOffice,
      billingAddress: [order.billingAddress, order.billingDistrict, order.billingCity].filter(Boolean).join(', '),
    },
    items: order.lines.map((l) => ({
      id: l.id,
      name: l.productName,
      productId: (l.variantMatrix as { productId?: string } | null)?.productId ?? null,
      price: l.unitPrice,
      unitPrice: l.unitPrice,
      quantity: l.quantity,
      lineTotal: l.lineTotal,
    })),
    pricing: {
      subtotal: order.subtotal,
      couponCode: order.couponCode,
      couponDiscount: order.couponDiscount,
      paymentDiscount: order.paymentDiscount,
      discount: order.discount,
      tax: order.vatTotal,
      shipping: order.shippingCost,
      total: order.total,
    },
    paymentMethod: order.paymentMethod,
    paymentProviderRef: order.paymentProviderRef,
    status: order.status,
    statusLabel: ORDER_STATUS_LABELS_TR[order.status],
    paymentStatus: order.paymentStatus,
    cancelRequest: getCancellationRequest(order),
    allowedNextStatuses: allowedNextStatuses(order.status).map((s) => ({ value: s, label: ORDER_STATUS_LABELS_TR[s] })),
    shippingCarrier: order.shippingCarrier,
    shippingCarrierName: carrier?.name ?? null,
    /** Kargo ücretinin kaynağı (Geliver / Navlungo) ve firması */
    shippingQuote: shippingQuoteView(order),
    trackingNumber: order.trackingNumber ?? undefined,
    trackingUrl: orderTrackingUrl(order),
    /** Navlungo gönderisi (yapılandırılmamışsa enabled: false) */
    navlungo: navlungoShipmentView(order),
    /** Geliver gönderi takibi (yapılandırılmamışsa enabled: false) */
    geliver: geliverShipmentView(order),
    carriers: getAllCarriers().map((c) => ({ id: c.id, name: c.name })),
    customerNote: order.customerNote,
    adminNote: order.adminNote,
    consents: parseConsents(order.notes),
    createdAt: order.createdAt.toISOString(),
    paidAt: order.paidAt?.toISOString() ?? null,
    shippedAt: order.shippedAt?.toISOString() ?? null,
    deliveredAt: order.deliveredAt?.toISOString() ?? null,
    cancelledAt: order.cancelledAt?.toISOString() ?? null,
    returnRequests: order.returnRequests.map((r) => {
      const items = Array.isArray(r.items) ? (r.items as { lineId: string; name: string; quantity: number }[]) : []
      return {
        id: r.id,
        requestNo: r.requestNo,
        type: r.type,
        typeLabel: RETURN_TYPES[r.type as ReturnType] ?? r.type,
        status: r.status,
        statusLabel: RETURN_STATUS_LABELS[r.status] ?? r.status,
        items,
        reason: r.reason,
        customerNote: r.customerNote,
        adminNote: r.adminNote,
        rejectReason: r.rejectReason,
        returnCarrier: r.returnCarrier,
        returnCarrierName: r.returnCarrier ? getCarrier(r.returnCarrier)?.name ?? r.returnCarrier : null,
        returnCode: r.returnCode,
        refundAmount: r.refundAmount,
        suggestedRefund: suggestedRefund(order, items, r.id),
        createdAt: r.createdAt.toISOString(),
        approvedAt: r.approvedAt?.toISOString() ?? null,
        receivedAt: r.receivedAt?.toISOString() ?? null,
        refundedAt: r.refundedAt?.toISOString() ?? null,
      }
    }),
    events: order.events.map((e) => ({
      id: e.id,
      type: e.type,
      status: e.status,
      message: e.message,
      actor: e.actor,
      visibleToCustomer: e.visibleToCustomer,
      createdAt: e.createdAt.toISOString(),
    })),
  }
}

/**
 * Body (action tabanlı):
 *  { action: 'mark_paid', note? }
 *  { action: 'status', status, carrier?, trackingNumber?, reason?, notifyCustomer? }
 *  { action: 'shipment', carrier, trackingNumber, notifyCustomer? }
 *  { action: 'navlungo_create', desi?, packageCount?, notifyCustomer? }  (Navlungo'da gönderi + "Kargoda")
 *  { action: 'navlungo_sync' }  (durumu Navlungo'dan hemen çek)
 *  { action: 'geliver_link', ref }  (Geliver gönderi linki / kimliği / takip no ile bağla, durumu uygula)
 *  { action: 'geliver_sync' } · { action: 'geliver_unlink' }
 *  { action: 'geliver_offers', desi?, kg?, refresh? }  (Geliver'de gönderi aç, teklifleri kaydet)
 *  { action: 'geliver_buy', offerId }  (teklifi kabul et: etiket) · { action: 'geliver_cancel' }
 *  { action: 'note', adminNote }
 *  { action: 'cancel_request', op: 'approve' | 'reject', reason? (ret için zorunlu), note? }
 *  { action: 'return', returnId, op: 'approve' | 'reject' | 'receive' | 'refund', carrier?, code?, reason?, amount? }
 * Geriye dönük: { status?, paymentStatus?: 'PAID', trackingNumber?, carrier? }
 */
export async function patchAdminOrder(id: string, body: Record<string, any>) {
  const exists = await prisma.order.findUnique({ where: { id }, select: { id: true } })
  if (!exists) return NextResponse.json({ error: 'Sipariş bulunamadı' }, { status: 404 })

  try {
    let action: string | undefined = body.action
    if (!action) {
      if (typeof body.paymentStatus === 'string' && body.paymentStatus.toUpperCase() === 'PAID') action = 'mark_paid'
      else if (body.status) action = 'status'
      else if (body.adminNote !== undefined) action = 'note'
    }

    switch (action) {
      case 'mark_paid': {
        const changed = await markOrderPaid(id, {
          actor: 'admin',
          note: typeof body.note === 'string' && body.note.trim() ? `Ödeme admin tarafından onaylandı: ${body.note.trim()}` : undefined,
        })
        if (!changed) return NextResponse.json({ error: 'Sipariş zaten ödendi olarak işaretli.' }, { status: 409 })
        break
      }
      case 'status': {
        const next = normalizeStatus(body.status)
        if (!next) return NextResponse.json({ error: 'Geçersiz durum.' }, { status: 400 })
        await changeOrderStatus(id, next, {
          actor: 'admin',
          carrier: typeof body.carrier === 'string' ? body.carrier : null,
          trackingNumber: typeof body.trackingNumber === 'string' ? body.trackingNumber : null,
          reason: typeof body.reason === 'string' ? body.reason.trim().slice(0, 500) : null,
          notifyCustomer: body.notifyCustomer !== false,
        })
        break
      }
      case 'shipment': {
        await updateShipment(id, String(body.carrier ?? ''), String(body.trackingNumber ?? ''), body.notifyCustomer === true)
        break
      }
      case 'navlungo_create': {
        const desi = Number(String(body.desi ?? '').replace(',', '.'))
        const packageCount = Number(body.packageCount)
        await createNavlungoShipment(id, {
          desi: Number.isFinite(desi) && desi > 0 && desi <= 1000 ? desi : undefined,
          packageCount: Number.isInteger(packageCount) && packageCount > 0 && packageCount <= 50 ? packageCount : undefined,
          notifyCustomer: body.notifyCustomer !== false,
        })
        break
      }
      case 'geliver_link': {
        await linkGeliverShipment(id, String(body.ref ?? '').slice(0, 300))
        break
      }
      case 'geliver_sync': {
        await syncGeliverShipment(id)
        break
      }
      case 'geliver_unlink': {
        await unlinkGeliverShipment(id)
        break
      }
      case 'geliver_offers': {
        const desi = Number(String(body.desi ?? '').replace(',', '.'))
        const kg = Number(String(body.kg ?? '').replace(',', '.'))
        await getGeliverOffers(id, {
          desi: Number.isFinite(desi) && desi > 0 && desi <= 1000 ? desi : undefined,
          kg: Number.isFinite(kg) && kg > 0 && kg <= 2000 ? kg : undefined,
          refresh: body.refresh === true,
        })
        break
      }
      case 'geliver_buy': {
        await buyGeliverLabel(id, String(body.offerId ?? '').slice(0, 80))
        break
      }
      case 'geliver_cancel': {
        await cancelGeliverShipment(id)
        break
      }
      case 'navlungo_sync': {
        const r = await syncNavlungoShipment(id)
        if (r.skipped) return NextResponse.json({ error: `Durum sorgulanmadı: ${r.skipped}.` }, { status: 409 })
        break
      }
      case 'return': {
        const op = body.op
        if (!['approve', 'reject', 'receive', 'refund'].includes(op) || typeof body.returnId !== 'string') {
          return NextResponse.json({ error: 'Geçersiz iade işlemi.' }, { status: 400 })
        }
        await updateReturnRequest(id, body.returnId, op, {
          actor: 'admin',
          carrier: typeof body.carrier === 'string' ? body.carrier : undefined,
          code: typeof body.code === 'string' ? body.code : undefined,
          reason: typeof body.reason === 'string' ? body.reason : undefined,
          amount: body.amount !== undefined && body.amount !== '' ? Number(body.amount) : undefined,
          adminNote: typeof body.adminNote === 'string' ? body.adminNote : undefined,
        })
        break
      }
      case 'cancel_request': {
        if (body.op === 'approve') {
          await approveCancellationRequest(id, { actor: 'admin', note: typeof body.note === 'string' ? body.note.slice(0, 500) : null })
        } else if (body.op === 'reject') {
          const reason = typeof body.reason === 'string' ? body.reason.trim() : ''
          if (!reason) return NextResponse.json({ error: 'Ret gerekçesi yazılmalıdır.' }, { status: 400 })
          await rejectCancellationRequest(id, { reason, actor: 'admin' })
        } else {
          return NextResponse.json({ error: 'Geçersiz iptal talebi işlemi.' }, { status: 400 })
        }
        break
      }
      case 'note': {
        const adminNote = typeof body.adminNote === 'string' ? body.adminNote.slice(0, 5000) : ''
        await prisma.order.update({ where: { id }, data: { adminNote: adminNote || null } })
        await logOrderEvent(id, { type: 'note', message: 'Admin notu güncellendi.', actor: 'admin', visibleToCustomer: false })
        break
      }
      default:
        return NextResponse.json({ error: 'Geçersiz işlem.' }, { status: 400 })
    }

    return NextResponse.json({ success: true, order: await getAdminOrderDetail(id) })
  } catch (e) {
    if (e instanceof OrderTransitionError) {
      return NextResponse.json({ error: e.message }, { status: 409 })
    }
    if (e instanceof GeliverError) {
      return NextResponse.json({ error: `Geliver: ${e.message}` }, { status: 502 })
    }
    if (e instanceof NavlungoError) {
      return NextResponse.json({ error: `Navlungo: ${e.message}` }, { status: 502 })
    }
    await reportError('admin-siparis-islemi', e, { orderId: id, action: body.action })
    return NextResponse.json({ error: 'Sipariş güncellenirken bir hata oluştu' }, { status: 500 })
  }
}
