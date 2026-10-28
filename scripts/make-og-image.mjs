// Varsayılan paylaşım görseli (Open Graph, 1200×630): ana sayfa hero fotoğrafı + marka ve kısa tanım.
// Kullanım: node scripts/make-og-image.mjs  →  public/og/voltekno.jpg
import sharp from 'sharp'
import { mkdirSync } from 'node:fs'

const W = 1200
const H = 630
const src = 'public/images/hero/voltekno-hero-1.webp'
mkdirSync('public/og', { recursive: true })

// Fotoğraf üstü yazı okunsun diye yalnızca sol alt köşede yumuşak karartma
const overlay = Buffer.from(`
<svg width="${W}" height="${H}" xmlns="http://www.w3.org/2000/svg">
  <defs>
    <linearGradient id="g" x1="0" y1="0" x2="1" y2="0">
      <stop offset="0" stop-color="#0b2540" stop-opacity="0.82"/>
      <stop offset="0.62" stop-color="#0b2540" stop-opacity="0.35"/>
      <stop offset="1" stop-color="#0b2540" stop-opacity="0"/>
    </linearGradient>
  </defs>
  <rect width="${W}" height="${H}" fill="url(#g)"/>
  <text x="72" y="300" font-family="Segoe UI, Arial, sans-serif" font-size="92" font-weight="700" fill="#ffffff">Voltekno</text>
  <rect x="72" y="330" width="96" height="6" fill="#f5b400"/>
  <text x="72" y="400" font-family="Segoe UI, Arial, sans-serif" font-size="38" fill="#ffffff">Güneş paneli · Akü · İnverter · EV şarj</text>
  <text x="72" y="452" font-family="Segoe UI, Arial, sans-serif" font-size="30" fill="#e6ebf1">Enerji depolama ve GES ürünleri</text>
</svg>`)

await sharp(src)
  .resize(W, H, { fit: 'cover', position: 'centre' })
  .composite([{ input: overlay }])
  .jpeg({ quality: 82, mozjpeg: true })
  .toFile('public/og/voltekno.jpg')

console.log('public/og/voltekno.jpg')
