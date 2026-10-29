/**
 * Uygulama içi zamanlayıcı: sunucuda cron kurulmamış olsa da havale süresi takibi ve veritabanı yedeği çalışır.
 * instrumentation.ts sunucu açılışında başlatır (yalnızca Node çalışma zamanı, üretim).
 *
 * - expire-orders: 6 saatte bir (lib/cron-jobs.ts → runExpireOrders)
 * - backup: günde bir (lib/cron-jobs.ts → runBackup)
 * - geliver-tracking: saatte bir (lib/cron-jobs.ts → runGeliverTracking; GELIVER_API_TOKEN yoksa boş geçer)
 * - navlungo-tracking: 2 saatte bir (lib/cron-jobs.ts → runNavlungoTracking; Navlungo yapılandırılmamışsa boş geçer)
 * - audit-retention: günde bir (lib/audit-retention.ts; saklama süresini aşan işlem kayıtlarını siler)
 *
 * Son çalışma zamanı kalıcı klasörde tutulur (lib/scheduler-core.ts); süreç yeniden başlasa da görev erken tekrarlanmaz.
 * Sunucu cron'u da kuruluysa sorun olmaz: HTTP uçları aynı işi yapar, iptal koşullu güncelleme ile tek seferliktir.
 * Kapatmak için INTERNAL_CRON=0. Paylaşımlı barındırmada uygulama ziyaretsiz kalınca uyutulabilir; o durumda görev,
 * uygulama yeniden açıldıktan sonraki ilk turda (≈1 dk) çalışır.
 */
import { acquireLock, isDue, readState, resolveStateDir, writeJobState, type JobOutcome } from './scheduler-core'
import { runBackup, runExpireOrders, runGeliverTracking, runNavlungoTracking } from './cron-jobs'
import { AUDIT_RETENTION_DAYS, pruneAuditLog } from './audit-retention'

const HOUR = 3_600_000
const TICK_MS = 10 * 60_000
const FIRST_TICK_MS = 60_000

/** Görev özeti ve sonucu (A11): kapalı entegrasyon "Başarılı" görünmesin */
type JobResult = { summary: string; outcome: Exclude<JobOutcome, 'error'> }
type Job = { name: string; everyMs: number; run: () => Promise<JobResult> }

const JOBS: Job[] = [
  {
    name: 'expire-orders',
    everyMs: 6 * HOUR,
    run: async () => {
      const r = await runExpireOrders()
      if (r.errors.length) throw new Error(`${r.errors.length} sipariş işlenemedi: ${r.errors.slice(0, 3).join('; ')}`)
      const n = r.expired.length + r.reminded.length
      return { outcome: n ? 'ok' : 'idle', summary: `iptal ${r.expired.length}, hatırlatma ${r.reminded.length}, bildirimli ${r.held.length}, iptal edilen kart ${r.cardUnresolved.length}` }
    },
  },
  {
    name: 'backup',
    everyMs: 24 * HOUR,
    run: async () => {
      const { status, body } = await runBackup()
      // SQLite dışı veritabanı veya yanlış BACKUP_DIR: tekrar denemenin anlamı yok, durum kaydedilir
      if (status === 400) return { outcome: 'skipped', summary: `atlandı: ${String(body.error)}` }
      if (status !== 200) throw new Error(String(body.error ?? `durum ${status}`))
      return { outcome: 'ok', summary: `${String(body.file)} (${Math.round(Number(body.sizeBytes) / 1024)} KB, saklanan ${String(body.kept)}, sunucu dışı: ${String(body.offsite)})` }
    },
  },
  {
    name: 'geliver-tracking',
    everyMs: HOUR,
    run: async () => {
      const r = await runGeliverTracking()
      if (!r.ok) throw new Error(r.error)
      if (!r.enabled) return { outcome: 'disabled', summary: 'Geliver yapılandırılmamış (GELIVER_API_TOKEN yok); görev çalışmadı' }
      if (r.errors.length && r.checked === 0 && r.linked.length === 0) throw new Error(`${r.errors.length} hata: ${r.errors.slice(0, 3).join('; ')}`)
      return {
        outcome: r.checked || r.linked.length ? 'ok' : 'idle',
        summary: `bağlanan ${r.linked.length}, sorgulanan ${r.checked}, kargoya verilen ${r.shipped.length}, teslim ${r.delivered.length}, uyarı ${r.alerts.length}, hata ${r.errors.length}`,
      }
    },
  },
  {
    name: 'navlungo-tracking',
    everyMs: 2 * HOUR,
    run: async () => {
      const r = await runNavlungoTracking()
      if (!r.ok) throw new Error(r.error)
      if (!r.enabled) return { outcome: 'disabled', summary: 'Navlungo yapılandırılmamış (API kullanıcısı yok); görev çalışmadı' }
      if (r.errors.length && r.checked === 0) throw new Error(`${r.errors.length} gönderi sorgulanamadı: ${r.errors.slice(0, 3).join('; ')}`)
      return { outcome: r.checked ? 'ok' : 'idle', summary: `sorgulanan ${r.checked}, teslim ${r.delivered.length}, uyarı ${r.alerts.length}, hata ${r.errors.length}` }
    },
  },
  {
    name: 'audit-retention',
    everyMs: 24 * HOUR,
    run: async () => {
      const n = await pruneAuditLog()
      return { outcome: n ? 'ok' : 'idle', summary: `${AUDIT_RETENTION_DAYS} günden eski ${n} işlem kaydı silindi` }
    },
  },
]

