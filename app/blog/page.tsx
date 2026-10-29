import React from 'react'
import { BreadcrumbJsonLd } from '@/components/seo/BreadcrumbJsonLd'
import { DEFAULT_OG_IMAGE } from '@/lib/seo/og'
import Link from 'next/link'
import Image from 'next/image'
import type { Metadata } from 'next'
import { localizedMetadata } from '@/lib/locale-metadata'
import { ArrowRight, Clock } from 'lucide-react'
import { getLocale } from 'next-intl/server'
import { BLOG_POSTS_EN } from '@/lib/blog-posts-en'

const trMetadata: Metadata = {
  title: 'Blog – Enerji Rehberi',
  description: 'Güneş paneli, batarya, EV şarj ve enerji sistemleri hakkında bilgilendirici yazılar, karşılaştırmalar ve kurulum rehberleri.',
  alternates: { canonical: '/blog' },
  openGraph: {
    images: [DEFAULT_OG_IMAGE],
    title: 'Blog – Enerji Rehberi | Voltekno',
    description: 'Güneş paneli, batarya, EV şarj ve enerji sistemleri hakkında rehber yazılar.',
  },
}

/** Türkçe meta veri (kanonik, SEO) değişmez; İngilizce seçili ziyaretçide başlık ve açıklama İngilizce */
export function generateMetadata(): Promise<Metadata> {
  return localizedMetadata(trMetadata, {
    title: 'Blog – Energy Guide',
    description: 'Informative articles, comparisons and installation guides on solar panels, batteries, EV charging and energy systems.',
    shareTitle: 'Blog – Energy Guide | Voltekno',
    shareDescription: 'Guides on solar panels, batteries, EV charging and energy systems.',
  })
}

const BLOG_CATEGORIES = [
  { label: { tr: 'Tümü', en: 'All' }, value: 'all' },
  { label: { tr: 'EV Şarj', en: 'EV Charging' }, value: 'ev-sarj' },
  { label: { tr: 'Güneş Enerjisi', en: 'Solar Energy' }, value: 'gunes-enerjisi' },
  { label: { tr: 'Batarya', en: 'Batteries' }, value: 'batarya' },
  { label: { tr: 'İnverter', en: 'Inverters' }, value: 'inverter' },
  { label: { tr: 'GES', en: 'Solar PV Systems' }, value: 'ges' },
]

