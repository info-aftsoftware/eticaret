/**
 * Yönetim panelinden yüklenen ürün görselleri.
 *
 * Next.js standalone sunucusu `public/` klasörüne çalışma anında eklenen dosyaları sunmaz ve her yayında
 * uygulama klasörü yenilenir. Bu yüzden görseller kalıcı bir klasöre yazılır ve /media/... adresinden
 * app/media/[...path]/route.ts ile sunulur.
 *
 * Klasör: MEDIA_DIR → (SQLite mutlak yolu varsa) veritabanı dosyasının yanındaki media/ → <proje>/.data/media
 * Görseller sharp ile döndürme düzeltilip en fazla 1600 px'e küçültülür ve WebP'ye çevrilir.
 */

import fs from 'fs/promises'
import path from 'path'
import crypto from 'crypto'

export const MEDIA_URL_PREFIX = '/media/'
export const MAX_UPLOAD_BYTES = 15 * 1024 * 1024
const MAX_EDGE = 1600

export function mediaRoot(): string {
  if (process.env.MEDIA_DIR) return path.resolve(process.env.MEDIA_DIR)
  const db = process.env.DATABASE_URL
  if (db?.startsWith('file:')) {
    const p = db.slice(5).split('?')[0]
    if (path.isAbsolute(p)) return path.join(path.dirname(p), 'media')
  }
  return path.join(process.cwd(), '.data', 'media')
}

/** /media/... adresini klasör içindeki güvenli dosya yoluna çevirir; geçersizse null */
export function resolveMediaPath(segments: string[]): string | null {
  if (!segments.length || segments.some((s) => !s || s === '.' || s === '..' || /[\\/\0]/.test(s))) return null
  const root = mediaRoot()
  const full = path.resolve(root, ...segments)
  if (!full.startsWith(root + path.sep)) return null
  return full
}

const slug = (s: string) =>
  s
    .toLowerCase()
    .normalize('NFKD')
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-|-$/g, '')
    .slice(0, 50) || 'urun'

export class MediaError extends Error {}

/** Görseli doğrular, WebP'ye çevirir ve kaydeder. Dönen değer: /media/products/<dosya>.webp */
export async function saveProductImage(productId: string, input: Buffer): Promise<{ url: string; width: number; height: number; bytes: number }> {
  if (input.length === 0) throw new MediaError('Dosya boş.')
  if (input.length > MAX_UPLOAD_BYTES) throw new MediaError('Dosya 15 MB sınırını aşıyor.')
  const sharp = (await import('sharp')).default
  let meta
  try {
    meta = await sharp(input, { failOn: 'error' }).metadata()
  } catch {
    throw new MediaError('Dosya geçerli bir görsel değil.')
  }
  if (!meta.format || !['jpeg', 'png', 'webp', 'gif', 'avif', 'heif', 'tiff'].includes(meta.format)) {
    throw new MediaError('Desteklenmeyen görsel biçimi (JPG, PNG, WebP veya AVIF yükleyin).')
  }
  if ((meta.width ?? 0) * (meta.height ?? 0) > 60_000_000) throw new MediaError('Görsel çözünürlüğü çok yüksek.')

  const { data, info } = await sharp(input, { failOn: 'error', animated: false })
    .rotate()
    .resize({ width: MAX_EDGE, height: MAX_EDGE, fit: 'inside', withoutEnlargement: true })
    .webp({ quality: 82, effort: 4 })
    .toBuffer({ resolveWithObject: true })

  const dir = path.join(mediaRoot(), 'products')
  await fs.mkdir(dir, { recursive: true })
  const name = `${slug(productId)}-${Date.now().toString(36)}-${crypto.randomBytes(4).toString('hex')}.webp`
  const tmp = path.join(dir, `${name}.tmp`)
  await fs.writeFile(tmp, data)
  await fs.rename(tmp, path.join(dir, name))
  return { url: `${MEDIA_URL_PREFIX}products/${name}`, width: info.width, height: info.height, bytes: data.length }
}

/** Yalnızca panelden yüklenmiş (/media/products/...) dosyayı siler; katalog görsellerine dokunmaz */
export async function deleteProductImage(url: string): Promise<boolean> {
  if (!url.startsWith(`${MEDIA_URL_PREFIX}products/`)) return false
  const file = resolveMediaPath(url.slice(MEDIA_URL_PREFIX.length).split('/'))
  if (!file) return false
  try {
    await fs.unlink(file)
    return true
  } catch {
    return false
  }
}
