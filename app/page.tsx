'use client'

import React, { useMemo, useState, useEffect } from 'react'
import Link from 'next/link'
import Image from 'next/image'
import {
  ArrowUpRight,
  ArrowRight,
} from 'lucide-react'
import { ProductCard } from '@/components/ProductCard'
import { mockProducts } from '@/lib/products-mock'
import { PACKAGE_CATEGORIES } from '@/lib/package-categories'
import { useTranslations } from 'next-intl'
import { useL } from '@/lib/i18n-inline'
import { HeroSlider } from '@/components/home/HeroSlider'
import { BrandStrip } from '@/components/home/BrandStrip'
import { CategoryShowcase } from '@/components/home/CategoryShowcase'
import { QuoteBanner } from '@/components/home/QuoteBanner'
import { PAGE_CONTAINER } from '@/lib/page-container'
import type { MockProduct } from '@/lib/products-mock'

const FEATURED_ROW_MAX = 10

function getFeaturedRowProducts(products: MockProduct[] = mockProducts): MockProduct[] {
  const featured = products.filter((p) => p.featured || (p.discount != null && p.discount > 0))
  const sliced = featured.slice(0, FEATURED_ROW_MAX)
  if (sliced.length <= 1) return sliced
  const byCategory = new Map<string, MockProduct[]>()
  for (const p of sliced) {
    const list = byCategory.get(p.category) ?? []
    list.push(p)
    byCategory.set(p.category, list)
  }
  Array.from(byCategory.values()).forEach((list) => list.sort((a, b) => a.id.localeCompare(b.id)))
  const categories = Array.from(byCategory.keys()).sort()
  const result: MockProduct[] = []
  let lastCategory: string | null = null
  while (result.length < sliced.length) {
    let picked = false
    for (const cat of categories) {
      const list = byCategory.get(cat)!
      if (list.length === 0 || cat === lastCategory) continue
      result.push(list.shift()!)
      lastCategory = cat
      picked = true
      break
    }
    if (!picked) {
      for (const cat of categories) {
        const list = byCategory.get(cat)!
        if (list.length > 0) { result.push(list.shift()!); lastCategory = cat; break }
      }
    }
  }
  return result
}

