'use client'

import { Suspense, useEffect, useState } from 'react'
import { useSearchParams } from 'next/navigation'
import Link from 'next/link'
import { ClassicPageShell } from '@/components/ClassicPageShell'
import { Button } from '@/components/ui/button'
import { CheckCircle, Home, Package, Banknote, Clock, XCircle } from 'lucide-react'
import { useCartStore } from '@/lib/store/useCartStore'
import { BANK_TRANSFER_PAYMENT_DAYS } from '@/lib/store-config'
import { BankAccountsList } from '@/components/BankAccountsList'
import { fmtTRY } from '@/lib/format'
import { trackPurchase } from '@/lib/analytics'

/** Ödeme sayfasının sessionStorage'a yazdığı son sipariş özeti → GA4 purchase */
function sendPurchase(orderNo: string) {
  try {
    const last = JSON.parse(sessionStorage.getItem('last-order') || 'null')
    if (last?.orderNo !== orderNo || typeof last.total !== 'number') return
    void trackPurchase({ orderNo, total: last.total, tax: last.tax, shipping: last.shipping, coupon: last.coupon, items: Array.isArray(last.gaItems) ? last.gaItems : [] })
  } catch {}
}

type CardPaymentState = 'checking' | 'paid' | 'pending' | 'failed'

