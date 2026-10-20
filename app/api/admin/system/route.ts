export const dynamic = 'force-dynamic'

import path from 'path'
import { promises as fs } from 'fs'
import { NextRequest, NextResponse } from 'next/server'
import { isNavlungoEnabled, navlungoConfigFromEnv } from '@/lib/shipping/navlungo-api'
import { checkAdmin } from '@/lib/adminAuth'
import { prisma } from '@/lib/prisma'
import { backupDir, runBackup } from '@/lib/cron-jobs'
import { readState, resolveStateDir } from '@/lib/scheduler-core'

function navlungoHint(): string {
  const c = navlungoConfigFromEnv()
  if (!c) return 'NAVLUNGO_API_USERNAME, NAVLUNGO_API_PASSWORD ve NAVLUNGO_SENDER_ADDRESS_ID girilince sipariş sayfasında Navlungo gönderisi oluşturma açılır (API kullanıcısı: Navlungo paneli > Entegrasyonlar).'
  return c.testMode ? 'QA (test) ortamı açık. Gerçek gönderiler için NAVLUNGO_TEST_MODE=0 ve üretim hesabının API kullanıcısı.' : 'Üretim ortamı.'
}

type Check = { key: string; label: string; ok: boolean; level: 'error' | 'warn' | 'info'; hint: string }

const has = (k: string) => Boolean(process.env[k]?.trim())

/** Gizli değer döndürmeden yapılandırma kontrolü: neyin eksik olduğu ve ne işe yaradığı */
async function configChecks(): Promise<Check[]> {
  const db = process.env.DATABASE_URL ?? ''
  const dbFile = db.startsWith('file:') ? db.slice(5).split('?')[0] : ''
  const backups = backupDir()
  const smtpFrom = process.env.SMTP_FROM || process.env.SMTP_USER || ''
  const [admins, admins2fa] = await Promise.all([
    prisma.adminUser.count({ where: { active: true } }),
    prisma.adminUser.count({ where: { active: true, totpEnabled: true } }),
  ])
  return [
    { key: 'db', label: 'Veritabanı kalıcı konumda', ok: !dbFile || path.isAbsolute(dbFile), level: 'error', hint: 'DATABASE_URL mutlak yol olmalı (derleme klasörü her yayında silinir).' },
    { key: 'backup-dir', label: 'Yedek klasörü derleme dışında', ok: has('BACKUP_DIR') && path.isAbsolute(backups), level: 'warn', hint: 'BACKUP_DIR mutlak bir yol olmalı; tanımsızsa yedekler derleme klasörüne yazılır ve yayında silinir.' },
    { key: 'smtp', label: 'E-posta gönderimi', ok: has('SMTP_HOST') && has('SMTP_USER') && has('SMTP_PASSWORD'), level: 'error', hint: 'Sipariş, kargo, şifre ve yedek e-postaları için SMTP_HOST, SMTP_USER, SMTP_PASSWORD.' },
    { key: 'smtp-domain', label: 'Gönderen adresi alan adıyla uyumlu', ok: /@voltekno\.com$/i.test(smtpFrom), level: 'warn', hint: 'Spam klasörüne düşmemek için gönderen @voltekno.com olmalı (SMTP_FROM / SMTP_USER).' },
    { key: 'admin-email', label: 'Yönetici uyarı / yedek alıcısı', ok: has('ADMIN_EMAIL') || has('BACKUP_EMAIL'), level: 'warn', hint: 'Hata uyarıları ve günlük yedek ADMIN_EMAIL (veya BACKUP_EMAIL) adresine gider; tanımsızsa mağaza iletişim adresi kullanılır.' },
    { key: 'admins', label: 'Kişisel yönetici hesapları', ok: admins > 0, level: 'warn', hint: 'Kullanıcılar sayfasından herkese ayrı hesap açın; ortak ana şifre işlem kaydında kimin ne yaptığını gizler.' },
    { key: 'admins-2fa', label: 'Tüm yönetici hesaplarında iki adımlı doğrulama', ok: admins > 0 && admins2fa === admins, level: 'warn', hint: `${admins2fa}/${admins} hesapta açık. Her kullanıcı Hesabım sayfasından açabilir.` },
    { key: 'master-2fa', label: 'Ana yönetici şifresinde iki adımlı doğrulama', ok: !has('ADMIN_TOKEN') || has('ADMIN_TOTP_SECRET'), level: 'warn', hint: 'ADMIN_TOKEN tanımlıysa ADMIN_TOTP_SECRET de tanımlanmalı (node scripts/admin-2fa-setup.mjs) ya da kişisel hesaplara geçince ADMIN_TOKEN kaldırılmalı.' },
    { key: 'pos', label: 'Kartla ödeme (sanal POS)', ok: has('POS_CLIENT_ID') && has('POS_STORE_KEY') && has('POS_GATEWAY_URL'), level: 'info', hint: 'Banka sanal POS bilgileri girilince ödeme sayfasında kart seçeneği açılır.' },
    { key: 'navlungo', label: 'Navlungo gönderi entegrasyonu', ok: isNavlungoEnabled(), level: 'info', hint: navlungoHint() },
    { key: 'firebase-admin', label: 'Firebase servis hesabı', ok: has('FIREBASE_ADMIN_PRIVATE_KEY') && process.env.FIREBASE_ADMIN_PROJECT_ID === process.env.NEXT_PUBLIC_FIREBASE_PROJECT_ID, level: 'warn', hint: 'Markalı doğrulama/şifre e-postaları ve hesap silme için; proje kimliği istemci yapılandırmasıyla aynı olmalı (FIREBASE_SETUP.md).' },
    { key: 'site-url', label: 'Site adresi', ok: has('NEXT_PUBLIC_SITE_URL'), level: 'warn', hint: 'Canonical, site haritası ve e-postalardaki bağlantılar için NEXT_PUBLIC_SITE_URL.' },
    { key: 'indexing', label: 'Arama motorlarına açık', ok: process.env.NEXT_PUBLIC_NOINDEX !== 'true', level: 'info', hint: 'NEXT_PUBLIC_NOINDEX=true: test ortamı, arama motorlarına kapalı. Canlı alan adında kaldırılmalı.' },
  ]
}

