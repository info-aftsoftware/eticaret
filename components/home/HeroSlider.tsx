'use client'

import React, { useCallback, useEffect, useState } from 'react'
import Link from 'next/link'
import Image from 'next/image'
import { ArrowRight, ChevronLeft, ChevronRight } from 'lucide-react'

/** Ana sayfa hero slider'ı (voltekno.com yapısı): ürünler görselin sağında, metin solda. */
const SLIDES = [
  {
    image: '/images/hero/voltekno-hero-1.webp',
    overline: 'Güneş Enerjisi Sistemleri',
    title: 'Yenilenebilir Enerji Çözümleri',
    text: 'İnverter, akü ve güneş paneli; ev, karavan, bağ evi ve işletmeler için eksiksiz solar sistemler.',
    cta: 'Tüm Ürünler',
    href: '/products',
    alt: 'Duvara monte inverter, jel akü ve güneş paneli',
  },
  {
    image: '/images/hero/voltekno-hero-2.webp',
    overline: 'LiFePO4 Teknolojisi',
    title: 'Lityum Enerji Depolama Sistemleri',
    text: 'Uzun ömürlü, yüksek döngülü lityum aküler ve yığınlanabilir batarya modülleri.',
    cta: 'Keşfet',
    href: `/products?category=${encodeURIComponent('Lityum Akü')}`,
    alt: 'Üst üste yığınlanmış lityum batarya modülleri',
  },
  {
    image: '/images/hero/voltekno-hero-3.webp',
    overline: 'Tarımsal Sulama',
    title: 'Solar Tarımsal Sulama Çözümleri',
    text: 'Monofaze ve trifaze solar pompa sürücüleriyle şebekesiz, yakıtsız sulama.',
    cta: 'İncele',
    href: `/products?category=${encodeURIComponent('Solar Pompa Sürücüsü')}`,
    alt: 'TommaTech solar pompa sürücüleri ve güneş paneli',
  },
] as const

const INTERVAL_MS = 6000

export function HeroSlider() {
  const [current, setCurrent] = useState(0)
  const [paused, setPaused] = useState(false)
  const go = useCallback((i: number) => setCurrent((i + SLIDES.length) % SLIDES.length), [])

  useEffect(() => {
    if (paused) return
    const timer = setTimeout(() => go(current + 1), INTERVAL_MS)
    return () => clearTimeout(timer)
  }, [current, paused, go])

  return (
    <section
      className="relative w-full overflow-hidden bg-slate-100"
      aria-roledescription="carousel"
      aria-label="Öne çıkan çözümler"
      onMouseEnter={() => setPaused(true)}
      onMouseLeave={() => setPaused(false)}
      onFocus={() => setPaused(true)}
      onBlur={() => setPaused(false)}
    >
      <div className="relative w-full aspect-[4/3] sm:aspect-[16/8] lg:aspect-[16/6.2] max-h-[640px]">
        {SLIDES.map((slide, i) => {
          const active = i === current
          return (
            <div
              key={slide.image}
              role="group"
              aria-roledescription="slide"
              aria-label={`${i + 1} / ${SLIDES.length}`}
              aria-hidden={!active}
              className="absolute inset-0 transition-opacity duration-700 ease-in-out"
              style={{ opacity: active ? 1 : 0, zIndex: active ? 1 : 0 }}
            >
              <Image
                src={slide.image}
                alt={slide.alt}
                fill
                priority={i === 0}
                sizes="100vw"
                className="object-cover object-[72%_center] sm:object-right"
              />
              {/* Metnin okunması için soldan beyaz degrade (mobilde alttan) */}
              <div className="absolute inset-0 bg-gradient-to-t from-white/95 via-white/40 to-transparent sm:bg-gradient-to-r sm:from-white/90 sm:via-white/45 sm:to-transparent" aria-hidden />
              <div className="relative z-[2] h-full container mx-auto max-w-[1440px] px-5 sm:px-10 lg:px-16 flex items-end sm:items-center pb-10 sm:pb-0">
                <div className={`max-w-[540px] transition-all duration-700 ${active ? 'translate-y-0 opacity-100' : 'translate-y-3 opacity-0'}`}>
                  <span className="inline-block text-[11px] sm:text-xs font-bold uppercase tracking-[0.18em] text-amber-600 mb-2 sm:mb-3">
                    {slide.overline}
                  </span>
                  {i === 0 ? (
                    <h1 className="text-[clamp(1.6rem,4vw,3.25rem)] font-black leading-[1.08] tracking-tight text-brand mb-3 sm:mb-4">{slide.title}</h1>
                  ) : (
                    <h2 className="text-[clamp(1.6rem,4vw,3.25rem)] font-black leading-[1.08] tracking-tight text-brand mb-3 sm:mb-4">{slide.title}</h2>
                  )}
                  <p className="hidden sm:block text-slate-600 text-sm lg:text-base leading-relaxed mb-6 max-w-[440px]">{slide.text}</p>
                  <Link
                    href={slide.href}
                    tabIndex={active ? 0 : -1}
                    className="inline-flex items-center gap-2 rounded-md bg-brand hover:bg-brand-hover text-white font-bold uppercase tracking-wider text-xs sm:text-sm h-10 sm:h-12 px-5 sm:px-7 shadow-lg shadow-brand/25 transition-colors"
                  >
                    {slide.cta}
                    <ArrowRight className="w-4 h-4" aria-hidden />
                  </Link>
                </div>
              </div>
            </div>
          )
        })}

        <button
          type="button"
          onClick={() => go(current - 1)}
          aria-label="Önceki slayt"
          className="hidden sm:flex absolute left-3 top-1/2 -translate-y-1/2 z-[3] w-10 h-10 items-center justify-center rounded-full bg-white/80 hover:bg-white text-brand shadow-md transition-colors"
        >
          <ChevronLeft className="w-5 h-5" />
        </button>
        <button
          type="button"
          onClick={() => go(current + 1)}
          aria-label="Sonraki slayt"
          className="hidden sm:flex absolute right-3 top-1/2 -translate-y-1/2 z-[3] w-10 h-10 items-center justify-center rounded-full bg-white/80 hover:bg-white text-brand shadow-md transition-colors"
        >
          <ChevronRight className="w-5 h-5" />
        </button>

        <div className="absolute bottom-2 sm:bottom-4 left-1/2 -translate-x-1/2 z-[3] flex gap-1">
          {SLIDES.map((slide, i) => (
            <button
              key={slide.image}
              type="button"
              onClick={() => go(i)}
              aria-label={`${i + 1}. slayt`}
              aria-current={i === current ? 'true' : undefined}
              className="w-6 h-6 flex items-center justify-center touch-manipulation"
            >
              <span aria-hidden className={`block h-2 rounded-full transition-all duration-300 ${i === current ? 'w-6 bg-brand' : 'w-2 bg-brand/30 hover:bg-brand/50'}`} />
            </button>
          ))}
        </div>
      </div>
    </section>
  )
}
