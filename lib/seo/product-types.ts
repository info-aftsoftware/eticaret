/** Ürün türü (alt kategori) sayfalarının SEO içeriği — /category/<group>/<slug>. Kaynak: katalog (lib/products-mock). */
export type ProductTypeSeo = {
  slug: string
  /** product.category değeri, birebir */
  category: string
  group: 'solar-aku' | 'solar-inverter' | 'gunes-paneli' | 'solar-sarj-kontrol' | 'solar-baglanti-ekipmani' | 'ruzgar-enerjisi' | 'elektrikli-arac-sarj'
  /** Sayfadaki H1 */
  h1: string
  /** <title> — marka eki OLMADAN, 35–58 karakter, insanların aradığı ifadeyle başlasın (ör. "Lityum Akü Fiyatları ve LiFePO4 Modelleri") */
  title: string
  /** meta description — 130–158 karakter, türe özgü, somut (hangi markalar/ne işe yarar), tek tek benzersiz */
  description: string
  /** H1 altındaki giriş: 2–3 cümle — ürün nedir, kim/ne için kullanılır */
  intro: string
  /** 2–4 bölüm (H2 + 1–2 paragraf): nasıl seçilir, hangi teknik değerlere bakılır, kullanım senaryoları, kurulum/uyumluluk notları */
  guide: { heading: string; body: string }[]
  /** 2–4 gerçek alıcı sorusu ve kısa, doğru cevabı (2–3 cümle) */
  faq: { q: string; a: string }[]
  /** ilgili diğer tür slug'ları (bu listeden), 2–4 tane */
  related: string[]
  /** ilgili blog yazısı slug'ları (aşağıdaki listeden; yoksa boş dizi) */
  blog: string[]
}

