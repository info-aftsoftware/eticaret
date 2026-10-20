/**
 * Siparişteki kargo teklifinin yönetim panelindeki görünümü: ücret hangi kaynaktan (Geliver / Navlungo) ve
 * hangi firmanın fiyatından verildi, sipariş anında diğer teklifler neydi.
 * Bu alanlar eklenmeden önceki siparişler Geliver listesiyle fiyatlanmıştı; "kayıt öncesi" olarak işaretlenir.
 */
import { getCarrier } from '@/lib/shipping/carriers'
import { SHIPPING_PROVIDER_LABELS, type ShippingProvider } from '@/lib/shipping/rates'
import type { ShippingCandidate } from '@/lib/shipping/fee'

export type ShippingQuoteView = {
  provider: ShippingProvider
  providerLabel: string
  carrierId: string | null
  carrierName: string | null
  /** Tek satırlık özet: "Navlungo · Aras Kargo" */
  summary: string
  /** Sipariş, kaynak kaydı eklenmeden önce verildi (Geliver listesiyle fiyatlanmıştı) */
  legacy: boolean
  candidates: ShippingCandidate[]
  desi: number | null
  kg: number | null
  battery: boolean
}

type OrderQuoteFields = {
  shippingQuoteProvider?: string | null
  shippingQuoteCarrier?: string | null
  shippingQuote?: unknown
}

export function shippingQuoteView(order: OrderQuoteFields): ShippingQuoteView {
  const raw = (order.shippingQuote && typeof order.shippingQuote === 'object' ? order.shippingQuote : null) as {
    carrierName?: string
    candidates?: ShippingCandidate[]
    desi?: number
    kg?: number
    battery?: boolean
  } | null
  const provider: ShippingProvider = order.shippingQuoteProvider === 'navlungo' ? 'navlungo' : 'geliver'
  const legacy = !order.shippingQuoteProvider
  const carrierId = order.shippingQuoteCarrier ?? null
  const carrierName = carrierId ? getCarrier(carrierId)?.name ?? carrierId : raw?.carrierName ?? null
  const providerLabel = SHIPPING_PROVIDER_LABELS[provider]
  const summary = legacy
    ? `${providerLabel} (önceki fiyat listesi)`
    : [providerLabel, carrierName].filter(Boolean).join(' · ')
  return {
    provider,
    providerLabel,
    carrierId,
    carrierName,
    summary,
    legacy,
    candidates: Array.isArray(raw?.candidates) ? raw!.candidates : [],
    desi: typeof raw?.desi === 'number' ? raw.desi : null,
    kg: typeof raw?.kg === 'number' ? raw.kg : null,
    battery: Boolean(raw?.battery),
  }
}
