import React from 'react'
import { Text, Section } from '@react-email/components'
import { EmailLayout, CtaButton, s, fmtTRY } from './shared'
import { SELLER } from '../../lib/legal/company'

export type ReturnEmailKind = 'received' | 'approved' | 'rejected' | 'refunded' | 'admin_new'

export type ReturnEmailData = {
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

export const RETURN_EMAIL_SUBJECTS: Record<ReturnEmailKind, (d: ReturnEmailData) => string> = {
  received: (d) => `İade talebiniz alındı - ${d.requestNo}`,
  approved: (d) => `İade talebiniz onaylandı, gönderim bilgileri - ${d.requestNo}`,
  rejected: (d) => `İade talebiniz hakkında - ${d.requestNo}`,
  refunded: (d) => `Ücret iadeniz yapıldı - ${d.requestNo}`,
  admin_new: (d) => `Yeni iade talebi - ${d.requestNo} (${d.orderNo})`,
}

const TITLES: Record<ReturnEmailKind, string> = {
  received: 'İade Talebiniz Alındı',
  approved: 'İade Talebiniz Onaylandı',
  rejected: 'İade Talebiniz Hakkında',
  refunded: 'Ücret İadeniz Yapıldı',
  admin_new: 'Yeni İade Talebi',
}

/** İade / cayma talebi e-postaları (müşteri + admin bildirimi). */
export default function ReturnEmail({ data, kind }: { data: ReturnEmailData; kind: ReturnEmailKind }) {
  const itemsBox = (
    <Section style={s.box}>
      <Text style={s.boxTitle}>İade edilecek ürünler ({data.typeLabel})</Text>
      {data.items.map((i, idx) => <Text key={idx} style={s.row}>{i.name} × {i.quantity}</Text>)}
      {data.reason && <Text style={s.row}><strong>Neden:</strong> {data.reason}</Text>}
      {data.customerNote && <Text style={s.row}><strong>Not:</strong> {data.customerNote}</Text>}
    </Section>
  )

  return (
    <EmailLayout
      preview={`${TITLES[kind]} — ${data.requestNo}`}
      title={TITLES[kind]}
      subtitle={<>Talep No: <strong>{data.requestNo}</strong> · Sipariş: {data.orderNo}</>}
    >
      {kind === 'admin_new' ? (
        <>
          <Text style={s.p}>{data.customerName} ({data.customerEmail}, {data.customerPhone}) iade talebi oluşturdu.</Text>
          {itemsBox}
          <CtaButton href={data.adminUrl}>Panelde Aç</CtaButton>
        </>
      ) : (
        <>
          <Text style={s.p}>Merhaba {data.customerName},</Text>

          {kind === 'received' && (
            <Text style={s.p}>
              {data.orderNo} numaralı siparişiniz için iade talebiniz bize ulaştı. Talebiniz incelendikten sonra size iade için
              anlaşmalı kargo firması ve iade kodu e-posta ile bildirilecektir. Lütfen bu bilgiler gelmeden ürünü göndermeyin.
            </Text>
          )}

          {kind === 'approved' && (
            <>
              <Text style={s.p}>
                İade talebiniz onaylandı. Ürünü, faturası, kutusu ve tüm aksesuarlarıyla birlikte <strong>10 gün içinde</strong> aşağıdaki
                bilgilerle gönderebilirsiniz. Bu kod ile yapılan gönderimlerde kargo ücreti tarafımızca karşılanır.
              </Text>
              <Section style={s.boxAmber}>
                {data.carrierName && <Text style={s.row}><strong>Kargo firması:</strong> {data.carrierName}</Text>}
                {data.returnCode && <Text style={s.row}><strong>İade kodu:</strong> <span style={s.mono}>{data.returnCode}</span></Text>}
                <Text style={s.row}><strong>Alıcı:</strong> {SELLER.shortLegalName}</Text>
                <Text style={s.row}><strong>Adres:</strong> {SELLER.address}</Text>
                <Text style={s.row}><strong>Telefon:</strong> {SELLER.phone}</Text>
                <Text style={s.note}>Paketin üzerine talep numaranızı ({data.requestNo}) yazmanız işlemi hızlandırır.</Text>
              </Section>
            </>
          )}

          {kind === 'rejected' && (
            <Text style={s.p}>
              İade talebiniz kabul edilemedi.{data.rejectReason ? ` Gerekçe: ${data.rejectReason}.` : ''} Sorularınız için bize
              {' '}{SELLER.email} veya {SELLER.phone} üzerinden ulaşabilirsiniz.
            </Text>
          )}

          {kind === 'refunded' && (
            <Section style={s.boxGreen}>
              <Text style={s.row}>
                İade ettiğiniz ürünler kontrol edildi ve <strong>{fmtTRY(data.refundAmount ?? 0)}</strong> tutarındaki ücret iadesi,
                ödeme yaptığınız yönteme gönderildi. Kartlı ödemelerde tutarın hesabınıza yansıma süresi bankanıza bağlıdır.
              </Text>
            </Section>
          )}

          {itemsBox}
          <CtaButton href={data.orderUrl}>Siparişimi Görüntüle</CtaButton>
        </>
      )}
    </EmailLayout>
  )
}
