'use client'

import React, { useMemo, useState, useEffect } from 'react'
import Link from 'next/link'
import Image from 'next/image'
import { Button } from '@/components/ui/button'
import {
  Shield,
  HeadphonesIcon,
  ShoppingBag,
  ArrowUpRight,
  Zap,
  Battery,
  Sun,
  Truck,
  Package,
  FileText,
  CheckCircle2,
  Calculator,
  TrendingUp,
  MapPin,
  ArrowRight,
  Clock,
} from 'lucide-react'
import { ProductCard } from '@/components/ProductCard'
import { mockProducts } from '@/lib/products-mock'
import { PACKAGE_CATEGORIES } from '@/lib/package-categories'
import { useTranslations } from 'next-intl'
import { HeroSlider } from '@/components/home/HeroSlider'
import { BrandStrip } from '@/components/home/BrandStrip'
import type { MockProduct } from '@/lib/products-mock'

/** Banner görseli olmayan kategori kartları için kategorinin öne çıkan ürün görseli */
const CATEGORY_CARD_PRODUCT_IMAGE: Record<string, string | undefined> = mockProducts.reduce((acc, p) => {
  if (p.image && (!acc[p.category] || p.featured)) acc[p.category] = p.image
  return acc
}, {} as Record<string, string | undefined>)

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

const HOW_IT_WORKS = [
  {
    step: '01',
    title: 'İhtiyacını Belirle',
    desc: 'Kullanım senaryonu, tüketim miktarını ve bütçeni belirt. İstersen ücretsiz keşif formumuzu doldur.',
    icon: FileText,
    color: 'bg-brand',
  },
  {
    step: '02',
    title: 'Ürün / Paket Seç',
    desc: 'İhtiyacına özel hazırlanmış paketleri incele ya da ürün kataloğundan doğrudan seçim yap.',
    icon: ShoppingBag,
    color: 'bg-emerald-500',
  },
  {
    step: '03',
    title: 'Kurulum / Teslim',
    desc: 'Siparişin hızla hazırlanır, teknik destek ekibimiz kurulum sürecinde yanında.',
    icon: CheckCircle2,
    color: 'bg-violet-500',
  },
]

const REFERENCE_PROJECTS = [
  {
    title: 'Villa Çatı GES',
    location: 'Muğla',
    capacity: '10 kW',
    type: 'Hibrit Sistem',
    desc: 'Yazlık villa için tam bağımsız enerji çözümü, 3 fazlı hibrit inverter ve lityum batarya.',
    image: '/images/packages/custom/villa.jpg',
    color: 'from-orange-400 to-red-500',
  },
  {
    title: 'Tarımsal Sulama',
    location: 'Adana',
    capacity: '30 kW',
    type: 'Off-Grid Solar',
    desc: 'Şebekesiz tarla sulama sistemi. Kuyu pompası besleme, mevsimlik bağımsız çalışma.',
    image: '/images/packages/custom/tarla.png',
    color: 'from-emerald-500 to-green-600',
  },
  {
    title: 'EV Şarj İstasyonu',
    location: 'İstanbul',
    capacity: '22 kW AC',
    type: 'Ticari EV Şarj',
    desc: 'AVM otoparkı için 8 noktalı çift taraflı AC şarj istasyonu kurulumu.',
    image: '/images/products/voltekno/1xWJp1WcdJ2j8Dy3YpYNeSV2aIUblX2uV.webp',
    color: 'from-blue-500 to-blue-700',
  },
  {
    title: 'Marin Batarya',
    location: 'Antalya',
    capacity: '15 kWh',
    type: 'Marin Sistem',
    desc: 'Tekne için lityum batarya sistemi, düşük voltaj DC dağıtım ve solar şarj regülatörü.',
    image: '/images/packages/custom/marin.jpg',
    color: 'from-sky-500 to-cyan-600',
  },
]

