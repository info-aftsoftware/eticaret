'use client'

import React, { useState, useEffect, useCallback } from 'react'
import Link from 'next/link'
import { useParams, useSearchParams } from 'next/navigation'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Button as UiButton, type ButtonProps } from '@/components/ui/button'
import { Pill } from '@/components/admin/ui'
import { ORDER_STATUS_TONE, PAYMENT_STATUS_TONE } from '@/components/admin/order-meta'
import { cn } from '@/lib/utils'
import { useToast } from '@/components/admin/toast'
import { useAdminLive } from '@/components/admin/AdminLiveProvider'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Textarea } from '@/components/ui/textarea'
import { ArrowLeft, Loader2, Package, FileText, Truck, CreditCard, Banknote, Clock, StickyNote, ExternalLink, UserRound } from 'lucide-react'
import { fmtTRY } from '@/lib/format'
import type { ShippingQuoteView } from '@/lib/shipping/quote-view'
import { ReturnRequestsCard, type AdminReturnRequest } from './ReturnRequestsCard'
import { CancelRequestCard, type AdminCancelRequest } from './CancelRequestCard'

/** Panelde ölçeklenen hover efekti istenmez */
const Button = React.forwardRef<HTMLButtonElement, ButtonProps>(function Button({ className, ...props }, ref) {
  return <UiButton ref={ref} className={cn('hover:scale-100 active:scale-100 hover:shadow-none shadow-none', className)} {...props} />
})

type OrderEvent = {
  id: string
  type: string
  status: string | null
  message: string
  actor: string
  visibleToCustomer: boolean
  createdAt: string
}

type OrderDetail = {
  id: string
  source: 'prisma' | 'firestore'
  orderId: string
  userId?: string
  customerNo?: string | null
  customerKey?: string
  readOnly?: boolean
  customer: Record<string, string | null | undefined>
  items: Array<{ id?: string; name: string; productId?: string | null; price: number; quantity: number; lineTotal?: number }>
  pricing: {
    subtotal?: number
    couponCode?: string | null
    couponDiscount?: number
    paymentDiscount?: number
    tax?: number
    shipping?: number
    total?: number
  }
  paymentMethod?: string | null
  paymentProviderRef?: string | null
  status: string
  statusLabel?: string
  paymentStatus: string
  allowedNextStatuses?: { value: string; label: string }[]
  shippingCarrier?: string | null
  shippingCarrierName?: string | null
  /** Kargo ücretinin kaynağı: Geliver (önceki firma listesi) veya Navlungo */
  shippingQuote?: ShippingQuoteView
  trackingNumber?: string
  trackingUrl?: string | null
  /** Navlungo gönderisi (lib/shipping/navlungo-shipments.ts → navlungoShipmentView) */
  navlungo?: {
    enabled: boolean
    testMode: boolean | null
    postNumber: string | null
    statusCode: number | null
    statusName: string | null
    labelUrl: string | null
    createdInTestMode: boolean | null
    syncedAt: string | null
    envMismatch: boolean
    defaultDesi: number
  }
  carriers?: { id: string; name: string }[]
  customerNote?: string | null
  adminNote?: string | null
  consents?: { acceptedAt?: string; ip?: string | null } | null
  createdAt: string
  paidAt?: string | null
  shippedAt?: string | null
  deliveredAt?: string | null
  cancelledAt?: string | null
  events?: OrderEvent[]
  returnRequests?: AdminReturnRequest[]
  cancelRequest?: AdminCancelRequest | null
}

const STATUS_LABELS: Record<string, string> = {
  pending: 'Beklemede', PENDING: 'Beklemede',
  confirmed: 'Onaylandı', CONFIRMED: 'Onaylandı',
  processing: 'Hazırlanıyor', PROCESSING: 'Hazırlanıyor',
  picking: 'Hazırlanıyor', PICKING: 'Hazırlanıyor',
  shipped: 'Kargoda', SHIPPED: 'Kargoda',
  delivered: 'Teslim Edildi', DELIVERED: 'Teslim Edildi',
  cancelled: 'İptal', CANCELLED: 'İptal',
  returned: 'İade', RETURNED: 'İade',
  paid: 'Ödendi', PAID: 'Ödendi',
}

const PAYMENT_STATUS_LABELS: Record<string, string> = {
  PENDING: 'Ödeme bekleniyor', pending: 'Ödeme bekleniyor',
  PAID: 'Ödendi', paid: 'Ödendi',
  FAILED: 'Başarısız', REFUNDED: 'İade edildi', PARTIALLY_REFUNDED: 'Kısmi iade',
}

