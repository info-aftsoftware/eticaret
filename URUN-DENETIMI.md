# Ürün Denetimi: Ad, Görsel, Açıklama ve Kategori Tutarlılığı

**Tarih:** 18 Ekim 2026
**Kapsam:** `lib/catalog/products.json` içindeki 340 ürün kaydı (322 varyant dahil, toplam ~560 SKU), `descriptions.json`, `product-details.json` ve `public/images/products/` altındaki görseller.

## Verinin nasıl birleştiği

1. Kaynak, ikas dışa aktarım Excel'i: `~/Downloads/voltekno_ikas_nihai.xlsx`. Bu dosya içe aktarımla yeniden üretilip `descriptions.json` ile birebir karşılaştırıldı.
2. `scripts/import-ikas-excel.py` üç dosya üretir: `products.json` (hafif katalog), `product-details.json` (teknik tablo ve döviz fiyatı) ve `descriptions.json` (HTML açıklama).
3. `scripts/data/image-overrides.json` Excel'deki yanlış görselleri `public/images/products/override/` altındaki doğru görsellerle değiştirir.
4. **Yeni:** `scripts/data/catalog-fixes.json` Excel açıklamasındaki kesin metin hatalarını her içe aktarımda düzeltir.
5. Çalışma anında `lib/catalog-merge.ts`, Prisma'daki `ProductOverride` ve `StockOverride` kayıtlarını üstüne uygular. **Yerel veritabanında (`dev.db`) override kaydı 0.** Canlı veritabanı kontrol edilemedi, aşağıdaki "Teyit" bölümüne bakın.

## Nasıl denetlendi

**Metin (340 ürünün tamamı, betikle):**
- Ad, varyant etiketi, açıklama ve teknik tablo karşılaştırıldı: Wp/W/kW/kWh/Ah/V/A değerleri, birim dönüşümü dahil.
- Model kodu ve SKU karşılaştırıldı.
- Açıklamada başka marka adı geçip geçmediğine bakıldı. Yalnızca TommaTech'in üreticisi olan "CW Enerji" çıktı, bu doğru.
- Açıklama başlığı (h2) ile ürün adı, kısa açıklama ve SEO başlığındaki sayısal değerler karşılaştırıldı.
- Birebir aynı açıklamalar, aynı teknik tablolar ve ürünler arasında paylaşılan paragraflar arandı.
- SSS bloklarının hangi kategorilerde kullanıldığına bakıldı.
- Kategori ile ürün adı eşleşmesi kategori bazında tek tek okundu.

**Görsel (tamamı, gözle):**
- 539 ana ve varyant görseli ile 354 ek galeri görseli etiketli temas sayfalarına dökülüp tek tek incelendi.
- Etiket okunabilen görsellerde (akü, şarj cihazı, inverter, MPPT) şüpheli olanlar büyütülüp model, güç ve gerilim etiketi okundu.
- Filigranlı veya 500 px altı görsel bulunmadı (önceki denetimden bilinen ve not edilmiş Havensis MiniSolar-3AMPS hariç).

**Genel sonuç:** Açıklamalarda ad ile watt, Ah, voltaj, kW veya model çelişkisi çıkmadı. Başka ürünün açıklamasının tamamen kopyalandığı bir kayıt da yok. Seri içindeki ortak paragraflar her ürünün kendi değerleriyle uyarlanmış. Hatalar SSS şablonunda ve bazı varyant görsellerinde toplanıyor.

## 1. Düzeltilen kesin hatalar

