export const dynamic = 'force-dynamic'

/**
 * Yönetim paneli — tek kupon
 * PATCH: güncelle (tam form veya yalnızca { active }) · DELETE: sil
 */

import { NextRequest, NextResponse } from 'next/server'
import { Prisma } from '@prisma/client'
import { prisma } from '@/lib/prisma'
import { checkAdmin } from '@/lib/adminAuth'
import { parseCouponInput } from '@/lib/coupon-input'

export async function PATCH(request: NextRequest, props: { params: Promise<{ id: string }> }) {
  const params = await props.params;
  const auth = await checkAdmin(request)
  if ('error' in auth) return NextResponse.json({ error: auth.error }, { status: auth.status })
  const body = await request.json().catch(() => null)
  if (!body || typeof body !== 'object') return NextResponse.json({ error: 'Geçersiz istek' }, { status: 400 })

  try {
    // Yalnızca aktif/pasif değişikliği
    if (Object.keys(body).length === 1 && typeof body.active === 'boolean') {
      return NextResponse.json(await prisma.coupon.update({ where: { id: params.id }, data: { active: body.active } }))
    }
    const parsed = parseCouponInput(body)
    if ('error' in parsed) return NextResponse.json({ error: parsed.error }, { status: 400 })
    // Kullanılmış kuponun kodu değişirse iptal edilen siparişlerde kullanım geri verilemez
    const current = await prisma.coupon.findUnique({ where: { id: params.id }, select: { code: true, usedCount: true } })
    if (!current) return NextResponse.json({ error: 'Kupon bulunamadı' }, { status: 404 })
    if (current.usedCount > 0 && current.code !== parsed.data.code) {
      return NextResponse.json({ error: 'Kullanılmış kuponun kodu değiştirilemez. Yeni bir kupon oluşturun.' }, { status: 400 })
    }
    return NextResponse.json(await prisma.coupon.update({ where: { id: params.id }, data: parsed.data }))
  } catch (e) {
    if (e instanceof Prisma.PrismaClientKnownRequestError) {
      if (e.code === 'P2002') return NextResponse.json({ error: 'Bu kupon kodu zaten var.' }, { status: 409 })
      if (e.code === 'P2025') return NextResponse.json({ error: 'Kupon bulunamadı' }, { status: 404 })
    }
    console.error('Admin coupon PATCH error:', e)
    return NextResponse.json({ error: 'Kupon güncellenemedi' }, { status: 500 })
  }
}

export async function DELETE(request: NextRequest, props: { params: Promise<{ id: string }> }) {
  const params = await props.params;
  const auth = await checkAdmin(request)
  if ('error' in auth) return NextResponse.json({ error: auth.error }, { status: auth.status })
  try {
    await prisma.coupon.delete({ where: { id: params.id } })
    return NextResponse.json({ success: true })
  } catch (e) {
    if (e instanceof Prisma.PrismaClientKnownRequestError && e.code === 'P2025') {
      return NextResponse.json({ error: 'Kupon bulunamadı' }, { status: 404 })
    }
    console.error('Admin coupon DELETE error:', e)
    return NextResponse.json({ error: 'Kupon silinemedi' }, { status: 500 })
  }
}
