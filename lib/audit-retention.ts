/**
 * İşlem kaydı saklama politikası (A09): kayıtlar AUDIT_RETENTION_DAYS gün tutulur, daha eskileri günlük görevle silinir
 * (lib/scheduler.ts → audit-retention). Ekrandaki sayfalama saklama süresinden bağımsızdır.
 * Süre AUDIT_RETENTION_DAYS ortam değişkeniyle değiştirilebilir (en az 90 gün).
 */
import { prisma } from '@/lib/prisma'

const DEFAULT_DAYS = 730

export const AUDIT_RETENTION_DAYS = Math.max(90, Number(process.env.AUDIT_RETENTION_DAYS) || DEFAULT_DAYS)

/** Saklama süresini aşan kayıtları siler; silinen sayısını döner */
export async function pruneAuditLog(now = Date.now()): Promise<number> {
  const cutoff = new Date(now - AUDIT_RETENTION_DAYS * 86_400_000)
  const { count } = await prisma.adminAuditLog.deleteMany({ where: { createdAt: { lt: cutoff } } })
  return count
}
