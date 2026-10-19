/**
 * "Stok gelince haber ver": stoğu biten ürün için e-posta kaydı; ürün stoğa girince bir kez e-posta.
 * processStockAlerts() admin stok güncellemelerinden sonra ve zamanlanmış görevde (cron) çağrılır.
 */

import React from 'react'
import { Text } from '@react-email/components'
import { prisma } from '@/lib/prisma'
import { sendEmail } from '@/lib/email'
import { getMergedProductById } from '@/lib/catalog-merge'
import { STORE_CONTACT } from '@/lib/store-config'
import { EmailLayout, CtaButton, s } from '@/emails/order/shared'

function BackInStockEmail({ productName, productUrl }: { productName: string; productUrl: string }) {
  return (
    <EmailLayout preview={`${productName} yeniden stokta`} title="Beklediğiniz ürün stokta" subtitle={productName}>
      <Text style={s.p}>Merhaba,</Text>
      <Text style={s.p}>
        Haber vermemizi istediğiniz <strong>{productName}</strong> yeniden stoklarımızda. Stoklar sınırlı olabileceği için
        siparişinizi gecikmeden verebilirsiniz.
      </Text>
      <CtaButton href={productUrl}>Ürüne Git</CtaButton>
      <Text style={s.note}>Bu e-postayı, ürün sayfasında “Stok gelince haber ver” talebiniz üzerine yalnızca bir kez gönderiyoruz.</Text>
    </EmailLayout>
  )
}

/** Bekleyen talepleri tarar; stokta olan ürünler için e-posta gönderir. productIds verilirse yalnızca onlar. */
export async function processStockAlerts(productIds?: string[]): Promise<{ notified: number; products: string[] }> {
  const pending = await prisma.stockAlert.findMany({
    where: { notifiedAt: null, ...(productIds?.length ? { productId: { in: productIds } } : {}) },
    orderBy: { createdAt: 'asc' },
    take: 500,
  })
  const byProduct = new Map<string, typeof pending>()
  for (const a of pending) byProduct.set(a.productId, [...(byProduct.get(a.productId) ?? []), a])

  let notified = 0
  const products: string[] = []
  const site = STORE_CONTACT.siteUrl.replace(/\/$/, '')
  for (const [productId, alerts] of byProduct) {
    const product = await getMergedProductById(productId)
    if (!product || (product.stock ?? 0) <= 0) continue
    products.push(productId)
    for (const a of alerts) {
      // Önce talep et, sonra gönder: aynı anda çalışan iki tarama (cron + admin stok güncellemesi) aynı kişiye
      // iki e-posta göndermesin. Gönderim başarısız olursa işaret geri alınır, sonraki taramada yeniden denenir.
      const claimedAt = new Date()
      const claim = await prisma.stockAlert.updateMany({ where: { id: a.id, notifiedAt: null }, data: { notifiedAt: claimedAt } })
      if (claim.count === 0) continue
      let sent = false
      try {
        const res = await sendEmail(
          a.email,
          `${product.name} yeniden stokta`,
          React.createElement(BackInStockEmail, { productName: product.name, productUrl: `${site}/products/${product.slug ?? product.id}` })
        )
        sent = res.success
      } catch (e) {
        console.error('Stock alert email error:', e)
      }
      if (sent) notified++
      else await prisma.stockAlert.updateMany({ where: { id: a.id, notifiedAt: claimedAt }, data: { notifiedAt: null } })
    }
  }
  return { notified, products }
}
