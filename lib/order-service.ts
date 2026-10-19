/**
 * Sipariş yaşam döngüsü — tek kaynak.
 * Durum geçişleri, zaman çizelgesi (OrderEvent), müşteri/admin e-postaları, stok iadesi ve fatura
 * gönderimi burada yapılır. Sipariş oluşturma, ödeme webhook'ları, admin paneli ve müşteri iptali bunu kullanır.
 *
 * Durum akışı:
 *   PENDING ──(ödeme)──> PAID ──> PICKING (Hazırlanıyor) ──> SHIPPED ──> DELIVERED
 *      └──────────────> CANCELLED (ödeme öncesi/sonrası)        DELIVERED ──> RETURNED
 *
 * Ödeme durumu: ödenmiş sipariş iptal edildiğinde (veya doğrudan "İade" durumuna alındığında) ücret iadesi
 * o anda başlatılmış sayılır → paymentStatus REFUNDED + "refund" olayı + müşteriye iade bilgili e-posta.
 * İptal edilmiş bir sipariş hiçbir zaman PAID kalmaz. (Kısmi iadeler lib/return-service üzerinden yürür.)
 *
 * Müşteri iptal talebi (ödenmiş, henüz kargoya verilmemiş sipariş): requestOrderCancellation →
 * admin approveCancellationRequest (iptal + ücret iadesi) / rejectCancellationRequest (gerekçeli ret).
 * Talep durumu Order.notes JSON'unda (cancelRequest) ve "cancel_request" zaman çizelgesi olaylarında tutulur.
 */

import React from 'react'
import { reportError } from '@/lib/alerts'
import type { Order, OrderLine, OrderStatus } from '@prisma/client'
import { releaseCouponUse } from '@/lib/order-pricing'
import { revalidateStorefront } from '@/lib/storefront-revalidate'
import { prisma } from '@/lib/prisma'
import { sendEmail, type EmailAttachment } from '@/lib/email'
import { generateContractPdf } from '@/lib/legal/contract-pdf'
import { getCarrier } from '@/lib/shipping/carriers'
import { SELLER } from '@/lib/legal/company'
import { STORE_CONTACT, STORE_TIME_ZONE, bankTransferDeadline } from '@/lib/store-config'
import { buildInvoiceDataFromPrisma } from '@/lib/invoice-data'
import { generateAndSendInvoice } from '@/lib/invoice-send'
import OrderReceivedEmail from '@/emails/order/OrderReceivedEmail'
import OrderStatusEmail, { ORDER_EMAIL_SUBJECTS, type OrderEmailKind } from '@/emails/order/OrderStatusEmail'
import AdminOrderEmail, { ADMIN_ORDER_EMAIL_SUBJECTS, type AdminOrderEvent } from '@/emails/order/AdminOrderEmail'
import type { OrderEmailData } from '@/emails/order/shared'

export type OrderWithLines = Order & { lines: OrderLine[] }
export type Actor = 'system' | 'admin' | 'customer'

export class OrderTransitionError extends Error {}

export const ORDER_STATUS_LABELS_TR: Record<OrderStatus, string> = {
  PENDING: 'Beklemede',
  CONFIRMED: 'Onaylandı',
  PROCESSING: 'İşleniyor',
  PAID: 'Ödendi',
  PICKING: 'Hazırlanıyor',
  SHIPPED: 'Kargoda',
  DELIVERED: 'Teslim Edildi',
  CANCELLED: 'İptal',
  RETURNED: 'İade',
}

/** İzin verilen admin geçişleri */
const ALLOWED: Record<OrderStatus, OrderStatus[]> = {
  PENDING: ['PICKING', 'CANCELLED'],
  CONFIRMED: ['PICKING', 'SHIPPED', 'CANCELLED'],
  PROCESSING: ['PICKING', 'SHIPPED', 'CANCELLED'],
  PAID: ['PICKING', 'SHIPPED', 'CANCELLED'],
  PICKING: ['SHIPPED', 'CANCELLED'],
  SHIPPED: ['DELIVERED', 'RETURNED'],
  DELIVERED: ['RETURNED'],
  CANCELLED: [],
  RETURNED: [],
}