function SuccessContent() {
  const searchParams = useSearchParams()
  const orderId = searchParams.get('order_id') || searchParams.get('orderId')
  const sessionId = searchParams.get('session_id')
  const payment = searchParams.get('payment')
  const isBankTransfer = payment === 'bank_transfer'
  const clearCart = useCartStore((s) => s.clearCart)
  const [cardState, setCardState] = useState<CardPaymentState>('checking')
  const [transferAmount, setTransferAmount] = useState<number | null>(null)

  // Havale tutarı: ödeme sayfası sipariş sonrası sessionStorage'a yazar
  useEffect(() => {
    if (!isBankTransfer) return
    try {
      const last = JSON.parse(sessionStorage.getItem('last-order') || 'null')
      if (last?.orderNo === orderId && typeof last.total === 'number') setTransferAmount(last.total)
    } catch {}
    // Havale siparişi oluşturuldu → GA4 satın alma (ödeme bekleniyor olsa da sipariş kesinleşti)
    if (orderId) sendPurchase(orderId)
  }, [isBankTransfer, orderId])

  // Kartlı ödeme: URL parametresine güvenme, ödeme durumunu sunucudan doğrula.
  // Webhook birkaç saniye gecikebileceği için kısa süre yeniden sorgula.
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
        const res = await fetch(`/api/orders/by-no/${encodeURIComponent(orderId)}?session_id=${encodeURIComponent(sessionId)}`)
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
    ? { title: 'Siparişiniz Alındı', description: 'Havale/EFT ile ödemenizi bekliyoruz.', icon: 'ok' as const }
    : cardState === 'paid'
      ? { title: 'Siparişiniz Alındı', description: 'Siparişiniz için ödeme başarıyla tamamlandı.', icon: 'ok' as const }
      : cardState === 'failed'
        ? { title: 'Ödeme Alınamadı', description: 'Kartınızdan ödeme alınamadı. Sepetiniz duruyor, tekrar deneyebilirsiniz.', icon: 'fail' as const }
        : cardState === 'checking'
          ? { title: 'Ödemeniz Doğrulanıyor', description: 'Ödeme sağlayıcısından onay bekleniyor, lütfen sayfayı kapatmayın.', icon: 'wait' as const }
          : { title: 'Ödeme Onayı Bekleniyor', description: 'Ödemeniz henüz onaylanmadı. Onaylandığında e-posta ile bilgilendirileceksiniz.', icon: 'wait' as const }

  return (
    <ClassicPageShell
      breadcrumbs={[{ label: 'Ödeme', href: '/checkout' }, { label: view.title }]}
      title={view.title}
      description={view.description}
    >
      <div className="py-12 text-center max-w-lg mx-auto">
        {view.icon === 'ok' && (
          <div className="inline-flex h-20 w-20 items-center justify-center rounded-full bg-green-100 mb-6">
            <CheckCircle className="w-10 h-10 text-green-600" />
          </div>
        )}
        {view.icon === 'wait' && (
          <div className="inline-flex h-20 w-20 items-center justify-center rounded-full bg-amber-100 mb-6">
            <Clock className="w-10 h-10 text-amber-600" />
          </div>
        )}
        {view.icon === 'fail' && (
          <div className="inline-flex h-20 w-20 items-center justify-center rounded-full bg-red-100 mb-6">
            <XCircle className="w-10 h-10 text-red-600" />
          </div>
        )}
        {orderId && (
          <p className="text-ink font-medium mb-2">
            Sipariş numarası: <span className="text-brand font-bold">{orderId}</span>
          </p>
        )}

        {isBankTransfer && (
          <div className="bg-amber-50 border border-amber-200 rounded-xl p-4 mb-4 text-left">
            <div className="flex items-start gap-3">
              <Banknote className="w-5 h-5 text-amber-600 mt-0.5 shrink-0" />
              <div className="flex-1">
                <p className="text-sm font-semibold text-amber-800 mb-2">Havale / EFT Bilgileri</p>
                <p className="text-sm text-amber-700 mb-3">
                  Siparişinizin onaylanması için {BANK_TRANSFER_PAYMENT_DAYS} gün içinde aşağıdaki hesaplardan birine ödeme yapın ve açıklama
                  kısmına sipariş numaranızı yazın. Ödemeniz hesabımıza geçtiğinde siparişiniz onaylanır ve size e-posta gönderilir.
                </p>
                <BankAccountsList className="mb-3" />
                <div className="bg-white rounded-lg border border-amber-200 p-3 space-y-1.5 text-sm">
                  {transferAmount !== null && (
                    <div className="flex justify-between gap-2">
                      <span className="text-amber-700 font-medium shrink-0">Ödenecek tutar:</span>
                      <span className="text-amber-900 font-bold">{fmtTRY(transferAmount)}</span>
                    </div>
                  )}
                  {orderId && (
                    <div className="flex justify-between gap-2 pt-1 border-t border-amber-200">
                      <span className="text-amber-700 font-medium shrink-0">Açıklama:</span>
                      <span className="text-amber-900 font-bold">{orderId}</span>
                    </div>
                  )}
                </div>
              </div>
            </div>
          </div>
        )}

        <p className="text-ink-muted mb-8">
          {isBankTransfer
            ? 'Ödeme bilgileri ve sipariş özeti e-posta adresinize gönderildi.'
            : 'Sipariş detayları e-posta adresinize gönderilecektir.'}
        </p>
        <div className="flex flex-col sm:flex-row flex-wrap justify-center gap-3">
          <Button asChild className="bg-brand hover:bg-brand-hover text-white rounded-xl min-h-[48px] w-full sm:w-auto touch-manipulation">
            <Link href={orderId ? `/orders/${orderId}` : '/profile?tab=orders'} className="inline-flex items-center justify-center gap-2">
              <Package className="w-4 h-4" />
              Siparişimi Görüntüle
            </Link>
          </Button>
          <Button asChild variant="outline" className="rounded-xl min-h-[48px] w-full sm:w-auto touch-manipulation">
            <Link href="/" className="inline-flex items-center justify-center gap-2">
              <Home className="w-4 h-4" />
              Ana Sayfa
            </Link>
          </Button>
        </div>
      </div>
    </ClassicPageShell>
  )
}

export default function CheckoutSuccessPage() {
  return (
    <Suspense fallback={
      <ClassicPageShell noTitle>
        <div className="flex items-center justify-center py-20">
          <div className="animate-spin rounded-full h-12 w-12 border-2 border-slate-300 border-t-slate-700 mx-auto" />
        </div>
      </ClassicPageShell>
    }>
      <SuccessContent />
    </Suspense>
  )
}

