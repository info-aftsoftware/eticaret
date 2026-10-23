/**
 * İade / cayma talebi yaşam döngüsü (voltekno.com "İade ve Cayma Koşulları" ile aynı süreç):
 *   REQUESTED ──admin onay (kargo + iade kodu)──> APPROVED ──ürün depoya ulaştı──> RECEIVED ──ücret iadesi──> REFUNDED
 *       └──> REJECTED (gerekçeli)        └──> CANCELLED (müşteri, onaydan önce)
 * Cayma: teslimattan itibaren 14 gün. Ayıplı / yanlış ürün: teslimattan itibaren 2 yıl.
 */

import React from 'react'
import type { Order, OrderLine, ReturnRequest } from '@prisma/client'
import { prisma } from '@/lib/prisma'
import { sendEmail } from '@/lib/email'
import { getCarrier } from '@/lib/shipping/carriers'
import { STORE_CONTACT } from '@/lib/store-config'
import { getNextReturnNo } from '@/lib/sequence'
import { revalidateStorefront } from '@/lib/storefront-revalidate'
import { logOrderEvent, OrderTransitionError, type Actor } from '@/lib/order-service'
import ReturnEmail, { RETURN_EMAIL_SUBJECTS, type ReturnEmailData, type ReturnEmailKind } from '@/emails/order/ReturnEmail'

export const WITHDRAWAL_DAYS = 14
export const DEFECT_LIABILITY_DAYS = 730
const DAY = 86_400_000

export const RETURN_TYPES = {
  withdrawal: 'Cayma hakkı (14 gün)',
  defective: 'Ayıplı / hasarlı ürün',
  wrong_item: 'Yanlış ürün gönderimi',
} as const
export type ReturnType = keyof typeof RETURN_TYPES

export const RETURN_STATUS_LABELS: Record<string, string> = {
  REQUESTED: 'Talep alındı',
  APPROVED: 'Onaylandı — ürün gönderimi bekleniyor',
  REJECTED: 'Reddedildi',
  RECEIVED: 'Ürün teslim alındı',
  REFUNDED: 'Ücret iadesi yapıldı',
  CANCELLED: 'İptal edildi',
}

const OPEN_STATUSES = ['REQUESTED', 'APPROVED', 'RECEIVED', 'REFUNDED']

type ReturnItem = { lineId: string; name: string; quantity: number }
type OrderWithReturns = Order & { lines: OrderLine[]; returnRequests: ReturnRequest[] }

const round2 = (n: number) => Math.round(n * 100) / 100
const itemsOf = (r: ReturnRequest) => (Array.isArray(r.items) ? (r.items as ReturnItem[]) : [])

/** Satır başına hâlâ iade edilebilecek adet (reddedilmiş/iptal edilmiş talepler sayılmaz). */
export function returnableQuantities(order: OrderWithReturns): Record<string, number> {
  const used: Record<string, number> = {}
  for (const r of order.returnRequests) {
    if (!OPEN_STATUSES.includes(r.status)) continue
    for (const i of itemsOf(r)) used[i.lineId] = (used[i.lineId] ?? 0) + i.quantity
  }
  return Object.fromEntries(order.lines.map((l) => [l.id, Math.max(0, l.quantity - (used[l.id] ?? 0))]))
}

/** Hangi talep türleri hâlâ açılabilir (teslim tarihine göre). */
export function returnEligibility(order: OrderWithReturns) {
  const deliveredAt = order.deliveredAt ?? (order.status === 'DELIVERED' ? order.updatedAt : null)
  const qty = returnableQuantities(order)
  const anyLeft = Object.values(qty).some((q) => q > 0)
  const delivered = order.status === 'DELIVERED' && !!deliveredAt
  const since = deliveredAt ? Date.now() - deliveredAt.getTime() : Infinity
  const withdrawalUntil = deliveredAt ? new Date(deliveredAt.getTime() + WITHDRAWAL_DAYS * DAY) : null
  return {
    withdrawal: delivered && anyLeft && since <= WITHDRAWAL_DAYS * DAY,
    defective: delivered && anyLeft && since <= DEFECT_LIABILITY_DAYS * DAY,
    withdrawalUntil,
    returnable: qty,
  }
}

