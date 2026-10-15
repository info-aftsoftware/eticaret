# Sızdırmazlık Market - Profesyonel Sızdırmazlık Çözümleri

Next.js 14, TypeScript ve Tailwind CSS ile geliştirilmiş, sızdırmazlık ürünleri odaklı modern e-ticaret platformu.

## 🚀 Özellikler

- **Hızlı Alışveriş**: Ürünleri doğrudan sepete ekleyip sipariş verme (teklif gerekmez).
- **Varyant Desteği**: 500 ml, 1 kg, 2 kg ve 3 kg seçenekleri.
- **Güvenli Ödeme**: Stripe Checkout entegrasyonu.
- **Admin Panel**: Sipariş yönetimi ve istatistikler.
- **Modern Tasarım**: Şık, hızlı ve responsive arayüz.
- **SEO Uyumlu**: Optimize edilmiş metadata ve içerik.

## 🛠️ Teknoloji Stack

- **Frontend**: Next.js 14 (App Router), TypeScript, Tailwind CSS
- **UI**: Radix UI, Lucide React, Shadcn/UI
- **State Management**: Zustand
- **Backend**: Firebase (Firestore + Auth), Stripe, Resend
- **Validation**: Zod

## 📦 Kurulum

1. Bağımlılıkları yükleyin:
```bash
npm install
```

2. `.env.local` dosyasını oluşturun ve gerekli değişkenleri (Firebase, Stripe, admin token vb.) ayarlayın.

3. Uygulamayı çalıştırın:
```bash
npm run dev
```

## 🗂️ Ürün Kataloğu (ikas Excel)

Ürünler ikas ürün dışa aktarım Excel'inden üretilir; veritabanında değil, kodda (`lib/catalog/`) tutulur.

```bash
python scripts/import-ikas-excel.py voltekno_ikas_nihai.xlsx   # katalog + görseller + kur
npx tsx scripts/clear-legacy-catalog.ts --apply                # katalogda olmayan ürünlerin DB kayıtlarını temizler
npx tsx scripts/generate-categories-json.ts                    # statik menü için kategori listesi
```

- `lib/catalog/products.json`: ürünler ve varyantlar (Excel'deki "Ürün Grup ID" aynı olan satırlar tek ürünün varyantlarıdır)
- `lib/catalog/descriptions.json`: HTML açıklamalar (yalnızca sunucuda yüklenir)
- `public/images/products/voltekno/`: Google Drive'dan indirilen görseller
- Fiyatlar Excel'deki USD/EUR değerleridir (KDV hariç). Sitede, sepette ve siparişte TCMB döviz satış kuruyla TL'ye çevrilir (`lib/fx-rates.ts`, 1 saat önbellek). `lib/catalog/fx-snapshot.json` yalnızca kur servisine ulaşılamadığında ve statik export'ta kullanılır.
- Kategoriler Excel'deki "Ana Kategori > Alt Kategori" yapısını izler: `lib/categories.ts`. Yeni bir kategori gelirse buraya, `messages/*.json` (header) ve `app/category/[id]/category-meta.ts` dosyalarına eklenir.

## 📁 Proje Yapısı

- `app/`: Sayfa yapıları ve API rotaları
- `components/`: UI bileşenleri
- `lib/`: Yardımcı fonksiyonlar, store'lar ve veri yapıları
- `public/`: Görseller ve statik dosyalar

## 📄 Lisans

Bu proje MIT lisansı altındadır.
