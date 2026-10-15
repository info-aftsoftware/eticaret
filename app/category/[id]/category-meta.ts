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
      'Güneş paneli fiyatları ve modelleri: TOPCon, half-cut monokristal, bifacial, esnek (flexible) ve katlanabilir çanta tipi paneller. Teknik özellikler ve datasheet voltekno\'da.',
    keywords: ['güneş paneli', 'güneş paneli fiyatları', 'topcon güneş paneli', 'monokristal panel', 'bifacial panel', 'esnek güneş paneli', 'katlanabilir güneş paneli', 'solar panel'],
    image: '/images/categories/panel.png',
    imagePosition: 'center center',
    imageScale: 0.78,
  },
  'inverter-ve-guc-elektronigi': {
    title: 'İnverter ve Güç Elektroniği',
    description: 'On-grid, hibrit ve off-grid inverterler, tam sinüs inverterler, akıllı sayaçlar ve izleme cihazları.',
    seoDescription:
      'İnverter fiyatları: on-grid (şebeke bağlantılı), hibrit ve off-grid inverterler, tam sinüs ve modifiye sinüs inverterler, Smart Meter ve izleme aksesuarları. TommaTech, Deye, Victron ve daha fazlası voltekno\'da.',
    keywords: ['inverter', 'hibrit inverter', 'on-grid inverter', 'off-grid inverter', 'tam sinüs inverter', 'solar inverter fiyatları', 'smart meter'],
    image: '/images/categories/inverter.png',
    imagePosition: 'center center',
    imageScale: 0.78,
  },
  'enerji-depolama': {
    title: 'Enerji Depolama',
    description: 'LiFePO4 lityum bataryalar, yüksek voltaj batarya modülleri ve taşınabilir güç istasyonları.',
    seoDescription:
      'Lityum batarya fiyatları: LiFePO4 aküler, yüksek ve düşük voltaj enerji depolama modülleri, marin aküler ve taşınabilir güç istasyonları. Güneş enerjisi sistemleri için enerji depolama çözümleri voltekno\'da.',
    keywords: ['lityum batarya', 'lifepo4 akü', 'enerji depolama', 'solar batarya', 'taşınabilir güç istasyonu', 'lityum akü fiyatları'],
    image: '/images/categories/batarya.png',
    imagePosition: 'center center',
    imageScale: 0.78,
  },
  'solar-sarj-kontrol': {
    title: 'Solar Şarj Kontrol Cihazları',
    description: 'MPPT ve PWM solar şarj kontrol cihazları, uzaktan izleme modülleri ve ekranlar.',
    seoDescription:
      'MPPT ve PWM solar şarj kontrol cihazı fiyatları. Güneş paneli ile akü/batarya arasında verimli şarj yönetimi için Victron, Havensis, TommaTech ve diğer markalar voltekno\'da.',
    keywords: ['mppt şarj kontrol', 'pwm şarj kontrol', 'solar şarj kontrol cihazı', 'şarj regülatörü', 'mppt fiyatları'],
  },
  'pompa-ve-surucu': {
    title: 'Solar Pompa ve Sürücüler',
    description: 'Güneş enerjili tarımsal sulama için solar pompa sürücüleri ve pompa inverterleri.',
    seoDescription:
      'Solar pompa sürücüsü fiyatları: monofaze ve trifaze solar pompa inverterleri, tarımsal sulama için güneş enerjili pompa sistemleri. Frecon, TommaTech ve daha fazlası voltekno\'da.',
    keywords: ['solar pompa sürücüsü', 'solar pompa inverteri', 'güneş enerjili sulama', 'tarımsal sulama', 'solar pompa'],
  },
  akuler: {
    title: 'Aküler',
    description: 'Kurşun asit ve jel aküler; solar sistemler, UPS ve karavan uygulamaları için.',
    seoDescription:
      'Jel akü ve kurşun asit akü fiyatları. Güneş enerjisi sistemleri, UPS ve karavan uygulamaları için derin döngü aküler voltekno\'da.',
    keywords: ['jel akü', 'kurşun asit akü', 'solar akü', 'derin döngü akü', 'akü fiyatları'],
  },
  'ruzgar-enerjisi': {
    title: 'Rüzgar Enerjisi',
    description: 'Rüzgar türbinleri, direk setleri, kanatlar ve türbin aksesuarları.',
    seoDescription:
      'Rüzgar türbini fiyatları ve aksesuarları: ev tipi rüzgar türbinleri, direk setleri, kanatlar, burun ve kuyruk parçaları. İstabreeze ürünleri voltekno\'da.',
    keywords: ['rüzgar türbini', 'ev tipi rüzgar türbini', 'rüzgar jeneratörü', 'türbin kanadı', 'rüzgar enerjisi'],
  },
  'sarj-cihazlari': {
    title: 'Şarj Cihazları',
    description: 'Akü ve batarya şarj cihazları; AC/DC şarj üniteleri.',
    seoDescription:
      'Akü şarj cihazı fiyatları: kurşun asit, jel ve lityum aküler için AC/DC şarj cihazları voltekno\'da.',
    keywords: ['akü şarj cihazı', 'lityum şarj cihazı', 'ac dc şarj', 'batarya şarj cihazı'],
  },
  'elektrikli-arac-sarj': {
    title: 'Elektrikli Araç Şarj',
    description: 'Elektrikli araç şarj istasyonları ve aksesuarları.',
    seoDescription:
      'Elektrikli araç şarj istasyonu fiyatları ve aksesuarları. Ev ve işletmeler için AC şarj çözümleri voltekno\'da.',
    keywords: ['elektrikli araç şarj istasyonu', 'ev şarj istasyonu', 'ev şarj cihazı', 'wallbox'],
  },
  'kablolar-ve-baglanti': {
    title: 'Kablolar ve Bağlantı',
    description: 'Güç ve veri kabloları, BMS ve iletişim kabloları, panel bağlantı kabloları.',
    seoDescription:
      'Güç ve veri kabloları: VE.Direct, VE.Can, BMS ve panel bağlantı kabloları. Solar ve enerji depolama sistemleri için bağlantı ürünleri voltekno\'da.',
    keywords: ['solar kablo', 've.direct kablo', 'bms kablosu', 'panel bağlantı kablosu', 'veri kablosu'],
  },
  'aksesuar-ve-koruma': {
    title: 'Aksesuar ve Koruma',
    description: 'Sistem bileşenleri, koruma ekipmanları ve tamamlayıcı aksesuarlar.',
    seoDescription:
      'Solar ve enerji depolama sistemleri için sistem bileşenleri, koruma ekipmanları ve aksesuarlar voltekno\'da.',
    keywords: ['solar aksesuar', 'sistem bileşenleri', 'koruma ekipmanı', 'enerji sistemi aksesuarı'],
  },
  diger: {
    title: 'Diğer Ürünler',
    description: 'İzleme ve kontrol cihazları, güç istasyonları, rüzgar türbini parçaları ve diğer enerji ürünleri.',
    seoDescription:
      'GX izleme cihazları, ekranlar, transfer switch, şönt, inverter ve rüzgar türbini yedek parçaları gibi diğer enerji ürünleri voltekno\'da.',
    keywords: ['gx touch', 'smart shunt', 'transfer switch', 'enerji izleme', 'rüzgar türbini parçaları'],
  },
}
