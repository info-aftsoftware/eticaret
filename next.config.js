/** @type {import('next').NextConfig} */
const path = require('path')
const createNextIntlPlugin = require('next-intl/plugin')
const isProduction = process.env.NODE_ENV === 'production'
const isStaticExport = process.env.STATIC_EXPORT === 'true'

// Argümansız: plugin ./i18n/request.ts ve ./src/i18n/request.ts'yi otomatik arar (path çözümleme sorunlarını önler)
const withNextIntl = createNextIntlPlugin()

/**
 * Eski voltekno.com (ikas) ürün adresleri kökteydi (/<slug>); yeni sitede /products/<slug> (kontrol listesi 32–33).
 * Katalogdaki her ürünün kök adresi ürün sayfasına, satıştan kalkmış/yeniden adlanmış ürünlerin kök adresi
 * lib/legacy-product-redirects.json'daki hedefe kalıcı yönlendirilir. Uygulama sayfalarıyla çakışan slug yoktur (birim testli).
 */
function ikasRootRedirects(legacyMap) {
  const raw = require('./lib/catalog/products.json')
  const products = Array.isArray(raw) ? raw : raw.products
  const safe = (id) => /^[a-z0-9-]+$/.test(id)
  return products
    .map((p) => p.id)
    .filter(safe)
    .map((id) => ({ source: `/${id}`, destination: `/products/${id}`, permanent: true }))
    .concat(Object.entries(legacyMap).filter(([id]) => safe(id)).map(([id, destination]) => ({ source: `/${id}`, destination, permanent: true })))
}

