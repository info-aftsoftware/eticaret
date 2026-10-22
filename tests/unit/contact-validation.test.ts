import { test } from 'node:test'
import assert from 'node:assert/strict'
import { isValidEmail, isValidTrPhone } from '../../lib/checkout-validation'

test('telefon: 11 hane (0 ile), 10 hane, +90; cep veya sabit hat', () => {
  for (const ok of ['0532 123 45 67', '05321234567', '5321234567', '+90 532 123 45 67', '(0212) 555 44 33', '0 (532) 123-45-67']) {
    assert.equal(isValidTrPhone(ok), true, ok)
  }
  for (const bad of ['', '0532 123 45 6', '053212345678', '1532123456', '0632 123 45 67', '532123456a', '+1 532 123 45 67', '12345', '00532 123 45 67']) {
    assert.equal(isValidTrPhone(bad), false, bad)
  }
})

test('e-posta: ad@alan.uzantı', () => {
  for (const ok of ['ad@ornek.com', 'ali.veli+x@sub.ornek.com.tr', ' info@voltekno.com ']) assert.equal(isValidEmail(ok), true, ok)
  for (const bad of ['', 'a@b.c', 'ad@ornek', 'adornek.com', 'ad..x@ornek.com', '.ad@ornek.com', 'ad@-ornek.com', 'ad @ornek.com', 'ad@@ornek.com', 'şule@ornek.com']) {
    assert.equal(isValidEmail(bad), false, bad)
  }
})
