/**
 * Uyumlu ürün kuralının katalog üzerindeki etkisi (madde 6): DC sistem ürünlerinden voltajı okunamayanlar
 * ve örnek ürünlerin uyumlu önerileri. Kullanım: npx tsx scripts/check-compat.ts
 */
import { mockProducts } from '../lib/products-mock'
import { withDetails } from '../lib/catalog-details'
import { DC_SYSTEM_CATEGORIES, voltageClasses } from '../lib/compat'
import { getComplementaryIds } from '../lib/products-mock'

const all = mockProducts.map(withDetails)
const dc = all.filter((p) => DC_SYSTEM_CATEGORIES.has(p.category))
const unknown = dc.filter((p) => voltageClasses(p).size === 0)
console.log(`DC sistem ürünü ${dc.length}, voltajı okunamayan ${unknown.length}`)
for (const p of unknown.slice(0, 25)) console.log(`  ? ${p.category} | ${p.name}`)

const byName = (re: RegExp) => all.find((p) => re.test(p.name))
for (const re of [/AFT Güç Katmanı/i, /AFT 5[,.]4 kWh LFP/i, /Marine/i, /Victron Phoenix 24\/250/i, /HV/i]) {
  const p = byName(re)
  if (!p) continue
  const ids = getComplementaryIds(p)
  console.log(`\n${p.name} [${[...voltageClasses(p)].join(',') || '—'}] → ${ids.length} öneri`)
  for (const id of ids.slice(0, 6)) {
    const c = all.find((x) => x.id === id)!
    console.log(`   - ${c.category} | ${c.name.slice(0, 70)} [${[...voltageClasses(c)].join(',') || '—'}]`)
  }
}