| SKU | Ürün | Sorun | Yapılan düzeltme |
|---|---|---|---|
| VICTRO-CEP122160000-01406 | Victron EasyPlus C 12/1600/70-16 İnverter/Şarj Cihazı | SSS akıllı inverter şablonundan kopyalanmış: "MPPT şarj kontrol cihazını birleştirir", "Kaç watt güneş paneli bağlanabilir? … maksimum PV dizi gücü". Cihazda PV girişi ve MPPT yok. | İki SSS maddesi yeniden yazıldı: "İnverter/şarj cihazı ne işe yarar?" (dahili solar şarj yok) ve "Güneş paneli doğrudan bağlanabilir mi? Hayır, ayrı MPPT gerekir". |
| VICTRO-PMP482305102-01465 | Victron MultiPlus-II 48/3000/35-50 (120V) | Aynı kopya SSS: MPPT ve PV girişi varmış gibi anlatıyor. | Aynı düzeltme yapıldı. Panel, ayrı MPPT veya ESS'de AC tarafı şebeke inverteri ile eklenir. |
| TOMMAT-OFGTT01NEW1K12MF-00231 | TommaTech New 1K 12V 1000W Akıllı İnverter | Teknik tablo ve kısa açıklama "Solar şarj tipi: PWM", SSS ise "MPPT şarj kontrol cihazı" diyor. | SSS metni "solar şarj kontrol cihazı (bu modelde PWM)" yapıldı. |
| TOMMAT-OFGTT03NEW3K24MF-00233 | TommaTech New 3K 24V 3000W Akıllı İnverter | Aynı PWM/MPPT çelişkisi. | Aynı düzeltme. |
| TOMMAT-OFGTT05NEW5K48MF-00234 | TommaTech New 5K 48V 5000W Akıllı İnverter | Aynı PWM/MPPT çelişkisi. | Aynı düzeltme. |
| TOMMAT-BTRPMRN1256V200AH-00103 | TommaTech Marine MRN1 25,6V 200Ah (varyant) | Görsel etiketi **BTR-MRN3-12.8V-200AH**: seri, gerilim ve enerji yanlış. | Birebir etiketli **BTR-MRN1-25.6V-200AH** görselleri kullanıldı. Bunlar Excel'de yanlışlıkla 12,8V satırına bağlıydı. |
| TOMMAT-BTRPMRN3256V100AH-00102 | TommaTech Marine MRN3 25,6V 100Ah (varyant) | Görsel etiketi **BTR-MRN3-12.8V-200AH**: gerilim ve kapasite yanlış. | Aynı kasalı, değerleri doğru **BTR-MRN1-25.6V-100AH** görseli kullanıldı. Etikette seri MRN1 yazıyor, teyit bölümüne bakın. |
| TOMMAT-SPITT220TF-00303 | TommaTech SPI 220 kW Solar Pompa Sürücüsü | Görsel küçük (≤5,5 kW sınıfı) duvar tipi kasa. | Aynı serinin 250 kW kabin görseli kullanıldı. |
| TOMMAT-SPITT243550TF-00306 | SPI 355 kW | Görsel 7,5–15 kW sınıfı duvar tipi kasa. | 250 kW kabin görseli. |
| TOMMAT-SPITT244000TF-00307 | SPI 400 kW | Görsel ≤5,5 kW sınıfı küçük kasa. | 250 kW kabin görseli. |
| TOMMAT-SPITT243150TF-00305 | SPI 315 kW | Görsel 18,5–110 kW sınıfı duvar tipi kasa. | 250 kW kabin görseli. |
| TOMMAT-SPITT244500TF-00308 | SPI 450 kW | Görsel 18,5–110 kW sınıfı duvar tipi kasa. | 250 kW kabin görseli. |
| TOMMAT-SPITT245000TF-00309 | SPI 500 kW | Görsel 18,5–110 kW sınıfı duvar tipi kasa. | 250 kW kabin görseli. |
| TOMMAT-SPITT246300TF-00310 | SPI 630 kW | Görsel 18,5–110 kW sınıfı duvar tipi kasa. | 250 kW kabin görseli. |
| VICTRO-PIN241251200-01313 | Victron Phoenix 24/250 VE.Direct Schuko | Ana görselde "phoenix **12** \| 250" yazıyordu. | Kullanıcı onayıyla victronenergy.com'dan indirilen resmi "Inverter 24V 250VA VE.direct 230V" görseli (etiket "24 \| 250") kullanıldı. 2. görsel Excel'deki etiketsiz arka panel. |
| VICTRO-PPP012020000-02117 | Victron Peak Power Pack 20Ah 256Wh (varsayılan varyant) | Görsel "40Ah \| 512Wh" etiketliydi (üç varyant ortak). | Resmi "PPP-12.8V-20Ah-256Wh" görselleri (sol açı, üst) indirildi. |
| VICTRO-PPP012030000-02118 | Victron Peak Power Pack 30Ah 384Wh | Görsel "40Ah \| 512Wh" etiketliydi. | Resmi "PPP 12.8V 30Ah 384Wh" görselleri (sol açı, ön, üst) indirildi. |

