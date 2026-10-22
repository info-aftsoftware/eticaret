import { test } from 'node:test'
import assert from 'node:assert/strict'
import React from 'react'
import { render } from '@react-email/render'
import WelcomeEmail, { welcomeEmailSubject } from '../../emails/Welcome'
import { EmailVerification, emailVerificationSubject } from '../../emails/EmailVerification'
import PasswordResetEmail, { passwordResetSubject } from '../../emails/PasswordResetEmail'
import QuestionAnsweredEmail, { questionAnsweredSubject } from '../../emails/QuestionAnsweredEmail'
import BackInStockEmail, { backInStockSubject } from '../../emails/BackInStockEmail'
import AbandonedCartEmail, { abandonedCartSubject } from '../../emails/AbandonedCartEmail'
import type { EmailLocale } from '../../emails/order/shared'
import { englishMetadata } from '../../lib/locale-metadata'

/** Şirketin yasal unvanı, adresi ve yer adları Türkçe karakter içerebilir */
const ALLOWED =
  /Türkiye|ELAZIĞ|Elazığ|MERSİS|TEKNOLOJİLERİ|TİCARET|TİC\.|SAN\.|SANAYİ|LİMİTED|ŞİRKETİ|ŞTİ\.|Çaydaçıra|İzmir|İstanbul/g

/** Görünür metindeki Türkçe satırlar (yasal ad / adres hariç) */
function turkishLeft(html: string): string[] {
  const text = html
    .replace(/<style[\s\S]*?<\/style>/g, '')
    .replace(/<[^>]+>/g, ' ')
    .replace(/&[a-z#0-9]+;/gi, ' ')
  const lines = text.split(/\s{2,}|\n/).map((l) => l.trim()).filter(Boolean)
  return lines
    .filter((l) => /[çğıöşüÇĞİÖŞÜ]|\b(ve|ile|için|Merhaba|Sepet|Sipariş|Hesab)\b/.test(l.replace(ALLOWED, '')))
    .filter((l) => !/A\.Ş\.|Mah\.|Sok\.|Cad\.|No:/i.test(l))
}

const site = 'https://voltekno.com'

/** Her müşteri e-postası, verilen dilde (konu satırıyla birlikte) */
function emails(locale: EmailLocale) {
  return [
    {
      name: 'welcome (doğrulanmamış)',
      subject: welcomeEmailSubject(locale),
      el: React.createElement(WelcomeEmail, { name: 'Jane', siteUrl: site, emailVerified: false, locale }),
    },
    {
      name: 'welcome (isimsiz)',
      subject: welcomeEmailSubject(locale),
      el: React.createElement(WelcomeEmail, { name: '', siteUrl: site, emailVerified: true, locale }),
    },
    {
      name: 'verification',
      subject: emailVerificationSubject(locale),
      el: React.createElement(EmailVerification, { name: '', verificationUrl: `${site}/verify-email?oobCode=x`, locale }),
    },
    {
      name: 'password reset',
      subject: passwordResetSubject(locale),
      el: React.createElement(PasswordResetEmail, { name: 'Jane', resetUrl: `${site}/reset-password?oobCode=x`, locale }),
    },
    {
      name: 'question answered',
      subject: questionAnsweredSubject('LiFePO4 Battery 12V 100Ah', locale),
      el: React.createElement(QuestionAnsweredEmail, {
        data: {
          customerName: '',
          productName: 'LiFePO4 Battery 12V 100Ah',
          productUrl: `${site}/products/x`,
          question: 'Does it work with a 24V inverter?',
          answer: 'Yes, connect two in series.',
          locale,
        },
      }),
    },
    {
      name: 'back in stock',
      subject: backInStockSubject('LiFePO4 Battery 12V 100Ah', locale),
      el: React.createElement(BackInStockEmail, { productName: 'LiFePO4 Battery 12V 100Ah', productUrl: `${site}/products/x`, locale }),
    },
    {
      name: 'abandoned cart',
      subject: abandonedCartSubject(locale),
      el: React.createElement(AbandonedCartEmail, {
        lines: [{ name: 'Solar Panel 450W', quantity: 2, price: 3600 }],
        cartUrl: `${site}/cart`,
        settingsUrl: `${site}/profile?tab=settings`,
        locale,
      }),
    },
  ]
}

test('İngilizce hesap / bildirim e-postaları ve konu satırları Türkçe metin içermez', async () => {
  for (const e of emails('en')) {
    const html = await render(e.el)
    assert.match(html, /<html[^>]*lang="en"/, e.name)
    assert.deepEqual(turkishLeft(html), [], e.name)
    assert.doesNotMatch(e.subject, /[çğıöşüÇĞİÖŞÜ]/, e.name)
  }
})

test('İngilizce e-postada tutar İngilizce biçimde', async () => {
  const html = await render(emails('en').find((e) => e.name === 'abandoned cart')!.el)
  assert.match(html, /7,200\.00/)
})

test('Türkçe (varsayılan) e-postalar Türkçe kalır', async () => {
  for (const e of emails('tr')) {
    const html = await render(e.el)
    assert.match(html, /<html[^>]*lang="tr"/, e.name)
    assert.match(html, /Merhaba/, e.name)
  }
  // locale verilmezse Türkçe
  const html = await render(React.createElement(PasswordResetEmail, { name: 'Ayşe', resetUrl: `${site}/r` }))
  assert.match(html, /Yeni Şifre Belirle/)
  assert.equal(welcomeEmailSubject(), 'Voltekno’ya hoş geldiniz')
})

test('İngilizce meta veri: başlık/açıklama/paylaşım İngilizce, kanonik ve anahtar kelimeler aynı', () => {
  const tr = {
    title: 'Tüm Ürünler',
    description: 'Türkçe açıklama',
    keywords: ['güneş paneli'],
    alternates: { canonical: '/products' },
    openGraph: { title: 'Tüm Ürünler | voltekno', description: 'Türkçe', type: 'website' as const, locale: 'tr_TR' },
    twitter: { card: 'summary' as const, title: 'Tüm Ürünler | voltekno' },
  }
  const en = englishMetadata(tr, { title: 'All Products', description: 'English description' })
  assert.equal(en.title, 'All Products')
  assert.equal(en.description, 'English description')
  assert.deepEqual(en.alternates, tr.alternates)
  assert.deepEqual(en.keywords, tr.keywords)
  assert.equal((en.openGraph as { title?: string }).title, 'All Products | voltekno')
  assert.equal((en.openGraph as { locale?: string }).locale, 'en_US')
  assert.equal((en.openGraph as { description?: string }).description, 'English description')
  assert.equal((en.twitter as { title?: string }).title, 'All Products | voltekno')
  // Türkçe nesne değişmez
  assert.equal(tr.openGraph.title, 'Tüm Ürünler | voltekno')
})
