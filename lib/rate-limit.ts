/**
 * Basit in-memory rate limit (IP veya identifier bazlı).
 * Sunucu yeniden başlayınca sıfırlanır; production için Redis vb. kullanılabilir.
 */

const store = new Map<string, { count: number; resetAt: number }>()

function getKey(identifier: string, prefix: string): string {
  return `${prefix}:${identifier}`
}

/**
 * İstemci kimliği. X-Forwarded-For'un İLK değeri istemci tarafından yazılabildiği için kullanılmaz:
 * 1) Platformun verdiği IP (NextRequest.ip), 2) vekil sunucunun yazdığı x-real-ip,
 * 3) X-Forwarded-For'un SON değeri (en yakın vekilin eklediği adres).
 */
export function getClientIp(request: Request): string {
  const platformIp = (request as Request & { ip?: string }).ip
  if (platformIp) return platformIp
  const realIp = request.headers.get('x-real-ip')
  if (realIp) return realIp.trim()
  const forwarded = request.headers.get('x-forwarded-for')
  if (forwarded) {
    const parts = forwarded.split(',').map((p) => p.trim()).filter(Boolean)
    if (parts.length) return parts[parts.length - 1]
  }
  return 'unknown'
}

/**
 * Rate limit kontrolü. Limit aşılırsa true döner (istek reddedilmeli).
 * @param request NextRequest veya Request
 * @param prefix Route adı (örn. 'contact', 'login')
 * @param maxRequests Dakika başına max istek
 * @param windowMs Pencere süresi (ms), varsayılan 60_000 (1 dk)
 */
export function isRateLimited(
  request: Request,
  prefix: string,
  maxRequests: number = 10,
  windowMs: number = 60_000
): boolean {
  const key = getKey(getClientIp(request), prefix)
  const now = Date.now()
  // Bellek büyümesini sınırla
  if (store.size > 10_000) cleanupRateLimitStore()
  const entry = store.get(key)

  if (!entry) {
    store.set(key, { count: 1, resetAt: now + windowMs })
    return false
  }

  if (now >= entry.resetAt) {
    store.set(key, { count: 1, resetAt: now + windowMs })
    return false
  }

  entry.count += 1
  if (entry.count > maxRequests) {
    return true
  }
  return false
}

/**
 * Periyodik temizlik (opsiyonel): süresi dolan anahtarları siler.
 */
export function cleanupRateLimitStore(): void {
  const now = Date.now()
  store.forEach((value, key) => {
    if (now >= value.resetAt) store.delete(key)
  })
}
