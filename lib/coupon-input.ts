/**
 * Yönetim paneli kupon formu doğrulaması (oluşturma ve güncelleme ortak).
 */
import { normalizeCouponCode } from '@/lib/order-pricing'

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
  const type = body.type === 'FIXED' ? 'FIXED' : body.type === 'PERCENT' ? 'PERCENT' : null
  if (!type) return { error: 'İndirim türü yüzde veya sabit tutar olmalı.' }
  const value = Number(body.value)
  if (!Number.isFinite(value) || value <= 0) return { error: 'İndirim değeri sıfırdan büyük olmalı.' }
  if (type === 'PERCENT' && value > 100) return { error: 'Yüzde indirim en fazla 100 olabilir.' }
  const minAmount = optNum(body.minAmount)
  const maxDiscount = optNum(body.maxDiscount)
  const usageLimit = optNum(body.usageLimit)
  for (const [label, n] of [['En az sepet tutarı', minAmount], ['En fazla indirim', maxDiscount], ['Kullanım sınırı', usageLimit]] as const) {
    if (n !== null && (!Number.isFinite(n) || n < 0)) return { error: `${label} geçersiz.` }
  }
  const startDate = optDate(body.startDate)
  const endDate = optDate(body.endDate)
  if ((startDate && isNaN(startDate.getTime())) || (endDate && isNaN(endDate.getTime()))) return { error: 'Tarih geçersiz.' }
  if (startDate && endDate && endDate < startDate) return { error: 'Bitiş tarihi başlangıçtan önce olamaz.' }
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
