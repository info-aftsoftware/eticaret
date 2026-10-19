# Firebase kurulumu — voltekno-eticaret

Proje boş başlıyor; eski `eticaret-54bdc` projesinden veri veya kullanıcı taşınmıyor (18.10.2026 kararı). Sonucu: eski hesaplar yeni projede yok, kullanıcılar yeniden kayıt olur; eski favori/adresler görünmez, Prisma'daki eski üye siparişleri eski kimlikte kalır (sipariş takip formuyla yine açılır).
Kod tarafı hazır: web yapılandırması `.env.local` içinde, kurallar `firestore.rules` ve `storage.rules` içinde.

## Durum

| Adım | Kim | Durum |
|---|---|---|
| Web yapılandırması (`NEXT_PUBLIC_FIREBASE_*`) | kod | tamam |
| `.firebaserc` → `voltekno-eticaret` | kod | tamam |
| `storage.rules` + `firebase.json` | kod | tamam |
| 1. Firestore veritabanı | Console | bekliyor |
| 2. Authentication sağlayıcıları | Console | bekliyor |
| 3. Yetkili alan adları | Console | bekliyor |
| 4. E-posta işlem adresi | Console | bekliyor |
| 5. Storage (Blaze plan) | Console | bekliyor |
| 6. Servis hesabı anahtarı | Console → kod | bekliyor |
| 7. API anahtarı kısıtlaması | Google Cloud | önerilir |
| 8. Kuralları yükleme | CLI | 1 ve 5'ten sonra |
| 9. Canlı sunucu ortam değişkenleri | Hostinger | 6'dan sonra |

## Console adımları

Adres: https://console.firebase.google.com/project/voltekno-eticaret

1. **Firestore Database → Create database.** Production mode seçin. Konum için `europe-west3` (Frankfurt) önerilir. Konum sonradan değiştirilemez.
2. **Authentication → Get started → Sign-in method.** Email/Password ve Google sağlayıcılarını açın. Google için proje destek e-postası seçin.
3. **Authentication → Settings → Authorized domains.** `voltekno.com`, `www.voltekno.com` ve test ortamı `nextfirststep.com` ekleyin. `localhost` varsayılan olarak listededir.
4. **Authentication → Templates.** Herhangi bir şablonda kalem simgesi → "Customize action URL" → `https://voltekno.com/verify-email`. Site doğrulama, şifre sıfırlama ve e-posta geri alma bağlantılarını bu sayfada işler. Gönderen adını `Voltekno` yapın.
5. **Storage → Get started.** Yeni projelerde Storage, Blaze (kullandıkça öde) planı gerektirir. Konumu Firestore ile aynı seçin. GES teklif formundaki fatura ve çatı görseli yüklemesi buna bağlıdır.
6. **Project settings → Service accounts → Generate new private key.** İnen JSON dosyasını proje dışında bir klasöre kaydedin ve yolunu iletin. Bu anahtarla `.env.local` içindeki `FIREBASE_ADMIN_PROJECT_ID`, `FIREBASE_ADMIN_CLIENT_EMAIL` ve `FIREBASE_ADMIN_PRIVATE_KEY` doldurulur. Anahtar olmadan da çalışanlar: admin paneli girişi (şifre + 2FA), müşteri oturumu doğrulama (`lib/firebase-id-token.ts`, Google açık anahtarları), Siparişlerim. Anahtar olmadan çalışmayanlar: markalı doğrulama/şifre/hoş geldin e-postaları (Firebase'in kendi e-postaları gider), hesap silme, terk edilmiş sepet e-postası, yorum ve soru-cevap (sunucu tarafı Firestore).
7. **Google Cloud Console → APIs & Services → Credentials → Browser key.** "Application restrictions" altında HTTP referrers seçip şunları ekleyin: `https://voltekno.com/*`, `https://www.voltekno.com/*`, `http://localhost:*/*`.

## CLI adımı

Firestore ve Storage açıldıktan sonra kurallar ve indeksler yüklenir:

```bash
firebase deploy --only firestore,storage --project voltekno-eticaret
```

## Canlı sunucu

`NEXT_PUBLIC_*` değerleri derleme sırasında koda gömülür. Hostinger ortam değişkenleri güncellendikten sonra uygulama yeniden derlenmelidir.

## Notlar

- Admin paneli Firebase'de kullanıcı hesabı gerektirmez. Sunucu, `admin-panel-user` kimliği için özel token üretir ve `firestore.rules` bu kimliği admin sayar.
- Eski yapılandırmanın yedeği `.env.eticaret-54bdc.local` dosyasındadır. Git dışındadır ve Next.js bu dosyayı yüklemez.
