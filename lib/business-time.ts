/**
 * İşletme günü: raporlar, "Bugün" filtreleri ve muhasebe tarihleri Türkiye saatine (Europe/Istanbul) göre hesaplanır.
 * Sunucunun (Hostinger UTC), tarayıcının ve veri tabanının saat dilimi ne olursa olsun gün sınırı burada tanımlanır.
 * Türkiye 2016'dan beri yaz saati uygulamıyor; fark yine de Intl ile o anki tarih için hesaplanır.
 */

export const BUSINESS_TIME_ZONE = 'Europe/Istanbul'

const DAY_MS = 86_400_000

const partsFmt = new Intl.DateTimeFormat('en-CA', {
  timeZone: BUSINESS_TIME_ZONE,
  year: 'numeric',
  month: '2-digit',
  day: '2-digit',
  hour: '2-digit',
  minute: '2-digit',
  second: '2-digit',
  hourCycle: 'h23',
})

function zonedParts(d: Date) {
  const p = Object.fromEntries(partsFmt.formatToParts(d).map((x) => [x.type, x.value]))
  return { y: Number(p.year), m: Number(p.month), d: Number(p.day), h: Number(p.hour), min: Number(p.minute), s: Number(p.second) }
}

/** İstanbul saatinin UTC'den farkı (ms), verilen an için */
function offsetMs(d: Date): number {
  const p = zonedParts(d)
  const asUtc = Date.UTC(p.y, p.m - 1, p.d, p.h, p.min, p.s)
  return asUtc - Math.floor(d.getTime() / 1000) * 1000
}

/** Anın İstanbul takvim günü: YYYY-MM-DD */
export function businessDateKey(d: Date = new Date()): string {
  const p = zonedParts(d)
  return `${p.y}-${String(p.m).padStart(2, '0')}-${String(p.d).padStart(2, '0')}`
}

/** YYYY-MM-DD İstanbul gününün başlangıç anı (00:00:00.000 İstanbul) */
export function businessDayStartOf(key: string): Date {
  const [y, m, d] = key.split('-').map(Number)
  const guess = Date.UTC(y, m - 1, d)
  return new Date(guess - offsetMs(new Date(guess)))
}

/** Anın içinde bulunduğu İstanbul gününün başlangıcı */
export function businessDayStart(d: Date = new Date()): Date {
  return businessDayStartOf(businessDateKey(d))
}

/** Anın içinde bulunduğu İstanbul ayının ilk günü 00:00 */
export function businessMonthStart(d: Date = new Date()): Date {
  return businessDayStartOf(`${businessDateKey(d).slice(0, 8)}01`)
}

/** YYYY-MM-DD gününe n gün ekler (takvim günü; saat farkından etkilenmez) */
export function addDaysToKey(key: string, n: number): string {
  const [y, m, d] = key.split('-').map(Number)
  return new Date(Date.UTC(y, m - 1, d) + n * DAY_MS).toISOString().slice(0, 10)
}

/**
 * Son `days` İstanbul günü (bugün dahil): ilk günün başlangıcı ve gün anahtarları.
 * Örn. days=1 → yalnız bugün; days=30 → bugün ve önceki 29 gün.
 */
export function businessDayRange(days: number, now: Date = new Date()): { start: Date; keys: string[] } {
  const today = businessDateKey(now)
  const keys = Array.from({ length: days }, (_, i) => addDaysToKey(today, i - (days - 1)))
  return { start: businessDayStartOf(keys[0]), keys }
}

/** YYYY-MM-DD biçimi ve gerçek bir takvim günü mü */
export function isDateKey(s: string | null | undefined): s is string {
  if (!s || !/^\d{4}-\d{2}-\d{2}$/.test(s)) return false
  return new Date(`${s}T00:00:00Z`).toISOString().slice(0, 10) === s
}

/** Tarih-saat kutusu (datetime-local) için ISO anı → İstanbul yerel "YYYY-MM-DDTHH:mm" */
export function toBusinessDateTimeInput(iso: string | Date | null | undefined): string {
  if (!iso) return ''
  const d = new Date(iso)
  if (isNaN(d.getTime())) return ''
  return new Date(d.getTime() + offsetMs(d)).toISOString().slice(0, 16)
}

/** Tarih-saat kutusundaki "YYYY-MM-DDTHH:mm" değeri İstanbul saati kabul edilerek ana çevrilir */
export function fromBusinessDateTimeInput(value: string | null | undefined): Date | null {
  const m = String(value ?? '').match(/^(\d{4}-\d{2}-\d{2})T(\d{2}):(\d{2})/)
  if (!m) return null
  const start = businessDayStartOf(m[1])
  return new Date(start.getTime() + (Number(m[2]) * 60 + Number(m[3])) * 60_000)
}
