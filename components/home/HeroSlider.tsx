'use client'

import React, { useCallback, useEffect, useRef, useState } from 'react'
import Link from 'next/link'
import { useLocale } from 'next-intl'
import Image from 'next/image'
import { PAGE_CONTAINER } from '@/lib/page-container'
import { useL } from '@/lib/i18n-inline'

/**
 * Ana sayfa hero'su — voltekno.com ile birebir:
 * 24 px iç boşluklu alanda yatay kayan tam genişlik slaytlar, solda koyu başlık + sarı buton,
 * altta ortalı noktalar ve hero'nun alt kenarına binen 4 güven kartı.
 */
const SLIDES = [
  {
    image: '/images/hero/voltekno-hero-1.webp',
    title: ['Yenilenebilir Enerji', 'Çözümleri'],
    cta: 'TÜM ÜRÜNLER',
    en: { title: ['Renewable Energy', 'Solutions'], cta: 'ALL PRODUCTS', alt: 'Wall-mounted inverter, gel battery and solar panel' },
    href: '/products',
    alt: 'Duvara monte inverter, jel akü ve güneş paneli',
  },
  {
    image: '/images/hero/voltekno-hero-2.webp',
    title: ['Lityum Enerji', 'Depolama Sistemleri'],
    cta: 'KEŞFET',
    en: { title: ['Lithium Energy', 'Storage Systems'], cta: 'EXPLORE', alt: 'Stacked lithium battery modules' },
    href: `/products?category=${encodeURIComponent('Lityum Akü')}`,
    alt: 'Üst üste yığınlanmış lityum batarya modülleri',
  },
  {
    image: '/images/hero/voltekno-hero-3.webp',
    // 2,4:1 geniş görsel: mobilde 16:9 kırpılınca sağdaki ürünlerin tamamı görünsün
    mobileFocus: 'object-[100%_50%]',
    title: ['Solar Tarımsal', 'Sulama Çözümleri'],
    cta: 'İNCELE',
    en: { title: ['Solar Agricultural', 'Irrigation'], cta: 'VIEW', alt: 'TommaTech solar pump drives and solar panel' },
    href: `/products?category=${encodeURIComponent('Solar Pompa Sürücüsü')}`,
    alt: 'TommaTech solar pompa sürücüleri ve güneş paneli',
  },
] as const

const FEATURES = [
  { tr: ['Orijinal ve Faturalı Ürün', 'Tüm ürünler faturalı ve garantili olarak satılır'], en: ['Genuine, Invoiced Products', 'Every product is sold with invoice and warranty'] },
  { tr: ['Özenli Paketleme, Hızlı Kargo', 'Stoktaki ürünlerde hızlı sevkiyat ve takip'], en: ['Careful Packing, Fast Shipping', 'Quick dispatch and tracking for in-stock items'] },
  { tr: ['Güvenli Ödeme', 'Kredi ve banka kartıyla güvenli alışveriş'], en: ['Secure Payment', 'Safe shopping by credit and debit card'] },
  { tr: ['Uzman Teknik Destek', 'Ürün seçimi ve sistem tasarımında mühendis desteği'], en: ['Expert Technical Support', 'Engineering help with product choice and system design'] },
] as const

const INTERVAL_MS = 5000

