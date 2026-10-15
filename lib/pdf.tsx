import React from 'react'
import { renderToBuffer } from '@react-pdf/renderer'
import { InvoiceDocument } from './invoice'

export async function generateInvoicePDF(
  orderId: string,
  orderData: any
): Promise<Buffer> {
  try {
    const pdfBuffer = await renderToBuffer(
      <InvoiceDocument orderId={orderId} orderData={orderData} />
    )
    return pdfBuffer
  } catch (error) {
    console.error('PDF generation error:', error)
    throw new Error('Failed to generate invoice PDF')
  }
}
