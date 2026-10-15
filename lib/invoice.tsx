import React from 'react'
import { Document, Page, Text, View, StyleSheet, Font } from '@react-pdf/renderer'
import { SELLER } from './legal/company'

// Register font for Turkish characters (TTF format — woff2 is not supported by fontkit/react-pdf)
Font.register({
  family: 'Roboto',
  fonts: [
    {
      src: 'https://cdnjs.cloudflare.com/ajax/libs/pdfmake/0.2.7/fonts/Roboto/Roboto-Regular.ttf',
      fontWeight: 400,
    },
    {
      src: 'https://cdnjs.cloudflare.com/ajax/libs/pdfmake/0.2.7/fonts/Roboto/Roboto-Medium.ttf',
      fontWeight: 700,
    },
  ],
})

const STATUS_TR: Record<string, string> = {
  PENDING: 'Beklemede',
  PAID: 'Ödendi',
  CONFIRMED: 'Onaylandı',
  PROCESSING: 'Hazırlanıyor',
  PICKING: 'Hazırlanıyor',
  SHIPPED: 'Kargoda',
  DELIVERED: 'Teslim Edildi',
  CANCELLED: 'İptal',
  RETURNED: 'İade',
}

const styles = StyleSheet.create({
  page: {
    flexDirection: 'column',
    backgroundColor: '#FFFFFF',
    padding: 30,
    fontFamily: 'Roboto',
  },
  header: {
    marginBottom: 30,
    borderBottom: '2 solid #2563eb',
    paddingBottom: 20,
  },
  companyName: {
    fontSize: 24,
    fontWeight: 'bold',
    color: '#2563eb',
    marginBottom: 10,
  },
  companyInfo: {
    fontSize: 10,
    color: '#666',
    lineHeight: 1.4,
  },
  invoiceTitle: {
    fontSize: 20,
    fontWeight: 'bold',
    marginBottom: 20,
    textAlign: 'center',
  },
  orderInfo: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: 30,
  },
  orderDetails: {
    fontSize: 12,
  },
  customerInfo: {
    fontSize: 12,
  },
  table: {
    marginBottom: 30,
  },
  tableHeader: {
    flexDirection: 'row',
    backgroundColor: '#f3f4f6',
    padding: 8,
    borderBottom: '1 solid #d1d5db',
  },
  tableRow: {
    flexDirection: 'row',
    padding: 8,
    borderBottom: '1 solid #e5e7eb',
  },
  colSku: {
    width: '15%',
    fontSize: 10,
  },
  colTitle: {
    width: '45%',
    fontSize: 10,
  },
  colQty: {
    width: '10%',
    fontSize: 10,
    textAlign: 'center',
  },
  colPrice: {
    width: '15%',
    fontSize: 10,
    textAlign: 'right',
  },
  colTotal: {
    width: '15%',
    fontSize: 10,
    textAlign: 'right',
  },
  totals: {
    alignSelf: 'flex-end',
    width: '40%',
  },
  totalRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    padding: 5,
    fontSize: 12,
  },
  totalRowFinal: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    padding: 8,
    fontSize: 14,
    fontWeight: 'bold',
    backgroundColor: '#f3f4f6',
    borderTop: '2 solid #2563eb',
  },
  footer: {
    marginTop: 50,
    fontSize: 10,
    color: '#666',
    textAlign: 'center',
  },
})

interface InvoiceDocumentProps {
  orderId: string
  orderData: any
}