const PAYMENT_METHOD_LABELS: Record<string, string> = {
  bank_transfer: 'Havale / EFT',
  card: 'Kredi / Banka Kartı (Sanal POS, 3D Secure)',
  stripe: 'Kredi / Banka Kartı (Stripe)',
  paytr: 'Kredi / Banka Kartı (PayTR)',
}

const fmtDate = (s?: string | null) =>
  s ? new Date(s).toLocaleString('tr-TR', { day: '2-digit', month: 'short', year: 'numeric', hour: '2-digit', minute: '2-digit' }) : '—'

export default function AdminOrderDetailPage() {
  const params = useParams()
  const searchParams = useSearchParams()
  const id = params.id as string
  const source = searchParams.get('source') || 'prisma'
  const userId = searchParams.get('userId') || ''

  const toast = useToast()
  const { refresh: refreshLive } = useAdminLive()
  const [order, setOrder] = useState<OrderDetail | null>(null)
  const [loading, setLoading] = useState(true)
  const [busy, setBusy] = useState<string | null>(null)
  const [message, setMessage] = useState<{ type: 'success' | 'error'; text: string } | null>(null)

  // İşlem formları
  const [carrier, setCarrier] = useState('')
  const [trackingNumber, setTrackingNumber] = useState('')
  const [reason, setReason] = useState('')
  const [notifyCustomer, setNotifyCustomer] = useState(true)
  const [adminNote, setAdminNote] = useState('')
  const [navDesi, setNavDesi] = useState('')
  const [navPackages, setNavPackages] = useState('1')

  const apiUrl = source === 'firestore' && userId
    ? `/api/admin/orders/${id}?source=firestore&userId=${userId}`
    : `/api/admin/orders/${id}?source=${source}`

  const applyOrder = useCallback((data: OrderDetail) => {
    setOrder(data)
    setCarrier(data.shippingCarrier || data.shippingQuote?.carrierId || data.carriers?.[0]?.id || '')
    setTrackingNumber(data.trackingNumber || '')
    setAdminNote(data.adminNote || '')
    setNavDesi(data.navlungo ? String(data.navlungo.defaultDesi) : '')
  }, [])

  useEffect(() => {
    if (!id) return
    setLoading(true)
    fetch(apiUrl, { credentials: 'include' })
      .then((res) => (res.ok ? res.json() : null))
      .then((data) => (data ? applyOrder(data) : setOrder(null)))
      .catch(() => setOrder(null))
      .finally(() => setLoading(false))
  }, [id, apiUrl, applyOrder])

  const patch = async (key: string, body: Record<string, unknown>, successText: string, confirmText?: string): Promise<boolean> => {
    if (confirmText && !window.confirm(confirmText)) return false
    setBusy(key)
    setMessage(null)
    try {
      const res = await fetch(apiUrl, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(body),
        credentials: 'include',
      })
      const data = await res.json().catch(() => null)
      if (!res.ok) throw new Error(data?.error || 'Güncelleme hatası')
      if (data?.order) applyOrder({ ...order!, ...data.order })
      setReason('')
      setMessage({ type: 'success', text: successText })
      toast.success(successText)
      refreshLive()
      return true
    } catch (err) {
      const text = err instanceof Error ? err.message : 'Güncelleme sırasında bir hata oluştu.'
      setMessage({ type: 'error', text })
      toast.error('İşlem yapılamadı', text)
      return false
    } finally {
      setBusy(null)
    }
  }

  const handleSendInvoice = async () => {
    if (!order) return
    setBusy('invoice')
    setMessage(null)
    try {
      const res = await fetch(`/api/admin/orders/${order.id}/send-invoice`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ source: order.source, userId: order.userId }),
        credentials: 'include',
      })
      const data = await res.json()
      if (!res.ok) throw new Error(data.error || 'Fatura gönderilemedi')
      setMessage({ type: 'success', text: data.message || 'Fatura gönderildi.' })
    } catch (err: any) {
      setMessage({ type: 'error', text: err.message || 'Fatura gönderilirken hata oluştu.' })
    } finally {
      setBusy(null)
    }
  }

  if (loading) {
    return (
      <div className="flex items-center justify-center py-24">
        <Loader2 className="w-10 h-10 animate-spin text-brand" />
      </div>
    )
  }

  if (!order) {
    return (
      <div className="space-y-6">
        <Button asChild variant="ghost">
          <Link href="/admin/orders"><ArrowLeft className="w-4 h-4 mr-2" />Siparişlere Dön</Link>
        </Button>
        <Card>
          <CardContent className="py-12 text-center text-slate-600">
            <Package className="w-12 h-12 mx-auto mb-3 text-slate-300" />
            Sipariş bulunamadı.
          </CardContent>
        </Card>
      </div>
    )
  }

  const c = order.customer
  const p = order.pricing || {}
  const isPrisma = order.source === 'prisma'
  const isPaid = order.paymentStatus === 'PAID' || order.paymentStatus === 'paid'
  const next = order.allowedNextStatuses ?? []
  const canShip = next.some((s) => s.value === 'SHIPPED')
  const otherNext = next.filter((s) => s.value !== 'SHIPPED')
  const nav = order.navlungo
  const navCreate = Boolean(nav?.enabled && canShip && !nav.postNumber)
  const navDesiValue = Number(navDesi.replace(',', '.'))
  const navPackagesValue = Number(navPackages)
  const navInputsOk = navDesiValue > 0 && navDesiValue <= 1000 && Number.isInteger(navPackagesValue) && navPackagesValue > 0 && navPackagesValue <= 50

  return (
    <div className="space-y-6">
      <div className="space-y-2">
        <Link href="/admin/orders" className="inline-flex items-center gap-1 text-[13px] text-[#5d6e80] hover:text-[#0b2540]">
          <ArrowLeft className="w-4 h-4" />
          Siparişler
        </Link>
        <div className="flex flex-col sm:flex-row sm:items-end sm:justify-between gap-3">
          <div className="min-w-0">
            <h1 className="text-xl sm:text-2xl font-bold text-[#121926] tracking-tight flex flex-wrap items-center gap-2">
              <span className="font-mono">{order.orderId}</span>
              <Pill tone={ORDER_STATUS_TONE[order.status] ?? 'slate'} dot>{order.statusLabel ?? STATUS_LABELS[order.status] ?? order.status}</Pill>
              <Pill tone={PAYMENT_STATUS_TONE[order.paymentStatus] ?? 'slate'}>{PAYMENT_STATUS_LABELS[order.paymentStatus] ?? order.paymentStatus}</Pill>
            </h1>
            <p className="text-sm text-[#5d6e80] mt-1">
              {fmtDate(order.createdAt)} · {c.name}
              {order.customerNo ? ` · ${order.customerNo}` : order.userId ? ' · Üye' : ' · Misafir'}
            </p>
          </div>
          {order.customerKey && (
            <Link href={`/admin/musteriler/detay?key=${encodeURIComponent(order.customerKey)}`} className="inline-flex items-center gap-1.5 h-9 px-3 rounded-lg border border-[#d3d9e1] bg-white text-[13px] font-medium text-[#20384e] hover:bg-[#f5f7fa] w-fit">
              <UserRound className="w-4 h-4" />
              Müşteri kartı
            </Link>
          )}
        </div>
      </div>

      {message && (
        <div
          role={message.type === 'error' ? 'alert' : 'status'}
          className={`px-4 py-3 rounded-lg text-sm ${message.type === 'success' ? 'bg-green-50 text-green-800 border border-green-200' : 'bg-red-50 text-red-800 border border-red-200'}`}
        >
          {message.text}
        </div>
      )}

      {isPrisma && order.cancelRequest?.status === 'REQUESTED' && (
        <CancelRequestCard request={order.cancelRequest} total={p.total ?? 0} paymentMethod={order.paymentMethod} busy={busy} onAction={patch} />
      )}

      <div className="grid gap-6 lg:grid-cols-3">
        {/* Sol: sipariş içeriği */}
        <div className="lg:col-span-2 space-y-6">
          <Card className="border-[#e6ebf1] bg-white shadow-none rounded-xl">
            <CardHeader><CardTitle className="text-base">Ürünler</CardTitle></CardHeader>
            <CardContent className="space-y-3">
              <ul className="divide-y divide-slate-100">
                {order.items.map((item, i) => (
                  <li key={item.id ?? i} className="flex justify-between gap-4 py-2 text-sm">
                    <span className="text-slate-800">
                      {item.productId ? (
                        <Link href={`/products/${item.productId}`} target="_blank" className="hover:underline">{item.name}</Link>
                      ) : item.name}
                      <span className="text-slate-500"> × {item.quantity}</span>
                      <span className="block text-xs text-slate-500">Birim (KDV hariç): {fmtTRY(item.price)}</span>
                    </span>
                    <span className="font-medium tabular-nums whitespace-nowrap">{fmtTRY(item.lineTotal ?? item.price * item.quantity)}</span>
                  </li>
                ))}
              </ul>
              <dl className="border-t border-slate-200 pt-3 space-y-1 text-sm">
                <div className="flex justify-between"><dt className="text-slate-600">Ara toplam (KDV hariç)</dt><dd className="tabular-nums">{fmtTRY(p.subtotal ?? 0)}</dd></div>
                {!!p.couponDiscount && (
                  <div className="flex justify-between text-green-700"><dt>Kupon {p.couponCode ? `(${p.couponCode})` : ''}</dt><dd className="tabular-nums">-{fmtTRY(p.couponDiscount)}</dd></div>
                )}
                {!!p.paymentDiscount && (
                  <div className="flex justify-between text-green-700"><dt>Havale/EFT indirimi</dt><dd className="tabular-nums">-{fmtTRY(p.paymentDiscount)}</dd></div>
                )}
                <div className="flex justify-between"><dt className="text-slate-600">KDV</dt><dd className="tabular-nums">{fmtTRY(p.tax ?? 0)}</dd></div>
                <div className="flex justify-between">
                  <dt className="text-slate-600">
                    Kargo
                    {order.shippingQuote && <span className="block text-xs text-slate-500">Fiyat: {order.shippingQuote.summary}</span>}
                  </dt>
                  <dd className="tabular-nums">{p.shipping ? fmtTRY(p.shipping) : 'Ücretsiz'}</dd>
                </div>
                <div className="flex justify-between font-bold text-base pt-1"><dt>Toplam</dt><dd className="tabular-nums">{fmtTRY(p.total ?? 0)}</dd></div>
              </dl>
            </CardContent>
          </Card>

          <div className="grid gap-6 sm:grid-cols-2">
            <Card className="border-[#e6ebf1] bg-white shadow-none rounded-xl">
              <CardHeader><CardTitle className="text-base">Müşteri ve Teslimat</CardTitle></CardHeader>
              <CardContent className="text-sm text-slate-700 space-y-1">
                <p className="font-medium text-slate-900">{c.name}</p>
                {c.email && <p><a href={`mailto:${c.email}`} className="text-brand hover:underline">{c.email}</a></p>}
                {c.phone && <p><a href={`tel:${c.phone}`} className="hover:underline">{c.phone}</a></p>}
                <p className="pt-1">{c.addressLine}</p>
                <p>{[c.district, c.city, c.postalCode].filter(Boolean).join(' / ')}</p>
              </CardContent>
            </Card>
            <Card className="border-[#e6ebf1] bg-white shadow-none rounded-xl">
              <CardHeader><CardTitle className="text-base">Sipariş Özeti (Proforma)</CardTitle></CardHeader>
              <CardContent className="text-sm text-slate-700 space-y-1">
                <p className="font-medium text-slate-900">{c.billingName || c.companyName || c.name}</p>
                <p>{c.billingType === 'company' ? 'Kurumsal' : 'Bireysel'}</p>
                {c.taxId && <p>{c.billingType === 'company' ? 'VKN' : 'TCKN'}: {c.taxId}</p>}
                {c.taxOffice && <p>Vergi dairesi: {c.taxOffice}</p>}
                {c.billingAddress && <p className="pt-1">{c.billingAddress}</p>}
              </CardContent>
            </Card>
          </div>

          {(order.customerNote || order.consents) && (
            <Card className="border-[#e6ebf1] bg-white shadow-none rounded-xl">
              <CardContent className="pt-6 text-sm space-y-2">
                {order.customerNote && (
                  <p><span className="font-medium text-slate-900">Müşteri notu:</span> {order.customerNote}</p>
                )}
                {order.consents?.acceptedAt && (
                  <p className="text-slate-600">
                    Ön Bilgilendirme ve Mesafeli Satış Sözleşmesi onayı: {fmtDate(order.consents.acceptedAt)}
                    {order.consents.ip ? ` · IP ${order.consents.ip}` : ''}
                  </p>
                )}
              </CardContent>
            </Card>
          )}

          {isPrisma && (
            <Card className="border-[#e6ebf1] bg-white shadow-none rounded-xl">
              <CardHeader><CardTitle className="text-base flex items-center gap-2"><Clock className="w-4 h-4" />Zaman Çizelgesi</CardTitle></CardHeader>
              <CardContent>
                {(order.events ?? []).length === 0 ? (
                  <p className="text-sm text-slate-500">Kayıt yok.</p>
                ) : (
                  <ol className="relative border-l border-slate-200 ml-2 space-y-4">
                    {[...(order.events ?? [])].reverse().map((e) => (
                      <li key={e.id} className="ml-4">
                        <span className={`absolute -left-1.5 mt-1.5 h-3 w-3 rounded-full ${e.type === 'email' ? 'bg-slate-300' : e.type === 'payment' ? 'bg-green-500' : e.type === 'shipment' ? 'bg-purple-500' : 'bg-brand'}`} />
                        <p className="text-sm text-slate-800">{e.message}</p>
                        <p className="text-xs text-slate-500">
                          {fmtDate(e.createdAt)} · {e.actor === 'admin' ? 'Admin' : e.actor === 'customer' ? 'Müşteri' : 'Sistem'}
                          {!e.visibleToCustomer && ' · yalnızca panelde görünür'}
                        </p>
                      </li>
                    ))}
                  </ol>
                )}
              </CardContent>
            </Card>
          )}
        </div>

        {/* Sağ: işlemler */}
        <div className="space-y-6">
          {isPrisma && order.cancelRequest && order.cancelRequest.status !== 'REQUESTED' && (
            <CancelRequestCard
              request={order.cancelRequest}
              total={p.total ?? 0}
              paymentMethod={order.paymentMethod}
              busy={busy}
              onAction={patch}
            />
          )}
          {isPrisma && (
            <ReturnRequestsCard
              requests={order.returnRequests ?? []}
              carriers={order.carriers ?? []}
              busy={busy}
              onAction={patch}
            />
          )}
          <Card className="border-[#e6ebf1] bg-white shadow-none rounded-xl">
            <CardHeader>
              <CardTitle className="text-base flex items-center gap-2">
                {order.paymentMethod === 'bank_transfer' ? <Banknote className="w-4 h-4" /> : <CreditCard className="w-4 h-4" />}
                Ödeme
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-3 text-sm">
              <p>{PAYMENT_METHOD_LABELS[order.paymentMethod ?? ''] ?? order.paymentMethod ?? '—'}</p>
              <p className={isPaid ? 'text-green-700 font-medium' : 'text-amber-700 font-medium'}>
                {PAYMENT_STATUS_LABELS[order.paymentStatus] ?? order.paymentStatus}
                {order.paidAt ? ` · ${fmtDate(order.paidAt)}` : ''}
              </p>
              {order.paymentProviderRef && <p className="text-xs text-slate-500 break-all">Ref: {order.paymentProviderRef}</p>}
              {isPrisma && !isPaid && order.status !== 'CANCELLED' && (
                <Button
                  className="w-full bg-green-600 hover:bg-green-700"
                  disabled={busy !== null}
                  onClick={() => patch(
                    'paid',
                    { action: 'mark_paid' },
                    'Ödeme onaylandı. Müşteriye ödeme onayı ve fatura e-postası gönderildi.',
                    `${fmtTRY(p.total ?? 0)} tutarındaki ödeme hesaba geçti mi?`
                  )}
                >
                  {busy === 'paid' ? <Loader2 className="w-4 h-4 animate-spin mr-2" /> : null}
                  Ödeme Alındı
                </Button>
              )}
              {isPrisma && (
                <Button asChild variant="outline" className="w-full">
                  <a href={`/api/admin/orders/${order.id}/packing-slip`} target="_blank" rel="noopener noreferrer">
                    <Package className="w-4 h-4 mr-2" />
                    Paketleme Formunu Yazdır
                  </a>
                </Button>
              )}
              {isPrisma && (
                <Button asChild variant="outline" className="w-full">
                  <a href={`/api/admin/shipping/labels?ids=${encodeURIComponent(order.id)}`} target="_blank" rel="noopener noreferrer">
                    <Package className="w-4 h-4 mr-2" />
                    Kargo Etiketi (10×15)
                  </a>
                </Button>
              )}
              {isPrisma && (
                <Button variant="outline" className="w-full" onClick={handleSendInvoice} disabled={busy !== null}>
                  {busy === 'invoice' ? <Loader2 className="w-4 h-4 animate-spin mr-2" /> : <FileText className="w-4 h-4 mr-2" />}
                  Faturayı E-postayla Gönder
                </Button>
              )}
            </CardContent>
          </Card>

          {isPrisma ? (
            <>
              <Card id="kargo" className="border-[#e6ebf1] bg-white shadow-none rounded-xl">
                <CardHeader><CardTitle className="text-base flex items-center gap-2"><Truck className="w-4 h-4" />Kargo</CardTitle></CardHeader>
                <CardContent className="space-y-3 text-sm">
                  {order.shippingQuote && <ShippingQuoteBox quote={order.shippingQuote} />}
                  {order.trackingNumber && (
                    <p>
                      {order.shippingCarrierName} · <span className="font-mono">{order.trackingNumber}</span>
                      {order.trackingUrl && (
                        <a href={order.trackingUrl} target="_blank" rel="noopener noreferrer" className="inline-flex items-center gap-1 ml-2 text-brand hover:underline">
                          Takip <ExternalLink className="w-3 h-3" />
                        </a>
                      )}
                      {order.shippedAt && <span className="block text-xs text-slate-500">Kargoya veriliş: {fmtDate(order.shippedAt)}</span>}
                      {order.deliveredAt && <span className="block text-xs text-slate-500">Teslim: {fmtDate(order.deliveredAt)}</span>}
                    </p>
                  )}
                  {nav?.postNumber && (
                    <div className="rounded-lg border border-[#e6ebf1] bg-[#f8fafc] px-3 py-2.5 space-y-1.5">
                      <p className="font-medium text-slate-900">
                        Navlungo gönderisi <span className="font-mono">{nav.postNumber}</span>
                        {nav.createdInTestMode && <span className="ml-1 text-xs font-normal text-amber-700">(QA test ortamı)</span>}
                      </p>
                      <p className="text-slate-600">
                        Durum: {nav.statusName ?? 'henüz sorgulanmadı'}
                        {nav.syncedAt && <span className="block text-xs text-slate-500">Son sorgu: {fmtDate(nav.syncedAt)}</span>}
                      </p>
                      {nav.envMismatch && (
                        <p className="text-xs text-amber-800">Gönderi şimdiki Navlungo ortamından farklı ortamda açılmış; durum ve etiket sorgulanamaz.</p>
                      )}
                      {nav.enabled && !nav.envMismatch && (
                        <div className="flex flex-wrap gap-2 pt-1">
                          <Button asChild variant="outline" size="sm">
                            <a href={`/api/admin/orders/${order.id}/navlungo-label`} target="_blank" rel="noopener noreferrer">Etiketi indir (PDF)</a>
                          </Button>
                          {order.status === 'SHIPPED' && (
                            <Button
                              variant="outline"
                              size="sm"
                              disabled={busy !== null}
                              onClick={() => patch('navsync', { action: 'navlungo_sync' }, "Kargo durumu Navlungo'dan güncellendi.")}
                            >
                              {busy === 'navsync' ? <Loader2 className="w-4 h-4 animate-spin mr-2" /> : null}
                              Durumu güncelle
                            </Button>
                          )}
                        </div>
                      )}
                    </div>
                  )}
                  {navCreate && nav && (
                    <div className="rounded-lg border border-[#e6ebf1] px-3 py-2.5 space-y-2">
                      <p className="font-medium text-slate-900">
                        Navlungo ile kargoya ver
                        {nav.testMode && <span className="ml-1 text-xs font-normal text-amber-700">(QA test ortamı)</span>}
                      </p>
                      <div className="grid grid-cols-2 gap-2">
                        <div className="space-y-1">
                          <Label htmlFor="nav-desi">Desi</Label>
                          <Input id="nav-desi" inputMode="decimal" value={navDesi} onChange={(e) => setNavDesi(e.target.value)} />
                        </div>
                        <div className="space-y-1">
                          <Label htmlFor="nav-packages">Koli adedi</Label>
                          <Input id="nav-packages" inputMode="numeric" value={navPackages} onChange={(e) => setNavPackages(e.target.value.replace(/\D/g, ''))} />
                        </div>
                      </div>
                      <Button
                        className="w-full bg-[#f5b400] text-[#111] hover:bg-[#e0a500]"
                        disabled={busy !== null || !navInputsOk}
                        onClick={() => patch(
                          'navcreate',
                          { action: 'navlungo_create', desi: navDesiValue, packageCount: navPackagesValue, notifyCustomer },
                          'Navlungo gönderisi oluşturuldu, sipariş kargoya verildi.',
                          `Navlungo'da ${navDesiValue} desi, ${navPackagesValue} koli gönderi oluşturulacak ve sipariş "Kargoda" olacak${notifyCustomer ? '; müşteriye takip linkiyle e-posta gider' : ''}. Devam edilsin mi?`
                        )}
                      >
                        {busy === 'navcreate' ? <Loader2 className="w-4 h-4 animate-spin mr-2" /> : null}
                        Navlungo'da gönderi oluştur
                      </Button>
                      <p className="text-xs text-slate-500">
                        Takip numarası, takip linki ve durum Navlungo'dan gelir. Etiket gönderi oluştuktan birkaç dakika sonra hazır olur.
                      </p>
                    </div>
                  )}
                  {(canShip || order.status === 'SHIPPED') && (
                    <>
                      {navCreate && <p className="text-xs font-medium text-slate-600 pt-1">Ya da takip numarasını elle girin</p>}
                      <div className="space-y-1">
                        <Label htmlFor="carrier">Kargo firması</Label>
                        <select
                          id="carrier"
                          value={carrier}
                          onChange={(e) => setCarrier(e.target.value)}
                          className="w-full h-10 rounded-md border border-slate-200 px-3 text-sm bg-white"
                        >
                          {(order.carriers ?? []).map((cr) => <option key={cr.id} value={cr.id}>{cr.name}</option>)}
                        </select>
                      </div>
                      <div className="space-y-1">
                        <Label htmlFor="tracking">Takip numarası</Label>
                        <Input id="tracking" value={trackingNumber} onChange={(e) => setTrackingNumber(e.target.value)} placeholder="Örn. 1234567890" />
                      </div>
                      {canShip ? (
                        <Button
                          variant={navCreate ? 'outline' : 'default'}
                          className={navCreate ? 'w-full' : 'w-full bg-[#f5b400] text-[#111] hover:bg-[#e0a500]'}
                          disabled={busy !== null || !trackingNumber.trim()}
                          onClick={() => patch('ship', { action: 'status', status: 'SHIPPED', carrier, trackingNumber, notifyCustomer },
                            'Sipariş kargoya verildi olarak işaretlendi.')}
                        >
                          {busy === 'ship' ? <Loader2 className="w-4 h-4 animate-spin mr-2" /> : <Truck className="w-4 h-4 mr-2" />}
                          Kargoya Verildi
                        </Button>
                      ) : (
                        <Button
                          variant="outline"
                          className="w-full"
                          disabled={busy !== null || !trackingNumber.trim()}
                          onClick={() => patch('shipfix', { action: 'shipment', carrier, trackingNumber, notifyCustomer },
                            'Kargo bilgisi güncellendi.')}
                        >
                          Kargo Bilgisini Güncelle
                        </Button>
                      )}
                    </>
                  )}
                  {!canShip && order.status !== 'SHIPPED' && !order.trackingNumber && (
                    <p className="text-slate-500">
                      {isPaid ? 'Kargoya vermek için önce siparişi “Hazırlanıyor” durumuna alın.' : 'Ödeme alındıktan sonra kargo bilgisi girilebilir.'}
                    </p>
                  )}
                </CardContent>
              </Card>

              <Card className="border-[#e6ebf1] bg-white shadow-none rounded-xl">
                <CardHeader><CardTitle className="text-base">Sipariş Durumu</CardTitle></CardHeader>
                <CardContent className="space-y-3 text-sm">
                  {otherNext.length === 0 ? (
                    <p className="text-slate-500">Bu durumdan sonra yapılabilecek bir işlem yok.</p>
                  ) : (
                    <>
                      {otherNext.some((s) => s.value === 'CANCELLED' || s.value === 'RETURNED') && (
                        <div className="space-y-1">
                          <Label htmlFor="reason">İptal / iade gerekçesi (müşteriye gönderilir)</Label>
                          <Input id="reason" value={reason} onChange={(e) => setReason(e.target.value)} placeholder="İsteğe bağlı" />
                        </div>
                      )}
                      {isPaid && otherNext.some((s) => s.value === 'CANCELLED' || s.value === 'RETURNED') && (
                        <p className="text-xs text-amber-800 bg-amber-50 border border-amber-200 rounded-md px-2.5 py-2">
                          Ödemesi alınmış sipariş iptal/iade edilirse ücret iadesi ({fmtTRY(p.total ?? 0)}) başlatılmış sayılır ve müşteriye iade bilgili e-posta gönderilir.
                        </p>
                      )}
                      <div className="flex flex-col gap-2">
                        {otherNext.map((s) => {
                          const danger = s.value === 'CANCELLED' || s.value === 'RETURNED'
                          return (
                            <Button
                              key={s.value}
                              variant={danger ? 'outline' : 'default'}
                              className={danger ? 'w-full border-red-300 text-red-700 hover:bg-red-50' : 'w-full'}
                              disabled={busy !== null}
                              onClick={() => patch(
                                s.value,
                                { action: 'status', status: s.value, reason: reason || undefined, notifyCustomer },
                                `Sipariş durumu “${s.label}” olarak güncellendi.`,
                                danger
                                  ? `Sipariş “${s.label}” durumuna alınacak ve stok geri eklenecek.${isPaid ? `

Ödeme alınmış olduğu için ücret iadesi (${fmtTRY(p.total ?? 0)}) başlatılmış sayılır ve müşteriye iade bilgili e-posta gönderilir. Kart iadesini POS panelinden, havale iadesini ödemenin geldiği hesaba yapın.` : ''}

Emin misiniz?`
                                  : undefined
                              )}
                            >
                              {busy === s.value ? <Loader2 className="w-4 h-4 animate-spin mr-2" /> : null}
                              {s.value === 'PICKING' ? 'Hazırlamaya Al' : s.value === 'DELIVERED' ? 'Teslim Edildi' : s.value === 'CANCELLED' ? 'Siparişi İptal Et' : s.value === 'RETURNED' ? 'İade Alındı' : s.label}
                            </Button>
                          )
                        })}
                      </div>
                    </>
                  )}
                  <label className="flex items-center gap-2 text-slate-700 pt-1">
                    <input type="checkbox" checked={notifyCustomer} onChange={(e) => setNotifyCustomer(e.target.checked)} className="w-4 h-4" />
                    Müşteriye e-posta ile bildir
                  </label>
                </CardContent>
              </Card>

              <Card className="border-[#e6ebf1] bg-white shadow-none rounded-xl">
                <CardHeader><CardTitle className="text-base flex items-center gap-2"><StickyNote className="w-4 h-4" />Admin Notu</CardTitle></CardHeader>
                <CardContent className="space-y-2">
                  <Textarea value={adminNote} onChange={(e) => setAdminNote(e.target.value)} rows={4} placeholder="Yalnızca panelde görünür" aria-label="Admin notu" />
                  <Button
                    variant="outline"
                    className="w-full"
                    disabled={busy !== null || adminNote === (order.adminNote ?? '')}
                    onClick={() => patch('note', { action: 'note', adminNote }, 'Not kaydedildi.')}
                  >
                    {busy === 'note' ? <Loader2 className="w-4 h-4 animate-spin mr-2" /> : null}
                    Notu Kaydet
                  </Button>
                </CardContent>
              </Card>
            </>
          ) : (
            <Card className="border-amber-200 bg-amber-50/60 shadow-sm">
              <CardHeader><CardTitle className="text-base">Eski sipariş kaydı (salt okunur)</CardTitle></CardHeader>
              <CardContent className="text-sm text-amber-900 space-y-2">
                <p>Bu kayıt eski Firestore sipariş yolundan gelir ve müşteri tarafından değiştirilebilir olduğu için güvenilir değildir.</p>
                <p>Üzerinde durum değişikliği, ödeme onayı veya e-posta gönderimi yapılamaz. Gerekirse siparişi müşteriyle doğrulayıp yeni sipariş olarak oluşturun.</p>
              </CardContent>
            </Card>
          )}
        </div>
      </div>
    </div>
  )
}

