'use client'

import React, { useCallback, useEffect, useRef, useState } from 'react'
import Link from 'next/link'
import Image from 'next/image'
import { FileCheck2, Truck, Lock, Headphones } from 'lucide-react'

/**
 * Ana sayfa hero'su — voltekno.com ile birebir:
 * 24 px iç boşluklu alanda yatay kayan tam genişlik slaytlar, solda koyu başlık + sarı buton,
 * altta ortalı noktalar ve hero'nun alt kenarına binen 4 güven kartı.
 */
const SLIDES = [
  {
    image: '/images/hero/voltekno-hero-1.webp',
    title: ['Yenilenebilir Enerji', 'Çözümleri'],
    mobileTitle: ['Yenilenebilir Enerji Çözümleri'],
    cta: 'TÜM ÜRÜNLER',
    href: '/products',
    alt: 'Duvara monte inverter, jel akü ve güneş paneli',
  },
  {
    image: '/images/hero/voltekno-hero-2.webp',
    title: ['Lityum Enerji', 'Depolama Sistemleri'],
    mobileTitle: ['Lityum Enerji', 'Depolama'],
    cta: 'KEŞFET',
    href: `/products?category=${encodeURIComponent('Lityum Akü')}`,
    alt: 'Üst üste yığınlanmış lityum batarya modülleri',
  },
  {
    image: '/images/hero/voltekno-hero-3.webp',
    title: ['Solar Tarımsal', 'Sulama Çözümleri'],
    mobileTitle: ['Solar Tarımsal', 'Sulama', 'Çözümleri'],
    cta: 'İNCELE',
    href: `/products?category=${encodeURIComponent('Solar Pompa Sürücüsü')}`,
    alt: 'TommaTech solar pompa sürücüleri ve güneş paneli',
  },
] as const

const FEATURES = [
  { icon: FileCheck2, title: 'Orijinal ve Faturalı Ürün', text: 'Tüm ürünler faturalı ve garantili olarak satılır' },
  { icon: Truck, title: 'Özenli Paketleme, Hızlı Kargo', text: 'Stoktaki ürünlerde hızlı sevkiyat ve takip' },
  { icon: Lock, title: 'Güvenli Ödeme', text: 'Kredi ve banka kartıyla güvenli alışveriş' },
  { icon: Headphones, title: 'Uzman Teknik Destek', text: 'Ürün seçimi ve sistem tasarımında mühendis desteği' },
] as const

const INTERVAL_MS = 5000

export function HeroSlider() {
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
    <section aria-label="Öne çıkan çözümler" className="bg-white">
      <div
        className="p-6 overflow-hidden max-w-[1514px] mx-auto"
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
              return (
                <div
                  key={slide.image}
                  role="group"
                  aria-roledescription="slide"
                  aria-label={`${i + 1} / ${SLIDES.length}`}
                  aria-hidden={!active}
                  className="relative shrink-0 w-full aspect-square min-[641px]:aspect-video min-[641px]:max-h-[596px] bg-[#f5f7fa] overflow-hidden"
                >
                  <Image
                    src={slide.image}
                    alt={slide.alt}
                    fill
                    priority={i === 0}
                    sizes="100vw"
                    className="object-contain object-[50%_18%] min-[641px]:object-cover min-[641px]:object-[50%_45%]"
                  />
                  <div className="absolute inset-0 flex items-center p-6">
                    <div>
                      <p className="mb-4 text-[24px] min-[769px]:text-[32px] min-[1025px]:text-[48px] font-semibold leading-tight text-[#121926]">
                        <span className="min-[769px]:hidden">
                          {slide.mobileTitle.map((line, k) => (<React.Fragment key={k}>{k > 0 && <br />}{line}</React.Fragment>))}
                        </span>
                        <span className="hidden min-[769px]:inline">
                          {slide.title.map((line, k) => (<React.Fragment key={k}>{k > 0 && <br />}{line}</React.Fragment>))}
                        </span>
                      </p>
                      <Link
                        href={slide.href}
                        tabIndex={active ? 0 : -1}
                        className="inline-flex items-center justify-center h-10 min-[769px]:h-12 px-6 min-[769px]:px-8 rounded-md bg-[#f5b400] hover:bg-[#e0a500] text-[#111111] text-sm min-[769px]:text-base font-semibold transition-colors"
                      >
                        {slide.cta}
                      </Link>
                    </div>
                  </div>
                </div>
              )
            })}
          </div>

          <div className="absolute bottom-6 left-1/2 -translate-x-1/2 z-[2] flex items-center gap-2">
            {SLIDES.map((slide, i) => (
              <button
                key={slide.image}
                type="button"
                onClick={() => go(i)}
                aria-label={`${i + 1}. slayt`}
                aria-current={i === current ? 'true' : undefined}
                className={`h-3 !min-h-0 min-w-0 rounded-full transition-all duration-300 ${i === current ? 'w-8 bg-[#14141a]' : 'w-3 bg-white hover:bg-white/80'}`}
              />
            ))}
          </div>
        </div>
      </div>

      {/* Güven kartları: masaüstünde hero'nun alt kenarına biner (voltekno.com: margin-top -44px) */}
      <div className="relative z-[3] max-w-[1406px] mx-auto px-4 min-[541px]:px-6 mt-0 min-[1001px]:-mt-[44px] pb-2">
        <ul className="grid grid-cols-2 min-[1001px]:grid-cols-4 gap-2.5 min-[541px]:gap-[18px]">
          {FEATURES.map(({ icon: Icon, title, text }) => (
            <li
              key={title}
              className="flex flex-col min-[541px]:flex-row min-[541px]:items-center gap-3 min-[541px]:gap-3.5 p-3 min-[541px]:p-[18px] rounded-xl bg-white border border-[#e6ebf1] shadow-[0_6px_24px_rgba(11,37,64,0.06)] transition-[transform,box-shadow] duration-200 hover:-translate-y-0.5"
            >
              <span className="w-11 h-11 shrink-0 rounded-[10px] bg-[#f1f4f8] flex items-center justify-center text-[#20384e]">
                <Icon className="w-6 h-6" strokeWidth={1.6} aria-hidden />
              </span>
              <span className="min-w-0">
                <b className="block text-[13px] font-[650] leading-[16.25px] tracking-[-0.13px] text-[#20384e]">{title}</b>
                <small className="hidden min-[541px]:block mt-0.5 text-[11.5px] font-medium leading-[17.8px] text-[#6b7c8f]">{text}</small>
              </span>
            </li>
          ))}
        </ul>
      </div>
    </section>
  )
}
