export const dynamic = 'force-dynamic'

/**
 * Veritabanı yedeği (zamanlanmış görev; ayrıntı lib/cron-jobs.ts → runBackup).
 * Uygulama içi zamanlayıcı (lib/scheduler.ts) bunu günde bir kendisi çalıştırır; bu uç elle veya sunucu cron'u içindir.
 *   curl -s -X POST -H "Authorization: Bearer $CRON_SECRET" https://voltekno.com/api/cron/backup
 */

import { NextRequest, NextResponse } from 'next/server'
import { isCronAuthorized } from '@/lib/cron-auth'
import { runBackup } from '@/lib/cron-jobs'

export async function POST(request: NextRequest) {
  if (!isCronAuthorized(request)) return NextResponse.json({ error: 'Yetkisiz' }, { status: 401 })
  const { status, body } = await runBackup()
  return NextResponse.json(body, { status })
}
