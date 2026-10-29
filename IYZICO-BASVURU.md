# iyzico başvuru hazırlığı — voltekno.com

_Hazırlandı: 29.10.2026. Kod tarafı hazır: anahtarlar girilince kartlı ödeme iyzico Ödeme Formu ile alınır._

## 1. Başvuru (iyzico.com → Üye İşyeri Ol)

Başvuruyu şirket yetkilisi yapar. Başvuru formunda istenen bilgiler:

| Alan | Değer |
|---|---|
| Şirket türü | Limited şirket |
| Unvan | AFET TEKNOLOJİLERİ TİCARET VE SANAYİ LİMİTED ŞİRKETİ |
| Vergi dairesi | Hazar Vergi Dairesi |
| MERSIS | 0009188272600001 |
| Adres | Çaydaçıra Mah. Prof. Dr. Nuri Orhan Bul. No:5 İç Kapı No:17 Merkez/ELAZIĞ |
| Web sitesi | https://voltekno.com |
| Sektör | Elektrik / enerji ekipmanları perakende satışı (güneş paneli, inverter, akü, şarj istasyonu) |
| Tahmini aylık ciro ve ortalama sepet tutarı | Şirketin vereceği bilgi |
| İletişim | info@voltekno.com · +90 551 829 16 13 |

## 2. İstenecek belgeler (limited şirket)

- Vergi levhası (güncel yıl)
- İmza sirküleri (şirket yetkilisi)
- Ticaret Sicil Gazetesi: kuruluş ve varsa son yönetim/adres değişikliği
- Faaliyet belgesi (son 6 ay içinde alınmış)
- Yetkilinin kimlik kartı (ön-arka)
- Şirket adına açılmış banka hesabının IBAN'ı (ödemeler buraya aktarılır)
- Gerçek faydalanıcı / ortaklık bilgisi (%25 ve üzeri pay sahipleri)

## 3. Sitenin iyzico incelemesine hazırlığı

| Şart | Durum |
|---|---|
| Site yayında ve https (SSL) | voltekno.com geçişiyle birlikte. Başvuru, site voltekno.com'da açıldıktan sonra yapılmalı |
| Fiyatlar TL ve KDV dahil | Hazır |
| Mesafeli Satış Sözleşmesi | Hazır (24.10.2026) |
| Ön Bilgilendirme Formu | Hazır (24.10.2026) |
| İade ve Cayma Koşulları | Hazır |
| Teslimat ve kargo koşulları | Hazır (/shipping). Akü ve bataryalarda kargo teklifle |
| Gizlilik, Çerez ve KVKK Aydınlatma Metni | Hazır |
| Unvan, adres, telefon, e-posta, MERSIS, vergi dairesi, KEP | Footer ve iletişim sayfasında |
| Sepet → ödeme akışı | Hazır. Ödeme sayfasında sözleşme onay kutuları var |
| ETBİS kaydı | **Eksik:** ETBİS doğrulama adresi tanımlı değil. ETBİS'e kayıt yapıldıysa `NEXT_PUBLIC_ETBIS_VERIFY_URL` girilmeli, footer'da otomatik görünür |
| Alan adı şirkete veya yetkilisine kayıtlı | Hostinger'daki alan adı sahiplik bilgisi kontrol edilmeli |
| Yasaklı ürün | Yok (enerji ekipmanı) |

## 4. Onaydan sonra (teknik)

1. iyzico panelinden **API anahtarı** ve **güvenlik anahtarını** alın.
2. Önce test: sandbox-merchant.iyzipay.com'da ücretsiz test hesabıyla test anahtarları alınabilir.
3. Ortam değişkenleri (Hostinger → voltekno.com → Node.js ortam değişkenleri):

```
IYZICO_API_KEY=...
IYZICO_SECRET_KEY=...
IYZICO_BASE_URL=https://api.iyzipay.com
```

Test için `IYZICO_BASE_URL=https://sandbox-api.iyzipay.com`. Üçü de tanımlanınca ödeme sayfasındaki kart seçeneği iyzico ile açılır. Banka sanal POS bilgileri (`POS_*`) tanımlı olsa bile iyzico öncelikli kullanılır.

4. iyzico panelinde dönüş (callback) adresi gerekmez. Adres her istekte gönderilir: `https://voltekno.com/api/payments/iyzico/callback`.
5. Test kartıyla bir sipariş verilir, siparişin yönetim panelinde "ödendi" olduğu ve stok/kuponun doğru düştüğü kontrol edilir. iyzico'nun test kartları: dokümantasyondaki "Test Kartları" sayfası.
6. iyzico logo bandı ("iyzico ile Öde" + kart logoları) iyzico'nun marka kurallarına göre footer'a eklenir. Görsel `public/images/payment/iyzico.svg` repoda duruyor.

## 5. Kodda ne var

- `lib/payments/iyzico.ts`: Ödeme Formu başlatma ve sonuç sorgulama. IYZWSv2 imzası kullanılıyor, ek paket gerekmiyor.
- `lib/payments/iyzico-order.ts`: Siparişten iyzico isteği üretiliyor. Sepet kalemleri ve kargo sipariş toplamına kuruşu kuruşuna eşitleniyor.
- `lib/payments/card.ts`: Sağlayıcı seçimi. iyzico tanımlıysa iyzico, değilse banka POS'u kullanılıyor.
- `lib/payments/settle-card.ts`: Banka POS'u ve iyzico dönüşünün ortak işlenmesi. Ödeme tutar kontrollü işaretleniyor, başarısız ödemede sipariş iptal ediliyor, stok ve kupon iade ediliyor. İptal edilmiş siparişe ödeme gelirse yöneticiye uyarı gidiyor.
- `app/api/payments/iyzico/callback/route.ts`: Dönüş adresi. Sonuç tarayıcıdan değil, iyzico'ya sunucudan sorularak alınıyor. Yalnızca dolandırıcılık kontrolünden geçmiş ödeme (fraudStatus = 1) kabul ediliyor.
- `tests/unit/iyzico.test.ts`: İmza, sepet toplamı ve alıcı alanları için birim testleri.
