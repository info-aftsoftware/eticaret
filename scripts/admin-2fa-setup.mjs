/**
 * Admin iki adımlı doğrulama kurulumu: rastgele TOTP anahtarı üretir.
 *   node scripts/admin-2fa-setup.mjs
 * Çıktıdaki anahtarı sunucu ortamına ADMIN_TOTP_SECRET olarak girin ve otpauth bağlantısını
 * (veya anahtarı elle) Google/Microsoft Authenticator'a ekleyin. Değişken tanımlı değilse giriş yalnızca şifreyle yapılır.
 */
import crypto from 'crypto'

const ALPHABET = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ234567'
const bytes = crypto.randomBytes(20)
let bits = 0
let value = 0
let secret = ''
for (const b of bytes) {
  value = (value << 8) | b
  bits += 8
  while (bits >= 5) {
    secret += ALPHABET[(value >>> (bits - 5)) & 31]
    bits -= 5
  }
}
if (bits > 0) secret += ALPHABET[(value << (5 - bits)) & 31]

const label = encodeURIComponent('Voltekno Yönetim:admin')
console.log('ADMIN_TOTP_SECRET=' + secret)
console.log('otpauth://totp/' + label + '?secret=' + secret + '&issuer=Voltekno&algorithm=SHA1&digits=6&period=30')
