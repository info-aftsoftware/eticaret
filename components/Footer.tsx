'use client'

import React from 'react'
import Link from 'next/link'
import { useTranslations } from 'next-intl'
import {
  Mail,
  Phone,
  MapPin,
  ShieldCheck,
  Send,
  Zap,
} from 'lucide-react'
import { Logo } from './Logo'
import Image from 'next/image'

function NewsletterForm() {
  const [mounted, setMounted] = React.useState(false)
  const [email, setEmail] = React.useState('')
  const [status, setStatus] = React.useState<'idle' | 'loading' | 'success' | 'error'>('idle')
  const t = useTranslations('footer')

  React.useEffect(() => { setMounted(true) }, [])

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!email.trim() || !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) return
    setStatus('loading')
    try {
      const { collection, addDoc, serverTimestamp } = await import('firebase/firestore')
      const { getDb } = await import('@/lib/firebase/config')
      const db = getDb()
      await addDoc(collection(db, 'newsletter'), {
        email: email.trim().toLowerCase(),
        createdAt: serverTimestamp(),
      })
      setStatus('success')
      setEmail('')
      setTimeout(() => setStatus('idle'), 5000)
    } catch {
      setStatus('error')
    }
  }

  if (status === 'success') {
    return (
      <p className="text-sm text-emerald-300 flex items-center gap-2 py-1">
        <ShieldCheck className="w-4 h-4 shrink-0" />
        {t('newsletterSuccess')}
      </p>
    )
  }

  return (
    <form onSubmit={handleSubmit} className="flex gap-2 max-w-sm w-full">
      <label htmlFor="newsletter-email" className="sr-only">{t('emailPlaceholder')}</label>
      {mounted ? (
        <input
          id="newsletter-email"
          type="email"
          placeholder={t('emailPlaceholder')}
          value={email}
          onChange={(e) => { setEmail(e.target.value); setStatus('idle') }}
          required
          className="flex-1 min-h-[44px] bg-white/10 border border-white/20 rounded-lg px-4 py-2.5 text-sm text-white placeholder:text-white/50 focus:outline-none focus:ring-2 focus:ring-white/40"
        />
      ) : (
        <div className="flex-1 min-h-[44px] bg-white/10 border border-white/20 rounded-lg" aria-hidden />
      )}
      <button
        type="submit"
        disabled={status === 'loading'}
        className="min-h-[44px] bg-white text-brand font-semibold px-4 rounded-lg text-sm hover:bg-white/90 transition-colors disabled:opacity-50 shrink-0 flex items-center gap-1.5 touch-manipulation"
      >
        <Send className="w-3.5 h-3.5" />
        {t('newsletterSubscribe')}
      </button>
      {status === 'error' && (
        <p className="absolute mt-1 text-xs text-red-300">{t('newsletterError')}</p>
      )}
    </form>
  )
}

