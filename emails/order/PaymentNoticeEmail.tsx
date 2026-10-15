import React from 'react'
import { Text, Section } from '@react-email/components'
import { EmailLayout, CtaButton, s, fmtTRY } from './shared'

export type PaymentNotice = {
  orderNo: string
  orderTotal: number
  customerName: string
  customerEmail: string
  senderName: string
  bank: string
  amount: number
  paidOn: string
  note?: string | null
  adminUrl: string
}

/** Admin'e: müşteri havale/EFT yaptığını bildirdi — hesap hareketini kontrol edip "Ödeme Alındı" işaretleyin. */
export default function PaymentNoticeEmail({ notice }: { notice: PaymentNotice }) {
  const mismatch = Math.abs(notice.amount - notice.orderTotal) > 0.01
  return (
    <EmailLayout
      preview={`Havale bildirimi: ${notice.orderNo} — ${fmtTRY(notice.amount)}`}
      title="Havale / EFT Bildirimi"
      subtitle={<>Sipariş No: <strong>{notice.orderNo}</strong></>}
    >
      <Text style={s.p}>{notice.customerName} ({notice.customerEmail}) ödeme yaptığını bildirdi. Hesap hareketini kontrol edip panelden “Ödeme Alındı” olarak işaretleyin.</Text>
      <Section style={mismatch ? s.boxAmber : s.box}>
        <Text style={s.row}><strong>Gönderen:</strong> {notice.senderName}</Text>
        <Text style={s.row}><strong>Banka:</strong> {notice.bank}</Text>
        <Text style={s.row}><strong>Tutar:</strong> {fmtTRY(notice.amount)} {mismatch && `(sipariş toplamı ${fmtTRY(notice.orderTotal)} — tutar farklı!)`}</Text>
        <Text style={s.row}><strong>Ödeme tarihi:</strong> {notice.paidOn}</Text>
        {notice.note && <Text style={s.row}><strong>Not:</strong> {notice.note}</Text>}
      </Section>
      <CtaButton href={notice.adminUrl}>Panelde Aç</CtaButton>
    </EmailLayout>
  )
}
