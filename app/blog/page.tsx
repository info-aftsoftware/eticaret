import React from 'react'
import Link from 'next/link'
import type { Metadata } from 'next'
import { ArrowRight, Zap, Sun, Battery, Cpu, Clock } from 'lucide-react'

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

const BLOG_POSTS = [
  {
    slug: 'ev-sarj-istasyonu-secimi',
    title: 'Ev için EV Şarj İstasyonu Nasıl Seçilir?',
    desc: 'AC ve DC şarj farkları, güç seviyeleri ve ev elektrik altyapısına uygunluk rehberi. Hangi şarj istasyonu ne kadar hız sağlar?',
    category: 'EV Şarj',
    categorySlug: 'ev-sarj',
    readTime: '6 dk',
    icon: Zap,
    iconBg: 'bg-blue-50',
    iconColor: 'text-blue-500',
    comingSoon: true,
  },
  {
    slug: 'gunes-paneli-verimlilik',
    title: 'Güneş Paneli Verimi Nasıl Hesaplanır?',
    desc: 'Panel gücü, yıllık üretim tahmini ve yatırım geri dönüş süresi. Monokristal ve polikristal panel farkları.',
    category: 'Güneş Enerjisi',
    categorySlug: 'gunes-enerjisi',
    readTime: '8 dk',
    icon: Sun,
    iconBg: 'bg-orange-50',
    iconColor: 'text-orange-500',
    comingSoon: true,
  },
  {
    slug: 'lityum-vs-kursum-asit',
    title: 'Lityum mu, Kurşun Asit mi? Kapsamlı Akü Karşılaştırması',
    desc: 'Fiyat, ömür, derinlik deşarj ve kullanım senaryolarına göre lityum LiFePO4 ile kurşun asit akü karşılaştırması.',
    category: 'Batarya',
    categorySlug: 'batarya',
    readTime: '7 dk',
    icon: Battery,
    iconBg: 'bg-emerald-50',
    iconColor: 'text-emerald-500',
    comingSoon: true,
  },
  {
    slug: 'hibrit-inverter-nedir',
    title: 'Hibrit İnverter Nedir, Off-Grid ile Farkı Ne?',
    desc: 'Hibrit ve off-grid inverter arasındaki temel farklar, hangi sistemde hangisi kullanılır, fiyat ve kurulum karşılaştırması.',
    category: 'İnverter',
    categorySlug: 'inverter',
    readTime: '5 dk',
    icon: Cpu,
    iconBg: 'bg-violet-50',
    iconColor: 'text-violet-500',
    comingSoon: true,
  },
  {
    slug: 'ges-nasil-kurulur',
    title: 'Çatı GES Kurulumu: Baştan Sona Rehber',
    desc: 'İzin süreçleri, teknik gereksinimler, maliyet hesabı ve geri dönüş süresi. Çatı GES kurulumunda bilmeniz gereken her şey.',
    category: 'GES',
    categorySlug: 'ges',
    readTime: '10 dk',
    icon: Sun,
    iconBg: 'bg-orange-50',
    iconColor: 'text-orange-500',
    comingSoon: true,
  },
  {
    slug: 'karavan-enerji-paketi',
    title: 'Karavan İçin En İyi Enerji Paketi Nasıl Seçilir?',
    desc: 'Karavan tüketim hesabı, taşınabilir güç istasyonu seçimi, katlanabilir panel alternatifleri ve pratik kurulum önerileri.',
    category: 'Batarya',
    categorySlug: 'batarya',
    readTime: '6 dk',
    icon: Battery,
    iconBg: 'bg-emerald-50',
    iconColor: 'text-emerald-500',
    comingSoon: true,
  },
]

export default function BlogPage() {
  return (
    <div className="min-h-full bg-white">
      {/* Header */}
      <div className="bg-slate-950 pt-12 pb-16 px-4">
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


      {/* Category filter - static display */}
      <div className="border-b border-slate-200 bg-white sticky top-0 z-10 px-4">
        <div className="container mx-auto max-w-5xl">
          <div className="flex gap-2 overflow-x-auto py-3 scrollbar-none">
            {BLOG_CATEGORIES.map((cat) => (
              <span
                key={cat.value}
                className={`shrink-0 rounded-xl px-4 py-2 text-xs font-bold transition-all cursor-default ${
                  cat.value === 'all'
                    ? 'bg-brand text-white'
                    : 'bg-slate-100 text-slate-600'
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
            {BLOG_POSTS.map((post) => {
              const Icon = post.icon
              return (
                <Link
                  key={post.slug}
                  href={`/blog/${post.slug}`}
                  className="group rounded-2xl border border-slate-200 bg-white shadow-sm hover:shadow-lg hover:-translate-y-1 transition-all duration-300 overflow-hidden block"
                >
                  <div className={`h-44 ${post.iconBg} flex flex-col items-center justify-center gap-3 relative`}>
                    <Icon className={`w-14 h-14 ${post.iconColor} opacity-40`} />
                  </div>

                  <div className="p-5">
                    <div className="flex items-center gap-2 mb-3">
                      <span className="text-[10px] font-bold uppercase tracking-widest bg-brand/10 text-brand rounded-lg px-2.5 py-1">
                        {post.category}
                      </span>
                      <span className="flex items-center gap-1 text-[10px] text-slate-400 font-medium">
                        <Clock className="w-3 h-3" /> {post.readTime}
                      </span>
                    </div>
                    <h2 className="font-bold text-slate-900 text-sm leading-snug mb-2 group-hover:text-brand transition-colors line-clamp-2">
                      {post.title}
                    </h2>
                    <p className="text-xs text-slate-500 leading-relaxed line-clamp-3 mb-4">
                      {post.desc}
                    </p>
                    <span className="inline-flex items-center gap-1.5 text-xs font-bold text-brand">
                      Okumaya Devam Et <ArrowRight className="w-3 h-3" />
                    </span>
                  </div>
                </Link>
              )
            })}
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
