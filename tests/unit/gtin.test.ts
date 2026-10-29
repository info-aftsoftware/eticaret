import { test } from 'node:test'
import assert from 'node:assert/strict'
import { firstValidGtin, gtinProblem, normalizeGtin } from '../../lib/gtin'

test('GTIN: geçerli EAN-13, UPC-A, EAN-8, GTIN-14 kabul; boşluk ve tire temizlenir', () => {
  assert.equal(normalizeGtin('4006381333931'), '4006381333931') // EAN-13
  assert.equal(normalizeGtin('869 0000 000 008'.replace(/ /g, '')), null) // kontrol basamağı yanlış örnek
  assert.equal(normalizeGtin('036000291452'), '036000291452') // UPC-A
  assert.equal(normalizeGtin('96385074'), '96385074') // EAN-8
  assert.equal(normalizeGtin('10012345678902'), '10012345678902') // GTIN-14
  assert.equal(normalizeGtin('4006-381 333931'), '4006381333931')
  assert.equal(normalizeGtin(4006381333931), '4006381333931')
})

test('GTIN: yanlış kontrol basamağı, uzunluk, harf, sıfırlar ve SKU reddedilir', () => {
  assert.equal(normalizeGtin('4006381333932'), null)
  assert.equal(normalizeGtin('123456789'), null)
  assert.equal(normalizeGtin('TOMMAT-TT600144'), null)
  assert.equal(normalizeGtin('0000000000000'), null)
  assert.equal(normalizeGtin(''), null)
  assert.equal(normalizeGtin(null), null)
})

test('GTIN: panel hata metni ve çok barkodlu hücre', () => {
  assert.equal(gtinProblem(''), null)
  assert.equal(gtinProblem('4006381333931'), null)
  assert.match(gtinProblem('ABC')!, /rakam/)
  assert.match(gtinProblem('12345')!, /8, 12, 13/)
  assert.match(gtinProblem('4006381333932')!, /kontrol basamağı/)
  assert.equal(firstValidGtin('4006381333932; 4006381333931'), '4006381333931')
  assert.equal(firstValidGtin(''), null)
})
