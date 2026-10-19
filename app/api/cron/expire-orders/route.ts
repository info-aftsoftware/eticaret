export const dynamic = 'force-dynamic'

/**
 * Havale/EFT ödeme süresi takibi (zamanlanmış görev; ayrıntı lib/cron-jobs.ts → runExpireOrders).
 * Uygulama içi zamanlayıcı (lib/scheduler.ts) bunu 6 saatte bir kendisi çalıştırır; bu uç elle veya
 * sunucu cron'u ile tetiklemek içindir.
 * Yetki: Authorization: Bearer <CRON_SECRET>. Hostinger cron örneği (günde 4 kez):
 *   curl -s -X POST -H "Authorization: Bearer $CRON_SECRET" https://voltekno.com/api/cron/expire-orders
 * ?dry=1 ile hiçbir değişiklik yapmadan yapılacakları listeler.
 */

import { NextRequest, NextResponse } from 'next/server'
import { isCronAuthorized } from '@/lib/cron-auth'
import { runExpireOrders } from '@/lib/cron-jobs'

export async function POST(request: NextRequest) {
  if (!isCronAuthorized(request)) {
    return NextResponse.json({ error: 'Yetkisiz' }, { status: 401 })
  }
  const dry = request.nextUrl.searchParams.get('dry') === '1'
  return NextResponse.json(await runExpireOrders({ dry }))
}
