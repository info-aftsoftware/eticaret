import { Metadata } from 'next'
import { localizedMetadata } from '@/lib/locale-metadata'
import Link from 'next/link'
import { ChevronRight } from 'lucide-react'
import { getLocale } from 'next-intl/server'

const SITE_URL = (process.env.NEXT_PUBLIC_SITE_URL || process.env.NEXT_PUBLIC_BASE_URL || 'https://voltekno.com').replace(/\/$/, '')

const trMetadata: Metadata = {
  title: 'Hakkımızda',
  description: 'Voltekno hakkında: misyonumuz, değerlerimiz ve temiz enerji çözümlerindeki uzmanlığımız.',
  alternates: { canonical: '/hakkimizda' },
}

/** Türkçe meta veri (kanonik, SEO) değişmez; İngilizce seçili ziyaretçide başlık ve açıklama İngilizce */
export function generateMetadata(): Promise<Metadata> {
  return localizedMetadata(trMetadata, {
    title: 'About Us',
    description: 'About Voltekno: our mission, our values and our expertise in clean energy solutions.',
  })
}

const stats = [
  { label: { tr: '340+', en: '340+' }, desc: { tr: 'Ürün Çeşidi', en: 'Products' } },
  { label: { tr: 'Faturalı', en: 'Invoiced' }, desc: { tr: 'Üretici garantili satış', en: 'Manufacturer-warranted sales' } },
  { label: { tr: 'En az 2 yıl', en: '2+ years' }, desc: { tr: 'Yasal ürün garantisi', en: 'Statutory product warranty' } },
  { label: { tr: 'Pzt–Cuma', en: 'Mon–Fri' }, desc: { tr: '09:00–18:00 teknik destek', en: '09:00–18:00 technical support' } },
]

const values = [
  {
    title: { tr: 'Garantili Ürünler', en: 'Warranted Products' },
    desc: {
      tr: 'Ürünler faturalı ve üretici/distribütör garantisiyle satılır; garanti süresi ve koşulları ürün sayfasında ve garanti belgesinde belirtilir.',
      en: 'Products are sold with an invoice and the manufacturer/distributor warranty; the warranty period and terms are stated on the product page and the warranty certificate.',
    },
  },
  {
    title: { tr: 'Hızlı Teslimat', en: 'Fast Delivery' },
    desc: {
      tr: 'Siparişler en kısa sürede kargoya verilir. Teslimat süresi siparişin içeriğine ve bölgeye göre değişir.',
      en: 'Orders are shipped as quickly as possible. Delivery time varies depending on the order contents and region.',
    },
  },
  {
    title: { tr: 'Güvenli Kargo', en: 'Safe Shipping' },
    desc: {
      tr: 'Ürünler özel koruyucu ambalaj ile gönderilir. Teslimatta hasar oluşursa tam iade veya yeniden gönderim yapıyoruz.',
      en: 'Products are shipped in special protective packaging. If damage occurs in transit, we offer a full refund or reshipment.',
    },
  },
  {
    title: { tr: 'Teknik Destek', en: 'Technical Support' },
    desc: {
      tr: 'Satış öncesi danışmanlıktan kurulum sonrası teknik desteğe kadar hafta içi 09:00–18:00 arasında telefon, e-posta ve WhatsApp üzerinden yanınızdayız.',
      en: 'From pre-sales advice to post-installation technical support, we are available on weekdays 09:00–18:00 by phone, email and WhatsApp.',
    },
  },
]

