'use client'

import React from 'react'
import { ChevronDown } from 'lucide-react'
import { useL } from '@/lib/i18n-inline'
import { usePaymentMethods } from '@/lib/usePaymentMethods'

const faqItems = [
  {
    category: { tr: 'Sipariş ve Ödeme', en: 'Orders and Payment' },
    questions: [
      {
        q: { tr: 'Siparişimi nasıl verebilirim?', en: 'How can I place an order?' },
        a: {
          tr: 'Ürün sayfasından sepete ekleyip ödeme adımlarını tamamlayarak sipariş verebilirsiniz. B2B siparişler için lütfen iletişime geçin.',
          en: 'You can place an order by adding products to your cart from the product page and completing the checkout steps. For B2B orders, please contact us.',
        },
      },
      {
        q: { tr: 'Hangi ödeme yöntemlerini kabul ediyorsunuz?', en: 'Which payment methods do you accept?' },
        a: {
          // {ODEME}: açık ödeme yöntemleriyle doldurulur (madde 2: kart kapalıyken kart anlatılmaz)
          tr: '{ODEME} Fatura her müşteri için kesilir; kurumsal siparişlerde vade seçenekleri sunulabilir.',
          en: '{ODEME} An invoice is issued for every customer; deferred payment options may be offered for corporate orders.',
        },
      },
      {
        q: { tr: 'Fatura nasıl düzenleniyor?', en: 'How are invoices issued?' },
        a: {
          tr: 'Bireysel alımlarda e-arşiv fatura, kurumsal alımlarda e-fatura kesiyoruz. Fatura bilgilerini sipariş veya profil sayfasından girebilirsiniz.',
          en: 'We issue e-archive invoices for individual purchases and e-invoices for corporate purchases. You can enter your billing details on the order or profile page.',
        },
      },
    ],
  },
  {
    category: { tr: 'Kargo ve Teslimat', en: 'Shipping and Delivery' },
    questions: [
      {
        q: { tr: 'Kargo süresi ne kadar?', en: 'How long does shipping take?' },
        a: {
          tr: 'Hafta içi 15:00 öncesi verilen siparişler aynı gün, sonrası ertesi iş günü kargoya verilir; kargoda 1–3 iş günü sürer (hafta sonu hariç). Örneğin perşembe sabahı verilen sipariş cuma–salı arası elinizde olur. Tahmini tarih aralığını ürün ve sepet sayfasında da görebilirsiniz.',
          en: 'Orders placed before 15:00 on business days ship the same day, otherwise the next business day; transit takes 1–3 business days (excluding weekends). For example, an order placed Thursday morning arrives between Friday and Tuesday. You can also see the estimated range on the product and cart pages.',
        },
      },
      {
        q: { tr: 'Kargo ücreti ne kadar?', en: 'How much is shipping?' },
        a: {
          tr: 'Kargo ücreti sipariş içeriğine, ağırlığa ve teslimat bölgesine göre belirlenir. Sepet ekranında hesaplanarak gösterilir.',
          en: 'The shipping fee is determined by the order contents, weight and delivery region. It is calculated and shown on the cart page.',
        },
      },
      {
        q: { tr: 'Siparişimi takip edebilir miyim?', en: 'Can I track my order?' },
        a: {
          tr: 'Evet. Sipariş onayı ve kargoya teslim bilgileri e-posta ile paylaşılır. Takip numarasıyla kargo firmasından durum izlenebilir.',
          en: 'Yes. Order confirmation and shipping details are shared by email. You can track the status with the carrier using the tracking number.',
        },
      },
    ],
  },
  {
    category: { tr: 'Ürünler ve Teknik', en: 'Products and Technical' },
    questions: [
      {
        q: { tr: 'GES kurulumu yapıyor musunuz?', en: 'Do you install solar power systems (GES)?' },
        a: {
          tr: 'Evet. GES kurulumu ve kapasite hesaplama desteği sunuyoruz. GES Hesaplama sayfasından ön tahmin alabilir, detay teklif için bizimle iletişime geçebilirsiniz.',
          en: 'Yes. We offer solar power system installation and capacity calculation support. You can get a preliminary estimate on the Solar Calculator page and contact us for a detailed quote.',
        },
      },
      {
        q: { tr: 'Garanti süresi ne kadar?', en: 'How long is the warranty?' },
        a: {
          tr: 'Ürün garantisi: ürünler faturalı ve üretici/distribütör garantisiyle satılır; yasal garanti süresi teslim tarihinden itibaren en az 2 yıldır. Üretici daha uzun ürün garantisi veriyorsa süre ürün sayfasında ve garanti belgesinde yazar. Performans garantisi: güneş panellerinde üreticinin belirli bir süre sonunda taahhüt ettiği güç çıkışıdır (ör. 25 yıl sonunda %80) ve ürün garantisinden ayrıdır. Satış sonrası: arıza ve garanti taleplerinizi iletişim kanallarımızdan iletebilirsiniz; süreç üreticinin garanti koşullarına göre yürütülür.',
          en: 'Product warranty: products are sold with an invoice and the manufacturer/distributor warranty; the statutory warranty is at least 2 years from delivery. Where the manufacturer gives a longer product warranty, the period is stated on the product page and the warranty certificate. Performance warranty: for solar panels, the manufacturer guarantees a minimum power output after a set period (e.g. 80% after 25 years); it is separate from the product warranty. After-sales: send fault and warranty requests through our contact channels; the process follows the manufacturer warranty terms.',
        },
      },
      {
        q: { tr: 'Teknik destek alabilir miyim?', en: 'Can I get technical support?' },
        a: {
          tr: 'Evet. Montaj, kullanım ve güvenlik konularında e-posta veya telefon üzerinden teknik destek sağlanır.',
          en: 'Yes. Technical support on installation, usage and safety is provided by email or phone.',
        },
      },
    ],
  },
  {
    category: { tr: 'İade ve Değişim', en: 'Returns and Exchanges' },
    questions: [
      {
        q: { tr: 'İade koşulları nelerdir?', en: 'What are the return conditions?' },
        a: {
          tr: 'Tüketici mevzuatına uygun olarak teslimattan itibaren 14 gün içinde cayma hakkınızı kullanabilirsiniz. Ürünün kullanılmamış ve orijinal ambalajında olması gerekir.',
          en: 'In accordance with consumer protection law, you can exercise your right of withdrawal within 14 days of delivery. The product must be unused and in its original packaging.',
        },
      },
      {
        q: { tr: 'Arızalı üründe ne yapmalıyım?', en: 'What should I do if a product is defective?' },
        a: {
          tr: 'Garanti kapsamındaki arızalarda bizimle iletişime geçin. Ürün incelenir, gerekiyorsa değişim veya onarım süreci başlatılır.',
          en: 'For defects covered by warranty, please contact us. The product is inspected and, if necessary, a replacement or repair process is started.',
        },
      },
    ],
  },
]

