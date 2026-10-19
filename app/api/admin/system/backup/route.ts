export const dynamic = 'force-dynamic'

import path from 'path'
import { promises as fs } from 'fs'
import { gzipSync } from 'zlib'
import { NextRequest, NextResponse } from 'next/server'
import { checkAdmin, logAdminAction } from '@/lib/adminAuth'
import { backupDir } from '@/lib/cron-jobs'

/** Yedek indirme (?file=voltekno-….db) — gzip ile sıkıştırılmış; yalnızca yedek klasöründeki bilinen adlar */
export async function GET(request: NextRequest) {
  const auth = await checkAdmin(request)
  if (!('ok' in auth)) return NextResponse.json({ success: false, error: auth.error }, { status: auth.status })
  const name = request.nextUrl.searchParams.get('file') ?? ''
  if (!/^voltekno-[\w-]+\.db$/.test(name)) return NextResponse.json({ success: false, error: 'Geçersiz dosya.' }, { status: 400 })
  const file = path.join(backupDir(), name)
  try {
    const gz = gzipSync(await fs.readFile(file), { level: 9 })
    void logAdminAction(auth.actor, 'Yedek indirildi', { details: name })
    return new NextResponse(new Uint8Array(gz), {
      headers: {
        'Content-Type': 'application/gzip',
        'Content-Disposition': `attachment; filename="${name}.gz"`,
        'Cache-Control': 'no-store',
      },
    })
  } catch {
    return NextResponse.json({ success: false, error: 'Yedek bulunamadı.' }, { status: 404 })
  }
}
