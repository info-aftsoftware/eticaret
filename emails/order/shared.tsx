/**
 * Sipariş e-postaları için ortak düzen ve bloklar.
 * Veri, lib/order-emails.ts içindeki toOrderEmailData() ile Prisma siparişinden üretilir.
 */
import React from 'react'
import { Html, Head, Preview, Body, Container, Section, Text, Button, Hr, Link } from '@react-email/components'
import { BANK_ACCOUNTS, BANK_ACCOUNT_HOLDER, BANK_TRANSFER_DISCOUNT_RATE, STORE_CONTACT } from '../../lib/store-config'
import { SELLER } from '../../lib/legal/company'

export type OrderEmailData = {
  orderNo: string
  createdAt: string
  customerName: string
  customerEmail: string
  customerPhone: string
  shippingAddress: string
  billingName: string
  billingType: string
  billingTaxId?: string | null
  billingTaxOffice?: string | null
  paymentMethod: 'bank_transfer' | 'card' | string
  paymentStatus: string
  status: string
  lines: { name: string; quantity: number; lineTotal: number }[]
  subtotal: number
  couponCode?: string | null
  couponDiscount: number
  paymentDiscount: number
  tax: number
  shipping: number
  total: number
  carrierName?: string | null
  trackingNumber?: string | null
  trackingUrl?: string | null
  customerNote?: string | null
  orderUrl: string
  adminUrl: string
  paymentDueDate?: string | null
}

export const fmtTRY = (n: number) =>
  (Number(n) || 0).toLocaleString('tr-TR', { style: 'currency', currency: 'TRY' })

export const paymentMethodLabel = (m: string) =>
  m === 'bank_transfer' ? 'Havale / EFT' : m === 'card' || m === 'stripe' ? 'Kredi / Banka Kartı' : m

