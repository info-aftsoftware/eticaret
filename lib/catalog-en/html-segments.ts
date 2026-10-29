/**
 * Ürün HTML açıklamalarını çeviri birimlerine (segment) ayırır ve çeviri belleğiyle yeniden kurar.
 * Segment: blok etiketleri (p, h2, h3, li, td, th, div, span…) arasındaki metin; satır içi etiketler
 * (strong, a, br…) segmentin parçasıdır, böylece cümle bağlamı korunur. SVG ikonları olduğu gibi kalır.
 * Çeviri belleği TR segment → EN segment eşlemesidir; bellekte olmayan segment Türkçe kalır
 * (scripts/catalog-en.ts check eksikleri raporlar).
 */

const INLINE_TAGS = new Set(['strong', 'b', 'em', 'i', 'a', 'br', 'sup', 'sub', 'u', 'small', 'code'])
const TOKEN_RE = /<svg[\s\S]*?<\/svg>|<!--[\s\S]*?-->|<\/?([a-zA-Z][a-zA-Z0-9]*)\b[^>]*>|[^<]+|</g
const LETTER_RE = /[A-Za-zÇĞİÖŞÜçğıöşüÂâÎîÛû]/

function hasLetters(segmentHtml: string): boolean {
  return LETTER_RE.test(segmentHtml.replace(/<[^>]*>/g, '').replace(/&[a-z]+;|&#\d+;/gi, ''))
}

/**
 * HTML'i tarar; her segment için `onSegment(çekirdek)` çağrılır, dönen değer segmentin yerine yazılır
 * (baştaki/sondaki boşluklar korunur). Segment olmayan kısımlar aynen kalır.
 */
export function mapHtmlSegments(html: string, onSegment: (core: string) => string): string {
  let out = ''
  let buf = ''
  const flush = () => {
    if (buf && hasLetters(buf)) {
      const lead = buf.match(/^\s*/)![0]
      const trail = buf.slice(lead.length).match(/\s*$/)![0]
      const core = buf.slice(lead.length, buf.length - trail.length)
      out += lead + onSegment(core) + trail
    } else {
      out += buf
    }
    buf = ''
  }
  TOKEN_RE.lastIndex = 0
  let m: RegExpExecArray | null
  while ((m = TOKEN_RE.exec(html))) {
    const token = m[0]
    if (token[0] !== '<' || token === '<') {
      buf += token
      continue
    }
    const tag = (m[1] || '').toLowerCase()
    if (tag && INLINE_TAGS.has(tag) && !token.startsWith('<svg')) {
      buf += token
      continue
    }
    flush()
    out += token
  }
  flush()
  return out
}

/** HTML'deki çevrilecek segmentler (sırayla, tekrarlar dahil) */
export function htmlSegments(html: string): string[] {
  const list: string[] = []
  mapHtmlSegments(html, (core) => {
    list.push(core)
    return core
  })
  return list
}

/** Segmentleri çeviri belleğinden değiştirir; bulunamayanlar `missing` dizisine eklenir (verilirse). */
export function translateHtml(html: string, memory: Record<string, string>, missing?: string[]): string {
  return mapHtmlSegments(html, (core) => {
    const en = memory[core]
    if (en != null) return en
    missing?.push(core)
    return core
  })
}

/** Segmentteki etiketler (sıra önemsiz karşılaştırma için): çeviride aynı satır içi etiketler korunmalı */
export function inlineTags(segmentHtml: string): string[] {
  return (segmentHtml.match(/<[^>]+>/g) || []).map((t) => t.replace(/\s+/g, ' ')).sort()
}
