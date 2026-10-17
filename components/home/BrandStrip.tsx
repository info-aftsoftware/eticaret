import React from 'react'
import Link from 'next/link'
import Image from 'next/image'

/**
 * Markalar şeridi (voltekno.com "Markalar" bölümü + katalogdaki ek markalar).
 * name: katalogdaki product.brand değeri (filtre linki için birebir aynı olmalı).
 * Logolar public/images/brands/ altında, beyaz kenar boşlukları kırpılmış hâlde.
 */
const BRANDS = [
  { name: 'TommaTech', logo: '/images/brands/tommatech.webp' },
  { name: 'Victron', logo: '/images/brands/victron.svg' },
  { name: 'Deye', logo: '/images/brands/deye.webp' },
  { name: 'Havensis', logo: '/images/brands/havensis.webp' },
  { name: 'Frecon', logo: '/images/brands/frecon.webp' },
  { name: 'İstabreeze', logo: '/images/brands/istabreeze.webp' },
  { name: 'Electrozirve', logo: '/images/brands/electrozirve.webp' },
  { name: 'Apex', logo: '/images/brands/apex.webp' },
  { name: 'Exelon', logo: '/images/brands/exelon.webp' },
  { name: 'Altech', logo: '/images/brands/altech.webp' },
  { name: 'Alpex', logo: '/images/brands/alpex.webp' },
  { name: 'NP Power', logo: '/images/brands/np-power.webp' },
  { name: 'Mexxsun', logo: '/images/brands/mexxsun.webp' },
] as const

export function BrandStrip() {
  return (
    <section className="bg-white border-y border-slate-100 py-6 sm:py-8" aria-labelledby="brands-heading">
      <div className="container mx-auto max-w-[1440px] px-4 sm:px-6 lg:px-8 min-w-0">
        <h2 id="brands-heading" className="text-center text-xs sm:text-sm font-bold uppercase tracking-[0.2em] text-slate-500 mb-4 sm:mb-6">
          Markalar
        </h2>
        <div className="overflow-hidden group/scroll [mask-image:linear-gradient(to_right,transparent,#000_6%,#000_94%,transparent)]">
          <ul className="flex w-max animate-brand-scroll">
            {/* Kesintisiz döngü için liste iki kez; ikinci kopya ekran okuyuculardan gizli */}
            {[...BRANDS, ...BRANDS].map((brand, i) => (
              <li key={`${brand.name}-${i}`} aria-hidden={i >= BRANDS.length || undefined} className="flex-none pr-4 sm:pr-6">
                <Link
                  href={`/products?brand=${encodeURIComponent(brand.name)}`}
                  tabIndex={i >= BRANDS.length ? -1 : undefined}
                  title={`${brand.name} ürünleri`}
                  className="flex items-center justify-center w-[130px] h-[64px] sm:w-[170px] sm:h-[80px] rounded-xl border border-slate-100 bg-white px-4 grayscale-[35%] hover:grayscale-0 hover:border-brand/20 hover:shadow-md transition-all"
                >
                  <Image
                    src={brand.logo}
                    alt={brand.name}
                    width={170}
                    height={64}
                    unoptimized={brand.logo.endsWith('.svg')}
                    className="max-h-[40px] sm:max-h-[48px] w-auto object-contain"
                  />
                </Link>
              </li>
            ))}
          </ul>
        </div>
      </div>
    </section>
  )
}
