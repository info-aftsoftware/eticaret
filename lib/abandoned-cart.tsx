/**
 * Terk edilen sepet hatırlatması (zamanlanmış görevden çağrılır).
 * Koşullar: üye sepeti 24 saat–7 gün arası hareketsiz, bu sepet için hatırlatma gönderilmemiş ve
 * üyenin ticari elektronik ileti izni açık (Firestore users/{uid}.consents.commercialMessages.accepted).
 * Her e-postada iznin nasıl geri alınacağı yazılır (6563 sayılı Kanun — ret hakkı).
 * Dil: sepetin son güncellendiği site dili (CartSnapshot.locale).
 */

import React from 'react'
import { prisma } from '@/lib/prisma'
import { sendEmail } from '@/lib/email'
import { getAdminFirestore } from '@/lib/firebaseAdminServer'
import { priceOrder, type PricedLine } from '@/lib/order-pricing'
import { STORE_CONTACT, VAT_RATE } from '@/lib/store-config'
import { getMarketingConsent } from '@/lib/marketing-consent'
import { productName, variantLabel, toCatalogLocale, type CatalogLocale } from '@/lib/catalog-en'
import AbandonedCartEmail, { abandonedCartSubject, type AbandonedCartLine } from '@/emails/AbandonedCartEmail'
import { localizePath } from '@/lib/i18n/locale-path'

const HOUR = 3_600_000

/** Kalem adı e-posta dilinde: katalog ürünü ve varyantı İngilizce karşılığıyla (panelde değişmiş ad olduğu gibi) */
function lineName(l: PricedLine, locale: CatalogLocale): string {
  if (locale !== 'en') return l.name
  const base = productName({ id: l.productId, name: l.productName }, locale)
  if (!l.variantKey) return base
  const label = l.name.startsWith(`${l.productName} - `) ? l.name.slice(l.productName.length + 3) : l.variantKey
  return `${base} - ${variantLabel(l.productId, { key: l.variantKey, label }, locale)}`
}

async function hasCommercialConsent(uid: string, email?: string): Promise<boolean> {
  // Önce sunucudaki izin defteri (lib/marketing-consent.ts); kayıt yoksa eski Firestore profili
  const ledger = await getMarketingConsent({ userId: uid, email }).catch(() => null)
  if (ledger !== null) return ledger
  const db = getAdminFirestore()
  if (!db) return false
  try {
    const snap = await db.doc(`users/${uid}`).get()
    return snap.get('consents.commercialMessages.accepted') === true
  } catch {
    return false
  }
}

export async function processAbandonedCarts(opts: { dry?: boolean } = {}) {
  const now = Date.now()
  const candidates = await prisma.cartSnapshot.findMany({
    where: {
      remindedAt: null,
      updatedAt: { lte: new Date(now - 24 * HOUR), gte: new Date(now - 7 * 24 * HOUR) },
    },
    take: 200,
  })
  const site = STORE_CONTACT.siteUrl.replace(/\/$/, '')
  const result = { reminded: 0, skippedNoConsent: 0, skippedEmpty: 0 }

  for (const snap of candidates) {
    if (!(await hasCommercialConsent(snap.userId, snap.email))) {
      result.skippedNoConsent++
      continue
    }
    const locale = toCatalogLocale(snap.locale)
    // Satıştan kalkan / stoğu biten ürünler atlanır
    const lines: AbandonedCartLine[] = []
    for (const item of (Array.isArray(snap.items) ? snap.items : []) as { id: string; quantity: number }[]) {
      try {
        const priced = await priceOrder([item])
        const l = priced.lines[0]
        lines.push({ name: lineName(l, locale), quantity: l.quantity, price: l.unitPrice * (1 + VAT_RATE / 100) })
      } catch {
        // ürün artık satılamıyor
      }
    }
    if (lines.length === 0) {
      result.skippedEmpty++
      continue
    }
    if (opts.dry) {
      result.reminded++
      continue
    }
    const res = await sendEmail(
      snap.email,
      abandonedCartSubject(locale),
      React.createElement(AbandonedCartEmail, { lines, cartUrl: `${site}${localizePath('/cart', locale)}`, settingsUrl: `${site}${localizePath('/profile?tab=settings', locale)}`, locale })
    )
    if (res.success) {
      await prisma.cartSnapshot.update({ where: { userId: snap.userId }, data: { remindedAt: new Date() } })
      result.reminded++
    }
  }
  return result
}
