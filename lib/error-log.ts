/**
 * Hata kaydı: sunucu (reportError) ve tarayıcı (/api/client-errors) hataları ErrorLog tablosunda toplanır.
 * Aynı kaynak + bağlam + mesaj tek satırdır (sayaç artar); kayıt başarısız olsa da akışı bozmaz.
 */
import crypto from 'crypto'
import { prisma } from '@/lib/prisma'

export type ErrorEntry = {
  source: 'server' | 'client'
  context: string
  message: string
  stack?: string
  url?: string
  details?: Record<string, unknown> | string
}

const clip = (s: string | undefined, n: number) => (s ? s.slice(0, n) : undefined)

/** Mesajdaki değişken kısımları (sayılar, kimlikler) gruplamada yok sayar: aynı hata tek satırda toplansın */
export function errorFingerprint(e: Pick<ErrorEntry, 'source' | 'context' | 'message'>): string {
  const normalized = e.message
    .replace(/[0-9a-f]{8,}/gi, '#')
    .replace(/\d+/g, '#')
    .slice(0, 300)
  return crypto.createHash('sha1').update(`${e.source}|${e.context}|${normalized}`).digest('hex')
}

export async function recordError(e: ErrorEntry): Promise<void> {
  try {
    const fingerprint = errorFingerprint(e)
    const details = typeof e.details === 'string' ? e.details : e.details ? JSON.stringify(e.details) : undefined
    await prisma.errorLog.upsert({
      where: { fingerprint },
      create: {
        fingerprint,
        source: e.source,
        context: clip(e.context, 120)!,
        message: clip(e.message, 1000)!,
        stack: clip(e.stack, 4000),
        url: clip(e.url, 500),
        details: clip(details, 2000),
      },
      update: { count: { increment: 1 }, lastSeenAt: new Date(), stack: clip(e.stack, 4000), url: clip(e.url, 500) },
    })
  } catch (err) {
    console.error('recordError failed:', err)
  }
}

/** 30 günden eski hata kayıtlarını siler (zamanlayıcı) */
export async function pruneErrors(days = 30): Promise<number> {
  const { count } = await prisma.errorLog.deleteMany({ where: { lastSeenAt: { lt: new Date(Date.now() - days * 86_400_000) } } })
  return count
}