export function allowedNextStatuses(status: OrderStatus): OrderStatus[] {
  return ALLOWED[status] ?? []
}

const siteUrl = () => STORE_CONTACT.siteUrl.replace(/\/$/, '')
const adminEmail = () => process.env.ADMIN_EMAIL || STORE_CONTACT.email

function parseCustomerNote(order: Order): string | null {
  if (order.customerNote) return order.customerNote
  try {
    const n = order.notes ? JSON.parse(order.notes) : null
    return typeof n?.customerNote === 'string' ? n.customerNote : null
  } catch {
    return null
  }
}

export function toOrderEmailData(order: OrderWithLines): OrderEmailData {
  const carrier = order.shippingCarrier ? getCarrier(order.shippingCarrier) : undefined
  const due = bankTransferDeadline(order.createdAt)
  return {
    orderNo: order.orderNo,
    createdAt: order.createdAt.toLocaleString('tr-TR', { timeZone: STORE_TIME_ZONE }),
    customerName: order.shippingName,
    customerEmail: order.shippingEmail ?? '',
    customerPhone: order.shippingPhone,
    shippingAddress: [order.shippingAddress, `${order.shippingDistrict} / ${order.shippingCity}`, order.shippingPostalCode]
      .filter(Boolean)
      .join(', '),
    billingName: order.billingName,
    billingType: order.billingType,
    billingTaxId: order.billingTaxId,
    billingTaxOffice: order.billingTaxOffice,
    paymentMethod: order.paymentMethod === 'stripe' ? 'card' : order.paymentMethod ?? 'bank_transfer',
    paymentStatus: order.paymentStatus,
    status: order.status,
    lines: order.lines.map((l) => ({ name: l.productName, quantity: l.quantity, lineTotal: l.lineTotal })),
    subtotal: order.subtotal,
    couponCode: order.couponCode,
    couponDiscount: order.couponDiscount,
    paymentDiscount: order.paymentDiscount,
    tax: order.vatTotal,
    shipping: order.shippingCost,
    total: order.total,
    carrierName: carrier?.name ?? order.shippingCarrier,
    trackingNumber: order.trackingNumber,
    trackingUrl: carrier && order.trackingNumber ? carrier.trackingUrl(order.trackingNumber) : null,
    trackingHint: carrier?.trackingHint ?? null,
    customerNote: parseCustomerNote(order),
    orderUrl: `${siteUrl()}/orders/${order.orderNo}`,
    adminUrl: `${siteUrl()}/admin/orders/${order.id}?source=prisma`,
    siteUrl: siteUrl(),
    paymentDueDate: due.toLocaleDateString('tr-TR', { day: '2-digit', month: 'long', year: 'numeric', timeZone: STORE_TIME_ZONE }),
    billingAddress: order.billingAddress
      ? [order.billingAddress, [order.billingDistrict, order.billingCity].filter(Boolean).join(' / '), order.billingPostalCode]
          .filter(Boolean)
          .join(', ')
      : null,
    refundAmount: order.paymentStatus === 'REFUNDED' ? order.total : null,
  }
}

const fmtTRY = (n: number) => n.toLocaleString('tr-TR', { style: 'currency', currency: 'TRY' })

export async function logOrderEvent(
  orderId: string,
  data: { type: string; message: string; status?: string; actor?: Actor; visibleToCustomer?: boolean }
) {
  try {
    await prisma.orderEvent.create({
      data: {
        orderId,
        type: data.type,
        message: data.message,
        status: data.status,
        actor: data.actor ?? 'system',
        visibleToCustomer: data.visibleToCustomer ?? true,
      },
    })
  } catch (e) {
    console.error('Order event log error:', e)
  }
}

