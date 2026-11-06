'use client'

import React, { useCallback, useEffect, useRef, useState } from 'react'
import Link from '@/lib/i18n/navigation'
import { useLocale } from 'next-intl'
import Image from 'next/image'
import { PAGE_CONTAINER } from '@/lib/page-container'
import { useL } from '@/lib/i18n-inline'
import { categoryHref } from '@/lib/seo/type-paths'

/**
 * Ana sayfa hero'su: her slayt bir ürün türünü katalogdaki gerçek ürün fotoğraflarıyla temsil eder.
 * Fotoğraflar kırpılmaz (object-contain, max-w/max-h ile oranı korunur); açık zemin slaytın tamamını
 * kapladığı için hangi en-boy oranında olursa olsun kenarlarda boşluk kalmaz.
 * Görseller public/images/hero/products/ altında: ürün fotoğraflarının beyaz kenarları kırpılmış hâlleri.
 * Solda koyu başlık + sarı buton, altta ortalı noktalar, hero'nun alt kenarına binen 4 güven kartı.
 */
type HeroProduct = { src: string; w: number; h: number; maxH: number; maxW: number; alt: string; altEn: string }
type HeroSlide = {
  id: string
  title: readonly string[]
  cta: string
  href: string
  en: { title: readonly string[]; cta: string }
  products: readonly HeroProduct[]
}

const P = (name: string, w: number, h: number, maxH: number, maxW: number, alt: string, altEn: string): HeroProduct => ({
  src: `/images/hero/products/${name}.webp`, w, h, maxH, maxW, alt, altEn,
})

const SLIDES: readonly HeroSlide[] = [
  {
    id: 'ges',
    title: ['Güneş Enerjisi', 'Sistemleri'],
    cta: 'TÜM ÜRÜNLER',
    href: '/products',
    en: { title: ['Solar Energy', 'Systems'], cta: 'ALL PRODUCTS' },
    products: [
      P('panel-topcon', 469, 900, 96, 30, 'TommaTech TOPCon güneş paneli', 'TommaTech TOPCon solar panel'),
      P('inverter-uno-hybrid', 570, 900, 66, 26, 'TommaTech Uno Hybrid hibrit inverter', 'TommaTech Uno Hybrid inverter'),
      P('aku-mrn1', 880, 507, 34, 30, 'TommaTech Marine lityum akü', 'TommaTech Marine lithium battery'),
    ],
  },
  {
    id: 'lityum',
    title: ['Lityum Enerji', 'Depolama Sistemleri'],
    cta: 'KEŞFET',
    href: categoryHref('Lityum Akü'),
    en: { title: ['Lithium Energy', 'Storage Systems'], cta: 'EXPLORE' },
    products: [
      P('aku-pb', 553, 880, 88, 32, 'TommaTech PB Serisi 51,2V lityum batarya', 'TommaTech PB Series 51.2V lithium battery'),
      P('guc-istasyonu', 863, 630, 44, 32, 'TommaTech taşınabilir güç istasyonu', 'TommaTech portable power station'),
      P('aku-victron', 900, 758, 46, 30, 'Victron Lithium SuperPack lityum akü', 'Victron Lithium SuperPack battery'),
    ],
  },
  {
    id: 'sulama',
    title: ['Solar Tarımsal', 'Sulama Çözümleri'],
    cta: 'İNCELE',
    href: categoryHref('Solar Pompa Sürücüsü'),
    en: { title: ['Solar Agricultural', 'Irrigation'], cta: 'VIEW' },
    products: [
      P('panel-bifacial', 347, 880, 96, 24, 'TommaTech bifacial güneş paneli', 'TommaTech bifacial solar panel'),
      P('pompa-spi', 579, 880, 70, 30, 'TommaTech SPI solar pompa sürücüsü', 'TommaTech SPI solar pump drive'),
      P('pompa-spi-trifaze', 466, 709, 54, 26, 'TommaTech trifaze solar pompa sürücüsü', 'TommaTech three-phase solar pump drive'),
    ],
  },
  {
    id: 'ev-sarj',
    title: ['Elektrikli Araç', 'Şarj İstasyonları'],
    cta: 'İNCELE',
    href: categoryHref('Elektrikli Araç Şarj İstasyonu'),
    en: { title: ['EV Charging', 'Stations'], cta: 'VIEW' },
    products: [
      P('ev-aft-pro', 571, 880, 96, 40, 'AFT PRO V2 DC hızlı şarj istasyonu', 'AFT PRO V2 DC fast charging station'),
      P('ev-likya', 396, 880, 64, 26, 'TommaTech Likya 22 kW AC şarj istasyonu', 'TommaTech Likya 22 kW AC charger'),
    ],
  },
  {
    id: 'isi-pompasi',
    title: ['Isı Pompası', 'Çözümleri'],
    cta: 'İNCELE',
    href: categoryHref('Isı Pompası'),
    en: { title: ['Heat Pump', 'Solutions'], cta: 'VIEW' },
    products: [
      P('isi-triome', 489, 889, 90, 28, 'TommaTech Triome ev tipi ısı pompası', 'TommaTech Triome domestic heat pump'),
      P('isi-power', 667, 599, 52, 34, 'TommaTech Power Serisi ısı pompası', 'TommaTech Power Series heat pump'),
      P('isi-titan', 472, 522, 46, 26, 'TommaTech Titan EVI ısı pompası', 'TommaTech Titan EVI heat pump'),
    ],
  },
  {
    id: 'ruzgar',
    title: ['Rüzgar Enerjisi', 'Sistemleri'],
    cta: 'İNCELE',
    href: categoryHref('Rüzgar Türbini'),
    en: { title: ['Wind Energy', 'Systems'], cta: 'VIEW' },
    products: [
      P('ruzgar-istabreeze', 579, 880, 98, 44, 'İstabreeze i Serisi rüzgar türbini', 'İstabreeze i Series wind turbine'),
      P('ruzgar-nova', 659, 880, 84, 44, 'Altech Nova rüzgar türbini', 'Altech Nova wind turbine'),
    ],
  },
]

