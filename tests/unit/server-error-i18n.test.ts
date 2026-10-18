import { test } from 'node:test'
import assert from 'node:assert/strict'
import { localizeServerError } from '../../lib/server-error-i18n'

test('Türkçe arayüzde mesaj olduğu gibi döner', () => {
  assert.equal(localizeServerError('Sepet boş.', 'tr'), 'Sepet boş.')
})

test('İngilizcede bilinen mesaj çevrilir', () => {
  assert.equal(localizeServerError('Sepet boş.', 'en'), 'Your cart is empty.')
  assert.equal(localizeServerError('E-posta adresi veya şifre hatalı.', 'en'), 'Incorrect email address or password.')
})

test('değişkenli mesajlarda ürün adı ve sayı korunur', () => {
  assert.equal(
    localizeServerError('"Victron Phoenix 24/250" için stokta yalnızca 2 adet var.', 'en'),
    'Only 2 of "Victron Phoenix 24/250" are in stock.',
  )
  assert.match(localizeServerError('Ödemesi bekleyen 3 siparişiniz var. Yeni sipariş vermeden önce mevcut siparişlerinizin ödemesini tamamlayın veya iptal edin.', 'en')!, /^You have 3 orders awaiting payment/)
  assert.equal(localizeServerError('Google ile giriş yapılamadı. Lütfen tekrar deneyin.', 'en'), 'Sign-in with Google failed. Please try again.')
})

test('karşılığı olmayan Türkçe mesaj İngilizcede gösterilmez; İngilizce mesaj geçer', () => {
  assert.equal(localizeServerError('Bilinmeyen bir sunucu hatası oluştu.', 'en'), undefined)
  assert.equal(localizeServerError('Rate limited', 'en'), 'Rate limited')
  assert.equal(localizeServerError(undefined, 'en'), undefined)
  assert.equal(localizeServerError(42, 'tr'), undefined)
})
