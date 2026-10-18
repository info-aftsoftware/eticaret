/**
 * GA4 e-ticaret olayları — Firebase Analytics üzerinden (NEXT_PUBLIC_FIREBASE_MEASUREMENT_ID'nin bağlı olduğu GA4 mülkü).
 * Yalnızca çerez bandında "Kabul Et" diyen ziyaretçilerde gönderilir (KVKK / çerez onayı).
 * Olay adları GA4 önerilen e-ticaret olaylarıdır: view_item, add_to_cart, remove_from_cart, view_cart,
 * begin_checkout, add_payment_info, purchase.
 */
'use client'

import { logEvent } from 'firebase/analytics'
import { getAnalytics, isFirebaseConfigured } from '@/lib/firebase/config'
import { hasAnalyticsConsent } from '@/components/CookieConsent'

/** GA4'e müşterinin gördüğü KDV dahil fiyat gönderilir (hesap: lib/store-config) */
import { grossPrice } from '@/lib/store-config'
export { grossPrice }

export type GaItem = {
  item_id: string
  item_name: string
  price: number
  quantity?: number
  item_category?: string
  item_variant?: string
  item_brand?: string
}

const CURRENCY = 'TRY'

/** Meta (Facebook) Pixel — yalnızca NEXT_PUBLIC_META_PIXEL_ID tanımlıysa ve çerez onayı verilmişse yüklenir */
const META_PIXEL_ID = process.env.NEXT_PUBLIC_META_PIXEL_ID
/** GA4 olayı → Meta standart olayı */
const META_EVENTS: Record<string, string> = {
  view_item: 'ViewContent',
  add_to_cart: 'AddToCart',
  begin_checkout: 'InitiateCheckout',
  add_payment_info: 'AddPaymentInfo',
  purchase: 'Purchase',
}

type Fbq = ((...args: unknown[]) => void) & { queue?: unknown[][]; loaded?: boolean; version?: string; callMethod?: (...a: unknown[]) => void; push?: unknown }

function getFbq(): Fbq | null {
  if (!META_PIXEL_ID || typeof window === 'undefined') return null
  const w = window as unknown as { fbq?: Fbq; _fbq?: Fbq }
  if (!w.fbq) {
    // Meta'nın resmî yükleyicisinin eşdeğeri: çağrılar betik yüklenene kadar kuyruğa alınır
    const fbq: Fbq = function (...args: unknown[]) {
      if (fbq.callMethod) fbq.callMethod(...args)
      else fbq.queue!.push(args)
    } as Fbq
    fbq.queue = []
    fbq.loaded = true
    fbq.version = '2.0'
    fbq.push = fbq
    w.fbq = fbq
    w._fbq = fbq
    const script = document.createElement('script')
    script.async = true
    script.src = 'https://connect.facebook.net/en_US/fbevents.js'
    document.head.appendChild(script)
    fbq('init', META_PIXEL_ID)
    fbq('track', 'PageView')
  }
  return w.fbq!
}

function sendMeta(name: string, params: Record<string, unknown>) {
  const event = META_EVENTS[name]
  if (!event) return
  const fbq = getFbq()
  if (!fbq) return
  const items = (params.items as GaItem[] | undefined) ?? []
  fbq('track', event, {
    currency: CURRENCY,
    value: params.value,
    content_type: 'product',
    content_ids: items.map((i) => i.item_id),
    contents: items.map((i) => ({ id: i.item_id, quantity: i.quantity ?? 1, item_price: i.price })),
    num_items: items.reduce((n, i) => n + (i.quantity ?? 1), 0),
  }, name === 'purchase' && params.transaction_id ? { eventID: String(params.transaction_id) } : undefined)
}

async function send(name: string, params: Record<string, unknown>) {
  if (typeof window === 'undefined' || !hasAnalyticsConsent()) return
  try {
    sendMeta(name, params)
  } catch {
    // ölçüm hatası alışverişi etkilemez
  }
  if (!isFirebaseConfigured) return
  try {
    const analytics = await getAnalytics()
    if (analytics) logEvent(analytics, name as never, params as never)
  } catch {
    // ölçüm hatası alışverişi etkilemez
  }
}

const value = (items: GaItem[]) => Math.round(items.reduce((s, i) => s + i.price * (i.quantity ?? 1), 0) * 100) / 100

export const trackViewItem = (item: GaItem) => send('view_item', { currency: CURRENCY, value: item.price, items: [item] })
export const trackAddToCart = (item: GaItem) => send('add_to_cart', { currency: CURRENCY, value: value([item]), items: [item] })
export const trackRemoveFromCart = (item: GaItem) => send('remove_from_cart', { currency: CURRENCY, value: value([item]), items: [item] })
export const trackViewCart = (items: GaItem[]) => send('view_cart', { currency: CURRENCY, value: value(items), items })
export const trackBeginCheckout = (items: GaItem[], coupon?: string | null) =>
  send('begin_checkout', { currency: CURRENCY, value: value(items), items, ...(coupon ? { coupon } : {}) })
export const trackAddPaymentInfo = (items: GaItem[], paymentType: 'bank_transfer' | 'card') =>
  send('add_payment_info', { currency: CURRENCY, value: value(items), items, payment_type: paymentType === 'card' ? 'Kredi Kartı' : 'Havale/EFT' })

/** Satın alma — aynı sipariş için bir kez (sayfa yenilenirse tekrar gönderilmez). */
export function trackPurchase(p: { orderNo: string; total: number; tax?: number; shipping?: number; coupon?: string | null; items: GaItem[] }) {
  try {
    const key = `ga-purchase-${p.orderNo}`
    if (localStorage.getItem(key)) return
    localStorage.setItem(key, '1')
  } catch {
    // depolama kapalıysa yine gönder
  }
  return send('purchase', {
    transaction_id: p.orderNo,
    currency: CURRENCY,
    value: p.total,
    ...(p.tax != null ? { tax: p.tax } : {}),
    ...(p.shipping != null ? { shipping: p.shipping } : {}),
    ...(p.coupon ? { coupon: p.coupon } : {}),
    items: p.items,
  })
}

/** Sepet kalemi (KDV hariç fiyat) → GA4 kalemi (sepet id'si "urun" veya "urun-varyant") */
export function cartItemToGa(i: { id: string; name: string; price: number; quantity: number; category?: string }): GaItem {
  return { item_id: i.id, item_name: i.name, price: grossPrice(i.price), quantity: i.quantity, ...(i.category ? { item_category: i.category } : {}) }
}
