export const dynamic = 'force-dynamic'

/**
 * Admin: Müşteri listesi (Prisma User + Order; misafirler e-postaya göre gruplanır).
 * Query: q, page, pageSize (≤100), sort (last_order | spend | orders | newest | name), filter (all | registered | guest | with_orders)
 */

import { NextRequest, NextResponse } from 'next/server'
import { checkAdmin } from '@/lib/adminAuth'
import { listCustomers, type CustomerFilter, type CustomerSort } from '@/lib/admin-customers'

const SORTS: CustomerSort[] = ['last_order', 'spend', 'orders', 'newest', 'name']
const FILTERS: CustomerFilter[] = ['all', 'registered', 'guest', 'with_orders']

export async function GET(request: NextRequest) {
  const auth = await checkAdmin(request)
  if ('error' in auth) return NextResponse.json({ error: auth.error }, { status: auth.status })

  try {
    const sp = new URL(request.url).searchParams
    const sort = (SORTS.includes(sp.get('sort') as CustomerSort) ? sp.get('sort') : 'last_order') as CustomerSort
    const filter = (FILTERS.includes(sp.get('filter') as CustomerFilter) ? sp.get('filter') : 'all') as CustomerFilter
    const pageSize = Math.min(Math.max(parseInt(sp.get('pageSize') || '25', 10) || 25, 1), 100)
    const page = Math.max(parseInt(sp.get('page') || '1', 10) || 1, 1)
    const result = await listCustomers({ q: (sp.get('q') || '').slice(0, 100), page, pageSize, sort, filter })
    return NextResponse.json(result)
  } catch (error) {
    console.error('Admin customers GET error:', error)
    return NextResponse.json({ error: 'Müşteriler alınamadı' }, { status: 500 })
  }
}