async function listBackups() {
  const dir = backupDir()
  try {
    const names = (await fs.readdir(dir)).filter((f) => /^voltekno-[\w-]+\.db$/.test(f))
    // Stats alanları açıkça okunur (Node 22+ mtime gibi alanları nesne yayılımında kopyalamaz)
    const rows = await Promise.all(
      names.map(async (name) => {
        const st = await fs.stat(path.join(dir, name))
        return { name, sizeBytes: st.size, createdAt: st.mtime }
      })
    )
    return rows.sort((a, b) => +b.createdAt - +a.createdAt)
  } catch {
    return []
  }
}

async function dbInfo() {
  const t0 = Date.now()
  try {
    await prisma.$queryRawUnsafe('SELECT 1')
    const ms = Date.now() - t0
    const url = process.env.DATABASE_URL ?? ''
    if (!url.startsWith('file:')) return { ok: true, ms, engine: 'sunucu', sizeBytes: null, journalMode: null }
    const file = path.resolve(path.join(process.cwd(), 'prisma'), url.slice(5).split('?')[0])
    const size = await fs.stat(file).then((s) => s.size).catch(() => null)
    const mode = ((await prisma.$queryRawUnsafe('PRAGMA journal_mode')) as { journal_mode?: string }[])?.[0]?.journal_mode ?? null
    return { ok: true, ms, engine: 'SQLite', sizeBytes: size, journalMode: mode }
  } catch {
    return { ok: false, ms: Date.now() - t0, engine: null, sizeBytes: null, journalMode: null }
  }
}

/** Sistem durumu: veritabanı, zamanlanmış görevler, yedekler, hatalar, yapılandırma (Sahip ve Yönetici) */
export async function GET(request: NextRequest) {
  const auth = await checkAdmin(request)
  if (!('ok' in auth)) return NextResponse.json({ success: false, error: auth.error }, { status: auth.status })
  const [db, scheduler, backups, errors, checks] = await Promise.all([
    dbInfo(),
    readState(resolveStateDir()),
    listBackups(),
    prisma.errorLog.findMany({ orderBy: { lastSeenAt: 'desc' }, take: 50 }),
    configChecks(),
  ])
  return NextResponse.json({
    success: true,
    db,
    scheduler,
    internalCron: process.env.INTERNAL_CRON !== '0',
    backups,
    errors,
    checks,
    node: process.version,
    uptimeSec: Math.round(process.uptime()),
  })
}

/** { action: 'backup' } şimdi yedek al · { action: 'clear-errors' } hata kaydını temizle */
export async function POST(request: NextRequest) {
  const auth = await checkAdmin(request)
  if (!('ok' in auth)) return NextResponse.json({ success: false, error: auth.error }, { status: auth.status })
  const body = await request.json().catch(() => ({}))
  if (body?.action === 'backup') {
    const { status, body: result } = await runBackup()
    return NextResponse.json({ success: status === 200, ...result }, { status })
  }
  if (body?.action === 'clear-errors') {
    const { count } = await prisma.errorLog.deleteMany({})
    return NextResponse.json({ success: true, deleted: count })
  }
  return NextResponse.json({ success: false, error: 'Geçersiz işlem.' }, { status: 400 })
}
