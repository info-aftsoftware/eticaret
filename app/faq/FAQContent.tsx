'use client'

import React from 'react'
import { ChevronDown } from 'lucide-react'
import { useL } from '@/lib/i18n-inline'

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
          tr: 'Kredi kartı, banka kartı ve havale/EFT ile ödeme alıyoruz. Fatura her müşteri için kesilir; kurumsal siparişlerde vade seçenekleri sunulabilir.',
          en: 'We accept credit cards, debit cards and bank transfer (wire/EFT). An invoice is issued for every customer; deferred payment options may be offered for corporate orders.',
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
          tr: 'Teslimat süresi siparişin içeriğine, stok durumuna ve bölgenize göre değişir. Tahmini süre sipariş onay e-postanızda belirtilir.',
          en: 'Delivery time varies depending on the order contents, stock availability and your region. The estimated time is stated in your order confirmation email.',
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
          tr: 'Garanti süresi ürün tipine göre değişir; genellikle 12-24 ay aralığındadır. Net süreler ürün sayfası ve faturada belirtilir.',
          en: 'The warranty period varies by product type and is generally 12-24 months. Exact periods are stated on the product page and invoice.',
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
                  {L(item.a.tr, item.a.en)}
                </div>
              </details>
            ))}
          </div>
        </div>
      ))}
    </div>
  )
}
