/**
 * Cloudflare Turnstile (bot koruması) — sunucu doğrulaması.
 * TURNSTILE_SECRET_KEY tanımlı değilse doğrulama atlanır (özellik kapalı); tanımlıysa token zorunludur.
 * İstemci bileşeni: components/Turnstile.tsx (NEXT_PUBLIC_TURNSTILE_SITE_KEY).
 */

export function isTurnstileEnabled(): boolean {
  return !!process.env.TURNSTILE_SECRET_KEY
}

export async function verifyTurnstile(token: unknown, ip?: string | null): Promise<boolean> {
  const secret = process.env.TURNSTILE_SECRET_KEY
  if (!secret) return true
  if (typeof token !== 'string' || !token) return false
  try {
    const form = new URLSearchParams({ secret, response: token })
    if (ip) form.set('remoteip', ip)
    const res = await fetch('https://challenges.cloudflare.com/turnstile/v0/siteverify', {
      method: 'POST',
      body: form,
      signal: AbortSignal.timeout(8000),
    })
    const data = (await res.json().catch(() => null)) as { success?: boolean } | null
    return data?.success === true
  } catch (e) {
    console.error('Turnstile verify error:', e)
    return false
  }
}

export const TURNSTILE_ERROR = 'Güvenlik doğrulaması başarısız. Sayfayı yenileyip tekrar deneyin.'
