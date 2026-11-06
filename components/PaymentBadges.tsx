'use client'

import Image from 'next/image'
import { useL } from '@/lib/i18n-inline'

/**
 * Ödeme yöntemleri: iyzico'nun resmî logo bandı (iyzico ile Öde, Mastercard, Visa, American Express, Troy)
 * ve havale/EFT. Kredi kartı ve banka kartıyla ödeme iyzico üzerinden alınır.
 */
export function PaymentBadges({ className = '' }: { className?: string }) {
  const L = useL()
  return (
    <div className={`flex flex-wrap items-center gap-3 ${className}`} aria-label={L('Ödeme yöntemleri', 'Payment methods')}>
      <span className="inline-flex h-10 items-center rounded-md bg-white px-3 shadow-sm">
        <Image
          src="/images/payment/logo_band.png"
          alt={L(
            'iyzico ile Öde — Mastercard, Visa, American Express ve Troy kartlarla ödeme',
            'Pay with iyzico — Mastercard, Visa, American Express and Troy cards',
          )}
          width={858}
          height={64}
          className="h-6 w-auto max-w-full"
        />
      </span>
      <span className="inline-flex h-10 items-center rounded-md bg-white px-3 text-[12px] font-semibold text-slate-700 shadow-sm">
        {L('Havale / EFT', 'Bank transfer')}
      </span>
    </div>
  )
}
