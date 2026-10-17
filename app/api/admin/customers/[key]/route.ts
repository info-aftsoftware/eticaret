export const dynamic = 'force-dynamic'

/** Admin: Müşteri detayı ve siparişleri. key: u_<userId> (üye) | g_<özet> (misafir) */

import { NextRequest, NextResponse } from 'next/server'
import { checkAdmin } from '@/lib/adminAuth'
import { getCustomerDetail } from '@/lib/admin-customers'

export async function GET(request: NextRequest, { params }: { params: Promise<{ key: string }> }) {
  const auth = await checkAdmin(request)
  if ('error' in auth) return NextResponse.json({ error: auth.error }, { status: auth.status })

  const { key } = await params
  if (!/^[ug]_[A-Za-z0-9_-]{1,128}$/.test(key)) return NextResponse.json({ error: 'Geçersiz müşteri' }, { status: 400 })
  try {
    const detail = await getCustomerDetail(key)
    if (!detail) return NextResponse.json({ error: 'Müşteri bulunamadı' }, { status: 404 })
    return NextResponse.json(detail)
  } catch (error) {
    console.error('Admin customer detail error:', error)
    return NextResponse.json({ error: 'Müşteri alınamadı' }, { status: 500 })
  }
}
