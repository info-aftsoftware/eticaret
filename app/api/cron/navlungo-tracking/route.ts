export const dynamic = 'force-dynamic'

/**
 * Navlungo gönderi takibi (zamanlanmış görev; ayrıntı lib/cron-jobs.ts → runNavlungoTracking).
 * Uygulama içi zamanlayıcı (lib/scheduler.ts) bunu 2 saatte bir kendisi çalıştırır; bu uç elle veya
 * sunucu cron'u ile tetiklemek içindir.
 * Yetki: Authorization: Bearer <CRON_SECRET>
 *   curl -s -X POST -H "Authorization: Bearer $CRON_SECRET" https://voltekno.com/api/cron/navlungo-tracking
 * ?dry=1 ile hiçbir değişiklik yapmadan Navlungo'dan gelen durumları listeler.
 */

import { NextRequest, NextResponse } from 'next/server'
import { isCronAuthorized } from '@/lib/cron-auth'
import { runNavlungoTracking } from '@/lib/cron-jobs'

export async function POST(request: NextRequest) {
  if (!isCronAuthorized(request)) {
    return NextResponse.json({ error: 'Yetkisiz' }, { status: 401 })
  }
  const dry = request.nextUrl.searchParams.get('dry') === '1'
  return NextResponse.json(await runNavlungoTracking({ dry }))
}
