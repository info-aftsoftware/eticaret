/**
 * Katalog İngilizce katmanı (lib/catalog/en/*.json) bakımı. Türkçe katalog import-ikas-excel.py ile yeniden
 * üretildiğinde EN dosyalarına dokunulmaz; değişen/yeni metinler bu betikle bulunup çevrilir.
 *
 *   npx tsx scripts/catalog-en.ts check            # eksik / eskimiş çevirileri say (--strict: eksik varsa çıkış kodu 1)
 *   npx tsx scripts/catalog-en.ts extract <klasör>  # eksikleri çeviri paketlerine böl (desc-NN, products-NN, specs-*)
 *   npx tsx scripts/catalog-en.ts merge <klasör>    # <paket>.out.json çevirilerini doğrulayıp EN dosyalarına ekle
 *
 * Paket biçimi: girdi [{ id, tr }] (ürün paketi: [{ id, name, description, variants }]);
 * çıktı { [id]: "EN" } (ürün paketi: { [id]: { name, description, variants: { [key]: label } } }).
 */

import fs from 'node:fs'
import path from 'node:path'
import crypto from 'node:crypto'
import { htmlSegments, inlineTags } from '../lib/catalog-en/html-segments'

const ROOT = path.resolve(__dirname, '..')
const CATALOG = path.join(ROOT, 'lib/catalog')
const EN_DIR = path.join(CATALOG, 'en')
const EN_PRODUCTS = path.join(EN_DIR, 'products.json')
const EN_SPECS = path.join(EN_DIR, 'specs.json')
const EN_DESCRIPTIONS = path.join(EN_DIR, 'descriptions.json')

type Product = { id: string; name: string; description?: string; variants?: { key: string; label: string }[] }
type Details = Record<string, { specifications?: Record<string, string>; variants?: Record<string, { specifications?: Record<string, string> }> }>
type EnProduct = { name: string; description?: string; variants?: Record<string, string>; src: string }
type EnSpecs = { keys: Record<string, string>; values: Record<string, string> }

const readJson = <T>(file: string, fallback: T): T => (fs.existsSync(file) ? (JSON.parse(fs.readFileSync(file, 'utf8')) as T) : fallback)
const writeJson = (file: string, data: unknown) => {
  fs.mkdirSync(path.dirname(file), { recursive: true })
  fs.writeFileSync(file, JSON.stringify(data, null, 1) + '\n')
}
const sortKeys = <T>(obj: Record<string, T>) =>
  Object.fromEntries(Object.entries(obj).sort(([a], [b]) => (a < b ? -1 : a > b ? 1 : 0)))

const products = readJson<Product[]>(path.join(CATALOG, 'products.json'), [])
const details = readJson<Details>(path.join(CATALOG, 'product-details.json'), {})
const descriptions = readJson<Record<string, string>>(path.join(CATALOG, 'descriptions.json'), {})

/** Ürün metinlerinin özeti: Türkçe ad/açıklama/varyant adı değişince EN kaydı "eskimiş" sayılır */
export function productSourceHash(p: Product): string {
  const text = [p.name, p.description ?? '', ...(p.variants ?? []).map((v) => `${v.key}=${v.label}`)].join('\n')
  return crypto.createHash('sha1').update(text).digest('hex').slice(0, 10)
}

/** Değeri olduğu gibi kullanılabilir (sayı/birim/model kodu; lib/catalog-en sayı biçimini dönüştürür) */
export const specValueNeedsTranslation = (v: string) => /[A-Za-zÇĞİÖŞÜçğıöşü]{3,}/.test(v) || /[çğıöşüÇĞİÖŞÜ]/.test(v)

function allSpecs(): { keys: Set<string>; values: Set<string> } {
  const keys = new Set<string>()
  const values = new Set<string>()
  const add = (s?: Record<string, string>) => {
    for (const [k, v] of Object.entries(s ?? {})) {
      keys.add(k.trim())
      if (specValueNeedsTranslation(String(v).trim())) values.add(String(v).trim())
    }
  }
  for (const d of Object.values(details)) {
    add(d.specifications)
    for (const v of Object.values(d.variants ?? {})) add(v.specifications)
  }
  return { keys, values }
}

