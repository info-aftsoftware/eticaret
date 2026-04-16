import { Metadata } from 'next'
import Link from 'next/link'
import { ChevronRight } from 'lucide-react'

export const metadata: Metadata = {
  title: 'Mesafeli Satış Sözleşmesi | voltekno',
  description: '6502 sayılı Tüketicinin Korunması Hakkında Kanun ve Mesafeli Sözleşmeler Yönetmeliği kapsamında voltekno mesafeli satış sözleşmesi.',
}

export default function TermsPage() {
  return (
    <div className="min-h-screen bg-surface" id="main-content">
      <div className="bg-surface-elevated border-b border-palette">
        <div className="container mx-auto max-w-7xl px-4 sm:px-6 lg:px-8 py-4">
          <nav className="flex items-center gap-2 text-xs font-medium text-ink-muted mb-2" aria-label="Breadcrumb">
            <Link href="/" className="hover:text-brand transition-colors">Ana Sayfa</Link>
            <ChevronRight className="w-3.5 h-3.5 text-ink-muted" />
            <span className="text-ink font-semibold">Mesafeli Satış Sözleşmesi</span>
          </nav>
          <h1 className="text-2xl md:text-3xl font-bold text-ink uppercase tracking-tight">Mesafeli Satış Sözleşmesi</h1>
          <p className="mt-1 text-sm text-ink-muted">6502 sayılı Kanun ve Mesafeli Sözleşmeler Yönetmeliği kapsamında hazırlanmıştır.</p>
        </div>
      </div>

      <div className="container mx-auto max-w-7xl px-4 sm:px-6 lg:px-8 py-6 md:py-8">
        <div className="max-w-4xl mx-auto bg-surface-elevated rounded-lg border border-palette shadow-sm p-8 md:p-12">
          <h2 className="sr-only">Mesafeli Satış Sözleşmesi metni</h2>

          <div className="prose prose-lg max-w-none text-ink space-y-6">

            <section>
              <h2 className="text-2xl font-semibold text-ink mt-0 mb-4">1. TARAFLAR</h2>
              <p className="mb-4 text-ink-muted">
                Bu Mesafeli Satış Sözleşmesi ("Sözleşme"), 6502 sayılı Tüketicinin Korunması Hakkında Kanun ile Mesafeli Sözleşmeler Yönetmeliği hükümleri çerçevesinde aşağıdaki taraflar arasında akdedilmiştir:
              </p>
              <div className="bg-slate-50 border border-slate-200 rounded-lg p-4 text-sm mb-4">
                <p className="font-bold text-ink mb-2">SATICI</p>
                <p className="text-ink-muted mb-1"><strong>Ticaret Unvanı:</strong> Yılmaz Uzun Şahıs Şirketi</p>
                <p className="text-ink-muted mb-1"><strong>Web Sitesi:</strong> www.voltekno.com</p>
                <p className="text-ink-muted mb-1"><strong>E-posta:</strong> info@voltekno.com</p>
                <p className="text-ink-muted"><strong>Telefon:</strong> +90 551 829 16 13</p>
              </div>
              <div className="bg-slate-50 border border-slate-200 rounded-lg p-4 text-sm">
                <p className="font-bold text-ink mb-2">ALICI (TÜKETİCİ)</p>
                <p className="text-ink-muted">Sipariş sırasında kimlik ve iletişim bilgilerini beyan eden gerçek veya tüzel kişi.</p>
              </div>
            </section>

            <section>
              <h2 className="text-2xl font-semibold text-ink mt-8 mb-4">2. SÖZLEŞME KONUSU</h2>
              <p className="text-ink-muted">
                İşbu Sözleşme; Alıcı'nın, Satıcı'ya ait www.voltekno.com elektronik ticaret platformu üzerinden elektronik ortamda sipariş verdiği güneş panelleri, inverterler, akü ve batarya depolama sistemleri, elektrikli araç şarj ekipmanları ile ilgili ürünlerin satışı, teslimatı ile tarafların hak ve yükümlülüklerini düzenler.
              </p>
            </section>

            <section>
              <h2 className="text-2xl font-semibold text-ink mt-8 mb-4">3. ÜRÜN / HİZMET BİLGİLERİ</h2>
              <p className="mb-3 text-ink-muted">
                <strong>3.1.</strong> Sipariş edilen ürünlerin temel özellikleri, marka, model ve fiyatı, Alıcı'ya sipariş özeti ve onay e-postasında sunulur.
              </p>
              <p className="mb-3 text-ink-muted">
                <strong>3.2.</strong> Ürün fiyatları KDV dahil Türk Lirası cinsinden gösterilir. Satıcı, önceden bildirmeksizin fiyatları değiştirme hakkını saklı tutar; ancak Alıcı'ya uygulanan fiyat, sipariş anındaki fiyattır.
              </p>
              <p className="text-ink-muted">
                <strong>3.3.</strong> Stok bilgisi anlık olarak güncellenir. Sipariş sonrası stok yetersizliği tespiti halinde Alıcı derhal bilgilendirilir ve tam iade yapılır.
              </p>
            </section>

            <section>
              <h2 className="text-2xl font-semibold text-ink mt-8 mb-4">4. SİPARİŞ VE ÖDEME</h2>
              <p className="mb-3 text-ink-muted">
                <strong>4.1.</strong> Alıcı, ürünü sepetine ekleyerek ödeme adımlarını tamamladığında sipariş verilmiş sayılır. Satıcı'nın sipariş onay e-postası göndermesiyle Sözleşme kurulmuş olur.
              </p>
              <p className="mb-3 text-ink-muted">
                <strong>4.2.</strong> Ödeme yöntemleri: Kredi/banka kartı (Visa, Mastercard), havale/EFT. Ödeme bilgileri güvenli ödeme altyapısı üzerinden PCI-DSS standartlarına uygun şekilde işlenir; kart numarası Satıcı sisteminde saklanmaz.
              </p>
              <p className="mb-3 text-ink-muted">
                <strong>4.3.</strong> Kargo ücreti: Sipariş içeriğine, ağırlığa ve teslimat bölgesine göre belirlenir; sepet ve sipariş özeti ekranında gösterilir.
              </p>
              <p className="text-ink-muted">
                <strong>4.4.</strong> Ödeme onayından sonra sipariş işleme alınır. Ödeme gerçekleşmeden ürün rezerve edilmez.
              </p>
            </section>

            <section>
              <h2 className="text-2xl font-semibold text-ink mt-8 mb-4">5. TESLİMAT</h2>
              <p className="mb-3 text-ink-muted">
                <strong>5.1.</strong> Stokta mevcut ürünler, ödeme onayından itibaren <strong>1–3 iş günü</strong> içinde kargoya verilir. Teslimat süresi kargo firması ve bölgeye göre <strong>1–5 iş günü</strong>'dür. Özel sipariş veya stok dışı ürünler için süre önceden bildirilir.
              </p>
              <p className="mb-3 text-ink-muted">
                <strong>5.2.</strong> Teslimat adresi, Alıcı'nın sipariş formunda belirttiği adrestir. Adres hatası nedeniyle teslimat gerçekleşmezse ek kargo bedeli Alıcı'ya aittir.
              </p>
              <p className="mb-3 text-ink-muted">
                <strong>5.3.</strong> Teslimat sırasında ürün Alıcı veya yetkili temsilcisi tarafından kontrol edilmelidir. Hasarlı veya eksik ürün tesliminde kargo firmasına <strong>tutanak tutturulmalı</strong>; tutanak olmadan hasar talepleri kabul edilmeyebilir.
              </p>
              <p className="text-ink-muted">
                <strong>5.4.</strong> Kargoya verildiğinde Alıcı'ya takip numarası e-posta ile iletilir.
              </p>
            </section>

            <section>
              <h2 className="text-2xl font-semibold text-ink mt-8 mb-4">6. CAYMA HAKKI</h2>
              <div className="bg-brand/5 border border-brand/20 rounded-lg p-4 mb-4">
                <p className="font-semibold text-ink mb-2">Tüketici Bilgilendirmesi</p>
                <p className="text-ink-muted text-sm">
                  6502 sayılı Kanun'un 48. maddesi ve Mesafeli Sözleşmeler Yönetmeliği'nin 11. maddesi uyarınca Alıcı, ürünün teslim tarihinden itibaren <strong>14 (on dört) gün</strong> içinde herhangi bir gerekçe göstermeksizin ve cezai şart ödemeksizin Sözleşme'den cayma hakkına sahiptir.
                </p>
              </div>
              <p className="mb-3 text-ink-muted">
                <strong>6.1.</strong> Cayma hakkının kullanımı için Satıcı'ya yazılı bildirim (e-posta veya iletişim formu) yapılması yeterlidir. Cayma bildiriminin ardından ürün, Satıcı'nın belirteceği adrese gönderilir.
              </p>
              <p className="mb-3 text-ink-muted">
                <strong>6.2.</strong> İade edilecek ürünler; <strong>kullanılmamış, orijinal ambalajında ve fatura ile birlikte</strong> gönderilmelidir. Ürünün değerini azaltan kullanım veya hasar halinde Satıcı orantılı kesinti uygulayabilir.
              </p>
              <p className="mb-3 text-ink-muted">
                <strong>6.3.</strong> İade kargo bedeli Alıcı'ya aittir. Satıcı, ürünü teslim aldıktan sonra <strong>14 gün içinde</strong> ödemeyi iade eder.
              </p>
              <p className="text-ink-muted">
                <strong>6.4. Cayma hakkı kullanılamayan durumlar (Yönetmelik Madde 15):</strong>
              </p>
              <ul className="list-disc pl-6 space-y-1 text-ink-muted mt-2">
                <li>Alıcının isteği veya açık kişisel ihtiyacı doğrultusunda hazırlanan ürünler</li>
                <li>Ambalajı açılmış, iade sağlığa uygun olmayan veya hijyen açısından iade edilemeyecek ürünler</li>
                <li>Teslimden sonra başka ürünlerle karışan mallar</li>
              </ul>
            </section>

            <section>
              <h2 className="text-2xl font-semibold text-ink mt-8 mb-4">7. İADE KOŞULLARI VE PARA İADESİ</h2>
              <p className="mb-3 text-ink-muted">
                <strong>7.1.</strong> İade ürün depoda incelendikten sonra uygunsa, ödeme yönteme bağlı olarak:
              </p>
              <ul className="list-disc pl-6 space-y-1 text-ink-muted mb-3">
                <li><strong>Kredi kartı:</strong> 7–14 iş günü içinde kart iadesi (banka işlem süresine bağlı)</li>
                <li><strong>Havale/EFT:</strong> Alıcı'nın IBAN'ına 5 iş günü içinde aktarım</li>
              </ul>
              <p className="text-ink-muted">
                <strong>7.2.</strong> Para iadesi, yasal 14 günlük süreyi aşmaz. İadeyi gecikmesiz başlatmak için lütfen iletişim bilgilerinizi ve sipariş numaranızı bildirin.
              </p>
            </section>

            <section>
              <h2 className="text-2xl font-semibold text-ink mt-8 mb-4">8. GARANTİ</h2>
              <p className="mb-3 text-ink-muted">
                <strong>8.1.</strong> Ürünler, üretici garanti belgesi kapsamındadır. Voltekno, ürün kategorisine göre <strong>minimum 2 yıl</strong> garanti sağlamaktadır.
              </p>
              <p className="mb-3 text-ink-muted">
                <strong>8.2.</strong> Garanti kapsamındaki arızalar için ürün yetkili servise gönderilir veya Satıcı tarafından yönlendirme yapılır.
              </p>
              <p className="text-ink-muted">
                <strong>8.3.</strong> Kullanım hatası, fiziksel hasar, yetkisiz müdahale veya doğal afetlerden kaynaklanan arızalar garanti kapsamı dışındadır.
              </p>
            </section>

            <section>
              <h2 className="text-2xl font-semibold text-ink mt-8 mb-4">9. KİŞİSEL VERİLER</h2>
              <p className="text-ink-muted">
                Alıcı'nın kişisel verileri, 6698 sayılı KVKK kapsamında yalnızca sipariş, teslimat ve yasal yükümlülüklerin yerine getirilmesi amacıyla işlenir. Ayrıntılar için{' '}
                <Link href="/privacy" className="text-brand hover:text-brand-hover font-medium">Gizlilik Politikası</Link>
                'mızı inceleyiniz.
              </p>
            </section>

            <section>
              <h2 className="text-2xl font-semibold text-ink mt-8 mb-4">10. UYUŞMAZLIKLARIN ÇÖZÜMÜ</h2>
              <p className="mb-3 text-ink-muted">
                <strong>10.1.</strong> Bu Sözleşme'den doğan uyuşmazlıklarda Türkiye Cumhuriyeti hukuku uygulanır.
              </p>
              <p className="mb-3 text-ink-muted">
                <strong>10.2.</strong> Tüketici şikayetleri için öncelikle Satıcı müşteri hizmetleri başvurulmalıdır.
              </p>
              <p className="text-ink-muted">
                <strong>10.3.</strong> Çözüme kavuşturulamayan uyuşmazlıklarda; 6502 sayılı Kanun'un 68. maddesi gereğince belirlenen parasal sınırlara göre Tüketici Hakem Heyetleri veya Tüketici Mahkemeleri yetkilidir.
              </p>
            </section>

            <section>
              <h2 className="text-2xl font-semibold text-ink mt-8 mb-4">11. YÜRÜRLÜK</h2>
              <p className="text-ink-muted">
                Bu Sözleşme, Alıcı'nın siparişini tamamlaması ve Satıcı'nın sipariş onay e-postasını göndermesiyle karşılıklı olarak yürürlüğe girer. Alıcı, sipariş sürecinde Sözleşme metnini okuduğunu ve kabul ettiğini beyan eder.
              </p>
              <div className="bg-slate-50 border border-slate-200 rounded-lg p-4 mt-4 text-sm text-ink-muted">
                <p><strong className="text-ink">Satıcı:</strong> Yılmaz Uzun Şahıs Şirketi</p>
                <p className="mt-1 text-xs">Son Güncelleme: Nisan 2025</p>
              </div>
            </section>

          </div>
        </div>
      </div>
    </div>
  )
}
