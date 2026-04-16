import { Metadata } from 'next'
import Link from 'next/link'
import { ChevronRight } from 'lucide-react'

export const metadata: Metadata = {
  title: 'Gizlilik Politikası ve KVKK Aydınlatma Metni | voltekno',
  description: 'Voltekno kişisel verilerin korunması, KVKK aydınlatma metni ve gizlilik politikası.',
}

export default function PrivacyPage() {
  return (
    <div className="min-h-screen bg-surface" id="main-content">
      <div className="bg-surface-elevated border-b border-palette">
        <div className="container mx-auto max-w-7xl px-4 sm:px-6 lg:px-8 py-4">
          <nav className="flex items-center gap-2 text-xs font-medium text-ink-muted mb-2" aria-label="Breadcrumb">
            <Link href="/" className="hover:text-brand transition-colors">Ana Sayfa</Link>
            <ChevronRight className="w-3.5 h-3.5 text-ink-muted" />
            <span className="text-ink font-semibold">Gizlilik Politikası</span>
          </nav>
          <h1 className="text-2xl md:text-3xl font-bold text-ink uppercase tracking-tight">Gizlilik Politikası & KVKK Aydınlatma Metni</h1>
          <p className="mt-1 text-sm text-ink-muted">6698 sayılı Kişisel Verilerin Korunması Kanunu kapsamında hazırlanmıştır.</p>
        </div>
      </div>

      <div className="container mx-auto max-w-7xl px-4 sm:px-6 lg:px-8 py-6 md:py-8">
        <div className="max-w-4xl mx-auto bg-surface-elevated rounded-lg border border-palette shadow-sm p-8 md:p-12">
          <h2 className="sr-only">Gizlilik Politikası ve KVKK Aydınlatma Metni</h2>

          <div className="prose prose-lg max-w-none text-ink space-y-6">

            <section>
              <h2 className="text-2xl font-semibold text-ink mt-0 mb-4">1. VERİ SORUMLUSU</h2>
              <p className="mb-3">
                6698 sayılı Kişisel Verilerin Korunması Kanunu ("KVKK") uyarınca, kişisel verileriniz veri sorumlusu sıfatıyla <strong>Yılmaz Uzun Şahıs Şirketi</strong> ("Voltekno", "Şirket") tarafından işlenmektedir.
              </p>
              <div className="bg-slate-50 border border-slate-200 rounded-lg p-4 text-sm">
                <p className="mb-1"><strong>Ticaret Unvanı:</strong> Yılmaz Uzun Şahıs Şirketi</p>
                <p className="mb-1"><strong>Web Sitesi:</strong> www.voltekno.com</p>
                <p className="mb-1"><strong>E-posta:</strong> info@voltekno.com</p>
                <p><strong>Telefon:</strong> +90 551 829 16 13</p>
              </div>
            </section>

            <section>
              <h2 className="text-2xl font-semibold text-ink mt-8 mb-4">2. İŞLENEN KİŞİSEL VERİLER</h2>
              <h3 className="text-lg font-semibold text-ink mt-5 mb-2">2.1. Kimlik ve İletişim Verileri</h3>
              <ul className="list-disc pl-6 space-y-1 text-ink-muted">
                <li>Ad, soyad</li>
                <li>E-posta adresi</li>
                <li>Telefon numarası</li>
                <li>Fatura ve teslimat adresi</li>
              </ul>

              <h3 className="text-lg font-semibold text-ink mt-5 mb-2">2.2. İşlem Verileri</h3>
              <ul className="list-disc pl-6 space-y-1 text-ink-muted">
                <li>Sipariş geçmişi ve ürün tercihleri</li>
                <li>Fatura bilgileri</li>
                <li>Ödeme yöntemi türü (kart numarası tarafımızca saklanmaz; güvenli ödeme altyapısı üzerinden işlenir)</li>
              </ul>

              <h3 className="text-lg font-semibold text-ink mt-5 mb-2">2.3. Teknik ve Kullanım Verileri</h3>
              <ul className="list-disc pl-6 space-y-1 text-ink-muted">
                <li>IP adresi, tarayıcı türü ve versiyonu</li>
                <li>İşletim sistemi</li>
                <li>Ziyaret edilen sayfalar ve oturum süresi</li>
                <li>Çerez (cookie) verileri</li>
              </ul>
            </section>

            <section>
              <h2 className="text-2xl font-semibold text-ink mt-8 mb-4">3. KİŞİSEL VERİLERİN İŞLENME AMAÇLARI</h2>
              <p className="mb-3 text-ink-muted">Kişisel verileriniz aşağıdaki amaçlarla işlenmektedir:</p>
              <ul className="list-disc pl-6 space-y-2 text-ink-muted">
                <li>Sipariş oluşturma, işleme ve teslimat süreçlerinin yönetilmesi</li>
                <li>Fatura düzenlenmesi ve muhasebe yükümlülüklerinin yerine getirilmesi</li>
                <li>Müşteri hizmetleri ve teknik destek sunulması</li>
                <li>Cayma hakkı ve iade süreçlerinin yürütülmesi</li>
                <li>Yasal yükümlülüklerin yerine getirilmesi (Vergi mevzuatı, KVKK, Tüketici Kanunu vb.)</li>
                <li>Hizmet kalitesinin ölçülmesi ve iyileştirilmesi</li>
                <li>Açık rıza vermeniz halinde: e-posta ile kampanya ve yeni ürün duyuruları</li>
              </ul>
            </section>

            <section>
              <h2 className="text-2xl font-semibold text-ink mt-8 mb-4">4. KİŞİSEL VERİLERİN İŞLENME HUKUKİ DAYANAKLARI</h2>
              <p className="mb-3 text-ink-muted">Kişisel verileriniz KVKK madde 5 ve 6 kapsamında aşağıdaki hukuki dayanaklara dayanılarak işlenmektedir:</p>
              <ul className="list-disc pl-6 space-y-2 text-ink-muted">
                <li><strong>Sözleşmenin kurulması ve ifası:</strong> Sipariş, teslimat ve iade işlemleri için zorunlu veriler.</li>
                <li><strong>Hukuki yükümlülük:</strong> Vergi ve muhasebe mevzuatı, tüketici koruma kanunu kapsamındaki yükümlülükler.</li>
                <li><strong>Meşru menfaat:</strong> Site güvenliği, dolandırıcılık önleme ve hizmet kalitesi ölçümü.</li>
                <li><strong>Açık rıza:</strong> Pazarlama iletişimi için; bu rızanızı istediğiniz zaman geri alabilirsiniz.</li>
              </ul>
            </section>

            <section>
              <h2 className="text-2xl font-semibold text-ink mt-8 mb-4">5. KİŞİSEL VERİLERİN AKTARILMASI</h2>
              <p className="mb-3 text-ink-muted">Kişisel verileriniz, yalnızca aşağıdaki durumlarda ve ölçülü biçimde üçüncü taraflarla paylaşılmaktadır:</p>
              <ul className="list-disc pl-6 space-y-2 text-ink-muted">
                <li><strong>Kargo ve lojistik firmaları:</strong> Siparişinizin teslimatı için ad-soyad, adres ve telefon bilgileri.</li>
                <li><strong>Ödeme hizmeti sağlayıcıları:</strong> PCI-DSS standartlarına uygun güvenli altyapı üzerinden ödeme işlemleri.</li>
                <li><strong>Mali müşavir ve muhasebe hizmetleri:</strong> Yasal fatura ve muhasebe yükümlülükleri için.</li>
                <li><strong>Yasal makamlar:</strong> Mahkeme kararı, savcılık talebi veya yasal zorunluluk halinde.</li>
              </ul>
              <p className="mt-3 text-ink-muted">
                Tüm üçüncü taraf hizmet sağlayıcılar, verilerinizi koruma ve yalnızca belirlenen amaç kapsamında kullanma yükümlülüğü altındadır. Verileriniz yurt dışına aktarılmaz.
              </p>
            </section>

            <section>
              <h2 className="text-2xl font-semibold text-ink mt-8 mb-4">6. ÇEREZLER (COOKIES)</h2>
              <p className="mb-3 text-ink-muted">Sitemiz, kullanıcı deneyimini iyileştirmek için çerezler kullanmaktadır. Çerez türleri:</p>
              <ul className="list-disc pl-6 space-y-2 text-ink-muted">
                <li><strong>Zorunlu çerezler:</strong> Oturum yönetimi ve sepet işlevselliği için gereklidir. Devre dışı bırakılamaz.</li>
                <li><strong>Analitik çerezler:</strong> Sayfa görüntüleme ve kullanım istatistikleri (anonim). Tercihlerinizden kapatabilirsiniz.</li>
                <li><strong>Pazarlama çerezleri:</strong> Yalnızca açık rızanız dahilinde aktif olur.</li>
              </ul>
              <p className="mt-3 text-ink-muted">
                Çerez tercihlerinizi tarayıcı ayarlarından veya sitemizin çerez yönetim panelinden güncelleyebilirsiniz.
              </p>
            </section>

            <section>
              <h2 className="text-2xl font-semibold text-ink mt-8 mb-4">7. VERİ GÜVENLİĞİ</h2>
              <ul className="list-disc pl-6 space-y-2 text-ink-muted">
                <li>Tüm veri iletimi SSL/TLS şifreleme protokolüyle korunmaktadır.</li>
                <li>Ödeme işlemleri, PCI-DSS uyumlu güvenli ödeme altyapısı üzerinden gerçekleştirilir; kart numaraları sistemimizde saklanmaz.</li>
                <li>Verilerinize erişim yetkilendirilmiş personelle sınırlıdır; erişim logları tutulmaktadır.</li>
                <li>Veri ihlali durumunda KVKK'ya bildirim ve etkilenen kişilerin bilgilendirilmesi yasal süre içinde yapılır.</li>
              </ul>
            </section>

            <section>
              <h2 className="text-2xl font-semibold text-ink mt-8 mb-4">8. VERİ SAKLAMA SÜRELERİ</h2>
              <ul className="list-disc pl-6 space-y-2 text-ink-muted">
                <li><strong>Sipariş ve fatura verileri:</strong> Vergi mevzuatı gereği 10 yıl.</li>
                <li><strong>Müşteri hesap bilgileri:</strong> Hesap aktif olduğu sürece; silinme talebinden sonra 30 gün içinde imha.</li>
                <li><strong>Pazarlama tercihleri:</strong> Rızanın geri alınmasıyla derhal sona erer.</li>
                <li><strong>Log ve teknik veriler:</strong> En fazla 2 yıl.</li>
              </ul>
              <p className="mt-3 text-ink-muted">Saklama süreleri sona erdiğinde verileriniz güvenli yöntemlerle silinir veya anonimleştirilir.</p>
            </section>

            <section>
              <h2 className="text-2xl font-semibold text-ink mt-8 mb-4">9. KVKK KAPSAMINDAKİ HAKLARINIZ</h2>
              <p className="mb-3 text-ink-muted">KVKK madde 11 uyarınca aşağıdaki haklara sahipsiniz:</p>
              <ul className="list-disc pl-6 space-y-2 text-ink-muted">
                <li>Kişisel verilerinizin işlenip işlenmediğini <strong>öğrenme</strong></li>
                <li>İşlenen verileriniz hakkında <strong>bilgi talep etme</strong></li>
                <li>İşlenme amacını ve bu amaca uygunluğunu <strong>öğrenme</strong></li>
                <li>Yurt içinde veya yurt dışında aktarıldığı üçüncü kişileri <strong>öğrenme</strong></li>
                <li>Eksik veya yanlış işlenen verilerin <strong>düzeltilmesini isteme</strong></li>
                <li>Yasal koşullar çerçevesinde verilerinizin <strong>silinmesini veya yok edilmesini isteme</strong></li>
                <li>Düzeltme, silme ve yok etme işlemlerinin üçüncü kişilere bildirilmesini <strong>talep etme</strong></li>
                <li>İşlenen verilerin münhasıran otomatik sistemler vasıtasıyla analize tabi tutulması suretiyle aleyhinize çıkan sonuçlara <strong>itiraz etme</strong></li>
                <li>Kişisel verilerinizin kanuna aykırı işlenmesi sebebiyle uğradığınız <strong>zararın tazminini talep etme</strong></li>
              </ul>
              <p className="mt-4 text-ink-muted">
                Haklarınızı kullanmak için <strong>info@voltekno.com</strong> adresine kimliğinizi doğrulayan belgelerle birlikte yazılı başvuru yapabilirsiniz. Talebiniz 30 gün içinde yanıtlanacaktır.
              </p>
            </section>

            <section>
              <h2 className="text-2xl font-semibold text-ink mt-8 mb-4">10. DEĞİŞİKLİKLER</h2>
              <p className="text-ink-muted">
                Bu metin, yasal düzenlemeler veya iş süreçlerimizdeki değişiklikler doğrultusunda güncellenebilir. Önemli değişiklikler web sitemizde duyurulur.
              </p>
            </section>

            <section>
              <h2 className="text-2xl font-semibold text-ink mt-8 mb-4">11. İLETİŞİM VE BAŞVURU</h2>
              <p className="mb-3 text-ink-muted">Gizlilik politikamız veya KVKK haklarınız hakkında sorularınız için:</p>
              <div className="bg-slate-50 border border-slate-200 rounded-lg p-4 text-sm text-ink-muted">
                <p className="mb-1"><strong className="text-ink">E-posta:</strong> info@voltekno.com</p>
                <p className="mb-1"><strong className="text-ink">Telefon:</strong> +90 551 829 16 13</p>
                <p><strong className="text-ink">Web:</strong> www.voltekno.com</p>
              </div>
              <p className="mt-4 text-xs text-ink-muted">
                <strong>Son Güncelleme:</strong> Nisan 2025 &nbsp;|&nbsp; Bu metin 6698 sayılı KVKK ve Aydınlatma Yükümlülüğünün Yerine Getirilmesinde Uyulacak Usul ve Esaslar Hakkında Tebliğ çerçevesinde hazırlanmıştır.
              </p>
            </section>

          </div>
        </div>
      </div>
    </div>
  )
}