async function send(
  orderId: string,
  to: string | null | undefined,
  subject: string,
  element: React.ReactElement,
  label: string,
  attachments?: EmailAttachment[]
) {
  if (!to) return false
  try {
    const result = await sendEmail(to, subject, element, attachments)
    await logOrderEvent(orderId, {
      type: 'email',
      message: result.success ? `E-posta gönderildi: ${label}` : `E-posta gönderilemedi: ${label}`,
      visibleToCustomer: false,
    })
    return result.success
  } catch (e) {
    console.error(`Order email error (${label}):`, e)
    return false
  }
}

export async function sendCustomerStatusEmail(
  order: OrderWithLines,
  kind: OrderEmailKind,
  reason?: string | null,
  extra?: { refundAmount?: number | null }
) {
  const data = toOrderEmailData(order)
  if (extra?.refundAmount != null) data.refundAmount = extra.refundAmount
  return send(
    order.id,
    order.shippingEmail,
    ORDER_EMAIL_SUBJECTS[kind](order.orderNo),
    React.createElement(OrderStatusEmail, { order: data, kind, reason }),
    ORDER_EMAIL_SUBJECTS[kind](order.orderNo)
  )
}

async function sendOrderReceived(order: OrderWithLines) {
  const data = toOrderEmailData(order)
  const awaiting = data.paymentMethod === 'bank_transfer' && order.paymentStatus !== 'PAID'
  const subject = awaiting
    ? `Siparişiniz alındı, ödemeniz bekleniyor - ${order.orderNo}`
    : `Siparişiniz alındı - ${order.orderNo}`
  // Ön Bilgilendirme Formu + Mesafeli Satış Sözleşmesi (siparişe özel PDF) e-postaya eklenir
  let attachments: EmailAttachment[] | undefined
  try {
    const pdf = await generateContractPdf(order)
    attachments = [{ filename: `sozlesme-${order.orderNo}.pdf`, content: pdf, contentType: 'application/pdf' }]
  } catch (e) {
    await reportError('sozlesme-pdf', e, { orderNo: order.orderNo })
    await logOrderEvent(order.id, { type: 'email', message: "Sözleşme PDF'i oluşturulamadı; e-posta eksiz gönderildi.", visibleToCustomer: false })
  }
  await send(order.id, order.shippingEmail, subject, React.createElement(OrderReceivedEmail, { order: data }), subject, attachments)
}

async function sendAdmin(order: OrderWithLines, event: AdminOrderEvent, reason?: string | null) {
  const data = toOrderEmailData(order)
  const subject = ADMIN_ORDER_EMAIL_SUBJECTS[event](order.orderNo)
  await send(order.id, adminEmail(), subject, React.createElement(AdminOrderEmail, { order: data, event, reason }), `Admin: ${subject}`)
}

async function load(orderId: string): Promise<OrderWithLines> {
  const order = await prisma.order.findUnique({ where: { id: orderId }, include: { lines: true } })
  if (!order) throw new OrderTransitionError('Sipariş bulunamadı')
  return order
}

/** Sipariş oluşturulduktan sonra: zaman çizelgesi + (havalede) müşteri ve admin e-postaları. */
export async function onOrderCreated(order: OrderWithLines) {
  const isTransfer = order.paymentMethod === 'bank_transfer'
  await logOrderEvent(order.id, {
    type: 'created',
    status: 'PENDING',
    message: isTransfer ? 'Sipariş oluşturuldu, havale/EFT ödemesi bekleniyor.' : 'Sipariş oluşturuldu, kart ödemesi bekleniyor.',
    actor: 'customer',
  })
  // Kartlı siparişte e-postalar ödeme onayından sonra (markOrderPaid) gönderilir
  if (isTransfer) {
    await sendOrderReceived(order)
    await sendAdmin(order, 'new_order')
  }
}

