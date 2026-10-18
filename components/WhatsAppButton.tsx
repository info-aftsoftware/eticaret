'use client'

import React from 'react'
import { usePathname } from 'next/navigation'
import { SELLER } from '@/lib/legal/company'
import { useL } from '@/lib/i18n-inline'

export function whatsappHref(text?: string) {
  return `https://wa.me/${SELLER.whatsapp}${text ? `?text=${encodeURIComponent(text)}` : ''}`
}

export function WhatsAppIcon({ className = 'w-5 h-5' }: { className?: string }) {
  return (
    <svg viewBox="0 0 24 24" className={className} fill="currentColor" aria-hidden>
      <path d="M17.47 14.38c-.3-.15-1.75-.86-2.02-.96-.27-.1-.47-.15-.67.15-.2.3-.77.96-.94 1.16-.17.2-.35.22-.64.07-.3-.15-1.25-.46-2.38-1.47-.88-.79-1.47-1.76-1.65-2.06-.17-.3-.02-.46.13-.6.13-.14.3-.35.45-.52.15-.18.2-.3.3-.5.1-.2.05-.37-.03-.52-.07-.15-.67-1.6-.92-2.2-.24-.58-.49-.5-.67-.5h-.57c-.2 0-.52.07-.8.37-.27.3-1.04 1.02-1.04 2.48s1.07 2.88 1.21 3.08c.15.2 2.1 3.2 5.08 4.49.71.3 1.27.49 1.7.63.71.22 1.36.19 1.88.12.57-.09 1.75-.72 2-1.41.25-.69.25-1.28.17-1.41-.07-.12-.27-.2-.57-.35zM12.04 21.8h-.01a9.8 9.8 0 0 1-5-1.37l-.36-.21-3.71.97.99-3.62-.23-.37a9.78 9.78 0 0 1-1.5-5.22c0-5.4 4.4-9.8 9.82-9.8 2.62 0 5.08 1.02 6.93 2.88a9.74 9.74 0 0 1 2.87 6.93c0 5.41-4.4 9.81-9.8 9.81zm8.35-18.16A11.73 11.73 0 0 0 12.04.2C5.53.2.22 5.5.22 12.02c0 2.08.54 4.11 1.58 5.9L.12 24l6.24-1.64a11.8 11.8 0 0 0 5.67 1.45h.01c6.51 0 11.82-5.3 11.82-11.82 0-3.16-1.23-6.13-3.47-8.36z" />
    </svg>
  )
}

/**
 * Sabit WhatsApp destek düğmesi (sağ alt). Ödeme ve admin sayfalarında gizli.
 * Ürün sayfasında mesaj ürün adresiyle önceden doldurulur.
 */
export function WhatsAppButton() {
  const pathname = usePathname() ?? ''
  const L = useL()
  // Sayfa adresi yüklemeden sonra eklenir: sunucu ve istemci HTML'i aynı kalsın (hydration uyumsuzluğu olmasın)
  const [origin, setOrigin] = React.useState('')
  React.useEffect(() => setOrigin(window.location.origin), [])
  if (pathname.startsWith('/checkout') || pathname.startsWith('/admin')) return null
  const onProduct = pathname.startsWith('/products/')
  const text = onProduct
    ? L(`Merhaba, bu ürün hakkında bilgi almak istiyorum: ${origin}${pathname}`, `Hello, I would like information about this product: ${origin}${pathname}`)
    : L('Merhaba, voltekno.com üzerinden yazıyorum.', 'Hello, I am writing via voltekno.com.')
  return (
    <a
      href={whatsappHref(text)}
      target="_blank"
      rel="noopener noreferrer"
      aria-label={L('WhatsApp ile yazın', 'Message us on WhatsApp')}
      className="fixed right-4 bottom-20 sm:bottom-6 z-40 flex h-12 w-12 items-center justify-center rounded-full bg-[#25D366] text-white shadow-lg hover:scale-105 transition-transform print:hidden"
    >
      <WhatsAppIcon className="w-7 h-7" />
    </a>
  )
}
