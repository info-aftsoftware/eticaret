export const dynamic = 'force-dynamic'

import { NextRequest, NextResponse } from 'next/server'
import { isRateLimited } from '@/lib/rate-limit'
import { recordError } from '@/lib/error-log'

/** Tarayıcı eklentileri ve zararsız tarayıcı uyarıları kayda girmez */
const NOISE = [/ResizeObserver loop/i, /chrome-extension:|moz-extension:|safari-extension:/i, /^Script error\.?$/i, /Non-Error promise rejection captured/i]

/**
 * Tarayıcıdaki yakalanmamış hatalar (components/ClientErrorReporter.tsx). IP başına dakikada 10 kayıt,
 * alanlar kısaltılır; yanıt her zaman 204 (istemciye bilgi sızdırmaz).
 */
export async function POST(request: NextRequest) {
  if (isRateLimited(request, 'client-errors', 10, 60_000)) return new NextResponse(null, { status: 204 })
  const text = await request.text().catch(() => '')
  if (!text || text.length > 16_000) return new NextResponse(null, { status: 204 })
  let body: { message?: unknown; stack?: unknown; url?: unknown; kind?: unknown }
  try {
    body = JSON.parse(text)
  } catch {
    return new NextResponse(null, { status: 204 })
  }
  const message = typeof body.message === 'string' ? body.message.trim() : ''
  const stack = typeof body.stack === 'string' ? body.stack : undefined
  if (!message || NOISE.some((re) => re.test(message) || (stack && re.test(stack)))) return new NextResponse(null, { status: 204 })
  const url = typeof body.url === 'string' ? body.url : undefined
  let path = url
  try {
    path = url ? new URL(url).pathname : undefined
  } catch {}
  await recordError({
    source: 'client',
    context: typeof body.kind === 'string' ? body.kind.slice(0, 40) : 'tarayıcı',
    message,
    stack,
    url: path,
    details: { userAgent: request.headers.get('user-agent')?.slice(0, 200) },
  })
  return new NextResponse(null, { status: 204 })
}
