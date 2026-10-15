# E-Ticaret Uçtan Uca Kontrol — Yapılacaklar Listesi

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
- [x] **Testler:** birim testleri (kur yuvarlama dahil) ve E2E (Chrome ile `PW_CHANNEL=chrome`, 47 geçti / 4 kampanya nedeniyle atlandı).

### 🔴 P0 — Yayından önce (sizde)

- [ ] **Canlı veritabanı temizliği:** `npx tsx scripts/clear-legacy-catalog.ts` (kuru çalıştırma) → `--apply`. Yalnızca yerel `dev.db` temizlendi.
- [ ] **"yeni10" kampanyası** (tüm ürünlere %10, süresiz) yerelde aktif; canlıda da varsa Admin > İndirimler'den kapatın.
- [ ] **Gerçek stok:** Excel'de tüm ürünlerin stoğu 17; varyantlar ürün stoğunu paylaşıyor.
- [ ] **Kargo ücreti kuralı** (siz verecektiniz): şu an 50 TL, 3.000 TL üstü ücretsiz. Desi verisi hazır; kural gelince `lib/store-config.ts`'e desi bazlı hesap eklenir.
- [ ] **Yayın yöntemi:** statik `public_html` yerine Node (standalone) yayın — canlı kur, sepet, sipariş ve ödeme sunucu ister; eski URL yönlendirmeleri de yalnızca Node yayında çalışır.
- [ ] **Merchant Center**'da akışı yeniden getirin; **Search Console**'a sitemap'i yeniden gönderin.
- [ ] Banka sanal POS bilgileri (`POS_*`) ve test; Hostinger cron'ları (`expire-orders`, `backup`) + `CRON_SECRET`; IBAN hesap sahibi adı kontrolü; e-Arşiv entegratörü; canlıdaki eski fatura PDF'lerinin silinmesi; SQLite → PostgreSQL.

### 🟠 P1 — Veri teyidi (desi araştırmasından)

- [ ] **Deye (41 SKU):** Excel'de model kodu yok; araştırmada güncel AB model aileleri varsayıldı (ör. LV hibrit 5–6 kW = SUN-xK-SG04LP1). Satılan kuşak farklıysa ölçü/ağırlık değişir. 6 kW off-grid ve 15 kW monofaze LV hibrit Deye'nin güncel serisinde yok.
- [ ] **Electrozirve:** ölçüler, model kodları birebir eşleşen SRNE kaynaklarından alındı; Electrozirve'nin SRNE markalı ürün sattığını teyit edin.
- [ ] **Apex / NP Power:** distribütör sayfalarında özellik yok; değerler arşivlenmiş sayfalar ve pazaryeri ilanlarından (düşük güven: NP 8,5/11 kW inverterler 3,5 kW ile aynı kasa görünüyor, NP2440 için iki farklı ölçü). APX şarj cihazları, NP şarj cihazları, Apex 51,2V lityumlar, NS serisi ve 80A transfer switch için veri yok.
- [ ] **Exelon:** ELH-24 ve PMAX-12P için veri sayfası yok; ELH-12/15 ağırlığı veri sayfasındaki üst sınır (≤45 kg).
- [ ] **Ölçüsü bulunamayanlar** (`missing-logistics.json`): Altech türbin ve direkleri (tedarikçiden koli listesi), Mexxsun MPK8, TommaTech duvar/entegre/SC/ayarlanabilir şarj üniteleri, R32 split ısı pompaları, SPI 315–630 kW sürücüler (paletli/ambar), kablolar ve küçük aksesuarlar, Electrozirve DC-DC ve uzaktan kumandalar, bazı Havensis aksesuarları.
- [ ] **Büyük/özel gönderiler:** 50 kW R290 ısı pompası (490 kg), büyük Frecon/SPI sürücüler, Heli 2.0/4.0 türbinler, Altech Nova → ambar/palet; Lithium SuperPack'ler UN3480 (lityum) — kargo firmasıyla kısıtları kontrol edin.
- [ ] **İstabreeze kanatları** araştırmada tek kanat ağırlığıyla; set (3'lü) satılıyorsa düzeltin. İstabreeze i-1000…Windsafe türbinleri iki koliyle gidiyor (tanımlandı).
- [ ] **Ölçüler çoğunlukla ürün (kutusuz) ölçüsü**; üreticiler koli ölçüsü yayımlamıyor. Kesin desi için ilk sevkiyatlarda koli ölçüsü alınıp `product-logistics.json`'a yazılması önerilir.
- [ ] Excel'de **eksik 16 görsel** (Drive'da silinmiş) yeniden yüklenmeli; **barkod/GTIN** sütunu boş.
- [ ] **Veri kaynağı kararı:** admin panelindeki ürün düzenlemeleri Excel yeniden aktarılınca da geçerli kalır.

