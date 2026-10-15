'use client'

import { Suspense } from 'react'
import Link from 'next/link'
import { useSearchParams } from 'next/navigation'
import { ClassicPageShell } from '@/components/ClassicPageShell'
import { Button } from '@/components/ui/button'
import { XCircle, ShoppingCart, Home } from 'lucide-react'
import { SELLER } from '@/lib/legal/company'
import { posFailMessage } from '@/lib/payments/pos-messages'

/**
 * Kart ödemesi tamamlanmadığında (banka sanal POS failUrl dönüşü) gösterilir.
 * Sepet temizlenmez; müşteri tekrar deneyebilir veya Havale/EFT seçebilir.
 */
function CancelContent() {
  const sp = useSearchParams()
  // Yalnızca sabit mesaj kodları gösterilir (adres çubuğundan keyfi metin enjekte edilemez)
  const error = posFailMessage(sp.get('reason'))
  const orderNo = sp.get('order_id')
  const cancelled = sp.get('cancelled') === '1'

  return (
    <div className="py-12 text-center max-w-lg mx-auto">
      <div className="inline-flex h-20 w-20 items-center justify-center rounded-full bg-amber-100 mb-6">
        <XCircle className="w-10 h-10 text-amber-600" />
      </div>
      {error && (
        <p role="alert" className="mb-4 rounded-lg border border-amber-200 bg-amber-50 px-4 py-3 text-sm text-amber-900">
          {error}
        </p>
      )}
      <p className="text-ink-muted mb-2">
        {cancelled && orderNo ? `Ödeme alınmadı ve ${orderNo} numaralı sipariş iptal edildi. ` : ''}
        Sepetiniz aynen duruyor; tekrar deneyebilir veya Havale/EFT ile ödeyebilirsiniz.
      </p>
      <p className="text-xs text-ink-muted mb-8">
        Sorun devam ederse bize ulaşın: <a href={SELLER.phoneHref} className="underline">{SELLER.phone}</a>
      </p>
      <div className="flex flex-col sm:flex-row flex-wrap justify-center gap-3">
        <Button asChild className="btn-classic-primary rounded-lg min-h-[48px] w-full sm:w-auto touch-manipulation">
          <Link href="/checkout" className="inline-flex items-center justify-center gap-2">
            <ShoppingCart className="w-4 h-4" />
            Ödemeye Dön
          </Link>
        </Button>
        <Button asChild variant="outline" className="rounded-lg min-h-[48px] w-full sm:w-auto touch-manipulation">
          <Link href="/" className="inline-flex items-center justify-center gap-2">
            <Home className="w-4 h-4" />
            Ana Sayfa
          </Link>
        </Button>
      </div>
    </div>
  )
}

export default function CheckoutCancelPage() {
  return (
    <ClassicPageShell
      breadcrumbs={[{ label: 'Ödeme', href: '/checkout' }, { label: 'Tamamlanmadı' }]}
      title="Ödeme tamamlanmadı"
      description="Kart ödemeniz tamamlanmadı. Sepetiniz aynen duruyor."
    >
      <Suspense fallback={<div className="py-12" />}>
        <CancelContent />
      </Suspense>
    </ClassicPageShell>
  )
}
