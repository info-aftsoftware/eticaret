import Link from '@/lib/i18n/navigation'
import { notFound } from 'next/navigation'
import { ChevronRight } from 'lucide-react'
import { getLegalDocument, LEGAL_SLUGS, legalHref, type LegalSlug } from '@/lib/legal/documents'
import { SELLER } from '@/lib/legal/company'
import { LegalDocumentView } from '@/components/LegalDocumentView'
import { useL } from '@/lib/i18n-inline'
import { getLegalDocumentEn, LEGAL_TRANSLATION_NOTICE } from '@/lib/legal/documents-en'
import { localizedMetadata } from '@/lib/locale-metadata'
import { useLocale } from 'next-intl'
import type { Metadata } from 'next'

/** Yasal metin sayfası: /pages/[slug] ve eski adresler (/terms, /privacy, /cookies, /returns) bunu kullanır. */
export function LegalPage({ slug }: { slug: LegalSlug }) {
  const en = useLocale() === 'en'
  // İngilizce seçiliyse çeviri gösterilir; bağlayıcı olan Türkçe metin (bkz. lib/legal/documents-en.ts)
  const docFor = (s: LegalSlug) => (en && getLegalDocumentEn(s)) || getLegalDocument(s)
  const doc = docFor(slug)
  if (!doc) notFound()
  const L = useL()

  return (
    <div className="min-h-screen bg-surface">
      <div className="bg-surface-elevated border-b border-palette">
        <div className="container mx-auto max-w-7xl px-4 sm:px-6 lg:px-8 py-4">
          <nav className="flex items-center gap-2 text-xs font-medium text-ink-muted mb-2" aria-label="Breadcrumb">
            <Link href="/" className="hover:text-brand transition-colors">{L('Ana Sayfa', 'Home')}</Link>
            <ChevronRight className="w-3.5 h-3.5 text-ink-muted" aria-hidden />
            <span className="text-ink font-semibold">{doc.title}</span>
          </nav>
          <h1 className="text-2xl md:text-3xl font-bold text-ink uppercase tracking-tight">{doc.title}</h1>
          <p className="mt-1 text-sm text-ink-muted">{SELLER.legalName}</p>
        </div>
      </div>

      <div className="container mx-auto max-w-7xl px-4 sm:px-6 lg:px-8 py-6 md:py-8">
        <div className="max-w-4xl mx-auto grid gap-6 lg:grid-cols-[1fr_220px]">
          <article className="bg-surface-elevated rounded-lg border border-palette shadow-sm p-6 md:p-10 min-w-0">
            <LegalDocumentView doc={doc} notice={en && doc !== getLegalDocument(slug) ? LEGAL_TRANSLATION_NOTICE : undefined} />
          </article>
          <nav aria-label={L('Diğer yasal metinler', 'Other legal documents')} className="lg:sticky lg:top-4 self-start bg-surface-elevated rounded-lg border border-palette p-4">
            <p className="text-xs font-semibold uppercase tracking-wide text-ink-muted mb-2">{L('Yasal metinler', 'Legal documents')}</p>
            <ul className="space-y-1 text-sm">
              {LEGAL_SLUGS.map((s) => (
                <li key={s}>
                  <Link
                    href={legalHref(s)}
                    aria-current={s === slug ? 'page' : undefined}
                    className={s === slug ? 'text-brand font-semibold' : 'text-ink-muted hover:text-brand'}
                  >
                    {docFor(s)!.title}
                  </Link>
                </li>
              ))}
            </ul>
          </nav>
        </div>
      </div>
    </div>
  )
}

export function legalMetadata(slug: LegalSlug): Promise<Metadata> {
  const doc = getLegalDocument(slug)!
  const en = getLegalDocumentEn(slug)
  const tr: Metadata = {
    title: doc.title,
    description: `${doc.title} — ${SELLER.legalName} (Voltekno).`,
    alternates: { canonical: legalHref(slug) },
  }
  return en ? localizedMetadata(tr, { title: en.title, description: `${en.title} — ${SELLER.legalName} (Voltekno).` }) : Promise.resolve(tr)
}
