import React from 'react'
import { Text, Section } from '@react-email/components'
import { EmailLayout, CtaButton, s, tx, type EmailLocale } from './order/shared'

export type QuestionAnswered = {
  customerName: string
  productName: string
  productUrl: string
  question: string
  answer: string
  /** Sorunun sorulduğu site dili (productQuestions.locale); varsayılan tr */
  locale?: EmailLocale
}

export const questionAnsweredSubject = (productName: string, locale?: EmailLocale) =>
  `${tx(locale)('Sorunuz yanıtlandı', 'Your question has been answered')} - ${productName}`.slice(0, 150)

/** Müşteriye: ürün sorusu yanıtlandı */
export default function QuestionAnsweredEmail({ data }: { data: QuestionAnswered }) {
  const L = tx(data.locale)
  return (
    <EmailLayout
      locale={data.locale}
      preview={`${L('Sorunuz yanıtlandı', 'Your question has been answered')}: ${data.productName}`}
      title={L('Sorunuz yanıtlandı', 'Your question has been answered')}
      subtitle={<>{data.productName}</>}
      tone="green"
    >
      <Text style={s.p}>{L('Merhaba', 'Hello')} {data.customerName || L('Değerli müşterimiz', 'Valued Customer')},</Text>
      <Text style={s.p}>{L('Ürün sayfamızda sorduğunuz soruyu yanıtladık.', 'We have answered the question you asked on our product page.')}</Text>
      <Section style={s.box}>
        <Text style={s.boxTitle}>{L('Sorunuz', 'Your question')}</Text>
        <Text style={s.rowText}>{data.question}</Text>
      </Section>
      <Section style={s.boxGreen}>
        <Text style={s.boxTitle}>{L('Yanıtımız', 'Our answer')}</Text>
        <Text style={{ ...s.rowText, whiteSpace: 'pre-line' }}>{data.answer}</Text>
      </Section>
      <CtaButton href={data.productUrl}>{L('Ürünü Görüntüle', 'View Product')}</CtaButton>
      <Text style={s.note}>
        {L(
          'Başka sorunuz olursa bu e-postayı yanıtlayabilir veya ürün sayfasından yeni soru sorabilirsiniz.',
          'If you have any other questions, you can reply to this email or ask a new question on the product page.'
        )}
      </Text>
    </EmailLayout>
  )
}
