import React from 'react'
import Link from 'next/link'
import Image from 'next/image'
import { PAGE_CONTAINER } from '@/lib/page-container'
import { useL } from '@/lib/i18n-inline'

/**
 * Ana sayfanın son bölümü — voltekno.com'daki "GES projeniz için teklif alın" bandının görsel düzeni:
 * hero ile aynı genişlikte, 6 px köşeli çatı GES görseli, soldan lacivert degrade, beyaz başlık ve sarı buton.
 * Yükseklik: masaüstü 600 px (16:9 ile sınırlı), 768 px ve altı kare.
 */
export function QuoteBanner() {
  const L = useL()
  return (
    <section aria-labelledby="quote-cta-heading" className="bg-white">
      <div className={`${PAGE_CONTAINER} pt-6 pb-12 min-[901px]:pb-16`}>
        <div className="relative w-full aspect-square min-[769px]:aspect-video min-[769px]:max-h-[600px] rounded-md overflow-hidden bg-[#0b2540]">
          <Image
            src="/images/hero/voltekno-ges-banner.webp"
            alt="Çatıya güneş paneli kuran teknisyenler"
            fill
            sizes="(max-width: 1514px) 100vw, 1466px"
            className="object-cover object-center"
          />
          <div className="absolute inset-0 bg-gradient-to-r from-[#0b2540]/90 via-[#0b2540]/45 to-transparent" aria-hidden />
          <div className="absolute inset-0 flex items-center p-6">
            <div className="max-w-[640px]">
              <h2 id="quote-cta-heading" className="text-[24px] min-[769px]:text-[32px] min-[1025px]:text-[40px] font-semibold leading-tight text-white mb-5 min-[769px]:mb-6">
                {L('Enerji Faturanızı Düşürmeye Hazır mısınız?', 'Ready to Cut Your Energy Bill?')}
              </h2>
              <Link
                href="/ges"
                className="inline-flex items-center justify-center h-11 min-[769px]:h-12 px-6 min-[769px]:px-8 rounded-md bg-[#f5b400] hover:bg-[#e0a500] text-[#111111] text-sm min-[769px]:text-[15px] font-semibold transition-colors"
              >
                {L('TEKLİF AL', 'GET A QUOTE')}
              </Link>
            </div>
          </div>
        </div>
      </div>
    </section>
  )
}
