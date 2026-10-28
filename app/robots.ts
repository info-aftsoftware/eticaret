import type { MetadataRoute } from 'next'

const SITE_URL = process.env.NEXT_PUBLIC_SITE_URL || process.env.NEXT_PUBLIC_BASE_URL || 'https://voltekno.com'

/** Test/geçici alan adlarında (NEXT_PUBLIC_NOINDEX=true) tüm site arama motorlarına kapatılır */
const NOINDEX = process.env.NEXT_PUBLIC_NOINDEX === 'true'

/**
 * Yapay zekâ botları: tek "*" kuralı hepsine (Googlebot, Bingbot, OAI-SearchBot/GPTBot, PerplexityBot, Claude-SearchBot/ClaudeBot,
 * Applebot, Google-Extended) aynı izni verir. Arama botlarını engellemek o motorda görünmemek demektir; eğitim botları
 * (GPTBot, ClaudeBot, Google-Extended, Applebot-Extended, CCBot) ayrı bir iş kararıdır — engellemek istenirse buraya ayrı
 * kural eklenir ve o kurala /admin, /api engelleri de yazılır (özel kural "*" kuralını devralmaz).
 */
export default function robots(): MetadataRoute.Robots {
  if (NOINDEX) return { rules: { userAgent: '*', disallow: '/' } }
  return {
    rules: {
      userAgent: '*',
      allow: '/',
      disallow: ['/admin', '/api', '/onizleme'],
    },
    sitemap: `${SITE_URL}/sitemap.xml`,
    host: SITE_URL,
  }
}