export default async function HakkimizdaPage() {
  const locale = await getLocale()
  const L = (tr: string, en: string) => (locale === 'en' ? en : tr)
  // Kurumun tam kaydı ana sayfada (#organization); burada yalnızca sayfa türü ve o kayda bağlantı
  const aboutJsonLd = {
    '@context': 'https://schema.org',
    '@type': 'AboutPage',
    '@id': `${SITE_URL}/hakkimizda`,
    url: `${SITE_URL}/hakkimizda`,
    name: 'Hakkımızda — Voltekno',
    inLanguage: 'tr',
    isPartOf: { '@id': `${SITE_URL}/#website` },
    about: { '@id': `${SITE_URL}/#organization` },
    mainEntity: { '@id': `${SITE_URL}/#organization` },
  }
  return (
    <div className="min-h-screen bg-surface">
      <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(aboutJsonLd) }} />

      {/* Breadcrumb + Başlık */}
      <div className="bg-surface-elevated border-b border-palette">
        <div className="container mx-auto max-w-7xl px-4 sm:px-6 lg:px-8 py-4">
          <nav className="flex items-center gap-2 text-xs font-medium text-ink-muted mb-2" aria-label="Breadcrumb">
            <Link href="/" className="hover:text-brand transition-colors">{L('Ana Sayfa', 'Home')}</Link>
            <ChevronRight className="w-3.5 h-3.5 text-ink-muted" />
            <span className="text-ink font-semibold">{L('Hakkımızda', 'About Us')}</span>
          </nav>
          <h1 className="text-2xl md:text-3xl font-bold text-ink uppercase tracking-tight">{L('Hakkımızda', 'About Us')}</h1>
          <p className="mt-1 text-sm text-ink-muted">{L('Voltekno — Temiz Enerji Çözümlerinde Güvenilir Adresiniz', 'Voltekno — Your Trusted Source for Clean Energy Solutions')}</p>
        </div>
      </div>

      <div className="container mx-auto max-w-7xl px-4 sm:px-6 lg:px-8 py-8 md:py-12">

        {/* Hikaye bölümü */}
        <div className="max-w-4xl mx-auto bg-surface-elevated rounded-2xl border border-palette shadow-sm p-8 md:p-12 mb-10">
          <h2 className="text-2xl font-bold text-ink mb-4">{L('Biz Kimiz?', 'Who We Are')}</h2>
          <p className="text-ink-muted leading-relaxed mb-4">
            {L(
              'Voltekno, güneş enerji sistemleri, inverterler, akü ve batarya depolama çözümleri ile elektrikli araç şarj ekipmanları alanında uzmanlaşmış bir e-ticaret platformudur. Temiz ve yenilenebilir enerji teknolojilerine kolay, güvenilir ve uygun maliyetli erişim sağlamak amacıyla kurulduk.',
              'Voltekno is an e-commerce platform specializing in solar energy systems, inverters, battery and energy storage solutions, and electric vehicle charging equipment. We were founded to provide easy, reliable and affordable access to clean and renewable energy technologies.'
            )}
          </p>
          <p className="text-ink-muted leading-relaxed mb-4">
            {L(
              'Kurumsal müşterilerden bireysel kullanıcılara, çiftçilerden enerji danışmanlık şirketlerine kadar geniş bir yelpazede hizmet veriyoruz. Güneş paneli ve inverter seçiminde teknik danışmanlıktan, hazır enerji paketlerine; EV şarj ürünü seçiminden GES (güneş enerji santrali) hesaplama araçlarına kadar kapsamlı bir ekosistem sunuyoruz.',
              'We serve a wide range of customers, from businesses to individual users and from farmers to energy consulting firms. We offer a comprehensive ecosystem: from technical consulting on solar panel and inverter selection to ready-made energy packages, and from EV charger selection to solar power plant (GES) calculation tools.'
            )}
          </p>
          <p className="text-ink-muted leading-relaxed">
            {L(
              'Misyonumuz; doğru ürünü, doğru fiyatla ve güvenilir hizmet anlayışıyla müşterilerimize ulaştırmaktır. Her satın alma kararınızın arkasında teknik bilgi, kalite ve sorumluluk olduğuna inanıyoruz.',
              'Our mission is to deliver the right product to our customers at the right price, with reliable service. We believe every purchase decision should be backed by technical knowledge, quality and responsibility.'
            )}
          </p>
        </div>

        {/* İstatistikler */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-10">
          {stats.map(({ label, desc }) => (
            <div key={desc.tr} className="bg-surface-elevated rounded-2xl border border-palette shadow-sm p-6 flex flex-col items-center text-center">
              <span className="text-3xl font-bold text-ink">{L(label.tr, label.en)}</span>
              <span className="text-sm text-ink-muted mt-1">{L(desc.tr, desc.en)}</span>
            </div>
          ))}
        </div>

        {/* Neden Voltekno */}
        <div className="max-w-4xl mx-auto mb-10">
          <h2 className="text-2xl font-bold text-ink mb-6 text-center">{L('Neden Voltekno?', 'Why Voltekno?')}</h2>
          <div className="grid sm:grid-cols-2 gap-5">
            {values.map(({ title, desc }) => (
              <div key={title.tr} className="bg-surface-elevated rounded-2xl border border-palette shadow-sm p-6 flex gap-4">
                <div>
                  <h3 className="font-bold text-ink mb-1">{L(title.tr, title.en)}</h3>
                  <p className="text-sm text-ink-muted leading-relaxed">{L(desc.tr, desc.en)}</p>
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Değerlerimiz */}
        <div className="max-w-4xl mx-auto bg-surface-elevated rounded-2xl border border-palette shadow-sm p-8 md:p-12 mb-10">
          <h2 className="text-2xl font-bold text-ink mb-4">{L('Değerlerimiz', 'Our Values')}</h2>
          <ul className="space-y-3 text-ink-muted">
            <li className="flex items-start gap-3">
              <span className="w-2 h-2 rounded-full bg-brand mt-2 shrink-0" />
              <span><strong className="text-ink">{L('Şeffaflık:', 'Transparency:')}</strong> {L('Ürün bilgileri, fiyatlar ve teslimat koşulları konusunda her zaman açık ve dürüsttük.', 'We are always open and honest about product information, prices and delivery terms.')}</span>
            </li>
            <li className="flex items-start gap-3">
              <span className="w-2 h-2 rounded-full bg-brand mt-2 shrink-0" />
              <span><strong className="text-ink">{L('Uzmanlık:', 'Expertise:')}</strong> {L('Teknik danışmanlık ekibimiz, doğru ürünü seçmeniz için her aşamada destek verir.', 'Our technical consulting team supports you at every step to help you choose the right product.')}</span>
            </li>
            <li className="flex items-start gap-3">
              <span className="w-2 h-2 rounded-full bg-brand mt-2 shrink-0" />
              <span><strong className="text-ink">{L('Sürdürülebilirlik:', 'Sustainability:')}</strong> {L('Temiz enerjiyi yaygınlaştırarak hem bireysel hem toplumsal tasarruf ve çevre katkısına öncülük ediyoruz.', 'By spreading clean energy, we lead the way in individual and community savings and environmental benefit.')}</span>
            </li>
            <li className="flex items-start gap-3">
              <span className="w-2 h-2 rounded-full bg-brand mt-2 shrink-0" />
              <span><strong className="text-ink">{L('Müşteri Odaklılık:', 'Customer Focus:')}</strong> {L('Her şikayeti, öneriyi ve soruyu dikkatle değerlendiriyor; hizmetimizi sürekli iyileştiriyoruz.', 'We carefully consider every complaint, suggestion and question, and continuously improve our service.')}</span>
            </li>
          </ul>
        </div>

        {/* İletişime Geç CTA */}
        <div className="max-w-4xl mx-auto rounded-2xl bg-brand px-8 py-10 text-center">
          <h2 className="text-xl md:text-2xl font-bold text-white mb-2">{L('Bizimle İletişime Geçin', 'Get in Touch With Us')}</h2>
          <p className="text-white/80 text-sm mb-6 max-w-lg mx-auto">
            {L(
              'Ürün seçimi, teknik danışmanlık veya toplu satın alma talepleri için ekibimiz size yardımcı olmaktan memnuniyet duyar.',
              'Our team will be happy to help with product selection, technical consulting or bulk purchase requests.'
            )}
          </p>
          <Link
            href="/contact"
            className="inline-flex items-center gap-2 bg-white text-brand font-bold px-6 py-3 rounded-xl hover:bg-white/90 transition-colors text-sm"
          >
            {L('İletişime Geç', 'Contact Us')}
            <ChevronRight className="w-4 h-4" />
          </Link>
        </div>

      </div>
    </div>
  )
}
