/** Zamanlanmış görev uç noktaları için yetki: Authorization: Bearer <CRON_SECRET> (sabit zamanlı karşılaştırma). */
import crypto from 'crypto'
import type { NextRequest } from 'next/server'

export function isCronAuthorized(request: NextRequest): boolean {
  const secret = process.env.CRON_SECRET
  if (!secret) return false
  const given = request.headers.get('authorization')?.replace(/^Bearer\s+/, '') ?? ''
  const a = crypto.createHash('sha256').update(given).digest()
  const b = crypto.createHash('sha256').update(secret).digest()
  return crypto.timingSafeEqual(a, b)
}
