/** @type {import('next').NextConfig} */
const path = require('path')
const createNextIntlPlugin = require('next-intl/plugin')
const isProduction = process.env.NODE_ENV === 'production'
const isStaticExport = process.env.STATIC_EXPORT === 'true'

// Argümansız: plugin ./i18n/request.ts ve ./src/i18n/request.ts'yi otomatik arar (path çözümleme sorunlarını önler)
const withNextIntl = createNextIntlPlugin()

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
  // Liste: lib/legacy-product-redirects.json. Static export'ta yönlendirme desteklenmez.
  ...(!isStaticExport && {
    async redirects() {
      const map = require('./lib/legacy-product-redirects.json')
      return Object.entries(map)
        .filter(([id]) => /^[a-z0-9-]+$/.test(id))
        .map(([id, destination]) => ({ source: `/products/${id}`, destination, permanent: true }))
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
                "script-src 'self' 'unsafe-inline' 'unsafe-eval' 'wasm-unsafe-eval' 'inline-speculation-rules' https://voltekno.com https://*.voltekno.com https://www.googletagmanager.com https://www.google-analytics.com https://www.google.com https://*.googleapis.com https://connect.facebook.net chrome-extension:",
                "script-src-elem 'self' 'unsafe-inline' 'unsafe-eval' 'wasm-unsafe-eval' 'inline-speculation-rules' https://voltekno.com https://*.voltekno.com https://www.googletagmanager.com https://www.google-analytics.com https://www.google.com https://*.googleapis.com https://connect.facebook.net chrome-extension:",
                "style-src 'self' 'unsafe-inline' https://fonts.googleapis.com",
                "img-src 'self' data: https: blob:",
                "font-src 'self' data: https://fonts.gstatic.com",
                "connect-src 'self' https: https://www.google-analytics.com https://www.googletagmanager.com https://*.google-analytics.com https://*.googleapis.com https://*.google.com",
                "frame-ancestors 'self'",
              ].join('; '),
            },
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
  // Üst klasörlerdeki başka lockfile'lar kök dizini yanlış seçtirmesin (standalone çıktı yolu)
  outputFileTracingRoot: __dirname,
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