export default function HomePage() {
  const t = useTranslations('home')
  const tHeader = useTranslations('header')
  const L = useL()
  const [allProducts, setAllProducts] = useState(mockProducts)
  const featuredRowProducts = useMemo(() => getFeaturedRowProducts(allProducts), [allProducts])


  useEffect(() => {
    fetch('/api/products')
      .then((res) => res.json())
      .then((data) => { if (Array.isArray(data) && data.length > 0) setAllProducts(data) })
      .catch(() => {})
  }, [])


  const sectionPadding = 'py-8 sm:py-12 md:py-16 lg:py-20'
  const containerClass = PAGE_CONTAINER
  const sectionTitleClass = 'text-xl sm:text-2xl md:text-3xl font-bold text-slate-900 tracking-tight'
  const sectionDescClass = 'text-slate-600 text-sm sm:text-base mt-1'

  return (
    <div className="w-full max-w-full min-w-0 overflow-x-hidden">
      {/* Slayt başlıkları döndüğü için sayfanın tek H1'i görünmez; arama motoru ve ekran okuyucu içindir */}
      <h1 className="sr-only">{L('voltekno — Güneş Paneli, Akü, Solar İnverter ve Enerji Sistemleri', 'voltekno — Solar Panels, Batteries, Solar Inverters and Energy Systems')}</h1>

      {/* ─── 1. HERO SLIDER (voltekno.com yapısı) ─────────────────────────── */}
      <HeroSlider />

      {/* ─── 2. MARKALAR ─────────────────────────────────────────────────── */}
      <BrandStrip />

      {/* ─── 4. POPÜLER ÜRÜNLER ──────────────────────────────────────────── */}
      <section className={`${sectionPadding} min-w-0 opacity-0 animate-section-in animate-section-in-delay-1`} aria-labelledby="popular-products-heading">
        <div className={containerClass}>
          <header className="mb-6 md:mb-8">
            <h2 id="popular-products-heading" className={sectionTitleClass}>
              {L('Popüler Ürünler', 'Popular Products')}
            </h2>
            <p className={sectionDescClass}>{L('Müşterilerimizin en çok satın aldığı ürünler.', 'Our customers’ most purchased products.')}</p>
          </header>
          {featuredRowProducts.length === 0 ? (
            <p className="text-slate-500 py-8">{t('noProductsYet')}</p>
          ) : (
            <div className="overflow-hidden -mx-1 px-1 group/scroll rounded-2xl">
              <div className="flex gap-4 sm:gap-5 w-max animate-featured-scroll" style={{ width: 'max-content' }}>
                {[...featuredRowProducts, ...featuredRowProducts].map((product, i) => (
                  <div key={`${product.id}-${i}`} className="flex-none w-[180px] sm:w-[200px] md:w-[220px] min-w-0">
                    <ProductCard
                      product={{
                        id: product.id,
                        name: product.name,
                        description: product.description,
                        price: product.price,
                        image: product.image,
                        category: product.category,
                        brand: product.brand,
                      }}
                      oldPrice={product.oldPrice}
                      discount={product.discount}
                      badges={product.tags}
                      sku={product.sku}
                      stock={product.stock}
                      isVariantProduct={product.isVariantProduct}
                      variant="compact"
                    />
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>
      </section>

      {/* ─── 6. ÖNE ÇIKAN ÜRÜNLER GRID ──────────────────────────────────── */}
      <section className={`${sectionPadding} bg-slate-50/60 min-w-0 opacity-0 animate-section-in`} aria-labelledby="featured-grid-heading">
        <div className={containerClass}>
          <header className="mb-8 md:mb-10 flex flex-col sm:flex-row sm:items-end sm:justify-between gap-4">
            <div>
              <h2 id="featured-grid-heading" className={sectionTitleClass}>{t('featuredProducts')}</h2>
              <p className={sectionDescClass}>{L('En çok tercih edilen ve en yüksek puanlı ürünler.', 'Most preferred and top-rated products.')}</p>
            </div>
            <Link href="/products" className="shrink-0 inline-flex items-center gap-1.5 text-sm font-semibold text-brand hover:underline">
              {tHeader('allProducts')} <ArrowUpRight className="w-4 h-4" />
            </Link>
          </header>
          <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5 gap-4 sm:gap-5">
            {featuredRowProducts.slice(0, 10).map((product) => (
              <ProductCard
                key={product.id}
                product={{
                  id: product.id,
                  name: product.name,
                  description: product.description,
                  price: product.price,
                  image: product.image,
                  category: product.category,
                  brand: product.brand,
                }}
                oldPrice={product.oldPrice}
                discount={product.discount}
                badges={product.tags}
                sku={product.sku}
                stock={product.stock}
                isVariantProduct={product.isVariantProduct}
                variant="compact"
              />
            ))}
          </div>
        </div>
      </section>

      {/* ─── 3. KULLANIM SENARYOLARI ─────────────────────────────────────── */}
      <section className={`${sectionPadding} min-w-0 opacity-0 animate-section-in`} aria-labelledby="use-cases-heading">
        <div className={containerClass}>
          <header className="mb-8 md:mb-10 flex flex-col sm:flex-row sm:items-end sm:justify-between gap-3">
            <div>
              <h2 id="use-cases-heading" className={sectionTitleClass}>{L('Hangi İhtiyaç İçin?', 'Solutions by Use')}</h2>
              <p className={sectionDescClass}>{L('Kullanım alanınıza özel hazırlanmış enerji çözümleri.', 'Energy solutions prepared for your application.')}</p>
            </div>
            <Link href="/paketler" className="shrink-0 inline-flex items-center gap-1.5 text-sm font-semibold text-brand hover:underline">
              {L('Tüm Paketler', 'All Packages')} <ArrowUpRight className="w-4 h-4" />
            </Link>
          </header>
          <div className="grid grid-cols-3 gap-3 sm:gap-4">
            {PACKAGE_CATEGORIES.map((item, index) => {
              const isWide = index === 3 // Villa — 4. kart, col-span-2
              return (
                <Link
                  key={item.slug}
                  href={`/paketler/${item.slug}`}
                  className={`group relative block rounded-2xl overflow-hidden shadow-sm hover:shadow-lg hover:-translate-y-0.5 transition-all duration-300 touch-manipulation${isWide ? ' col-span-2' : ''}`}
                >
                  <div className={`relative overflow-hidden bg-slate-100 ${isWide ? 'aspect-[8/3]' : 'aspect-[4/3]'}`}>
                    <Image
                      src={item.image}
                      alt={item.imageAlt}
                      fill
                      className="object-cover group-hover:scale-105 transition-transform duration-500"
                      sizes={isWide ? '(max-width: 640px) 66vw, 66vw' : '(max-width: 640px) 33vw, 33vw'}
                      style={{ objectPosition: item.objectPosition ?? 'center center' }}
                    />
                    <div className="absolute inset-0 bg-gradient-to-t from-black/75 via-black/25 to-transparent pointer-events-none" />
                    <div className="absolute bottom-0 left-0 right-0 p-3 sm:p-4">
                      <span className="inline-block text-[9px] font-bold uppercase tracking-widest text-white/55 mb-1">{L('Enerji Paketi', 'Energy Package')}</span>
                      <p className="text-white font-bold text-sm leading-tight">{L(`${item.shortTitle} Paketleri`, `${item.en.shortTitle} Packages`)}</p>
                      <p className="text-white/70 text-xs mt-0.5 line-clamp-2">{L(item.description, item.en.description)}</p>
                      <span className="inline-flex items-center gap-1 text-white/80 text-xs mt-2 font-semibold">
                        {L('İncele', 'View')} <ArrowRight className="w-3 h-3" />
                      </span>
                    </div>
                  </div>
                </Link>
              )
            })}
          </div>
        </div>
      </section>

      {/* ─── 7. KATEGORİLER (9 ana kategori) ──────────────────────────────── */}
      <CategoryShowcase />

      {/* ─── 8. TEKLİF BANDI — ana sayfanın son bölümü (voltekno.com görsel düzeni) ─── */}
      <QuoteBanner />
    </div>
  )
}
