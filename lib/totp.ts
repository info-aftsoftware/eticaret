/**
 * TOTP (RFC 6238) — admin girişinde iki adımlı doğrulama (Google Authenticator, Microsoft Authenticator vb.).
 * Gizli anahtar base32 (ADMIN_TOTP_SECRET). Kurulum: node scripts/admin-2fa-setup.mjs
 */

import crypto from 'crypto'

const BASE32 = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ234567'

export function base32Decode(input: string): Buffer {
  const clean = input.toUpperCase().replace(/[\s=-]/g, '')
  let bits = 0
  let value = 0
  const out: number[] = []
  for (const ch of clean) {
    const idx = BASE32.indexOf(ch)
    if (idx < 0) throw new Error('Geçersiz base32 karakteri')
    value = (value << 5) | idx
    bits += 5
    if (bits >= 8) {
      out.push((value >>> (bits - 8)) & 0xff)
      bits -= 8
    }
  }
  return Buffer.from(out)
}

/** Belirli bir zaman adımı için 6 haneli kod (HMAC-SHA1, 30 sn) */
export function totpCode(secret: Buffer, counter: number, digits = 6): string {
  const msg = Buffer.alloc(8)
  msg.writeBigUInt64BE(BigInt(counter))
  const hmac = crypto.createHmac('sha1', secret).update(msg).digest()
  const offset = hmac[hmac.length - 1] & 0x0f
  const bin = ((hmac[offset] & 0x7f) << 24) | (hmac[offset + 1] << 16) | (hmac[offset + 2] << 8) | hmac[offset + 3]
  return String(bin % 10 ** digits).padStart(digits, '0')
}

/**
 * Kodu doğrular; saat kayması için bir önceki/sonraki 30 sn'lik adım da kabul edilir.
 * Sabit zamanlı karşılaştırma kullanılır.
 */
export function verifyTotp(secretBase32: string, code: string, now = Date.now(), window = 1): boolean {
  const token = String(code ?? '').replace(/\s/g, '')
  if (!/^\d{6}$/.test(token)) return false
  let secret: Buffer
  try {
    secret = base32Decode(secretBase32)
  } catch {
    return false
  }
  if (secret.length < 10) return false
  const counter = Math.floor(now / 1000 / 30)
  let ok = false
  for (let w = -window; w <= window; w++) {
    const expected = totpCode(secret, counter + w)
    if (crypto.timingSafeEqual(Buffer.from(expected), Buffer.from(token))) ok = true
  }
  return ok
}
