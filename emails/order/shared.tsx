/**
 * Sipariş e-postaları için ortak düzen ve bloklar (voltekno marka dili: lacivert #0b2540, sarı #f5b400).
 * Veri, lib/order-service.ts içindeki toOrderEmailData() ile Prisma siparişinden üretilir.
 * E-posta istemcileri için: tablo tabanlı satırlar (float yok), satır içi stiller, 600 px genişlik.
 */
import React from 'react'
import { Html, Head, Preview, Body, Container, Section, Text, Button, Link, Img, Row, Column } from '@react-email/components'
import { BANK_ACCOUNTS, BANK_ACCOUNT_HOLDER, BANK_TRANSFER_DISCOUNT_RATE, STORE_CONTACT, VAT_RATE } from '../../lib/store-config'
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
  billingAddress?: string | null
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
  trackingHint?: string | null
  customerNote?: string | null
  orderUrl: string
  adminUrl: string
  siteUrl?: string
  paymentDueDate?: string | null
  /** Ödeme onay anındaki tahmini teslimat aralığı (örn. "21–23 Ekim") */
  estimatedDelivery?: string | null
  /** İptal / iade edilen (başlatılan) ücret iadesi tutarı */
  refundAmount?: number | null
}

export const BRAND = {
  navy: '#0b2540',
  navyLight: '#12335a',
  yellow: '#f5b400',
  heading: '#121926',
  body: '#20384e',
  muted: '#6b7c8f',
  border: '#e6ebf1',
  surface: '#f5f7fa',
}

export const fmtTRY = (n: number) =>
  (Number(n) || 0).toLocaleString('tr-TR', { style: 'currency', currency: 'TRY' })

export const paymentMethodLabel = (m: string) =>
  m === 'bank_transfer' ? 'Havale / EFT' : m === 'card' || m === 'stripe' ? 'Kredi / Banka Kartı' : m

const site = () => STORE_CONTACT.siteUrl.replace(/\/$/, '')