/**
 * Ödemeyi onaylar (kart webhook'u veya admin havale onayı). Idempotent: zaten ödenmişse false döner.
 */
export async function markOrderPaid(orderId: string, opts: { actor: Actor; note?: string }): Promise<boolean> {
  const before = await load(orderId)
  if (before.status === 'CANCELLED') throw new OrderTransitionError('İptal edilmiş sipariş ödendi olarak işaretlenemez')

  const updated = await prisma.order.updateMany({
    // status koşulu: bu arada iptal edilen sipariş yeniden "ödendi"ye dönmesin
    where: { id: orderId, status: before.status, paymentStatus: { not: 'PAID' } },
    data: {
      paymentStatus: 'PAID',
      paidAt: new Date(),
      ...(before.status === 'PENDING' ? { status: 'PAID' as const } : {}),
    },
  })
  if (updated.count === 0) return false

  const order = await load(orderId)
  await logOrderEvent(orderId, {
    type: 'payment',
    status: 'PAID',
    message: opts.note ?? (order.paymentMethod === 'bank_transfer' ? 'Havale/EFT ödemesi alındı.' : 'Kart ödemesi onaylandı.'),
    actor: opts.actor,
  })

  if (order.paymentMethod === 'bank_transfer') {
    await sendCustomerStatusEmail(order, 'payment_received')
    await sendAdmin(order, 'payment_received')
  } else {
    // Kartlı siparişin ilk e-postaları ödeme onayıyla gider
    await sendOrderReceived(order)
    await sendAdmin(order, 'new_order')
  }

  try {
    const invoiceData = buildInvoiceDataFromPrisma(order)
    if (invoiceData.customer.email?.trim()) {
      const r = await generateAndSendInvoice(order.orderNo, invoiceData, invoiceData.customer.email)
      await logOrderEvent(orderId, {
        type: 'email',
        message: r.sent ? 'Fatura e-postası gönderildi.' : `Fatura gönderilemedi: ${r.error ?? 'bilinmeyen hata'}`,
        visibleToCustomer: false,
      })
    }
  } catch (e) {
    await reportError('fatura-gonderimi', e, { orderNo: order.orderNo })
  }
  return true
}

export async function markPaymentFailed(orderId: string, note: string) {
  const order = await load(orderId)
  if (order.paymentStatus === 'PAID') return
  // Idempotent: aynı başarısızlık için (banka dönüşü + webhook) müşteriye ikinci e-posta gitmez
  const res = await prisma.order.updateMany({
    where: { id: orderId, paymentStatus: { notIn: ['PAID', 'FAILED'] } },
    data: { paymentStatus: 'FAILED' },
  })
  // Bankanın ham hata mesajı yalnızca iç kayıtta; müşteriye genel bilgi gösterilir
  await logOrderEvent(orderId, { type: 'payment', status: 'FAILED', message: note, actor: 'system', visibleToCustomer: false })
  if (res.count === 0) return
  await logOrderEvent(orderId, { type: 'payment', status: 'FAILED', message: 'Kart ödemesi tamamlanamadı.', actor: 'system' })
  if (order.paymentMethod !== 'bank_transfer') {
    await sendCustomerStatusEmail(await load(orderId), 'payment_failed')
  }
}

