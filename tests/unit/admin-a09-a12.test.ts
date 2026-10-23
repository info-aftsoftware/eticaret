/**
 * Yönetim paneli denetimi A09–A12 kapanış senaryoları (saf hesaplar).
 */
import { test } from 'node:test'
import assert from 'node:assert/strict'
import { diffFields, diffVariants, summarizeChanges } from '../../lib/audit-diff'
import { isSelfLogged } from '../../lib/adminAuth'
import { classifyEmailFailure, isTestRecipient } from '../../lib/email-diagnose'
import { jobOutcome } from '../../lib/scheduler-core'
import { masterLoginPolicy } from '../../lib/admin-2fa-policy'
import { base32Decode, totpCode, totpStep } from '../../lib/totp'

// ── A09: alan bazında işlem kaydı ────────────────────────────────────────

test('A09: fiyat 100→110, stok 5→4 ve sipariş notu değişikliği açıkça izlenir', () => {
  const c = diffFields({ price: 100, stock: 5, adminNote: null, name: 'Panel' }, { price: 110, stock: 4, adminNote: 'Müşteri aradı', name: 'Panel' }, { price: 'TL fiyat', stock: 'Stok', adminNote: 'Yönetici notu', name: 'Ad' })
  assert.deepEqual(c, [
    { field: 'price', label: 'TL fiyat', from: '100', to: '110' },
    { field: 'stock', label: 'Stok', from: '5', to: '4' },
    { field: 'adminNote', label: 'Yönetici notu', from: null, to: 'Müşteri aradı' },
  ])
  assert.equal(summarizeChanges(c), 'TL fiyat: 100 → 110 · Stok: 5 → 4 · Yönetici notu: — → Müşteri aradı')
})

test('A09: gizli anahtar ve parola alanları kayda yazılmaz; uzun değer kısaltılır', () => {
  const c = diffFields({ passwordHash: 'a', totpSecret: 'x', apiToken: '1', note: 'k' }, { passwordHash: 'b', totpSecret: 'y', apiToken: '2', note: 'x'.repeat(500) }, { passwordHash: 'Şifre', totpSecret: '2FA', apiToken: 'Token', note: 'Not' })
  assert.deepEqual(c.map((x) => x.field), ['note'])
  assert.ok((c[0].to ?? '').length <= 201)
})

test('A09: varyant ekleme, kaldırma ve fiyat değişikliği', () => {
  const c = diffVariants([{ key: 'a', label: '450Wp', price: 7000 }, { key: 'b', label: '600Wp', price: 10000 }], [{ key: 'a', label: '450Wp', price: 7100 }, { key: 'c', label: '700Wp', price: 12000 }])
  assert.deepEqual(c.map((x) => `${x.label}: ${x.from} → ${x.to}`), ['Varyant “450Wp” fiyatı (TL): 7000 → 7100', 'Varyant eklendi: null → 700Wp', 'Varyant kaldırıldı: 600Wp → null'])
})

test('A09: ürün/stok/sipariş düzenleme kendi kaydını yazar (genel "PATCH adres" satırı yok)', () => {
  assert.equal(isSelfLogged('PATCH', '/api/admin/catalog/urun-1'), true)
  assert.equal(isSelfLogged('PATCH', '/api/admin/catalog/bulk'), true)
  assert.equal(isSelfLogged('PATCH', '/api/admin/stock-overrides'), true)
  assert.equal(isSelfLogged('PATCH', '/api/admin/orders/abc'), true)
  assert.equal(isSelfLogged('POST', '/api/admin/catalog'), false)
  assert.equal(isSelfLogged('PATCH', '/api/admin/discounts/x'), false)
  assert.equal(isSelfLogged('POST', '/api/admin/orders/abc/send-invoice'), false)
})

// ── A10: e-posta hataları ────────────────────────────────────────────────

