/**
 * Fatura PDF oluşturur ve müşteriye e-posta eki olarak gönderir.
 * Fatura kişisel veri içerdiği için herkese açık bir adrese YÜKLENMEZ; müşteri ayrıca sipariş sayfasından
 * yetkili olarak indirebilir (GET /api/orders/by-no/[orderNo]/documents?type=invoice).
 */

import { generateInvoicePDF } from './pdf'
import { sendEmail } from './email'
import type { InvoiceData } from './invoice-data'

const escapeHtml = (s: string) =>
  s.replace(/[&<>"']/g, (c) => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' })[c]!)

export async function generateAndSendInvoice(
  orderId: string,
  orderData: InvoiceData,
  customerEmail: string
): Promise<{ sent: boolean; error?: string }> {
  if (!customerEmail?.trim()) {
    return { sent: false, error: 'Müşteri e-postası yok' }
  }

  try {
    const pdfBuffer = await generateInvoicePDF(orderId, orderData)

    const htmlBody = `
      <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
        <h2>Faturanız</h2>
        <p>Merhaba ${escapeHtml(orderData.customer.name || '')},</p>
        <p><strong>Sipariş No:</strong> ${escapeHtml(orderId)}</p>
        <p>Faturanız bu e-postanın ekindedir. Faturanızı ayrıca sipariş sayfanızdan da indirebilirsiniz.</p>
        <p>İyi günler,<br>Voltekno</p>
      </div>
    `

    const result = await sendEmail(
      customerEmail,
      `Fatura - ${orderId}`,
      htmlBody,
      [{ filename: `fatura-${orderId}.pdf`, content: pdfBuffer, contentType: 'application/pdf' }]
    )

    return result.success ? { sent: true } : { sent: false, error: result.error }
  } catch (error) {
    console.error('generateAndSendInvoice error:', error)
    return {
      sent: false,
      error: error instanceof Error ? error.message : 'Fatura gönderilemedi',
    }
  }
}
