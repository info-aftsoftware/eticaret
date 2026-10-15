import React from 'react'
import {
  Html,
  Head,
  Body,
  Container,
  Section,
  Text,
  Button,
  Hr,
} from '@react-email/components'
import { BANK_ACCOUNTS, BANK_ACCOUNT_HOLDER } from '../lib/store-config'

interface OrderConfirmationProps {
  orderId: string
  orderData: any
}

const fmt = (n: any) =>
  (Number(n) || 0).toLocaleString('tr-TR', { style: 'currency', currency: 'TRY' })

export default function OrderConfirmation({ orderId, orderData }: OrderConfirmationProps) {
  // notificationData yapısı: { customer, pricing, items, config, choices, paymentMethod }
  const customer = orderData?.customer ?? {}
  const pricing  = orderData?.pricing ?? orderData?.orderData?.pricing ?? {}
  const items    = orderData?.items ?? []
  const config   = orderData?.config ?? orderData?.orderData?.config
  const choices  = orderData?.choices ?? orderData?.orderData?.choices
  const paymentMethod = orderData?.paymentMethod || 'bank_transfer'

  const subtotal = Number(pricing?.subtotal) || 0
  const tax      = Number(pricing?.tax)      || 0
  const shipping = Number(pricing?.shipping) || 0
  const total    = Number(pricing?.total)    || 0

  const isBankTransfer = paymentMethod === 'bank_transfer' || paymentMethod === 'pending'
  const hasConfig  = config  && (config.chemistry  != null || config.s  != null)
  const hasChoices = choices && (choices.bms != null || choices.connector != null)

  return (
    <Html>
      <Head />
      <Body style={main}>
        <Container style={container}>

          {/* Başlık */}
          <Section style={header}>
            <Text style={brand}>Voltekno</Text>
            <Text style={title}>Siparişiniz Oluşturuldu</Text>
            <Text style={subtitle}>Sipariş No: <strong>{orderId}</strong></Text>
          </Section>

          <Section style={content}>
            <Text style={greeting}>Merhaba {customer?.name || 'Müşteri'},</Text>
            <Text style={paragraph}>
              Siparişiniz başarıyla oluşturuldu. Aşağıda özet bilgileri bulabilirsiniz.
            </Text>

            {/* Ürün satırları */}
            {items.length > 0 && (
              <Section style={tableSection}>
                <Text style={sectionTitle}>Sipariş Kalemleri</Text>
                {items.map((item: any, i: number) => (
                  <Text key={i} style={detailText}>
                    {item.productName || item.name} &times; {item.quantity}
                    {' — '}
                    {fmt(item.lineTotal ?? item.unitPrice * item.quantity)}
                  </Text>
                ))}
              </Section>
            )}

            {/* Konfigürasyon (varsa) */}
            {(hasConfig || hasChoices) && (
              <Section style={orderDetails}>
                <Text style={sectionTitle}>Konfigürasyon</Text>
                {config?.chemistry   != null && <Text style={detailText}><strong>Kimya:</strong> {config.chemistry}</Text>}
                {config?.s           != null && <Text style={detailText}><strong>Konfigürasyon:</strong> {config.s}S{config.p}P</Text>}
                {config?.usageType   != null && <Text style={detailText}><strong>Kullanım:</strong> {config.usageType}</Text>}
                {choices?.bms        != null && <Text style={detailText}><strong>BMS:</strong> {choices.bms}</Text>}
                {choices?.connector  != null && <Text style={detailText}><strong>Konnektör:</strong> {choices.connector}</Text>}
              </Section>
            )}

            {/* Fiyat özeti */}
            <Section style={pricingSection}>
              <Text style={sectionTitle}>Fiyat Özeti</Text>
              <Text style={detailText}>Ara Toplam: {fmt(subtotal)}</Text>
              <Text style={detailText}>KDV (%20): {fmt(tax)}</Text>
              <Text style={detailText}>Kargo: {shipping > 0 ? fmt(shipping) : 'Ücretsiz'}</Text>
              <Text style={totalText}><strong>Toplam: {fmt(total)}</strong></Text>
            </Section>

            {/* Havale bilgisi */}
            {isBankTransfer && (
              <Section style={bankSection}>
                <Text style={sectionTitle}>Havale / EFT Bilgileri</Text>
                <Text style={detailText}>Ödemenizi aşağıdaki hesaba yaparken açıklama kısmına sipariş numaranızı (<strong>{orderId}</strong>) yazınız.</Text>
                <Text style={detailText}><strong>Hesap Sahibi:</strong> {BANK_ACCOUNT_HOLDER}</Text>
                {BANK_ACCOUNTS.map((a) => (
                  <Text key={a.iban} style={detailText}><strong>{a.bank}:</strong> {a.iban}</Text>
                ))}
              </Section>
            )}

            <Hr style={hr} />

            <Text style={paragraph}>
              Siparişiniz hazırlandığında e-posta ile bilgilendirileceksiniz.
              Sorularınız için <a href="mailto:info@voltekno.com">info@voltekno.com</a> adresine yazabilirsiniz.
            </Text>
            <Text style={paragraph}>
              Teşekkürler,<br />
              Voltekno Ekibi
            </Text>
          </Section>
        </Container>
      </Body>
    </Html>
  )
}

const main = { backgroundColor: '#f6f9fc', fontFamily: '-apple-system,BlinkMacSystemFont,"Segoe UI",Roboto,"Helvetica Neue",Ubuntu,sans-serif' }
const container = { backgroundColor: '#ffffff', margin: '0 auto', padding: '20px 0 48px', marginBottom: '64px' }
const header = { padding: '32px 24px 0', textAlign: 'center' as const }
const brand = { color: '#dc2626', fontSize: '13px', fontWeight: 'bold', letterSpacing: '0.1em', textTransform: 'uppercase' as const, margin: '0 0 4px' }
const title = { color: '#111827', fontSize: '24px', fontWeight: 'bold', margin: '0 0 8px' }
const subtitle = { color: '#374151', fontSize: '16px', margin: '0 0 24px' }
const content = { padding: '0 24px' }
const greeting = { color: '#374151', fontSize: '16px', margin: '0 0 16px' }
const paragraph = { color: '#374151', fontSize: '14px', lineHeight: '24px', margin: '0 0 16px' }
const tableSection = { backgroundColor: '#f9fafb', padding: '16px', borderRadius: '8px', margin: '16px 0' }
const orderDetails = { backgroundColor: '#f9fafb', padding: '16px', borderRadius: '8px', margin: '16px 0' }
const pricingSection = { backgroundColor: '#f0f9ff', padding: '16px', borderRadius: '8px', margin: '16px 0' }
const bankSection = { backgroundColor: '#fffbeb', padding: '16px', borderRadius: '8px', margin: '16px 0', border: '1px solid #fde68a' }
const sectionTitle = { color: '#1f2937', fontSize: '15px', fontWeight: 'bold', margin: '0 0 10px' }
const detailText = { color: '#374151', fontSize: '14px', margin: '0 0 6px' }
const totalText = { color: '#1f2937', fontSize: '16px', fontWeight: 'bold', margin: '8px 0 0', paddingTop: '8px', borderTop: '1px solid #e5e7eb' }
const hr = { borderColor: '#e5e7eb', margin: '24px 0' }
