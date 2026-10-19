# SEO — voltekno.com geçişi (dal: `seo-alan-adi`)

Bu dal **yayına dahil değildir**; voltekno.com DNS'i yeni sunucuya çevrilirken ana dala birleştirilip yayımlanır.
voltekno.com aynı alan adında kalıyor, yalnızca altyapı (ikas → yeni site) değişiyor: Search Console'daki
"Adres değişikliği" aracı gerekmez; asıl iş eski URL'lerin 1:1 kalıcı yönlendirmesidir.

## Bu dalda yapılanlar
| Konu | Ne yapıldı |
|---|---|
| Eski URL'ler (132) | `lib/seo/legacy-redirects.json` → `next.config.js` `redirects()` (kalıcı 308). ikas'ın kökteki 97 ürün + 35 koleksiyon slug'ı yeni ürün / kategori / filtre sayfalarına eşlendi; ürünü artık olmayanlar en yakın kategoriye |
| Yapılandırılmış veri | Organization + WebSite + LocalBusiness yalnızca ana sayfada (önceden her sayfada tekrarlanıyordu); kaldırılmış `SearchAction` silindi |
| Ürün sayfası | `BreadcrumbList` JSON-LD eklendi (görünür breadcrumb ile aynı yol) |

## Geçiş günü (sırayla)
1. Bu dalı ana dala birleştir: `git merge seo-alan-adi`
2. voltekno.com ortamında: `NEXT_PUBLIC_SITE_URL=https://voltekno.com`, **`NEXT_PUBLIC_NOINDEX` kaldır** (yoksa site arama motorlarına kapalı kalır)
3. Yayınla, DNS'i çevir; `https://voltekno.com/robots.txt` içinde `Disallow: /` olmadığını, `/sitemap.xml`'in açıldığını kontrol et
4. Örnek eski adresleri dene (ör. `/alpex-tam-sinus-inverter-2000w`, `/akuler`) → 308 ile yeni sayfaya gitmeli
5. www → kök (veya tersi) ve http → https tek adımda yönlenmeli (Hostinger alan adı ayarı)
6. Search Console: sitemap'i gönder; ana sayfa + 5 önemli sayfa için "Dizine eklenmesini iste"; 2 hafta boyunca "Sayfalar" raporunda 404 artışını izle
7. Merchant Center ürün akışı: `/feed/google-merchant.xml` adresini yeniden tanımla
8. Bing Webmaster Tools'a sitemap gönder

## Sonraki adımlar (içerik)
- /products listesi istemcide çiziliyor (sunucu HTML'inde ürün ızgarası yok); kategori sayfaları dizinleme için yeterli, ama liste sayfası sunucu tarafında çizilirse daha iyi olur
- Kategori sayfalarına 2–3 paragraflık özgün rehber metni (seçim kriterleri, sık sorulanlar)
- Blog: kendi kurulum/ölçüm verisiyle yazılar (Google "özgün içerik" vurgusu)