import { suggestedRefund } from '@/lib/return-refund'
export { suggestedRefund }

function toEmailData(order: Order, r: ReturnRequest): ReturnEmailData {
  const site = STORE_CONTACT.siteUrl.replace(/\/$/, '')
  return {
    requestNo: r.requestNo,
    orderNo: order.orderNo,
    customerName: order.shippingName,
    customerEmail: order.shippingEmail ?? '',
    customerPhone: order.shippingPhone,
    typeLabel: RETURN_TYPES[r.type as ReturnType] ?? r.type,
    items: itemsOf(r).map((i) => ({ name: i.name, quantity: i.quantity })),
    reason: r.reason,
    customerNote: r.customerNote,
    rejectReason: r.rejectReason,
    carrierName: r.returnCarrier ? getCarrier(r.returnCarrier)?.name ?? r.returnCarrier : null,
    returnCode: r.returnCode,
    refundAmount: r.refundAmount,
    orderUrl: `${site}/orders/${order.orderNo}`,
    adminUrl: `${site}/admin/orders/${order.id}?source=prisma`,
  }
}

async function notify(order: Order, r: ReturnRequest, kind: ReturnEmailKind) {
  const data = toEmailData(order, r)
  const to = kind === 'admin_new' ? process.env.ADMIN_EMAIL || STORE_CONTACT.email : order.shippingEmail
  if (!to) return
  try {
    const res = await sendEmail(to, RETURN_EMAIL_SUBJECTS[kind](data), React.createElement(ReturnEmail, { data, kind }))
    await logOrderEvent(order.id, {
      type: 'email',
      message: `${res.success ? 'E-posta gönderildi' : 'E-posta gönderilemedi'}: ${RETURN_EMAIL_SUBJECTS[kind](data)}`,
      visibleToCustomer: false,
    })
  } catch (e) {
    console.error('Return email error:', e)
  }
}

async function loadOrder(orderId: string): Promise<OrderWithReturns> {
  const order = await prisma.order.findUnique({
    where: { id: orderId },
    include: { lines: true, returnRequests: { orderBy: { createdAt: 'asc' } } },
  })
  if (!order) throw new OrderTransitionError('Sipariş bulunamadı')
  return order
}

/** Müşteri iade talebi oluşturur. */
export async function createReturnRequest(
  orderId: string,
  input: { type: string; items: { lineId: string; quantity: number }[]; reason?: string | null; note?: string | null },
  actor: Actor = 'customer'
): Promise<ReturnRequest> {
  const order = await loadOrder(orderId)
  if (!(input.type in RETURN_TYPES)) throw new OrderTransitionError('Geçersiz iade türü.')
  const type = input.type as ReturnType
  const elig = returnEligibility(order)
  if (type === 'withdrawal' && !elig.withdrawal) {
    throw new OrderTransitionError(
      order.status !== 'DELIVERED'
        ? 'İade talebi, sipariş teslim edildikten sonra oluşturulabilir.'
        : `Cayma süresi (${WITHDRAWAL_DAYS} gün) dolmuş. Ayıplı ürünler için "Ayıplı / hasarlı ürün" seçeneğini kullanabilirsiniz.`
    )
  }
  if (type !== 'withdrawal' && !elig.defective) {
    throw new OrderTransitionError('Bu sipariş için iade talebi oluşturulamıyor.')
  }
  if ((type === 'defective' || type === 'wrong_item') && !input.reason?.trim()) {
    throw new OrderTransitionError('Lütfen sorunu kısaca açıklayın.')
  }
  if (order.returnRequests.some((r) => r.status === 'REQUESTED')) {
    throw new OrderTransitionError('Bu sipariş için incelenmekte olan bir iade talebiniz zaten var.')
  }

  const items: ReturnItem[] = []
  for (const it of input.items ?? []) {
    const line = order.lines.find((l) => l.id === it.lineId)
    const qty = Math.floor(Number(it.quantity))
    if (!line || !Number.isFinite(qty) || qty < 1) continue
    if (qty > (elig.returnable[line.id] ?? 0)) {
      throw new OrderTransitionError(`"${line.productName}" için en fazla ${elig.returnable[line.id] ?? 0} adet iade edilebilir.`)
    }
    items.push({ lineId: line.id, name: line.productName, quantity: qty })
  }
  if (items.length === 0) throw new OrderTransitionError('İade edilecek en az bir ürün seçin.')

  const r = await prisma.returnRequest.create({
    data: {
      requestNo: await getNextReturnNo(),
      orderId,
      type,
      items,
      reason: input.reason?.trim().slice(0, 1000) || null,
      customerNote: input.note?.trim().slice(0, 2000) || null,
    },
  })
  await logOrderEvent(orderId, {
    type: 'return',
    status: 'REQUESTED',
    message: `İade talebi oluşturuldu (${r.requestNo}, ${RETURN_TYPES[type]}): ${items.map((i) => `${i.name} × ${i.quantity}`).join(', ')}`,
    actor,
  })
  await notify(order, r, 'received')
  await notify(order, r, 'admin_new')
  return r
}

