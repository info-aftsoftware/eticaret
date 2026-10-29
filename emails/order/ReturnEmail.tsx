import React from 'react'
import { Text, Section } from '@react-email/components'
import { EmailLayout, CtaButton, s, fmtTRY, tx, type EmailLocale } from './shared'
import { SELLER } from '../../lib/legal/company'

export type ReturnEmailKind = 'received' | 'approved' | 'rejected' | 'refunded' | 'admin_new'

export type ReturnEmailData = {
  /** Müşteri e-postasının dili (siparişin dili); admin bildirimi her zaman Türkçe */
  locale?: EmailLocale
  requestNo: string
  orderNo: string
  customerName: string
  customerEmail: string
  customerPhone: string
  typeLabel: string
  items: { name: string; quantity: number }[]
  reason?: string | null
  customerNote?: string | null
  rejectReason?: string | null
  carrierName?: string | null
  returnCode?: string | null
  refundAmount?: number | null
  orderUrl: string
  adminUrl: string
}

type Bilingual = { tr: string; en: string }

const SUBJECTS: Record<ReturnEmailKind, (d: ReturnEmailData) => Bilingual> = {
  received: (d) => ({ tr: `İade talebiniz alındı - ${d.requestNo}`, en: `We received your return request - ${d.requestNo}` }),
  approved: (d) => ({ tr: `İade talebiniz onaylandı, gönderim bilgileri - ${d.requestNo}`, en: `Your return request is approved, shipping details - ${d.requestNo}` }),
  rejected: (d) => ({ tr: `İade talebiniz hakkında - ${d.requestNo}`, en: `About your return request - ${d.requestNo}` }),
  refunded: (d) => ({ tr: `Ücret iadeniz yapıldı - ${d.requestNo}`, en: `Your refund has been issued - ${d.requestNo}` }),
  admin_new: (d) => ({ tr: `Yeni iade talebi - ${d.requestNo} (${d.orderNo})`, en: `Yeni iade talebi - ${d.requestNo} (${d.orderNo})` }),
}

export const RETURN_EMAIL_SUBJECTS: Record<ReturnEmailKind, (d: ReturnEmailData) => string> = Object.fromEntries(
  (Object.keys(SUBJECTS) as ReturnEmailKind[]).map((k) => [k, (d: ReturnEmailData) => SUBJECTS[k](d)[d.locale === 'en' && k !== 'admin_new' ? 'en' : 'tr']])
) as Record<ReturnEmailKind, (d: ReturnEmailData) => string>

const TITLES: Record<ReturnEmailKind, Bilingual> = {
  received: { tr: 'İade Talebiniz Alındı', en: 'Return Request Received' },
  approved: { tr: 'İade Talebiniz Onaylandı', en: 'Return Request Approved' },
  rejected: { tr: 'İade Talebiniz Hakkında', en: 'About Your Return Request' },
  refunded: { tr: 'Ücret İadeniz Yapıldı', en: 'Your Refund Has Been Issued' },
  admin_new: { tr: 'Yeni İade Talebi', en: 'Yeni İade Talebi' },
}

