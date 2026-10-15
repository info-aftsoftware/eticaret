export const dynamic = 'force-dynamic'

/**
 * Yönetim paneli — kupon kodları
 * GET: tüm kuponlar · POST: yeni kupon
 */

import { NextRequest, NextResponse } from 'next/server'
import { Prisma } from '@prisma/client'
import { prisma } from '@/lib/prisma'
import { checkAdmin } from '@/lib/adminAuth'
import { parseCouponInput } from '@/lib/coupon-input'

export async function GET(request: NextRequest) {
  const auth = await checkAdmin(request)
  if ('error' in auth) return NextResponse.json({ error: auth.error }, { status: auth.status })
  const coupons = await prisma.coupon.findMany({ orderBy: { createdAt: 'desc' } })
  return NextResponse.json(coupons)
}

export async function POST(request: NextRequest) {
  const auth = await checkAdmin(request)
  if ('error' in auth) return NextResponse.json({ error: auth.error }, { status: auth.status })
  const body = await request.json().catch(() => null)
  if (!body || typeof body !== 'object') return NextResponse.json({ error: 'Geçersiz istek' }, { status: 400 })
  const parsed = parseCouponInput(body)
  if ('error' in parsed) return NextResponse.json({ error: parsed.error }, { status: 400 })
  try {
    const coupon = await prisma.coupon.create({ data: parsed.data })
    return NextResponse.json(coupon)
  } catch (e) {
    if (e instanceof Prisma.PrismaClientKnownRequestError && e.code === 'P2002') {
      return NextResponse.json({ error: 'Bu kupon kodu zaten var.' }, { status: 409 })
    }
    console.error('Admin coupon POST error:', e)
    return NextResponse.json({ error: 'Kupon kaydedilemedi' }, { status: 500 })
  }
}
