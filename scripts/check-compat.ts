/**
 * Uyumlu ürün kuralının katalog üzerindeki etkisi (madde 6): DC sistem ürünlerinden voltajı okunamayanlar ve
 * bunların teknik özelliklerinde / uzun açıklamasında voltaj ifadesi olup olmadığı. Kullanım: npx tsx scripts/check-compat.ts
 */
import { mockProducts } from '../lib/products-mock'
import { withDetails } from '../lib/catalog-details'
import { getProductDescriptionHtml } from '../lib/product-descriptions'
import { DC_SYSTEM_CATEGORIES, hasKnownVoltage, voltageClasses } from '../lib/compat'

const strip = (html: string) => html.replace(/<[^>]+>/g, ' ').replace(/&nbsp;/g, ' ').replace(/\s+/g, ' ')
const all = mockProducts.map(withDetails)
const dc = all.filter((p) => DC_SYSTEM_CATEGORIES.has(p.category))
// Panel değeri burada yok (veritabanı okunmaz): veri dosyası ve ad/özellik; tanımsızlar panelde "Voltajı tanımsız" sekmesinde
const unknown = dc.filter((p) => !hasKnownVoltage(p))
console.log(`DC sistem ürünü ${dc.length}, veri dosyası ve ad/varyanttan voltajı okunamayan ${unknown.length}\n`)
for (const p of unknown) {
  const fromSpecs = [...voltageClasses({ name: '', specifications: p.specifications, variants: p.variants })]
  const desc = strip(getProductDescriptionHtml(p.id) ?? '')
  const fromDesc = [...voltageClasses({ name: desc.slice(0, 4000) })]
  const hits = (desc.match(/[^.]{0,40}\d+(?:[.,]\d+)?\s*V(?:DC)?(?![a-z])[^.]{0,30}/gi) ?? []).slice(0, 3)
  console.log(`? ${p.id}\n   ${p.category} | ${p.name}\n   özellik: [${fromSpecs.join(',')}]  açıklama: [${fromDesc.join(',')}]  ${hits.join(' … ')}`)
}
