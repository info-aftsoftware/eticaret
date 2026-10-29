/**
 * Kayıtlı siparişten iyzico Ödeme Formu isteği kurar (yeni sipariş ve aynı anahtarla tekrar gelen istek aynı yolu kullanır).
 * Sepet: sipariş satırları (KDV dahil satır toplamı) + kargo; kupon/havale indirimi buildBasketItems'ta toplama orantılanır.
 */
import type { Order, OrderLine } from '@prisma/client'
import { initializeCheckoutForm, type IyzicoLine } from '@/lib/payments/iyzico'

function siteBase() {
  return (process.env.NEXT_PUBLIC_SITE_URL || process.env.NEXT_PUBLIC_BASE_URL || 'https://voltekno.com').replace(/\/$/, '')
}

export async function startIyzicoPayment(order: Order & { lines: OrderLine[] }, opts: { ip: string | null; locale?: 'tr' | 'en' }) {
  const lines: IyzicoLine[] = order.lines.map((l, i) => {
    const pid = (l.variantMatrix as { productId?: string } | null)?.productId
    return { id: pid || `satir-${i + 1}`, name: l.productName, category: 'Enerji Ürünleri', amount: l.lineTotal }
  })
  if (order.shippingCost > 0) lines.push({ id: 'kargo', name: 'Kargo', category: 'Kargo', amount: order.shippingCost })

  const billing = {
    name: order.billingName || order.shippingName,
    address: order.billingAddress || order.shippingAddress,
    city: order.billingCity || order.shippingCity,
    district: order.billingDistrict || order.shippingDistrict,
    country: order.billingCountry || 'Türkiye',
    zipCode: order.billingPostalCode,
  }
  return initializeCheckoutForm({
    orderNo: order.orderNo,
    total: order.total,
    callbackUrl: `${siteBase()}/api/payments/iyzico/callback`,
    locale: opts.locale,
    ip: opts.ip,
    buyer: {
      id: order.userId || `misafir-${order.orderNo}`,
      name: order.shippingName,
      email: order.shippingEmail || '',
      phone: order.shippingPhone,
      identityNumber: order.billingType === 'individual' ? order.billingTaxId : null,
    },
    shipping: {
      name: order.shippingName,
      address: order.shippingAddress,
      city: order.shippingCity,
      district: order.shippingDistrict,
      country: order.shippingCountry || 'Türkiye',
      zipCode: order.shippingPostalCode,
    },
    billing,
    lines,
  })
}