async function restoreStock(order: OrderWithLines) {
  // İade talebiyle teslim alınıp stoğa zaten eklenmiş adetler (lib/return-service "receive") tekrar eklenmez;
  // aksi hâlde kısmi iadeden sonra sipariş RETURNED yapılınca o adetler stoğa ikinci kez giriyordu.
  const alreadyRestored = new Map<string, number>()
  const received = await prisma.returnRequest.findMany({
    where: { orderId: order.id, status: { in: ['RECEIVED', 'REFUNDED'] } },
    select: { items: true },
  })
  for (const r of received) {
    for (const i of (Array.isArray(r.items) ? r.items : []) as Array<{ lineId?: string; quantity?: number }>) {
      if (i?.lineId && typeof i.quantity === 'number') alreadyRestored.set(i.lineId, (alreadyRestored.get(i.lineId) ?? 0) + i.quantity)
    }
  }
  for (const line of order.lines) {
    const vm = line.variantMatrix as { productId?: string; stockDecremented?: boolean; productStockDecremented?: boolean } | null
    const productId = vm?.productId
    if (!productId) continue
    const quantity = Math.max(0, line.quantity - (alreadyRestored.get(line.id) ?? 0))
    if (quantity === 0) continue
    // Yeni siparişlerde yalnızca gerçekten düşülen stok geri eklenir; bayraksız eski siparişlerde eski davranış
    const hasFlags = typeof vm?.stockDecremented === 'boolean'
    if (!hasFlags || vm?.stockDecremented) {
      await prisma.stockOverride.updateMany({ where: { productId }, data: { stock: { increment: quantity } } })
    }
    if (!hasFlags || vm?.productStockDecremented) {
      await prisma.productOverride.updateMany({
        where: { productId, stock: { not: null } },
        data: { stock: { increment: quantity } },
      })
    }
  }
}

/**
 * Sipariş durumunu değiştirir. Kargoya verirken kargo firması + takip no zorunludur.
 * notifyCustomer: müşteriye durum e-postası gönderilsin mi (varsayılan: evet).
 */
