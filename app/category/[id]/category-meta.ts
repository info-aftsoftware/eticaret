export type CategoryMetaItem = {
  title: string
  /** Kategori sayfasında görüntülenen kısa açıklama */
  description: string
  /** SEO meta description – daha uzun ve anahtar kelime odaklı */
  seoDescription?: string
  /** SEO keywords listesi */
  keywords?: string[]
  image: string
  imagePosition?: string
  imageScale?: number
  objectFit?: 'cover' | 'contain'
}

/** Kategori sayfası hero görselleri – ana sayfa kartlarından farklı, sayfa başına büyük görsel. */
export const CATEGORY_META: Record<string, CategoryMetaItem> = {
  'elektrikli-arac-sarj-urunleri': {
    title: 'EV Şarj İstasyonu ve Şarj Kabloları',
    description:
      'AC, DC hızlı ve taşınabilir şarj istasyonları. Ev, site ve işletmeler için akıllı şarj çözümleri.',
    seoDescription:
      'Elektrikli araç şarj istasyonları ve Tip2 şarj kabloları. AC/DC duvar tipi şarj üniteleri, taşınabilir şarj cihazları ve aksesuar ürünleri. voltekno\'da EV şarj fiyatları ve teknik destek.',
    keywords: [
      'ev şarj istasyonu',
      'elektrikli araç şarj istasyonu',
      'tip2 şarj kablosu',
      'ac şarj istasyonu fiyatları',
      'dc hızlı şarj',
      'taşınabilir şarj cihazı',
      'wallbox şarj istasyonu',
      'elektrikli araba şarj aleti',
      'araç şarj kablosu tip2',
      'şarj istasyonu kurulumu',
    ],
    image: '/images/categories/sarj.png',
    imagePosition: 'center center',
    imageScale: 0.78,
  },
  'batarya-depolama': {
    title: 'Akü ve Enerji Depolama Sistemleri',
    description:
      'Lityum (LiFePO4) aküler, kurşun asit aküler ve batarya modülleri. 12V, 24V, 48V seçenekler.',
    seoDescription:
      'Lityum akü, LiFePO4 batarya, kurşun asit akü ve enerji depolama sistemleri. 12V 24V 48V akü seçenekleri. Güneş sistemi, karavan, tekne ve ev uygulamaları için akü fiyatları.',
    keywords: [
      'lityum akü',
      'lifepo4 akü fiyatları',
      'lityum akü fiyat',
      'akü satın al',
      'güneş sistemi akü',
      'karavan akü',
      'ev bataryası fiyatları',
      'enerji depolama sistemi',
      'lifepo4 batarya',
      'kurşun asit akü',
      'taşınabilir güç istasyonu',
    ],
    image: '/images/categories/batarya.png',
    imagePosition: 'center center',
    imageScale: 0.78,
  },
  'inverterler': {
    title: 'İnverterler — Hibrit, Off-Grid, Mikro',
    description:
      'Hibrit, Off-Grid ve Mikro inverterler. Ev ve ticari projeler için tüm kapasiteler.',
    seoDescription:
      'Hibrit inverter, off-grid inverter ve mikro inverter modelleri. Güneş enerjisi sistemleri için doğru inverter seçimi. İnverter fiyatları, güç aralıkları ve teknik destek voltekno\'da.',
    keywords: [
      'hibrit inverter',
      'off grid inverter',
      'mikro inverter',
      'inverter fiyatları',
      'güneş inverter',
      'solar inverter fiyat',
      'ges inverter',
      'ev tipi inverter',
      'inverter nedir nasıl çalışır',
      'enerji inverter modelleri',
    ],
    image: '/images/categories/inverter.png',
    imagePosition: 'center center',
    imageScale: 0.78,
  },
  'gunes-enerjisi': {
    title: 'Güneş Paneli Fiyatları ve Solar Sistemler',
    description:
      'Güneş panelleri, taşınabilir paneller ve solar sistemler. GES kurulumu için komple çözümler.',
    seoDescription:
      'Monokristal güneş paneli fiyatları, taşınabilir güneş paneli ve hazır solar sistemler. Bağ evi, villa, karavan, çatı GES uygulamaları. Güneş paneli satın al — voltekno teknik destek.',
    keywords: [
      'güneş paneli fiyatları',
      'monokristal güneş paneli',
      'güneş paneli satın al',
      'solar panel fiyat',
      'taşınabilir güneş paneli',
      'çatı güneş paneli',
      'ges kurulum',
      'güneş enerji sistemi',
      'solar sistemler',
      'güneş paneli watt fiyat',
      'bağ evi güneş paneli',
    ],
    image: '/images/categories/panel.png',
    imagePosition: 'center center',
    imageScale: 0.78,
  },
  'isi-pompasi-hvac': {
    title: 'Isı Pompası ve HVAC Sistemleri',
    description:
      'Endüstriyel ve havuz tipi ısı pompaları, split EVI sistemleri ve fan coil üniteleri.',
    seoDescription:
      'Hava kaynaklı ısı pompası, havuz ısı pompası ve HVAC sistemleri. Enerji tasarruflu ısıtma ve soğutma çözümleri. Isı pompası fiyatları ve kurulum desteği voltekno\'da.',
    keywords: [
      'ısı pompası fiyatları',
      'hava kaynaklı ısı pompası',
      'havuz ısı pompası',
      'hvac sistemleri',
      'ısı pompası kurulumu',
      'enerji tasarruflu ısıtma',
      'heat pump türkiye',
      'ısı pompası nedir',
      'split ısı pompası',
    ],
    image: '/images/categories/isi-pompasi.png',
    imagePosition: 'center center',
    imageScale: 0.78,
  },
  'enerji-yonetimi': {
    title: 'Enerji Yönetim Sistemleri',
    description:
      'Smart meter, akıllı kontrolörler, EPS box ve şarj istasyonu yönetim sistemleri.',
    seoDescription:
      'Akıllı enerji yönetim sistemleri, enerji monitörleme ve otomasyon çözümleri. Smart meter, EPS box ve şarj yönetimi. Güneş enerjisi üretiminizi gerçek zamanlı takip edin.',
    keywords: [
      'enerji yönetim sistemi',
      'akıllı enerji yönetimi',
      'enerji monitörleme',
      'smart meter',
      'ems sistemi',
      'ev enerji yönetimi',
      'güneş enerjisi takip sistemi',
      'solar monitörleme',
      'şarj istasyonu yönetimi',
    ],
    image: '/images/categories/panel.png',
    imagePosition: 'center center',
    imageScale: 0.78,
  },
  // Eski URL uyumu (yönlendirme yapılıyor ama yedek olarak tutuluyor)
  'ev-sarj': {
    title: 'Şarj İstasyonları',
    description:
      'Duvar tipi, taşınabilir ve hızlı şarj istasyonları. Ev, site ve işletmeler için AC/DC çözümler.',
    image: '/images/categories/sarj.png',
    imagePosition: 'center center',
    imageScale: 0.78,
  },
  'enerji-depolama': {
    title: 'Batarya Paketleri',
    description:
      'Ev tipi lityum bataryalar, taşınabilir güç istasyonları ve endüstriyel ESS sistemleri.',
    image: '/images/categories/batarya.png',
    imagePosition: 'center center',
    imageScale: 0.78,
  },
}