export const InvoiceDocument: React.FC<InvoiceDocumentProps> = ({
  orderId,
  orderData,
}) => {
  const { customer, config, choices, pricing } = orderData

  return (
    <Document>
      <Page size="A4" style={styles.page}>
        {/* Header */}
        <View style={styles.header}>
          <Text style={styles.companyName}>
            {process.env.COMPANY_LEGAL_NAME || SELLER.shortLegalName}
          </Text>
          <View style={styles.companyInfo}>
            <Text>
              {process.env.COMPANY_ADDRESS || SELLER.address}
            </Text>
            <Text>
              Vergi No: {process.env.COMPANY_TAX_ID || SELLER.taxNo} |
              Vergi Dairesi: {process.env.COMPANY_TAX_OFFICE || SELLER.taxOffice}
            </Text>
            <Text>
              Tel: {process.env.COMPANY_PHONE || SELLER.phone} |
              E-posta: {process.env.COMPANY_EMAIL || SELLER.invoiceEmail}
            </Text>
          </View>
        </View>

        {/* Invoice Title */}
        {/* Resmî e-Arşiv faturası entegratör bağlanınca ayrıca düzenlenir; bu belge sipariş özetidir */}
        <Text style={styles.invoiceTitle}>SİPARİŞ ÖZETİ / PROFORMA</Text>

        {/* Order Info */}
        <View style={styles.orderInfo}>
          <View style={styles.orderDetails}>
            <Text>Sipariş No: {orderId}</Text>
            <Text>Tarih: {new Date().toLocaleDateString('tr-TR')}</Text>
            <Text>Durum: {STATUS_TR[String(orderData.status || '').toUpperCase()] ?? (orderData.status || 'Yeni')}</Text>
          </View>
          <View style={styles.customerInfo}>
            <Text style={{ fontWeight: 'bold' }}>Müşteri Bilgileri:</Text>
            <Text>{customer.name}</Text>
            <Text>{customer.email}</Text>
            <Text>{customer.phone}</Text>
            <Text>{customer.addressLine}</Text>
            <Text>{customer.district}, {customer.city} {customer.postalCode}</Text>
            {customer.billingType === 'company' && (
              <>
                <Text>Şirket: {customer.companyName}</Text>
                <Text>Vergi No: {customer.taxId}</Text>
                <Text>Vergi Dairesi: {customer.taxOffice}</Text>
              </>
            )}
          </View>
        </View>

        {/* Items Table */}
        <View style={styles.table}>
          <View style={styles.tableHeader}>
            <Text style={styles.colSku}>SKU</Text>
            <Text style={styles.colTitle}>Açıklama</Text>
            <Text style={styles.colQty}>Adet</Text>
            <Text style={styles.colPrice}>Birim Fiyat</Text>
            <Text style={styles.colTotal}>Toplam</Text>
          </View>
          {pricing.items.map((item: any, index: number) => (
            <View key={index} style={styles.tableRow}>
              <Text style={styles.colSku}>{item.sku}</Text>
              <Text style={styles.colTitle}>{item.title}</Text>
              <Text style={styles.colQty}>{item.qty}</Text>
              <Text style={styles.colPrice}>
                {(Number(item.unitPrice) || 0).toLocaleString('tr-TR', {
                  style: 'currency',
                  currency: 'TRY',
                })}
              </Text>
              <Text style={styles.colTotal}>
                {(Number(item.total) || 0).toLocaleString('tr-TR', {
                  style: 'currency',
                  currency: 'TRY',
                })}
              </Text>
            </View>
          ))}
        </View>

        {/* Totals */}
        <View style={styles.totals}>
          <View style={styles.totalRow}>
            <Text>Ara Toplam:</Text>
            <Text>
              {(Number(pricing.subtotal) || 0).toLocaleString('tr-TR', {
                style: 'currency',
                currency: 'TRY',
              })}
            </Text>
          </View>
          {Number(pricing.discount) > 0 && (
            <View style={styles.totalRow}>
              <Text>İndirim:</Text>
              <Text>
                -{(Number(pricing.discount) || 0).toLocaleString('tr-TR', {
                  style: 'currency',
                  currency: 'TRY',
                })}
              </Text>
            </View>
          )}
          <View style={styles.totalRow}>
            <Text>KDV (%20):</Text>
            <Text>
              {(Number(pricing.tax) || 0).toLocaleString('tr-TR', {
                style: 'currency',
                currency: 'TRY',
              })}
            </Text>
          </View>
          <View style={styles.totalRow}>
            <Text>Kargo:</Text>
            <Text>
              {(Number(pricing.shipping) || 0).toLocaleString('tr-TR', {
                style: 'currency',
                currency: 'TRY',
              })}
            </Text>
          </View>
          <View style={styles.totalRowFinal}>
            <Text>GENEL TOPLAM:</Text>
            <Text>
              {(Number(pricing.total) || 0).toLocaleString('tr-TR', {
                style: 'currency',
                currency: 'TRY',
              })}
            </Text>
          </View>
        </View>


        {/* Footer */}
        <View style={styles.footer}>
          <Text>
            Bu belge sipariş özetidir, mali değeri yoktur. Resmî faturanız (e-Arşiv) ayrıca düzenlenir.
          </Text>
          <Text>
            Ödeme yöntemi: {orderData.paymentMethod === 'bank_transfer' ? 'Havale / EFT' : orderData.paymentMethod ? 'Kredi / Banka Kartı' : '—'}
          </Text>
        </View>
      </Page>
    </Document>
  )
}
