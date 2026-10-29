'use client'

import Link from 'next/link'
import { Phone, Mail } from 'lucide-react'
import { SELLER } from '@/lib/legal/company'
import { useL } from '@/lib/i18n-inline'
import { WhatsAppIcon, whatsappHref } from '@/components/WhatsAppButton'
import { contactHref } from '@/lib/contact-topics'

/**
 * Sepete ekleme yerine iletişim kutusu (lib/shipping/battery.ts → isContactOnlyProduct):
 *  - battery: akü / batarya, kargo ücreti teklifle (kargo dahil fiyat teklifi)
 *  - quote:   teklifle satılan ürün (lib/sale-mode.ts), fiyat için teklif
 * WhatsApp mesajı ve e-posta konusu ürün adıyla hazır gelir.
 */
export function BatteryContactBox({
  productName,
  productId,
  sku,
  className = '',
  mode = 'battery',
}: {
  productName: string
  /** Verilirse iletişim formu ürünle açılır (madde 17) */
  productId?: string
  sku?: string | null
  className?: string
  mode?: 'battery' | 'quote'
}) {
  const L = useL()
  const ref = sku ? `${productName} (${sku})` : productName
  const quote = mode === 'quote'
  const text = quote
    ? L(`Merhaba, ${ref} için fiyat teklifi almak istiyorum.`, `Hello, I would like a price quote for ${ref}.`)
    : L(`Merhaba, ${ref} için kargo dahil fiyat teklifi almak istiyorum. Teslimat ili: `, `Hello, I would like a quote for ${ref} including shipping. Delivery city: `)
  const subject = quote ? L('Teklif talebi: ', 'Quote request: ') : L('Kargo dahil teklif talebi: ', 'Quote request incl. shipping: ')
  const mail = `mailto:${SELLER.email}?subject=${encodeURIComponent(subject + productName)}&body=${encodeURIComponent(text)}`
  const btn = 'inline-flex h-11 items-center justify-center gap-2 rounded-lg px-4 text-[14px] font-semibold transition-colors'
  return (
    <div className={`rounded-xl border border-[#d6e2ef] bg-[#f5f8fc] p-4 ${className}`} role="note">
      <p className="text-[15px] font-bold text-[#0b2540]">
        {quote ? L('Fiyat için teklif alın', 'Request a price quote') : L('Kargo için teklif alın', 'Request a shipping quote')}
      </p>
      {!quote && (
        <p className="mt-1 text-[13px] text-[#5d6e80]">
          {L('Akü ve bataryalarda kargo ücreti teslimat iline ve gönderi şartlarına göre teklifle belirlenir.', 'For batteries, shipping is quoted based on the delivery city and carrier requirements.')}
        </p>
      )}
      <div className="mt-3 grid grid-cols-1 gap-2 sm:grid-cols-2">
        <a href={whatsappHref(text)} target="_blank" rel="noopener noreferrer" className={`${btn} bg-[#0b2540] text-white hover:bg-[#12335a]`}>
          <WhatsAppIcon className="h-[18px] w-[18px]" />
          {L('WhatsApp ile yazın', 'Chat on WhatsApp')}
        </a>
        <a href={SELLER.phoneHref} className={`${btn} border border-[#d3d9e1] bg-white text-[#0b2540] hover:bg-[#f5f7fa]`}>
          <Phone className="h-4 w-4" aria-hidden />
          {SELLER.phone}
        </a>
      </div>
      <p className="mt-2.5 flex flex-wrap items-center gap-x-3 gap-y-1 text-[12.5px] text-[#5d6e80]">
        <a href={mail} className="inline-flex items-center gap-1 font-medium text-[#0b2540] hover:underline">
          <Mail className="h-3.5 w-3.5" aria-hidden />
          {SELLER.email}
        </a>
        <Link href={contactHref('urun', { productId })} className="font-medium text-[#0b2540] hover:underline">
          {L('Teklif formu', 'Quote form')}
        </Link>
      </p>
    </div>
  )
}
