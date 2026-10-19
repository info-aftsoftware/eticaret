/**
 * Ticari elektronik ileti izni — kendi veritabanımızda (Prisma) güncel durum + tarihli değişiklik kaydı.
 * İYS'ye yükleme ve ispat için: kim, ne zaman, hangi kanaldan, hangi kaynaktan izin verdi / geri aldı.
 * Eski kayıtlar Firestore users/{uid}.consents.commercialMessages'ta kalabilir; okuyucular önce burayı kullanır.
 */
import { prisma } from '@/lib/prisma'

export type ConsentSource = 'kayit' | 'hesap' | 'odeme' | 'bulten'
export const CONSENT_SOURCES: Record<ConsentSource, string> = {
  kayit: 'Üyelik formu',
  hesap: 'Hesap ayarları',
  odeme: 'Ödeme sayfası',
  bulten: 'Bülten formu',
}

export async function setMarketingConsent(input: {
  email: string
  userId?: string | null
  name?: string | null
  accepted: boolean
  source: ConsentSource
  ip?: string | null
  userAgent?: string | null
}): Promise<void> {
  const email = input.email.trim().toLowerCase()
  const channels = input.accepted ? 'email,sms' : ''
  await prisma.$transaction([
    prisma.marketingConsent.upsert({
      where: { email },
      create: { email, userId: input.userId ?? null, name: input.name ?? null, accepted: input.accepted, channels, source: input.source },
      update: { accepted: input.accepted, channels, source: input.source, ...(input.userId ? { userId: input.userId } : {}), ...(input.name ? { name: input.name } : {}) },
    }),
    prisma.marketingConsentLog.create({
      data: {
        email,
        userId: input.userId ?? null,
        accepted: input.accepted,
        channels,
        source: input.source,
        ip: input.ip?.slice(0, 64) ?? null,
        userAgent: input.userAgent?.slice(0, 300) ?? null,
      },
    }),
  ])
}

/** Üye veya e-posta için güncel izin; kayıt yoksa null (Firestore'a geri düşülebilir) */
export async function getMarketingConsent(who: { userId?: string | null; email?: string | null }): Promise<boolean | null> {
  const or = [
    ...(who.userId ? [{ userId: who.userId }] : []),
    ...(who.email ? [{ email: who.email.trim().toLowerCase() }] : []),
  ]
  if (!or.length) return null
  const row = await prisma.marketingConsent.findFirst({ where: { OR: or }, orderBy: { updatedAt: 'desc' } })
  return row ? row.accepted : null
}