export async function changeOrderStatus(
  orderId: string,
  next: OrderStatus,
  opts: {
    actor: Actor
    carrier?: string | null
    trackingNumber?: string | null
    reason?: string | null
    notifyCustomer?: boolean
  }
): Promise<OrderWithLines> {
  const order = await load(orderId)
  if (order.status === next) return order

  const allowed = opts.actor === 'customer' ? (order.status === 'PENDING' && next === 'CANCELLED') : ALLOWED[order.status].includes(next)
  if (!allowed) {
    throw new OrderTransitionError(
      `"${ORDER_STATUS_LABELS_TR[order.status]}" durumundaki sipariş "${ORDER_STATUS_LABELS_TR[next]}" durumuna alınamaz.`
    )
  }
  if (next === 'PICKING' && order.paymentStatus !== 'PAID') {
    throw new OrderTransitionError('Ödemesi alınmamış sipariş hazırlanmaya alınamaz. Önce ödemeyi onaylayın.')
  }
  if (next === 'SHIPPED') {
    if (order.paymentStatus !== 'PAID') throw new OrderTransitionError('Ödemesi alınmamış sipariş kargoya verilemez.')
    if (!opts.carrier || !getCarrier(opts.carrier)) throw new OrderTransitionError('Kargo firması seçilmelidir.')
    if (!opts.trackingNumber?.trim()) throw new OrderTransitionError('Kargo takip numarası girilmelidir.')
  }

  const now = new Date()
  const data: Record<string, unknown> = { status: next }
  // Ödenmiş sipariş iptal / iade: ücret iadesi başlatılır, ödeme durumu PAID kalmaz
  const wasPaid = order.paymentStatus === 'PAID' || order.paymentStatus === 'PARTIALLY_REFUNDED'
  let refundAmount: number | null = null
  if ((next === 'CANCELLED' || next === 'RETURNED') && wasPaid) {
    refundAmount = Math.max(0, Math.round((order.total - (await refundedSoFar(order.id))) * 100) / 100)
    data.paymentStatus = 'REFUNDED'
  }
  if (next === 'SHIPPED') {
    data.shippingCarrier = opts.carrier
    data.trackingNumber = opts.trackingNumber!.trim()
    data.shippedAt = now
  }
  if (next === 'DELIVERED') data.deliveredAt = now
  if (next === 'CANCELLED') data.cancelledAt = now

  // Koşullu güncelleme: eşzamanlı iki işlemden yalnızca biri uygulanır
  const res = await prisma.order.updateMany({ where: { id: orderId, status: order.status }, data })
  if (res.count === 0) throw new OrderTransitionError('Sipariş bu sırada başka bir işlemle güncellendi. Sayfayı yenileyin.')

  if (next === 'CANCELLED' || next === 'RETURNED') {
    try {
      await restoreStock(order)
      revalidateStorefront()
    } catch (e) {
      console.error('Stock restore error:', e)
    }
  }
  // İptal edilen siparişin kupon kullanımı geri verilir (iade edilen siparişte kupon kullanılmış sayılır)
  if (next === 'CANCELLED') await releaseCouponUse(order.couponCode)

  const updated = await load(orderId)
  const carrierName = updated.shippingCarrier ? getCarrier(updated.shippingCarrier)?.name : null
  const messages: Partial<Record<OrderStatus, string>> = {
    PICKING: 'Sipariş hazırlanıyor.',
    SHIPPED: `Kargoya verildi: ${carrierName ?? ''} ${updated.trackingNumber ?? ''}`.trim(),
    DELIVERED: 'Sipariş teslim edildi.',
    CANCELLED: `Sipariş iptal edildi${opts.actor === 'customer' ? ' (müşteri tarafından)' : ''}.${opts.reason ? ` Neden: ${opts.reason}` : ''}`,
    RETURNED: `Sipariş iade alındı.${opts.reason ? ` Not: ${opts.reason}` : ''}`,
  }
  await logOrderEvent(orderId, {
    type: next === 'SHIPPED' ? 'shipment' : 'status',
    status: next,
    message: messages[next] ?? `Durum: ${ORDER_STATUS_LABELS_TR[next]}`,
    actor: opts.actor,
  })
  if (refundAmount !== null) {
    await logOrderEvent(orderId, {
      type: 'refund',
      status: 'REFUNDED',
      message: `Ücret iadesi başlatıldı: ${fmtTRY(refundAmount)} (${order.paymentMethod === 'bank_transfer' ? 'ödemenin yapıldığı hesaba' : 'ödemede kullanılan karta'}).`,
      actor: opts.actor,
    })
    await logOrderEvent(orderId, {
      type: 'note',
      message:
        order.paymentMethod === 'bank_transfer'
          ? `İADE YAPILMALI: ${fmtTRY(refundAmount)} tutarı müşterinin havale yaptığı hesaba iade edin.`
          : `İADE YAPILMALI: ${fmtTRY(refundAmount)} tutarı banka sanal POS panelinden iptal/iade edin.`,
      actor: 'system',
      visibleToCustomer: false,
    })
  }

  // Açık iptal talebi: iptalde onaylanmış, kargoya verilince kapanmış sayılır
  const req = getCancellationRequest(order)
  if (req?.status === 'REQUESTED' && (next === 'CANCELLED' || next === 'SHIPPED')) {
    await resolveCancellationRequest(updated, next === 'CANCELLED' ? 'APPROVED' : 'REJECTED', {
      actor: opts.actor,
      rejectReason: next === 'SHIPPED' ? 'Sipariş, talep incelenmeden kargoya verildi.' : null,
    })
  }

  if (opts.actor === 'customer' && next === 'CANCELLED') {
    await sendAdmin(updated, 'customer_cancelled', opts.reason)
  }

  if (opts.notifyCustomer !== false) {
    const kind: OrderEmailKind | null =
      next === 'PICKING' ? 'confirmed'
        : next === 'SHIPPED' ? 'shipped'
          : next === 'DELIVERED' ? 'delivered'
            : next === 'CANCELLED' ? 'cancelled'
              : next === 'RETURNED' ? 'returned'
                : null
    if (kind) await sendCustomerStatusEmail(updated, kind, opts.reason, { refundAmount })
  }
  return updated
}