export function Footer() {
  const t = useTranslations('footer')
  const currentYear = new Date().getFullYear()

  const headingClass = 'text-white/60 font-semibold text-[11px] uppercase tracking-widest mb-4'
  const linkClass = 'text-slate-400 text-sm py-1.5 block hover:text-white transition-colors'

  return (
    <footer className="bg-slate-900 text-slate-400 pb-safe">

      {/* Bülten şeridi */}
      <div className="bg-brand">
        <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8 py-7">
          <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-5">
            <div>
              <h2 className="text-white font-bold text-lg">{t('newsletter')}</h2>
              <p className="text-white/70 text-sm mt-0.5">{t('newsletterDesc')}</p>
            </div>
            <div className="relative">
              <NewsletterForm />
            </div>
          </div>
        </div>
      </div>

      {/* Ana içerik */}
      <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8 pt-12 pb-8">
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-12 gap-8 lg:gap-6">

          {/* Kolon 1: Marka + iletişim (4 col) */}
          <div className="sm:col-span-2 lg:col-span-4 space-y-5">
            {/* Logo — beyaz bg kutusunda net görünür */}
            <div className="bg-white rounded-2xl px-5 py-3 inline-flex items-center justify-center">
              <Logo size="lg" href="/" />
            </div>

            <p className="text-sm text-slate-400 leading-relaxed">
              {t('aboutDesc')}
            </p>

            {/* İletişim bilgileri — logo kolonunda, göze çarpan */}
            <ul className="space-y-3 text-sm">
              <li>
                <a href="tel:+905343288383" className="flex items-center gap-3 text-slate-300 hover:text-white transition-colors group">
                  <span className="w-8 h-8 rounded-lg bg-white/5 flex items-center justify-center shrink-0 group-hover:bg-brand/20 transition-colors">
                    <Phone className="w-3.5 h-3.5 text-brand" aria-hidden />
                  </span>
                  <span className="font-semibold">+90 534 328 83 83</span>
                </a>
              </li>
              <li>
                <a href="mailto:info@voltekno.com" className="flex items-center gap-3 text-slate-300 hover:text-white transition-colors group">
                  <span className="w-8 h-8 rounded-lg bg-white/5 flex items-center justify-center shrink-0 group-hover:bg-brand/20 transition-colors">
                    <Mail className="w-3.5 h-3.5 text-brand" aria-hidden />
                  </span>
                  <span>info@voltekno.com</span>
                </a>
              </li>
              <li className="flex items-center gap-3 text-slate-400">
                <span className="w-8 h-8 rounded-lg bg-white/5 flex items-center justify-center shrink-0">
                  <MapPin className="w-3.5 h-3.5 text-brand" aria-hidden />
                </span>
                <span className="text-sm leading-relaxed">{t('location')}</span>
              </li>
            </ul>

            {/* Ödeme logoları */}
            <div className="pt-1 border-t border-white/5">
              <p className="text-[10px] text-slate-600 uppercase tracking-widest font-semibold mb-2">Güvenli Ödeme</p>
              <Image
                src="/images/payment/logo_band.png"
                alt="Visa, Mastercard, iyzico ile güvenli ödeme"
                width={240}
                height={36}
                className="object-contain max-w-full"
              />
            </div>
          </div>

          {/* Kolon 2: Ürünler (2 col) */}
          <div className="lg:col-span-2">
            <h3 className={headingClass}>Ürünler</h3>
            <ul className="space-y-0">
              {[
                { href: '/products', label: 'Tüm Ürünler' },
                { href: '/category/gunes-enerjisi', label: 'Güneş Panelleri' },
                { href: '/category/batarya-depolama', label: 'Akü & Depolama' },
                { href: '/category/inverterler', label: 'İnverterler' },
                { href: '/category/elektrikli-arac-sarj-urunleri', label: 'EV Şarj' },
                { href: '/paketler', label: 'Enerji Paketleri' },
              ].map((item) => (
                <li key={item.href}>
                  <Link href={item.href} className={linkClass}>{item.label}</Link>
                </li>
              ))}
            </ul>
          </div>

          {/* Kolon 3: Hizmetler (2 col) */}
          <div className="lg:col-span-2">
            <h3 className={headingClass}>Hizmetler</h3>
            <ul className="space-y-0">
              {[
                { href: '/ges', label: 'GES Hesaplama', highlight: true },
                { href: '/ges/teklif-dogrulama', label: 'Teklif Doğrulama' },
                { href: '/contact', label: 'Teklif Al' },
                { href: '/contact', label: 'Teknik Destek' },
                { href: '/paketler', label: 'Hazır Paketler' },
                { href: '/products?q=sulama', label: 'Sulama Çözümleri' },
              ].map((item) => (
                <li key={item.href + item.label}>
                  <Link
                    href={item.href}
                    className={item.highlight
                      ? 'text-yellow-400 hover:text-yellow-300 text-sm py-1.5 block transition-colors flex items-center gap-1.5 font-semibold'
                      : linkClass
                    }
                  >
                    {item.highlight && <Zap className="w-3.5 h-3.5" />}
                    {item.label}
                  </Link>
                </li>
              ))}
            </ul>
          </div>

          {/* Kolon 4: Müşteri Hizmetleri (2 col) */}
          <div className="lg:col-span-2">
            <h3 className={headingClass}>{t('customerService')}</h3>
            <ul className="space-y-0">
              {[
                { href: '/faq', labelKey: 'faq' as const },
                { href: '/shipping', labelKey: 'shipping' as const },
                { href: '/returns', labelKey: 'returns' as const },
                { href: '/contact', labelKey: 'contact' as const },
              ].map((item) => (
                <li key={item.labelKey}>
                  <Link href={item.href} className={linkClass}>{t(item.labelKey)}</Link>
                </li>
              ))}
            </ul>
          </div>

          {/* Kolon 5: Kurumsal (2 col) */}
          <div className="lg:col-span-2">
            <h3 className={headingClass}>Kurumsal</h3>
            <ul className="space-y-0">
              {[
                { href: '/hakkimizda', label: 'Hakkımızda' },
                { href: '/blog', label: 'Blog' },
                { href: '/privacy', label: 'Gizlilik Politikası' },
                { href: '/terms', label: 'Uzaktan Satış Sözleşmesi' },
                { href: '/cookies', label: 'Çerez Politikası' },
              ].map((item) => (
                <li key={item.href + item.label}>
                  <Link href={item.href} className={linkClass}>{item.label}</Link>
                </li>
              ))}
            </ul>
          </div>

        </div>
      </div>

      {/* Alt bar */}
      <div className="border-t border-white/5">
        <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8 py-4 flex flex-col sm:flex-row justify-between items-center gap-3">
          <p className="text-xs text-slate-600">
            © {currentYear} voltekno. {t('copyright')}
          </p>
          <nav className="flex flex-wrap justify-center gap-x-5 gap-y-1 text-xs">
            {[
              { href: '/privacy', labelKey: 'privacy' as const },
              { href: '/terms', labelKey: 'terms' as const },
              { href: '/cookies', labelKey: 'cookies' as const },
            ].map((item) => (
              <Link key={item.labelKey} href={item.href} className="text-slate-600 hover:text-slate-400 transition-colors">
                {t(item.labelKey)}
              </Link>
            ))}
          </nav>
        </div>
      </div>

    </footer>
  )
}
