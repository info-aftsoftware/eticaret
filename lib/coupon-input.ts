/**
 * Yönetim paneli kupon formu doğrulaması (oluşturma ve güncelleme ortak).
 */
import { normalizeCouponCode } from '@/lib/order-pricing'
import { dateRangeError, discountValueError } from '@/lib/campaign-rules'

export type CouponInput = {
  code: string
  description: string | null
  type: 'PERCENT' | 'FIXED'
  value: number
  minAmount: number | null
  maxDiscount: number | null
  usageLimit: number | null
  startDate: Date | null
  endDate: Date | null
  active: boolean
}

const optNum = (v: unknown) => (v === null || v === undefined || v === '' ? null : Number(v))
const optDate = (v: unknown) => (v ? new Date(String(v)) : null)

export function parseCouponInput(body: Record<string, unknown>): { data: CouponInput } | { error: string } {
  const code = normalizeCouponCode(String(body.code ?? ''))
  if (!/^[A-Z0-9_-]{3,32}$/.test(code)) return { error: 'Kupon kodu 3–32 karakter olmalı; yalnızca harf, rakam, - ve _ kullanılabilir.' }
  // Kampanyayla ortak değer kuralı (lib/campaign-rules: yüzde en fazla %99, sabit > 0)
  const valueError = discountValueError(body.type, body.value)
  if (valueError) return { error: valueError }
  const type = body.type as 'PERCENT' | 'FIXED'
  const value = Number(body.value)
  const minAmount = optNum(body.minAmount)
  const maxDiscount = optNum(body.maxDiscount)
  const usageLimit = optNum(body.usageLimit)
  for (const [label, n] of [['En az sepet tutarı', minAmount], ['En fazla indirim', maxDiscount], ['Kullanım sınırı', usageLimit]] as const) {
    if (n !== null && (!Number.isFinite(n) || n < 0)) return { error: `${label} geçersiz.` }
  }
  const startDate = optDate(body.startDate)
  const endDate = optDate(body.endDate)
  if ((startDate && isNaN(startDate.getTime())) || (endDate && isNaN(endDate.getTime()))) return { error: 'Tarih geçersiz.' }
  const rangeError = dateRangeError(startDate, endDate)
  if (rangeError) return { error: rangeError }
  if (usageLimit !== null && usageLimit < 1) return { error: 'Kullanım sınırı en az 1 olmalı (sınırsız için boş bırakın).' }
  return {
    data: {
      code,
      description: typeof body.description === 'string' && body.description.trim() ? body.description.trim().slice(0, 200) : null,
      type,
      value,
      minAmount,
      maxDiscount: type === 'PERCENT' ? maxDiscount : null,
      usageLimit: usageLimit === null ? null : Math.floor(usageLimit),
      startDate,
      endDate,
      active: body.active !== false,
    },
  }
}
