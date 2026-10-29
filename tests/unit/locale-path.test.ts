import { test } from 'node:test'
import assert from 'node:assert/strict'
import { isLocalizablePath, localizePath, stripLocale } from '../../lib/i18n/locale-path'
import { localeAlternates, localizeSiteUrls } from '../../lib/i18n/alternates'

test('dil öneki: İngilizcede /en eklenir, Türkçede kaldırılır, iki kez eklenmez', () => {
  assert.equal(localizePath('/', 'en'), '/en')
  assert.equal(localizePath('/?q=akü', 'en'), '/en?q=akü')
  assert.equal(localizePath('/products?brand=Deye#x', 'en'), '/en/products?brand=Deye#x')
  assert.equal(localizePath('/en/products', 'en'), '/en/products')
  assert.equal(localizePath('/en/products', 'tr'), '/products')
  assert.equal(localizePath('/en', 'tr'), '/')
  assert.equal(localizePath('/products', 'tr'), '/products')
})

test('API, panel, medya, dosya ve dış adresler önek almaz', () => {
  for (const p of ['/api/search', '/admin', '/admin/orders', '/media/a.webp', '/feed/google-merchant.xml', '/llms.txt', '/sitemap.xml', '/favicon.ico', '/og/voltekno.jpg'])
    assert.equal(localizePath(p, 'en'), p, p)
  assert.equal(localizePath('https://example.com/x', 'en'), 'https://example.com/x')
  assert.equal(localizePath('//cdn.example.com/x', 'en'), '//cdn.example.com/x')
  assert.equal(localizePath('#icerik', 'en'), '#icerik')
  assert.equal(isLocalizablePath('/english-page'), true) // /en ile başlayan başka yol önek sayılmaz
  assert.deepEqual(stripLocale('/english-page'), { locale: 'tr', path: '/english-page' })
  assert.deepEqual(stripLocale('/en/faq'), { locale: 'en', path: '/faq' })
})

test('dil eşleri: canonical sayfanın dilinde, x-default Türkçe; mutlak adres biçimi korunur', () => {
  assert.deepEqual(localeAlternates('/faq', 'en'), { canonical: '/en/faq', languages: { tr: '/faq', en: '/en/faq', 'x-default': '/faq' } })
  assert.deepEqual(localeAlternates('/', 'tr'), { canonical: '/', languages: { tr: '/', en: '/en', 'x-default': '/' } })
  const abs = localeAlternates('https://voltekno.com/products/a', 'en')
  assert.equal(abs.canonical, 'https://voltekno.com/en/products/a')
  assert.equal((abs.languages as Record<string, string>).tr, 'https://voltekno.com/products/a')
  assert.deepEqual(localeAlternates('https://baska.com/x', 'en'), { canonical: 'https://baska.com/x' })
})

test('JSON-LD: İngilizcede site sayfa adresleri /en önekli, görsel ve medya adresleri aynen', () => {
  const data = { url: 'https://voltekno.com/products/a?variant=b', image: ['https://voltekno.com/media/x.webp'], brand: { url: 'https://voltekno.com' }, other: 'https://example.com/y' }
  assert.deepEqual(localizeSiteUrls(data, 'en'), {
    url: 'https://voltekno.com/en/products/a?variant=b',
    image: ['https://voltekno.com/media/x.webp'],
    brand: { url: 'https://voltekno.com/en' },
    other: 'https://example.com/y',
  })
  assert.equal(localizeSiteUrls(data, 'tr'), data)
})

test('türetilmiş filtre adları ve aralık etiketleri İngilizce', async () => {
  const { specKeyLabel, specValueLabel } = await import('../../lib/catalog-en')
  assert.equal(specKeyLabel('Sistem voltajı', 'en'), 'System voltage')
  assert.equal(specValueLabel('50 Ah ve altı', 'en'), 'up to 50 Ah')
  assert.equal(specValueLabel('10 kWh üzeri', 'en'), 'over 10 kWh')
  assert.equal(specValueLabel('2–5,5 kWh', 'en'), '2–5.5 kWh')
  assert.equal(specValueLabel('Bifacial (çift yüzlü)', 'en'), 'Bifacial (double-sided)')
  assert.equal(specValueLabel('50 Ah ve altı', 'tr'), '50 Ah ve altı')
})
