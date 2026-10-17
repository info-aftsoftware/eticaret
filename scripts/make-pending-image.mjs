/**
 * Doğru görseli henüz olmayan ürünler için marka logolu, ürün adlı "görsel hazırlanıyor" kartı üretir
 * ve scripts/data/image-overrides.json'a { pending: true } olarak işler. Yanlış/filigranlı görsel
 * göstermek yerine kullanılır; Google Merchant akışı bu görselleri (pending-*) ürün görseli saymaz.
 *
 *   node scripts/make-pending-image.mjs <SKU> [<SKU> ...]
 */
import fs from 'fs'
import path from 'path'
import sharp from 'sharp'

const ROOT = process.cwd()
const OUT_DIR = path.join(ROOT, 'public', 'images', 'products', 'override')
const OV_FILE = path.join(ROOT, 'scripts', 'data', 'image-overrides.json')
const products = JSON.parse(fs.readFileSync(path.join(ROOT, 'lib', 'catalog', 'products.json'), 'utf8'))
const LOGOS = {
  TommaTech: 'tommatech.webp', Victron: 'victron.svg', Deye: 'deye.webp', Havensis: 'havensis.webp', Frecon: 'frecon.webp',
  'İstabreeze': 'istabreeze.webp', Electrozirve: 'electrozirve.webp', Apex: 'apex.webp', Exelon: 'exelon.webp',
  Altech: 'altech.webp', Alpex: 'alpex.webp', 'NP Power': 'np-power.webp', Mexxsun: 'mexxsun.webp',
}
const esc = (s) => s.replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;')

function wrap(text, max) {
  const lines = []
  let line = ''
  for (const word of text.split(/\s+/)) {
    if ((line + ' ' + word).trim().length > max) { if (line) lines.push(line); line = word } else line = (line + ' ' + word).trim()
  }
  if (line) lines.push(line)
  return lines.slice(0, 4)
}

const overrides = JSON.parse(fs.readFileSync(OV_FILE, 'utf8'))
fs.mkdirSync(OUT_DIR, { recursive: true })
for (const sku of process.argv.slice(2)) {
  const p = products.find((x) => x.sku === sku || x.variants?.some((v) => v.sku === sku))
  if (!p) { console.log('! bulunamadı', sku); continue }
  const v = p.variants?.find((x) => x.sku === sku)
  const title = v?.label && p.variants.length > 1 ? `${p.name.split(' (')[0]} — ${v.label}` : p.name
  const lines = wrap(title, 30)
  const S = 1000
  const textSvg = `<svg width="${S}" height="${S}" xmlns="http://www.w3.org/2000/svg">
    <rect width="100%" height="100%" fill="#f5f7fa"/>
    <rect x="40" y="40" width="${S - 80}" height="${S - 80}" rx="28" fill="#ffffff" stroke="#e6ebf1" stroke-width="2"/>
    ${lines.map((l, i) => `<text x="50%" y="${520 + i * 52 - (lines.length - 1) * 26}" text-anchor="middle" font-family="Inter, Segoe UI, Arial, sans-serif" font-size="40" font-weight="600" fill="#121926">${esc(l)}</text>`).join('')}
    <rect x="${S / 2 - 210}" y="${700}" width="420" height="56" rx="28" fill="#0b2540"/>
    <text x="50%" y="737" text-anchor="middle" font-family="Inter, Segoe UI, Arial, sans-serif" font-size="24" font-weight="600" fill="#ffffff">Ürün görseli hazırlanıyor</text>
  </svg>`
  const layers = [{ input: Buffer.from(textSvg), left: 0, top: 0 }]
  const logoFile = LOGOS[p.brand] && path.join(ROOT, 'public', 'images', 'brands', LOGOS[p.brand])
  if (logoFile && fs.existsSync(logoFile)) {
    const logo = await sharp(logoFile, { density: 300 }).resize({ width: 320, height: 120, fit: 'inside' }).png().toBuffer()
    const m = await sharp(logo).metadata()
    layers.push({ input: logo, left: Math.round((S - m.width) / 2), top: 230 - Math.round(m.height / 2) })
  }
  const name = `pending-${sku.toLowerCase().replace(/[^a-z0-9]+/g, '-')}.webp`
  await sharp({ create: { width: S, height: S, channels: 3, background: '#f5f7fa' } }).composite(layers).webp({ quality: 85 }).toFile(path.join(OUT_DIR, name))
  overrides[sku] = { images: [name], pending: true, source: '', note: 'Doğru resmî görsel bulunamadı; yanlış/filigranlı görsel yerine geçici kart.' }
  console.log(sku, '→', name)
}
fs.writeFileSync(OV_FILE, JSON.stringify(overrides, null, 2) + '\n')