**Değişen dosyalar:**
- `lib/catalog/descriptions.json`: 5 ürün.
- `lib/catalog/products.json`: 12 ürün/varyant galerisi.
- `scripts/data/image-overrides.json`: 2 kayıt güncellendi, 10 kayıt eklendi.
- `scripts/data/catalog-fixes.json`: yeni dosya.
- `scripts/import-ikas-excel.py`: `apply_description_fixes` fonksiyonu eklendi.
- `public/images/products/override/`: 12 yeni görsel.
  - 5 tanesi repodaki Excel görsellerinden üretildi.
  - 7 tanesi Victron'un resmi sitesinden (victronenergy.com/upload/documents) kullanıcı onayıyla indirildi ve `scripts/prepare-override-image.mjs` ile 1000×1000 WebP'ye çevrildi.

Düzeltmeler kalıcı: aynı Excel ile yeniden içe aktarım yapıldığında 340 ürünün açıklamasının tamamı `descriptions.json` ile birebir aynı çıkıyor (betikle doğrulandı).

**Dev sunucusunda doğrulama:** "Next.js Dev 3005" yapılandırması kullanıldı; 3005 dolu olduğu için sunucu 3006'da açıldı. Kontrol edilenler:
- MRN1 sayfasında 25,6V 200Ah varyantı seçilince yeni iki görsel yükleniyor.
- MRN3 sayfasında 25,6V 100Ah varyantı seçilince yeni görseller yükleniyor.
- SPI sayfasında 630 kW varyantı (stok kodu TOMMAT-SPITT246300TF-00310) kabin görselini gösteriyor.
- Victron EasyPlus C, MultiPlus-II ve TommaTech New 1K sayfalarında yeni SSS metni var, eski metin yok.
- Victron Peak Power Pack ve Phoenix 24/250 sayfalarının sunucu çıktısında yeni görseller var, eski "12 | 250" görseli yok. Yeni 7 dosyanın tamamı HTTP 200 ile servis ediliyor.
- Birim testleri: 52/52 geçti.

**Önerilen ikas düzeltmesi:** Aynı metin hataları ikas'taki ürün açıklamalarında da duruyor. Kalıcı çözüm, oradaki açıklamaları da aynı şekilde düzeltmek. O zaman `catalog-fixes.json` kayıtları uyarı vermeden atlanır ve silinebilir.

## 2. Doğru görseli bulunamayan ürünler

Victron Phoenix 24/250 ile Peak Power Pack 20/30Ah, onayınızla üretici sitesinden indirilen görsellerle düzeltildi (bölüm 1). Aşağıdakiler için birebir görsel yok.

| SKU | Ürün | Sorun | Öneri |
|---|---|---|---|
| APEX-00510 | Apex APX2440 24V **40A** Akü Şarj Cihazı | Tek görsel etiketi "SMART BATTERY CHARGER **24V-20A** / APX2420", yani başka bir varyant. Apex distribütörü Electrozirve'nin kendi [APX2440 sayfası](https://electrozirve.com/urun/apx2440-apex-24v-40a-smart-aku-sarj-cihazi/) da aynı APX2420 fotoğrafını kullanıyor. Erişilebilen bayi sayfalarında da doğru görsel bulunamadı. | Mevcut görsel bırakıldı; etiket değiştirilerek görsel üretilmedi (yanıltıcı olur). Electrozirve'den gerçek APX2440 fotoğrafı istenmeli. |
| TOMMAT-BTRPMRN1128V200AH-00099 | TommaTech Marine **MRN1** 12,8V 200Ah | Tüm görsellerin etiketi BTR-**MRN3**-12.8V-200AH. Değerler doğru, seri farklı; üretici sayfası da aynı görseli kullanıyor. | Birebir MRN1 görseli bulunursa değiştirilmeli. |
| TOMMAT-BTRPMRN3256V100AH-00102 | TommaTech Marine **MRN3** 25,6V 100Ah | Artık MRN1-25.6V-100AH görseli gösteriliyor. Değerler doğru, seri etiketi MRN1. | Birebir MRN3 25,6V 100Ah görseli bulunursa değiştirilmeli. |
| TOMMAT-SPITT220TF-00303, 00305–00310 | TommaTech SPI 220–630 kW | Aynı serinin 250 kW kabin görseli kullanılıyor (aile görseli). | Model bazında görsel varsa CW Enerji'den alınabilir. |