const BLOG_POSTS: {
  slug: string
  title: string
  desc: string
  category: string
  categorySlug: string
  readTime: string
  image: string
  accent: string
}[] = [
  {
    slug: 'ev-sarj-istasyonu-secimi',
    title: 'Ev için EV Şarj İstasyonu Nasıl Seçilir?',
    desc: 'AC ve DC şarj farkları, güç seviyeleri ve ev elektrik altyapısına uygunluk rehberi. Hangi şarj istasyonu ne kadar hız sağlar?',
    category: 'EV Şarj',
    categorySlug: 'ev-sarj',
    readTime: '6 dk',
    image: '/images/products/voltekno/1xWJp1WcdJ2j8Dy3YpYNeSV2aIUblX2uV.webp',
    accent: 'bg-blue-600',
  },
  {
    slug: 'gunes-paneli-verimlilik',
    title: 'Güneş Paneli Verimi Nasıl Hesaplanır?',
    desc: 'Panel gücü, yıllık üretim tahmini ve yatırım geri dönüş süresi. Monokristal ve polikristal panel farkları.',
    category: 'Güneş Enerjisi',
    categorySlug: 'gunes-enerjisi',
    readTime: '8 dk',
    image: '/images/categories/panel.webp',
    accent: 'bg-orange-500',
  },
  {
    slug: 'lityum-vs-kursum-asit',
    title: 'Lityum mu, Kurşun Asit mi? Kapsamlı Akü Karşılaştırması',
    desc: 'Fiyat, ömür, derinlik deşarj ve kullanım senaryolarına göre lityum LiFePO4 ile kurşun asit akü karşılaştırması.',
    category: 'Batarya',
    categorySlug: 'batarya',
    readTime: '7 dk',
    image: '/images/categories/batarya.webp',
    accent: 'bg-emerald-600',
  },
  {
    slug: 'hibrit-inverter-nedir',
    title: 'Hibrit İnverter Nedir, Off-Grid ile Farkı Ne?',
    desc: 'Hibrit ve off-grid inverter arasındaki temel farklar, hangi sistemde hangisi kullanılır, fiyat ve kurulum karşılaştırması.',
    category: 'İnverter',
    categorySlug: 'inverter',
    readTime: '5 dk',
    image: '/images/ges/solar-hero-premium.webp',
    accent: 'bg-violet-600',
  },
  {
    slug: 'ges-nasil-kurulur',
    title: 'Çatı GES Kurulumu: Baştan Sona Rehber',
    desc: 'İzin süreçleri, teknik gereksinimler, maliyet hesabı ve geri dönüş süresi. Çatı GES kurulumunda bilmeniz gereken her şey.',
    category: 'GES',
    categorySlug: 'ges',
    readTime: '10 dk',
    image: '/images/ges/solar-prominent.webp',
    accent: 'bg-orange-500',
  },
  {
    slug: 'karavan-enerji-paketi',
    title: 'Karavan İçin En İyi Enerji Paketi Nasıl Seçilir?',
    desc: 'Karavan tüketim hesabı, taşınabilir güç istasyonu seçimi, katlanabilir panel alternatifleri ve pratik kurulum önerileri.',
    category: 'Batarya',
    categorySlug: 'batarya',
    readTime: '6 dk',
    image: '/images/packages/custom/karavan.webp',
    accent: 'bg-emerald-600',
  },
]

