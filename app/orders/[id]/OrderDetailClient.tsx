'use client'

import React, { useState, useEffect } from 'react'
import Link from 'next/link'
import { useParams, useRouter } from 'next/navigation'
import { AlertCircle, Banknote, Check, CheckCircle2, Clock, Copy, CreditCard, ExternalLink, FileText, Loader2, MapPin, Package, PackageCheck, ReceiptText, RotateCcw, Truck, XCircle } from 'lucide-react'
import { useAuthStore, getAuthToken } from '@/lib/store/useAuthStore'
import { doc, getDoc, collection, query, where, getDocs } from 'firebase/firestore'
import { getDb } from '@/lib/firebase/config'
import { fmtPrice } from '@/lib/format'
import { useCurrencyStore } from '@/lib/store/useCurrencyStore'
import { useExchangeRates } from '@/lib/useExchangeRates'
import { ClassicPageShell } from '@/components/ClassicPageShell'
import { toOrderView, ORDER_STATUS_LABELS } from '@/lib/order-view'
import { getAllCarriers } from '@/lib/shipping/carriers'
import { SELLER } from '@/lib/legal/company'
import { ReturnSection } from './ReturnSection'
import { PaymentNoticeForm } from './PaymentNoticeForm'
import { BankTransferDetails } from '@/components/order/BankTransferDetails'
import { BANK_TRANSFER_DISCOUNT_RATE, STORE_TIME_ZONE, VAT_RATE, bankTransferDeadline } from '@/lib/store-config'
import { DeliveryEstimate } from '@/components/DeliveryEstimate'
import { useL } from '@/lib/i18n-inline'
import { useLocale } from 'next-intl'
import { lineItemName, toCatalogLocale } from '@/lib/catalog-en'
import { useServerError } from '@/lib/server-error-i18n'

type Creds = { email: string; phone: string }
type OrderEvent = { id: string; type: string; status: string | null; message: string; createdAt: Date }

const fmtDateTime = (d: Date, loc = 'tr-TR') =>
  d.toLocaleString(loc, { day: '2-digit', month: 'long', year: 'numeric', hour: '2-digit', minute: '2-digit' })
const fmtDay = (d: Date, loc = 'tr-TR') => d.toLocaleDateString(loc, { day: '2-digit', month: 'short' })

const ORDER_STATUS_LABELS_EN: Record<string, string> = {
  pending: 'Pending',
  paid: 'Paid',
  confirmed: 'Preparing',
  processing: 'Preparing',
  shipped: 'Shipped',
  delivered: 'Delivered',
  cancelled: 'Cancelled',
  returned: 'Returned',
}

/** Sipariş (Prisma) için POST ile misafir sorgusu: e-posta + telefon URL'ye yazılmaz */
async function fetchGuestOrder(orderNo: string, creds: Creds) {
  const res = await fetch(`/api/orders/by-no/${encodeURIComponent(orderNo)}`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(creds),
  })
  const data = await res.json().catch(() => null)
  return { ok: res.ok, status: res.status, data }
}

function stepIndex(order: any): number {
  if (order.status === 'delivered' || order.status === 'returned') return 4
  if (order.status === 'shipped') return 3
  if (order.status === 'confirmed' || order.status === 'processing') return 2
  if (order.paymentStatus === 'PAID' || order.status === 'paid') return 1
  return 0
}

function Card({ title, icon: Icon, children, aside, className = '' }: {
  title?: string
  icon?: React.ComponentType<{ className?: string }>
  children: React.ReactNode
  aside?: React.ReactNode
  className?: string
}) {
  return (
    <section className={`rounded-xl border border-[#e6ebf1] bg-white shadow-[0_1px_2px_rgba(16,24,40,0.04)] ${className}`}>
      {title && (
        <header className="flex flex-wrap items-center gap-2 border-b border-[#eef1f5] px-4 py-3.5 sm:px-5">
          {Icon && <Icon className="h-[18px] w-[18px] text-[#5d6e80]" aria-hidden />}
          <h2 className="text-[15px] font-semibold text-[#121926]">{title}</h2>
          {aside && <div className="ml-auto">{aside}</div>}
        </header>
      )}
      <div className="px-4 py-4 sm:px-5">{children}</div>
    </section>
  )
}

const btnOutline = 'inline-flex h-10 items-center justify-center gap-1.5 rounded-lg border border-[#d3d9e1] bg-white px-3.5 text-sm font-medium text-[#20384e] hover:bg-[#f5f7fa] disabled:opacity-60'
const btnPrimary = 'inline-flex h-10 items-center justify-center gap-1.5 rounded-lg bg-[#0b2540] px-4 text-sm font-semibold text-white hover:bg-[#12335a] disabled:opacity-60'