export function FAQContent() {
  const L = useL()
  const { card } = usePaymentMethods()
  const payment = card
    ? L('Kredi kartı ve banka kartı (bankanın 3D Secure ortamında) ile havale/EFT ile ödeme alıyoruz.', 'We accept credit and debit cards (bank 3D Secure) and bank transfer (wire/EFT).')
    : L('Şu anda havale/EFT ile ödeme alıyoruz (havalede %3 indirim); kredi ve banka kartıyla ödeme kullanıma açıldığında ödeme sayfasında görünecek.', 'We currently accept bank transfer (wire/EFT, 3% off); card payment will appear on the checkout page once available.')
  return (
    <div className="space-y-8">
      {faqItems.map((section) => (
        <div key={section.category.tr}>
          <h2 className="text-lg font-semibold text-ink mb-4 pb-2 border-b border-palette">
            {L(section.category.tr, section.category.en)}
          </h2>
          <div className="space-y-2">
            {section.questions.map((item, i) => (
              <details
                key={i}
                className="group rounded-xl border border-palette bg-surface-elevated shadow-sm overflow-hidden"
              >
                <summary className="flex items-center justify-between gap-4 list-none cursor-pointer px-5 py-4 font-medium text-ink hover:bg-muted transition-colors [&::-webkit-details-marker]:hidden">
                  <span>{L(item.q.tr, item.q.en)}</span>
                  <ChevronDown className="w-5 h-5 text-ink-muted flex-shrink-0 transition-transform group-open:rotate-180" />
                </summary>
                <div className="px-5 pb-4 pt-0 text-ink-muted text-sm leading-relaxed border-t border-palette">
                  {L(item.a.tr, item.a.en).replace('{ODEME}', payment)}
                </div>
              </details>
            ))}
          </div>
        </div>
      ))}
    </div>
  )
}
