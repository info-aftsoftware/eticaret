# Proje Durumu — Voltekno e-ticaret

_Son güncelleme: 28.10.2026 (SEO + yapay zekâ araması turu `35836fd`, voltekno.com geçişi başladı; son yayın `d4c2137`) · Bu dosya çalışma boyunca sürekli güncellenir. Güncel yapılacaklar listesi aşağıda **"Kalanlar"** bölümündedir. `YAPILACAKLAR.md` 18.10'dan beri güncellenmedi; oradaki bazı açık maddeler yapıldı (aşağıda "YAPILACAKLAR.md'de geçersiz kalanlar"). Son denetim raporları: `SITE-DENETIMI.md` (uçtan uca), `URUN-DENETIMI.md` (katalog)._

## Şu an yapılan
**28.10.2026 — voltekno.com geçişi başladı** (ayrıntı ve sıra: aşağıda "voltekno.com geçişi"). Kararlar: SEO dahil, veritabanı test sitesinden kopya, Firebase şimdilik eski proje, gönderen `noreply@voltekno.com`. Yerel prova geçti (132/132 eski adres 308). **Sırada sizin hPanel adımlarınız:** G2 ortam değişkenleri, G3 veritabanı + `media/` kopyası, `noreply@voltekno.com` kutusu. Sonra ben voltekno.com'a yükleyip DNS öncesi test ederim; DNS'i (G6) siz çevirirsiniz.

**29.10.2026 — sıralı yapılacaklar listesi** aşağıda "Yapılacaklar — sıralı"; 1. madde (İngilizce `/en/`) başladı. Geçişte ürün verisi kontrolleri: "voltekno.com geçişi" → "Canlıya alınca — ürün yapılandırılmış verisi".

**Canlıda (nextfirststep.com, son yayın `d4c2137`, 25.10.2026 akşam, SEO hariç): ürün sayfasında "Uyumlu ürünler" bölümü kaldırıldı; öncesinde `c95249c` ile yerel staging testlerinde (kontrol listesi 23–34) bulunan düzeltmeler — çerez tercihleri, kurulum notu e-postada, tek yönetici bildirim adresi, teklif doğrulama bildirimi, sahte POS dönüşü e-posta atmıyor, eski iKAS kök adresleri yönlendiriliyor, yapısal veri alan adı; öncesinde (`d8a3483`, 25.10) müşteri kontrol listesi 1. öncelik kod maddeleri 2–6, voltajı tanımsız DC ürünleri ve 2. öncelik maddeleri 10–17, 19–22 (aşağıda); ürün grupları ve yönetim paneli denetimi A01–A18 (`c095ad4` ile 23.10) ve öncesi —** 21.10'daki her şey (Navlungo entegrasyonu, Geliver takibi, akü için iletişim, desi ve görseller, teslimat tahmini, sipariş korumaları) ve 22.10 turları: mobil hero ve paket kartları, yorum yalnızca teslim almış üyeye, sayfalama ve gezinme kuralları, açılır menünün ekrana sığması, yönetim girişi düzeltmesi, Victron 120 V ürünlerin kaldırılması (338 ürün), kısa akü metni, resmî kaynaklı desiler, kargo kaynağı etiketi, iptal ve iadelerin cirodan düşmesi, Geliver'den gönderi oluşturma (anahtar girilene kadar kapalı), hesaba özel favoriler, telefon ve e-posta doğrulaması, AFT Power ürünleri (3 şarj istasyonu fiyatlı ve kurulumlu, 6 depolama ürünü teklifle; katalog 347 ürün).

**Yayın `c95249c` (25.10.2026 akşam, sizin onayınızla):** yayın dalında `24f34a5`, `e159f90`, `c95249c`. Yayın dalı birim testleri 185/185; Hostinger derlemesi 3 dakikada tamamlandı (Next.js / Node 22, ayarlar boşalmadı). Canlıda yalnız GET ile: ana sayfa, Solar Akü, AFT ürünü, karavan, /ges, /contact, Hakkımızda, /admin, /api/health 200; `/tommatech-16bb-…` 308 → ürün sayfası, kaldırılan iki Victron ürünü 308 → kategorisi; footer'da "Çerez tercihleri"; yapısal veride sabit voltekno.com ve doğrulanmamış sosyal hesap yok; robots `Disallow: /` (test alan adı). Sipariş ve form gönderilmedi.

**Yayın `d4c2137` (25.10.2026 akşam, sizin onayınızla):** ürün sayfasındaki "Uyumlu ürünler" bölümü kaldırıldı; sayfanın altındaki "Önerilen ürünler" duruyor, `/api/products/[id]/related` yalnız önerilenleri döndürüyor. Hostinger derlemesi 3 dakika (Next.js / Node 22, ayarlar yerinde). Canlıda: TOPCon panel sayfasında uyumlu bölümü yok, önerilen 8 ürün, ilişkili ürün isteği 200, konsol hatası yok.

**Önceki yayın `d8a3483` (25.10.2026, sizin onayınızla):** yayın dalında `3fce868` (P1), `0f5a58c` (voltaj), `d8a3483` (P2). Hostinger derlemesi 3 dakikada tamamlandı (yapı ayarı Next.js / Node 22 doğru, ayarlar boşalmadı). Canlıda yalnız GET ile bakıldı: ana sayfa, Solar Akü, /paketler ve karavan/marin, /ges, /contact?talep=urun, Hakkımızda, karşılaştırma, SSS, AFT ve PWM ürün sayfaları, /admin, /api/health hepsi 200; eski "Paketleri", "Mutlu Müşteri", "7/24" ifadeleri yok; Solar Akü'de voltaj/kapasite/enerji/kimya süzgeçleri ve KDV dahil fiyat; yeni ilişkili ürün ucu çalışıyor (PWM şarj cihazına 12 V aküler, voltajı tanımsız Apex'e DC ürünü yok, 8 öneri); AFT 5,4 kWh kapasitesi model bazında. Sipariş ve form gönderilmedi.

**Kodda hazır, kararınızı bekleyen:** İngilizce site (`ingilizce-tam` dalı, 3 commit, 106 dosya / ~13 bin satır, 22.10'dan beri ana daldan ayrı; son commit'i SEO) ve SEO (`9ad9119`, `6a30301`, `5122e7a`, "SEO yayınlamıyoruz" kararıyla bekliyor). **Yayın kuralı:** canlıya yalnızca siz söylediğinizde yayınlanır; her yayından önce güvenlik taraması temiz olmalı (29.10 kararı, "Yapılacaklar — sıralı" 0. madde); yayın ortak klasörden değil SEO'suz yayın dalından (`yayin-pro-seo-haric`) yapılır. **Yayın dalı farkı:** orada ana sayfa tek dosya (`app/page.tsx`), ana dalda `app/page.tsx` + `app/HomePageClient.tsx`; kategori sayfasında SEO'ya ait `CategoryTypeLinks` yok. Bu dosyalara dokunan commit'ler aktarılırken değişiklik elle taşınır (24.10'da iki kez yapıldı).

## Yapılacaklar — sıralı (29.10.2026)
_Sıra: önce sizin onayladığınız ve yalnız kodla yapılabilen işler, sonra sağlayıcı/tedarikçi bekleyenler. **voltekno.com geçişi bu listeden bağımsız yürür** (G2, G3 ve `noreply@voltekno.com` kutusu sizde; sonra G4–G8 bende; ayrıntı "voltekno.com geçişi"). Eski ayrıntılı liste: "Kalanlar (21.10.2026 kontrolü)"._

