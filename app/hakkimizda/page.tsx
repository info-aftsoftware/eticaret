import { Metadata } from 'next'
import Link from 'next/link'
import { ChevronRight, ShieldCheck, Zap, Truck, HeadphonesIcon, Users, Package, Award, Clock } from 'lucide-react'

export const metadata: Metadata = {
  title: 'Hakkımızda',
  description: 'Voltekno hakkında: misyonumuz, değerlerimiz ve temiz enerji çözümlerindeki uzmanlığımız.',
}

const stats = [
  { label: '340+', desc: 'Ürün Çeşidi', icon: Package },
  { label: '2.000+', desc: 'Mutlu Müşteri', icon: Users },
  { label: '2 Yıl', desc: 'Garanti', icon: Award },
  { label: '7/24', desc: 'Teknik Destek', icon: Clock },
]

const values = [
  {
    icon: ShieldCheck,
    title: 'Kalite Güvencesi',
    desc: 'Sadece sertifikalı, test edilmiş ürünleri stokluyor; her kalem teslim öncesi kalite kontrolünden geçiyor.',
  },
  {
    icon: Zap,
    title: 'Hızlı Teslimat',
    desc: 'Siparişler en kısa sürede kargoya verilir. Teslimat süresi siparişin içeriğine ve bölgeye göre değişir.',
  },
  {
    icon: Truck,
    title: 'Güvenli Kargo',
    desc: 'Ürünler özel koruyucu ambalaj ile gönderilir. Teslimatta hasar oluşursa tam iade veya yeniden gönderim yapıyoruz.',
  },
  {
    icon: HeadphonesIcon,
    title: '7/24 Teknik Destek',
    desc: 'Satış öncesi danışmanlıktan kurulum sonrası teknik desteğe kadar yanınızdayız.',
  },
]

