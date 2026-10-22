/**
 * Sitenin il/ilçe listesini (lib/tr-cities-data.json) Geliver'in il plaka kodu ve ilçe kimlikleriyle eşler.
 * Geliver gönderisinde alıcı adresi cityCode + districtID ile gönderilir (ad eşleşmesine güvenilmez).
 * Geliver'in /cities ve /districts uçları herkese açıktır (anahtar gerekmez).
 *
 *   node scripts/build-geliver-districts.mjs
 *
 * Çıktı: lib/shipping/geliver-districts.json → { "<il>": { "code": "34", "districts": { "<ilçe>": 107062 } } }
 * Eşleşmeyen ilçeler ekrana yazılır; "Merkez" Geliver'de il adıyla geçer (Adıyaman Merkez → Adıyaman).
 */
import fs from 'node:fs'
import path from 'node:path'

const API = 'https://api.geliver.io/api/v1'
const ROOT = process.cwd()
const ours = JSON.parse(fs.readFileSync(path.join(ROOT, 'lib', 'tr-cities-data.json'), 'utf8'))

const fold = (s) =>
  s
    .toLocaleLowerCase('tr')
    .replace(/[ıi̇]/g, 'i')
    .replace(/ğ/g, 'g')
    .replace(/ü/g, 'u')
    .replace(/ş/g, 's')
    .replace(/ö/g, 'o')
    .replace(/ç/g, 'c')
    .replace(/â/g, 'a')
    .replace(/î/g, 'i')
    .replace(/û/g, 'u')
    .replace(/[^a-z0-9]/g, '')

async function get(url) {
  const res = await fetch(url, { headers: { Accept: 'application/json' } })
  if (!res.ok) throw new Error(`${url}: HTTP ${res.status}`)
  const body = await res.json()
  return Array.isArray(body?.data) ? body.data : []
}

const cities = await get(`${API}/cities?countryCode=TR`)
const cityByName = new Map(cities.map((c) => [fold(c.name), c]))
const out = {}
const problems = []
for (const city of ours) {
  const g = cityByName.get(fold(city.name))
  if (!g) {
    problems.push(`İl bulunamadı: ${city.name}`)
    continue
  }
  const districts = await get(`${API}/districts?countryCode=TR&cityCode=${g.cityCode}`)
  const byName = new Map(districts.map((d) => [fold(d.name), d]))
  const map = {}
  for (const name of city.districts) {
    const key = fold(name)
    const hit = byName.get(key) ?? (key === 'merkez' ? byName.get(fold(city.name)) ?? byName.get(fold(`${city.name} merkez`)) ?? byName.get('merkez') : undefined)
    if (hit) map[name] = hit.districtID
    else problems.push(`${city.name} / ${name}: Geliver'de yok (Geliver: ${districts.map((d) => d.name).join(', ')})`)
  }
  out[city.name] = { code: g.cityCode, districts: map }
}

fs.writeFileSync(path.join(ROOT, 'lib', 'shipping', 'geliver-districts.json'), JSON.stringify(out) + '\n')
const total = ours.reduce((n, c) => n + c.districts.length, 0)
const matched = Object.values(out).reduce((n, c) => n + Object.keys(c.districts).length, 0)
console.log(`${Object.keys(out).length}/${ours.length} il, ${matched}/${total} ilçe eşlendi`)
for (const p of problems) console.log('  ! ' + p.slice(0, 300))