function StatusBadge({ order }: { order: any }) {
  const L = useL()
  const st = order.status as string
  const label = order.awaitingTransfer ? L('Ödeme bekleniyor', 'Awaiting payment') : L(ORDER_STATUS_LABELS[st] || st, ORDER_STATUS_LABELS_EN[st] || st)
  const cls =
    st === 'delivered' ? 'bg-emerald-50 text-emerald-700 ring-emerald-200'
      : st === 'shipped' ? 'bg-[#eaf1fb] text-[#0b2540] ring-[#c9d8ee]'
        : st === 'cancelled' || st === 'returned' ? 'bg-red-50 text-red-700 ring-red-200'
          : order.awaitingTransfer ? 'bg-[#fff8e1] text-[#8a6400] ring-[#f5d97a]'
            : 'bg-[#f1f4f8] text-[#20384e] ring-[#d3d9e1]'
  return <span className={`inline-flex items-center rounded-full px-3 py-1 text-sm font-semibold ring-1 ${cls}`}>{label}</span>
}

function ProgressTimeline({ order }: { order: any }) {
  const L = useL()
  const current = stepIndex(order)
  const events: OrderEvent[] = order.events ?? []
  const pickingAt = events.find((e) => e.status === 'PICKING')?.createdAt
  const steps = [
    { label: L('Sipariş alındı', 'Order received'), icon: ReceiptText, date: order.createdAt as Date },
    { label: L('Ödeme onaylandı', 'Payment confirmed'), icon: CreditCard, date: order.dates?.paidAt as Date | null },
    { label: L('Hazırlanıyor', 'Preparing'), icon: Package, date: pickingAt ?? null },
    { label: L('Kargoda', 'Shipped'), icon: Truck, date: order.dates?.shippedAt as Date | null },
    { label: L('Teslim edildi', 'Delivered'), icon: PackageCheck, date: order.dates?.deliveredAt as Date | null },
  ]
  return (
    <ol className="grid grid-cols-1 gap-0 sm:grid-cols-5 sm:gap-2" aria-label={L('Sipariş durumu', 'Order status')}>
      {steps.map((s, i) => {
        const done = i <= current
        const active = i === current
        return (
          <li key={s.label} className="relative flex gap-3 pb-4 last:pb-0 sm:flex-col sm:items-center sm:gap-2 sm:pb-0 sm:text-center" aria-current={active ? 'step' : undefined}>
            {/* bağlantı çizgisi */}
            {i < steps.length - 1 && (
              <span
                aria-hidden
                className={`absolute left-[17px] top-9 h-[calc(100%-36px)] w-0.5 sm:left-[calc(50%+22px)] sm:top-[17px] sm:h-0.5 sm:w-[calc(100%-36px)] ${i < current ? 'bg-[#0b2540]' : 'bg-[#e6ebf1]'}`}
              />
            )}
            <span
              className={`relative z-10 flex h-9 w-9 shrink-0 items-center justify-center rounded-full ${
                active ? 'bg-[#f5b400] text-[#111] ring-4 ring-[#fff3cc]' : done ? 'bg-[#0b2540] text-white' : 'bg-[#f1f4f8] text-[#9aa8b6]'
              }`}
            >
              {done && !active ? <Check className="h-4 w-4" aria-hidden /> : <s.icon className="h-4 w-4" aria-hidden />}
            </span>
            <span className="min-w-0 pt-1.5 sm:pt-0">
              <span className={`block text-sm leading-tight ${done ? 'font-semibold text-[#121926]' : 'text-[#5d6e80]'}`}>{s.label}</span>
              <span className="block text-xs text-[#5d6e80]">{done && s.date ? fmtDay(new Date(s.date), L('tr-TR', 'en-US')) : active ? L('Şu an', 'Now') : ''}</span>
            </span>
          </li>
        )
      })}
    </ol>
  )
}

function CopyInline({ value }: { value: string }) {
  const L = useL()
  const [done, setDone] = useState(false)
  return (
    <button
      type="button"
      onClick={async () => { try { await navigator.clipboard.writeText(value); setDone(true); setTimeout(() => setDone(false), 2000) } catch {} }}
      className="inline-flex h-8 items-center gap-1 rounded-md border border-[#d3d9e1] bg-white px-2 text-xs font-medium text-[#20384e] hover:bg-[#f5f7fa]"
      aria-label={L('Takip numarasını kopyala', 'Copy tracking number')}
    >
      {done ? <Check className="h-3.5 w-3.5 text-emerald-600" aria-hidden /> : <Copy className="h-3.5 w-3.5" aria-hidden />}
      {done ? L('Kopyalandı', 'Copied') : L('Kopyala', 'Copy')}
    </button>
  )
}