/** Kargo ücretinin hangi kaynaktan (Geliver / Navlungo) ve firmadan verildiği; sipariş anındaki tüm teklifler */
function ShippingQuoteBox({ quote }: { quote: ShippingQuoteView }) {
  const offers = quote.candidates
  return (
    <div className="rounded-lg border border-[#e6ebf1] bg-[#f8fafc] px-3 py-2.5">
      <p className="text-[13px] text-slate-700">
        Kargo ücreti teklifi: <b className="text-[#0b2540]">{quote.providerLabel}</b>
        {quote.carrierName && <> · {quote.carrierName}</>}
        {quote.legacy && <span className="text-slate-500"> (kaynak kaydı eklenmeden önceki sipariş; ücret Geliver listesiyle hesaplanmıştı)</span>}
      </p>
      {(quote.desi != null || quote.battery) && (
        <p className="mt-0.5 text-xs text-slate-500">
          {quote.desi != null && <>{quote.desi} desi{quote.kg != null && <> · {quote.kg} kg</>}</>}
          {quote.battery && <> · Akü içeriyor: yalnızca Navlungo fiyatı verildi</>}
        </p>
      )}
      {offers.length > 0 && (
        <details className="mt-2">
          <summary className="cursor-pointer text-xs font-medium text-[#0b2540]">Sipariş anındaki tüm teklifler</summary>
          <table className="mt-2 w-full text-xs">
            <tbody>
              {offers.map((c, i) => {
                const chosen = c.provider === quote.provider && c.carrierId === quote.carrierId && c.fee != null
                return (
                  <tr key={i} className={chosen ? 'font-semibold text-[#0b2540]' : 'text-slate-600'}>
                    <td className="py-0.5 pr-2">{c.provider === 'navlungo' ? 'Navlungo' : 'Geliver'}</td>
                    <td className="py-0.5 pr-2">{c.carrierName}</td>
                    <td className="py-0.5 text-right tabular-nums">{c.fee != null ? fmtTRY(c.fee) : <span className="font-normal text-slate-400">{c.reason ?? 'teklif yok'}</span>}</td>
                  </tr>
                )
              })}
            </tbody>
          </table>
        </details>
      )}
    </div>
  )
}
