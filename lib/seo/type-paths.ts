/**
 * product.category → dizinlenebilir sayfa yolu. Menüler gibi istemci bileşenleri için hafif eşleme
 * (rehber metinleri lib/seo/product-types.ts'de; tests/unit/seo-taxonomy.test.ts ikisinin uyumunu denetler).
 * Isı pompası tek türlü bir grup olduğu için grup sayfasına gider.
 */
export const TYPE_PATHS: Record<string, string> = {
  'Lityum Akü': '/category/solar-aku/lityum-aku',
  'Jel Akü': '/category/solar-aku/jel-aku',
  'Batarya Yönetimi ve Aksesuar': '/category/solar-aku/batarya-yonetimi-ve-aksesuar',
  'Taşınabilir Güç İstasyonu': '/category/solar-aku/tasinabilir-guc-istasyonu',
  'Tam Sinüs MPPT Akıllı İnverter': '/category/solar-inverter/tam-sinus-mppt-akilli-inverter',
  'Hibrit İnverter': '/category/solar-inverter/hibrit-inverter',
  'On-Grid İnverter': '/category/solar-inverter/on-grid-inverter',
  'Tam Sinüs İnverter': '/category/solar-inverter/tam-sinus-inverter',
  'Şarjlı Tam Sinüs İnverter': '/category/solar-inverter/sarjli-tam-sinus-inverter',
  'Modifiye Sinüs İnverter': '/category/solar-inverter/modifiye-sinus-inverter',
  'Solar Pompa Sürücüsü': '/category/solar-inverter/solar-pompa-surucusu',
  'Solar Sürücü Aksesuarı': '/category/solar-inverter/solar-surucu-aksesuari',
  'İnverter Aksesuarı': '/category/solar-inverter/inverter-aksesuari',
  'TopCon Güneş Paneli': '/category/gunes-paneli/topcon-gunes-paneli',
  'Monokristal Güneş Paneli': '/category/gunes-paneli/monokristal-gunes-paneli',
  'Esnek ve Katlanabilir Panel': '/category/gunes-paneli/esnek-ve-katlanabilir-panel',
  'MPPT Şarj Kontrol Cihazı': '/category/solar-sarj-kontrol/mppt-sarj-kontrol-cihazi',
  'PWM Şarj Kontrol Cihazı': '/category/solar-sarj-kontrol/pwm-sarj-kontrol-cihazi',
  'Akü Şarj Cihazı': '/category/solar-sarj-kontrol/aku-sarj-cihazi',
  'Şarj Kontrol Aksesuarı': '/category/solar-sarj-kontrol/sarj-kontrol-aksesuari',
  'Solar Transfer Switch': '/category/solar-baglanti-ekipmani/solar-transfer-switch',
  'Sigorta ve Dağıtım': '/category/solar-baglanti-ekipmani/sigorta-ve-dagitim',
  'Kablo ve Konnektör': '/category/solar-baglanti-ekipmani/kablo-ve-konnektor',
  'İzleme ve Kontrol': '/category/solar-baglanti-ekipmani/izleme-ve-kontrol',
  'Rüzgar Türbini': '/category/ruzgar-enerjisi/ruzgar-turbini',
  'Rüzgar Türbini Aksesuarı': '/category/ruzgar-enerjisi/ruzgar-turbini-aksesuari',
  'Rüzgar Şarj Kontrol Cihazı': '/category/ruzgar-enerjisi/ruzgar-sarj-kontrol-cihazi',
  'Isı Pompası': '/category/isi-pompasi',
  'Elektrikli Araç Şarj İstasyonu': '/category/elektrikli-arac-sarj/elektrikli-arac-sarj-istasyonu',
  'Şarj İstasyonu Aksesuarı': '/category/elektrikli-arac-sarj/sarj-istasyonu-aksesuari',
}

/** Ürün türünün kalıcı adresi; tanımlı değilse ürün listesi filtresi */
export const categoryHref = (category: string) =>
  TYPE_PATHS[category] ?? `/products?category=${encodeURIComponent(category)}`