export default function HakkimizdaPage() {
  return (
    <div className="min-h-screen bg-surface">

      {/* Breadcrumb + Başlık */}
      <div className="bg-surface-elevated border-b border-palette">
        <div className="container mx-auto max-w-7xl px-4 sm:px-6 lg:px-8 py-4">
          <nav className="flex items-center gap-2 text-xs font-medium text-ink-muted mb-2" aria-label="Breadcrumb">
            <Link href="/" className="hover:text-brand transition-colors">Ana Sayfa</Link>
            <ChevronRight className="w-3.5 h-3.5 text-ink-muted" />
            <span className="text-ink font-semibold">Hakkımızda</span>
          </nav>
          <h1 className="text-2xl md:text-3xl font-bold text-ink uppercase tracking-tight">Hakkımızda</h1>
          <p className="mt-1 text-sm text-ink-muted">Voltekno — Temiz Enerji Çözümlerinde Güvenilir Adresiniz</p>
        </div>
      </div>

      <div className="container mx-auto max-w-7xl px-4 sm:px-6 lg:px-8 py-8 md:py-12">

        {/* Hikaye bölümü */}
        <div className="max-w-4xl mx-auto bg-surface-elevated rounded-2xl border border-palette shadow-sm p-8 md:p-12 mb-10">
          <h2 className="text-2xl font-bold text-ink mb-4">Biz Kimiz?</h2>
          <p className="text-ink-muted leading-relaxed mb-4">
            Voltekno, güneş enerji sistemleri, inverterler, akü ve batarya depolama çözümleri ile elektrikli araç şarj ekipmanları alanında uzmanlaşmış bir e-ticaret platformudur. Temiz ve yenilenebilir enerji teknolojilerine kolay, güvenilir ve uygun maliyetli erişim sağlamak amacıyla kurulduk.
          </p>
          <p className="text-ink-muted leading-relaxed mb-4">
            Kurumsal müşterilerden bireysel kullanıcılara, çiftçilerden enerji danışmanlık şirketlerine kadar geniş bir yelpazede hizmet veriyoruz. Güneş paneli ve inverter seçiminde teknik danışmanlıktan, hazır enerji paketlerine; EV şarj ürünü seçiminden GES (güneş enerji santrali) hesaplama araçlarına kadar kapsamlı bir ekosistem sunuyoruz.
          </p>
          <p className="text-ink-muted leading-relaxed">
            Misyonumuz; doğru ürünü, doğru fiyatla ve güvenilir hizmet anlayışıyla müşterilerimize ulaştırmaktır. Her satın alma kararınızın arkasında teknik bilgi, kalite ve sorumluluk olduğuna inanıyoruz.
          </p>
        </div>

        {/* İstatistikler */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-10">
          {stats.map(({ label, desc, icon: Icon }) => (
            <div key={desc} className="bg-surface-elevated rounded-2xl border border-palette shadow-sm p-6 flex flex-col items-center text-center">
              <div className="w-12 h-12 rounded-xl bg-brand/10 flex items-center justify-center mb-3">
                <Icon className="w-6 h-6 text-brand" />
              </div>
              <span className="text-3xl font-bold text-ink">{label}</span>
              <span className="text-sm text-ink-muted mt-1">{desc}</span>
            </div>
          ))}
        </div>

        {/* Neden Voltekno */}
        <div className="max-w-4xl mx-auto mb-10">
          <h2 className="text-2xl font-bold text-ink mb-6 text-center">Neden Voltekno?</h2>
          <div className="grid sm:grid-cols-2 gap-5">
            {values.map(({ icon: Icon, title, desc }) => (
              <div key={title} className="bg-surface-elevated rounded-2xl border border-palette shadow-sm p-6 flex gap-4">
                <div className="w-11 h-11 rounded-xl bg-brand/10 flex items-center justify-center shrink-0">
                  <Icon className="w-5 h-5 text-brand" />
                </div>
                <div>
                  <h3 className="font-bold text-ink mb-1">{title}</h3>
                  <p className="text-sm text-ink-muted leading-relaxed">{desc}</p>
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Değerlerimiz */}
        <div className="max-w-4xl mx-auto bg-surface-elevated rounded-2xl border border-palette shadow-sm p-8 md:p-12 mb-10">
          <h2 className="text-2xl font-bold text-ink mb-4">Değerlerimiz</h2>
          <ul className="space-y-3 text-ink-muted">
            <li className="flex items-start gap-3">
              <span className="w-2 h-2 rounded-full bg-brand mt-2 shrink-0" />
              <span><strong className="text-ink">Şeffaflık:</strong> Ürün bilgileri, fiyatlar ve teslimat koşulları konusunda her zaman açık ve dürüsttük.</span>
            </li>
            <li className="flex items-start gap-3">
              <span className="w-2 h-2 rounded-full bg-brand mt-2 shrink-0" />
              <span><strong className="text-ink">Uzmanlık:</strong> Teknik danışmanlık ekibimiz, doğru ürünü seçmeniz için her aşamada destek verir.</span>
            </li>
            <li className="flex items-start gap-3">
              <span className="w-2 h-2 rounded-full bg-brand mt-2 shrink-0" />
              <span><strong className="text-ink">Sürdürülebilirlik:</strong> Temiz enerjiyi yaygınlaştırarak hem bireysel hem toplumsal tasarruf ve çevre katkısına öncülük ediyoruz.</span>
            </li>
            <li className="flex items-start gap-3">
              <span className="w-2 h-2 rounded-full bg-brand mt-2 shrink-0" />
              <span><strong className="text-ink">Müşteri Odaklılık:</strong> Her şikayeti, öneriyi ve soruyu dikkatle değerlendiriyor; hizmetimizi sürekli iyileştiriyoruz.</span>
            </li>
          </ul>
        </div>

        {/* İletişime Geç CTA */}
        <div className="max-w-4xl mx-auto rounded-2xl bg-brand px-8 py-10 text-center">
          <h2 className="text-xl md:text-2xl font-bold text-white mb-2">Bizimle İletişime Geçin</h2>
          <p className="text-white/80 text-sm mb-6 max-w-lg mx-auto">
            Ürün seçimi, teknik danışmanlık veya toplu satın alma talepleri için ekibimiz size yardımcı olmaktan memnuniyet duyar.
          </p>
          <Link
            href="/contact"
            className="inline-flex items-center gap-2 bg-white text-brand font-bold px-6 py-3 rounded-xl hover:bg-white/90 transition-colors text-sm"
          >
            İletişime Geç
            <ChevronRight className="w-4 h-4" />
          </Link>
        </div>

      </div>
    </div>
  )
}
