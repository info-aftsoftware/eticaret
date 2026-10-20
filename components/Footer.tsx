'use client'

import React from 'react'
import Link from 'next/link'
import { PAGE_CONTAINER } from '@/lib/page-container'
import { useTranslations } from 'next-intl'
import { useL } from '@/lib/i18n-inline'
import { Mail, Phone, MapPin } from 'lucide-react'
import { Logo } from './Logo'
import { PaymentBadges } from './PaymentBadges'
import { LocaleCurrencySwitcher } from './LocaleCurrencySwitcher'
import { SELLER } from '@/lib/legal/company'
import { whatsappHref, WhatsAppIcon } from '@/components/WhatsAppButton'
import { legalHref } from '@/lib/legal/documents'
import Image from 'next/image'

/** ETBİS site doğrulama bağlantısı (ETBİS panelindeki doğrulama kodu / karekod adresi) */
const ETBIS_URL = process.env.NEXT_PUBLIC_ETBIS_VERIFY_URL

export function Footer() {
  const t = useTranslations('footer')
  const L = useL()
  const currentYear = new Date().getFullYear()

  const headingClass = 'text-[#121926] font-semibold text-[11px] uppercase tracking-widest mb-4'
  const linkClass = 'text-[#3b4a5a] text-sm py-1.5 block hover:text-[#0b2540] transition-colors'

  return (
    <footer className="bg-[#f5f7fa] border-t border-[#e6ebf1] text-[#5d6e80] pb-safe">

      {/* Ana içerik */}
      <div className={`${PAGE_CONTAINER} pt-12 pb-8`}>
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-12 gap-8 lg:gap-6">

          {/* Kolon 1: Marka + iletişim (4 col) */}
          <div className="sm:col-span-2 lg:col-span-4 space-y-5">
            <div className="flex items-center w-fit">
              <Logo size="lg" href="/" align="center" />
            </div>

            <p className="text-sm text-[#5d6e80] leading-relaxed">
              {t('aboutDesc')}
            </p>

            {/* İletişim bilgileri — logo kolonunda, göze çarpan */}
            <ul className="space-y-3 text-sm">
              <li>
                <a href={SELLER.phoneHref} className="flex items-center gap-3 text-[#20384e] hover:text-[#0b2540] transition-colors group">
                  <span className="w-4 flex items-center justify-center shrink-0">
                    <Phone className="w-3.5 h-3.5 text-[#0b2540]" aria-hidden />
                  </span>
                  <span className="font-semibold">{SELLER.phone}</span>
                </a>
              </li>
              <li>
                <a href={whatsappHref()} target="_blank" rel="noopener noreferrer" className="flex items-center gap-3 text-[#20384e] hover:text-[#0b2540] transition-colors group">
                  <span className="w-4 flex items-center justify-center shrink-0">
                    <WhatsAppIcon className="w-3.5 h-3.5 text-[#25D366]" />
                  </span>
                  <span>{L('WhatsApp ile yazın', 'Chat on WhatsApp')}</span>
                </a>
              </li>
              <li>
                <a href={`mailto:${SELLER.email}`} className="flex items-center gap-3 text-[#20384e] hover:text-[#0b2540] transition-colors group">
                  <span className="w-4 flex items-center justify-center shrink-0">
                    <Mail className="w-3.5 h-3.5 text-[#0b2540]" aria-hidden />
                  </span>
                  <span>{SELLER.email}</span>
                </a>
              </li>
              <li className="flex items-center gap-3 text-[#5d6e80]">
                <span className="w-4 flex items-center justify-center shrink-0">
                  <MapPin className="w-3.5 h-3.5 text-[#0b2540]" aria-hidden />
                </span>
                <span className="text-sm leading-relaxed">{SELLER.address}</span>
              </li>
            </ul>

          </div>

          {/* Kolon 2: Ürünler (2 col) */}
          <div className="lg:col-span-2">
            <h3 className={headingClass}>{t('products')}</h3>
            <ul className="space-y-0">
              {[
                { href: '/products', label: L('Tüm Ürünler', 'All Products') },
                { href: '/category/gunes-paneli', label: L('Güneş Panelleri', 'Solar Panels') },
                { href: '/category/solar-inverter', label: L('Solar İnverterler', 'Solar Inverters') },
                { href: '/category/solar-aku', label: L('Solar Aküler', 'Solar Batteries') },
                { href: '/category/solar-sarj-kontrol', label: L('Şarj Kontrol Cihazları', 'Charge Controllers') },
                { href: '/category/solar-baglanti-ekipmani', label: L('Bağlantı Ekipmanı ve Aksesuar', 'Connection & Accessories') },
                { href: '/paketler', label: L('Enerji Paketleri', 'Energy Packages') },
              ].map((item) => (
                <li key={item.href}>
                  <Link href={item.href} className={linkClass}>{item.label}</Link>
                </li>
              ))}
            </ul>
          </div>

          {/* Kolon 3: Hizmetler (2 col) */}
          <div className="lg:col-span-2">
            <h3 className={headingClass}>{L('Hizmetler', 'Services')}</h3>
            <ul className="space-y-0">
              {[
                { href: '/ges', label: t('ges'), highlight: true },
                { href: '/ges/teklif-dogrulama', label: t('gesQuoteVerify') },
                { href: '/contact', label: t('teklifAl') },
                { href: '/contact', label: L('Teknik Destek', 'Technical Support') },
                { href: '/paketler', label: L('Hazır Paketler', 'Ready Packages') },
                { href: '/products?q=sulama', label: L('Sulama Çözümleri', 'Irrigation Solutions') },
              ].map((item) => (
                <li key={item.href + item.label}>
                  <Link
                    href={item.href}
                    className={item.highlight
                      ? 'text-yellow-400 hover:text-yellow-300 text-sm py-1.5 block transition-colors flex items-center gap-1.5 font-semibold'
                      : linkClass
                    }
                  >
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
                <Link href="/siparis-takip" className={linkClass}>{t('orderTracking')}</Link>
              </li>
            </ul>
          </div>

          {/* Kolon 5: Kurumsal (2 col) */}
          <div className="lg:col-span-2">
            <h3 className={headingClass}>{L('Sözleşmeler', 'Legal')}</h3>
            <ul className="space-y-0">
              {[
                { href: legalHref('mesafeli-satis-sozlesmesi'), label: L('Mesafeli Satış Sözleşmesi', 'Distance Sales Agreement') },
                { href: legalHref('on-bilgilendirme-formu'), label: L('Ön Bilgilendirme Formu', 'Pre-Information Form') },
                { href: legalHref('gizlilik-ve-cerez-politikasi'), label: L('Gizlilik ve Çerez Politikası', 'Privacy & Cookie Policy') },
                { href: legalHref('kvkk'), label: L('KVKK Aydınlatma Metni', 'Personal Data (KVKK) Notice') },
                { href: legalHref('acik-riza-metni'), label: L('Açık Rıza Metni', 'Explicit Consent') },
                { href: legalHref('ticari-elektronik-ileti-onayi'), label: L('Ticari Elektronik İleti Onayı', 'Commercial Message Consent') },
                { href: legalHref('uyelik-ve-kullanim-kosullari'), label: L('Üyelik ve Kullanım Koşulları', 'Membership & Terms of Use') },
                { href: '/hakkimizda', label: t('about') },
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
      <div className="border-t border-[#e6ebf1]">
        <div className={`${PAGE_CONTAINER} py-4 flex flex-col lg:flex-row justify-between items-center gap-3`}>
          <div className="text-xs text-[#5d6e80] space-y-0.5 text-center sm:text-left">
            <p>© {currentYear} Voltekno · {SELLER.shortLegalName} {t('copyright')}</p>
            <p>
              MERSİS: {SELLER.mersisNo} · {SELLER.taxOffice} / VKN {SELLER.taxNo} · KEP: {SELLER.kep}
            </p>
            {ETBIS_URL && (
              <p>
                <a href={ETBIS_URL} target="_blank" rel="noopener noreferrer" className="inline-flex items-center gap-1.5 text-[#3b4a5a] hover:text-[#0b2540]">
                  {L('ETBİS\'e kayıtlıdır — doğrula', 'Registered with ETBİS — verify')}
                </a>
              </p>
            )}
          </div>
          <PaymentBadges className="justify-center" />
          <LocaleCurrencySwitcher />
          <nav className="flex flex-wrap justify-center gap-x-5 gap-y-1 text-xs">
            {[
              { href: legalHref('gizlilik-ve-cerez-politikasi'), labelKey: 'privacy' as const },
              { href: legalHref('uyelik-ve-kullanim-kosullari'), labelKey: 'terms' as const },
              { href: legalHref('gizlilik-ve-cerez-politikasi'), labelKey: 'cookies' as const },
            ].map((item) => (
              <Link key={item.labelKey} href={item.href} className="text-[#5d6e80] hover:text-[#121926] transition-colors">
                {t(item.labelKey)}
              </Link>
            ))}
          </nav>
        </div>
      </div>

    </footer>
  )
}
