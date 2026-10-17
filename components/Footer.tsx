'use client'

import React from 'react'
import Link from 'next/link'
import { useTranslations } from 'next-intl'
import {
  Mail,
  Phone,
  MapPin,
  ShieldCheck,
  Zap,
} from 'lucide-react'
import { Logo } from './Logo'
import { PaymentBadges } from './PaymentBadges'
import { SELLER } from '@/lib/legal/company'
import { whatsappHref, WhatsAppIcon } from '@/components/WhatsAppButton'
import { legalHref } from '@/lib/legal/documents'
import Image from 'next/image'

/** ETBİS site doğrulama bağlantısı (ETBİS panelindeki doğrulama kodu / karekod adresi) */
const ETBIS_URL = process.env.NEXT_PUBLIC_ETBIS_VERIFY_URL

export function Footer() {
  const t = useTranslations('footer')
  const currentYear = new Date().getFullYear()

  const headingClass = 'text-white/60 font-semibold text-[11px] uppercase tracking-widest mb-4'
  const linkClass = 'text-slate-400 text-sm py-1.5 block hover:text-white transition-colors'

  return (
    <footer className="bg-slate-900 text-slate-400 pb-safe">

      {/* Ana içerik */}
      <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8 pt-12 pb-8">
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-12 gap-8 lg:gap-6">

          {/* Kolon 1: Marka + iletişim (4 col) */}
          <div className="sm:col-span-2 lg:col-span-4 space-y-5">
            {/* Logo — beyaz bg kutusunda net görünür */}
            <div className="bg-white rounded-2xl px-6 py-4 flex items-center justify-center w-fit">
              <Logo size="lg" href="/" align="center" />
            </div>

            <p className="text-sm text-slate-400 leading-relaxed">
              {t('aboutDesc')}
            </p>

            {/* İletişim bilgileri — logo kolonunda, göze çarpan */}
            <ul className="space-y-3 text-sm">
              <li>
                <a href={SELLER.phoneHref} className="flex items-center gap-3 text-slate-300 hover:text-white transition-colors group">
                  <span className="w-8 h-8 rounded-lg bg-white/5 flex items-center justify-center shrink-0 group-hover:bg-brand/20 transition-colors">
                    <Phone className="w-3.5 h-3.5 text-brand" aria-hidden />
                  </span>
                  <span className="font-semibold">{SELLER.phone}</span>
                </a>
              </li>
              <li>
                <a href={whatsappHref()} target="_blank" rel="noopener noreferrer" className="flex items-center gap-3 text-slate-300 hover:text-white transition-colors group">
                  <span className="w-8 h-8 rounded-lg bg-white/5 flex items-center justify-center shrink-0 group-hover:bg-brand/20 transition-colors">
                    <WhatsAppIcon className="w-3.5 h-3.5 text-[#25D366]" />
                  </span>
                  <span>WhatsApp ile yazın</span>
                </a>
              </li>
              <li>
                <a href={`mailto:${SELLER.email}`} className="flex items-center gap-3 text-slate-300 hover:text-white transition-colors group">
                  <span className="w-8 h-8 rounded-lg bg-white/5 flex items-center justify-center shrink-0 group-hover:bg-brand/20 transition-colors">
                    <Mail className="w-3.5 h-3.5 text-brand" aria-hidden />
                  </span>
                  <span>{SELLER.email}</span>
                </a>
              </li>
              <li className="flex items-center gap-3 text-slate-400">
                <span className="w-8 h-8 rounded-lg bg-white/5 flex items-center justify-center shrink-0">
                  <MapPin className="w-3.5 h-3.5 text-brand" aria-hidden />
                </span>
                <span className="text-sm leading-relaxed">{SELLER.address}</span>
              </li>
            </ul>

          </div>

          {/* Kolon 2: Ürünler (2 col) */}
          <div className="lg:col-span-2">
            <h3 className={headingClass}>Ürünler</h3>
            <ul className="space-y-0">
              {[
                { href: '/products', label: 'Tüm Ürünler' },
                { href: '/category/gunes-paneli', label: 'Güneş Panelleri' },
                { href: '/category/solar-inverter', label: 'Solar İnverterler' },
                { href: '/category/solar-aku', label: 'Solar Aküler' },
                { href: '/category/solar-sarj-kontrol', label: 'Şarj Kontrol Cihazları' },
                { href: '/category/solar-baglanti-ekipmani', label: 'Solar Bağlantı Ekipmanı' },
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
                { href: legalHref('iade-ve-cayma-kosullari'), labelKey: 'returns' as const },
                { href: '/contact', labelKey: 'contact' as const },
              ].map((item) => (
                <li key={item.labelKey}>
                  <Link href={item.href} className={linkClass}>{t(item.labelKey)}</Link>
                </li>
              ))}
              <li>
                <Link href="/siparis-takip" className={linkClass}>Sipariş Takibi</Link>
              </li>
            </ul>
          </div>

          {/* Kolon 5: Kurumsal (2 col) */}
          <div className="lg:col-span-2">
            <h3 className={headingClass}>Sözleşmeler</h3>
            <ul className="space-y-0">
              {[
                { href: legalHref('mesafeli-satis-sozlesmesi'), label: 'Mesafeli Satış Sözleşmesi' },
                { href: legalHref('on-bilgilendirme-formu'), label: 'Ön Bilgilendirme Formu' },
                { href: legalHref('gizlilik-ve-cerez-politikasi'), label: 'Gizlilik ve Çerez Politikası' },
                { href: legalHref('kvkk'), label: 'KVKK Aydınlatma Metni' },
                { href: legalHref('acik-riza-metni'), label: 'Açık Rıza Metni' },
                { href: legalHref('ticari-elektronik-ileti-onayi'), label: 'Ticari Elektronik İleti Onayı' },
                { href: legalHref('uyelik-ve-kullanim-kosullari'), label: 'Üyelik ve Kullanım Koşulları' },
                { href: '/hakkimizda', label: 'Hakkımızda' },
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
        <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8 py-4 flex flex-col lg:flex-row justify-between items-center gap-3">
          <div className="text-xs text-slate-500 space-y-0.5 text-center sm:text-left">
            <p>© {currentYear} Voltekno · {SELLER.shortLegalName} {t('copyright')}</p>
            <p>
              MERSİS: {SELLER.mersisNo} · {SELLER.taxOffice} / VKN {SELLER.taxNo} · KEP: {SELLER.kep}
            </p>
            {ETBIS_URL && (
              <p>
                <a href={ETBIS_URL} target="_blank" rel="noopener noreferrer" className="inline-flex items-center gap-1.5 text-slate-400 hover:text-white">
                  <ShieldCheck className="w-3.5 h-3.5" aria-hidden />
                  ETBİS&apos;e kayıtlıdır — doğrula
                </a>
              </p>
            )}
          </div>
          <PaymentBadges className="justify-center" />
          <nav className="flex flex-wrap justify-center gap-x-5 gap-y-1 text-xs">
            {[
              { href: legalHref('gizlilik-ve-cerez-politikasi'), labelKey: 'privacy' as const },
              { href: legalHref('uyelik-ve-kullanim-kosullari'), labelKey: 'terms' as const },
              { href: legalHref('gizlilik-ve-cerez-politikasi'), labelKey: 'cookies' as const },
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