export function HeroSlider() {
  const isEn = useLocale() === 'en'
  const L = useL()
  const [current, setCurrent] = useState(0)
  const [paused, setPaused] = useState(false)
  const touchX = useRef<number | null>(null)
  const go = useCallback((i: number) => setCurrent((i + SLIDES.length) % SLIDES.length), [])

  useEffect(() => {
    if (paused) return
    const timer = setTimeout(() => go(current + 1), INTERVAL_MS)
    return () => clearTimeout(timer)
  }, [current, paused, go])

  return (
    <section aria-label={L('Öne çıkan çözümler', 'Featured solutions')} className="bg-white">
      <div
        className={`${PAGE_CONTAINER} py-6 overflow-hidden`}
        aria-roledescription="carousel"
        onMouseEnter={() => setPaused(true)}
        onMouseLeave={() => setPaused(false)}
        onTouchStart={(e) => { touchX.current = e.touches[0].clientX; setPaused(true) }}
        onTouchEnd={(e) => {
          if (touchX.current != null) {
            const dx = e.changedTouches[0].clientX - touchX.current
            if (Math.abs(dx) > 40) go(current + (dx < 0 ? 1 : -1))
          }
          touchX.current = null
          setPaused(false)
        }}
      >
        <div className="relative">
          <div
            className="flex gap-4 transition-transform duration-500 ease-out"
            style={{ transform: `translateX(calc(${-current * 100}% - ${current * 16}px))` }}
          >
            {SLIDES.map((slide, i) => {
              const active = i === current
              const copy = isEn ? slide.en : slide
              return (
                <div
                  key={slide.image}
                  role="group"
                  aria-roledescription="slide"
                  aria-label={`${i + 1} / ${SLIDES.length}`}
                  aria-hidden={!active}
                  className="relative shrink-0 w-full flex flex-col min-[641px]:block min-[641px]:aspect-video min-[641px]:max-h-[596px] bg-[#f5f7fa] overflow-hidden"
                >
                  {/* Mobilde görsel tam genişlikte 16:9 (boş gri alan kalmasın), geniş ekranda tüm alanı kaplar */}
                  <div className="relative w-full aspect-video min-[641px]:absolute min-[641px]:inset-0 min-[641px]:aspect-auto">
                    <Image
                      src={slide.image}
                      alt={copy.alt}
                      fill
                      priority={i === 0}
                      fetchPriority={i === 0 ? 'high' : 'low'}
                      sizes="(max-width: 640px) 100vw, (max-width: 1024px) 90vw, 1400px"
                      className={`object-cover ${'mobileFocus' in slide ? slide.mobileFocus : 'object-center'} min-[641px]:object-[50%_45%]`}
                    />
                  </div>
                  {/* Mobilde başlık ve buton görselin hemen altında (noktalar butonun sağında); geniş ekranda görselin üzerinde ortada */}
                  <div className="px-5 pt-4 pb-5 min-[641px]:absolute min-[641px]:inset-0 min-[641px]:flex min-[641px]:items-center min-[641px]:p-6">
                    <div>
                      <p className="mb-3.5 min-[641px]:mb-4 text-[22px] min-[400px]:text-[24px] min-[769px]:text-[32px] min-[1025px]:text-[48px] font-semibold leading-[1.2] text-[#121926]">
                        {copy.title.map((line, k) => (<React.Fragment key={k}>{k > 0 && <br />}{line}</React.Fragment>))}
                      </p>
                      <Link
                        href={slide.href}
                        tabIndex={active ? 0 : -1}
                        className="inline-flex items-center justify-center h-10 min-w-[150px] min-[769px]:h-12 px-6 min-[769px]:px-8 rounded-md bg-[#f5b400] hover:bg-[#e0a500] text-[#111111] text-sm min-[769px]:text-base font-semibold transition-colors"
                      >
                        {copy.cta}
                      </Link>
                    </div>
                  </div>
                </div>
              )
            })}
          </div>

          <div className="absolute bottom-[34px] right-5 min-[641px]:right-auto min-[641px]:bottom-6 min-[641px]:left-1/2 min-[641px]:-translate-x-1/2 z-[2] flex items-center gap-3">
            {SLIDES.map((slide, i) => (
              <button
                key={slide.image}
                type="button"
                onClick={() => go(i)}
                aria-label={L(`${i + 1}. slayt`, `Slide ${i + 1}`)}
                aria-current={i === current ? 'true' : undefined}
                className="group/dot p-1.5 -m-1.5 !min-h-0 min-w-0 rounded-full"
              >
                {/* Görünen nokta 12px; dokunma alanı 24px (erişilebilirlik) */}
                <span className={`block h-3 rounded-full transition-all duration-300 ${i === current ? 'w-8 bg-[#14141a]' : 'w-3 bg-[#c9d2dc] min-[641px]:bg-white group-hover/dot:bg-white/80'}`} />
              </button>
            ))}
          </div>
        </div>
      </div>

      {/* Güven kartları: masaüstünde hero'nun alt kenarına biner (voltekno.com: margin-top -44px) */}
      <div className="relative z-[3] max-w-[1406px] mx-auto px-4 min-[541px]:px-6 mt-0 min-[1001px]:-mt-[44px] pb-2">
        <ul className="grid grid-cols-2 min-[1001px]:grid-cols-4 gap-2.5 min-[541px]:gap-[18px]">
          {FEATURES.map(({ tr, en }) => {
            const [title, text] = isEn ? en : tr
            return (
            <li
              key={title}
              className="flex flex-col min-[541px]:flex-row min-[541px]:items-center gap-3 min-[541px]:gap-3.5 p-3 min-[541px]:p-[18px] rounded-xl bg-white border border-[#e6ebf1] shadow-[0_6px_24px_rgba(11,37,64,0.06)] transition-[transform,box-shadow] duration-200 hover:-translate-y-0.5"
            >
              <span className="min-w-0">
                <b className="block text-[13px] font-[650] leading-[16.25px] tracking-[-0.13px] text-[#20384e]">{title}</b>
                <small className="hidden min-[541px]:block mt-0.5 text-[11.5px] font-medium leading-[17.8px] text-[#5d6e80]">{text}</small>
              </span>
            </li>
            )
          })}
        </ul>
      </div>
    </section>
  )
}
