import { sendEmail } from './email'
import { updateOrderStatus } from './admin'
import OrderConfirmation from '../emails/OrderConfirmation'
import AdminNewOrder from '../emails/AdminNewOrder'
import ShipmentNotice from '../emails/ShipmentNotice'
import RFQAdminNotification from '../emails/RFQAdminNotification'
import RFQCustomerConfirmation from '../emails/RFQCustomerConfirmation'
import QuoteReady from '../emails/QuoteReady'

/** HTML e-posta gövdesine yerleştirilen kullanıcı girdisini kaçışlar (HTML enjeksiyonuna karşı). */
const esc = (v: unknown) =>
  String(v ?? '').replace(/[&<>"']/g, (c) => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' })[c]!)

export interface NotificationData {
  orderId: string
  orderData: any
  customer: any
  config?: any
  choices?: any
  pricing?: any
}

// Sipariş oluşturuldu e-postası: müşteriye "Siparişiniz oluşturuldu" + sipariş numarası
export async function sendOrderConfirmation(data: NotificationData): Promise<boolean> {
  try {
    const result = await sendEmail(
      data.customer.email,
      `Siparişiniz oluşturuldu - ${data.orderId}`,
      OrderConfirmation({
        orderId: data.orderId,
        orderData: data
      })
    )
    
    return result.success
  } catch {
    return false
  }
}

// Send new order notification to admin
export async function sendAdminNewOrderNotification(data: NotificationData): Promise<boolean> {
  try {
    const adminEmail = process.env.ADMIN_EMAIL || 'info@voltekno.com'
    
    const result = await sendEmail(
      adminEmail,
      `Yeni Sipariş - ${data.orderId}`,
      AdminNewOrder({
        orderId: data.orderId,
        orderData: data
      })
    )
    
    return result.success
  } catch {
    return false
  }
}

// Send shipment notice to customer
export async function sendShipmentNotice(data: NotificationData, trackingNumber: string): Promise<boolean> {
  try {
    const result = await sendEmail(
      data.customer.email,
      `Kargo Takip Bilgisi - ${data.orderId}`,
      ShipmentNotice({
        orderId: data.orderId,
        orderData: {
          ...data,
          trackingNumber
        }
      })
    )
    
    return result.success
  } catch {
    return false
  }
}

// Send order status update to customer
export async function sendOrderStatusUpdate(data: NotificationData, newStatus: string): Promise<boolean> {
  try {
    const statusMessages = {
      confirmed: {
        subject: `Sipariş Onaylandı - ${data.orderId}`,
        message: 'Siparişiniz onaylanmıştır ve işleme alınmıştır.'
      },
      processing: {
        subject: `Sipariş İşleme Alındı - ${data.orderId}`,
        message: 'Siparişiniz üretim aşamasına geçmiştir.'
      },
      shipped: {
        subject: `Sipariş Kargoya Verildi - ${data.orderId}`,
        message: 'Siparişiniz kargoya verilmiştir.'
      },
      delivered: {
        subject: `Sipariş Teslim Edildi - ${data.orderId}`,
        message: 'Siparişiniz başarıyla teslim edilmiştir.'
      },
      cancelled: {
        subject: `Sipariş İptal Edildi - ${data.orderId}`,
        message: 'Siparişiniz iptal edilmiştir.'
      }
    }

    const statusInfo = statusMessages[newStatus as keyof typeof statusMessages]
    if (!statusInfo) return false

    const result = await sendEmail(
      data.customer.email,
      statusInfo.subject,
      `
        <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
          <h2>Sipariş Durumu Güncellendi</h2>
          <p>Merhaba ${esc(data.customer.name)},</p>
          <p>${statusInfo.message}</p>
          <p><strong>Sipariş No:</strong> ${data.orderId}</p>
          <p><strong>Yeni Durum:</strong> ${newStatus}</p>
          <p>Detaylı bilgi için admin panelimizi ziyaret edebilirsiniz.</p>
          <p>İyi günler,<br>Voltekno Ekibi</p>
        </div>
      `
    )
    
    return result.success
  } catch {
    return false
  }
}

// Send payment confirmation to customer
export async function sendPaymentConfirmation(data: NotificationData): Promise<boolean> {
  try {
    const result = await sendEmail(
      data.customer.email,
      `Ödeme Onayı - ${data.orderId}`,
      `
        <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
          <h2>Ödemeniz Onaylandı</h2>
          <p>Merhaba ${esc(data.customer.name)},</p>
          <p>Siparişiniz için yapılan ödeme başarıyla onaylanmıştır.</p>
          <p><strong>Sipariş No:</strong> ${data.orderId}</p>
          <p><strong>Ödeme Tutarı:</strong> ${data.pricing?.total || 0} ₺</p>
          <p>Siparişiniz işleme alınacaktır.</p>
          <p>İyi günler,<br>Voltekno Ekibi</p>
        </div>
      `
    )
    
    return result.success
  } catch {
    return false
  }
}

// Send payment failure notification to customer
export async function sendPaymentFailureNotification(data: NotificationData): Promise<boolean> {
  try {
    const result = await sendEmail(
      data.customer.email,
      `Ödeme Hatası - ${data.orderId}`,
      `
        <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
          <h2>Ödeme İşlemi Başarısız</h2>
          <p>Merhaba ${esc(data.customer.name)},</p>
          <p>Siparişiniz için yapılan ödeme işlemi başarısız olmuştur.</p>
          <p><strong>Sipariş No:</strong> ${data.orderId}</p>
          <p>Lütfen ödeme bilgilerinizi kontrol ederek tekrar deneyiniz.</p>
          <p>Herhangi bir sorunuz olursa bizimle iletişime geçebilirsiniz.</p>
          <p>İyi günler,<br>Voltekno Ekibi</p>
        </div>
      `
    )
    
    return result.success
  } catch {
    return false
  }
}

// Send refund notification to customer
export async function sendRefundNotification(data: NotificationData, refundAmount: number): Promise<boolean> {
  try {
    const result = await sendEmail(
      data.customer.email,
      `İade İşlemi - ${data.orderId}`,
      `
        <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
          <h2>İade İşlemi Tamamlandı</h2>
          <p>Merhaba ${esc(data.customer.name)},</p>
          <p>Siparişiniz için iade işlemi başarıyla tamamlanmıştır.</p>
          <p><strong>Sipariş No:</strong> ${data.orderId}</p>
          <p><strong>İade Tutarı:</strong> ${refundAmount} ₺</p>
          <p>İade tutarı 3-5 iş günü içinde hesabınıza yansıyacaktır.</p>
          <p>İyi günler,<br>Voltekno Ekibi</p>
        </div>
      `
    )
    
    return result.success
  } catch {
    return false
  }
}

// Send low stock notification to admin
export async function sendLowStockNotification(productName: string, currentStock: number, minStock: number): Promise<boolean> {
  try {
    const adminEmail = process.env.ADMIN_EMAIL || 'info@voltekno.com'
    
    const result = await sendEmail(
      adminEmail,
      `Düşük Stok Uyarısı - ${productName}`,
      `
        <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
          <h2>Düşük Stok Uyarısı</h2>
          <p>Merhaba Admin,</p>
          <p>Aşağıdaki ürünün stok seviyesi kritik seviyeye düşmüştür:</p>
          <p><strong>Ürün:</strong> ${productName}</p>
          <p><strong>Mevcut Stok:</strong> ${currentStock}</p>
          <p><strong>Minimum Stok:</strong> ${minStock}</p>
          <p>Lütfen stok takviyesi yapınız.</p>
          <p>İyi günler,<br>Sistem</p>
        </div>
      `
    )
    
    return result.success
  } catch {
    return false
  }
}

// Send system error notification to admin
export async function sendSystemErrorNotification(error: string, context: string): Promise<boolean> {
  try {
    const adminEmail = process.env.ADMIN_EMAIL || 'info@voltekno.com'
    
    const result = await sendEmail(
      adminEmail,
      `Sistem Hatası - ${new Date().toLocaleDateString('tr-TR')}`,
      `
        <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
          <h2>Sistem Hatası Bildirimi</h2>
          <p>Merhaba Admin,</p>
          <p>Sistemde bir hata oluşmuştur:</p>
          <p><strong>Hata:</strong> ${error}</p>
          <p><strong>Bağlam:</strong> ${context}</p>
          <p><strong>Tarih:</strong> ${new Date().toLocaleString('tr-TR')}</p>
          <p>Lütfen hatayı inceleyiniz.</p>
          <p>İyi günler,<br>Sistem</p>
        </div>
      `
    )
    
    return result.success
  } catch {
    return false
  }
}

// RFQ (Teklif Talebi) bildirimleri
export interface RFQNotificationData {
  id: string
  companyName: string
  contactName: string
  contactEmail: string
  contactPhone?: string | null
  targetQty?: number | null
  targetPrice?: number | null
  targetCurrency?: string | null
  notes?: string | null
  createdAt: Date
  items: Array<{
    description: string
    quantity: number
    unitPrice?: number | null
    mpn?: string | null
    sku?: string | null
    notes?: string | null
    serviceSlug?: string
    designFileUrl?: string
  }>
}

export async function sendRFQAdminNotification(data: RFQNotificationData): Promise<boolean> {
  try {
    const adminEmail = process.env.ADMIN_EMAIL || process.env.SMTP_EMAIL || process.env.SMTP_USER || 'info@voltekno.com'
    const result = await sendEmail(
      adminEmail,
      `Yeni Teklif Talebi - ${data.companyName}`,
      RFQAdminNotification({
        rfqId: data.id,
        companyName: data.companyName,
        contactName: data.contactName,
        contactEmail: data.contactEmail,
        contactPhone: data.contactPhone,
        targetQty: data.targetQty,
        targetPrice: data.targetPrice,
        targetCurrency: data.targetCurrency,
        notes: data.notes,
        items: data.items,
        createdAt: new Date(data.createdAt).toLocaleString('tr-TR'),
      })
    )
    return result.success
  } catch {
    return false
  }
}

export async function sendRFQCustomerConfirmation(data: RFQNotificationData): Promise<boolean> {
  try {
    const result = await sendEmail(
      data.contactEmail,
      'Teklif Talebiniz Alındı - Voltekno',
      RFQCustomerConfirmation({
        contactName: data.contactName,
        companyName: data.companyName,
        rfqId: data.id,
        itemCount: data.items.length,
      })
    )
    return result.success
  } catch {
    return false
  }
}

/** Admin fiyat verdiğinde müşteriye "Teklif hazır" e-postası (Tekliflerim linki ile) */
export async function sendQuoteReadyToCustomer(data: {
  contactEmail: string
  contactName: string
  companyName: string
  rfqId: string
  itemCount: number
}): Promise<boolean> {
  try {
    const baseUrl =
      process.env.NEXT_PUBLIC_SITE_URL ||
      (process.env.VERCEL_URL ? `https://${process.env.VERCEL_URL}` : 'https://voltekno.com')
    const tekliflerimUrl = `${String(baseUrl).replace(/\/$/, '')}/tekliflerim`
    const result = await sendEmail(
      data.contactEmail,
      'Fiyat Teklifiniz Hazır - Voltekno',
      QuoteReady({
        contactName: data.contactName,
        companyName: data.companyName,
        rfqId: data.rfqId,
        itemCount: data.itemCount,
        tekliflerimUrl,
      })
    )
    return result.success
  } catch {
    return false
  }
}
