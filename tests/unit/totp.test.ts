import { test } from 'node:test'
import assert from 'node:assert/strict'
import { base32Decode, totpCode, verifyTotp } from '../../lib/totp'

// RFC 6238 Ek B test vektörü (SHA1, anahtar "12345678901234567890"); 8 hanenin son 6 hanesi
const SECRET_ASCII = Buffer.from('12345678901234567890')
const SECRET_B32 = 'GEZDGNBVGY3TQOJQGEZDGNBVGY3TQOJQ'

test('base32 çözümü RFC anahtarını verir', () => {
  assert.deepEqual(base32Decode(SECRET_B32), SECRET_ASCII)
})

test('RFC 6238 test vektörleri', () => {
  assert.equal(totpCode(SECRET_ASCII, Math.floor(59 / 30), 8), '94287082')
  assert.equal(totpCode(SECRET_ASCII, Math.floor(1111111109 / 30), 8), '07081804')
  assert.equal(totpCode(SECRET_ASCII, Math.floor(2000000000 / 30), 8), '69279037')
})

test('doğru kod kabul, yanlış/biçimsiz kod ret; ±30 sn tolerans', () => {
  const now = 1111111109 * 1000
  const code = totpCode(SECRET_ASCII, Math.floor(1111111109 / 30))
  assert.equal(verifyTotp(SECRET_B32, code, now), true)
  assert.equal(verifyTotp(SECRET_B32, code, now + 30_000), true)
  assert.equal(verifyTotp(SECRET_B32, code, now + 120_000), false)
  assert.equal(verifyTotp(SECRET_B32, '000000', now), false)
  assert.equal(verifyTotp(SECRET_B32, '12ab56', now), false)
  assert.equal(verifyTotp('geçersiz!', code, now), false)
})
