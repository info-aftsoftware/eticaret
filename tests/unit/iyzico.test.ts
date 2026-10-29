/**
 * iyzico Ödeme Formu yardımcıları (lib/payments/iyzico.ts): yapılandırma, IYZWSv2 imzası, sepet ve alıcı alanları.
 * Çalıştırma: npm run test:unit
 */
import { test } from 'node:test'
import assert from 'node:assert/strict'
import crypto from 'node:crypto'
import {
  buildBasketItems,
  buildCheckoutFormRequest,
  getIyzicoConfig,
  iyzicoAuthorization,
  splitName,
  toIyzicoGsm,
} from '../../lib/payments/iyzico'

function withEnv(env: Record<string, string | undefined>, fn: () => void) {
  const prev: Record<string, string | undefined> = {}
  for (const k of Object.keys(env)) {
    prev[k] = process.env[k]
    if (env[k] === undefined) delete process.env[k]
    else process.env[k] = env[k]
  }
  try {
    fn()
  } finally {
    for (const k of Object.keys(prev)) {
      if (prev[k] === undefined) delete process.env[k]
      else process.env[k] = prev[k]
    }
  }
}

test('yapılandırma: üç değişken ve yalnızca iyzico alan adları kabul edilir', () => {
  withEnv({ IYZICO_API_KEY: 'k', IYZICO_SECRET_KEY: 's', IYZICO_BASE_URL: 'https://sandbox-api.iyzipay.com/' }, () => {
    const c = getIyzicoConfig()
    assert.ok(c)
    assert.equal(c.baseUrl, 'https://sandbox-api.iyzipay.com')
    assert.equal(c.sandbox, true)
  })
  withEnv({ IYZICO_API_KEY: 'k', IYZICO_SECRET_KEY: 's', IYZICO_BASE_URL: 'https://api.iyzipay.com' }, () => {
    assert.equal(getIyzicoConfig()?.sandbox, false)
  })
  withEnv({ IYZICO_API_KEY: 'k', IYZICO_SECRET_KEY: 's', IYZICO_BASE_URL: 'https://kotu.example.com' }, () => {
    assert.equal(getIyzicoConfig(), null)
  })
  withEnv({ IYZICO_API_KEY: 'k', IYZICO_SECRET_KEY: 's', IYZICO_BASE_URL: 'http://api.iyzipay.com' }, () => {
    assert.equal(getIyzicoConfig(), null)
  })
  withEnv({ IYZICO_API_KEY: undefined, IYZICO_SECRET_KEY: 's', IYZICO_BASE_URL: 'https://api.iyzipay.com' }, () => {
    assert.equal(getIyzicoConfig(), null)
  })
})

test('IYZWSv2 imzası: HMAC-SHA256(randomKey + uriPath + body) ve Base64 başlık', () => {
  const cfg = { apiKey: 'api-123', secretKey: 'secret-456' }
  const uri = '/payment/iyzipos/checkoutform/initialize/auth/ecom'
  const body = '{"a":1}'
  const rnd = '1700000000000abc'
  const header = iyzicoAuthorization(cfg, uri, body, rnd)
  assert.ok(header.startsWith('IYZWSv2 '))
  const decoded = Buffer.from(header.slice(8), 'base64').toString('utf8')
  const sig = crypto.createHmac('sha256', 'secret-456').update(rnd + uri + body).digest('hex')
  assert.equal(decoded, `apiKey:api-123&randomKey:${rnd}&signature:${sig}`)
})

