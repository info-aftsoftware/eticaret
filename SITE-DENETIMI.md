# Uçtan Uca Site Denetimi

**Tarih:** 19 Ekim 2026
**Ortam:** Yerel üretim derlemesi (`NEXT_DIST_DIR=.next-build`, `next start`). Canlı karşılaştırma için voltekno.com (ikas) ve nextfirststep.com (test ortamı) kullanıldı.

## Özet

| Kontrol | Sonuç |
|---|---|
| Üretim derlemesi | ✅ 425 sayfa üretildi. Lint'te hata yok; 4 eski `react-hooks` uyarısı var. |
| Tip kontrolü | ✅ Temiz |
| Birim testleri | ✅ 53/53 (yeni: son ödeme anı, kontrol karakterli yönlendirme) |
| Playwright uçtan uca testleri (Chrome) | ✅ 45 geçti, 5'i güncel kurallara göre güncellendi (aşağıda), 1 atlandı (POS yapılandırılmış ortam testi) |
| Site taraması: sitemap + iç linkler | ✅ 388 sayfanın tamamı 200 (tek 404, kasıtlı test adresi), kayıp görsel yok |
| Tarayıcıda alışveriş akışı (mobil 375 px) | ✅ Arama → ürün → sepet → ödeme. Tutarlar elle doğrulandı. Sipariş gönderilmedi (gerçek SMTP ile e-posta giderdi). |
| Kod incelemesi | ✅ Kritik bulgu yok. Orta ve düşük bulguların çoğu düzeltildi. |
| Yasal metinler ve canlı voltekno.com | ✅ 8 belgenin 7'si içerikçe aynı. Ön Bilgilendirme Formu yeni siteye göre genişletilmiş; hükümleri canlıyla çelişmiyor. |

## 1. Düzeltilen hatalar

