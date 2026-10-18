'use client'

import { Suspense, useEffect, useState } from 'react'
import { useSearchParams } from 'next/navigation'
import Link from 'next/link'
import { CheckCircle2, Clock, XCircle, Package, Mail, Truck, Banknote, UserPlus, ArrowRight, Loader2 } from 'lucide-react'
import { useCartStore } from '@/lib/store/useCartStore'
import { useAuthStore } from '@/lib/store/useAuthStore'
import { BANK_TRANSFER_PAYMENT_DAYS } from '@/lib/store-config'
import { BankTransferDetails } from '@/components/order/BankTransferDetails'
import { fmtTRY } from '@/lib/format'
import { trackPurchase } from '@/lib/analytics'

type LastOrder = {
  orderNo: string
  total?: number
  tax?: number
  shipping?: number
  coupon?: string | null
  gaItems?: unknown[]
  guest?: { name: string; email: string; phone: string } | null
}

function readLastOrder(orderNo: string | null): LastOrder | null {
  try {
    const last = JSON.parse(sessionStorage.getItem('last-order') || 'null')
    return last?.orderNo && last.orderNo === orderNo ? last : null
  } catch {
    return null
  }
}

/** Ödeme sayfasının sessionStorage'a yazdığı son sipariş özeti → GA4 purchase (sipariş başına bir kez) */
function sendPurchase(orderNo: string) {
  try {
    const last = readLastOrder(orderNo)
    if (!last || typeof last.total !== 'number') return
    const key = `ga-purchase-${orderNo}`
    if (sessionStorage.getItem(key)) return
    sessionStorage.setItem(key, '1')
    void trackPurchase({ orderNo, total: last.total, tax: last.tax, shipping: last.shipping, coupon: last.coupon ?? undefined, items: Array.isArray(last.gaItems) ? (last.gaItems as never[]) : [] })
  } catch {}
}

type CardPaymentState = 'checking' | 'paid' | 'pending' | 'failed'

function StatusIcon({ kind }: { kind: 'ok' | 'wait' | 'fail' }) {
  const map = {
    ok: { cls: 'bg-emerald-50 text-emerald-600 ring-emerald-100', Icon: CheckCircle2 },
    wait: { cls: 'bg-[#fff8e1] text-[#b98500] ring-[#ffefc2]', Icon: Clock },
    fail: { cls: 'bg-red-50 text-red-600 ring-red-100', Icon: XCircle },
  }[kind]
  return (
    <span className={`inline-flex h-16 w-16 items-center justify-center rounded-full ring-8 ${map.cls}`}>
      <map.Icon className="h-8 w-8" aria-hidden />
    </span>
  )
}

