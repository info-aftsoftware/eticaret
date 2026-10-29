// Ürün sayfalarının JSON-LD denetimi: site haritasındaki her /products/<id> sayfası çekilir, ürün şeması Google'ın
// ürün snippet'i, satıcı listelemesi ve ürün varyantı kurallarına göre denetlenir. Yalnız GET isteği atar.
//   node scripts/audit-product-ld.mjs [base] [--json out.json] [-v]
//   base: http://localhost:3000 (varsayılan) ya da https://voltekno.com
import { writeFileSync } from 'node:fs'

const args = process.argv.slice(2)
const base = (args.find((a) => /^https?:\/\//.test(a)) || 'http://localhost:3000').replace(/\/$/, '')
const jsonOut = args.includes('--json') ? args[args.indexOf('--json') + 1] : null
const verbose = args.includes('-v')

const VARIES = new Set(['color', 'size', 'suggestedAge', 'suggestedGender', 'material', 'pattern'].map((p) => `https://schema.org/${p}`))

const sitemap = await (await fetch(`${base}/sitemap.xml`)).text()
const paths = [...sitemap.matchAll(/<loc>([^<]+)<\/loc>/g)]
  .map((m) => new URL(m[1]).pathname)
  .filter((p) => /^\/products\/[^/]+$/.test(p))

const rows = []
async function scan(path) {
  const r = await fetch(base + path)
  const html = await r.text()
  const blocks = [...html.matchAll(/<script type="application\/ld\+json"[^>]*>([\s\S]*?)<\/script>/g)]
    .map((m) => {
      try {
        return JSON.parse(m[1])
      } catch {
        return null
      }
    })
    .filter(Boolean)
  const ld = blocks.find((b) => b['@type'] === 'Product' || b['@type'] === 'ProductGroup')
  rows.push({ path, status: r.status, ld, hreflang: /hreflang=/.test(html) })
}
const queue = [...paths]
await Promise.all(
  Array.from({ length: 4 }, async () => {
    while (queue.length) {
      const p = queue.shift()
      try {
        await scan(p)
      } catch (e) {
        rows.push({ path: p, status: 0, error: String(e) })
      }
    }
  }),
)
if (jsonOut) writeFileSync(jsonOut, JSON.stringify(rows))

const errors = []
const warnings = []
const err = (path, m) => errors.push({ path, m })
const warn = (path, m) => warnings.push({ path, m })

function checkOffer(path, o) {
  if (!o || o['@type'] !== 'Offer') return err(path, 'Offer yok')
  if (!(typeof o.price === 'number' && o.price > 0)) err(path, 'price sayı ve > 0 olmalı')
  if (o.priceCurrency !== 'TRY') err(path, 'priceCurrency TRY değil')
  if (!/^https:\/\/schema\.org\/(InStock|OutOfStock)$/.test(o.availability)) err(path, 'availability')
  if (!o.url) warn(path, 'offer url yok')
  const rp = o.hasMerchantReturnPolicy
  if (!rp?.applicableCountry || !rp?.returnPolicyCategory) err(path, 'iade politikası eksik')
  const sd = o.shippingDetails
  if (!sd) return warn(path, 'shippingDetails yok (isteğe bağlı; akü ve kurulumlu ürünlerde beklenen)')
  if (typeof sd.shippingRate?.value !== 'number' || sd.shippingRate.currency !== 'TRY') err(path, 'shippingRate')
  if (sd.shippingDestination?.addressCountry !== 'TR') err(path, 'shippingDestination')
}

function checkProduct(path, p, variant = false, groupProps = false) {
  if (!p.name) err(path, 'name yok')
  if (!p.image?.length) err(path, 'image yok (satıcı listelemesi için zorunlu)')
  if (!variant && !p.offers && !p.aggregateRating && !p.review) err(path, 'offers/review/aggregateRating yok')
  if (variant && !p.offers) err(path, 'varyantta offers yok')
  if (p.offers) checkOffer(path, p.offers)
  if (!p.sku) warn(path, 'sku yok')
  // Varyantın kendi tablosu yoksa ürün grubundaki ortak özellikler geçerli
  if (!p.additionalProperty?.length && !groupProps) warn(path, 'additionalProperty boş')
}

let offers = 0
let shipped = 0
for (const r of rows) {
  if (r.status !== 200) {
    err(r.path, `HTTP ${r.status}${r.error ? ` ${r.error}` : ''}`)
    continue
  }
  const ld = r.ld
  if (!ld) continue // teklifle satılan ürün: şema bilerek yok
  const items = ld['@type'] === 'ProductGroup' ? ld.hasVariant ?? [] : [ld]
  for (const it of items) {
    if (it.offers) offers++
    if (it.offers?.shippingDetails) shipped++
  }
  if (ld['@type'] === 'Product') {
    checkProduct(r.path, ld)
    continue
  }
  if (!ld.name) err(r.path, 'ProductGroup name yok')
  if (!ld.productGroupID) warn(r.path, 'productGroupID yok')
  if (!ld.variesBy?.length || ld.variesBy.some((v) => !VARIES.has(v))) err(r.path, `variesBy desteklenmiyor: ${ld.variesBy}`)
  if (!ld.hasVariant?.length) err(r.path, 'hasVariant boş')
  const ids = new Set()
  for (const v of ld.hasVariant ?? []) {
    const vp = `${r.path} [${v.sku ?? v['@id']}]`
    checkProduct(vp, v, true, Boolean(ld.additionalProperty?.length))
    if (v.inProductGroupWithID !== ld.productGroupID) err(vp, 'inProductGroupWithID uyuşmuyor')
    for (const prop of ld.variesBy ?? []) if (!v[prop.split('/').pop()]) err(vp, `varyantta ${prop} yok`)
    if (ids.has(v['@id'])) err(vp, 'tekrarlanan @id')
    ids.add(v['@id'])
    if (!v.offers?.url?.includes('?variant=')) err(vp, 'varyant adresi yok')
  }
}

const tally = (list) =>
  Object.entries(list.reduce((m, e) => ((m[e.m] = (m[e.m] ?? 0) + 1), m), {})).sort((a, b) => b[1] - a[1])
const ok = rows.filter((r) => r.status === 200)
console.log(`${base}: ${rows.length} ürün sayfası, ${ok.length} tanesi 200`)
console.log(
  `ProductGroup ${ok.filter((r) => r.ld?.['@type'] === 'ProductGroup').length} · Product ${ok.filter((r) => r.ld?.['@type'] === 'Product').length} · şemasız (teklifle) ${ok.filter((r) => !r.ld).length} · hreflang olan ${ok.filter((r) => r.hreflang).length}`,
)
console.log(`Teklif ${offers}, kargo bilgili ${shipped}`)
console.log(`HATA ${errors.length} · UYARI ${warnings.length}`)
for (const [m, n] of tally(errors)) console.log(`  hata  ${n}× ${m}`)
for (const [m, n] of tally(warnings)) console.log(`  uyarı ${n}× ${m}`)
if (verbose) for (const e of [...errors, ...warnings]) console.log(`${e.path}: ${e.m}`)
process.exitCode = errors.length ? 1 : 0
