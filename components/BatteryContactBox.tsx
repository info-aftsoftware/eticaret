'use client'

import Link from 'next/link'
import { Phone, Mail } from 'lucide-react'
import { SELLER } from '@/lib/legal/company'
import { useL } from '@/lib/i18n-inline'
import { WhatsAppIcon, whatsappHref } from '@/components/WhatsAppButton'

/**
 * Akü / batarya ürünlerinde sepete ekleme yerine: kargo ve nakliye için iletişim (lib/shipping/battery.ts).
 * WhatsApp mesajı ve e-posta konusu ürün adıyla hazır gelir.
 */
export function BatteryContactBox({ productName, sku, className = '' }: { productName: string; sku?: string | null; className?: string }) {
  const L = useL()
  const ref = sku ? `${productName} (${sku})` : productName
  const text = L(
    `Merhaba, ${ref} için kargo/nakliye ve sipariş bilgisi almak istiyorum.`,
    `Hello, I would like shipping and order information for ${ref}.`
  )
  const mail = `mailto:${SELLER.email}?subject=${encodeURIComponent(L('Akü/batarya siparişi: ', 'Battery order: ') + productName)}&body=${encodeURIComponent(text)}`
  const btn = 'inline-flex h-11 items-center justify-center gap-2 rounded-lg px-4 text-[14px] font-semibold transition-colors'
  return (
    <div className={`rounded-xl border border-[#d6e2ef] bg-[#f5f8fc] p-4 ${className}`} role="note">
      <p className="text-[15px] font-bold text-[#0b2540]">{L('Kargo ve nakliye için iletişime geçin', 'Contact us for shipping and delivery')}</p>
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
        <Link href="/contact" className="font-medium text-[#0b2540] hover:underline">
          {L('İletişim formu', 'Contact form')}
        </Link>
      </p>
    </div>
  )
}
