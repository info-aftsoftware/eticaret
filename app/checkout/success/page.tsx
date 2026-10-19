'use client'

import { Suspense, useEffect, useState } from 'react'
import { useSearchParams } from 'next/navigation'
import Link from 'next/link'
import { CheckCircle2, Clock, XCircle, Package, Mail, Truck, Banknote, UserPlus, ArrowRight, Loader2 } from 'lucide-react'
import { useCartStore } from '@/lib/store/useCartStore'
import { useAuthStore } from '@/lib/store/useAuthStore'
import { BANK_TRANSFER_PAYMENT_DAYS, STORE_TIME_ZONE, bankTransferDeadline } from '@/lib/store-config'
import { BankTransferDetails } from '@/components/order/BankTransferDetails'
import { fmtTRY } from '@/lib/format'
import { trackPurchase } from '@/lib/analytics'
import { useL } from '@/lib/i18n-inline'

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
  const L = useL()
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
    ? { title: L('Siparişiniz alındı', 'Your order has been received'), description: L('Siparişinizi onaylamak için havale/EFT ödemenizi bekliyoruz.', 'We are awaiting your bank transfer (EFT) payment to confirm your order.'), icon: 'ok' as const }
    : cardState === 'paid'
      ? { title: L('Siparişiniz alındı', 'Your order has been received'), description: L('Ödemeniz onaylandı. Siparişiniz hazırlanmaya alınacak.', 'Your payment has been confirmed. Your order will now be prepared.'), icon: 'ok' as const }
      : cardState === 'failed'
        ? { title: L('Ödeme alınamadı', 'Payment failed'), description: L('Kartınızdan ödeme alınamadı. Sepetiniz duruyor; tekrar deneyebilir veya Havale/EFT seçebilirsiniz.', 'We could not charge your card. Your cart is still saved; you can try again or choose Bank Transfer (EFT).'), icon: 'fail' as const }
        : cardState === 'checking'
          ? { title: L('Ödemeniz doğrulanıyor', 'Verifying your payment'), description: L('Bankanızdan onay bekleniyor, lütfen sayfayı kapatmayın.', 'Waiting for confirmation from your bank, please do not close this page.'), icon: 'wait' as const }
          : { title: L('Ödeme onayı bekleniyor', 'Awaiting payment confirmation'), description: L('Ödemeniz henüz onaylanmadı. Onaylandığında e-posta ile bilgilendirileceksiniz.', 'Your payment has not been confirmed yet. You will be notified by email once it is confirmed.'), icon: 'wait' as const }

  const dueDate = bankTransferDeadline(Date.now())
    .toLocaleDateString(L('tr-TR', 'en-GB'), { day: '2-digit', month: 'long', year: 'numeric', timeZone: STORE_TIME_ZONE })
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
            {L('Sipariş no:', 'Order no:')} <span className="font-mono font-semibold text-[#0b2540]">{orderId}</span>
          </p>
        )}
      </section>

      {isBankTransfer && orderId && (
        <section className="rounded-xl border border-[#f5d97a] bg-white shadow-[0_1px_2px_rgba(16,24,40,0.04)]">
          <header className="flex items-center gap-2 rounded-t-xl border-b border-[#f5e4a6] bg-[#fff8e1] px-5 py-3.5">
            <Banknote className="h-5 w-5 text-[#8a6400]" aria-hidden />
            <h2 className="text-base font-semibold text-[#5c4300]">{L('Havale / EFT ile ödeme', 'Payment by Bank Transfer (EFT)')}</h2>
          </header>
          <div className="space-y-4 px-5 py-5">
            <p className="text-sm leading-relaxed text-[#20384e]">
              {L('Siparişinizin onaylanması için ', 'To confirm your order, pay to one of the accounts below ')}
              <strong>{L(`${BANK_TRANSFER_PAYMENT_DAYS} gün içinde`, `within ${BANK_TRANSFER_PAYMENT_DAYS} days`)}</strong>
              {L(' aşağıdaki hesaplardan birine ödeme yapın ve açıklama alanına ', ' and enter ')}
              <strong>{L('yalnızca sipariş numaranızı', 'only your order number')}</strong>
              {L(' yazın. Bu süre içinde ödemesi alınmayan siparişler otomatik iptal edilir.', ' in the payment description. Orders not paid within this period are cancelled automatically.')}
            </p>
            <BankTransferDetails orderNo={orderId} amount={typeof last?.total === 'number' ? fmtTRY(last.total) : null} dueDate={dueDate} />
          </div>
        </section>
      )}

      {ok && (
        <section className="rounded-xl border border-[#e6ebf1] bg-white px-5 py-5 shadow-[0_1px_2px_rgba(16,24,40,0.04)]">
          <h2 className="mb-4 text-base font-semibold text-[#121926]">{L('Bundan sonra ne olacak?', 'What happens next?')}</h2>
          <ol className="space-y-4">
            {[
              { icon: Mail, title: L('Onay e-postası', 'Confirmation email'), text: isBankTransfer ? L('Sipariş özeti, ödeme bilgileri ve sözleşmeniz e-posta adresinize gönderildi.', 'Your order summary, payment details and agreement have been sent to your email address.') : L('Sipariş özeti ve sözleşmeniz e-posta adresinize gönderildi.', 'Your order summary and agreement have been sent to your email address.') },
              ...(isBankTransfer ? [{ icon: Banknote, title: L('Ödemenizin onayı', 'Payment confirmation'), text: L('Havaleniz hesabımıza ulaştığında siparişinizi onaylayıp size haber veririz.', 'Once your transfer reaches our account, we will confirm your order and let you know.') }] : []),
              { icon: Package, title: L('Hazırlık', 'Preparation'), text: L('Siparişiniz depomuzda özenle paketlenir.', 'Your order is carefully packed at our warehouse.') },
              { icon: Truck, title: L('Kargo', 'Shipping'), text: L('Kargoya verildiğinde takip numarası e-posta ile gönderilir.', 'Once shipped, the tracking number will be sent to you by email.') },
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
            <h2 className="text-base font-semibold">{L('Siparişlerinizi tek yerden takip edin', 'Track all your orders in one place')}</h2>
            <p className="mt-0.5 text-[13px] text-white/75">
              {L(
                `${last?.guest?.email ?? ''} ile ücretsiz hesap oluşturun; e-postanızı doğruladığınızda bu sipariş hesabınıza otomatik eklenir.`,
                `Create a free account with ${last?.guest?.email ?? ''}; once you verify your email, this order will be added to your account automatically.`
              )}
            </p>
          </div>
          <Link
            href={`/register?from_order=1&redirect=${encodeURIComponent(`/orders/${orderId ?? ''}`)}`}
            onClick={openRegister}
            className="inline-flex h-11 shrink-0 items-center justify-center gap-1.5 rounded-lg bg-[#f5b400] px-4 text-sm font-semibold text-[#111] hover:bg-[#e0a500]"
          >
            {L('Hesap oluştur', 'Create account')} <ArrowRight className="h-4 w-4" aria-hidden />
          </Link>
        </section>
      )}

      <div className="flex flex-col gap-3 sm:flex-row sm:justify-center">
        {view.icon === 'fail' ? (
          <Link href="/checkout" className="inline-flex h-12 items-center justify-center rounded-lg bg-[#0b2540] px-6 text-sm font-semibold text-white hover:bg-[#12335a]">
            {L('Ödemeyi tekrar dene', 'Retry payment')}
          </Link>
        ) : (
          <Link
            href={orderId ? `/orders/${encodeURIComponent(orderId)}` : '/orders'}
            className="inline-flex h-12 items-center justify-center gap-2 rounded-lg bg-[#0b2540] px-6 text-sm font-semibold text-white hover:bg-[#12335a]"
          >
            <Package className="h-4 w-4" aria-hidden /> {L('Siparişimi görüntüle', 'View my order')}
          </Link>
        )}
        <Link href="/products" className="inline-flex h-12 items-center justify-center rounded-lg border border-[#d3d9e1] bg-white px-6 text-sm font-semibold text-[#20384e] hover:bg-[#f5f7fa]">
          {L('Alışverişe devam et', 'Continue shopping')}
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