/** Slayt zemini: açık gri-mavi geçiş + ürünlerin arkasında yumuşak ışık (ürün fotoğraflarının beyazı multiply ile zemine karışır) */
const SLIDE_BG =
  'radial-gradient(ellipse 46% 70% at 70% 48%, rgba(255,255,255,0.95) 0%, rgba(255,255,255,0) 70%), linear-gradient(110deg, #f3f5f8 0%, #edf1f6 45%, #e2e9f2 100%)'

const FEATURES = [
  { tr: ['Orijinal ve Faturalı Ürün', 'Tüm ürünler faturalı ve garantili olarak satılır'], en: ['Genuine, Invoiced Products', 'Every product is sold with invoice and warranty'] },
  { tr: ['Özenli Paketleme ve Kargo Takibi', 'Teslim süresi bulunduğunuz şehre göre değişir'], en: ['Careful Packing and Tracking', 'Delivery time varies by your city'] },
  { tr: ['Güvenli Ödeme', 'Kredi/banka kartı veya havale/EFT; havalede %3 indirim'], en: ['Secure Payment', 'Credit/debit card or bank transfer; 3% off by transfer'] },
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
        className={`${PAGE_CONTAINER} pt-4 pb-6 overflow-hidden`}
        aria-roledescription="carousel"
        // Fare üzerindeyken durmaz: hero ilk ekranın çoğunu kapladığından imleç hep üstünde kalıyor, slayt hiç kaymıyordu.
        // Yalnız parmakla kaydırırken ve klavyeyle bir slayt bağlantısına odaklanınca bekler.
        onFocus={(e) => { if ((e.target as HTMLElement).matches?.(':focus-visible')) setPaused(true) }}
        onBlur={() => setPaused(false)}
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
                  key={slide.id}
                  role="group"
                  aria-roledescription="slide"
                  aria-label={`${i + 1} / ${SLIDES.length}`}
                  aria-hidden={!active}
                  className="relative isolate shrink-0 w-full flex flex-col min-[641px]:block min-[641px]:aspect-video min-[641px]:max-h-[min(596px,max(360px,calc(100svh_-_220px)))] overflow-hidden"
                  style={{ background: SLIDE_BG }}
                >
                  {/* Geniş ekranda yükseklik ekran yüksekliğine bağlı (header ~193px + üst boşluk): hero ilk ekranda tam görünsün */}
                  {/* Ürün sahnesi: mobilde üstte 16:9, geniş ekranda başlığın sağında tüm yükseklik */}
                  <div className="relative w-full aspect-video min-[641px]:absolute min-[641px]:inset-y-0 min-[641px]:right-0 min-[641px]:left-[42%] min-[641px]:w-auto min-[641px]:aspect-auto">
                    {/* Zemin gölgesi: ürünler aynı çizgide duruyor görünsün */}
                    <div
                      aria-hidden
                      className="absolute inset-x-[4%] bottom-[7%] h-[12%]"
                      style={{ background: 'radial-gradient(closest-side, rgba(20,43,64,0.16), rgba(20,43,64,0))' }}
                    />
                    <div className="absolute inset-x-[5%] top-[7%] bottom-[12%] flex items-end justify-center gap-[3%]">
                      {slide.products.map((p) => (
                        <Image
                          key={p.src}
                          src={p.src}
                          alt={isEn ? p.altEn : p.alt}
                          width={p.w}
                          height={p.h}
                          priority={i === 0}
                          fetchPriority={i === 0 ? 'high' : 'low'}
                          sizes="(max-width: 640px) 45vw, 30vw"
                          className="min-w-0 object-contain mix-blend-multiply"
                          style={{ width: 'auto', height: 'auto', maxHeight: `${p.maxH}%`, maxWidth: `${p.maxW}%` }}
                        />
                      ))}
                    </div>
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
                key={slide.id}
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
