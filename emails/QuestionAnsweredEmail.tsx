import React from 'react'
import { Text, Section } from '@react-email/components'
import { EmailLayout, CtaButton, s } from './order/shared'

export type QuestionAnswered = {
  customerName: string
  productName: string
  productUrl: string
  question: string
  answer: string
}

/** Müşteriye: ürün sorusu yanıtlandı */
export default function QuestionAnsweredEmail({ data }: { data: QuestionAnswered }) {
  return (
    <EmailLayout
      preview={`Sorunuz yanıtlandı: ${data.productName}`}
      title="Sorunuz yanıtlandı"
      subtitle={<>{data.productName}</>}
      tone="green"
    >
      <Text style={s.p}>Merhaba {data.customerName},</Text>
      <Text style={s.p}>Ürün sayfamızda sorduğunuz soruyu yanıtladık.</Text>
      <Section style={s.box}>
        <Text style={s.boxTitle}>Sorunuz</Text>
        <Text style={s.rowText}>{data.question}</Text>
      </Section>
      <Section style={s.boxGreen}>
        <Text style={s.boxTitle}>Yanıtımız</Text>
        <Text style={{ ...s.rowText, whiteSpace: 'pre-line' }}>{data.answer}</Text>
      </Section>
      <CtaButton href={data.productUrl}>Ürünü Görüntüle</CtaButton>
      <Text style={s.note}>Başka sorunuz olursa bu e-postayı yanıtlayabilir veya ürün sayfasından yeni soru sorabilirsiniz.</Text>
    </EmailLayout>
  )
}
