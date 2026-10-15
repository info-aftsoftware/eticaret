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
import { VAT_RATE } from '@/lib/store-config'

/** Mağaza fiyatları KDV hariç tutulur; GA4'e müşterinin gördüğü KDV dahil fiyat gönderilir. */
export const grossPrice = (net: number) => Math.round(net * (1 + VAT_RATE / 100) * 100) / 100

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

async function send(name: string, params: Record<string, unknown>) {
  if (typeof window === 'undefined' || !isFirebaseConfigured || !hasAnalyticsConsent()) return
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
