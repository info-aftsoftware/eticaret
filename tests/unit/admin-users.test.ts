import { test } from 'node:test'
import assert from 'node:assert/strict'
import {
  canAccess,
  hashPassword,
  verifyPassword,
  passwordProblem,
  temporaryPassword,
  newTotpSecret,
  base32Encode,
  otpauthUrl,
  ADMIN_PAGE_API,
} from '../../lib/admin-users'
import { base32Decode, totpCode, verifyTotp } from '../../lib/totp'

test('roller: kullanıcı yönetimi yalnızca Sahip', () => {
  assert.equal(canAccess('owner', '/api/admin/users', 'GET'), true)
  assert.equal(canAccess('owner', '/api/admin/users/abc', 'PATCH'), true)
  for (const r of ['manager', 'operator', 'editor'] as const) {
    assert.equal(canAccess(r, '/api/admin/users', 'GET'), false, r)
    assert.equal(canAccess(r, '/api/admin/users/abc', 'PATCH'), false, r)
  }
})

test('roller: operatör sipariş yönetir, katalog değiştiremez; editör tersi', () => {
  assert.equal(canAccess('operator', '/api/admin/orders/ord_1', 'PATCH'), true)
  assert.equal(canAccess('operator', '/api/admin/catalog/p1', 'PATCH'), false)
  assert.equal(canAccess('operator', '/api/admin/catalog', 'GET'), true)
  assert.equal(canAccess('editor', '/api/admin/catalog/p1', 'PATCH'), true)
  assert.equal(canAccess('editor', '/api/admin/stok', 'POST'), true)
  assert.equal(canAccess('editor', '/api/admin/orders', 'GET'), false)
  assert.equal(canAccess('editor', '/api/admin/customers', 'GET'), false)
})

test('roller: tanımsız yol yalnızca Sahip ve Yönetici; önek tam yol parçasıyla eşleşir', () => {
  assert.equal(canAccess('manager', '/api/admin/yeni-ozellik', 'POST'), true)
  assert.equal(canAccess('operator', '/api/admin/yeni-ozellik', 'GET'), false)
  // /api/admin/ordersx, /api/admin/orders kuralına girmemeli
  assert.equal(canAccess('operator', '/api/admin/ordersx', 'GET'), false)
})

test('her rol kendi hesap ve oturum uçlarına erişir; menü sayfalarının hepsi bir kurala bağlı', () => {
  for (const r of ['owner', 'manager', 'operator', 'editor'] as const) {
    assert.equal(canAccess(r, '/api/admin/me', 'GET'), true)
    assert.equal(canAccess(r, '/api/admin/account', 'POST'), true)
    assert.equal(canAccess(r, '/api/admin/account/2fa', 'PUT'), true)
  }
  assert.ok(Object.keys(ADMIN_PAGE_API).includes('/admin/kullanicilar'))
})

test('şifre özeti: doğru şifre geçer, yanlış ve bozuk özet geçmez, her özet farklı tuzlu', () => {
  const h = hashPassword('Voltekno2026!')
  assert.ok(verifyPassword('Voltekno2026!', h))
  assert.equal(verifyPassword('voltekno2026!', h), false)
  assert.equal(verifyPassword('x', 'bozuk'), false)
  assert.notEqual(hashPassword('Voltekno2026!'), h)
})

test('şifre kuralı ve geçici şifre', () => {
  assert.ok(passwordProblem('kisa1'))
  assert.ok(passwordProblem('sadeceharfler'))
  assert.equal(passwordProblem('guclu-sifre-2026'), null)
  for (let i = 0; i < 20; i++) assert.equal(passwordProblem(temporaryPassword()), null)
})

test('TOTP anahtarı: base32 gidiş-dönüş ve üretilen kod doğrulanır', () => {
  const buf = Buffer.from('12345678901234567890')
  assert.equal(base32Encode(buf), 'GEZDGNBVGY3TQOJQGEZDGNBVGY3TQOJQ')
  assert.deepEqual(base32Decode(base32Encode(buf)), buf)
  const secret = newTotpSecret()
  const now = Date.now()
  const code = totpCode(base32Decode(secret), Math.floor(now / 30_000))
  assert.ok(verifyTotp(secret, code, now))
  assert.match(otpauthUrl(secret, 'ad@voltekno.com'), /^otpauth:\/\/totp\/.+secret=[A-Z2-7]+&issuer=/)
})
