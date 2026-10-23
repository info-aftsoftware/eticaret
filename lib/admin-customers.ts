/**
 * Admin müşteri listesi ve detayı (Prisma User + Order).
 * Üye siparişleri kullanıcıya, misafir siparişleri e-posta adresine göre gruplanır.
 * Misafir müşteri anahtarı e-postanın özetidir (adreste/URL'de e-posta görünmez).
 */

import crypto from 'crypto'
import { prisma } from '@/lib/prisma'
import { getAdminFirestore, isFirebaseAdminConfigured } from '@/lib/firebaseAdminServer'
import { isCollectedOrder, refundedByOrder } from '@/lib/revenue'

export type CustomerSort = 'last_order' | 'spend' | 'orders' | 'newest' | 'name'
export type CustomerFilter = 'all' | 'registered' | 'guest' | 'with_orders'

const PLACEHOLDER = '@placeholder.local'

export const userKey = (id: string) => `u_${id}`
export const guestKey = (identity: string) => `g_${crypto.createHash('sha256').update(identity.trim().toLowerCase()).digest('hex').slice(0, 20)}`

type OrderLite = {
  id: string
  orderNo: string
  userId: string | null
  shippingEmail: string | null
  shippingName: string
  shippingPhone: string
  shippingCity: string
  total: number
  status: string
  paymentStatus: string
  paymentMethod: string | null
  createdAt: Date
}

export type CustomerSummary = {
  key: string
  type: 'registered' | 'guest'
  userId: string | null
  customerNo: string | null
  name: string
  email: string | null
  phone: string | null
  city: string | null
  registeredAt: string | null
  emailVerified: boolean | null
  orderCount: number
  paidOrderCount: number
  paidTotal: number
  lastOrderAt: string | null
  firstOrderAt: string | null
}

type Group = CustomerSummary & { orders: OrderLite[] }

const realEmail = (e: string | null | undefined) => (e && !e.endsWith(PLACEHOLDER) ? e.toLowerCase() : null)

async function buildGroups(): Promise<Map<string, Group>> {
  const [users, orders] = await Promise.all([
    prisma.user.findMany({
      where: { role: { not: 'admin' } },
      select: { id: true, email: true, name: true, phone: true, customerNo: true, createdAt: true, emailVerified: true },
    }),
    prisma.order.findMany({
      orderBy: { createdAt: 'desc' },
      select: {
        id: true,
        orderNo: true,
        userId: true,
        shippingEmail: true,
        shippingName: true,
        shippingPhone: true,
        shippingCity: true,
        total: true,
        status: true,
        paymentStatus: true,
        paymentMethod: true,
        createdAt: true,
      },
    }),
  ])
  const refunds = await refundedByOrder(orders.filter(isCollectedOrder).map((o) => o.id))

  const groups = new Map<string, Group>()
  const userByEmail = new Map<string, string>()
  for (const u of users) {
    const email = realEmail(u.email)
    if (email) userByEmail.set(email, u.id)
    groups.set(userKey(u.id), {
      key: userKey(u.id),
      type: 'registered',
      userId: u.id,
      customerNo: u.customerNo,
      name: u.name,
      email,
      phone: u.phone,
      city: null,
      registeredAt: u.createdAt.toISOString(),
      emailVerified: u.emailVerified,
      orderCount: 0,
      paidOrderCount: 0,
      paidTotal: 0,
      lastOrderAt: null,
      firstOrderAt: null,
      orders: [],
    })
  }

  // Siparişler en yeniden eskiye: ilk görülen sipariş adı/telefonu güncel kabul edilir
  for (const o of orders) {
    const email = realEmail(o.shippingEmail)
    const uid = (o.userId && groups.has(userKey(o.userId)) ? o.userId : null) ?? (email ? userByEmail.get(email) ?? null : null)
    let key: string
    if (uid) key = userKey(uid)
    else key = guestKey(email ?? `tel:${o.shippingPhone.replace(/\D/g, '')}`)

    let g = groups.get(key)
    if (!g) {
      g = {
        key,
        type: 'guest',
        userId: null,
        customerNo: null,
        name: o.shippingName,
        email,
        phone: o.shippingPhone,
        city: o.shippingCity,
        registeredAt: null,
        emailVerified: null,
        orderCount: 0,
        paidOrderCount: 0,
        paidTotal: 0,
        lastOrderAt: null,
        firstOrderAt: null,
        orders: [],
      }
      groups.set(key, g)
    }
    g.orders.push(o)
    g.orderCount++
    // Ödenen toplam: İstatistikler'deki tahsilatla aynı kural (lib/revenue), ücret iadeleri düşülür
    if (isCollectedOrder(o)) {
      g.paidOrderCount++
      g.paidTotal += Math.max(0, o.total - (refunds.get(o.id) ?? 0))
    }
    const at = o.createdAt.toISOString()
    if (!g.lastOrderAt) {
      g.lastOrderAt = at
      if (!g.phone) g.phone = o.shippingPhone
      if (!g.city) g.city = o.shippingCity
      if (g.type === 'registered' && (!g.name || g.name === g.email?.split('@')[0])) g.name = o.shippingName
    }
    g.firstOrderAt = at
  }
  for (const g of groups.values()) g.paidTotal = Math.round(g.paidTotal * 100) / 100
  return groups
}