/** İade / cayma talebi e-postaları (müşteri: siparişin dilinde; admin bildirimi: Türkçe). */
export default function ReturnEmail({ data, kind }: { data: ReturnEmailData; kind: ReturnEmailKind }) {
  const locale: EmailLocale = kind !== 'admin_new' && data.locale === 'en' ? 'en' : 'tr'
  const en = locale === 'en'
  const L = tx(locale)
  const title = TITLES[kind][locale]
  const itemsBox = (
    <Section style={s.box}>
      <Text style={s.boxTitle}>{L(`İade edilecek ürünler (${data.typeLabel})`, `Items to return (${data.typeLabel})`)}</Text>
      {data.items.map((i, idx) => <Text key={idx} style={s.row}>{i.name} × {i.quantity}</Text>)}
      {data.reason && <Text style={s.row}><strong>{L('Neden', 'Reason')}:</strong> {data.reason}</Text>}
      {data.customerNote && <Text style={s.row}><strong>{L('Not', 'Note')}:</strong> {data.customerNote}</Text>}
    </Section>
  )

  return (
    <EmailLayout
      locale={locale}
      preview={`${title} — ${data.requestNo}`}
      title={title}
      subtitle={<>{L('Talep No', 'Request no.')}: <strong>{data.requestNo}</strong> · {L('Sipariş', 'Order')}: {data.orderNo}</>}
    >
      {kind === 'admin_new' ? (
        <>
          <Text style={s.p}>{data.customerName} ({data.customerEmail}, {data.customerPhone}) iade talebi oluşturdu.</Text>
          {itemsBox}
          <CtaButton href={data.adminUrl}>Panelde Aç</CtaButton>
        </>
      ) : (
        <>
          <Text style={s.p}>{L(`Merhaba ${data.customerName},`, `Hello ${data.customerName},`)}</Text>

          {kind === 'received' && (
            <Text style={s.p}>
              {L(
                `${data.orderNo} numaralı siparişiniz için iade talebiniz bize ulaştı. Talebiniz incelendikten sonra size iade için anlaşmalı kargo firması ve iade kodu e-posta ile bildirilecektir. Lütfen bu bilgiler gelmeden ürünü göndermeyin.`,
                `We have received your return request for order ${data.orderNo}. Once we have reviewed it, we will email you the contracted carrier and a return code. Please do not ship the item before you receive these details.`
              )}
            </Text>
          )}

          {kind === 'approved' && (
            <>
              {en ? (
                <Text style={s.p}>
                  Your return request has been approved. Please send the item together with its invoice, box and all accessories{' '}
                  <strong>within 10 days</strong> using the details below. Shipping is free of charge for shipments made with this code.
                </Text>
              ) : (
                <Text style={s.p}>
                  İade talebiniz onaylandı. Ürünü, faturası, kutusu ve tüm aksesuarlarıyla birlikte <strong>10 gün içinde</strong> aşağıdaki
                  bilgilerle gönderebilirsiniz. Bu kod ile yapılan gönderimlerde kargo ücreti tarafımızca karşılanır.
                </Text>
              )}
              <Section style={s.boxAmber}>
                {data.carrierName && <Text style={s.row}><strong>{L('Kargo firması', 'Carrier')}:</strong> {data.carrierName}</Text>}
                {data.returnCode && <Text style={s.row}><strong>{L('İade kodu', 'Return code')}:</strong> <span style={s.mono}>{data.returnCode}</span></Text>}
                <Text style={s.row}><strong>{L('Alıcı', 'Recipient')}:</strong> {SELLER.shortLegalName}</Text>
                <Text style={s.row}><strong>{L('Adres', 'Address')}:</strong> {SELLER.address}</Text>
                <Text style={s.row}><strong>{L('Telefon', 'Phone')}:</strong> {SELLER.phone}</Text>
                <Text style={s.note}>
                  {L(
                    `Paketin üzerine talep numaranızı (${data.requestNo}) yazmanız işlemi hızlandırır.`,
                    `Writing your request number (${data.requestNo}) on the package speeds up processing.`
                  )}
                </Text>
              </Section>
            </>
          )}

          {kind === 'rejected' && (
            <Text style={s.p}>
              {L('İade talebiniz kabul edilemedi.', 'Unfortunately, we could not accept your return request.')}
              {data.rejectReason ? ` ${L('Gerekçe', 'Reason')}: ${data.rejectReason}.` : ''}{' '}
              {L(
                `Sorularınız için bize ${SELLER.email} veya ${SELLER.phone} üzerinden ulaşabilirsiniz.`,
                `If you have any questions, contact us at ${SELLER.email} or ${SELLER.phone}.`
              )}
            </Text>
          )}

          {kind === 'refunded' && (
            <Section style={s.boxGreen}>
              {en ? (
                <Text style={s.row}>
                  The items you returned have been inspected and a refund of <strong>{fmtTRY(data.refundAmount ?? 0, locale)}</strong> has been
                  sent to your original payment method. For card payments, the time it takes to appear on your account depends on your bank.
                </Text>
              ) : (
                <Text style={s.row}>
                  İade ettiğiniz ürünler kontrol edildi ve <strong>{fmtTRY(data.refundAmount ?? 0)}</strong> tutarındaki ücret iadesi,
                  ödeme yaptığınız yönteme gönderildi. Kartlı ödemelerde tutarın hesabınıza yansıma süresi bankanıza bağlıdır.
                </Text>
              )}
            </Section>
          )}

          {itemsBox}
          <CtaButton href={data.orderUrl}>{L('Siparişimi Görüntüle', 'View My Order')}</CtaButton>
        </>
      )}
    </EmailLayout>
  )
}
