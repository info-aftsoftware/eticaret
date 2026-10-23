/**
 * Uygulama içi zamanlayıcının yan etkisiz çekirdeği: görev durumu (son çalışma) ve süreçler arası kilit.
 * Durum ve kilit dosyaları yayınlar arasında korunan bir klasörde tutulur; böylece yeniden başlatma/yayın
 * görevleri ne erken tekrarlar ne de unutur. Birden fazla Node süreci aynı anda çalışsa da kilit sayesinde
 * bir görev aynı anda yalnızca bir süreçte koşar.
 */
import path from 'path'
import { promises as fs } from 'fs'

/** Kilidi bırakmadan çöken süreç: bu süreden eski kilit sahipsiz sayılır */
export const LOCK_STALE_MS = 30 * 60_000

/**
 * Görevin son çalışma sonucu (A11): ok iş yapıldı · idle çalıştı, yeni kayıt yok · disabled entegrasyon yapılandırılmamış
 * (çalışmadı) · skipped koşul yok (ör. yedeklenecek SQLite yok) · error hata.
 */
export type JobOutcome = 'ok' | 'idle' | 'disabled' | 'skipped' | 'error'

export type JobState = {
  lastRunAt?: string
  lastOk?: boolean
  lastError?: string
  lastSummary?: string
  outcome?: JobOutcome
  /** Son gerçek başarılı çalışma (ok veya idle); kapalı/atlanan/hatalı denemeler bunu değiştirmez */
  lastSuccessAt?: string
}

/** Kayıttaki sonuç; eski kayıtlarda (outcome yok) özetten çıkarılır */
export function jobOutcome(s: JobState | undefined): JobOutcome | null {
  if (!s?.lastRunAt) return null
  if (s.outcome) return s.outcome
  if (!s.lastOk) return 'error'
  if (/^kapalı/i.test(s.lastSummary ?? '')) return 'disabled'
  if (/^atlandı/i.test(s.lastSummary ?? '')) return 'skipped'
  return 'ok'
}
export type SchedulerState = Record<string, JobState>

/**
 * Durum klasörü: SCHEDULER_STATE_DIR → mutlak SQLite yolunun klasörü → BACKUP_DIR → ./.data
 * (Hostinger'da veritabanı derleme klasörünün dışında, mutlak yolda; durum da onun yanında kalıcı olur.)
 */
export function resolveStateDir(env: Partial<Record<string, string>> = process.env, cwd = process.cwd()): string {
  if (env.SCHEDULER_STATE_DIR) return path.resolve(env.SCHEDULER_STATE_DIR)
  const db = env.DATABASE_URL ?? ''
  if (db.startsWith('file:')) {
    const file = db.slice('file:'.length).split('?')[0]
    if (path.isAbsolute(file)) return path.dirname(file)
  }
  if (env.BACKUP_DIR) return path.resolve(env.BACKUP_DIR)
  return path.join(cwd, '.data')
}

/** Görev hiç çalışmadıysa ya da son çalışmadan bu yana everyMs geçtiyse zamanı gelmiştir */
export function isDue(state: JobState | undefined, everyMs: number, now: number): boolean {
  const last = state?.lastRunAt ? Date.parse(state.lastRunAt) : NaN
  if (!Number.isFinite(last)) return true
  // Saat geri alınmışsa (gelecekte görünen son çalışma) beklemek yerine çalıştır
  if (last > now) return true
  return now - last >= everyMs
}

const stateFile = (dir: string) => path.join(dir, 'scheduler-state.json')

export async function readState(dir: string): Promise<SchedulerState> {
  try {
    const parsed = JSON.parse(await fs.readFile(stateFile(dir), 'utf8'))
    return parsed && typeof parsed === 'object' ? (parsed as SchedulerState) : {}
  } catch {
    return {}
  }
}

/** Tek görevin durumunu günceller (diğer görevlerinkini korur); yarım yazılmış dosya kalmasın diye geçici dosya + rename */
export async function writeJobState(dir: string, job: string, value: JobState): Promise<void> {
  await fs.mkdir(dir, { recursive: true })
  const state = await readState(dir)
  state[job] = value
  const tmp = `${stateFile(dir)}.${process.pid}.tmp`
  await fs.writeFile(tmp, JSON.stringify(state, null, 2))
  await fs.rename(tmp, stateFile(dir))
}

/**
 * Süreçler arası kilit (dosyanın özel oluşturulması). Alınamazsa null döner.
 * Sahibi çökmüş, LOCK_STALE_MS'ten eski kilit bir kez silinip yeniden denenir.
 */
export async function acquireLock(dir: string, job: string, now = Date.now()): Promise<(() => Promise<void>) | null> {
  await fs.mkdir(dir, { recursive: true })
  const file = path.join(dir, `scheduler-${job}.lock`)
  for (let attempt = 0; attempt < 2; attempt++) {
    try {
      const handle = await fs.open(file, 'wx')
      await handle.writeFile(JSON.stringify({ pid: process.pid, at: new Date(now).toISOString() }))
      await handle.close()
      return async () => {
        await fs.unlink(file).catch(() => {})
      }
    } catch (e) {
      if ((e as NodeJS.ErrnoException).code !== 'EEXIST') throw e
      const stat = await fs.stat(file).catch(() => null)
      if (stat && now - stat.mtimeMs < LOCK_STALE_MS) return null
      await fs.unlink(file).catch(() => {})
    }
  }
  return null
}
