/**
 * Terk edilen sepet hatırlatması (zamanlanmış görevden çağrılır).
 * Koşullar: üye sepeti 24 saat–7 gün arası hareketsiz, bu sepet için hatırlatma gönderilmemiş ve
 * üyenin ticari elektronik ileti izni açık (Firestore users/{uid}.consents.commercialMessages.accepted).
 * Her e-postada iznin nasıl geri alınacağı yazılır (6563 sayılı Kanun — ret hakkı).
 */

import React from 'react'
import { Text, Section } from '@react-email/components'
import { prisma } from '@/lib/prisma'
import { sendEmail } from '@/lib/email'
import { getAdminFirestore } from '@/lib/firebaseAdminServer'
import { priceOrder } from '@/lib/order-pricing'
import { STORE_CONTACT, VAT_RATE } from '@/lib/store-config'
import { EmailLayout, CtaButton, s, fmtTRY } from '@/emails/order/shared'
import { getMarketingConsent } from '@/lib/marketing-consent'

const HOUR = 3_600_000

type Line = { name: string; quantity: number; price: number }

function AbandonedCartEmail({ lines, cartUrl, settingsUrl }: { lines: Line[]; cartUrl: string; settingsUrl: string }) {
  return (
    <EmailLayout preview="Sepetinizdeki ürünler sizi bekliyor" title="Sepetiniz sizi bekliyor">
      <Text style={s.p}>Merhaba,</Text>
      <Text style={s.p}>Sepetinize eklediğiniz ürünleri sizin için sakladık. Siparişinizi tamamlamak için sepetinize dönebilirsiniz.</Text>
      <Section style={s.box}>
        {lines.map((l, i) => (
          <Text key={i} style={s.row}>
            {l.name} × {l.quantity}
            <span style={s.right}> {fmtTRY(l.price * l.quantity)}</span>
          </Text>
        ))}
        <Text style={s.note}>Fiyatlar KDV dahildir ve stok durumuna göre değişebilir.</Text>
      </Section>
      <CtaButton href={cartUrl}>Sepetime Dön</CtaButton>
      <Text style={s.note}>
        Bu e-postayı kampanya ve duyuru iletileri almayı kabul ettiğiniz için aldınız. İzninizi dilediğiniz zaman
        ücretsiz olarak <a href={settingsUrl}>Hesabım &gt; Ayarlar</a> bölümünden kaldırabilir veya bu e-postayı yanıtlayarak
        bildirebilirsiniz.
      </Text>
    </EmailLayout>
  )
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
    // Satıştan kalkan / stoğu biten ürünler atlanır
    const lines: Line[] = []
    for (const item of (Array.isArray(snap.items) ? snap.items : []) as { id: string; quantity: number }[]) {
      try {
        const priced = await priceOrder([item])
        const l = priced.lines[0]
        lines.push({ name: l.name, quantity: l.quantity, price: l.unitPrice * (1 + VAT_RATE / 100) })
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
      'Sepetinizdeki ürünler sizi bekliyor',
      React.createElement(AbandonedCartEmail, { lines, cartUrl: `${site}/cart`, settingsUrl: `${site}/profile?tab=settings` })
    )
    if (res.success) {
      await prisma.cartSnapshot.update({ where: { userId: snap.userId }, data: { remindedAt: new Date() } })
      result.reminded++
    }
  }
  return result
}