function SuccessContent() {
  const searchParams = useSearchParams()
  const orderId = searchParams.get('order_id') || searchParams.get('orderId')
  const sessionId = searchParams.get('session_id')
  const isBankTransfer = searchParams.get('payment') === 'bank_transfer'
  const clearCart = useCartStore((s) => s.clearCart)
  const { isAuthenticated, authReady } = useAuthStore()
  const [cardState, setCardState] = useState<CardPaymentState>('checking')
  const [last, setLast] = useState<LastOrder | null>(null)

  useEffect(() => {
    const l = readLastOrder(orderId)
    setLast(l)
    // Misafir: "Siparişimi görüntüle" aynı sekmede e-posta + telefonla otomatik açılsın
    if (l?.guest && orderId) {
      try {
        sessionStorage.setItem('order-lookup', JSON.stringify({ orderNo: orderId, email: l.guest.email, phone: l.guest.phone }))
      } catch {}
    }
    // Havale siparişi oluşturuldu → GA4 satın alma (ödeme bekleniyor olsa da sipariş kesinleşti)
    if (isBankTransfer && orderId) sendPurchase(orderId)
  }, [isBankTransfer, orderId])

  // Kartlı ödeme: URL parametresine güvenme, ödeme durumunu sunucudan doğrula (webhook gecikebilir).
  useEffect(() => {
    if (isBankTransfer) return
    if (!orderId || !sessionId) {
      setCardState('pending')
      return
    }
    let cancelled = false
    let attempts = 0
    const check = async () => {
      attempts += 1
      try {
        const res = await fetch(`/api/orders/by-no/${encodeURIComponent(orderId)}`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ session_id: sessionId }),
        })
        const data = await res.json().catch(() => null)
        const status = data?.order?.paymentStatus
        if (cancelled) return
        if (status === 'PAID') {
          setCardState('paid')
          sendPurchase(orderId)
          clearCart()
          return
        }
        if (status === 'FAILED') {
          setCardState('failed')
          return
        }
      } catch {}
      if (cancelled) return
      if (attempts < 10) setTimeout(check, 2000)
      else setCardState('pending')
    }
    check()
    return () => { cancelled = true }
  }, [isBankTransfer, orderId, sessionId, clearCart])

  const view = isBankTransfer
    ? { title: 'Siparişiniz alındı', description: 'Siparişinizi onaylamak için havale/EFT ödemenizi bekliyoruz.', icon: 'ok' as const }
    : cardState === 'paid'
      ? { title: 'Siparişiniz alındı', description: 'Ödemeniz onaylandı. Siparişiniz hazırlanmaya alınacak.', icon: 'ok' as const }
      : cardState === 'failed'
        ? { title: 'Ödeme alınamadı', description: 'Kartınızdan ödeme alınamadı. Sepetiniz duruyor; tekrar deneyebilir veya Havale/EFT seçebilirsiniz.', icon: 'fail' as const }
        : cardState === 'checking'
          ? { title: 'Ödemeniz doğrulanıyor', description: 'Bankanızdan onay bekleniyor, lütfen sayfayı kapatmayın.', icon: 'wait' as const }
          : { title: 'Ödeme onayı bekleniyor', description: 'Ödemeniz henüz onaylanmadı. Onaylandığında e-posta ile bilgilendirileceksiniz.', icon: 'wait' as const }

  const dueDate = new Date(Date.now() + BANK_TRANSFER_PAYMENT_DAYS * 86_400_000)
    .toLocaleDateString('tr-TR', { day: '2-digit', month: 'long', year: 'numeric' })
  const ok = view.icon === 'ok'
  const showAccountCta = ok && authReady && !isAuthenticated && !!last?.guest

  const openRegister = () => {
    try {
      if (last?.guest) sessionStorage.setItem('register-prefill', JSON.stringify(last.guest))
    } catch {}
  }

  return (
    <div className="mx-auto max-w-2xl space-y-5">
      <section className="rounded-xl border border-[#e6ebf1] bg-white px-5 py-8 text-center shadow-[0_1px_2px_rgba(16,24,40,0.04)] sm:px-10">
        {cardState === 'checking' && !isBankTransfer ? (
          <span className="inline-flex h-16 w-16 items-center justify-center rounded-full bg-[#f1f4f8] ring-8 ring-[#f5f7fa]">
            <Loader2 className="h-8 w-8 animate-spin text-[#0b2540]" aria-hidden />
          </span>
        ) : (
          <StatusIcon kind={view.icon} />
        )}
        <h1 className="mt-6 text-2xl font-bold text-[#121926] sm:text-[28px]">{view.title}</h1>
        <p className="mx-auto mt-2 max-w-md text-[15px] text-[#5d6e80]" role="status">{view.description}</p>
        {orderId && (
          <p className="mt-5 inline-flex items-center gap-2 rounded-full bg-[#f1f4f8] px-4 py-2 text-sm text-[#20384e]">
            Sipariş no: <span className="font-mono font-semibold text-[#0b2540]">{orderId}</span>
          </p>
        )}
      </section>

      {isBankTransfer && orderId && (
        <section className="rounded-xl border border-[#f5d97a] bg-white shadow-[0_1px_2px_rgba(16,24,40,0.04)]">
          <header className="flex items-center gap-2 rounded-t-xl border-b border-[#f5e4a6] bg-[#fff8e1] px-5 py-3.5">
            <Banknote className="h-5 w-5 text-[#8a6400]" aria-hidden />
            <h2 className="text-base font-semibold text-[#5c4300]">Havale / EFT ile ödeme</h2>
          </header>
          <div className="space-y-4 px-5 py-5">
            <p className="text-sm leading-relaxed text-[#20384e]">
              Siparişinizin onaylanması için <strong>{BANK_TRANSFER_PAYMENT_DAYS} gün içinde</strong> aşağıdaki hesaplardan birine ödeme yapın ve
              açıklama alanına <strong>yalnızca sipariş numaranızı</strong> yazın. Bu süre içinde ödemesi alınmayan siparişler otomatik iptal edilir.
            </p>
            <BankTransferDetails orderNo={orderId} amount={typeof last?.total === 'number' ? fmtTRY(last.total) : null} dueDate={dueDate} />
          </div>
        </section>
      )}

      {ok && (
        <section className="rounded-xl border border-[#e6ebf1] bg-white px-5 py-5 shadow-[0_1px_2px_rgba(16,24,40,0.04)]">
          <h2 className="mb-4 text-base font-semibold text-[#121926]">Bundan sonra ne olacak?</h2>
          <ol className="space-y-4">
            {[
              { icon: Mail, title: 'Onay e-postası', text: isBankTransfer ? 'Sipariş özeti, ödeme bilgileri ve sözleşmeniz e-posta adresinize gönderildi.' : 'Sipariş özeti ve sözleşmeniz e-posta adresinize gönderildi.' },
              ...(isBankTransfer ? [{ icon: Banknote, title: 'Ödemenizin onayı', text: 'Havaleniz hesabımıza ulaştığında siparişinizi onaylayıp size haber veririz.' }] : []),
              { icon: Package, title: 'Hazırlık', text: 'Siparişiniz depomuzda özenle paketlenir.' },
              { icon: Truck, title: 'Kargo', text: 'Kargoya verildiğinde takip numarası e-posta ile gönderilir.' },
            ].map((s, i) => (
              <li key={s.title} className="flex gap-3">
                <span className="flex h-9 w-9 shrink-0 items-center justify-center rounded-full bg-[#f1f4f8] text-[#0b2540]">
                  <s.icon className="h-[18px] w-[18px]" aria-hidden />
                </span>
                <div>
                  <p className="text-sm font-semibold text-[#121926]">{i + 1}. {s.title}</p>
                  <p className="text-[13px] text-[#5d6e80]">{s.text}</p>
                </div>
              </li>
            ))}
          </ol>
        </section>
      )}

      {showAccountCta && (
        <section className="flex flex-col gap-4 rounded-xl bg-[#0b2540] px-5 py-5 text-white sm:flex-row sm:items-center">
          <span className="flex h-11 w-11 shrink-0 items-center justify-center rounded-full bg-white/10">
            <UserPlus className="h-5 w-5 text-[#f5b400]" aria-hidden />
          </span>
          <div className="flex-1">
            <h2 className="text-base font-semibold">Siparişlerinizi tek yerden takip edin</h2>
            <p className="mt-0.5 text-[13px] text-white/75">
              {last?.guest?.email} ile ücretsiz hesap oluşturun; e-postanızı doğruladığınızda bu sipariş hesabınıza otomatik eklenir.
            </p>
          </div>
          <Link
            href={`/register?from_order=1&redirect=${encodeURIComponent(`/orders/${orderId ?? ''}`)}`}
            onClick={openRegister}
            className="inline-flex h-11 shrink-0 items-center justify-center gap-1.5 rounded-lg bg-[#f5b400] px-4 text-sm font-semibold text-[#111] hover:bg-[#e0a500]"
          >
            Hesap oluştur <ArrowRight className="h-4 w-4" aria-hidden />
          </Link>
        </section>
      )}

      <div className="flex flex-col gap-3 sm:flex-row sm:justify-center">
        {view.icon === 'fail' ? (
          <Link href="/checkout" className="inline-flex h-12 items-center justify-center rounded-lg bg-[#0b2540] px-6 text-sm font-semibold text-white hover:bg-[#12335a]">
            Ödemeyi tekrar dene
          </Link>
        ) : (
          <Link
            href={orderId ? `/orders/${encodeURIComponent(orderId)}` : '/orders'}
            className="inline-flex h-12 items-center justify-center gap-2 rounded-lg bg-[#0b2540] px-6 text-sm font-semibold text-white hover:bg-[#12335a]"
          >
            <Package className="h-4 w-4" aria-hidden /> Siparişimi görüntüle
          </Link>
        )}
        <Link href="/products" className="inline-flex h-12 items-center justify-center rounded-lg border border-[#d3d9e1] bg-white px-6 text-sm font-semibold text-[#20384e] hover:bg-[#f5f7fa]">
          Alışverişe devam et
        </Link>
      </div>
    </div>
  )
}

export default function CheckoutSuccessPage() {
  return (
    <div className="min-h-screen bg-[#f5f7fa] px-4 py-8 sm:py-12">
      <Suspense
        fallback={
          <div className="flex items-center justify-center py-20">
            <Loader2 className="h-8 w-8 animate-spin text-[#0b2540]" aria-hidden />
          </div>
        }
      >
        <SuccessContent />
      </Suspense>
    </div>
  )
}