const BLOG_PLACEHOLDER: { slug: string; title: string; desc: string; category: string; image: string; icon: React.ElementType; iconColor: string }[] = [
  {
    slug: 'ev-sarj-istasyonu-secimi',
    title: 'Ev için EV Şarj İstasyonu Nasıl Seçilir?',
    desc: 'AC ve DC şarj farkları, güç seviyeleri ve ev altyapısına uygunluk — satın almadan önce bilinmesi gerekenler.',
    category: 'EV Şarj',
    image: '/images/products/voltekno/1xWJp1WcdJ2j8Dy3YpYNeSV2aIUblX2uV.webp',
    icon: Zap,
    iconColor: 'text-blue-400',
  },
  {
    slug: 'gunes-paneli-verimlilik',
    title: 'Güneş Paneli Verimi Nasıl Hesaplanır?',
    desc: 'Yıllık üretim tahmini, geri dönüş süresi ve panel seçiminde dikkat edilmesi gereken kritik noktalar.',
    category: 'Güneş Enerjisi',
    image: '/images/categories/panel.png',
    icon: Sun,
    iconColor: 'text-orange-400',
  },
  {
    slug: 'lityum-vs-kursum-asit',
    title: 'Lityum mu, Kurşun Asit mi?',
    desc: 'Kullanılabilir kapasite, ömür ve toplam maliyet analizi ile doğru akü seçimi rehberi.',
    category: 'Batarya',
    image: '/images/categories/batarya.png',
    icon: Battery,
    iconColor: 'text-emerald-400',
  },
]