/** İade talepleri (lib/return-service) üzerinden daha önce iade edilmiş tutar. */
async function refundedSoFar(orderId: string): Promise<number> {
  const rows = await prisma.returnRequest.findMany({ where: { orderId, status: 'REFUNDED' }, select: { refundAmount: true } })
  return rows.reduce((sum, r) => sum + (r.refundAmount ?? 0), 0)
}

// ── Müşteri iptal talebi (ödenmiş, kargoya verilmemiş sipariş) ──────────────────────────────

export type CancellationRequest = {
  status: 'REQUESTED' | 'APPROVED' | 'REJECTED'
  reason: string | null
  requestedAt: string
  resolvedAt?: string | null
  rejectReason?: string | null
  resolvedBy?: Actor | null
}

/** Talep edilebilen durumlar: ödeme alınmış, henüz kargoya verilmemiş */
const CANCEL_REQUESTABLE: OrderStatus[] = ['PAID', 'PICKING', 'CONFIRMED', 'PROCESSING']

function parseNotes(order: Pick<Order, 'notes'>): Record<string, unknown> {
  try {
    const n = order.notes ? JSON.parse(order.notes) : {}
    return n && typeof n === 'object' && !Array.isArray(n) ? n : {}
  } catch {
    return {}
  }
}

/** Siparişin iptal talebi (yoksa null). Admin paneli bunu gösterir. */
export function getCancellationRequest(order: Pick<Order, 'notes'>): CancellationRequest | null {
  const r = parseNotes(order).cancelRequest as CancellationRequest | undefined
  return r && typeof r === 'object' && typeof r.status === 'string' ? r : null
}

/** Müşteri bu sipariş için iptal talebi oluşturabilir mi? */
export function canRequestCancellation(order: Pick<Order, 'status' | 'paymentStatus' | 'notes'>): boolean {
  return (
    order.paymentStatus === 'PAID' &&
    CANCEL_REQUESTABLE.includes(order.status) &&
    !getCancellationRequest(order)
  )
}

async function saveCancellationRequest(orderId: string, req: CancellationRequest) {
  const fresh = await prisma.order.findUnique({ where: { id: orderId }, select: { notes: true } })
  const notes = parseNotes({ notes: fresh?.notes ?? null })
  await prisma.order.update({ where: { id: orderId }, data: { notes: JSON.stringify({ ...notes, cancelRequest: req }) } })
}

/**
 * Müşteri, ödemesi alınmış ve henüz kargoya verilmemiş siparişi için iptal talebi oluşturur.
 * Admin'e e-posta, müşteriye "talebiniz alındı" e-postası gider; sipariş durumu değişmez.
 */
export async function requestOrderCancellation(orderId: string, opts: { reason?: string | null; actor?: Actor } = {}) {
  const order = await load(orderId)
  const existing = getCancellationRequest(order)
  if (existing?.status === 'REQUESTED') throw new OrderTransitionError('Bu sipariş için iptal talebiniz zaten inceleniyor.')
  if (existing?.status === 'REJECTED') {
    throw new OrderTransitionError(`İptal talebiniz daha önce değerlendirildi. Lütfen bizimle iletişime geçin: ${SELLER.phone}`)
  }
  if (order.paymentStatus !== 'PAID' || !CANCEL_REQUESTABLE.includes(order.status)) {
    throw new OrderTransitionError(
      order.status === 'SHIPPED' || order.status === 'DELIVERED'
        ? 'Kargoya verilmiş sipariş iptal edilemez. Teslim aldıktan sonra iade talebi oluşturabilirsiniz.'
        : 'Bu sipariş için iptal talebi oluşturulamıyor.'
    )
  }
  const reason = opts.reason?.trim().slice(0, 500) || null
  await saveCancellationRequest(orderId, { status: 'REQUESTED', reason, requestedAt: new Date().toISOString() })
  await logOrderEvent(orderId, {
    type: 'cancel_request',
    status: 'REQUESTED',
    message: `İptal talebi alındı${reason ? ` (Neden: ${reason})` : ''}. Talep incelendikten sonra bilgilendirileceksiniz.`,
    actor: opts.actor ?? 'customer',
  })
  const updated = await load(orderId)
  await sendAdmin(updated, 'cancel_request', reason)
  await sendCustomerStatusEmail(updated, 'cancel_requested', reason)
  return updated
}

