# E-Ticaret Uçtan Uca Kontrol — Yapılacaklar Listesi

> **21.10.2026:** Bu dosya tarihî kayıttır; yapılan maddeler işaretlendi. Güncel ve tek yapılacaklar listesi `DURUM.md` → "Kalanlar".

_Kontrol tarihi: 12.10.2026 · Kapsam: kod denetimi (sepet → ödeme → sipariş → bildirim, hesap/admin), çalışan dev sunucusunda (port 3005) sayfa/API duman testi, `tsc --noEmit`._

**Özet durum:** Tüm sayfalar 200 dönüyor, tip kontrolü temiz. Fakat **ödeme ve sipariş hattı canlıya çıkmaya hazır değil**: fiyatlar istemciden alınıyor, siparişler yetkisiz okunup değiştirilebiliyor, admin yetkisi ele geçirilebiliyor, arama ve ürün yorumları 500 veriyor, yasal zorunlu onaylar eksik.

Öncelik: 🔴 P0 = canlıdan önce mutlaka · 🟠 P1 = ilk 2 hafta · 🟡 P2 = ilk ay · 🟢 P3 = büyüme


## 📌 Güncel açık işler (15.10.2026, uygulama sonrası)

_ikas Excel'iyle katalog değişimi (340 ürün, 322 varyant, 13 marka) ve ardından yapılan düzeltmeler. `[x]` yapıldı,
`[ ]` sizin kararınız / erişiminiz gereken iş. Ayrıntılar aşağıdaki fazlarda._

### ✅ Faz 8 — katalog düzeltmeleri (15.10.2026)

