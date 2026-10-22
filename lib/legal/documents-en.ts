/**
 * Yasal metinlerin İngilizce çevirisi (documents.en.json; documents.json ile aynı slug, tarih ve blok sırası).
 * Yalnızca sitede gösterim içindir: sözleşme PDF'i, onay kayıtları ve sipariş e-postası eki Türkçe metindir
 * ve bağlayıcı olan Türkçe sürümdür. documents.json değişince bu dosyadaki karşılığı da güncellenmelidir.
 */

import documentsEn from './documents.en.json'
import { LEGAL_SLUGS, type LegalDocument, type LegalSlug } from './documents'

const DOCS_EN = documentsEn as unknown as Record<LegalSlug, LegalDocument>

export function getLegalDocumentEn(slug: string): LegalDocument | null {
  return (LEGAL_SLUGS as readonly string[]).includes(slug) ? DOCS_EN[slug as LegalSlug] ?? null : null
}

export const LEGAL_TRANSLATION_NOTICE =
  'This English translation is provided for your convenience. The Turkish version is the legally binding text and prevails in case of any discrepancy.'
