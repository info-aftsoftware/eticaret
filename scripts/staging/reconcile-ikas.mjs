/**
 * iKAS → yeni katalog mutabakatı (kontrol listesi 32): iKAS ürün dışa aktarım Excel'i ile site kataloğunu karşılaştırır.
 *  - ürün grubu (Slug) ve SKU sayıları, katalogda olmayan / katalogda fazladan olan ürünler, satıştan kaldırılanlar
 *  - eski iKAS adresleri (/<slug>): yeni sitede ne döndüğü (BASE verilirse gerçek HTTP isteğiyle, yalnız GET)
 *  - görseli olmayan ürünler
 * Kullanım: node scripts/staging/reconcile-ikas.mjs <excel.xlsx> [BASE=http://localhost:3020] [--json çıktı.json]
 * Excel okuma `unzip` komutuyla (paket gerektirmez). Hiçbir şey yazmaz; yalnız rapor üretir.
 */
import { spawnSync } from 'node:child_process'
import fs from 'node:fs'
import path from 'node:path'
import { fileURLToPath } from 'node:url'

const [excel, base, ...rest] = process.argv.slice(2)
if (!excel) {
  console.error('Kullanım: node scripts/staging/reconcile-ikas.mjs <excel.xlsx> [BASE] [--json çıktı.json]')
  process.exit(1)
}
const jsonOut = rest[0] === '--json' ? rest[1] : null
const ROOT = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..', '..')