const nextConfig = {
  images: {
    domains: ['firebasestorage.googleapis.com', 'images.unsplash.com', 'tommatech.de'],
    // Yerel/harici görsellerde 400 hatasını önlemek için optimizasyonu kapat (tüm ortamlarda)
    unoptimized: true,
    // Image optimization hatalarını önlemek için
    remotePatterns: [
      {
        protocol: 'https',
        hostname: '**',
      },
      {
        protocol: 'http',
        hostname: 'localhost',
      },
    ],
  },
  // Eski katalogdaki ürün adresleri → yeni ürün veya kategori (Google'da dizinli sayfalar 404 olmasın).
  // Listeler: lib/legacy-product-redirects.json, lib/seo/legacy-redirects.json. Static export'ta yönlendirme desteklenmez.
  ...(!isStaticExport && {
    async redirects() {
      const map = require('./lib/legacy-product-redirects.json')
      const seo = Object.entries(require('./lib/seo/legacy-redirects.json')).map(([source, destination]) => ({ source, destination, permanent: true }))
      const taken = new Set(seo.map((r) => r.source))
      return Object.entries(map)
        .filter(([id]) => /^[a-z0-9-]+$/.test(id))
        .map(([id, destination]) => ({ source: `/products/${id}`, destination, permanent: true }))
        // voltekno.com (ikas) adresleri: kökteki ürün/koleksiyon slug'ları → yeni ürün/kategori (alan adı geçişi, 1:1)
        .concat(seo)
        .concat(ikasRootRedirects(map).filter((r) => !taken.has(r.source)))
    },
  }),
  // Production optimizasyonları
  compress: true,
  poweredByHeader: false,
  reactStrictMode: true,
  typescript: {
    ignoreBuildErrors: false,
  },
  // Headers for CSP and security (ONLY in production)
  // Development'ta CSP tamamen devre dışı - browser extension'lar ve dev server ile uyumluluk için
  // CSP sadece production build'de aktif olacak
  ...(isProduction && !process.env.NEXT_PHASE?.includes('phase-development-server') && {
    async headers() {
      return [
        {
          source: '/:path*',
          headers: [
            {
              key: 'Content-Security-Policy',
              value: [
                "default-src 'self'",
                "script-src 'self' 'unsafe-inline' 'unsafe-eval' 'wasm-unsafe-eval' 'inline-speculation-rules' https://voltekno.com https://*.voltekno.com https://www.googletagmanager.com https://www.google-analytics.com https://www.google.com https://apis.google.com https://*.googleapis.com https://connect.facebook.net chrome-extension:",
                "script-src-elem 'self' 'unsafe-inline' 'unsafe-eval' 'wasm-unsafe-eval' 'inline-speculation-rules' https://voltekno.com https://*.voltekno.com https://www.googletagmanager.com https://www.google-analytics.com https://www.google.com https://apis.google.com https://*.googleapis.com https://connect.facebook.net chrome-extension:",
                "style-src 'self' 'unsafe-inline' https://fonts.googleapis.com",
                "img-src 'self' data: https: blob:",
                "font-src 'self' data: https://fonts.gstatic.com",
                "connect-src 'self' https: https://www.google-analytics.com https://www.googletagmanager.com https://*.google-analytics.com https://*.googleapis.com https://*.google.com",
                // Firebase Auth (Google ile giriş) sonucu authDomain iframe'i üzerinden alır
                "frame-src 'self' https://*.firebaseapp.com https://*.google.com https://www.youtube-nocookie.com https://www.youtube.com",
                "frame-ancestors 'self'",
                "base-uri 'self'",
                "object-src 'none'",
              ].join('; '),
            },
            { key: 'X-Content-Type-Options', value: 'nosniff' },
            { key: 'Referrer-Policy', value: 'strict-origin-when-cross-origin' },
            { key: 'X-Frame-Options', value: 'SAMEORIGIN' },
            { key: 'Strict-Transport-Security', value: 'max-age=31536000; includeSubDomains' },
            { key: 'Permissions-Policy', value: 'camera=(), microphone=(), geolocation=(), payment=(self)' },
          ],
        },
      ]
    },
  }),
  // Static export sadece production build için ve STATIC_EXPORT=true olduğunda
  ...(isStaticExport && {
    output: 'export',
    distDir: 'out',
    trailingSlash: true,
    // Static export için gerekli ayarlar
    skipTrailingSlashRedirect: true,
    // Asset prefix yok (root'ta serve edilecek)
  }),
  // Production'da standalone build (Hostinger için)
  ...(isProduction && !isStaticExport && {
    output: 'standalone',
  }),
  // Dev sunucusu çalışırken ayrı klasöre derleme denemesi için (ör. NEXT_DIST_DIR=.next-build)
  ...(process.env.NEXT_DIST_DIR && { distDir: process.env.NEXT_DIST_DIR }),
  serverExternalPackages: ['undici'],
  // Paylaşımlı hostingte işlem sayısı sınırlı: statik sayfa üretimi CPU başına alt işlem açınca
  // "spawn node EAGAIN" ile derleme düşüyor. NEXT_BUILD_CPUS ile artırılabilir (varsayılan 2).
  experimental: {
    cpus: Math.max(1, Number(process.env.NEXT_BUILD_CPUS) || 2),
  },
  // Üst klasörlerdeki başka lockfile'lar kök dizini yanlış seçtirmesin (standalone çıktı yolu)
  outputFileTracingRoot: __dirname,
  // pdfkit (@react-pdf/renderer) standart fontları '#standard-fonts/...' ile dinamik yükler; izleyici bunları görmez,
  // standalone çıktıya elle eklenmezse sunucuda sözleşme/fatura PDF'i "Cannot find module ... Helvetica.cjs" ile düşer.
  outputFileTracingIncludes: {
    '/**': ['./node_modules/pdfkit/js/standard-fonts/**', './node_modules/pdfkit/js/data/**'],
  },
  // Development'ta output belirtilmemeli (Next.js default kullanır)
  webpack: (config, { isServer }) => {
    // Client bundle'da undici kullanma; #target parse hatası veriyor. Tarayıcıda native fetch kullan.
    if (!isServer) {
      const undiciStub = path.join(__dirname, 'lib/undici-browser-stub.js').replace(/\\/g, '/')
      config.resolve.fallback = {
        ...config.resolve.fallback,
        undici: undiciStub,
      }
      config.resolve.alias = {
        ...config.resolve.alias,
        undici: undiciStub,
        'undici/lib/web/fetch/util': undiciStub,
        'undici/lib/web/fetch/util.js': undiciStub,
        'undici/lib/web/fetch/index': undiciStub,
        'undici/lib/web/fetch/index.js': undiciStub,
        'undici/lib/fetch/index': undiciStub,
        'undici/lib/fetch/index.js': undiciStub,
      }
      const webpack = require('webpack')
      config.plugins.push(
        new webpack.NormalModuleReplacementPlugin(/^undici$/, undiciStub),
        new webpack.NormalModuleReplacementPlugin(/^undici\//, undiciStub),
        new webpack.NormalModuleReplacementPlugin(/[\\/]undici[\\/]/, undiciStub)
      )
    }
    return config
  },
}

module.exports = withNextIntl(nextConfig)
