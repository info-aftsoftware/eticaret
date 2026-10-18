export type CategoryMetaItem = {
  title: string
  /** Kategori sayfasında görüntülenen kısa açıklama */
  description: string
  /** SEO meta description – daha uzun ve anahtar kelime odaklı */
  seoDescription?: string
  /** SEO keywords listesi */
  keywords?: string[]
  /** Hero görseli; yoksa koyu degrade arka plan kullanılır */
  image?: string
  imagePosition?: string
  imageScale?: number
  objectFit?: 'cover' | 'contain'
}

/** Kategori sayfası başlık, açıklama ve SEO metinleri – anahtarlar lib/categories.ts CATEGORY_GROUPS id'leri. */
export const CATEGORY_META: Record<string, CategoryMetaItem> = {
  'gunes-paneli': {
    title: 'Güneş Paneli',
    description: 'TOPCon, monokristal, bifacial, esnek ve katlanabilir güneş panelleri. Ev, karavan ve ticari projeler için.',
    seoDescription:
      'Güneş paneli fiyatları ve modelleri: TOPCon, half-cut monokristal, bifacial, esnek ve katlanabilir paneller. Teknik özellikler ve datasheet voltekno\'da.',
    keywords: ['güneş paneli', 'güneş paneli fiyatları', 'topcon güneş paneli', 'monokristal panel', 'bifacial panel', 'esnek güneş paneli', 'katlanabilir güneş paneli', 'solar panel'],
    image: '/images/categories/panel.webp',
    imagePosition: 'center center',
    imageScale: 0.78,
  },
  'solar-inverter': {
    title: 'Solar İnverter',
    description: 'Tam sinüs MPPT akıllı inverterler, hibrit ve on-grid inverterler, şarjlı ve modifiye sinüs inverterler, solar pompa sürücüleri.',
    seoDescription:
      "Solar inverter fiyatları: tam sinüs MPPT, hibrit ve on-grid inverterler, solar pompa sürücüleri. TommaTech, Deye, Victron ve daha fazlası voltekno'da.",
    keywords: ['solar inverter', 'akıllı inverter', 'hibrit inverter', 'on-grid inverter', 'tam sinüs inverter', 'solar pompa sürücüsü', 'inverter fiyatları'],
    image: '/images/categories/inverter.webp',
    imagePosition: 'center center',
    imageScale: 0.78,
  },
  'solar-aku': {
    title: 'Solar Akü',
    description: 'LiFePO4 lityum aküler, jel aküler, batarya yönetim ekipmanları ve taşınabilir güç istasyonları.',
    seoDescription:
      "Solar akü fiyatları: LiFePO4 lityum aküler, yüksek ve düşük voltaj batarya modülleri, jel aküler, BMS ve taşınabilir güç istasyonları voltekno'da.",
    keywords: ['solar akü', 'lityum akü', 'lifepo4 akü', 'jel akü', 'enerji depolama', 'taşınabilir güç istasyonu', 'akü fiyatları'],
    image: '/images/categories/batarya.webp',
    imagePosition: 'center center',
    imageScale: 0.78,
  },
  'solar-sarj-kontrol': {
    title: 'Solar Şarj Kontrol Cihazları',
    description: 'MPPT ve PWM solar şarj kontrol cihazları, DC-DC ve AC akü şarj cihazları, uzaktan izleme modülleri ve ekranlar.',
    seoDescription:
      'MPPT ve PWM solar şarj kontrol cihazı fiyatları. Victron, Havensis, TommaTech ve diğer markalarla panelden aküye verimli şarj voltekno\'da.',
    keywords: ['mppt şarj kontrol', 'pwm şarj kontrol', 'solar şarj kontrol cihazı', 'şarj regülatörü', 'mppt fiyatları'],
  },
  'isi-pompasi': {
    title: 'Isı Pompası',
    description: 'Monoblok, split ve havuz tipi ısı pompaları; R290, R32 ve EVI teknolojisiyle ısıtma, soğutma ve sıcak su.',
    seoDescription:
      'Isı pompası fiyatları: TommaTech monoblok, split ve havuz tipi, R290 / R32 EVI inverter modeller. Ev ve endüstriyel ısıtma-soğutma voltekno\'da.',
    keywords: ['ısı pompası', 'ısı pompası fiyatları', 'havuz ısı pompası', 'split ısı pompası', 'r290 ısı pompası', 'evi ısı pompası', 'tommatech ısı pompası'],
    image: '/images/categories/isi-pompasi.webp',
    imagePosition: 'center center',
    imageScale: 0.78,
  },
  'ruzgar-enerjisi': {
    title: 'Rüzgar Enerjisi',
    description: 'Rüzgar türbinleri, rüzgar şarj kontrol cihazları, direk setleri, kanatlar ve türbin aksesuarları.',
    seoDescription:
      'Rüzgar türbini fiyatları ve aksesuarları: ev tipi türbinler, direk setleri, kanatlar, burun ve kuyruk parçaları. İstabreeze ürünleri voltekno\'da.',
    keywords: ['rüzgar türbini', 'ev tipi rüzgar türbini', 'rüzgar jeneratörü', 'türbin kanadı', 'rüzgar enerjisi'],
  },
  'elektrikli-arac-sarj': {
    title: 'Elektrikli Araç Şarj',
    description: 'Elektrikli araç şarj istasyonları ve aksesuarları.',
    seoDescription:
      'Elektrikli araç şarj istasyonu fiyatları ve aksesuarları. Ev ve işletmeler için AC şarj çözümleri voltekno\'da.',
    keywords: ['elektrikli araç şarj istasyonu', 'ev şarj istasyonu', 'ev şarj cihazı', 'wallbox'],
  },
  'solar-baglanti-ekipmani': {
    title: 'Solar Bağlantı Ekipmanı',
    description: 'Solar transfer switch, sigorta ve DC dağıtım ürünleri, solar kablolar ve bağlantı kabloları.',
    seoDescription:
      "Solar bağlantı ekipmanları: otomatik transfer switch, DC sigorta ve dağıtım (Lynx), solar kablo, VE.Direct ve uzaktan aç/kapa kabloları voltekno'da.",
    keywords: ['solar transfer switch', 'dc sigorta', 'solar kablo', 'lynx distributor', 'solar bağlantı ekipmanı'],
  },
  aksesuar: {
    title: 'Aksesuar',
    description: 'İzleme ve kontrol cihazları: GX sistem izleme, akıllı sayaçlar, sensörler ve arayüzler.',
    seoDescription:
      "Solar sistem aksesuarları: Victron GX izleme cihazları, Smart Meter, akım ve sıcaklık sensörleri, arayüz ve dönüştürücüler voltekno'da.",
    keywords: ['solar aksesuar', 'smart meter', 'victron gx', 'enerji sayacı', 'izleme ve kontrol'],
  },
  diger: {
    title: 'Diğer Ürünler',
    description: 'Diğer enerji ürünleri ve aksesuarlar.',
    seoDescription:
      'Güneş enerjisi, enerji depolama ve rüzgar sistemleri için diğer ürün ve aksesuarlar voltekno\'da.',
    keywords: ['enerji ürünleri', 'solar aksesuar'],
  },
}
