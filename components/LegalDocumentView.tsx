import React from 'react'
import type { LegalDocument } from '@/lib/legal/documents'
import { useL } from '@/lib/i18n-inline'

/** "18.10.2026" → "October 18, 2026" */
function usDate(d: string): string {
  const m = d.match(/^(\d{2})\.(\d{2})\.(\d{4})$/)
  if (!m) return d
  return new Date(Date.UTC(+m[3], +m[2] - 1, +m[1])).toLocaleDateString('en-US', { month: 'long', day: 'numeric', year: 'numeric', timeZone: 'UTC' })
}

/** Yasal metin gövdesi (başlık / paragraf / madde blokları). Sayfada ve pencerelerde kullanılır. */
export function LegalDocumentView({ doc, compact = false, notice }: { doc: LegalDocument; compact?: boolean; notice?: string }) {
  const L = useL()
  const items: React.ReactNode[] = []
  let list: string[] = []
  const flush = () => {
    if (list.length) {
      items.push(
        <ul key={`ul-${items.length}`} className="list-disc pl-5 space-y-1">
          {list.map((x, i) => <li key={i}>{x}</li>)}
        </ul>
      )
      list = []
    }
  }
  doc.blocks.forEach((b, i) => {
    if (b.t === 'li') {
      list.push(b.x)
      return
    }
    flush()
    items.push(
      b.t === 'h'
        ? <h2 key={i} className={`font-semibold text-ink ${compact ? 'text-sm pt-2' : 'text-base md:text-lg pt-4'}`}>{b.x}</h2>
        : <p key={i}>{b.x}</p>
    )
  })
  flush()

  return (
    <div className={`text-ink-muted leading-relaxed space-y-3 ${compact ? 'text-xs' : 'text-sm md:text-[15px]'}`}>
      {doc.updated && <p className="text-xs text-ink-muted/80">{L('Son güncelleme', 'Last updated')}: {L(doc.updated, usDate(doc.updated))}</p>}
      {notice && <p className="rounded-md border border-palette bg-surface px-3 py-2 text-xs">{notice}</p>}
      {items}
    </div>
  )
}
