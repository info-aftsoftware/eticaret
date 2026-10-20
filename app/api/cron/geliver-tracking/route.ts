export const dynamic = 'force-dynamic'

/**
 * Geliver gönderi takibi (zamanlanmış görev; ayrıntı lib/cron-jobs.ts → runGeliverTracking).
 * Uygulama içi zamanlayıcı (lib/scheduler.ts) bunu saatte bir kendisi çalıştırır; bu uç elle veya
 * sunucu cron'u ile tetiklemek içindir.
 * Yetki: Authorization: Bearer <CRON_SECRET>
 *   curl -s -X POST -H "Authorization: Bearer $CRON_SECRET" https://voltekno.com/api/cron/geliver-tracking
 * ?dry=1 ile hiçbir değişiklik yapmadan Geliver'den gelen durumları listeler.
 */

import { NextRequest, NextResponse } from 'next/server'
import { isCronAuthorized } from '@/lib/cron-auth'
import { runGeliverTracking } from '@/lib/cron-jobs'

export async function POST(request: NextRequest) {
  if (!isCronAuthorized(request)) {
    return NextResponse.json({ error: 'Yetkisiz' }, { status: 401 })
  }
  const dry = request.nextUrl.searchParams.get('dry') === '1'
  return NextResponse.json(await runGeliverTracking({ dry }))
}
