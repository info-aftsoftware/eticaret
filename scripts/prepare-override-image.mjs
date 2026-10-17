/**
 * Doğru ürün görselini katalog biçimine getirir: beyaz zemin, kenar boşlukları kırpılmış, kare,
 * en fazla 1000 px, WebP. scripts/data/image-overrides.json'da kullanılacak görseller için.
 *
 *   node scripts/prepare-override-image.mjs <kaynak> <hedef-adı.webp> [<kaynak> <hedef-adı.webp> ...]
 *
 * Çıktı: public/images/products/override/<hedef-adı.webp>
 */
import fs from 'fs'
import path from 'path'
import sharp from 'sharp'

const OUT_DIR = path.join(process.cwd(), 'public', 'images', 'products', 'override')
const SIZE = 1000
const MARGIN = 0.06

const args = process.argv.slice(2)
if (args.length < 2 || args.length % 2) {
  console.error('Kullanım: node scripts/prepare-override-image.mjs <kaynak> <hedef.webp> [...]')
  process.exit(1)
}
fs.mkdirSync(OUT_DIR, { recursive: true })
for (let i = 0; i < args.length; i += 2) {
  const [src, name] = [args[i], args[i + 1]]
  const flat = await sharp(src).rotate().flatten({ background: '#ffffff' }).toBuffer()
  const trimmed = await sharp(flat).trim({ background: '#ffffff', threshold: 12 }).toBuffer()
  const inner = Math.round(SIZE * (1 - 2 * MARGIN))
  const fitted = await sharp(trimmed).resize({ width: inner, height: inner, fit: 'inside', withoutEnlargement: false }).toBuffer()
  const { width, height } = await sharp(fitted).metadata()
  const info = await sharp({ create: { width: SIZE, height: SIZE, channels: 3, background: '#ffffff' } })
    .composite([{ input: fitted, left: Math.round((SIZE - width) / 2), top: Math.round((SIZE - height) / 2) }])
    .webp({ quality: 82 })
    .toFile(path.join(OUT_DIR, name))
  console.log(name, `${info.width}x${info.height}`, `${Math.round(info.size / 1024)} KB`)
}
