/**
 * Tahmini teslim tarihi — ürün sayfası JSON-LD'deki kargo kuralıyla aynı:
 * iş günü saat 15:00'e (Türkiye) kadar verilen sipariş aynı gün, sonrası ertesi iş günü kargoya verilir;
 * kargoda 1–3 iş günü. Hafta sonu iş günü sayılmaz (resmî tatiller dikkate alınmaz).
 */

export const SHIPPING_CUTOFF_HOUR = 15
export const TRANSIT_DAYS = { min: 1, max: 3 } as const

const TR_OFFSET_MS = 3 * 60 * 60 * 1000 // Türkiye UTC+3 (yaz saati uygulanmıyor)

/** Türkiye takvim günü (UTC tarih nesnesi olarak; saat 00:00) */
function trDay(date: Date): Date {
  const t = new Date(date.getTime() + TR_OFFSET_MS)
  return new Date(Date.UTC(t.getUTCFullYear(), t.getUTCMonth(), t.getUTCDate()))
}

const isBusinessDay = (d: Date) => d.getUTCDay() !== 0 && d.getUTCDay() !== 6

function addBusinessDays(d: Date, n: number): Date {
  const r = new Date(d)
  let left = n
  while (left > 0) {
    r.setUTCDate(r.getUTCDate() + 1)
    if (isBusinessDay(r)) left--
  }
  return r
}

export function estimateDelivery(now: Date = new Date()): { shipDate: Date; from: Date; to: Date } {
  const day = trDay(now)
  const trHour = new Date(now.getTime() + TR_OFFSET_MS).getUTCHours()
  let ship = day
  if (!isBusinessDay(ship) || trHour >= SHIPPING_CUTOFF_HOUR) ship = addBusinessDays(ship, 1)
  return { shipDate: ship, from: addBusinessDays(ship, TRANSIT_DAYS.min), to: addBusinessDays(ship, TRANSIT_DAYS.max) }
}

/** "17–20 Ekim" / "30 Ekim – 2 Kasım"; İngilizcede "October 17–20" / "October 30 – November 2" */
export function formatDeliveryRange(from: Date, to: Date, locale: 'tr' | 'en' = 'tr'): string {
  const lang = locale === 'en' ? 'en-US' : 'tr-TR'
  const opts = { day: 'numeric', month: 'long', timeZone: 'UTC' } as const
  if (from.getUTCMonth() === to.getUTCMonth()) {
    return locale === 'en'
      ? `${from.toLocaleDateString(lang, opts)}–${to.getUTCDate()}`
      : `${from.getUTCDate()}–${to.toLocaleDateString(lang, opts)}`
  }
  return `${from.toLocaleDateString(lang, opts)} – ${to.toLocaleDateString(lang, opts)}`
}
