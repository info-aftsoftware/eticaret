import { Metadata } from 'next'
import { DEFAULT_OG_IMAGE } from '@/lib/seo/og'
import Link from 'next/link'
import { ChevronRight } from 'lucide-react'
import { getLocale } from 'next-intl/server'
import { FAQContent } from './FAQContent'

export const metadata: Metadata = {
  title: 'Sık Sorulan Sorular: Sipariş, Kargo ve Ürünler',
  description: "Voltekno'da sipariş, ödeme, kargo ve teknik konularda sık sorulan sorular: güneş paneli, akü, inverter ve EV şarj hakkında merak ettikleriniz.",
  alternates: { canonical: '/faq' },
  openGraph: {
    images: [DEFAULT_OG_IMAGE],
    title: 'Sık Sorulan Sorular | Voltekno',
    description: 'Sipariş, kargo, ürün ve teknik konularda sık sorulan sorular.',
    type: 'website',
    siteName: 'Voltekno',
  },
}

export default async function FAQPage() {
  const locale = await getLocale()
  const L = (tr: string, en: string) => (locale === 'en' ? en : tr)
  return (
    <div className="min-h-screen bg-surface pb-safe">
      <div className="bg-surface-elevated border-b border-palette">
        <div className="container mx-auto max-w-7xl px-4 sm:px-6 md:px-8 lg:px-8 py-4 md:py-5">
          <nav className="flex items-center gap-2 text-xs font-medium text-ink-muted mb-2 min-h-[44px]" aria-label="Breadcrumb">
            <Link href="/" className="hover:text-brand transition-colors py-2 -my-2 px-1">{L('Ana Sayfa', 'Home')}</Link>
            <ChevronRight className="w-3.5 h-3.5 text-ink-muted" />
            <span className="text-ink font-semibold">{L('Sık Sorulan Sorular', 'Frequently Asked Questions')}</span>
          </nav>
          <h1 className="text-xl sm:text-2xl md:text-3xl font-bold text-ink uppercase tracking-tight">{L('Sık Sorulan Sorular', 'Frequently Asked Questions')}</h1>
          <p className="mt-1 text-sm md:text-base text-ink-muted">{L('Sipariş, kargo, ürünler ve teknik konularda merak ettikleriniz', 'Everything you want to know about orders, shipping, products and technical topics')}</p>
        </div>
      </div>
      <div className="container mx-auto max-w-7xl px-4 sm:px-6 md:px-8 lg:px-8 py-5 sm:py-6 md:py-8">
        <div className="max-w-3xl mx-auto">
          <div className="bg-surface-elevated rounded-xl border border-palette shadow-sm overflow-hidden p-5 sm:p-6 md:p-8">
            <FAQContent />
          </div>
          <div className="mt-6 sm:mt-8 text-center">
            <p className="text-ink-muted mb-4">{L('Sorunuzun cevabını bulamadınız mı?', 'Couldn\'t find the answer to your question?')}</p>
            <Link href="/contact" className="inline-flex items-center gap-2 btn-classic-primary rounded-lg min-h-[44px] px-6 touch-manipulation">
              {L('İletişime Geçin', 'Contact Us')}
            </Link>
          </div>
        </div>
      </div>
    </div>
  )
}
