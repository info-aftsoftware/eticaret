/**
 * GET: oturumdaki müşteri bu ürünü değerlendirebilir mi (form yalnızca canReview ise gösterilir).
 * Authorization: Bearer <Firebase ID token>; yoksa reason = 'login'.
 */

export const dynamic = 'force-dynamic'

import { NextRequest, NextResponse } from 'next/server'
import { reviewAuthorFromRequest, reviewEligibility } from '@/lib/reviews'

export async function GET(request: NextRequest, props: { params: Promise<{ id: string }> }) {
  const { id } = await props.params
  try {
    const author = await reviewAuthorFromRequest(request)
    return NextResponse.json(await reviewEligibility(id, author), { headers: { 'Cache-Control': 'no-store' } })
  } catch (error) {
    console.error('Review eligibility error:', error)
    return NextResponse.json({ canReview: false, reason: 'login' }, { status: 500 })
  }
}
