export const dynamic = 'force-dynamic'

/**
 * Veritabanı yedeği (zamanlanmış görev, günde 1 kez önerilir).
 * SQLite: VACUUM INTO ile tutarlı kopya → BACKUP_DIR (varsayılan ./backups — herkese açık klasöre KOYMAYIN).
 * Son BACKUP_KEEP (varsayılan 14) yedek tutulur. PostgreSQL'de sağlayıcının yedekleme özelliği kullanılmalı.
 *   curl -s -X POST -H "Authorization: Bearer $CRON_SECRET" https://voltekno.com/api/cron/backup
 */

import path from 'path'
import { promises as fs } from 'fs'
import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import { isCronAuthorized } from '@/lib/cron-auth'
import { reportError } from '@/lib/alerts'

export async function POST(request: NextRequest) {
  if (!isCronAuthorized(request)) return NextResponse.json({ error: 'Yetkisiz' }, { status: 401 })

  const url = process.env.DATABASE_URL ?? ''
  if (!url.startsWith('file:')) {
    return NextResponse.json({ ok: false, error: 'Bu görev yalnızca SQLite içindir; PostgreSQL için sağlayıcı yedeklemesini kullanın.' }, { status: 400 })
  }

  const dir = path.resolve(process.env.BACKUP_DIR || path.join(process.cwd(), 'backups'))
  const publicDir = path.resolve(process.cwd(), 'public')
  if (dir.startsWith(publicDir)) {
    return NextResponse.json({ ok: false, error: 'BACKUP_DIR herkese açık klasörün içinde olamaz.' }, { status: 400 })
  }
  const keep = Math.max(1, parseInt(process.env.BACKUP_KEEP || '14', 10) || 14)

  try {
    await fs.mkdir(dir, { recursive: true })
    const stamp = new Date().toISOString().replace(/[:.]/g, '-')
    const file = path.join(dir, `voltekno-${stamp}.db`)
    // Dosya adı sunucuda üretilir (kullanıcı girdisi yok); tek tırnaklar SQL için kaçışlanır
    await prisma.$executeRawUnsafe(`VACUUM INTO '${file.replace(/'/g, "''")}'`)
    const { size } = await fs.stat(file)

    const backups = (await fs.readdir(dir)).filter((f) => /^voltekno-.*\.db$/.test(f)).sort()
    const removed = backups.slice(0, Math.max(0, backups.length - keep))
    await Promise.all(removed.map((f) => fs.unlink(path.join(dir, f))))

    return NextResponse.json({ ok: true, file: path.basename(file), sizeBytes: size, kept: backups.length - removed.length, removed: removed.length })
  } catch (e) {
    await reportError('veritabani-yedegi', e, { dir })
    return NextResponse.json({ ok: false, error: 'Yedek alınamadı' }, { status: 500 })
  }
}