test('A10: test adresine gönderilmez; hata altyapı arızası sayılmaz', () => {
  assert.equal(isTestRecipient('deneme@example.com'), true)
  assert.equal(isTestRecipient('a@shop.test'), true)
  assert.equal(isTestRecipient('x@placeholder.local'), true)
  assert.equal(isTestRecipient('musteri@gmail.com'), false)
  const f = classifyEmailFailure('TEST_RECIPIENT', 'deneme@example.com')
  assert.equal(f.infrastructure, false)
  assert.equal(f.retryable, false)
})

test('A10: SMTP hataları nedeni ve yeniden denenebilirliğiyle', () => {
  assert.deepEqual(classifyEmailFailure('SMTP authentication failed', 'a@b.com'), { reason: 'SMTP kimlik doğrulaması başarısız (kullanıcı adı/şifre)', retryable: true, infrastructure: true })
  assert.equal(classifyEmailFailure('connect ECONNREFUSED 127.0.0.1:9', 'a@b.com').retryable, true)
  assert.equal(classifyEmailFailure('550 5.1.1 mailbox does not exist', 'a@b.com').retryable, false)
  assert.equal(classifyEmailFailure('Invalid email address', 'x').infrastructure, false)
})

// ── A11: görev durum etiketleri ──────────────────────────────────────────

test('A11: kapalı entegrasyon "Başarılı" görünmez; eski kayıtlar da doğru sınıflanır', () => {
  assert.equal(jobOutcome({ lastRunAt: 't', lastOk: false, outcome: 'disabled' }), 'disabled')
  assert.equal(jobOutcome({ lastRunAt: 't', lastOk: true, lastSummary: 'kapalı (Geliver yapılandırılmamış)' }), 'disabled')
  assert.equal(jobOutcome({ lastRunAt: 't', lastOk: true, lastSummary: 'atlandı: SQLite değil' }), 'skipped')
  assert.equal(jobOutcome({ lastRunAt: 't', lastOk: true, outcome: 'idle' }), 'idle')
  assert.equal(jobOutcome({ lastRunAt: 't', lastOk: false, lastError: 'x' }), 'error')
  assert.equal(jobOutcome(undefined), null)
})

// ── A12: iki adımlı doğrulama ────────────────────────────────────────────

test('A12: ana şifre, 2FA\'lı Sahip hesabı varken tek başına giriş açmaz', () => {
  assert.equal(masterLoginPolicy({ mode: undefined, hasMasterTotp: false, ownersWith2fa: 0 }).allowed, true)
  assert.equal(masterLoginPolicy({ mode: undefined, hasMasterTotp: false, ownersWith2fa: 1 }).allowed, false)
  assert.equal(masterLoginPolicy({ mode: undefined, hasMasterTotp: true, ownersWith2fa: 1 }).allowed, true)
  assert.equal(masterLoginPolicy({ mode: 'off', hasMasterTotp: true, ownersWith2fa: 0 }).allowed, false)
  assert.equal(masterLoginPolicy({ mode: 'allow', hasMasterTotp: false, ownersWith2fa: 2 }).allowed, true)
})

test('A12: yanlış ve tekrar kullanılan doğrulama kodu reddedilir', () => {
  const secret = 'JBSWY3DPEHPK3PXPJBSWY3DP'
  const now = 1_800_000_000_000
  const step = Math.floor(now / 1000 / 30)
  const code = totpCode(base32Decode(secret), step)
  assert.equal(totpStep(secret, code, now), step)
  assert.equal(totpStep(secret, code, now, 1, step), null, 'aynı kod ikinci kez')
  assert.equal(totpStep(secret, code, now, 1, step - 1), step, 'sonraki adım kabul')
  assert.equal(totpStep(secret, code === '000000' ? '111111' : '000000', now), null)
  assert.equal(totpStep(secret, '12345', now), null)
})

test('A10: e-posta servisi yapılandırılmamışsa neden açıkça yazılır', () => {
  assert.equal(classifyEmailFailure('No email service configured', 'a@b.com').reason, 'e-posta servisi (SMTP) yapılandırılmamış')
  assert.equal(classifyEmailFailure('SMTP not configured', 'a@b.com').retryable, true)
})
