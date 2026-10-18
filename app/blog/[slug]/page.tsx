import React from 'react'
import Link from 'next/link'
import { notFound } from 'next/navigation'
import type { Metadata } from 'next'
import { ArrowLeft, Clock, Tag, ArrowRight } from 'lucide-react'

const BLOG_CONTENT: Record<string, {
  title: string
  category: string
  categorySlug: string
  readTime: string
  date: string
  desc: string
  content: string
}> = {
  'ev-sarj-istasyonu-secimi': {
    title: 'Ev için EV Şarj İstasyonu Nasıl Seçilir?',
    category: 'EV Şarj',
    categorySlug: 'ev-sarj',
    readTime: '6 dk',
    date: '12 Nisan 2025',
    desc: 'AC ve DC şarj farkları, güç seviyeleri ve ev elektrik altyapısına uygunluk rehberi.',
    content: `
Elektrikli araç sahibi olduktan sonra akla gelen ilk soru genellikle şu oluyor: "Evde nasıl şarj edebilirim?" Benzin istasyonuna olan bağımlılık sona erdiğinde, onun yerini dolduracak bir çözüme ihtiyaç duyuyorsunuz. Doğru şarj istasyonu seçimi hem günlük konforunuzu hem de uzun vadeli tasarrufunuzu doğrudan etkiliyor.

**AC mi, DC mi — aradaki gerçek fark**

Ev şarj istasyonları iki ana kategoride incelenir. AC (alternatif akım) şarj istasyonları şebeke elektriğini doğrudan aracın dahili dönüştürücüsüne ileterek sessiz ve ekonomik biçimde çalışır; ev kullanımı için biçilmiş kaftandır. DC (doğru akım) istasyonları ise dönüştürme işlemini kendi bünyesinde yaparak bataryaya doğrudan akım verir. 50 kW ile 350 kW arasındaki güç seviyeleriyle ticari hızlı şarj istasyonlarının dünyasına aittir; ev kurulumu için hem gereksiz hem de orantısız maliyetlidir.

**Hangi güç seviyesi eve uygun?**

Çoğu elektrikli araç sahibi için 7,4 kW'lık tek fazlı şarj istasyonu altın orta yoldur. 230V / 32A ayrı bir sigorta hattıyla çalışır, boş bir bataryayı 6–8 saatte doldurur ve gece şarjı rutinine kolayca uyum sağlar. Sabah uyanıyorsunuz, araç tam dolu. Üç fazlı elektrik bağlantınız varsa 11 kW'a geçmek şarj süresini 3–4 saate indiriyor. Aracınızın dahili şarj ünitesi 22 kW'ı destekliyorsa bu modelle en hızlı ev şarj deneyimini yaşamak mümkün; desteklemiyorsa fazladan ödeme yapmanın bir anlamı kalmıyor.

Kurulum öncesinde ev elektrik altyapısını mutlaka değerlendirin. 7,4 kW için 32A'lik bağımsız bir hat gereklidir. Elektrik panosundan şarj istasyonuna olan kablo mesafesi maliyeti doğrudan etkiler. Topraklamanın yeterliliği ise güvenli şarj için tartışmasız bir zorunluluk.

**Akıllı özellikler uzun vadede fark yaratır**

Modern şarj istasyonları yalnızca şarj etmekle kalmıyor. Gece tarifesi desteği sayesinde gün içi tarifenin çok altındaki birim fiyatlardan yararlanabilirsiniz; yıllık tasarruf kayda değer boyutlara ulaşıyor. WiFi bağlantısı ve mobil uygulama entegrasyonu şarj durumunu uzaktan takip etmenizi, zamanlama ayarlamanızı sağlıyor. Dış mekân kurulumlarında IP54 veya üzeri suya dayanıklılık derecesi tercih edilmeli; kablolu modeller her gün takıp çıkarma zahmeti olmadan daha pratik bir kullanım sunuyor.

Geleceğe yönelik bir seçim yapmak isteyenler için OCPP protokolü desteği önemli bir ayrıntı. Bu standart, şarj istasyonunuzun ilerleyen dönemde akıllı ev otomasyon sistemlerine veya farklı yönetim platformlarına entegre edilmesine kapı aralıyor.

- Tek fazlı, 7,4 kW: En yaygın ve pratik seçenek
- Üç fazlı, 11 kW: Günlük uzun mesafe sürücüleri için
- 22 kW: Aracın desteklemesi şart, yoksa avantajsız
- IP54+: Dış mekân kurulumunda vazgeçilmez
- OCPP desteği: Uzun vadeli yatırım güvencesi

Sonuç olarak çoğu kullanıcı için 7,4 kW AC şarj istasyonu en dengeli tercih olmaya devam ediyor: makul maliyet, basit kurulum ve günlük kullanım için fazlasıyla yeterli hız.
    `,
  },
  'gunes-paneli-verimlilik': {
    title: 'Güneş Paneli Verimi Nasıl Hesaplanır?',
    category: 'Güneş Enerjisi',
    categorySlug: 'gunes-enerjisi',
    readTime: '8 dk',
    date: '5 Nisan 2025',
    desc: 'Panel gücü, yıllık üretim tahmini ve yatırım geri dönüş süresi. Monokristal ve polikristal panel farkları.',
    content: `
Güneş paneli yatırımı yapmadan önce "bu sistem gerçekten ne kadar üretir, ne zaman kendini amorti eder?" sorusuna net bir yanıt almak gerekiyor. Doğru hesaplama hem fazla kapasiteye para harcamanızı hem de yetersiz sisteme razı olmanızı önler.

**Verim değerleri ne anlama geliyor?**

Panel kataloglarında gördüğünüz verim yüzdesi, standart test koşullarında ölçülür: 1000 W/m² güneş ışınımı, 25°C ortam sıcaklığı. Günümüz monokristal panelleri %19–23 verim sunarken bifacial (çift taraflı) modeller bu sınırı %25'e kadar zorlayabiliyor. Bu rakam ne kadar yükseğe çıkarsa, aynı çatı alanından o kadar fazla elektrik üretebilirsiniz.

**Yıllık üretim hesabı**

Türkiye güneş enerjisi açısından son derece avantajlı bir konumda. Günlük zirve güneş saati Karadeniz kıyılarında 3,5–4 saat iken Akdeniz ve Ege bölgelerinde 5,5–6,5 saate çıkıyor. Hesap şu formüle dayanıyor: Panel Gücü (kWp) × Günlük Güneş Saati × 365 × 0,85 sistem verimi = Yıllık Üretim (kWh). Ankara'da 10 kWp'lik bir sistem yıllık yaklaşık 15.000 kWh üretiyor; bu, üç haneli bir apartmanın toplam tüketimini karşılamaya yeterli.

| Özellik | Monokristal | Polikristal |
|---------|-------------|-------------|
| Verim | %19–23 | %15–18 |
| Sıcaklık dayanımı | İyi | Orta |
| Çatı alanı verimliliği | Yüksek | Orta |
| Ömür | 25–30 yıl | 20–25 yıl |

Çatı alanınız kısıtlıysa monokristal açık ara öne çıkıyor. Geniş arazilerde polikristal başlangıç maliyetini düşürüyor; ancak uzun vadede monokristalın daha iyi sıcaklık katsayısı ve ömrü hesabı değiştiriyor.

**Verimi düşüren faktörler ve önlemleri**

Türkiye için ideal panel eğimi 30–35° ve güneye yönelim temel koşullar. Gölgelenme en kritik düşman: tek bir hücrenin bile gölge alması tüm paneli etkiliyor; bu nedenle baca, komşu bina ve ağaç mesafesi kurulum öncesinde hassasiyetle değerlendirilmeli. Sıcaklık her 1°C artışta verimi yaklaşık %0,4 oranında düşürüyor — havalandırmalı montaj bu kaybı minimize ediyor. Yılda bir iki kez yapılan panel temizliği ise üretimi %5–10 artırabiliyor.

**Yatırımın geri dönüş hesabı**

2025 itibarıyla 10 kWp'lik bir sistem 180.000–250.000 TL aralığında kuruluyor. Yıllık 35.000–50.000 TL elektrik tasarrufu ile geri dönüş süresi 4–7 yıl arasında gerçekleşiyor. Panelin 25–30 yıllık ekonomik ömrü düşünüldüğünde geri kalan 18–25 yıl tamamen net kâr. Enflasyon ortamında elektrik fiyatlarının artış eğilimi bu hesabı daha da lehte etkiliyor.

Sonuç olarak güneş paneli yatırımını doğru şekillendirmek için önce tüketiminizi, ardından çatı alanınızı ve bölgenizdeki güneş saatini değerlendirin. Gerisi rakamların kendiliğinden doğrulayacağı bir süreç.
    `,
  },
  'lityum-vs-kursum-asit': {
    title: 'Lityum mu, Kurşun Asit mi? Kapsamlı Akü Karşılaştırması',
    category: 'Batarya',
    categorySlug: 'batarya',
    readTime: '7 dk',
    date: '28 Mart 2025',
    desc: 'Fiyat, ömür, derinlik deşarj ve kullanım senaryolarına göre lityum LiFePO4 ile kurşun asit akü karşılaştırması.',
    content: `
Enerji depolama sistemi kurarken akü seçimi çoğu zaman en kritik —ve en çok ertelenen— karar oluyor. Rafta iki seçenek duruyor: uygun başlangıç fiyatıyla cazip gelen kurşun asit ve ilk bakışta pahalı görünse de uzun vadede hesabı değiştiren lityum LiFePO4. Hangisi gerçekten daha iyi bir yatırım?

**Kullanılabilir kapasite: göründüğünden farklı bir hikâye**

Katalog değerleri yanıltıcı olabiliyor. 100 Ah'lik kurşun asit akü, maksimum %50 deşarj sınırıyla yalnızca 50 Ah kullanılabilir kapasite sunuyor. Bunu geçtiğinizde ömrü hızla kısalıyor. Aynı kapasitedeki LiFePO4'te bu oran %80–90'a çıkıyor. Pratik sonuç: aynı Ah değerinde lityum akü, gerçek kullanımda kurşun aside göre yaklaşık 1,7 kat daha fazla enerji sağlıyor. Satın almadan önce Ah değerine değil, kullanılabilir enerji miktarına bakın.

| Özellik | Lityum LiFePO4 | Kurşun Asit (AGM/GEL) |
|---------|----------------|----------------------|
| Kullanılabilir kapasite | %80–90 | %50 |
| Şarj döngüsü ömrü | 3.000–6.000 | 500–1.000 |
| Ağırlık (100 Ah, 12V) | ~12 kg | ~25 kg |
| Şarj hızı | Yüksek (1C) | Düşük (0,2C) |
| Bakım gerekliliği | Yok | Periyodik |
| Güvenlik | Çok yüksek | Orta |

**10 yıllık maliyet gerçeği**

5 kWh enerji depolama hedefiyle 10 yıllık kullanımı hesapladığınızda tablo netleşiyor. Kurşun asit için ilk kurulum daha ucuz; ancak 10 yılda 2–3 kez değişim gerekiyor ve toplam maliyet 40.000–50.000 TL'ye ulaşıyor. LiFePO4 için ilk maliyet daha yüksek; ancak 6.000 döngü ömrüyle 10 yıl boyunca hiç değişim gerekmiyor ve toplam maliyet kurşun asite benzer, hatta altında kalabiliyor. Buna ağırlık, bakım ve performans avantajlarını eklediğinizde denge belirgin biçimde lityum lehine bozuluyor.

**Güvenlik konusunda net bir fark var**

LiFePO4 kimyası lityum ailesinin en güvenli üyesi. Termal kaçış riski son derece düşük, ateş almıyor. Kurşun asit aküler ise şarj sırasında hidrojen gazı açığa çıkarabiliyor; kapalı alanlarda yeterli havalandırma sağlanmadan kullanılmamalı.

**Hangi durumda hangisi?**

Günlük şarj-deşarj döngüsü yapıyorsanız, ağırlık ve hacim önemliyse —karavan, tekne, off-grid kurulumlarda olduğu gibi— ya da bakımla ilgilenmek istemiyorsanız seçim LiFePO4 yönünde net. Bütçe gerçekten çok kısıtlı ve seyrek kullanım söz konusuysa —tatil evi yedek enerjisi gibi— kurşun asit makul bir geçiş çözümü olarak değerlendirilebilir; ancak bunun bir uzun vadeli tasarruf değil, zorunluluktan kaynaklanan bir tercih olduğu unutulmamalı.

Enerji depolama sistemine yatırım yapanların büyük çoğunluğu için LiFePO4, hem performans hem de toplam sahip olma maliyeti açısından tartışmasız öne çıkıyor.
    `,
  },
  'hibrit-inverter-nedir': {
    title: 'Hibrit İnverter Nedir, Off-Grid ile Farkı Ne?',
    category: 'İnverter',
    categorySlug: 'inverter',
    readTime: '5 dk',
    date: '20 Mart 2025',
    desc: 'Hibrit ve off-grid inverter arasındaki temel farklar, hangi sistemde hangisi kullanılır.',
    content: `
## Hibrit İnverter ve Off-Grid İnverter: Fark Nedir?

Solar sistem kurarken en çok karıştırılan konulardan biri hibrit ve off-grid inverter arasındaki farktır. Bu yazıda iki teknolojiyi açık ve net bir şekilde karşılaştırıyoruz.

## İnverter Nedir?

İnverter, güneş panellerinden gelen DC elektriği ev ve işyerlerinde kullanılan AC elektriğe çeviren cihazdır. Aynı zamanda batarya şarj kontrolü, şebeke yönetimi ve enerji akışı kontrolü gibi görevler de üstlenir.

## Hibrit İnverter Nedir?

Hibrit inverter, hem şebekeye bağlı (on-grid) hem de batarya ile çalışabilen çok yönlü bir cihazdır.

**Çalışma prensibi:**
1. Güneş enerjisi önce ev tüketimine gider
2. Fazla enerji bataryaya depolanır
3. Batarya doluysa şebekeye verilir (net metering)
4. Güneş yoksa veya yetersizse batarya devreye girer
5. Batarya biterse şebekeden çekilir

**Avantajları:**
- Şebeke kesintisinde de çalışır (yedek güç)
- Enerji tasarrufu maksimize edilir
- Net metering ile şebekeye satış yapılabilir
- Akıllı enerji yönetimi

## Off-Grid İnverter Nedir?

Off-grid inverter, tamamen şebekeden bağımsız sistemler için tasarlanmıştır. Batarya ve güneş paneli ile çalışır; şebeke bağlantısı yoktur.

**Avantajları:**
- Şebeke olmayan yerlerde kullanılabilir (çiftlik, dağ evi, karavan)
- Şebeke faturasından tamamen bağımsızlık
- Basit kurulum

**Dezavantajları:**
- Batarya kapasitesi yeterli değilse güç kesintisi yaşanır
- Dizel jeneratör yedek olarak gerekebilir
- Şebekeye fazla enerji satılamaz

## Karşılaştırma Tablosu

| Özellik | Hibrit | Off-Grid |
|---------|--------|----------|
| Şebeke bağlantısı | Var | Yok |
| Batarya | Var | Zorunlu |
| Kesintide çalışma | Evet | Evet |
| Şebekeye satış | Evet | Hayır |
| Şehir kullanımı | İdeal | Uygun değil |
| Uzak bölge | Kısıtlı | İdeal |
| Maliyet | Orta-yüksek | Orta |

## Hangisini Seçmelisiniz?

**Hibrit inverter seçin:**
- Şehirde veya şebeke bağlantılı bir yerde yaşıyorsanız
- Elektrik faturanızı düşürmek istiyorsanız
- Güç kesintilerine karşı yedek enerji istiyorsanız
- Net metering uygulamasından faydalanmak istiyorsanız

**Off-grid inverter seçin:**
- Şebeke bağlantısı olmayan bir yerdeyseniz
- Tamamen bağımsız enerji istiyorsanız
- Karavan, tekne veya yazlık için kuruyorsanız

## Popüler Hibrit İnverter Markalar

Growatt, Deye, Solis, SolarEdge ve Huawei hibrit inverter pazarında öne çıkan markalar arasındadır. Gücü sistemin toplam panel kapasitesine göre seçilmelidir (genellikle 3 kW – 20 kW arası).

## Özet

Şehir hayatında yaşıyorsanız ve hem tasarruf hem güvenlik istiyorsanız **hibrit inverter** doğru seçimdir. Tamamen bağımsız bir sistem istiyorsanız off-grid tercih edin.
    `,
  },
  'ges-nasil-kurulur': {
    title: 'Çatı GES Kurulumu: Baştan Sona Rehber',
    category: 'GES',
    categorySlug: 'ges',
    readTime: '10 dk',
    date: '15 Mart 2025',
    desc: 'İzin süreçleri, teknik gereksinimler, maliyet hesabı ve geri dönüş süresi.',
    content: `
## Çatı GES Kurulumu: Adım Adım Rehber

Güneş enerjisi sistemi (GES) kurmak artık hem bireyler hem de işletmeler için en karlı enerji yatırımlarından biri. Bu rehberde çatı GES kurulumunu baştan sona ele alıyoruz.

## 1. Fizibilite ve Ön Değerlendirme

Kurulum öncesinde şu soruları cevaplamanız gerekir:

**Çatı uygunluğu:**
- Çatı güneye bakıyor mu? (En az güneydoğu–güneybatı)
- Eğim açısı 15–40° arasında mı?
- Gölgelenme var mı? (Baca, komşu bina, ağaç)
- Çatı yapısı taşıma kapasitesine sahip mi? (Panel ağırlığı: 10–12 kg/m²)

**Tüketim analizi:**
- Son 12 aylık elektrik faturanıza bakın
- Yıllık ortalama tüketim (kWh) tespit edin
- Bu değer sistem büyüklüğünü belirler

## 2. Sistem Boyutlandırma

Formül:
**Gerekli kapasite (kWp) = Yıllık tüketim / (Günlük güneş saati × 365 × 0,85)**

**Örnek:** Yıllık 6.000 kWh tüketen İzmir'de bir ev:
6.000 / (5,8 × 365 × 0,85) = **3,3 kWp** sistem yeterli

Uygulamada 5–10 kWp arası bireysel konut sistemleri en yaygın tercihlerdir.

## 3. İzin ve Bürokratik Süreç

### Lisanssız Üretim (≤10 kW bireyler için)
- TEDAŞ'a başvuru
- Elektrik dağıtım şirketine (EDAŞ) bağlantı başvurusu
- Onay süresi: 30–60 gün
- Fazla üretimi şebekeye satabilirsiniz (net metering)

### 10–1000 kW arası sistemler
- Lisanssız üretim kapsamındadır
- Enerji kimlik belgesi gerekebilir
- Belediyeden yapı izni (çatı tipi yapıya göre değişir)

## 4. Ekipman Seçimi

**Güneş paneli:**
- Monokristal, minimum %20 verim
- 25 yıl performans garantisi olan markalar tercih edin
- Yerli veya Avrupa menşeli markalar önerilir

**İnverter:**
- String inverter: Basit ve ekonomik
- Hibrit inverter: Batarya eklemek isteyenler için
- Mikro inverter: Her panel bağımsız, gölgelenme etkisi az

**Montaj sistemi:**
- Çatı tipine uygun (kiremit, trapez, flat çatı)
- Alüminyum profil, paslanmaz çelik vida
- Rüzgar ve kar yüküne dayanıklı

## 5. Kurulum Süreci

1. **Montaj raylarının yerleştirilmesi** (1–2 gün)
2. **Panellerin raylar üzerine montajı** (1–2 gün)
3. **DC kablolama ve kombiner kutusu** (yarım gün)
4. **İnverter montajı ve AC bağlantısı** (yarım gün)
5. **EDAŞ sayaç değişimi** (EDAŞ ekibi gelir, 1–4 hafta beklenebilir)
6. **Devreye alma ve test** (birkaç saat)

## 6. Maliyet ve Geri Dönüş

**Ortalama maliyetler (2025):**
- 5 kWp sistem: 90.000 – 130.000 TL
- 10 kWp sistem: 170.000 – 240.000 TL

**Geri dönüş süresi:**
- Yıllık tasarruf: 25.000 – 60.000 TL (sisteme ve bölgeye göre)
- Geri dönüş: 4 – 7 yıl
- Sistem ömrü: 25–30 yıl → 18–25 yıl net kâr

## 7. Bakım

GES sistemleri oldukça düşük bakım gerektirir:
- **Yılda 1–2 kez panel temizliği** (yağmurlu bölgelerde yağmur yeterli olabilir)
- **Yılda 1 kez inverter kontrolü**
- **İzleme sistemi:** Üretim verilerini akıllı telefona anlık takip edin

## Özet

Çatı GES kurulumu için adımlar: fizibilite → boyutlandırma → izin → ekipman → kurulum → devreye alma. Doğru yapıldığında 4–7 yıl içinde kendini amorti eden, 25 yıl boyunca değer üreten bir yatırımdır.
    `,
  },
  'karavan-enerji-paketi': {
    title: 'Karavan İçin En İyi Enerji Paketi Nasıl Seçilir?',
    category: 'Batarya',
    categorySlug: 'batarya',
    readTime: '6 dk',
    date: '8 Mart 2025',
    desc: 'Karavan tüketim hesabı, taşınabilir güç istasyonu seçimi ve katlanabilir panel alternatifleri.',
    content: `
## Karavan Enerji Paketi Rehberi

Karavan yaşamının en büyük zorluklarından biri yeterli enerji sağlamaktır. Doğru enerji paketini seçmek hem konforunuzu artırır hem de bütçenizi korur. Bu rehberde karavan için enerji sistemi seçimini adım adım anlatıyoruz.

## 1. Tüketim Hesabı

Önce ihtiyacınızı belirleyin. Karavanda tipik cihazlar ve tüketimleri:

| Cihaz | Güç | Günlük kullanım | Günlük tüketim |
|-------|-----|-----------------|----------------|
| LED aydınlatma (5 adet) | 25W | 4 saat | 100 Wh |
| Buzdolabı (12V) | 50W | 24 saat | 600 Wh |
| Telefon şarjı (2 adet) | 20W | 3 saat | 60 Wh |
| Laptop | 65W | 3 saat | 195 Wh |
| Fan | 30W | 6 saat | 180 Wh |
| **Toplam** | | | **~1.135 Wh/gün** |

Bu hesap, yaklaşık **1,5 kWh/gün** tüketimi gösteriyor. Güvenlik marjı için %30 ekleyin: **~2 kWh** kapasiteli bir sistem hedefleyin.

## 2. Batarya Seçimi

**Lityum LiFePO4 (Tavsiye edilen):**
- %80 deşarj edilebilir → 100 Ah = 80 Ah kullanılabilir
- Hafif (~12 kg / 100 Ah)
- 3.000+ döngü ömrü
- Hızlı şarj

**Kurşun Asit (AGM/GEL):**
- %50 deşarj sınırı → 100 Ah = 50 Ah kullanılabilir
- Ağır (~25 kg / 100 Ah)
- Düşük ilk maliyet

Yukarıdaki örnek için **100 Ah LiFePO4** batarya (12V) yeterlidir. Daha rahat olmak için 200 Ah tercih edebilirsiniz.

## 3. Güneş Paneli Seçimi

Karavan için iki seçenek var:

**Çatıya sabit panel:**
- 100W – 400W
- Her zaman şarj eder
- Aracı park etme esnekliğini kısıtlayabilir
- Düz çatıya monte edilir

**Katlanabilir taşınabilir panel:**
- 100W – 200W (tek parça)
- Gölgesiz, optimum açıda konumlandırılabilir
- Karavan hareket ederken sökülebilir
- Birden fazla uygulamada kullanılabilir

**Yeterli panel kapasitesi:**
2 kWh/gün tüketim için ortalama 5 saatlik güneşte:
2.000 Wh / 5 saat / 0,85 = **~470 W panel**

Pratikte 2 × 200W panel veya 1 × 400W panel yeterlidir.

## 4. Şarj Kontrol Cihazı (MPPT)

Güneş panelinden bataryaya giden enerjiyi düzenler.

- **PWM:** Uygun fiyatlı, küçük sistemler için
- **MPPT:** Daha verimli (%30'a kadar), büyük sistemler için tavsiye edilir

20A – 40A kapasiteli bir MPPT şarj kontrol cihazı karavan için yeterlidir.

## 5. Taşınabilir Güç İstasyonu Alternatifi

Karmaşık kurulum istemeyenler için hepsi bir arada çözüm: **taşınabilir güç istasyonları.**

- 500 Wh – 3.000 Wh kapasite
- AC çıkış (ev prizi gibi)
- USB, DC çıkışlar
- Güneş paneli ile şarj edilebilir
- Plug & play, kurulum yok

Hafta sonu karavancıları ve kampçılar için ideal.

## 6. İnverter

12V/24V DC'yi 220V AC'ye çevirir. Dizüstü bilgisayar, küçük elektrikli cihazlar için gereklidir.

- Saf sinüs dalga inverter tercih edin (hassas elektronikler için)
- Kapasitesi: En büyük cihazınızın 1,5 katı olsun
- 300W – 1.000W karavan için yeterli

## Hazır Paket Önerisi

**Başlangıç paketi (hafta sonu kullanım):**
- 200 Ah LiFePO4 batarya
- 2 × 200W katlanabilir panel
- 40A MPPT şarj kontrol
- 500W saf sinüs inverter

**Konforlu uzun yol paketi:**
- 300 Ah LiFePO4 batarya
- 400W çatı paneli + 200W taşınabilir
- 60A MPPT şarj kontrol
- 1.000W saf sinüs inverter

## Özet

Karavan enerji sisteminde doğru sıra: tüketim hesapla → batarya kapasitesi belirle → panel büyüklüğünü hesapla → MPPT ve inverter seç. Lityum batarya başlangıç maliyeti yüksek olsa da ağırlık ve ömür avantajıyla karavan kullanımı için açık ara en iyi seçimdir.
    `,
  },
}

