/**
 * Ürün HTML açıklamaları (lib/catalog/descriptions.json, ~3 MB).
 * Yalnızca sunucu tarafında import edilmeli; istemci bileşenleri açıklamayı ürün API'si / sayfa props'u ile alır.
 */

import descriptions from '@/lib/catalog/descriptions.json'

const map = descriptions as Record<string, string>

export function getProductDescriptionHtml(productId: string): string | undefined {
  return map[productId] || undefined
}