export default function HomePage() {
  const t = useTranslations('home')
  const [allProducts, setAllProducts] = useState(mockProducts)
  const featuredRowProducts = useMemo(() => getFeaturedRowProducts(allProducts), [allProducts])


  useEffect(() => {
    fetch('/api/products')
      .then((res) => res.json())
      .then((data) => { if (Array.isArray(data) && data.length > 0) setAllProducts(data) })
      .catch(() => {})
  }, [])


  const sectionPadding = 'py-8 sm:py-12 md:py-16 lg:py-20'
  const containerClass = 'container mx-auto px-4 sm:px-6 lg:px-8 max-w-[1440px] min-w-0'
  const sectionTitleClass = 'text-xl sm:text-2xl md:text-3xl font-bold text-slate-900 tracking-tight'
  const sectionOverlineClass = 'block text-xs font-semibold uppercase tracking-wider text-slate-500 mb-2'
  const sectionDescClass = 'text-slate-600 text-sm sm:text-base mt-1'

  const faqItems = [
    { q: t('faqQ1'), a: t('faqA1') },
    { q: t('faqQ2'), a: t('faqA2') },
    { q: t('faqQ3'), a: t('faqA3') },
    { q: t('faqQ4'), a: t('faqA4') },
    { q: t('faqQ5'), a: t('faqA5') },
  ]

  const SITE_URL = process.env.NEXT_PUBLIC_SITE_URL || process.env.NEXT_PUBLIC_BASE_URL || 'https://voltekno.com'
  const faqSchema = {
    '@context': 'https://schema.org',
    '@type': 'FAQPage',
    mainEntity: faqItems.map((item) => ({
      '@type': 'Question',
      name: item.q,
      acceptedAnswer: { '@type': 'Answer', text: item.a },
    })),
  }

  return (
    <div className="w-full max-w-full min-w-0 overflow-x-hidden">
      <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(faqSchema) }} />

      {/* ─── 1. HERO SLIDER (voltekno.com yapısı) ─────────────────────────── */}
      <HeroSlider />

      {/* ─── 2. MARKALAR ─────────────────────────────────────────────────── */}
      <BrandStrip />

      {/* ─── 4. POPÜLER ÜRÜNLER ──────────────────────────────────────────── */}
      <section className={`${sectionPadding} min-w-0 opacity-0 animate-section-in animate-section-in-delay-1`} aria-labelledby="popular-products-heading">
        <div className={containerClass}>
          <header className="mb-6 md:mb-8">
            <h2 id="popular-products-heading" className={sectionTitleClass}>
              Popüler Ürünler
            </h2>
            <p className={sectionDescClass}>Müşterilerimizin en çok satın aldığı ürünler.</p>
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
              <h2 id="featured-grid-heading" className={sectionTitleClass}>Öne Çıkan Ürünler</h2>
              <p className={sectionDescClass}>En çok tercih edilen ve en yüksek puanlı ürünler.</p>
            </div>
            <Link href="/products" className="shrink-0 inline-flex items-center gap-1.5 text-sm font-semibold text-brand hover:underline">
              Tüm Ürünler <ArrowUpRight className="w-4 h-4" />
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
              <h2 id="use-cases-heading" className={sectionTitleClass}>Hangi İhtiyaç İçin?</h2>
              <p className={sectionDescClass}>Kullanım alanınıza özel hazırlanmış enerji çözümleri.</p>
            </div>
            <Link href="/paketler" className="shrink-0 inline-flex items-center gap-1.5 text-sm font-semibold text-brand hover:underline">
              Tüm Paketler <ArrowUpRight className="w-4 h-4" />
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
                      <span className="inline-block text-[9px] font-bold uppercase tracking-widest text-white/55 mb-1">Enerji Paketi</span>
                      <p className="text-white font-bold text-sm leading-tight">{item.shortTitle} Paketleri</p>
                      <p className="text-white/70 text-xs mt-0.5 line-clamp-2">{item.description}</p>
                      <span className="inline-flex items-center gap-1 text-white/80 text-xs mt-2 font-semibold">
                        İncele <ArrowRight className="w-3 h-3" />
                      </span>
                    </div>
                  </div>
                </Link>
              )
            })}
          </div>
        </div>
      </section>

      {/* ─── 7. KATEGORİLER ──────────────────────────────────────────────── */}
      <section className={`${sectionPadding} bg-slate-50/60 min-w-0 opacity-0 animate-section-in`} aria-labelledby="main-categories-heading">
        <div className={containerClass}>
          <header className="mb-5 sm:mb-8 md:mb-10">
            <h2 id="main-categories-heading" className={sectionTitleClass}>
              {t('categoriesTitle')}
            </h2>
            <p className={sectionDescClass}>{t('categoriesDesc')}</p>
          </header>

          {/* 5 kategori — flex ile son satır ortalı */}
          <div className="flex flex-wrap justify-center gap-4 sm:gap-5">
            {[
              { href: '/category/gunes-paneli',                title: 'Güneş Paneli',          desc: 'TOPCon, bifacial, esnek ve katlanabilir paneller', image: '/images/categories/panel.png' },
              { href: '/category/solar-inverter',             title: 'Solar İnverter',        desc: 'Akıllı MPPT, hibrit, on-grid ve tam sinüs inverterler', image: '/images/categories/inverter.png' },
              { href: '/category/solar-aku',                  title: 'Solar Akü',             desc: 'Lityum ve jel aküler, güç istasyonları',           image: '/images/categories/batarya.png' },
              { href: '/category/solar-sarj-kontrol',          title: 'Solar Şarj Kontrol',    desc: 'MPPT, PWM ve DC-DC akü şarj cihazları',          image: CATEGORY_CARD_PRODUCT_IMAGE['MPPT Şarj Kontrol Cihazı'], contain: true },
              { href: `/products?category=${encodeURIComponent('Solar Pompa Sürücüsü')}`, title: 'Solar Pompa Sürücüsü', desc: 'Tarımsal sulama için solar pompa sürücüleri', image: CATEGORY_CARD_PRODUCT_IMAGE['Solar Pompa Sürücüsü'], contain: true },
            ].filter((item) => !!item.image).map((item) => (
              <Link
                key={item.href}
                href={item.href}
                className="group relative block rounded-2xl overflow-hidden bg-white border border-slate-200/80 shadow-sm hover:shadow-md hover:-translate-y-0.5 transition-all duration-300 touch-manipulation w-[calc(50%-8px)] sm:w-[calc(33.333%-14px)]"
              >
                <div className={`aspect-[4/3] relative overflow-hidden ${item.contain ? 'bg-white' : 'bg-slate-950'}`}>
                  <Image
                    src={item.image!}
                    alt={item.title}
                    fill
                    className={`${item.contain ? 'object-contain p-4' : 'object-cover'} group-hover:scale-105 transition-transform duration-500`}
                    sizes="(max-width: 640px) 50vw, 33vw"
                  />
                </div>
                <div className="px-3 py-2.5">
                  <h3 className="font-bold text-slate-800 text-sm group-hover:text-brand transition-colors leading-snug mb-0.5">{item.title}</h3>
                  <p className="text-xs text-slate-500 mb-2.5 leading-relaxed">{item.desc}</p>
                  <span className="inline-flex items-center justify-center bg-brand text-white text-xs font-semibold px-4 py-1.5 rounded-lg">İncele</span>
                </div>
              </Link>
            ))}
          </div>
        </div>
      </section>

      {/* ─── 6. NASIL ÇALIŞIR ─────────────────────────────────────────────── */}
      <section className={`${sectionPadding} min-w-0 opacity-0 animate-section-in`} aria-labelledby="how-it-works-heading">
        <div className={containerClass}>
          <header className="text-center mb-10 md:mb-14">
            <span className="block text-xs font-bold uppercase tracking-widest text-brand mb-2">Nasıl Çalışır?</span>
            <h2 id="how-it-works-heading" className="text-xl sm:text-2xl md:text-3xl font-bold text-slate-900 tracking-tight">
              3 Adımda Enerji Çözümü
            </h2>
            <p className="text-slate-500 text-sm sm:text-base mt-2 max-w-xl mx-auto leading-relaxed">
              İhtiyacından siparişe, siparişten teslimat ve kuruluma kadar tüm süreçte yanınızdayız.
            </p>
          </header>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6 md:gap-8">
            {HOW_IT_WORKS.map((item) => {
              const Icon = item.icon
              return (
                <div key={item.step} className="flex flex-col items-center text-center p-6 md:p-8 rounded-2xl bg-white border border-slate-100 shadow-sm hover:shadow-md hover:-translate-y-0.5 transition-all duration-300">
                  <div className={`w-16 h-16 ${item.color} rounded-2xl flex items-center justify-center mb-5 shadow-md`}>
                    <Icon className="w-8 h-8 text-white" />
                  </div>
                  <span className="text-xs font-black text-slate-200 uppercase tracking-widest mb-2">{item.step}</span>
                  <h3 className="text-lg font-bold text-slate-900 mb-3">{item.title}</h3>
                  <p className="text-sm text-slate-500 leading-relaxed">{item.desc}</p>
                </div>
              )
            })}
          </div>
        </div>
      </section>

      {/* ─── 7. TEKLİF AL CTA ─────────────────────────────────────────────── */}
      <section className="relative overflow-hidden min-w-0 opacity-0 animate-section-in" aria-labelledby="quote-cta-heading">
        <div className="bg-gradient-to-br from-slate-900 via-slate-800 to-slate-900 py-14 md:py-20 px-4">
          <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_left,_rgba(255,255,255,0.08)_0%,_transparent_60%)] pointer-events-none" />
          <div className="container mx-auto max-w-3xl text-center relative">
            <h2 id="quote-cta-heading" className="text-xl sm:text-2xl md:text-3xl font-bold text-white tracking-tight mb-4">
              Enerji Faturanızı Düşürmeye<br className="hidden sm:block" /> Hazır mısınız?
            </h2>
            <p className="text-white/80 text-base max-w-xl mx-auto mb-10 leading-relaxed">
              Ücretsiz ön keşif formunu doldurun, size özel teklif hazırlayalım.
              Ya da GES hesaplama aracımızı kullanın.
            </p>
            <div className="flex flex-col sm:flex-row gap-4 justify-center items-center">
              <Button asChild size="lg" className="bg-white text-brand hover:bg-slate-100 font-bold rounded-xl shadow-xl px-8 h-12 w-full sm:w-auto">
                <Link href="/ges" className="flex items-center gap-2">
                  <FileText className="w-4 h-4" />
                  Teklif Al
                </Link>
              </Button>
              <Button asChild size="lg" variant="outline" className="border-white/50 bg-white/10 text-white hover:bg-white/20 hover:border-white font-bold rounded-xl px-8 h-12 w-full sm:w-auto">
                <Link href="/configurator" className="flex items-center gap-2">
                  <Calculator className="w-4 h-4" />
                  Hesapla
                </Link>
              </Button>
            </div>
          </div>
        </div>
      </section>

      {/* ─── 9. REFERANS PROJELER ─────────────────────────────────────────── */}
      <section className={`${sectionPadding} bg-slate-50/60 min-w-0 opacity-0 animate-section-in`} aria-labelledby="reference-projects-heading">
        <div className={containerClass}>
          <header className="mb-8 md:mb-10">
            <span className={sectionOverlineClass}>Başarı Hikayeleri</span>
            <h2 id="reference-projects-heading" className={sectionTitleClass}>Tamamlanan Projelerden</h2>
            <p className={sectionDescClass}>Gerçek projeler, gerçek sonuçlar.</p>
          </header>
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 sm:gap-5">
            {REFERENCE_PROJECTS.map((project) => (
              <div key={project.title} className="group rounded-2xl border border-slate-200 bg-white shadow-sm hover:shadow-xl hover:-translate-y-1 transition-all duration-300 overflow-hidden">
                {/* Image */}
                <div className="relative aspect-[4/3] overflow-hidden">
                  <Image
                    src={project.image}
                    alt={project.title}
                    fill
                    className="object-cover group-hover:scale-105 transition-transform duration-700"
                  />
                  {/* Dark gradient overlay at bottom */}
                  <div className="absolute inset-0 bg-gradient-to-t from-slate-900/70 via-slate-900/20 to-transparent pointer-events-none" />
                  {/* Location badge top-left */}
                  <div className="absolute top-3 left-3 flex items-center gap-1 bg-white/90 backdrop-blur-sm rounded-lg px-2 py-1">
                    <MapPin className="w-3 h-3 text-brand" />
                    <span className="text-[10px] font-bold text-slate-700">{project.location}</span>
                  </div>
                  {/* Capacity badge bottom */}
                  <div className="absolute bottom-3 left-3 right-3 flex flex-wrap gap-1.5">
                    <span className={`text-[10px] font-bold bg-gradient-to-r ${project.color} text-white rounded-md px-2 py-0.5`}>{project.capacity}</span>
                    <span className="text-[10px] font-medium bg-white/90 text-slate-700 rounded-md px-2 py-0.5">{project.type}</span>
                  </div>
                </div>
                {/* Info */}
                <div className="p-4">
                  <h3 className="font-bold text-slate-900 text-sm mb-1.5 group-hover:text-brand transition-colors">{project.title}</h3>
                  <p className="text-xs text-slate-500 leading-relaxed">{project.desc}</p>
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ─── 10. BLOG ─────────────────────────────────────────────────────── */}
      <section className={`${sectionPadding} min-w-0 opacity-0 animate-section-in animate-section-in-delay-1`} aria-labelledby="blog-heading">
        <div className={containerClass}>
          <header className="mb-8 md:mb-10 flex flex-col sm:flex-row sm:items-end sm:justify-between gap-3">
            <div>
              <h2 id="blog-heading" className={sectionTitleClass}>Enerji Rehberi</h2>
              <p className={sectionDescClass}>Bilgilendirici yazılar, ürün karşılaştırmaları ve kurulum rehberleri.</p>
            </div>
            <Link href="/blog" className="shrink-0 inline-flex items-center gap-1.5 text-sm font-semibold text-brand hover:underline">
              Tüm Yazılar <ArrowUpRight className="w-4 h-4" />
            </Link>
          </header>
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 sm:gap-5">
            {BLOG_PLACEHOLDER.map((post) => {
              const Icon = post.icon
              return (
                <Link
                  key={post.slug}
                  href="/blog"
                  className="group rounded-2xl border border-slate-200 bg-white shadow-sm hover:shadow-lg hover:-translate-y-1 transition-all duration-300 overflow-hidden"
                >
                  <div className="relative h-44 overflow-hidden bg-slate-100">
                    <Image
                      src={post.image}
                      alt={post.title}
                      fill
                      className="object-cover group-hover:scale-105 transition-transform duration-500"
                      sizes="(max-width: 640px) 100vw, 33vw"
                    />
                    <div className="absolute inset-0 bg-gradient-to-t from-black/30 via-transparent to-transparent" />
                    <div className="absolute top-3 left-3">
                      <div className="w-8 h-8 rounded-lg bg-white/90 backdrop-blur-sm flex items-center justify-center shadow-sm">
                        <Icon className={`w-4 h-4 ${post.iconColor}`} />
                      </div>
                    </div>
                  </div>
                  <div className="p-5">
                    <div className="flex items-center gap-2 mb-3">
                      <span className="text-[10px] font-bold uppercase tracking-widest bg-brand/10 text-brand rounded-lg px-2.5 py-1">{post.category}</span>
                      <span className="flex items-center gap-1 text-[10px] text-slate-400 font-medium"><Clock className="w-3 h-3" />Yakında</span>
                    </div>
                    <h3 className="font-bold text-slate-900 text-sm leading-snug mb-2 group-hover:text-brand transition-colors line-clamp-2">{post.title}</h3>
                    <p className="text-xs text-slate-500 leading-relaxed line-clamp-3">{post.desc}</p>
                    <span className="mt-4 inline-flex items-center gap-1 text-xs font-bold text-brand group-hover:gap-2 transition-all">
                      Okumaya Devam Et <ArrowRight className="w-3.5 h-3.5" />
                    </span>
                  </div>
                </Link>
              )
            })}
          </div>
        </div>
      </section>

      {/* ─── NEDEN VOLTEKNO — Footer üstü ───────────────────────────────── */}
      <section className="bg-slate-50 min-w-0 opacity-0 animate-section-in" aria-labelledby="why-voltekno-heading">
        <div className="container mx-auto max-w-[1440px] px-6 sm:px-10 lg:px-16 xl:px-20 py-20 lg:py-28">
          <div className="flex flex-col lg:flex-row gap-16 lg:gap-24 items-start">

            {/* Sol — başlık + CTA */}
            <div className="flex-shrink-0 lg:w-[38%] lg:sticky lg:top-24">
              <div className="flex items-center gap-3 mb-8">
                <div className="w-6 h-[2px] bg-brand" />
                <span className="text-[11px] font-bold uppercase tracking-[0.18em] text-brand">Neden Voltekno</span>
              </div>
              <h2 id="why-voltekno-heading" className="text-4xl sm:text-5xl lg:text-[3.2rem] font-black text-slate-900 tracking-[-0.025em] leading-[1.06] mb-8">
                Enerji<br />
                dönüşümünüz<br />
                <span className="text-brand">güvende.</span>
              </h2>
              <p className="text-slate-500 text-base leading-relaxed mb-10 max-w-sm">
                2018'den bu yana 500'ü aşkın kurulum, yüzlerce memnun müşteri ve sıfır taviz politikasıyla Türkiye'nin güvenilir enerji çözüm ortağı.
              </p>
              <Button asChild className="bg-brand hover:bg-brand-hover text-white font-semibold rounded-xl px-7 h-11 text-sm shadow-md shadow-brand/20">
                <Link href="/contact" className="flex items-center gap-2">
                  Bizimle Çalışın <ArrowRight className="w-4 h-4" />
                </Link>
              </Button>
            </div>

            {/* Sağ — özellik kartları */}
            <div className="flex-1 grid grid-cols-1 sm:grid-cols-2 gap-4">
              {[
                {
                  icon: Shield,
                  title: 'Kanıtlanmış Kalite',
                  desc: 'CE, IEC ve EN sertifikalı, Avrupa standartlarında ürün portföyü. Her ürün titizlikle seçilir.',
                  accent: 'text-brand',
                  bg: 'bg-brand/5',
                },
                {
                  icon: HeadphonesIcon,
                  title: '7/24 Teknik Destek',
                  desc: 'Satış öncesi danışmanlıktan kurulum sonrası bakıma kadar uzman ekibimiz her zaman yanınızda.',
                  accent: 'text-emerald-600',
                  bg: 'bg-emerald-50',
                },
                {
                  icon: Truck,
                  title: 'Hızlı & Güvenli Teslimat',
                  desc: 'Türkiye geneli sigortalı kargo, özel paketleme ve takip sistemi ile kapınıza teslim.',
                  accent: 'text-sky-600',
                  bg: 'bg-sky-50',
                },
                {
                  icon: Calculator,
                  title: 'Özel Proje Çözümleri',
                  desc: 'Konuttan endüstriyele, küçük ölçekten büyük GES projelerine kadar her ihtiyaca özel sistem tasarımı.',
                  accent: 'text-violet-600',
                  bg: 'bg-violet-50',
                },
              ].map((item) => {
                const Icon = item.icon
                return (
                  <div key={item.title} className="bg-white rounded-2xl border border-slate-100 shadow-sm hover:shadow-md hover:-translate-y-0.5 transition-all duration-300 p-6 lg:p-7">
                    <div className={`w-11 h-11 ${item.bg} rounded-xl flex items-center justify-center mb-4`}>
                      <Icon className={`w-5 h-5 ${item.accent}`} />
                    </div>
                    <h3 className="text-slate-900 font-bold text-base mb-2">{item.title}</h3>
                    <p className="text-slate-500 text-sm leading-relaxed">{item.desc}</p>
                  </div>
                )
              })}
            </div>
          </div>
        </div>
      </section>

      {/* Sabit iletişim butonu */}
      <Link
        href="/contact"
        className="fixed bottom-safe right-safe z-50 flex items-center gap-2 rounded-2xl bg-brand px-5 py-3.5 text-white font-semibold shadow-lg hover:bg-brand-hover hover:shadow-xl hover:scale-[1.02] active:scale-[0.98] transition-all duration-200 ring-1 ring-black/10"
        aria-label={t('askUsNow')}
      >
        <HeadphonesIcon className="w-5 h-5 shrink-0" aria-hidden />
        <span className="hidden sm:inline">{t('askUsNow')}</span>
      </Link>
    </div>
  )
}
