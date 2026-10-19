export const dynamic = 'force-dynamic'

import { NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'

const startedAt = Date.now()

/**
 * Uptime izleyicileri (UptimeRobot, Better Stack vb.) için sağlık ucu: veritabanına ulaşılabiliyorsa 200, yoksa 503.
 * Gizli bilgi döndürmez.
 */
export async function GET() {
  const t0 = Date.now()
  try {
    await prisma.$queryRawUnsafe('SELECT 1')
    return NextResponse.json(
      { status: 'ok', db: 'ok', dbMs: Date.now() - t0, uptimeSec: Math.round((Date.now() - startedAt) / 1000), time: new Date().toISOString() },
      { headers: { 'Cache-Control': 'no-store' } }
    )
  } catch {
    return NextResponse.json({ status: 'error', db: 'unreachable', time: new Date().toISOString() }, { status: 503, headers: { 'Cache-Control': 'no-store' } })
  }
}