test('sepet: kalemler toplamla kuruşu kuruşuna eşit, sıfır tutarlı kalem gönderilmez', () => {
  const items = buildBasketItems(
    [
      { id: 'a', name: 'Panel', category: 'Güneş Paneli', amount: 1000 },
      { id: 'b', name: 'İnverter', category: 'İnverter', amount: 333.33 },
      { id: 'c', name: 'Hediye', category: 'X', amount: 0 },
      { id: 'kargo', name: 'Kargo', category: 'Kargo', amount: 150 },
    ],
    1400.01 // kupon indirimi sonrası toplam
  )
  assert.equal(items.length, 3)
  const sumCents = items.reduce((s, i) => s + Math.round(Number(i.price) * 100), 0)
  assert.equal(sumCents, 140001)
  assert.ok(items.every((i) => Number(i.price) > 0 && /^\d+\.\d{2}$/.test(i.price)))
  assert.throws(() => buildBasketItems([{ id: 'a', name: 'x', category: 'y', amount: 0 }], 10))
})

test('alıcı alanları: ad/soyad, telefon, TC yer tutucusu, tutarlar', () => {
  assert.deepEqual(splitName('Ayşe Nur Aslan'), { name: 'Ayşe Nur', surname: 'Aslan' })
  assert.deepEqual(splitName('Tekisim'), { name: 'Tekisim', surname: 'Tekisim' })
  assert.equal(toIyzicoGsm('532 123 45 67'), '+905321234567')
  assert.equal(toIyzicoGsm('0532 123 45 67'), '+905321234567')

  const req = buildCheckoutFormRequest({
    orderNo: 'ORD-2026-02400',
    total: 1234.5,
    callbackUrl: 'https://voltekno.com/api/payments/iyzico/callback',
    ip: '1.2.3.4',
    buyer: { id: 'u1', name: 'Ali Veli', email: 'a@b.com', phone: '532 123 45 67', identityNumber: null },
    shipping: { name: 'Ali Veli', address: 'Cad. 1', city: 'Elazığ', district: 'Merkez', country: 'Türkiye' },
    billing: { name: 'Ali Veli', address: 'Cad. 1', city: 'Elazığ', district: 'Merkez', country: 'Türkiye' },
    lines: [{ id: 'p1', name: 'Akü', category: 'Akü', amount: 1234.5 }],
  })
  assert.equal(req.price, '1234.50')
  assert.equal(req.paidPrice, '1234.50')
  assert.equal(req.basketId, 'ORD-2026-02400')
  assert.equal(req.currency, 'TRY')
  assert.equal(req.buyer.identityNumber, '11111111111')
  assert.equal(req.buyer.gsmNumber, '+905321234567')
  assert.equal(req.shippingAddress.address, 'Cad. 1, Merkez, Elazığ')
})

test('sonuç sorgusu: incelemedeki ödeme iptal sayılmaz, tutar taksit farkı olmadan, eksik tutar NaN', async () => {
  const { retrieveCheckoutForm } = await import('../../lib/payments/iyzico')
  const config = { apiKey: 'k', secretKey: 's', baseUrl: 'https://sandbox-api.iyzipay.com' }
  const realFetch = globalThis.fetch
  const answer = (body: Record<string, unknown>) => {
    globalThis.fetch = (async () => new Response(JSON.stringify({ status: 'success', basketId: 'ORD-2026-00001', currency: 'TRY', ...body }))) as typeof fetch
  }
  try {
    answer({ paymentStatus: 'SUCCESS', fraudStatus: 0, price: '1000.00', paidPrice: '1063.50', paymentId: '1' })
    const review = await retrieveCheckoutForm('tokentoken12', config as never)
    assert.ok(review.valid && !review.approved && review.underReview)
    assert.ok(review.valid && review.amount === 1000 && review.paidPrice === 1063.5)

    answer({ paymentStatus: 'SUCCESS', fraudStatus: 1, price: '1000.00', paidPrice: '1063.50' })
    const ok = await retrieveCheckoutForm('tokentoken12', config as never)
    assert.ok(ok.valid && ok.approved && !ok.underReview && ok.amount === 1000)

    answer({ paymentStatus: 'FAILURE', fraudStatus: -1 })
    const bad = await retrieveCheckoutForm('tokentoken12', config as never)
    assert.ok(bad.valid && !bad.approved && !bad.underReview && Number.isNaN(bad.amount))
  } finally {
    globalThis.fetch = realFetch
  }
})