// Not: guide[].body içinde paragraflar "\n\n" ile ayrılmıştır.
export const PRODUCT_TYPES: ProductTypeSeo[] = [
  // ───────────────────────────── solar-aku ─────────────────────────────
  {
    slug: 'lityum-aku',
    category: 'Lityum Akü',
    group: 'solar-aku',
    h1: 'Lityum Akü (LiFePO4)',
    title: 'Lityum Akü Fiyatları ve LiFePO4 Akü Modelleri',
    description:
      '12,8 V, 25,6 V ve 51,2 V LiFePO4 lityum aküler: TommaTech, Victron, Exelon, Apex, NP Power ve Electrozirve. Kapasite, akım ve çevrim değerleriyle seçin.',
    intro:
      "Lityum akü, güneş enerjisi sistemlerinde, karavan ve teknelerde enerji depolamak için kullanılan LiFePO4 (lityum demir fosfat) kimyalı aküdür. Kurşun-asit akülere göre daha hafiftir, kapasitesinin büyük kısmını kullanmanıza izin verir ve çok daha fazla şarj-deşarj çevrimine dayanır. Bu sayfada 12,8 V'luk karavan akülerinden 51,2 V'luk ev depolama bataryalarına kadar modelleri bulabilirsiniz.",
    guide: [
      {
        heading: '12,8 V, 25,6 V mu 51,2 V mu?',
        body:
          "LiFePO4 hücrenin nominal gerilimi 3,2 V'tur; 12,8 V akü 4, 25,6 V akü 8, 51,2 V batarya 16 hücreden oluşur. Gerilimi inverterinize göre seçin: 12 V inverterler ve karavan sistemleri için 12,8 V, 48 V akıllı ve hibrit inverterler için 51,2 V gerekir. Güç arttıkça yüksek gerilim avantaj sağlar; 5000 W'lık bir yük 48 V'ta yaklaşık 104 A çekerken 12 V'ta 400 A'in üzerine çıkar, bu da çok kalın kablo ve büyük sigorta demektir.\n\nBazı modeller seri bağlanmaya izin vermez (ör. Victron Lithium SuperPack ve TommaTech Modüler Seri). 24 V veya 48 V sistem kuracaksanız 12 V aküleri seri bağlamak yerine doğrudan o gerilimde batarya seçin.",
      },
      {
        heading: 'Kapasite nasıl hesaplanır?',
        body:
          "Enerji (Wh) = gerilim (V) × kapasite (Ah). 12,8 V 100 Ah akü 1280 Wh, 51,2 V 100 Ah batarya 5120 Wh enerji depolar. Günlük tüketiminizi Wh olarak bulun (cihaz gücü × kullanım saati), inverter kayıpları için yaklaşık %10-15 ekleyin ve bataryanın önerilen deşarj derinliğine bölün.\n\nÖrneğin günde 3000 Wh tüketen bir ev için: 3000 × 1,12 ≈ 3360 Wh; %80 deşarj derinliğiyle 3360 / 0,8 ≈ 4200 Wh kapasite gerekir. 5,12 kWh'lik bir 51,2 V 100 Ah batarya bu ihtiyacı karşılar. Tamamen şebekeden bağımsız sistemlerde bulutlu günler için ek kapasite planlamak yerinde olur.",
      },
      {
        heading: 'Akım, çevrim ömrü ve haberleşme',
        body:
          "Bataryanın sürekli deşarj akımı, inverterin aküden çektiği akımı karşılamalıdır. Örneğin TommaTech PB Serisi 51,2 V 100 Ah modelde sürekli deşarj 120 A, sürekli şarj 50 A'dir; Victron SuperPack 12,8 V 60 Ah ise 30 A ile sınırlıdır ve büyük inverterler için uygun değildir. Çevrim ömrü değerlerini karşılaştırırken hangi deşarj derinliği ve sıcaklıkta ölçüldüğüne bakın.\n\nHibrit ve akıllı inverterlerle kullanılacak 51,2 V bataryalarda CAN veya RS485 haberleşmesi önemlidir; inverter, şarj akımını ve gerilimini bataryanın BMS'inden aldığı bilgiye göre ayarlar. Satın almadan önce inverterin uyumlu batarya listesini kontrol edin.",
      },
    ],
    faq: [
      {
        q: 'Lityum akü eksi derecede şarj edilebilir mi?',
        a: "LiFePO4 aküler 0 °C'nin altında şarj edilmemelidir; katalogdaki modellerde şarj sıcaklığının alt sınırı 0 °C'dir. Deşarj ise -20 °C'ye kadar mümkündür. Soğuk ortamda kullanılacaksa aküyü yalıtılmış ve donmayan bir bölmeye yerleştirin.",
      },
      {
        q: 'Kurşun-asit akü şarj cihazımla lityum akü şarj olur mu?',
        a: "Şarj cihazının LiFePO4 profili veya ayarlanabilir şarj gerilimi olmalıdır. 12,8 V aküler için absorption gerilimi tipik olarak 14,2-14,4 V'tur (Victron SuperPack değerleri). Eşitleme (equalize) veya desülfatasyon modu olan kurşun-asit profilleri lityum aküde kullanılmamalıdır.",
      },
      {
        q: 'Farklı marka lityum aküleri paralel bağlayabilir miyim?',
        a: 'Önerilmez. Paralel bağlanacak bataryalar aynı model ve kapasitede, mümkünse aynı üretim döneminden olmalı ve bağlamadan önce gerilimleri eşitlenmelidir. Paralel bağlanabilecek adet modele göre değişir; örneğin TommaTech PB Serisi 32, Modüler Seri 16 adede kadar paralel bağlanabilir.',
      },
    ],
    related: ['jel-aku', 'batarya-yonetimi-ve-aksesuar', 'tam-sinus-mppt-akilli-inverter', 'hibrit-inverter'],
    blog: ['lityum-vs-kursum-asit', 'karavan-enerji-paketi'],
  },
  {
    slug: 'jel-aku',
    category: 'Jel Akü',
    group: 'solar-aku',
    h1: 'Jel Akü',
    title: 'Jel Akü Fiyatları ve 12 V Solar Jel Akü Modelleri',
    description:
      'Solar ve yedek güç sistemleri için 12 V jel aküler: Exelon, Apex Safepower ve NP Power 100, 150 ve 200 Ah modeller. Seri bağlantı ve şarj ayarı rehberi.',
    intro:
      'Jel akü, elektroliti silika ile jelleştirilmiş, kapalı ve bakım gerektirmeyen bir kurşun-asit akü türüdür. Sıvı elektrolitli akülere göre derin deşarja daha dayanıklıdır; off-grid güneş sistemlerinde, yedek güç ve UPS uygulamalarında kullanılır. Kataloğumuzdaki jel aküler 12 V nominal gerilimli olup 100, 150 ve 200 Ah kapasitelerdedir.',
    guide: [
      {
        heading: 'Kullanılabilir kapasite ne kadar?',
        body:
          "Kurşun-asit akülerde ömür, her çevrimde aküyü ne kadar derin boşalttığınıza bağlıdır. Günlük döngüde kullanılan jel aküler için deşarj derinliğini %50 civarında tutmak yaygın bir öneridir. Bu durumda 12 V 200 Ah bir jel akü (2400 Wh) günlük olarak yaklaşık 1200 Wh enerji sağlar.\n\nEtikette yazan Ah değeri belirli bir deşarj süresine göre verilir (ör. 10 veya 20 saat). Yüksek akım çekildiğinde alınabilen kapasite düşer; inverter gücünüz yüksekse kapasiteyi pay bırakarak seçin.",
      },
      {
        heading: '24 V ve 48 V sistem nasıl kurulur?',
        body:
          '12 V jel aküleri seri bağlayarak sistem gerilimini yükseltirsiniz: 2 akü 24 V, 4 akü 48 V verir. Seri dizideki aküler aynı marka, model, kapasite ve yaşta olmalıdır; eski ve yeni akü birlikte kullanılırsa zayıf olan sürekli aşırı deşarj olur. Uzun dizilerde aküler arası gerilim farkını dengelemek için akü dengeleyici kullanılabilir.\n\nKapasiteyi artırmak için paralel dizi eklenebilir, ancak çok sayıda paralel dizi dengesiz şarja yol açar. Pratikte 2-3 paralel diziyi aşmamak tercih edilir.',
      },
      {
        heading: 'Şarj ayarlarında nelere dikkat edilmeli?',
        body:
          'Jel aküler aşırı şarj gerilimine karşı hassastır. Şarj kontrol cihazında ve inverterde GEL (jel) profilini seçin veya gerilimleri akü üreticisinin değerlerine göre ayarlayın; eşitleme (equalize) modunu kapatın. Sıcak ortam akü ömrünü kısaltır; aküleri serin ve havalandırılan bir yere yerleştirin, mümkünse sıcaklık sensörlü şarj kontrol cihazı kullanın.',
      },
    ],
    faq: [
      {
        q: 'Jel akü mü lityum akü mü almalıyım?',
        a: 'Jel akü ilk yatırımda daha ekonomiktir ve seyrek kullanılan yedek güç sistemleri için yeterli olabilir. Her gün derin döngü yapılan sistemlerde lityum akü, kullanılabilir kapasitesi ve çevrim ömrü nedeniyle uzun vadede genellikle daha avantajlıdır. Ayrıntılı karşılaştırma için lityum ve kurşun-asit akü yazımıza bakabilirsiniz.',
      },
      {
        q: 'Jel akü kapalı alanda kullanılabilir mi?',
        a: 'Jel aküler kapalı (VRLA) yapıdadır ve normal kullanımda gaz çıkışı çok düşüktür, bu nedenle iç mekânda kullanılabilir. Aşırı şarjda gaz çıkabileceği için akü bölmesinin havalandırılması ve şarj ayarlarının doğru yapılması yine de gereklidir.',
      },
      {
        q: 'Jel akü ile AGM akü arasındaki fark nedir?',
        a: "İkisi de kapalı kurşun-asit aküdür. AGM'de elektrolit cam elyaf ayırıcılara emdirilmiştir ve kısa sürede yüksek akım vermeye daha uygundur; jel akü ise yavaş ve derin deşarjlı döngüsel kullanıma daha dayanıklıdır. Güneş enerjisi depolamasında bu nedenle jel akü sık tercih edilir.",
      },
    ],
    related: ['lityum-aku', 'pwm-sarj-kontrol-cihazi', 'mppt-sarj-kontrol-cihazi', 'batarya-yonetimi-ve-aksesuar'],
    blog: ['lityum-vs-kursum-asit'],
  },
  {
    slug: 'batarya-yonetimi-ve-aksesuar',
    category: 'Batarya Yönetimi ve Aksesuar',
    group: 'solar-aku',
    h1: 'Batarya Yönetim Sistemi (BMS) ve Akü Aksesuarları',
    title: 'Batarya Yönetim Sistemi (BMS) ve Akü Aksesuarları',
    description:
      'Victron smallBMS, VE.Bus BMS ve Smart BMS, TommaTech HV/LV BMS, Havensis shunt akü monitörü, akü birleştirici, dengeleyici ve modüler batarya kablo setleri.',
    intro:
      "Bu kategori, lityum bataryaları güvenli çalıştıran batarya yönetim sistemlerini (BMS) ve akü grubunu izlemeye, bağlamaya ve dengelemeye yarayan aksesuarları kapsar. Victron lityum aküler için harici BMS'ler, TommaTech Hightech Power S bataryaların kontrol birimleri, akım ölçen shunt monitörleri ve batarya kablo setleri burada yer alır.",
    guide: [
      {
        heading: 'Harici BMS ne zaman gerekir?',
        body:
          "Bazı lityum aküler BMS'i kendi içinde taşır, bazıları ise hücreleri izleyip koruma kararını harici bir BMS'e bırakır. Victron Lithium Battery Smart serisi ikinci gruptadır ve smallBMS, VE.Bus BMS V2 veya Smart BMS ile çalışır; Lithium NG aküler için ise NG sürümleri (smallBMS NG, VE.Bus BMS NG) gerekir. BMS, hücre gerilimi veya sıcaklık sınıra ulaştığında şarj kaynaklarını ve yükleri kapatarak aküyü korur.\n\nTommaTech Hightech Power S yüksek voltaj sisteminde BMS, seri bağlanan 4 kWh modüllerin kontrol birimidir ve inverterle haberleşir. AIO ve standart sürümler farklı inverter serileriyle eşleşir; inverter modelinize uygun olanı seçin.",
      },
      {
        heading: 'Akünün doluluk oranı nasıl izlenir?',
        body:
          "Akünün gerçek doluluk oranını (SOC) yalnızca gerilimden tahmin etmek, özellikle lityum akülerde yanıltıcıdır. Shunt tipi akü monitörü akünün eksi hattına bağlanır, giren ve çıkan akımı sayarak doluluk oranını hesaplar. Havensis HVSS-500, 500 A'e kadar akımda ve 9-70 V DC aralığında çalışır, verileri Bluetooth ile telefona aktarır.\n\nVictron Smart Battery Sense ise akü gerilimini ve sıcaklığını kablosuz ölçüp VE.Smart ağındaki şarj cihazlarına iletir; böylece şarj gerilimi gerçek akü değerlerine göre ayarlanır.",
      },
      {
        heading: 'Akü birleştirici ve dengeleyici ne işe yarar?',
        body:
          'Karavan ve teknelerde marş aküsü ile servis aküsünü birlikte şarj etmek için akü birleştirici (ör. Victron Cyrix-ct 120 A) kullanılır. Şarj gerilimi algılandığında aküleri birleştirir, motor durunca ayırarak marş aküsünün boşalmasını önler. Seri bağlı 12 V kurşun-asit akülerde ise Victron Battery Balancer aküler arasındaki gerilim farkını dengeler; lityum akülerde hücre dengelemesini BMS yapar.',
      },
    ],
    faq: [
      {
        q: 'Her lityum aküye harici BMS gerekir mi?',
        a: "Hayır. Dahili BMS'li lityum aküler ayrı bir BMS'e ihtiyaç duymaz. Harici BMS, hücre izlemeyi yapan ancak koruma kararını dış birime bırakan akü sistemleri (ör. Victron Lithium Smart ve NG serileri) için gereklidir; ürün sayfasındaki uyumlu akü bilgisini kontrol edin.",
      },
      {
        q: 'Akü monitörü ile BMS aynı şey mi?',
        a: 'Değildir. Akü monitörü akım ve gerilimi ölçerek doluluk oranını gösterir, aküyü kendi başına korumaz. BMS ise hücre gerilimi, sıcaklık ve akım sınırları aşıldığında şarjı veya deşarjı keserek aküyü korur.',
      },
      {
        q: 'Modüler bataryalarda kablo seti neden önemli?',
        a: 'Paralel bağlanan bataryaların akımı eşit paylaşması için kablo uzunluklarının ve kesitlerinin eşit olması gerekir. Batarya modeline uygun paralel ve seri kablo setlerini kullanmak bağlantı noktalarında ısınmayı ve dengesiz yüklenmeyi önler.',
      },
    ],
    related: ['lityum-aku', 'izleme-ve-kontrol', 'sigorta-ve-dagitim', 'kablo-ve-konnektor'],
    blog: ['lityum-vs-kursum-asit'],
  },
  {
    slug: 'tasinabilir-guc-istasyonu',
    category: 'Taşınabilir Güç İstasyonu',
    group: 'solar-aku',
    h1: 'Taşınabilir Güç İstasyonu',
    title: 'Taşınabilir Güç İstasyonu: LiFePO4 Kamp Bataryası',
    description:
      'TommaTech 448 Wh ve 512 Wh LiFePO4 taşınabilir güç istasyonları: 500 W AC çıkış, USB-C, 12 V çıkış ve MPPT solar şarj girişi. Kamp, karavan ve kesinti için.',
    intro:
      'Taşınabilir güç istasyonu; lityum bataryayı, inverteri, şarj devresini ve prizleri tek gövdede birleştiren, kurulum gerektirmeyen bir enerji kaynağıdır. Kampta, karavanda, saha çalışmalarında ve elektrik kesintilerinde dizüstü bilgisayar, aydınlatma, modem ve küçük cihazları çalıştırmak için kullanılır.',
    guide: [
      {
        heading: 'Kapasite (Wh) ile çıkış gücü (W) arasındaki fark',
        body:
          "Wh, cihazın ne kadar enerji depoladığını; W ise aynı anda ne kadar güç verebildiğini gösterir. 500 W AC çıkışlı bir istasyona su ısıtıcısı veya saç kurutma makinesi gibi 1500-2000 W çeken cihazlar bağlanamaz; bağlanan cihazların toplam gücü çıkış değerinin altında kalmalıdır.\n\nKullanım süresini kabaca kapasite × 0,85 / cihaz gücü ile hesaplayabilirsiniz (0,85 inverter kayıpları içindir). Örneğin 512 Wh'lik bir istasyon 50 W çeken bir cihazı yaklaşık 8-9 saat çalıştırır. USB-C ve 12 V çıkışlarda inverter devreye girmediği için kayıp daha düşüktür.",
      },
      {
        heading: 'Güneş paneliyle nasıl şarj edilir?',
        body:
          "Kataloğumuzdaki istasyonlarda MPPT solar şarj girişi bulunur; Plus 500W modeli 200 W'a, R Serisi 120 W'a kadar panel gücü kabul eder. Panelin açık devre gerilimi (Voc) istasyonun solar giriş aralığında olmalıdır. MC4 konnektörlü panelleri bağlamak için modelinize uygun dönüşüm kablosu (MC4-XT60 veya MC4-DC5525) gerekir.",
      },
      {
        heading: 'Neden LiFePO4 batarya?',
        body:
          "Bu istasyonlarda LiFePO4 kimyası kullanılır ve üretici %80 kapasiteye kadar 4000'in üzerinde çevrim belirtir. Bu kimya termal açıdan kararlıdır, ancak 0 °C'nin altında şarj edilmemelidir. Uzun süre kullanmayacaksanız cihazı yarı dolu saklayıp birkaç ayda bir şarj etmeniz bataryanın sağlığı için iyidir.",
      },
    ],
    faq: [
      {
        q: 'Taşınabilir güç istasyonu buzdolabını çalıştırır mı?',
        a: "Kompresörlü küçük buzdolaplarının çalışma gücü genellikle 500 W'ın altındadır, ancak kalkışta birkaç kat fazla güç çekebilir. İstasyonun tepe gücünü buzdolabının etiket değerleriyle karşılaştırın; çalışma süresini bulmak için istasyon kapasitesini buzdolabının saatlik ortalama tüketimine bölün.",
      },
      {
        q: 'Panelle tam şarj ne kadar sürer?',
        a: "Süre panelin gerçek üretimine bağlıdır. 200 W'lık bir panel iyi güneşte çoğunlukla etiket gücünün altında, örneğin 140-160 W üretir; bu durumda 512 Wh'lik bir istasyon yaklaşık 3,5-4 saatte dolar. Bulutlu havada ve panel güneşe dik yönlendirilmediğinde süre uzar.",
      },
      {
        q: 'Güç istasyonu ile karavan akü sistemi arasındaki fark nedir?',
        a: 'Güç istasyonu bataryayı, inverteri ve şarj devresini hazır bir pakette sunar; taşınır ve kurulum gerektirmez. Karavan akü sistemi ise daha büyük kapasite ve güce ölçeklenebilir, ancak inverter, şarj kontrol cihazı, sigorta ve kablolamanın ayrı ayrı seçilip kurulmasını gerektirir.',
      },
    ],
    related: ['esnek-ve-katlanabilir-panel', 'kablo-ve-konnektor', 'lityum-aku'],
    blog: ['karavan-enerji-paketi'],
  },

  // ─────────────────────────── solar-inverter ───────────────────────────
  {
    slug: 'tam-sinus-mppt-akilli-inverter',
    category: 'Tam Sinüs MPPT Akıllı İnverter',
    group: 'solar-inverter',
    h1: 'Tam Sinüs MPPT Akıllı İnverter (Off-Grid)',
    title: 'Akıllı İnverter Fiyatları: Tam Sinüs MPPT Off-Grid',
    description:
      'MPPT solar şarjlı tam sinüs akıllı (off-grid) inverterler: TommaTech, Exelon, Apex, NP Power, Deye ve Victron; 12, 24 ve 48 V, 1-12 kW arası modeller.',
    intro:
      "Tam sinüs MPPT akıllı inverter; inverteri, solar şarj kontrol cihazını ve şebeke/jeneratör akü şarj cihazını tek kutuda birleştiren off-grid cihazdır. Bağ evleri, şebekesi olmayan çiftlikler ve sık elektrik kesintisi yaşanan yerler için akülü güneş sisteminin merkezidir. Kataloğumuzda 1 kW'tan 12 kW'a kadar 12 V, 24 V ve 48 V modeller bulunur.",
    guide: [
      {
        heading: 'Güç ve akü gerilimi nasıl seçilir?',
        body:
          'Aynı anda çalışacak cihazların toplam gücünü bulun ve üzerine pay bırakın. Buzdolabı, su pompası ve klima gibi motorlu cihazlar kalkışta çalışma gücünün birkaç katını çeker; inverterin tepe gücü (kataloğumuzdaki TommaTech modellerde nominal gücün 2 katı) bu anlık yükü karşılamalıdır.\n\nAkü gerilimi güce göre belirlenir: 1-1,5 kW modeller 12 V, 3-4,2 kW modeller 24 V, 5 kW ve üzeri modeller 48 V aküyle çalışır. Yüksek gerilim aynı güçte daha düşük akım, daha ince kablo ve daha az kayıp demektir.',
      },
      {
        heading: 'PV girişi ve MPPT aralığı',
        body:
          "Panel dizisinin açık devre gerilimi (Voc) en soğuk günde bile inverterin maksimum PV gerilimini aşmamalı, çalışma gerilimi (Vmp) ise MPPT aralığında kalmalıdır. Örneğin TommaTech ProX 8K'da maksimum PV gerilimi 500 V, MPPT aralığı 90-450 V'tur; Voc'si 39,31 V olan 450 Wp TOPCon panellerle dizi başına 10 panel soğuk havada da güvenli sınır içinde kalır.\n\nAynı kategoride bazı giriş seviyesi modellerde (TommaTech New serisinin MPPT ibaresi taşımayan modelleri gibi) solar şarj PWM tiplidir. MPPT istiyorsanız ürün sayfasındaki 'Solar şarj tipi' satırına bakın.",
      },
      {
        heading: 'Şebeke ve jeneratörle birlikte kullanım',
        body:
          'Akıllı inverterler AC girişe bağlanan şebeke veya jeneratörle aküyü şarj edebilir ve gerektiğinde yükleri doğrudan bu kaynaktan besler. Öncelik ayarıyla güneşi, aküyü veya şebekeyi öne alabilirsiniz. Bu kategorideki cihazların çoğu şebekeye enerji vermek için tasarlanmamıştır; şebekeye bağlı öz tüketim sistemi kuracaksanız hibrit inverterlere bakın.\n\nDaha yüksek güç gerekirse bazı modeller paralel çalışabilir; örneğin TommaTech PlusX 11K 6 üniteye kadar paralel bağlanabilir.',
      },
    ],
    faq: [
      {
        q: 'Akıllı inverter ile hibrit inverter arasındaki fark nedir?',
        a: 'Akıllı (off-grid) inverter aküyü merkeze alır ve şebekeyi yalnızca yedek şarj kaynağı olarak kullanır. Hibrit inverter ise şebekeye bağlı çalışır, fazla üretimi şebekeye verebilir ve aküyü depolama için kullanır. Şebekesi olmayan yerlerde akıllı inverter, şebekeli binalarda öz tüketimi artırmak için hibrit inverter tercih edilir.',
      },
      {
        q: 'Transfer süresi ne anlama gelir?',
        a: "Şebeke kesildiğinde inverterin aküden beslemeye geçme süresidir. TommaTech modellerde bu süre bilgisayar modunda 10 ms, ev aletleri modunda 20 ms'dir. Masaüstü bilgisayar gibi hassas cihazlar için bilgisayar (UPS) modunu seçin.",
      },
      {
        q: 'Akıllı inverter lityum aküyle kullanılabilir mi?',
        a: 'Evet. TommaTech ProX serisinde BMS haberleşmesi için RS485 portu bulunur ve inverter şarjı bataryanın bilgisine göre yönetir. Haberleşme kurulamayan modellerde şarj ve kesme gerilimlerini akü üreticisinin değerlerine göre elle ayarlamanız gerekir.',
      },
    ],
    related: ['lityum-aku', 'hibrit-inverter', 'sarjli-tam-sinus-inverter', 'topcon-gunes-paneli'],
    blog: ['hibrit-inverter-nedir', 'lityum-vs-kursum-asit'],
  },
  {
    slug: 'hibrit-inverter',
    category: 'Hibrit İnverter',
    group: 'solar-inverter',
    h1: 'Hibrit İnverter',
    title: 'Hibrit İnverter Fiyatları: Monofaze ve Trifaze',
    description:
      'TommaTech Uno/Trio Hybrid ve Deye hibrit inverterler: 5-80 kW, monofaze ve trifaze, 48 V (LV) ve yüksek voltaj (HV) batarya uyumlu modeller ve seçim rehberi.',
    intro:
      'Hibrit inverter, çatıdaki güneş panellerini, bataryayı ve şebekeyi tek cihazda yöneten inverterdir. Gündüz üretilen enerji önce binanın tüketimini karşılar, artan kısım bataryaya depolanır, gerekirse şebekeye verilir. Şebeke kesildiğinde yedek çıkışa bağlı yükler bataryadan beslenmeye devam eder.',
    guide: [
      {
        heading: 'LV mi HV mi?',
        body:
          "Düşük voltaj (LV) hibrit inverterler 48 V nominal (40-60 V aralığında) bataryalarla çalışır. 51,2 V LiFePO4 bataryalar bu sınıftadır ve paralel bağlanarak kapasite artırılır; LV modellerin çoğu kurşun-asit akü de kabul eder. Yüksek voltaj (HV) modeller ise seri bağlı modüllerden oluşan yüzlerce voltluk bataryalarla çalışır; örneğin TommaTech Hightech Power S sistemi 166,4-700,8 V aralığındadır.\n\nHV sistemlerde aynı güç için batarya akımı çok daha düşüktür, bu da yüksek güçlü trifaze kurulumlarda kablolamayı kolaylaştırır. LV sistemler ise daha esnek batarya seçeneği sunar. İnverter ile bataryanın üreticinin uyumluluk listesinde birlikte yer aldığından emin olun.",
      },
      {
        heading: 'Monofaze mi trifaze mi, kaç kW?',
        body:
          "İnverterin fazı elektrik aboneliğinize uymalıdır: monofaze bağlantılar için TommaTech Uno Hybrid ve Deye monofaze modeller (5-16 kW), trifaze bağlantılar için Trio Hybrid, F Serisi ve Deye trifaze modeller (8-80 kW) kullanılır. Güç seçiminde hem panel kurulu gücünü hem de kesintide yedek çıkışta aynı anda çalışacak yükleri hesaba katın.\n\nPanel tarafında inverterin maksimum PV bağlantı gücü ve MPPT sayısı önemlidir. Örneğin Uno Hybrid N6K 12.000 W'a kadar panel bağlantısına izin verir ve 2 MPPT girişiyle iki farklı çatı yüzeyini ayrı ayrı çalıştırabilir.",
      },
      {
        heading: 'Yedek çıkış ve şebekeye verilen enerjinin sınırlanması',
        body:
          'Hibrit inverterin yedek (backup) çıkışı, kesintide beslenmeye devam edecek devreler için ayrı bir panoya bağlanır. Yedek çıkışın sürekli ve anlık güç değerlerini kontrol edin; TommaTech LV modellerde off-grid tepe güç 10 saniye için nominal gücün 2 katı, HV modellerde 1,5 katıdır.\n\nŞebekeye enerji verilmesi istenmiyorsa veya sınırlandırılması gerekiyorsa inverter, sayaç noktasına takılan akıllı sayaçla enerji akışını ölçerek ihracatı sınırlar. Şebekeye bağlı her sistem için dağıtım şirketinin bağlantı onayı gerekir.',
      },
    ],
    faq: [
      {
        q: 'Hibrit inverter bataryasız çalışır mı?',
        a: 'Birçok hibrit inverter bataryasız olarak şebekeye bağlı çalışabilir ve bataryanın sonradan eklenmesine izin verir. Ancak kesinti anında yedek çıkış bataryasız çalışmaz veya çok sınırlı çalışır. Bu özelliği seçtiğiniz modelin kılavuzundan doğrulayın.',
      },
      {
        q: 'Hibrit inverter ile on-grid inverter arasındaki fark nedir?',
        a: 'On-grid inverter yalnızca şebekeye bağlı çalışır; şebeke kesildiğinde güvenlik gereği kapanır ve binayı besleyemez. Hibrit inverter bataryaya bağlanır, kesintide yedek çıkışı beslemeye devam eder ve gündüz üretilen enerjiyi akşam kullanmanızı sağlar.',
      },
      {
        q: 'Mevcut on-grid sistemime batarya ekleyebilir miyim?',
        a: 'On-grid inverterler batarya bağlantısını desteklemez. Batarya eklemek için ya on-grid inverterin yerine hibrit inverter kurulur ya da AC tarafına bağlanan ayrı bir depolama çözümü planlanır. Hangi yolun uygun olduğu sistem gücüne ve mevcut tesisata bağlıdır.',
      },
    ],
    related: ['lityum-aku', 'on-grid-inverter', 'izleme-ve-kontrol', 'batarya-yonetimi-ve-aksesuar'],
    blog: ['hibrit-inverter-nedir', 'ges-nasil-kurulur'],
  },
  {
    slug: 'on-grid-inverter',
    category: 'On-Grid İnverter',
    group: 'solar-inverter',
    h1: 'On-Grid İnverter (Şebeke Bağlantılı)',
    title: 'On-Grid İnverter Fiyatları: Şebeke Bağlantılı GES',
    description:
      'Çatı ve arazi GES için Deye ve TommaTech on-grid inverterler: 3-10 kW monofaze, 5-100 kW trifaze modeller. MPPT sayısı, PV gerilimi ve dizi tasarımı rehberi.',
    intro:
      'On-grid (şebeke bağlantılı) inverter, güneş panellerinin ürettiği doğru akımı şebekeyle senkron alternatif akıma çevirir ve bataryasız çalışır. Üretilen enerji önce binada tüketilir, fazlası şebekeye verilir. Konut çatıları, işletme ve tarım tesisleri ile arazi santralleri için kullanılır.',
    guide: [
      {
        heading: 'Dizi (string) tasarımı nasıl yapılır?',
        body:
          "Seri bağlı panellerin toplam açık devre gerilimi soğuk havada yükselir ve inverterin maksimum PV gerilimini hiçbir koşulda aşmamalıdır. Örneğin Voc'si 39,31 V ve Voc sıcaklık katsayısı -0,26 %/°C olan 450 Wp TOPCon panel -10 °C'de yaklaşık 42,9 V verir; maksimum PV gerilimi 550 V olan TommaTech Uno Atom N3K'ya bu panelden dizi başına en fazla 12 adet bağlanabilir.\n\nDizinin çalışma gerilimi sıcak günlerde de MPPT aralığının altına düşmemelidir. Panel akımı ise MPPT başına izin verilen maksimum akımı aşmamalıdır; yüksek akımlı ve bifacial panellerde bu sınırı özellikle kontrol edin.",
      },
      {
        heading: 'MPPT sayısı neden önemli?',
        body:
          "Farklı yöne bakan veya farklı eğimdeki çatı yüzeyleri ayrı MPPT girişlerine bağlanmalıdır; aynı MPPT'ye bağlanırsa zayıf olan dizi diğerini de aşağı çeker. Uno Home N5K'da 2, Trio Zen 40 kW'ta 3, Trio Force 100 kW'ta 6 MPPT bulunur. Gölgelenme riski olan çatılarda daha fazla MPPT, dizileri ayrı ayrı optimize etme imkânı verir.",
      },
      {
        heading: 'İnverter gücü ile panel gücü oranı',
        body:
          "Paneller çoğu zaman etiket gücünün altında ürettiği için panel kurulu gücü genellikle inverter AC gücünden bir miktar yüksek seçilir. Üst sınırı inverterin veri sayfasındaki 'maksimum PV giriş gücü' belirler; örneğin Uno Home N5K'da 7,5 kW, Trio Evo 30 kW'ta 39 kW'tır. Monofaze veya trifaze seçimi ise elektrik aboneliğinize ve dağıtım şirketinin bağlantı görüşüne göre yapılır.",
      },
    ],
    faq: [
      {
        q: 'Elektrik kesildiğinde on-grid inverter çalışır mı?',
        a: 'Hayır. On-grid inverterler ada modu (anti-islanding) koruması gereği şebeke kesildiğinde üretimi durdurur; bu, hatta çalışan teknisyenlerin güvenliği içindir. Kesintide de elektrik istiyorsanız hibrit inverter ve batarya gerekir.',
      },
      {
        q: 'On-grid inverter dış mekâna monte edilebilir mi?',
        a: "Kataloğumuzdaki TommaTech on-grid inverterler IP65 koruma sınıfındadır ve dış mekânda kullanılabilir. Yine de doğrudan güneş almayan, hava akışı olan bir yer seçin; inverterler 45 °C'nin üzerinde kendini korumak için çıkış gücünü düşürür.",
      },
      {
        q: 'Üretimi nasıl takip ederim?',
        a: 'İnverterler RS485 haberleşmesine ve opsiyonel Wi-Fi, GPRS veya 4G modüllerine sahiptir; bu modüllerle üretimi mobil uygulama veya web portalından izleyebilirsiniz. Binanın tüketimini ve şebekeye verilen enerjiyi de görmek için akıllı sayaç eklenir.',
      },
    ],
    related: ['topcon-gunes-paneli', 'hibrit-inverter', 'izleme-ve-kontrol', 'kablo-ve-konnektor'],
    blog: ['ges-nasil-kurulur', 'gunes-paneli-verimlilik'],
  },
  {
    slug: 'tam-sinus-inverter',
    category: 'Tam Sinüs İnverter',
    group: 'solar-inverter',
    h1: 'Tam Sinüs İnverter',
    title: 'Tam Sinüs İnverter Fiyatları: 12 V ve 24 V Modeller',
    description:
      'Aküden şebeke kalitesinde 230 V üreten tam sinüs inverterler: Alpex, Apex, NP Power, Electrozirve ve Victron Phoenix; 250 VA ile 3000 W arası modeller.',
    intro:
      'Tam sinüs inverter, akünün 12 V veya 24 V doğru akımını şebekedeki gibi düzgün sinüs dalgalı 230 V alternatif akıma çevirir. Karavan, tekne, araç, bağ evi ve küçük solar sistemlerde buzdolabı, televizyon, dizüstü bilgisayar ve elektrikli el aletlerini çalıştırmak için kullanılır. Bu kategorideki modellerde şebeke şarjı yoktur; aküyü ayrı bir kaynakla şarj etmeniz gerekir.',
    guide: [
      {
        heading: 'Kaç watt inverter gerekir?',
        body:
          'Aynı anda çalışacak cihazların güçlerini toplayın ve %20-30 pay ekleyin. Kompresörlü buzdolabı, matkap ve pompa gibi motorlu cihazlar kalkışta çalışma gücünün birkaç katını çeker; inverterin anlık (tepe) gücü bu değeri karşılamalıdır. Yalnızca televizyon ve aydınlatma için 300-600 W, mikrodalga fırın veya el aletleri için 1500-2000 W sınıfı tercih edilir.',
      },
      {
        heading: 'Akü ve kablo nasıl boyutlandırılır?',
        body:
          "İnverter aküden yaklaşık güç / akü gerilimi kadar akım çeker, buna verim kayıpları eklenir. 1000 W'lık bir yük 12 V aküden 90 A'in üzerinde, 24 V aküden yaklaşık 45-50 A akım çeker. Bu yüzden 1500 W üzerindeki sistemlerde 24 V tercih etmek kabloyu inceltir ve kayıpları azaltır.\n\nAkü ile inverter arasındaki kabloyu kısa tutun, kesitini inverter kılavuzundaki değere göre seçin ve akünün artı kutbuna yakın bir sigorta takın. İnce kablo gerilim düşümüne, inverterin düşük gerilim alarmına ve kablonun ısınmasına yol açar.",
      },
      {
        heading: 'Tam sinüs mü modifiye sinüs mü?',
        body:
          'Motorlu cihazlar, kompresörler, ses sistemleri, tıbbi cihazlar ve elektronik kartlı cihazlar tam sinüs inverterle sorunsuz çalışır. Modifiye sinüs inverter daha ucuzdur ancak bu cihazlarda ısınma, uğultu veya arızaya yol açabilir. Bağlayacağınız cihazlardan emin değilseniz tam sinüs inverter seçin.',
      },
    ],
    faq: [
      {
        q: 'İnverter yük yokken aküyü boşaltır mı?',
        a: 'İnverter açıkken yük bağlı olmasa da bir miktar boşta tüketim yapar; bu değer küçük modellerde düşük, büyük inverterlerde daha yüksektir. Uzun süre kullanmayacağınızda inverteri kapatın; ulaşılması zor yerlere monte edilen inverterler için uzaktan kumanda kullanabilirsiniz.',
      },
      {
        q: '12 V inverteri 24 V aküye bağlayabilir miyim?',
        a: 'Hayır. İnverterin giriş gerilimi akü sistem gerilimiyle aynı olmalıdır; 12 V inverteri 24 V aküye bağlamak cihaza zarar verir. Aynı güçteki modeller çoğu zaman 12 V ve 24 V seçenekleriyle ayrı satılır, sipariş öncesi doğru sürümü seçin.',
      },
      {
        q: 'Bu invertere şebeke elektriği bağlanabilir mi?',
        a: "Bu kategorideki inverterlerin AC girişi yoktur ve şebekeyle paralel çalışamaz. Şebeke varken yükleri şebekeden, kesintide inverterden beslemek istiyorsanız şarjlı (UPS'li) tam sinüs inverter veya otomatik transfer switch kullanın.",
      },
    ],
    related: ['modifiye-sinus-inverter', 'sarjli-tam-sinus-inverter', 'inverter-aksesuari', 'lityum-aku'],
    blog: ['karavan-enerji-paketi'],
  },
  {
    slug: 'sarjli-tam-sinus-inverter',
    category: 'Şarjlı Tam Sinüs İnverter',
    group: 'solar-inverter',
    h1: "Şarjlı (UPS'li) Tam Sinüs İnverter",
    title: "Şarjlı Tam Sinüs İnverter ve UPS'li İnverter Modelleri",
    description:
      "Şebeke şarjlı (UPS'li) tam sinüs inverterler: Apex NPS ve NFS, Alpex, Havensis HINV, Victron EasyPlus ve MultiPlus-II. Kesintide otomatik geçiş ve akü şarjı.",
    intro:
      'Şarjlı tam sinüs inverter; inverteri, akü şarj cihazını ve otomatik transfer anahtarını tek cihazda birleştirir. Şebeke varken yükler şebekeden beslenir ve akü şarj edilir; şebeke kesildiğinde cihaz otomatik olarak aküden tam sinüs elektrik üretmeye geçer. Ev, ofis, karavan ve tekne için harici aküyle çalışan bir kesintisiz güç kaynağıdır.',
    guide: [
      {
        heading: 'Şarj akımı ve akü kapasitesi',
        body:
          "Cihazın şarj akımı, akünün kesinti sonrasında ne kadar sürede dolacağını belirler. Kurşun-asit akülerde şarj akımının akü kapasitesinin yaklaşık %10-20'si olması önerilir; 25 A şarj eden Apex NFS 1500 veya Havensis HINV 1300W, 12 V 125-250 Ah aralığındaki akü grupları için uygundur. Lityum akülerde akü üreticisinin izin verdiği şarj akımına bakın.",
      },
      {
        heading: 'Bypass akımı ve geçiş süresi',
        body:
          "Şebeke varken yükler cihazın içindeki transfer rölesi üzerinden şebekeden beslenir; bu yolun taşıyabileceği akım bypass veya transfer anahtarı değeriyle verilir (ör. Apex NFS 1500'de ve Victron EasyPlus'ta 16 A). Bu değeri aşan yükler cihaz üzerinden çalıştırılmamalıdır. Victron EasyPlus'ta kesintide geçiş süresi 20 ms'nin altındadır; bilgisayar ve modem gibi cihazlar bu sürede genellikle kapanmaz.",
      },
      {
        heading: 'Gerilim ve frekans uyumuna dikkat',
        body:
          "Türkiye'de şebeke 230 V 50 Hz'dir. Kataloğumuzdaki Victron MultiPlus-II 48/3000/35-50 modeli 120 V 60 Hz çıkışlı (Kuzey Amerika) sürümdür ve 230 V tesisatlarda kullanılmamalıdır. Satın almadan önce ürün sayfasındaki AC giriş ve çıkış gerilimini kontrol edin.",
      },
    ],
    faq: [
      {
        q: 'Şarjlı inverter ile UPS arasındaki fark nedir?',
        a: "Prensip olarak aynı işi yaparlar. Hazır UPS'ler çoğunlukla küçük dahili akülerle kısa süreli yedekleme için tasarlanır; şarjlı inverterler ise harici ve büyük kapasiteli akülerle saatlerce yedekleme yapabilir, akü kapasitesini ihtiyacınıza göre seçersiniz.",
      },
      {
        q: 'Kombi ve buzdolabını kesintide çalıştırır mı?',
        a: 'Kombinin elektronik kartı ve pompası düzgün sinüs gerilim ister, bu nedenle tam sinüs şarjlı inverterle çalıştırılabilir. Kombi ve buzdolabının toplam gücünü (buzdolabının kalkış gücü dahil) inverter gücüyle karşılaştırın ve akü kapasitesini beklediğiniz kesinti süresine göre seçin.',
      },
      {
        q: 'Bu inverterlere güneş paneli bağlanabilir mi?',
        a: 'Bu kategorideki cihazlarda dahili solar şarj kontrol cihazı yoktur. Panel eklemek için aküye ayrı bir MPPT şarj kontrol cihazı bağlayabilir ya da solar şarjı dahili olan tam sinüs MPPT akıllı inverter seçebilirsiniz.',
      },
    ],
    related: ['tam-sinus-inverter', 'tam-sinus-mppt-akilli-inverter', 'jel-aku', 'solar-transfer-switch'],
    blog: ['karavan-enerji-paketi'],
  },
  {
    slug: 'modifiye-sinus-inverter',
    category: 'Modifiye Sinüs İnverter',
    group: 'solar-inverter',
    h1: 'Modifiye Sinüs İnverter',
    title: 'Modifiye Sinüs İnverter Fiyatları ve Modelleri',
    description:
      'Alpex ve Apex modifiye sinüs inverterler: 300-2000 W, 12/24 V ve şebeke şarjlı (UPS) modeller. Hangi cihazlarda kullanılır, hangilerinde kullanılmaz?',
    intro:
      'Modifiye sinüs inverter, akünün doğru akımını basamaklı dalga formunda 230 V alternatif akıma çeviren ekonomik inverter türüdür. Rezistanslı ısıtıcılar, akkor lambalar ve basit yükler için yeterlidir. Kataloğumuzda 300-2000 W aralığında Alpex ve Apex modelleri ile şebeke şarjlı (UPS) Alpex seçenekleri bulunur.',
    guide: [
      {
        heading: 'Hangi cihazlarla kullanılır?',
        body:
          'Modifiye sinüs dalga; ısıtıcı rezistansı, akkor lamba ve havya gibi rezistif yüklerde sorun çıkarmaz. Buzdolabı ve derin dondurucu kompresörleri, pompalar, fanlar, dimmerli cihazlar, bazı LED sürücüleri, ses ve görüntü cihazları, tıbbi cihazlar ve kombi gibi elektronik kartlı cihazlarda ise ısınma, uğultu, verim kaybı veya arıza görülebilir. Bu cihazlar için tam sinüs inverter kullanın.',
      },
      {
        heading: 'Güç seçimi ve akü bağlantısı',
        body:
          "Yükünüzün toplam gücüne %20-30 pay ekleyin. 1000 W'tan büyük modellerde 24 V akü sistemi tercih etmek, aynı güçte akımı yarıya indirir. Kablo kesiti ve sigorta seçimi akım değerine göre yapılmalı, akü ile inverter arasındaki kablo kısa tutulmalıdır.",
      },
      {
        heading: "UPS'li modifiye sinüs inverter ne zaman mantıklı?",
        body:
          'Alpex şebeke şarjlı (UPS) modeller şebeke varken aküyü şarj eder ve kesintide aküye geçer. Kesinti sırasında yalnızca aydınlatma gibi basit yükleri beslemek isteyenler için düşük bütçeli bir yedekleme çözümüdür; kombi ve buzdolabı için şarjlı tam sinüs inverter doğru tercihtir.',
      },
    ],
    faq: [
      {
        q: 'Modifiye sinüs inverter dizüstü bilgisayar şarj eder mi?',
        a: 'Dizüstü bilgisayar adaptörlerinin çoğu modifiye sinüs gerilimle çalışır, ancak bazıları ısınabilir veya ses yapabilir. Hassas ve pahalı cihazlarınız için tam sinüs inverter daha güvenli bir seçimdir.',
      },
      {
        q: 'Modifiye sinüs ile tam sinüs arasındaki fark nedir?',
        a: 'Tam sinüs inverter şebekedeki gibi düzgün bir dalga üretir; modifiye sinüs inverter ise kare dalgaya yakın, basamaklı bir dalga üretir. Basamaklı dalgadaki harmonikler motorlarda ve transformatörlerde ek ısınmaya ve uğultuya yol açar.',
      },
    ],
    related: ['tam-sinus-inverter', 'sarjli-tam-sinus-inverter', 'jel-aku'],
    blog: [],
  },
  {
    slug: 'solar-pompa-surucusu',
    category: 'Solar Pompa Sürücüsü',
    group: 'solar-inverter',
    h1: 'Solar Pompa Sürücüsü',
    title: 'Solar Pompa Sürücüsü: Güneş Enerjili Sulama İnverteri',
    description:
      "Frecon ve TommaTech solar pompa sürücüleri: 0,4 kW'tan 450 kW'a monofaze ve trifaze modeller. Dalgıç ve yüzey pompalarını aküsüz, doğrudan panelle çalıştırın.",
    intro:
      'Solar pompa sürücüsü, güneş panellerinden gelen doğru akımı değişken frekanslı alternatif akıma çevirerek standart AC dalgıç ve yüzey pompalarını akü kullanmadan çalıştırır. Tarımsal sulama, hayvan içme suyu ve depo doldurma için şebekenin olmadığı veya elektrik maliyetinin yüksek olduğu yerlerde kullanılır. Sürücü, MPPT ile panellerden alınan gücü izler ve pompa devrini ışınıma göre ayarlar.',
    guide: [
      {
        heading: 'Sürücü gücü nasıl seçilir?',
        body:
          "Sürücü, pompa motorunun gücüne ve nominal akımına göre seçilir; motor etiketindeki akım, sürücünün nominal çıkış akımını aşmamalıdır. Örneğin Frecon PV500-4T 7,5 kW sürücünün nominal çıkış akımı 17 A'dir. Gücü sınırda kalan dalgıç pompalarda, etiket akımı yüksekse bir üst güç kademesi seçilmesi daha güvenlidir.\n\nMotorun besleme gerilimine dikkat edin: Frecon PV150 serisi monofaze 220 V girişlidir, motoru 3 faz 220 V ile besler ve 5,5 kW'a kadar çıkar. 380 V trifaze motorlar için Frecon PV500-4T (4-450 kW) ve TommaTech SPI trifaze modeller kullanılır.",
      },
      {
        heading: 'Kaç panel gerekir?',
        body:
          "Frecon, motor gücünün yaklaşık 1,3 katı panel gücü önerir: 7,5 kW sürücü için 9,8 kWp, 15 kW için 19,5 kWp gibi. Panel dizisinin açık devre gerilimi önerilen aralıkta olmalıdır; bu aralık PV150 serisinde 360-430 V, PV500-4T standart modellerde 550-750 V'tur.\n\nÖrneğin Voc'si 39,31 V olan 450 Wp TOPCon panellerle PV150 için dizi başına 10 panel, PV500-4T için 15-18 panel bu aralığa denk gelir. Soğuk havada dizi geriliminin sürücünün maksimum DC girişini (PV500-4T standart modelde 800 V) aşmadığını kontrol edin; dizi sayısını toplam panel gücüne ve sürücünün maksimum DC giriş akımına göre belirleyin.",
      },
      {
        heading: 'Şebeke/jeneratör desteği ve koruma işlevleri',
        body:
          'Frecon sürücüler güneş ile şebeke veya jeneratör beslemesini birlikte kabul edebilir ve kaynaklar arasında otomatik geçiş yapar; bu, bulutlu günlerde ve gece sulamasında süreklilik sağlar. Kuru çalışma (susuz kalma) koruması kuyuda su azaldığında pompayı durdurur, depo seviye girişi ise depo dolunca pompayı bekletir. Bu korumaların doğru çalışması için seviye sensörlerinin kurulumu planlanmalıdır.',
      },
    ],
    faq: [
      {
        q: 'Solar pompa sistemi akü gerektirir mi?',
        a: 'Hayır. Sistem gün ışığında pompalar; enerji aküde değil, yükseğe kurulan bir depoda veya gölette su olarak saklanır. Gece veya bulutlu havada sulama gerekiyorsa sürücünün AC girişine şebeke veya jeneratör bağlanabilir.',
      },
      {
        q: 'Mevcut dalgıç pompam solar sürücüyle çalışır mı?',
        a: 'Standart AC asenkron dalgıç ve yüzey pompaları, gerilimi ve akımı sürücüye uygunsa çalışır. Motor etiketindeki gerilimi (220 V veya 380 V), faz sayısını ve nominal akımı sürücü değerleriyle karşılaştırın. Tek fazlı, kondansatörlü motorlarda bağlantı seçeneklerini sürücü kılavuzundan kontrol edin.',
      },
      {
        q: 'Bulutlu havada pompa çalışır mı?',
        a: 'Sürücü düşük ışınımda pompayı daha düşük devirde çalıştırmaya devam eder; ışık belirli bir seviyenin altına düşünce uyku moduna geçer ve ışık artınca kendiliğinden yeniden başlar. Bulutlu günde basılan su miktarı azalır, depo kapasitesini bunu karşılayacak şekilde planlayın.',
      },
    ],
    related: ['solar-surucu-aksesuari', 'topcon-gunes-paneli', 'kablo-ve-konnektor'],
    blog: ['gunes-paneli-verimlilik'],
  },
  {
    slug: 'solar-surucu-aksesuari',
    category: 'Solar Sürücü Aksesuarı',
    group: 'solar-inverter',
    h1: 'Solar Pompa Sürücüsü Aksesuarları',
    title: 'Solar Pompa Sürücüsü Aksesuarları ve Diyot Modülleri',
    description:
      'TommaTech SPI solar pompa sürücüleri için MDK25A-MDK110A güç diyot modülleri ve 4G uzaktan erişim cihazı. Sürücü gücüne göre doğru modül ve adet seçimi.',
    intro:
      'Bu kategori, TommaTech SPI serisi solar pompa sürücüleriyle birlikte kullanılan güç diyot modüllerini ve uzaktan erişim cihazını içerir. Diyot modülleri panel dizileri ile sürücünün DC girişi arasında akımın tek yönde akmasını sağlar; 4G cihazı ise sürücünün sahaya gitmeden izlenmesine imkân verir.',
    guide: [
      {
        heading: 'Diyot modülü neden kullanılır?',
        body:
          'Paralel bağlanan panel dizilerinden biri gölgede kaldığında veya arızalandığında diğer dizilerden ona ters akım akabilir. Güneş ile şebeke veya jeneratörün birlikte kullanıldığı hibrit pompa sistemlerinde de kaynakların birbirine akım basması istenmez. Diyot modülü bu ters akımları engelleyerek panelleri ve sürücüyü korur.',
      },
      {
        heading: 'Hangi modül, kaç adet?',
        body:
          'Modül sürücünün gücüne göre seçilir: MDK25A 2,2-5,5 kW, MDK55A 7,5-11 kW, MDK70A 15 kW, MDK90A 18,5-30 kW sürücüler içindir. Daha büyük sürücülerde birden fazla modül kullanılır; örneğin 37-45 kW için 2 adet MDK90A, 55-75 kW için 2 adet ve 90-110 kW için 3 adet MDK110A önerilir.\n\nDiyot modülleri çalışırken ısınır. Uygun boyutta bir soğutucu üzerine termal macun sürülerek monte edilmeli ve havalandırılan bir panoya yerleştirilmelidir.',
      },
      {
        heading: 'Uzaktan erişim',
        body:
          'TommaTech solar pompa sürücüsü 4G uzaktan erişim cihazı, mobil şebeke üzerinden sürücüye bağlanır. Çalışma durumu ve arızalar uzaktan takip edilebildiği için uzaktaki tarlalarda arıza tespiti için sahaya gitme ihtiyacını azaltır. Cihazın çalışması için kurulum yerinde mobil şebeke kapsaması olmalıdır.',
      },
    ],
    faq: [
      {
        q: 'Bu diyot modülleri farklı marka sürücülerle kullanılabilir mi?',
        a: 'Modüller TommaTech SPI sürücüler için güç kademelerine göre eşleştirilmiştir. Farklı marka bir sürücüde kullanmak için diyotun akım ve gerilim değerlerinin sistemin maksimum DC akımını ve gerilimini karşıladığını doğrulamanız gerekir.',
      },
      {
        q: 'Tek dizili sistemde diyot modülü gerekir mi?',
        a: 'Tek dizili ve yalnızca güneşle çalışan küçük sistemlerde ters akım riski düşüktür. Birden fazla paralel dizi varsa veya güneş ile AC besleme birlikte kullanılıyorsa diyot modülü önerilir.',
      },
    ],
    related: ['solar-pompa-surucusu', 'kablo-ve-konnektor', 'sigorta-ve-dagitim'],
    blog: [],
  },
  {
    slug: 'inverter-aksesuari',
    category: 'İnverter Aksesuarı',
    group: 'solar-inverter',
    h1: 'İnverter Aksesuarları',
    title: 'İnverter Aksesuarları: Uzaktan Kumanda ve Kontrol Paneli',
    description:
      'Electrozirve kablolu/kablosuz inverter kumandaları, Victron Inverter Control ve Phoenix Charger Control panelleri, Alpex Wi-Fi modülü. Uyumluluk rehberi.',
    intro:
      'İnverter aksesuarları, aküye yakın ve görünmeyen bir yere monte edilen inverteri yaşam alanından açıp kapatmanızı ve izlemenizi sağlar. Karavan, tekne ve dolap içi kurulumlarda inverterin kullanılmadığında kapatılması, boşta tüketimin aküyü gereksiz yere boşaltmasını önler.',
    guide: [
      {
        heading: 'Kumanda uyumluluğu nasıl kontrol edilir?',
        body:
          'Uzaktan kumandalar markaya ve seriye özeldir. Electrozirve CR80, CRW80, CRW88 ve CRD80 kumandalar uyumlu Electrozirve inverterlerle; Victron Inverter Control uzaktan kontrol portlu Phoenix inverterlerle, Inverter Control VE.Direct ise VE.Direct portlu Phoenix modellerle kullanılır. Phoenix Charger Control ve Skylla-i Control GX ise Victron şarj cihazları içindir. İnverterinizin kılavuzunda uzaktan kontrol portunun tipini kontrol edin.',
      },
      {
        heading: 'Kablolu mu kablosuz mu?',
        body:
          'Kablolu kumanda sabit montaj için güvenilirdir; kablo yolu önceden planlanmalı ve uzunluğu üreticinin sınırını aşmamalıdır. Kablosuz kumandalar (CRW80, CRW88) kablo çekmenin zor olduğu araç ve teknelerde pratiklik sağlar. Ekranlı CRD80 modeli açma kapamanın yanında bilgi ekranı da sunar.',
      },
      {
        heading: 'Uzaktan izleme',
        body:
          'Alpex Wi-Fi uzaktan izleme modülü, uyumlu Alpex inverterlerin verilerini kablosuz ağ üzerinden telefona aktarır. Victron sistemlerde birden fazla cihazı tek noktadan izlemek için GX cihazları kullanılır; bunlar İzleme ve Kontrol kategorisinde yer alır.',
      },
    ],
    faq: [
      {
        q: 'Kumanda inverteri tamamen kapatır mı?',
        a: 'Kumanda inverterin çıkışını kapatır ve boşta tüketimi büyük ölçüde azaltır; ancak bazı cihazlar bekleme modunda çok küçük bir akım çekmeye devam edebilir. Uzun süreli depolamada akü ile inverter arasındaki ana ayırıcıyı açmak daha güvenlidir.',
      },
      {
        q: 'Kumanda farklı marka inverterde kullanılabilir mi?',
        a: 'Genellikle hayır. Kumandaların bağlantı soketi ve haberleşme yöntemi üreticiye özeldir; yalnızca ürün sayfasında belirtilen uyumlu modellerle kullanın.',
      },
    ],
    related: ['tam-sinus-inverter', 'sarjli-tam-sinus-inverter', 'izleme-ve-kontrol', 'kablo-ve-konnektor'],
    blog: ['karavan-enerji-paketi'],
  },

  // ──────────────────────────── gunes-paneli ────────────────────────────
  {
    slug: 'topcon-gunes-paneli',
    category: 'TopCon Güneş Paneli',
    group: 'gunes-paneli',
    h1: 'TOPCon Güneş Paneli',
    title: 'TOPCon Güneş Paneli Fiyatları: n-Tipi Yüksek Verim',
    description:
      'TommaTech n-tipi TOPCon güneş panelleri: 40-130 Wp küçük paneller, 285 Wp, 450 Wp Dark Series ve 600 Wp bifacial. Verim, sıcaklık katsayısı ve dizi hesabı.',
    intro:
      "TOPCon (tünel oksit pasivasyonlu kontak), n-tipi silikon hücrelerle üretilen yüksek verimli bir monokristal panel teknolojisidir. Kataloğumuzdaki TommaTech TOPCon paneller, karavan ve bağ evi için 40 Wp'lik küçük modellerden çatı ve arazi GES'leri için 600 Wp'lik bifacial modellere kadar uzanır.",
    guide: [
      {
        heading: 'TOPCon panelin farkı nedir?',
        body:
          "n-tipi TOPCon hücreler, yaygın p-tipi PERC hücrelere göre ışık kaynaklı bozunmaya daha dayanıklıdır ve sıcaklıktan daha az etkilenir. TommaTech 450 Wp ve 600 Wp modellerde güç sıcaklık katsayısı -0,30 %/°C, modül verimi %23 civarındadır. Yaz aylarında panel yüzeyi 60 °C'nin üzerine çıktığında bu düşük katsayı daha az güç kaybı anlamına gelir.",
      },
      {
        heading: 'Hangi güç sınıfı nereye uygun?',
        body:
          '36 hücreli 40-130 Wp paneller 12 V akülü küçük sistemler, karavan, tekne ve aydınlatma direkleri için kullanılır. 450 Wp paneller (108 yarım hücre, 1722 × 1134 mm) konut çatılarında taşınabilir boyut ile yüksek gücü dengeler. 600 Wp bifacial paneller (144 yarım hücre, 2278 × 1134 mm, 29 kg) arazi ve geniş çatı uygulamaları içindir; arka yüzden de ışık alarak açık renkli zemin ve yüksek montajda ek üretim sağlar.\n\nDark Series 450 Wp modeli siyah çerçevelidir ve görünümün önemli olduğu çatılarda tercih edilir.',
      },
      {
        heading: 'Bir diziye kaç panel bağlanır?',
        body:
          "Panelin açık devre gerilimi (Voc) soğukta yükselir. TommaTech 450 Wp TOPCon panelde Voc 39,31 V, Voc sıcaklık katsayısı -0,26 %/°C'dir; -10 °C'de bu değer yaklaşık 42,9 V olur. Dizideki panel sayısını, soğuk Voc değerlerinin toplamı inverterin veya şarj kontrol cihazının maksimum PV gerilimini aşmayacak şekilde belirleyin. Panellerin maksimum sistem gerilimi 1500 V DC'dir, ancak pratikte sınırı inverter belirler.",
      },
    ],
    faq: [
      {
        q: 'Bifacial panel her çatıda daha fazla üretir mi?',
        a: 'Arka yüz kazancı, panelin arkasına ne kadar yansıyan ışık ulaştığına bağlıdır. Koyu renkli bir çatıya yakın monte edilen bifacial panel, tek yüzlü panelle neredeyse aynı üretir. Açık renkli zemin, beyaz membran çatı ve yerden yüksek konstrüksiyon arka yüz kazancını artırır.',
      },
      {
        q: 'TOPCon paneller kar ve rüzgar yüküne dayanıklı mı?',
        a: '450 Wp ve 600 Wp modellerde mekanik yük değeri ön yüzde 5400 Pa (kar), arka yüzde 2400 Pa (rüzgar) olarak verilmiştir. Bu değerlerin geçerli olması için konstrüksiyon ve kelepçe noktalarının üretici montaj kılavuzuna uygun olması gerekir.',
      },
      {
        q: 'Yeni TOPCon paneli eski panellerle aynı diziye bağlayabilir miyim?',
        a: 'Önerilmez. Seri bağlı paneller aynı akımı taşır; farklı akım değerindeki paneller aynı dizide olursa dizi en zayıf panelin akımına iner. Farklı panelleri ayrı MPPT girişlerine bağlayın.',
      },
    ],
    related: ['on-grid-inverter', 'hibrit-inverter', 'mppt-sarj-kontrol-cihazi', 'kablo-ve-konnektor'],
    blog: ['gunes-paneli-verimlilik', 'ges-nasil-kurulur'],
  },
  {
    slug: 'monokristal-gunes-paneli',
    category: 'Monokristal Güneş Paneli',
    group: 'gunes-paneli',
    h1: 'Monokristal Güneş Paneli',
    title: 'Monokristal Güneş Paneli: 240 Wp Half-Cut Model',
    description:
      'TommaTech 240 Wp 48 hücreli half-cut monokristal güneş paneli: bağ evi, karavan ve küçük off-grid sistemler için orta boy panel. MPPT ile bağlantı notları.',
    intro:
      'Monokristal güneş paneli, tek kristal yapılı silikon hücrelerden üretilir ve birim alandan yüksek verim sağlar. Bu kategorideki TommaTech 240 Wp 48PM paneli, yarım hücre (half-cut) yapısı ve orta boyutuyla çatı alanı sınırlı küçük off-grid sistemler için uygundur.',
    guide: [
      {
        heading: 'Half-cut (yarım hücre) ne sağlar?',
        body:
          'Yarım hücreli panellerde her hücre ikiye bölünür; hücre başına akım yarıya indiği için direnç kayıpları ve ısınma azalır. Panelin alt ve üst yarısı ayrı çalıştığından kısmi gölgelenmede güç kaybı tam hücreli panellere göre daha sınırlı kalır.',
      },
      {
        heading: '48 hücreli panel hangi sisteme uygun?',
        body:
          '48 hücreli panelin çalışma gerilimi, 12 V aküler için yapılan 36 hücreli panellerden yüksek, 60 ve 72 hücreli çatı panellerinden düşüktür. Bu gerilimden tam yararlanmak için MPPT şarj kontrol cihazı tercih edilmelidir; PWM cihazda panel akü geriliminde çalışacağı için gücünün bir kısmı kullanılamaz. Bağlantıdan önce panelin Vmp ve Voc değerlerini etiketinden okuyup şarj kontrol cihazının PV giriş sınırıyla karşılaştırın.',
      },
      {
        heading: 'Ne zaman daha büyük panel seçilmeli?',
        body:
          'Kurulum alanı yeterliyse ve sistem gücü yüksekse 450 Wp gibi büyük TOPCon paneller, aynı toplam güç için daha az panel, bağlantı ve konstrüksiyon gerektirir. 240 Wp panel ise taşıması ve montajı kolay olduğu için sınırlı çatı alanlarında ve küçük karavan veya bağ evi sistemlerinde mantıklı bir seçimdir.',
      },
    ],
    faq: [
      {
        q: 'Monokristal ile TOPCon arasındaki fark nedir?',
        a: 'TOPCon da bir monokristal teknolojisidir; fark hücre yapısındadır. TOPCon, n-tipi hücre ve pasivasyon katmanıyla daha yüksek verim ve sıcakta daha az kayıp sunar. Klasik monokristal paneller ise çoğunlukla p-tipi hücrelerle üretilir.',
      },
      {
        q: '240 Wp panel günde ne kadar enerji üretir?',
        a: "Üretim mevsime, konuma ve panel açısına göre değişir. Türkiye'de güneşli bir yaz gününde 240 Wp'lik bir panelden yaklaşık 0,9-1,2 kWh beklenebilir; kış aylarında bu değer belirgin şekilde düşer. Panel sayısını ve akü kapasitesini günlük tüketiminize göre birlikte planlayın.",
      },
    ],
    related: ['topcon-gunes-paneli', 'esnek-ve-katlanabilir-panel', 'mppt-sarj-kontrol-cihazi'],
    blog: ['gunes-paneli-verimlilik', 'karavan-enerji-paketi'],
  },
  {
    slug: 'esnek-ve-katlanabilir-panel',
    category: 'Esnek ve Katlanabilir Panel',
    group: 'gunes-paneli',
    h1: 'Esnek ve Katlanabilir Güneş Paneli',
    title: 'Esnek Güneş Paneli ve Katlanabilir Solar Panel',
    description:
      'TommaTech esnek (flexible) IBC paneller 110/170 Wp, katlanabilir çanta tipi 150/200 Wp ve USB çıkışlı 15/25 Wp şarj panelleri. Karavan, tekne ve kamp için.',
    intro:
      'Esnek ve katlanabilir paneller, cam ve alüminyum çerçeveli standart panellerin taşınamadığı veya monte edilemediği yerler için üretilir. Esnek paneller karavan ve tekne gibi kavisli yüzeylere sabitlenir; katlanabilir paneller ise kampta açılıp kullanılır, güç istasyonu veya telefon şarjı için yanınızda taşınır.',
    guide: [
      {
        heading: 'Esnek panel mi katlanabilir panel mi?',
        body:
          'Esnek paneller kalıcı montaj içindir: TommaTech esnek modeller 3 mm kalınlığında, ETFE ön yüzeyli ve en fazla 30° bükülebilir yapıdadır; 110 Wp model 2,3 kg ağırlığındadır. Katlanabilir çanta tipi paneller (150 ve 200 Wp) geçici kullanım içindir ve gölgede park edilen araçtan uzağa, güneşe dönük yerleştirilebilir. 15 ve 25 Wp katlanabilir şarj panelleri ise telefon ve powerbank gibi küçük cihazlar içindir.',
      },
      {
        heading: 'Montaj ve ısınma',
        body:
          "Esnek panelin arkasında hava boşluğu olmadığı için çerçeveli panellere göre daha sıcak çalışır ve sıcakta üretimi düşer. Mümkünse panel ile yüzey arasında hafif bir boşluk bırakın, yüzeyi temizleyip uygun bir yapıştırıcı veya montaj yöntemi kullanın ve paneli 30°'den fazla bükmeyin. Panelin üzerine basmak hücrelerde çatlaklara yol açabilir.",
      },
      {
        heading: 'Akü ve güç istasyonuna bağlantı',
        body:
          "110 Wp esnek panelin Voc değeri 22,8 V'tur ve 12 V aküye şarj kontrol cihazı üzerinden bağlanır. İki paneli seri bağlayıp MPPT cihaz kullanmak akımı düşürerek kablo kaybını azaltır. Güç istasyonu ile kullanacaksanız panelin Voc değerinin istasyonun solar giriş aralığında olduğunu kontrol edin ve uygun MC4 dönüşüm kablosunu seçin.",
      },
    ],
    faq: [
      {
        q: 'Esnek panelin verimi standart panelden düşük mü?',
        a: "TommaTech esnek 110 Wp modelde verim %17,5'tir; bu, %23 civarındaki çerçeveli TOPCon panellerden düşüktür. Aynı güç için biraz daha fazla alan gerekir, buna karşılık panel çok hafiftir ve kavisli yüzeylere uyum sağlar.",
      },
      {
        q: 'Katlanabilir panel yağmurda kullanılabilir mi?',
        a: '25 Wp katlanabilir panel IPX4 sınıfındadır, yani su sıçramasına dayanıklıdır; ancak yağmur altında bırakılması ve bağlantı noktalarının ıslanması önerilmez. Panelleri kuruyken katlayıp saklayın.',
      },
      {
        q: 'USB çıkışlı panel telefonu doğrudan şarj eder mi?',
        a: 'Evet, 15 Wp modelde USB-A ve USB-C çıkışları bulunur. Bulut geçişlerinde akım dalgalanacağı için telefonu doğrudan şarj etmek yerine önce bir powerbank doldurmak daha düzenli sonuç verir.',
      },
    ],
    related: ['tasinabilir-guc-istasyonu', 'mppt-sarj-kontrol-cihazi', 'kablo-ve-konnektor', 'monokristal-gunes-paneli'],
    blog: ['karavan-enerji-paketi'],
  },

  // ───────────────────────── solar-sarj-kontrol ─────────────────────────
  {
    slug: 'mppt-sarj-kontrol-cihazi',
    category: 'MPPT Şarj Kontrol Cihazı',
    group: 'solar-sarj-kontrol',
    h1: 'MPPT Şarj Kontrol Cihazı',
    title: 'MPPT Şarj Kontrol Cihazı Fiyatları ve Seçimi',
    description:
      'Havensis, Electrozirve, NP Power, Mexxsun ve Victron MPPT şarj kontrol cihazları: 3 A ile 100 A arası, 12-72 V akü sistemleri, 100-200 V PV girişli modeller.',
    intro:
      'MPPT şarj kontrol cihazı, güneş panelini maksimum güç noktasında çalıştırarak panelin yüksek gerilimini akünün ihtiyaç duyduğu gerilime ve daha yüksek akıma dönüştürür. PWM cihazlara göre özellikle soğuk havada, yüksek gerilimli panellerde ve uzun kablo hatlarında aküye daha fazla enerji aktarır.',
    guide: [
      {
        heading: 'Kaç amperlik cihaz gerekir?',
        body:
          "Şarj akımı yaklaşık olarak panel gücü / akü gerilimi kadardır. 2 adet 450 Wp panel (900 W) 12 V akü için yaklaşık 75 A, 24 V akü için yaklaşık 37,5 A şarj akımı verir; bu durumda 12 V'ta 80 A, 24 V'ta 40 A cihaz seçilir. Akü gerilimini yükseltmek, aynı panel gücü için daha küçük bir cihazın yeterli olması demektir.\n\nAkü sistem gerilimini de kontrol edin: Havensis 100 V PV girişli MPS modeller 12/24 V, 70 ve 80 A modeller 12/24/36/48 V, HV MPS serisi ise 60/72 V akü sistemleri içindir.",
      },
      {
        heading: 'Maksimum PV gerilimi ve dizi hesabı',
        body:
          "Panel dizisinin soğuk havadaki açık devre gerilimi cihazın maksimum PV gerilimini aşmamalıdır, aksi halde cihaz kalıcı hasar görebilir. Örneğin Voc'si 39,31 V olan 450 Wp TOPCon panelden 2 adet seri bağlandığında soğukta yaklaşık 86 V oluşur ve 100 V girişli cihaza uygundur; 3 adet seri bağlantı (soğukta yaklaşık 129 V) için 150 V girişli model gerekir.\n\nŞarjın başlaması için panel geriliminin akü geriliminin belirgin şekilde üzerinde olması gerekir. Düşük gerilimli panellerle yüksek gerilimli aküyü şarj etmek gerekiyorsa Havensis Boost MPPT-2472 gibi yükseltici (boost) modeller kullanılır.",
      },
      {
        heading: 'Ekran, Bluetooth ve akü profili',
        body:
          'Ekranlı modeller (Electrozirve ML serisi ve MC-4860N25 gibi) akü gerilimini ve şarj akımını cihaz üzerinde gösterir. Ekransız modellere sonradan harici ekran veya Bluetooth/Wi-Fi modülü eklenebilir; uyumlu ürünler Şarj Kontrol Aksesuarı kategorisindedir. Cihazda kullandığınız akü tipi (jel, AGM, lityum) için profil veya ayarlanabilir şarj gerilimi bulunduğundan emin olun.',
      },
    ],
    faq: [
      {
        q: 'MPPT ile PWM arasındaki fark nedir?',
        a: 'PWM cihaz paneli doğrudan aküye bağlar ve panel akü geriliminde çalışır; panelin gerilim fazlası kullanılamaz. MPPT cihaz panel gerilimini düşürüp akımı artırarak panelden alınabilecek gücü aküye aktarır. Küçük 12 V sistemlerde PWM yeterli olabilir; seri bağlı panelli ve daha yüksek güçlü sistemlerde MPPT daha verimlidir.',
      },
      {
        q: 'MPPT cihaz akü olmadan çalışır mı?',
        a: 'Çoğu şarj kontrol cihazı çalışmak için akü gerilimine ihtiyaç duyar ve önce akü bağlanmalıdır. Havensis MPS serisinin bazı 100 V modellerinde akü bağlı olmadan panelle çalışabilme özelliği belirtilmiştir; bu özelliği ürün sayfasından kontrol edin.',
      },
      {
        q: 'Bağlantı sırası nasıl olmalı?',
        a: 'Genel kural önce aküyü, sonra paneli bağlamak; sökerken ise önce paneli, sonra aküyü ayırmaktır. Böylece cihaz akü gerilimini doğru algılar ve panel gerilimi aküsüz kalan cihaza zarar vermez.',
      },
    ],
    related: ['pwm-sarj-kontrol-cihazi', 'sarj-kontrol-aksesuari', 'lityum-aku', 'topcon-gunes-paneli'],
    blog: ['karavan-enerji-paketi', 'gunes-paneli-verimlilik'],
  },
  {
    slug: 'pwm-sarj-kontrol-cihazi',
    category: 'PWM Şarj Kontrol Cihazı',
    group: 'solar-sarj-kontrol',
    h1: 'PWM Şarj Kontrol Cihazı',
    title: 'PWM Şarj Kontrol Cihazı Fiyatları: 12 V ve 24 V',
    description:
      'Havensis MiniSolar ve Electrozirve HP serisi PWM şarj kontrol cihazları: 3-60 A, 12 V ve 12/24 V otomatik algılamalı, zamanlı yük çıkışlı modeller.',
    intro:
      'PWM şarj kontrol cihazı, güneş panelini aküye kontrollü olarak bağlayıp akünün aşırı şarj ve aşırı deşarj olmasını önleyen basit ve ekonomik bir cihazdır. Bağ evi aydınlatması, bahçe ve sokak lambaları, küçük karavan ve tekne sistemleri gibi düşük güçlü 12 V ve 24 V uygulamalarda kullanılır.',
    guide: [
      {
        heading: 'PWM cihaz hangi panelle kullanılmalı?',
        body:
          "PWM cihazda panel akü geriliminde çalışır. Bu nedenle 12 V akü için yaklaşık 18 V çalışma gerilimli 36 hücreli paneller, 24 V akü için 72 hücreli veya seri bağlı iki adet 36 hücreli panel kullanılmalıdır. 450 Wp gibi yüksek gerilimli çatı panelleri PWM cihazla 12 V aküye bağlanırsa gücün büyük kısmı kullanılamaz; bu durumda MPPT cihaz seçin.",
      },
      {
        heading: 'Akım değeri nasıl seçilir?',
        body:
          'Cihazın akım değeri panel grubunun kısa devre akımından (Isc) yüksek olmalıdır; soğuk ve parlak havalardaki artışlar için yaklaşık %25 pay bırakmak yaygın bir uygulamadır. Örneğin toplam Isc değeri 8 A olan bir panel grubu için 10 A cihaz yeterlidir. Havensis MiniSolar modelleri 3-20 A, Electrozirve HP serisi 10-60 A aralığındadır.',
      },
      {
        heading: 'Yük çıkışı ve zamanlı modlar',
        body:
          'PWM cihazların çoğunda aküden beslenen bir DC yük çıkışı bulunur; bu çıkış akü gerilimi düştüğünde yükü keserek aküyü korur. Havensis MiniSolar modellerinde 5 veya 7 farklı zamanlı mod vardır; örneğin aydınlatma gün batımında yanıp belirli bir süre sonra veya gün doğumunda sönecek şekilde ayarlanabilir. Yük çıkışına cihazın akım değerini aşan yükler ve inverterler bağlanmamalı, inverter doğrudan aküye bağlanmalıdır.',
      },
    ],
    faq: [
      {
        q: 'PWM şarj kontrol cihazı lityum aküyle kullanılabilir mi?',
        a: 'Cihazda lityum akü profili veya ayarlanabilir şarj gerilimi varsa kullanılabilir. Yalnızca kurşun-asit profilleri olan cihazların şarj gerilimleri lityum aküye uygun olmayabilir; ürün sayfasındaki desteklenen akü tiplerini kontrol edin.',
      },
      {
        q: '12/24 V otomatik algılama nasıl çalışır?',
        a: 'Standart ve Dijital seri Havensis modeller, ilk bağlantıda akü gerilimini ölçerek sistemin 12 V mu 24 V mu olduğuna karar verir. Bu yüzden cihaza önce akü bağlanmalıdır; akü çok boşsa sistem gerilimi yanlış algılanabileceği için önce aküyü şarj edin.',
      },
    ],
    related: ['mppt-sarj-kontrol-cihazi', 'jel-aku', 'sarj-kontrol-aksesuari', 'topcon-gunes-paneli'],
    blog: ['karavan-enerji-paketi'],
  },
  {
    slug: 'aku-sarj-cihazi',
    category: 'Akü Şarj Cihazı',
    group: 'solar-sarj-kontrol',
    h1: 'Akü Şarj Cihazı',
    title: 'Akü Şarj Cihazı Fiyatları: AC ve DC-DC Şarj Cihazları',
    description:
      'Apex, NP Power ve Electrozirve 12/24 V akü şarj cihazları, Havensis DC-DC ve MPPT+DC-DC şarj cihazları, TommaTech 24-100 V forklift batarya şarj üniteleri.',
    intro:
      'Akü şarj cihazı, aküyü şebekeden, araç alternatöründen veya güneşten kontrollü olarak şarj eder. Bu kategoride 230 V prizden çalışan 12 V ve 24 V şarj cihazları, karavan ve teknelerde servis aküsünü araç aküsünden şarj eden DC-DC cihazlar ve forklift, iş makinesi ve hafif elektrikli araç bataryaları için 24-100 V endüstriyel şarj üniteleri bulunur.',
    guide: [
      {
        heading: 'Şarj akımı nasıl seçilir?',
        body:
          "Kurşun-asit (jel, AGM) akülerde şarj akımının akü kapasitesinin yaklaşık %10-20'si olması önerilir; 100 Ah akü için 10-20 A uygundur. Lityum akülerde daha yüksek akım mümkündür, ancak sınırı akünün veri sayfasındaki maksimum şarj akımı belirler. Akü şarj olurken aynı anda yük de besleniyorsa, yükün çektiği akımı da hesaba katın.",
      },
      {
        heading: 'DC-DC şarj cihazı ne zaman gerekir?',
        body:
          "Karavan ve teknelerde servis aküsü araç çalışırken alternatörden şarj edilir. Akü birleştirici röle basit bir çözümdür; ancak lityum servis akülerinde ve değişken gerilimli akıllı alternatörlü yeni araçlarda servis aküsü tam dolmayabilir. DC-DC şarj cihazı, giriş gerilimi değişse de aküye doğru şarj profilini uygular.\n\nTek yönlü cihazlar marş aküsünden servis aküsüne şarj eder, çift yönlü modeller iki yönde de çalışabilir. Havensis DualCharger modelleri MPPT solar şarjı ve DC-DC şarjı tek cihazda birleştirir; 4030AMD modelinde toplam şarj akımı 60 A'e ulaşır.",
      },
      {
        heading: 'Endüstriyel batarya şarj üniteleri',
        body:
          'TommaTech şarj üniteleri 24 V, 48 V ve 72 V forklift, iş makinesi ve elektrikli araç bataryaları içindir; duvar tipi, mobil ve su geçirmez entegre tip seçenekleri vardır. Ayarlanabilir modeller 30-100 V veya 40-100 V çıkış aralığında 200-300 A akım verir. Seçimde batarya kimyasını (LiFePO4 veya NMC), hücre sayısını ve BMS ile CAN/RS485 haberleşme ihtiyacını kontrol edin.\n\nKataloğumuzdaki Victron Blue Smart IP67 24/8 modeli 120 V AC girişli ve NEMA 5-15 fişlidir; 230 V şebekede kullanıma uygun değildir.',
      },
    ],
    faq: [
      {
        q: 'Şarj cihazı aküye bağlı bırakılabilir mi?',
        a: 'Çok aşamalı akıllı şarj cihazları akü dolduğunda float (tampon) şarja geçer ve uzun süre bağlı bırakılabilir. Basit şarj cihazlarında aşırı şarj riski vardır. Lityum akülerde uzun süreli bekletme için akü üreticisinin önerdiği depolama gerilimini kullanın.',
      },
      {
        q: 'Jel ve lityum akü aynı şarj cihazıyla şarj edilir mi?',
        a: 'Cihazda her iki akü tipi için ayrı profil varsa evet. Jel akü için GEL, LiFePO4 için lityum profilini seçin; yanlış profil aküyü eksik veya aşırı şarj eder.',
      },
      {
        q: 'DC-DC şarj cihazı motor çalışmıyorken marş aküsünü boşaltır mı?',
        a: 'DC-DC şarj cihazları marş aküsünün gerilimini izler ve alternatör çalışmadığında şarjı durdurur; böylece marş aküsü boşaltılmaz. Bazı modellerde bu davranış gerilim eşiğiyle veya kontak sinyaliyle ayarlanabilir.',
      },
    ],
    related: ['lityum-aku', 'jel-aku', 'batarya-yonetimi-ve-aksesuar', 'mppt-sarj-kontrol-cihazi'],
    blog: ['karavan-enerji-paketi', 'lityum-vs-kursum-asit'],
  },
  {
    slug: 'sarj-kontrol-aksesuari',
    category: 'Şarj Kontrol Aksesuarı',
    group: 'solar-sarj-kontrol',
    h1: 'Şarj Kontrol Cihazı Aksesuarları',
    title: 'Şarj Kontrol Cihazı Aksesuarları: Ekran ve İzleme',
    description:
      'Havensis Wi-Fi/Bluetooth izleme modülleri ve harici ekranlar, Electrozirve RM ekran ve BT kit, Victron MPPT Control, SmartSolar ekran ve PWM-Pro aksesuarları.',
    intro:
      'Şarj kontrol aksesuarları, solar şarj kontrol cihazınızı uzaktan izlemenizi, ayarlarını değiştirmenizi ve şarjı akü sıcaklığına göre düzeltmenizi sağlar. Harici ekranlar, Bluetooth ve Wi-Fi modülleri, sıcaklık sensörleri, arayüz kabloları ve kablo kapakları bu kategoridedir.',
    guide: [
      {
        heading: 'Uyumluluk nasıl kontrol edilir?',
        body:
          "Aksesuarlar üreticiye ve seriye özeldir. Havensis Solar-WiFi-485 ve MiniSolar-BT V2 modülleri, Havensis MPPT, DC-DC, boost ve dual charger cihazlarının 2024 ve sonrası üretim modelleriyle uyumludur; EKBT ekran ise 2024 ve sonrası üretim MPPT ve PWM cihazlarla çalışır. Cihazınızın üretim yılını etiketinden kontrol edin. C216DSP harici ekran RS232 veya RS485 arayüzlü olarak sunulur, siparişte hangisinin gerektiği belirtilmelidir.\n\nVictron tarafında MPPT Control VE.Direct portlu MPPT'ler, SmartSolar takılabilir ekran ekran yuvası olan MPPT modelleri, PWM-Pro aksesuarları ise yalnızca BlueSolar PWM-Pro serisi içindir.",
      },
      {
        heading: 'Harici ekran mı, uygulama mı?',
        body:
          'Harici ekran, cihaz teknik bölmeye veya dolap içine monte edildiğinde akü gerilimini ve şarj akımını yaşam alanında görmek için kullanışlıdır. Bluetooth modülleri yakın mesafeden telefonla izleme ve ayar imkânı verir. Wi-Fi modülü ise verileri internet üzerinden izleme platformuna aktarır; Havensis modülü için açık alanda yaklaşık 50 m kablosuz menzil belirtilmiştir.',
      },
      {
        heading: 'Sıcaklık sensörü ve kablo kapağı',
        body:
          'Kurşun-asit akülerde doğru şarj gerilimi sıcaklıkla değişir; sıcaklık sensörü cihazın şarj gerilimini akü sıcaklığına göre düzeltmesini sağlar. Victron MPPT WireBox-M ise 130 mm yüksekliğindeki MPPT modellerinin kablo bağlantılarını kapatarak dokunmaya karşı korur ve düzenli bir montaj sağlar.',
      },
    ],
    faq: [
      {
        q: 'Wi-Fi modülüyle neleri izleyebilirim?',
        a: 'Uyumlu cihazlarda panel gerilimi ve gücü, akü gerilimi, şarj akımı ve günlük üretim gibi veriler izlenebilir. Havensis modülü verileri solarekran.com platformuna aktarır; modülün kurulduğu yerde kablosuz ağ sinyali olmalıdır.',
      },
      {
        q: 'Eski şarj kontrol cihazıma Bluetooth ekleyebilir miyim?',
        a: 'Bu, cihazın haberleşme portuna bağlıdır. Havensis modüllerinin uyumluluğu 2024 ve sonrası üretim cihazlar için belirtilmiştir. VE.Direct portlu Victron cihazlara ise VE.Direct Bluetooth Smart dongle eklenebilir; bu ürün İzleme ve Kontrol kategorisindedir.',
      },
    ],
    related: ['mppt-sarj-kontrol-cihazi', 'pwm-sarj-kontrol-cihazi', 'izleme-ve-kontrol'],
    blog: [],
  },

  // ────────────────────── solar-baglanti-ekipmani ──────────────────────
  {
    slug: 'solar-transfer-switch',
    category: 'Solar Transfer Switch',
    group: 'solar-baglanti-ekipmani',
    h1: 'Solar Transfer Switch (Otomatik Transfer Anahtarı)',
    title: 'Otomatik Transfer Switch: Şebeke ve İnverter Geçişi',
    description:
      'Apex 80 A ve Havensis HTS-230-15 otomatik transfer switch: şebeke kesilince yükleri inverter çıkışına aktarır, iki kaynağın aynı hatta bağlanmasını önler.',
    intro:
      'Solar transfer switch, yüklerin şebekeden mi yoksa inverterden mi besleneceğini otomatik olarak seçen bir anahtardır. Şebeke varken yükler şebekeden beslenir; şebeke kesildiğinde yükler inverter çıkışına aktarılır. Kendi şarj ünitesi ve transfer rölesi olmayan inverterlerle kurulan sistemlerde kullanılır.',
    guide: [
      {
        heading: 'Transfer switch neden gerekli?',
        body:
          "Şebeke ile inverter çıkışının aynı hatta bağlanması inverteri yakar ve tesisatta tehlike oluşturur. Transfer switch iki kaynağı birbirinden ayırarak yükü aynı anda yalnızca birinin beslemesini sağlar. Şarjlı (UPS'li) inverterlerde ve akıllı inverterlerde bu anahtar cihazın içinde bulunduğu için ayrıca gerekmez.",
      },
      {
        heading: 'Akım değeri nasıl seçilir?',
        body:
          "Anahtarın nominal akımı, beslenecek yüklerin toplam akımından büyük olmalıdır. 230 V'ta 15 A yaklaşık 3,4 kW güce karşılık gelir; Havensis HTS-230-15 bu sınıftaki ev ve karavan uygulamaları için, Apex 80 A ise daha yüksek akımlı panolar içindir. Anahtarın önüne uygun değerde sigorta veya şalter koyun ve bağlantıyı yetkili bir elektrikçiye yaptırın.",
      },
    ],
    faq: [
      {
        q: 'Transfer switch aküyü şebekeden şarj eder mi?',
        a: 'Hayır. Transfer switch yalnızca kaynak seçimi yapar, aküyü şarj etmez. Şebekeden şarj için ayrı bir akü şarj cihazı veya şarjlı inverter gerekir.',
      },
      {
        q: 'Geçiş sırasında cihazlar kapanır mı?',
        a: 'Röleli transfer anahtarlarında geçiş sırasında çok kısa bir kesinti olur. Aydınlatma ve çoğu ev aleti bundan etkilenmez, ancak masaüstü bilgisayar gibi hassas cihazlar yeniden başlayabilir. Bu cihazlar için UPS özellikli inverter tercih edin.',
      },
    ],
    related: ['tam-sinus-inverter', 'sarjli-tam-sinus-inverter', 'sigorta-ve-dagitim'],
    blog: [],
  },
  {
    slug: 'sigorta-ve-dagitim',
    category: 'Sigorta ve Dağıtım',
    group: 'solar-baglanti-ekipmani',
    h1: 'DC Sigorta ve Dağıtım Ekipmanı',
    title: 'DC Sigorta ve Dağıtım: Lynx, MEGA ve ANL Sigorta',
    description:
      'Victron Lynx Distributor DC dağıtım modülü, modüler MEGA ve ANL sigorta yuvaları: akü, inverter ve şarj cihazı hatlarını ayrı ayrı korumak için DC dağıtım.',
    intro:
      'Akülü sistemlerde akü ile inverter, şarj kontrol cihazı ve diğer cihazlar arasındaki her hat bir sigortayla korunmalıdır. Bu kategoride Victron Lynx Distributor DC dağıtım modülü ile MEGA ve ANL sigorta yuvaları bulunur; sigortalar ayrıca seçilir.',
    guide: [
      {
        heading: 'Sigorta nereye ve hangi değerde takılır?',
        body:
          'Sigorta, akünün artı kutbuna mümkün olduğunca yakın konur. Değeri, cihazın çektiği en yüksek sürekli akımdan büyük, korunan kablonun taşıyabileceği akımdan küçük olmalıdır. Önce kablo kesitini cihaz akımına göre belirleyin, ardından sigortayı bu kabloya göre seçin. Lityum aküler çok yüksek kısa devre akımı verebildiği için sigortanın kesme kapasitesi de önemlidir.',
      },
      {
        heading: 'Lynx Distributor ne işe yarar?',
        body:
          'Lynx Distributor, akü bankasından gelen artı ve eksi barayı dört ayrı çıkışa böler ve her çıkışa bir MEGA sigorta takılır. M10 bara bağlantıları sayesinde diğer Lynx modülleriyle yan yana birleştirilebilir. Çok sayıda cihazın tek akü grubuna bağlandığı karavan, tekne ve off-grid sistemlerde kablolamayı düzenli ve izlenebilir hale getirir.',
      },
      {
        heading: 'MEGA mı ANL mi?',
        body:
          'MEGA ve ANL, yüksek akımlı DC hatlarda kullanılan cıvatalı sigorta tipleridir. Sigorta tipini kullanacağınız yuvaya ve sistemdeki diğer ekipmana göre seçin; Lynx ürünleri MEGA sigorta kullanır. Yuvanın ve sigortanın sistem gerilimine uygun olduğundan emin olun.',
      },
    ],
    faq: [
      {
        q: 'Sigorta yerine şalter kullanılabilir mi?',
        a: 'DC devre için anma değeri verilmiş bir devre kesici hem koruma hem ayırma yapabilir. AC şalterler DC arkını güvenli şekilde kesemeyebileceği için akü hatlarında kullanılmamalıdır.',
      },
      {
        q: 'Eksi hatta da sigorta gerekir mi?',
        a: 'Sigorta genellikle artı hatta kullanılır. Eksi hatta ise akü monitörü şöntü ve ana ayırıcı gibi elemanlar yer alır; doğru ölçüm için tüm yüklerin ve şarj kaynaklarının eksisi şönt üzerinden geçmelidir.',
      },
    ],
    related: ['kablo-ve-konnektor', 'batarya-yonetimi-ve-aksesuar', 'izleme-ve-kontrol', 'lityum-aku'],
    blog: ['karavan-enerji-paketi'],
  },
  {
    slug: 'kablo-ve-konnektor',
    category: 'Kablo ve Konnektör',
    group: 'solar-baglanti-ekipmani',
    h1: 'Solar Kablo ve Konnektör',
    title: 'Solar Kablo ve Konnektör: MC4, XT60 ve Bağlantı',
    description:
      'Güç istasyonları için MC4-XT60 ve MC4-DC5525 panel kabloları; Victron RJ12, uzaktan aç/kapa, ön şarj ve BMS bağlantı kabloları. Kesit ve konnektör seçimi.',
    intro:
      'Kablo ve konnektörler, güneş enerjisi sisteminde panelden aküye ve cihazlar arası haberleşmeye kadar her bağlantının güvenli ve düşük kayıplı olmasını sağlar. Bu kategoride taşınabilir güç istasyonları için panel bağlantı kabloları ile Victron sistemlerinde kullanılan veri, kontrol ve bağlantı kabloları yer alır.',
    guide: [
      {
        heading: 'Panel kablosu ve konnektör seçimi',
        body:
          "Güneş panelleri MC4 konnektörlüdür; güç istasyonlarının solar girişleri ise XT60 veya DC5525 gibi farklı soketler kullanır. TommaTech V Serisi istasyonlar için MC4-XT60 (12 AWG), R Serisi için MC4-DC5525 (18 AWG) kablo kullanılır. Kablo kesiti panel akımını taşıyabilecek ve gerilim düşümünü yaklaşık %3'ün altında tutacak şekilde seçilmelidir; hat uzadıkça daha kalın kablo gerekir.",
      },
      {
        heading: 'Kontrol ve haberleşme kabloları',
        body:
          "Victron uzaktan aç/kapa kabloları, BMS'in inverter veya şarj kontrol cihazı gibi bir cihazı açıp kapatabilmesi için kullanılır. Ters çeviren (inverting) ve ters çevirmeyen (non-inverting) tipler, BMS çıkışının ve bağlanan cihazın uzaktan kontrol mantığına göre seçilir; hangisinin gerektiğini cihaz kılavuzundan kontrol edin. RJ12 UTP kablolar ve 3 pinli uzatma kabloları Victron cihazları arasındaki veri ve sensör bağlantıları içindir.",
      },
      {
        heading: 'Ön şarj kablosu ne işe yarar?',
        body:
          'İnverter gibi büyük kondansatörlü cihazlar aküye ilk bağlandığında çok yüksek anlık akım çeker; bu, kıvılcıma ve sigorta ya da kontak hasarına yol açabilir. Ön şarj (pre-charge) kablosu, ana bağlantıdan önce kondansatörleri dirençli bir yoldan yavaşça doldurarak bu ani akımı sınırlar.',
      },
    ],
    faq: [
      {
        q: 'Farklı marka MC4 konnektörleri birbirine takılabilir mi?',
        a: 'Farklı üreticilerin MC4 uyumlu konnektörleri fiziksel olarak birbirine geçse de temas direnci farklı olabilir ve bu durum ısınmaya yol açabilir. Bir bağlantının erkek ve dişi parçalarında aynı üreticinin konnektörlerini kullanmak tercih edilir.',
      },
      {
        q: 'Solar kablo ile normal kablo arasındaki fark nedir?',
        a: 'Solar kablolar UV ışınına, yüksek sıcaklığa ve DC gerilime dayanıklı çift yalıtımlı yapıdadır. Dış ortamda güneş altında kalacak panel hatlarında ev tipi kablo kullanılmamalıdır.',
      },
    ],
    related: ['sigorta-ve-dagitim', 'tasinabilir-guc-istasyonu', 'batarya-yonetimi-ve-aksesuar', 'izleme-ve-kontrol'],
    blog: ['ges-nasil-kurulur'],
  },
  {
    slug: 'izleme-ve-kontrol',
    category: 'İzleme ve Kontrol',
    group: 'solar-baglanti-ekipmani',
    h1: 'Solar Sistem İzleme ve Kontrol',
    title: 'Solar Sistem İzleme: GX Cihazları ve Akıllı Sayaç',
    description:
      'Victron Ekrano GX, Venus GX, GX Touch, GX Tank ve Digital Multi Control ile TommaTech akıllı sayaçlar: güneş, akü ve inverter sistemini uzaktan izleyin.',
    intro:
      'İzleme ve kontrol ürünleri; inverter, şarj kontrol cihazı, akü ve sayaçlardan gelen verileri tek ekranda toplar ve sistemi uzaktan yönetmenizi sağlar. Bu kategoride Victron GX sistem izleme cihazları, ekranlar, genişletme modülleri ve arayüz kabloları ile TommaTech inverterler için akıllı sayaçlar bulunur.',
    guide: [
      {
        heading: 'GX cihazı nedir, nasıl seçilir?',
        body:
          "Victron GX cihazları (Ekrano GX, Venus GX gibi) sistemin merkezidir: MultiPlus ve Quattro gibi VE.Bus cihazlarını, VE.Direct portlu MPPT'leri ve akü monitörlerini, VE.Can cihazlarını tek noktada toplar. Verileri ekranda gösterir ve internet bağlantısıyla VRM portalına aktarır. Ekrano GX'te 3 VE.Direct, 2 VE.Can ve 1 VE.Bus portu, 7 inç ekran ve 8-70 V DC besleme girişi bulunur.\n\nGX cihazı seçerken sisteminizdeki cihazların bağlantı tiplerini ve sayısını sayın. Tank seviyesi ölçümü için GX Tank 140, ek röle ve giriş/çıkışlar için GX IO-Extender 150 kullanılır.",
      },
      {
        heading: 'Akıllı sayaç ne işe yarar?',
        body:
          "Akıllı sayaç, bina ile şebeke arasındaki enerji akışını ölçer. Hibrit ve on-grid inverter bu bilgiyle şebekeye verilen enerjiyi sınırlayabilir, bataryayı binanın tüketimine göre şarj veya deşarj edebilir. TommaTech Uno Smart Meter monofaze, Trio Smart Meter trifaze sistemler içindir; CT'li model akımı akım trafosuyla ölçer. Victron sistemlerde aynı iş için VM-3P75CT trifaze enerji sayacı kullanılır.",
      },
      {
        heading: 'Uzaktan kontrol panelleri',
        body:
          'Digital Multi Control, MultiPlus ve Quattro inverter/şarj cihazlarını uzaktan açıp kapatmaya ve şebeke girişi akım sınırını ayarlamaya yarar. Karavan ve teknelerde kamp prizinin sigorta değerine göre akım sınırlamak için kullanılır. Sistemde GX cihazı varsa Digital Multi Control 200/200A GX sürümünü tercih edin.',
      },
    ],
    faq: [
      {
        q: 'Victron sistemimi internetten izleyebilir miyim?',
        a: 'Evet. Ekrano GX veya Venus GX gibi bir GX cihazını Ethernet ya da Wi-Fi ile internete bağladığınızda sistem verileri VRM portalına aktarılır ve telefondan veya bilgisayardan izlenebilir. İnternet olmayan yerlerde GX GSM veya GX LTE modem kullanılır; bunlar için aktif GPS anteni bu kategoride yer alır.',
      },
      {
        q: 'VE.Direct cihazımı telefondan izleyebilir miyim?',
        a: 'Bluetooth özelliği olmayan VE.Direct portlu Victron cihazlara VE.Direct Bluetooth Smart dongle takarak VictronConnect uygulamasıyla telefondan izleme ve ayar yapabilirsiniz.',
      },
      {
        q: 'Ada modu koruma rölesi nedir?',
        a: 'UFR1001E ada modu (anti-islanding) koruma rölesi, şebeke kesildiğinde veya şebeke gerilimi ve frekansı sınırların dışına çıktığında şebekeye paralel çalışan üretimi ayırır. Bazı dağıtım şirketleri şebekeye paralel çalışan inverter sistemleri için harici koruma rölesi isteyebilir.',
      },
    ],
    related: ['batarya-yonetimi-ve-aksesuar', 'hibrit-inverter', 'sarj-kontrol-aksesuari', 'inverter-aksesuari'],
    blog: ['hibrit-inverter-nedir'],
  },

  // ────────────────────────── ruzgar-enerjisi ──────────────────────────
  {
    slug: 'ruzgar-turbini',
    category: 'Rüzgar Türbini',
    group: 'ruzgar-enerjisi',
    h1: 'Rüzgar Türbini',
    title: 'Rüzgar Türbini Fiyatları: Ev ve Çiftlik Tipi Modeller',
    description:
      'Altech ve İstabreeze küçük rüzgar türbinleri: 500 W-12 kW, 12, 24 ve 48 V akülü sistemler için ev, bağ evi ve çiftlik tipi modeller. Kurulum notları.',
    intro:
      "Küçük rüzgar türbinleri, rüzgarın hareket enerjisini elektriğe çevirerek akü gruplarını şarj eder. Güneşin zayıf olduğu kış aylarında ve gece de üretim yapabildikleri için güneş enerjisi sistemlerini tamamlarlar. Kataloğumuzda 500 W'lık İstabreeze modellerinden 12 kW'lık Altech Nova serisine kadar ev, bağ evi ve çiftlik tipi türbinler bulunur.",
    guide: [
      {
        heading: 'Konum neden bu kadar önemli?',
        body:
          'Rüzgardan alınabilen güç, rüzgar hızının küpüyle artar; rüzgar hızı iki katına çıktığında teorik güç sekiz katına çıkar. Bu yüzden türbinin etiket gücünden çok, kurulacağı yerdeki ortalama rüzgar hızı belirleyicidir. Kıyı, yayla ve açık tepe bölgeleri uygundur; ağaç ve binalar arasında kalan alanlarda türbülans hem üretimi düşürür hem de türbini yorar.\n\nGenel kabul gören bir kurala göre türbin, yaklaşık 150 m çevresindeki engellerden en az 9 m yükseğe yerleştirilmelidir. Mümkünse kurulumdan önce bölgenin rüzgar verilerini inceleyin.',
      },
      {
        heading: 'Nominal güç ve sistem gerilimi',
        body:
          "Türbinlerin etiket gücü belirli bir yüksek rüzgar hızında elde edilir; ortalama rüzgarda üretim bu değerin oldukça altındadır. Karşılaştırma yaparken güç eğrisine ve başlangıç rüzgar hızına bakın; İstabreeze i serisinde başlangıç hızı 3 m/s'dir.\n\nSistem gerilimini akünüze ve inverterinize göre seçin: 500 W'lık modeller 12/24 V, i serisi 1-2 kW modeller 24/48 V, Altech Boreas 2000 ve 4000 modelleri 24 V veya 48 V seçeneklidir; Boreas 6000 ve İstabreeze Heli serisi 48 V'tur. Yüksek güçte 48 V tercih etmek kablo kesitini ve kayıpları azaltır.",
      },
      {
        heading: 'Kurulum ve güvenlik',
        body:
          'Türbin, ağırlığını ve rüzgar yükünü taşıyacak şekilde tasarlanmış bir direğe, gergi telleri veya uygun bir temel ile monte edilmelidir. Türbin çıkışı her zaman rüzgar şarj kontrol cihazına bağlı olmalıdır; yüksüz kalan türbin aşırı hızlanabilir. Fırtına ve bakım için manuel fren panosu kullanılması önerilir. Yerleşim alanlarında gürültü ve imar kurallarını da göz önünde bulundurun.',
      },
    ],
    faq: [
      {
        q: 'Rüzgar türbini şebekeye bağlanabilir mi?',
        a: 'Kataloğumuzdaki türbinlerin çoğu akülü (off-grid) sistemler için tasarlanmıştır; üretilen enerji şarj kontrol cihazı üzerinden aküye aktarılır ve inverterle kullanılır. Şebekeye bağlantı için türbine uygun bir şebeke inverteri ve dağıtım şirketinin onayı gerekir.',
      },
      {
        q: 'Rüzgar türbini gürültü yapar mı?',
        a: 'Küçük türbinlerde ses seviyesi kanat yapısına ve rüzgar hızına bağlıdır. İstabreeze i serisinde üretici, i-500, i-700 ve karbon kanatlı modeller için 40 dB, kompozit kanatlı 1-2 kW modeller için 50 dB belirtir. Direğe takılan ses düşürücü amortisör, titreşimin bağlı olduğu yapıya iletilmesini azaltır.',
      },
      {
        q: 'Güneş ve rüzgar aynı aküyü şarj edebilir mi?',
        a: 'Evet. Rüzgar-güneş hibrit şarj kontrol cihazı iki kaynağı tek cihazda yönetir; büyük sistemlerde ise her kaynak kendi şarj kontrol cihazıyla aynı aküye bağlanır. Bu düzen mevsimler boyunca daha dengeli bir üretim sağlar.',
      },
    ],
    related: ['ruzgar-sarj-kontrol-cihazi', 'ruzgar-turbini-aksesuari', 'lityum-aku', 'tam-sinus-mppt-akilli-inverter'],
    blog: [],
  },
  {
    slug: 'ruzgar-turbini-aksesuari',
    category: 'Rüzgar Türbini Aksesuarı',
    group: 'ruzgar-enerjisi',
    h1: 'Rüzgar Türbini Aksesuarları ve Yedek Parçaları',
    title: 'Rüzgar Türbini Yedek Parça: Kanat, Direk ve Fren',
    description:
      'İstabreeze ve Altech rüzgar türbini parçaları: kompozit ve karbon kanatlar, burun, kuyruk, kanat flanşı, alternatör, direk setleri, fren panosu ve amortisör.',
    intro:
      'Bu kategoride küçük rüzgar türbinlerinin kurulumu, bakımı ve onarımı için gereken parçalar bulunur: 50-107 cm kanatlar, burun ve kuyruk parçaları, kanat flanşları, yedek alternatörler, direk setleri, kafes tipi montaj direği, manuel fren panosu ve ses düşürücü amortisör.',
    guide: [
      {
        heading: 'Kanat seçimi ve değişimi',
        body:
          'Kanatlar türbin modeline göre boy ve bağlantı açısından eşleşir; örneğin 57 cm kompozit kanat İstabreeze i-500, 90 cm kanat i-700 içindir. Rotor dengesini korumak için kanatları tek tek değil set halinde ve aynı malzemeden değiştirmek tercih edilmelidir. Dengesiz rotor titreşime, sese ve yatak aşınmasına yol açar.\n\nKanat sayısına göre 3 kollu veya 5 kollu kanat flanşı ve uygun burun parçası seçilir. Karbon ve kompozit kanatlar arasında seçim yaparken türbin üreticisinin o model için önerdiği kanadı esas alın.',
      },
      {
        heading: 'Direk ve montaj',
        body:
          'Direğin taşıma kapasitesi türbin ağırlığından fazla olmalıdır; İstabreeze direkleri 15 kg ve 40 kg taşıma kapasiteli olarak sunulur ve uzatma borularıyla yükseltilebilir. Daha büyük türbinler için Altech 7 m kafes tipi direk kullanılabilir. Direk yüksekliği arttıkça rüzgar hızı ve üretim artar, ancak gergi telleri ve temelin önemi de artar.',
      },
      {
        heading: 'Fren panosu ve güvenlik',
        body:
          'Manuel fren panosu, türbinin 3 fazlı çıkışını kısa devre ederek rotoru durdurur. Türbin ile şarj kontrol cihazı arasına bağlanır ve direğe çıkmadan türbini durdurmanızı sağlar. Fırtına öncesinde ve her bakım çalışmasından önce türbin frenlenmelidir.',
      },
    ],
    faq: [
      {
        q: 'Yedek alternatör seçerken nelere dikkat edilmeli?',
        a: 'Yedek alternatörün güç sınıfı ve gerilimi mevcut türbin ve şarj kontrol cihazıyla aynı olmalıdır; örneğin 500G alternatör 12/24 V, Heli 2.0 alternatörü 48 V sistemler içindir. Montajdan önce türbini frenleyin ve direği indirin.',
      },
      {
        q: 'Ses düşürücü amortisör ne işe yarar?',
        a: 'Türbinin titreşimini direğe ve bağlı olduğu yapıya iletilmeden sönümler. Binaya yakın veya bina üzerine kurulan türbinlerde iç mekâna ulaşan uğultuyu azaltır.',
      },
    ],
    related: ['ruzgar-turbini', 'ruzgar-sarj-kontrol-cihazi'],
    blog: [],
  },
  {
    slug: 'ruzgar-sarj-kontrol-cihazi',
    category: 'Rüzgar Şarj Kontrol Cihazı',
    group: 'ruzgar-enerjisi',
    h1: 'Rüzgar Şarj Kontrol Cihazı',
    title: 'Rüzgar Şarj Kontrol Cihazı ve Rüzgar-Güneş Hibrit',
    description:
      'İstabreeze Pro Wind 1500-4000 W rüzgar şarj kontrol cihazları ve 650/850 W rüzgar-güneş hibrit modeller: 12, 24 ve 48 V akü sistemleri için frenleme korumalı.',
    intro:
      'Rüzgar şarj kontrol cihazı, türbinin ürettiği 3 fazlı alternatif akımı doğrultarak aküyü şarj eder ve akü dolduğunda türbini kontrol altına alır. Türbin hiçbir zaman şarj kontrol cihazı olmadan doğrudan aküye bağlanmamalıdır. Bu kategoride İstabreeze Pro Wind serisi ve rüzgar-güneş hibrit modeller bulunur.',
    guide: [
      {
        heading: 'Neden ayrı bir rüzgar şarj kontrol cihazı gerekir?',
        body:
          'Güneş panelinden farklı olarak rüzgar türbini yüksüz kaldığında aşırı hızlanabilir. Rüzgar şarj kontrol cihazı akü dolduğunda türbini frenleyerek veya enerjiyi yönlendirerek kontrol eder; böylece hem akü aşırı şarjdan hem de türbin kontrolsüz devirden korunur. Bu nedenle solar MPPT veya PWM şarj kontrol cihazları rüzgar türbini için kullanılamaz.',
      },
      {
        heading: 'Güç ve gerilim nasıl eşleştirilir?',
        body:
          "Cihazın gücü türbin gücüne eşit veya ondan büyük, akü gerilimi ise türbin ve akü sistemiyle aynı olmalıdır. Pro Wind serisi 1500 W (24 V), 2000 W (24/48 V) ve 4000 W (48 V) seçeneklidir ve İstabreeze i-1500, i-2000 ve Heli serisi türbinlerle kullanılır. Lityum akü kullanacaksanız şarj gerilimleri lityuma göre ayarlanmış sürümü tercih edin.",
      },
      {
        heading: 'Rüzgar-güneş hibrit cihaz ne zaman uygun?',
        body:
          "Hibrit modeller rüzgar türbinini ve güneş panelini aynı cihazda yönetir. 650 W modelde 500 W'a kadar rüzgar ve 150 W'a kadar güneş girişi bulunur ve 12/24 V sistemlerle çalışır; 850 W model 12/24/48 V seçeneklidir. Küçük bağ evi ve hobi sistemlerinde iki kaynağı tek cihazla şarj etmeye imkân verir.",
      },
    ],
    faq: [
      {
        q: 'Akü dolduğunda türbine ne olur?',
        a: 'Akü gerilimi belirlenen sınıra ulaştığında cihaz türbini otomatik olarak frenler. Hibrit modelde 12 V sistem için aşırı şarj koruma gerilimi 14,9 V ±0,5 V olarak verilmiştir. Fırtınalı havalarda otomatik frenleme yeterli olmayabilir, manuel fren kullanılmalıdır.',
      },
      {
        q: 'Türbin ile cihaz arasındaki kablo nasıl seçilir?',
        a: 'Türbinin 3 fazlı çıkışı direk boyunca uzun bir mesafe kat ettiği için kablo kesiti gerilim düşümüne göre seçilmelidir. 12-24 V sistemlerde akım yüksek olduğundan kesit hızla büyür; bu, uzun hatlarda 48 V sistemin önemli bir avantajıdır.',
      },
    ],
    related: ['ruzgar-turbini', 'ruzgar-turbini-aksesuari', 'lityum-aku', 'jel-aku'],
    blog: [],
  },

  // ──────────────────────── elektrikli-arac-sarj ────────────────────────
  {
    slug: 'elektrikli-arac-sarj-istasyonu',
    category: 'Elektrikli Araç Şarj İstasyonu',
    group: 'elektrikli-arac-sarj',
    h1: 'Elektrikli Araç Şarj İstasyonu',
    title: 'Elektrikli Araç Şarj İstasyonu: 22 kW AC Wallbox',
    description:
      'TommaTech Likya ve Trio 22 kW AC araç şarj istasyonları: Type 2 soketli veya 5 m kablolu, Bluetooth, Wi-Fi/4G, RFID ve OCPP 1.6J. Ev ve işletme için seçim.',
    intro:
      "AC elektrikli araç şarj istasyonu (wallbox), şebekeden aldığı alternatif akımı Type 2 konnektörle araca güvenli şekilde aktarır; bataryanın şarjını aracın içindeki şarj ünitesi yönetir. Ev garajı, site otoparkı, otel ve işyerleri için kullanılır. Kataloğumuzdaki TommaTech modeller monofaze bağlantıda 7,4 kW'a, trifaze bağlantıda 22 kW'a kadar şarj gücü sunar.",
    guide: [
      {
        heading: 'Monofaze mi trifaze mi, kaç kW?',
        body:
          "Monofaze 230 V ve 32 A ile en fazla yaklaşık 7,4 kW, trifaze 400 V ve 32 A ile 22 kW şarj gücü elde edilir. Ancak gerçek şarj gücünü aracın dahili AC şarj ünitesi sınırlar: 11 kW AC şarj kabul eden bir araç 22 kW istasyonda da 11 kW ile şarj olur.\n\nŞarj süresini kabaca şarj edilecek enerji / şarj gücü ile hesaplayabilirsiniz. 60 kWh bataryayı %20'den %80'e çıkarmak için 36 kWh gerekir; kayıplarla birlikte bu, 11 kW'ta yaklaşık 3,5 saat, 7,4 kW'ta yaklaşık 5 saat sürer.",
      },
      {
        heading: 'Soketli mi kablolu mu?',
        body:
          'Soketli modelde araç kablosunu her seferinde siz bağlarsınız; farklı araçların kendi kablolarıyla kullandığı ortak alanlar için uygundur. 5 m sabit kablolu model ev kullanımında pratiktir. Kablo uzunluğunu, aracın şarj soketinin park yerine göre konumunu dikkate alarak planlayın.',
      },
      {
        heading: 'Ev ve işletme kullanımı',
        body:
          'Ev kullanımında Bluetooth ile ayar yapılabilen Likya modelleri yeterlidir. Birden fazla kullanıcının olduğu site, otel ve işyerlerinde Trio modeli; RFID kartla kullanıcı doğrulama, Wi-Fi/4G bağlantısı ve OCPP 1.6J protokolü sayesinde şarj yönetim yazılımlarına bağlanabilir. Likya modellerinde 30 mA Tip A ve 6 mA DC kaçak akım koruması bulunur; besleme hattı ve koruma elemanları yetkili bir elektrikçi tarafından projelendirilmelidir.',
      },
    ],
    faq: [
      {
        q: 'Evde şarj istasyonu kurmak için ne gerekir?',
        a: 'Önce panonun ve abonelik gücünün şarj akımını karşılayıp karşılamadığı kontrol edilir, ardından istasyona ayrı bir hat ve uygun kesitte kablo çekilir. 22 kW şarj için trifaze bağlantı gerekir. Ayrıntılı adımlar için EV şarj istasyonu seçimi yazımıza bakabilirsiniz.',
      },
      {
        q: 'Şarj istasyonu güneş enerjisiyle kullanılabilir mi?',
        a: "İstasyon binanın elektrik tesisatından beslendiği için çatıdaki GES'in ürettiği enerjiyle de araç şarj edilebilir. Aracı gündüz şarj ederek güneş üretiminin büyük kısmını doğrudan araçta kullanmak mümkündür.",
      },
      {
        q: 'Şarj akımı ayarlanabilir mi?',
        a: 'Likya modellerinde şarj akımı 6-32 A arasında ayarlanabilir. Bina bağlantı gücü sınırlıysa akımı düşürerek diğer cihazlarla birlikte çalışırken sigortanın atmasını önleyebilirsiniz.',
      },
    ],
    related: ['sarj-istasyonu-aksesuari', 'on-grid-inverter', 'hibrit-inverter'],
    blog: ['ev-sarj-istasyonu-secimi'],
  },
  {
    slug: 'sarj-istasyonu-aksesuari',
    category: 'Şarj İstasyonu Aksesuarı',
    group: 'elektrikli-arac-sarj',
    h1: 'Şarj İstasyonu Aksesuarları',
    title: 'Şarj İstasyonu Aksesuarları: Type 2 Kablo ve Stand',
    description:
      'Elektrikli araç şarj istasyonları için TommaTech 22 kW Type 2 32 A şarj kablosu, LED ışıklı zemin standı, RFID kart ve ortak şarj yönetim yazılımı.',
    intro:
      'Şarj istasyonu aksesuarları, AC şarj istasyonunun kurulumunu ve kullanımını tamamlayan ürünlerdir. Soketli istasyonlar için Type 2 şarj kablosu, duvara montajın mümkün olmadığı otoparklar için zemin standı, kullanıcı doğrulama için RFID kart ve ortak şarj noktalarını yönetmek için yazılım bu kategoridedir.',
    guide: [
      {
        heading: 'Type 2 şarj kablosu seçimi',
        body:
          "Soketli istasyon kullanıyorsanız araca bağlantı için Type 2 - Type 2 kablo gerekir. TommaTech kablosu 32 A ve trifaze 22 kW'a kadar uygundur; 5 m uzunluğunda, 5 × 6 mm² kesitli ve IP55 korumalıdır. Aracınız monofaze veya 11 kW ile şarj oluyorsa bu kablo yine kullanılabilir; önemli olan kablo değerinin istasyonun ve aracın değerinden düşük olmamasıdır.",
      },
      {
        heading: 'Zemin standı ve montaj',
        body:
          'LED ışıklı zemin standı, duvara montaj yapılamayan açık otopark ve site alanları içindir. Stand boş pano olarak gelir; kaçak akım rölesi ve sigorta gibi koruma elemanları ayrıca seçilmeli ve elektrikçi tarafından monte edilmelidir.',
      },
      {
        heading: 'RFID kart ve yönetim yazılımı',
        body:
          'RFID kartlar, kart okuyuculu istasyonlarda (ör. TommaTech Trio 22 kW) şarjı yalnızca yetkili kişilerin başlatmasını sağlar. Ortak şarj yönetim yazılımı ise site, otel ve işyerlerinde kullanıcıların tüketimini takip etmek ve maliyeti paylaştırmak için kullanılır.',
      },
    ],
    faq: [
      {
        q: 'Kablolu istasyon için ayrıca şarj kablosu gerekir mi?',
        a: 'Hayır. Sabit kablolu istasyonlarda Type 2 kablo cihazla birlikte gelir. Ayrı kablo yalnızca soketli istasyonlar için veya yedek kablo ihtiyacında gerekir.',
      },
      {
        q: 'RFID kart her istasyonda çalışır mı?',
        a: 'Kartlar RFID okuyuculu TommaTech istasyonlarla uyumludur. Kart desteği istasyon modeline bağlıdır; satın almadan önce istasyonun ürün sayfasında RFID okuyucu bulunduğunu kontrol edin.',
      },
    ],
    related: ['elektrikli-arac-sarj-istasyonu', 'on-grid-inverter'],
    blog: ['ev-sarj-istasyonu-secimi'],
  },
]
