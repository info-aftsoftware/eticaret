export type PackageCategory = {
  slug: 'bag-evi-paketleri' | 'villa-paketleri' | 'karavan-paketleri' | 'sulama-paketleri' | 'marin-paketleri'
  title: string
  shortTitle: string
  image: string
  objectPosition?: string
  imageAlt: string
  description: string
  /** İngilizce kısa ad ve kart açıklaması (ana sayfa kartları) */
  en: { shortTitle: string; description: string; faq?: Array<{ question: string; answer: string }> }
  seoTitle: string
  seoDescription: string
  keywords: string[]
  searchHint: string
  /** mockProducts'taki category değerleriyle eşleşen filtre listesi */
  productCategories: string[]
  targetAudience: string
  /** Kimler için (uzun açıklama) */
  forWhom: string
  /** Kaç cihazı çalıştırır */
  deviceList: string[]
  /** Ortalama günlük kullanım */
  dailyUsage: string
  /** İçindekiler */
  includesItems: string[]
  /** Yükseltme seçenekleri */
  upgradeOptions: string[]
  useCases: string[]
  includedHighlights: string[]
  faq: Array<{ question: string; answer: string }>
  deviceCapacity?: string
  /**
   * Kullanım alanına uygunluk (madde 15): listede yalnız bu sınırlara uyan ürünler gösterilir. voltages: akü, inverter,
   * şarj cihazı gibi DC ürünlerinde izin verilen sistem voltajları (voltajı bilinmeyen DC ürünü gösterilmez);
   * maxKwh: depolama ürünlerinde azami enerji; maxWeightKg: bilinen ağırlık sınırı.
   */
  fit?: { voltages?: ('12' | '24' | '48' | 'HV')[]; maxKwh?: number; maxWeightKg?: number; /** adı bu ifadeye uyan ürünler (ör. sabit raf sistemi parçaları) listelenmez */ exclude?: RegExp; note: string; noteEn: string }
}

