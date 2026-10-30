# Firebase kurulumu — voltekno-eticaret

> **Karar (29.10.2026, kullanıcı): canlı ve yerel, eski proje `eticaret-54bdc` ile devam eder; yeni proje (`voltekno-eticaret`) yedek olarak kalır.** `.env.local` ve `.firebaserc` (`default`) eski projeyi gösterir; yeni proje `yeni` takma adıyla erişilebilir. Eski projede durum, 30.10:
> - Firestore kuralları depodaki `firestore.rules` ile yayında.
> - Yetkili alan adları eklendi: `voltekno.com`, `www.voltekno.com`, `nextfirststep.com`.
> - E-posta şablonu ayarları (dönüş adresi, gönderen adı) API ile değiştirilemiyor (`EMAIL_TEMPLATE_UPDATE_NOT_ALLOWED`). Bunlar yalnız yedek yolu etkiler, çünkü site doğrulama ve şifre e-postalarını kendi SMTP'siyle markalı olarak gönderir. İsterseniz Console → Authentication → Templates'ten gönderen adını "Voltekno", eylem adresini `https://voltekno.com/verify-email` yapın.
> - Eski ortak yönetim kimliğinin oturum iptali (`scripts/revoke-admin-firebase.mjs`, S2) henüz çalıştırılmadı.

Eski `eticaret-54bdc` projesindeki veriler 26.10.2026'da taşındı (18.10'daki "boş başlasın" kararı değişti). Auth kullanıcıları **aynı UID'ler ve şifre özetleriyle** aktarıldı, Firestore belgeleri aynı yollara kopyalandı. Prisma'daki siparişler Firebase UID'sine bağlı olduğu için eski müşterilerin siparişleri, favorileri ve adresleri yeni projede de görünür. Ayrıntı ve geçiş günü eşitlemesi: aşağıda "Veri taşıma".
Kod tarafı hazır: web yapılandırması `.env.local` içinde, kurallar `firestore.rules` ve `storage.rules` içinde.

## Durum

| Adım | Kim | Durum |
|---|---|---|
| Web yapılandırması (`NEXT_PUBLIC_FIREBASE_*`) | kod | tamam |
| `.firebaserc` → `voltekno-eticaret` | kod | tamam |
| `storage.rules` + `firebase.json` | kod | tamam |
| 1. Firestore veritabanı | Console | tamam (`(default)`) |
| 2. Authentication sağlayıcıları | Console | tamam (E-posta/Şifre, Google) |
| 3. Yetkili alan adları | Console | tamam (voltekno.com, www, nextfirststep.com) |
| 4. E-posta işlem adresi | Console | kontrol edilmedi |
| 5. Storage (Blaze plan) | Console | bekliyor |
| 6. Servis hesabı anahtarı | Console → kod | bekliyor |
| 7. API anahtarı kısıtlaması | Google Cloud | önerilir |
| 8. Kuralları yükleme | CLI | Firestore kuralları + indeksler yüklendi (26.10); Storage, 5'ten sonra |
| 10. Veri taşıma (Auth + Firestore) | betik | tamam (26.10); geçiş günü son eşitleme |
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

## Veri taşıma

26.10.2026'da yapıldı. Betikler `scripts/firebase-migrate/` klasöründe. Şifre özeti ve kullanıcı dosyaları repoya değil, sistemin geçici klasöründe (`%TEMP%/voltekno-fbmig`) tutulur. İş bitince silinmeleri gerekir.

| Ne | Eski | Yeni | Not |
|---|---|---|---|
| Auth hesapları | 4 | 4 | 3 e-posta/şifre hesabı aynı UID ve SCRYPT özetiyle, 1 admin teknik kimliği (`admin-panel-user`) |
| `users` | 3 | 3 | Belge kimlikleri Auth UID'leriyle eşleşiyor |
| `users/*/addresses` | 1 | 1 | |
| `users/*/favorites` | 6 | 6 | |
| `newsletter` | 2 | 2 | |

12 belgenin hepsi alan alan karşılaştırıldı, hepsi birebir aynı.

Notlar:
- CLI'nın `auth:import` komutu şifre özetlerini sessizce düşürdü. Şifreler Identity Toolkit `accounts:batchCreate` ile yazıldı (`batch-create.cjs`).
- Yeni projede Firestore, varsayılan "her şeyi reddet" kuralıyla açılmıştı. Repodaki `firestore.rules` ve indeksler 26.10'da yüklendi.

**Geçiş günü son eşitleme.** Canlı site yeni projeye geçene kadar müşteriler eski projede işlem yapmaya devam eder. Ortam değişkenlerini değiştirmeden hemen önce şu adımları uygulayın:

```bash
node scripts/firebase-migrate/fs-copy.cjs --apply --overwrite
```

Bu tarihten sonra eski projede açılan hesaplar varsa önce şu adımlar gerekir:

1. `firebase auth:export %TEMP%/voltekno-fbmig/old-users.json --format=json --project eticaret-54bdc`
2. `node scripts/firebase-migrate/hash-config.cjs`
3. `node scripts/firebase-migrate/batch-create.cjs`

Kontrol için `firebase auth:export %TEMP%/voltekno-fbmig/new-users.json --format=json --project voltekno-eticaret` ve ardından `node scripts/firebase-migrate/verify.cjs` çalıştırın. Son olarak `%TEMP%/voltekno-fbmig` klasörünü silin.

## Canlı sunucu

Test sitesi (nextfirststep.com) 26.10'da hâlâ eski projeyi (`eticaret-54bdc`) kullanıyordu. `NEXT_PUBLIC_*` değerleri derleme sırasında koda gömülür. Hostinger ortam değişkenleri güncellendikten sonra uygulama yeniden derlenmelidir.

## Notlar

- Admin paneli Firebase'de kullanıcı hesabı gerektirmez. Sunucu, `admin-panel-user` kimliği için özel token üretir ve `firestore.rules` bu kimliği admin sayar.
- Eski yapılandırmanın yedeği `.env.eticaret-54bdc.local` dosyasındadır. Git dışındadır ve Next.js bu dosyayı yüklemez.
