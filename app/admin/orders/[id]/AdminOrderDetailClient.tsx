'use client'

import React, { useState, useEffect, useCallback } from 'react'
import Link from 'next/link'
import { useParams, useSearchParams } from 'next/navigation'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Textarea } from '@/components/ui/textarea'
import { ArrowLeft, Loader2, Package, FileText, Truck, CreditCard, Banknote, Clock, StickyNote, ExternalLink } from 'lucide-react'
import { fmtTRY } from '@/lib/format'
import { ReturnRequestsCard, type AdminReturnRequest } from './ReturnRequestsCard'

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
  trackingNumber?: string
  trackingUrl?: string | null
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

const LEGACY_STATUS_OPTIONS = [
  { value: 'PENDING', label: 'Beklemede' },
  { value: 'PICKING', label: 'Hazırlanıyor' },
  { value: 'SHIPPED', label: 'Kargoya Verildi' },
  { value: 'DELIVERED', label: 'Teslim Edildi' },
  { value: 'CANCELLED', label: 'İptal' },
  { value: 'RETURNED', label: 'İade' },
]

const fmtDate = (s?: string | null) =>
  s ? new Date(s).toLocaleString('tr-TR', { day: '2-digit', month: 'short', year: 'numeric', hour: '2-digit', minute: '2-digit' }) : '—'

