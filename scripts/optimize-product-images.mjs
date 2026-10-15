/**
 * Ürün görsellerini WebP'ye dönüştürür (en uzun kenar en fazla 1200 px, kalite 80).
 * Site görselleri optimize etmeden sunduğu için (next.config.js images.unoptimized) dosya boyutu doğrudan sayfa ağırlığıdır.
 *
 *   node scripts/optimize-product-images.mjs            → public/images/products/voltekno
 *   npm run images:optimize
 *
 * Yalnızca daha küçük çıkan dönüşümler uygulanır; asıl dosya silinir. Sonra kataloğun yeni yolları kullanması için
 * import yeniden çalıştırılmalıdır (scripts/import-ikas-excel.py görseli uzantıdan bağımsız bulur).
 */
import fs from 'fs'
import path from 'path'
import sharp from 'sharp'

const dir = process.argv[2] || path.join(process.cwd(), 'public', 'images', 'products', 'voltekno')
const MAX = 1200

let before = 0
let after = 0
let converted = 0
for (const name of fs.readdirSync(dir)) {
  const ext = path.extname(name).toLowerCase()
  if (!['.jpg', '.jpeg', '.png'].includes(ext)) continue
  const src = path.join(dir, name)
  const dest = path.join(dir, path.basename(name, path.extname(name)) + '.webp')
  const size = fs.statSync(src).size
  before += size
  if (fs.existsSync(dest)) {
    after += size
    continue
  }
  const buf = await sharp(src)
    .rotate()
    .resize({ width: MAX, height: MAX, fit: 'inside', withoutEnlargement: true })
    .webp({ quality: 80 })
    .toBuffer()
  if (buf.length < size) {
    fs.writeFileSync(dest, buf)
    fs.unlinkSync(src)
    after += buf.length
    converted++
  } else {
    after += size
  }
}
console.log(`${converted} görsel WebP'ye dönüştürüldü: ${(before / 1048576).toFixed(1)} MB → ${(after / 1048576).toFixed(1)} MB (jpg/png kısmı)`)
