import { Metadata } from 'next'
import Link from 'next/link'
import { RefreshCw, FileText, Shield, Mail, ChevronRight, CheckCircle, XCircle, Clock } from 'lucide-react'

export const metadata: Metadata = {
  title: 'İade ve Değişim | voltekno',
  description: '14 gün cayma hakkı, iade süreci, koşullar ve para iadesi süresi. Voltekno iade politikası.',
}

export default function ReturnsPage() {
  return (
    <div className="min-h-screen bg-surface" id="main-content">
      <div className="bg-surface-elevated border-b border-palette">
        <div className="container mx-auto max-w-7xl px-4 sm:px-6 lg:px-8 py-4">
          <nav className="flex items-center gap-2 text-xs font-medium text-ink-muted mb-2" aria-label="Breadcrumb">
            <Link href="/" className="hover:text-brand transition-colors">Ana Sayfa</Link>
            <ChevronRight className="w-3.5 h-3.5 text-ink-muted" />
            <span className="text-ink font-semibold">İade ve Değişim</span>
          </nav>
          <h1 className="text-2xl md:text-3xl font-bold text-ink uppercase tracking-tight">İade ve Değişim</h1>
          <p className="mt-1 text-sm text-ink-muted">14 gün cayma hakkı ve iade koşullarımız</p>
        </div>
      </div>

      <div className="container mx-auto max-w-7xl px-4 sm:px-6 lg:px-8 py-6 md:py-8">
        <div className="max-w-3xl mx-auto space-y-6">

          {/* Cayma Hakkı — Öne Çıkan Bilgi */}
          <div className="bg-brand/5 border border-brand/20 rounded-xl p-5 flex items-start gap-4">
            <div className="w-11 h-11 rounded-xl bg-brand/10 flex items-center justify-center shrink-0 mt-0.5">
              <RefreshCw className="w-5 h-5 text-brand" />
            </div>
            <div>
              <p className="font-bold text-ink text-lg">14 Gün Cayma Hakkı</p>
              <p className="text-ink-muted text-sm mt-1">
                6502 sayılı Tüketicinin Korunması Hakkında Kanun kapsamında, ürün tesliminden itibaren <strong>14 gün</strong> içinde herhangi bir gerekçe göstermeksizin iade hakkınız mevcuttur.
              </p>
            </div>
          </div>

          {/* Cayma Hakkı Detay */}
          <div className="bg-surface-elevated rounded-xl border border-palette shadow-sm p-6 md:p-8">
            <h2 className="text-xl font-bold text-ink mb-5">Cayma Hakkı Koşulları</h2>
            <div className="space-y-3">
              <div className="flex gap-3">
                <CheckCircle className="w-5 h-5 text-emerald-500 shrink-0 mt-0.5" />
                <p className="text-ink-muted text-sm">Ürün kullanılmamış ve orijinal ambalajında olmalıdır.</p>
              </div>
              <div className="flex gap-3">
                <CheckCircle className="w-5 h-5 text-emerald-500 shrink-0 mt-0.5" />
                <p className="text-ink-muted text-sm">Ürünle birlikte gelen fatura, garanti belgesi ve tüm aksesuarlar eksiksiz iade edilmelidir.</p>
              </div>
              <div className="flex gap-3">
                <CheckCircle className="w-5 h-5 text-emerald-500 shrink-0 mt-0.5" />
                <p className="text-ink-muted text-sm">İade talebi, ürün teslim tarihinden itibaren <strong>14 gün</strong> içinde Satıcı'ya iletilmelidir.</p>
              </div>
              <div className="flex gap-3">
                <XCircle className="w-5 h-5 text-red-400 shrink-0 mt-0.5" />
                <p className="text-ink-muted text-sm">Ambalajı açılmış ve hijyen açısından iade edilemeyecek ürünlerde cayma hakkı kullanılamaz.</p>
              </div>
              <div className="flex gap-3">
                <XCircle className="w-5 h-5 text-red-400 shrink-0 mt-0.5" />
                <p className="text-ink-muted text-sm">Özel sipariş veya Alıcı isteğine göre özel üretilen ürünlerde cayma hakkı uygulanmaz.</p>
              </div>
              <div className="flex gap-3">
                <XCircle className="w-5 h-5 text-red-400 shrink-0 mt-0.5" />
                <p className="text-ink-muted text-sm">Kullanılmış, hasar görmüş veya eksik parçayla iade edilen ürünlerde değer kaybı oranında kesinti uygulanabilir.</p>
              </div>
            </div>
          </div>

          {/* İade Süreci */}
          <div className="bg-surface-elevated rounded-xl border border-palette shadow-sm p-6 md:p-8">
            <div className="flex items-center gap-3 mb-5">
              <div className="w-11 h-11 rounded-xl bg-brand/10 flex items-center justify-center">
                <FileText className="w-5 h-5 text-brand" />
              </div>
              <h2 className="text-xl font-bold text-ink">İade Süreci — Adım Adım</h2>
            </div>
            <ol className="space-y-4">
              {[
                {
                  step: '1',
                  title: 'İade Talebi',
                  desc: 'info@voltekno.com adresine veya iletişim formumuz üzerinden iade talebinizi iletin. Sipariş numaranızı, iade etmek istediğiniz ürün(leri) ve iade nedeninizi belirtin.',
                },
                {
                  step: '2',
                  title: 'Onay ve Kargo Bilgisi',
                  desc: '1–2 iş günü içinde size dönülür; iade kargo adresi ve (gerekiyorsa) kargo kodu iletilir.',
                },
                {
                  step: '3',
                  title: 'Ürünü Gönderme',
                  desc: "Ürünü orijinal ambalajında, fatura ve tüm aksesuarlarıyla birlikte belirtilen adrese kargolayın. İade kargo bedeli alıcıya aittir.",
                },
                {
                  step: '4',
                  title: 'İnceleme',
                  desc: 'Ürün depomuzda teslim alındıktan sonra 1–3 iş günü içinde kontrol edilir. Uygunluk durumu size bildirilir.',
                },
                {
                  step: '5',
                  title: 'Para İadesi',
                  desc: 'İade onaylandıktan sonra ödeme iadesi başlatılır (aşağıdaki sürelere bakınız).',
                },
              ].map(({ step, title, desc }) => (
                <li key={step} className="flex gap-4">
                  <span className="w-8 h-8 rounded-full bg-brand text-white text-sm font-bold flex items-center justify-center shrink-0">{step}</span>
                  <div>
                    <p className="font-semibold text-ink">{title}</p>
                    <p className="text-ink-muted text-sm mt-0.5">{desc}</p>
                  </div>
                </li>
              ))}
            </ol>
          </div>

          {/* Para İadesi Süreleri */}
          <div className="bg-surface-elevated rounded-xl border border-palette shadow-sm p-6 md:p-8">
            <div className="flex items-center gap-3 mb-5">
              <div className="w-11 h-11 rounded-xl bg-brand/10 flex items-center justify-center">
                <Clock className="w-5 h-5 text-brand" />
              </div>
              <h2 className="text-xl font-bold text-ink">Para İadesi Süreleri</h2>
            </div>
            <div className="space-y-4">
              <div className="flex items-start gap-3 p-3 bg-slate-50 rounded-lg">
                <div className="w-2 h-2 rounded-full bg-brand mt-2 shrink-0" />
                <div>
                  <p className="font-semibold text-ink text-sm">Kredi / Banka Kartı</p>
                  <p className="text-ink-muted text-sm">İade onayından itibaren <strong>7–14 iş günü</strong> içinde kart ekstrenize yansır (bankanın işlem süresine bağlı olarak farklılık gösterebilir).</p>
                </div>
              </div>
              <div className="flex items-start gap-3 p-3 bg-slate-50 rounded-lg">
                <div className="w-2 h-2 rounded-full bg-brand mt-2 shrink-0" />
                <div>
                  <p className="font-semibold text-ink text-sm">Havale / EFT</p>
                  <p className="text-ink-muted text-sm">IBAN bilgilerinizi iletmeniz üzerine <strong>5 iş günü</strong> içinde aktarım yapılır.</p>
                </div>
              </div>
            </div>
            <p className="mt-4 text-xs text-ink-muted">
              Yasal azami süre 14 takvim günüdür. İade sürecini hızlandırmak için IBAN ve sipariş numaranızı hazır bulundurun.
            </p>
          </div>

          {/* Garanti ve Arıza */}
          <div className="bg-surface-elevated rounded-xl border border-palette shadow-sm p-6 md:p-8">
            <div className="flex items-center gap-3 mb-5">
              <div className="w-11 h-11 rounded-xl bg-brand/10 flex items-center justify-center">
                <Shield className="w-5 h-5 text-brand" />
              </div>
              <h2 className="text-xl font-bold text-ink">Garanti Kapsamında Arıza</h2>
            </div>
            <p className="text-ink-muted leading-relaxed mb-4">
              Garanti süresi içinde üretim kaynaklı arıza oluşursa ürün onarılır veya eşdeğeriyle değiştirilir. Onarım mümkün değilse tam iade yapılır.
            </p>
            <p className="text-ink-muted leading-relaxed">
              Arıza bildiriminizi iletişim kanallarımız üzerinden yapabilirsiniz. Size dönüş yapılarak servis süreci ve kargo yöntemi ayrıntılı şekilde anlatılacaktır. Kullanım hatası, mekanik darbe veya yetkisiz müdahale kaynaklı arızalar garanti kapsamı dışındadır.
            </p>
          </div>

          {/* İletişim */}
          <div className="bg-surface-elevated rounded-xl border border-palette shadow-sm p-6 md:p-8">
            <div className="flex items-center gap-3 mb-5">
              <div className="w-11 h-11 rounded-xl bg-brand/10 flex items-center justify-center">
                <Mail className="w-5 h-5 text-brand" />
              </div>
              <h2 className="text-xl font-bold text-ink">İletişim</h2>
            </div>
            <p className="text-ink-muted leading-relaxed mb-4">
              İade veya değişim talebiniz için <Link href="/contact" className="text-brand hover:underline font-medium">İletişim</Link> sayfamızdan bize ulaşabilir ya da doğrudan <strong>info@voltekno.com</strong> adresine e-posta gönderebilirsiniz. Sipariş numaranızı ve talebinizi (iade / değişim / arıza) belirtmeniz işlem süresini kısaltır.
            </p>
            <p className="text-ink-muted text-sm">
              Detaylı hak ve yükümlülükler için{' '}
              <Link href="/terms" className="text-brand hover:underline font-medium">Mesafeli Satış Sözleşmesi</Link>{' '}ve{' '}
              <Link href="/privacy" className="text-brand hover:underline font-medium">Gizlilik Politikası</Link>{' '}sayfalarımıza bakabilirsiniz.
            </p>
          </div>

        </div>
      </div>
    </div>
  )
}