/** Pazarlama izni: üyenin Firestore profilindeki ticari ileti onayı veya bülten aboneliği */
async function consentMap(rows: CustomerSummary[]): Promise<Map<string, 'commercial' | 'newsletter'>> {
  const out = new Map<string, 'commercial' | 'newsletter'>()
  if (!rows.length) return out
  // Sunucudaki izin defteri (öncelikli): üye kimliği veya e-posta ile
  const ledger = await prisma.marketingConsent.findMany({
    where: {
      OR: [
        { userId: { in: rows.map((r) => r.userId).filter(Boolean) as string[] } },
        { email: { in: rows.map((r) => r.email?.toLowerCase()).filter(Boolean) as string[] } },
      ],
    },
  }).catch(() => [])
  const decided = new Set<string>()
  for (const r of rows) {
    const hit = ledger.find((c) => (r.userId && c.userId === r.userId) || (r.email && c.email === r.email.toLowerCase()))
    if (hit) {
      decided.add(r.key)
      if (hit.accepted) out.set(r.key, hit.source === 'bulten' ? 'newsletter' : 'commercial')
    }
  }
  rows = rows.filter((r) => !decided.has(r.key))
  if (!rows.length || !isFirebaseAdminConfigured()) return out
  const db = getAdminFirestore()
  if (!db) return out
  try {
    const registered = rows.filter((r) => r.userId)
    if (registered.length) {
      const snaps = await db.getAll(...registered.map((r) => db.doc(`users/${r.userId}`)))
      snaps.forEach((s, i) => {
        if (s.exists && s.get('consents.commercialMessages.accepted') === true) out.set(registered[i].key, 'commercial')
      })
    }
    const emails = [...new Set(rows.filter((r) => r.email && !out.has(r.key)).map((r) => r.email!))]
    for (let i = 0; i < emails.length; i += 30) {
      const snap = await db.collection('newsletter').where('email', 'in', emails.slice(i, i + 30)).get()
      const subscribed = new Set(snap.docs.map((d) => String(d.get('email')).toLowerCase()))
      for (const r of rows) if (r.email && subscribed.has(r.email) && !out.has(r.key)) out.set(r.key, 'newsletter')
    }
  } catch (e) {
    console.warn('Admin customers: consent lookup failed', (e as Error).message)
  }
  return out
}

const strip = ({ orders: _orders, ...rest }: Group): CustomerSummary => rest