export default async function BlogPage() {
  const locale = await getLocale()
  const L = (tr: string, en: string) => (locale === 'en' ? en : tr)
  const categoryLabel = (slug: string, fallback: string) => {
    const cat = BLOG_CATEGORIES.find((c) => c.value === slug)
    return cat ? L(cat.label.tr, cat.label.en) : fallback
  }
  return (
    <div className="min-h-full bg-white">
      <BreadcrumbJsonLd items={[{ name: 'Blog' }]} />
      {/* Header */}
      <div className="bg-[#f5f7fa] border-b border-[#e6ebf1] pt-14 pb-16 px-4 mt-5 lg:mt-7">
        <div className="container mx-auto max-w-4xl text-center">
          <span className="inline-block text-xs font-bold uppercase tracking-widest text-brand mb-4">Blog</span>
          <h1 className="text-3xl sm:text-4xl md:text-5xl font-extrabold text-[#121926] tracking-tight mb-4">
            {L('Enerji Rehberi', 'Energy Guide')}
          </h1>
          <p className="text-[#5d6e80] text-base sm:text-lg max-w-2xl mx-auto leading-relaxed">
            {L(
              'Güneş paneli, batarya, EV şarj ve enerji sistemleri hakkında bilgilendirici yazılar, ürün karşılaştırmaları ve kurulum rehberleri.',
              'Informative articles, product comparisons and installation guides on solar panels, batteries, EV charging and energy systems.'
            )}
          </p>
        </div>
      </div>

      {/* Category filter */}
      <div className="border-b border-slate-200 bg-white sticky top-0 z-10 px-4 shadow-sm">
        <div className="container mx-auto max-w-5xl">
          <div className="flex gap-2 overflow-x-auto py-3 scrollbar-none">
            {BLOG_CATEGORIES.map((cat) => (
              <span
                key={cat.value}
                className={`shrink-0 rounded-full px-4 py-1.5 text-xs font-semibold transition-all cursor-default ${
                  cat.value === 'all'
                    ? 'bg-brand text-white shadow-sm'
                    : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
                }`}
              >
                {L(cat.label.tr, cat.label.en)}
              </span>
            ))}
          </div>
        </div>
      </div>

      {/* Blog posts grid */}
      <div className="py-12 sm:py-16 px-4">
        <div className="container mx-auto max-w-5xl">
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-5 sm:gap-6">
            {BLOG_POSTS.map((tr) => locale === 'en' && BLOG_POSTS_EN[tr.slug] ? { ...tr, ...BLOG_POSTS_EN[tr.slug] } : tr).map((post) => (
              <Link
                key={post.slug}
                href={`/blog/${post.slug}`}
                className="group rounded-2xl border border-slate-200 bg-white shadow-sm hover:shadow-xl hover:-translate-y-1 transition-all duration-300 overflow-hidden block"
              >
                {/* Görsel */}
                <div className="relative aspect-[16/9] overflow-hidden bg-slate-100">
                  <Image
                    src={post.image}
                    alt={post.title}
                    fill
                    sizes="(max-width: 640px) 100vw, (max-width: 1024px) 50vw, 33vw"
                    className="object-cover group-hover:scale-105 transition-transform duration-500"
                  />
                  {/* Gradient overlay */}
                  <div className="absolute inset-0 bg-gradient-to-t from-black/40 via-transparent to-transparent" />
                  {/* Kategori badge — üstte */}
                  <div className="absolute top-3 left-3">
                    <span className={`text-[10px] font-bold uppercase tracking-widest text-white rounded-full px-2.5 py-1 ${post.accent}`}>
                      {categoryLabel(post.categorySlug, post.category)}
                    </span>
                  </div>
                </div>

                <div className="p-5">
                  <div className="flex items-center gap-2 mb-3">
                    <span className="flex items-center gap-1 text-[10px] text-slate-400 font-medium">
                      <Clock className="w-3 h-3" /> {L(`${post.readTime} okuma`, `${post.readTime} read`)}
                    </span>
                  </div>
                  <h2 className="font-bold text-slate-900 text-sm leading-snug mb-2 group-hover:text-brand transition-colors line-clamp-2">
                    {post.title}
                  </h2>
                  <p className="text-xs text-slate-500 leading-relaxed line-clamp-3 mb-4">
                    {post.desc}
                  </p>
                  <span className="inline-flex items-center gap-1.5 text-xs font-bold text-brand group-hover:gap-2.5 transition-all">
                    {L('Okumaya Devam Et', 'Continue Reading')} <ArrowRight className="w-3 h-3" />
                  </span>
                </div>
              </Link>
            ))}
          </div>

          {/* CTA */}
          <div className="mt-16 text-center rounded-2xl border border-brand/20 bg-brand/5 p-8 sm:p-12">
            <h3 className="text-xl sm:text-2xl font-extrabold text-slate-900 mb-3">
              {L('Sorunuzu Sormak İster misiniz?', 'Have a Question?')}
            </h3>
            <p className="text-slate-500 text-sm sm:text-base mb-6 max-w-md mx-auto">
              {L('Enerji sistemi seçimi, kurulum veya teklif konularında uzman ekibimize ulaşın.', 'Reach our expert team about energy system selection, installation or quotes.')}
            </p>
            <div className="flex flex-col sm:flex-row gap-3 justify-center">
              <Link
                href="/contact"
                className="inline-flex items-center justify-center gap-2 rounded-xl bg-brand hover:bg-brand-hover text-white font-bold px-6 py-3 text-sm transition-colors shadow-sm"
              >
                {L('İletişime Geç', 'Contact Us')} <ArrowRight className="w-4 h-4" />
              </Link>
              <Link
                href="/ges"
                className="inline-flex items-center justify-center gap-2 rounded-xl border border-slate-300 bg-white hover:bg-slate-50 text-slate-700 font-bold px-6 py-3 text-sm transition-colors"
              >
                {L('GES Teklifi Al', 'Get a Solar Quote')}
              </Link>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}
