'use client'

import React, { useMemo } from 'react'
import Link from 'next/link'
import Image from 'next/image'
import { PAGE_CONTAINER } from '@/lib/page-container'
import { ArrowRight } from 'lucide-react'
import { useTranslations } from 'next-intl'
import { CATEGORY_GROUPS, getCategoryKey } from '@/lib/categories'
import { mockProducts, PLACEHOLDER_PRODUCT_IMAGE } from '@/lib/products-mock'

/** Her ana kategoriyi en iyi temsil eden ürün görseli (yoksa gruptaki ilk görselli ürün kullanılır) */
const GROUP_IMAGES: Record<string, string> = {
  'solar-aku': '/images/products/voltekno/16hgmhvy8ciGnk6KDjTVacsSwxS6FmTBh.webp',
  'solar-inverter': '/images/products/voltekno/1fp4IZM48_kfsQWm6jVGAcL07VnIkMtnI.webp',
  'gunes-paneli': '/images/products/voltekno/1SfPNowoPDRUrusBcQf2n8JRxFaOjxZbe.webp',
  'solar-sarj-kontrol': '/images/products/voltekno/1Ljnbfi_nYV6-niNLUZftU4nLlfWBr3vn.webp',
  'solar-baglanti-ekipmani': '/images/products/override/apex-80a-ats-1.webp',
  aksesuar: '/images/products/voltekno/1Tf9LviDZzj3UtH8Nz1x-Z7z0YMq0wUMb.webp',
  'ruzgar-enerjisi': '/images/products/voltekno/1y87j6hUisrHK1xp4foB6pYFbAjmS8qGT.webp',
  'isi-pompasi': '/images/products/voltekno/1aHKVNfDf_RZe7eoHxkJsTL51e8DPDQYm.webp',
  'elektrikli-arac-sarj': '/images/products/voltekno/1xWJp1WcdJ2j8Dy3YpYNeSV2aIUblX2uV.webp',
}

type Tile = {
  id: string
  label: string
  href: string
  count: number
  image: string
  subs: { label: string; href: string; count: number }[]
  /** Kart alt satırı: birden çok alt kategori varsa onlar, tek alt kategoride markalar */
  caption: string
}

/**
 * Ana sayfa kategorileri: 9 ana kategori (gunesenerjisistemi.com kırılımı), bento düzeninde.
 * İlk kategori büyük kart (alt kategorileriyle), diğerleri ürün görselli kompakt kartlar.
 * Kolonlar: mobil 2 · tablet 3 · masaüstü 4.
 */