export const PACKAGE_CATEGORIES: PackageCategory[] = [
  {
    slug: 'bag-evi-paketleri',
    en: { shortTitle: 'Country House', description: 'Off-grid solar solutions for country and holiday homes.', faq: [{ question: 'What power range is a country house system suitable for?', answer: 'Starter options between 1 kWp and 3 kWp are recommended depending on consumption. Our team analyses your needs and determines the right capacity.' }, { question: 'How does it perform in winter?', answer: 'Although sunshine hours are shorter in winter, the right panel and battery combination easily covers basic needs such as lighting and charging.' }, { question: 'How long does installation take?', answer: 'Small country house systems can usually be installed in one working day. Delivery time to remote locations is planned separately.' }] },
    title: 'Bağ Evi Çözümleri',
    fit: { voltages: ['12', '24', '48'], maxKwh: 10, note: "yüksek gerilim (HV) ürünler hariç, 10 kWh'e kadar depolama", noteEn: 'excluding high-voltage (HV) products, storage up to 10 kWh' },
    shortTitle: 'Bağ Evi',
    image: '/images/packages/custom/bahce.jpg',
    objectPosition: 'center 52%',
    imageAlt: 'Bağ evi, dağ evi, yayla evi ve bungalov kullanımına uygun ahşap kırsal yaşam alanı',
    description: 'Bağ evi, dağ evi, yayla evi ve bungalov için panel, inverter ve batarya kombinasyonları.',
    seoTitle: 'Bağ Evi, Dağ Evi ve Bungalov Güneş Enerji Çözümleri',
    seoDescription: 'Bağ evi, dağ evi, yayla evi ve bungalov güneş enerji çözümleri: panel, inverter ve batarya çözümleriyle şebekeden bağımsız veya hibrit kullanım.',
    keywords: ['bağ evi güneş enerji paketi', 'dağ evi güneş paneli', 'yayla evi solar sistem', 'bungalov güneş enerji sistemi', 'off grid küçük ev sistemi'],
    searchHint: 'Güneş Paneli',
    productCategories: ['TopCon Güneş Paneli', 'Monokristal Güneş Paneli', 'Tam Sinüs MPPT Akıllı İnverter', 'MPPT Şarj Kontrol Cihazı', 'Lityum Akü', 'Jel Akü'],
    targetAudience: 'Hafta sonu evi, dağ evi, yayla evi veya bungalov gibi küçük yaşam alanlarında güvenli ve ekonomik enerji isteyen kullanıcılar.',
    forWhom: 'Hafta sonu veya mevsimlik kullandığı bağ, bahçe ve köy evi olan, şebekeye bağlı olmadan temel ihtiyaçlarını karşılamak isteyen kullanıcılar için tasarlandı.',
    deviceList: ['8–15 adet LED aydınlatma', 'Mini buzdolabı (90–150 W)', 'Televizyon', 'Telefon ve tablet şarjı', 'Fan veya küçük vantilatör', 'Su pompası (küçük kapasite)'],
    dailyUsage: 'Günde ortalama 4–8 saat hafif kullanım. Tipik tüketim 3–5 kWh/gün. Hafta sonu ağırlıklı; uzun süreli boş kalma dönemlerinde batarya ayakta kalır.',
    includesItems: ['1–3 kWp monokristal güneş paneli', 'Off-grid veya hibrit inverter (1–3 kW)', '2–5 kWh LiFePO4 veya GEL batarya', 'Montaj konstrüksiyonu ve kablo seti', 'MPPT şarj kontrol ünitesi'],
    upgradeOptions: ['Ek güneş paneli ekleyerek kapasite artırımı', 'Batarya modülü büyütme (ek kWh)', 'Akıllı izleme ve uygulama desteği', 'Hibrit invertera yükseltme ile şebeke entegrasyonu'],
    useCases: ['Aydınlatma', 'Küçük ev aletleri', 'Mini buzdolabı', 'Yedek enerji'],
    includedHighlights: ['Monokristal panel seçeneği', 'Hibrit/off-grid inverter uyumu', 'İsteğe bağlı batarya kapasitesi', 'Kompakt yaşam alanları için uygun kurulum'],
    deviceCapacity: '4–8 cihaz (aydınlatma, şarj cihazları, mini buzdolabı, fan)',
    faq: [
      { question: 'Bağ evi sistemi hangi güç aralığına uygundur?', answer: 'Tüketim durumuna göre 1 kWp–3 kWp arası başlangıç seçenekleri önerilir. Uzman ekibimiz ihtiyaç analizi yaparak doğru kapasiteyi belirler.' },
      { question: 'Kış aylarında performans nasıl olur?', answer: 'Kışın güneş ışınım süresi kısalsa da doğru panel ve batarya kombinasyonu ile temel ihtiyaçlar (aydınlatma, şarj) rahatlıkla karşılanabilir.' },
      { question: 'Kurulum ne kadar sürer?', answer: 'Küçük bağ evi sistemleri genellikle 1 iş gününde kurulabilir. Uzak lokasyonlar için nakliye süresi ayrıca planlanır.' },
    ],
  },
  {
    slug: 'sulama-paketleri',
    en: { shortTitle: 'Irrigation', description: 'Solar pump drives and panels for agricultural irrigation.', faq: [{ question: 'How do I choose a system for an irrigation pump?', answer: 'The right panel and inverter capacity is determined from the pump power (kW), operating time (hours/day) and daily water requirement.' }, { question: 'Do I need a battery for night irrigation?', answer: 'Yes. If you plan to irrigate at night or in cloudy weather, adding a battery module of suitable capacity is recommended.' }, { question: 'What does the system do during drought?', answer: 'With a well level sensor connected, the system automatically protects the pump against dry running and stops it.' }] },
    title: 'Sulama Çözümleri',
    shortTitle: 'Sulama',
    image: '/images/packages/custom/tarla.webp',
    objectPosition: 'center 56%',
    imageAlt: 'Tarla ve tarımsal sulama düzenine uygun sulama paketi görseli',
    description: 'Tarımsal sulama için solar pompa sürücüsü ve panel çözümleri.',
    seoTitle: 'Tarımsal Sulama için Güneş Enerjisi ve Solar Pompa Çözümleri',
    seoDescription: 'Tarla sulama pompaları için güneş enerjili sulama sistemleri, GES destekli tarımsal sulama ve solar pompa çözümleri.',
    keywords: ['tarımsal sulama güneş enerjisi', 'ges sulama sistemi', 'solar sulama pompası', 'tarla güneş paneli sulama', 'güneş enerjili su pompası'],
    searchHint: 'Solar Pompa',
    productCategories: ['Solar Pompa Sürücüsü', 'Solar Sürücü Aksesuarı', 'TopCon Güneş Paneli'],
    targetAudience: 'Tarım arazilerinde sulama maliyetini düşürmek isteyen üreticiler.',
    forWhom: 'Tarla, bahçe ve sera işleten çiftçiler, şebekeden uzak arazilerde sulama maliyetini sıfıra indirmek isteyen tarım üreticileri için geliştirildi.',
    deviceList: ['Dalgıç pompa (0.75 kW–7.5 kW)', 'Yüzey sulama pompası', 'Damlama ve yağmurlama sistemi kontrol ünitesi', 'Otomatik vana ve sensör sistemi', 'Kuyu seviye sensörü'],
    dailyUsage: 'Gündüz güneş saatlerinde 4–8 saat sürekli pompa çalışması. Tipik yaz günü üretim: 10–30 kWh. Şebekesiz çalışma ve yakıt tasarrufu ön planda.',
    includesItems: ['2–10 kWp güneş paneli dizisi', 'Solar sulama inverteri (VFD destekli)', 'Otomatik başlatma/durdurma kontrol panosu', 'Dış saha IP65+ ekipman grubu', 'Montaj konstrüksiyonu ve kablo altyapısı'],
    upgradeOptions: ['Panel dizisi büyütme ile daha derin kuyu desteği', 'Gece sulama için batarya modülü ekleme', 'GSM/uzaktan izleme ve kontrol sistemi', 'Birden fazla pompa için paralel bağlantı genişletmesi'],
    useCases: ['Gündüz sulama', 'Kuyu pompası besleme', 'Şebekeden uzak tarla uygulamaları'],
    includedHighlights: ['Sulama inverteri uyumu', 'Dış saha koşullarına dayanıklı ekipman', 'Yüksek verimli panel kombinasyonları'],
    deviceCapacity: '1–3 sulama pompası (0.5–7.5 kW)',
    faq: [
      { question: 'Sulama pompası için sistem nasıl seçilir?', answer: 'Pompa gücü (kW), çalışma süresi (saat/gün) ve günlük su ihtiyacı baz alınarak doğru panel ve inverter kapasitesi belirlenir.' },
      { question: 'Gece sulama için batarya gerekir mi?', answer: 'Evet. Gece veya bulutlu havalarda çalışma planı varsa uygun kapasitede batarya modülü eklenmesi önerilir.' },
      { question: 'Kuraklık döneminde sistem ne yapar?', answer: 'Sistem, kuyu seviyesi sensörü bağlandığında otomatik olarak kuru çalışmaya karşı koruma sağlar ve pompayı durdurur.' },
    ],
  },
  {
    slug: 'karavan-paketleri',
    en: { shortTitle: 'Caravan', description: 'Portable energy solutions for caravans and mobile living.', faq: [{ question: 'Is a fixed roof installation required on the caravan?', answer: 'Fixed or portable panels can be used depending on your needs. Portable panels can be positioned in different locations towards the sun.' }, { question: 'Does the system work independently of the grid?', answer: 'Yes. A power station and solar panel combination easily provides several days of independent use.' }, { question: 'Are there weight and size limits?', answer: 'In caravan systems low weight is the priority. A 100 W foldable panel weighs about 2–3 kg and a power station between 5 and 15 kg.' }] },
    title: 'Karavan Çözümleri',
    fit: { voltages: ['12', '24'], maxKwh: 3, exclude: /rack|modüler|alt taban|kabin/i, maxWeightKg: 25, note: "yalnız 12 V ve 24 V sistem ürünleri, 3 kWh'e kadar depolama, bilinen ağırlığı 25 kg'a kadar", noteEn: '12 V and 24 V system products only, storage up to 3 kWh, known weight up to 25 kg' },
    shortTitle: 'Karavan',
    image: '/images/packages/custom/karavan.webp',
    objectPosition: 'center 58%',
    imageAlt: 'Doğa içinde park edilmiş karavan ve mobil yaşam kullanımına uygun enerji paketi görseli',
    description: 'Karavan ve mobil yaşam için taşınabilir enerji çözümleri.',
    seoTitle: 'Karavan Güneş Paneli ve Taşınabilir Enerji Çözümleri',
    seoDescription: 'Karavan güneş paneli, taşınabilir güç istasyonu ve mobil yaşam için enerji çözümleri.',
    keywords: ['karavan güneş paneli', 'karavan enerji paketi', 'taşınabilir güç istasyonu', 'mobil yaşam güneş sistemi', 'karavan akü sistemi'],
    searchHint: 'Güç İstasyonu',
    productCategories: ['Lityum Akü', 'Esnek ve Katlanabilir Panel', 'Taşınabilir Güç İstasyonu', 'MPPT Şarj Kontrol Cihazı', 'Şarjlı Tam Sinüs İnverter', 'Akü Şarj Cihazı'],
    targetAudience: 'Mobil yaşam ve kamp kullanımında hafif, güvenli ve pratik enerji çözümü arayan kullanıcılar.',
    forWhom: 'Tatil, kamp ve uzun yol seyahati için karavan veya mobil yaşam aracı kullananlar. Şebeke bağlantısı olmadan doğada konfor arayanlar için idealdir.',
    deviceList: ['Telefon, tablet ve laptop şarjı', 'Mini kompresörlü buzdolabı (30–60 W)', 'LED aydınlatma (şerit ve taşınabilir)', 'Drone ve kamera ekipmanı şarjı', 'Taşınabilir hoparlör ve elektrikli battaniye', '12V su pompası'],
    dailyUsage: 'Günde 1–3 kWh tüketim. Hareket halinde araç şarjı ile desteklenir, park halinde güneş paneli şarjı devreye girer.',
    includesItems: ['100–400 W katlanabilir veya esnek güneş paneli', 'Taşınabilir güç istasyonu (500 Wh–2 kWh)', 'MPPT şarj kontrol cihazı', '12V/USB/AC çıkış modülleri', 'Taşıma çantası ve bağlantı kabloları'],
    upgradeOptions: ['Ek panel ile şarj hızını artırma', 'Karavan çatısına sabit panel montajı', 'Daha büyük kapasiteli güç istasyonuna geçiş', 'Araç şarj adaptörü entegrasyonu'],
    useCases: ['Telefon/laptop şarjı', 'Kamp buzdolabı', 'Mini aydınlatma sistemleri'],
    includedHighlights: ['Katlanabilir panel opsiyonları', 'Taşınabilir güç istasyonu uyumu', 'Düşük ağırlık ve kolay kurulum'],
    deviceCapacity: '3–6 cihaz (telefon, laptop, kamp buzdolabı, aydınlatma)',
    faq: [
      { question: 'Karavan çatısına sabit montaj gerekiyor mu?', answer: 'İhtiyaca göre sabit veya taşınabilir panel seçenekleri kullanılabilir. Taşınabilir paneller farklı konumlarda yönlendirilebilir.' },
      { question: 'Sistem şehir şebekesinden bağımsız çalışır mı?', answer: 'Evet. Güç istasyonu ve güneş paneli kombinasyonuyla birkaç günlük bağımsız kullanım rahatlıkla sağlanabilir.' },
      { question: 'Ağırlık ve boyut kısıtı var mı?', answer: 'Karavan sistemlerinde hafiflik önceliklidir. 100W katlanabilir panel yaklaşık 2–3 kg, güç istasyonu ise 5–15 kg arasında değişir.' },
    ],
  },
  {
    slug: 'villa-paketleri',
    en: { shortTitle: 'Villa', description: 'Hybrid energy solutions for high-consumption villas.', faq: [{ question: 'Is a battery required in a villa system?', answer: 'Not required, but a battery is strongly recommended for uninterrupted use, night-time consumption and backup during grid outages.' }, { question: 'Can the system be expanded later?', answer: 'Yes. With a modular hybrid inverter and battery setup the system can easily be expanded with extra panels or modules.' }, { question: 'Can it power a pool pump?', answer: 'Yes. With the right inverter capacity, a pool pump and similar high-power loads are powered without problems.' }] },
    title: 'Villa Çözümleri',
    fit: { voltages: ['48', 'HV'], note: 'yalnız 48 V ve yüksek gerilim (HV) sistem ürünleri', noteEn: '48 V and high-voltage (HV) system products only' },
    shortTitle: 'Villa',
    image: '/images/packages/custom/villa.jpg',
    objectPosition: 'center 52%',
    imageAlt: 'Çatısında yoğun güneş paneli kurulumu bulunan modern villa tipi konut',
    description: 'Villa tipi yüksek tüketim için hibrit enerji çözümleri.',
    seoTitle: 'Villa Güneş Enerji Çözümleri ve Hibrit İnverter Sistemleri',
    seoDescription: 'Lüks ve yüksek tüketimli konutlar için villa güneş enerji çözümleri, çatı GES çözümleri ve hibrit inverter sistemleri.',
    keywords: ['villa güneş enerji paketi', 'villa çatı ges', 'lüks konut güneş paneli', 'villa hibrit inverter', 'villa batarya depolama'],
    searchHint: 'Hibrit İnverter',
    productCategories: ['Hibrit İnverter', 'On-Grid İnverter', 'TopCon Güneş Paneli', 'Lityum Akü', 'İzleme ve Kontrol'],
    targetAudience: 'Yüksek tüketimli konutlarda tasarruf ve enerji sürekliliği arayan villa sahipleri.',
    forWhom: 'Yıl boyu veya yaz sezonunda sürekli oturulan villa ve müstakil evler için. Klima, havuz, beyaz eşya gibi yüksek güçlü cihazları olan ev sahiplerine özeldir.',
    deviceList: ['Klima sistemi (1–3 adet, 12.000–24.000 BTU)', 'Çamaşır ve bulaşık makinesi', 'Havuz pompası ve ısıtma', 'Buzdolabı ve derin dondurucu', 'Aydınlatma (iç + dış peyzaj)', 'EV şarj istasyonu (opsiyonel)'],
    dailyUsage: 'Günde ortalama 20–40 kWh tüketim. Yaz aylarında klima yüküyle pik talep yükselir. Yıl boyu sürekli ve kararlı üretim gereksinimi.',
    includesItems: ['6–12 kWp yüksek verimli güneş paneli', '5–10 kW hibrit inverter', '10–20 kWh modüler batarya depolama', 'Akıllı enerji yönetim birimi', 'Montaj altyapısı ve grid entegrasyonu'],
    upgradeOptions: ['Batarya kapasitesini genişletme', '3 fazlı sisteme yükseltme', 'EV şarj noktası entegrasyonu (V2H)', 'Uzaktan izleme ve otomasyon ekleme'],
    useCases: ['Klima ve havuz ekipmanları', 'Beyaz eşya yükleri', 'Kesinti anında yedekleme'],
    includedHighlights: ['Yüksek güçlü inverter seçenekleri', 'Akıllı enerji yönetimi', 'Genişletilebilir depolama altyapısı'],
    deviceCapacity: '15–30 cihaz (klima, beyaz eşya, aydınlatma, havuz pompası)',
    faq: [
      { question: 'Villa sisteminde batarya şart mı?', answer: 'Şart değil; ancak kesintisiz kullanım, gece tüketimi ve şebeke kesintilerinde yedekleme için batarya kesinlikle önerilir.' },
      { question: 'Sistem sonradan büyütülebilir mi?', answer: 'Evet. Modüler hibrit inverter ve batarya altyapısıyla sistem kolayca genişletilebilir, ek panel veya modül eklenebilir.' },
      { question: 'Havuz pompasını besleyebilir mi?', answer: 'Evet. Doğru inverter kapasitesi seçildiğinde havuz pompası ve benzeri yüksek güçlü yükler rahatça beslenir.' },
    ],
  },
  {
    slug: 'marin-paketleri',
    en: { shortTitle: 'Marine', description: 'Low-voltage (12/24 V) energy solutions for boats and marine use.', faq: [{ question: 'Are these products suitable for salt water conditions?', answer: 'It depends on the product. Check the protection class (IP) and salt spray resistance in the technical details on the product page; being listed here does not by itself mean marine suitability. Our technical team can help you choose.' }, { question: 'Which solution is recommended if space on the boat is limited?', answer: 'A flexible solar panel combined with a high-density LiFePO4 battery takes up the least space while providing maximum capacity.' }, { question: 'Is it compatible with an existing lead-acid battery system?', answer: 'LiFePO4 systems are usually compatible with the existing electrical setup. Checking BMS and charge controller compatibility is enough for the switch.' }] },
    title: 'Marin Çözümleri',
    fit: { voltages: ['12', '24'], maxKwh: 5, exclude: /rack|modüler|alt taban|kabin/i, maxWeightKg: 40, note: "yalnız 12 V ve 24 V sistem ürünleri, 5 kWh'e kadar depolama, bilinen ağırlığı 40 kg'a kadar", noteEn: '12 V and 24 V system products only, storage up to 5 kWh, known weight up to 40 kg' },
    shortTitle: 'Marin',
    image: '/images/packages/custom/marin.webp',
    objectPosition: 'center 60%',
    imageAlt: 'Üst güvertesinde solar panel bulunan katamaran tipi tekne için marin enerji paketi görseli',
    description: 'Tekne ve marin kullanım için düşük voltaj (12/24 V) enerji çözümleri.',
    seoTitle: 'Tekne ve Yatlar için Marin Güneş Enerji Çözümleri',
    seoDescription: 'Tekne, yat ve marin uygulamalar için tekneye entegre güneş paneli, batarya ve düşük voltaj enerji çözümleri.',
    keywords: ['marin güneş enerji paketi', 'tekne güneş paneli', 'yat solar sistem', 'marin lityum batarya', 'tekneye entegre güneş paneli'],
    searchHint: 'Marine',
    productCategories: ['Lityum Akü', 'MPPT Şarj Kontrol Cihazı', 'Şarjlı Tam Sinüs İnverter', 'Batarya Yönetimi ve Aksesuar', 'Esnek ve Katlanabilir Panel'],
    targetAudience: 'Tekne ve yatlarda güvenli, tuzlu su koşullarına uygun enerji çözümü isteyen kullanıcılar.',
    forWhom: 'Tekne, katamaran, yat ve motorbot sahipleri. Rıhtımda şebeke bağımsız kalmak veya uzun seyirlerde güvenli enerji kaynağı arayan denizci kullanıcılar için idealdir.',
    deviceList: ['VHF telsiz ve GPS navigasyon sistemi', 'Seyir ve güverte aydınlatması', 'Mini buzdolabı / soğutucu', 'Telefon, kamera ve elektronik şarjı', 'Çapa ırgat motoru (küçük tekneler)', 'Tatlı su pompası ve tuvalet sistemi'],
    dailyUsage: 'Günde 3–8 kWh tüketim. Seyir halinde rüzgar + güneş kombinasyonu ile desteklenebilir. Rıhtımda kalma süresinde güneş paneli ile tam şarj.',
    includesItems: ['Esnek veya sert monokristal marin panel (100–400 W)', 'LiFePO4 marin batarya (100–200 Ah / 12V–24V)', 'MPPT marin şarj kontrolörü', 'Deniz koşullarına uygun kablo ve konnektörler', 'Şarj durumu göstergesi (BMS dahil)'],
    upgradeOptions: ['Rüzgar türbini ile hibrit üretim sistemi', 'Yük izleme ve akıllı dağıtım paneli', 'İkinci batarya bankı (kabin + start ayrımı)', '220V invertör eklenerek AC cihaz desteği'],
    useCases: ['Aydınlatma ve elektronik sistemler', 'Navigasyon ekipmanları', 'Uzun süreli seyir destek enerjisi'],
    includedHighlights: ['Marin tip lityum batarya seçenekleri', 'Düşük voltaj sistem uyumu', 'Kompakt ve dayanıklı tasarım'],
    deviceCapacity: '5–12 deniz elektroniği (navigasyon, aydınlatma, VHF, fridge)',
    faq: [
      { question: 'Bu ürünler tuzlu su koşullarına uygun mu?', answer: 'Ürüne göre değişir. Koruma sınıfı (IP) ve tuz spreyi dayanımı ürün sayfasındaki teknik bilgilerden kontrol edilmelidir; listede bulunmak tek başına deniz koşullarına uygunluk anlamına gelmez. Seçimde teknik ekibimizden destek alabilirsiniz.' },
      { question: 'Teknede alan kısıtı varsa hangi çözüm önerilir?', answer: 'Esnek güneş paneli + yüksek yoğunluklu LiFePO4 batarya kombinasyonu en az yer kaplarken maksimum kapasiteyi sağlar.' },
      { question: 'Mevcut kurşun asit akü sistemiyle uyumlu mu?', answer: 'LiFePO4 sistemler genellikle mevcut elektrik altyapısıyla uyumludur. Geçiş için BMS ve şarj kontrolörü uyumu kontrol edilmesi yeterlidir.' },
    ],
  },
]

export function getPackageCategory(slug: string) {
  return PACKAGE_CATEGORIES.find((item) => item.slug === slug)
}