export function EmailLayout({ preview, title, subtitle, children, tone = 'navy' }: {
  preview: string
  title: string
  subtitle?: React.ReactNode
  children: React.ReactNode
  /** Başlık şeridi: lacivert (varsayılan), yeşil (olumlu), kırmızı (iptal/hata), sarı (beklenen işlem) */
  tone?: 'navy' | 'green' | 'red' | 'amber'
}) {
  const accent = { navy: BRAND.yellow, green: '#16a34a', red: '#dc2626', amber: BRAND.yellow }[tone]
  return (
    <Html lang="tr">
      <Head>
        <meta name="color-scheme" content="light" />
        <meta name="supported-color-schemes" content="light" />
      </Head>
      <Preview>{preview}</Preview>
      <Body style={s.main}>
        <Container style={s.outer}>
          <Section style={s.logoBar}>
            <Link href={site()}>
              <Img src={`${site()}/email/voltekno-logo.png`} width="150" height="52" alt="voltekno" style={s.logo} />
            </Link>
          </Section>
          <Container style={s.container}>
            <Section style={{ ...s.hero, borderTop: `4px solid ${accent}` }}>
              <Text style={s.title}>{title}</Text>
              {subtitle && <Text style={s.subtitle}>{subtitle}</Text>}
            </Section>
            <Section style={s.content}>{children}</Section>
          </Container>
          <Section style={s.footer}>
            <Text style={s.footerText}>
              Sorularınız için bu e-postayı yanıtlayabilir veya{' '}
              <Link href={`mailto:${STORE_CONTACT.email}`} style={s.footerLink}>{STORE_CONTACT.email}</Link> · {SELLER.phone} üzerinden bize ulaşabilirsiniz.
            </Text>
            <Text style={s.footerText}>
              <Link href={site()} style={s.footerLink}>{site().replace(/^https?:\/\//, '')}</Link>
              {' · '}
              <Link href={`${site()}/siparis-takip`} style={s.footerLink}>Sipariş takibi</Link>
              {' · '}
              <Link href={`${site()}/returns`} style={s.footerLink}>İade ve cayma</Link>
            </Text>
            <Text style={s.footerSmall}>{SELLER.legalName} · {SELLER.address} · MERSİS {SELLER.mersisNo}</Text>
          </Section>
        </Container>
      </Body>
    </Html>
  )
}

/** İki sütunlu satır (etiket — tutar); e-posta istemcilerinde float yerine tablo */
export function AmountRow({ label, value, strong, color }: { label: React.ReactNode; value: React.ReactNode; strong?: boolean; color?: string }) {
  const st = strong ? s.totalText : { ...s.rowText, ...(color ? { color } : {}) }
  return (
    <Row>
      <Column style={{ ...st, paddingRight: '12px' }}>{label}</Column>
      <Column align="right" style={{ ...st, whiteSpace: 'nowrap' as const, verticalAlign: 'top' }}>{value}</Column>
    </Row>
  )
}

export function InfoRow({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <Text style={s.row}>
      <span style={{ color: BRAND.muted }}>{label}: </span>
      <span style={{ color: BRAND.heading, fontWeight: 600 }}>{children}</span>
    </Text>
  )
}

export function OrderSummary({ order, compact }: { order: OrderEmailData; compact?: boolean }) {
  return (
    <>
      <Section style={s.card}>
        <Text style={s.boxTitle}>Sipariş özeti</Text>
        {order.lines.map((l, i) => (
          <Row key={i} style={{ borderBottom: `1px solid ${BRAND.border}` }}>
            <Column style={{ ...s.rowText, padding: '8px 12px 8px 0' }}>
              {l.name}
              <span style={{ color: BRAND.muted }}> × {l.quantity}</span>
            </Column>
            <Column align="right" style={{ ...s.rowText, padding: '8px 0', whiteSpace: 'nowrap' as const, verticalAlign: 'top' }}>{fmtTRY(l.lineTotal)}</Column>
          </Row>
        ))}
        <Section style={{ paddingTop: '8px' }}>
          <AmountRow label="Ara toplam (KDV hariç)" value={fmtTRY(order.subtotal)} />
          {order.couponDiscount > 0 && (
            <AmountRow label={`Kupon${order.couponCode ? ` (${order.couponCode})` : ''}`} value={`−${fmtTRY(order.couponDiscount)}`} color="#15803d" />
          )}
          {order.paymentDiscount > 0 && (
            <AmountRow label={`Havale/EFT indirimi (%${BANK_TRANSFER_DISCOUNT_RATE})`} value={`−${fmtTRY(order.paymentDiscount)}`} color="#15803d" />
          )}
          <AmountRow label={`KDV (%${VAT_RATE})`} value={fmtTRY(order.tax)} />
          <AmountRow label="Kargo" value={order.shipping > 0 ? fmtTRY(order.shipping) : 'Ücretsiz'} />
          <Section style={{ borderTop: `1px solid ${BRAND.border}`, marginTop: '6px', paddingTop: '6px' }}>
            <AmountRow label="Toplam" value={fmtTRY(order.total)} strong />
          </Section>
          <Text style={s.note}>Ödeme yöntemi: {paymentMethodLabel(order.paymentMethod)} · Satır tutarları KDV dahil, indirimler öncesidir.</Text>
        </Section>
      </Section>
      {!compact && (
        <Section style={s.cardPlain}>
          <Row>
            <Column style={{ verticalAlign: 'top', paddingRight: '8px' }}>
              <Text style={s.boxTitle}>Teslimat adresi</Text>
              <Text style={s.small}>{order.customerName}</Text>
              <Text style={s.small}>{order.shippingAddress}</Text>
              <Text style={s.small}>{order.customerPhone}</Text>
            </Column>
            <Column style={{ verticalAlign: 'top', paddingLeft: '8px' }}>
              <Text style={s.boxTitle}>Fatura</Text>
              <Text style={s.small}>{order.billingName}</Text>
              {order.billingType === 'company' ? (
                <Text style={s.small}>VKN {order.billingTaxId ?? '—'} · {order.billingTaxOffice ?? '—'} V.D.</Text>
              ) : null}
              <Text style={s.small}>{order.billingAddress || 'Teslimat adresiyle aynı'}</Text>
            </Column>
          </Row>
        </Section>
      )}
    </>
  )
}

export function BankTransferBox({ order }: { order: OrderEmailData }) {
  return (
    <Section style={s.boxAmber}>
      <Text style={s.boxTitle}>Havale / EFT ödeme bilgileri</Text>
      <AmountRow label="Ödenecek tutar" value={fmtTRY(order.total)} strong />
      <AmountRow label="Açıklama" value={<span style={s.mono}>{order.orderNo}</span>} />
      {order.paymentDueDate && <AmountRow label="Son ödeme tarihi" value={order.paymentDueDate} />}
      <Text style={{ ...s.small, marginTop: '10px' }}><span style={{ color: BRAND.muted }}>Alıcı:</span> {BANK_ACCOUNT_HOLDER}</Text>
      {BANK_ACCOUNTS.map((a) => (
        <Section key={a.iban} style={s.ibanBox}>
          <Text style={{ ...s.small, fontWeight: 600, color: BRAND.heading }}>{a.bank}</Text>
          <Text style={{ ...s.small, ...s.mono }}>{a.iban}</Text>
        </Section>
      ))}
      <Text style={s.note}>
        Açıklama alanına yalnızca sipariş numaranızı ({order.orderNo}) yazın. Ödemeniz hesabımıza ulaştığında siparişiniz onaylanır
        ve size e-posta ile bilgi verilir.
      </Text>
    </Section>
  )
}

/** Sipariş ilerleme şeridi: Alındı → Ödeme → Hazırlanıyor → Kargoda → Teslim */
export function OrderProgress({ step }: { step: 0 | 1 | 2 | 3 | 4 }) {
  const labels = ['Alındı', 'Ödeme', 'Hazırlanıyor', 'Kargoda', 'Teslim']
  return (
    <Section style={{ margin: '4px 0 18px' }}>
      <Row>
        {labels.map((label, i) => {
          const done = i <= step
          return (
            <Column key={label} align="center" style={{ width: '20%', verticalAlign: 'top' }}>
              <div
                style={{
                  height: '6px',
                  borderRadius: '3px',
                  margin: '0 3px 6px',
                  backgroundColor: done ? (i === step ? BRAND.yellow : BRAND.navy) : BRAND.border,
                }}
              />
              <span style={{ fontSize: '11px', lineHeight: '14px', color: done ? BRAND.heading : BRAND.muted, fontWeight: i === step ? 700 : 400 }}>{label}</span>
            </Column>
          )
        })}
      </Row>
    </Section>
  )
}

export function CtaButton({ href, children, secondary }: { href: string; children: React.ReactNode; secondary?: boolean }) {
  return (
    <Section style={{ textAlign: 'center', margin: '22px 0' }}>
      <Button href={href} style={secondary ? s.buttonSecondary : s.button}>{children}</Button>
    </Section>
  )
}

export const s = {
  main: { backgroundColor: '#eef1f5', fontFamily: 'Inter,-apple-system,BlinkMacSystemFont,"Segoe UI",Roboto,"Helvetica Neue",Arial,sans-serif', margin: 0, padding: '24px 0' },
  outer: { maxWidth: '680px', margin: '0 auto', padding: '0 12px' },
  logoBar: { padding: '4px 4px 16px', textAlign: 'center' as const },
  logo: { display: 'inline-block', border: 0 },
  container: { backgroundColor: '#ffffff', borderRadius: '12px', overflow: 'hidden', border: `1px solid ${BRAND.border}`, maxWidth: '680px' },
  hero: { backgroundColor: BRAND.navy, padding: '32px 40px 28px', textAlign: 'left' as const },
  title: { color: '#ffffff', fontSize: '22px', lineHeight: '28px', fontWeight: 700, margin: '0 0 6px' },
  subtitle: { color: '#c3cfdc', fontSize: '14px', lineHeight: '20px', margin: 0 },
  content: { padding: '32px 40px 16px' },
  p: { color: BRAND.body, fontSize: '15px', lineHeight: '26px', margin: '0 0 16px' },
  card: { border: `1px solid ${BRAND.border}`, borderRadius: '10px', padding: '18px 22px', margin: '20px 0' },
  cardPlain: { backgroundColor: BRAND.surface, borderRadius: '10px', padding: '18px 22px', margin: '20px 0' },
  box: { backgroundColor: BRAND.surface, padding: '18px 22px', borderRadius: '10px', margin: '20px 0' },
  boxBlue: { backgroundColor: '#f1f5fb', padding: '18px 22px', borderRadius: '10px', margin: '20px 0', border: '1px solid #d6e2f2' },
  boxAmber: { backgroundColor: '#fffaeb', padding: '18px 22px', borderRadius: '10px', margin: '20px 0', border: '1px solid #f5d97a' },
  boxGreen: { backgroundColor: '#f0fdf4', padding: '18px 22px', borderRadius: '10px', margin: '20px 0', border: '1px solid #bbf7d0' },
  boxRed: { backgroundColor: '#fef2f2', padding: '18px 22px', borderRadius: '10px', margin: '20px 0', border: '1px solid #fecaca' },
  ibanBox: { backgroundColor: '#ffffff', border: '1px solid #f1e3b0', borderRadius: '8px', padding: '8px 12px', margin: '6px 0' },
  boxTitle: { color: BRAND.heading, fontSize: '15px', fontWeight: 700, margin: '0 0 8px' },
  row: { color: BRAND.body, fontSize: '14px', lineHeight: '21px', margin: '0 0 5px' },
  rowText: { color: BRAND.body, fontSize: '14px', lineHeight: '22px' },
  rowGreen: { color: '#15803d', fontSize: '14px', margin: '0 0 5px' },
  small: { color: BRAND.body, fontSize: '13px', lineHeight: '19px', margin: '0 0 2px' },
  totalText: { color: BRAND.heading, fontSize: '16px', lineHeight: '26px', fontWeight: 700 },
  /** @deprecated float yerine AmountRow kullanın */
  right: { float: 'right' as const },
  total: { color: BRAND.heading, fontSize: '16px', fontWeight: 700, margin: '8px 0 6px', paddingTop: '8px', borderTop: `1px solid ${BRAND.border}` },
  note: { color: BRAND.muted, fontSize: '12px', lineHeight: '18px', margin: '8px 0 0' },
  mono: { fontFamily: 'Menlo,Consolas,"Courier New",monospace', fontWeight: 700, letterSpacing: '0.02em' },
  button: { backgroundColor: BRAND.yellow, color: '#111111', padding: '13px 26px', borderRadius: '8px', fontSize: '15px', fontWeight: 700, textDecoration: 'none', display: 'inline-block' },
  buttonSecondary: { backgroundColor: BRAND.navy, color: '#ffffff', padding: '13px 26px', borderRadius: '8px', fontSize: '15px', fontWeight: 700, textDecoration: 'none', display: 'inline-block' },
  hr: { borderColor: BRAND.border, margin: '24px 0 16px' },
  footer: { padding: '18px 16px 8px', textAlign: 'center' as const },
  footerText: { color: BRAND.muted, fontSize: '12px', lineHeight: '18px', margin: '0 0 6px' },
  footerSmall: { color: '#94a3b3', fontSize: '11px', lineHeight: '16px', margin: '6px 0 0' },
  footerLink: { color: BRAND.navy, textDecoration: 'underline' },
  link: { color: BRAND.navy, fontWeight: 600 },
}
