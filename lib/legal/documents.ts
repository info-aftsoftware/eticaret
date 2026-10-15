/**
 * Yasal metinler (voltekno.com/pages/* ile aynı içerik ve aynı adresler).
 * İçerik documents.json'da: { [slug]: { title, updated, blocks: [{ t: 'h' | 'p' | 'li', x }] } }
 * Metni güncellemek için documents.json düzenlenir; sayfalar, sepet/ödeme pencereleri ve sözleşme PDF'i buradan okur.
 */

import documents from './documents.json'

export type LegalBlock = { t: 'h' | 'p' | 'li'; x: string }
export type LegalDocument = { title: string; updated: string | null; blocks: LegalBlock[] }

export const LEGAL_SLUGS = [
  'mesafeli-satis-sozlesmesi',
  'on-bilgilendirme-formu',
  'iade-ve-cayma-kosullari',
  'gizlilik-ve-cerez-politikasi',
  'kvkk',
  'acik-riza-metni',
  'ticari-elektronik-ileti-onayi',
  'uyelik-ve-kullanim-kosullari',
] as const

export type LegalSlug = (typeof LEGAL_SLUGS)[number]

const DOCS = documents as unknown as Record<LegalSlug, LegalDocument>

export function getLegalDocument(slug: string): LegalDocument | null {
  return (LEGAL_SLUGS as readonly string[]).includes(slug) ? DOCS[slug as LegalSlug] : null
}

export const legalHref = (slug: LegalSlug) => `/pages/${slug}`