export async function listCustomers(opts: { q?: string; page: number; pageSize: number; sort: CustomerSort; filter: CustomerFilter }) {
  const groups = [...(await buildGroups()).values()]
  const q = (opts.q ?? '').trim().toLocaleLowerCase('tr-TR')
  const qDigits = q.replace(/\D/g, '')

  const counts = {
    all: groups.length,
    registered: groups.filter((g) => g.type === 'registered').length,
    guest: groups.filter((g) => g.type === 'guest').length,
    with_orders: groups.filter((g) => g.orderCount > 0).length,
  }

  let rows = groups.filter((g) => {
    if (opts.filter === 'registered' && g.type !== 'registered') return false
    if (opts.filter === 'guest' && g.type !== 'guest') return false
    if (opts.filter === 'with_orders' && g.orderCount === 0) return false
    if (!q) return true
    return (
      g.name.toLocaleLowerCase('tr-TR').includes(q) ||
      (g.email ?? '').includes(q) ||
      (g.customerNo ?? '').toLowerCase().includes(q) ||
      (qDigits.length >= 4 && (g.phone ?? '').replace(/\D/g, '').includes(qDigits)) ||
      g.orders.some((o) => o.orderNo.toLowerCase() === q)
    )
  })

  const time = (s: string | null) => (s ? new Date(s).getTime() : 0)
  rows = rows.sort((a, b) => {
    switch (opts.sort) {
      case 'spend':
        return b.paidTotal - a.paidTotal || b.orderCount - a.orderCount
      case 'orders':
        return b.orderCount - a.orderCount || b.paidTotal - a.paidTotal
      case 'newest':
        return time(b.registeredAt ?? b.firstOrderAt) - time(a.registeredAt ?? a.firstOrderAt)
      case 'name':
        return a.name.localeCompare(b.name, 'tr-TR')
      default:
        return time(b.lastOrderAt) - time(a.lastOrderAt) || time(b.registeredAt) - time(a.registeredAt)
    }
  })

  const total = rows.length
  const pageRows = rows.slice((opts.page - 1) * opts.pageSize, opts.page * opts.pageSize).map(strip)
  const consents = await consentMap(pageRows)
  return {
    customers: pageRows.map((r) => ({ ...r, marketingConsent: consents.get(r.key) ?? null })),
    total,
    page: opts.page,
    pageSize: opts.pageSize,
    counts,
  }
}

export async function getCustomerDetail(key: string) {
  const groups = await buildGroups()
  const g = groups.get(key)
  if (!g) return null
  const consents = await consentMap([strip(g)])
  const addresses = g.userId
    ? await prisma.address.findMany({
        where: { userId: g.userId },
        orderBy: [{ isDefault: 'desc' }, { createdAt: 'desc' }],
        select: { id: true, title: true, name: true, phone: true, addressLine: true, district: true, city: true, isDefault: true },
      })
    : []
  const avg = g.paidOrderCount ? Math.round((g.paidTotal / g.paidOrderCount) * 100) / 100 : 0
  return {
    ...strip(g),
    marketingConsent: consents.get(g.key) ?? null,
    averageOrder: avg,
    addresses,
    orders: g.orders.map((o) => ({
      id: o.id,
      orderNo: o.orderNo,
      createdAt: o.createdAt.toISOString(),
      total: o.total,
      status: o.status,
      paymentStatus: o.paymentStatus,
      paymentMethod: o.paymentMethod,
      name: o.shippingName,
      city: o.shippingCity,
    })),
  }
}

/** Sipariş detayından müşteri kartına bağlantı için anahtar */
export function customerKeyForOrder(order: { userId: string | null; shippingEmail: string | null; shippingPhone: string }) {
  if (order.userId) return userKey(order.userId)
  const email = realEmail(order.shippingEmail)
  return guestKey(email ?? `tel:${order.shippingPhone.replace(/\D/g, '')}`)
}
