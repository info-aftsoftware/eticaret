'use client'

import { Suspense } from 'react'
import { useSearchParams } from 'next/navigation'
import Link from 'next/link'
import Image from 'next/image'
import { ClassicPageShell } from '@/components/ClassicPageShell'
import { Button } from '@/components/ui/button'
import { CheckCircle, Home, Package, Banknote } from 'lucide-react'

function SuccessContent() {
  const searchParams = useSearchParams()
  const orderId = searchParams.get('order_id') || searchParams.get('orderId') || searchParams.get('session_id')
  const payment = searchParams.get('payment')
  const isBankTransfer = payment === 'bank_transfer' || payment === 'test'

  return (
    <ClassicPageShell
      breadcrumbs={[{ label: 'Ödeme', href: '/checkout' }, { label: 'Başarılı' }]}
      title="Siparişiniz Alındı"
      description={isBankTransfer ? 'Havale/EFT ile ödemenizi bekliyoruz.' : 'Siparişiniz için ödeme başarıyla tamamlandı.'}
    >
      <div className="py-12 text-center max-w-lg mx-auto">
        <div className="inline-flex h-20 w-20 items-center justify-center rounded-full bg-green-100 mb-6">
          <CheckCircle className="w-10 h-10 text-green-600" />
        </div>
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
                  Ödemenizi aşağıdaki hesap bilgilerine yaparak açıklama kısmına sipariş numaranızı yazınız. Ödemeniz onaylandıktan sonra siparişiniz hazırlanacaktır.
                </p>
                <div className="bg-white rounded-lg border border-amber-200 p-3 space-y-1.5 text-sm">
                  <div className="flex justify-between gap-2">
                    <span className="text-amber-700 font-medium shrink-0">Banka:</span>
                    <span className="text-amber-900 font-semibold">Halkbank</span>
                  </div>
                  <div className="flex justify-between gap-2">
                    <span className="text-amber-700 font-medium shrink-0">Hesap Sahibi:</span>
                    <span className="text-amber-900 font-semibold">Voltekno Enerji Sistemleri</span>
                  </div>
                  <div className="flex flex-col gap-0.5">
                    <span className="text-amber-700 font-medium">IBAN:</span>
                    <span className="text-amber-900 font-mono font-bold tracking-wide">TR76 0001 2009 5910 0001 1722 00</span>
                  </div>
                  <div className="flex flex-col items-center gap-1.5 pt-2 border-t border-amber-200">
                    <span className="text-[11px] text-amber-600 font-medium">IBAN QR Kodu</span>
                    <Image
                      src="/images/iban-qr.jpg"
                      alt="Halkbank IBAN QR Kodu"
                      width={140}
                      height={140}
                      className="rounded-lg border border-amber-200"
                    />
                  </div>
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
          Sipariş detayları e-posta adresinize gönderilecektir.
        </p>
        <div className="flex flex-col sm:flex-row flex-wrap justify-center gap-3">
          <Button asChild className="bg-brand hover:bg-brand-hover text-white rounded-xl min-h-[48px] w-full sm:w-auto touch-manipulation">
            <Link href="/profile?tab=orders" className="inline-flex items-center justify-center gap-2">
              <Package className="w-4 h-4" />
              Siparişlerim
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

