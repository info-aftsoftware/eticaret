export const dynamic = 'force-dynamic'

import { NextRequest, NextResponse } from 'next/server'
import { checkAdmin, logAdminAction } from '@/lib/adminAuth'
import { prisma } from '@/lib/prisma'
import { CONSENT_SOURCES, type ConsentSource } from '@/lib/marketing-consent'
import { csvResponseHeaders, toCsv } from '@/lib/csv'

/**
 * Ticari ileti izni olan kişiler (Excel uyumlu CSV) — e-posta pazarlama aracına veya İYS'ye aktarım için.
 * ?all=1 ile izni geri alınanlar da (RET) listelenir; İYS'ye ret bildirimi de yapılmalıdır.
 */
export async function GET(request: NextRequest) {
  const auth = await checkAdmin(request)
  if ('error' in auth) return NextResponse.json({ error: auth.error }, { status: auth.status })
  const all = request.nextUrl.searchParams.get('all') === '1'
  const rows = await prisma.marketingConsent.findMany({
    where: all ? undefined : { accepted: true },
    orderBy: { updatedAt: 'desc' },
  })
  const csv = toCsv(
    ['E-posta', 'Ad soyad', 'Durum', 'Kanallar', 'Kaynak', 'İzin / ret tarihi', 'Üye'],
    rows.map((r) => [
      r.email,
      r.name ?? '',
      r.accepted ? 'ONAY' : 'RET',
      r.channels.replace(',', ', '),
      CONSENT_SOURCES[r.source as ConsentSource] ?? r.source,
      r.updatedAt,
      r.userId ? 'Evet' : 'Hayır',
    ])
  )
  void logAdminAction(auth.actor, 'İzinli kişi listesi alındı', { details: `${rows.length} kayıt${all ? ' (ret dahil)' : ''}` })
  return new NextResponse(csv, { headers: csvResponseHeaders(`voltekno-ticari-ileti-izinleri-${new Date().toISOString().slice(0, 10)}.csv`) })
}