async function loadRequest(orderId: string, returnId: string) {
  const order = await loadOrder(orderId)
  const r = order.returnRequests.find((x) => x.id === returnId)
  if (!r) throw new OrderTransitionError('İade talebi bulunamadı')
  return { order, r }
}

/** Admin işlemleri: approve | reject | receive | refund. Müşteri: cancel (yalnızca onaydan önce). */
export async function updateReturnRequest(
  orderId: string,
  returnId: string,
  op: 'approve' | 'reject' | 'receive' | 'refund' | 'cancel',
  opts: { carrier?: string; code?: string; reason?: string; amount?: number; adminNote?: string; actor: Actor }
): Promise<ReturnRequest> {
  const { order, r } = await loadRequest(orderId, returnId)
  const expect = (status: string) => {
    if (r.status !== status) {
      throw new OrderTransitionError(`Talep "${RETURN_STATUS_LABELS[r.status] ?? r.status}" durumunda; bu işlem yapılamaz.`)
    }
  }
  const now = new Date()
  let updated: ReturnRequest

  switch (op) {
    case 'approve': {
      expect('REQUESTED')
      if (!opts.carrier || !getCarrier(opts.carrier)) throw new OrderTransitionError('Kargo firması seçilmelidir.')
      if (!opts.code?.trim()) throw new OrderTransitionError('İade kodu girilmelidir.')
      updated = await prisma.returnRequest.update({
        where: { id: r.id },
        data: { status: 'APPROVED', approvedAt: now, returnCarrier: opts.carrier, returnCode: opts.code.trim(), adminNote: opts.adminNote ?? r.adminNote },
      })
      await logOrderEvent(orderId, { type: 'return', status: 'APPROVED', message: `İade talebi onaylandı (${r.requestNo}): ${getCarrier(opts.carrier)?.name} iade kodu ${opts.code.trim()}`, actor: opts.actor })
      await notify(order, updated, 'approved')
      break
    }
    case 'reject': {
      expect('REQUESTED')
      if (!opts.reason?.trim()) throw new OrderTransitionError('Ret gerekçesi yazılmalıdır.')
      updated = await prisma.returnRequest.update({
        where: { id: r.id },
        data: { status: 'REJECTED', rejectReason: opts.reason.trim().slice(0, 1000), adminNote: opts.adminNote ?? r.adminNote },
      })
      await logOrderEvent(orderId, { type: 'return', status: 'REJECTED', message: `İade talebi reddedildi (${r.requestNo}): ${opts.reason.trim()}`, actor: opts.actor })
      await notify(order, updated, 'rejected')
      break
    }
    case 'cancel': {
      expect('REQUESTED')
      updated = await prisma.returnRequest.update({ where: { id: r.id }, data: { status: 'CANCELLED' } })
      await logOrderEvent(orderId, { type: 'return', status: 'CANCELLED', message: `İade talebi geri çekildi (${r.requestNo}).`, actor: opts.actor })
      break
    }
    case 'receive': {
      expect('APPROVED')
      updated = await prisma.returnRequest.update({ where: { id: r.id }, data: { status: 'RECEIVED', receivedAt: now } })
      // İade gelen ürünler stoğa geri eklenir. Sipariş zaten RETURNED ise tüm satırlar o anda stoğa eklenmiştir
      // (order-service restoreStock) — tekrar eklenmez.
      for (const i of order.status === 'RETURNED' ? [] : itemsOf(r)) {
        const line = order.lines.find((l) => l.id === i.lineId)
        const vm = line?.variantMatrix as { productId?: string; stockKey?: string; stockDecremented?: boolean; productStockDecremented?: boolean } | null
        const productId = vm?.productId
        if (!productId) continue
        // order-service restoreStock ile aynı kural: yeni siparişlerde yalnızca gerçekten düşülen stok kaynağına geri eklenir
        const hasFlags = typeof vm?.stockDecremented === 'boolean'
        if (!hasFlags || vm?.stockDecremented) {
          await prisma.stockOverride.updateMany({ where: { productId: vm?.stockKey ?? productId }, data: { stock: { increment: i.quantity } } })
        }
        if (!hasFlags || vm?.productStockDecremented) {
          await prisma.productOverride.updateMany({ where: { productId, stock: { not: null } }, data: { stock: { increment: i.quantity } } })
        }
      }
      revalidateStorefront()
      await logOrderEvent(orderId, { type: 'return', status: 'RECEIVED', message: `İade edilen ürünler teslim alındı (${r.requestNo}), stoğa eklendi.`, actor: opts.actor })
      break
    }
    case 'refund': {
      expect('RECEIVED')
      const amount = round2(Number(opts.amount ?? suggestedRefund(order, itemsOf(r), r.id)))
      if (!Number.isFinite(amount) || amount <= 0) throw new OrderTransitionError('Geçerli bir iade tutarı girin.')
      const alreadyRefunded = order.returnRequests
        .filter((x) => x.status === 'REFUNDED')
        .reduce((s, x) => s + (x.refundAmount ?? 0), 0)
      if (alreadyRefunded + amount > order.total + 0.01) {
        throw new OrderTransitionError('Toplam iade tutarı sipariş tutarını aşamaz.')
      }
      updated = await prisma.returnRequest.update({ where: { id: r.id }, data: { status: 'REFUNDED', refundedAt: now, refundAmount: amount } })

      // Sipariş ödeme/genel durumu
      const fresh = await loadOrder(orderId)
      const refunded = fresh.returnRequests.filter((x) => x.status === 'REFUNDED')
      const totalRefunded = refunded.reduce((s, x) => s + (x.refundAmount ?? 0), 0)
      const returnedQty: Record<string, number> = {}
      for (const x of refunded) for (const i of itemsOf(x)) returnedQty[i.lineId] = (returnedQty[i.lineId] ?? 0) + i.quantity
      const allReturned = fresh.lines.every((l) => (returnedQty[l.id] ?? 0) >= l.quantity)
      await prisma.order.update({
        where: { id: orderId },
        data: {
          paymentStatus: totalRefunded >= fresh.total - 0.01 ? 'REFUNDED' : 'PARTIALLY_REFUNDED',
          ...(allReturned ? { status: 'RETURNED' as const } : {}),
        },
      })
      await logOrderEvent(orderId, {
        type: 'return',
        status: 'REFUNDED',
        message: `Ücret iadesi yapıldı (${r.requestNo}): ${amount.toLocaleString('tr-TR', { style: 'currency', currency: 'TRY' })}${allReturned ? ' — sipariş tamamen iade edildi.' : ''}`,
        actor: opts.actor,
      })
      await notify(fresh, updated, 'refunded')
      break
    }
    default:
      throw new OrderTransitionError('Geçersiz işlem')
  }
  return updated
}

/** Müşteriye gösterilecek talep alanları (admin notu hariç). */
export function toCustomerReturn(r: ReturnRequest) {
  const { adminNote: _a, ...rest } = r
  return {
    ...rest,
    typeLabel: RETURN_TYPES[r.type as ReturnType] ?? r.type,
    statusLabel: RETURN_STATUS_LABELS[r.status] ?? r.status,
    carrierName: r.returnCarrier ? getCarrier(r.returnCarrier)?.name ?? r.returnCarrier : null,
  }
}
