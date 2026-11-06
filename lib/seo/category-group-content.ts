/**
 * Ana kategori (CATEGORY_GROUPS) sayfalarının rehber içeriği — /category/<id>.
 *
 * Alt tür sayfaları (lib/seo/product-types.ts) tek bir ürün türünü derinlemesine anlatır; bu içerik bir üst
 * seviyede "hangi tür bana uygun?" sorusunu yanıtlar ve okuyucuyu doğru tür sayfasına yönlendirir. Böylece iki
 * sayfa aynı aramayı hedeflemez (kannibalizasyon yok). Metinler genel, doğrulanabilir teknik bilgidir; marka/model
 * iddiası ve fiyat içermez (fiyat ve sayılar sayfada katalogdan gösterilir).
 * guide[].body içinde paragraflar "\n\n" ile ayrılır. Yalnızca Türkçe arayüzde gösterilir.
 */
export type CategoryGroupContent = {
  /** H1 altındaki rehber bölümünün giriş paragrafı: kategori nedir, kimin için */
  intro: string
  /** 3–4 bölüm: alt türler arasında seçim, boyutlandırma, uyumluluk */
  guide: { heading: string; body: string }[]
  /** 3–4 gerçek alıcı sorusu */
  faq: { q: string; a: string }[]
}

export const CATEGORY_GROUP_CONTENT: Record<string, CategoryGroupContent> = {
  'solar-aku': {
    intro:
      'Solar akü, güneş panellerinin gündüz ürettiği enerjiyi gece ve bulutlu havada kullanmak için depolar. Bu kategoride LiFePO4 lityum aküler, jel aküler, batarya yönetimi ekipmanları ve kurulum gerektirmeyen taşınabilir güç istasyonları bulunur. Doğru seçim; günlük tüketiminize, sistem voltajınıza ve aküyü ne sıklıkla kullanacağınıza bağlıdır.',
    guide: [
      {
        heading: 'Lityum (LiFePO4) mi, jel akü mü?',
        body:
          'LiFePO4 lityum aküler kapasitelerinin büyük bölümünü güvenle kullanmanıza izin verir, çok daha fazla şarj-deşarj çevrimine dayanır ve aynı kapasitedeki jel aküden belirgin şekilde hafiftir. İlk yatırım maliyeti daha yüksektir; her gün kullanılan güneş enerjisi sistemlerinde, karavan ve teknelerde uzun vadede daha ekonomiktir.\n\nJel aküler daha düşük ilk maliyetlidir ve bakım gerektirmez. Ömrünü korumak için kapasitesinin yaklaşık yarısından fazlasının kullanılmaması önerilir; bu yüzden aynı kullanılabilir enerji için daha büyük kapasite gerekir. Ara sıra kullanılan yedek sistemler ve bütçenin öncelikli olduğu küçük kurulumlar için uygundur.',
      },
      {
        heading: 'Akü kapasitesi nasıl hesaplanır?',
        body:
          'Önce günlük enerji ihtiyacınızı watt-saat (Wh) olarak bulun: her cihazın gücünü günlük çalışma saatiyle çarpıp toplayın. Bu değeri akü voltajına ve kullanılabilir kapasite oranına bölün. Örneğin günde 2.400 Wh tüketen bir sistemde 51,2 V LiFePO4 akü ve %90 kullanılabilir kapasiteyle yaklaşık 52 Ah gerekir.\n\nGüneşin az olduğu günleri karşılamak için 1–2 günlük yedek (otonomi) eklemek yaygın bir yaklaşımdır; aynı örnekte bu, 100 Ah civarında bir akü anlamına gelir. Jel akü kullanılacaksa kullanılabilir oran daha düşük alınmalıdır.',
      },
      {
        heading: '12 V, 24 V ya da 48 V sistem',
        body:
          'Akü voltajı, inverter ve şarj kontrol cihazının sistem voltajıyla aynı olmalıdır. Küçük karavan ve tekne sistemlerinde 12 V yaygındır. Güç arttıkça 24 V ve 48 V (51,2 V LiFePO4) tercih edilir: aynı güç için akım düşer, kablolar incelir ve kayıplar azalır. Ev tipi depolama ve hibrit inverterli sistemlerde 48 V standart hâline gelmiştir.\n\nYüksek voltajlı (HV) batarya modülleri ise yalnızca bu modülleri destekleyen hibrit inverterlerle kullanılır; seçim yapmadan önce inverterin uyumlu batarya listesini kontrol edin.',
      },
      {
        heading: 'Taşınabilir güç istasyonu ne zaman yeterli?',
        body:
          'Taşınabilir güç istasyonu akü, inverter ve şarj elektroniğini tek kasada birleştirir; kurulum gerektirmez. Kamp, saha çalışması ve kısa elektrik kesintilerinde dizüstü bilgisayar, modem, aydınlatma ve küçük ev aletlerini çalıştırmak için pratiktir. Sürekli kullanılan bir ev sistemi veya yüksek güçlü cihazlar için ise sabit akü ve inverterli bir kurulum daha uygundur.',
      },
    ],
    faq: [
      {
        q: 'Lityum akü mevcut inverterim ve şarj cihazımla çalışır mı?',
        a: 'Çalışması için inverterin veya şarj kontrol cihazının LiFePO4 (lityum) şarj profilini desteklemesi gerekir. Batarya modülleri inverterle haberleşiyorsa (CAN/RS485) iki cihazın birbirini desteklediği üreticinin uyumluluk listesinden doğrulanmalıdır. Emin değilseniz cihaz modellerinizle bize yazın.',
      },
      {
        q: 'Akü ömrünü neler belirler?',
        a: 'Kullanım derinliği (her döngüde kapasitenin ne kadarının kullanıldığı), çalışma sıcaklığı ve şarj-deşarj akımı ömrü doğrudan etkiler. LiFePO4 aküler jel akülere göre çok daha fazla çevrim için derecelendirilir; her ürünün çevrim değeri ürün sayfasındaki teknik özelliklerde yer alır.',
      },
      {
        q: 'Akü ve bataryalar nasıl sipariş edilir?',
        a: 'Akü ve bataryalarda kargo koşulları ürüne göre değiştiği için sipariş, ürün sayfasındaki teklif formu üzerinden alınır; kargo ücreti size iletilen teklifte belirtilir.',
      },
    ],
  },

  'solar-inverter': {
    intro:
      'İnverter, güneş panellerinden veya aküden gelen doğru akımı (DC) evde ve işyerinde kullanılan alternatif akıma (AC) çevirir. Bu kategoride şebekesiz (off-grid) sistemler için MPPT akıllı inverterler, şebeke ve aküyü birlikte yöneten hibrit inverterler, şebekeye bağlı on-grid inverterler, araç ve karavan için tam sinüs inverterler ve panelden doğrudan pompa çalıştıran solar pompa sürücüleri yer alır.',
    guide: [
      {
        heading: 'On-grid, hibrit ya da off-grid: hangisi size uygun?',
        body:
          'On-grid inverter şebekeye bağlı çalışır ve akü kullanmaz; üretilen enerji önce binada tüketilir. Güvenlik gereği şebeke kesildiğinde üretimi durdurur, bu yüzden kesintide yedek güç sağlamaz. Fatura azaltmak isteyen ev ve işletmeler için en sade çözümdür.\n\nHibrit inverter panel, akü ve şebekeyi birlikte yönetir: gündüz fazlasını aküye depolar, kesintide aküden beslemeye devam eder. Off-grid (MPPT akıllı) inverter ise şebekenin olmadığı bağ evi, yayla ve tarım arazileri için tasarlanmıştır; dahili MPPT şarj kontrolüyle panelden aküyü şarj eder.',
      },
      {
        heading: 'İnverter gücü nasıl seçilir?',
        body:
          'Aynı anda çalışacak cihazların toplam gücünü toplayın ve üzerine pay bırakın. Buzdolabı, su pompası ve klima gibi motorlu cihazlar çalışmaya başlarken nominal güçlerinin birkaç katı akım çekebilir; inverterin anlık (tepe) gücü bu kalkışı karşılamalıdır.\n\nOn-grid ve hibrit sistemlerde inverter gücü genellikle panel gücüyle (kWp) birlikte planlanır. Bağlantı tipine göre monofaze veya trifaze model seçilir; trifaze aboneliğe ve üç fazlı yüklere sahip binalarda trifaze inverter gerekir.',
      },
      {
        heading: 'Tam sinüs mü, modifiye sinüs mü?',
        body:
          'Tam sinüs inverter şebekeyle aynı dalga biçimini üretir; motorlu cihazlar, elektronik devreler, tıbbi cihazlar ve ses sistemleri sorunsuz çalışır. Modifiye sinüs inverter daha ekonomiktir ancak yalnızca ısıtıcı, akkor lamba gibi basit dirençli yükler için önerilir; motorlu ve hassas cihazlarda ısınma, gürültü veya arıza yapabilir.',
      },
      {
        heading: 'Solar pompa sürücüsü ne işe yarar?',
        body:
          'Solar pompa sürücüsü panellerden gelen doğru akımı pompanın ihtiyaç duyduğu değişken frekanslı alternatif akıma çevirir; akü kullanmadan, güneş olduğu sürece pompayı çalıştırır. Tarımsal sulama ve hayvan içme suyu için yaygın bir çözümdür. Seçimde pompanın gücü (kW/HP), monofaze/trifaze oluşu ve panel dizisinin voltajı belirleyicidir.',
      },
    ],
    faq: [
      {
        q: 'On-grid inverter elektrik kesintisinde çalışır mı?',
        a: 'Hayır. On-grid inverterler, şebekede çalışanların güvenliği için kesinti anında üretimi durdurur. Kesintide de elektrik istiyorsanız akülü hibrit inverter veya şebekesiz (off-grid) bir sistem gerekir.',
      },
      {
        q: 'Kaç kW inverter almalıyım?',
        a: 'Şebekesiz sistemlerde aynı anda çalışacak cihazların toplam gücüne ve motorlu cihazların kalkış akımına göre; şebekeye bağlı sistemlerde ise kurulacak panel gücüne göre seçilir. Tüketiminizi GES hesaplama sayfamızda girerek önerilen sistem gücünü görebilirsiniz.',
      },
      {
        q: 'Monofaze inverteri trifaze binada kullanabilir miyim?',
        a: 'Küçük güçlerde tek faza bağlanabilir, ancak üç fazlı yükleri (trifaze motor, pompa) besleyemez ve fazlar arasında dengesizlik yaratabilir. Trifaze aboneliği ve yükleri olan binalarda trifaze inverter tercih edilmelidir.',
      },
    ],
  },

  'gunes-paneli': {
    intro:
      'Güneş paneli, güneş ışığını doğrudan elektriğe çeviren fotovoltaik modüldür. Bu kategoride çatı ve arazi kurulumları için yüksek verimli TOPCon ve monokristal paneller, iki yüzünden üretim yapan bifacial modeller ve karavan, tekne ve kamp için esnek ve katlanabilir paneller yer alır.',
    guide: [
      {
        heading: 'TOPCon, monokristal ve bifacial arasındaki fark',
        body:
          'TOPCon paneller n-tipi hücre teknolojisiyle üretilir; yüksek verim, düşük ışıkta iyi performans ve sıcaklık artışında daha az güç kaybı sunar. Monokristal (PERC) paneller uzun süredir yaygın, kanıtlanmış ve ekonomik bir seçenektir.\n\nBifacial paneller arka yüzlerine yansıyan ışıktan da enerji üretir. Bu ek kazanç, panellerin yerden yüksek monte edildiği ve zeminin açık renkli olduğu arazi ve düz çatı kurulumlarında belirginleşir; düz yatırılmış çatı montajında fark azdır.',
      },
      {
        heading: 'Kaç panel gerekir?',
        body:
          'İhtiyaç duyulan sistem gücünü (kWp) panelin gücüne (Wp) bölün. Örneğin 5 kWp bir sistem için 450 Wp panellerden 12 adet gerekir. Gereken sistem gücü ise yıllık tüketiminize ve bölgenizin güneşlenme süresine bağlıdır; GES hesaplama sayfamızda bölge ve tüketim bilgisiyle önerilen gücü görebilirsiniz.\n\nÇatı alanı sınırlıysa daha yüksek güçlü (ve genellikle daha büyük) paneller daha az montaj noktasıyla aynı gücü sağlar; panel ölçülerini çatı ölçünüzle karşılaştırın.',
      },
      {
        heading: 'Panel ile inverter ve şarj kontrol uyumu',
        body:
          'Panellerin açık devre voltajı (Voc) seri bağlandığında toplanır ve soğuk havada yükselir. Dizinin toplam Voc değeri, inverterin veya MPPT şarj kontrol cihazının maksimum giriş voltajını hiçbir koşulda aşmamalıdır. Kısa devre akımı (Isc) da cihazın giriş akımı sınırının altında kalmalıdır.\n\nPWM şarj kontrol cihazı kullanılan küçük sistemlerde panelin çalışma voltajı akü voltajına yakın olmalıdır; yüksek voltajlı büyük paneller için MPPT şarj kontrol cihazı gerekir.',
      },
      {
        heading: 'Esnek ve katlanabilir paneller kimler için?',
        body:
          'Esnek paneller hafiftir ve kavisli yüzeylere (karavan tavanı, tekne güvertesi) yapıştırılarak monte edilebilir. Katlanabilir çanta tipi paneller kamp ve saha kullanımında taşınabilir güç istasyonlarını şarj etmek için pratiktir. Sabit çatı panellerine göre daha düşük güç ve farklı kullanım ömrü beklentisiyle seçilmelidir.',
      },
    ],
    faq: [
      {
        q: 'Panel gücündeki "Wp" ne demek?',
        a: 'Wp (watt-peak), panelin standart test koşullarında (1000 W/m² ışınım, 25 °C hücre sıcaklığı) ürettiği tepe güçtür. Gerçek üretim; ışınım, sıcaklık, panel açısı ve gölgelenmeye göre bu değerin altında veya çevresinde değişir.',
      },
      {
        q: 'Güneş paneli bulutlu havada elektrik üretir mi?',
        a: 'Üretir, ancak ışınım azaldığı için üretim belirgin şekilde düşer. Düşük ışıkta performansı iyi olan TOPCon paneller bu koşullarda daha avantajlıdır. Akülü sistemlerde bulutlu günler için akü kapasitesine pay bırakılır.',
      },
      {
        q: 'Farklı güçteki panelleri aynı dizide kullanabilir miyim?',
        a: 'Önerilmez. Seri bağlı dizide akımı en düşük panel belirler; farklı panelleri karıştırmak toplam üretimi düşürür. Farklı paneller kullanılacaksa ayrı MPPT girişlerine bağlanmaları gerekir.',
      },
    ],
  },

  'solar-sarj-kontrol': {
    intro:
      'Şarj kontrol cihazı, güneş panelinden aküye giden enerjiyi düzenler; aküyü aşırı şarjdan ve gece panel üzerinden boşalmaktan korur. Bu kategoride MPPT ve PWM solar şarj kontrol cihazları, araç alternatöründen şarj için DC-DC şarj cihazları, şebekeden şarj eden akü şarj cihazları ve uzaktan izleme aksesuarları bulunur.',
    guide: [
      {
        heading: 'MPPT mi, PWM mi?',
        body:
          'MPPT şarj kontrol cihazı panelin en verimli çalışma noktasını sürekli izler ve yüksek panel voltajını akü voltajına verimli şekilde dönüştürür. Yüksek güçlü paneller, seri bağlı diziler ve 200 W üzeri sistemlerde MPPT tercih edilmelidir.\n\nPWM şarj kontrol cihazı daha basit ve ekonomiktir; panel voltajını akü voltajına indirirken aradaki farkı kullanamaz. Bu nedenle yalnızca çalışma voltajı akü voltajına yakın küçük panellerle (12 V akü için 36 hücreli panel gibi) verimlidir.',
      },
      {
        heading: 'Kaç amper şarj kontrol cihazı gerekir?',
        body:
          'Panel gücünü akü voltajına bölerek yaklaşık şarj akımını bulun ve üzerine pay bırakın. Örneğin 12 V akülü sistemde 400 W panel yaklaşık 33 A akım üretir; bu sistem için 40–50 A bir MPPT cihazı uygundur. Aynı panel 24 V aküye bağlanırsa akım yarıya iner ve daha küçük bir cihaz yeterli olur.\n\nMPPT cihazlarında ayrıca maksimum panel giriş voltajına (PV Voc) dikkat edin: dizinin soğuk havadaki açık devre voltajı bu sınırın altında kalmalıdır.',
      },
      {
        heading: 'DC-DC ve AC akü şarj cihazları',
        body:
          'DC-DC şarj cihazları karavan ve teknelerde aracın alternatöründen yaşam aküsünü doğru şarj profiliyle şarj eder; bazı modeller solar MPPT girişini de aynı kutuda birleştirir. AC akü şarj cihazları ise şebeke veya jeneratörden aküyü şarj etmek içindir. Lityum akü kullanılıyorsa cihazın LiFePO4 şarj profilini desteklediğinden emin olun.',
      },
    ],
    faq: [
      {
        q: 'Şarj kontrol cihazı lityum aküyü şarj eder mi?',
        a: 'LiFePO4 (lityum) şarj profili olan veya şarj voltajları ayarlanabilen cihazlar lityum aküyü doğru şekilde şarj eder. Ürün sayfalarındaki teknik özelliklerde desteklenen akü türleri belirtilir.',
      },
      {
        q: 'Şarj kontrol cihazını uzaktan izleyebilir miyim?',
        a: 'Birçok model Bluetooth modülü, harici ekran veya izleme cihazıyla telefondan ya da internet üzerinden izlenebilir. Gerekli modül veya ekran, ilgili modelin uyumlu aksesuarları arasında yer alır.',
      },
      {
        q: 'Birden fazla şarj kontrol cihazını aynı aküye bağlayabilir miyim?',
        a: 'Evet, farklı panel dizilerini ayrı şarj kontrol cihazlarıyla aynı akü grubuna bağlamak yaygın bir uygulamadır. Cihazların şarj voltajı ayarlarının aynı olması gerekir.',
      },
    ],
  },

  'isi-pompasi': {
    intro:
      'Isı pompası dış havadaki ısıyı alarak binayı ısıtır, sıcak su üretir ve modele göre soğutma da yapar. Harcadığı elektriğin birkaç katı ısı enerjisi sağladığı için doğalgazın olmadığı veya ısıtma maliyetinin düşürülmek istendiği binalarda tercih edilir; güneş enerjisi sistemiyle birlikte kullanıldığında elektrik tüketimi büyük ölçüde panellerden karşılanabilir.',
    guide: [
      {
        heading: 'Monoblok, split ve havuz tipi',
        body:
          'Monoblok ısı pompalarında tüm soğutucu devresi dış ünitededir; binaya yalnızca su boruları girer, kurulumu görece basittir. Split modellerde iç ve dış ünite soğutucu hatlarıyla bağlanır; su tesisatının dışarıda donma riskinin yüksek olduğu soğuk bölgelerde avantajlıdır.\n\nHavuz tipi ısı pompaları havuz suyunu ısıtmak için tasarlanmıştır ve sezonu uzatmak için kullanılır; bina ısıtması için değildir.',
      },
      {
        heading: 'R290, R32 ve EVI ne anlama gelir?',
        body:
          'R290 (propan) küresel ısınma potansiyeli çok düşük, doğal bir soğutucu akışkandır ve yüksek su sıcaklığı üretebilir. R32 yaygın kullanılan, R410A\'ya göre daha çevreci bir akışkandır.\n\nEVI (geliştirilmiş buhar enjeksiyonu) teknolojisi, dış hava çok soğukken kompresörün kapasitesini korumasına yardımcı olur; kışları sert geçen bölgelerde tercih edilir.',
      },
      {
        heading: 'Kapasite nasıl seçilir?',
        body:
          'Isı pompasının kapasitesi binanın ısı kaybına göre belirlenir: ısıtılan alan, yalıtım durumu, pencere tipi, bölgenin kış sıcaklıkları ve ısıtma sistemi (yerden ısıtma veya radyatör) bu hesabı etkiler. Yerden ısıtma düşük su sıcaklığıyla çalıştığı için ısı pompasıyla en verimli sonucu verir. Doğru kapasite için keşif ve ısı kaybı hesabı yapılması önerilir.',
      },
    ],
    faq: [
      {
        q: 'Isı pompası soğutma da yapar mı?',
        a: 'Isıtma-soğutma özellikli (çift yönlü) modeller yazın soğutma yapabilir; bazı modeller yalnızca ısıtma ve sıcak su içindir. Her modelin desteklediği modlar ürün sayfasındaki teknik özelliklerde belirtilir.',
      },
      {
        q: 'Isı pompası güneş enerjisiyle çalışır mı?',
        a: 'Isı pompası elektrikle çalışır; bu elektriği güneş panellerinden sağlamak mümkündür. Şebekeye bağlı bir GES, ısı pompasının yıllık tüketiminin önemli bir kısmını karşılayabilir. Sistem gücünü planlarken ısı pompasının tüketimini de hesaba katın.',
      },
      {
        q: 'Kurulumu kim yapar?',
        a: 'Isı pompası kurulumu tesisat ve elektrik bağlantısı gerektirir; yetkin bir ekip tarafından yapılmalıdır. Ürün seçimi ve kurulum planlaması için bizimle iletişime geçebilirsiniz.',
      },
    ],
  },

  'ruzgar-enerjisi': {
    intro:
      'Ev tipi rüzgar türbinleri, rüzgârın güçlü olduğu bölgelerde aküyü şarj ederek veya şebekeye bağlı çalışarak elektrik üretir. Güneşin az olduğu gece saatlerinde ve kış aylarında da üretim yapabildiği için güneş panelleriyle birlikte hibrit sistemlerde sıkça kullanılır. Bu kategoride rüzgar türbinleri, rüzgar şarj kontrol cihazları, direk setleri ve yedek parçalar yer alır.',
    guide: [
      {
        heading: 'Rüzgar türbini kimler için uygun?',
        body:
          'Rüzgar türbininin verimi tamamen kurulum yerindeki rüzgâr hızına bağlıdır. Kıyı şeridi, yayla, tepe ve açık araziler gibi rüzgârın düzenli estiği yerler için uygundur. Binaların ve ağaçların arasında, rüzgârın türbülanslı olduğu yerlerde üretim düşer.\n\nGüneş panelleriyle birlikte kurulan hibrit sistemlerde türbin, panellerin üretim yapmadığı saatleri tamamlar ve akü kapasitesinin daha küçük tutulmasına yardımcı olur.',
      },
      {
        heading: 'Güç ve voltaj seçimi',
        body:
          'Türbinin nominal gücü, belirli (genellikle yüksek) bir rüzgâr hızında ulaşılan güçtür; ortalama üretim bunun altında kalır. Bu yüzden türbini nominal güce göre değil, bölgenin ortalama rüzgâr hızına ve günlük enerji ihtiyacınıza göre seçin.\n\nTürbinin çıkış voltajı (12 V, 24 V, 48 V) akü grubunuzla aynı olmalıdır. Büyük güçlerde 48 V sistem kablo kayıplarını azaltır.',
      },
      {
        heading: 'Şarj kontrolü, direk ve kurulum',
        body:
          'Rüzgar türbinleri mutlaka uygun bir rüzgar şarj kontrol cihazıyla kullanılmalıdır; akü dolduğunda veya fırtınada türbini frenleyerek ya da fazla enerjiyi yük direncine yönlendirerek sistemi korur. Hibrit şarj kontrol cihazları panel ve türbini aynı aküye bağlamayı sağlar.\n\nTürbin, çevredeki engellerin belirgin şekilde üzerinde bir direğe monte edilmelidir. Direk yüksekliği arttıkça rüzgâr daha düzenli ve güçlü olur; direk ve zemin bağlantısı türbinin ağırlığına ve rüzgâr yüküne göre seçilmelidir.',
      },
    ],
    faq: [
      {
        q: 'Rüzgar türbini ne kadar elektrik üretir?',
        a: 'Üretim, kurulum yerindeki ortalama rüzgâr hızına bağlıdır ve rüzgâr hızındaki küçük bir artış üretimi önemli ölçüde yükseltir. Nominal güç sürekli üretim anlamına gelmez; ürün sayfalarındaki güç eğrisi farklı rüzgâr hızlarındaki üretimi gösterir.',
      },
      {
        q: 'Rüzgar türbini için şarj kontrol cihazı gerekir mi?',
        a: 'Evet. Rüzgar şarj kontrol cihazı aküyü aşırı şarjdan korur ve kuvvetli rüzgârda türbini frenleyerek aşırı devirden kaynaklanan hasarı önler. Türbinle uyumlu (aynı voltaj ve güçte) bir cihaz seçilmelidir.',
      },
      {
        q: 'Rüzgar türbini ve güneş panelini birlikte kullanabilir miyim?',
        a: 'Evet. Hibrit şarj kontrol cihazlarıyla panel ve türbin aynı akü grubunu şarj eder. Güneşin ve rüzgârın farklı saatlerde ve mevsimlerde güçlü olması, toplam üretimi daha dengeli hâle getirir.',
      },
    ],
  },

  'elektrikli-arac-sarj': {
    intro:
      'Elektrikli araç şarj istasyonları evde, işyerinde ve otoparklarda aracı güvenli ve hızlı şekilde şarj etmek içindir. Bu kategoride duvara monte AC şarj cihazları (wallbox), işletmeler ve filolar için yüksek güçlü DC hızlı şarj istasyonları ve şarj aksesuarları yer alır.',
    guide: [
      {
        heading: 'AC mi, DC mi?',
        body:
          'AC şarj cihazları aracın kendi dahili şarj ünitesini kullanır. Monofaze bağlantıda genellikle 7,4 kW, trifaze bağlantıda 11 veya 22 kW güç verir; ev ve işyeri otoparkları için yaygın çözümdür. Şarj süresini istasyonun gücü kadar aracın AC şarj kapasitesi de belirler.\n\nDC hızlı şarj istasyonları enerjiyi doğrudan araç bataryasına yüksek güçte aktarır ve şarj süresini belirgin şekilde kısaltır. Akaryakıt istasyonu, otel, alışveriş merkezi ve filo kullanımına yöneliktir; güçlü bir trafo ve tesisat altyapısı gerektirir.',
      },
      {
        heading: 'Monofaze mi, trifaze mi?',
        body:
          'Binanın elektrik bağlantısı trifaze ise 11–22 kW AC şarj mümkündür; monofaze bağlantıda 7,4 kW civarı sınırdır. 22 kW istasyondan tam güç almak için aracın da 22 kW AC şarjı desteklemesi gerekir; desteklemiyorsa araç kendi azami gücüyle şarj olur.',
      },
      {
        heading: 'Kablolu ya da soketli model, kurulum',
        body:
          'Kablolu modellerde Type 2 şarj kablosu istasyona sabittir ve kullanım pratiktir. Soketli modellerde kullanıcı kendi kablosunu takar; farklı araçların kullandığı ortak otoparklarda tercih edilir.\n\nKurulum öncesinde tesisatın istasyonun gücünü taşıyabildiği ve uygun kaçak akım koruması bulunduğu kontrol edilmelidir. Şarj istasyonlarının kurulumu ve nakliyesi için sipariş sonrasında sizinle iletişime geçilir.',
      },
    ],
    faq: [
      {
        q: 'Evde elektrikli araç şarj istasyonu kurmak için ne gerekir?',
        a: 'İstasyonun gücünü taşıyabilen bir elektrik bağlantısı, uygun kesitte kablo ve kaçak akım koruması gerekir. Trifaze bağlantı daha yüksek şarj gücü sağlar. Kurulum yetkin bir elektrik ekibi tarafından yapılmalıdır.',
      },
      {
        q: '22 kW istasyon her aracı 22 kW ile şarj eder mi?',
        a: 'Hayır. AC şarjda gücü aracın dahili şarj ünitesi sınırlar; örneğin 11 kW AC kapasiteli bir araç 22 kW istasyonda da 11 kW ile şarj olur.',
      },
      {
        q: 'Şarj istasyonunu güneş enerjisiyle besleyebilir miyim?',
        a: 'Evet. Şebekeye bağlı bir güneş enerjisi sistemi gündüz üretimiyle araç şarjının bir bölümünü karşılayabilir. Sistem gücünü planlarken aracın günlük şarj ihtiyacını da tüketime ekleyin.',
      },
    ],
  },

  'solar-baglanti-ekipmani': {
    intro:
      'Bir güneş enerjisi sisteminin güvenli ve verimli çalışması panel, akü ve inverter kadar bunları birbirine bağlayan ekipmana da bağlıdır. Bu kategoride solar kablolar ve konnektörler, DC sigorta ve dağıtım ekipmanı, otomatik transfer switch\'ler ve sistemi izlemek için GX cihazları, akıllı sayaçlar ve sensörler yer alır.',
    guide: [
      {
        heading: 'Solar kablo ve konnektör seçimi',
        body:
          'Panel tarafında UV ışınlarına ve dış ortama dayanıklı, çift yalıtımlı solar kablo kullanılmalıdır; yaygın kesitler 4 mm² ve 6 mm²\'dir. Kablo kesiti akıma ve hat uzunluğuna göre seçilir: uzun hatlarda gerilim düşümünü sınırlamak için daha kalın kablo gerekir.\n\nPanel bağlantılarında MC4 tipi konnektörler standarttır. Farklı üreticilerin konnektörlerini birbirine takmak temas sorunlarına yol açabileceği için aynı tip konnektör kullanılması önerilir.',
      },
      {
        heading: 'DC koruma: sigorta ve dağıtım',
        body:
          'Akü ile inverter arasındaki hatta yüksek akım akar; kısa devreye karşı akü kutbuna yakın bir sigorta kullanılmalıdır. Panel dizilerinde de birden fazla dizinin paralel bağlandığı durumlarda dizi sigortası gerekir. DC tarafta kullanılan sigorta ve şalterlerin DC voltajına ve akımına uygun derecelendirilmiş olması şarttır.\n\nDC dağıtım baraları ve modülleri, birden fazla cihazın akü grubuna düzenli ve güvenli bağlanmasını sağlar.',
      },
      {
        heading: 'Transfer switch ve izleme',
        body:
          'Otomatik transfer switch, şebeke, jeneratör ve inverter gibi kaynaklar arasında yükü otomatik olarak aktarır; kesintide kesintisiz geçiş için kullanılır.\n\nGX izleme cihazları ve akıllı sayaçlar, sistemin üretimini, akü durumunu ve tüketimi tek ekrandan veya internet üzerinden takip etmenizi sağlar. Hibrit sistemlerde akıllı sayaç, şebekeye fazla enerji verilmesini sınırlamak (sıfır besleme) için de kullanılır.',
      },
    ],
    faq: [
      {
        q: 'Güneş paneli için kaç mm² kablo kullanmalıyım?',
        a: 'Kesit, hattan geçecek akıma ve kablo uzunluğuna göre belirlenir; panel dizilerinde 4 mm² ve 6 mm² en yaygın kesitlerdir. Uzun hatlarda gerilim düşümünü %1–3 aralığında tutacak şekilde daha kalın kablo seçilir.',
      },
      {
        q: 'AC sigorta DC hatta kullanılabilir mi?',
        a: 'Kullanılmamalıdır. DC akım AC gibi her döngüde sıfırdan geçmediği için ark söndürmek daha zordur; DC hatlarda DC voltaj ve akım için derecelendirilmiş sigorta ve şalter kullanılmalıdır.',
      },
      {
        q: 'Sistemimi uzaktan nasıl izleyebilirim?',
        a: 'Kullandığınız inverter ve şarj kontrol cihazlarıyla uyumlu bir izleme cihazı (örneğin GX cihazı veya üreticinin Wi-Fi/Bluetooth modülü) ile üretim, akü ve tüketim verilerini telefondan takip edebilirsiniz.',
      },
    ],
  },
}
