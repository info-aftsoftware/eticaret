# Proje Durumu — Voltekno e-ticaret

_Son güncelleme: 18.10.2026 · Bu dosya çalışma boyunca sürekli güncellenir. Ayrıntılı geçmiş ve sahibine kalan işler: `YAPILACAKLAR.md`._

## Şu an yapılan
- [x] Ürün görselleri: "görsel hazırlanıyor" kartlarının hepsi gerçek fotoğraflarla değiştirildi (24 SKU; katalogda kart kalmadı)
  - [x] TommaTech diyot modülleri (11 SKU) — aynı OEM modelin gerçek fotoğrafı (MDK 25/55/70/90/110A etiketli)
  - [x] TommaTech 22 kW split dış ünite, R32 split iç ünite (2), 300A şarj ünitesi, R serisi MC4-DC5525 kablo (5 SKU)
  - [x] Frecon 315/355/400/450 kW (aynı serinin büyük gövde fotoğrafı), Exelon PMAX-11P/12P (aynı gövde, filigransız), Havensis 20AES / MPS 3A (birebir model) — 8 SKU
- [x] Ana sayfadan "3 Adımda Enerji Çözümü" bölümü kaldırıldı
- [x] Adım adım manuel test — 15/15 adım geçti (1 hata bulundu ve düzeltildi, aşağıda)
- [ ] Commit + nextfirststep.com'a yayın + canlı kontrol

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
- Son yayın: `b2f3bcd` (18.10.2026) — canlı kontroller 35/35 geçti
