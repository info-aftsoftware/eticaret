export const dynamic = 'force-dynamic'

/**
 * Admin: ürün görseli yükleme / silme.
 * POST multipart/form-data `files` (en fazla 10 dosya, her biri ≤15 MB) → WebP'ye çevrilip kaydedilir, URL'ler döner.
 *      Ürüne eklemek için istemci dönen URL'leri PATCH /api/admin/catalog/[productId] { images, image } ile kaydeder.
 * DELETE ?url=/media/products/... → panelden yüklenmiş dosyayı siler (katalog görselleri silinmez).
 */

import { NextRequest, NextResponse } from 'next/server'
import { checkAdmin } from '@/lib/adminAuth'
import { deleteProductImage, MediaError, saveProductImage } from '@/lib/media-storage'
import { isRateLimited } from '@/lib/rate-limit'
import { revalidateStorefront } from '@/lib/storefront-revalidate'

const MAX_FILES = 10

export async function POST(request: NextRequest, { params }: { params: Promise<{ productId: string }> }) {
  const auth = await checkAdmin(request)
  if ('error' in auth) return NextResponse.json({ error: auth.error }, { status: auth.status })
  if (isRateLimited(request, 'admin-image-upload', 120, 10 * 60_000)) {
    return NextResponse.json({ error: 'Çok fazla yükleme. Biraz sonra tekrar deneyin.' }, { status: 429 })
  }

  const { productId } = await params
  let form: FormData
  try {
    form = await request.formData()
  } catch {
    return NextResponse.json({ error: 'Geçersiz form verisi' }, { status: 400 })
  }
  const files = form.getAll('files').filter((f): f is File => typeof f === 'object' && f !== null && 'arrayBuffer' in f)
  if (files.length === 0) return NextResponse.json({ error: 'Dosya seçilmedi' }, { status: 400 })
  if (files.length > MAX_FILES) return NextResponse.json({ error: `Tek seferde en fazla ${MAX_FILES} görsel yüklenebilir.` }, { status: 400 })

  const uploaded: { url: string; name: string; width: number; height: number; bytes: number }[] = []
  const errors: { name: string; error: string }[] = []
  for (const f of files) {
    try {
      const saved = await saveProductImage(productId, Buffer.from(await f.arrayBuffer()))
      uploaded.push({ ...saved, name: f.name })
    } catch (e) {
      errors.push({ name: f.name, error: e instanceof MediaError ? e.message : 'Görsel işlenemedi' })
      if (!(e instanceof MediaError)) console.error('Admin image upload error:', e)
    }
  }
  revalidateStorefront()
  return NextResponse.json({ uploaded, errors }, { status: uploaded.length ? 200 : 400 })
}

export async function DELETE(request: NextRequest) {
  const auth = await checkAdmin(request)
  if ('error' in auth) return NextResponse.json({ error: auth.error }, { status: auth.status })
  const url = new URL(request.url).searchParams.get('url') || ''
  const deleted = await deleteProductImage(url)
  revalidateStorefront()
  return NextResponse.json({ deleted })
}
