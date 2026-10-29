'use client'

import React from 'react'
import Link from '@/lib/i18n/navigation'
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog'
import { Button } from '@/components/ui/button'
import { LegalDocumentView } from '@/components/LegalDocumentView'
import { getLegalDocument, legalHref, type LegalDocument, type LegalSlug } from '@/lib/legal/documents'
import { useLocale } from 'next-intl'
import { useL } from '@/lib/i18n-inline'

/** Yasal metni sayfadan ayrılmadan gösteren pencere (sepet, ödeme, kayıt formları). */
export function LegalDocumentDialog({ slug, onClose }: { slug: LegalSlug | null; onClose: () => void }) {
  const en = useLocale() === 'en'
  const L = useL()
  // İngilizce çeviri yalnızca İngilizce seçiliyse yüklenir (Türkçe sepet/ödeme paketine eklenmesin)
  const [enDocs, setEnDocs] = React.useState<typeof import('@/lib/legal/documents-en') | null>(null)
  React.useEffect(() => {
    if (en && slug && !enDocs) import('@/lib/legal/documents-en').then(setEnDocs).catch(() => {})
  }, [en, slug, enDocs])
  const enDoc: LegalDocument | null = en && slug && enDocs ? enDocs.getLegalDocumentEn(slug) : null
  const doc = slug ? enDoc ?? (en ? null : getLegalDocument(slug)) : null
  return (
    <Dialog open={!!doc} onOpenChange={(open) => { if (!open) onClose() }}>
      <DialogContent className="max-w-2xl max-h-[85vh] flex flex-col p-0 gap-0">
        <DialogHeader className="p-5 border-b border-slate-200">
          <DialogTitle className="text-lg">{doc?.title}</DialogTitle>
        </DialogHeader>
        <div className="p-5 overflow-y-auto flex-1">{doc && <LegalDocumentView doc={doc} compact notice={enDoc ? enDocs?.LEGAL_TRANSLATION_NOTICE : undefined} />}</div>
        <div className="p-4 border-t border-slate-200 flex flex-col sm:flex-row gap-2 justify-between">
          {slug && (
            <Link href={legalHref(slug)} target="_blank" className="text-sm text-brand hover:underline self-center">
              {L('Yeni sekmede aç', 'Open in new tab')}
            </Link>
          )}
          <Button onClick={onClose} className="sm:w-auto w-full">{L('Kapat', 'Close')}</Button>
        </div>
      </DialogContent>
    </Dialog>
  )
}

/** Metin içinde yasal belge bağlantısı: tıklanınca pencere açar. */
export function LegalLink({ slug, children, onOpen }: { slug: LegalSlug; children: React.ReactNode; onOpen: (slug: LegalSlug) => void }) {
  return (
    <button
      type="button"
      onClick={(e) => { e.preventDefault(); e.stopPropagation(); onOpen(slug) }}
      className="font-medium text-ink underline underline-offset-2 hover:text-brand text-left"
    >
      {children}
    </button>
  )
}
