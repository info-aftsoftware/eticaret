# Proje Durumu — Voltekno e-ticaret

_Son güncelleme: 18.10.2026 · Bu dosya çalışma boyunca sürekli güncellenir. Ayrıntılı geçmiş ve sahibine kalan işler: `YAPILACAKLAR.md`._

## Şu an yapılan
**Yayına hazırlık (localhost:3005 üzerinde adım adım)** — aşağıdaki "Yayına hazırlık" bölümünde.

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
| 6 | Düzelt, test, commit, yayın | ⏳ | Ara kayıtlar: `d52a075`, `9adcf5d`; yayın tüm işler bitince (yalnızca nextfirststep.com) |
| 7 | voltekno.com geçiş listesi | ⏳ | |

## İstek turu 2 (18.10.2026)
| İstek | Durum | Not |
|---|---|---|
| Header başlıkları üzerine gelince alt menü | ✅ | Alt kategoriler + öne çıkan markalar; daralınca önce boşluk azalır, sonra başlık sayısı 6→5→4, ≤1024 px hamburger |
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
| 2 | Header: Tüm Kategoriler menüsü, kategori linkleri, arama önerileri | ✅ | ✅ | Mega menü (alt kategori + marka), arama önerisi 8 sonuç, Enter → ürünler |
| 3 | Kategori sayfası | ✅ | ✅ | Şarj Kontrol: 66 ürün |
| 4 | Ürün sayfası: galeri, varyant, sepete ekle, favori | ✅ | ✅ | 13 görsel, 2 varyant, favori ve sepete ekleme çalışıyor |
| 5 | Ürün kartı: sepete ekle, adet +/−, "Seçenekleri Gör" | ✅ | ✅ | Karttan ekleme ve adet artırma çalışıyor |
| 6 | Favoriler (misafir) | ✅ | ✅ | Giriş istemeden listeleniyor |
| 7 | Sepet: kargo çubuğu, sözleşme onayları | ✅ | ✅ | Ücretsiz kargo bilgisi, 3 onay kutusu |
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

## Bilinen sınırlamalar
- Gerçek Firebase hesabı açılmadan giriş yapılmış kullanıcı ekranları (profil, doğrulama bandı) tarayıcıda denenemiyor.
- Kart ödemesi: banka sanal POS bilgileri girilene kadar kapalı (Havale/EFT çalışıyor).
- Kargo ücreti sabit (50 TL, 3.000 TL üstü ücretsiz); desi kuralı bekleniyor.

## Yayın
- Test ortamı: https://nextfirststep.com (arama motorlarına kapalı)
- Son yayın: `58f75f6` (18.10.2026 12:31) — sayfalar 200, "3 Adımda" yok, "görsel hazırlanıyor" kartı yok, yeni görseller canlıda; açılış logunda hata yok
