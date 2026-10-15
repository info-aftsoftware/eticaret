'use client'

import React, { useState, useEffect } from 'react'
import Link from 'next/link'
import { useParams, useRouter } from 'next/navigation'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { Input } from '@/components/ui/input'
import { Package, Truck, Banknote, CheckCircle, XCircle, Clock, ExternalLink, Loader2, FileText } from 'lucide-react'
import { useAuthStore, getAuthToken } from '@/lib/store/useAuthStore'
import { doc, getDoc, collection, query, where, getDocs } from 'firebase/firestore'
import { getDb } from '@/lib/firebase/config'
import { fmtPrice } from '@/lib/format'
import { useCurrencyStore } from '@/lib/store/useCurrencyStore'
import { useExchangeRates } from '@/lib/useExchangeRates'
import { ClassicPageShell } from '@/components/ClassicPageShell'
import { toOrderView, ORDER_STATUS_LABELS } from '@/lib/order-view'
import { ReturnSection } from './ReturnSection'
import { PaymentNoticeForm } from './PaymentNoticeForm'
import { BankAccountsList } from '@/components/BankAccountsList'
import { BANK_TRANSFER_DISCOUNT_RATE, BANK_TRANSFER_PAYMENT_DAYS, VAT_RATE } from '@/lib/store-config'

/** Durum adımları (iptal/iade hariç) */
const STEPS: { key: string; label: string }[] = [
  { key: 'received', label: 'Sipariş alındı' },
  { key: 'paid', label: 'Ödeme onaylandı' },
  { key: 'preparing', label: 'Hazırlanıyor' },
  { key: 'shipped', label: 'Kargoda' },
  { key: 'delivered', label: 'Teslim edildi' },
]

function stepIndex(order: any): number {
  if (order.status === 'delivered' || order.status === 'returned') return 4
  if (order.status === 'shipped') return 3
  if (order.status === 'confirmed' || order.status === 'processing') return 2
  if (order.paymentStatus === 'PAID' || order.status === 'paid') return 1
  return 0
}

const fmtDateTime = (d: Date) =>
  d.toLocaleString('tr-TR', { day: '2-digit', month: 'long', year: 'numeric', hour: '2-digit', minute: '2-digit' })