export default function OrderDetailPage() {
  const params = useParams()
  const router = useRouter()
  const id = decodeURIComponent(params.id as string)
  const { user, isAuthenticated, authReady } = useAuthStore()
  const currency = useCurrencyStore((s) => s.currency)
  const numberLocale = useLocale()
  const { rates } = useExchangeRates()
  const formatPrice = (amount: number) => fmtPrice(amount, currency, rates?.rates ?? null, numberLocale)
  const [order, setOrder] = useState<any>(null)
  const [isPrismaOrder, setIsPrismaOrder] = useState(false)
  const [loading, setLoading] = useState(true)
  const [lookupEmail, setLookupEmail] = useState('')
  const [lookupPhone, setLookupPhone] = useState('')
  const [lookupError, setLookupError] = useState('')
  const [lookupLoading, setLookupLoading] = useState(false)
  const [guestCreds, setGuestCreds] = useState<Creds | null>(null)
  const [cancelOpen, setCancelOpen] = useState(false)
  const [cancelReason, setCancelReason] = useState('')
  const [cancelling, setCancelling] = useState(false)
  const [actionError, setActionError] = useState('')
  const [actionNotice, setActionNotice] = useState('')
  const [downloading, setDownloading] = useState<string | null>(null)
  const L = useL()
  const catalogLocale = toCatalogLocale(useLocale())
  const tErr = useServerError()
  const loc = L('tr-TR', 'en-US')

  /** Misafir sipariş takibi: sipariş no + e-posta + telefon birlikte doğrulanır. */
  const lookupGuestOrder = async (e: React.FormEvent) => {
    e.preventDefault()
    setLookupError('')
    setLookupLoading(true)
    try {
      const creds = { email: lookupEmail.trim(), phone: lookupPhone.trim() }
      const { ok, status, data } = await fetchGuestOrder(id, creds)
      if (ok && data?.order?.orderNo) {
        setOrder(toOrderView(data.order))
        setIsPrismaOrder(true)
        setGuestCreds(creds)
        try { sessionStorage.setItem('order-lookup', JSON.stringify({ orderNo: id, ...creds })) } catch {}
      } else {
        setLookupError(status === 429 ? L('Çok fazla deneme yaptınız. Lütfen biraz sonra tekrar deneyin.', 'Too many attempts. Please try again in a moment.') : L('Bu bilgilerle eşleşen sipariş bulunamadı.', 'No order matches these details.'))
      }
    } catch {
      setLookupError(L('Sipariş sorgulanamadı. Lütfen tekrar deneyin.', 'The order could not be looked up. Please try again.'))
    } finally {
      setLookupLoading(false)
    }
  }

  /** Sözleşme / fatura PDF'ini indirir (üye: token, misafir: e-posta + telefon gövdede) */
  const downloadDocument = async (type: 'contract' | 'invoice') => {
    setDownloading(type)
    setActionError('')
    try {
      const authToken = isAuthenticated ? await getAuthToken() : null
      const res = await fetch(`/api/orders/by-no/${encodeURIComponent(order.orderId)}/documents`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', ...(authToken ? { Authorization: `Bearer ${authToken}` } : {}) },
        body: JSON.stringify({ type, ...(guestCreds ?? {}) }),
      })
      if (!res.ok) {
        const data = await res.json().catch(() => null)
        throw new Error(tErr(data?.error) || L('Belge indirilemedi.', 'The document could not be downloaded.'))
      }
      const url = URL.createObjectURL(await res.blob())
      const a = document.createElement('a')
      a.href = url
      a.download = `${type === 'contract' ? 'sozlesme' : 'fatura'}-${order.orderId}.pdf`
      a.click()
      URL.revokeObjectURL(url)
    } catch (e) {
      setActionError(e instanceof Error ? e.message : L('Belge indirilemedi.', 'The document could not be downloaded.'))
    } finally {
      setDownloading(null)
    }
  }

  /** Sipariş alt uç noktası çağrısı (üye: token, misafir: e-posta + telefon). Hata mesajı veya null döner. */
  const orderAction = async (path: 'returns' | 'payment-notice' | 'cancel', method: 'POST' | 'PATCH', body: Record<string, unknown>): Promise<{ error: string | null; data?: any }> => {
    try {
      const authToken = isAuthenticated ? await getAuthToken() : null
      const res = await fetch(`/api/orders/by-no/${encodeURIComponent(order.orderId)}/${path}`, {
        method,
        headers: { 'Content-Type': 'application/json', ...(authToken ? { Authorization: `Bearer ${authToken}` } : {}) },
        body: JSON.stringify({ ...body, ...(guestCreds ?? {}) }),
      })
      const data = await res.json().catch(() => null)
      if (!res.ok || !data?.order) return { error: tErr(data?.error) || L('İşlem yapılamadı.', 'The action could not be completed.') }
      setOrder(toOrderView(data.order))
      return { error: null, data }
    } catch {
      return { error: L('İşlem yapılamadı. Lütfen tekrar deneyin.', 'The action could not be completed. Please try again.') }
    }
  }
  const simpleAction = async (path: 'returns' | 'payment-notice', method: 'POST' | 'PATCH', body: Record<string, unknown>) =>
    (await orderAction(path, method, body)).error

  const submitCancel = async () => {
    setCancelling(true)
    setActionError('')
    setActionNotice('')
    const { error, data } = await orderAction('cancel', 'POST', { reason: cancelReason.trim() || undefined })
    setCancelling(false)
    if (error) return setActionError(error)
    setCancelOpen(false)
    setCancelReason('')
    setActionNotice(data?.requested
      ? L('İptal talebiniz alındı. Talebiniz incelendikten sonra e-posta ile bilgilendirileceksiniz.', 'Your cancellation request has been received. We will email you once it has been reviewed.')
      : L('Siparişiniz iptal edildi.', 'Your order has been cancelled.'))
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
          // Sipariş takip / ödeme sonrası sayfasından gelindiyse (aynı sekme) kayıtlı e-posta + telefonla aç
          try {
            const saved = JSON.parse(sessionStorage.getItem('order-lookup') || 'null')
            if (saved?.orderNo === id && saved.email && saved.phone) {
              const creds = { email: saved.email, phone: saved.phone }
              const { data } = await fetchGuestOrder(id, creds)
              if (data?.order?.orderNo) {
                setOrder(toOrderView(data.order))
                setIsPrismaOrder(true)
                setGuestCreds(creds)
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
      router.push('/login?redirect=/orders/' + encodeURIComponent(id))
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
      <ClassicPageShell breadcrumbs={[{ label: L('Sipariş Detayı', 'Order Details') }]} noTitle>
        <div className="flex items-center justify-center gap-3 py-20 text-[#20384e]">
          <Loader2 className="h-6 w-6 animate-spin" aria-hidden />
          <span>{L('Siparişiniz yükleniyor…', 'Loading your order…')}</span>
        </div>
      </ClassicPageShell>
    )
  }

  const isGuestOrderId = /^ORD-/.test(id)

  if (!order) {
    return (
      <ClassicPageShell breadcrumbs={[{ label: L('Sipariş Takibi', 'Order Tracking'), href: '/siparis-takip' }, { label: id }]} noTitle>
        <div className="flex justify-center py-4">
          <div className="w-full max-w-md rounded-xl border border-[#e6ebf1] bg-white p-6 shadow-[0_1px_2px_rgba(16,24,40,0.04)] sm:p-8">
            {isGuestOrderId ? (
              <>
                <h2 className="text-lg font-semibold text-[#121926]">{L('Siparişinizi görüntüleyin', 'View your order')}</h2>
                <p className="mt-1 font-mono text-sm font-semibold text-[#0b2540]">{id}</p>
                <p className="mb-5 mt-2 text-sm text-[#5d6e80]">
                  {L('Güvenliğiniz için siparişte kullandığınız e-posta adresi ve telefon numarasını girin.', 'For your security, enter the email address and phone number you used for the order.')}
                  {!isAuthenticated && (
                    <> {L('Üye iseniz', 'If you have an account,')} <Link href={`/login?redirect=/orders/${encodeURIComponent(id)}`} className="font-medium text-[#0b2540] underline-offset-2 hover:underline">{L('giriş yapın', 'sign in')}</Link>.</>
                  )}
                </p>
                <form onSubmit={lookupGuestOrder} className="space-y-3" noValidate>
                  <div>
                    <label htmlFor="lookup-email" className="mb-1.5 block text-sm font-medium text-[#20384e]">{L('E-posta', 'Email')}</label>
                    <input id="lookup-email" type="email" required autoComplete="email" value={lookupEmail} onChange={(e) => setLookupEmail(e.target.value)}
                      className="h-12 w-full rounded-lg border border-[#d3d9e1] px-3.5 text-base outline-none focus:border-[#0b2540] focus:ring-2 focus:ring-[#0b2540]/15" />
                  </div>
                  <div>
                    <label htmlFor="lookup-phone" className="mb-1.5 block text-sm font-medium text-[#20384e]">{L('Telefon', 'Phone')}</label>
                    <input id="lookup-phone" type="tel" required autoComplete="tel" placeholder="5xx xxx xx xx" value={lookupPhone} onChange={(e) => setLookupPhone(e.target.value)}
                      className="h-12 w-full rounded-lg border border-[#d3d9e1] px-3.5 text-base outline-none focus:border-[#0b2540] focus:ring-2 focus:ring-[#0b2540]/15" />
                  </div>
                  {lookupError && <p role="alert" className="flex items-start gap-1.5 text-sm text-red-600"><AlertCircle className="mt-0.5 h-4 w-4 shrink-0" aria-hidden />{lookupError}</p>}
                  <button type="submit" className={`${btnPrimary} h-12 w-full`} disabled={lookupLoading || !lookupEmail || !lookupPhone}>
                    {lookupLoading ? <><Loader2 className="h-4 w-4 animate-spin" aria-hidden />{L('Sorgulanıyor…', 'Searching…')}</> : L('Siparişi görüntüle', 'View order')}
                  </button>
                </form>
              </>
            ) : (
              <p className="text-[#20384e]">{L('Sipariş bulunamadı.', 'Order not found.')}</p>
            )}
            <Link href={isAuthenticated ? '/profile?tab=orders' : '/'} className="mt-5 inline-block text-sm font-medium text-[#0b2540] underline-offset-2 hover:underline">
              {isAuthenticated ? L('← Siparişlerime dön', '← Back to my orders') : L('← Ana sayfaya dön', '← Back to home')}
            </Link>
          </div>
        </div>
      </ClassicPageShell>
    )
  }

  const p = order.pricing || {}
  const events: OrderEvent[] = order.events ?? []
  const isCancelled = order.status === 'cancelled'
  const isReturned = order.status === 'returned'
  const dueDate = bankTransferDeadline(order.createdAt)
  const lastCancelReq = [...events].reverse().find((e) => e.type === 'cancel_request')
  const cancelReqStatus = lastCancelReq?.status ?? null
  // Ödenmiş ve henüz kargoya verilmemiş sipariş → iptal talebi (reddedilmiş talep tekrar açılamaz)
  const canRequestCancel =
    isPrismaOrder && order.paymentStatus === 'PAID' && ['paid', 'confirmed', 'processing'].includes(order.status) && !cancelReqStatus
  const canCancelNow = !!order.canCancel
  const refunded = order.paymentStatus === 'REFUNDED' || order.paymentStatus === 'PARTIALLY_REFUNDED'
  const carrier = order.carrierName ? getAllCarriers().find((c) => c.name === order.carrierName) : undefined
  // toOrderView Navlungo linkinde ipucunu boşaltır (null); eski Firestore siparişlerinde alan yok
  const trackingHint = order.trackingHint !== undefined ? order.trackingHint : carrier?.trackingHint

  return (
    <ClassicPageShell
      breadcrumbs={[
        ...(isAuthenticated ? [{ label: L('Hesabım', 'My Account'), href: '/profile' }, { label: L('Siparişlerim', 'My Orders'), href: '/profile?tab=orders' }] : [{ label: L('Sipariş Takibi', 'Order Tracking'), href: '/siparis-takip' }]),
        { label: order.orderId },
      ]}
      noTitle
    >
      <div className="mx-auto max-w-6xl">
        <div className="mb-5 flex flex-wrap items-center justify-between gap-3">
          <div>
            <h1 className="text-xl font-bold text-[#121926] sm:text-2xl">{L('Sipariş', 'Order')} <span className="font-mono">{order.orderId}</span></h1>
            <p className="mt-1 text-sm text-[#5d6e80]">{fmtDateTime(new Date(order.createdAt), loc)}</p>
          </div>
          <StatusBadge order={order} />
        </div>

        {(actionError || actionNotice) && (
          <div role={actionError ? 'alert' : 'status'} className={`mb-5 flex items-start gap-2 rounded-xl border px-4 py-3 text-sm ${actionError ? 'border-red-200 bg-red-50 text-red-800' : 'border-emerald-200 bg-emerald-50 text-emerald-800'}`}>
            {actionError ? <AlertCircle className="mt-0.5 h-4 w-4 shrink-0" aria-hidden /> : <CheckCircle2 className="mt-0.5 h-4 w-4 shrink-0" aria-hidden />}
            {actionError || actionNotice}
          </div>
        )}

        <div className="grid min-w-0 grid-cols-1 gap-5 lg:grid-cols-[minmax(0,1fr)_340px]">
          <div className="min-w-0 space-y-5">
            {/* Durum */}
            {isCancelled || isReturned ? (
              <Card>
                <div className="flex items-start gap-3">
                  
                  <div className="text-sm">
                    <p className="text-base font-semibold text-[#121926]">{isCancelled ? L('Bu sipariş iptal edildi', 'This order has been cancelled') : L('Bu sipariş iade alındı', 'This order has been returned')}</p>
                    {order.dates?.cancelledAt && isCancelled && <p className="text-[#5d6e80]">{fmtDateTime(new Date(order.dates.cancelledAt), loc)}</p>}
                    {refunded ? (
                      <p className="mt-2 rounded-lg bg-emerald-50 px-3 py-2 text-emerald-800">
                        {L('Ücret iadeniz başlatıldı', 'Your refund has been initiated')} ({formatPrice(p.total || 0)}). {order.paymentMethod === 'bank_transfer'
                          ? L('Tutar, havale yaptığınız hesaba gönderilir.', 'The amount will be sent to the account you transferred from.')
                          : L('Tutarın kartınıza yansıması bankanıza bağlı olarak 2–10 iş günü sürebilir.', 'Depending on your bank, it may take 2–10 business days for the amount to appear on your card.')}
                      </p>
                    ) : isCancelled && order.paymentStatus !== 'PAID' ? (
                      <p className="mt-1 text-[#5d6e80]">{L('Ödeme alınmadığından yapmanız gereken bir işlem yok.', 'No payment was taken, so there is nothing you need to do.')}</p>
                    ) : null}
                  </div>
                </div>
              </Card>
            ) : isPrismaOrder ? (
              <Card title={L('Sipariş durumu', 'Order status')} icon={Clock}>
                <ProgressTimeline order={order} />
                {/* Ödeme onayı öncesi de tahmini aralık görünür (ödeme günü baz alınır) */}
                {!['shipped', 'delivered'].includes(order.status) && (
                  <p className="mt-4 flex items-start gap-2 rounded-lg border border-[#e6ebf1] bg-[#f5f7fa] px-3 py-2.5 text-sm text-[#20384e]">
                    <Truck className="mt-0.5 h-4 w-4 shrink-0 text-emerald-600" aria-hidden />
                    <DeliveryEstimate compact />
                  </p>
                )}
                {cancelReqStatus === 'REQUESTED' && (
                  <p className="mt-4 flex items-start gap-2 rounded-lg border border-[#f5d97a] bg-[#fff8e1] px-3 py-2.5 text-sm text-[#5c4300]">
                    <Clock className="mt-0.5 h-4 w-4 shrink-0" aria-hidden />
                    {L('İptal talebiniz inceleniyor. Sonuç e-posta ile bildirilecek.', 'Your cancellation request is being reviewed. We will email you the result.')}
                  </p>
                )}
                {cancelReqStatus === 'REJECTED' && (
                  <p className="mt-4 rounded-lg border border-[#e6ebf1] bg-[#f5f7fa] px-3 py-2.5 text-sm text-[#20384e]">{lastCancelReq?.message}</p>
                )}
              </Card>
            ) : (
              <Card>
                <p className="text-sm text-[#20384e]">{L('Durum:', 'Status:')} <strong>{L(ORDER_STATUS_LABELS[order.status] || order.status, ORDER_STATUS_LABELS_EN[order.status] || order.status)}</strong></p>
              </Card>
            )}

            {/* Havale ödeme talimatı */}
            {order.awaitingTransfer && (
              <section className="rounded-xl border border-[#f5d97a] bg-white shadow-[0_1px_2px_rgba(16,24,40,0.04)]">
                <header className="flex items-center gap-2 rounded-t-xl border-b border-[#f5e4a6] bg-[#fff8e1] px-4 py-3.5 sm:px-5">
                  <Banknote className="h-5 w-5 text-[#8a6400]" aria-hidden />
                  <h2 className="text-[15px] font-semibold text-[#5c4300]">{L('Ödemenizi bekliyoruz', 'We are awaiting your payment')}</h2>
                </header>
                <div className="space-y-4 px-4 py-4 sm:px-5">
                  <p className="text-sm leading-relaxed text-[#20384e]">
                    {L('Siparişinizin onaylanması için', 'To have your order confirmed, please make a bank transfer/EFT to one of the accounts below by')} <strong>{dueDate.toLocaleDateString(loc, { day: '2-digit', month: 'long', timeZone: STORE_TIME_ZONE })}</strong>
                    {L(' tarihine kadar aşağıdaki hesaplardan birine havale/EFT yapın. Açıklama alanına yalnızca sipariş numaranızı yazın.', '. Enter only your order number in the transfer description.')}
                  </p>
                  <BankTransferDetails
                    orderNo={order.orderId}
                    amount={formatPrice(p.total || 0)}
                    dueDate={dueDate.toLocaleDateString(loc, { day: '2-digit', month: 'long', year: 'numeric', timeZone: STORE_TIME_ZONE })}
                  />
                  <PaymentNoticeForm
                    total={p.total || 0}
                    alreadyNotified={events.some((e) => e.type === 'payment_notice')}
                    onSubmit={(body) => simpleAction('payment-notice', 'POST', body)}
                  />
                </div>
              </section>
            )}

            {/* Kargo */}
            {order.trackingNumber && (
              <Card title={L('Kargo bilgisi', 'Shipping information')} icon={Truck}>
                <div className="flex flex-wrap items-center gap-x-6 gap-y-3">
                  <div>
                    <p className="text-xs text-[#5d6e80]">{L('Kargo firması', 'Carrier')}</p>
                    <p className="text-sm font-semibold text-[#121926]">{order.carrierName || '—'}</p>
                  </div>
                  <div>
                    <p className="text-xs text-[#5d6e80]">{L('Takip numarası', 'Tracking number')}</p>
                    <p className="flex items-center gap-2 font-mono text-sm font-semibold text-[#121926]">
                      {order.trackingNumber}
                      <CopyInline value={order.trackingNumber} />
                    </p>
                  </div>
                  {order.shipmentStatus && (
                    <div>
                      <p className="text-xs text-[#5d6e80]">{L('Kargo durumu', 'Shipment status')}</p>
                      <p className="text-sm font-semibold text-[#121926]">{order.shipmentStatus}</p>
                    </div>
                  )}
                  {order.trackingUrl && (
                    <a href={order.trackingUrl} target="_blank" rel="noopener noreferrer" className="inline-flex h-10 items-center gap-1.5 rounded-lg bg-[#f5b400] px-4 text-sm font-semibold text-[#111] hover:bg-[#e0a500] sm:ml-auto">
                      {L('Kargomu takip et', 'Track my shipment')} <ExternalLink className="h-3.5 w-3.5" aria-hidden />
                    </a>
                  )}
                </div>
                {trackingHint && (
                  <p className="mt-3 text-[13px] text-[#5d6e80]">
                    {L(trackingHint, trackingHint === carrier?.trackingHint ? carrier?.trackingHintEn ?? trackingHint : trackingHint)}
                  </p>
                )}
              </Card>
            )}

            {/* Ürünler */}
            <Card title={L(`Ürünler (${(order.items || []).length})`, `Products (${(order.items || []).length})`)} icon={Package}>
              <ul className="divide-y divide-[#eef1f5]">
                {(order.items || []).map((item: any, i: number) => (
                  <li key={item.id ?? i} className="flex items-start justify-between gap-4 py-3 text-sm first:pt-0 last:pb-0">
                    <span className="min-w-0 text-[#121926]">
                      {item.productId ? <Link href={`/products/${item.productId}`} className="font-medium hover:underline">{lineItemName(item, catalogLocale)}</Link> : <span className="font-medium">{item.name}</span>}
                      <span className="block text-xs text-[#5d6e80]">{L(`${item.quantity} adet`, `Qty: ${item.quantity}`)}</span>
                    </span>
                    <span className="shrink-0 font-semibold tabular-nums text-[#121926]">{formatPrice((item.price || 0) * (item.quantity || 1))}</span>
                  </li>
                ))}
              </ul>
            </Card>

            {isPrismaOrder && (
              <ReturnSection
                order={order}
                onSubmit={(body) => simpleAction('returns', 'POST', body)}
                onCancel={(returnId) => simpleAction('returns', 'PATCH', { returnId, op: 'cancel' })}
              />
            )}

            {events.length > 0 && (
              <Card title={L('Sipariş geçmişi', 'Order history')} icon={ReceiptText}>
                <ol className="relative ml-1.5 space-y-4 border-l-2 border-[#eef1f5]">
                  {[...events].reverse().map((e, i) => (
                    <li key={e.id} className="ml-4">
                      <span className={`absolute -left-[7px] mt-1.5 h-3 w-3 rounded-full ring-2 ring-white ${i === 0 ? 'bg-[#f5b400]' : 'bg-[#0b2540]'}`} />
                      <p className="text-sm text-[#121926]">{e.message}</p>
                      <p className="text-xs text-[#5d6e80]">{fmtDateTime(new Date(e.createdAt), loc)}</p>
                    </li>
                  ))}
                </ol>
              </Card>
            )}
          </div>

          {/* Sağ sütun */}
          <aside className="min-w-0 space-y-5">
            <Card title={L('Ödeme özeti', 'Payment summary')} icon={CreditCard}>
              {isPrismaOrder ? (
                <dl className="space-y-2 text-sm">
                  <div className="flex justify-between gap-3"><dt className="text-[#5d6e80]">{L('Ara toplam (KDV hariç)', 'Subtotal (excl. VAT)')}</dt><dd className="tabular-nums">{formatPrice(p.subtotal)}</dd></div>
                  {p.couponDiscount > 0 && (
                    <div className="flex justify-between gap-3 text-emerald-700"><dt>{L('Kupon', 'Coupon')} {p.couponCode ? `(${p.couponCode})` : ''}</dt><dd className="tabular-nums">−{formatPrice(p.couponDiscount)}</dd></div>
                  )}
                  {p.paymentDiscount > 0 && (
                    <div className="flex justify-between gap-3 text-emerald-700"><dt>{L(`Havale/EFT indirimi (%${BANK_TRANSFER_DISCOUNT_RATE})`, `Bank transfer discount (${BANK_TRANSFER_DISCOUNT_RATE}%)`)}</dt><dd className="tabular-nums">−{formatPrice(p.paymentDiscount)}</dd></div>
                  )}
                  <div className="flex justify-between gap-3"><dt className="text-[#5d6e80]">{L(`KDV (%${VAT_RATE})`, `VAT (${VAT_RATE}%)`)}</dt><dd className="tabular-nums">{formatPrice(p.tax)}</dd></div>
                  <div className="flex justify-between gap-3"><dt className="text-[#5d6e80]">{L('Kargo', 'Shipping')}</dt><dd>{p.shipping > 0 ? formatPrice(p.shipping) : <span className="text-emerald-700">{L('Ücretsiz', 'Free')}</span>}</dd></div>
                  <div className="flex items-baseline justify-between gap-3 border-t border-[#e6ebf1] pt-2.5">
                    <dt className="font-semibold text-[#121926]">{L('Toplam', 'Total')}</dt>
                    <dd className="text-lg font-bold tabular-nums text-[#0b2540]">{formatPrice(p.total)}</dd>
                  </div>
                  <div className="flex justify-between gap-3 pt-1 text-xs text-[#5d6e80]">
                    <dt>{L('Ödeme yöntemi', 'Payment method')}</dt>
                    <dd>{order.paymentMethod === 'bank_transfer' ? L('Havale / EFT', 'Bank transfer / EFT') : order.paymentMethod === 'card' ? L('Kredi / banka kartı', 'Credit / debit card') : '—'}</dd>
                  </div>
                </dl>
              ) : (
                <div className="flex items-center justify-between">
                  <span className="font-semibold text-[#121926]">{L('Toplam', 'Total')}</span>
                  <span className="text-lg font-bold text-[#0b2540]">{formatPrice(p.total || 0)}</span>
                </div>
              )}
              {isPrismaOrder && (
                <div className="mt-4 flex flex-col gap-2">
                  <button type="button" className={btnOutline} onClick={() => downloadDocument('contract')} disabled={downloading !== null}>
                    {downloading === 'contract' ? <Loader2 className="h-4 w-4 animate-spin" aria-hidden /> : <FileText className="h-4 w-4" aria-hidden />}
                    {L('Sözleşmeyi indir', 'Download contract')}
                  </button>
                  {order.paymentStatus === 'PAID' && (
                    <button type="button" className={btnOutline} onClick={() => downloadDocument('invoice')} disabled={downloading !== null}>
                      {downloading === 'invoice' ? <Loader2 className="h-4 w-4 animate-spin" aria-hidden /> : <FileText className="h-4 w-4" aria-hidden />}
                      {L('Sipariş özeti (proforma)', 'Order summary (pro forma)')}
                    </button>
                  )}
                </div>
              )}
            </Card>

            {order.customer && (
              <Card title={L('Teslimat adresi', 'Delivery address')} icon={MapPin}>
                <p className="text-sm leading-relaxed text-[#20384e]">
                  <span className="font-semibold text-[#121926]">{order.customer.name}</span><br />
                  {order.customer.addressLine}<br />
                  {order.customer.district} / {order.customer.city} {order.customer.postalCode}<br />
                  {order.customer.phone}
                </p>
                {order.customerNote && <p className="mt-3 rounded-lg bg-[#f5f7fa] px-3 py-2 text-sm text-[#20384e]"><span className="font-medium">{L('Notunuz:', 'Your note:')}</span> {order.customerNote}</p>}
              </Card>
            )}

            {(canCancelNow || canRequestCancel) && (
              <Card title={canCancelNow ? L('Siparişi iptal et', 'Cancel order') : L('İptal talebi', 'Cancellation request')} icon={RotateCcw}>
                {!cancelOpen ? (
                  <>
                    <p className="text-sm text-[#5d6e80]">
                      {canCancelNow
                        ? L('Ödemesi henüz alınmamış siparişinizi hemen iptal edebilirsiniz.', 'Your order has not been paid yet, so you can cancel it right away.')
                        : L('Siparişiniz kargoya verilmeden iptal talebi oluşturabilirsiniz. Onaylanırsa ödemenizin tamamı iade edilir.', 'You can request a cancellation before your order ships. If approved, your payment will be refunded in full.')}
                    </p>
                    <button type="button" onClick={() => { setCancelOpen(true); setActionNotice(''); setActionError('') }} className={`${btnOutline} mt-3 w-full border-red-200 text-red-700 hover:bg-red-50`}>
                      <XCircle className="h-4 w-4" aria-hidden />
                      {canCancelNow ? L('Siparişi iptal et', 'Cancel order') : L('İptal talebi oluştur', 'Request cancellation')}
                    </button>
                  </>
                ) : (
                  <div className="space-y-3">
                    <label htmlFor="cancel-reason" className="block text-sm font-medium text-[#20384e]">{L('İptal nedeni', 'Reason for cancellation')} <span className="font-normal text-[#5d6e80]">{L('(isteğe bağlı)', '(optional)')}</span></label>
                    <textarea id="cancel-reason" rows={3} maxLength={500} value={cancelReason} onChange={(e) => setCancelReason(e.target.value)}
                      className="w-full rounded-lg border border-[#d3d9e1] px-3 py-2 text-base outline-none focus:border-[#0b2540] focus:ring-2 focus:ring-[#0b2540]/15" />
                    <div className="flex gap-2">
                      <button type="button" onClick={submitCancel} disabled={cancelling} className="inline-flex h-10 flex-1 items-center justify-center gap-1.5 rounded-lg bg-red-600 px-3 text-sm font-semibold text-white hover:bg-red-700 disabled:opacity-60">
                        {cancelling && <Loader2 className="h-4 w-4 animate-spin" aria-hidden />}
                        {canCancelNow ? L('İptal et', 'Cancel') : L('Talebi gönder', 'Send request')}
                      </button>
                      <button type="button" onClick={() => setCancelOpen(false)} className={btnOutline} disabled={cancelling}>{L('Vazgeç', 'Back')}</button>
                    </div>
                  </div>
                )}
              </Card>
            )}

            <p className="px-1 text-xs leading-relaxed text-[#5d6e80]">
              {L('Sorularınız için', 'For questions, call')} <a href={SELLER.phoneHref} className="font-medium text-[#0b2540]">{SELLER.phone}</a> {L('veya', 'or visit our')}{' '}
              <Link href="/contact" className="font-medium text-[#0b2540] underline-offset-2 hover:underline">{L('iletişim', 'contact')}</Link> {L('sayfamız.', 'page.')}{' '}
              {L('İade koşulları:', 'Return terms:')} <Link href="/returns" className="font-medium text-[#0b2540] underline-offset-2 hover:underline">{L('İade ve cayma', 'Returns and withdrawal')}</Link>.
            </p>
          </aside>
        </div>
      </div>
    </ClassicPageShell>
  )
}
