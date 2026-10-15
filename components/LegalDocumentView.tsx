import React from 'react'
import type { LegalDocument } from '@/lib/legal/documents'

/** Yasal metin gövdesi (başlık / paragraf / madde blokları). Sayfada ve pencerelerde kullanılır. */
export function LegalDocumentView({ doc, compact = false }: { doc: LegalDocument; compact?: boolean }) {
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
      {doc.updated && <p className="text-xs text-ink-muted/80">Son güncelleme: {doc.updated}</p>}
      {items}
    </div>
  )
}
