/**
 * Döviz kurları (sunucu) – TCMB döviz satış kuru, 1 saat önbellekli.
 * Ürün fiyatları USD/EUR tutulur; mağaza, sepet ve sipariş fiyatları bu kurla TL'ye çevrilir (tam TL'ye yukarı yuvarlanır).
 * Sıra: TCMB today.xml → open.er-api.com → son başarılı canlı kur (.data/fx-rates.json) → lib/catalog/fx-snapshot.json (import anındaki kur).
 */

import fs from 'fs'
import path from 'path'
import fxSnapshot from '@/lib/catalog/fx-snapshot.json'
import type { MockProduct } from '@/lib/products-mock'

/** 1 birim döviz = kaç TL */
export type TryRates = { USD: number; EUR: number; updatedAt: string; source: 'TCMB' | 'fallback' | 'snapshot' }

const CACHE_MS = 60 * 60 * 1000
const FAILURE_RETRY_MS = 5 * 60 * 1000
const TCMB_XML = 'https://www.tcmb.gov.tr/kurlar/today.xml'
const FALLBACK_API = 'https://open.er-api.com/v6/latest/TRY'

export const SNAPSHOT_RATES: TryRates = {
  USD: fxSnapshot.USD,
  EUR: fxSnapshot.EUR,
  updatedAt: new Date(`${fxSnapshot.date}T00:00:00+03:00`).toISOString(),
  source: 'snapshot',
}

let cached: { at: number; rates: TryRates } | null = null
let inflight: Promise<TryRates> | null = null

/** Son başarılı canlı kur diske yazılır; sunucu yeniden başladığında kaynaklar yanıt vermezse import anındaki kur yerine bu kullanılır. */
const LAST_RATES_FILE = process.env.FX_CACHE_FILE || path.join(process.cwd(), '.data', 'fx-rates.json')

function readLastRates(): TryRates | null {
  try {
    const data = JSON.parse(fs.readFileSync(LAST_RATES_FILE, 'utf8'))
    if (data?.USD > 0 && data?.EUR > 0 && typeof data.updatedAt === 'string') {
      return { USD: data.USD, EUR: data.EUR, updatedAt: data.updatedAt, source: 'fallback' }
    }
  } catch {
    // dosya yok veya okunamıyor
  }
  return null
}

function writeLastRates(rates: TryRates) {
  try {
    fs.mkdirSync(path.dirname(LAST_RATES_FILE), { recursive: true })
    fs.writeFileSync(LAST_RATES_FILE, JSON.stringify({ USD: rates.USD, EUR: rates.EUR, updatedAt: rates.updatedAt }))
  } catch {
    // salt okunur dosya sistemi: yalnızca bellek içi önbellek kullanılır
  }
}

function parseTcmb(xml: string, code: 'USD' | 'EUR'): number | null {
  const m = xml.match(new RegExp(`Kod="${code}"[\\s\\S]*?<ForexSelling>([\\d.,]+)<`, 'i'))
  if (!m) return null
  const v = parseFloat(m[1].replace(',', '.'))
  return Number.isFinite(v) && v > 0 ? v : null
}

async function fetchWithTimeout(url: string, init: RequestInit = {}, ms = 8000): Promise<Response> {
  const ctrl = new AbortController()
  const t = setTimeout(() => ctrl.abort(), ms)
  try {
    // no-store yerine süreli önbellek: statik/ISR sayfalarda (ürün sayfası, Merchant akışı, sitemap) da canlı kur kullanılabilsin
    return await fetch(url, { ...init, signal: ctrl.signal, next: { revalidate: CACHE_MS / 1000 } })
  } finally {
    clearTimeout(t)
  }
}

async function loadRates(): Promise<TryRates> {
  try {
    const res = await fetchWithTimeout(TCMB_XML, { headers: { Accept: 'application/xml, text/xml' } })
    if (res.ok) {
      const xml = await res.text()
      const USD = parseTcmb(xml, 'USD')
      const EUR = parseTcmb(xml, 'EUR')
      if (USD && EUR) {
        const rates: TryRates = { USD, EUR, updatedAt: new Date().toISOString(), source: 'TCMB' }
        writeLastRates(rates)
        return rates
      }
    }
  } catch (e) {
    console.error('TCMB kur hatası:', e)
  }
  try {
    const res = await fetchWithTimeout(FALLBACK_API, { headers: { Accept: 'application/json' } })
    if (res.ok) {
      const data = await res.json()
      const usd = Number(data?.rates?.USD)
      const eur = Number(data?.rates?.EUR)
      if (data?.result === 'success' && usd > 0 && eur > 0) {
        const rates: TryRates = { USD: 1 / usd, EUR: 1 / eur, updatedAt: new Date().toISOString(), source: 'fallback' }
        writeLastRates(rates)
        return rates
      }
    }
  } catch (e) {
    console.error('Yedek kur API hatası:', e)
  }
  return readLastRates() ?? SNAPSHOT_RATES
}

/** Güncel kur (önbellekli). Hiçbir kaynak yanıt vermezse son başarılı kur veya import anındaki kur. */
export async function getTryRates(): Promise<TryRates> {
  const now = Date.now()
  if (cached && now - cached.at < (cached.rates.source === 'TCMB' ? CACHE_MS : FAILURE_RETRY_MS)) return cached.rates
  if (!inflight) {
    inflight = loadRates()
      .then((rates) => {
        // Kaynaklar düşerse daha önce alınmış canlı kuru koru
        const keep = rates.source !== 'TCMB' && cached?.rates.source === 'TCMB' ? cached.rates : rates
        cached = { at: Date.now(), rates: keep }
        return keep
      })
      .finally(() => {
        inflight = null
      })
  }
  return inflight
}

/** Tam TL'ye yukarı yuvarlar (kayan nokta artığı 6.340,0000001 → 6.341 olmasın) */
const ceilTry = (n: number) => Math.ceil(n - 1e-9)

/** Döviz cinsinden fiyatı TL'ye çevirir; sonuç tam TL'ye yukarı yuvarlanır (scripts/import-ikas-excel.py ile aynı kural) */
export function toTry(basePrice: number, currency: MockProduct['priceCurrency'], rates: TryRates): number {
  if (!currency || currency === 'TRY') return Math.round(basePrice * 100) / 100
  return ceilTry(basePrice * rates[currency])
}

/** Ürünün (ve varyantlarının) TL fiyatını döviz fiyatından yeniden hesaplar. Döviz fiyatı olmayan ürünler değişmez. */
export function applyTryRates<T extends MockProduct>(product: T, rates: TryRates): T {
  const currency = product.priceCurrency
  if (!currency || currency === 'TRY') return product
  const next = { ...product }
  if (typeof product.basePrice === 'number') next.price = toTry(product.basePrice, currency, rates)
  if (product.variants) {
    next.variants = product.variants.map((v) =>
      typeof v.basePrice === 'number' ? { ...v, price: toTry(v.basePrice, currency, rates) } : v
    )
  }
  return next
}
