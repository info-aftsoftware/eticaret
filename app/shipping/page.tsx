import { Metadata } from 'next'
import Link from '@/lib/i18n/navigation'
import { ChevronRight } from 'lucide-react'
import { getLocale } from 'next-intl/server'
import { localizedMetadata } from '@/lib/locale-metadata'

const trMetadata: Metadata = {
  title: 'Kargo ve Teslimat',
  description: 'Voltekno kargo süreleri, desiye göre kargo ücreti, kargo firmaları ve teslimat koşulları.',
  alternates: { canonical: '/shipping' },
}

export function generateMetadata(): Promise<Metadata> {
  return localizedMetadata(trMetadata, {
    title: 'Shipping & Delivery',
    description: 'Voltekno delivery times, shipping fees by volumetric weight (desi), carriers and delivery terms.',
  })
}

export default async function ShippingPage() {
  const locale = await getLocale()
  const L = (tr: string, en: string) => (locale === 'en' ? en : tr)
  return (
    <div className="min-h-screen bg-surface">
      <div className="bg-surface-elevated border-b border-palette">
        <div className="container mx-auto max-w-7xl px-4 sm:px-6 lg:px-8 py-4">
          <nav className="flex items-center gap-2 text-xs font-medium text-ink-muted mb-2" aria-label="Breadcrumb">
            <Link href="/" className="hover:text-brand transition-colors">{L('Ana Sayfa', 'Home')}</Link>
            <ChevronRight className="w-3.5 h-3.5 text-ink-muted" />
            <span className="text-ink font-semibold">{L('Kargo ve Teslimat', 'Shipping & Delivery')}</span>
          </nav>
          <h1 className="text-2xl md:text-3xl font-bold text-ink uppercase tracking-tight">{L('Kargo ve Teslimat', 'Shipping & Delivery')}</h1>
          <p className="mt-1 text-sm text-ink-muted">{L('Siparişiniz güvenle ve hızlıca kapınıza gelsin', 'Get your order delivered to your door safely and quickly')}</p>
        </div>
      </div>

      <div className="container mx-auto max-w-7xl px-4 sm:px-6 lg:px-8 py-6 md:py-8">
        <div className="max-w-3xl mx-auto space-y-6">

          {/* Teslimat Süreleri */}
          <div className="bg-surface-elevated rounded-xl border border-palette shadow-sm p-6 md:p-8">
            <div className="flex items-center gap-3 mb-5">
              <h2 className="text-xl font-bold text-ink">{L('Teslimat Süreleri', 'Delivery Times')}</h2>
            </div>
            <div className="space-y-4">
              <div className="flex gap-3">
                <div>
                  <p className="font-semibold text-ink">{L('Stokta Mevcut Ürünler', 'In-Stock Products')}</p>
                  <p className="text-ink-muted text-sm mt-0.5">{L('Ödeme onayından itibaren kargoya verilir. Kargo firması teslim süresi bölgeye ve siparişe göre değişir; tahmini süre sipariş onay e-postanızda belirtilir.', 'Shipped once payment is confirmed. The carrier delivery time varies by region and order; the estimated time is stated in your order confirmation email.')}</p>
                </div>
              </div>
              <div className="flex gap-3">
                <div>
                  <p className="font-semibold text-ink">{L('Özel Sipariş / Stok Dışı Ürünler', 'Special Order / Out-of-Stock Products')}</p>
                  <p className="text-ink-muted text-sm mt-0.5">{L('Ürünün tedarik süresi sipariş öncesinde size bildirilir. Bu kategorideki ürünlerde standart süre garantisi uygulanmaz.', 'The supply lead time is communicated to you before ordering. Standard delivery time guarantees do not apply to products in this category.')}</p>
                </div>
              </div>
              <div className="flex gap-3">
                <div>
                  <p className="font-semibold text-ink">{L('Büyük / Ağır Ekipmanlar', 'Large / Heavy Equipment')}</p>
                  <p className="text-ink-muted text-sm mt-0.5">{L('Ağır güneş paneli paletleri, büyük batarya sistemleri gibi ürünler özel araçlı kargo ile sevk edilir. Teslimat öncesinde sizi arayarak randevu belirlenebilir.', 'Products such as heavy solar panel pallets and large battery systems are shipped by dedicated freight vehicles. We may call you before delivery to schedule an appointment.')}</p>
                </div>
              </div>
            </div>
            <div className="mt-5 bg-amber-50 border border-amber-200 rounded-lg p-3 text-sm text-amber-800">
              {L(
                'Hafta içi 15:00 öncesi verilen siparişler aynı gün, sonrası ertesi iş günü kargoya verilir; kargoda 1–3 iş günü sürer (hafta sonu hariç). Resmî tatiller iş günü sayılmaz. Stok dışı / özel sipariş ürünlerde süre sipariş öncesi bildirilir.',
                'Orders placed before 15:00 on business days ship the same day, otherwise the next business day; transit takes 1–3 business days (excluding weekends). Public holidays are not business days. Lead times for out-of-stock / made-to-order items are quoted before ordering.'
              )}
            </div>
          </div>

          {/* Kargo Ücreti */}
          <div className="bg-surface-elevated rounded-xl border border-palette shadow-sm p-6 md:p-8">
            <div className="flex items-center gap-3 mb-5">
              <h2 className="text-xl font-bold text-ink">{L('Kargo Ücreti', 'Shipping Fee')}</h2>
            </div>
            <ul className="space-y-2 text-ink-muted text-sm list-disc pl-5">
              <li>{L('Kargo ücreti, sepetinizdeki ürünlerin toplam', 'The shipping fee is calculated based on the total')} <strong className="text-ink">{L('desisine', 'volumetric weight (desi)')}</strong> {L('(hacim ağırlığı: en × boy × yükseklik / 3000 ile kilogramın büyüğü) göre hesaplanır.', 'of the items in your cart (the greater of width × length × height / 3000 and the actual weight in kg).')}</li>
              <li>{L('Her desi aralığı için anlaşmalı firmalar arasından en uygun tarife uygulanır; 30 desi üzerindeki her desi için ücret artar.', 'For each desi range, the most favorable rate among our partner carriers is applied; the fee increases for each desi above 30.')}</li>
              <li>{L('100 desi veya 100 kg üzerindeki gönderilere kargo firmasının ağır yük taşıma bedeli eklenir.', 'Shipments over 100 desi or 100 kg incur the carrier\'s heavy freight surcharge.')}</li>
              <li>{L('Ücrete KDV ve Evrensel Posta Taşıma Bedeli dahildir; tutar sepette ve ödeme adımında gösterilir.', 'The fee includes VAT and the Universal Postal Service Fee; the amount is shown in the cart and at checkout.')}</li>
            </ul>
          </div>

          {/* Kargo Firması */}
          <div className="bg-surface-elevated rounded-xl border border-palette shadow-sm p-6 md:p-8">
            <div className="flex items-center gap-3 mb-5">
              <h2 className="text-xl font-bold text-ink">{L('Kargo Firması ve Paketleme', 'Carriers and Packaging')}</h2>
            </div>
            <p className="text-ink-muted leading-relaxed mb-4">
              {L(
                'Siparişler, anlaşmalı kargo firmalarımız (Sürat Kargo, HepsiJET, HepsiJET XL, Kolay Gelsin, Yurtiçi Kargo, Aras Kargo, PTT) üzerinden gönderilmektedir. Akü ve bataryalarda kargo ücreti teslimat iline göre teklifle belirlenir; ürün sayfasından teklif alabilirsiniz. Bölgeniz ve sipariş ağırlığına göre en uygun firma otomatik seçilir.',
                'Orders are shipped via our partner carriers (Sürat Kargo, HepsiJET, HepsiJET XL, Kolay Gelsin, Yurtiçi Kargo, Aras Kargo, PTT). For batteries, shipping is quoted based on the delivery city; you can request a quote on the product page. The most suitable carrier is selected automatically based on your region and order weight.'
              )}
            </p>
            <p className="text-ink-muted leading-relaxed">
              {L(
                'Ürünler, nakliye sırasında hasara karşı özel koruyucu malzeme ve sağlam dış ambalaj ile paketlenir. Hassas elektronik ekipmanlar (inverterler, akü sistemleri vb.) ek köpük ve balonlu naylon ile desteklenir.',
                'Products are packed with special protective material and sturdy outer packaging to prevent damage in transit. Sensitive electronic equipment (inverters, battery systems, etc.) is further protected with extra foam and bubble wrap.'
              )}
            </p>
          </div>

          {/* Sipariş Takibi */}
          <div className="bg-surface-elevated rounded-xl border border-palette shadow-sm p-6 md:p-8">
            <div className="flex items-center gap-3 mb-5">
              <h2 className="text-xl font-bold text-ink">{L('Sipariş Takibi', 'Order Tracking')}</h2>
            </div>
            <p className="text-ink-muted leading-relaxed">
              {L('Siparişiniz kargoya verildiğinde', 'When your order ships, a tracking number is sent to you by')} <strong>{L('e-posta ve/veya SMS', 'email and/or SMS')}</strong>{L(' ile kargo takip numarası gönderilir. Bu numara ile kargo firmasının web sitesinden veya mobil uygulamasından teslimat durumunu takip edebilirsiniz. Ayrıca hesabınızdan "Siparişlerim" bölümünde güncel sipariş durumuna ulaşabilirsiniz.', '. You can use this number to track the delivery status on the carrier\'s website or mobile app. You can also see your current order status in the "My Orders" section of your account.')}
            </p>
          </div>

          {/* Hasar Durumu */}
          <div className="bg-surface-elevated rounded-xl border border-palette shadow-sm p-6 md:p-8">
            <div className="flex items-center gap-3 mb-5">
              <h2 className="text-xl font-bold text-ink">{L('Hasarlı veya Eksik Teslimat', 'Damaged or Incomplete Delivery')}</h2>
            </div>
            <p className="text-ink-muted leading-relaxed mb-4">
              {L('Teslimat sırasında ürünün hasarlı olduğunu fark ederseniz, ürünü teslim almadan önce kargo görevlisine', 'If you notice that the product is damaged upon delivery, before accepting it you')} <strong>{L('hasar/tutanak tutturmalısınız', 'must have the courier file a damage report')}</strong>{L('. Tutanak olmadan yapılan hasar talepleri değerlendirilemeyebilir.', '. Damage claims made without a report may not be considered.')}
            </p>
            <ol className="list-decimal list-inside text-ink-muted space-y-2">
              <li>{L('Kargo görevlisine hasar tutanağı tutturun ve bir kopyasını alın.', 'Have the courier file a damage report and keep a copy.')}</li>
              <li>{L('Ürünü teslim almaktan kaçınabilir ya da çekinceli teslim alabilirsiniz.', 'You may refuse the delivery or accept it with reservations.')}</li>
              <li>{L('Durumu en kısa sürede', 'Report the issue as soon as possible to')} <strong>info@voltekno.com</strong>{L(' adresine bildirin; tutanak ve fotoğrafları ekleyin.', ', attaching the report and photos.')}</li>
              <li>{L('İnceleme sonucunda hasar teyit edilirse yeni ürün gönderimi veya tam iade yapılır.', 'If the damage is confirmed after review, a replacement is sent or a full refund is issued.')}</li>
            </ol>
          </div>

          {/* Teslimat Adresi */}
          <div className="bg-surface-elevated rounded-xl border border-palette shadow-sm p-6 md:p-8">
            <div className="flex items-center gap-3 mb-5">
              <h2 className="text-xl font-bold text-ink">{L('Teslimat Adresi', 'Delivery Address')}</h2>
            </div>
            <p className="text-ink-muted leading-relaxed">
              {L(
                'Teslimat adresinizi sipariş sırasında veya profil sayfanızdaki adresler bölümünden girebilirsiniz. Kurumsal teslimat için fatura adresi ile teslimat adresi farklı olabilir; sipariş formunda her iki bilgiyi doldurunuz. Sipariş onayından sonra adres değişikliği için lütfen derhal müşteri hizmetleri ile iletişime geçin.',
                'You can enter your delivery address during checkout or in the addresses section of your profile page. For business deliveries, the billing address and delivery address may differ; please fill in both on the order form. To change your address after order confirmation, please contact customer service immediately.'
              )}
            </p>
          </div>

          <div className="text-center pt-2">
            <Link href="/contact" className="text-brand hover:underline font-medium text-sm">
              {L(
                'Kargo ve teslimat hakkında sorularınız için iletişime geçin →',
                'Contact us with any questions about shipping and delivery →'
              )}
            </Link>
          </div>

        </div>
      </div>
    </div>
  )
}
