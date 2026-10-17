/**
 * Birim testleri: ödeme formu doğrulamaları (lib/checkout-validation) ve kargo takip linkleri.
 * Çalıştırma: npm run test:unit
 */
import { test } from 'node:test'
import assert from 'node:assert/strict'
import {
  isValidTckn,
  isValidVkn,
  normalizeTrPhone,
  formatTrPhone,
  isValidTrPhone,
  isValidPostalCode,
  validateBilling,
  clientIpFromHeaders,
} from '../../lib/checkout-validation'
import { getAllCarriers } from '../../lib/shipping/carriers'

test('TCKN sağlaması', () => {
  assert.equal(isValidTckn('10000000146'), true)
  assert.equal(isValidTckn('10000000147'), false)
  assert.equal(isValidTckn('01234567890'), false)
  assert.equal(isValidTckn('1234567890'), false)
  assert.equal(isValidTckn('11111111110'), true)
})

test('VKN 10 hane', () => {
  assert.equal(isValidVkn('1234567890'), true)
  assert.equal(isValidVkn('123456789'), false)
  assert.equal(isValidVkn('12345678901'), false)
})

test('telefon normalleştirme ve biçim', () => {
  assert.equal(normalizeTrPhone('+90 555 000 00 00'), '5550000000')
  assert.equal(normalizeTrPhone('0555 000 00 00'), '5550000000')
  assert.equal(normalizeTrPhone('555 000 00 00'), '5550000000')
  assert.equal(formatTrPhone('05550000000'), '555 000 00 00')
  assert.equal(formatTrPhone('+905550000000'), '555 000 00 00')
  assert.equal(isValidTrPhone('0212 000 00 00'), true)
  assert.equal(isValidTrPhone('555 000 00'), false)
  assert.equal(isValidTrPhone('1550000000'), false)
})

test('posta kodu', () => {
  assert.equal(isValidPostalCode('34000'), true)
  assert.equal(isValidPostalCode('81100'), true)
  assert.equal(isValidPostalCode('00100'), false)
  assert.equal(isValidPostalCode('99000'), false)
})

test('fatura doğrulaması', () => {
  assert.deepEqual(validateBilling({ billingType: 'individual' }), {})
  assert.ok(validateBilling({ billingType: 'individual', idNumber: '12345678901' }).idNumber)
  const e = validateBilling({ billingType: 'company', companyName: '', taxId: '123', taxOffice: '' })
  assert.ok(e.companyName && e.taxId && e.taxOffice)
  assert.deepEqual(validateBilling({ billingType: 'company', companyName: 'A Ltd', taxId: '1234567890', taxOffice: 'Kadıköy' }), {})
})

test('istemci IP ayrıştırma', () => {
  const h = (o: Record<string, string>) => ({ get: (k: string) => o[k] ?? null })
  assert.equal(clientIpFromHeaders(h({ 'x-forwarded-for': '203.0.113.5, 10.0.0.1' })), '203.0.113.5')
  assert.equal(clientIpFromHeaders(h({ 'x-forwarded-for': ' 203.0.113.5:4431 ' })), '203.0.113.5')
  assert.equal(clientIpFromHeaders(h({ 'x-forwarded-for': '[2001:db8::1]:443' })), '2001:db8::1')
  assert.equal(clientIpFromHeaders(h({ 'x-forwarded-for': '<script>', 'x-real-ip': '198.51.100.7' })), '198.51.100.7')
  assert.equal(clientIpFromHeaders(h({})), null)
})

test('kargo takip linkleri numarayı kodlar', () => {
  for (const c of getAllCarriers()) {
    const url = c.trackingUrl('AB 12/34?x=1&y')
    assert.ok(url.startsWith('https://'), c.id)
    assert.ok(!url.includes('AB 12/34?x=1&y'), `${c.id} kodlanmamış: ${url}`)
  }
})