/** Ürün adıyla aynı açıklama segmentleri (h2 başlığı) ürün çevirisinden doldurulur, ayrıca çevrilmez */
const productNames = new Set(products.map((p) => p.name))

function missing() {
  const enProducts = readJson<Record<string, EnProduct>>(EN_PRODUCTS, {})
  const enSpecs = readJson<EnSpecs>(EN_SPECS, { keys: {}, values: {} })
  const enDesc = readJson<Record<string, string>>(EN_DESCRIPTIONS, {})

  const productsMissing = products.filter((p) => {
    const en = enProducts[p.id]
    return !en || en.src !== productSourceHash(p)
  })
  const { keys, values } = allSpecs()
  const keysMissing = [...keys].filter((k) => enSpecs.keys[k] == null)
  const valuesMissing = [...values].filter((v) => enSpecs.values[v] == null)

  // Segmentler ilk göründükleri ürün sırasıyla: aynı ürünün metinleri aynı pakete düşer
  const seen = new Set<string>()
  const segmentsMissing: string[] = []
  for (const p of products) {
    const html = descriptions[p.id]
    if (!html) continue
    for (const s of htmlSegments(html)) {
      if (seen.has(s)) continue
      seen.add(s)
      if (enDesc[s] == null && !productNames.has(s)) segmentsMissing.push(s)
    }
  }
  return { productsMissing, keysMissing, valuesMissing, segmentsMissing, totalSegments: seen.size }
}

function check(strict: boolean) {
  const m = missing()
  const report = {
    products: `${products.length - m.productsMissing.length}/${products.length}`,
    specKeys: m.keysMissing.length,
    specValues: m.valuesMissing.length,
    descriptionSegments: `${m.totalSegments - m.segmentsMissing.length}/${m.totalSegments}`,
  }
  console.log('EN katalog kapsamı (eksik):', report)
  if (m.productsMissing.length) console.log('Çevirisi eksik/eskimiş ürünler:', m.productsMissing.slice(0, 20).map((p) => p.id))
  const anyMissing = m.productsMissing.length + m.keysMissing.length + m.valuesMissing.length + m.segmentsMissing.length > 0
  if (strict && anyMissing) process.exit(1)
}

function chunk<T>(items: T[], size: (t: T) => number, max: number): T[][] {
  const out: T[][] = []
  let cur: T[] = []
  let total = 0
  for (const it of items) {
    const s = size(it)
    if (cur.length && total + s > max) {
      out.push(cur)
      cur = []
      total = 0
    }
    cur.push(it)
    total += s
  }
  if (cur.length) out.push(cur)
  return out
}

function extract(dir: string) {
  fs.mkdirSync(dir, { recursive: true })
  const m = missing()
  const pad = (n: number) => String(n + 1).padStart(2, '0')
  const index: Record<string, string> = {}

  const segItems = m.segmentsMissing.map((tr, i) => {
    const id = `d${String(i + 1).padStart(5, '0')}`
    index[id] = tr
    return { id, tr }
  })
  chunk(segItems, (s) => s.tr.length, 40_000).forEach((batch, i) => writeJson(path.join(dir, `desc-${pad(i)}.json`), batch))

  const prodItems = m.productsMissing.map((p) => ({
    id: p.id,
    name: p.name,
    description: p.description ?? '',
    ...(p.variants?.length ? { variants: p.variants.map((v) => ({ key: v.key, label: v.label })) } : {}),
  }))
  chunk(prodItems, (p) => JSON.stringify(p).length, 30_000).forEach((batch, i) =>
    writeJson(path.join(dir, `products-${pad(i)}.json`), batch)
  )

  const keyItems = m.keysMissing.map((tr, i) => {
    const id = `k${String(i + 1).padStart(4, '0')}`
    index[id] = tr
    return { id, tr }
  })
  const valueItems = m.valuesMissing.map((tr, i) => {
    const id = `v${String(i + 1).padStart(4, '0')}`
    index[id] = tr
    return { id, tr }
  })
  if (keyItems.length) writeJson(path.join(dir, 'specs-keys.json'), keyItems)
  if (valueItems.length) writeJson(path.join(dir, 'specs-values.json'), valueItems)
  writeJson(path.join(dir, '_index.json'), index)
  console.log({
    segments: segItems.length,
    products: prodItems.length,
    specKeys: keyItems.length,
    specValues: valueItems.length,
  })
}