| # | İş | Kim | Durum / not |
|---|---|---|---|
| 0 | **Güvenlik taraması — yayın kapısı** | Siz (eklentiyi kurmak) → ben | **Karar (29.10.2026, siz):** Cloudflare güvenlik denetimi becerisiyle önce art arda taramalar (bulgu → düzeltme → yeniden tarama, temiz çıkana kadar), sonra **her canlıya alımdan önce** tarama. Tarama temiz değilse yayın yapılmaz (voltekno.com geçişinde G4'ten önce, nextfirststep.com yayınlarında da). Katalogda tam bu adla bir eklenti yok; en yakınları: Cloudflare (Cloudflare'in resmî beceri paketi, güvenlikten çok dağıtım odaklı), claude-security (Anthropic; kod açığı taraması ve doğrulanmış yamalar), Security Audit Loop (tarama–düzeltme–yeniden tarama döngüsü, sırlar/bağımlılıklar/altyapı). Hangisi kurulursa onunla başlanır. Site Cloudflare arkasında değil (DNS Hostinger'da); Cloudflare'e alınacaksa ayrı karar. Tarama kayıtları bu bölüme yazılır. **1. tur (29.10):** aşağıda "Güvenlik taraması — 1. tur"; 1. ve 2. turda 3 yüksek, 8 orta bulgu kodda kapandı. **Yayından önce sizde:** Firestore kurallarının yayını ve eski Firebase oturumlarının iptali (S2), S7 kararları, canlıda Turnstile anahtarları (S15). Güvenlik eklentisi kurulunca 3. tur onunla |
| 1 | **İngilizce site, `/en/` adresleriyle + hreflang** | Ben | **Başladı (29.10).** Karar (29.10, siz): İngilizce `/en/` önekli adreslerde, Türkçe kökte kalır. Adımlar: (a) `ingilizce-tam` dalını (3 commit, 106 dosya, ~13 bin satır; ana dal o günden beri 38 commit ilerledi) ana dala birleştir: deneme birleştirmesinde 23 dosyada ~30 çakışma (çoğu sayfa başlıkları/metadata ve ürün sayfası); (b) dil çerezden değil adresten: `/en/...` → aynı sayfa İngilizce, bağlantılar dili korur, dil seçici adresi değiştirir; (c) her sayfada `tr` / `en` / `x-default` hreflang ve canonical, site haritasında dil eşleri, İngilizce ürün şeması ve `/en/llms.txt` yok (tek dizin yeterli); (d) çeviri tarama testleri, `audit:site`, `audit:product-ld`, Playwright. Ayrı dalda yapılır, ana dal voltekno.com geçişi için yayına hazır kalır; İngilizcenin yayını ayrıca sizin onayınızla. **İlerleme (29.10):** 28.10 turu ana dala `52aa147`; (a) ✅ birleştirme `ingilizce-en` dalında `695cd76` (klasör `.claude/worktrees/ingilizce-en`, push yok): 23 dosyadaki çakışmalar 28.10 SEO turu yönünde çözüldü (Voltekno yazımı, paylaşım görseli, "çözümler" adı, KDV dahil fiyat gösterimi, kaldırılan uyumlu ürünler, kurulum notu İngilizcesiyle), sonradan eklenen 9 AFT ürününün İngilizcesi yazıldı (katalog kapsamı 347/347, özellik ve açıklama parçaları eksiksiz); tip denetimi temiz, lint 0 hata, birim testi 205/205. İngilizce dalı veritabanına `locale` sütunları ekliyor: o klasörün kendi Prisma istemcisi var, ana klasörünkü değişmedi.

**(b) ve (c), 29.10, `ingilizce-en` dalında `6d0574f` (push yok):**
- **Dil adresten:** `middleware.ts` `/en/...` adresini aynı sayfaya yeniden yazıyor ve `x-locale` veriyor. `/en/api` ve `/en/admin` öneksiz adrese 308 ile gidiyor. Sayfanın dili `NEXT_LOCALE` çerezine yazılıyor; API'ler dili bu çerezden okuyor.
- **Bağlantılar:** `lib/i18n/navigation.tsx` içinde dile duyarlı `Link`, `useRouter` ve `usePathname` var. 65 vitrin dosyası bunlara geçti; yönetim paneli öneksiz kaldı. Sunucu yönlendirmeleri ve e-postalardaki sipariş, sepet ve ürün bağlantıları da alıcının dilinde.
- **Dil seçici:** Aynı sayfanın diğer dildeki adresine gidiyor.
- **Uyarı bandı:** "Yalnız menüler çevrildi" bandı kaldırıldı.
- **SEO:** Canonical sayfanın kendi dilinde. Her sayfa `tr`, `en` ve `x-default` (Türkçe) hreflang veriyor (`lib/i18n/alternates.ts`). İngilizce sayfalarda yapılandırılmış verideki adresler de `/en` önekli. Site haritasında her sayfa iki dilde ve dil eşleriyle; İngilizcesi olmayan blog yazısı ve yasal metin yalnız Türkçe.
- **Yerel ölçüm (geliştirme sunucusu):**
  - 11 sayfanın hepsi doğru dilde.
  - İngilizce sayfalardaki site içi bağlantıların hepsi `/en` önekli.
  - Canonical ve hreflang doğru.
  - Eski kategori adresi `/en/category/akuler` → `/en/category/solar-aku`.
  - Dil seçici çalışıyor.
  - Birim testi 209/209; `locale-path.test.ts` yeni.
- **Üretim derlemesi:**
  - İlk deneme Next iç hatasıyla durdu. Sebep ortamdı: paketler üst klasörden geliyordu. Klasöre kendi `node_modules`'u kurulunca derleme geçti.
  - Üretim sunucusunda aynı 11 sayfa doğru çıktı; var olmayan marka adresi iki dilde 404.
  - Önbellek dilleri karıştırmıyor: aynı ürün art arda iki dilde açıldığında her yanıt kendi dilinde. Sayfalar istek anında üretiliyor.
  - Site haritası 856 adres (428 Türkçe, 428 İngilizce), 2.568 hreflang satırı.
  - İngilizce ürün şemasında ad İngilizce; ürün, varyant ve kırıntı adresleri `/en` önekli.
- **(d) ✅ `942ce65`:**
  - İngilizce akış testleri artık `/en` adreslerini açıyor.
  - Ana dalda sonradan eklenen türetilmiş filtrelerin (sistem voltajı; kapasite, enerji, güç ve akım aralıkları; hücre tipi; faz) İngilizcesi eklendi. Testler bunları kategori sayfalarında Türkçe yakalamıştı.
  - Üretim derlemesine karşı: İngilizce testler 72/72; akış ve duman testlerinin tamamı 89/89; birim testleri geçiyor.
- **Kalan:**
  - Ana daldaki güvenlik düzeltmeleri commit edilmedi (bekletiliyor). Commit'lenince bu dala birleştirilmeli.
  - İngilizcenin yayını sizin kararınız. |
| 2 | voltekno.com açılınca ürün verisi kontrolleri | Ben + siz | Aşağıda "voltekno.com geçişi" → "Canlıya alınca — ürün yapılandırılmış verisi" (G8 ve G10 ile birlikte) |
| 3 | GTIN / barkod alanı | ✅ kod (29.10, ana dalda, commit edilmedi) · tedarikçi (veri) | **Kod hazır:**<br>• `lib/gtin.ts` barkodu doğruluyor: 8, 12, 13 ya da 14 hane ve GS1 kontrol basamağı; SKU barkod sayılmıyor.<br>• İçe aktarıcı Excel'deki `Barkod Listesi` sütunundan ürüne ve varyanta ilk geçerli barkodu yazıyor (Python'da aynı kural). Barkod sunucu tarafı ayrıntı dosyasında tutuluyor, istemci paketine girmiyor.<br>• Veritabanında yeni sütun var: `ProductOverride.gtin`. Varyant barkodu varyant listesinde. **Yayında `prisma db push` gerekir.**<br>• Panelde ürün düzenleyicide "Barkod (GTIN / EAN-13)" alanı (tek seçenekli ürün) ve varyant tablosunda SKU'nun altında barkod kutusu var. Geçersiz barkod anında uyarı veriyor ve sunucu reddediyor. Yeni ürün oluşturmada da geçerli; işlem kaydına giriyor.<br>• Ürün şemasında `gtin` (ürün ya da varyant) yazılıyor. Merchant akışında barkod varsa `g:gtin` gidiyor; yoksa eskisi gibi `identifier_exists=no`. Varyantlı üründe akış, fiyatı gönderilen varsayılan varyantın barkodunu kullanıyor.<br>**Doğrulama:** Birim testi 198/198 (yeni `gtin.test.ts`). Yerelde 8/8 uçtan uca deneme geçti: geçersiz barkod 400, geçerli barkod şemada ve akışta, varyant barkodu şemada, geçersiz varyant barkodu 400; kayıtlar geri alındı. Panel ekranı tarayıcıda açılarak görülmedi (tip denetimi ve API denemesi temiz).<br>**Web'den barkod araştırması (29.10):**<br>• **2. tur (aynı gün):** Victron'da çelişen 5 üründen 4'ü çözüldü. Her birinde 4–8 bağımsız site aynı barkodu gösteriyor; farklı gösteren sitelerin kardeş ürünün barkodunu kopyaladığı bulundu. **Victron toplam 67/68.** Yerelde akışta 59 Victron ürününün 58'i barkodlu; tek eksik Zigbee–RS485 dönüştürücü (kutudan bakılmalı; olası barkod `8719076048268`).<br>• **TommaTech:** Almanya'da pazar yerlerinde listelenmiyor; kendi siteleri ve bayileri barkod vermiyor; markaya ait barkod bloğu görünmüyor. **Bulunamadı.**<br>• **Onay bekleyen 21 barkod** (`gtin.json` → `pending`; kod okumuyor):<br>  – **Alpex, 19:** Markanın kendi sitesi ve ikinci bir satıcı aynı barkodu gösteriyor. Ancak blok ABD önekli (`0715936`); kime kayıtlı olduğu GS1 Verified'da doğrulama kutusu nedeniyle sorgulanamadı. **Sizde:** gs1.org/services/verified-by-gs1 adresinde `00715936350876` aratılınca çıkan firma Alpex ya da sahibi ise etkinleştirilir.<br>  – **İstabreeze, 2:** WindSafe 2000W ve 1500W; GS1 Almanya bloğu `4262405`, markanın AB mağazasında tutarlı. Mağazayı Bulgaristan'daki bir şirket işletiyor; sizin onayınızla etkinleşir.<br>• **Havensis:** Barkodlar distribütör Alpex'in bloğunda; kullanılmadı.<br>• **AFT Power:** Sizin markanız; barkodları kendi GS1 Türkiye (`869`) önekinizle vermeniz gerekir.<br>• **Victron (1. tur):** 68 SKU'nun 63'ü bulundu. Hepsi Victron'un GS1 öneki `8719076` ile başlıyor, kontrol basamağı tutuyor ve aynı parça numarasıyla 2–7 bağımsız satıcı sayfasında aynı görünüyor. Victron'un resmî fiyat listesinde barkod yok; kaynaklar satıcı sayfaları. Barkodlar kaynak adresleriyle `lib/catalog/gtin.json`'da, SKU'ya göre. Sunucu `lib/catalog-details.ts` ile ürüne ve varyanta ekliyor; Excel ve panel değeri öncelikli, içe aktarma bu dosyayı ezmiyor. Yerelde Merchant akışında 59 Victron ürününün 54'ü `g:gtin` ile gidiyor (akış toplamı 313, barkodlu 54); şemada da var.<br>• **Victron'da boş bırakılan 5 ürün** (kaynaklar çelişiyor): DIN35 adaptör orta, Zigbee–RS485 dönüştürücü, VE.Bus BMS V2, VE.Bus BMS NG, SHS 200. İlk dördünde çoğunluk var ama bilerek girilmedi; kutudan bakılmalı.<br>• **Diğer markalar — güvenilir barkod yok:**<br>  – TommaTech, Frecon, Electrozirve, Apex, NP Power, Exelon, Altech ve Mexxsun hiçbir yerde barkod yayımlamıyor.<br>  – Alpex kendi sitesinde barkod veriyor, ama ABD önekli (`0715936`) bir blok; büyük olasılıkla satın alınmış UPC. Havensis barkodları da aynı blokta.<br>  – İstabreeze barkodları Bulgaristan'daki AB satıcısının; bir barkod 25 kadar ayrı üründe tekrar ediyor.<br>  Bunlar **girilmedi**. Alpex'inkiler GS1 Verified'da doğrulanırsa eklenebilir.<br>• **Deye:** İnternette görünen barkodlar Polonyalı bir ithalatçının (`590`); kapsam dışı.<br>**Kalan:** Victron dışındaki markaların barkodları distribütörden istenmeli (SKU listesiyle) ve Excel'in `Barkod Listesi` sütununa ya da panele girilmeli |
| 3a | Barkod kontrolleri (sonra bakılacak, 29.10 kararı) | Siz | (1) GS1 Verified'da `00715936350876` aratılıp firma adına bakılacak: Alpex'e ya da sahibine kayıtlıysa onay bekleyen 19 Alpex barkodu etkinleşir. (2) İstabreeze WindSafe 2000W/1500W barkodlarına onay. (3) Victron Zigbee–RS485 dönüştürücünün kutusundaki barkod (olası `8719076048268`). (4) TommaTech ve diğer markalar için distribütörden SKU'ya göre barkod listesi. Bekleyenler `lib/catalog/gtin.json` → `pending` / `unresolved` |
| 4 | Akülerde kargo (28 sayfada kargo bilgisi) | Siz (kargo firmalarıyla) → ben | Lityum/jel akü gönderimi Navlungo/Geliver ile netleşince `lib/shipping/battery.ts` → `BATTERY_CONTACT_ONLY = false`: aküler sepete girer, şema ve sepet aynı tarifeden kargo verir (desiler hazır). 3 kurulumlu AFT şarj istasyonu bilerek kargo bilgisiz kalır |
| 5 | AFT PRO DC (90/180/270 kW) teknik tablosu | Tedarikçi → ben | Gerilim aralığı, akım, konnektör, çıkış sayısı, koruma sınıfı, ölçü/ağırlık; gelince `product-details.json`'a girer |
| 6 | 20 DC ürünün sistem voltajı (K5) | Siz (panel) | Ürünler → "Voltajı tanımsız" sekmesi |
| 7 | Sağlayıcılar | Siz | Banka sanal POS (`POS_*`), Geliver yeni anahtar (`GELIVER_API_TOKEN`), Navlungo API bilgileri, Firebase yeni proje (Storage/Blaze + servis hesabı), `ADMIN_TOTP_SECRET`. Ayrıntı "Kalanlar" 2 ve 4 |
| 8 | Tedarikçi teyitleri | Tedarikçi | K6 içerik teyitleri, fotoğrafı olmayan Apex APX2440 ve Frecon PV500 450 kW, E11 teyitleri, tahmini desiler ("Kalanlar" 5) |
| 9 | Depo düzeni (K3) | Siz | `main` dalının ileri sarılması, `origin` adresinin yeni GitHub adresine çevrilmesi, eski dallar ve iki yarım İngilizce çalışma kopyası (`admiring-mahavira-309b7b`, `awesome-greider-503600`; 1. madde bitince silinebilir) |
| 10 | Teknik öneriler | Ben, karar verilirse | İstemci paketinden kataloğun çıkarılması, nonce tabanlı CSP, Tailwind 4 geçişi (`npm audit`'teki 7 yüksek açık), panelde Navlungo gönderi iptali ve iade toplama |

## Güvenlik taraması — 1. tur (29.10.2026, ana dalda — commit edilmedi, yayınlanmadı)
**Yöntem:** güvenlik eklentisi henüz kurulu değil (kurulunca aynı tarama onunla tekrarlanır). Kodun üç alanda okunarak incelenmesi (giriş/yönetim yetkisi; sipariş, fiyat ve ödeme; açık uçlar, dosyalar, başlıklar, sırlar), `npm audit`, test sitesinde yalnız GET ile güvenlik başlıkları ve IP başlığı ölçümü. Bulgular kodda tek tek doğrulandı.

| # | Önem | Bulgu | Durum |
|---|---|---|---|
| S1 | **Yüksek** | Yapılandırılmış veride (JSON-LD) kaçış yok: panelde ürün adına `</script><script>…` yazan "Katalog editörü" her ziyaretçide ve Sahip'in tarayıcısında kod çalıştırabilir (Sahip oturumuyla kullanıcı açma dahil). 11 dosyada aynı kalıp | ✅ `lib/seo/json-ld.ts` (`<`, `>`, `&`, U+2028/2029 kaçışı) tüm JSON-LD yerlerinde. Yerelde saldırı metniyle denendi: şemada veri olarak kalıyor, betik çalışmıyor |
| S2 | **Yüksek** | Panele giren her role (editör, operatör dahil) süresiz, ortak ve tam yetkili Firebase kimliği (`admin-panel-user`) veriliyordu: Firestore'dan tüm müşteri adres/telefonları, bülten listesi, kuponlar; pasifleştirme ve çıkış erişimi kesmiyordu. Panel bu kimliği artık kullanmıyordu | ✅ Kodda: kimlik üretimi ve `/api/admin/firebase-token` kaldırıldı, `firestore.rules` `isAdmin()` = false. **Sizde:** (1) kurallar yayını `firebase deploy --only firestore:rules --project eticaret-54bdc` (canlıdaki proje; yeni projeye de), (2) eski oturumların iptali `node scripts/revoke-admin-firebase.mjs` (FIREBASE_ADMIN_* değişkenleriyle, her iki proje). İkisi yapılmadan eski belirteçler çalışmaya devam eder |
| S3 | Orta | "Yönetici" rolü veritabanı yedeğini indirebiliyordu (Sahip şifre özetleri ve doğrulama anahtarları dahil) → Sahip yetkisi | ✅ yedek indirme yalnız Sahip |
| S4 | Orta | Yönetim oturumu çıkış, şifre değişikliği, şifre/2FA sıfırlama, rol değişikliği ve pasifleştirmede düşmüyordu (7 gün geçerli kalıyordu) | ✅ oturum sürümü (`AdminUser.sessionVersion`, **yeni sütun**: yayında `prisma db push` ekler); şifre/2FA değiştiren cihaz yeni oturumla devam eder. Ana şifre oturumu için yine `JWT_SECRET` değiştirmek gerekir |
| S5 | Orta | 15 dakikada 20 hatalı giriş tüm yöneticileri dışarıda bırakıyordu (site geneli kilit) | ✅ kilit hesap bazında (e-posta ya da ana şifre); IP sınırı duruyor |
| S6 | Orta | İstek sınırlarının sahte IP başlığıyla aşılabileceği şüphesi | ✅ **Ölçüldü, geçerli değil:** test sitesinde her istekte farklı sahte `X-Real-IP`/`X-Forwarded-For` ile de 21. istekte 429; Hostinger vekili başlığı kendisi yazıyor. Sözleşme onayı IP'si de artık aynı kaynaktan (eskiden XFF'nin istemcinin yazabildiği ilk değeri) |
| S7 | Orta | Uydurma e-posta/telefonlarla havale siparişi açılıp stok ve sınırlı kuponlar 3 gün kilitlenebiliyor; her siparişte girilen adrese e-posta gidiyor | ✅ IP başına saatte 3 havale siparişi; kararlarla: bildirimli sipariş de 3 günde iptal, ürün başına 20 adet, kart siparişi 30 dakikada iptal (aşağıda "Kararlar"). Turnstile eklenmedi (karar) |
| S8 | Orta | GES formlarında boyut sınırı yoktu (MB'lık kayıt, her talepte yöneticiye e-posta) | ✅ gövde 32–64 KB sınırı, metinler kısaltılıyor, `formData` 20 KB üstü saklanmıyor, doğrulama formu IP başına 10 dakikada 5. Kalan: GES formlarına Turnstile (istemci bileşeni gerekiyor) |
| S9 | Düşük | Aynı iade talebinde aynı satır iki kez yazılınca fazla adet iade sayılıyor (stok fazla geri geliyordu) | ✅ satır başına toplanıp denetleniyor |
| S10 | Düşük | Akü engeli sunucuda yalnız kategoriye bakıyordu (panelde kategori değişirse akü sipariş edilebilirdi) | ✅ desi kaydındaki akü işareti de engelliyor |
| S11 | Düşük | 2FA kapatmada deneme sınırı ve kod tekrar koruması yok | ✅ 15 dakikada 5 deneme, kod bir kez geçerli |
| S12 | Düşük | Şifre sıfırlama bağlantısı `Origin: http://…` ile http'ye düşürülebiliyordu | ✅ yapılandırılmış adres kullanılıyor |
| S13 | Düşük | JWT algoritması sabit değil; kart ödemesi dönüşünde banka alanları zorunlu değil | ✅ HS256 sabit; `mdStatus`/`ProcReturnCode` yoksa dönüş reddedilir |
| S14 | Düşük | CSP `unsafe-inline`/`unsafe-eval`, `connect-src https:` | Açık: nonce tabanlı CSP ("Yapılacaklar — sıralı" 10) |
| S15 | Düşük | Stok bildirimi ve misafir sorusu onaysız başka adrese e-posta; `TURNSTILE_SECRET_KEY` tanımlı değilse bot koruması kapalı | Açık: canlıda `TURNSTILE_SECRET_KEY` + `NEXT_PUBLIC_TURNSTILE_SITE_KEY` tanımlanmalı (Cloudflare Turnstile, ücretsiz) |
| S16 | Bilgi | Sipariş sorgulama GET'te e-posta/telefon adreste (sunucu kaydına düşer); ödeme bildirimi yöneticiye tekrar sınırı yok; kupon önizleme hata türünü ayırıyor | Açık, düşük öncelik |
| S17 | **Yüksek** (2. tur) | Dışa aktarılan CSV'lerde (siparişler, aboneler, katalog) müşterinin yazdığı ad/adres `=HYPERLINK(…)` gibi Excel formülü olarak çalışabiliyordu | ✅ `=`, `+`, `-`, `@`, sekme, CR ile başlayan metin hücresine kesme işareti (`lib/csv.ts`), birim testi |
| S18 | Orta (2. tur) | S5 düzeltmesinin açığı: var olmayan bir e-postayla girilen ana şifre kilide sayılmıyordu; her istekte yeni e-posta uydurularak ana şifre kilitsiz denenebilirdi | ✅ kayıtlı hesabı olmayan her deneme ana şifreye sayılır; kilit tablosu taşınca süresi dolanlar silinir (eskiden tümü siliniyordu) |
| S19 | Orta (2. tur) | Ana şifreyle açılan oturum çıkışta düşmüyordu | ✅ ana şifre oturum sürümü (`Sequence` "adminMasterSessionVersion"); çıkışta tüm ana şifre oturumları düşer |
| S20 | Düşük (2. tur) | 2FA açma/kapatma yalnız oturum istiyor: çalınmış çerezle saldırgan kendi anahtarıyla 2FA açıp sahibini dışarıda bırakabilir; ekli görsel silme ürün kontrolü yapmıyor; Firestore'da `gesQuotes`/`gesVerifications` girişsiz yazılabiliyor (alan boyutu sınırsız, panel bu koleksiyonları kullanmıyor) | 2FA için mevcut şifre ✅ (karar 5). Açık: görsel silmede ürün eşleşmesi, Firestore kurallarında `gesQuotes`/`gesVerifications` yazmasının kapatılması |
| D1 | Yüksek (bağımlılık) | `zod` (bellek tüketme) | ✅ kodda kullanılmıyordu, kaldırıldı |
| D2 | Yüksek / Orta (bağımlılık) | `re2js` (Firebase istemcisi, regex DoS), `nodemailer` (adres ayrıştırma) | ✅ `re2js` 2.9.1, `nodemailer` 10.3.0. Kalan 4 düşük (e-posta şablonu içindeki `deepmerge`), düzeltmesi yayımlanmamış |

**Sağlam bulunanlar (özet):** fiyat, indirim ve kargo sunucuda yeniden hesaplanıyor; stok tek işlemde koşullu düşüyor; kart (NestPay) ve PayTR dönüşleri imza + tutar denetimli, yapılandırma yoksa kapalı; misafir sipariş erişimi e-posta + telefon istiyor; 47 yönetim ucunun hepsi sunucuda yetki denetliyor; şifreler scrypt, sabit zamanlı karşılaştırma; çerezler httpOnly/Secure/SameSite=Strict; dosya yükleme yalnız raster görsel, yeniden kodlanıyor, yol aşımı yok; açık yönlendirme ve SSRF yok; depoda sır yok (`.env.example` dışında); test sitesinde HSTS, X-Frame-Options, nosniff, Referrer-Policy, Permissions-Policy var.

**Kararlar (29.10.2026, siz, tek tek):**
1. Ödeme bildirimi gönderilmiş havale siparişi de **3 gün** sonra iptal olur (bildirimsizlerle aynı süre).
2. Sepette ürün başına **en fazla 20 adet**; fazlası için teklif.
3. Ödenmemiş kart siparişi (POS açılınca) **30 dakika** sonra iptal.
4. Turnstile **yeni formlara eklenmeyecek** (mevcut formlarda kalır; canlıda anahtar tanımlanırsa çalışır).
5. 2FA açma/kapatmada **mevcut şifre istenecek**.
6. Nonce tabanlı CSP **voltekno.com geçişinden sonra** ayrı tur ("Yapılacaklar — sıralı" 10).

**Uygulandı (aynı gün, commit edilmedi):**
- 1 → `lib/cron-jobs.ts`: bildirimli havale siparişi de son ödeme günü geçince iptal (stok + kupon geri, müşteriye iptal e-postası). Para gelmiş olabileceği için her biri için yöneticiye ayrıca "havale-bildirimli-siparis-iptal" uyarısı.
- 2 → `MAX_ONLINE_QTY_PER_PRODUCT = 20` (`lib/store-config.ts`); aynı stoğu paylaşan seçenekler birlikte sayılır. Sunucu (sipariş ve sepet teklifi) reddeder, sepet 20'de durur ve "Daha fazlası için teklif alın" bağlantısı (ürün teklifi formu) gösterir; İngilizce hata metni eklendi.
- 3 → ödenmemiş kart siparişi 30 dakikada iptal (stok + kupon geri) ve yöneticiye toplu uyarı. Geç gelen başarılı banka dönüşü iptal edilmiş siparişe düşerse ödeme kaydedilmez, müşteriye iade bilgisi ve yöneticiye uyarı gider (bu davranış zaten vardı).
- 5 → 2FA açma/kapatmada mevcut şifre (API ve Hesabım sayfası).

**Doğrulama:**
- Yerelde:
  - 20 adet satılabilir, 21 adet "çevrim içi en fazla 20 adet" ile reddedildi (stok geçici olarak 50 yapıldı, sonra 17'ye geri alındı).
  - Sepet ekranında sınır ve teklif bağlantısı görüldü.
  - 2FA şifresiz açılamıyor; doğru şifre ve yanlış kodla kod hatası veriyor.
- İptal kuralları (1 ve 3) çalışırken denenemedi: yerelde `CRON_SECRET` yok, Next dışında da iş yüklenemiyor. Tip denetimi ve kod incelemesi temiz. Canlıda ilk çalıştırmada yönetim paneli Sistem sayfasındaki zamanlayıcı özetinden izlenmeli.

**2. tur (aynı gün):** düzeltmelerin bağımsız denetimi + dışa/içe aktarma, kupon, katalog düzenleme ve görsel yükleme taraması. S1–S4, S6, S8–S13 doğru bulundu; S17–S20 çıktı, S17–S19 kapandı. Ürün şeması taraması kaçıştan sonra da 347/347, hata 0.

**Doğrulama:** tip denetimi ve lint temiz, birim testi 195/195 (yeni `json-ld.test.ts` ve CSV formül testi; IP ayrıştırma testi güncellendi); yerelde 16/16 oturum denemesi (Firebase kimliği yok, uç kaldırıldı, editör yedek indiremez, şifre değişince eski çerez 401 / yeni 200, çıkıştan ve pasifleştirmeden sonra çerez 401, kayıtlı hesabın kilidi ana şifreyi kilitlemiyor, ana şifre oturumu çıkışta düşüyor, uydurma e-postalarla ana şifre denemesi kilitleniyor); ürün adına `</script>` yazılarak kaçış denendi. Playwright bu turda çalıştırılmadı; `tests/flows.spec.ts` sipariş denemeleri artık müşteri başına ayrı `x-real-ip` gönderiyor (yeni IP başı havale sınırı). **İngilizce dalı (`ingilizce-en`) bu düzeltmeleri henüz içermiyor**; ana dal commit'lenince o dala birleştirilecek. Yerel veritabanında pasif bir "Güvenlik Testi" editör hesabı kaldı. Playwright bu turda çalıştırılmadı.

## SEO ve yapay zekâ araması (28.10.2026, ana dalda — yayınlanmadı)
**İstek:** SEO'yu iyileştir, yapay zekâ (ChatGPT, Perplexity, Claude, Google AI Overviews) için de SEO yap. "SEO yayınlamıyoruz" kararı geçerli: değişiklikler yalnız `urun-katalogu-ikas`'ta, yayın dalına (`yayin-pro-seo-haric`) aktarılmadı.

**Ölçüm:** yerel üretim derlemesi (481 sayfa), Google Search Central 2026 kurallarına göre denetim betiği, 600 adres tarandı. **Önce:** HATA 0, UYARI 35, BİLGİ 2.316 → **Sonra:** HATA 0, UYARI 26, BİLGİ 1.349. Kalan uyarılar: arama dışı sayfalarda (sepet, giriş) ortak açıklama, ürün/blog adından gelen doğal uzun başlıklar, yerelde www alan adı olmaması, ürün listesindeki filtre adreslerinin taranması (canonical `/products`, filtre bağlantıları artık `nofollow`).

| Yapılan | Not |
|---|---|
| Marka adı tek biçim | Başlık şablonu, site adı ve paylaşım kartlarında "voltekno" → **"Voltekno"** (kurum şeması ve yasal metinlerle aynı; Google site adı ve yapay zekâ "bu firma kim" eşleşmesi için tutarlılık). Ana sayfa başlığı: "Güneş Paneli, Akü, İnverter ve EV Şarj \| Voltekno" (68 → 49 karakter) |
| Paylaşım görseli | Dışarıdaki stok fotoğraf yerine sitenin kendi hero görselinden 1200×630 `public/og/voltekno.jpg` (`scripts/make-og-image.mjs`); kendi görseli olmayan 59 dizinlenebilir sayfada artık görsel var |
| `meta keywords` kaldırıldı | 600 sayfanın hepsindeydi; Google okumuyor (veri dosyalarındaki anahtar kelime listeleri duruyor, sayfaya basılmıyor) |
| Kırıntı yolu şeması | Şemasız 14 dizinlenebilir sayfaya BreadcrumbList: /products, /shipping, /faq, /blog, /categories, /siparis-takip, 8 yasal metin (`components/seo/BreadcrumbJsonLd.tsx`) |
| Blog şeması | BlogPosting'e görsel (Google'ın önerdiği alan) |
| Başlık/açıklama | /paketler başlığı 97 → 53 karakter, /faq 70 → 47; /paketler ve /faq açıklamaları 160 karakter altına |
| favicon.ico | `/favicon.ico` 404 veriyordu → 48×48 ICO (`app/favicon.ico`) |
| **Yapay zekâ: kurum kimliği** | Ana sayfa kurum şemasına açıklama, uzmanlık alanları (`knowsAbout`: güneş paneli, LiFePO4 akü, hibrit inverter, MPPT, EV şarj…), hizmet bölgesi (Türkiye), MERSİS kimliği ve firma düzeyinde iade politikası (14 gün, iade kodu ile ücretsiz) eklendi. Hakkımızda'ya bu kayda bağlanan `AboutPage` |
| **Yapay zekâ: ürün verisi** | Ürün şemasına tüm görseller, kategori, yeni ürün durumu ve sayfadaki teknik özellik tablosu (`additionalProperty`, en fazla 25 satır; örn. Pmax 450 Wp, modül verimi %23,04). Asistanlar "48 V 100 Ah LiFePO4" gibi sorularda ürünü özelliklerden eşleştirebilir |
| **Yapay zekâ: `/llms.txt`** | Siteyi tek sayfada özetleyen Markdown (llmstxt.org): firma, alışveriş koşulları (havale %3, 3 gün, desi kargo, 14 gün cayma), 9 ürün grubu, tür sayfaları (açıklamalarıyla), markalar, hazır çözümler, rehberler, yasal metinler — 79 bağlantı, katalogdan üretilir. **Google bunu kullanmıyor** (2026 rehberi); ChatGPT/Perplexity/Claude gibi araçlar ve ajanlar için zararsız bir ek. Test alan adında 404 |
| **Yapay zekâ botları** | `robots.txt` hepsine izin veriyor (OAI-SearchBot/GPTBot, PerplexityBot, Claude-SearchBot/ClaudeBot, Google-Extended, Applebot). Arama botlarını engellemek o motorda görünmemek demek; eğitim botlarını engellemek ayrı bir iş kararı (istenirse `app/robots.ts`'teki açıklamaya göre eklenir) |

**Doğrulama:** tip kontrolü, lint, `audit:site` temiz; birim testi 190/190; Playwright (checkout + smoke) 49 geçti, 2 atlandı; ürün şeması, kurum şeması, AboutPage ve `/llms.txt` derlenmiş pakette kontrol edildi.

**Kodla yapılamayanlar (sizde, voltekno.com açılınca):** Search Console alan adı doğrulaması + site haritası + "Üretken yapay zekâ performansı" raporu; Bing Webmaster Tools (ChatGPT araması Bing dizinini de kullanır) ve IndexNow; Google Business Profile (Elazığ adresi, sitedeki ad-adres-telefonla birebir); Merchant Center ücretsiz listelemeler (`/feed/google-merchant.xml` hazır; GTIN/barkod eklenirse görünürlük artar); doğrulanmış sosyal medya hesapları açılırsa kurum şemasına `sameAs` eklenir. Yapay zekâ özetlerinde öne çıkmanın asıl yolu özgün içerik: kendi kurulum örnekleriniz, ölçtüğünüz değerler, gerçek müşteri vakaları.

**Yerel ortam notu:** Ortak `node_modules`'taki Prisma istemcisi başka bir oturumun geçici yayın klasöründen üretilmişti; yerel derleme o klasörün eski veritabanına bağlanıp "column does not exist" ile düşüyordu. Ana klasörde yeniden üretildi (`prisma generate`).

## Ürün yapılandırılmış verisi, ürün çeşidi bazında (28.10.2026, ana dalda — commit edilmedi, yayınlanmadı)
**İstek:** Ürün sayfalarının JSON-LD'sini arama motorları ve yapay zekâ botları için ürün çeşidi (SKU) bazında tamamla: varyantlar, fiyatsız ürünler, kargo, teknik özellikler, tekrarlanan açıklamalar, GTIN, ürün dizini, hreflang.

**Ölçüm:** yerel dev sunucusu, site haritasındaki 347 ürün sayfasının hepsi tarandı, JSON-LD Google kurallarına (ürün snippet'i, satıcı listelemesi, ürün varyantları) göre betikle denetlendi. Önce taramasında 4 panel sayfası dev sunucusunun ilk derlemesinde geçici 500 verdi (webpack `reading 'call'`; tekrar istekte 200); oranlar 343 sayfa üzerinden.

| Ölçüt | Önce | Sonra |
|---|---|---|
| Varyantlı ürün sayfasında ProductGroup + hasVariant | 0 / 101 | **103 / 103** |
| Şemada ayrı teklif verilen SKU (varyant + tek ürün) | 337 (varyantlar tek Offer'da) | **570** (332 varyantın hepsi kendi SKU, fiyat, stok, `?variant=` adresiyle) |
| Google için geçersiz Product (offers/yorum/puan yok) | 6 | **0** |
| Kargo bilgisi (shippingDetails) olan teklif | 309 / 337 (%91,7) | 521 / 570 (%91,4) — eksik 28 sayfa kasıtlı, aşağıda |
| additionalProperty boş sayfa | 6 | **0** (570 öğenin 555'inde; kalan 15 varyantın özelliği ürün grubunda) |
| Açıklamasının ilk 120 karakteri başka ürünle aynı | 4 | **0** |
| Google kurallarına göre hata | 6 | **0** (uyarı yalnız 49 teklifte isteğe bağlı kargo bilgisi) |
| Ürün düzeyinde yapay zekâ dizini | yok | **`/llms-full.txt`**: 347 ürün, 30 tür başlığı |
| hreflang | 0 | 0 (aşağıda öneri) |

| Madde | Yapılan / karar |
|---|---|
| 1. Varyantlar | `app/products/[id]/page.tsx`: varyantlı üründe `ProductGroup` (`productGroupID` = ürün adresi, `variesBy: schema.org/size`) ve her varyant için `Product` + `Offer`: kendi SKU'su, KDV dahil fiyatı (kampanya uygulanmış), stoğu (ayrı stokta varyantınki), sepetteki kargo satırıyla aynı kargo ücreti (`ürün-varyant` desisi), varyant görselleri. Ayırt edici değer (`size`, ör. "5 kW", "25,6V 204Ah", "24V 30A") sayfadaki seçenek etiketinden ortak kelimeler atılarak bulunur (`lib/seo/variant-attributes.ts`); Google'ın varyant özellikleri arasında güç/gerilim yok, en yakını `size`. **Varyant adresi:** `/products/<id>?variant=<anahtar>`; ürün sayfası bu adresle açılınca o seçenek seçili gelir, seçenek değişince adres güncellenir (`ProductDetailClient.tsx`, sayfa yeniden yüklenmez). Canonical ana ürün adresinde kalır |
| 2. Fiyatsız 6 AFT ürünü (teklifle) | **Product şeması kaldırıldı** (sayfada BreadcrumbList kalıyor). Gerekçe: Google Product için `offers`, `review` veya `aggregateRating` istiyor; fiyatsız Offer geçersiz, 0 ya da tahmini fiyat sayfada olmayan fiyat demek (politika ihlali, ürün elenebilir). "Teklif istenen ürün" için Google'ın tanıdığı bir işaret yok; fiyatsız Product Search Console'da yalnız hata üretir, zengin sonuç kazandırmaz. Onaylı yorumu olursa yalnız puanlı Product basılır (geçerli ürün snippet'i). Yapay zekâ botları için bu ürünler `/llms-full.txt`'te "fiyat teklifle" olarak var |
| 3. Kargo bilgisi olmayan 28 sayfa | Neden desi eksikliği ya da ağır yük kuralı değil, kasıtlı kural: 25 akü/batarya (Lityum Akü 17, Jel Akü 5, Taşınabilir Güç İstasyonu 3) `BATTERY_CONTACT_ONLY` ile çevrim içi satılmıyor (sepete eklenemez, "kargo için iletişime geçin"); 3 AFT şarj istasyonu kurulumlu (`saleMode: install`, kurulum ve nakliye siparişten sonra ayrıca). Sepette kargo ücreti hesaplanmadığı için şemaya ücret yazmak ödeme adımıyla çelişir (Google: şemadaki kargo, ödemede alınanla aynı olmalı); 0 ₺ yazmak "ücretsiz kargo" demek. **Eklenmedi.** Akü desileri hazır (45 satırın 44'ünde; eksik tek satır teklifle satılan AFT Güç Katmanı): kısıt kalkınca (`lib/shipping/battery.ts` → `BATTERY_CONTACT_ONLY = false`) şema kargo bilgisini sepetle aynı Navlungo tarifesinden kendiliğinden verir |
| 4. Özelliği boş 6 ürün | Özellikler bu ürünlerde varyant düzeyindeydi, eski şema yalnız ürün tablosunu okuyordu. Artık her varyant kendi tablosuyla, ürün grubu da tüm varyantlarda aynı olan değerlerle (ör. Deye Off-Grid: faz, akü sistemi) veriliyor. **Katalogda bulunamayan:** AFT PRO DC (90–270 kW) için katalogda ve açıklamada hiç teknik tablo yok ("Ayrıntılı teknik özellikler için iletişime geçin"); yalnız seçenek etiketindeki güç (90/180/270 kW) "Güç" olarak verildi. Gerilim, konnektör, çıkış sayısı vb. tedarikçiden alınmalı (AFT PRO V2'nin tablosu var, aynı olduğu varsayılmadı). TommaTech Modüler 51,2V 102Ah, Duvar Tipi 24V 100A ve bazı varyantlarda tablo yalnız model/gerilim/akımdan ibaret |
| 5. Tekrarlanan açıklama | TommaTech Hightech Power S HV BMS / BMS (AIO) ve MDK110A 55-75 kW / 90-110 kW: açıklamanın başındaki seri adı ürünün tam adıyla değiştirilir ("… (AIO) – HV batarya…", "… (55-75 kW Sürücüler İçin) – SPI…"). Kural koddadır (ilk 120 karakter karşılaştırılır); meta description ve JSON-LD aynı metni kullanır, Excel'den yeni tekrar gelirse de çalışır |
| 6. GTIN | **Veri modelinde yeri yok:** `MockProduct` / `ProductVariant`, `ProductOverride` (Prisma), içe aktarıcı (`scripts/import-ikas-excel.py`) ve yönetim panelinde GTIN/barkod alanı yok (eski `Product` modelindeki `mpn` vitrinde kullanılmıyor). Merchant akışı `identifier_exists=no` bildiriyor. Tedarikçi barkodları gelince gerekenler: varyant ve ürün düzeyinde `gtin` alanı (Excel sütunu veya panel), şemada `gtin13`, akışta `g:gtin` ve `identifier_exists` kaldırılması |
| 7. `/llms-full.txt` | Yeni `app/llms-full.txt/route.ts`: ürün grubu → tür (tür sayfası bağlantısı) → ürün: ad, marka, en fazla 5 temel özellik, seçenekler, KDV dahil fiyat ("…'den başlayan", "fiyat teklifle", "kargo için iletişim", "kurulum ve nakliye ayrıca", "stokta yok"), ürün adresi. Vitrin verisinden (kur, kampanya, satış durumu) saatlik üretilir, test alan adında 404. `/llms.txt` "Ürün grupları" başında bu dosyaya bağlanıyor. ~111 KB |
| 8. hreflang | **Doğrulandı:** İngilizce ayrı adreste sunulmuyor; dil `NEXT_LOCALE` çerezine göre aynı adreste değişiyor (`i18n/request.ts`, `<html lang>` de çerezden). Çerez göndermeyen Googlebot yalnız Türkçeyi görür, İngilizce dizine girmez; hreflang verilecek ikinci adres olmadığı için eklenmedi. `ingilizce-tam` dalı da aynı çerez yaklaşımında. **Öneri** (büyük URL değişikliği, kararınız gerekli): İngilizce yayınlanacaksa `/en/...` önekli adresler (next-intl `localePrefix: 'as-needed'`, Türkçe kökte kalır), her sayfada `alternates.languages` ile `tr`, `en`, `x-default`, site haritasında dil eşleri; çerezle dil değişimi yönlendirmeye dönüşür. İngilizce yayınlanmayacaksa şimdiki durum doğru. **Karar (29.10.2026, siz): `/en/` uygun** → "Yapılacaklar — sıralı" 1. madde |

**Doğrulama:** tip kontrolü ve lint temiz; birim testi 193/193 (yeni `tests/unit/variant-attributes.test.ts`: etiket kısaltma, ölçü ayrıştırma, katalogdaki 103 varyantlı üründe ayırt edici değerlerin benzersizliği); 347/347 sayfa 200; Google kurallarıyla denetimde hata 0. Tarayıcıda: `?variant=deye00397` adresi 6 kW seçili açıldı, 5 kW'a tıklanınca adres `?variant=deye00396` oldu. Örnek sayfalar (Deye Off-Grid ProductGroup, MDK110A Product, AFT 5,4 kWh şemasız) elle incelendi. Google Rich Results Test yerel adrese erişemediği için çalıştırılmadı; voltekno.com açılınca Search Console "Ürün snippet'leri / Satıcı listelemeleri" raporundan izlenmeli.

## Kalanlar (21.10.2026 kontrolü)
_DURUM.md; git, Hostinger (yayın geçmişi, ortam değişkeni adları), `YAPILACAKLAR.md` ve klasörün durumuyla karşılaştırıldı._

**1. Yayın ve kod (sizin kararınız)**
| # | Kalan | Not |
|---|---|---|
| K1 | Navlungo + Geliver kodunun yayını | ✅ canlıda (takip 21.10, gönderi oluşturma 22.10 `953b9ba`). Çalışması için Hostinger'a `GELIVER_API_TOKEN` (anahtar sohbette paylaşıldığı için önce Geliver panelinden yenisi) ve gerçek etiket için `GELIVER_TEST_MODE=0` eklenmeli; ikincisi yokken gönderiler test gönderisidir. Navlungo, bilgileri girilene kadar kapalı |
| K1b | Akü kısıtı, desi, görseller, teslimat tahmini, sipariş iyileştirmeleri | ✅ 21.10.2026 `f1025fa` ile canlıda |
| K2 | SEO yayını | Tür ve marka sayfaları, eski voltekno.com yönlendirmeleri (`9ad9119`, `6a30301`; İngilizce tür listesi düzeltmesi `5122e7a`) ve 28.10 SEO + yapay zekâ araması turu (yukarıda) bekliyor |
| K4 | 24.10 değişikliklerinin yayını | ✅ 25.10.2026 `d8a3483` ile canlıda, doğrulandı |
| K5 | 20 DC ürününün sistem voltajı | Panelde Ürünler → "Voltajı tanımsız" sekmesi; her ürünün düzenleyicisinde "Sistem voltajı" seçilmeli (NP Power/Apex/Exelon inverterler, Apex NFS/NPS, Electrozirve IC ve DC-DC şarj, Victron aksesuarları). Seçilene kadar bu ürünler akü/inverter/şarj cihazıyla uyumlu önerilmez |
| K6 | İçerik teyitleri | AFT Güç Katmanı 210/315/420 Ah'in 105 Ah'lik modüllerle elde edildiği yorumu ve kabin değerleri tedarikçiyle; AFT bataryalarda model başına SKU; garanti metinlerinin uzman/hukuk kontrolü; kaldırılan kurumsal iddialar (2.000+ müşteri, 7/24 destek, kalite kontrol) belgelenirse geri eklenebilir |
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
| Firebase yeni proje (E4) | Firestore, Auth ve yetkili alan adları açık; eski veriler 26.10'da aynı UID'lerle taşındı ve Firestore kuralları yüklendi. Kalan: Storage açılışı (Blaze), servis hesabı anahtarı, canlı ortam değişkenleri + geçiş günü son eşitleme. Canlı hâlâ eski proje değerleriyle |
| E-posta | Gönderen `@voltekno.com` kutusu olmalı (şu an `info@bataryakit.com`) |
| Diğer | Banka sanal POS, e-Arşiv entegratörü, SMS, pazaryeri (Trendyol/Hepsiburada), ERP/muhasebe, Sentry, Meta Pixel kararı, kapıda ödeme kararı |

**5. Katalog ve veri (tedarikçi)**
- Barkod/GTIN boş: ikas Excel'inde `Barkod Listesi` sütunu var ama 562 satırın hiçbiri dolu değil (ayrıntı "İstek turu 6"). Fotoğrafı hâlâ olmayanlar: Apex APX2440 (internetteki tüm görseller APX2420'nin fotoğrafı ya da etiketi rötuşlanmış kopyası) ve Frecon PV500 450 kW (940×1684 mm kabin; resmî kaynaklarda fotoğrafı yok, şu an 315 kW duvar tipi gövde görseli kullanılıyor, bu yanlış gövde). İkisi için gerçek fotoğraf tedarikçiden istenmeli.
- Teyitler (E11), 22.10'da resmî kaynaklarla bakıldı: HAVENS-00620'nin gerçek akımı 45A (adındaki "80AMPS" yanlış); Electrozirve'de 40A DC-DC yalnızca çift yönlü, EC12-12 ailesinde yalnızca 20A var (ELECTR-00517 40A, ELECTR-00518 60A ve tek yönlü 40A ELECTR-00521 teyit edilmeli); Havensis 1300W UPS'in trafolu olup olmadığı ve ağırlığı yayımlanmamış; Electrozirve şarj kontrol cihazları SRNE OEM'i, DC-DC şarj cihazları Havensis OEM'i. Deye model kuşağı, Apex/NP ölçüleri, Exelon ELH-24/PMAX-12P, İstabreeze kanat seti ağırlığı açık. Desi: 114 tahmini SKU'dan 6'sı resmî kaynakla güncellendi, gerisi için üretici ağırlık yayımlamıyor; ilk sevkiyatlarda koli ölçüsü ve brüt ağırlık alınmalı.
- ✅ 22.10: Victron MultiPlus-II 48/3000 (120 V, UL 1741) ve Blue Smart IP67 24/8 (NEMA 5-15) satıştan kaldırıldı (`scripts/data/delisted.json`; katalog 338 ürün).
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

## Yerel staging ve uçtan uca testler — kontrol listesi 23–34 (25.10.2026)
_Karar (25.10): yalnız yerel staging (Hostinger'da alt alan adı açılmadı). Bölüm her adımda güncellenir._

**Ortam:** yayın dalının (`yayin-pro-seo-haric`, `d8a3483`, canlıdaki kodun aynısı) ayrı derlemesi (`.next-staging`), `http://localhost:3020`. Veritabanı yerel `prisma/dev.db`'nin kopyası (`scratchpad/staging/staging.db`, şema güncel). E-postalar dışarı çıkmaz: `scripts/staging/mail-sink.mjs` yerel posta sunucusu (127.0.0.1:2525) her iletiyi `.eml` dosyası olarak yazar. Zamanlayıcı kapalı (`INTERNAL_CRON=0`), yedek klasörü ayrı. Başlatma: `.claude/launch.json` → "Staging posta 2525" ve "Staging 3020". Testler: `tests/staging-checklist.spec.ts` (`STAGING_TESTS=1`, komut dosyanın başında).

**Yerelde yapılamayanlar (baştan):** Firebase Auth gerçek projeye bağlı; test hesabı açmak dış serviste hesap oluşturmak demek, emülatör kurulu değil (29 kısmen; üye siparişleri sunucunun kendi JWT'siyle yerel test kullanıcısında denendi). Gerçek kargo tarifesi ve DNS/alan adı yerelde doğrulanamaz (25, 33 kısmen).

**Sonuç (25.10):** son tam koşu taze veritabanında 26 testin hepsi geçti; voltekno.com derlemesinde 32–33 geçti. Bulunan 7 hata düzeltildi (23, 26, 30 ×2, 31, 32, 33): ana dalda `4f89231`, `2292d2c`; yayın dalında `24f34a5`, `e159f90`, `c95249c`. **25.10 akşam `c95249c` ile canlıda.**

| No | Konu | Durum |
|---|---|---|
| 23 | Çerez tercihi | ✅ Seçimden önce ve "Sadece Gerekli" sonrası analitik/piksel isteği yok, tercih saklanıyor, "Kabul Et" analitiği başlatıyor. 🔧 Bulgu düzeltildi ve staging'de doğrulandı: footer'a "Çerez tercihleri" eklendi, bandı yeniden açar; onay geri alınınca GA/Meta çerezleri silinir ve Firebase ölçümü durdurulur |
| 24 | Stok | ✅ Varyant stokları bağımsız (20W 0 iken yalnız 10W satılıyor; iptal yalnız ilgili varyantı geri veriyor); son adette aynı anda iki siparişten yalnız biri geçiyor, stok eksiye düşmüyor. Kodda yok (iş kararı): depo / tedarikçi / sipariş üzerine üretim ayrımı, stok kaynağı ve son güncelleme zamanı |
| 25 | Kargo hesabı | ✅ Raporun sepeti (2 kablo + 50 kW ısı pompası) dahil kargo bedeli sunucuda hesaplanıyor, adetle tutarlı artıyor; akü siparişi sunucuda da reddediliyor. Bedelin anlaşmalı tarifeyle doğruluğu yerelde doğrulanamaz (Navlungo/Geliver fiyat listesi gerekir) |
| 26 | Nakliye/kurulum kapsamı | ✅ AFT DC istasyonu kargo bedeline girmiyor, sipariş zaman çizelgesinde kurulum notu var. 🔧 Bulgu düzeltildi: sipariş e-postalarında (müşteri ve yönetici) kargo satırı "Kurulum ve nakliye ayrıca" ve altında "kurulum ve nakliye bu tutara dahil değildir" notu (`lib/order-install.ts`) |
| 27 | Sipariş ve ödeme durumları | ✅ Farklı fatura adresi ayrı saklanıyor; kurumsal faturada geçersiz VKN reddediliyor, geçerli VKN ve vergi dairesi saklanıyor; üye siparişi hesaba bağlanıyor, başka üye göremiyor, oturumsuz 401; aynı tekrar anahtarıyla eşzamanlı iki gönderim tek sipariş; havale bekleniyor → ödendi → hazırlanıyor → kargoda → teslim; ödeme bekleyen sipariş tahsilatı artırmıyor, ödeme artırıyor, iptal düşürüyor |
| 28 | Fatura ve bildirimler | ✅ Sipariş onayı müşteriye IBAN, son ödeme tarihi ve ekli Ön Bilgilendirme Formu + Mesafeli Satış Sözleşmesi (PDF) ile gidiyor; yöneticiye "Yeni sipariş"; ödeme onayında müşteriye "Ödemeniz alındı" ve yöneticiye "Ödeme alındı"; kargoda takip numaralı "Siparişiniz kargoya verildi"; panelden "Sipariş Özeti" yeniden gönderiliyor. Not: e-Arşiv/e-fatura entegratörü yok; panelin "fatura gönder" düğmesi resmî fatura değil sipariş özeti gönderiyor. SSS'deki kurumsal e-fatura anlatımı muhasebe süreciyle sizin tarafınızda eşleştirilmeli |
| 29 | Üyelik ve hesap | ✅ Kayıt formu boş, geçersiz e-posta ve kısa/uyuşmayan şifreyle istemcide duruyor, Firebase'e istek gitmiyor; giriş ve şifre sıfırlama sayfaları açılıyor; üye siparişi hesaba bağlanıyor (27). Yapılamadı: gerçek kayıt, e-posta doğrulama, şifre sıfırlama, adres/favori (hepsi doğrudan Firebase'e bağlı; Firebase test projesi veya emülatör gerekir) |
| 30 | Takip ve formlar | ✅ İletişim, GES teklif ve teklif doğrulama kayıtları panele düşüyor; GES'te aranma onayı isteğe bağlı, e-postasız ve aranmak istemeyen talep 400; sipariş takibi doğru bilgiyle açılıyor, yanlış bilgiyle 404 ve hiçbir kişisel veri dönmüyor, dakikada 20 denemeden sonra 429. 🔧 Bulgular düzeltildi: (1) iletişim/GES bildirimleri gönderen kutusuna, sipariş bildirimleri `ADMIN_EMAIL`'e gidiyordu → hepsi tek alıcıda (`adminNotifyEmail()`: `ADMIN_EMAIL`, yoksa gönderen kutusu); (2) teklif doğrulama talebi yöneticiye hiç bildirilmiyordu → kısa özetli e-posta eklendi |
| 31 | Sunucu kuralları ve erişim | ✅ İstemcinin gönderdiği fiyat, indirim, toplam ve kargo yok sayılıyor; yönetici uçları oturumsuz 401; operatör siparişleri görüyor ama kullanıcılar, sistem ve işlem kaydı 403; editör siparişler ve müşteriler 403, katalog 200; personel Sahip hesabı açamıyor; yeni hesap geçici şifreyi değiştirmeden işlem yapamıyor (403); sahte POS geri bildirimi siparişi ödendi yapmıyor; tarayıcı paketinde (239 dosya) gizli anahtar yok. 🔧 Bulgu düzeltildi: sahte/imzasız POS geri bildirimi yöneticiye "Sistem hatası" e-postası gönderiyordu → yalnız günlüğe yazılıyor |
| 32 | iKAS veri/adres geçişi | ✅ Mutabakat (`scripts/staging/reconcile-ikas.mjs`, `voltekno_ikas_nihai.xlsx`): Excel 562 satır / 340 ürün grubu / 562 SKU → 338 ürün aynı adla katalogda, 2'si bilerek satıştan kaldırıldı (Victron 120 V), 562 SKU'nun hepsi katalogda; katalogdaki 9 fazla ürün iKAS'ta olmayan AFT ürünleri; görselsiz 1 ürün (AFT PRO). 🔧 Bulgular düzeltildi: (1) eski iKAS ürün adreslerinin 340'ı da (kökte `/<slug>`) yeni sitede 404 veriyordu (SEO dalında bile yalnız 132'si yönlendiriliyordu) → her katalog ürününün kök adresi 308 ile `/products/<slug>`'a (`next.config.js`); (2) kaldırılan 2 ürün 404 → kategorisine 308. Yapılmadı: iKAS müşteri, adres ve sipariş aktarımı (iKAS'tan bu dışa aktarımlar yok; gerekirse sizden dosya) |
| 33 | Alan adı ve indeksleme | ✅ Test alan adı ayarlarıyla (nextfirststep.com, indeksleme kapalı) ve voltekno.com ayarlarıyla (indeksleme açık) iki ayrı derleme: site haritası, robots, ürün akışı, canonical ve sipariş e-postası bağlantıları tek alan adında; test alan adında robots `Disallow: /` ve sayfada noindex; voltekno.com'da Sitemap satırı var, noindex yok. Geçiş yalnız `NEXT_PUBLIC_SITE_URL` ve `NEXT_PUBLIC_NOINDEX` değişkenleriyle. 🔧 Bulgu düzeltildi (yalnız yayın dalı): eski yapısal veri test alan adında voltekno.com yazıyordu ve doğrulanmamış Facebook/Twitter/Instagram hesapları vardı. Yerelde yapılamaz: DNS, SSL, Search Console |
| 34 | Yedek ve geri dönüş | ✅ Panelden yedek alınıyor; sunucu dışı kopya gzip ekli e-postayla yöneticiye gidiyor; panelden indirilen yedek dosyanın aynısı; yedek ayrı veritabanı olarak açılıyor, bütünlük kontrolü "ok", sipariş/kullanıcı/ürün/yönetici/indirim sayıları canlı veritabanıyla aynı; geçersiz dosya adı 400. Sizde: canlıda bir kez geri yükleme provası, hata izleme (Sentry) kararı, eski altyapıya dönüş koşulu |

## Müşteri tarafı kontrol listesi — 34 maddenin genel durumu (24.10.2026)
Kaynak: "Voltekno yeni altyapı kontrol listesi" (23.10.2026, `Voltekno_Gecis_Kontrol_Listesi_23-10-2026.docx`). Listenin kuralı: "Test gerekli" maddeler erişim sağlanıp uçtan uca denenmeden "tamamlandı" sayılmaz; 1. öncelik maddeleri kapanıp test siparişleri doğrulanmadan ana alan adı taşınmaz. **Özet (25.10, `d8a3483` canlıda): 15 madde çözüldü ve canlıda, 1 madde kapsam daraltılarak çözüldü, 4 madde sizden/tedarikçiden bilgi bekliyor, 14 madde test ve geçiş adımı.**

| No | Öncelik | Konu | Durum |
|---|---|---|---|
| 1 | 1 | Kartla ödeme | Bekliyor: banka sanal POS bilgileri (`POS_*`). Kart kapalıyken bütün metinler havale/EFT'ye göre (madde 2) |
| 2 | 1 | Ödeme vaatleri | Canlıda (`6193901`) |
| 3 | 1 | Fiyat tutarlılığı | Canlıda (`6193901`; kullanım alanı sayfaları da güncel vitrin verisiyle `6b460d3`) |
| 4 | 1 | KDV dahil ana fiyat | Canlıda (`6193901`) |
| 5 | 1 | Teklifli ürün ₺0 | Canlıda (`6193901`) |
| 6 | 1 | Uyumlu ürün eşleştirme | Canlıda (`6193901` + `ccb0c64`). 20 ürünün voltajı panelden girilecek (K5) |
| 7 | 1 | AFT PRO içerik | Bekliyor: tedarikçi teknik tablosu (giriş/çıkış, soket, koruma, haberleşme, ölçü, ağırlık, garanti, kurulum kapsamı) |
| 8 | 2 | AFT PRO görseli | Bekliyor: gerçek ürün fotoğrafı (şu an yer tutucu) |
| 9 | 2 | Üretici dokümanları | Bekliyor: 241 üründe datasheet bağlantısı yok; önce inverter, ısı pompası, şarj istasyonu, batarya |
| 10 | 2 | AFT modül/sistem kapasitesi | Canlıda (`6b460d3`); teyit K6 |
| 11 | 2 | Çok voltajlı AFT tabloları | Canlıda (`6b460d3`); model başına SKU yok |
| 12 | 2 | Kategoriye göre teknik süzgeç | Canlıda (`6b460d3`) |
| 13 | 2 | Karşılaştırma alan adları | Canlıda (`6b460d3`) |
| 14 | 2 | Paket sayfaları | Canlıda (`6b460d3`, "uygun ürünler/çözümler" yolu). Gerçek paket (adetli liste, toplam bedel) istenirse içerik sizden |
| 15 | 2 | Kullanım alanı önerileri | Canlıda (`6b460d3`) |
| 16 | 2 | GES hesaplama beklentisi | Canlıda (`6b460d3`, kişisel bilgisiz ön tahmin) |
| 17 | 2 | Teklif Al bağlantıları | Canlıda (`6b460d3`) |
| 18 | 1 | KVKK metninde iKAS | Bekliyor: fiilen kullanılan sağlayıcıların listesi sizin onayınızla (barındırma Hostinger, e-posta SMTP sağlayıcısı, Firebase, analitik, kargo entegrasyonları, ödeme sağlayıcısı). Tahminle yazılmayacak |
| 19 | 2 | Garanti anlatımı | Canlıda (`6b460d3`); uzman kontrolü önerilir |
| 20 | 2 | Kurumsal iddialar | Teyitsiz iddialar kaldırıldı, canlıda (`6b460d3`) |
| 21 | 2 | İngilizce görünüm | Kapsam daraltıldı: İngilizce görünümde kapsam notu (`6b460d3`). Tam çeviri `ingilizce-tam` dalında, birleştirme kararı sizde |
| 22 | 2 | Form aydınlatmaları | Canlıda (`6b460d3`) |
| 23 | 2 | Çerez tercihi yaşam döngüsü | Test gerekli. Çerez bandı ve "Sadece gerekli / Kabul et" seçimi var; analitik/pikselin seçim öncesi yüklenmediği canlıda ağ kaydıyla doğrulanmalı |
| 24 | 1 | Stok ve tedarik gerçeği | Test gerekli. Panelde stok, varyant stoğu, düşük stok bildirimi ve son ürün yarışı koruması var (A03, Playwright); depo/tedarikçi/üretim ayrımı ve gerçek stok girişi sizde (K bölümü 3) |
| 25 | 1 | Kargo tarifesi | Test gerekli. Desi hesabı ve kargo kuralları çalışıyor; bedelin anlaşmalı tarifeyle doğruluğu Navlungo/Geliver fiyat listesiyle teyit edilmeli |
| 26 | 1 | Nakliye ve kurulum kapsamı | Kodda var (AFT DC cihazlarında sepet, ödeme ve sipariş zaman çizelgesinde "kurulum ve nakliye fiyata dahil değil" notu, `f50a456`); uçtan uca test siparişiyle doğrulanmalı |
| 27 | 1 | Sipariş ve ödeme durumları | Test gerekli. Tekrar anahtarı (çift tıklama), fiyat değişince onay ve durum geçişleri kodda; misafir/üye, bireysel/kurumsal, farklı fatura adresli test siparişleri test ortamında veya sizin onayınızla canlıda açılmalı (canlıda sipariş açmıyorum) |
| 28 | 1 | Fatura ve bildirimler | Test gerekli. Sipariş e-postaları SMTP ile gidiyor; gerçek test alıcısına teslim, sözleşme kopyası, IBAN ve kargo mesajı denenmeli. e-Arşiv entegratörü yok; SSS'deki e-fatura anlatımı muhasebe süreciyle eşleştirilmeli |
| 29 | 1 | Üyelik ve hesap | Test gerekli: kayıt, doğrulama, şifre sıfırlama, sepet birleştirme, favoriler, adresler gerçek test hesabıyla (Firebase canlıda hâlâ eski proje, E4) |
| 30 | 1 | Takip ve form sonuçları | Test gerekli. Sipariş takibinde deneme sınırı ve Turnstile var; iletişim/GES/teklif doğrulama panel kaydı ve bildirimleri canlıda denenmeli |
| 31 | 1 | Sunucu kuralları ve erişim | Kodda var: fiyat/indirim/stok sunucuda yeniden hesaplanır (`lib/order-pricing.ts`), sipariş erişimi sahibine/belirteçle, yönetici rolleri ve işlem kaydı (A09–A12), 2FA politikası. Ödeme geri bildirimi doğrulaması POS gelince. Bağımsız güvenlik incelemesi önerilir |
| 32 | 1 | iKAS veri ve adres geçişi | Kısmen: ürün/SKU/varyant içe aktarıcıyla (`scripts/import-ikas-excel.py`), eski ürün adresleri `lib/legacy-product-redirects.json`. Müşteri, adres ve sipariş aktarımı ile sayısal mutabakat yapılmadı |
| 33 | 1 | Alan adı ve indeksleme | Test gerekli; aşağıda "voltekno.com geçişi" (SEO kararı, canonical, site haritası, nextfirststep.com bağlantılarının temizlenmesi) |
| 34 | 1 | Yedek ve geri dönüş | Kısmen: günlük veritabanı yedeği (`BACKUP_DIR`, e-postayla). Yedekten geri yükleme provası, hata izleme (Sentry kararı) ve eski altyapıya dönüş koşulu belirlenmeli |

## Müşteri tarafı kontrol listesi — 1. öncelikli kod maddeleri (24.10.2026)
Kaynak: "Voltekno yeni altyapı kontrol listesi" (23.10.2026, 34 madde). Bu turda kodla çözülebilen 1. öncelikli maddeler.

| No | Durum | Yapılan |
|---|---|---|
| 2 Ödeme vaatleri | Düzeltildi | Footer rozetleri açık ödeme yöntemine bağlandı (`lib/usePaymentMethods.ts`, `/api/payments/methods`): kart kapalıyken "Havale / EFT" ve "256-bit SSL", POS bilgileri girilince Visa/Mastercard/Troy ve 3D Secure kendiliğinden görünür (banka POS başvurusu için logolar o zaman da hazır). SSS ödeme cevabı aynı bilgiden üretiliyor. Ana sayfa güven kartı "Kredi ve banka kartıyla güvenli alışveriş" → "SSL korumalı ödeme, havalede %3 indirim". Gizlilik ve çerez politikası, mesafeli satış sözleşmesi (3.5) ve ön bilgilendirme formu (4.3 b) kart ödemesini "sunulduğunda" koşuluna bağladı; üç belgenin tarihi 24.10.2026 |
| 3 Fiyat tutarlılığı | Düzeltildi | Kategori sayfası ilk çizimi sunucudan güncel vitrin verisiyle (kur, kampanya, panel düzenlemesi, satış durumu; `lib/category-initial.ts`), sayfa 10 dakikada bir yenilenir; önce katalog dosyasının içe aktarma kuruyla çizip sonra fiyat değiştirmiyor. Ürün sayfasındaki öneriler ve uyumlu ürünler güncel vitrin verisiyle (`/api/products?ids=`) çiziliyor; katalog dosyasındaki eski fiyat hiç gösterilmiyor, satıştan kalkmış ürün listeden düşüyor |
| 4 KDV dahil ana fiyat | Düzeltildi | Ürün kartı, ürün sayfası (ana fiyat, eski fiyat, varyant düğmeleri), uyumlu ürünler, sepet önerileri, favoriler ve üst menü sepet toplamı KDV dahil; sepetle aynı tutar. Fiyat süzgeci kutuları KDV dahil tam TL gösterir (süzme net fiyatla, sınırlarda ±0,5 TL pay). Kurala uygun yalnız "KDV dahil" etiketi |
| 5 Teklifli ürün ₺0 | Düzeltildi | Neden: kategori, ana sayfa ve öneri kartlarına satış biçimi geçirilmiyordu. Hepsine eklendi; ayrıca kart fiyatı 0 olan her ürünü "Fiyat için teklif alın" gösterir, favoriler de teklifli ürünü fiyatsız gösterir. Arama, karşılaştırma ve Merchant akışı zaten doğruydu |
| 6 Uyumlu ürünler | Düzeltildi | `lib/compat.ts`: akü, BMS, inverter, şarj kontrol ve akü şarj ürünlerinde sistem voltajı (12 / 24 / 48 V, HV) ad, varyant adı ve teknik özellikten okunuyor; yalnız sınıfı kesişen ürün "uyumlu" öneriliyor, voltajı okunamayan DC ürünü önerilmiyor (VA, Vac ve "100V PV" sayılmaz; LV = 48 V). 51,2 V AFT bataryaya artık 48 V inverterler, 12,8 V Marine aküye 12 V ürünler, HV inverterine HV batarya öneriliyor. Voltajı okunamayan 38 ürün aşağıda "Voltajı tanımsız DC ürünleri" bölümünde çözüldü (18'i veri dosyasıyla, 20'si panelden girilecek). Etkiyi görmek için `npx tsx scripts/check-compat.ts` |

### Voltajı tanımsız DC ürünleri (24.10.2026)
Akü/inverter grubundaki 152 üründen 38'inin adında ve özelliklerinde voltaj yoktu; bunlar uyumlu ürün önerisine giremiyordu.

- **Veri dosyası (18 ürün):** `lib/catalog/system-voltage.json`; yalnız kaynağı kesin olanlar, her kayıtta kaynak yazılı. 3 TommaTech batarya kablosu "voltajdan bağımsız"; Electrozirve HP24xx PWM, ML/MC/MF MPPT serileri ve NP Power MPPT model kodundan (SRNE adlandırması: 24xx = 12/24 V, 48xx = 12/24/48 V); Havensis HVSS-500 açıklamadaki "9-70 V DC"den 12/24/48 V; Victron Battery Balancer açıklamadan 24/48 V.
- **Panel alanı (kalan 20 ürün):** ürün düzenleyicisinde DC ürünlerde "Sistem voltajı" bölümü: 12 V, 24 V, 48 V, Yüksek gerilim (HV) veya "Voltajdan bağımsız (kablo, aksesuar)". Seçim yoksa katalog kaydına/ürün adına göre geçerli değer yazılır; tanımsızsa sarı uyarı. Kayıt işlem geçmişine "Sistem voltajı" olarak düşer. Öncelik: panel → veri dosyası → ad/özellik.
- **Ürün listesi:** "Voltajı tanımsız" sekmesi ve satırda etiket; şu an 20 ürün: NP Power MPPT Akıllı İnverter, Apex APX 4.2/6.2/8.5/11 Pro, Apex NFS 1500W ve NPS, Electrozirve IC serisi, Electrozirve tek ve çift yönlü DC-DC şarj, Exelon ELH, Victron Battery Alarm GX, Smart Battery Sense, SHS 200 MPPT ve akü kutusu, VE.Bus BMS V2/NG, smallBMS/NG, SolidSwitch 104 (Victron'ların çoğu satışa kapalı). Katalog verisi bunların voltajını söylemediği için tahmin edilmedi; panelden girilmeli.
- **Uyumlu ürün hesabı sunucuda:** `/api/products/[id]/related` (`lib/related-products.ts`), panel değerleri birleştirilmiş vitrin listesinden; panelde girilen voltaj ürün sayfasına hemen yansır. Ürün sayfası eski istemci hesabı ve `?ids=` isteği yerine bunu kullanıyor.
- **Veritabanı:** ProductOverride'a `systemVoltage` (boş bırakılabilir, onaysız eklenir).
- **Doğrulama:** `tsc` temiz, birim testleri 181/181 (yeni `tests/unit/system-voltage.test.ts`). Yerel üretim derlemesinde: liste sekmesi 20 ürün; Apex APX 4.2'de panelden 48 V kaydedilince ürün sayfasında 51,2 V Apex akü uyumlu çıktı, silinince kalktı; geçersiz seçim ("bağımsız" + 48 V) reddedildi; PWM şarj cihazına 12 V aküler öneriliyor. 25.10.2026 `d8a3483` ile canlıda.

- **Doğrulama:** `tsc` temiz, birim testleri 174/174 (yeni `tests/unit/storefront-checklist.test.ts`). Yerel üretim derlemesinde ekranda: Solar Akü kategorisinde ₺0,00 yok, 6 AFT ürünü "Fiyat için teklif alın", kart fiyatları KDV dahil ve etiketli; 12,8 V Marine akü sayfasında ana fiyat KDV dahil (₺30.103,20) ve uyumlu ürünlerin hepsi 12 V (önceden HV BMS de vardı); footer "Havale / EFT · 256-bit SSL"; SSS ödeme cevabı havale/EFT. 25.10.2026 `d8a3483` ile canlıda.
- **Açık kalanlar:** 1 kart ödemesi (POS bilgileri), 7–8 AFT PRO içerik ve görsel (tedarikçi), 9 datasheet'ler, 18 KVKK sağlayıcı listesi (sizin onayınız), 23–34 test ve geçiş adımları. 10–17 ve 19–22 aşağıda.

## Müşteri tarafı kontrol listesi — 2. öncelik, madde 10–17 ve 19–22 (24.10.2026)

| No | Durum | Yapılan |
|---|---|---|
| 10 AFT Güç Katmanı tablosu | Düzeltildi | Tek modül ve kabin sistemi ayrı: "5,4 kWh (tek modül); kabin sisteminde 172 kWh'e kadar", ölçü ve ağırlık da modül/kabin olarak; "Modül sayısı ve bağlantı düzeni istenen kapasiteye göre teklifte belirlenir" satırı. 210/315/420 Ah'in 105 Ah'lik modüllerle elde edildiği yorumu açıklamada; tedarikçiyle teyit önerilir |
| 11 Çok voltajlı AFT bataryalar | Düzeltildi | 5,4 kWh: 24 V model 206 Ah, 48 V model 105 Ah; 2,7 kWh: 12 V model 206 Ah, 24 V model 105 Ah (eşleşme enerji sabitinden hesapla kesin). Ölçü/ağırlık "her iki model". Model başına ayrı SKU katalogda yok; varyant olarak açmak için SKU gerekir. Kaynak `scripts/data/extra-products.json` ve üretilmiş katalog dosyaları birlikte güncellendi |
| 12 Kategoriye göre teknik süzgeç | Düzeltildi | `lib/spec-facets.ts`: ad, varyant ve özelliklerden türetilen süzgeçler. Akü: sistem voltajı, kapasite (Ah), enerji (kWh; yazmıyorsa tek voltajlı aküde nominal gerilim × Ah), kimya. İnverter: voltaj, güç, faz. Panel: güç (Wp), hücre tipi. Şarj kontrol: voltaj, akım. Ham özellik süzgeçleri (EV'de protokol, IP vb.) sürüyor; anlamsız olanlar (parça no, Vmp/Imp, Voc/Isc) çıkarıldı. Kategori sayfası ve /products aynı eşleşmeyi kullanıyor |
| 13 Karşılaştırma alan adları | Düzeltildi | `lib/compare-specs.ts`: "Nominal Voltaj"/"Nominal gerilim"/"Akü gerilimi" → Nominal gerilim, "Artırılabilir Kapasite" → Kapasite, Uzunluk/Genişlik/Yükseklik → tek "Boyutlar (U × G × Y)" vb. Eksik değer: kategoride başka üründe varsa "Belirtilmemiş", yoksa "Bu kategoride verilmez" |
| 14 Paket sayfaları | Düzeltildi | Hazır paket verisi (adetli malzeme listesi, toplam bedel) olmadığı için "Paketleri" → "Çözümleri", menü "Kullanım Alanına Göre", sayfada "Bu sayfa hazır bir paket değildir…" açıklaması ve "Tipik bir sistemde bulunanlar (örnek)". Adresler (/paketler/…) korundu |
| 15 Kullanım alanı önerileri | Düzeltildi | `lib/package-fit.ts`: karavan ve marin yalnız 12/24 V, en fazla 3/5 kWh, bilinen ağırlık 25/40 kg, raf/modüler/kabin parçaları yok; villa yalnız 48 V/HV; bağ evi HV yok, en fazla 10 kWh. Voltajı bilinmeyen DC ürünü gösterilmez. Ürünler güncel vitrin verisinden (10 dk). Marin SSS'deki "tüm ekipman IP67/IP68" iddiası kaldırıldı |
| 16 GES hesaplama | Düzeltildi | /ges başında "Ön tahmin": aylık kWh ve bölgeyle kurulu güç, yıllık üretim ve tasarruf aralığı; isim/telefon istemez, tarayıcıda hesaplanır, hiçbir yere gönderilmez. Altında ayrıntılı teklif formu |
| 17 Teklif Al bağlantıları | Düzeltildi | Etiketler amaca göre: üst şerit "GES Teklifi" (/ges), footer "Ürün Teklifi" ve "Teknik Destek" (iletişim formu türüyle), blog/ana sayfa "GES Teklifi Al". İletişim formuna zorunlu "Talep türü" (ürün teklifi, proje/GES, teknik destek, sipariş ve kargo, diğer); konu panelde "Ürün teklifi: …" diye gelir. Ürün sayfasındaki teklif kutusu formu ürün adı ve SKU'su hazır açar (`/contact?talep=urun&urun=<id>`) |
| 19 Garanti anlatımı | Düzeltildi | SSS, Hakkımızda ve blog satış sözleşmesi 8.1 ile aynı dilde: ürün garantisi (yasal en az 2 yıl, üretici daha uzun veriyorsa ürün sayfasında), performans garantisi (panellerde, ayrı), satış sonrası. "12–24 ay" ifadesi kaldırıldı. Metinlerin uzman/hukuk kontrolü önerilir |
| 20 Kurumsal iddialar | Düzeltildi (teyitsiz olanlar kaldırıldı) | "2.000+ mutlu müşteri", "7/24 teknik destek" (iletişim sayfası Pzt–Cuma 09:00–18:00 diyor), "her kalem teslim öncesi kalite kontrolü" kaldırıldı; yerine faturalı/üretici garantili satış, en az 2 yıl yasal garanti, Pzt–Cuma 09:00–18:00 destek. Blogdaki "340+ ürün stokta" → "340+ ürün çeşidi". Belgeyle doğrulanırsa iddialar geri eklenebilir |
| 21 İngilizce görünüm | Kapsam daraltıldı | İngilizce seçiliyken sayfa başında not: menü, düğme, sepet ve ödeme çevrili; ürün adları/açıklamaları, yasal metinler ve e-postalar Türkçe; İngilizce yardım için e-posta. Tam İngilizce katalog `ingilizce-tam` dalında (106 dosya, ana dala birleştirilmedi, son commit'i SEO) — birleştirme ayrı karar |
| 22 Form aydınlatmaları | Düzeltildi | İletişim ve teklif doğrulama formlarına amaç, geri dönüş kanalı ve KVKK aydınlatma bağlantısı ("pazarlama iletisi gönderilmez"). GES formunda aranma onayı artık isteğe bağlı; seçilmezse dönüş e-postayla ve e-posta zorunlu (sunucu da aynı kuralla) |

- **Doğrulama:** `tsc` ve lint temiz, birim testleri 187/187 (yeni `tests/unit/checklist-p2.test.ts`). Yerel üretim derlemesinde ekranda: Solar Akü süzgeçleri (voltaj/kapasite/enerji/kimya), 12 V seçince 20 ürün hepsi 12 V; Karavan sayfası 16 ürün ve kurallar; AFT 5,4 kWh tablosu model bazında; iletişim formu ürünle hazır; GES ön tahmini 400 kWh → 2,76–3,74 kWp ve sunucuya istek yok; karşılaştırma ortak alan adları; Hakkımızda yeni ifadeler; İngilizce not. 25.10.2026 `d8a3483` ile canlıda.

## Ürün grupları (23.10.2026)
İstek: belirli ürün gruplarına hem tek tek ürün hem marka/kategori seçimiyle indirim; grup toplu satışa kapatılıp açılabilsin, silinebilsin, toplu zam yapılabilsin. Kararlar (sizden): "deaktif" = satışı durdursun (ürün sitede kalır, satın alınamaz); silme = grup + gruptaki panel ürünleri silinir, katalog ürünleri satışa kapatılır.

| Özellik | Yapılan |
|---|---|
| Ürün grubu | Yönetim > Katalog > **Ürün Grupları**. Grup = tek tek seçilen ürünler (arama: ad, SKU, marka, varyant) + markalar + kategoriler. Üyelik dinamik: seçilen marka/kategoriye sonradan eklenen ürün de gruba girer. Formda anlık kapsanan ürün sayısı |
| İndirim | Grup satırında "İndirim tanımla" (yüzde en fazla %99 / sabit TL, hemen başlar). İndirimler sayfasında kampanya kapsamına **Marka bazlı** ve **Ürün grubu** eklendi. Birden fazla kampanya uyarsa müşteri için en avantajlısı (değişmedi). Silinmiş grubun kampanyası uygulanmaz |
| Satışa kapat / aç | Gruptaki ürünler sitede görünür, "Satışa kapalı" yazar, sepete eklenemez, sunucu siparişi reddeder, Merchant akışına girmez. Panelde gerçek stok korunur. Ürün düzenleyicisinde tek ürün için "Satışa kapalı" kutusu da var |
| Toplu zam | Yüzde (−90 … +500). Önce önizleme: ürün bazında şu an → yeni; dövize bağlı üründe döviz fiyatı (kuruş), sabit TL üründe TL fiyatı (tam TL) değişir, varyantlar birlikte, teklifli ürünler atlanır. Uygulama tek işlemde; işlem kaydına ürün bazında eski → yeni |
| Sil | Önce etki: kalıcı silinecek panel ürünleri (adlarıyla), satışa kapatılacak katalog ürünü sayısı, silinecek grup indirimleri; "Kalıcı olarak sil" onayı (sunucu da onaysız silmeyi 409 ile reddeder). Geçmiş siparişler etkilenmez. Satışa kapatılan katalog ürünü ürün düzenleyicisinden tek tek açılır |

- **Yetki:** okuma tüm roller, değişiklik Sahip/Yönetici/Editör (katalogla aynı).
- **Veritabanı:** yeni `ProductGroup` tablosu; Discount'a `brandName`, `groupId`; ProductOverride'a `salesClosed` (hepsi boş bırakılabilir, onaysız eklenir).
- **Doğrulama:** `tsc` temiz, birim testleri 170/170 (yeni `tests/unit/product-groups.test.ts`). Yerel uçtan uca 19/19: grup (1 ürün + Victron 64 + Jel Akü 5 = 70 ürün), boş grup 400, grup indirimi yalnız üyelere (6440 → 5796), marka indirimi, olmayan gruba indirim 400, satışa kapatınca vitrin "Satışa kapalı" ve sepet reddi (panel stoğu korunuyor), yeniden açma, zam önizlemesi fiyatı değiştirmiyor, uygulama 677,16 → 744,88 USD ve mod korunuyor, %900 400, onaysız silme 409 + etki, silmede panel ürünü 404 / katalog ürünü satışa kapalı / grup indirimi silindi, ürün düzenleyiciden tek tek açma.
- **Sınırlar:** Satışa kapatma ürünü siteden gizlemez (bilinçli). Katalog ürünleri kalıcı silinemez (tedarikçi dosyasından gelir). Toplu zam geri alınamaz; geri almak için ters yüzde uygulanır (yuvarlama nedeniyle birebir dönmeyebilir).

## Yönetim paneli denetimi A01–A18 (23.10.2026)
Kaynak: "Voltekno yönetim paneli detaylı denetim raporu" (23.10.2026, 18 bulgu). Raporun önerdiği sırayla ilk beş madde. Ayrı 34 maddelik müşteri tarafı listesi bu turda ele alınmadı.

| Kod | Durum | Yapılan değişiklik | Kapanış testi |
|---|---|---|---|
| A01 Ciro tanımı | Düzeltildi | Ortak tanımlar `lib/revenue.ts`: **Tahsilat** = Ödendi/Kısmi iade, iptal/iade durumunda olmayan siparişler, ödeme tarihine göre, tamamlanmış ücret iadeleri düşülmüş. **Sipariş hacmi** = dönemde verilen, iptal/iade edilmemiş siparişler (ödeme bekleyenler dahil), ciro diye etiketlenmiyor. Genel Bakış "Bu ay tahsilat", İstatistikler'de 4 kart (Tahsilat, Ödenen sipariş, Sipariş hacmi, Sipariş sayısı), grafik Tahsilat/Sipariş hacmi seçmeli, en çok satanlar yalnız ödenmiş siparişler ("ürün bedeli KDV dahil, indirim öncesi" yazıyor), durum dağılımı "iptal ve iade dahil" diye etiketli. Müşteri kartındaki "Ödenen toplam" aynı kuralı kullanıyor (kısmi iade dahil, iadeler düşülmüş) | Veritabanı kopyasında: 30 gün tahsilat 10.231,36 TL / 4 ödenen sipariş, sipariş hacmi 56.950,16 TL / 9 sipariş, tümü 22 (iptaller dahil). Ödeme bekleyen sipariş tahsilatı ve en çok satanları artırmıyor. Birim testi: ödeme bekleyen, iptal, iade ve kısmi iade kuralları |
| A02 Gün sınırı | Düzeltildi | `lib/business-time.ts`: işletme saati Europe/Istanbul tek noktada. Genel Bakış (bugün, ay başı, başlık tarihi), İstatistikler (dönem bugün dahil son N İstanbul günü, grafik ekseni İstanbul günü), muhasebe dökümü (varsayılan bitiş İstanbul bugünü, gün başı/sonu İstanbul, dosya adı), katalog ve izin CSV dosya adları. Başlangıç bitişten büyükse indirme bağlantısı yerine açık hata | "Bugün" yalnız 23 Eki'yi getirdi (önce 22 Eki). Birim testi: 22 Eki 23.59 / 23 Eki 00.01 ayrı gün, UTC 21.30 → ertesi gün, ay sonu, yıl sonu, geçersiz tarih |
| A03 Varyant stoğu | Düzeltildi (ürün bazında seçilebilir) | Düzenleyicide "Varyantlar ayrı stoklanır" kutusu. Açıkken her varyantın stoğu ayrı (StockOverride `ürünId::varyantAnahtarı`), ürün stoğu varyant toplamı. Sepet, sipariş, iptal ve iade ilgili varyantın stoğunu değiştiriyor (sipariş satırında `stockKey`). Ürün sayfasında seçili varyantın stoğu ve stoksuz varyantta "Tükendi". Listede satır stoğu "toplam" bağlantısı. Ürün bazında stok yazan işlemler (tek satır, toplu stok, CSV içe aktarma) bu ürünleri atlıyor. Kapatınca ortak stok varyant toplamıyla başlıyor. Kapalı ürünlerde eski davranış (ortak stok) aynen sürüyor | 450 Wp=2, 600 Wp=0: 600 Wp sepette reddedildi, 450 Wp 3 adet reddedildi, 2 adet kabul. Aynı anda iki 2'şer adetlik sipariş: biri açıldı, diğeri 409. 600 Wp stoğu değişmedi. İptal yalnız 450 Wp'ye 2 ekledi. Ürün bazında stok yazımı 409 |
| A04 Varyant SKU araması | Düzeltildi | `lib/admin-product-search.ts`: ad, SKU, id, marka, varyant adı ve varyant SKU'su. Büyük/küçük harf, boşluk ve `- _ . /` yok sayılıyor. Eşleşen varyant satırda "Eşleşen varyant: …" olarak görünüyor | `TOMMAT-TT600144TN10-00073` → TommaTech 16BB, "Eşleşen varyant: 600Wp…". Birim testi: ana SKU, "600 wp", marka, bulunamayan kod |
| A05 Fiyat modu | Düzeltildi (katalogda döviz fiyatı olan ürünler) | ProductOverride'a `priceMode` (fx/fixed) ve `basePrice`. Düzenleyicide "Dövize bağlı / Sabit TL" seçimi, kullanılan kur, kaynağı ve saati. Dövize bağlıda USD/EUR fiyat girilir, bugünkü TL karşılığı gösterilir, "Katalog fiyatı" ile geri dönülür. Mod değişikliği kaydedilmeden önce mevcut ve yeni davranışı gösteren onay penceresi çıkıyor. Dövize dönüşte varyant döviz fiyatları katalogdan geri yükleniyor, sabit TL'de varyantlar da o anki TL değerinde sabitleniyor. Varyant fiyat sütunu modun para biriminde. Mod, fiyat ve varyant stoğu değişiklikleri eski → yeni değerleriyle İşlem Kaydı'na ("Ürün fiyat/stok ayarı değişti") yazılıyor. CSV fiyat içe aktarma açıkça sabit TL yazıyor | Dövize bağlı 142,56 USD × 49,654 = 7.079 TL → Sabit TL 9.999 (varyant döviz fiyatları kalktı) → Dövize bağlı 7.079 TL (varyant döviz fiyatları 142,56/203,04 geri geldi). 200 USD girişi 9.931 TL verdi, mod korundu. Geçersiz mod 400 |

- **Doğrulama:** `tsc` temiz, birim testleri 143/143 (yeni `tests/unit/admin-a01-a05.test.ts`, 12 test), üretim derlemesi başarılı. Senaryolar yerel test sunucusunda (3013, veritabanı kopyası, SMTP kapalı, `.claude/launch.json` "A01-A05 Test 3013") API ile, İstatistikler, ürün araması ve düzenleyici ekranda denendi. Playwright çalıştırılmadı.
- **Veritabanı:** `prisma/schema.prisma`'ya üç boş bırakılabilir sütun eklendi (`variantStock`, `priceMode`, `basePrice`); yayında `prisma db push` onaysız ekler. Mevcut kayıtlar değişmiyor: panelde TL fiyatı girilmiş eski ürünler "Sabit TL", diğerleri "Dövize bağlı" görünür.
- **Sınırlar:** Yeni (panelde eklenen) ürünlerde dövizli fiyat yok, A06 kapsamında. Ayrı varyant stoğu ürün oluşturulduktan sonra açılabilir. Liste kartından sepete eklemede tarayıcı sınırı ürün toplamıdır; sunucu ve sepet doğrulaması varyant stoğuyla düzeltir. Sipariş verildikten sonra stok modu değiştirilirse iptal/iade, siparişin verildiği moddaki stok satırına döner. Daha düşük rollerin sunucu yetkisi bu turda denenmedi.
- **Rapordan kalanlar:** yok; A06–A18 aşağıda, hepsi `38d6d1b` ile canlıda. Kodla kapanamayan iki kalan sizde: A10 gönderen adresi `@voltekno.com` kutusu, A12 Sahip hesabında 2FA açılması ve `ADMIN_TOTP_SECRET`.

### A06–A08 (23.10.2026)
| Kod | Durum | Yapılan değişiklik | Kapanış testi |
|---|---|---|---|
| A06 Dövizli fiyat ve maliyet | Düzeltildi | Yeni ürün formunda "Fiyat para birimi: TL / USD / EUR". USD/EUR ürün dövize bağlı oluşturuluyor (TL fiyatı güncel kurla), sonradan A05'teki gibi Sabit TL'ye geçilebiliyor; varyantlar da döviz fiyatıyla tanımlanıyor. "Maliyet ve kâr" bölümü: alış maliyeti (TL/USD/EUR), hedef kâr marjı; güncel kurla maliyet, şu anki kâr ve hedef marj için en düşük satış fiyatı gösteriliyor. Maliyet yalnız Sahip ve Yönetici rolüne gidiyor (`canSeeCost`); vitrin, ürün listesi, ürün API'si ve kayıt yanıtlarında yok; tutar işlem kaydına yazılmıyor | 100 USD ürün → 4.966 TL (kur 49,654). Maliyet yalnız yönetici ürün yanıtında; vitrin ürün API'si, panel listesi ve kayıt yanıtında yok. Birim testi: editör/operatör rolünün gönderdiği maliyet yok sayılıyor |
| A07 Lojistik verileri | Düzeltildi | "Kargo ve teslimat" bölümü: satış biçimi (kargo ile / kurulum ve nakliye ayrıca / teklifle), koli ölçüsü (U×G×Y cm), koli ağırlığı, koli sayısı; desi ön hesabı ekranda. Desi = koli sayısı × max(hacim/3000, kg). Panel lojistiği sepet, ödeme, sipariş, ürün sayfası kargo ücreti, Merchant akışı, Navlungo/Geliver gönderi ölçüsü ve kargo etiketinde desi.json'un yerine geçiyor (sipariş satırına yazılıyor). **Önceden panelde eklenen ürünler 0 desi sayılıyor, kargosuz gidiyordu.** Katalog ürünlerinde girilmezse katalog değeri sürüyor | 30×20×10 cm, 0,5 kg → 2 desi; 2 adetlik siparişte kargo 4 desi / 1 kg, 106 TL; ölçü 60×50×40 / 12 kg yapılınca sepet 40 desi; kurulumlu seçilince kargoya girmiyor. Birim testi: küçük aksesuar, 490 kg cihaz, iki koli paletli ürün, ağır parça |
| A08 Taslak, önizleme, yayın | Düzeltildi (panelde eklenen ürünler) | Yeni ürün **taslak** olarak oluşuyor. Taslak arama, kategori, ürün API'si, site haritası, Merchant akışı, sepet ve "stok gelince haber ver"de yok. Düzenleyicide Yayın kutusu: Önizle (`/onizleme/[id]`, yalnız yönetici oturumuyla, arama motorlarına kapalı), Yayına al, Taslağa al. Yayına alırken zorunlu alanlar sunucuda denetleniyor (ad, kategori, fiyat, varyant fiyatları, en az bir görsel, kargoyla gönderilecekse koli ölçüsü ve ağırlık); eksikler adlarıyla gösteriliyor. Taslağa almak siparişleri silmiyor. Ürün listesinde "Taslak" yazıyor. Mevcut panel ürünleri yayında kalıyor | Taslak: ürün API'si 404, aramada ve site haritasında yok, sepette reddedildi; önizleme yöneticisiz 404, yöneticiyle 200. Görsel yokken yayına alma 400 ("eksik: En az bir görsel"), görselle 200. Taslağa alınca vitrinde 404, sipariş kaydı duruyor. İşlem kaydı: Yayına alındı / Desi 2 → 40 / Satış biçimi / Yayından kaldırıldı |

- **Doğrulama:** `tsc` temiz, birim testleri 149/149 (yeni `tests/unit/admin-a06-a08.test.ts`), üretim derlemesi başarılı, senaryolar aynı yerel test sunucusunda API ile ve yeni ürün ekranı tarayıcıda denendi. Test ürünü silindi, test siparişi iptal edildi (yalnız veritabanı kopyasında).
- **Veritabanı:** ProductOverride'a boş bırakılabilir 10 sütun daha (`priceCurrency`, `costPrice`, `costCurrency`, `targetMargin`, `dimensionsCm`, `weightKg`, `packageCount`, `desi`, `saleMode`, `status`).
- **İşlem kaydı notu:** A05/A06'daki "Ürün fiyat/stok ayarı değişti" kaydı A09 ile "Ürün güncellendi" satırına (alan bazında) taşındı.
- **Sınırlar:** Katalog ürünleri taslağa alınamaz (vitrinin birçok yeri katalog dosyasını doğrudan okuyor; gizleme sızardı). Panelde girilen koli bilgisi bütün varyantlara uygulanır (varyant bazında koli ayrı girilmiyor). Panelde eklenen dövizli ürünün para birimi sonradan değiştirilemiyor. Panelde katalogdaki kurulumlu bir ürünü "kargo ile" yapmak için koli bilgisi de girilmeli. Önizleme sayfası ürünü sepete eklemeye izin vermiyor (sunucu reddeder). Maliyet raporu (toplu kârlılık) yok; yalnız ürün düzenleyicide.

### A09–A12 (23.10.2026)
| Kod | Durum | Yapılan değişiklik | Kapanış testi |
|---|---|---|---|
| A09 İşlem kaydı | Düzeltildi | Kayda nesne türü, nesne kimliği (ürün id'si / sipariş no) ve alan bazında değişiklikler (`changes`: alan, eski, yeni) eklendi (`lib/audit-diff.ts`). Ürün düzenleme (ad, fiyat, döviz fiyatı, mod, stok, varyantlar, görseller, açıklamalar, kargo, yayın durumu…), tek satır stok, toplu ürün işlemi (etkilenen her ürün, stokta eski → yeni) ve sipariş işlemi (durum, ödeme, kargo, takip no, not, Geliver/Navlungo, iade talepleri) kendi kaydını yazıyor; bunlar için genel "PATCH adres" satırı artık yazılmıyor. Parola, gizli anahtar, token alanları yazılmaz; maliyet tutarı yazılmaz. İşlem Kaydı ekranı: metin, nesne, tür (ürün/sipariş), tarih aralığı (Türkiye günü) süzgeci, 50'şer sayfa, "N değişiklik" ile eski/yeni tablo, nesneye tıklayınca onun geçmişi. Saklama: 730 gün (`AUDIT_RETENTION_DAYS`, en az 90), daha eskisini günlük görev siler; ekran sayfalaması saklamadan bağımsız | Garanti ve öne çıkan değişikliği: "Öne çıkan: Evet → Hayır · Garanti: — → A09 test garantisi"; stok "2 → 3"; sipariş notu "— → A09 not"; aynı işlemler için genel satır yok; tarih süzgeci (bugün 49 kayıt) ve başlangıç > bitiş 400. Birim testi: fiyat 100→110, stok 5→4, not; gizli alanlar düşüyor; varyant ekle/kaldır/fiyat |
| A10 Gönderen e-posta | Kod kısmı düzeltildi; gönderen adresi sizde | Test/ayrılmış alan adlarına (example.com, .test, .invalid, .localhost, placeholder.local) e-posta gönderilmiyor; zaman çizelgesinde "test adresi (gerçek alıcı değil, gönderilmedi; altyapı hatası değildir)" yazıyor. SMTP hataları nedeniyle ve "yeniden gönderilebilir" bilgisiyle yazılıyor (kimlik doğrulama, bağlantı, zaman aşımı, alıcı reddi, gönderen reddi, yapılandırma yok). Sipariş zaman çizelgesinde yeniden gönderilebilir hatada "Yeniden gönder"; aynı ileti sonradan gönderildiyse ya da eşzamanlı ikinci tıklamada tekrar gönderilmez. Sistem Durumu: gönderenin şu anki alan adı, SPF/DKIM notu ve son 7 gün özeti (gönderildi / altyapı hatası / test adresi, son hata nedeni). "Gönderildi" SMTP'nin kabul ettiği demek; alıcıya teslim ayrıca doğrulanmıyor | Example.com müşterisi: müşteri e-postası "test adresi" kaydıyla, yeniden gönderim 409. SMTP kapalıyken yönetici e-postası "e-posta servisi yapılandırılmamış (yeniden gönderilebilir)"; aynı anda iki "Yeniden gönder": biri denendi (yine gönderilemedi, 502), diğeri 409, mükerrer yok. **Gönderen adresini `@voltekno.com` yapmak (`SMTP_FROM`/`SMTP_USER`, alan adının SPF/DKIM'i) ve gerçek test alıcısıyla sipariş/hatırlatma/iptal e-postası denemesi sizde** |
| A11 Görev durum etiketleri | Düzeltildi | Görev sonucu ayrı tutuluyor: Başarılı / Çalıştı, yeni kayıt yok / Kapalı (yapılandırılmamış) / Atlandı / Hatalı. Kapalı Geliver ve Navlungo artık "Başarılı" değil "Kapalı". Son deneme ile son başarılı çalışma ayrı gösteriliyor; kapalı/atlanan/hatalı deneme son başarılıyı değiştirmiyor. Eski kayıtlar özetten doğru sınıflanıyor | Eski biçimli durum kaydında Geliver "kapalı" özeti ve Navlungo → Kapalı, yedek → Başarılı. Birim testi: eski/yeni kayıtlar |
| A12 2FA | Kod kısmı düzeltildi; 2FA kurulumu sizde | Ana yönetici şifresi artık 2FA'yı aşan bir yol değil: 2FA'lı en az bir Sahip hesabı varken ve `ADMIN_TOTP_SECRET` yokken ana şifre tek başına giriş açmıyor; açık ana şifre oturumları da düşüyor (önizleme sayfası dahil). `ADMIN_MASTER_LOGIN=off` ana şifreyi tamamen kapatıyor; `=allow` yalnız acil durum için (Sistem Durumu uyarır). Doğrulama kodu ikinci kez kullanılamıyor (kişisel hesapta `totpLastStep`, ana şifrede `Sequence.adminMasterTotpStep`; eşzamanlı iki giriş tek kabul). Hatalı/tekrar kod denemesi işlem kaydına yazılıyor. Sistem Durumu: "İki adımlı doğrulamalı Sahip hesabı" ve "Ana şifre 2FA'yı aşmıyor" kontrolleri, hesap kurtarma yolu (ikinci Sahip hesabı veya geçici `ADMIN_MASTER_LOGIN=allow`, kullanılınca kaldırılır) | Test Sahip hesabı (yalnız kopya veritabanında) ile: ana şifre 403, kod istemi, yanlış kod 401, doğru kod 200, aynı kod ikinci kez 401; Sistem Durumu iki kontrol de tamam. Birim testi: kural tablosu, tekrar kod. **Sahip hesabı açıp 2FA'yı açmak ve sonra ana şifreyi kapatmak (`ADMIN_MASTER_LOGIN=off`) ya da `ADMIN_TOTP_SECRET` tanımlamak hesap sahibinde** |

- **Doğrulama:** `tsc` temiz, birim testleri 159/159 (yeni `tests/unit/admin-a09-a12.test.ts`), üretim derlemesi başarılı; açık ana şifre oturumunun kural değişince düştüğü (API 401, önizleme 404) denendi; senaryolar yerel test sunucusunda (veritabanı kopyası, SMTP kapalı) API ile, İşlem Kaydı ekranı tarayıcıda denendi.
- **Veritabanı:** AdminAuditLog'a `objectType`, `objectId`, `changes`; AdminUser'a `totpLastStep` (boş bırakılabilir, onaysız eklenir).
- **Yayında dikkat:** Canlıda 2FA'lı Sahip hesabı açıldığı an, `ADMIN_TOTP_SECRET` tanımlı değilse ana şifreyle giriş ve açık ana şifre oturumları kapanır. Önce Sahip hesabıyla 2FA'lı girişi deneyin. Yeni ortam değişkenleri isteğe bağlı: `ADMIN_MASTER_LOGIN` (off/allow), `AUDIT_RETENTION_DAYS`.
- **Sınırlar:** Alan bazında kayıt ürün, stok, toplu ürün ve sipariş işlemlerinde; kampanya, kupon, kullanıcı, içe aktarma gibi diğer işlemler eski biçimde (kim, ne zaman, hangi adres) kalıyor. Eski kayıtlarda değişiklik dökümü yok. Yeniden gönderme müşteri durum e-postaları, "sipariş alındı" ve yönetici e-postaları için; fatura e-postasının kendi düğmesi var. Kişisel hesap oturumlarında rol/pasiflik her istekte zaten denetleniyordu.
- **Rapordan kalanlar:** A13–A18 aşağıda.

### A13–A18 (23.10.2026)
| Kod | Durum | Yapılan değişiklik | Kapanış testi |
|---|---|---|---|
| A13 Kampanya geçerliliği | Düzeltildi | Listede açık/kapalı ayarından ayrı durum: Planlandı / Devam ediyor / Süresi doldu / Kapalı (`lib/campaign-rules.ts`, mağaza fiyatlandırmasıyla aynı kural). Tarih-saat kutuları Türkiye saatini gösterip Türkiye saatiyle kaydediyor (önce UTC saati yerel gibi gösteriliyordu; 22.10 23.59 bitişli kampanya fiilen 22.10 03.00'te bitiyordu). Tarihler listede saatle ve "Türkiye saati" notuyla | Birim testi: new10 (22.10 00.00–23.59) 23 Ekim'de "Süresi doldu"; gelecek "Planlandı"; kutu 23.59 ↔ 20.59 UTC |
| A14 Kampanya/kupon doğrulaması | Düzeltildi | Ortak kural: yüzde 0'dan büyük, en fazla %99 (tam %100 kabul edilmiyor, iş kuralı olarak), sabit tutar > 0, bitiş başlangıçtan önce olamaz, kullanım sınırı en az 1. Kampanya formu (tarayıcıda, kaydetmeden hata gösteriyor), kampanya oluşturma/güncelleme ucu (sunucuda, kayıttaki değerlerle birleştirerek) ve kupon (önceki sınır 100 → 99) aynı kuralı kullanıyor. Kampanya kaydı hatası artık sessizce yutulmuyor | Birim testi: 101, −5, 0 ve 100 reddediliyor, 99 kabul; kupon %100 ve kullanım sınırı 0 reddediliyor; ürün fiyatını aşan sabit kampanya fiyatı 0'a indirmiyor |
| A15 İptal sipariş etiketleri | Düzeltildi | Ödenmeden iptal edilen sipariş "Ödenmedi · sipariş iptal" (detay) / "Ödenmedi · iptal" (listeler) görünüyor, "Ödeme bekleniyor" değil; ödenmiş iptal "Ödendi · iptal, ücret iadesi bekleniyor". İptal siparişte paketleme formu, kargo etiketi ve sipariş özeti gönderimi kapalı (sunucu da 409 veriyor). "Faturayı E-postayla Gönder" → "Sipariş Özetini (Proforma) Gönder", mali fatura olmadığı ve alıcı adresi yazıyor, göndermeden önce onay istiyor | Tür denetimi ve derleme; sunucu korumaları kod incelemesiyle |
| A16 Toplu stok | Düzeltildi | "Stok ayarla" → "Toplu stok işlemi": Stok ekle / Stok çıkar / Stoğu eşitle. Kaydetmeden önce seçili her ürün için mevcut → yeni → fark tablosu, değişecek ürün sayısı düğmede; ayrı varyant stoklu ürünler "atlanır". Sunucuya `adjust_stock` eklendi; stok 0'ın altına inmiyor; işlem kaydına ürün bazında eski → yeni yazılıyor | Birim testi: 5'e +3 → 8, 3'e eşitle → 3, çıkarma 0'da duruyor, değişmeyen kayıt sayılmıyor |
| A17 Varyant görselleri | Düzeltildi | Görseller bölümünde "Varyant görselleri": her varyant için genel galeriden görsel atama veya "Genel galeriyi kullan"; öncelik kuralı ekranda yazıyor. Varyant görselleri varyant anahtarıyla tutuluyor (`variantImages`), sıra değişince kaymıyor; genel galeri değişince kendi görseli olan varyantlar korunuyor (önce katalog varyant görselleri genel galeri değişince siliniyordu) | Tür denetimi ve derleme |
| A18 Açıklama kaynağı | Düzeltildi | Detaylı açıklamada "Gösterilen: katalog açıklaması / panel metni" etiketi, katalogdaki biçimli açıklamanın önizlemesi ve "Katalog açıklamasına dön". Yalnız değişen alanlar kaydedildiği için ilgisiz kayıt açıklamayı silmiyor | Tür denetimi ve derleme |

- **Doğrulama:** `tsc` temiz, birim testleri 165/165 (yeni `tests/unit/admin-a13-a18.test.ts`).
- **Veritabanı:** ProductOverride'a `variantImages` (boş bırakılabilir).
- **Sınırlar:** Varyanta doğrudan görsel yükleme yok (genel galeriye yükleyip atanıyor). Katalog açıklamasını panelde biçimli düzenleme yok (bilinçli: zengin editör eklenmedi).

## AFT Power ürünleri (22.10.2026, `f50a456`; canlıda `2259d5b`)
Kaynak: AFT Power ürün föyleri ve fiyat listesi (kullanıcıdan). Ürünler `scripts/data/extra-products.json`'dan içe aktarıcıyla gelir (Excel'de değiller); mevcut 338 ürünün hiçbiri değişmedi, katalog 347 ürün.

| Ürün | Seçenekler | Satış |
|---|---|---|
| AFT DC Hızlı Şarj İstasyonu (Grid Core) | 45 / 90 / 135 / 180 kW: 9.712,50 / 11.224,50 / 14.437,50 / 15.697,50 $ | Satın alınır |
| AFT PRO DC Hızlı Şarj İstasyonu | 90 / 180 / 270 kW: 17.325 / 23.625 / 27.825 $ | Satın alınır; **föyü ve fotoğrafı yok** (yer tutucu görsel, kısa açıklama) |
| AFT PRO V2 DC Hızlı Şarj İstasyonu (Grid Pulse Gen2) | 90 / 180 / 270 kW: 18.375 / 24.675 / 28.875 $ | Satın alınır |
| AFT Güç Katmanı modüler enerji depolama, 5,4 kWh LFP batarya, 2,7 kWh LFP batarya, 5,4 kWh tekerlekli, 2,7 kWh çanta tip ve 2,7 kWh güç paketi | — | Teklifle |

- **Fiyat:** USD fiyatlar katalogdaki diğer ürünler gibi KDV hariç kabul edildi ve günlük kurla TL'ye çevriliyor (45 kW ≈ 480 bin TL + KDV). KDV dahil fiyatlar verildiyse `extra-products.json`'da düzeltilmeli.
- **Şarj istasyonu (satın alınır):** ürün sayfası, sepet, ödeme ve sipariş zaman çizelgesinde "Kurulum ve nakliye fiyata dahil değildir; siparişinizden sonra sizinle iletişime geçeriz". Kargo ücretine girmez; sepette yalnızca istasyon varsa kargo "Ayrıca planlanır" (0 TL). Ürün şemasında fiyat var, kargo bilgisi yok; Merchant akışına girmez.
- **Teklifli ürün:** fiyat yerine "Fiyat için teklif alın", ürün sayfasında WhatsApp (hazır mesaj), telefon, e-posta ve iletişim formu; sepete eklenemez, sunucu siparişi reddeder, şemada fiyat yok, fiyata göre sıralamada sona düşer, fiyat filtresi onu elemez.
- **Görseller:** föylerdeki ürün fotoğrafları kırpılıp zemini beyaza çekildi (`public/images/products/override/aft-*.webp`).
- **Doğrulama:** birim testleri 131/131 (yeni: kurulumlu ürün kargoya girmiyor), Playwright 100 geçti / 0 kaldı (yeni `tests/sale-mode.spec.ts`), yerelde istasyon siparişi kargo 0 ile açıldı ve teklifli ürün siparişi reddedildi.

## İstek turu 7 (22.10.2026, `1273400`..`9079788`; canlıda `953b9ba`)
| İstek | Yapılan |
|---|---|
| Kargo kaynağında "önceki fiyat listesi" yazmasın | Yönetim panelinde yalnızca "Geliver" ya da "Navlungo" |
| İptal edilen sipariş cirodan düşsün, yalnızca iptalde kalsın | İstatistikler sayfasında iptal ve iade edilen siparişler ciroya, sipariş sayısına, ortalamaya ve en çok satanlara girmez; durum dağılımında ayrı satırda görünür (o da artık seçilen döneme göre). Ana pano ve müşteri toplamları zaten böyleydi. Yerel kopyada doğrulandı: 90 günde 20 iptal (78.436 TL) ve 2 iade cirodan düştü |
| Geliver entegrasyonu neden bitmedi | Takip 21.10'dan beri canlıda ama anahtar girilmediği için çalışmıyor; gönderi oluşturma yoktu. Eklendi (aşağıda) |
| Favoriler her hesaba özel olsun | Eski sürümde misafir favorileri tarayıcıda (`guest-favorites`) kalıyordu ve o tarayıcıda giriş yapan ilk hesaba taşınıyordu; taşıma kaldırıldı, eski liste silinir. Yalnızca girişten hemen önce o sekmede favoriye dokunulan ürün eklenir. Yeni hesabınıza önceden taşınmış ürünleri favorilerden bir kez elle kaldırmanız gerekir |
| Telefon ve e-posta kontrol edilsin | Tek kural, bütün formlarda ve sunucuda: telefon başında 0 ile 11 hane, 0'sız 10 hane ya da +90 ile; cep (5xx) veya sabit hat. E-posta `ad@alan.uzantı`, boşluk ve art arda nokta yok, uzantı en az 2 harf. Uygulanan yerler: ödeme (zaten vardı), iletişim, GES teklifi ve teklif doğrulama, kayıt, profil ve adres, stok uyarısı, ürün sorusu, şifre sıfırlama, yönetici kullanıcıları |

**Geliver'den gönderi oluşturma** (yönetim paneli → sipariş → Kargo → "Geliver ile kargoya ver"):
1. Desi ve ağırlık sipariş anındaki kargo teklifinden dolu gelir, değiştirilebilir. "Teklifleri al": siparişin adresiyle Geliver'de gönderi açılır, kargo firmalarının teklifleri (KDV dahil fiyat, tahmini süre) listelenir; sipariş anında fiyatı verilen firma "önerilen" olarak seçili gelir.
2. "Etiketi satın al": seçilen teklif kabul edilir, ücret Geliver bakiyesinden düşer, etiket PDF'i ve barkod gelir ("Etiketi indir").
3. Kargo firması paketi teslim alınca takip siparişi "Kargoda" yapar ve müşteriye takip linki gider; teslimde "Teslim Edildi".
4. Etiket alınmadan "Yeniden teklif al" (yeni ölçüyle) ya da "Gönderiyi iptal et"; kargoya verilmeden önce etiket alınmış gönderi de iptal edilebilir.
- Adres: sitenin 81 il ve 973 ilçesinin hepsi Geliver'in il plaka kodu ve ilçe kimliğiyle eşlendi (`lib/shipping/geliver-districts.json`, `scripts/build-geliver-districts.mjs`). Eşleme sırasında ödeme sayfasındaki ilçe listesinde 3 yazım hatası bulundu ve düzeltildi: İhsaniye, Bozdoğan, Eceabat.
- Güvenlik: ödenmemiş ya da kargoya uygun olmayan siparişte açılmaz, Navlungo gönderisi olan siparişte açılmaz, yalnızca kayıtlı teklif kabul edilir, aynı siparişte eşzamanlı ikinci tıklama reddedilir.
- `GELIVER_TEST_MODE` 0/false yapılmadıkça gönderiler **test gönderisi**dir: ücretsiz, gerçek kargo çıkmaz, sipariş durumunu, takip numarasını ve müşteri zaman çizelgesini değiştirmez. İsteğe bağlı `GELIVER_SENDER_ADDRESS_ID` (yoksa hesabın varsayılan gönderici adresi, şu an Elazığ / Merkez).
- **Gerçek Geliver API'sinde test gönderileriyle doğrulandı:** gönderi açıldı, teklif geldi (test modunda tek teklif, 0 TL), etiket alındı (PDF 16 KB, barkod), durum her sorguda ilerledi (şubede → alıcı şubede → dağıtımda) ve sipariş durumu değişmedi; yeniden teklif eski gönderiyi Geliver'de iptal etti, iptal gönderiyi siparişten kaldırdı. Gerçek (ücretli) etiket denenmedi: Geliver hesabının onayı ve bakiye gerekir.

**Doğrulama:** tip kontrolü ve lint temiz, birim testleri 130/130 (yeni: Geliver gönderi oluşturma, adres eşleme, koli ölçüsü, telefon/e-posta kuralları), derleme temiz, Playwright (akış testleri dahil) 98 geçti / 0 kaldı.

## İstek turu 6 (22.10.2026, `fe166ff`..`eb657ae`; canlıda `953b9ba`)
| İstek | Yapılan |
|---|---|
| Akü kutusunda bu kadar detay olmasın | Kutuda yalnızca "Kargo ve nakliye için iletişime geçin" başlığı ve iletişim düğmeleri; kargo sayfası ve sunucu mesajı da tek cümle |
| Mobilde hero ve "Hangi İhtiyaç İçin?" kartları | Hero: başlık iki satır, sarı düğme 150 px, noktalar düğmenin sağında, boşluk yok; sulama görselinde ürünlerin tamamı görünür. Paket kartları mobilde iki sütun, kare, başlık taşmıyor, son kart tam genişlik. 25 sayfa 320 px'te tarandı, yatay taşma yok |
| Satın almayan değerlendirme yapamasın, formu bile görmesin | Form yalnızca giriş yapmış ve ürünü teslim almış üyeye görünür, ürün başına bir değerlendirme. Misafire "Değerlendirmeleri yalnızca bu ürünü satın alan müşterilerimiz yazabilir. Giriş yapın", alıcı olmayan üyeye "satın alıp teslim aldıktan sonra" notu. Sunucu misafiri 401, alıcı olmayanı 403, ikinci yorumu 409 ile reddeder (`/api/products/[id]/reviews/eligibility`) |
| Victron 120 V ürünler | Satıştan kaldırıldı (`scripts/data/delisted.json`, içe aktarıcı bu SKU'ları atlar) |
| Yeni sayfa en baştan başlasın, klasik kurallar | Ürün listesinde sayfa değişince en üste dönülür; sayfa numarası adreste (`?page=3`): geri tuşu önceki sayfaya, yenileme ve paylaşılan bağlantı aynı sayfaya gider; sunucu istenen sayfayı çizer. Filtre/arama/sıralama değişince 1. sayfa. Uzun listede `1 … 6 7 8 … 15`. Yönetim panelinde de sayfa değişince başa dönülür. Sayfa geçişlerini ortadan başlatan genel yumuşak kaydırma kaldırıldı |
| Açılır menü hiçbir boyutta kesilmesin | Kategori menüsü açılınca ölçülüp ekranın içine kaydırılır, dar ekranda daralır; 1025–1920 px arası 9 genişlikte her menü testte açılıp ölçülüyor |
| Yönetim girişi (e-posta + ana şifre "hatalı") | Canlıda henüz kişisel yönetici hesabı yok; e-posta yazılınca sistem o hesabı arıyordu. Artık kişisel hesabı olmayan e-postayla ana şifre girilirse ana şifre girişi sayılır; yanlış şifre yine reddedilir. Yayına kadar canlıda e-posta alanı boş bırakılarak girilir |
| Eksik fotoğraflar, tahmini desiler, teyitler | Üç resmî kaynak araştırması: Victron kablo/aksesuarlarında ağırlık yayımlanmıyor (fiyat listesinde bile boş); TommaTech, Apex, Havensis, NP Power ürünlerinin çoğunda resmî ağırlık yok. Electrozirve DC-DC 30A/40A (3 SKU) ve TommaTech 48V 200A duvar tipi şarj ünitesi resmî değerle güncellendi. Daha düşük güçlü kardeş modelden gelen ve tahmini düşürecek değerler kullanılmadı. Fotoğraflar ve teyit cevapları yukarıda "Kalanlar 5" |

**GTIN (barkod) gerekli mi:** Site çalışması ve yasal açıdan zorunlu değil. Google Merchant Center'da üreticinin barkodu olan ürünlerde GTIN beklenir; yoksa ücretsiz listeleme ve alışveriş reklamlarında görünürlük sınırlanır (şu an akış "tanımlayıcı yok" bildiriyor). Trendyol/Hepsiburada gibi pazaryerlerinde barkod zorunlu. Eklemek için ikas Excel'indeki `Barkod Listesi` sütunu (kutu etiketindeki 13 haneli EAN) doldurulur; içe aktarıcı ve akış o sütunu okuyacak şekilde ayarlanır (henüz okumuyor). Victron'un resmî ürün sayfalarında GTIN-13 yayımlanıyor, Victron ürünleri oradan otomatik doldurulabilir.

**Doğrulama:** tip kontrolü ve lint temiz, birim testleri 122/122, derleme temiz, Playwright (akış testleri dahil) 98 geçti / 0 kaldı; yeni testler: `tests/reviews.spec.ts`, `tests/navigation.spec.ts`, `tests/unit/pagination.test.ts`.

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
| Firebase bağımlılığı | Ürün yorumları, ürün soruları ve iletişim mesajları artık kendi veritabanımızda. Yorumlarda "Doğrulanmış alıcı" (teslim edilmiş sipariş), mağaza yanıtı, ürün şemasında gerçek puan. GES teklif sayfası, admin girişi ve hesap silme Firebase servis hesabı olmadan çalışır | Eski projenin Firestore'unda yorum/iletişim kaydı yoktu; taşınan koleksiyonlar `users` (adres, favori) ve `newsletter` (26.10) |
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
| E4 | Canlı Firebase hâlâ eski projede | ❌ sizde | Kod hazır. Yeni projede Firestore/Auth/Storage açılıp servis hesabı anahtarı gelince canlı ortamdaki `NEXT_PUBLIC_FIREBASE_*` + `FIREBASE_ADMIN_*` birlikte değiştirilip yeniden yayınlanmalı (adımlar `FIREBASE_SETUP.md`). Veriler 26.10'da taşındı (aşağıda "Firebase geçişi"). Geçiş günü önce `node scripts/firebase-migrate/fs-copy.cjs --apply --overwrite` |
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
| Eski favori / adres / sipariş verisi | ✅ taşındı (26.10) | Karar değişti: 4 Auth hesabı aynı UID ve şifre özetleriyle, Firestore'daki 12 belge aynı yollarla yeni projede (3 kullanıcı profili, 1 adres, 6 favori, 2 bülten kaydı); 12/12 alan alan aynı. CLI `auth:import` şifre özetlerini düşürdü, şifreler `accounts:batchCreate` ile yazıldı. Yeni projede varsayılan "her şeyi reddet" kuralı vardı → repodaki `firestore.rules` + indeksler yüklendi. Betikler `scripts/firebase-migrate/` |

**Veri bağımlılığı:** Prisma `User.id` = Firebase UID. UID'ler korunarak taşındığı için Prisma'daki üye siparişleri, Firestore'daki favoriler ve adresler yeni projede de aynı hesaba bağlı görünür; müşteriler mevcut şifreleriyle giriş yapar. Canlı site yeni projeye geçene kadar yeni veri eski projede birikir. Geçiş günü son eşitleme adımları `FIREBASE_SETUP.md` "Veri taşıma" bölümünde.

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

## voltekno.com geçişi (28.10.2026 kontrolü — geçiş başladı)
**Kullanıcı kararı (28.10.2026):** "artık voltekno.com'a geçelim".

**Bugünkü durum (DNS ve Hostinger salt-okunur kontrol edildi):**
| Konu | Durum |
|---|---|
| Alan adı DNS'i | **Hostinger'da** (ad sunucuları `ns1/ns2.dns-parking.com`). Kayıtları hPanel → Alan adları → voltekno.com → DNS'ten değiştirilir; ikas'a gitmeye gerek yok |
| `voltekno.com` A kaydı | `75.2.120.200` → **hâlâ ikas** (şu anki canlı mağaza) |
| `www.voltekno.com` | CNAME `dns.myikas.com` → **ikas** |
| E-posta | MX Hostinger (`mx1/mx2.hostinger.com`), SPF Hostinger + Firebase, DMARC `p=none` var. Site taşınınca e-posta etkilenmez (MX değişmiyor) |
| Doğrulamalar | `google-site-verification` TXT kaydı var (Search Console daha önce doğrulanmış olabilir), `firebase=voltekno-eticaret` TXT var |
| Hostinger'da voltekno.com sitesi | **Var** (Node.js, 12.04.2026). Üzerinde 16.10'dan kalma eski sürüm (`31f0184`, Node 20) — DNS ikas'ı gösterdiği için kimse görmüyor |
| voltekno.com ortam değişkenleri | Eski set: `DATABASE_URL`, Firebase (8+3), `SMTP_*` (7), `NEXTAUTH_*`, `NEXT_PUBLIC_BASE_URL`, `JWT_SECRET`, `ADMIN_TOKEN`. **Eksik** (nextfirststep.com'da olup burada olmayan): `NEXT_PUBLIC_SITE_URL`, `ADMIN_EMAIL`, `CRON_SECRET`, `BACKUP_DIR`, `FX_CACHE_FILE`. Değerler API'de maskeli; Hostinger değişkenleri yalnızca topluca değiştirilebiliyor |
| nextfirststep.com (test) | Güncel kod (SEO hariç, son yayın `d4c2137`), kendi veritabanı `…/nextfirststep.com/voltekno.db`, `NEXT_PUBLIC_NOINDEX=true` |
| ikas | Aboneliği geçiş doğrulanana kadar iptal edilmemeli (geri dönüş yolu) |

**Geçiş günü sırası (runbook):**
| # | Adım | Kim | Not |
|---|---|---|---|
| G1 | Kararlar: SEO + 132 eski adres yönlendirmesi yayına girsin mi, veritabanı kopyalansın mı, Firebase hangi proje, nextfirststep.com ne olacak | Siz | Aşağıda "Açık kararlar" |
| G2 | voltekno.com ortam değişkenlerini nextfirststep.com'daki setle aynı yapın; farklar: `NEXT_PUBLIC_SITE_URL=https://voltekno.com`, `NEXT_PUBLIC_BASE_URL=https://voltekno.com`, **`NEXT_PUBLIC_NOINDEX` hiç olmasın**, `DATABASE_URL=file:/home/u718952521/domains/voltekno.com/voltekno.db`, `BACKUP_DIR`/`FX_CACHE_FILE` voltekno.com klasörüne, yeni uzun `ADMIN_TOKEN` (+ önerilir `ADMIN_TOTP_SECRET`: `node scripts/admin-2fa-setup.mjs`) | Siz (hPanel) | Şifre/anahtar değerleri benim tarafımdan girilmez. `NEXTAUTH_*` artık kullanılmıyor, silinebilir |
| G3 | Veritabanı: nextfirststep.com'un `/home/u718952521/domains/nextfirststep.com/voltekno.db` dosyasını **ve yanındaki `media/` klasörünü** (panelden yüklenen ürün görselleri veritabanının yanında tutulur, `lib/media-storage.ts`) `/home/u718952521/domains/voltekno.com/` altına kopyalayın (hPanel Dosya Yöneticisi) — ürün düzenlemeleri, stoklar, gruplar, kampanyalar, yönetim kullanıcıları gelir; test siparişleri ve test müşterileri panelden temizlenmeli | Siz | Ya da boş başlatılır: `prisma db push` boş şemayı kurar, katalog dosyalardan gelir ama panelde yapılan her düzenleme kaybolur |
| G3b | Güvenlik taraması temiz ("Yapılacaklar — sıralı" 0. madde; her yayından önce) | Ben | Açık bulgu varsa G4'e geçilmez |
| G4 | Derleme paketi: ana daldan (`urun-katalogu-ikas`, SEO dahil) veya yayın dalından (SEO hariç) zip → `hosting_deployJsApplication` voltekno.com | Ben | Yanıtta `app_type: next`, `node_version: 22` görülmeli; boşsa aynı zip hemen yeniden yüklenir |
| G5 | DNS'i çevirmeden önce test: Hostinger geçici adresi veya hosts dosyasıyla yeni sitenin açıldığı, admin girişi, ürün/kategori sayfaları | Ben + siz | Canlıda sipariş açılmaz |
| G6 | DNS: `voltekno.com` A kaydı → Hostinger IP'si (hPanel voltekno.com sitesi "Alan adını bağla" önerisini gösterir; nextfirststep.com için kullanılan `88.222.222.127` / `2.57.91.108` aynı sunucu kümesi), `www` CNAME → `voltekno.com`. TTL düşük (300) | Siz (hPanel) | İkas kaydını silmek yerine değiştirin; geri dönmek gerekirse eski değerler yukarıda |
| G7 | SSL: Hostinger Let's Encrypt sertifikasını DNS yayılınca kurar (genelde dakikalar–birkaç saat); http→https ve www→kök tek adımda 301 | Siz/Hostinger | |
| G8 | Canlı kontrol: ana sayfa, ürün, kategori, `/robots.txt` (Disallow: / **olmamalı**), `/sitemap.xml`, eski ikas adresleri 308 (ör. `/akuler`, `/alpex-tam-sinus-inverter-2000w`), admin girişi, iletişim formu e-postası | Ben | Sipariş açan betik çalıştırılmaz |
| G9 | Firebase: Authentication → Authorized domains'a `voltekno.com` ve `www.voltekno.com` (hem eski hem yeni projede, hangisi kullanılıyorsa) | Siz | Yoksa Google/e-posta girişi voltekno.com'da çalışmaz |
| G10 | Search Console (alan adı özelliği, DNS TXT zaten var), site haritası gönderimi, "Dizine eklenmesini iste"; Bing Webmaster Tools (Search Console'dan içe aktar); Merchant Center akışı `https://voltekno.com/feed/google-merchant.xml`; Google Business Profile | Siz | 2 hafta "Sayfalar" raporunda 404 artışı izlenir |
| G11 | ikas aboneliği: 1–2 hafta sorunsuz çalıştıktan sonra iptal; ikas'taki sipariş/müşteri kayıtlarının dışa aktarımı alınmalı | Siz | |
| G12 | nextfirststep.com: test ortamı olarak kalır (noindex) veya kapatılır. Kalırsa ortam değişkenine `INTERNAL_CRON=0` eklenmeli: yoksa kendi veritabanı kopyasındaki müşterilere havale hatırlatması / sipariş iptali e-postası göndermeye devam eder | Siz | |

**Canlıya alınca — ürün yapılandırılmış verisi (29.10.2026 eklendi; 28.10 turu, G8 ve G10 ile birlikte):**
| # | Kontrol | Kim | Beklenen |
|---|---|---|---|
| Ü1 | `npm run audit:product-ld -- https://voltekno.com` (site haritasındaki 347 ürün sayfasını yalnız GET ile tarar, Google ürün kurallarıyla denetler; ~5 dk) | Ben (G8) | 347/347 sayfa 200 · ProductGroup 103 · Product 238 · şemasız 6 (teklifli AFT) · teklif 570, kargo bilgili 521 · **HATA 0** · uyarı yalnız 49× "shippingDetails yok" (28 akü ve kurulumlu ürün sayfası). Yerelde 29.10'da aynı sonuç (2 dk 18 sn) |
| Ü2 | Google Rich Results Test (`search.google.com/test/rich-results`), 4 örnek: varyantlı `https://voltekno.com/products/deye-off-grid-akilli-inverter-5-kw-6-kw` · tek ürün `/products/tommatech-600wp-bifacial-16bb-topcon-gunes-paneli` · akü `/products/tommatech-marine-mrn1-12-8v-100ah-lifepo4-lityum-aku-small` · teklifli `/products/aft-2-7-kwh-lifepo4-lfp-batarya` | Siz veya ben (tarayıcıda) | İlk üçünde "Ürün snippet'leri" + "Satıcı listelemeleri" geçerli, Deye'de 2 varyant, panelde kargo ve iade bilgisi; akü sayfasında yalnız isteğe bağlı kargo uyarısı; teklifli üründe ürün öğesi yok (bilerek), yalnız kırıntı yolu |
| Ü3 | Varyant adresi `https://voltekno.com/products/deye-off-grid-akilli-inverter-5-kw-6-kw?variant=deye00397` | Ben | 6 kW seçili açılır; 5 kW'a tıklayınca adres `?variant=deye00396` olur; canonical varyantsız adres |
| Ü4 | `/llms.txt` ve `/llms-full.txt` | Ben | İkisi de 200 (test alan adında 404'tü); `llms-full.txt`'te "Toplam 347 ürün", fiyatlar canlı kurla, adresler `https://voltekno.com` |
| Ü5 | Search Console → Geliştirmeler → "Ürün snippet'leri" ve "Satıcı listelemeleri" (G10'dan 3–7 gün sonra) | Siz | Geçersiz öğe 0; uyarılar yalnız akülerde kargo bilgisi. Hata çıkarsa örnek adresle bana iletin |
| Ü6 | Merchant Center (G10 akışı alındıktan sonra) | Siz | "GTIN eksik" bildirimi beklenen (`identifier_exists=no`; barkod gelince "Yapılacaklar" 3); ürün reddi olmamalı, aküler ve teklifli ürünler akışta yok |
| Ü7 | Akü kısıtı kalktığında ("Yapılacaklar" 4) | Ben | Ü1 tekrar: "shippingDetails yok" uyarısı 25'ten 0'a (kalan 3 kurulumlu istasyon), akü sayfasında Ü2 kargo bilgisiyle geçer |

**Prova (28.10.2026, yerel üretim derlemesi, ana dal `35836fd`, `NEXT_PUBLIC_SITE_URL=https://voltekno.com`, noindex yok) — hepsi TAMAM:** robots.txt'te tüm site engeli yok ve `Sitemap: https://voltekno.com/sitemap.xml`; site haritasında 428 adres, hepsi `https://voltekno.com`; ana sayfada noindex yok, canonical ve kurum şeması voltekno.com; **132/132 eski ikas adresi doğru hedefe 308**, hedeflerin hepsi 200; /products, kategori, tür, marka, paketler, blog, hakkımızda, iletişim, SSS, kargo, KVKK, `/api/health`, `/llms.txt`, Merchant akışı, favicon, paylaşım görseli 200; `/admin` girişe yönlendiriyor (307). Birim testi 190/190, Playwright 49 geçti. Not: ikas'ın canlı site haritası, sunucusu ara sertifikayı göndermediği için buradan okunamadı (sertifika doğrulamasını kapatmak izin sisteminde reddedildi); eşleme 19.10'daki ikas site haritasından. Sonradan eklenmiş adres varsa geçişten sonra Search Console 404 raporunda görünür ve `lib/seo/legacy-redirects.json`'a eklenir.

**G2 — voltekno.com ortam değişkenleri (hPanel → Web siteleri → voltekno.com → Node.js → Ortam değişkenleri):**
| Değişken | Değer |
|---|---|
| `DATABASE_URL` | `file:/home/u718952521/domains/voltekno.com/voltekno.db` |
| `NEXT_PUBLIC_SITE_URL` | `https://voltekno.com` |
| `NEXT_PUBLIC_BASE_URL` | `https://voltekno.com` |
| `NEXT_PUBLIC_NOINDEX` | **eklenmemeli** (varsa silin; yoksa site arama motorlarına kapalı kalır) |
| `NEXT_PUBLIC_FIREBASE_*` (8) ve `FIREBASE_ADMIN_*` (3) | nextfirststep.com'dakilerle aynı (eski proje `eticaret-54bdc`) |
| `SMTP_HOST` / `SMTP_PORT` / `SMTP_SECURE` | `smtp.hostinger.com` / `465` / `true` |
| `SMTP_USER` / `SMTP_FROM` / `SMTP_EMAIL` | `noreply@voltekno.com` |
| `SMTP_PASSWORD` | hPanel → E-postalar'da açtığınız `noreply@voltekno.com` kutusunun şifresi |
| `SMTP_FROM_NAME` | `Voltekno` |
| `SMTP_REPLY_TO` | `info@voltekno.com` (bu kutu yoksa açılmalı veya yanıtların gideceği başka adres) |
| `ADMIN_EMAIL` | nextfirststep.com'daki değer (sipariş/uyarı bildirimlerinin gideceği adres) |
| `ADMIN_TOKEN` | **yeni**, en az 32 karakter rastgele (test sitesindekiyle aynı olmasın) |
| `ADMIN_TOTP_SECRET` | önerilir: `node scripts/admin-2fa-setup.mjs` çıktısı |
| `JWT_SECRET` / `CRON_SECRET` | yeni, uzun rastgele değerler |
| `BACKUP_DIR` | `/home/u718952521/domains/voltekno.com/backups` |
| `FX_CACHE_FILE` | `/home/u718952521/domains/voltekno.com/fx-rates.json` |
| `NEXTAUTH_URL`, `NEXTAUTH_SECRET` | artık kullanılmıyor, silinebilir |

**Kararlar (28.10.2026, kullanıcı):** SEO **dahil** (voltekno.com ana daldan yayınlanır, 132 eski adres yönlendirmesiyle) · veritabanı nextfirststep.com'dan **kopyalanır** · Firebase **şimdilik eski proje** (`eticaret-54bdc`) · gönderen **`noreply@voltekno.com`** (hPanel → E-postalar'da kutu açılıp `SMTP_*` değişkenlerine girilecek; müşteri yanıtları için `SMTP_REPLY_TO=info@voltekno.com` önerilir — kod destekliyor).

**Kararlar öncesi seçenekler (kayıt için):**
1. **SEO ve eski adres yönlendirmeleri:** voltekno.com Google'da ikas adresleriyle (ör. `/akuler`) dizinli. Yönlendirmeler (`lib/seo/legacy-redirects.json`, 132 adres) SEO commit'lerinde (`9ad9119`, `6a30301`, `5122e7a`, `35836fd`) ve yayın dalında **yok**. Geçişte yayına girmezse eski adresler 404 verir ve sıralama kaybolur. Öneri: voltekno.com ana daldan (SEO dahil) yayınlansın.
2. **Veritabanı:** nextfirststep.com'dakini kopyala (öneri) / boş başlat.
3. **Firebase:** şimdilik eski proje (`eticaret-54bdc`, çalışıyor) ile geç, yeni projeye sonra geç (öneri) / yeni proje (`voltekno-eticaret`) — servis hesabı anahtarı ve Storage (Blaze) olmadan tam çalışmaz.
4. **E-posta gönderen:** şimdilik mevcut kutu (`info@bataryakit.com`) / `@voltekno.com` kutusu (hPanel'de oluşturulup şifresi ortam değişkenine girilmeli).

**Geçişten sonra da geçerli eski maddeler:** zamanlayıcı havale takibini ve yedeği uygulama içinde çalıştırır (E1), `BACKUP_DIR` derleme klasörünün dışında olmalı; banka POS (`POS_*`), Geliver (`GELIVER_API_TOKEN`, yeni anahtar), Navlungo bilgileri gelince eklenir; DMARC birkaç hafta `p=none` + rapor (`rua`) izlenip `p=quarantine`; teyit edilecekler: tahmini desi değerleri (Altech türbinleri, Apex 51,2V 280Ah, SPI 315–630 kW sürücüler), sözleşmelerin hukukçu kontrolü, GES fiyat bandı.

## Yayın
- Test ortamı: https://nextfirststep.com (arama motorlarına kapalı)
- Son yayın: `c095ad4` (23.10.2026 21:49), dal `yayin-pro-seo-haric`: ürün grupları (`e6b60ff` cherry-pick, çakışmasız). Yayın öncesi bu dalda: tip kontrolü temiz, birim testleri 165/165, derleme 437 sayfa, yerel duman testi 18/18; ana dalda yerel uçtan uca senaryo 19/19 (bkz. "Ürün grupları"). Hostinger ayarları doğru algılandı (`next`, Node 22), `prisma db push` yeni tablo ve sütunları ekledi, yayın yaklaşık 3,5 dk. Canlı (yalnız okuma, sipariş açılmadı): 18/18 + sağlık ucu, önizleme 404, robots kapalı; `/api/admin/product-groups` oturumsuz 401, `/admin/urun-gruplari` girişe yönlendiriyor, ürün satışta, sepet teklifi satılabilir, Merchant akışında 313 ürün.
- Bir önceki yayın: `38d6d1b` (23.10.2026 20:54), dal `yayin-pro-seo-haric`: yönetim paneli denetimi A01–A18 (`d8a8dc8` cherry-pick; tek çakışma ürün sayfasının içe aktarmalarıydı, SEO içe aktarmaları yayın dalının dışında bırakıldı). Yayın öncesi bu dalın kendi derlemesinde: tip kontrolü temiz, birim testleri 160/160, derleme 436 sayfa, yerel duman testi 21/21 (sayfalar, yetki korumaları, 2FA'lı giriş, yeni yönetim uçları, %101 kampanyanın sunucuda reddi, sepet stok anahtarı). Hostinger ayarları ilk yüklemede doğru algılandı (`next`, Node 22); sunucuda `prisma db push` yeni sütunları ekledi; yayın 2 dk 51 sn. Canlı (yalnız okuma, sipariş açılmadı): 24/24 kontrol (12 sayfa 200, sağlık ucu ve veritabanı ok, 5 yeni/yenilenen yönetim ucu oturumsuz 401, önizleme 404, robots kapalı, ürün API'si dövize bağlı modda ve maliyet alanı yok, sepet teklifinde stok anahtarı, Merchant akışında 313 ürün, site haritası). Playwright (yayın dalının yerel derlemesine karşı, gerçek veritabanının temiz kopyası, e-posta kapalı; canlıya karşı değil): Chromium 94 geçti / 3 kaldı / 2 atlandı; kalan 3'ü aynı test ürününün stok farkını ölçen akış testleri, paralel testler aynı stoğu düşürdüğü için. Akış testleri tek işçiyle yeniden çalıştırıldı: 43/43 geçti. Atlanan 2 test POS ve ortam koşullu. **Dikkat:** canlıda 2FA'lı bir Sahip hesabı açıldığı an, `ADMIN_TOTP_SECRET` tanımlı değilse ana yönetici şifresiyle giriş kapanır (A12).
- Bir önceki yayın: `2259d5b` (22.10.2026 akşam), dal `yayin-pro-seo-haric`: AFT Power ürünleri (`f50a456` cherry-pick; tek çakışma yayın dalında olmayan SEO marka dosyası, dışarıda bırakıldı). Yayın öncesi: tip kontrolü temiz, birim testleri 126/126, derleme 436 sayfa, Playwright 100 geçti / 0 kaldı. **Kesinti (yaklaşık 15 dk, 18:27–18:42):** Hostinger ilk yüklemede derleme ayarlarını boş algıladı (Node 20, derleme komutu yok) ve derlemeden yayınladı; site 403 verdi. Doğru ayarlı ikinci derleme, ilk derleme paketi sildiği için başlayamadı; paket yeniden yüklenince ayarlar doğru algılandı ve site açıldı. **Bundan sonra:** yükleme sonucunda `app_type: next`, `node_version: 22` görünmüyorsa derleme yayınlanmadan durdurulmalı / hemen doğru ayarla yeniden yüklenmeli. Canlı: 29/29 genel kontrol, 15/16 akü ve 22.10 kontrolü (kalan: akü kategorisindeki ürün sayısı yeni teklifli ürünlerle 25'ten 31'e çıktı, beklenen), AFT: istasyon sayfası fiyatlı ve kurulum notlu, şemada kargo bilgisi yok, teklifli ürün fiyatsız ve siparişi reddediliyor, 347 ürün, AFT ürünleri Merchant akışında yok. **Canlıda test siparişi açıldı (benim hatam):** kontrol betiği istasyon siparişini canlıda denedi, `ORD-2026-02302` (AFT PRO V2 90 kW, havale, Deneme Alıcı, aft-deneme@example.com) oluştu ve 1 adet stok düştü. Havale süresi dolunca zamanlayıcı iptal edip stoğu geri koyar; isterseniz yönetim panelinden hemen iptal edin.
- Bir önceki yayın: `953b9ba` (22.10.2026), dal `yayin-pro-seo-haric`: 22.10 turlarının SEO dışı 13 commit'i cherry-pick edildi. Tek çakışma mobil düzendeydi: yayın dalında ana sayfa içeriği `app/page.tsx`'te ve hero SEO tür sayfalarına bağlanmıyor; değişiklik bu dosyalara elle uygulandı. Yayın öncesi bu dalın kendi derlemesinde: tip kontrolü temiz, birim testleri 125/125, derleme 427 sayfa, Playwright (akış testleri dahil) 98 geçti / 0 kaldı. Sunucuda `prisma db push` yeni Geliver alanlarını ekledi. Canlı: 29/29 genel kontrol, 16/16 akü ve 22.10 kontrolü (338 ürün, Victron 120 V ürünleri 404, misafir yorumu 401, ?page=2 sunucuda çiziliyor, iletişimde geçersiz e-posta ve siparişte eksik haneli telefon 400, yanlış yönetici şifresi 401, akülü sipariş 400, Merchant akışında 313 ürün ve akü yok), 1145 px'te açılır menü ekranın içinde, mobilde paket kartları iki sütun; sunucu kaydında yeni sürümde hata yok.
- Daha önceki yayın: `f1025fa` (21.10.2026), dal `yayin-pro-seo-haric`: Navlungo gönderi entegrasyonu, Geliver takibi, akü/batarya iletişimle satış, desi ve görseller, Codex'in teslimat tahmini, sipariş tekrar koruması, fiyat değişimi onayı, kısmi iadede kargo, ödeme sayfasında fiyat eşitleme. `7381cb9`'dan sonraki SEO dışı 10 commit cherry-pick edildi, yalnızca DURUM.md çakıştı. Yayın öncesi bu dalın kendi derlemesinde: tip kontrolü temiz, birim testleri 112/112, derleme 429 sayfa, Playwright (akış testleri dahil) 92 geçti / 0 kaldı; yerelde 25 akü iletişim kutusunda, akülü sipariş 400, aküler akışta yok. Sunucuda `prisma db push` yeni sipariş alanını ekledi. Canlı: 29/29 genel kontrol (sayfalar, sağlık ucu, yetki korumaları, SEO adresleri 404, noindex), 9/9 akü kontrolü (340 ürün, 25 akü iletişim kutusunda, akülü sipariş ve sepet doğrulaması reddediyor, Merchant akışında 315 ürün ve akü yok, kargo sayfası cümlesi, ödeme sayfası açılıyor), sunucu kaydında `journal_mode=wal`, zamanlayıcı başladı, hata yok.
- Daha önceki yayın: `7381cb9` (20.10.2026 20:52): Geliver + Navlungo kargo kıyası
- Bir önceki yayın: `3008ea6` (20.10.2026 19:12): koyu temanın kaldırılması, varsayılan Türkçe, adet kutusu, "Sepete git"
- Bir önceki yayın: `25ae00a` (19.10.2026 19:27): profesyonel seviye, SEO hariç. dal `yayin-pro-seo-haric` = `f6d2f1f` + profesyonel seviye (`e8806cf`) cherry-pick. SEO commit'leri (`9ad9119` eski adres yönlendirmeleri, `6a30301` tür/marka sayfaları) bilerek dışarıda. Tek çakışma ürün sayfasındaydı: SEO'nun kırıntı şeması alınmadı, gerçek puan alındı. Yayın öncesi: tip kontrolü, birim testleri 77/77, derleme 429 sayfa, Playwright 99 geçti / 0 kaldı, yönetici, rol ve ticaret akışları yerel kopyada geçti. Canlı kontrol: 14 sayfa 200, `/api/health` 200 (veritabanı ok), yorum/soru API'leri Prisma'dan, 7 yönetim ucu yetkisiz 401, giriş ekranında e-posta alanı, ürün şemasında sahte puan yok, SEO tür/marka adresleri 404, site noindex. Sunucu kaydında `journal_mode=wal` ve zamanlayıcı başladı, hata yok
- Önceki yayın: `df5aa58` (19.10.2026 15:56): eksiklerin çözümü, mobil başlık + hero, süs ikonları, KDV etiketi, üyelere özel favoriler. Zamanlayıcı canlıda doğrulandı
- Canlıda olmayanlar (22.10 yayından sonra): İngilizce site (`ingilizce-tam`) ve SEO (`9ad9119`, `6a30301`, `5122e7a`)
- 19.10 öğleden sonraki commit'lerin hepsi `df5aa58` ile canlıda; `urun-katalogu-ikas` GitHub'a gönderildi. `main`'e ileri sarma (çakışmasız) ve `origin` adresinin değiştirilmesi izin sisteminde reddedildi, sizin yapmanız gerekiyor
- GitHub deposu taşınmış: `https://github.com/info-aftsoftware/eticaret.git` (eski adres yönlendiriyor, aynı depo olduğu doğrulandı; `git remote set-url origin https://github.com/info-aftsoftware/eticaret.git`). Dal: `urun-katalogu-ikas`.