function renderContent(content: string) {
  const lines = content.trim().split('\n')
  const elements: React.ReactNode[] = []
  let i = 0

  while (i < lines.length) {
    const line = lines[i].trim()

    if (!line) { i++; continue }

    if (line.startsWith('## ')) {
      elements.push(
        <h2 key={i} className="text-xl sm:text-2xl font-extrabold text-slate-900 mt-10 mb-4 leading-snug">
          {line.replace('## ', '')}
        </h2>
      )
    } else if (line.startsWith('**') && line.endsWith('**')) {
      elements.push(
        <p key={i} className="font-bold text-slate-800 mt-5 mb-1">
          {line.replace(/\*\*/g, '')}
        </p>
      )
    } else if (line.startsWith('- ')) {
      const listItems: string[] = []
      while (i < lines.length && lines[i].trim().startsWith('- ')) {
        listItems.push(lines[i].trim().replace('- ', ''))
        i++
      }
      elements.push(
        <ul key={`ul-${i}`} className="list-disc list-inside space-y-1.5 text-slate-600 text-sm sm:text-base my-3 pl-2">
          {listItems.map((item, j) => (
            <li key={j} dangerouslySetInnerHTML={{ __html: item.replace(/\*\*(.*?)\*\*/g, '<strong>$1</strong>') }} />
          ))}
        </ul>
      )
      continue
    } else if (/^\d+\./.test(line)) {
      const listItems: string[] = []
      while (i < lines.length && /^\d+\./.test(lines[i].trim())) {
        listItems.push(lines[i].trim().replace(/^\d+\.\s*/, ''))
        i++
      }
      elements.push(
        <ol key={`ol-${i}`} className="list-decimal list-inside space-y-1.5 text-slate-600 text-sm sm:text-base my-3 pl-2">
          {listItems.map((item, j) => (
            <li key={j} dangerouslySetInnerHTML={{ __html: item.replace(/\*\*(.*?)\*\*/g, '<strong>$1</strong>') }} />
          ))}
        </ol>
      )
      continue
    } else if (line.startsWith('|')) {
      const tableLines: string[] = []
      while (i < lines.length && lines[i].trim().startsWith('|')) {
        tableLines.push(lines[i].trim())
        i++
      }
      const headers = tableLines[0].split('|').filter(Boolean).map(h => h.trim())
      const rows = tableLines.slice(2).map(row => row.split('|').filter(Boolean).map(c => c.trim()))
      elements.push(
        <div key={`table-${i}`} className="overflow-x-auto my-6 rounded-xl border border-slate-200">
          <table className="w-full text-sm">
            <thead>
              <tr className="bg-slate-50 border-b border-slate-200">
                {headers.map((h, j) => (
                  <th key={j} className="text-left px-4 py-3 font-bold text-slate-700 whitespace-nowrap">{h}</th>
                ))}
              </tr>
            </thead>
            <tbody>
              {rows.map((row, j) => (
                <tr key={j} className="border-b border-slate-100 last:border-0 hover:bg-slate-50/50">
                  {row.map((cell, k) => (
                    <td key={k} className="px-4 py-3 text-slate-600" dangerouslySetInnerHTML={{ __html: cell.replace(/\*\*(.*?)\*\*/g, '<strong>$1</strong>') }} />
                  ))}
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )
      continue
    } else {
      elements.push(
        <p key={i} className="text-slate-600 text-sm sm:text-base leading-relaxed my-3"
          dangerouslySetInnerHTML={{ __html: line.replace(/\*\*(.*?)\*\*/g, '<strong>$1</strong>') }}
        />
      )
    }
    i++
  }

  return elements
}

export async function generateStaticParams() {
  return Object.keys(BLOG_CONTENT).map((slug) => ({ slug }))
}

export async function generateMetadata(props: { params: Promise<{ slug: string }> }): Promise<Metadata> {
  const params = await props.params;
  const post = BLOG_CONTENT[params.slug]
  if (!post) return { title: 'Yazı Bulunamadı' }
  return {
    title: `${post.title} | Voltekno Blog`,
    description: post.desc,
  }
}

export default async function BlogPostPage(props: { params: Promise<{ slug: string }> }) {
  const params = await props.params;
  const post = BLOG_CONTENT[params.slug]
  if (!post) notFound()

  const otherPosts = Object.entries(BLOG_CONTENT)
    .filter(([slug]) => slug !== params.slug)
    .slice(0, 3)

  return (
    <div className="min-h-full bg-white">
      {/* Hero */}
      <div className="bg-slate-950 pt-12 pb-14 px-4 mt-5 lg:mt-7">
        <div className="container mx-auto max-w-3xl">
          <Link
            href="/blog"
            className="inline-flex items-center gap-1.5 text-slate-400 hover:text-white text-sm mb-8 transition-colors"
          >
            <ArrowLeft className="w-4 h-4" /> Blog
          </Link>
          <div className="flex items-center gap-3 mb-5">
            <span className="text-xs font-bold uppercase tracking-widest bg-brand/20 text-brand rounded-lg px-3 py-1.5">
              {post.category}
            </span>
            <span className="flex items-center gap-1 text-xs text-slate-500">
              <Clock className="w-3.5 h-3.5" /> {post.readTime} okuma
            </span>
            <span className="text-xs text-slate-600">{post.date}</span>
          </div>
          <h1 className="text-2xl sm:text-3xl md:text-4xl font-extrabold text-white leading-tight mb-4">
            {post.title}
          </h1>
          <p className="text-slate-400 text-base leading-relaxed max-w-2xl">
            {post.desc}
          </p>
        </div>
      </div>

      {/* Content */}
      <div className="py-12 px-4">
        <div className="container mx-auto max-w-3xl">
          <article className="prose-custom">
            {renderContent(post.content)}
          </article>

          {/* CTA */}
          <div className="mt-14 rounded-2xl border border-brand/20 bg-brand/5 p-8 text-center">
            <h3 className="text-xl font-extrabold text-slate-900 mb-2">
              Bu konuda ürün arıyor musunuz?
            </h3>
            <p className="text-slate-500 text-sm mb-5">
              Voltekno'da 340+ ürün stokta. Hızlı teslimat, 2 yıl garanti.
            </p>
            <div className="flex flex-col sm:flex-row gap-3 justify-center">
              <Link
                href="/products"
                className="inline-flex items-center justify-center gap-2 rounded-xl bg-brand hover:bg-brand-hover text-white font-bold px-6 py-3 text-sm transition-colors"
              >
                Ürünleri İncele <ArrowRight className="w-4 h-4" />
              </Link>
              <Link
                href="/ges"
                className="inline-flex items-center justify-center gap-2 rounded-xl border border-slate-300 bg-white hover:bg-slate-50 text-slate-700 font-bold px-6 py-3 text-sm transition-colors"
              >
                Teklif Al
              </Link>
            </div>
          </div>

          {/* Other posts */}
          {otherPosts.length > 0 && (
            <div className="mt-14">
              <h3 className="text-lg font-extrabold text-slate-900 mb-5">Diğer Yazılar</h3>
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                {otherPosts.map(([slug, p]) => (
                  <Link
                    key={slug}
                    href={`/blog/${slug}`}
                    className="group block rounded-xl border border-slate-200 p-4 hover:border-brand/40 hover:shadow-md transition-all"
                  >
                    <span className="text-[10px] font-bold uppercase tracking-widest text-brand mb-2 block">{p.category}</span>
                    <h4 className="text-sm font-bold text-slate-800 group-hover:text-brand transition-colors line-clamp-2 leading-snug mb-1">
                      {p.title}
                    </h4>
                    <span className="flex items-center gap-1 text-[11px] text-slate-400">
                      <Clock className="w-3 h-3" /> {p.readTime}
                    </span>
                  </Link>
                ))}
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  )
}