let running = false

export async function runDueJobs(now = Date.now()): Promise<void> {
  if (running) return
  running = true
  try {
    const dir = resolveStateDir()
    const state = await readState(dir)
    for (const job of JOBS) {
      if (!isDue(state[job.name], job.everyMs, now)) continue
      const release = await acquireLock(dir, job.name, now)
      if (!release) continue // başka süreç çalıştırıyor
      try {
        // Kilidi aldıktan sonra yeniden oku: başka süreç az önce bitirmiş olabilir
        const fresh = await readState(dir)
        if (!isDue(fresh[job.name], job.everyMs, Date.now())) continue
        const startedAt = new Date().toISOString()
        try {
          const { summary, outcome } = await job.run()
          // Son başarılı çalışma yalnız gerçekten çalışan görevde ilerler (kapalı/atlanan deneme değiştirmez)
          const lastSuccessAt = outcome === 'ok' || outcome === 'idle' ? startedAt : fresh[job.name]?.lastSuccessAt
          await writeJobState(dir, job.name, { lastRunAt: startedAt, lastOk: outcome === 'ok' || outcome === 'idle', outcome, lastSummary: summary, lastSuccessAt })
          console.log(`[scheduler] ${job.name} (${outcome}): ${summary}`)
        } catch (e) {
          const message = e instanceof Error ? e.message : String(e)
          // Hata da çalışma sayılır: bir sonraki deneme bir periyot sonra (her turda e-posta/uyarı yağmasın)
          await writeJobState(dir, job.name, { lastRunAt: startedAt, lastOk: false, outcome: 'error', lastError: message, lastSuccessAt: fresh[job.name]?.lastSuccessAt })
          console.error(`[scheduler] ${job.name} başarısız: ${message}`)
        }
      } finally {
        await release()
      }
    }
  } catch (e) {
    console.error('[scheduler] tur hatası:', e)
  } finally {
    running = false
  }
}

const g = globalThis as typeof globalThis & { __voltScheduler?: boolean }

export function startInternalScheduler(): void {
  if (g.__voltScheduler) return
  if (process.env.INTERNAL_CRON === '0') return
  if (process.env.NODE_ENV !== 'production' && process.env.INTERNAL_CRON !== '1') return
  g.__voltScheduler = true
  const first = setTimeout(() => void runDueJobs(), FIRST_TICK_MS)
  first.unref?.()
  const every = setInterval(() => void runDueJobs(), TICK_MS)
  every.unref?.()
  console.log(`[scheduler] başladı (durum klasörü: ${resolveStateDir()})`)
}
