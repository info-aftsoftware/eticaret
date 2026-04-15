import React from 'react'
import Link from 'next/link'
import Image from 'next/image'
import type { Metadata } from 'next'
import { ArrowRight, Clock } from 'lucide-react'

export const metadata: Metadata = {
  title: 'Blog – Enerji Rehberi | Voltekno',
  description: 'Güneş paneli, batarya, EV şarj ve enerji sistemleri hakkında bilgilendirici yazılar, karşılaştırmalar ve kurulum rehberleri.',
  openGraph: {
    title: 'Blog – Enerji Rehberi | Voltekno',
    description: 'Güneş paneli, batarya, EV şarj ve enerji sistemleri hakkında rehber yazılar.',
  },
}

const BLOG_CATEGORIES = [
  { label: 'Tümü', value: 'all' },
  { label: 'EV Şarj', value: 'ev-sarj' },
  { label: 'Güneş Enerjisi', value: 'gunes-enerjisi' },
  { label: 'Batarya', value: 'batarya' },
  { label: 'İnverter', value: 'inverter' },
  { label: 'GES', value: 'ges' },
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
    image: '/images/categories/sarj.png',
    accent: 'bg-blue-600',
  },
  {
    slug: 'gunes-paneli-verimlilik',
    title: 'Güneş Paneli Verimi Nasıl Hesaplanır?',
    desc: 'Panel gücü, yıllık üretim tahmini ve yatırım geri dönüş süresi. Monokristal ve polikristal panel farkları.',
    category: 'Güneş Enerjisi',
    categorySlug: 'gunes-enerjisi',
    readTime: '8 dk',
    image: '/images/categories/panel.png',
    accent: 'bg-orange-500',
  },
  {
    slug: 'lityum-vs-kursum-asit',
    title: 'Lityum mu, Kurşun Asit mi? Kapsamlı Akü Karşılaştırması',
    desc: 'Fiyat, ömür, derinlik deşarj ve kullanım senaryolarına göre lityum LiFePO4 ile kurşun asit akü karşılaştırması.',
    category: 'Batarya',
    categorySlug: 'batarya',
    readTime: '7 dk',
    image: '/images/categories/batarya.png',
    accent: 'bg-emerald-600',
  },
  {
    slug: 'hibrit-inverter-nedir',
    title: 'Hibrit İnverter Nedir, Off-Grid ile Farkı Ne?',
    desc: 'Hibrit ve off-grid inverter arasındaki temel farklar, hangi sistemde hangisi kullanılır, fiyat ve kurulum karşılaştırması.',
    category: 'İnverter',
    categorySlug: 'inverter',
    readTime: '5 dk',
    image: '/images/ges/solar-hero-premium.png',
    accent: 'bg-violet-600',
  },
  {
    slug: 'ges-nasil-kurulur',
    title: 'Çatı GES Kurulumu: Baştan Sona Rehber',
    desc: 'İzin süreçleri, teknik gereksinimler, maliyet hesabı ve geri dönüş süresi. Çatı GES kurulumunda bilmeniz gereken her şey.',
    category: 'GES',
    categorySlug: 'ges',
    readTime: '10 dk',
    image: '/images/ges/solar-prominent.png',
    accent: 'bg-orange-500',
  },
  {
    slug: 'karavan-enerji-paketi',
    title: 'Karavan İçin En İyi Enerji Paketi Nasıl Seçilir?',
    desc: 'Karavan tüketim hesabı, taşınabilir güç istasyonu seçimi, katlanabilir panel alternatifleri ve pratik kurulum önerileri.',
    category: 'Batarya',
    categorySlug: 'batarya',
    readTime: '6 dk',
    image: '/images/packages/custom/karavan.png',
    accent: 'bg-emerald-600',
  },
]

export default function BlogPage() {
  return (
    <div className="min-h-full bg-white">
      {/* Header */}
      <div className="bg-slate-950 pt-14 pb-16 px-4 mt-5 lg:mt-7">
        <div className="container mx-auto max-w-4xl text-center">
          <span className="inline-block text-xs font-bold uppercase tracking-widest text-brand mb-4">Blog</span>
          <h1 className="text-3xl sm:text-4xl md:text-5xl font-extrabold text-white tracking-tight mb-4">
            Enerji Rehberi
          </h1>
          <p className="text-slate-400 text-base sm:text-lg max-w-2xl mx-auto leading-relaxed">
            Güneş paneli, batarya, EV şarj ve enerji sistemleri hakkında bilgilendirici yazılar,
            ürün karşılaştırmaları ve kurulum rehberleri.
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
                {cat.label}
              </span>
            ))}
          </div>
        </div>
      </div>

      {/* Blog posts grid */}
      <div className="py-12 sm:py-16 px-4">
        <div className="container mx-auto max-w-5xl">
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-5 sm:gap-6">
            {BLOG_POSTS.map((post) => (
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
                      {post.category}
                    </span>
                  </div>
                </div>

                <div className="p-5">
                  <div className="flex items-center gap-2 mb-3">
                    <span className="flex items-center gap-1 text-[10px] text-slate-400 font-medium">
                      <Clock className="w-3 h-3" /> {post.readTime} okuma
                    </span>
                  </div>
                  <h2 className="font-bold text-slate-900 text-sm leading-snug mb-2 group-hover:text-brand transition-colors line-clamp-2">
                    {post.title}
                  </h2>
                  <p className="text-xs text-slate-500 leading-relaxed line-clamp-3 mb-4">
                    {post.desc}
                  </p>
                  <span className="inline-flex items-center gap-1.5 text-xs font-bold text-brand group-hover:gap-2.5 transition-all">
                    Okumaya Devam Et <ArrowRight className="w-3 h-3" />
                  </span>
                </div>
              </Link>
            ))}
          </div>

          {/* CTA */}
          <div className="mt-16 text-center rounded-2xl border border-brand/20 bg-brand/5 p-8 sm:p-12">
            <h3 className="text-xl sm:text-2xl font-extrabold text-slate-900 mb-3">
              Sorunuzu Sormak İster misiniz?
            </h3>
            <p className="text-slate-500 text-sm sm:text-base mb-6 max-w-md mx-auto">
              Enerji sistemi seçimi, kurulum veya teklif konularında uzman ekibimize ulaşın.
            </p>
            <div className="flex flex-col sm:flex-row gap-3 justify-center">
              <Link
                href="/contact"
                className="inline-flex items-center justify-center gap-2 rounded-xl bg-brand hover:bg-brand-hover text-white font-bold px-6 py-3 text-sm transition-colors shadow-sm"
              >
                İletişime Geç <ArrowRight className="w-4 h-4" />
              </Link>
              <Link
                href="/ges"
                className="inline-flex items-center justify-center gap-2 rounded-xl border border-slate-300 bg-white hover:bg-slate-50 text-slate-700 font-bold px-6 py-3 text-sm transition-colors"
              >
                Teklif Al
              </Link>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}
