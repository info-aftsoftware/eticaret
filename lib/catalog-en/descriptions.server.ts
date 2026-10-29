/**
 * Ürün HTML açıklamalarının İngilizcesi (çeviri belleği lib/catalog/en/descriptions.json, ~1 MB).
 * Yalnızca sunucu tarafında import edilmeli (ürün sayfası, ürün API'si).
 * Bellekte olmayan segment Türkçe kalır ve `<span lang="tr">` ile işaretlenir.
 */

import memoryJson from '@/lib/catalog/en/descriptions.json'
import { mapHtmlSegments } from './html-segments'
import type { CatalogLocale } from './index'

const memory = memoryJson as Record<string, string>
const cache = new Map<string, string>()
const CACHE_MAX = 400

export function localizeDescriptionHtml(html: string | undefined, locale: CatalogLocale): string | undefined {
  if (!html || locale !== 'en') return html
  const hit = cache.get(html)
  if (hit != null) return hit
  const out = mapHtmlSegments(html, (core) => memory[core] ?? `<span lang="tr">${core}</span>`)
  if (cache.size >= CACHE_MAX) cache.delete(cache.keys().next().value as string)
  cache.set(html, out)
  return out
}
