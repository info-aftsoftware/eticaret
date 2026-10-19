/**
 * Yorum isteme e-postası: teslimattan 7 gün sonra müşteriye siparişteki ürünlerin değerlendirme bağlantıları gider.
 * Sipariş başına bir kez (OrderEvent type 'review-request'); 30 günden eski teslimatlar atlanır.
 * Zamanlayıcıdaki havale takibi görevinden çağrılır (lib/cron-jobs.ts). REVIEW_REQUESTS=0 kapatır.
 */
import { prisma } from '@/lib/prisma'
import { sendEmail } from '@/lib/email'
import { logOrderEvent } from '@/lib/order-service'

const DAY = 86_400_000
const SITE_URL = (process.env.NEXT_PUBLIC_SITE_URL || process.env.NEXT_PUBLIC_BASE_URL || 'https://voltekno.com').replace(/\/$/, '')

const esc = (v: string) => v.replace(/[&<>"']/g, (c) => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' })[c]!)

export async function processReviewRequests({ dry = false } = {}): Promise<{ sent: string[]; skipped: number } | { disabled: true }> {
  if (process.env.REVIEW_REQUESTS === '0') return { disabled: true }
  const now = Date.now()
  const orders = await prisma.order.findMany({
    where: {
      status: 'DELIVERED',
      deliveredAt: { lt: new Date(now - 7 * DAY), gt: new Date(now - 30 * DAY) },
      events: { none: { type: 'review-request' } },
    },
    select: { id: true, orderNo: true, shippingEmail: true, billingName: true, lines: { select: { productName: true, variantMatrix: true } } },
    take: 50,
  })
  const sent: string[] = []
  let skipped = 0
  for (const o of orders) {
    const to = o.shippingEmail?.trim()
    const products = new Map<string, string>()
    for (const l of o.lines) {
      const id = (l.variantMatrix as { productId?: string } | null)?.productId
      if (id && !products.has(id)) products.set(id, l.productName)
    }
    if (!to || !products.size) {
      skipped++
      if (!dry) await logOrderEvent(o.id, { type: 'review-request', message: 'Yorum isteği gönderilmedi (e-posta veya ürün yok).', visibleToCustomer: false })
      continue
    }
    if (dry) {
      sent.push(o.orderNo)
      continue
    }
    const first = o.billingName?.split(' ')[0] ?? ''
    const items = [...products]
      .map(([id, name]) => `<li style="margin:6px 0"><a href="${SITE_URL}/products/${encodeURIComponent(id)}#degerlendirmeler" style="color:#0b2540">${esc(name)}</a></li>`)
      .join('')
    const res = await sendEmail(
      to,
      `Siparişiniz nasıldı? ${o.orderNo}`,
      `<div style="font-family:Arial,sans-serif;max-width:600px;color:#121926;line-height:1.5">
        <p>Merhaba${first ? ` ${esc(first)}` : ''},</p>
        <p>${esc(o.orderNo)} numaralı siparişinizi teslim aldığınızı umuyoruz. Ürünleri kullandıysanız kısa bir değerlendirme yazarak diğer müşterilere yardımcı olabilirsiniz:</p>
        <ul style="padding-left:18px">${items}</ul>
        <p style="color:#5d6e80;font-size:13px">Değerlendirmeniz incelendikten sonra yayınlanır; bu ürünü bizden aldığınız için "Doğrulanmış alıcı" olarak işaretlenir. Bu e-posta siparişinizle ilgili tek seferlik bir hatırlatmadır.</p>
      </div>`
    )
    const ok = !(res && (res as { success?: boolean }).success === false)
    await logOrderEvent(o.id, { type: 'review-request', message: ok ? 'Yorum isteği e-postası gönderildi.' : 'Yorum isteği e-postası gönderilemedi.', visibleToCustomer: false })
    if (ok) sent.push(o.orderNo)
  }
  return { sent, skipped }
}