async function resolveCancellationRequest(
  order: Order,
  status: 'APPROVED' | 'REJECTED',
  opts: { actor: Actor; rejectReason?: string | null }
) {
  const req = getCancellationRequest(order)
  if (!req) return
  await saveCancellationRequest(order.id, {
    ...req,
    status,
    resolvedAt: new Date().toISOString(),
    resolvedBy: opts.actor,
    rejectReason: status === 'REJECTED' ? opts.rejectReason ?? null : null,
  })
  await logOrderEvent(order.id, {
    type: 'cancel_request',
    status,
    message: status === 'APPROVED'
      ? 'İptal talebiniz onaylandı.'
      : `İptal talebiniz kabul edilemedi.${opts.rejectReason ? ` ${opts.rejectReason}` : ''}`,
    actor: opts.actor,
  })
}

/** Admin: iptal talebini onaylar → sipariş iptal, stok/kupon iadesi, ücret iadesi (REFUNDED), müşteriye e-posta. */
export async function approveCancellationRequest(orderId: string, opts: { actor?: Actor; note?: string | null } = {}) {
  const order = await load(orderId)
  const req = getCancellationRequest(order)
  if (req?.status !== 'REQUESTED') throw new OrderTransitionError('Bekleyen bir iptal talebi yok.')
  const reason = [req.reason ? `Müşteri talebi: ${req.reason}` : 'Müşteri talebi', opts.note?.trim()].filter(Boolean).join(' — ')
  // changeOrderStatus açık talebi "onaylandı" olarak kapatır
  return changeOrderStatus(orderId, 'CANCELLED', { actor: opts.actor ?? 'admin', reason })
}

/** Admin: iptal talebini gerekçeyle reddeder; sipariş akışı değişmez, müşteriye e-posta gider. */
export async function rejectCancellationRequest(orderId: string, opts: { reason: string; actor?: Actor }) {
  const order = await load(orderId)
  const req = getCancellationRequest(order)
  if (req?.status !== 'REQUESTED') throw new OrderTransitionError('Bekleyen bir iptal talebi yok.')
  const reason = opts.reason?.trim().slice(0, 500)
  if (!reason) throw new OrderTransitionError('Ret gerekçesi yazılmalıdır.')
  await resolveCancellationRequest(order, 'REJECTED', { actor: opts.actor ?? 'admin', rejectReason: reason })
  const updated = await load(orderId)
  await sendCustomerStatusEmail(updated, 'cancel_rejected', reason)
  return updated
}

/** Kargo bilgisini düzeltir (kargoya verildikten sonra yanlış takip no vb.). Müşteriye yeniden bildirim isteğe bağlı. */
export async function updateShipment(orderId: string, carrier: string, trackingNumber: string, notifyCustomer: boolean) {
  if (!getCarrier(carrier)) throw new OrderTransitionError('Geçersiz kargo firması.')
  if (!trackingNumber.trim()) throw new OrderTransitionError('Takip numarası boş olamaz.')
  await prisma.order.update({ where: { id: orderId }, data: { shippingCarrier: carrier, trackingNumber: trackingNumber.trim() } })
  const order = await load(orderId)
  await logOrderEvent(orderId, {
    type: 'shipment',
    message: `Kargo bilgisi güncellendi: ${getCarrier(carrier)?.name} ${trackingNumber.trim()}`,
    actor: 'admin',
  })
  if (notifyCustomer && order.status === 'SHIPPED') await sendCustomerStatusEmail(order, 'shipped')
  return order
}
