/**
 * Panelden yüklenen medya dosyalarını sunar (lib/media-storage.ts). Yalnızca görsel uzantıları;
 * dosya adları benzersiz olduğundan uzun süreli önbellek kullanılır.
 */

import fs from 'fs/promises'
import { NextRequest, NextResponse } from 'next/server'
import { resolveMediaPath } from '@/lib/media-storage'

export const dynamic = 'force-dynamic'

const TYPES: Record<string, string> = { webp: 'image/webp', jpg: 'image/jpeg', jpeg: 'image/jpeg', png: 'image/png', avif: 'image/avif' }

export async function GET(_request: NextRequest, { params }: { params: Promise<{ path: string[] }> }) {
  const { path: segments } = await params
  const ext = segments[segments.length - 1]?.split('.').pop()?.toLowerCase() ?? ''
  const file = TYPES[ext] ? resolveMediaPath(segments) : null
  if (!file) return new NextResponse('Not found', { status: 404 })
  try {
    const data = await fs.readFile(file)
    return new NextResponse(new Uint8Array(data), {
      headers: {
        'Content-Type': TYPES[ext],
        'Cache-Control': 'public, max-age=31536000, immutable',
        'X-Content-Type-Options': 'nosniff',
      },
    })
  } catch {
    return new NextResponse('Not found', { status: 404 })
  }
}
