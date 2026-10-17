/**
 * Üyelik e-posta uçları için ortak yardımcılar (route değil; "_" ile başlayan dosya yönlendirilmez).
 */
import type { NextRequest } from 'next/server'
import type { DecodedIdToken } from 'firebase-admin/auth'
import { getAdminAuth } from '@/lib/firebaseAdminServer'

/**
 * E-postadaki bağlantıların kökü. Sitenin kendi adresi (env); geliştirmede istek localhost'tan geliyorsa o.
 * İstekteki Origin/Host'a koşulsuz güvenilmez (başka alan adına bağlantı içeren e-posta gönderilmesin).
 */
export function siteOrigin(request: NextRequest): string {
  const configured = (process.env.NEXT_PUBLIC_SITE_URL || process.env.NEXT_PUBLIC_BASE_URL || 'https://voltekno.com').replace(/\/$/, '')
  const origin = request.headers.get('origin')
  if (!origin) return configured
  try {
    const o = new URL(origin)
    const c = new URL(configured)
    const bare = (h: string) => h.replace(/^www\./, '')
    if (bare(o.hostname) === bare(c.hostname)) return o.origin
    const isLocal = o.hostname === 'localhost' || o.hostname === '127.0.0.1'
    if (isLocal && process.env.NODE_ENV !== 'production') return o.origin
  } catch {
    // geçersiz Origin → yapılandırılmış adres
  }
  return configured
}

/** Bearer Firebase ID token'ını doğrular. */
export async function verifyBearer(request: NextRequest): Promise<DecodedIdToken | null> {
  const auth = getAdminAuth()
  const token = request.headers.get('authorization')?.replace(/^Bearer\s+/, '')
  if (!auth || !token) return null
  try {
    return await auth.verifyIdToken(token)
  } catch {
    return null
  }
}

/** Firebase e-posta işlem bağlantısından oobCode'u çıkarır (bağlantıyı kendi sayfamıza yönlendirmek için). */
export function oobCodeFromLink(link: string): string | null {
  try {
    return new URL(link).searchParams.get('oobCode')
  } catch {
    return null
  }
}

/** Kullanıcı (uid/e-posta) başına basit bekleme süresi; sunucu yeniden başlarsa sıfırlanır. */
const lastSent = new Map<string, number>()
export function inCooldown(key: string, ms: number): boolean {
  const now = Date.now()
  if (lastSent.size > 5000) {
    lastSent.forEach((t, k) => { if (now - t > ms) lastSent.delete(k) })
  }
  const prev = lastSent.get(key)
  if (prev && now - prev < ms) return true
  lastSent.set(key, now)
  return false
}
export function clearCooldown(key: string): void {
  lastSent.delete(key)
}