## 3. Teyit gereken maddeler

| SKU | Ürün | Gözlem | Neden kesin değil |
|---|---|---|---|
| HAVENS-00620 | Havensis HV MPS Serisi **Solar-80AMPS 45A** 60/72V (200V PV) | Model adı 80A, akım 45A. Teknik tablosu HAVENS-00621 (Solar-45AMPS 45A) ile birebir aynı ve fiyatı daha düşük (443,52 vs 476,78 USD). | Excel'de de böyle yazıyor, üretici kaynağında HV modeli bulunamadı. Muhtemelen model adı veya akım hatalı; tedarikçiye sorulmalı. |
| TOMMAT-OFGTT01NEW1K12MF-00231, 00233, 00234 | TommaTech New 1K/3K/5K (PWM) | Kategori "Tam Sinüs **MPPT** Akıllı İnverter", ama bu modeller PWM. | Daha uygun bir kategori yok ("Şarjlı Tam Sinüs" UPS tipi). Öneri: kategori adı "Tam Sinüs Akıllı İnverter" yapılabilir. |
| VICTRO-ASS000100000-01874 | Victron BMV-702/712 İçin Sıcaklık Sensörü | "İzleme ve Kontrol" kategorisinde; akü monitörü aksesuarı olduğu için "Batarya Yönetimi ve Aksesuar" daha uygun olabilir. | İki kategori de savunulabilir. |
| İSTABR-00650 | İstabreeze 850W 12/24/48V Rüzgar-Güneş Hibrit Şarj Kontrol | 2. galeri görselinin etiketi "850W … **48V**". Ana görsel etiketsiz. | Ürün tek SKU ve üç gerilimi kapsıyor; 48V etiketi tek modeli gösteriyor olabilir. |
| VICTRO-PMP482305102-01465, VICTRO-BPC240815106-01536 | MultiPlus-II 120V UL1741, Blue Smart 24/8 120V | ABD (120V) modelleri. Açıklamada "Türkiye'de doğrudan kullanıma uygun değil" uyarısı var. | Ad ile açıklama tutarlı; satışta tutulup tutulmayacağı ticari karar. |
| (canlı veritabanı) | `ProductOverride` | Yerel `dev.db`'de override yok. | Canlı veritabanında admin panelinden girilmiş ad, görsel veya açıklama override'ı varsa bu düzeltmeleri ezebilir. Canlıda da kontrol edilmeli. |

## 4. Küçük biçim notları (hata değil)

- Bazı varyant etiketleri kendini tekrarlıyor: "3000 3 kW Rüzgar Türbini" (Altech Nova), "300 300W 12V Tam Sinüs İnverter" (NP Power), "1000 1000W Tam Sinüs İnverter" (Electrozirve IC). Excel'deki "Varyant Değer" ile ad birleşiyor.
- Bazı varyant etiketleri tek başına anlamsız: "(150V PV)" ve "(200V PV)" (HAVENS-00618), "1,8 m" ve "5 m" (Victron RS485-USB), "(15 kg Taşıma Kapasiteli)" (İstabreeze direk uzatma). Ürün adıyla birlikte gösterildiğinde anlaşılır.
- HAVENS-00618 ürün adı kesik görünüyor: "… MPPT Şarj Kontrol" ("Cihazı" yok).
- Deye 5–12 kW, 40/50 kW ve 60/80 kW; Exelon PMAX-11P/12P; Electrozirve MC-4860N25/48100N25; Frecon 315–450 kW: aynı kasayı paylaşan ve üzerinde güç etiketi olmayan resmi seri görselleri. Uyumlu, değişiklik gerekmiyor.
- Şu dosyalar artık hiçbir üründe kullanılmıyor, silinebilir: `override/tommatech-tommat-btrpmrn1256v200ah-00103-{1,2}.webp` ve `override/tommatech-tommat-btrpmrn3256v100ah-00102-{1,2}.webp`.
