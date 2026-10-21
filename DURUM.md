# Proje Durumu — Voltekno e-ticaret

_Son güncelleme: 21.10.2026 · Bu dosya çalışma boyunca sürekli güncellenir. Güncel yapılacaklar listesi aşağıda **"Kalanlar"** bölümündedir. `YAPILACAKLAR.md` 18.10'dan beri güncellenmedi; oradaki bazı açık maddeler yapıldı (aşağıda "YAPILACAKLAR.md'de geçersiz kalanlar"). Son denetim raporları: `SITE-DENETIMI.md` (uçtan uca), `URUN-DENETIMI.md` (katalog)._

## Şu an yapılan
**Canlıda (nextfirststep.com, son yayın `f1025fa`, 21.10.2026, SEO hariç):** profesyonel seviye (yönetici rolleri, 2FA, işlem kaydı, izleme, yedek, CSV aktarımları, toplu kargo), açık tema ve varsayılan Türkçe, Geliver + Navlungo kargo fiyatı kıyası, Navlungo gönderi entegrasyonu (kimlik bilgisi girilene kadar kapalı), Geliver kargo takibi (`GELIVER_API_TOKEN` Hostinger'a eklenince çalışır), akü/batarya için iletişimle satış, tamamlanan desiler ve görseller, teslimat tahmini, sipariş tekrar koruması ve fiyat değişimi onayı, kısmi iadelerde kargo iadesi.

**Kodda hazır, canlıda değil:** yalnızca SEO (`9ad9119`, `6a30301`, `5122e7a`), "SEO yayınlamıyoruz" kararıyla bekliyor. **Yayın kuralı:** canlıya yalnızca siz söylediğinizde yayınlanır; yayın ortak klasörden değil SEO'suz yayın dalından (`yayin-pro-seo-haric`) yapılır.

## Kalanlar (21.10.2026 kontrolü)
_DURUM.md; git, Hostinger (yayın geçmişi, ortam değişkeni adları), `YAPILACAKLAR.md` ve klasörün durumuyla karşılaştırıldı._

**1. Yayın ve kod (sizin kararınız)**
| # | Kalan | Not |
|---|---|---|
| K1 | Navlungo + Geliver kodunun yayını | ✅ 21.10.2026 `f1025fa` ile canlıda. Geliver takibi için `GELIVER_API_TOKEN` Hostinger'a eklenmeli (anahtar sohbette paylaşıldığı için önce Geliver panelinden yenisi üretilmeli). Navlungo, bilgileri girilene kadar kapalı |
| K1b | Akü kısıtı, desi, görseller, teslimat tahmini, sipariş iyileştirmeleri | ✅ 21.10.2026 `f1025fa` ile canlıda |
| K2 | SEO yayını | Tür ve marka sayfaları, eski voltekno.com yönlendirmeleri (`9ad9119`, `6a30301`; İngilizce tür listesi düzeltmesi `5122e7a`) bekliyor |
| K3 | `main` dalı ve GitHub adresi | `urun-katalogu-ikas`, `origin/main`'den 81 commit ileride; yerel `main` 19 commit ileride ama gönderilmemiş. `origin` hâlâ eski adres (`aysenur-23/eticaret`, yeni adrese yönlendiriyor). İkisi de izin sisteminde reddedildi, sizin yapmanız gerekiyor (aşağıda "Yayın") |

**2. Hostinger ortam değişkenleri (nextfirststep.com)**
| Durum | Değişken |
|---|---|
| ✅ tanımlı | `DATABASE_URL` (mutlak), `ADMIN_TOKEN`, `ADMIN_EMAIL`, `CRON_SECRET`, `BACKUP_DIR`, `SMTP_*`, `NEXT_PUBLIC_SITE_URL`, `NEXT_PUBLIC_NOINDEX`, Firebase değişkenleri |
| ❌ eksik | `ADMIN_TOTP_SECRET` (ana şifrede iki adımlı doğrulama kapalı), `GELIVER_API_TOKEN` (K1 ile), `NAVLUNGO_API_USERNAME` / `NAVLUNGO_API_PASSWORD` / `NAVLUNGO_SENDER_ADDRESS_ID` (bilgiler gelince), `POS_*` (banka sanal POS gelince) |
| İsteğe bağlı | `BACKUP_EMAIL` (yoksa günlük yedek `ADMIN_EMAIL`'e gider), `SMTP_FROM_NAME` (varsayılan Voltekno), `NEXT_PUBLIC_META_PIXEL_ID` |

**3. Yönetim paneli (sizde; panele giriş gerektiği için doğrulanamadı)**
- Ana şifreyle girip Kullanıcılar sayfasından kendinize "Sahip" hesabı açın, Hesabım'dan iki adımlı doğrulamayı açın, çalışanlara ayrı hesap açın. Sonra ana şifreyi uzun ve rastgele bir değerle değiştirin.
- Ücretsiz bir uptime izleyiciyi `/api/health` adresine bağlayın.
- Gerçek stokları girin: 338 ürün 17, 2 ürün 16 (E10).

**4. Hesap ve sağlayıcı gerektirenler**
| Konu | Durum |
|---|---|
| Navlungo API | Firmayla görüşülecek: API kullanıcısı, depo adresi numarası, kargo anlaşması + fiyat listesi, cüzdan bakiyesi. İlk deneme test (QA) hesabıyla |
| Geliver | Anahtar alındı, yerelde çalışıyor. Sohbette paylaşıldığı için canlıya almadan önce Geliver panelinden yeni anahtar üretilmesi önerilir. Hesapta henüz gönderi yok; ilk gerçek gönderiyle bağlama ve durum geçişi denenmeli. Etiket satın almak için hesap onayı (sözleşme + vergi levhası) gerekli |
| hepsiJET XL | Fiyat kıyasında kullanılıyor (42 desi üstü). Navlungo PDF'ine göre ilk kullanımdan önce operasyon ekibinden uygunluk bilgisi alınmalı |
| Firebase yeni proje (E4) | `voltekno-eticaret` projesinde Firestore/Auth/Storage açılışı ve servis hesabı; canlı hâlâ eski proje değerleriyle |
| E-posta | Gönderen `@voltekno.com` kutusu olmalı (şu an `info@bataryakit.com`) |
| Diğer | Banka sanal POS, e-Arşiv entegratörü, SMS, pazaryeri (Trendyol/Hepsiburada), ERP/muhasebe, Sentry, Meta Pixel kararı, kapıda ödeme kararı |

**5. Katalog ve veri (tedarikçi)**
- Barkod/GTIN boş (Merchant Center görünürlüğünü sınırlar). Excel'deki silinmiş görseller 20.10'da tamamlandı; hâlâ eksik: Apex APX2440 gerçek fotoğrafı, Frecon 450 kW dolap fotoğrafı.
- Teyitler (E11): Deye model kuşağı, Electrozirve = SRNE, Apex/NP ölçüleri, Exelon ELH-24/PMAX-12P, Havensis "Solar-80AMPS 45A", İstabreeze kanat seti ağırlığı. Desiler 20.10'da tamamlandı (eksik kalmadı), 46 üründe hâlâ tahmin; ilk sevkiyatlarda koli ölçüsü ve brüt ağırlık alınmalı.
- **Victron MultiPlus-II 48/3000 ve Blue Smart IP67 24/8** katalogda 120 V sürüm (21.10'da üretici belgesiyle doğrulandı: VICTRO-PMP482305102-01465 AC girişi 90–140 V / 60 Hz, VICTRO-BPC240815106-01536 NEMA 5-15 fiş). Türkiye şebekesine (230 V / 50 Hz) uygun değil; 230 V sürümüyle değiştirilmeli ya da satıştan kaldırılmalı, karar sizde.
- Büyük ve tehlikeli gönderiler: 490 kg ısı pompası, büyük sürücüler, türbinler (ambar/palet). **Akü/batarya gönderim kısıtları** (lityum UN3480, jel akü) Navlungo/Geliver ve kargo firmalarıyla konuşulmalı; o zamana kadar aküler sitede iletişimle satılıyor (21.10'dan beri canlıda).

**6. voltekno.com geçişi:** aşağıda "voltekno.com geçişi" (SEO kararı, DNS, ortam değişkenleri, Firebase, e-posta, Search Console).

**7. Klasör ve depo düzeni**
| Konu | Not |
|---|---|
| Ortak klasörde başkasına ait commit'lenmemiş değişiklikler | ✅ 21.10.2026: Codex'in değişiklikleri gözden geçirilip `9b73f14` olarak commit'lendi; klasörde bekleyen değişiklik kalmadı |
| İngilizce katalog | İki eski çalışma kopyasında yarım iş var: `.claude/worktrees/admiring-mahavira-309b7b` (68 dosya) ve `awesome-greider-503600` (34 dosya), ikisi de 19.10'dan beri commit'lenmemiş. Devam mı, silme mi kararı sizde |
| Eski dallar | `claude/crazy-feynman` (Nisan), `seo-alan-adi` (ana dala birleşti; klasörü `../voltekno-seo`), eski bir stash. Temizlenebilir |
| Repo temizliği | Kökteki büyük zip'ler ve geçici dosyalar (`YAPILACAKLAR.md` 295) |

**8. Teknik öneriler (kod; karar verilirse yapılır)**
- ~~Kargo ücreti kg ile fiyatlanmıyor~~ geçersiz: içe aktarıcı desiyi zaten `max(en×boy×yükseklik/3000, kg)` olarak hesaplıyor (`scripts/import-ikas-excel.py`), yani ağır ve küçük ürünler kg ile fiyatlanıyor.
- Navlungo: panelde gönderi iptali ve iade toplama yok.
- `SITE-DENETIMI.md` §4: ✅ sipariş tekrar anahtarı (çift tıklamada ikinci sipariş açılmaz, aynı sipariş döner) ve ✅ fiyat değişince uyarı (sunucu toplamı ekrandakinden farklıysa sipariş açılmaz, yeni toplam gösterilip onay istenir; ödeme sayfası açılışta fiyatları sunucuyla eşitler) 21.10'da yapıldı, canlıda. Kalan: istemci paketinden kataloğun çıkarılması, nonce tabanlı CSP (ikisi de büyük değişiklik, ayrı tur). "Kargodan N gün sonra otomatik teslim edildi" önerisi Geliver/Navlungo takibiyle gereksizleşti.
- `npm audit`: 7 yüksek açığın hepsi `braces`, yalnızca derleme araçlarında; çözüm Tailwind 4 geçişi. SQLite → PostgreSQL paylaşımlı barındırmada yok; WAL + sunucu dışı yedek var.

**YAPILACAKLAR.md'de geçersiz kalanlar** (orada hâlâ açık görünüyor ama yapıldı): canlı veritabanı kalıcı (52–53), `public_html_standalone` git'ten çıktı (54), `CRON_SECRET` ve `ADMIN_EMAIL` canlıda tanımlı (55; `ADMIN_TOTP_SECRET` ve `POS_*` hâlâ eksik), cron yerine uygulama içi zamanlayıcı (56), `MEDIA_DIR` gerekmiyor (94), desi bazlı kargo yapıldı (96, 105), Node yayını yapılıyor (106), WhatsApp düğmesi var (314).

## Sipariş iyileştirmeleri (21.10.2026, `d53730b`, `c1b9c28`; canlıda `f1025fa`)
| Konu | Nasıl çalışıyor |
|---|---|
| Çift sipariş koruması | Ödeme sayfası her denemeye bir anahtar verir. Aynı anahtarla gelen ikinci istek (çift tıklama, yavaş bağlantıda tekrar) yeni sipariş açmaz, 24 saat içindeki ilk siparişi döner; kartlı siparişte ödeme formu yeniden kurulur. Eşzamanlı iki istek sıraya alınır |
| Fiyat değişimi | Sipariş, ekranda görülen toplamla gönderilir. Sunucu toplamı 1 kuruştan fazla farklıysa sipariş açılmaz (409), "Sepet tutarınız güncellendi: yeni toplam X TL (önceki Y TL)" yazılır, sepet fiyatları tazelenir; müşteri tekrar onaylayınca yeni toplamla geçer. Ödeme sayfası açılışta fiyatları sunucuyla eşitler, eski sepette bile ilk denemede uyarı çıkmaz |
| Kısmi iadede kargo | Son kısmi iade siparişteki tüm kalemleri tamamlıyorsa önerilen iade tutarına kargo ücreti de eklenir (önceden yalnızca tek seferde tam iadede ekleniyordu). Hesap `lib/return-refund.ts`, 4 birim testi |

**Doğrulama:** birim testleri 117/117 (ana dal) ve 112/112 (yayın dalı), Playwright akış testleri dahil: ana dal 184 geçti (tek kalan, iki tarayıcı projesi aynı IP'den çalışınca havale bildirimindeki 10 dakikada 5 istek sınırına takılıyor; tek projede geçiyor), yayın dalı 92 geçti / 0 kaldı.

## Akü kısıtı, desi ve görseller (20.10.2026, `4f351a4`; canlıda `f1025fa`)
**İstek:** akü ve batarya gönderiminde kısıtlama olup olmadığı kontrol edilecek; o zamana kadar sitede "kargo ve nakliye için iletişime geçiniz" olsun. Eksik görseller ve eksik desiler tamamlansın.

**Akü / batarya (`409abe9`):** Lityum Akü, Jel Akü ve Taşınabilir Güç İstasyonu kategorilerindeki 25 ürün şimdilik çevrim içi satılmıyor. "Batarya Yönetimi ve Aksesuar" (BMS) ile şarj cihazları normal satılıyor.
| Yer | Ne oluyor |
|---|---|
| Ürün sayfası | Fiyat görünür; kargo satırında "Kargo ve nakliye için iletişime geçin". Sepet düğmeleri yerine iletişim kutusu: ürün adıyla hazır WhatsApp mesajı, telefon, e-posta, iletişim formu |
| Ürün kartı, karşılaştırma, sepet önerileri | "Sepete ekle" yerine "İletişime geç" (ürün sayfasına gider) |
| Sepet | Eski sepette akü kalmışsa satır "çevrim içi sipariş edilemiyor" uyarısı alır, ödemeye geçiş kapanır, iletişim kutusu çıkar |
| Sunucu | Sipariş ve kupon fiyatlaması akü satırını reddeder (sipariş 400). İngilizce çevirisi var |
| Google Merchant akışı | Aküler akıştan çıkarıldı (satın alınamayan ürün listelenmemeli) |
| Ürün şeması | Akülerde kargo bilgisi (shippingDetails) yok |
Kısıt kalkınca `lib/shipping/battery.ts` içinde `BATTERY_CONTACT_ONLY = false` yapmak yeterli. Fiyat kıyasındaki "akülerde yalnızca Navlungo" kuralı yerinde duruyor.

**Desiler (`5cc31e0`):** 155 SKU araştırıldı (33'ünün ağırlığı yoktu, 122'si tahmindi). Sonuçlar kaynak adresi ve türüyle `scripts/data/logistics-research/missing-2026-10-20-*.result.json` dosyalarında.
- Ağırlığı ya da ölçüsü eksik SKU kalmadı (önceden 33).
- Ürün bazında desi kaynağı: tahmin 62 → 46, ürün ölçüsü 76 → 87, seri 26 → 31.
- 69 sepet satırının desisi değişti. Örnekler: SPI sürücülere ağırlık geldi (ör. 200 kW 89 → 145 desi), Heli 2.0/4.0 resmî koli koli ölçüsüyle (160 → 106, 240 → 150), Altech Boreas resmî ağırlıklarla (6 kW 140 → 108), NP Power 51,2V 100Ah ağırlıkla (14 → 52).
- **Hâlâ tahmin olanlar:** Victron aksesuarları (resmî ölçü yayımlanmamış, hepsi 1 desinin altında), Electrozirve ürünleri, Apex şarj cihazları ve inverterleri, TommaTech diyot modülleri ve split ısı pompaları, SPI sürücülerin ağırlıkları (ölçüleri resmî kılavuzdan, ağırlık yayımlanmamış), Altech Nova ölçüleri, 7 m kafes direk. Kesin değer için tedarikçiden koli ölçüsü ve brüt ağırlık alınmalı.
- İçe aktarıcı: yeni `--keep-fx` seçeneği önceki TCMB kurunu kullanır; bu turda fiyatlar değişmedi. Tarihli araştırma turları en son okunur.

**Görseller (`672724a`):** Excel'de Drive'dan silinmiş 15 görselin hepsi tamamlandı; içe aktarıcı artık eksik görsel bildirmiyor. Ürün sayfası seçilen varyantın görselini gösteriyor.
- Birebir model: TommaTech 80V duvar tipi şarj ünitesi (100A, 200A), Power serisi R290 14,8 kW ve R32 13 kW ısı pompaları (3 görünüm).
- Seri görseli: entegre (su geçirmez) şarj ünitesi 48V 50A/60A, 72V 25A; 80V 80A ve 300A; SPI 900VDC sürücüler gövdesine göre (18,5/45/132 kW duvar tipi metal kasa, 160/200 kW dolap); 40 Wp 36TN10 panel (aynı serinin 45 Wp fotoğrafı).
- **Hâlâ doğru fotoğrafı olmayan:** Apex APX2440 (distribütör de APX2420 fotoğrafını kullanıyor; Electrozirve'den gerçek fotoğraf istenmeli), Frecon PV500 450 kW dolabı (hiçbir yerde fotoğrafı yok).

**Araştırmada çıkan katalog uyarıları (teyit edilmeli):** Havensis HAVENS-00620 adında hem "80AMPS" hem "45A" geçiyor; Electrozirve sitesinde 40A DC-DC yalnızca çift yönlü, EC12-12 40A/60A modelleri yok; İstabreeze kanat SKU'larında ağırlık tek kanat için (3'lü set satılıyorsa düzeltilmeli); Havensis 1300W UPS trafolu ise 10 kg'ı geçebilir.

**Doğrulama (dalın kendi derlemesi, temiz çalışma kopyası):** tip kontrolü temiz, birim testleri 113/113 (yeni: akü kategorileri, desi.json akü işareti, İngilizce hata), derleme 471 sayfa, Playwright 98 geçti / 0 kaldı. Yerel kopyada: akü ürün sayfasında iletişim kutusu, kategori sayfasında 25 "İletişime geç" kartı, sepet doğrulaması aküyü satılamaz işaretliyor, akülü sipariş 400, akü ürün akışında yok, şemasında kargo bilgisi yok. SPI ürününde 160 kW seçilince dolap tipi görsel geliyor.

**Birleştirme (21.10.2026):** Codex'in değişiklikleri gözden geçirilip ayrı commit olarak kaydedildi (`9b73f14`, aşağıda), ardından `aku-iletisim` çakışmasız birleşti (`4f351a4`). Codex'in kargo sayfasına yazdığı "akülü siparişler tehlikeli madde taşımaya uygun firmayla gönderilir" cümlesi akü kuralıyla çelişiyordu, "şimdilik çevrim içi sipariş edilemiyor, iletişime geçin" olarak düzeltildi (`595f87b`). Birleşik halde: tip kontrolü temiz, birim testleri 113/113, derleme 471 sayfa, Playwright 98 geçti / 0 kaldı, akü kontrollerinin hepsi ve kargo/SSS metinleri doğrulandı.

**Codex'in işi (`9b73f14`):** teslimat tahmini (hafta içi 15:00 öncesi aynı gün, sonrası ertesi iş günü kargoya; kargoda 1–3 iş günü) ödeme sayfasına, müşteri sipariş sayfasına (kargoya verilene kadar) ve sipariş alındı / ödeme alındı / onaylandı e-postalarına eklendi; SSS ve kargo sayfası metinleri aynı kurala göre; kargo firması listesine hepsiJET XL ve PTT; ana sayfa hero görselinde öncelik ve duyarlı boyutlar; kullanılmayan 4 görsel (yaklaşık 10 MB) silindi; `.codex-*.log` dosyaları git dışında; site denetim raporu yenilendi. Gözden geçirmede: silinen görsellerin hiçbir yerde kullanılmadığı, tip kontrolü, 110 birim testi ve değişen dosyalarda lint temiz.

## Navlungo gönderi entegrasyonu (20.10.2026, `1dfd6ce`; canlıda `f1025fa`, kimlik bilgisi girilene kadar kapalı)
**İstek:** Gönderiler Navlungo'dan çıkıyor; "Kargoya ver" adımında gönderi Navlungo'da oluşsun, takip numarası, takip bağlantısı ve durum taşıyıcı sitelerinden değil Navlungo'dan gelsin.

**Önemli:** Navlungo kimlik bilgisi olmadığı için **gerçek API'ye hiç istek atılmadı.** İstek ve yanıt alanları `tcgunel/omniship-navlungo` paketinin kaynağından ve test verilerinden alındı (token `data.access_token`; oluşturma yanıtı belgede düz nesne, QA'da `data: [...]`; etiket base64 PDF ya da bağlantı). İlk gerçek denemede QA hesabıyla bir gönderi açılıp yanıtlar kontrol edilmeli.

**Sizden gerekenler (Navlungo panelinde):**
1. Entegrasyonlar → API kullanıcısı açın. Şifre yalnızca bir kez gösterilir. Panel girişi API'de çalışmaz.
2. Kargo Şirketleri → en az bir anlaşma ve fiyat listesi tanımlı olmalı. Yoksa oluşturma "fiyat listesi tanımı bulunmamaktadır" hatası verir.
3. Adres Defteri → Depo Konumları → gönderici (depo) adresi. Kaydın id'si `NAVLUNGO_SENDER_ADDRESS_ID` olur.
4. Sunucu ortamına `NAVLUNGO_API_USERNAME`, `NAVLUNGO_API_PASSWORD`, `NAVLUNGO_SENDER_ADDRESS_ID` yazın. `NAVLUNGO_TEST_MODE` `0`/`false` yazılmadıkça QA ortamı kullanılır (yanlışlıkla gerçek gönderi açılmasın). QA ve üretim ayrı hesaplardır, ayrı API kullanıcısı ister. İsteğe bağlı `NAVLUNGO_CARRIER_ID` (1 = Navlungo en uygun firmayı seçer, varsayılan).

**Yönetim paneli (sipariş detayı → Kargo kartı):**
- Ödenmiş ve kargoya verilebilir siparişte "Navlungo ile kargoya ver" kutusu: desi (sipariş anındaki teklifin desisi, ağırlık büyükse kg) ve koli adedi (varsayılan 1) düzenlenebilir. "Navlungo'da gönderi oluştur" onay sorar, gönderiyi açar (reference_id = sipariş no), sipariş "Kargoda" olur, müşteriye Navlungo takip bağlantısıyla e-posta gider. Elle takip numarası girişi alternatif olarak altta kalır.
- Gönderi açıldıktan sonra: Navlungo gönderi no, son durum, son sorgu zamanı, "Etiketi indir (PDF)" ve "Durumu güncelle". Etiket gönderiden birkaç dakika sonra hazır olur, o zamana kadar "henüz hazırlanıyor" der.
- Aynı sipariş no ile gönderi zaten açılmışsa (önceki denemenin yanıtı kaybolduysa) yeni gönderi açılmaz, mevcut gönderi kullanılır.
- Sistem Durumu sayfasında "Navlungo gönderi entegrasyonu" kontrolü (kapalı / QA / üretim) ve "Navlungo kargo takibi" görevi.

**Takip (zamanlayıcı, 2 saatte bir; elle `POST /api/cron/navlungo-tracking`, `?dry=1` değişiklik yapmaz):**
- Kargodaki Navlungo gönderilerinin durumu `post/check` ile çekilir (kargoya verilişten sonra 45 gün).
- Taşıyıcı gönderiyi kabul edince verdiği takip numarası siparişe yazılır, kargo firması Navlungo'nun bildirdiği taşıyıcıya göre düzeltilir.
- Teslim Alındı, Yolda, Dağıtıma Çıktı gibi durum değişiklikleri müşterinin zaman çizelgesine düşer; sipariş sayfasında "Kargo durumu" görünür.
- Teslim Edildi (kod 2) → sipariş `lib/order-service` üzerinden "Teslim Edildi" olur, müşteriye e-posta gider.
- İade, iptal ve tazmin durumları (7/9/21, 10, 19/20) **otomatik uygulanmaz**, çünkü stok ve ücret iadesi sizin kararınız. Zaman çizelgesine panel notu düşer, Sistem Durumu'na uyarı yazılır.
- Navlungo'nun bildirim (webhook) URL'si kullanılmadı: yük biçimi belgelenmemiş, doğruluk kaynağı `post/check`.

**Müşteri tarafı:** Takip bağlantısı Navlungo'nun sayfasıdır (sipariş sayfası ve e-postalar). Navlungo linkinde "numarayı sayfaya yapıştırın" ipucu gösterilmez. Etiket bağlantısı ve iç alanlar müşteri yanıtına girmez.

**Kod:** `lib/shipping/navlungo-api.ts` (istemci, token önbelleği 8 saat ve 5 dk pay, 401'de bir kez yenileme, durum kodları, takip kararı), `lib/shipping/navlungo-shipments.ts` (sipariş tarafı), `app/api/admin/orders/[id]/navlungo-label`, `app/api/cron/navlungo-tracking`. Order'a yeni alanlar: `trackingUrl`, `navlungoPostNumber`, `navlungoStatusCode`, `navlungoStatusName`, `navlungoLabelUrl`, `navlungoTestMode`, `navlungoSyncedAt`. Hepsi boş bırakılabilir; derlemedeki `prisma db push` onay istemeden uygular (bu yüzden gönderi no'ya benzersiz kısıt yerine indeks kondu).

**Doğrulama (yalnızca sahte yanıtlarla):**
- Birim testleri 16 yeni, toplam 104/104: token önbelleği ve süre, eşzamanlı tek token, 401 sonrası yenileme, QA/üretim adresi, oluşturma gövdesi (adres defteri gönderici, telefon biçimi, desi), iki yanıt biçimi, aynı reference_id, doğrulama hataları, durum ve loglar, etiket base64 / hazır değil, iptal, ağ hatası, takip kararları.
- Yerel veritabanı kopyasında uçtan uca: ödenmiş sipariş → Navlungo gönderisi + Kargoda → etiket → Dağıtıma Çıktı → zamanlayıcı → Teslim Edildi. Taşıyıcı numarası yazıldı, müşteri e-postasında Navlungo linki çıktı. E-postalar diske yazıldı, dışarı gitmedi.
- Tip kontrolü ve lint temiz. **Admin ekranı tarayıcıda görülmedi** (yönetici girişi gerekiyor).

**Kalan:** QA hesabıyla ilk gerçek deneme. Gönderi iptali API istemcisinde var (`cancelPost`), ama panelde düğme yok. Kargodaki sipariş geri alınamadığı için akış ayrıca kararlaştırılmalı. İade toplama (return post) yok.

## Geliver kargo takibi (20.10.2026, `9929e0d`; canlıda `f1025fa`, `GELIVER_API_TOKEN` bekleniyor)
**İstek:** sipariş takibi şimdilik Geliver'den yapılsın. Gönderiler Geliver panelinde açılıyor; site gönderiyi siparişe bağlıyor ve durumu Geliver'den çekiyor.

| Konu | Nasıl |
|---|---|
| Kendiliğinden bağlama | Geliver'de gönderinin sipariş numarası alanına sitedeki sipariş no (ör. `ORD-2026-02356`) yazılırsa, ödemesi alınmış siparişler saatte bir bu numarayla aranıp bağlanır |
| Elle bağlama | Yönetimde sipariş sayfası, Kargo kartı, "Geliver ile takip": Geliver gönderi linki, gönderi kimliği veya takip numarası yapıştırılıp "Bağla" |
| Durum | Saatte bir (zamanlayıcı) ya da "Durumu güncelle". Takip no, takip linki ve kargo firması siparişe yazılır |
| Kargoda | Kargo firması teslim alınca (Geliver TRANSIT), ödemesi alınmış sipariş "Kargoda" olur, müşteriye takip linkiyle e-posta gider |
| Teslim | Geliver DELIVERED: sipariş "Teslim Edildi", müşteriye e-posta |
| İade / iptal / kayıp | Otomatik uygulanmaz: zaman çizelgesine not, yöneticiye uyarı |
| Test gönderisi | Sipariş durumunu değiştirmez |
| Müşteri | Sipariş sayfasında takip linki (firmanınki, yoksa `app.geliver.io/tracking/…`) ve son durum ("Kargo dağıtımda") |

**Ayar:** `GELIVER_API_TOKEN` (yerel `.env.local`'a yazıldı). Canlıda Hostinger ortam değişkenlerine eklenmesi gerekiyor. Elle tetikleme: `POST /api/cron/geliver-tracking` (Bearer CRON_SECRET, `?dry=1` yalnızca okur). Sistem Durumu sayfasında "Geliver kargo takibi" satırı.

**Doğrulama:** Ortak klasördeki başkasına ait yarım değişiklikler dışarıda kalsın diye temiz çalışma kopyasında yapıldı. Tip kontrolü temiz, birim testleri 110/110 (Geliver: yanıt çözümleme, firma eşleme, kargoya verme ve teslim kararları, iade/iptal/test, sahte HTTP ile istemci), derleme 471 sayfa. Gerçek Geliver hesabına karşı yalnızca okuma: anahtar geçerli, hesapta 0 gönderi ve Elazığ'da varsayılan gönderici adresi var. Zamanlanmış görev deneme kipinde çalıştı, yetkisiz istek 401, olmayan takip no ve link anlaşılır hatayla reddedildi. Yönetim sipariş sayfasında Geliver kutusu görüldü. **Doğrulanamayan:** Gerçek bir Geliver gönderisiyle bağlama ve durum geçişi; hesapta henüz gönderi yok (Geliver'in test gönderisi oluşturulursa denenebilir).

## Kargo: Geliver + Navlungo (20.10.2026, `5acce2b`; canlıda `7381cb9`)
**İstek:** Navlungo Domestic Fiyat Teklifi 2026 PDF'i incelensin, kapıda ödeme dışındaki seçenekler eklensin, her seçenek eklenmeden kıyaslansın. Fiyat önceki firma listesinden verildiyse "Geliver", PDF'ten verildiyse "Navlungo" olarak yönetim panelinde yazsın. Akülerde yalnızca Navlungo fiyatı.

**Kaynaklar:** Geliver "Fiyat Listesi" (masaüstünde `Kargo Fiyat Listesi.pdf`, app.geliver.io, 3.10.2026, şehirler arası "En iyi fiyatlar", vergiler hariç, +%22,35). Navlungo PDF (taşıyıcı tarifeleri 17.07.2026'dan itibaren, KDV ve EPH dahil, 81 ile tek fiyat).

**PDF'teki seçenekler (kapıda ödeme hariç):**
| Seçenek | Sitede |
|---|---|
| Aras, hepsiJET, Sürat, Yurtiçi, Kolay Gelsin, PTT tarifeleri | ✅ fiyat kıyasına girdi |
| hepsiJET XL (42 desi üstü, ₺21/desi, kata teslim) | ✅ fiyat kıyasına girdi. PDF: ilk kullanımdan önce Navlungo operasyondan uygunluk bilgisi alınmalı |
| Ağır taşıma (tek parça 100 desi üstü, parça başı) | ✅ Aras 5.610, Sürat 5.940, Yurtiçi 7.062, PTT 4.700; Kolay Gelsin ve hepsiJET almıyor |
| Kuryetel | ❌ PDF'te fiyat yok ("danışmanınıza ulaşın") |
| Randevulu kapıdan iade toplama (hepsiJET ₺172 / ₺195), başarısız teslimde gidiş ücretinin %50'si | ℹ️ müşteri ücreti değil, iade sürecinde gider |
| SMS/WhatsApp takip, adres düzeltme, cüzdan, tek fatura, Single API | ℹ️ Navlungo panelinin hizmetleri; sitede karşılığı Navlungo API entegrasyonu (aşağıda) |

**Kıyas (tek gönderi, vergiler dahil ₺, Geliver = o desideki en ucuz firma):**
| Desi | Geliver | Aras | hepsiJET | hepsiJET XL | Sürat | Yurtiçi | Kolay Gelsin | PTT | Seçilen |
|---|---|---|---|---|---|---|---|---|---|
| 1–2 | 110 (Sürat) | 119 | 109 | — | 127 | 175–219 | 150 | 99 | Navlungo · PTT |
| 3–4 | 111 (hepsiJET) | 129–157 | 110 | — | 127–161 | 219–252 | 150–176 | 106 | Navlungo · PTT |
| 5 | 138 (Kolay Gelsin) | 169 | 155 | — | 161 | 252 | 176 | 120 | Navlungo · PTT |
| 6–10 | 153 (Kolay Gelsin) | 199–227 | 155 | — | 205 | 327 | 176–213 | 149 | Navlungo · PTT |
| 12–15 | 233–241 | 259–289 | 233 | — | 287–319 | 447 | 313 | 225 | Navlungo · PTT |
| 18–20 | 241 (Kolay Gelsin) | 349 | 233 | — | 377–390 | 535 | 313 | 299 | Navlungo · hepsiJET |
| 25–30 | 326 (Kolay Gelsin) | 399–479 | 315 | — | 476–571 | 665–738 | 489 | 349–399 | Navlungo · hepsiJET |
| 35–40 | 448–570 | 544–609 | 420 | — | 646–721 | 828–918 | 559–629 | — | Navlungo · hepsiJET |
| 45 | 693 | 674 | — | 945 | 796 | 1.008 | 699 | — | Navlungo · Aras |
| 60 | 1.060 | 869 | — | 1.260 | 1.021 | 1.278 | 909 | — | Navlungo · Aras |
Not: hepsiJET paket başı en fazla 25 kg, Kolay Gelsin (Geliver) en fazla 30 kg. Ağır sepetlerde bu sınırlar nedeniyle Geliver öne geçebiliyor (ör. 26 desi 26 kg panel: Geliver · Kolay Gelsin 325,76 < PTT 399).

**Ürün bazında etki (tek adet, 340 ürün):** 314 üründe kargo düştü, 5 üründe arttı, 21'inde aynı; ortalama 983 ₺ → 530 ₺. Seçilen kaynak: Navlungo PTT 248, Aras 27, hepsiJET XL 25, hepsiJET 19; Geliver 21. Artan 5 ürünün hepsi akü (Geliver devre dışı olduğu için): 2 lityum batarya 546 → 596, 2 jel akü 326 → 399, 1 jel akü 350 → 492. Büyük düşüşler ağır ürünlerde: ısı pompaları ve 280Ah batarya artık hepsiJET XL fiyatıyla (ör. 8.432 → 3.129).

**Kurallar:**
- Sepet tek gönderi sayılır, fiyat toplam desiye göre. Ağır taşıma bedeli yalnızca 100 desiyi aşan tek parça için, parça başına.
- Geliver 30 desi üstünde ve ağır parçada firma belirtmiyor. 30 üstü "her ek desi 20 ₺ + vergiler" fiyatı kullanılır. Ağır parçalı sepete Geliver teklifi verilmez, çünkü listede o firmaların taban fiyatı yok.
- Akü: Lityum Akü, Jel Akü, Taşınabilir Güç İstasyonu kategorileri (25 ürün). "Batarya Yönetimi ve Aksesuar" akü sayılmadı.
- Fiyat hâlâ desiye göre. Kg desiden büyük olsa da kg ile fiyatlanmıyor; katalogda çoğu üründe desi zaten kg'a eşit.

**Yönetim paneli:** Sipariş listesinde tutarın altında "Kargo: Navlungo / Geliver". Sipariş detayında fiyat özetinde "Fiyat: Navlungo · Aras Kargo". Kargo kartında kaynak, desi/kg, akü notu ve sipariş anındaki tüm teklifler (verilemeyenler nedeniyle). Kargo firması seçimi teklifi veren firmayla açılır. Muhasebe dökümünde "Kargo fiyat kaynağı" ve "Fiyatı veren firma" sütunları var. Bu değişiklikten önceki siparişler "Geliver (önceki fiyat listesi)" yazar.

**Doğrulama (yerel kopya, e-posta kapalı):** tip kontrolü, birim testleri 88/88 (yeni: kaynak kıyası, basamaklar, ağır taşıma, akü kuralı, firma eşleme), derleme 471 sayfa, Playwright 98 geçti / 0 kaldı. Akülü test siparişi: Navlungo · Aras 596 ₺, Geliver "Akü / batarya" gerekçesiyle dışarıda. Panel siparişi: Geliver · Kolay Gelsin 325,76 ₺. Panel listesinde, detayda ve CSV'de kaynak görüldü.

**Navlungo'dan bilgi almak (öneri, sizde):** Navlungo'nun Domestic API'si (v2.1) gönderi oluşturma, etiket PDF'i, durum takibi, takip bağlantısı, iptal ve iade toplama sunuyor. Fiyat sorgulama ucu yok; fiyat paneldeki fiyat listesinden geliyor. Bağlantı için Navlungo panelinde Entegrasyonlar bölümünden API kullanıcısı açılması ve bir gönderici (depo) adresi tanımlanması gerekiyor. Bilgiler gelince "Kargoya ver" Navlungo'da gönderi açıp takip numarasını ve bağlantısını kendisi yazabilir. Geliver için de aynı soru geçerli. → Navlungo tarafı yapıldı, yukarıda "Navlungo gönderi entegrasyonu".

## İstek turu 5 (20.10.2026)
| İstek | Durum | Not |
|---|---|---|
| Koyu tema kullanılmasın | ✅ `79f95bf` | Açık zemine geçti: yönetici giriş ekranı, yönetim yan menüsü ve mobil üst çubuğu, footer (iletişim ikonları kutusuz), üst şerit, blog başlık alanları, karşılaştırma çubuğu, ana sayfadaki "Öne çıkan kategori" kartı, bildirim kutusu, ürün listesindeki toplu seçim çubuğu. Lacivert yalnızca düğme rengi. Fotoğraflı teklif bandındaki karartma, yazının okunması için kaldı. Sitede koyu mod anahtarı yok |
| Site varsayılan Türkçe gelsin | ✅ `79f95bf` | Sunucu zaten çerezsiz her ziyaretçiye Türkçe veriyordu (tarayıcı dili İngilizce olsa bile). İngilizce görünmesinin nedeni, önceki testlerden kalan bir yıllık "English" çereziydi. Dil seçimi artık oturumluk: tarayıcı kapanınca yeni ziyaret Türkçe başlar. Önceden "English" seçmiş bir tarayıcı, bir kez "Türkçe" seçince düzelir |
| Adet kutusunda "2 sepette" yerine "2" | ✅ `79f95bf` | Ürün kartı ve ürün sayfası. "sepette" yalnızca ekran okuyucular için |
| Sepete eklendi bildiriminde "Sepete git" | ✅ `79f95bf` | Ürün kartı, ürün sayfası ve sepete ekle düğmesi. Düğmeli bildirim 5 saniye kalır |

**Doğrulama (yayın dalı `yayin-pro-seo-haric` = `3008ea6`, test sunucusunun okuduğu klasöre derlendi):** tip kontrolü, birim testleri 77/77, derleme 429 sayfa, Playwright 98 geçti / 0 kaldı, ticaret akışları 21/21, yönetici rolleri 11/11. Tarayıcıda açık giriş ekranı, açık yan menü, "Sepete git" düğmesi ve yalnızca sayı gösteren adet kutusu görüldü. **Canlı (20.10 19:12):** 29/29 genel kontrol, çerezsiz ana sayfa `lang="tr"`, footer/üst şerit/giriş ekranı/blog açık zeminde, sunucu kaydında hata yok.

**Düzeltme notu (19.10 yayını):** `25ae00a` öncesi yerel testler, derleme farklı klasöre gittiği için yayın dalının değil bir önceki (SEO'lu, aksi hâlde aynı) derlemenin üzerinde koşmuştu. Yayından sonraki canlı kontroller geçmişti; bu turda testler doğru derlemeye karşı yeniden koşuldu ve geçti.

## Profesyonel seviye (19.10.2026 akşam, `e8806cf`; canlıda `25ae00a` olarak, SEO hariç)
**İstek:** kartla ödeme, e-Arşiv ve alan adı dışındaki eksikleri profesyonel bir e-ticaret sistemi seviyesine getirmek.

| Alan | Yapılan | Not |
|---|---|---|
| Yönetici hesapları | Kişiye özel hesap, 4 rol (Sahip, Yönetici, Sipariş operatörü, Katalog editörü), her istekte rol ve yol kontrolü, kişiye özel iki adımlı doğrulama (QR), geçici şifreyle açılan hesapta ilk girişte şifre değişimi | Sayfalar: Kullanıcılar, Hesabım. Rol değişikliği ve pasifleştirme anında etkili. Ana şifre (`ADMIN_TOKEN`) acil durum girişi olarak kalır ve "Sahip" sayılır |
| İşlem kaydı | Paneldeki her değişiklik (giriş, sipariş durumu, stok, fiyat, kampanya, içe aktarma, yedek indirme…) kim, ne zaman, hangi IP ile kaydedilir | Sayfa: İşlem Kaydı (Sahip ve Yönetici), arama |
| İzleme | Sunucu ve tarayıcı hataları gruplanarak kaydedilir (tekrar sayısı, son görülme), `/api/health` uptime izleyicileri için (veritabanı kontrolü, 200/503) | Sayfa: Sistem Durumu: veritabanı, zamanlanmış görevler, yedekler, son hatalar, 12 yapılandırma kontrolü (değerler gösterilmez) |
| Veritabanı ve yedek | SQLite WAL kipi (eşzamanlı okuma/yazma), günlük yedek sıkıştırılıp e-postayla sunucu dışına gönderilir (`BACKUP_EMAIL`, yoksa `ADMIN_EMAIL`, yoksa mağaza e-postası; `BACKUP_EMAIL=0` kapatır), elle yedek ve indirme, 30 günden eski hata kayıtları temizlenir | PostgreSQL paylaşımlı barındırmada yok; WAL + sunucu dışı yedek bu açığı kapatır |
| Firebase bağımlılığı | Ürün yorumları, ürün soruları ve iletişim mesajları artık kendi veritabanımızda. Yorumlarda "Doğrulanmış alıcı" (teslim edilmiş sipariş), mağaza yanıtı, ürün şemasında gerçek puan. GES teklif sayfası, admin girişi ve hesap silme Firebase servis hesabı olmadan çalışır | Eski Firestore yorum/iletişim kayıtları taşınmadı (veri taşınmayacak kararı) |
| Toplu stok ve fiyat | Katalog CSV dışa aktarma (Excel uyumlu), CSV ile stok/fiyat içe aktarma: önce ön izleme, sonra uygula. Ürün kodu veya SKU ile eşleşir, 3 kattan büyük fiyat değişimi ve tekrarlanan satır reddedilir | Ürünler sayfasında Dışa aktar / İçe aktar |
| Muhasebe aktarımı | Tarih aralığına göre sipariş özeti (KDV matrahı, KDV, kupon ve havale indirimi, kargo) ve satır detayı CSV | Siparişler sayfası (Sahip ve Yönetici) |
| Kargo | Toplu kargolama: sipariş no, kargo firması, takip no CSV'si → ön izleme → siparişler kargoda, müşteriye takip e-postası. 10×15 cm kargo etiketi PDF (gönderici, alıcı, desi, kg, QR) | Siparişler sayfası ve sipariş detayı. 20.10: Geliver takibi ve Navlungo gönderi entegrasyonu eklendi (canlıda değil, yukarıda) |
| Pazarlama izinleri | Ticari ileti izni tarihli defterde (kim, ne zaman, hangi kaynaktan, IP) tutulur: İYS ispatı için. Kayıt ve profil buraya yazar; terk edilmiş sepet e-postası ve müşteri listesi buradan okur. İzinli kişiler CSV | Müşteriler sayfası |
| Yorum isteme | Teslimattan 7 gün sonra (30 güne kadar) sipariş başına bir kez değerlendirme isteği e-postası | `REVIEW_REQUESTS=0` kapatır |

**Doğrulama (yerel test sunucusu, veritabanı kopyası, e-posta kapalı):** ana şifreyle giriş, kullanıcı ekleme, zorunlu şifre değişimi, 2FA kurulumu ve kodla giriş, operatör ve editör kısıtları, pasifleştirilen kullanıcının oturumunun anında düşmesi, işlem kaydı, sağlık ucu, tarayıcı hata kaydı, elle yedek ve indirme; yorum onayı ve yanıtı, ürün şemasında puan, soru-cevap, iletişim formu, katalog/sipariş/izinli kişi CSV'leri, stok içe aktarma (yeni stok vitrinde), toplu kargo ön izlemesi, etiket PDF'i. Tip kontrolü, birim testleri 82/82, üretim derlemesi 471 sayfa, Playwright Chromium + Mobile Chrome 98/98. Tarayıcıda Sistem Durumu, Kullanıcılar, Hesabım ve yeni düğmeler kontrol edildi.

**Yayından sonra yapılacaklar (sizde):**
1. Ana şifreyle girip Kullanıcılar sayfasından kendinize "Sahip" hesabı açın, o hesapla girip Hesabım'dan iki adımlı doğrulamayı açın. Diğer çalışanlara ayrı hesap açın.
2. İsteğe bağlı ortam değişkenleri: `ADMIN_EMAIL` (hata uyarıları), `BACKUP_EMAIL` (günlük yedeğin gideceği adres, mağaza kutusundan farklı olması önerilir).
3. Ücretsiz bir uptime izleyiciyi (UptimeRobot, Better Stack vb.) `/api/health` adresine bağlayın.
4. Kişisel hesaplara geçince ana şifreyi uzun ve rastgele bir değerle değiştirin, `ADMIN_TOTP_SECRET` tanımlayın.

**Hesap veya sağlayıcı gerektirdiği için yapılamayanlar:** pazaryeri entegrasyonu (Trendyol/Hepsiburada API anahtarı), kargo firması API'si (otomatik takip no ve barkod), ERP/muhasebe yazılımı bağlantısı (şimdilik CSV), Sentry gibi dış hata servisi (şimdilik panel içi kayıt), PostgreSQL, katalog verisi (GTIN/barkod, ölçülmüş desi, eksik görseller; tedarikçiden), Firebase yeni proje ve servis hesabı (markalı doğrulama e-postaları). İngilizce katalog: iki eski çalışma kopyasında commit'lenmemiş iş var, çakışma riski nedeniyle dokunulmadı.

**Katalog uyarısı (tekrar):** Victron MultiPlus-II 48/3000 ve Blue Smart IP67 24/8 katalogda 120 V sürüm olarak geçiyor; Türkiye şebekesine (230 V) uygun değil, kontrol edilmeli.

## Eksikler ve tutarsızlıklar (19.10.2026 kontrolü ve çözümü)
_DURUM.md; git, Hostinger (yayın geçmişi, cron, ortam değişkeni adları, herkese açık API) ve `YAPILACAKLAR.md` ile karşılaştırıldı, ardından çözüldü. Doğrulama: tip kontrolü, lint, 63 birim testi, üretim derlemesi (425 sayfa), Playwright Chromium + Mobile Chrome 98 geçti / 0 kaldı (veritabanı kopyası, e-posta kapalı)._

| # | Eksik | Durum | Ne yapıldı / kalan |
|---|---|---|---|
| E1 | Hostinger'da cron görevi yok → süresi geçen havale siparişleri iptal edilmiyor, stok geri dönmüyor, yedek alınmıyordu | ✅ canlıda | Uygulama içi zamanlayıcı (`instrumentation.ts` → `lib/scheduler.ts`): havale takibi 6 saatte bir, veritabanı yedeği günde bir. Son çalışma zamanı veritabanının yanındaki `scheduler-state.json`'da (yayınlar arasında korunur), süreçler arası kilitli. Görev mantığı `lib/cron-jobs.ts`'de; HTTP uçları aynı işi yapar. Yerelde kopya veritabanında denendi: 5 günlük havale siparişi iptal edildi, yedek alındı. `INTERNAL_CRON=0` ile kapatılır. Uygulama ziyaretsiz kalıp uyutulursa görev ilk açılıştan ≈1 dk sonra çalışır; tam zamanlama için hPanel cron'u da kurulabilir (`/api/cron/expire-orders` ve `/api/cron/backup`, `Authorization: Bearer <CRON_SECRET>`), ikisi birlikte sorun çıkarmaz |
| E2 | Header menü değişikliği commit'lenmemişti | ✅ `c2ef7af` canlıda | Menülerde yalnızca alt kategoriler. Kullanılmayan marka listesi silindi; başlık bileşeni artık tüm kataloğu tarayıcıya yüklemiyor. Tarayıcıda (1440 px) iki menü de kontrol edildi. İngilizcede Türkçe kalan "Tümünü Gör" düzeltildi (`d2f2e30`) |
| E3 | Firebase / SMTP işi commit'lenmemişti | ✅ `1b02374` canlıda | `.firebaserc`, `firebase.json`, `storage.rules`, `FIREBASE_SETUP.md`, `lib/email-smtp.ts`. `FIREBASE_SETUP.md` düzeltildi: veri taşınmayacağı kararı ve sonucu, anahtarsız çalışanlar (admin girişi, müşteri oturumu), yetkili alan adlarına nextfirststep.com |
| E4 | Canlı Firebase hâlâ eski projede | ❌ sizde | Kod hazır. Yeni projede Firestore/Auth/Storage açılıp servis hesabı anahtarı gelince canlı ortamdaki `NEXT_PUBLIC_FIREBASE_*` + `FIREBASE_ADMIN_*` birlikte değiştirilip yeniden yayınlanmalı (adımlar `FIREBASE_SETUP.md`). Veri taşınmayacak (18.10 kararı) |
| E5 | `MEDIA_DIR` canlıda yok | ✅ gerek yok | Canlı `DATABASE_URL` mutlak ve kalıcı (`/home/u718952521/domains/nextfirststep.com/voltekno.db`, YAPILACAKLAR.md 63). `MEDIA_DIR` yokken görseller onun yanındaki `media/` klasörüne gider (`lib/media-storage.ts`), yayınlarda silinmez |
| E6 | Ana dala birleştirme yok, `origin` eski adres | ⚠️ sizde (dal gönderildi) | `urun-katalogu-ikas` → `main` saf ileri sarma (çakışma yok; yerel `main` ve `origin/main` dalın içinde). `main`'e gönderme ve remote adresini değiştirme sizin onayınızı bekliyor. Yeni adres doğrulandı (aynı depo): `git remote set-url origin https://github.com/info-aftsoftware/eticaret.git` |
| E7 | `seo-alan-adi` dalı eskiydi | ✅ | Güncel dal birleştirildi (çakışmasız), tip kontrolü + 57 birim testi geçti. 132 yönlendirme güncel katalogla karşılaştırıldı: ürün hedeflerinin hepsi mevcut, kategori/marka filtreleri geçerli, eski ürün listesiyle çakışma yok. Düzeltildi: eski `/diger` boş "Diğer" grubuna gidiyordu → `/products` (`94c8eb6`). Hâlâ **yayına dahil değil** |
| E8 | `public_html_standalone/` git'teydi | ✅ `0859e22` | Git takibinden çıkarıldı (2056 dosya), `.gitignore`'a eklendi; klasör diskte duruyor |
| E9 | `docs/su-urunleri-otomasyon/` kopyası | ✅ | Asıl depodakiyle karşılaştırıldı (4 dosya aynı, 1 dosyanın asıl depodaki sürümü daha yeni ve kapsıyor), Geri Dönüşüm Kutusu'na taşındı |
| E10 | Canlı veritabanı işleri | ✅ / ❌ | Canlı API'de 340 ürün, eski katalog ürünü yok; aktif kampanya yok, "yeni10" kuponu geçersiz. **Kalan (sizde):** gerçek stoklar girilmemiş (338 ürün 17, 2 ürün 16) |
| E11 | Katalog teyitleri (tedarikçi) | ❌ sizde | Deye model kuşağı (41 SKU), Electrozirve = SRNE, Apex/NP ölçüleri, Exelon ELH-24/PMAX-12P, eksik 16 görsel, barkod/GTIN boş (Merchant Center GTIN'siz ürünleri sınırlar), İstabreeze kanat seti ağırlığı, koli ölçüleri |
| E12 | Sağlayıcı / iş kararı gerektirenler | ❌ sizde | e-Arşiv entegratörü, SQLite → PostgreSQL, IBAN hesap sahibi adı kontrolü, kargo API (20.10: Navlungo ve Geliver bağlantıları kodda, canlıda değil), SMS, taksit tablosu, Turnstile, ETBİS, İYS, Meta Pixel (çerez politikasına eklenmeli), PayTR kararı, kapıda ödeme (`YAPILACAKLAR.md` 125–128, 242, 261) |
| E13 | Playwright testleri üretim derlemesinde kırmızıydı | ✅ `220407d` | Mobilde havale testi gizli masaüstü özet kopyasına bakıyordu (sayfa doğru, test hatalı). Merchant testi önceden üretilmiş akışta (ISR) gerekçeli atlanıyor. Not: e2e testleri sunucuyla aynı `DATABASE_URL` ile çalıştırılmalı (test ürünü/kuponu oraya yazılır) |

## SEO kapsamı (19.10.2026 akşam)
**İstek:** ürün türünü arayan kişi doğrudan bizi bulsun.

**Önceki durum (denetim):** 371 adresin hepsi 200, yinelenen başlık yok, her sayfada tek H1. Ama ürün türleri (lityum akü, MPPT şarj kontrol cihazı, hibrit inverter…) yalnızca `/products?category=…` filtresiydi ve canonical'ı `/products` → Google'da tür aramasına karşılık gelen sayfa yoktu. Kök düzen her sayfaya ana sayfa canonical'ı + hreflang veriyordu: /categories, /shipping, /siparis-takip, /hakkimizda, /blog ve 6 blog yazısı ana sayfanın kopyası sayılıyordu; blog site haritasında yoktu. Kurum şeması her sayfadaydı, ürün sayfasında kırıntı şeması yoktu, 2 üründe açıklama yineleniyordu.

| Yapılan | Not |
|---|---|
| Ürün türü sayfaları | `/category/<grup>/<tür>`, 29 tür (ısı pompası tek türlü grup, grup sayfası yeterli). Sunucuda: kırıntı yolu, H1, giriş, katalogdan özet (ürün sayısı, markalar, KDV dahil başlangıç fiyatı), tüm ürünler, alım rehberi (H2), SSS, ilgili türler ve blog. Şema: BreadcrumbList + CollectionPage/ItemList. İçerik `lib/seo/product-types.ts` |
| Marka sayfaları | `/marka/<slug>`, 13 marka; türler ve sayılar katalogdan, tanıtım yalnızca doğrulanabilir bilgi (`lib/seo/brands.ts`) |
| İç bağlantılar | Menüler, mobil menü, ana sayfa kategori kartları/hero, marka şeridi, ürün sayfası kırıntı yolu ve kategori/marka bağlantıları, grup sayfaları, blog yazıları → tür/marka sayfaları (`lib/seo/type-paths.ts`) |
| Canonical / hreflang | Kök düzendeki genel canonical ve hreflang kaldırıldı; ana sayfa ve canonical'ı eksik sayfalara kendi adresi |
| Blog | Canonical, BlogPosting + BreadcrumbList şeması, ilgili ürün türü bağlantıları; veri `lib/blog-posts.ts` |
| Kurum şeması | Yalnızca ana sayfada `OnlineStore` + `WebSite` (@id ile), unvan/adres/vergi no/e-posta firma bilgisinden; doğrulanmamış sosyal medya adresleri kaldırıldı |
| SEO dalı birleştirildi | Eski voltekno.com adresleri (132) → yeni sayfalara 308; kategori/marka filtresine gidenler artık tür/marka sayfalarına |
| Site haritası | Tür, marka, blog, hakkımızda eklendi; sahte "bugün" tarihi ve Google'ın yok saydığı alanlar kaldırıldı |

| Diğer düzeltmeler | Kök düzen her sayfaya Organization + WebSite (kaldırılmış SearchAction ile) + LocalBusiness basıyordu → kaldırıldı; boş Google doğrulama etiketi yalnızca değer varsa; teklif doğrulama aracı noindex + kendi başlığı; 2 üründe yinelenen açıklama ayrıştı; tür ve marka sayfalarında çerçeve etiketleri EN modda İngilizce, Türkçe içerik `lang="tr"` |

**Doğrulama (yerel üretim derlemesi, 467 sayfa):** iç bağlantılardan 425 adres tarandı, hepsi 200; dizinlenebilir 420 sayfanın hepsinde canonical kendine, yinelenen başlık 0, her sayfada tek H1, JSON-LD hatası 0, kurum şeması yalnızca ana sayfada; site haritası (420) dizinlenebilir sayfalarla birebir. Eski voltekno.com adresleri 308 → tür/marka sayfaları (örnek: `/ac-dc-sarj` → akü şarj cihazı türü, `/deye` → `/marka/deye`). Birim testi 68/68 (yeni: tür/marka eşleme tutarlılığı), Playwright 98/98.

**Tür metinlerinde teyit edilmesi iyi olanlar** (genel kabul gören kurallar veya katalogdan türetilmiş hesaplar; hatalı değil ama tedarikçi kılavuzuyla kontrol önerilir): hibrit inverterlerin bataryasız çalışabilmesi (TommaTech Uno/Trio), Victron BMS–akü eşleşmeleri, Digital Multi Control GX önerisi, dizi başına panel sayıları (−10 °C kabulüyle), kurşun-asit şarj akımı %10–20, jel akü %50 deşarj, kablo gerilim düşümü ≤ %3, rüzgar türbini yerleşim kuralı. **Katalog uyarısı:** Victron MultiPlus-II 48/3000 ve Blue Smart IP67 24/8 katalogda 120 V sürüm olarak geçiyor; doğruysa Türkiye şebekesine (230 V) uygun değildir, ürün sayfalarında belirtilmeli veya satıştan kaldırılmalı.

**Sıralama için kodla yapılamayanlar (sizde):** voltekno.com geçişi (test ortamı arama motorlarına kapalı, hiçbir şey sıralanmaz), Search Console alan adı doğrulaması + site haritası gönderimi + önemli sayfalar için "Dizine eklenmesini iste", Merchant Center ücretsiz ürün listelemeleri (akış hazır: `/feed/google-merchant.xml`; barkod/GTIN boş olması görünürlüğü sınırlar), Google Business Profile (Elazığ adresi), Bing Webmaster Tools. Yeni alan adında sıralama haftalar–aylar sürer.

## İstek turu 4 (19.10.2026 öğleden sonra)
| İstek | Durum | Not |
|---|---|---|
| Mobilde başlık: burger menü yeterli | ✅ `f77d2de` | ≤1024 px'te tek satır (burger, logo, arama, hesap, sepet). Kategori düğmesi, arama kutusu ve kategori hapları kalktı; kategoriler burger menüde, arama simgesi ince bir arama satırı açar (odaklı, sayfa değişince kapanır) |
| Mobilde hero kötü duruyordu | ✅ `f77d2de` | Görsel tam genişlikte 16:9 (altındaki boş gri alan gitti), başlık ve buton hemen altında; geniş 3. görselde ürünler kadrajda; pasif noktalar açık zeminde görünür |
| Fiyatın yanına "+KDV" yazılmasın | ✅ `d3a5aef` | Ürün sayfası: "KDV dahil ₺X". Sepet ve kartlarda zaten yalnızca KDV dahil |
| Klasik "yapay zekâ" ikonları hiçbir yerde olmasın | ✅ `d3a5aef` | Renkli kutu içindeki süs ikonları kaldırıldı (bölüm başlıkları, boş/başarı ekranları, iletişim/kargo/hakkımızda kartları, güven kartları, çerez ve e-posta bantları, sepet önerileri); "Hemen al" şimşeği, footer şimşek/kalkan, 3D Secure kalkanı, GES düğmesindeki güneş, onay işaretli maddeler. Kalan ikonlar işlevsel: menü, arama, hesap, sepet, oklar, silme, yükleniyor, satır içi hata/uyarı, WhatsApp, footer iletişim |
| Favoriye tıklayınca giriş/kayda yönlendirsin | ✅ `4598c6b` | Yukarıda manuel test #6 |
| Ekran görüntüsündeki sepet sayfası taşması | ℹ️ | 375 px'te sayfada genişliği aşan öğe yok, giriş kutuları 16 px (Safari otomatik yakınlaştırmaz); görüntü elle yakınlaştırılmış olabilir. Yayından sonra telefonda tekrar bakılmalı |

## Admin paneli girişi
| Ortam | Adres | Şifre | İki adımlı doğrulama |
|---|---|---|---|
| Yerel | http://localhost:3005/admin/auth | `.env.local` → `ADMIN_TOKEN` (37. satır) | Kapalı (`ADMIN_TOTP_SECRET` tanımlı değil) |
| Test (nextfirststep.com) | https://nextfirststep.com/admin/auth | Kişisel hesap: e-posta + şifre (Kullanıcılar sayfasından açılır). Ana şifre: e-posta boş bırakılır; değeri hPanel → Node.js → Ortam değişkenleri → `ADMIN_TOKEN` | Kişisel hesaplarda Hesabım'dan açılır. Ana şifrede **kapalı** (`ADMIN_TOTP_SECRET` canlıda tanımlı değil, 20.10 kontrolü) |

- 19.10'dan beri kişisel hesaplar var (e-posta + şifre, rol, iki adımlı doğrulama). Ana şifre acil durum girişi olarak kalır; değiştirmek için `ADMIN_TOKEN` değerini güncelleyip yeniden yayınlayın.
- İki adımlı doğrulamayı açmak için: `node scripts/admin-2fa-setup.mjs` → çıkan `ADMIN_TOTP_SECRET` değerini ortam değişkenine girin, `otpauth://` bağlantısını Google/Microsoft Authenticator'a ekleyin. Sonrasında girişte 6 haneli kod istenir.
- Hatalı denemelerde: IP başına 15 dakikada 5 deneme + IP'den bağımsız genel kilit (15 dakikada 20 hata → 15 dakika kapalı).

## Admin ↔ vitrin senkronu
- **Stok admin panelinden yönetilir:** Admin → "Ürünler & Stok" (`/admin/products`). Satır içi stok kutusu (Enter/odak dışı kaydeder), toplu "Stok ayarla", Stokta / Az / Tükendi sekmeleri. Ürün düzenleyicide (`/admin/products/duzenle`) fiyat, stok, varyant, görsel, açıklama.
- **Anında yansıma:** Stok, ürün, görsel, toplu işlem ve kampanya kayıtları ile sipariş/iptal/iade kaynaklı stok değişiklikleri vitrinin önbelleğini hemen tazeler (`lib/storefront-revalidate.ts`). Ürün listeleri, ana sayfa ve kategori kartları önbelleksiz `/api/products`'tan okur; ürün sayfası açıldığında da güncel veriyi çeker. Google Merchant akışı ve site haritası da tazelenir.
- Stok tek kaynaktan gelir: `StockOverride` (admin) → yoksa `ProductOverride.stock` → yoksa katalog. Sepet ve sipariş aynı kaynağı sunucuda yeniden kontrol eder.

## Firebase geçişi ve e-posta (18.10.2026)
| Adım | Durum | Not |
|---|---|---|
| Web yapılandırması → `voltekno-eticaret` | ✅ | `.env.local` `NEXT_PUBLIC_FIREBASE_*` + `.firebaserc`; eski değerlerin yedeği `.env.eticaret-54bdc.local` (git dışında) |
| `storage.rules` + `firebase.json` | ✅ | Yalnızca GES formu ekleri (`ges-attachments/`, ≤10 MB, görsel/PDF); geri kalan her şey kapalı |
| `FIREBASE_SETUP.md` | ✅ | Console adımları, CLI komutu, canlı sunucu notu |
| DNS: Firebase e-posta alan adı | ✅ / ⏳ | hPanel'e eklendi: SPF birleştirildi (`include:_spf.mail.hostinger.com include:_spf.firebasemail.com`), `firebase=voltekno-eticaret` TXT, `firebase1/2._domainkey` CNAME. CNAME'ler yayında; TXT'ler Hostinger'da henüz eski haliyle dönüyor → yayılınca Firebase'de **Verify** |
| SMTP metin sürümü | ✅ | `lib/email-smtp.ts`: metin sürümü artık `toPlainText` ile tam üretiliyor (önceden HTML'den kaba kırpılıp 500 karakterde kesiliyordu), `replyTo` eklendi (`SMTP_REPLY_TO`, varsayılan gönderen) |
| Gönderen adresi @voltekno.com | ❌ sizde | Yerelde ve büyük ihtimalle canlıda `SMTP_USER`/`SMTP_FROM` = `info@bataryakit.com`. Spam'e düşmemesi için Hostinger'da `@voltekno.com` kutusu (örn. `info@` veya `noreply@`) ile SMTP; SPF + Hostinger DKIM zaten hazır, alan adı hizası tutar |
| Servis hesabı anahtarı | ❌ sizde | Müşteri oturumu artık anahtarsız doğrulanıyor (19.10, `lib/firebase-id-token.ts`, Google açık anahtarları): Siparişlerim, sipariş sahipliği, üye siparişinin hesaba bağlanması çalışır. Anahtar gelene kadar çalışmayanlar: markalı doğrulama/şifre/hoş geldin e-postaları (Firebase'in kendi e-postaları gidiyor). 19.10 akşamından beri anahtarsız çalışanlar: hesap silme, yorum ve soru-cevap, iletişim mesajları (kendi veritabanımızda), terk edilmiş sepet e-postası (izin defterinden) |
| Firestore / Auth / Storage açılışı | ❌ sizde | Yeni projede Firestore API kapalı (veritabanı yok); Storage Blaze plan istiyor |
| Eski favori / adres / sipariş verisi | ✅ karar verildi | 18.10.2026 kararı: veri ve kullanıcı taşınmayacak, yeni proje boş başlıyor (sonucu aşağıda) |

**Veri bağımlılığı:** Prisma `User.id` = Firebase UID. `lib/customerAuth.ts`, UID bulunamayıp e-posta zaten kayıtlıysa yer tutucu e-postalı yeni kullanıcı açıyor; eski siparişler eski kayıtta kalıyor. Taşıma yapılmayacağı için eski hesaplar yeni projede olmaz: kullanıcılar yeniden kayıt olur, eski favori ve adresler görünmez, eski üye siparişleri sipariş takip formundan açılır. Test ortamında yalnızca test siparişleri var.

## Yayına hazırlık
| # | Adım | Durum | Not |
|---|---|---|---|
| 1 | Localhost açıldı | ✅ | http://localhost:3005 (dev) |
| 2 | Tüm sayfa taraması: hata, kırık link, başlık/açıklama/H1/alt | ✅ | Üretim derlemesinde 386 sayfa: hata dönen sayfa 0, kırık iç link 0. Düzeltilenler: 8 sayfada başlıkta "voltekno" iki kez yazıyordu; 16 sayfada açıklama 160 karakteri aşıyordu (Google'da kesiliyordu); /paketler başlık ve açıklamaları Türkçe karaktersizdi ("Bag Evi, Cozumleri"); ana sayfada H1 yoktu. Kalan 2 madde bilinçli: ödeme sayfasının H1'i istemcide çiziliyor, kategori bandındaki 3 görsel süs (alt boş olmalı) |
| 3 | Performans + erişilebilirlik (Lighthouse, mobil) | ✅ | Ana sayfa 20,8 MB → ~1 MB: 9 MB'lık iki paket görseli ve 1,8–2,4 MB'lık kategori görselleri WebP'ye çevrildi (toplam 33 MB → 1,3 MB); 173 KB'lık 592×810 favicon → 7 KB kare. Sayfa kayması (CLS) 0,93 → 0: header Suspense içinde sonradan akıtılıyor, önce 56 px yer tutucu çiziliyordu; footer da içerikten önce görünüp aşağı kayıyordu. Konsol hatası kalmadı (CSP, Firebase girişinin `apis.google.com` betiğini engelliyordu). Erişilebilirlik: soluk gri metin (#6b7c8f, kontrast 4,28) → #5d6e80 (5,2); sıralama kutusuna ad; sepet/dil/para birimi düğmelerinin adları görünen metinle uyumlu; slayt noktalarının dokunma alanı 24 px |
| 3a | İstekler: marka şeridi + bölüm hizası | ✅ | Markalar şeridi fareyle üzerine gelince durmuyor (yalnızca klavyeyle odaklanınca). Ana sayfa bölümleri, footer ve paket sayfaları header/hero ile aynı kabı kullanıyor (`lib/page-container.ts`): 375–1920 px arası her genişlikte sol/sağ kenarlar aynı |
| 3b | İstek: paket sayfaları sadeleştirildi | ✅ | "Hangi İhtiyaç İçin?" altındaki 5 paket sayfasından kaldırıldı: başlık altı açıklama ve hedef kitle metni, kullanım ve kategori rozetleri, "… Paketi ile Ne Yapabilirsiniz?" bölümü, ürünlerin altındaki kategori rozetleri, "Kullanım Senaryoları / Paket İçeriği Öne Çıkanlar" kartları, alttaki bağlantı kutuları. Kalan: görsel, başlık, butonlar, uygun ürünler, SSS |
| 4 | Güvenlik | ✅ | 73 admin API ucunun hepsinde yetki kontrolü; cron uçları CRON_SECRET'lı; ödeme dönüşleri imza doğruluyor; formlarda istek sınırı var. Eklendi: `frame-src` (Google ile girişin iframe'i engelleniyordu), `base-uri`, `object-src`, HSTS, nosniff, Referrer-Policy, X-Frame-Options, Permissions-Policy. npm audit: yalnızca Tailwind'in derleme aracı (braces) — canlı sitede çalışmıyor, düzeltmesi Tailwind 4 geçişi istiyor |
| 5 | İçerik | ✅ | "1.500+ ürün" → "340+" (Hakkımızda, blog); hesap menüsündeki boş "Puan ve Hediye Çekleri" sekmesi kaldırıldı ("yakında eklenecek" yazıyordu); footer tanıtım metni güncel ürün yelpazesine göre yenilendi (TR/EN) |
| 6 | Düzelt, test, commit, yayın | ✅ | `d52a075`, `9adcf5d`, `5919880`, `9283961` → nextfirststep.com (18.10.2026 15:42); canlı kontrol: sayfalar 200, eski kategori adresleri 308, ürün JSON-LD kargo ücreti desiden (22 desi → 325,76 ₺), yeni sözleşme bölümleri canlıda, log temiz |
| 7 | voltekno.com geçiş listesi | ✅ | Aşağıda "voltekno.com geçişi" |
| 8 | SEO (ayrı dal) | ✅ | `seo-alan-adi` dalı (`2e6d1b5`, klasör `../voltekno-seo`), **yayına dahil değil**: eski 132 voltekno.com adresi → yeni sayfalara kalıcı yönlendirme, kurum şeması yalnızca ana sayfada, ürün breadcrumb şeması. Ayrıntı: o daldaki `SEO-GECIS.md` |
| 9 | /products sunucuda çiziliyor + hız | ✅ | `083acc2`: ürün listesi ilk yüklemede HTML'de geliyor (24 ürün, yükleniyor göstergesi yok); filtre/sıralama/sayfa adresten okunuyor, birim testli (52 test). Kök `loading.tsx` ve dış Suspense kaldırıldı: içerik gizli akış bloğunda bekliyor, LCP ~10 s gecikiyordu → ana sayfa/kategori/ürünler LCP 2,7–3,2 s (Lighthouse mobil, devtools kısıtlaması). Ürün sayfası: Inter `latin-ext` + tek satır breadcrumb → CLS 0,21 → 0; önerilen ürünler şeridi yüklenince kendini 16 px kaydırıp Chrome'un LCP ölçümünü kesiyordu (scroll-padding ile düzeldi). İlk 4 ürün görseli öncelikli. Hydration hatası yok (TR/EN) |

| 10 | 19.10 turu: denetim, çeviri, senkron | ✅ | `ff6d9d1` (katalog), `4471547` (çeviri, denetim düzeltmeleri, admin ↔ vitrin senkronu, gizlilik kartı), `990ecba` (sekme başlıkları EN) → nextfirststep.com; canlıda 25 sayfa/uç 200, EN arayüz ve `lang` doğru, kart seçeneği POS yokken pasif. Doğrulama: 53 birim testi, tip kontrolü, Playwright 49 geçti, 1 atlandı, 1 kaldı ( test ürünü veritabanına doğrudan yazıldığı için derlenmiş Merchant akışında görünmüyor; admin üzerinden eklenen ürün akışı tazeler), yerel üretim derlemesinde admin stok 17→24 → ürün sayfası ilk istekte 24 |

## İstek turu 2 (18.10.2026)
| İstek | Durum | Not |
|---|---|---|
| Header başlıkları üzerine gelince alt menü | ✅ | Alt kategoriler (marka listesi kaldırıldı, `c2ef7af`); daralınca önce boşluk azalır, sonra başlık sayısı 6→5→4, ≤1024 px hamburger |
| İstek turu 3 (18.10) | ✅ | Menü kısmı 19.10'da commit'lendi (`c2ef7af`), yayın bekliyor. "Tüm Kategoriler" ve başlık menülerinde markalar yerine yalnızca alt kategoriler; ana sayfa paket kartlarındaki "ENERJİ PAKETİ" etiketi kaldırıldı; girişteki "ortak kullanılan cihazlarda işaretlemeyin" uyarısı kaldırıldı |
| Bağlantı Ekipmanı + Aksesuar birleşik | ✅ | Tek grup "Bağlantı Ekipmanı ve Aksesuar"; /category/aksesuar yönlendirilir |
| Havale/EFT %3 + e-posta (IBAN, sipariş no) | ✅ | Zaten vardı; ürün sayfasına havale fiyatı satırı eklendi; admin'e "Havale/EFT onayı" sekmesi |
| Ürün sayfası sadeleşti | ✅ | "Uygun mu?" formu, ikon kutuları, 15:00 yazısı, kayan galeri kaldırıldı; uyumlu ürünler sağ sütunda |
| Favori bildirimi sol altta + "Favorilere git" | ✅ | |
| Sepet önerilerinde tek tip "Sepete ekle" | ✅ | Varyantlı üründe varsayılan seçenek eklenir |
| Ödeme: 14 gün ibaresi ve butondaki tutar kaldırıldı | ✅ | Rozet satırının tamamı kaldırıldı (cayma hakkı sözleşmelerde yasal olarak duruyor) |
| Giriş/kayıt sade + Google/Facebook | ✅ | Canlıda görünmesi için Firebase'de sağlayıcılar açılıp env bayrakları verilmeli |
| Tüm ürünlerde desi | ✅ | 562 SKU'nun hepsinde (126'sı tahmin — Altech, Apex 280Ah, SPI sürücüler tedarikçiyle teyit edilmeli) |
| Kargo ücreti fiyat listesinden | ✅ | Desi tablosu + 30 üstü 20 ₺/desi + ağır yük + %22,35 vergi; ücretsiz kargo eşiği kaldırıldı |
| Sipariş no 2301'den | ✅ | ORD-2026-02301 |
| E-postada "Batarya Kit" yok, ferah düzen | ✅ | Gönderen adı her zaman Voltekno; e-posta genişliği 680 px |
| Sepette KDV | ✅ | Satır fiyatları KDV dahil; özette KDV satırı |
| Dil (EN) ve döviz geçişi | ✅ | Döviz çalışıyordu; İngilizcede sabit Türkçe metinler (üst şerit, footer, ana sayfa, kategori, ürün, sepet) çevrildi. Ürün adları/sözleşmeler Türkçe kalır |
| Çerez ve tüm sayfalar standart | ✅ | Eski sol kategori kenar çubuğu tüm sayfalardan kaldırıldı |
| Sözleşmeler kurumsal ve kapsamlı | ✅ | Ön Bilgilendirme Formu yeniden yazıldı (11 bölüm); Mesafeli Satış Sözleşmesi 3. madde güncellendi, Mücbir Sebep + Bildirimler/Delil eklendi — hukukçu kontrolü önerilir |
| GES: firma adı isteğe bağlı, fiyatlar güncel | ✅ | 27–40 bin TL/kWp (katalogdan), elektrik 3,8–5,2 TL/kWh |
| Footer iletişim ikonları beyaz | ✅ | WhatsApp yeşil kaldı |
| Profil | ✅ | Siparişler/takip, adresler, favoriler, ayarlar mevcut; girişsiz ziyarette boş hesap yerine girişe yönlendirme |
| /code-review | ✅ | 9 bulgu: 7 düzeltildi, 2 gerek yok |
| /design | — | Yalnızca sizin başlatabileceğiniz bir komut |
| /simplify | ✅ | 4 açıdan inceleme: fiyat yardımcıları tek yerde (KDV/havale), kargo hesabı sadeleşti ve memo, mevcut çeviri anahtarları kullanıldı, paket İngilizcesi veri kaynağında, ölü kod/anahtar/dosya silindi; SidebarLayout → PageContainer; gönderen adı SMTP_FROM_NAME (varsayılan Voltekno) |

- [x] Ürün görselleri: "görsel hazırlanıyor" kartlarının hepsi gerçek fotoğraflarla değiştirildi (24 SKU; katalogda kart kalmadı)
  - [x] TommaTech diyot modülleri (11 SKU) — aynı OEM modelin gerçek fotoğrafı (MDK 25/55/70/90/110A etiketli)
  - [x] TommaTech 22 kW split dış ünite, R32 split iç ünite (2), 300A şarj ünitesi, R serisi MC4-DC5525 kablo (5 SKU)
  - [x] Frecon 315/355/400/450 kW (aynı serinin büyük gövde fotoğrafı), Exelon PMAX-11P/12P (aynı gövde, filigransız), Havensis 20AES / MPS 3A (birebir model) — 8 SKU
- [x] Ana sayfadan "3 Adımda Enerji Çözümü" bölümü kaldırıldı
- [x] Adım adım manuel test — 15/15 adım geçti (1 hata bulundu ve düzeltildi, aşağıda)
- [x] Commit (`58f75f6`) + nextfirststep.com'a yayın + canlı kontrol

## Manuel test listesi
_Yerel sunucuda (localhost:3005), test verisiyle; e-postalar gönderilmeden `.data/mail-outbox`'a yakalanır. Admin adımları yalnızca yerelde geçerli ayrı bir test anahtarıyla yapıldı._

| # | Adım | Masaüstü | Mobil | Not |
|---|---|---|---|---|
| 1 | Ana sayfa: header, hero kaydırma, markalar, kategoriler, teklif bandı, footer | ✅ | ✅ | Hero slayt değişiyor, 13 marka, 9 kategori, teklif bandı; "3 Adımda" yok; yatay taşma yok |
| 2 | Header: Tüm Kategoriler menüsü, kategori linkleri, arama önerileri | ✅ | ✅ | Mega menü (alt kategoriler, markasız; 19.10'da yeniden kontrol edildi), arama önerisi 8 sonuç, Enter → ürünler |
| 3 | Kategori sayfası | ✅ | ✅ | Şarj Kontrol: 66 ürün |
| 4 | Ürün sayfası: galeri, varyant, sepete ekle, favori | ✅ | ✅ | 13 görsel, 2 varyant, favori ve sepete ekleme çalışıyor |
| 5 | Ürün kartı: sepete ekle, adet +/−, "Seçenekleri Gör" | ✅ | ✅ | Karttan ekleme ve adet artırma çalışıyor |
| 6 | Favoriler (misafir) | ✅ | ✅ | 19.10'dan beri üyelere özel: misafir kalbe dokununca giriş sayfasına gider (açıklamalı), ürün girişten sonra eklenir; /favorites misafire giriş/üye ol gösterir |
| 7 | Sepet: kargo çubuğu, sözleşme onayları | ✅ | ✅ | Ücretsiz kargo bilgisi (test 18.10 sabahı; eşik sonradan kaldırıldı, sepet artık desi ücretini gösteriyor), 3 onay kutusu |
| 8 | Ödeme: doğrulamalar, il/ilçe, kurumsal fatura | ✅ | ✅ | Boş formda "7 alanı kontrol edin" + alan mesajları; hatalı vergi no reddedildi; İzmir 30 ilçe |
| 9 | Havale ile sipariş + başarı sayfası + e-postalar | ✅ | — | ORD-2026-00053: IBAN'lar gösterildi; "sipariş alındı" + admin "yeni sipariş" e-postaları |
| 10 | Sipariş takibi → sipariş detayı | ✅ | — | Takip formu (POST) → detay 2,5 sn'de açıldı |
| 11 | Admin: giriş, Genel Bakış, sipariş arama | ✅ | — | |
| 12 | Admin yaşam döngüsü + müşteri e-postaları | ✅ | — | 00053: ödeme alındı → kargoya verildi (Aras, TEST123456) → teslim; 00055: ödeme alındı → hazırlanıyor. Müşteri e-postalarının hepsi geldi (ödeme alındı, hazırlanıyor, kargoda + takip linki, teslim edildi) |
| 13 | İptal talebi → admin onayı → iade e-postası + stok iadesi | ✅ | — | 00055 (hazırlanıyor): müşteri takip sayfasından talep etti → admin "Talebi onayla ve iptal et" (iade uyarısıyla) → CANCELLED / REFUNDED, stok 14→15; e-postalar: talep alındı (müşteri + admin), iptal edildi (iade tutarıyla) |
| 14 | Kayıt / giriş / şifremi unuttum doğrulamaları | ✅ | — | Kayıtta 4 alan uyarısı, girişte geçersiz e-posta uyarısı, şifremi unuttumda boş alan uyarısı (Firebase'e istek gönderilmedi) |
| 15 | Admin ürün düzenleyici | ✅ | — | Fiyat ve stok, Varyantlar, Görseller bölümleri |

_✅ geçti · ❌ hata (Not sütununda) · — uygulanmaz_

**Testte bulunan ve düzeltilen hata:** Admin paneline giriş yapılan tarayıcıda vitrin, admin oturumunu müşteri girişi sanıyordu (header'da isimsiz hesap menüsü, sepet boşalıyordu). Düzeltme: vitrin admin panelinin Firebase oturumunu misafir sayıyor (`lib/store/useFirebaseAuth.ts`), sunucu da bu kimliği müşteri olarak kabul etmiyor (`lib/customerAuth.ts`). Düzeltmeden sonra adım 12-13 aynı tarayıcıda admin oturumu açıkken geçti.

**Test sırasında görülenler:** İlk turlardaki zaman aşımlarının nedeni uygulama değil, dev sunucusunun sayfaları ilk açılışta derlemesi ve bilgisayarın test sırasında uykuya geçmesiydi; canlıda sayfalar önceden derlenmiş geliyor.

## 19.10.2026 turu
| İş | Durum | Not |
|---|---|---|
| Katalog denetimi (ad / görsel / açıklama) | ✅ | 340 ürün metni betikle, 893 görsel gözle tarandı. 5 açıklama hatası (kopya SSS, PWM/MPPT çelişkisi), 12 yanlış görsel düzeltildi (MRN akü etiketleri, SPI 220–630 kW kabin, Victron Phoenix 24/250, Peak Power Pack 20/30Ah). Düzeltmeler içe aktarmada kalıcı: `scripts/data/catalog-fixes.json`, `image-overrides.json`. Rapor: `URUN-DENETIMI.md` |
| Apex APX2440 görseli | ⚠️ sizde | Distribütörün sayfası da APX2420 (24V-20A) fotoğrafını kullanıyor; etiket rötuşu otomatik güvenlik kontrolünce engellendi. Electrozirve'den gerçek fotoğraf istenmeli |
| Havensis HV MPS "Solar-80AMPS 45A" | ⚠️ teyit | Model adı ile akım çelişiyor (Excel'de de böyle); tedarikçiye sorulmalı |
| İngilizce / Türkçe | ✅ | Dil değişince sayfa tam yenileniyor (önceden parça parça değişiyordu), `<html lang>` sunucudan doğru. ~60 dosyadaki sabit Türkçe metin çevrildi (sepet, ödeme, giriş/kayıt, hesap, siparişler, iletişim, SSS, kargo, hakkımızda, GES, karşılaştır, paketler + SSS, favoriler, arama kutusu, footer). Ürün adları, blog yazıları ve sözleşmeler Türkçe kalır |
| Mobilde ürün görseli kayıyordu | ✅ | Büyük görsel (lightbox) body'ye taşındı: başlığın üstünde, ortalı, arka plan kaymıyor, Esc ile kapanıyor; noktalar 44 px'e büyümüyor |
| Uçtan uca denetim | ✅ | Üretim derlemesi (425 sayfa), 53 birim testi, 45 Playwright testi, 388 sayfalık tarama (hepsi 200, kayıp görsel yok), mobilde alışveriş akışı, 3 alanda kod incelemesi. Rapor: `SITE-DENETIMI.md` |
| Kritik düzeltmeler | ✅ | Müşteri oturumu anahtarsız doğrulama (Siparişlerim boş geliyordu); şifre sıfırlama hiç e-posta göndermiyordu → Firebase e-postasına düşüyor |
| Sipariş/stok düzeltmeleri | ✅ | Kısmi iadede çift stok iadesi; havale bildirimi yapılmış siparişin otomatik iptali; son ödeme günü İstanbul saatiyle gün sonu (e-posta = iptal anı); aynı e-posta/telefona en fazla 3 ödenmemiş havale siparişi; kart onayı-iptal yarışı; stok bildiriminde çift e-posta |
| Güvenlik düzeltmeleri | ✅ | Admin girişine IP'den bağımsız kilit; açık yönlendirme (`/%09/evil.com`); GES ek dosya bağlantıları yalnızca kendi Storage klasörümüzden; sipariş uçlarında 500 hatası |
| Müşteri hesabı | ✅ | Siparişler + takip no + kargo takip bağlantısı, sözleşme/fatura PDF, iade/cayma, havale bildirimi, adresler, favoriler, bülten onayı. Yeni: "Gizlilik ve Belgeler" (8 yasal metin, çerez tercihini yeniden seç, KVKK başvurusu e-posta/KEP); Google/Facebook kullanıcısı hesabını silebiliyor ve ona şifre kartı gösterilmiyor |
| Ödeme sayfası | ✅ | Sanal POS yokken kart seçeneği pasif ("yakında") |
| SEO | ✅ | Sepet/giriş/kayıt/şifre/profil/favoriler kendi başlığında + noindex; kopya ürün başlıkları (Likya, MDK110A) ürün adından; giriş sayfalarında tek h1 |
| Sözleşmeler ↔ voltekno.com | ✅ | 8 belge karşılaştırıldı: 7'si aynı içerik; Ön Bilgilendirme Formu yeni siteye göre genişletilmiş (havale %3, 3 gün, desi kargo, TCMB kuru), hükümleri canlıyla çelişmiyor |
| voltekno.com SSL zinciri | ⚠️ sizde | Sunucu ara sertifikayı göndermiyor (Node vb. bağlanamıyor); Hostinger'a geçişte kontrol edin |
| Çeviri ayrıntılı kontrol | ✅ | `messages/tr.json` ↔ `en.json`: 734/734 anahtar, yer tutucular uyumlu; EN'de Türkçe kalan `header.categoryESS` düzeltildi. 27 sayfa İngilizce modda tarayıcıda tarandı (istemcide çizilen metin, placeholder, aria-label dahil). Düzeltilenler: sekme başlıkları (sepet, ödeme, giriş, kayıt, hesap, siparişler…), kart reddi/3D Secure mesajları, **sunucu hata mesajları** (stok, kupon, sipariş sınırı, iptal/iade, havale bildirimi) ve **giriş/kayıt hataları** ("E-posta adresi veya şifre hatalı" vb.) artık İngilizcede İngilizce (`lib/server-error-i18n.ts`, birim testli), şirket faturası doğrulama mesajları. Katalog verisinden gelen Türkçe bölümler (ürün açıklaması, teknik özellik tablosu, kategori filtre başlıkları) `lang="tr"` ile işaretlendi |
| GitHub CI (quality) | ✅ | `d`/`tx implicitly has an 'any' type` hataları: CI Node 20 kullanıyordu, `firebase-admin` 14 ve proje Node ≥22 istiyor → npm isteğe bağlı `@google-cloud/firestore`'u atlıyor, Firestore tipleri çözülmüyordu. CI Node 22, `actions/checkout@v5` + `setup-node@v5` (Node 20 uyarısı), `ubuntu-24.04` sabit (Ubuntu 26 geçişi). Site denetimi "ŞİKÂYET"teki Â'yı bozuk kodlama sanıyordu; kalıp düzeltildi |
| npm audit (7 yüksek) | ⚠️ | Hepsi tek açık: `braces` ≤3.0.3 (GHSA-vfj7-8cjw-p6xm), Tailwind 3 ve ESLint üzerinden yalnızca derleme sırasında dosya taramasında; çalışan site kullanıcı girdisiyle kullanmıyor, canlıda istismar edilemez. Yamalı `braces` yok; çözüm Tailwind 4 geçişi (ayrı iş olarak önerildi) |
| Bilerek Türkçe kalanlar | ℹ️ | Ürün adları/açıklamaları/teknik özellikler (340 ürün, 441 özellik başlığı), blog yazıları, yasal metinler, sipariş e-postaları ve PDF belgeler. Tam İngilizce katalog ve dile göre e-posta ayrı bir iş olarak önerildi |
| Akış senaryoları | ✅ | `tests/flows.spec.ts` (yalnızca `FLOW_TESTS=1`, SMTP'si kapalı + kopya veritabanlı sunucuda; launch.json "Flow Test 3009"): arayüzden misafir havale siparişi (boş form, geçersiz e-posta, sözleşme onayı), stok ayrılması, sipariş takibi (doğru/yanlış bilgi), havale bildirimi, admin ödeme onayı → hazırlanıyor → kargo + takip no → müşteri takip no'yu görüyor, stoktan fazla adet / tükenen ürün reddi, istemciden gönderilen fiyatın yok sayılması, 3 açık sipariş sınırı (4. → 429), misafir iptali + stok iadesi, teslim sonrası cayma → admin onay → teslim alındı → stok iadesi, admin stok → ürün sayfası anında, admin %10 kampanya → vitrin + sipariş fiyatı → silince kalkıyor, mobilde (Pixel 5) sipariş + yatay taşma yok, İngilizce sipariş + İngilizce hata mesajları + sepette satıştan kalkmış ürün uyarısı, 27 sayfada İngilizce tarama (canlıda da: 27/27). Son koşu 43/43 + mevcut testler 91/92 (kalan: bilinen Merchant test ortamı durumu). Test sunucusu loglarında hiç e-posta gönderilmediği doğrulandı |

## Bilinen sınırlamalar
- Gerçek Firebase hesabı açılmadan giriş yapılmış kullanıcı ekranları (profil, doğrulama bandı) tarayıcıda denenemiyor.
- Kart ödemesi: banka sanal POS bilgileri (`POS_CLIENT_ID`, `POS_STORE_KEY`, `POS_GATEWAY_URL`) girilene kadar kapalı; girilince ödeme sayfasında kendiliğinden açılır (Havale/EFT çalışıyor).
- Kargo ücreti desiye göre, Geliver ve Navlungo tekliflerinin en ucuzu (akülü sepette yalnızca Navlungo); ücretsiz kargo eşiği yok. Ayrıntı: "Kargo: Geliver + Navlungo".
- Açık öneriler (`SITE-DENETIMI.md` §4): sipariş idempotency anahtarı, fiyat değişince 409 uyarısı, kargodan N gün sonra otomatik "teslim edildi", istemci paketinden kataloğun çıkarılması, nonce tabanlı CSP.

## voltekno.com geçişi (sizde)
1. SEO kararı: `seo-alan-adi` 19.10'da `urun-katalogu-ikas`'a birleşti (`9ad9119`) ama yayına alınmadı. voltekno.com'a geçişte eski adres yönlendirmeleri (132 adres) gerekli; SEO'yu yayınlamak için bana "yayınla" demeniz yeterli
2. voltekno.com ortam değişkenleri: `NEXT_PUBLIC_SITE_URL=https://voltekno.com`, `NEXT_PUBLIC_NOINDEX` **olmamalı**, mutlak `DATABASE_URL`, yeni güçlü `ADMIN_TOKEN` + `ADMIN_TOTP_SECRET` (`node scripts/admin-2fa-setup.mjs`; test ortamında da şu an kapalı), `SMTP_FROM` yeni gönderim adresi (görünen ad `SMTP_FROM_NAME`, varsayılan Voltekno), `CRON_SECRET`, banka POS bilgileri, `MEDIA_DIR`
2a. Zamanlanmış görevler: uygulama içi zamanlayıcı havale takibini ve yedeği kendisi çalıştırır (E1); `BACKUP_DIR` derleme klasörünün dışında olmalı
3. Firebase (yeni proje `voltekno-eticaret`, adımlar `FIREBASE_SETUP.md`): Firestore/Auth/Storage açılışı, Authorized domains'a voltekno.com + www, servis hesabı anahtarı; Google/Facebook girişi için sağlayıcıları açıp `NEXT_PUBLIC_GOOGLE_SIGNIN_ENABLED=true` / `NEXT_PUBLIC_FACEBOOK_SIGNIN_ENABLED=true` (Facebook için App ID/Secret); `firebase deploy --only firestore,storage --project voltekno-eticaret`. Canlı sunucuda `NEXT_PUBLIC_FIREBASE_*` + `FIREBASE_ADMIN_*` güncellenip yeniden derlenmeli
3a. E-posta: `SMTP_USER`/`SMTP_FROM`/`SMTP_PASSWORD` → `@voltekno.com` kutusu (şu an `info@bataryakit.com`); DMARC birkaç hafta `p=none` + rapor (`rua`) ile izlenip sonra `p=quarantine`
4. DNS: ikas → Hostinger; www/http tek adımda kanonik adrese
5. Search Console + Bing: sitemap gönder; Merchant Center akışı `/feed/google-merchant.xml`; 2 hafta 404 izle
6. Teyit edilecekler: tahmini desi değerleri (özellikle Altech türbinleri, Apex 51,2V 280Ah, SPI 315–630 kW sürücüler), sözleşmelerin hukukçu kontrolü, GES fiyat bandı

## Yayın
- Test ortamı: https://nextfirststep.com (arama motorlarına kapalı)
- Son yayın: `f1025fa` (21.10.2026), dal `yayin-pro-seo-haric`: Navlungo gönderi entegrasyonu, Geliver takibi, akü/batarya iletişimle satış, desi ve görseller, Codex'in teslimat tahmini, sipariş tekrar koruması, fiyat değişimi onayı, kısmi iadede kargo, ödeme sayfasında fiyat eşitleme. `7381cb9`'dan sonraki SEO dışı 10 commit cherry-pick edildi, yalnızca DURUM.md çakıştı. Yayın öncesi bu dalın kendi derlemesinde: tip kontrolü temiz, birim testleri 112/112, derleme 429 sayfa, Playwright (akış testleri dahil) 92 geçti / 0 kaldı; yerelde 25 akü iletişim kutusunda, akülü sipariş 400, aküler akışta yok. Sunucuda `prisma db push` yeni sipariş alanını ekledi. Canlı: 29/29 genel kontrol (sayfalar, sağlık ucu, yetki korumaları, SEO adresleri 404, noindex), 9/9 akü kontrolü (340 ürün, 25 akü iletişim kutusunda, akülü sipariş ve sepet doğrulaması reddediyor, Merchant akışında 315 ürün ve akü yok, kargo sayfası cümlesi, ödeme sayfası açılıyor), sunucu kaydında `journal_mode=wal`, zamanlayıcı başladı, hata yok.
- Bir önceki yayın: `7381cb9` (20.10.2026 20:52): Geliver + Navlungo kargo kıyası
- Bir önceki yayın: `3008ea6` (20.10.2026 19:12): koyu temanın kaldırılması, varsayılan Türkçe, adet kutusu, "Sepete git"
- Bir önceki yayın: `25ae00a` (19.10.2026 19:27): profesyonel seviye, SEO hariç. dal `yayin-pro-seo-haric` = `f6d2f1f` + profesyonel seviye (`e8806cf`) cherry-pick. SEO commit'leri (`9ad9119` eski adres yönlendirmeleri, `6a30301` tür/marka sayfaları) bilerek dışarıda. Tek çakışma ürün sayfasındaydı: SEO'nun kırıntı şeması alınmadı, gerçek puan alındı. Yayın öncesi: tip kontrolü, birim testleri 77/77, derleme 429 sayfa, Playwright 99 geçti / 0 kaldı, yönetici, rol ve ticaret akışları yerel kopyada geçti. Canlı kontrol: 14 sayfa 200, `/api/health` 200 (veritabanı ok), yorum/soru API'leri Prisma'dan, 7 yönetim ucu yetkisiz 401, giriş ekranında e-posta alanı, ürün şemasında sahte puan yok, SEO tür/marka adresleri 404, site noindex. Sunucu kaydında `journal_mode=wal` ve zamanlayıcı başladı, hata yok
- Önceki yayın: `df5aa58` (19.10.2026 15:56): eksiklerin çözümü, mobil başlık + hero, süs ikonları, KDV etiketi, üyelere özel favoriler. Zamanlayıcı canlıda doğrulandı
- Canlıda olmayanlar (21.10 yayından sonra): yalnızca SEO (`9ad9119`, `6a30301`, `5122e7a`). SEO da yayınlanacaksa `urun-katalogu-ikas` doğrudan yayınlanabilir
- 19.10 öğleden sonraki commit'lerin hepsi `df5aa58` ile canlıda; `urun-katalogu-ikas` GitHub'a gönderildi. `main`'e ileri sarma (çakışmasız) ve `origin` adresinin değiştirilmesi izin sisteminde reddedildi, sizin yapmanız gerekiyor
- GitHub deposu taşınmış: `https://github.com/info-aftsoftware/eticaret.git` (eski adres yönlendiriyor, aynı depo olduğu doğrulandı; `git remote set-url origin https://github.com/info-aftsoftware/eticaret.git`). Dal: `urun-katalogu-ikas`.
