import { test } from 'node:test'
import assert from 'node:assert/strict'
import { buildPosForm, nestpayHashV3, verifyPosCallback, type BankPosConfig } from '../../lib/payments/bank-pos'

const config: BankPosConfig = { clientId: '100200300', storeKey: 'TEST|KEY\\1', gatewayUrl: 'https://entegrasyon.asseco-see.com.tr/fim/est3Dgate', bankName: 'Test Bank' }

/** Bankanın dönüşünü taklit eder: form alanları + banka sonucu, banka gibi imzalanır */
function bankResponse(overrides: Record<string, string>) {
  const { fields } = buildPosForm(
    { orderNo: 'VT-1001', amount: 1130, callbackUrl: 'https://voltekno.com/api/payments/pos/callback', customer: { name: 'Ali Veli', email: 'ali@example.com', phone: '0555 111 22 33' } },
    config
  )
  const { hash: _h, ...rest } = fields
  const params: Record<string, string> = { ...rest, mdStatus: '1', Response: 'Approved', ProcReturnCode: '00', TransId: 'T123', AuthCode: 'A1', ...overrides }
  params.HASH = nestpayHashV3(params, config.storeKey)
  return params
}

test('ödeme formu: tutar 2 hane, TL kodu, 3D_PAY_HOSTING, imza alanı', () => {
  const { action, fields } = buildPosForm(
    { orderNo: 'VT-1', amount: 1097.6, callbackUrl: 'https://x/cb', customer: { name: 'A', email: 'a@b.co' } },
    config
  )
  assert.equal(action, config.gatewayUrl)
  assert.equal(fields.amount, '1097.60')
  assert.equal(fields.currency, '949')
  assert.equal(fields.storetype, '3D_PAY_HOSTING')
  assert.equal(fields.Instalment, '')
  assert.equal(fields.hash, nestpayHashV3(fields, config.storeKey))
})

test('hash ver3: alan sırası büyük/küçük harften bağımsız, | ve \\ kaçışlanır', () => {
  const a = nestpayHashV3({ b: '1', A: 'x|y', c: 'z\\w', encoding: 'utf-8' }, 'k')
  const b = nestpayHashV3({ c: 'z\\w', A: 'x|y', b: '1' }, 'k')
  assert.equal(a, b)
  assert.notEqual(a, nestpayHashV3({ A: 'x', b: '|y1', c: 'z\\w' }, 'k'))
})

test('onaylı dönüş doğrulanır', () => {
  const r = verifyPosCallback(bankResponse({}), config)
  assert.ok(r.valid)
  assert.equal(r.approved, true)
  assert.equal(r.orderNo, 'VT-1001')
  assert.equal(r.amount, 1130)
  assert.equal(r.currency, 'TRY')
  assert.equal(r.transId, 'T123')
})

test('3D doğrulaması başarısız (mdStatus 0) onaylanmaz', () => {
  const r = verifyPosCallback(bankResponse({ mdStatus: '0', Response: 'Declined', ProcReturnCode: '99' }), config)
  assert.ok(r.valid)
  assert.equal(r.approved, false)
  assert.match(r.errorMessage ?? '', /3D Secure/)
})

test('banka reddi hata mesajıyla döner', () => {
  const r = verifyPosCallback(bankResponse({ Response: 'Declined', ProcReturnCode: '51', ErrMsg: 'Bakiye yetersiz' }), config)
  assert.ok(r.valid)
  assert.equal(r.approved, false)
  assert.equal(r.errorMessage, 'Bakiye yetersiz')
})

test('değiştirilmiş tutar / sahte imza reddedilir', () => {
  const params = bankResponse({})
  assert.equal(verifyPosCallback({ ...params, amount: '1.00' }, config).valid, false)
  assert.equal(verifyPosCallback({ ...params, HASH: 'AAAA' }, config).valid, false)
  const { HASH: _x, ...noHash } = params
  assert.equal(verifyPosCallback(noHash, config).valid, false)
  assert.equal(verifyPosCallback(params, null).valid, false)
})

test('yarım güvenli 3D (mdStatus 2-4) varsayılan olarak reddedilir, ayarla kabul edilir', () => {
  const params = bankResponse({ mdStatus: '2' })
  const before = process.env.POS_ALLOW_HALF_SECURE
  delete process.env.POS_ALLOW_HALF_SECURE
  const r1 = verifyPosCallback(params, config)
  assert.ok(r1.valid && !r1.approved)
  process.env.POS_ALLOW_HALF_SECURE = 'true'
  const r2 = verifyPosCallback(params, config)
  assert.ok(r2.valid && r2.approved)
  if (before === undefined) delete process.env.POS_ALLOW_HALF_SECURE
  else process.env.POS_ALLOW_HALF_SECURE = before
})
