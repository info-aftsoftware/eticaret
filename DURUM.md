# Proje Durumu — Voltekno e-ticaret

_Son güncelleme: 19.10.2026 · Bu dosya çalışma boyunca sürekli güncellenir. Ayrıntılı geçmiş ve sahibine kalan işler: `YAPILACAKLAR.md` (son güncellemesi 18.10 17:09; bazı açık maddeleri o tarihten sonra yapıldı, aşağıdaki "Eksikler" bölümü günceldir). Son denetim raporları: `SITE-DENETIMI.md` (uçtan uca), `URUN-DENETIMI.md` (katalog)._

## Şu an yapılan
**19.10.2026 turu tamamlandı:** katalog denetimi, İngilizce/Türkçe tam çeviri, mobil görsel düzeltmesi, uçtan uca site denetimi ve düzeltmeleri, admin ↔ vitrin senkronu, müşteri hesabı gizlilik/belgeler. Ayrıntı aşağıda "19.10.2026 turu" bölümünde.

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
| E12 | Sağlayıcı / iş kararı gerektirenler | ❌ sizde | e-Arşiv entegratörü, SQLite → PostgreSQL, IBAN hesap sahibi adı kontrolü, kargo API, SMS, taksit tablosu, Turnstile, ETBİS, İYS, Meta Pixel (çerez politikasına eklenmeli), PayTR kararı, kapıda ödeme (`YAPILACAKLAR.md` 125–128, 242, 261) |
| E13 | Playwright testleri üretim derlemesinde kırmızıydı | ✅ `220407d` | Mobilde havale testi gizli masaüstü özet kopyasına bakıyordu (sayfa doğru, test hatalı). Merchant testi önceden üretilmiş akışta (ISR) gerekçeli atlanıyor. Not: e2e testleri sunucuyla aynı `DATABASE_URL` ile çalıştırılmalı (test ürünü/kuponu oraya yazılır) |

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
| Test (nextfirststep.com) | https://nextfirststep.com/admin/auth | hPanel → Web siteleri → nextfirststep.com → Node.js → Ortam değişkenleri → `ADMIN_TOKEN` (Hostinger değeri gizli gösterir; ilk yayında `.env.local`'daki değer girildi) | **Kapalı — açılmalı** |

- Şifre tek alanlı (kullanıcı adı yok). Değiştirmek için `ADMIN_TOKEN` değerini güncelleyip yeniden yayınlayın.
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
| Servis hesabı anahtarı | ❌ sizde | Müşteri oturumu artık anahtarsız doğrulanıyor (19.10, `lib/firebase-id-token.ts`, Google açık anahtarları): Siparişlerim, sipariş sahipliği, üye siparişinin hesaba bağlanması çalışır. Anahtar gelene kadar çalışmayanlar: markalı doğrulama/şifre/hoş geldin e-postaları (Firebase'in kendi e-postaları gidiyor), hesap silme, terk edilmiş sepet e-postası, yorum ve soru-cevap (Firestore) |
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
- Kargo ücreti desiye göre (fiyat listesi + %22,35 vergi); ücretsiz kargo eşiği yok.
- Açık öneriler (`SITE-DENETIMI.md` §4): sipariş idempotency anahtarı, fiyat değişince 409 uyarısı, kargodan N gün sonra otomatik "teslim edildi", istemci paketinden kataloğun çıkarılması, nonce tabanlı CSP.

## voltekno.com geçişi (sizde)
1. `seo-alan-adi` dalını ana dala birleştir (bana "birleştir" demeniz yeterli)
2. voltekno.com ortam değişkenleri: `NEXT_PUBLIC_SITE_URL=https://voltekno.com`, `NEXT_PUBLIC_NOINDEX` **olmamalı**, mutlak `DATABASE_URL`, yeni güçlü `ADMIN_TOKEN` + `ADMIN_TOTP_SECRET` (`node scripts/admin-2fa-setup.mjs`; test ortamında da şu an kapalı), `SMTP_FROM` yeni gönderim adresi (görünen ad `SMTP_FROM_NAME`, varsayılan Voltekno), `CRON_SECRET`, banka POS bilgileri, `MEDIA_DIR`
2a. Zamanlanmış görevler: uygulama içi zamanlayıcı havale takibini ve yedeği kendisi çalıştırır (E1); `BACKUP_DIR` derleme klasörünün dışında olmalı
3. Firebase (yeni proje `voltekno-eticaret`, adımlar `FIREBASE_SETUP.md`): Firestore/Auth/Storage açılışı, Authorized domains'a voltekno.com + www, servis hesabı anahtarı; Google/Facebook girişi için sağlayıcıları açıp `NEXT_PUBLIC_GOOGLE_SIGNIN_ENABLED=true` / `NEXT_PUBLIC_FACEBOOK_SIGNIN_ENABLED=true` (Facebook için App ID/Secret); `firebase deploy --only firestore,storage --project voltekno-eticaret`. Canlı sunucuda `NEXT_PUBLIC_FIREBASE_*` + `FIREBASE_ADMIN_*` güncellenip yeniden derlenmeli
3a. E-posta: `SMTP_USER`/`SMTP_FROM`/`SMTP_PASSWORD` → `@voltekno.com` kutusu (şu an `info@bataryakit.com`); DMARC birkaç hafta `p=none` + rapor (`rua`) ile izlenip sonra `p=quarantine`
4. DNS: ikas → Hostinger; www/http tek adımda kanonik adrese
5. Search Console + Bing: sitemap gönder; Merchant Center akışı `/feed/google-merchant.xml`; 2 hafta 404 izle
6. Teyit edilecekler: tahmini desi değerleri (özellikle Altech türbinleri, Apex 51,2V 280Ah, SPI 315–630 kW sürücüler), sözleşmelerin hukukçu kontrolü, GES fiyat bandı

## Yayın
- Test ortamı: https://nextfirststep.com (arama motorlarına kapalı)
- Son yayın: `df5aa58` (19.10.2026 15:56): eksiklerin çözümü (uygulama içi zamanlayıcı, header menüleri, Firebase/SMTP), mobil başlık + hero, süs ikonlarının kaldırılması, KDV etiketi, üyelere özel favoriler. Canlı kontrol: 16 sayfa/uç 200, eski kategori adresi 308, cron ucu yetkisiz 401, ürün sayfasında "+KDV" yok, mobil arama satırı var. Zamanlayıcı canlıda çalıştı: `expire-orders` (iptal 0) ve ilk otomatik yedek (`voltekno-2026-10-19T12-57-41-391Z.db`, 636 KB), durum dosyası veritabanının yanında. Önceki yayın: `28f5fb7` (19.10 12:11)
- Bu turdaki commit'lerin hepsi `df5aa58` ile canlıda; `urun-katalogu-ikas` GitHub'a gönderildi. `main`'e ileri sarma (çakışmasız) ve `origin` adresinin değiştirilmesi izin sisteminde reddedildi, sizin yapmanız gerekiyor
- GitHub deposu taşınmış: `https://github.com/info-aftsoftware/eticaret.git` (eski adres yönlendiriyor, aynı depo olduğu doğrulandı; `git remote set-url origin https://github.com/info-aftsoftware/eticaret.git`). Dal: `urun-katalogu-ikas`.