const unzip = (entry) => {
  const r = spawnSync('unzip', ['-p', excel, entry], { encoding: 'utf8', maxBuffer: 256 * 1024 * 1024 })
  if (r.status !== 0) throw new Error(`unzip ${entry}: ${r.stderr}`)
  return r.stdout
}
const xmlText = (s) => s.replace(/<[^>]+>/g, '').replace(/&#(\d+);/g, (_, n) => String.fromCodePoint(Number(n))).replace(/&#x([0-9a-f]+);/gi, (_, n) => String.fromCodePoint(parseInt(n, 16))).replace(/&amp;/g, '&').replace(/&lt;/g, '<').replace(/&gt;/g, '>').replace(/&quot;/g, '"').replace(/&apos;/g, "'")
// Paylaşılan metin tablosu isteğe bağlıdır (bazı dışa aktarımlar hücreleri satır içi yazar)
const listing = spawnSync('unzip', ['-Z1', excel], { encoding: 'utf8' }).stdout.split(/\r?\n/)
const shared = listing.includes('xl/sharedStrings.xml')
  ? [...unzip('xl/sharedStrings.xml').matchAll(/<si>([\s\S]*?)<\/si>/g)].map((m) => xmlText(m[1]))
  : []
const colIndex = (ref) => [...ref.replace(/\d+/g, '')].reduce((n, ch) => n * 26 + ch.charCodeAt(0) - 64, 0) - 1
const rows = [...unzip('xl/worksheets/sheet1.xml').matchAll(/<row[^>]*>([\s\S]*?)<\/row>/g)].map((rm) => {
  const out = []
  for (const c of rm[1].matchAll(/<c r="([A-Z]+\d+)"([^>]*?)(?:\/>|>([\s\S]*?)<\/c>)/g)) {
    const [, ref, attrs, inner = ''] = c
    const v = (inner.match(/<v>([\s\S]*?)<\/v>/) || [])[1]
    const t = (attrs.match(/t="(\w+)"/) || [])[1]
    let val = ''
    if (t === 's' && v != null) val = shared[Number(v)] ?? ''
    else if (t === 'inlineStr') val = xmlText((inner.match(/<is>([\s\S]*?)<\/is>/) || [])[1] ?? '')
    else if (v != null) val = xmlText(v)
    out[colIndex(ref)] = val
  }
  return out
})
const header = rows[0].map((h) => (h ?? '').trim())
const col = (name) => header.findIndex((h) => h === name)
const iSlug = col('Slug')
const iSku = col('SKU')
const iGroup = col('Ürün Grup ID')
const iName = col('İsim')
if (iSlug < 0 || iSku < 0) throw new Error('Slug/SKU sütunu yok: ' + header.join(' | '))
const data = rows.slice(1).filter((r) => (r[iSlug] ?? '').trim() || (r[iSku] ?? '').trim())

// Excel'de grup başına ilk satır ürün, diğerleri varyant satırıdır (aynı Ürün Grup ID)
const groups = new Map()
for (const r of data) {
  const key = (r[iGroup] || r[iSlug] || '').trim()
  if (!key) continue
  const g = groups.get(key) ?? { slug: '', name: '', skus: [] }
  if (!g.slug && r[iSlug]) g.slug = r[iSlug].trim()
  if (!g.name && r[iName]) g.name = r[iName].trim()
  if (r[iSku]) g.skus.push(r[iSku].trim())
  groups.set(key, g)
}

const read = (p) => JSON.parse(fs.readFileSync(path.join(ROOT, p), 'utf8'))
const catalogRaw = read('lib/catalog/products.json')
const catalog = Array.isArray(catalogRaw) ? catalogRaw : catalogRaw.products
const delistedRaw = fs.existsSync(path.join(ROOT, 'scripts/data/delisted.json')) ? read('scripts/data/delisted.json') : []
// scripts/data/delisted.json: SKU → neden (içe aktarıcı bu SKU'ları almaz; bütün SKU'ları kalkan ürün katalogdan çıkar)
const delistedSkus = new Set(Object.keys(delistedRaw).filter((k) => !k.startsWith('_')).map((s) => s.toUpperCase()))
const delisted = new Set([...groups.values()].filter((g) => g.skus.length && g.skus.every((s) => delistedSkus.has(s.toUpperCase()))).map((g) => g.slug))
const legacy = read('lib/legacy-product-redirects.json')
const seoLegacyPath = path.join(ROOT, 'lib/seo/legacy-redirects.json')
const seoLegacy = fs.existsSync(seoLegacyPath) ? JSON.parse(fs.readFileSync(seoLegacyPath, 'utf8')) : {}

const ids = new Set(catalog.map((p) => p.id))
const catalogSkus = new Set(catalog.flatMap((p) => [p.sku, ...(p.variants ?? []).map((v) => v.sku)]).filter(Boolean).map((s) => s.toUpperCase()))
const excelSlugs = [...groups.values()].map((g) => g.slug).filter(Boolean)
const missing = [...groups.values()].filter((g) => g.slug && !ids.has(g.slug) && !delisted.has(g.slug) && !legacy[g.slug])
const renamed = [...groups.values()].filter((g) => g.slug && !ids.has(g.slug) && legacy[g.slug])
const removed = [...groups.values()].filter((g) => g.slug && delisted.has(g.slug))
const excelSkuSet = new Set([...groups.values()].flatMap((g) => g.skus).map((s) => s.toUpperCase()))
const skuMissing = [...excelSkuSet].filter((s) => !catalogSkus.has(s) && !delistedSkus.has(s))
const extra = catalog.filter((p) => !groups.has(p.id) && !excelSlugs.includes(p.id))
const noImage = catalog.filter((p) => !p.image || /placeholder|pending-/.test(p.image))

const report = {
  excel: { satir: data.length, urunGrubu: groups.size, sku: excelSkuSet.size },
  katalog: { urun: catalog.length, sku: catalogSkus.size },
  ayniAdla: excelSlugs.filter((s) => ids.has(s)).length,
  yenidenAdlandirilan: renamed.length,
  satistanKaldirilan: removed.length,
  katalogdaYok: missing.map((g) => `${g.slug} (${g.name})`),
  skuKatalogdaYok: skuMissing.length,
  skuKatalogdaYokOrnek: skuMissing.slice(0, 15),
  katalogdaFazla: extra.map((p) => p.id),
  gorselsiz: noImage.map((p) => p.id),
  eskiAdresYonlendirmesi: { urunAdresi: Object.keys(legacy).length, seoKokAdres: Object.keys(seoLegacy).length },
}

// Eski iKAS adresleri: /<slug> (kök) ve /products/<slug>; yeni sitede ne dönüyor
if (base && /^https?:/.test(base)) {
  const check = async (p) => {
    try {
      const r = await fetch(base + p, { redirect: 'manual' })
      return r.status >= 300 && r.status < 400 ? `${r.status}→${r.headers.get('location')}` : String(r.status)
    } catch (e) {
      return 'HATA ' + e.message
    }
  }
  const stats = { kok: {}, products: {} }
  const samples = { kok404: [], products404: [] }
  for (const slug of excelSlugs) {
    const a = await check(`/${slug}`)
    const b = await check(`/products/${slug}`)
    const ka = a.startsWith('3') ? 'yönlendirme' : a
    const kb = b.startsWith('3') ? 'yönlendirme' : b
    stats.kok[ka] = (stats.kok[ka] ?? 0) + 1
    stats.products[kb] = (stats.products[kb] ?? 0) + 1
    if (a === '404' && samples.kok404.length < 5) samples.kok404.push(`/${slug}`)
    if (b === '404' && samples.products404.length < 10) samples.products404.push(`/products/${slug}`)
  }
  report.eskiAdreslerCanli = { base, ...stats, ornek: samples }
}

console.log(JSON.stringify(report, null, 2))
if (jsonOut) fs.writeFileSync(jsonOut, JSON.stringify(report, null, 2))