export default function OrderDetailPage() {
  const params = useParams()
  const router = useRouter()
  const id = params.id as string
  const { user, isAuthenticated, authReady } = useAuthStore()
  const currency = useCurrencyStore((s) => s.currency)
  const { rates } = useExchangeRates()
  const formatPrice = (amount: number) => fmtPrice(amount, currency, rates?.rates ?? null)
  const [order, setOrder] = useState<any>(null)
  const [isPrismaOrder, setIsPrismaOrder] = useState(false)
  const [loading, setLoading] = useState(true)
  const [lookupEmail, setLookupEmail] = useState('')
  const [lookupPhone, setLookupPhone] = useState('')
  const [lookupError, setLookupError] = useState('')
  const [lookupLoading, setLookupLoading] = useState(false)
  const [guestCreds, setGuestCreds] = useState<{ email: string; phone: string } | null>(null)
  const [cancelling, setCancelling] = useState(false)
  const [actionError, setActionError] = useState('')

  /** Misafir sipariş takibi: sipariş no + e-posta + telefon birlikte doğrulanır. */
  const lookupGuestOrder = async (e: React.FormEvent) => {
    e.preventDefault()
    setLookupError('')
    setLookupLoading(true)
    try {
      const params = new URLSearchParams({ email: lookupEmail.trim(), phone: lookupPhone.trim() })
      const res = await fetch(`/api/orders/by-no/${encodeURIComponent(id)}?${params.toString()}`)
      const data = await res.json().catch(() => null)
      if (res.ok && data?.order?.orderNo) {
        setOrder(toOrderView(data.order))
        setIsPrismaOrder(true)
        setGuestCreds({ email: lookupEmail.trim(), phone: lookupPhone.trim() })
      } else {
        setLookupError(data?.error || 'Bu bilgilerle eşleşen sipariş bulunamadı.')
      }
    } catch {
      setLookupError('Sipariş sorgulanamadı. Lütfen tekrar deneyin.')
    } finally {
      setLookupLoading(false)
    }
  }

  const [downloading, setDownloading] = useState<string | null>(null)

  /** Sözleşme / fatura PDF'ini indirir (üye: token, misafir: e-posta + telefon) */
  const downloadDocument = async (type: 'contract' | 'invoice') => {
    setDownloading(type)
    setActionError('')
    try {
      const qs = new URLSearchParams({ type, ...(guestCreds ?? {}) })
      const authToken = isAuthenticated ? await getAuthToken() : null
      const res = await fetch(`/api/orders/by-no/${encodeURIComponent(order.orderId)}/documents?${qs.toString()}`, {
        headers: authToken ? { Authorization: `Bearer ${authToken}` } : {},
      })
      if (!res.ok) {
        const data = await res.json().catch(() => null)
        throw new Error(data?.error || 'Belge indirilemedi.')
      }
      const url = URL.createObjectURL(await res.blob())
      const a = document.createElement('a')
      a.href = url
      a.download = `${type === 'contract' ? 'sozlesme' : 'fatura'}-${order.orderId}.pdf`
      a.click()
      URL.revokeObjectURL(url)
    } catch (e) {
      setActionError(e instanceof Error ? e.message : 'Belge indirilemedi.')
    } finally {
      setDownloading(null)
    }
  }

  /** Sipariş alt uç noktası çağrısı (üye: token, misafir: e-posta + telefon). Hata mesajı veya null döner. */
  const orderAction = async (path: 'returns' | 'payment-notice', method: 'POST' | 'PATCH', body: Record<string, unknown>): Promise<string | null> => {
    try {
      const authToken = isAuthenticated ? await getAuthToken() : null
      const res = await fetch(`/api/orders/by-no/${encodeURIComponent(order.orderId)}/${path}`, {
        method,
        headers: { 'Content-Type': 'application/json', ...(authToken ? { Authorization: `Bearer ${authToken}` } : {}) },
        body: JSON.stringify({ ...body, ...(guestCreds ?? {}) }),
      })
      const data = await res.json().catch(() => null)
      if (!res.ok || !data?.order) return data?.error || 'İşlem yapılamadı.'
      setOrder(toOrderView(data.order))
      return null
    } catch {
      return 'İşlem yapılamadı. Lütfen tekrar deneyin.'
    }
  }

  const cancelOrder = async () => {
    if (!window.confirm('Siparişinizi iptal etmek istediğinize emin misiniz?')) return
    setCancelling(true)
    setActionError('')
    try {
      const authToken = isAuthenticated ? await getAuthToken() : null
      const res = await fetch(`/api/orders/by-no/${encodeURIComponent(order.orderId)}/cancel`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          ...(authToken ? { Authorization: `Bearer ${authToken}` } : {}),
        },
        body: JSON.stringify(guestCreds ?? {}),
      })
      const data = await res.json().catch(() => null)
      if (!res.ok || !data?.order) throw new Error(data?.error || 'Sipariş iptal edilemedi.')
      setOrder(toOrderView(data.order))
    } catch (e) {
      setActionError(e instanceof Error ? e.message : 'Sipariş iptal edilemedi.')
    } finally {
      setCancelling(false)
    }
  }

  useEffect(() => {
    const isOrderNo = /^ORD-/.test(id)
    // Firebase oturumu doğrulanana kadar bekle (aksi halde üye siparişi misafir gibi görünür)
    if (!authReady) return

    if (isOrderNo) {
      (async () => {
        try {
          // Güncel siparişler: Prisma (sipariş sahibi token ile)
          const authToken = isAuthenticated ? await getAuthToken() : null
          if (authToken) {
            const res = await fetch(`/api/orders/by-no/${encodeURIComponent(id)}`, {
              headers: { Authorization: `Bearer ${authToken}` },
            })
            const data = res.ok ? await res.json().catch(() => null) : null
            if (data?.order?.orderNo) {
              setOrder(toOrderView(data.order))
              setIsPrismaOrder(true)
              return
            }
          }
          // Eski siparişler: Firestore (yalnızca giriş yapmış kullanıcının kendi kayıtları)
          if (user?.id) {
            const db = getDb()
            const userOrders = await getDocs(collection(db, 'users', user.id, 'orders'))
            const match = userOrders.docs.find((d) => d.data().orderId === id)
            if (match) {
              const data = match.data()
              const createdAt = data.createdAt as { seconds: number } | null
              setOrder({
                id: match.id,
                orderId: data.orderId,
                createdAt: createdAt?.seconds ? new Date(createdAt.seconds * 1000) : new Date(),
                status: data.status || 'pending',
                trackingNumber: data.trackingNumber,
                customer: data.customer,
                items: data.items || [],
                pricing: data.pricing || { total: 0 },
                events: [],
              })
              return
            }
          }
          // Sipariş takip sayfasından gelindiyse (aynı sekme) kayıtlı e-posta + telefonla aç
          try {
            const saved = JSON.parse(sessionStorage.getItem('order-lookup') || 'null')
            if (saved?.orderNo === id && saved.email && saved.phone) {
              const qs = new URLSearchParams({ email: saved.email, phone: saved.phone })
              const res = await fetch(`/api/orders/by-no/${encodeURIComponent(id)}?${qs.toString()}`)
              const data = res.ok ? await res.json().catch(() => null) : null
              if (data?.order?.orderNo) {
                setOrder(toOrderView(data.order))
                setIsPrismaOrder(true)
                setGuestCreds({ email: saved.email, phone: saved.phone })
                return
              }
            }
          } catch {}
          // Misafir siparişi: önce guestOrders (eski), bulunamazsa e-posta + telefon formu gösterilir
          try {
            const guestSnap = await getDocs(query(collection(getDb(), 'guestOrders'), where('orderId', '==', id)))
            if (!guestSnap.empty) {
              const data = guestSnap.docs[0].data()
              const createdAt = data.createdAt as { seconds: number } | null
              setOrder({
                id: guestSnap.docs[0].id,
                orderId: data.orderId,
                createdAt: createdAt?.seconds ? new Date(createdAt.seconds * 1000) : new Date(),
                status: data.status || 'pending',
                trackingNumber: data.trackingNumber,
                customer: data.customer,
                items: data.items || [],
                pricing: data.pricing || { total: 0 },
                events: [],
              })
              return
            }
          } catch {
            // guestOrders yalnızca admin tarafından okunabilir — beklenen durum
          }
          setOrder(null)
        } catch {
          setOrder(null)
        } finally {
          setLoading(false)
        }
      })()
      return
    }

    // Eski Firestore siparişi (doküman id ile, giriş gerekli)
    if (!isAuthenticated || !user?.id) {
      router.push('/login?redirect=/orders/' + id)
      return
    }
    getDoc(doc(getDb(), 'users', user.id, 'orders', id))
      .then((snap) => {
        if (snap.exists()) {
          const data = snap.data()
          const createdAt = data.createdAt as { seconds: number } | null
          setOrder({
            id: snap.id,
            orderId: data.orderId || snap.id,
            ...data,
            events: [],
            createdAt: createdAt?.seconds ? new Date(createdAt.seconds * 1000) : new Date(),
          })
        } else {
          setOrder(null)
        }
      })
      .catch(() => setOrder(null))
      .finally(() => setLoading(false))
  }, [id, user?.id, isAuthenticated, router, authReady])

  if (loading) {
    return (
      <ClassicPageShell breadcrumbs={[{ label: 'Sipariş Detayı' }]} noTitle>
        <div className="flex items-center justify-center py-20">
          <div className="animate-spin rounded-full h-10 w-10 border-2 border-brand border-t-transparent" />
        </div>
      </ClassicPageShell>
    )
  }

  const isGuestOrderId = /^ORD-/.test(id)

  if (!order) {
    return (
      <ClassicPageShell breadcrumbs={[{ label: 'Sipariş Takibi' }]} noTitle>
        <div className="flex justify-center py-8">
          <Card className="max-w-md w-full p-8 text-center classic-card rounded-lg">
            {isGuestOrderId ? (
              <>
                <div className="inline-flex h-14 w-14 rounded-lg bg-red-100 items-center justify-center mb-4">
                  <Package className="w-7 h-7 text-brand" />
                </div>
                <h2 className="text-lg font-bold text-gray-900 mb-1">Sipariş Takibi</h2>
                <p className="font-mono font-semibold text-brand mb-4">{id}</p>
                <p className="text-sm text-gray-500 mb-4">
                  Sipariş detayını görmek için siparişte kullandığınız e-posta ve telefon numarasını girin.
                  {!isAuthenticated && (
                    <> Üye iseniz <Link href={`/login?redirect=/orders/${id}`} className="text-brand hover:underline">giriş yapın</Link>.</>
                  )}
                </p>
                <form onSubmit={lookupGuestOrder} className="space-y-3 text-left mb-6">
                  <Input type="email" required placeholder="E-posta adresi" value={lookupEmail} onChange={(e) => setLookupEmail(e.target.value)} aria-label="E-posta adresi" />
                  <Input type="tel" required placeholder="Telefon (5xx xxx xx xx)" value={lookupPhone} onChange={(e) => setLookupPhone(e.target.value)} aria-label="Telefon numarası" />
                  {lookupError && <p className="text-xs text-destructive">{lookupError}</p>}
                  <Button type="submit" variant="outline" className="w-full" disabled={lookupLoading}>
                    {lookupLoading ? 'Sorgulanıyor...' : 'Siparişi Görüntüle'}
                  </Button>
                </form>
              </>
            ) : (
              <p className="text-gray-600 mb-4">Sipariş bulunamadı.</p>
            )}
            <Button asChild className="btn-classic-primary">
              <Link href={isAuthenticated ? '/profile?tab=orders' : '/'}>{isAuthenticated ? 'Siparişlerime Dön' : 'Ana Sayfaya Dön'}</Link>
            </Button>
          </Card>
        </div>
      </ClassicPageShell>
    )
  }

  const isClosed = order.status === 'cancelled' || order.status === 'returned'
  const current = stepIndex(order)
  const p = order.pricing || {}
  const dueDate = new Date(new Date(order.createdAt).getTime() + BANK_TRANSFER_PAYMENT_DAYS * 86_400_000)

  return (
    <ClassicPageShell
      breadcrumbs={[
        ...(isAuthenticated ? [{ label: 'Hesabım', href: '/profile' }, { label: 'Siparişlerim', href: '/profile?tab=orders' }] : []),
        { label: `Sipariş #${order.orderId}` },
      ]}
      title={`Sipariş #${order.orderId}`}
      description={fmtDateTime(new Date(order.createdAt))}
    >
      <div className="max-w-3xl space-y-6">
        {/* Durum */}
        <Card className="classic-card rounded-lg">
          <CardContent className="pt-6">
            <div className="flex flex-wrap items-center justify-between gap-3 mb-5">
              <div className="flex items-center gap-2">
                <span className="text-sm text-gray-600">Durum:</span>
                <Badge className={
                  order.status === 'delivered' ? 'bg-green-100 text-green-800'
                    : order.status === 'shipped' ? 'bg-blue-100 text-blue-800'
                      : isClosed ? 'bg-red-100 text-red-800'
                        : 'bg-yellow-100 text-yellow-800'
                }>
                  {order.awaitingTransfer ? 'Ödeme bekleniyor' : ORDER_STATUS_LABELS[order.status] || order.status}
                </Badge>
              </div>
              {order.canCancel && (
                <Button variant="outline" size="sm" className="border-red-300 text-red-700 hover:bg-red-50" onClick={cancelOrder} disabled={cancelling}>
                  {cancelling ? <Loader2 className="w-4 h-4 animate-spin mr-1" /> : <XCircle className="w-4 h-4 mr-1" />}
                  Siparişi İptal Et
                </Button>
              )}
            </div>
            {actionError && <p role="alert" className="text-sm text-destructive mb-3">{actionError}</p>}

            {isClosed ? (
              <p className="flex items-center gap-2 text-sm text-red-700">
                <XCircle className="w-5 h-5" />
                {order.status === 'cancelled' ? 'Bu sipariş iptal edildi.' : 'Bu sipariş iade alındı.'}
              </p>
            ) : isPrismaOrder ? (
              <ol className="grid grid-cols-5 gap-1" aria-label="Sipariş durumu adımları">
                {STEPS.map((step, i) => {
                  const done = i <= current
                  return (
                    <li key={step.key} className="flex flex-col items-center text-center gap-1" aria-current={i === current ? 'step' : undefined}>
                      <span className={`flex h-8 w-8 items-center justify-center rounded-full border-2 ${done ? 'bg-brand border-brand text-white' : 'border-gray-300 text-gray-400'}`}>
                        {done ? <CheckCircle className="w-4 h-4" /> : <Clock className="w-4 h-4" />}
                      </span>
                      <span className={`text-[11px] sm:text-xs leading-tight ${done ? 'text-gray-900 font-medium' : 'text-gray-500'}`}>{step.label}</span>
                    </li>
                  )
                })}
              </ol>
            ) : null}
          </CardContent>
        </Card>

        {/* Havale ödeme talimatı */}
        {order.awaitingTransfer && (
          <Card className="rounded-lg border-amber-200 bg-amber-50">
            <CardHeader className="pb-2">
              <CardTitle className="text-base flex items-center gap-2 text-amber-900"><Banknote className="w-5 h-5" />Ödemenizi bekliyoruz</CardTitle>
            </CardHeader>
            <CardContent className="text-sm text-amber-900 space-y-3">
              <p>
                Siparişinizin onaylanması için <strong>{dueDate.toLocaleDateString('tr-TR', { day: '2-digit', month: 'long' })}</strong> tarihine
                kadar aşağıdaki hesaplardan birine havale/EFT yapın. Açıklama alanına yalnızca sipariş numaranızı yazın.
              </p>
              <BankAccountsList />
              <dl className="bg-white rounded-lg border border-amber-200 p-3 space-y-1.5">
                <div className="flex justify-between gap-2"><dt className="font-medium">Tutar</dt><dd className="font-bold">{formatPrice(p.total || 0)}</dd></div>
                <div className="flex justify-between gap-2"><dt className="font-medium">Açıklama</dt><dd className="font-bold">{order.orderId}</dd></div>
              </dl>
              <PaymentNoticeForm
                total={p.total || 0}
                alreadyNotified={(order.events ?? []).some((e: { type: string }) => e.type === 'payment_notice')}
                onSubmit={(body) => orderAction('payment-notice', 'POST', body)}
              />
            </CardContent>
          </Card>
        )}

        {/* Kargo */}
        {order.trackingNumber && (
          <Card className="classic-card rounded-lg">
            <CardContent className="pt-6 flex flex-wrap items-center gap-3 text-sm">
              <Truck className="w-5 h-5 text-gray-500" />
              <span>
                {order.carrierName ? `${order.carrierName} · ` : ''}Takip no: <strong className="font-mono">{order.trackingNumber}</strong>
              </span>
              {order.trackingUrl && (
                <Button asChild size="sm" variant="outline" className="ml-auto">
                  <a href={order.trackingUrl} target="_blank" rel="noopener noreferrer">
                    Kargomu Takip Et <ExternalLink className="w-3.5 h-3.5 ml-1" />
                  </a>
                </Button>
              )}
            </CardContent>
          </Card>
        )}

        {/* Ürünler ve tutar */}
        <Card className="classic-card rounded-lg">
          <CardHeader className="border-b"><CardTitle className="text-base">Ürünler</CardTitle></CardHeader>
          <CardContent className="pt-4 space-y-4">
            <ul className="space-y-2">
              {(order.items || []).map((item: any, i: number) => (
                <li key={item.id ?? i} className="flex justify-between gap-4 text-sm py-2 border-b border-gray-100 last:border-0">
                  <span className="text-gray-800">
                    {item.productId ? <Link href={`/products/${item.productId}`} className="hover:underline">{item.name}</Link> : item.name}
                    {' '}× {item.quantity}
                  </span>
                  <span className="font-medium whitespace-nowrap">{formatPrice((item.price || 0) * (item.quantity || 1))}</span>
                </li>
              ))}
            </ul>
            {isPrismaOrder ? (
              <dl className="text-sm space-y-1 border-t pt-3">
                <div className="flex justify-between"><dt className="text-gray-600">Ara toplam (KDV hariç)</dt><dd>{formatPrice(p.subtotal)}</dd></div>
                {p.couponDiscount > 0 && (
                  <div className="flex justify-between text-green-700"><dt>Kupon {p.couponCode ? `(${p.couponCode})` : ''}</dt><dd>-{formatPrice(p.couponDiscount)}</dd></div>
                )}
                {p.paymentDiscount > 0 && (
                  <div className="flex justify-between text-green-700"><dt>Havale/EFT indirimi (%{BANK_TRANSFER_DISCOUNT_RATE})</dt><dd>-{formatPrice(p.paymentDiscount)}</dd></div>
                )}
                <div className="flex justify-between"><dt className="text-gray-600">KDV (%{VAT_RATE})</dt><dd>{formatPrice(p.tax)}</dd></div>
                <div className="flex justify-between"><dt className="text-gray-600">Kargo</dt><dd>{p.shipping > 0 ? formatPrice(p.shipping) : 'Ücretsiz'}</dd></div>
                <div className="flex justify-between font-bold text-lg pt-1"><dt>Toplam</dt><dd className="text-brand">{formatPrice(p.total)}</dd></div>
                <p className="text-xs text-gray-500 pt-1">
                  Ödeme yöntemi: {order.paymentMethod === 'bank_transfer' ? 'Havale / EFT' : order.paymentMethod === 'card' ? 'Kredi / Banka Kartı' : '—'}
                </p>
                <div className="flex flex-wrap gap-2 pt-3">
                  <Button variant="outline" size="sm" onClick={() => downloadDocument('contract')} disabled={downloading !== null}>
                    {downloading === 'contract' ? <Loader2 className="w-4 h-4 animate-spin mr-1" /> : <FileText className="w-4 h-4 mr-1" />}
                    Sözleşmeyi İndir
                  </Button>
                  {order.paymentStatus === 'PAID' && (
                    <Button variant="outline" size="sm" onClick={() => downloadDocument('invoice')} disabled={downloading !== null}>
                      {downloading === 'invoice' ? <Loader2 className="w-4 h-4 animate-spin mr-1" /> : <FileText className="w-4 h-4 mr-1" />}
                      Sipariş Özetini İndir (Proforma)
                    </Button>
                  )}
                </div>
              </dl>
            ) : (
              <div className="pt-4 border-t flex justify-between items-center">
                <span className="font-semibold text-gray-900">Toplam</span>
                <span className="text-xl font-bold text-brand">{formatPrice(p.total || 0)}</span>
              </div>
            )}
          </CardContent>
        </Card>

        {isPrismaOrder && (
          <ReturnSection
            order={order}
            onSubmit={(body) => orderAction('returns', 'POST', body)}
            onCancel={(returnId) => orderAction('returns', 'PATCH', { returnId, op: 'cancel' })}
          />
        )}

        {order.customer && (
          <Card className="classic-card rounded-lg">
            <CardContent className="pt-6 text-sm">
              <h2 className="font-semibold text-gray-900 mb-2">Teslimat adresi</h2>
              <p className="text-gray-600">
                {order.customer.name}<br />
                {order.customer.addressLine}, {order.customer.district} / {order.customer.city} {order.customer.postalCode}<br />
                {order.customer.phone}
              </p>
              {order.customerNote && <p className="text-gray-600 mt-3"><span className="font-medium text-gray-900">Notunuz:</span> {order.customerNote}</p>}
            </CardContent>
          </Card>
        )}

        {(order.events ?? []).length > 0 && (
          <Card className="classic-card rounded-lg">
            <CardHeader className="border-b"><CardTitle className="text-base">Sipariş Geçmişi</CardTitle></CardHeader>
            <CardContent className="pt-4">
              <ol className="relative border-l border-gray-200 ml-2 space-y-4">
                {[...order.events].reverse().map((e: any) => (
                  <li key={e.id} className="ml-4">
                    <span className="absolute -left-1.5 mt-1.5 h-3 w-3 rounded-full bg-brand" />
                    <p className="text-sm text-gray-800">{e.message}</p>
                    <p className="text-xs text-gray-500">{fmtDateTime(new Date(e.createdAt))}</p>
                  </li>
                ))}
              </ol>
            </CardContent>
          </Card>
        )}

        <p className="text-xs text-gray-500">
          Sorularınız için <Link href="/contact" className="text-brand hover:underline">iletişim</Link> sayfamızdan bize ulaşabilirsiniz.
          İade ve cayma koşulları için <Link href="/returns" className="text-brand hover:underline">İade Politikası</Link>.
        </p>
      </div>
    </ClassicPageShell>
  )
}
