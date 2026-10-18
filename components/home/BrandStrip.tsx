import React from 'react'
import Link from 'next/link'
import Image from 'next/image'
import { PAGE_CONTAINER } from '@/lib/page-container'
import { useL } from '@/lib/i18n-inline'

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
  const L = useL()
  return (
    <section className="bg-white pt-14 pb-10" aria-labelledby="brands-heading">
      <div className={PAGE_CONTAINER}>
      <h2 id="brands-heading" className="mb-8 text-[23px] font-bold text-[#121926]">
        {L('Markalar', 'Brands')}
      </h2>
      {/* Kayan şerit de aynı kabın içinde: geniş ekranda kenarlar diğer bölümlerle hizalı */}
      <div className="overflow-hidden group/scroll">
        <ul className="flex w-max items-center animate-brand-scroll">
          {/* Kesintisiz döngü için liste iki kez; ikinci kopya ekran okuyuculardan gizli */}
          {[...BRANDS, ...BRANDS].map((brand, i) => (
            <li key={`${brand.name}-${i}`} aria-hidden={i >= BRANDS.length || undefined} className="flex-none pr-12">
              <Link
                href={`/products?brand=${encodeURIComponent(brand.name)}`}
                tabIndex={i >= BRANDS.length ? -1 : undefined}
                title={`${brand.name} ürünleri`}
                className="flex items-center justify-center w-[108px] h-[108px] min-[901px]:w-[123px] min-[901px]:h-[123px] min-[1025px]:w-[160px] min-[1025px]:h-[160px] p-2 hover:opacity-80 transition-opacity"
              >
                <Image
                  src={brand.logo}
                  alt={brand.name}
                  width={160}
                  height={160}
                  unoptimized={brand.logo.endsWith('.svg')}
                  className="w-full h-full object-contain"
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
