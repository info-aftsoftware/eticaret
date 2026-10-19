import { test } from 'node:test'
import assert from 'node:assert/strict'
import os from 'os'
import path from 'path'
import { promises as fs } from 'fs'
import { LOCK_STALE_MS, acquireLock, isDue, readState, resolveStateDir, writeJobState } from '../../lib/scheduler-core'

const HOUR = 3_600_000

test('isDue: hiç çalışmamış görev hemen çalışır', () => {
  assert.equal(isDue(undefined, 6 * HOUR, Date.now()), true)
  assert.equal(isDue({ lastRunAt: 'bozuk' }, 6 * HOUR, Date.now()), true)
})

test('isDue: periyot dolmadan çalışmaz, dolunca çalışır', () => {
  const now = Date.parse('2026-10-19T12:00:00Z')
  assert.equal(isDue({ lastRunAt: '2026-10-19T07:00:00Z' }, 6 * HOUR, now), false)
  assert.equal(isDue({ lastRunAt: '2026-10-19T06:00:00Z' }, 6 * HOUR, now), true)
})

test('isDue: gelecekte görünen son çalışma (saat geri alınmış) beklemez', () => {
  const now = Date.parse('2026-10-19T12:00:00Z')
  assert.equal(isDue({ lastRunAt: '2026-10-20T12:00:00Z' }, 6 * HOUR, now), true)
})

test('resolveStateDir: mutlak SQLite yolunun klasörü, yoksa BACKUP_DIR, yoksa .data', () => {
  const abs = path.resolve('/home/u1/domains/site/voltekno.db')
  assert.equal(resolveStateDir({ DATABASE_URL: `file:${abs}` }, '/app'), path.dirname(abs))
  assert.equal(resolveStateDir({ DATABASE_URL: 'file:./dev.db', BACKUP_DIR: '/var/backups' }, '/app'), path.resolve('/var/backups'))
  assert.equal(resolveStateDir({ DATABASE_URL: 'file:./dev.db' }, '/app'), path.join('/app', '.data'))
  assert.equal(resolveStateDir({ SCHEDULER_STATE_DIR: '/state', DATABASE_URL: `file:${abs}` }, '/app'), path.resolve('/state'))
})

test('durum dosyası: görevler birbirinin kaydını ezmez', async () => {
  const dir = await fs.mkdtemp(path.join(os.tmpdir(), 'sched-'))
  try {
    assert.deepEqual(await readState(dir), {})
    await writeJobState(dir, 'a', { lastRunAt: '2026-10-19T00:00:00Z', lastOk: true })
    await writeJobState(dir, 'b', { lastRunAt: '2026-10-19T01:00:00Z', lastOk: false, lastError: 'x' })
    const state = await readState(dir)
    assert.equal(state.a.lastOk, true)
    assert.equal(state.b.lastError, 'x')
  } finally {
    await fs.rm(dir, { recursive: true, force: true })
  }
})

test('kilit: ikinci süreç alamaz, bırakılınca alınır, sahipsiz eski kilit devralınır', async () => {
  const dir = await fs.mkdtemp(path.join(os.tmpdir(), 'sched-'))
  try {
    const release = await acquireLock(dir, 'job')
    assert.ok(release)
    assert.equal(await acquireLock(dir, 'job'), null)
    await release!()
    const again = await acquireLock(dir, 'job')
    assert.ok(again)
    // Kilit bırakılmadan süreç çöktü: LOCK_STALE_MS sonra devralınır
    assert.ok(await acquireLock(dir, 'job', Date.now() + LOCK_STALE_MS + 1000))
  } finally {
    await fs.rm(dir, { recursive: true, force: true })
  }
})
