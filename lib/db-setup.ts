/**
 * SQLite çalışma ayarları (sunucu açılışında bir kez, instrumentation.ts):
 * - journal_mode=WAL: okumalar yazmayı beklemez, eşzamanlı siparişlerde "database is locked" riski azalır (dosyada kalıcıdır)
 * - synchronous=NORMAL: WAL ile önerilen dayanıklılık/hız dengesi
 * PostgreSQL vb. kullanılırsa hiçbir şey yapmaz.
 */
import { prisma } from '@/lib/prisma'

export async function applySqlitePragmas(): Promise<string | null> {
  if (!(process.env.DATABASE_URL ?? '').startsWith('file:')) return null
  try {
    const rows = (await prisma.$queryRawUnsafe('PRAGMA journal_mode=WAL')) as { journal_mode?: string }[]
    await prisma.$queryRawUnsafe('PRAGMA synchronous=NORMAL')
    const mode = rows?.[0]?.journal_mode ?? 'bilinmiyor'
    console.log(`[db] SQLite journal_mode=${mode}`)
    return mode
  } catch (e) {
    console.error('[db] SQLite ayarları uygulanamadı:', e)
    return null
  }
}
