'use client'

import { Suspense } from 'react'
import Link from 'next/link'
import { useSearchParams } from 'next/navigation'
import { XCircle, ShoppingCart, Banknote } from 'lucide-react'
import { SELLER } from '@/lib/legal/company'
import { posFailMessage } from '@/lib/payments/pos-messages'
import { useLocale } from 'next-intl'
import { useL } from '@/lib/i18n-inline'

/**
 * Kart ödemesi tamamlanmadığında (banka sanal POS failUrl dönüşü) gösterilir.
 * Sepet temizlenmez; müşteri tekrar deneyebilir veya Havale/EFT seçebilir.
 */
function CancelContent() {
  const L = useL()
  const locale = useLocale()
  const sp = useSearchParams()
  // Yalnızca sabit mesaj kodları gösterilir (adres çubuğundan keyfi metin enjekte edilemez)
  const error = posFailMessage(sp.get('reason'), locale)
  const orderNo = sp.get('order_id')
  const cancelled = sp.get('cancelled') === '1'

  return (
    <div className="mx-auto max-w-lg rounded-xl border border-[#e6ebf1] bg-white px-5 py-8 text-center shadow-[0_1px_2px_rgba(16,24,40,0.04)] sm:px-10">
      <span className="inline-flex h-16 w-16 items-center justify-center rounded-full bg-red-50 text-red-600 ring-8 ring-red-50/60">
        <XCircle className="h-8 w-8" aria-hidden />
      </span>
      <h1 className="mt-6 text-2xl font-bold text-[#121926]">{L('Ödeme tamamlanmadı', 'Payment not completed')}</h1>
      {error && (
        <p role="alert" className="mt-4 rounded-lg border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-800">
          {error}
        </p>
      )}
      <p className="mt-3 text-[15px] text-[#5d6e80]">
        {cancelled && orderNo
          ? L(`Ödeme alınmadı ve ${orderNo} numaralı sipariş iptal edildi. `, `No payment was taken and order ${orderNo} has been cancelled. `)
          : L('Kartınızdan ödeme alınmadı. ', 'Your card was not charged. ')}
        {L('Sepetiniz aynen duruyor; tekrar deneyebilir veya Havale/EFT ile indirimli ödeyebilirsiniz.', 'Your cart is still saved; you can try again or pay by Bank Transfer (EFT) at a discount.')}
      </p>
      <div className="mt-6 flex flex-col gap-3 sm:flex-row sm:justify-center">
        <Link href="/checkout" className="inline-flex h-12 items-center justify-center gap-2 rounded-lg bg-[#f5b400] px-6 text-sm font-semibold text-[#111] hover:bg-[#e0a500]">
          <ShoppingCart className="h-4 w-4" aria-hidden /> {L('Ödemeye dön', 'Back to checkout')}
        </Link>
        <Link href="/cart" className="inline-flex h-12 items-center justify-center gap-2 rounded-lg border border-[#d3d9e1] bg-white px-6 text-sm font-semibold text-[#20384e] hover:bg-[#f5f7fa]">
          <Banknote className="h-4 w-4" aria-hidden /> {L('Sepete git', 'Go to cart')}
        </Link>
      </div>
      <p className="mt-6 text-xs text-[#5d6e80]">
        {L('Sorun devam ederse bize ulaşın:', 'If the problem persists, contact us:')} <a href={SELLER.phoneHref} className="font-medium text-[#0b2540] underline">{SELLER.phone}</a>
      </p>
    </div>
  )
}

export default function CheckoutCancelPage() {
  return (
    <div className="min-h-screen bg-[#f5f7fa] px-4 py-8 sm:py-12">
      <Suspense fallback={<div className="py-12" />}>
        <CancelContent />
      </Suspense>
    </div>
  )
}