- [x] **Firestore kuralları ve indeksleri** canlı projeye (eticaret-54bdc) yüklendi; yorum/soru 500 hatası indeksler oluşunca kalkar (birkaç dakika). `.firebaserc` eklendi.
- [x] **Fiyatlar tam TL'ye yukarı yuvarlanıyor** (kur çevirisi ve kampanyalı fiyat). Excel fiyatları KDV hariç kabul edildi (onaylandı).
- [x] **Kur yedeği:** son başarılı canlı kur `.data/fx-rates.json`'a yazılıyor; kaynaklar düşerse import günündeki kur yerine bu kullanılır.
- [x] **Kategori düzeltmeleri** import sırasında (`scripts/import-ikas-excel.py` → `CATEGORY_CORRECTIONS`): 13 ısı pompası yeni **Isı Pompası** kategorisine; "Diğer > Genel"deki 58 ürün inverter, şarj kontrol, türbin aksesuarı, sistem bileşeni, yeni **Taşınabilir Güç İstasyonu** ve **İzleme ve Kontrol** kategorilerine dağıtıldı ("Genel" boş).
- [x] **Varyant adları** Excel'in tutarsız "Varyant Değer 1" sütunu yerine SEO adlarından üretiliyor (ör. "40Wp TOPCon 36TN10 Güneş Paneli", "5 kW Trifaze On-Grid İnverter").
- [x] **Teknik özellikler** açıklama tablolarından çıkarılıyor: 340/340 ürün, model tablolarındaki satırlar varyantlara eşleniyor. Karşılaştırma sayfası ve kategori filtreleri (yaygın, kısa değerli en fazla 6 özellik) bunları kullanıyor; ürün sayfasında HTML açıklama zaten tabloları içerdiği için ayrıca gösterilmiyor.
- [x] **Desi hesabı** (SKU bazında): desi = max(en×boy×yükseklik cm / 3000, kg), yukarı yuvarlanmış. Ölçü/ağırlık önce ürün açıklamasından, eksikse üretici kaynaklarından yapılan araştırmadan (`scripts/data/logistics-research/*.result.json`, her değerin kaynak URL'si var) alınıyor. **562 SKU’nun 407’sinde desi var** (373’ünde ölçü + ağırlık, 33’ünde yalnızca ölçü; 1 dijital ürün). 46 SKU’da yalnızca ağırlık bulundu (ölçü olmadan desi doğru hesaplanamaz, boş bırakıldı), 109 SKU’da hiç veri yok.
  Rapor: `scripts/data/desi-raporu.csv` (Excel'de açılır). Eksik liste: `scripts/data/missing-logistics.json`. Elle düzeltme/ekleme: `scripts/data/product-logistics.json` (SKU → `dimsCm`, `weightKg`; iki koliyle giden ürün için `parcels`, dijital ürün için `noShipping`).
- [x] **Görselsiz 3 ürün** aynı marka/kategorideki en benzer ürünün görselini kullanıyor (Frecon PV500-4T-315, İstabreeze 5 Kollu Büyük Burun, Victron Smart BMS CL kablosu).
- [x] **Eski ürün adresleri:** 80 eski ürün id'si kalıcı yönlendiriliyor (`lib/legacy-product-redirects.json`): 8 TommaTech ürünü yeni karşılığına, diğerleri (Hims, ORBİT, SRP vb.) ilgili yeni kategoriye.
- [x] **Google Merchant:** `identifier_exists=no` (iç SKU MPN olarak gönderilmiyor), `product_type` "Grup > Kategori", ağırlık varsa `shipping_weight`, görselsiz ürün akışa girmiyor.
- [x] **Favoriler/karşılaştırma:** katalogdan kalkmış ürünler "Bu ürün artık satışta değil" olarak gösteriliyor; karşılaştırma listesinden otomatik çıkarılıyor.
- [x] **Uyumlu ürünler marka öncelikli** (ör. Victron inverter → önce Victron batarya); ürün sayfasındaki eski Hims/EMEF kablo kodu temizlendi.
- [x] **Görsel/tasarım:** banner'ı olmayan kategorilerde hero'da ürün görseli kolajı (geniş ekran); Isı Pompası kategorisi TommaTech banner'ıyla; Hims ürünlerini gösteren `categories/sarj.png` ve slaytlar kaldırıldı, tek slaytta nokta gösterilmiyor.
- [x] **Fatura PDF'i** "SİPARİŞ ÖZETİ / PROFORMA" oldu (mali değeri olmadığı yazıyor); e-posta ve indirme etiketleri buna göre.
- [x] **Performans:** ürün görselleri 51 MB → ~36 MB (1200 px üstü küçültüldü, ağır PNG fotoğraflar JPEG'e çevrildi).
- [x] **Repo temizliği:** zip paketleri, `public_html/`, `build_output.txt` depodan çıkarıldı (diskte duruyor, `.gitignore`'da); bozuk `.claude/worktrees` kayıtları silindi (`git status` artık hatasız); `nul`, `dev.log` silindi.
- [x] **Testler:** birim testleri (kur yuvarlama, TOTP, teslim tarihi dahil 35) ve E2E (Chrome ile `PW_CHANNEL=chrome`: 50 geçti, 1 atlandı — aktif kampanya gerektiren test).

### ✅ Faz 9 — devam (15.10.2026)

- [x] **İstemci katalog boyutu:** teknik özellikler, döviz fiyatı, ölçü/desi ve SEO başlığı `lib/catalog/product-details.json`'a ayrıldı (yalnızca sunucu, `lib/catalog-details.ts`); her sayfaya giden katalog 530 KB → 316 KB. `/api/products` listesi varyant özelliklerini taşımıyor (detay API'sinde var).
- [x] **Görseller WebP:** `npm run images:optimize` (sharp) — ürün görselleri ~36 MB → 17 MB. Yeni Excel import'undan sonra bu komut ve ardından import tekrar çalıştırılmalı.
- [x] **Yerel "yeni10" kampanyası pasife alındı** (silinmedi; admin panelinden açılabilir).
- [x] **Admin iki adımlı doğrulama (TOTP):** `ADMIN_TOTP_SECRET` tanımlıysa şifreden sonra Authenticator kodu isteniyor. Kurulum: `node scripts/admin-2fa-setup.mjs` → çıktıdaki anahtarı sunucu ortamına girin, otpauth bağlantısını uygulamaya ekleyin.
- [x] **Misafir siparişleri hesaba bağlanıyor:** e-postası doğrulanmış üye "Siparişlerim"i açtığında aynı e-postayla verilmiş misafir siparişleri hesabına eklenir (yeni siparişlerde e-posta küçük harfle saklanıyor).
- [x] **Tahmini teslim tarihi** ürün sayfasında (stokta ise) ve sepette: iş günü 15:00'e kadar aynı gün kargo, 1–3 iş günü teslim (JSON-LD ile aynı kural; resmî tatiller hesaba katılmıyor).
- [x] **Meta (Facebook) Pixel:** `NEXT_PUBLIC_META_PIXEL_ID` tanımlıysa yalnızca çerez onayı verenlerde ViewContent, AddToCart, InitiateCheckout, AddPaymentInfo, Purchase gönderiliyor; CSP'ye connect.facebook.net eklendi.
- [x] **Admin katalog tablosunda Desi sütunu** (varyantlıda aralık; `*` bazı varyantlarda ölçü eksik).

### 🌐 Canlı ortam durumu (Hostinger, 15.10.2026)

- **voltekno.com alan adı şu an ikas'a yönleniyor** (DNS 75.2.120.200, yanıtlar `Server: ikas`). Ziyaretçiler ikas mağazasını görüyor; Hostinger'daki bu Next.js uygulaması yalnızca geçici adreste yayında: https://purple-goose-825288.hostingersite.com. Alan adı Hostinger'a ancak uygulama hazır olunca (aşağıdaki veritabanı düzeltmesinden sonra) yönlendirilmeli.
- Hostinger'da uygulama kaydı voltekno.com (kullanıcı u718952521) adına; daha önce GitHub `web-projelerim/eticaret` → `main` ile yayın alıyordu (son 16.04.2026, `9b6045e`).
- [x] Çalışmalar `main`'e push edildi (`31f0184`); Hostinger GitHub'a bağlı olmadığı için 16.10.2026'da **arşivle (MCP) yayınlandı** (build `01a143b9`). Arşiv `git archive` ile yalnızca kaynak dosyalardan oluşturuldu (`public_html_standalone/`, `docs/`, `.claude/` hariç).
- [x] **Veritabanı tabloları çalışan uygulamada yok (16.10 yayını sonrası, ÖNEMLİ):** derlemede `prisma db push` tabloları bir `dev.db`'de oluşturuyor, çalışan uygulama (`hbuilds/versions/<sürüm>/nodejs`) göreli `file:./dev.db` yüzünden başka bir dosyayı açıyor → `/api/products`, sepet fiyatı ve sipariş 500 veriyor (sayfalar koddaki katalogla açılıyor). **Çözüm:** hPanel > voltekno.com > Node.js > Ortam değişkenleri'nde `DATABASE_URL=file:/home/u718952521/domains/voltekno.com/voltekno.db` (mutlak yol, `public_html` ve `hbuilds` dışında) yapın, ardından yeniden yayınlayın. Bu aynı zamanda verilerin yayınlar arasında korunmasını sağlar. _(✓ canlı `DATABASE_URL` mutlak ve kalıcı, derleme tabloları oraya kuruyor)_
- [x] **Canlı veritabanı kalıcı değil:** `DATABASE_URL=file:./dev.db` derleme klasöründe; her yayında sıfırdan oluşturuluyor. 16.10 öncesi canlı veritabanında sipariş tablosu bile yoktu (yalnızca eski 8 tablo; loglarda sipariş kaydı yok), bu yüzden bu yayında veri kaybı olmadı. **Bundan sonraki her yayın siparişleri, kuponları, kampanyaları siler** → hPanel > Node.js > Ortam değişkenleri'nde `DATABASE_URL`'i derleme dışında kalıcı bir yola alın (ör. `file:/home/u718952521/voltekno-data/voltekno.db`) ya da PostgreSQL'e geçin; bir sonraki yayından **önce** yapılmalı. _(✓ canlı `DATABASE_URL=/home/u718952521/domains/nextfirststep.com/voltekno.db`)_
- [x] `public_html_standalone/` (eski derleme çıktısı, 2056 dosya) hâlâ git'te; depodan çıkarılmalı. _(✓ git takibinden çıkarıldı (`0859e22`))_
- [ ] **Canlıda eksik ortam değişkenleri** (hPanel > Node.js > Ortam değişkenleri): `CRON_SECRET`, `ADMIN_EMAIL`, `POS_BANK_NAME` / `POS_CLIENT_ID` / `POS_STORE_KEY` / `POS_GATEWAY_URL` (banka gelince), `ADMIN_TOTP_SECRET` (önerilir), `BACKUP_DIR`, isteğe bağlı `NEXT_PUBLIC_META_PIXEL_ID`, `NEXT_PUBLIC_TURNSTILE_SITE_KEY` / `TURNSTILE_SECRET_KEY`, `NEXT_PUBLIC_ETBIS_VERIFY_URL`, `NEXT_PUBLIC_SITE_URL`. Eskiden kalan `NEXTAUTH_URL` / `NEXTAUTH_SECRET` artık kullanılmıyor. _(21.10 kontrolü: `CRON_SECRET`, `ADMIN_EMAIL`, `BACKUP_DIR` tanımlı; `ADMIN_TOTP_SECRET`, `POS_*`, `GELIVER_API_TOKEN` eksik)_
- [x] **Cron görevi yok** (hesapta yalnızca başka bir siteye ait PHP görevi var): `expire-orders` (6 saatte bir) ve `backup` (günde bir) kurulmalı — önce `CRON_SECRET` girilmeli. _(✓ uygulama içi zamanlayıcı (havale takibi, yedek, Geliver ve Navlungo takibi), `CRON_SECRET` canlıda tanımlı)_

### ✅ Faz 10 — güvenlik ve test ortamı (16.10.2026)

- [x] **Bağımlılık güvenliği:** Next.js 14.2.35 → 15.5.28 (kritik RCE, SSRF, DoS açıkları), React 19, firebase 12, firebase-admin 14, nodemailer 10, next-intl 4.14, @react-pdf/renderer 4, lucide-react 0.577, sharp 0.35.5; kullanılmayan next-auth, @auth/prisma-adapter, bcryptjs, pdfkit, papaparse, @tanstack/react-table, cheerio kaldırıldı; dolaylı paketler `overrides` ile (postcss, postcss-selector-parser, deepmerge-ts, @grpc/grpc-js). npm audit: 81 paket (7 kritik) → **0 kritik, 0 orta/düşük; 7 yüksek** kaldı.
- [ ] **Kalan 7 yüksek açık:** hepsi `braces` paketinden (yaması henüz yayımlanmadı) ve yalnızca derleme araçlarında (Tailwind 3 dosya izleyicisi, ESLint Next eklentisi). Yama çıkınca `npm update`; ya da Tailwind 4'e geçiş + ESLint'i derlemeden çıkarma ile sıfırlanabilir.
- [x] **Node.js 22+ zorunlu** (`package.json` engines; firebase-admin 14). Hostinger derleme ayarında Node 22 seçili olmalı.
- [x] **Test ortamı: https://nextfirststep.com** (geçici) — Hostinger'a eklendi, ortam değişkenleri yerel `.env.local`'dan + `DATABASE_URL=file:/home/u718952521/domains/nextfirststep.com/voltekno.db` (kalıcı), `NEXT_PUBLIC_SITE_URL=https://nextfirststep.com`, `NEXT_PUBLIC_NOINDEX=true` (arama motorlarına kapalı), yeni `CRON_SECRET`. MCP ile arşivden yayınlanıyor (`git archive HEAD`, `public_html_standalone/`, `docs/`, `.claude/` hariç).
- [ ] **Test ortamında bilinmesi gerekenler:** e-postalar yerel ayardaki `info@bataryakit.com` / "Batarya Kit" adıyla gidiyor (SMTP_FROM); Firebase ile giriş için Firebase Console > Authentication > Yetkili alan adlarına `nextfirststep.com` eklenmeli; `ADMIN_TOKEN` zayıf — değiştirin ve `ADMIN_TOTP_SECRET` ile 2FA açın.
- [ ] **voltekno.com'a geçiş:** Hostinger'daki voltekno.com uygulamasında `DATABASE_URL`'i mutlak yola alın (yukarıda), ortam değişkenlerini nextfirststep'teki gibi tamamlayın (`NEXT_PUBLIC_NOINDEX` olmadan), Node 22 seçin, yayınlayın; en son alan adının DNS'ini ikas'tan Hostinger'a çevirin.

### ✅ Faz 11 — menü, header, hero ve markalar (17.10.2026)

- [x] **Kategori yapısı gunesenerjisistemi.com menüsüne göre** (`lib/categories.ts`): Solar Akü, Solar İnverter, Güneş Paneli, Solar Şarj Kontrol Cihazı, Solar Bağlantı Ekipmanı, Aksesuar, Rüzgar Enerjisi, Isı Pompası, Elektrikli Araç Şarj; 30 alt kategori. Ürünler import sırasında ürün adından sınıflandırılıyor (`scripts/import-ikas-excel.py` → `CATEGORY_RULES`); 340 ürünün hiçbiri "Genel"de kalmadı. Eski grup adresleri (`enerji-depolama`, `pompa-ve-surucu`, `akuler` …) yeni gruplara yönleniyor.
- [x] **Header voltekno.com yapısında:** lacivert üst şerit (Teklif Al, Sipariş Takibi, Hakkımızda, S.S.S., Blog, İletişim, telefon, e-posta), yeni logo, "TÜM KATEGORİLER" mega menüsü (ana kategori > alt kategori > marka, Hazır Solar Paket, Solar Teklif Al), sarı butonlu geniş arama, kategori şeridi.
- [x] **Hero:** voltekno.com'un 3 slaytı (Yenilenebilir Enerji / Lityum Depolama / Tarımsal Sulama); eski banner slider kaldırıldı.
- [x] **Markalar şeridi:** voltekno.com'daki 10 marka + katalogdaki TommaTech, Victron ve Mexxsun (logolar resmi sitelerinden, `public/images/brands/`); her logo marka filtresine gidiyor.
- [x] **Header ve hero voltekno.com ile birebir** (ölçüler voltekno.com'dan alındı): üst şerit, logo + arama + hesap/sepet satırı, "TÜM KATEGORİLER" açılır listesi + 7 kategori linki, mobilde kategori butonu + arama + kaydırmalı kategori hapları; yatay kayan hero ve alta binen 4 güven kartı. Dil/para birimi seçimi footer'a taşındı.
- [x] **Yanlış ürün görselleri (16/28 düzeltildi):** 10 Deye on-grid, Apex 80A ATS (2 görsel), TommaTech batarya alt tabanı, TommaTech SPI 2,2 kW, Victron BMS CL kablosu — resmî kaynaklardan. Excel'i yeniden import etseniz de korunur: `scripts/data/image-overrides.json` (SKU → `public/images/products/override/`), yeni görsel `node scripts/prepare-override-image.mjs` ile hazırlanır.
- [x] **Kalan 12 yanlış görsel — sizden fotoğraf gerekiyor:** TommaTech diyot modülleri (MDK25A/55A/70A/90A/110A, MDC150-16; 7 ürün) ve R32 Split Isı Pompası İç Ünite. Üreticinin (TommaTech/CW Enerji) sitesinde ve kataloglarında bu ürünlerin görseli yok. _(✓ aynı OEM modelin / serinin resmî fotoğraflarıyla değiştirildi (DURUM.md "İstek turu 2" ve 20.10 görselleri))_
- [x] **Düşük kaliteli görseller (232 kayıt, 187 ürün)** ve şüpheli 17 görsel: rapor `docs/urun-gorsel-denetimi.md`. _(✓ 238 SKU resmî görsellerle yenilendi; 500 px altı, filigranlı görsel kalmadı)_
- [x] **Eski alt kategori filtre linkleri** (`/products?category=Panel`, `MPPT/PWM`, `Lityum Batarya` …) yeni kategoriye eşleniyor (`LEGACY_SUBCATEGORY_MAP`, lib/categories.ts). Ana sayfadaki görünmeyen SSS yapılandırılmış verisi kaldırıldı (Google kuralı: işaretlenen SSS sayfada görünmeli).

### ✅ Faz 12 — e-ticaret altyapısı uçtan uca (18.10.2026)

- [x] **Ürün görselleri:** 238 SKU resmî üretici görselleriyle yenilendi; katalogda yanlış/şüpheli/filigranlı/500 px altı görsel kalmadı. Doğru resmî görseli hiç olmayan 24 SKU'da yanlış görsel yerine markalı "Ürün görseli hazırlanıyor" kartı (Merchant akışına girmez). Liste: `scripts/data/image-overrides.json` (`pending: true`).
- [x] **Stok:** sipariş artık stoğu tek transaction'da koşullu düşüyor (eşzamanlı siparişte aşırı satış yok, 409 OUT_OF_STOCK); iptal/iade doğru kaynağa geri ekliyor; eşik altına düşünce yöneticiye e-posta (`LOW_STOCK_THRESHOLD`, varsayılan 5).
- [x] **Sepet/ürün kartı/favoriler:** varyantlı ürün seçim yapılmadan sepete eklenemiyor ("Seçenekleri Gör"), stok sınırı her yerde, mobilde sepete ekle çalışıyor, "Hemen Al" adedi ikilemiyor, misafir sepeti girişte birleşiyor / çıkışta temizleniyor; favoriler misafir için de çalışıyor ve girişte hesaba taşınıyor; sepet sayfası yenilendi.
- [x] **Üyelik:** kayıt sonrası markalı doğrulama e-postası + tekrar gönder, hoş geldiniz e-postası, markalı şifre sıfırlama, "Beni hatırla", Türkçe hata mesajları, yenilenen giriş/kayıt sayfaları, Google ile giriş (Console'da açılınca).
- [x] **Ödeme:** il/ilçe listeleri, TCKN/vergi no/telefon doğrulaması (sunucuda da), bireysel/kurumsal fatura, ayrı fatura adresi, yenilenen ödeme ve başarı sayfaları; sipariş sonrası "hesap oluştur" önerisi (bilgiler doldurulmuş gelir).
- [x] **Sipariş takibi ve e-postalar:** takip POST ile (kişisel veri URL'de değil), yeni sipariş detay sayfası; tüm sipariş e-postaları yeni markalı tasarımda (alındı, ödeme, hazırlanıyor, kargoda + takip, teslim, iptal/iade + ücret iadesi, ödeme hatası, iptal talebi); kargo takip linkleri güncel (Aras, DHL eCommerce/MNG, PTT, UPS, DHL).
- [x] **İptal talebi:** ödenmiş/hazırlanan siparişte müşteri iptal talep eder, admin onaylar/reddeder; ödenmiş sipariş iptalinde ödeme durumu "iade edildi" olur ve müşteriye tutarlı e-posta gider.
- [x] **Admin paneli:** yeni Genel Bakış (KPI, yapılacaklar, hızlı işlemler), sayfalı/filtreli sipariş listesi, canlı bildirimler (30 sn: rozet, bildirim, ses, sekme sayacı), Prisma tabanlı müşteriler sayfası (misafirler dahil), tek ürün yöneticisi (varyant fiyatı düzenleme, çoklu görsel yükleme), soru yanıtında müşteriye e-posta, iptal talebi kartı. Güvenlik: kullanıcıların yazabildiği eski Firestore sipariş yolu kapatıldı.
- [x] Doğrulama: `tsc` temiz, 42 birim testi, 50 E2E testi geçti, production build başarılı. Yerelde e-postalar `.env.development.local` → `EMAIL_CAPTURE_DIR` ile gönderilmeden `.data/mail-outbox`'a yazılıyor.

**Sizin yapmanız gerekenler:**
- [ ] `firebase deploy --only firestore:rules` (eski sipariş yolu kilidi).
- [ ] Firebase Console → Authentication → Authorized domains: `voltekno.com`, `www.voltekno.com`, `nextfirststep.com`. Google ile giriş isteniyorsa Sign-in method → Google → Enable ve ortama `NEXT_PUBLIC_GOOGLE_SIGNIN_ENABLED=true`.
- [x] Canlıda `MEDIA_DIR` (admin'den yüklenen görseller için kalıcı klasör; varsayılan SQLite dosyasının yanındaki `media/`). _(✓ gerek yok: görseller kalıcı veritabanının yanındaki `media/` klasörüne gidiyor)_
- [x] 24 "görsel hazırlanıyor" ürünü için fotoğraf (TommaTech diyot modülleri, R32 split iç/dış ünite, Frecon 315–450 kW, Exelon PMAX, Havensis 20AES/MPS 3A vb.). — tamamlandı (18.10.2026, gerçek fotoğraflar)
- [x] Desi bazlı kargo ücreti kuralı (şu an sabit 50 TL, 3.000 TL üstü ücretsiz) ve taksit tablosu: bilgiler gelince eklenecek. _(✓ desi bazlı kargo yapıldı; 20.10'dan beri Geliver + Navlungo kıyası (taksit tablosu bankadan bekleniyor))_

### 🔴 P0 — Yayından önce (sizde)

- [x] **Canlı veritabanı temizliği:** `npx tsx scripts/clear-legacy-catalog.ts` (kuru çalıştırma) → `--apply`. Yalnızca yerel `dev.db` temizlendi. _(✓ canlı API'de yalnızca güncel 340 ürün var (19.10 kontrolü))_
- [x] **"yeni10" kampanyası** yerelde kapatıldı; canlıda da varsa Admin > İndirimler'den kapatın. _(✓ canlıda kupon geçersiz (19.10 kontrolü))_
- [ ] **Admin 2FA'yı açın:** `node scripts/admin-2fa-setup.mjs` → `ADMIN_TOTP_SECRET` (canlı ortam).
- [ ] **Meta Pixel kullanılacaksa:** `NEXT_PUBLIC_META_PIXEL_ID` girin ve çerez politikasına (lib/legal/documents.json) Meta pikselini ekletin.
- [ ] **Gerçek stok:** Excel'de tüm ürünlerin stoğu 17; varyantlar ürün stoğunu paylaşıyor.
- [x] **Kargo ücreti kuralı** (siz verecektiniz): şu an 50 TL, 3.000 TL üstü ücretsiz. Desi verisi hazır; kural gelince `lib/store-config.ts`'e desi bazlı hesap eklenir. _(✓ desi bazlı kargo, Geliver + Navlungo kıyası)_
- [x] **Yayın yöntemi:** statik `public_html` yerine Node (standalone) yayın — canlı kur, sepet, sipariş ve ödeme sunucu ister; eski URL yönlendirmeleri de yalnızca Node yayında çalışır. _(✓ Node (standalone) yayın yapılıyor)_
- [ ] **Merchant Center**'da akışı yeniden getirin; **Search Console**'a sitemap'i yeniden gönderin.
- [ ] Banka sanal POS bilgileri (`POS_*`) ve test; Hostinger cron'ları (`expire-orders`, `backup`) + `CRON_SECRET`; IBAN hesap sahibi adı kontrolü; e-Arşiv entegratörü; canlıdaki eski fatura PDF'lerinin silinmesi; SQLite → PostgreSQL.

### 🟠 P1 — Veri teyidi (desi araştırmasından)

- [ ] **Deye (41 SKU):** Excel'de model kodu yok; araştırmada güncel AB model aileleri varsayıldı (ör. LV hibrit 5–6 kW = SUN-xK-SG04LP1). Satılan kuşak farklıysa ölçü/ağırlık değişir. 6 kW off-grid ve 15 kW monofaze LV hibrit Deye'nin güncel serisinde yok.
- [ ] **Electrozirve:** ölçüler, model kodları birebir eşleşen SRNE kaynaklarından alındı; Electrozirve'nin SRNE markalı ürün sattığını teyit edin.
- [ ] **Apex / NP Power:** distribütör sayfalarında özellik yok; değerler arşivlenmiş sayfalar ve pazaryeri ilanlarından (düşük güven: NP 8,5/11 kW inverterler 3,5 kW ile aynı kasa görünüyor, NP2440 için iki farklı ölçü). APX şarj cihazları, NP şarj cihazları, Apex 51,2V lityumlar, NS serisi ve 80A transfer switch için veri yok.
- [ ] **Exelon:** ELH-24 ve PMAX-12P için veri sayfası yok; ELH-12/15 ağırlığı veri sayfasındaki üst sınır (≤45 kg).
- [x] **Ölçüsü bulunamayanlar** (`missing-logistics.json`): Altech türbin ve direkleri (tedarikçiden koli listesi), Mexxsun MPK8, TommaTech duvar/entegre/SC/ayarlanabilir şarj üniteleri, R32 split ısı pompaları, SPI 315–630 kW sürücüler (paletli/ambar), kablolar ve küçük aksesuarlar, Electrozirve DC-DC ve uzaktan kumandalar, bazı Havensis aksesuarları. _(✓ ölçüsü/ağırlığı eksik SKU kalmadı (20.10); 46 üründe değer tahmin)_
- [ ] **Büyük/özel gönderiler:** 50 kW R290 ısı pompası (490 kg), büyük Frecon/SPI sürücüler, Heli 2.0/4.0 türbinler, Altech Nova → ambar/palet; Lithium SuperPack'ler UN3480 (lityum) — kargo firmasıyla kısıtları kontrol edin.
- [ ] **İstabreeze kanatları** araştırmada tek kanat ağırlığıyla; set (3'lü) satılıyorsa düzeltin. İstabreeze i-1000…Windsafe türbinleri iki koliyle gidiyor (tanımlandı).
- [ ] **Ölçüler çoğunlukla ürün (kutusuz) ölçüsü**; üreticiler koli ölçüsü yayımlamıyor. Kesin desi için ilk sevkiyatlarda koli ölçüsü alınıp `product-logistics.json`'a yazılması önerilir.
- [ ] Excel'de **eksik 16 görsel** (Drive'da silinmiş) yeniden yüklenmeli; **barkod/GTIN** sütunu boş. _(20.10: silinen görsellerin hepsi resmî görsellerle tamamlandı; barkod/GTIN hâlâ boş)_
- [x] **Veri kaynağı kararı:** admin panelindeki ürün düzenlemeleri Excel yeniden aktarılınca da geçerli kalır. _(✓ öyle çalışıyor: admin düzenlemeleri veritabanında, Excel yeniden aktarılınca ezilmez)_

### 🟡 P2 ve sonrası

- [ ] Ürün adları/açıklamaları yalnızca Türkçe (İngilizce arayüz).
- [x] Ana sayfa için yeni banner/slayt tasarımları (şu an tek slayt). _(✓ ana sayfada çok slaytlı hero var)_
- [ ] **Hesap/sağlayıcı gerektirenler:** kargo firması API (gönderi oluşturma), SMS sağlayıcı, bankadan taksit tablosu ve ORDERSTATUS sorgusu, Sentry (DSN), Redis/Upstash (yalnızca çok sunuculu kurulumda gerekli), Turnstile anahtarları, ETBİS bağlantısı, İYS kaydı, Google Ads dönüşüm etiketi, ERP/muhasebe, staging ortamı.
- [ ] **İş kararı gerektirenler:** PayTR (entegre et ya da kaldır — şu an ödeme başlatma yok), kapıda ödeme, kurumsal müşteri (vergi no profili, bayi fiyatı), X al Y öde ve sadakat puanı, kâr marjı raporu (ürün maliyetleri gerekli), sonuçlanmamış kart siparişlerinin otomatik iptali (ORDERSTATUS gelmeden önerilmez).


## ✅ P0 uygulama durumu (12.10.2026)

§1 ve §2'deki kod düzeltmeleri yapıldı (`[x]`); `[~]` kısmen yapıldı. Doğrulama: `tsc` temiz, 25 API testi + webhook senaryoları + tarayıcıda sepet→ödeme akışı.

**Canlıya almadan önce sizin yapmanız gerekenler:**
1. `firebase deploy --only firestore:rules,firestore:indexes` — yeni kurallar (rol yükseltme engeli, kuponlar yalnızca admin) ve yorum/soru indeksleri yüklenmeden etkin olmaz.
2. Kart ödemesi banka sanal POS'u ile (Stripe kaldırıldı): banka onayından sonra canlı ortama `POS_BANK_NAME`, `POS_CLIENT_ID`, `POS_STORE_KEY`, `POS_GATEWAY_URL` girilmeli; bankaya dönüş adresi olarak `https://voltekno.com/api/payments/pos/callback` bildirilmeli. Bilgiler girilene kadar kart seçilirse sipariş oluşturulmaz, Havale/EFT önerilir.
3. Yayın betiği artık `prisma db push && next build` (eski migration klasörü yalnızca 8 tabloyu oluşturuyordu; sipariş, kupon vb. tablolar yeni sunucuda oluşmazdı). Yıkıcı şema değişikliğinde yayın güvenli şekilde durur.
3. Havale/EFT'de gösterilen **"%3 İndirim"** rozeti hiçbir yerde uygulanmıyor (ne eski ne yeni kodda). Ya rozet kaldırılmalı ya da indirimin tabanı (ara toplam mı, KDV dahil mi?) belirlenip sunucuya eklenmeli.
4. Yerel geliştirme veritabanında test siparişleri oluştu: `ORD-2026-00025` … `00029` (00027 test için elle PAID yapıldı). Silinebilir.

**P0'da kalanlar:** SQLite → PostgreSQL geçişi (§2) ve §3'teki yasal metin/firma bilgisi maddeleri (MERSİS, KEP, ETBİS, e-Arşiv, iade talebi akışı) — bunlar firma bilgisi ve sağlayıcı seçimi gerektiriyor.


## ✅ Faz 2 — sipariş süreci (12.10.2026)

Yapılanlar: Havale/EFT'de ara toplam üzerinden %3 indirim (KDV indirimli matrahtan), tek kaynaklı fiyat/kargo/banka ayarları (`lib/store-config.ts`),
üye girişinin sunucuda tanınması (Firebase token), sipariş yaşam döngüsü servisi (`lib/order-service.ts`) ve zaman çizelgesi (`OrderEvent`),
yeni sipariş e-postaları (sipariş alındı + IBAN, ödeme alındı, hazırlanıyor, kargoda + takip linki, teslim edildi, iptal, admin bildirimi),
admin sipariş detayı (ödeme onayı, durum adımları, kargo firması/takip no, iptal/iade, not), müşteri sipariş sayfası (durum adımları, IBAN, takip, iptal),
sepette ücretsiz kargo göstergesi, kargo sayfasında ücret bilgisi, faturada indirim satırı, admin ciro istatistiğinin yalnızca ödenmiş siparişleri sayması.

**Sizin yapmanız gerekenler / açık konular:**
1. **Veritabanı migration'ları eksik:** `prisma/migrations` yalnızca 8 tabloyu oluşturuyor; Order, User, OrderEvent vb. `db push` ile oluşturulmuş. `npm run build` içindeki `prisma migrate deploy` boş bir canlı veritabanında sipariş tablolarını oluşturmaz. PostgreSQL'e geçişle birlikte baseline migration oluşturulmalı. Canlıdaki mevcut SQLite için yeni alanlar `prisma db push` ile eklenmeli.
2. MNG ve Sürat Kargo takip linklerinin URL biçimi doğrulanmalı (`lib/shipping/carriers.ts`).
3. Süresi geçen havale siparişlerinin otomatik iptali (zamanlanmış görev) yok.
4. Misafir olarak sipariş verip sonra üye olan müşterinin eski siparişi hesabına bağlanmıyor (e-posta doğrulaması olmadan bağlamak güvenli değil).
5. Admin paneli tek ortak şifreyle giriliyor; kişisel admin hesapları + 2FA önerilir.


## ✅ Faz 3 — yasal gereklilikler ve sağlamlaştırma (12.10.2026)

Firma bilgileri ve 8 yasal metin voltekno.com'dan alındı (`lib/legal/company.ts`, `lib/legal/documents.json`) ve canlı siteyle aynı adreslerde
yayında (`/pages/...`); eski `/terms`, `/privacy`, `/cookies`, `/returns` sayfaları (satıcı "Yılmaz Uzun Şahıs Şirketi" yazıyordu) bu metinlere bağlandı.
Footer, iletişim sayfası, JSON-LD ve e-postalardaki yanlış telefon (0534 328 83 83) ve konum (Antalya) düzeltildi. Faturadaki sahte varsayılan
vergi no/adres kaldırıldı. Siparişe özel sözleşme PDF'i, müşteri için sözleşme/fatura indirme, `/siparis-takip` sayfası, havale ödeme hatırlatma
ve otomatik iptal görevi, açık yönlendirme (`?redirect=//...`) düzeltmesi eklendi.

**Sizin kararınız / işiniz:**
1. **Fatura PDF'i resmî e-Arşiv faturası değil**, ama altında "Bu fatura elektronik ortamda düzenlenmiştir ve imza gerektirmez" yazıyor. e-Arşiv entegrasyonu yapılana kadar başlığın "Sipariş Özeti / Proforma" olarak değiştirilmesi önerilir.
2. **IBAN hesap sahibi** kodda "Voltekno Enerji Sistemleri" yazıyor; şirket unvanı AFET TEKNOLOJİLERİ LTD. ŞTİ. Bankadaki hesap sahibi adı kontrol edilmeli (`lib/store-config.ts`).
3. Hostinger'da cron: `curl -s -X POST -H "Authorization: Bearer $CRON_SECRET" https://voltekno.com/api/cron/expire-orders` (6 saatte bir) ve `.env`'e `CRON_SECRET`.
4. `firebase deploy --only firestore:rules,firestore:indexes` (yeni kurallar bu turda da değişti).
5. Canlı sitedeki logo `mexxsun.com` sunucusundan yükleniyor (başka markanın tema dosyası) — projedeki kendi logonuz kullanılıyor.


## ✅ Faz 4 — iade, hesap, stok, SEO (12.10.2026)

İade/cayma talebi akışı (müşteri + admin + e-postalar), havale ödeme bildirimi (profil > Havale Bildirimi, sipariş sayfası),
KVKK hesap silme (şifreyle yeniden doğrulama), sipariş sırasında stok kontrolü, "stok gelince haber ver", Google Merchant akışı,
ürün JSON-LD düzeltmeleri, site haritası, admin satış/stok raporu eklendi.
Güvenlik: faturalar artık herkese açık klasöre / herkese açık Firebase Storage adresine (sıralı sipariş no ile tahmin edilebilir) yüklenmiyor;
e-posta HTML'ine müşteri adının kaçışsız yazılması (HTML enjeksiyonu) düzeltildi.

**Sizin işiniz:** Merchant Center'a akış adresini ekleyin (`https://voltekno.com/feed/google-merchant.xml`); daha önce canlıda
`public/uploads/invoices` veya Firebase Storage `invoices/` altına yüklenmiş fatura PDF'leri varsa silinmeli/erişime kapatılmalı.


## ✅ Faz 5 — operasyon ve güvenilirlik (12.10.2026)

Paketleme/sevk formu PDF'i (admin), kritik hata e-posta bildirimi, SQLite yedekleme görevi, Cloudflare Turnstile bot koruması
(isteğe bağlı), iletişim formlarının sunucuya taşınması (admin'e e-posta artık gidiyor; Firestore'a doğrudan yazma kapatıldı),
terk edilen sepet hatırlatması ve profilde kampanya iletisi izni (ret hakkı).

**Sizin işiniz:** Hostinger cron'a günlük `curl -s -X POST -H "Authorization: Bearer $CRON_SECRET" https://voltekno.com/api/cron/backup`
ekleyin ve `BACKUP_DIR`'i herkese açık olmayan bir klasöre ayarlayın; bot koruması için Cloudflare'den Turnstile anahtarı alıp
`NEXT_PUBLIC_TURNSTILE_SITE_KEY` / `TURNSTILE_SECRET_KEY` girin; `firebase deploy --only firestore:rules` (contactMessages kuralı değişti).


## ✅ Faz 6 — kampanya motoru (13.10.2026)

Admin > İndirimler'de tanımlanan kampanyalar (önceden hiçbir yere uygulanmıyordu) artık ürün kartı, ürün sayfası, kategori, arama,
sepet, ödeme, sipariş tutarı, JSON-LD ve Google Merchant akışında uygulanıyor. Katalogdaki "toplu indirim" fiyatı kalıcı
düşürmek yerine geri alınabilir kampanya oluşturuyor. Kategori sayfaları artık güncel katalogdan (admin düzenlemeleri) okuyor.
Sepetteki fiyatlar sunucuyla eşleniyor; fiyatı değişen/tükenen ürün için uyarı gösteriliyor.

**⚠️ Yayına almadan önce:** Admin > İndirimler'i kontrol edin. Yerel veritabanında Nisan'dan kalma süresiz, aktif
"yeni10" (tüm ürünlere %10) kampanyası var; canlıda da varsa bu güncellemeyle birlikte tüm fiyatlar %10 düşer.


## ✅ Faz 7 — arama, karşılaştırma, erişilebilirlik, performans (13.10.2026)

Arama (yazım hatası toleransı, eş anlamlılar, sıralama, klavye ile gezinme), ürün karşılaştırma, mobil erişilebilirlik düzeltmeleri,
ürün sayfasının yükleme iskeletine dönmemesi, ETBİS doğrulama rozeti (bağlantı girilince). Üretim derlemesi hatasız.

**Sizin işiniz:** ETBİS panelindeki site doğrulama bağlantısını `NEXT_PUBLIC_ETBIS_VERIFY_URL` olarak girin.

---

## 1. 🔴 P0 — Güvenlik (canlıya çıkmadan önce)

- [x] **Fiyat/toplamı sunucuda hesapla.** `app/api/orders/route.ts:66-76, 216-218` `pricing.total`, `subtotal`, `item.price` değerlerini istek gövdesinden alıyor ve Stripe'a bu tutarı gönderiyor → 1 TL'ye her ürün alınabilir. Ürün fiyatı, KDV, kargo ve kupon sunucuda DB'den hesaplanmalı.
- [x] **`paymentId` gönderince sipariş PAID olmasın.** `app/api/orders/route.ts:94` → sipariş her zaman `PENDING` oluşmalı; yalnızca doğrulanmış webhook PAID yapmalı.
- [x] **Sipariş uç noktalarına yetki ekle.** `app/api/orders/[id]/route.ts` GET/PATCH tamamen açık (herkes her siparişi okuyup durumunu değiştirebiliyor). GET → sahibi veya admin; PATCH → yalnızca admin + `status` doğrulaması.
- [x] **Sipariş numarasıyla sorgulamayı kapat.** `app/api/orders/by-no/[orderNo]/route.ts:41` telefon parametresi yoksa kontrol atlanıyor; numaralar sıralı (`ORD-2026-00001`) → tüm müşteri verisi (KVKK ihlali) çekilebilir. Telefon/e-posta doğrulaması zorunlu olmalı + rate limit.
- [x] **`x-user-id` başlığıyla admin girişini kaldır.** `lib/adminAuth.ts:48-52` doğrulanmamış başlığa güveniyor.
- [x] **Kullanıcının kendini admin yapmasını engelle.** `firestore.rules:11` kullanıcı kendi `users/{uid}` belgesine `role: 'admin'` yazabiliyor; `app/api/auth/firebase-session/route.ts` bu rolü JWT'ye kopyalıyor. Kurallarda `role` alanını yazılamaz yap, rolü yalnızca Prisma'dan oku.
- [x] **Test uç noktalarını kaldır/kapat.** `app/api/test/email`, `app/api/test/storage` kimlik doğrulamasız (açık e-posta rölesi, dosya yazma/silme). Dev sunucuda `GET /api/test/email` → 200 doğrulandı.
- [x] **`/api/orders/notify` açık e-posta rölesi** — mağaza adına keyfi içerikli "sipariş onayı" gönderilebiliyor (oltalama). Kaldır veya yalnızca sunucu içinden çağır.
- [x] **Kayıt yanıtında doğrulama kodu dönmesin.** `app/api/auth/register/route.ts:107` `verificationCode` dönüyor → e-posta doğrulaması atlanabiliyor.
- [x] **PayTR webhook:** `lib/adapters/payments/paytr.ts:16-18` env yoksa herkesin bildiği `'mock_merchant_salt'` kullanılıyor; `merchant_oid` içinde `_` yoksa `orderId = undefined` → rastgele bir sipariş PAID oluyor. Env yoksa fail-closed yap.
- [x] **Kullanılmayan ama açık uç noktaları sil:** `/api/checkout`, `/api/cart`, `/api/coupons/validate`, `/api/stripe/create-session` (yetkisiz, keyfi tutarlı Stripe oturumu açıyor), `/api/orders/next-order-no`. `lib/payment.ts`, `lib/pricing.ts` stub'larını temizle.
- [~] **Admin şifre girişine rate limit/kilit** _(rate limit + sabit zamanlı karşılaştırma yapıldı; kişisel hesap + 2FA kaldı)_ — (`app/api/admin/auth/route.ts`), sabit zamanlı karşılaştırma; mümkünse kişisel admin hesapları + 2FA.
- [x] **Sepet IDOR:** `app/api/cart/route.ts:147-158` PUT, ürünün çağıranın sepetine ait olduğunu kontrol etmiyor (rota kullanılmıyorsa silinsin).
- [x] **`userId` token'dan alınsın, gövdeden değil** (`app/api/orders/route.ts:49-56`).
- [x] **Canlıdaki "Deneme için sipariş oluştur" butonunu kaldır** (`app/checkout/page.tsx:766-775`) — gerçek sipariş açıp stok düşüyor.

## 2. 🔴 P0 — Kırık akışlar (çalışmayan özellikler)

- [x] **Arama tamamen bozuk:** `/api/search` → 500. `lib/adapters/search/postgres.ts` `mode: 'insensitive'` kullanıyor ama veritabanı SQLite. (Canlı doğrulandı.)
- [~] **Ürün yorumları ve soruları 500 veriyor:** _(indeksler `firestore.indexes.json`'a eklendi; `firebase deploy` bekliyor)_ — Firestore bileşik indeksleri eksik (`firestore.indexes.json` boş). Gerekli: `productReviews (productId, status, createdAt desc)` ve `productQuestions (productId, createdAt desc)`. Ekleyip `firebase deploy --only firestore:indexes` çalıştır.
- [ ] **Veritabanı SQLite** (`prisma/schema.prisma:9`, `DATABASE_URL=file:`). Canlıda eşzamanlı sipariş, yedekleme ve ölçek için PostgreSQL/MySQL'e geçilmeli. _Firma Firebase tarafında veritabanı bağlamak istiyor → önerilen: Firebase Data Connect / Cloud SQL for PostgreSQL (Prisma doğrudan çalışır, kod değişmez); Firestore'a taşımak sipariş sisteminin yeniden yazılmasını gerektirir._
- [x] **Müşteri siparişini göremiyor:** checkout Prisma'ya yazıyor, ama `app/orders/[id]/OrderDetailClient.tsx` ve Profil → Siparişlerim Firestore'dan okuyor. Tek veri kaynağına indir (Prisma önerilir).
- [x] **Sepette uygulanan kupon ödemeye yansımıyor:** indirim yalnızca sepet sayfasının yerel state'inde; checkout ve sunucu (`discount: 0`) yok sayıyor → müşteri indirimli görüp tam fiyat ödüyor. Kupon kodu siparişe taşınmalı ve sunucuda doğrulanmalı (kullanım limiti, son tarih, min. tutar).
- [~] **PayTR entegrasyonu gerçek servisle çalışmaz:** _(bildirim doğrulaması PayTR HMAC kuralına göre düzeltildi, `OK` yanıtı veriyor; ödeme başlatma (iFrame token) hâlâ yok — sahte URL yerine hata veriyor)_ — hash yanlış (PayTR HMAC-SHA256 + merchant_key + base64 ister), callback form-encoded okunmuyor, yanıt düz `OK` değil, `initPayment` sahte URL üretiyor. Ya düzgün entegre et ya kaldır.
- [x] **Stripe webhook:** tanınmayan olaylarda (`checkout.session.expired`) exception → 400 → Stripe sonsuz yeniden dener. Tutar–sipariş toplamı karşılaştırması ve idempotency yok (tekrar gelen olay faturayı tekrar gönderiyor; geç gelen `payment_failed` PAID'i FAILED yapıyor).
- [x] **Kartla ödemede iptal → sepet kayboluyor:** sepet Stripe'a yönlendirmeden önce temizleniyor (`checkout/page.tsx:257`). Sepeti ödeme onayından sonra temizle.
- [x] **Durum değişikliği e-postaları hiç gitmiyor:** `app/api/orders/[id]/route.ts:54-60` güncellemeden sonra karşılaştırma yapıyor (hep eşit).
- [x] **"Sipariş onaylandı" e-postası ödeme olmadan gidiyor** (`orders/route.ts:202-204`). Kartlı siparişte webhook sonrasına, havalede "ödeme bekleniyor" şablonuna taşı.
- [x] **Fatura adresi, sipariş notu, TC kimlik no sunucuya ulaşmıyor** (`orders/route.ts:109-111`).
- [x] **Başarı sayfası ödemeyi doğrulamıyor** (`checkout/success/page.tsx`) — URL parametresine güveniyor; sunucudan sipariş durumunu sorgulamalı.

## 3. 🔴 P0 — Yasal zorunluluklar (Türkiye)

- [x] **Ödeme adımında zorunlu onay kutuları:** "Ön Bilgilendirme Formu'nu ve Mesafeli Satış Sözleşmesi'ni okudum, onaylıyorum" — işaretlenmeden sipariş verilememeli (Mesafeli Sözleşmeler Yönetmeliği). _(Düzeltme: sepette onay kutuları zaten vardı; artık ödeme adımında da zorunlu, sunucu onaysız siparişi reddediyor ve onay zamanı + IP siparişe kaydediliyor.)_
- [x] **Ön Bilgilendirme Formu ve Mesafeli Satış Sözleşmesi sayfaları** _(/pages/* sayfaları; siparişe özel sözleşme PDF'i "Siparişiniz alındı" e-postasına ekleniyor; onay zamanı, IP ve metin sürümü siparişe kaydediliyor)_ — ayrı, müşteri/sipariş bilgileriyle dinamik doldurulmuş; sipariş e-postasına ek/PDF olarak gönderilmeli ve siparişle birlikte saklanmalı (onay zamanı + IP).
- [x] **KVKK Aydınlatma Metni** _(kayıt formunda bilgilendirme, ödeme/sepet pencerelerinde metin)_ ayrı sayfa + kayıt/checkout formlarında bağlantı; açık rıza (pazarlama izni) ayrı ve **işaretsiz** kutu olmalı.
- [~] **Ticari elektronik ileti (İYS):** _(kayıtta ayrı ve işaretsiz izin kutusu + bülten onay metni, zaman damgalı kayıt; İYS sistemine kayıt/aktarım sizde)_ bülten/SMS izni ayrı onay; İYS kaydı.
- [x] **Çerez onayı:** _(analitik yalnızca "Kabul Et" sonrası başlıyor; "Sadece Gerekli" eşit görünür)_ zorunlu olmayan çerezler onaydan önce yüklenmemeli; "Reddet" seçeneği eşit görünürlükte olmalı.
- [x] **Footer'da zorunlu satıcı bilgileri:** _(unvan, adres, MERSİS, vergi dairesi/no, KEP, telefon, e-posta)_ unvan, MERSİS no, adres, telefon, e-posta, KEP adresi, vergi dairesi/no.
- [ ] **E-Fatura / E-Arşiv entegrasyonu** — _firma sonra bağlayacak; entegratör seçilince API'ye bağlanır._ (şu an PDF fatura üretiliyor; resmi e-arşiv fatura için entegratör gerekli).
- [x] **14 gün cayma hakkı süreci:** hesaptan iade talebi oluşturma (şu an yalnızca bilgi sayfası var), iade kodu, durum takibi, 14 gün içinde ödeme iadesi. _(Siparişlerim > İade Talebi: cayma (14 gün) / ayıplı / yanlış ürün; admin onay + kargo iade kodu → teslim alındı (stok iadesi) → ücret iadesi; e-postalar ve zaman çizelgesi)_
- [~] **ETBİS kaydı** ve footer'da ETBİS logosu/QR. _(kayıt yapıldı; doğrulama bağlantısı NEXT_PUBLIC_ETBIS_VERIFY_URL'e girilince footer'da rozet çıkar)_

## 4. 🟠 P1 — Sipariş operasyonu

- [~] **Stok yönetimi:** _(atomik koşullu düşme, iptal/iadede ve kart ödeme sayfası açılamazsa geri ekleme yapıldı; ödeme onayına kadar rezervasyon/süre aşımı yok)_ — stok yalnızca ödeme onaylanınca (veya rezervasyon + süre aşımı) düşsün; iptal/başarısız ödemede geri eklensin; aşırı satış (oversell) kontrolü; eşzamanlı siparişte atomik `decrement`. _(sipariş sırasında sunucuda stok kontrolü eklendi (tükenmiş / stoktan fazla adet reddedilir))_
- [x] **Sipariş numarası yarışı:** _(tek atomik upsert)_ `lib/sequence.ts` ilk kayıtta iki eşzamanlı sipariş PK hatası verir → `upsert`.
- [x] **Havale/EFT akışı:** _(POST /api/cron/expire-orders: son günden 1 gün önce hatırlatma, süre dolunca iptal + stok iadesi; Hostinger cron kurulmalı)_ _(%3 indirim, IBAN ekranda + e-postada, son ödeme tarihi, admin “Ödeme Alındı” yapıldı; süresi geçen siparişlerin otomatik iptali için zamanlanmış görev yok)_ — IBAN bilgisi + açıklamaya sipariş no; ödeme beklenen siparişlerin X gün sonra otomatik iptali; admin'den "ödeme alındı" işaretleme.
- [~] **Kargo entegrasyonu:** _(admin kargo firması + takip no girer, müşteriye takip linkli e-posta gider; kargo firması API'siyle otomatik gönderi oluşturma yok)_ — kargo firması API'si (Yurtiçi/Aras/MNG vb.) ile gönderi oluşturma, takip no, müşteriye takip linkli e-posta/SMS.
- [x] **Sipariş durum akışı:** PENDING → PAID → HAZIRLANIYOR → KARGODA → TESLİM EDİLDİ / İPTAL / İADE; geçiş kuralları ve her geçişte bildirim.
- [x] **Misafir sipariş takibi:** sipariş no + e-posta/telefon ile güvenli sorgulama sayfası.
- [x] **Admin: kısmi iade, iptal, not, sipariş yazdırma/irsaliye.** _(iptal, iade alındı, admin notu, zaman çizelgesi yapıldı; kısmi iade ve irsaliye yazdırma yok)_ _(kısmi iade eklendi; irsaliye yazdırma yok)_ _(paketleme/sevk formu PDF (resmî e-İrsaliye değil))_
- [~] **Bildirimler:** _(admin'e yeni sipariş/ödeme e-postası yapıldı; SMS yok)_ — SMS sağlayıcı (sipariş, kargo, OTP); admin'e yeni sipariş bildirimi.

## 5. 🟠 P1 — Ödeme

- [~] Türkiye pazarı için yerli sanal POS — _NestPay 3D Pay Hosting entegre edildi (`lib/payments/bank-pos.ts`, `/api/payments/pos/callback`): imza (hash ver3), 3D durumu, onay kodu ve tutar doğrulanıyor; başarısız ödemede sipariş iptal, stok + kupon iade, sepet korunuyor. Banka bilgileri bekleniyor; test mağazasıyla denenmeli. Taksit tablosu bankanın oranları gelince. Kontrol (13.10.2026): yerel canlı derlemede 37 gerçek sipariş senaryosu geçti (havale+kupon+iptal, kart onay/ret/3D hatası/tutar uyuşmazlığı/sahte imza/tekrar dönüş/iptal edilmiş siparişe ödeme, zamanlanmış görev). Bankadan API kullanıcısı alınınca: sonuçlanmamış kart siparişleri için bankaya durum sorgusu (ORDERSTATUS) eklenmeli — şimdilik 60 dk sonra yöneticiye uyarı gidiyor, otomatik iptal yok. Bankanın örnek kodundaki bilinen hash örneğiyle birim testi eklenmeli._ — **taksit seçenekleri** ve kart bazlı taksit tablosu.
- [x] **3D Secure** zorunluluğu, başarısız ödemede açıklayıcı hata ve tekrar deneme. _(bankanın 3D sayfası; hata mesajı iptal sayfasında, sepet korunur)_
- [ ] Kapıda ödeme (isteğe bağlı) ve ek ücreti.
- [ ] Ödeme sonrası mutabakat: sağlayıcı paneli ↔ sipariş durum karşılaştırma raporu.

## 6. 🟠 P1 — Altyapı, güvenilirlik, gözlemlenebilirlik

- [~] **Rate limit:** _(yorum/soru/sipariş/kupon/takip/belge uç noktalarında var, istemci IP'si güvenilir şekilde alınıyor; hâlâ bellek içi (çok sunucuda Redis gerekir))_ register, forgot/reset password, verify-email (6 haneli kod brute-force), admin auth, upload, yorum/soru POST. `lib/rate-limit.ts` spoof edilebilir `X-Forwarded-For` + bellek içi; güvenilir IP + Redis/Upstash.
- [x] **Bot koruması:** kayıt, iletişim, yorum, GES teklif formlarına Cloudflare Turnstile / reCAPTCHA (projede yok). _(Cloudflare Turnstile: iletişim, ürün soru/yorum, stok bildirimi; anahtar girilince devreye girer. İletişim formları artık sunucudan geçiyor ve admin'e e-posta gidiyor)_
- [x] **Yükleme güvenliği:** _(kullanılmayan kimliksiz /api/upload/* ve /api/pdf/quote kaldırıldı)_ `/api/upload/*` kimliksiz; dosya içeriği (magic bytes) kontrolü, boyut/adet limiti.
- [x] **Firestore kuralları:** _(iletişim/GES/bülten kayıtlarında alan, boyut ve sunucu zamanı kontrolü; guestOrders istemciden yazılamaz — firebase deploy gerekli)_ `guestOrders`, `contactMessages`, `gesQuotes`, `newsletter` herkes tarafından şema/boyut kontrolsüz yazılabiliyor → şema doğrulama.
- [x] **Şifre sıfırlamada oturumları iptal et** _(eski e-posta/şifre API'leri ve NextAuth kaldırıldı; Firebase şifre değişince oturumları kendisi geçersiz kılar)_ (token versiyonu / `passwordChangedAt`).
- [x] **Kullanıcı numaralandırma** _(ilgili eski uç noktalar kaldırıldı)_ mesajlarını genelleştir (register, verify-email).
- [~] **Hata izleme:** Sentry vb. (yok). Webhook ve e-posta hataları için uyarı. _(Sentry yerine kritik hatalarda admin'e e-posta (15 dk sınırlı): sipariş, kart ödeme, webhook, tutar uyuşmazlığı, fatura, cron. Sentry için DSN gerekir)_
- [~] **Yedekleme:** günlük DB yedeği + geri yükleme testi. _(POST /api/cron/backup: SQLite VACUUM INTO, son 14 yedek; Hostinger cron kurulmalı, geri yükleme denemesi yapılmalı)_
- [x] **Ürün soruları moderasyonsuz yayınlanıyor** _(yalnızca admin yanıtlayınca yayınlanıyor; uzunluk ve deneme sınırı)_ (`questions/route.ts`) → `status: pending` + admin onayı + uzunluk limiti.
- [x] **`.env.example` güncelle:** _(tek dosya, kodun kullandığı tüm değişkenler; eski env.example silindi)_ `JWT_SECRET`, `ADMIN_EMAIL`, `NEXT_PUBLIC_SITE_URL`, `SMTP_*`, `STRIPE_*`, `PAYTR_*`. Gizli değerlerde boş string fallback'lerini kaldır (fail-fast).
- [ ] **Repo temizliği:** kökteki ~380 MB zip'ler (`public_html*.zip`, `tommatech-*.zip`), `nul`, boş `product-*.html`, `.codex-*.log`, `build_output.txt`, `dev.log` → sil veya `.gitignore`. _(21.10: `.codex-*.log` git dışında; kökteki 4 eski zip (yaklaşık 380 MB) git'te değil, diskte duruyor (eski site yedeği olabilir, silme kararı sizde))_

## 7. 🟡 P2 — Test ve kalite

- [~] **E2E testler (Playwright var):** _(tests/checkout.spec.ts: yasal sayfalar, footer, havale indirimi, onay zorunluluğu, sipariş takibi, sunucu doğrulamaları (sipariş oluşturmadan); üyeli ve kartlı akış yok)_ misafir havale siparişi, üyeli kartlı sipariş (Stripe test modu), kupon, iptal/geri dönüş, şifre sıfırlama, admin durum değişikliği.
- [x] Sunucu fiyat hesaplama ve kupon için birim testler. _(npm run test:unit)_
- [x] CI'da `typecheck + lint + test` _(birim testleri CI'a eklendi)_ (`.github` klasörü var, iş akışı kontrol edilmeli).
- [ ] Ayrı staging ortamı (test POS anahtarlarıyla).

## 8. 🟡 P2 — Müşteri deneyimi

- [x] **Stok gelince haber ver** (yok). _(ürün sayfasında form; admin stok güncellemesi ve cron sonrası tek seferlik e-posta)_
- [x] **Terk edilen sepet hatırlatma e-postası** (yok). _(yalnızca ticari ileti izni olan üyeler, 24 saat sonra, sepet başına bir kez; profilde izin verme/geri alma)_
- [x] Ücretsiz kargo eşiği göstergesi ("X TL daha ekleyin").
- [x] Tahmini teslim tarihi ürün ve sepet sayfasında. _(✓ ürün, sepet, ödeme, sipariş sayfası ve e-postalarda (`9b73f14`))_
- [x] Hesapta: sipariş geçmişi _(çalışıyor; detay, takip, ödenmemiş siparişi iptal)_, fatura indirme, iade talebi, kayıtlı adresler, şifre değiştirme, **hesap silme (KVKK)**. _(fatura/sözleşme indirme, iade talebi, havale bildirimi, hesap silme (KVKK) eklendi)_
- [x] Arama: otomatik tamamlama, yazım toleransı, sonuç yoksa öneri. _(puanlı sıralama, kelime bazlı eşleşme, eş anlamlılar, tek harf yazım hatası toleransı; öneri kutusunda kategori önerisi, eski fiyat, ok tuşları/Enter/Esc ve ekran okuyucu desteği; hafif API yanıtı)_
- [ ] Ürün sayfası: stok durumu, teknik doküman/datasheet indirme, garanti bilgisi, benzer/tamamlayıcı ürünler.
- [ ] Kurumsal müşteriler için: fatura profili (vergi no), toplu sipariş/teklif iste (RFQ modeli şemada var), bayi fiyatı.
- [x] Canlı destek / WhatsApp butonu. _(✓ sabit WhatsApp düğmesi ve footer bağlantısı var)_
- [x] Erişilebilirlik (klavye, kontrast, form etiketleri) ve mobil checkout testi. _(mobil denetim: yinelenen main-content kimliği (13 dosya), eksik h1, etiketsiz arama/adet/yorum alanları, isimsiz kupon ve yıldız butonları, 10px slayt noktaları düzeltildi; ödeme sayfasında yatay taşma yok — otomatik testte)_

## 9. 🟡 P2 — SEO ve ölçümleme

- [x] **Analitik:** _(Firebase Analytics → GA4 mülkü; yalnızca çerez onayı verenlerde. `lib/analytics.ts`: view_item, add_to_cart, remove_from_cart, view_cart, begin_checkout, add_payment_info, purchase — havalede sipariş oluşunca, kartta ödeme onaylanınca, sipariş başına bir kez; fiyatlar KDV dahil)_ GA4 + e-ticaret olayları.
- [ ] Meta Pixel / Conversions API, Google Ads dönüşüm etiketi.
- [x] Google Merchant Center ürün feed'i (XML) — Alışveriş reklamları için. _(/feed/google-merchant.xml — KDV dahil fiyat, kargo, stok)_
- [x] Ürün sayfalarında `Product` + `Offer` + `AggregateRating` JSON-LD; `BreadcrumbList`; `Organization`. _(fiyat KDV dahil, kargo 50 TL/eşik, iade politikası; admin düzenlemelerini görür; admin ürünleri artık 404 vermiyor)_
- [~] `sitemap.ts`/`robots.ts` var — ürün/kategori/blog URL'lerinin tamamını içerdiğini ve Search Console'a gönderildiğini doğrula. _(yasal sayfalar ve admin ürünleri eklendi; Search Console gönderimi sizde)_
- [~] Core Web Vitals: ana sayfa dev'de ilk derlemede 53 sn sürdü; prod build'de Lighthouse ölç, görsel optimizasyonu kontrol et. _(prod derleme, Pixel 5 + 4× yavaş CPU (yerel ağ): LCP ≤ 2,4 sn, CLS ≤ 0,024; ürün sayfasının sunucu verisi varken iskelete dönmesi giderildi. Gerçek ağda PageSpeed Insights ile ölçülmeli)_

## 10. 🟢 P3 — Büyüme ve pazarlama

- [-] ~~E-posta bülteni~~ — _ertelendi: toplu e-posta gönderilmiyor; footer'daki abonelik kutusu kaldırıldı (kayıttaki isteğe bağlı ticari ileti onayı duruyor)._
- [~] Kampanya motoru: X al Y öde, kategori indirimi, ilk siparişe özel kupon, sadakat puanı. _(Kupon kodları yönetim panelinden (İndirimler & Kuponlar): yüzde/TL, en az sepet, en fazla indirim, kullanım sınırı (siparişte ayrılır, iptalde geri verilir), tarih aralığı, aktif/pasif.)_ _(admin İndirimler artık uygulanıyor: tüm ürün/kategori/ürün bazlı, yüzde veya TL, tarih aralığı; en avantajlısı geçerli; sepet/ödeme fiyatları sunucuyla eşleniyor; Merchant akışında sale_price. X al Y öde ve sadakat puanı yok)_
- [x] Ürün karşılaştırma (kısmen var — kontrol et). _(yoktu, eklendi: ürün sayfasında Karşılaştır (en fazla 4), alt çubuk, /karsilastir tablosu — farklı özellikler vurgulanır)_
- [-] Pazaryeri entegrasyonu (Trendyol, Hepsiburada, N11) — stok/fiyat senkronu. _(ertelendi — şu an gerek yok, 13.10.2026)_
- [ ] Muhasebe/ERP entegrasyonu (Paraşüt, Logo vb.).
- [~] Admin raporları: ciro, kâr marjı, en çok satanlar, düşük stok uyarısı, dönüşüm hunisi. _(panelde son 30 gün en çok satanlar + düşük stok/bekleyen bildirim; kâr marjı ve dönüşüm hunisi yok)_

---

### Doğrulanan çalışma sonuçları (dev, port 3005)
| Kontrol | Sonuç |
|---|---|
| `tsc --noEmit` | ✅ hatasız |
| 23 genel sayfa (/, /products, /cart, /checkout, /blog …) | ✅ 200 |
| `/admin` | ✅ 307 → giriş |
| `/api/orders`, `/api/admin/*`, `/api/addresses`, `/api/favorites` (tokensız) | ✅ 401 |
| `/api/search?q=inverter` | ❌ 500 (SQLite `mode` hatası) |
| Ürün yorumları API | ❌ 500 (Firestore indeksi eksik, `dev.log`) |
| `/api/test/email`, `/api/test/storage` | ❌ 200 — yetkisiz erişilebilir |