### 🟡 P2 ve sonrası

- [ ] Ürün adları/açıklamaları yalnızca Türkçe (İngilizce arayüz).
- [ ] Görsel optimizasyonu için Next image optimizasyonu (sharp) / WebP; istemci paketine giren tüm katalog (~370 KB) için hafif liste.
- [ ] Ana sayfa için yeni banner/slayt tasarımları (şu an tek slayt).
- [ ] Kargo firması API, SMS, stok rezervasyonu, taksit ve ORDERSTATUS, mutabakat raporu, PayTR (entegre et ya da kaldır), admin 2FA, Redis rate limit, Sentry, Turnstile anahtarları, ETBİS bağlantısı, İYS kaydı, misafir siparişi hesaba bağlama, staging, tahmini teslim, kurumsal müşteri, Meta Pixel/Ads, ERP, X al Y öde, sadakat, kâr/huni raporları.


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
- [ ] **Repo temizliği:** kökteki ~380 MB zip'ler (`public_html*.zip`, `tommatech-*.zip`), `nul`, boş `product-*.html`, `.codex-*.log`, `build_output.txt`, `dev.log` → sil veya `.gitignore`.

## 7. 🟡 P2 — Test ve kalite

- [~] **E2E testler (Playwright var):** _(tests/checkout.spec.ts: yasal sayfalar, footer, havale indirimi, onay zorunluluğu, sipariş takibi, sunucu doğrulamaları (sipariş oluşturmadan); üyeli ve kartlı akış yok)_ misafir havale siparişi, üyeli kartlı sipariş (Stripe test modu), kupon, iptal/geri dönüş, şifre sıfırlama, admin durum değişikliği.
- [x] Sunucu fiyat hesaplama ve kupon için birim testler. _(npm run test:unit)_
- [x] CI'da `typecheck + lint + test` _(birim testleri CI'a eklendi)_ (`.github` klasörü var, iş akışı kontrol edilmeli).
- [ ] Ayrı staging ortamı (test POS anahtarlarıyla).

## 8. 🟡 P2 — Müşteri deneyimi

- [x] **Stok gelince haber ver** (yok). _(ürün sayfasında form; admin stok güncellemesi ve cron sonrası tek seferlik e-posta)_
- [x] **Terk edilen sepet hatırlatma e-postası** (yok). _(yalnızca ticari ileti izni olan üyeler, 24 saat sonra, sepet başına bir kez; profilde izin verme/geri alma)_
- [x] Ücretsiz kargo eşiği göstergesi ("X TL daha ekleyin").
- [ ] Tahmini teslim tarihi ürün ve sepet sayfasında.
- [x] Hesapta: sipariş geçmişi _(çalışıyor; detay, takip, ödenmemiş siparişi iptal)_, fatura indirme, iade talebi, kayıtlı adresler, şifre değiştirme, **hesap silme (KVKK)**. _(fatura/sözleşme indirme, iade talebi, havale bildirimi, hesap silme (KVKK) eklendi)_
- [x] Arama: otomatik tamamlama, yazım toleransı, sonuç yoksa öneri. _(puanlı sıralama, kelime bazlı eşleşme, eş anlamlılar, tek harf yazım hatası toleransı; öneri kutusunda kategori önerisi, eski fiyat, ok tuşları/Enter/Esc ve ekran okuyucu desteği; hafif API yanıtı)_
- [ ] Ürün sayfası: stok durumu, teknik doküman/datasheet indirme, garanti bilgisi, benzer/tamamlayıcı ürünler.
- [ ] Kurumsal müşteriler için: fatura profili (vergi no), toplu sipariş/teklif iste (RFQ modeli şemada var), bayi fiyatı.
- [ ] Canlı destek / WhatsApp butonu.
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
