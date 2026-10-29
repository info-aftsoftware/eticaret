/**
 * CSV üretme / okuma (bağımlılıksız). Excel (Türkçe) uyumu: UTF-8 BOM, noktalı virgül ayırıcı, ondalık virgül.
 * Okurken ayırıcı (; , sekme) ilk satırdan tahmin edilir; tırnaklı alanlar ve alan içi satır sonları desteklenir.
 */

export type Cell = string | number | boolean | null | undefined | Date

function cellText(v: Cell): string {
  if (v === null || v === undefined) return ''
  if (v instanceof Date) return v.toISOString().replace('T', ' ').slice(0, 19)
  if (typeof v === 'number') return Number.isFinite(v) ? String(Math.round(v * 100) / 100).replace('.', ',') : ''
  if (typeof v === 'boolean') return v ? 'Evet' : 'Hayır'
  // Müşterinin yazdığı metin (ad, adres) Excel'de formül olarak çalışmasın: =, +, -, @, sekme, CR ile başlayan
  // hücreye kesme işareti eklenir (OWASP CSV injection); Excel değeri metin olarak gösterir
  return /^[=+\-@\t\r]/.test(v) ? `'${v}` : v
}

export function toCsv(headers: string[], rows: Cell[][]): string {
  const esc = (s: string) => (/[;"\r\n]/.test(s) ? `"${s.replace(/"/g, '""')}"` : s)
  const lines = [headers, ...rows.map((r) => r.map(cellText))].map((r) => r.map((c) => esc(String(c))).join(';'))
  return '﻿' + lines.join('\r\n') + '\r\n'
}

export function csvResponseHeaders(filename: string): Record<string, string> {
  return {
    'Content-Type': 'text/csv; charset=utf-8',
    'Content-Disposition': `attachment; filename="${filename}"`,
    'Cache-Control': 'no-store',
  }
}

export function parseCsv(text: string): string[][] {
  const src = text.replace(/^﻿/, '')
  const firstLine = src.split(/\r?\n/, 1)[0] ?? ''
  const counts = [';', ',', '\t'].map((d) => [d, firstLine.split(d).length - 1] as const)
  const delim = counts.sort((a, b) => b[1] - a[1])[0][1] > 0 ? counts[0][0] : ';'
  const rows: string[][] = []
  let row: string[] = []
  let cell = ''
  let quoted = false
  for (let i = 0; i < src.length; i++) {
    const ch = src[i]
    if (quoted) {
      if (ch === '"') {
        if (src[i + 1] === '"') {
          cell += '"'
          i++
        } else quoted = false
      } else cell += ch
    } else if (ch === '"' && cell === '') quoted = true
    else if (ch === delim) {
      row.push(cell)
      cell = ''
    } else if (ch === '\n' || ch === '\r') {
      if (ch === '\r' && src[i + 1] === '\n') i++
      row.push(cell)
      rows.push(row)
      row = []
      cell = ''
    } else cell += ch
  }
  if (cell !== '' || row.length) {
    row.push(cell)
    rows.push(row)
  }
  return rows.filter((r) => r.some((c) => c.trim() !== ''))
}

/** "1.234,56" / "1234.56" / "1234,5" / "₺1.234" → sayı; boş veya geçersizse null */
export function parseNumber(raw: string | undefined): number | null {
  if (raw === undefined) return null
  let s = raw.replace(/[₺\s]|TL/gi, '').trim()
  if (!s) return null
  if (s.includes(',') && s.includes('.')) s = s.lastIndexOf(',') > s.lastIndexOf('.') ? s.replace(/\./g, '').replace(',', '.') : s.replace(/,/g, '')
  else if (s.includes(',')) s = s.replace(',', '.')
  else if (/^\d{1,3}(\.\d{3})+$/.test(s)) s = s.replace(/\./g, '') // Türkçe binlik: 1.234 → 1234
  const n = Number(s)
  return Number.isFinite(n) ? n : null
}

/** Başlık eşleme: küçük harf, Türkçe karakter ve parantez içi yok sayılır ("Fiyat (KDV hariç)" → "fiyat") */
export const headerKey = (h: string) =>
  h
    .toLocaleLowerCase('tr')
    .replace(/\(.*?\)/g, '')
    .replace(/[çğıöşü]/g, (c) => ({ ç: 'c', ğ: 'g', ı: 'i', ö: 'o', ş: 's', ü: 'u' })[c]!)
    .replace(/[^a-z0-9]+/g, ' ')
    .trim()