export default function AdminOrderDetailPage() {
  const params = useParams()
  const searchParams = useSearchParams()
  const id = params.id as string
  const source = searchParams.get('source') || 'prisma'
  const userId = searchParams.get('userId') || ''

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
  const [legacyStatus, setLegacyStatus] = useState('')

  const apiUrl = source === 'firestore' && userId
    ? `/api/admin/orders/${id}?source=firestore&userId=${userId}`
    : `/api/admin/orders/${id}?source=${source}`

  const applyOrder = useCallback((data: OrderDetail) => {
    setOrder(data)
    setCarrier(data.shippingCarrier || data.carriers?.[0]?.id || '')
    setTrackingNumber(data.trackingNumber || '')
    setAdminNote(data.adminNote || '')
    setLegacyStatus(data.status)
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

  const patch = async (key: string, body: Record<string, unknown>, successText: string, confirmText?: string) => {
    if (confirmText && !window.confirm(confirmText)) return
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
    } catch (err) {
      setMessage({ type: 'error', text: err instanceof Error ? err.message : 'Güncelleme sırasında bir hata oluştu.' })
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

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center gap-4">
        <Button asChild variant="ghost" size="sm" className="w-fit">
          <Link href="/admin/orders"><ArrowLeft className="w-4 h-4 mr-2" />Siparişlere Dön</Link>
        </Button>
        <div className="flex-1 min-w-0">
          <h1 className="text-xl font-bold text-slate-900">Sipariş {order.orderId}</h1>
          <p className="text-sm text-slate-600">{fmtDate(order.createdAt)}{order.customerNo ? ` · Müşteri ${order.customerNo}` : order.userId ? ' · Üye' : ' · Misafir'}</p>
        </div>
        <div className="flex gap-2 flex-wrap">
          <Badge variant="secondary">{order.statusLabel ?? STATUS_LABELS[order.status] ?? order.status}</Badge>
          <Badge className={isPaid ? 'bg-green-100 text-green-800 border-0' : 'bg-amber-100 text-amber-800 border-0'}>
            {PAYMENT_STATUS_LABELS[order.paymentStatus] ?? order.paymentStatus}
          </Badge>
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

      <div className="grid gap-6 lg:grid-cols-3">
        {/* Sol: sipariş içeriği */}
        <div className="lg:col-span-2 space-y-6">
          <Card className="border-slate-200/80 bg-white shadow-sm">
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
                <div className="flex justify-between"><dt className="text-slate-600">Kargo</dt><dd className="tabular-nums">{p.shipping ? fmtTRY(p.shipping) : 'Ücretsiz'}</dd></div>
                <div className="flex justify-between font-bold text-base pt-1"><dt>Toplam</dt><dd className="tabular-nums">{fmtTRY(p.total ?? 0)}</dd></div>
              </dl>
            </CardContent>
          </Card>

          <div className="grid gap-6 sm:grid-cols-2">
            <Card className="border-slate-200/80 bg-white shadow-sm">
              <CardHeader><CardTitle className="text-base">Müşteri ve Teslimat</CardTitle></CardHeader>
              <CardContent className="text-sm text-slate-700 space-y-1">
                <p className="font-medium text-slate-900">{c.name}</p>
                {c.email && <p><a href={`mailto:${c.email}`} className="text-brand hover:underline">{c.email}</a></p>}
                {c.phone && <p><a href={`tel:${c.phone}`} className="hover:underline">{c.phone}</a></p>}
                <p className="pt-1">{c.addressLine}</p>
                <p>{[c.district, c.city, c.postalCode].filter(Boolean).join(' / ')}</p>
              </CardContent>
            </Card>
            <Card className="border-slate-200/80 bg-white shadow-sm">
              <CardHeader><CardTitle className="text-base">Fatura</CardTitle></CardHeader>
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
            <Card className="border-slate-200/80 bg-white shadow-sm">
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
            <Card className="border-slate-200/80 bg-white shadow-sm">
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
          {isPrisma && (
            <ReturnRequestsCard
              requests={order.returnRequests ?? []}
              carriers={order.carriers ?? []}
              busy={busy}
              onAction={patch}
            />
          )}
          <Card className="border-slate-200/80 bg-white shadow-sm">
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
              {!isPaid && order.status !== 'CANCELLED' && (
                <Button
                  className="w-full bg-green-600 hover:bg-green-700"
                  disabled={busy !== null}
                  onClick={() => patch(
                    'paid',
                    isPrisma ? { action: 'mark_paid' } : { paymentStatus: 'PAID' },
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
              <Button variant="outline" className="w-full" onClick={handleSendInvoice} disabled={busy !== null}>
                {busy === 'invoice' ? <Loader2 className="w-4 h-4 animate-spin mr-2" /> : <FileText className="w-4 h-4 mr-2" />}
                Faturayı E-postayla Gönder
              </Button>
            </CardContent>
          </Card>

          {isPrisma ? (
            <>
              <Card id="kargo" className="border-slate-200/80 bg-white shadow-sm">
                <CardHeader><CardTitle className="text-base flex items-center gap-2"><Truck className="w-4 h-4" />Kargo</CardTitle></CardHeader>
                <CardContent className="space-y-3 text-sm">
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
                  {(canShip || order.status === 'SHIPPED') && (
                    <>
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
                          className="w-full bg-purple-600 hover:bg-purple-700"
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

              <Card className="border-slate-200/80 bg-white shadow-sm">
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
                                danger ? `Sipariş “${s.label}” durumuna alınacak ve stok geri eklenecek. Emin misiniz?` : undefined
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

              <Card className="border-slate-200/80 bg-white shadow-sm">
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
            <Card className="border-slate-200/80 bg-white shadow-sm">
              <CardHeader><CardTitle className="text-base">Durum (eski sipariş)</CardTitle></CardHeader>
              <CardContent className="space-y-3">
                <select
                  value={legacyStatus}
                  onChange={(e) => setLegacyStatus(e.target.value)}
                  className="w-full h-10 rounded-md border border-slate-200 px-3 text-sm bg-white"
                  aria-label="Sipariş durumu"
                >
                  {LEGACY_STATUS_OPTIONS.map((o) => <option key={o.value} value={o.value}>{o.label}</option>)}
                </select>
                <Input value={trackingNumber} onChange={(e) => setTrackingNumber(e.target.value)} placeholder="Kargo takip no" aria-label="Kargo takip numarası" />
                <Button
                  className="w-full"
                  disabled={busy !== null}
                  onClick={() => patch('legacy', { status: legacyStatus, ...(trackingNumber ? { trackingNumber } : {}) }, 'Sipariş güncellendi.')}
                >
                  Güncelle
                </Button>
              </CardContent>
            </Card>
          )}
        </div>
      </div>
    </div>
  )
}
