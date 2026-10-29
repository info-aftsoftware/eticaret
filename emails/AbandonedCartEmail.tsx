import React from 'react'
import { Text, Section } from '@react-email/components'
import { EmailLayout, CtaButton, s, fmtTRY, tx, type EmailLocale } from './order/shared'

export type AbandonedCartLine = { name: string; quantity: number; price: number }

export const abandonedCartSubject = (locale?: EmailLocale) =>
  tx(locale)('Sepetinizdeki ürünler sizi bekliyor', 'The items in your cart are waiting for you')

/** Terk edilen sepet hatırlatması (lib/abandoned-cart). Dil, sepetin son güncellendiği site dili. */
export default function AbandonedCartEmail({ lines, cartUrl, settingsUrl, locale }: {
  lines: AbandonedCartLine[]
  cartUrl: string
  settingsUrl: string
  locale?: EmailLocale
}) {
  const L = tx(locale)
  return (
    <EmailLayout locale={locale} preview={abandonedCartSubject(locale)} title={L('Sepetiniz sizi bekliyor', 'Your cart is waiting for you')}>
      <Text style={s.p}>{L('Merhaba,', 'Hello,')}</Text>
      <Text style={s.p}>
        {L(
          'Sepetinize eklediğiniz ürünleri sizin için sakladık. Siparişinizi tamamlamak için sepetinize dönebilirsiniz.',
          'We have saved the items you added to your cart. You can return to your cart to complete your order.'
        )}
      </Text>
      <Section style={s.box}>
        {lines.map((l, i) => (
          <Text key={i} style={s.row}>
            {l.name} × {l.quantity}
            <span style={s.right}> {fmtTRY(l.price * l.quantity, locale)}</span>
          </Text>
        ))}
        <Text style={s.note}>
          {L('Fiyatlar KDV dahildir ve stok durumuna göre değişebilir.', 'Prices include VAT and may change depending on stock availability.')}
        </Text>
      </Section>
      <CtaButton href={cartUrl}>{L('Sepetime Dön', 'Return to My Cart')}</CtaButton>
      {locale === 'en' ? (
        <Text style={s.note}>
          You are receiving this email because you agreed to receive campaign and announcement messages. You can withdraw
          your consent free of charge at any time under <a href={settingsUrl}>My Account &gt; Settings</a> or by replying
          to this email.
        </Text>
      ) : (
        <Text style={s.note}>
          Bu e-postayı kampanya ve duyuru iletileri almayı kabul ettiğiniz için aldınız. İzninizi dilediğiniz zaman
          ücretsiz olarak <a href={settingsUrl}>Hesabım &gt; Ayarlar</a> bölümünden kaldırabilir veya bu e-postayı yanıtlayarak
          bildirebilirsiniz.
        </Text>
      )}
    </EmailLayout>
  )
}