| Alan | Sorun | Düzeltme |
|---|---|---|
| **Müşteri hesabı (kritik)** | Sunucunun Firebase Admin anahtarı eski projeye (`eticaret-54bdc`) ait. Site ise `voltekno-eticaret` kullanıyor. Bu yüzden müşteri oturumu sunucuda doğrulanamıyordu: üye siparişleri hesaba bağlanmıyor, "Siparişlerim" boş geliyor, sipariş sahibi kendi siparişini e-posta ve telefon girmeden göremiyordu. | Yeni `lib/firebase-id-token.ts` eklendi. Firebase ID token'ı Google'ın açık anahtarlarıyla (RS256, aud/iss/süre kontrolü) doğrulanıyor; Admin anahtarı doğru projedeyse firebase-admin kullanılıyor. Sahte, imzasız ve bozuk token'ların reddedildiği sınandı. |
| **Şifre sıfırlama (kritik)** | Sunucu kullanıcıyı eski projede arıyor, bulamayınca yine de "gönderildi" diyordu; hiç e-posta gitmiyordu. | Admin projesi istemciyle uyuşmazsa uç nokta 503 dönüyor, site Firebase'in kendi sıfırlama e-postasını gönderiyor. Uyuşmazlık sunucu loguna net bir uyarıyla yazılıyor. |
| Stok | Kısmi iade "teslim alındı" yapıldıktan sonra sipariş "İade edildi"ye çekilince iade adetleri stoğa ikinci kez ekleniyordu (tersi sırada da aynısı). | `restoreStock` daha önce iade yoluyla eklenmiş adetleri düşüyor; sipariş zaten RETURNED ise iade teslim alındığında stok tekrar eklenmiyor. |
| Havale | Ödeme süresi dolan siparişleri iptal eden görev, müşterinin havale bildirimini kontrol etmiyordu. Para gelmiş siparişler iptal edilip stoğu satışa açılıyordu. | Havale bildirimi yapılmış siparişler otomatik iptal edilmiyor ve hatırlatma almıyor; admin canlı panelinde onay bekliyor. |
| Havale | E-postada yazan son ödeme tarihi ile iptal anı tutmuyordu (iptal tam 72. saatte oluyordu). Tarihler sunucu saat dilimine göre biçimleniyordu. | `bankTransferDeadline`: sipariş + 3 gün, İstanbul saatiyle 23:59:59. E-posta, sipariş sayfası, başarı sayfası ve iptal görevi bunu kullanıyor; tüm tarihler `Europe/Istanbul`. |
| Kötüye kullanım | Uydurma e-postayla sınırsız havale siparişi verilip stok ve kupon 3 gün kilitlenebiliyordu. | Aynı e-posta veya telefona en fazla 3 açık, ödenmemiş havale siparişi. |
| Admin girişi | İstek sınırı IP başlığına dayanıyor; vekil sunucu bu başlığı ezmiyorsa taklit edilebilir. | IP'den bağımsız genel kilit: 15 dakikada 20 hatalı şifre veya kodda giriş 15 dakika kapanıyor. |
| Açık yönlendirme | `?redirect=/%09/evil.com` başka siteye yönlendirebiliyordu. | Kontrol karakterleri ve kök dışı hedefler reddediliyor (birim testi eklendi). |
| Kart ödemesi | Ödeme onayı ile iptal aynı anda gelirse kart çekilmiş olduğu hâlde müşteri genel hata görüyordu. | Yöneticiye "iptal edilmiş siparişe ödeme, iade gerekli" uyarısı gidiyor; müşteri doğru sayfaya yönleniyor. |
| Sipariş erişimi | E-posta veya telefon alanı metin değilse iade ve havale bildirimi uçları 500 veriyordu. | `canAccessOrder` metin olmayan değerleri eşleşme saymıyor. |
| GES formu | Ek dosya bağlantıları doğrulanmadan admin e-postasına "Fatura" bağlantısı olarak konuyordu (kimlik avı riski). Alanlarda uzunluk sınırı yoktu. | Bağlantılar yalnızca bu projenin Firebase Storage `ges-attachments` klasöründen kabul ediliyor; metin alanları sınırlı. |
| Stok bildirimi | Aynı anda çalışan iki tarama aynı kişiye iki "stokta" e-postası gönderebiliyordu. | Önce talep et, sonra gönder; gönderim başarısızsa işaret geri alınıyor. |
| Hesap silme (KVKK) | Google veya Facebook ile giren kullanıcı hesabını silemiyordu ("Şifre hatalı"). | Şifresi olmayan hesapta Google/Facebook penceresiyle yeniden doğrulama yapılıyor. |
| Ödeme sayfası | Sanal POS yapılandırılmamışken kart seçeneği sunuluyor, müşteri formu doldurduktan sonra hata alıyordu. | `/api/payments/methods` ekleniyor; POS yoksa kart seçeneği pasif ve "yakında" notlu. |
| Hesap ayarları | Sosyal girişli kullanıcıya şifre değiştirme kartı gösteriliyordu. Gizlilik ve belgeler bölümü yoktu. | Şifre kartı yalnızca şifreli hesaplarda görünüyor. Yeni "Gizlilik ve Belgeler" kartında 8 yasal metin, çerez tercihini yeniden seçme ve KVKK başvuru yolu (e-posta ve KEP) var. |
| SEO | Sepet, giriş ve kayıt sayfaları ana sayfanın başlığını kullanıyordu. İki ürün çiftinin (Likya 22 kW, MDK110A) sekme başlığı aynıydı. Giriş, kayıt ve şifre sayfalarında iki h1 vardı. | Bu sayfalara kendi başlıkları ve `noindex` eklendi. Excel'deki başlık birden fazla üründe aynıysa ürün adı kullanılıyor. Tek h1. |
| Erişilebilirlik | Sepetteki "tüm onayları işaretleyin" uyarısı ekran okuyucuya duyurulmuyordu. | `role="alert"` eklendi. |

## 2. Doğrulanan ve doğru çalışanlar

- **Fiyatlandırma ve indirimler:**
  - Sunucu her siparişi kendisi fiyatlıyor; istemcinin gönderdiği fiyatlara güvenmiyor.
  - Kupon ve %3 havale indirimi KDV öncesi tutardan, birer kez ve kargoya uygulanmadan düşülüyor.
  - Kupon kullanım sınırı yarış durumuna dayanıklı.
- **Stok ve sipariş numarası:** Stok düşümü tek işlemde ve koşullu yapılıyor. Sipariş numarası atomik sayaçla veriliyor.
- **Sepet ve ödeme ekranları:** Tutarlar tarayıcıda elle doğrulandı.
  - Ürün KDV dahil 29.977,20 ₺, kargo 10 desi için 153,24 ₺.
  - Havalede %3 indirim −749,43 ₺, KDV 4.846,31 ₺, toplam 29.231,12 ₺.
- **Banka sanal POS:**
  - İmza tüm alanları kapsıyor ve sabit zamanlı karşılaştırılıyor.
  - Tutar ve para birimi sipariş toplamıyla eşleşmek zorunda; 3D Secure tam onay isteniyor.
  - İmzasız banka dönüşü reddediliyor (test).
