import { Metadata } from 'next'
import Link from 'next/link'
import { Truck, Package, Clock, MapPin, ChevronRight, AlertTriangle, CheckCircle } from 'lucide-react'

export const metadata: Metadata = {
  title: 'Kargo ve Teslimat',
  description: 'Voltekno kargo süreleri, desiye göre kargo ücreti, kargo firmaları ve teslimat koşulları.',
}

export default function ShippingPage() {
  return (
    <div className="min-h-screen bg-surface">
      <div className="bg-surface-elevated border-b border-palette">
        <div className="container mx-auto max-w-7xl px-4 sm:px-6 lg:px-8 py-4">
          <nav className="flex items-center gap-2 text-xs font-medium text-ink-muted mb-2" aria-label="Breadcrumb">
            <Link href="/" className="hover:text-brand transition-colors">Ana Sayfa</Link>
            <ChevronRight className="w-3.5 h-3.5 text-ink-muted" />
            <span className="text-ink font-semibold">Kargo ve Teslimat</span>
          </nav>
          <h1 className="text-2xl md:text-3xl font-bold text-ink uppercase tracking-tight">Kargo ve Teslimat</h1>
          <p className="mt-1 text-sm text-ink-muted">Siparişiniz güvenle ve hızlıca kapınıza gelsin</p>
        </div>
      </div>

      <div className="container mx-auto max-w-7xl px-4 sm:px-6 lg:px-8 py-6 md:py-8">
        <div className="max-w-3xl mx-auto space-y-6">

          {/* Teslimat Süreleri */}
          <div className="bg-surface-elevated rounded-xl border border-palette shadow-sm p-6 md:p-8">
            <div className="flex items-center gap-3 mb-5">
              <div className="w-11 h-11 rounded-xl bg-brand/10 flex items-center justify-center">
                <Clock className="w-5 h-5 text-brand" />
              </div>
              <h2 className="text-xl font-bold text-ink">Teslimat Süreleri</h2>
            </div>
            <div className="space-y-4">
              <div className="flex gap-3">
                <CheckCircle className="w-5 h-5 text-emerald-500 shrink-0 mt-0.5" />
                <div>
                  <p className="font-semibold text-ink">Stokta Mevcut Ürünler</p>
                  <p className="text-ink-muted text-sm mt-0.5">Ödeme onayından itibaren kargoya verilir. Kargo firması teslim süresi bölgeye ve siparişe göre değişir; tahmini süre sipariş onay e-postanızda belirtilir.</p>
                </div>
              </div>
              <div className="flex gap-3">
                <CheckCircle className="w-5 h-5 text-emerald-500 shrink-0 mt-0.5" />
                <div>
                  <p className="font-semibold text-ink">Özel Sipariş / Stok Dışı Ürünler</p>
                  <p className="text-ink-muted text-sm mt-0.5">Ürünün tedarik süresi sipariş öncesinde size bildirilir. Bu kategorideki ürünlerde standart süre garantisi uygulanmaz.</p>
                </div>
              </div>
              <div className="flex gap-3">
                <CheckCircle className="w-5 h-5 text-emerald-500 shrink-0 mt-0.5" />
                <div>
                  <p className="font-semibold text-ink">Büyük / Ağır Ekipmanlar</p>
                  <p className="text-ink-muted text-sm mt-0.5">Ağır güneş paneli paletleri, büyük batarya sistemleri gibi ürünler özel araçlı kargo ile sevk edilir. Teslimat öncesinde sizi arayarak randevu belirlenebilir.</p>
                </div>
              </div>
            </div>
            <div className="mt-5 bg-amber-50 border border-amber-200 rounded-lg p-3 text-sm text-amber-800">
              Teslimat süresi siparişin içeriğine, stok durumuna ve bulunduğunuz bölgeye göre değişiklik gösterebilir. Hafta sonu ve resmi tatil günleri iş günü sayılmaz.
            </div>
          </div>

          {/* Kargo Ücreti */}
          <div className="bg-surface-elevated rounded-xl border border-palette shadow-sm p-6 md:p-8">
            <div className="flex items-center gap-3 mb-5">
              <div className="w-11 h-11 rounded-xl bg-brand/10 flex items-center justify-center">
                <Package className="w-5 h-5 text-brand" />
              </div>
              <h2 className="text-xl font-bold text-ink">Kargo Ücreti</h2>
            </div>
            <ul className="space-y-2 text-ink-muted text-sm list-disc pl-5">
              <li>Kargo ücreti, sepetinizdeki ürünlerin toplam <strong className="text-ink">desisine</strong> (hacim ağırlığı: en × boy × yükseklik / 3000 ile kilogramın büyüğü) göre hesaplanır.</li>
              <li>Her desi aralığı için anlaşmalı firmalar arasından en uygun tarife uygulanır; 30 desi üzerindeki her desi için ücret artar.</li>
              <li>100 desi veya 100 kg üzerindeki gönderilere kargo firmasının ağır yük taşıma bedeli eklenir.</li>
              <li>Ücrete KDV ve Evrensel Posta Taşıma Bedeli dahildir; tutar sepette ve ödeme adımında gösterilir.</li>
            </ul>
          </div>

          {/* Kargo Firması */}
          <div className="bg-surface-elevated rounded-xl border border-palette shadow-sm p-6 md:p-8">
            <div className="flex items-center gap-3 mb-5">
              <div className="w-11 h-11 rounded-xl bg-brand/10 flex items-center justify-center">
                <Package className="w-5 h-5 text-brand" />
              </div>
              <h2 className="text-xl font-bold text-ink">Kargo Firması ve Paketleme</h2>
            </div>
            <p className="text-ink-muted leading-relaxed mb-4">
              Siparişler, anlaşmalı kargo firmalarımız (Sürat Kargo, HepsiJET, Kolay Gelsin, Yurtiçi Kargo, Aras Kargo) üzerinden gönderilmektedir. Bölgeniz ve sipariş ağırlığına göre en uygun firma otomatik seçilir.
            </p>
            <p className="text-ink-muted leading-relaxed">
              Ürünler, nakliye sırasında hasara karşı özel koruyucu malzeme ve sağlam dış ambalaj ile paketlenir. Hassas elektronik ekipmanlar (inverterler, akü sistemleri vb.) ek köpük ve balonlu naylon ile desteklenir.
            </p>
          </div>

          {/* Sipariş Takibi */}
          <div className="bg-surface-elevated rounded-xl border border-palette shadow-sm p-6 md:p-8">
            <div className="flex items-center gap-3 mb-5">
              <div className="w-11 h-11 rounded-xl bg-brand/10 flex items-center justify-center">
                <MapPin className="w-5 h-5 text-brand" />
              </div>
              <h2 className="text-xl font-bold text-ink">Sipariş Takibi</h2>
            </div>
            <p className="text-ink-muted leading-relaxed">
              Siparişiniz kargoya verildiğinde <strong>e-posta ve/veya SMS</strong> ile kargo takip numarası gönderilir. Bu numara ile kargo firmasının web sitesinden veya mobil uygulamasından teslimat durumunu takip edebilirsiniz. Ayrıca hesabınızdan "Siparişlerim" bölümünde güncel sipariş durumuna ulaşabilirsiniz.
            </p>
          </div>

          {/* Hasar Durumu */}
          <div className="bg-surface-elevated rounded-xl border border-palette shadow-sm p-6 md:p-8">
            <div className="flex items-center gap-3 mb-5">
              <div className="w-11 h-11 rounded-xl bg-red-50 flex items-center justify-center">
                <AlertTriangle className="w-5 h-5 text-red-500" />
              </div>
              <h2 className="text-xl font-bold text-ink">Hasarlı veya Eksik Teslimat</h2>
            </div>
            <p className="text-ink-muted leading-relaxed mb-4">
              Teslimat sırasında ürünün hasarlı olduğunu fark ederseniz, ürünü teslim almadan önce kargo görevlisine <strong>hasar/tutanak tutturmalısınız</strong>. Tutanak olmadan yapılan hasar talepleri değerlendirilemeyebilir.
            </p>
            <ol className="list-decimal list-inside text-ink-muted space-y-2">
              <li>Kargo görevlisine hasar tutanağı tutturun ve bir kopyasını alın.</li>
              <li>Ürünü teslim almaktan kaçınabilir ya da çekinceli teslim alabilirsiniz.</li>
              <li>Durumu en kısa sürede <strong>info@voltekno.com</strong> adresine bildirin; tutanak ve fotoğrafları ekleyin.</li>
              <li>İnceleme sonucunda hasar teyit edilirse yeni ürün gönderimi veya tam iade yapılır.</li>
            </ol>
          </div>

          {/* Teslimat Adresi */}
          <div className="bg-surface-elevated rounded-xl border border-palette shadow-sm p-6 md:p-8">
            <div className="flex items-center gap-3 mb-5">
              <div className="w-11 h-11 rounded-xl bg-brand/10 flex items-center justify-center">
                <Truck className="w-5 h-5 text-brand" />
              </div>
              <h2 className="text-xl font-bold text-ink">Teslimat Adresi</h2>
            </div>
            <p className="text-ink-muted leading-relaxed">
              Teslimat adresinizi sipariş sırasında veya profil sayfanızdaki adresler bölümünden girebilirsiniz. Kurumsal teslimat için fatura adresi ile teslimat adresi farklı olabilir; sipariş formunda her iki bilgiyi doldurunuz. Sipariş onayından sonra adres değişikliği için lütfen derhal müşteri hizmetleri ile iletişime geçin.
            </p>
          </div>

          <div className="text-center pt-2">
            <Link href="/contact" className="text-brand hover:underline font-medium text-sm">
              Kargo ve teslimat hakkında sorularınız için iletişime geçin →
            </Link>
          </div>

        </div>
      </div>
    </div>
  )
}
