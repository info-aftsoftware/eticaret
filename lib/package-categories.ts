export type PackageCategory = {
  slug: 'bag-evi-paketleri' | 'villa-paketleri' | 'karavan-paketleri' | 'sulama-paketleri' | 'marin-paketleri'
  title: string
  shortTitle: string
  image: string
  objectPosition?: string
  imageAlt: string
  description: string
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
}

export const PACKAGE_CATEGORIES: PackageCategory[] = [
  {
    slug: 'bag-evi-paketleri',
    title: 'Bağ Evi Paketleri',
    shortTitle: 'Bağ Evi',
    image: '/images/packages/custom/bahce.jpg',
    objectPosition: 'center 52%',
    imageAlt: 'Bağ evi, dağ evi, yayla evi ve bungalov kullanımına uygun ahşap kırsal yaşam alanı',
    description: 'Bağ evi, dağ evi, yayla evi ve bungalov için panel, inverter ve batarya kombinasyonları.',
    seoTitle: 'Bağ Evi, Dağ Evi, Yayla Evi ve Bungalov Güneş Enerji Paketleri',
    seoDescription: 'Bağ evi, dağ evi, yayla evi ve bungalov güneş enerji paketleri: panel, inverter ve batarya çözümleriyle şebekeden bağımsız veya hibrit kullanım.',
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
      { question: 'Bağ evi paketi hangi güç aralığına uygundur?', answer: 'Tüketim durumuna göre 1 kWp–3 kWp arası başlangıç seçenekleri önerilir. Uzman ekibimiz ihtiyaç analizi yaparak doğru kapasiteyi belirler.' },
      { question: 'Kış aylarında performans nasıl olur?', answer: 'Kışın güneş ışınım süresi kısalsa da doğru panel ve batarya kombinasyonu ile temel ihtiyaçlar (aydınlatma, şarj) rahatlıkla karşılanabilir.' },
      { question: 'Kurulum ne kadar sürer?', answer: 'Küçük bağ evi sistemleri genellikle 1 iş gününde kurulabilir. Uzak lokasyonlar için nakliye süresi ayrıca planlanır.' },
    ],
  },
  {
    slug: 'sulama-paketleri',
    title: 'Sulama Paketleri',
    shortTitle: 'Sulama',
    image: '/images/packages/custom/tarla.png',
    objectPosition: 'center 56%',
    imageAlt: 'Tarla ve tarımsal sulama düzenine uygun sulama paketi görseli',
    description: 'Tarımsal sulama için dayanıklı solar paketler.',
    seoTitle: 'Tarımsal Sulama için Güneş Enerjisi ve GES Paketleri',
    seoDescription: 'Tarla sulama pompaları için güneş enerjili sulama sistemleri, GES destekli tarımsal sulama paketleri ve solar pompa çözümleri.',
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
      { question: 'Sulama pompası için paket nasıl seçilir?', answer: 'Pompa gücü (kW), çalışma süresi (saat/gün) ve günlük su ihtiyacı baz alınarak doğru panel ve inverter kapasitesi belirlenir.' },
      { question: 'Gece sulama için batarya gerekir mi?', answer: 'Evet. Gece veya bulutlu havalarda çalışma planı varsa uygun kapasitede batarya modülü eklenmesi önerilir.' },
      { question: 'Kuraklık döneminde sistem ne yapar?', answer: 'Sistem, kuyu seviyesi sensörü bağlandığında otomatik olarak kuru çalışmaya karşı koruma sağlar ve pompayı durdurur.' },
    ],
  },
  {
    slug: 'karavan-paketleri',
    title: 'Karavan Paketleri',
    shortTitle: 'Karavan',
    image: '/images/packages/custom/karavan.png',
    objectPosition: 'center 58%',
    imageAlt: 'Doğa içinde park edilmiş karavan ve mobil yaşam kullanımına uygun enerji paketi görseli',
    description: 'Karavan ve mobil yaşam için taşınabilir enerji paketleri.',
    seoTitle: 'Karavan Güneş Paneli ve Taşınabilir Enerji Paketleri',
    seoDescription: 'Karavan güneş paneli, taşınabilir güç istasyonu ve mobil yaşam için enerji paketi çözümleri.',
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
      { question: 'Paket şehir şebekesinden bağımsız çalışır mı?', answer: 'Evet. Güç istasyonu ve güneş paneli kombinasyonuyla birkaç günlük bağımsız kullanım rahatlıkla sağlanabilir.' },
      { question: 'Ağırlık ve boyut kısıtı var mı?', answer: 'Karavan paketleri hafiflik öncelikli seçilir. 100W katlanabilir panel yaklaşık 2–3 kg, güç istasyonu ise 5–15 kg arasında değişir.' },
    ],
  },
  {
    slug: 'villa-paketleri',
    title: 'Villa Paketleri',
    shortTitle: 'Villa',
    image: '/images/packages/custom/villa.jpg',
    objectPosition: 'center 52%',
    imageAlt: 'Çatısında yoğun güneş paneli kurulumu bulunan modern villa tipi konut',
    description: 'Villa tipi yüksek tüketim için hibrit enerji paketleri.',
    seoTitle: 'Villa Güneş Enerji Paketleri ve Hibrit İnverter Sistemleri',
    seoDescription: 'Lüks ve yüksek tüketimli konutlar için villa güneş enerji paketleri, çatı GES çözümleri ve hibrit inverter sistemleri.',
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
      { question: 'Villa paketinde batarya şart mı?', answer: 'Şart değil; ancak kesintisiz kullanım, gece tüketimi ve şebeke kesintilerinde yedekleme için batarya kesinlikle önerilir.' },
      { question: 'Paket sonradan büyütülebilir mi?', answer: 'Evet. Modüler hibrit inverter ve batarya altyapısıyla sistem kolayca genişletilebilir, ek panel veya modül eklenebilir.' },
      { question: 'Havuz pompasını besleyebilir mi?', answer: 'Evet. Doğru inverter kapasitesi seçildiğinde havuz pompası ve benzeri yüksek güçlü yükler rahatça beslenir.' },
    ],
  },
  {
    slug: 'marin-paketleri',
    title: 'Marin Paketleri',
    shortTitle: 'Marin',
    image: '/images/packages/custom/marin.jpg',
    objectPosition: 'center 60%',
    imageAlt: 'Üst güvertesinde solar panel bulunan katamaran tipi tekne için marin enerji paketi görseli',
    description: 'Tekne ve marin kullanım için düşük voltaj enerji paketleri.',
    seoTitle: 'Tekne ve Yatlar için Marin Güneş Enerji Paketleri',
    seoDescription: 'Tekne, yat ve marin uygulamalar için tekneye entegre güneş paneli, batarya ve düşük voltaj enerji paketi çözümleri.',
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
      { question: 'Marin paketleri tuzlu su koşullarına uygun mu?', answer: 'Evet. Önerilen tüm ekipmanlar deniz koşullarına uygunluk (IP67/IP68) ve tuz spreyi dayanımı gözetilerek seçilir.' },
      { question: 'Teknede alan kısıtı varsa hangi paket önerilir?', answer: 'Esnek güneş paneli + yüksek yoğunluklu LiFePO4 batarya kombinasyonu en az yer kaplarken maksimum kapasiteyi sağlar.' },
      { question: 'Mevcut kurşun asit akü sistemiyle uyumlu mu?', answer: 'LiFePO4 sistemler genellikle mevcut elektrik altyapısıyla uyumludur. Geçiş için BMS ve şarj kontrolörü uyumu kontrol edilmesi yeterlidir.' },
    ],
  },
]

export function getPackageCategory(slug: string) {
  return PACKAGE_CATEGORIES.find((item) => item.slug === slug)
}
