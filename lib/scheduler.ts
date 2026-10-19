/**
 * Uygulama içi zamanlayıcı: sunucuda cron kurulmamış olsa da havale süresi takibi ve veritabanı yedeği çalışır.
 * instrumentation.ts sunucu açılışında başlatır (yalnızca Node çalışma zamanı, üretim).
 *
 * - expire-orders: 6 saatte bir (lib/cron-jobs.ts → runExpireOrders)
 * - backup: günde bir (lib/cron-jobs.ts → runBackup)
 *
 * Son çalışma zamanı kalıcı klasörde tutulur (lib/scheduler-core.ts); süreç yeniden başlasa da görev erken tekrarlanmaz.
 * Sunucu cron'u da kuruluysa sorun olmaz: HTTP uçları aynı işi yapar, iptal koşullu güncelleme ile tek seferliktir.
 * Kapatmak için INTERNAL_CRON=0. Paylaşımlı barındırmada uygulama ziyaretsiz kalınca uyutulabilir; o durumda görev,
 * uygulama yeniden açıldıktan sonraki ilk turda (≈1 dk) çalışır.
 */
import { acquireLock, isDue, readState, resolveStateDir, writeJobState } from './scheduler-core'
import { runBackup, runExpireOrders } from './cron-jobs'

const HOUR = 3_600_000
const TICK_MS = 10 * 60_000
const FIRST_TICK_MS = 60_000

type Job = { name: string; everyMs: number; run: () => Promise<string> }

const JOBS: Job[] = [
  {
    name: 'expire-orders',
    everyMs: 6 * HOUR,
    run: async () => {
      const r = await runExpireOrders()
      if (r.errors.length) throw new Error(`${r.errors.length} sipariş işlenemedi: ${r.errors.slice(0, 3).join('; ')}`)
      return `iptal ${r.expired.length}, hatırlatma ${r.reminded.length}, bildirimli bekleyen ${r.held.length}, sonuçsuz kart ${r.cardUnresolved.length}`
    },
  },
  {
    name: 'backup',
    everyMs: 24 * HOUR,
    run: async () => {
      const { status, body } = await runBackup()
      // SQLite dışı veritabanı veya yanlış BACKUP_DIR: tekrar denemenin anlamı yok, durum kaydedilir
      if (status === 400) return `atlandı: ${String(body.error)}`
      if (status !== 200) throw new Error(String(body.error ?? `durum ${status}`))
      return `${String(body.file)} (${Math.round(Number(body.sizeBytes) / 1024)} KB, saklanan ${String(body.kept)})`
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
          const summary = await job.run()
          await writeJobState(dir, job.name, { lastRunAt: startedAt, lastOk: true, lastSummary: summary })
          console.log(`[scheduler] ${job.name}: ${summary}`)
        } catch (e) {
          const message = e instanceof Error ? e.message : String(e)
          // Hata da çalışma sayılır: bir sonraki deneme bir periyot sonra (her turda e-posta/uyarı yağmasın)
          await writeJobState(dir, job.name, { lastRunAt: startedAt, lastOk: false, lastError: message })
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