function merge(dir: string) {
  const index = readJson<Record<string, string>>(path.join(dir, '_index.json'), {})
  const enProducts = readJson<Record<string, EnProduct>>(EN_PRODUCTS, {})
  const enSpecs = readJson<EnSpecs>(EN_SPECS, { keys: {}, values: {} })
  const enDesc = readJson<Record<string, string>>(EN_DESCRIPTIONS, {})
  const byId = new Map(products.map((p) => [p.id, p]))
  const problems: string[] = []
  const counts = { segments: 0, products: 0, specKeys: 0, specValues: 0 }

  for (const file of fs.readdirSync(dir).filter((f) => f.endsWith('.out.json')).sort()) {
    const out = readJson<Record<string, unknown>>(path.join(dir, file), {})
    if (file.startsWith('products-')) {
      for (const [id, raw] of Object.entries(out)) {
        const p = byId.get(id)
        const en = raw as { name?: string; description?: string; variants?: Record<string, string> }
        if (!p || !en?.name?.trim()) {
          problems.push(`${file}: ${id} ürün yok / ad boş`)
          continue
        }
        const variants = p.variants?.length ? Object.fromEntries(p.variants.map((v) => [v.key, en.variants?.[v.key]?.trim() || ''])) : undefined
        if (variants && Object.values(variants).some((l) => !l)) problems.push(`${file}: ${id} varyant adı eksik`)
        enProducts[id] = {
          name: en.name.trim(),
          ...(p.description ? { description: (en.description ?? '').trim() } : {}),
          ...(variants ? { variants } : {}),
          src: productSourceHash(p),
        }
        counts.products++
      }
      continue
    }
    for (const [id, enRaw] of Object.entries(out)) {
      const tr = index[id]
      const en = typeof enRaw === 'string' ? enRaw.trim() : ''
      if (tr == null || !en) {
        problems.push(`${file}: ${id} bilinmeyen kimlik / boş çeviri`)
        continue
      }
      if (id.startsWith('d')) {
        if (inlineTags(tr).join('|') !== inlineTags(en).join('|')) {
          problems.push(`${file}: ${id} satır içi etiketler farklı`)
          continue
        }
        enDesc[tr] = en
        counts.segments++
      } else if (id.startsWith('k')) {
        enSpecs.keys[tr] = en
        counts.specKeys++
      } else if (id.startsWith('v')) {
        enSpecs.values[tr] = en
        counts.specValues++
      }
    }
  }
  // Açıklamadaki ürün adı başlığı ürün çevirisinden
  for (const p of products) {
    const en = enProducts[p.id]
    if (en?.name && enDesc[p.name] == null) enDesc[p.name] = en.name
  }

  writeJson(EN_PRODUCTS, sortKeys(enProducts))
  writeJson(EN_SPECS, { keys: sortKeys(enSpecs.keys), values: sortKeys(enSpecs.values) })
  writeJson(EN_DESCRIPTIONS, sortKeys(enDesc))
  console.log('Eklendi:', counts)
  if (problems.length) {
    console.log(`${problems.length} sorun:`)
    for (const p of problems.slice(0, 80)) console.log('  ' + p)
  }
}

const [cmd, arg] = process.argv.slice(2)
if (cmd === 'check') check(process.argv.includes('--strict'))
else if (cmd === 'extract' && arg) extract(path.resolve(arg))
else if (cmd === 'merge' && arg) merge(path.resolve(arg))
else {
  console.log('Kullanım: npx tsx scripts/catalog-en.ts check [--strict] | extract <klasör> | merge <klasör>')
  process.exit(1)
}