export function EmailLayout({ preview, title, subtitle, children }: {
  preview: string
  title: string
  subtitle?: React.ReactNode
  children: React.ReactNode
}) {
  return (
    <Html lang="tr">
      <Head />
      <Preview>{preview}</Preview>
      <Body style={s.main}>
        <Container style={s.container}>
          <Section style={s.header}>
            <Text style={s.brand}>{STORE_CONTACT.name}</Text>
            <Text style={s.title}>{title}</Text>
            {subtitle && <Text style={s.subtitle}>{subtitle}</Text>}
          </Section>
          <Section style={s.content}>{children}</Section>
          <Hr style={s.hr} />
          <Section style={s.footer}>
            <Text style={s.footerText}>
              Sorularınız için <Link href={`mailto:${STORE_CONTACT.email}`} style={s.link}>{STORE_CONTACT.email}</Link> adresine yazabilirsiniz.
            </Text>
            <Text style={s.footerText}>
              <Link href={STORE_CONTACT.siteUrl} style={s.link}>{STORE_CONTACT.siteUrl.replace(/^https?:\/\//, '')}</Link> · {SELLER.phone}
            </Text>
            <Text style={s.footerText}>{SELLER.legalName} · {SELLER.address} · MERSİS {SELLER.mersisNo}</Text>
          </Section>
        </Container>
      </Body>
    </Html>
  )
}

export function OrderSummary({ order }: { order: OrderEmailData }) {
  return (
    <>
      <Section style={s.box}>
        <Text style={s.boxTitle}>Sipariş Kalemleri</Text>
        {order.lines.map((l, i) => (
          <Text key={i} style={s.row}>
            {l.name} × {l.quantity}
            <span style={s.right}> {fmtTRY(l.lineTotal)}</span>
          </Text>
        ))}
        <Text style={s.note}>Satır tutarları KDV dahil, indirimler öncesidir.</Text>
      </Section>
      <Section style={s.boxBlue}>
        <Text style={s.boxTitle}>Ödeme Özeti</Text>
        <Text style={s.row}>Ara Toplam (KDV hariç): <span style={s.right}>{fmtTRY(order.subtotal)}</span></Text>
        {order.couponDiscount > 0 && (
          <Text style={s.rowGreen}>Kupon {order.couponCode ? `(${order.couponCode})` : ''}: <span style={s.right}>-{fmtTRY(order.couponDiscount)}</span></Text>
        )}
        {order.paymentDiscount > 0 && (
          <Text style={s.rowGreen}>Havale/EFT indirimi (%{BANK_TRANSFER_DISCOUNT_RATE}): <span style={s.right}>-{fmtTRY(order.paymentDiscount)}</span></Text>
        )}
        <Text style={s.row}>KDV (%20): <span style={s.right}>{fmtTRY(order.tax)}</span></Text>
        <Text style={s.row}>Kargo: <span style={s.right}>{order.shipping > 0 ? fmtTRY(order.shipping) : 'Ücretsiz'}</span></Text>
        <Text style={s.total}>Toplam: <span style={s.right}>{fmtTRY(order.total)}</span></Text>
        <Text style={s.row}>Ödeme yöntemi: {paymentMethodLabel(order.paymentMethod)}</Text>
      </Section>
      <Section style={s.box}>
        <Text style={s.boxTitle}>Teslimat</Text>
        <Text style={s.row}>{order.customerName}</Text>
        <Text style={s.row}>{order.shippingAddress}</Text>
        <Text style={s.row}>{order.customerPhone}</Text>
      </Section>
    </>
  )
}

export function BankTransferBox({ order }: { order: OrderEmailData }) {
  return (
    <Section style={s.boxAmber}>
      <Text style={s.boxTitle}>Havale / EFT Ödeme Bilgileri</Text>
      <Text style={s.row}><strong>Hesap Sahibi:</strong> {BANK_ACCOUNT_HOLDER}</Text>
      {BANK_ACCOUNTS.map((a) => (
        <Text key={a.iban} style={s.row}>
          <strong>{a.bank}:</strong> <span style={s.mono}>{a.iban}</span>
        </Text>
      ))}
      <Text style={s.row}><strong>Tutar:</strong> {fmtTRY(order.total)}</Text>
      <Text style={s.row}><strong>Açıklama:</strong> {order.orderNo}</Text>
      {order.paymentDueDate && (
        <Text style={s.row}><strong>Son ödeme tarihi:</strong> {order.paymentDueDate}</Text>
      )}
      <Text style={s.note}>
        Lütfen açıklama alanına yalnızca sipariş numaranızı ({order.orderNo}) yazın. Ödemeniz hesabımıza ulaştığında
        siparişiniz onaylanır ve size e-posta ile bilgi verilir.
      </Text>
    </Section>
  )
}

export function CtaButton({ href, children }: { href: string; children: React.ReactNode }) {
  return (
    <Section style={{ textAlign: 'center', margin: '24px 0' }}>
      <Button href={href} style={s.button}>{children}</Button>
    </Section>
  )
}

export const s = {
  main: { backgroundColor: '#f6f9fc', fontFamily: '-apple-system,BlinkMacSystemFont,"Segoe UI",Roboto,"Helvetica Neue",Ubuntu,sans-serif' },
  container: { backgroundColor: '#ffffff', margin: '0 auto', padding: '20px 0 32px', maxWidth: '600px' },
  header: { padding: '24px 24px 0', textAlign: 'center' as const },
  brand: { color: '#dc2626', fontSize: '13px', fontWeight: 'bold', letterSpacing: '0.1em', textTransform: 'uppercase' as const, margin: '0 0 4px' },
  title: { color: '#111827', fontSize: '22px', fontWeight: 'bold', margin: '0 0 8px' },
  subtitle: { color: '#374151', fontSize: '15px', margin: '0 0 16px' },
  content: { padding: '0 24px' },
  p: { color: '#374151', fontSize: '14px', lineHeight: '22px', margin: '0 0 14px' },
  box: { backgroundColor: '#f9fafb', padding: '14px 16px', borderRadius: '8px', margin: '14px 0' },
  boxBlue: { backgroundColor: '#f0f9ff', padding: '14px 16px', borderRadius: '8px', margin: '14px 0' },
  boxAmber: { backgroundColor: '#fffbeb', padding: '14px 16px', borderRadius: '8px', margin: '14px 0', border: '1px solid #fde68a' },
  boxGreen: { backgroundColor: '#f0fdf4', padding: '14px 16px', borderRadius: '8px', margin: '14px 0', border: '1px solid #bbf7d0' },
  boxTitle: { color: '#1f2937', fontSize: '15px', fontWeight: 'bold', margin: '0 0 8px' },
  row: { color: '#374151', fontSize: '14px', margin: '0 0 5px' },
  rowGreen: { color: '#15803d', fontSize: '14px', margin: '0 0 5px' },
  right: { float: 'right' as const },
  total: { color: '#111827', fontSize: '16px', fontWeight: 'bold', margin: '8px 0 6px', paddingTop: '8px', borderTop: '1px solid #e5e7eb' },
  note: { color: '#6b7280', fontSize: '12px', lineHeight: '18px', margin: '8px 0 0' },
  mono: { fontFamily: 'Menlo,Consolas,monospace', fontWeight: 'bold', letterSpacing: '0.03em' },
  button: { backgroundColor: '#dc2626', color: '#ffffff', padding: '12px 22px', borderRadius: '8px', fontSize: '14px', fontWeight: 'bold', textDecoration: 'none' },
  hr: { borderColor: '#e5e7eb', margin: '24px 0 16px' },
  footer: { padding: '0 24px', textAlign: 'center' as const },
  footerText: { color: '#6b7280', fontSize: '12px', margin: '0 0 4px' },
  link: { color: '#dc2626' },
}