- **Erişim kontrolü:**
  - Sipariş, belge, iade ve havale bildirimi uçları sahip token'ı ya da e-posta + telefon eşleşmesi istiyor.
  - 28 admin uç noktasının tamamı yetki kontrolü yapıyor.
  - `/media` yol aşmaya kapalı.
- **Müşteri hesabı:**
  - Siparişler listeleniyor; takip numarası, kopyalama ve kargo takip bağlantısı var.
  - Sözleşme ve fatura PDF'i indirilebiliyor; iade/cayma talebi, havale bildirimi, adresler, favoriler, bülten onayı ve hesap silme çalışıyor.
- **Sayfalar ve görseller:** 388 sayfa 200, mobilde yatay taşma yok, kırık görsel yok.

## 3. Sizin yapmanız gerekenler (koddan çözülemeyenler)

1. **Firebase servis hesabı anahtarı (`voltekno-eticaret`, FIREBASE_SETUP.md adım 6).** Yerelde ve sunucuda `FIREBASE_ADMIN_*` değişkenleri girilmeli. Token doğrulamayı anahtarsız hâle getirdim, ama şunlar hâlâ bu anahtarı bekliyor:
   - markalı doğrulama, şifre sıfırlama ve hoş geldin e-postaları (şimdilik Firebase'in kendi e-postaları gidiyor),
   - hesap silme (sunucu Firebase kullanıcısını siler),
   - terk edilmiş sepet e-postaları,
   - ürün yorumları ve soru-cevap (Firestore).
2. **Gönderen e-posta adresi:** `SMTP_FROM` şu an `"Batarya Kit" <info@bataryakit.com>`. Hostinger'da @voltekno.com uzantılı bir posta kutusuyla değiştirilmeli.
3. **voltekno.com SSL zinciri eksik:** Sunucu ara sertifikayı göndermiyor. Node.js gibi istemciler "unable to get issuer certificate" hatasıyla bağlanamıyor; Chrome eksiği kendisi tamamlıyor. Yeni siteye geçişte (DNS → Hostinger) Hostinger'ın sertifikası kullanılacağı için sorun büyük ihtimalle kendiliğinden çözülür. Geçişten sonra kontrol edilmeli.
4. **Admin iki adımlı doğrulama:** Canlıda `ADMIN_TOTP_SECRET` tanımlı olmalı (`node scripts/admin-2fa-setup.mjs`).
5. **IP başlığı:** Hostinger vekil sunucusunun `X-Real-IP` başlığını gerçek istemci IP'siyle ezip ezmediği teyit edilmeli. Ezmiyorsa istek sınırları taklit edilebilir.
6. **Sanal POS:** Banka bilgileri (`POS_CLIENT_ID`, `POS_STORE_KEY`, `POS_GATEWAY_URL`) girilince kart seçeneği kendiliğinden açılır.

## 4. Açık kalan küçük maddeler (önerilen sonraki işler)

- **Sipariş idempotency:** Çift tıklama veya ağ tekrarı iki sipariş oluşturabilir. İstemci anahtarı ve benzersiz kolon önerilir.
- **Fiyat değişimi bildirimi:** Saatlik kur yenilemesi sepet ile sipariş arasında toplamı değiştirebilir. `expectedTotal` ile 409 dönülmesi önerilir.
- **Otomatik teslim edildi:** Kargodan N gün sonra durumu otomatik "teslim edildi" yapmak (iade süresi bu tarihten başlıyor).
- **Kademeli iade:** Ürünler birkaç ayrı iadeyle gelirse son talepte kargo ücreti iadesi önerilmiyor.
- **İstemci paketi:** Sepet, ödeme ve ürün sayfalarının ilk yük JS'i 385–429 kB; ürün kataloğu (products.json) istemci paketinde. Performans için sunucuya taşınabilir.
- **İçerik dili:** Ürün adları, açıklamaları, yasal metinler ve blog yazıları yalnızca Türkçe.
- **CSP:** `unsafe-inline` ve `unsafe-eval` içeriyor; nonce tabanlı yapıya geçilebilir.

## 5. Güncellenen testler

Dört test eski kurallara göre yazılmıştı (sabit 50 ₺ kargo, ücretsiz kargo eşiği, `.jpg` test görseli). Beklenen kargo artık koddaki desi tarifesinden hesaplanıyor. WhatsApp testi, boş sepette ödeme sayfasının `/cart`'a yönlenmesini hesaba katacak şekilde sepeti doldurup çalışıyor.