export function CategoryShowcase() {
  const t = useTranslations('header')

  const tiles = useMemo<Tile[]>(() => {
    const countBy: Record<string, number> = {}
    const firstImageBy: Record<string, string> = {}
    const brandsBy: Record<string, Set<string>> = {}
    for (const p of mockProducts) {
      countBy[p.category] = (countBy[p.category] ?? 0) + 1
      if (p.brand) (brandsBy[p.category] ??= new Set()).add(p.brand)
      if (!firstImageBy[p.category] && p.image && p.image !== PLACEHOLDER_PRODUCT_IMAGE) firstImageBy[p.category] = p.image
    }
    return CATEGORY_GROUPS.map((g) => {
      const subs = g.categoryValues
        .filter((v) => countBy[v])
        .map((v) => ({ label: t(getCategoryKey(v) ?? 'catGeneral'), href: `/products?category=${encodeURIComponent(v)}`, count: countBy[v] }))
      const brands = [...new Set(g.categoryValues.flatMap((v) => [...(brandsBy[v] ?? [])]))]
      return {
        id: g.id,
        label: t(g.labelKey),
        href: `/category/${g.id}`,
        count: subs.reduce((n, s) => n + s.count, 0),
        image: GROUP_IMAGES[g.id] ?? g.categoryValues.map((v) => firstImageBy[v]).find(Boolean) ?? PLACEHOLDER_PRODUCT_IMAGE,
        subs,
        caption: subs.length > 1 ? subs.map((x) => x.label).join(' · ') : brands.join(' · '),
      }
    }).filter((tile) => tile.count > 0)
  }, [t])

  const [featured, ...rest] = tiles

  return (
    <section className="bg-white py-12 min-[901px]:py-16" aria-labelledby="home-categories-heading">
      <div className={PAGE_CONTAINER}>
        <div className="flex items-end justify-between gap-4 mb-6 min-[901px]:mb-8">
          <div>
            <h2 id="home-categories-heading" className="text-[23px] font-bold text-[#121926]">Kategoriler</h2>
            <p className="mt-1 text-sm text-[#5d6e80]">
              {tiles.length} ana kategoride {tiles.reduce((n, x) => n + x.count, 0)} ürün
            </p>
          </div>
          <Link href="/categories" className="inline-flex items-center gap-1.5 text-[13px] font-semibold text-[#0b2540] hover:text-[#12335a] whitespace-nowrap">
            Tüm Kategoriler <ArrowRight className="w-4 h-4" aria-hidden />
          </Link>
        </div>

        <ul className="grid grid-cols-2 min-[641px]:grid-cols-3 min-[1025px]:grid-cols-4 gap-3 min-[641px]:gap-4 min-[1025px]:gap-[18px]">
          {featured && (
            <li className="col-span-2 min-[641px]:row-span-2">
              <div className="group relative h-full flex flex-col min-[641px]:flex-row min-[1025px]:flex-col rounded-xl border border-[#e6ebf1] bg-[#0b2540] overflow-hidden">
                <Link href={featured.href} className="relative block aspect-[16/10] min-[641px]:aspect-auto min-[641px]:flex-1 min-[641px]:min-h-[260px] bg-[#f5f7fa]">
                  <Image
                    src={featured.image}
                    alt={featured.label}
                    fill
                    sizes="(max-width: 640px) 100vw, 50vw"
                    className="object-contain p-6 mix-blend-multiply group-hover:scale-[1.03] transition-transform duration-500"
                  />
                </Link>
                <div className="flex flex-col p-5 min-[901px]:p-6 text-white min-[641px]:w-1/2 min-[1025px]:w-auto">
                  <span className="text-[11px] font-bold uppercase tracking-[0.16em] text-[#f5b400]">Öne çıkan kategori</span>
                  <Link href={featured.href} className="mt-1.5 text-xl min-[901px]:text-2xl font-bold hover:text-[#f5b400] transition-colors">
                    {featured.label}
                  </Link>
                  <span className="mt-1 text-sm text-[#cfdbe8]">{featured.count} ürün</span>
                  <ul className="mt-4 flex flex-wrap gap-2">
                    {featured.subs.map((s) => (
                      <li key={s.href}>
                        <Link
                          href={s.href}
                          className="inline-flex items-center gap-1.5 h-8 px-3 rounded-full bg-white/10 hover:bg-white/20 text-[13px] font-medium transition-colors"
                        >
                          {s.label}
                          <span className="text-[11px] text-[#cfdbe8]">{s.count}</span>
                        </Link>
                      </li>
                    ))}
                  </ul>
                  <Link
                    href={featured.href}
                    className="mt-5 min-[641px]:mt-auto min-[1025px]:mt-5 pt-0 min-[641px]:pt-5 min-[1025px]:pt-0 self-start inline-flex items-center gap-2 text-sm font-semibold text-[#f5b400] hover:text-[#ffc933]"
                  >
                    Kategoriyi incele <ArrowRight className="w-4 h-4" aria-hidden />
                  </Link>
                </div>
              </div>
            </li>
          )}

          {rest.map((tile) => (
            <li key={tile.id}>
              <Link
                href={tile.href}
                className="group relative h-full flex flex-col rounded-xl border border-[#e6ebf1] bg-white overflow-hidden hover:border-[#cfdbe8] hover:shadow-[0_6px_24px_rgba(11,37,64,0.08)] transition-[box-shadow,border-color] duration-200"
              >
                <span className="relative block aspect-[4/3] bg-[#f5f7fa]">
                  <Image
                    src={tile.image}
                    alt={tile.label}
                    fill
                    sizes="(max-width: 640px) 50vw, (max-width: 1024px) 33vw, 25vw"
                    className="object-contain p-4 min-[901px]:p-5 mix-blend-multiply group-hover:scale-[1.04] transition-transform duration-500"
                  />
                  <span className="absolute top-2.5 left-2.5 rounded-full bg-white/90 px-2 py-0.5 text-[11px] font-semibold text-[#20384e]">
                    {tile.count} ürün
                  </span>
                </span>
                <span className="flex-1 flex items-start justify-between gap-3 p-3.5 min-[901px]:p-4">
                  <span className="min-w-0">
                    <span className="block text-[14px] min-[901px]:text-[15px] font-bold leading-snug text-[#121926] group-hover:text-[#0b2540]">
                      {tile.label}
                    </span>
                    <span className="hidden min-[541px]:block mt-1 h-9 overflow-hidden">
                      <span className="line-clamp-2 text-[12px] leading-[18px] text-[#5d6e80]">{tile.caption}</span>
                    </span>
                  </span>
                  <span className="hidden min-[541px]:flex shrink-0 w-8 h-8 rounded-full bg-[#f5b400] text-[#111111] items-center justify-center group-hover:translate-x-0.5 transition-transform">
                    <ArrowRight className="w-4 h-4" aria-hidden />
                  </span>
                </span>
              </Link>
            </li>
          ))}
        </ul>
      </div>
    </section>
  )
}
