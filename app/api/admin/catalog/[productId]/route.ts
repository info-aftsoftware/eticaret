/**
 * Admin Catalog API (single product)
 * GET: merged product (mock + ProductOverride)
 * PATCH: upsert ProductOverride for this productId
 * DELETE: remove ProductOverride (product stays from mock if exists)
 */

import { NextRequest, NextResponse } from 'next/server'
import { processStockAlerts } from '@/lib/stock-alerts'
import { Prisma, type ProductOverride } from '@prisma/client'
import { prisma } from '@/lib/prisma'
import { checkAdmin, logAdminAction } from '@/lib/adminAuth'
import { getMergedProductById, type MergedProduct } from '@/lib/catalog-merge'
import { getTryRates } from '@/lib/fx-rates'
import { withDetails } from '@/lib/catalog-details'
import { getProductDescriptionHtml } from '@/lib/product-descriptions'
import { mockProducts, type MockProduct } from '@/lib/products-mock'
import { variantStockKey } from '@/lib/variant-stock'
import { canSeeCost } from '@/lib/admin-users'
import { sanitizeCost, sanitizeLogistics } from '@/lib/product-admin-fields'
import { publishProblems } from '@/lib/product-publish'
import { diffFields, diffVariants, summarizeChanges } from '@/lib/audit-diff'
import { notifyLowStockTransitions } from '@/lib/low-stock'
import { revalidateStorefront } from '@/lib/storefront-revalidate'

const VARIANT_KEYS = ['key', 'label', 'price', 'basePrice', 'sku', 'specifications', 'dimensionsCm', 'weightKg', 'desi', 'desiSource'] as const

/** Varyant listesini doğrular; geçersizse hata mesajı döner. Anahtar (key) sepet kimliğinin parçasıdır, değişmemelidir. */
function sanitizeVariants(input: unknown): { value: Record<string, unknown>[] } | { error: string } {
  if (!Array.isArray(input)) return { error: 'variants bir liste olmalı' }
  if (input.length > 200) return { error: 'En fazla 200 varyant eklenebilir' }
  const seen = new Set<string>()
  const out: Record<string, unknown>[] = []
  for (const raw of input) {
    if (!raw || typeof raw !== 'object') return { error: 'Geçersiz varyant' }
    const v = raw as Record<string, unknown>
    const key = typeof v.key === 'string' ? v.key.trim() : ''
    const label = typeof v.label === 'string' ? v.label.trim() : ''
    const price = Number(v.price)
    if (!/^[A-Za-z0-9_-]{1,80}$/.test(key)) return { error: `Geçersiz varyant anahtarı: ${key || '(boş)'}` }
    if (seen.has(key)) return { error: `Aynı varyant anahtarı iki kez kullanılmış: ${key}` }
    seen.add(key)
    if (!label || label.length > 200) return { error: `Varyant adı gerekli (en fazla 200 karakter): ${key}` }
    if (!Number.isFinite(price) || price < 0) return { error: `Varyant fiyatı geçersiz: ${label}` }
    const clean: Record<string, unknown> = {}
    for (const k of VARIANT_KEYS) if (v[k] !== undefined && v[k] !== null && v[k] !== '') clean[k] = v[k]
    clean.key = key
    clean.label = label
    clean.price = Math.round(price * 100) / 100
    if (typeof clean.sku === 'string') clean.sku = clean.sku.trim().slice(0, 100)
    out.push(clean)
  }
  return { value: out }
}

function sanitizeImages(input: unknown): string[] | null {
  if (!Array.isArray(input)) return null
  return input
    .filter((u): u is string => typeof u === 'string' && /^(\/(?!\/)|https:\/\/)/.test(u.trim()))
    .map((u) => u.trim())
    .slice(0, 30)
}

/** İşlem kaydında izlenen ürün alanları (A09); maliyet birleştirilmiş üründe olmadığından burada yok */
const PRODUCT_AUDIT_LABELS: Record<string, string> = {
  name: 'Ad',
  sku: 'SKU',
  brand: 'Marka',
  category: 'Kategori',
  price: 'TL fiyat',
  basePrice: 'Döviz fiyatı',
  priceMode: 'Fiyatlandırma modu',
  stock: 'Stok',
  variantStock: 'Varyantlar ayrı stoklanır',
  featured: 'Öne çıkan',
  description: 'Kısa açıklama',
  fullDescription: 'Detaylı açıklama',
  slogan: 'Slogan',
  warranty: 'Garanti',
  imageCount: 'Görsel sayısı',
  imagesByVariant: 'Varyant görselleri',
  image: 'Kapak görseli',
  specifications: 'Teknik özellikler',
  features: 'Öne çıkan özellikler',
  dimensionsCm: 'Koli ölçüsü (cm)',
  weightKg: 'Koli ağırlığı (kg)',
  packageCount: 'Koli sayısı',
  desi: 'Desi',
  saleMode: 'Satış biçimi',
  status: 'Yayın durumu',
}

type VariantRecord = Record<string, unknown> & { key: string; label: string; basePrice?: number }

const MODE_TR = { fx: 'Dövize bağlı', fixed: 'Sabit TL' } as const

/** Kayda yalnızca bilinen varyant alanları yazılır (birleştirilmiş üründeki stok gibi alanlar düşer) */
const cleanVariant = (v: Record<string, unknown>): VariantRecord => {
  const out: Record<string, unknown> = {}
  for (const k of VARIANT_KEYS) if (v[k] !== undefined && v[k] !== null && v[k] !== '') out[k] = v[k]
  return out as VariantRecord
}

/**
 * Fiyatlandırma modu (A05): "fx" dövize bağlı (katalog veya panelde girilen döviz fiyatı × güncel kur),
 * "fixed" sabit TL. Mod yalnızca açık seçimle değişir; TL fiyat yazan eski istemciler/içe aktarma sabit TL'ye geçirir.
 * fx'e dönüşte eksik varyant döviz fiyatları katalogdan geri yüklenir; sabit TL'de varyant döviz fiyatları bırakılır.
 */
function resolvePricing({ before, source: mock, body, data }: {
  before: MergedProduct
  /** Döviz fiyatı kaynağı: katalog ürünü (ayrıntılarıyla) veya panelde dövizli eklenen ürünün kaydı */
  source?: Pick<MockProduct, 'priceCurrency' | 'basePrice' | 'variants'>
  body: { price?: unknown; priceMode?: unknown; basePrice?: unknown }
  data: Record<string, unknown>
}): { audit: string[] } | { error: string } {
  const audit: string[] = []
  const fxCapable = !!mock?.priceCurrency && mock.priceCurrency !== 'TRY' && typeof mock.basePrice === 'number'
  const current = before.priceMode ?? 'fixed'
  let next: 'fx' | 'fixed' = current
  if (body.priceMode !== undefined) {
    if (body.priceMode !== 'fx' && body.priceMode !== 'fixed') return { error: 'Geçersiz fiyatlandırma modu' }
    if (body.priceMode === 'fx' && !fxCapable) return { error: 'Bu ürünün kayıtlı döviz fiyatı yok; yalnızca sabit TL ile satılabilir.' }
    next = body.priceMode
  } else if (body.price !== undefined && current === 'fx') {
    next = 'fixed'
  }
  const switching = next !== current
  if (fxCapable && (switching || body.priceMode !== undefined)) data.priceMode = next
  if (switching) audit.push(`Fiyat modu: ${MODE_TR[current]} → ${MODE_TR[next]}`)

  const providedVariants = Array.isArray(data.variants) ? (data.variants as VariantRecord[]) : null
  const existingVariants = before.variants?.length ? before.variants.map((v) => cleanVariant(v as unknown as Record<string, unknown>)) : null

  if (next === 'fx') {
    data.price = null
    if (body.basePrice !== undefined) {
      if (body.basePrice === null) data.basePrice = null
      else {
        const n = Math.round(Number(body.basePrice) * 10000) / 10000
        if (!Number.isFinite(n) || n <= 0) return { error: 'Döviz fiyatı geçersiz' }
        data.basePrice = n
      }
      const oldBase = before.basePrice
      const newBase = data.basePrice ?? mock!.basePrice
      if (oldBase !== newBase) audit.push(`Döviz fiyatı: ${oldBase} → ${newBase} ${mock!.priceCurrency}`)
    }
    const list = providedVariants ?? (switching ? existingVariants : null)
    if (list) {
      const filled: VariantRecord[] = []
      for (const v of list) {
        if (typeof v.basePrice === 'number' && v.basePrice > 0) {
          filled.push(v)
          continue
        }
        const catalog = mock?.variants?.find((x) => x.key === v.key)?.basePrice
        if (typeof catalog !== 'number') return { error: `"${v.label}" varyantı için ${mock!.priceCurrency} fiyatı girin (kayıtlı döviz fiyatı yok).` }
        filled.push({ ...v, basePrice: catalog })
      }
      data.variants = filled
    }
  } else {
    if (switching) {
      const tl = body.price !== undefined ? Number(body.price) : before.price
      if (!Number.isFinite(tl) || tl < 0) return { error: 'Fiyat geçersiz' }
      data.price = Math.round(tl * 100) / 100
      audit.push(`Sabit TL fiyat: ${data.price} TL`)
    } else if (body.price !== undefined && Number(body.price) !== before.price) {
      audit.push(`TL fiyat: ${before.price} → ${Number(body.price)} TL`)
    }
    // Sabit TL'de varyantlar da sabit TL'dir (döviz fiyatı kaldırılır; TL fiyatı o anki değerinde kalır)
    const list = providedVariants ?? (switching ? existingVariants : null)
    if (list) data.variants = list.map(({ basePrice: _drop, ...rest }) => rest)
  }
  return { audit }
}

/**
 * Varyant bazında stok (A03): açma/kapama ve varyant stokları. Satırlar StockOverride'a "productId::key" ile yazılır.
 * Kapatılınca ortak stok, gönderilmediyse o anki varyant toplamıyla başlar (stok kaybolmaz).
 */
function resolveVariantStock({ before, body, data }: {
  before: MergedProduct
  body: { variantStock?: unknown; variantStocks?: unknown; stock?: unknown }
  data: Record<string, unknown>
}): { enabled: boolean; changed: boolean; rows: { key: string; stock: number }[]; audit: string[] } | { error: string } {
  const audit: string[] = []
  const rows: { key: string; stock: number }[] = []
  const wasEnabled = !!before.variantStock
  let enabled = wasEnabled
  if (body.variantStock !== undefined) {
    enabled = body.variantStock === true
    data.variantStock = enabled
  }
  const variants = (Array.isArray(data.variants) ? data.variants : before.variants ?? []) as VariantRecord[]
  if (enabled && !variants.length) return { error: 'Varyantı olmayan üründe ayrı varyant stoğu açılamaz.' }
  if (!wasEnabled && enabled) audit.push('Varyantlar ayrı stoklanıyor')

  if (enabled && body.variantStocks !== undefined) {
    if (!body.variantStocks || typeof body.variantStocks !== 'object' || Array.isArray(body.variantStocks)) return { error: 'variantStocks geçersiz' }
    for (const [key, raw] of Object.entries(body.variantStocks as Record<string, unknown>)) {
      const v = variants.find((x) => x.key === key)
      if (!v) return { error: `Bilinmeyen varyant: ${key}` }
      const n = Number(raw)
      if (!Number.isInteger(n) || n < 0) return { error: `"${v.label}" stoğu geçersiz (0 veya pozitif tam sayı)` }
      const old = wasEnabled ? before.variants?.find((x) => x.key === key)?.stock ?? 0 : null
      if (old !== n) audit.push(`${v.label} stok: ${old ?? '—'} → ${n}`)
      rows.push({ key: variantStockKey(before.id, key), stock: n })
    }
  }
  if (wasEnabled && !enabled) {
    const shared = body.stock !== undefined ? Math.max(0, Math.floor(Number(body.stock) || 0)) : before.stock ?? 0
    rows.push({ key: before.id, stock: shared })
    audit.push(`Varyantlar ortak stoğa döndü (stok ${shared})`)
  }
  return { enabled, changed: rows.length > 0 || enabled !== wasEnabled, rows, audit }
}

/**
 * Ürünün kayıtlı döviz fiyatı: katalog ürününde ayrıntı dosyasındaki (lib/catalog-details), panelde eklenen üründe
 * oluştururken seçilen para birimi ve döviz fiyatı (A06). Döviz fiyatı yoksa undefined (yalnız sabit TL).
 */
function pricingSource(productId: string, override: ProductOverride | null): Pick<MockProduct, 'priceCurrency' | 'basePrice' | 'variants'> | undefined {
  const raw = mockProducts.find((p) => p.id === productId)
  if (raw) {
    const m = withDetails(raw)
    return m.priceCurrency && m.priceCurrency !== 'TRY' && typeof m.basePrice === 'number' ? m : undefined
  }
  if (override && (override.priceCurrency === 'USD' || override.priceCurrency === 'EUR') && typeof override.basePrice === 'number') {
    return {
      priceCurrency: override.priceCurrency,
      basePrice: override.basePrice,
      variants: Array.isArray(override.variants) ? (override.variants as unknown as MockProduct['variants']) : undefined,
    }
  }
  return undefined
}

/** Yanıtta maliyet alanları dönmez (yetkisi olmayan role sızmasın) */
const withoutCost = ({ costPrice: _c, costCurrency: _cc, targetMargin: _t, ...rest }: ProductOverride) => rest

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ productId: string }> }
) {
  const auth = await checkAdmin(request)
  if ('error' in auth) {
    return NextResponse.json({ error: auth.error }, { status: auth.status })
  }

  try {
    const { productId } = await params
    const [product, override, rates] = await Promise.all([
      getMergedProductById(productId),
      prisma.productOverride.findUnique({ where: { productId } }),
      getTryRates(),
    ])
    if (!product) {
      return NextResponse.json({ error: 'Ürün bulunamadı' }, { status: 404 })
    }
    const raw = mockProducts.find((p) => p.id === productId)
    const source = pricingSource(productId, override)
    const fxCapable = !!source
    const showCost = canSeeCost(auth.actor.role)
    return NextResponse.json({
      ...product,
      // Panel için: katalog (Excel) ürünü mü, panelde düzenlenmiş mi
      _meta: {
        isCatalog: !!raw,
        hasOverride: !!override,
        overrideUpdatedAt: override?.updatedAt?.toISOString() ?? null,
        // Fiyatlandırma modu seçimi için kayıtlı döviz fiyatları (katalog veya panel) ve kullanılan kur (A05/A06)
        catalogPricing: fxCapable
          ? {
              currency: source!.priceCurrency,
              basePrice: source!.basePrice,
              variants: (source!.variants ?? []).map((v) => ({ key: v.key, label: v.label, basePrice: v.basePrice ?? null })),
              origin: raw ? 'catalog' : 'panel',
            }
          : null,
        rate: fxCapable ? { value: rates[source!.priceCurrency as 'USD' | 'EUR'], updatedAt: rates.updatedAt, source: rates.source } : null,
        // Maliyet yalnız Sahip/Yönetici rolüne gider (A06)
        cost: showCost ? { costPrice: override?.costPrice ?? null, costCurrency: override?.costCurrency ?? null, targetMargin: override?.targetMargin ?? null } : undefined,
        rates: showCost ? { USD: rates.USD, EUR: rates.EUR } : undefined,
        // Yayın (A08): panel ürünü taslak/yayında; katalog ürünü her zaman yayında
        status: raw ? 'published' : product.status === 'draft' ? 'draft' : 'published',
        // A17: varyant görsellerinin kaynağı (panel ataması / katalog / yok); A18: katalogdaki biçimli açıklama (önizleme ve geri dönüş için)
        variantImagesSource: override?.variantImages ? 'panel' : raw && !override?.images && product.imagesByVariant?.some((a) => a?.length) ? 'catalog' : null,
        catalogDescriptionHtml: raw ? getProductDescriptionHtml(productId) ?? null : null,
        descriptionSource: override?.fullDescription?.trim() ? 'panel' : raw && getProductDescriptionHtml(productId) ? 'catalog' : 'none',
        publishProblems: raw ? [] : publishProblems({ ...product, desi: product.logisticsSource === 'panel' ? product.desi : null }),
      },
    })
  } catch (error) {
    console.error('Admin catalog GET [productId] error:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}

export async function PATCH(
  request: NextRequest,
  { params }: { params: Promise<{ productId: string }> }
) {
  const auth = await checkAdmin(request)
  if ('error' in auth) {
    return NextResponse.json({ error: auth.error }, { status: auth.status })
  }

  try {
    const { productId } = await params
    const body = await request.json()
    const {
      name,
      slug,
      description,
      fullDescription,
      price,
      image,
      images,
      category,
      stock,
      featured,
      specifications,
      features,
      variants,
      brand,
      sku,
      tags,
      slogan,
      warranty,
      priceMode,
      basePrice,
      variantStock,
      variantStocks,
    } = body

    const [before, overrideRow] = await Promise.all([getMergedProductById(productId), prisma.productOverride.findUnique({ where: { productId } })])
    if (!before) return NextResponse.json({ error: 'Ürün bulunamadı' }, { status: 404 })
    const isCatalog = mockProducts.some((p) => p.id === productId)
    const source = pricingSource(productId, overrideRow)
    const audit: string[] = []

    const data: Record<string, unknown> = {}
    if (name !== undefined) data.name = name
    if (slug !== undefined) data.slug = slug
    if (description !== undefined) data.description = description
    if (fullDescription !== undefined) data.fullDescription = fullDescription
    if (price !== undefined) data.price = Number(price)
    if (image !== undefined) data.image = image
    if (images !== undefined) {
      const clean = sanitizeImages(images)
      data.images = clean && clean.length ? clean : Prisma.JsonNull
    }
    // Varyant görselleri (A17): { anahtar: görsel[] }; null katalog/varsayılan davranışa döner
    if (body.variantImages !== undefined) {
      if (body.variantImages === null) data.variantImages = Prisma.JsonNull
      else if (typeof body.variantImages !== 'object' || Array.isArray(body.variantImages)) return NextResponse.json({ error: 'variantImages geçersiz' }, { status: 400 })
      else {
        const map: Record<string, string[]> = {}
        for (const [k, v] of Object.entries(body.variantImages as Record<string, unknown>)) {
          if (!/^[A-Za-z0-9_-]{1,80}$/.test(k)) return NextResponse.json({ error: `Geçersiz varyant anahtarı: ${k}` }, { status: 400 })
          map[k] = sanitizeImages(v) ?? []
        }
        data.variantImages = map
      }
    }
    if (category !== undefined) data.category = category
    if (stock !== undefined) data.stock = Math.max(0, Math.floor(Number(stock) || 0))
    if (featured !== undefined) data.featured = Boolean(featured)
    if (specifications !== undefined) data.specifications =
      specifications != null && typeof specifications === 'object' ? specifications : Prisma.JsonNull
    if (features !== undefined) data.features = Array.isArray(features) ? features : Prisma.JsonNull
    if (variants !== undefined) {
      if (variants === null) data.variants = Prisma.JsonNull
      else {
        const res = sanitizeVariants(variants)
        if ('error' in res) return NextResponse.json({ error: res.error }, { status: 400 })
        data.variants = res.value.length ? res.value : Prisma.JsonNull
      }
    }
    if (price !== undefined && (!Number.isFinite(Number(price)) || Number(price) < 0)) {
      return NextResponse.json({ error: 'Fiyat geçersiz' }, { status: 400 })
    }
    if (brand !== undefined) data.brand = brand
    if (sku !== undefined) data.sku = sku
    if (tags !== undefined) data.tags = Array.isArray(tags) ? tags : Prisma.JsonNull
    if (slogan !== undefined) data.slogan = slogan
    if (warranty !== undefined) data.warranty = warranty

    // ── Fiyatlandırma modu (A05) ───────────────────────────────────────────
    const pricing = resolvePricing({ before, source, body: { price, priceMode, basePrice }, data })
    if ('error' in pricing) return NextResponse.json({ error: pricing.error }, { status: 400 })
    audit.push(...pricing.audit)

    // ── Maliyet (A06, yalnız Sahip/Yönetici) ve lojistik (A07) ─────────────
    const cost = sanitizeCost(body, canSeeCost(auth.actor.role))
    if ('error' in cost) return NextResponse.json({ error: cost.error }, { status: 400 })
    const logistics = sanitizeLogistics(body, {
      dimensionsCm: before.dimensionsCm ?? null,
      weightKg: before.weightKg ?? null,
      packageCount: before.packageCount ?? null,
      saleMode: overrideRow?.saleMode ?? before.saleMode ?? null,
      desi: before.logisticsSource === 'panel' ? before.desi ?? null : null,
    })
    if ('error' in logistics) return NextResponse.json({ error: logistics.error }, { status: 400 })
    Object.assign(data, cost.data, logistics.data)
    audit.push(...cost.audit, ...logistics.audit)

    // ── Yayın durumu (A08): yalnız panelde eklenen ürün; yayına alırken zorunlu alanlar tamam olmalı ──
    if (body.status !== undefined) {
      if (body.status !== 'draft' && body.status !== 'published') return NextResponse.json({ error: 'Geçersiz yayın durumu' }, { status: 400 })
      if (isCatalog) return NextResponse.json({ error: 'Katalog ürünleri her zaman yayındadır.' }, { status: 400 })
      const wasDraft = before.status === 'draft'
      if (body.status === 'published') {
        const pick = <T,>(k: string, fallback: T) => (data[k] !== undefined && data[k] !== Prisma.JsonNull ? (data[k] as T) : fallback)
        const problems = publishProblems({
          name: pick('name', before.name),
          category: pick('category', before.category),
          price: pick('price', before.price),
          basePrice: pick('basePrice', before.basePrice ?? null),
          priceCurrency: before.priceCurrency ?? null,
          image: pick('image', before.image ?? null),
          images: pick('images', before.images ?? null),
          variants: pick('variants', before.variants ?? null),
          saleMode: pick('saleMode', before.saleMode ?? null),
          desi: pick('desi', before.logisticsSource === 'panel' ? before.desi ?? null : null),
          weightKg: pick('weightKg', before.weightKg ?? null),
        })
        if (problems.length) return NextResponse.json({ error: `Yayına alınamadı, eksik: ${problems.join(', ')}`, problems }, { status: 400 })
        data.status = null
        if (wasDraft) audit.push('Yayına alındı')
      } else {
        data.status = 'draft'
        if (!wasDraft) audit.push('Yayından kaldırıldı (taslağa alındı; sipariş geçmişi korunur)')
      }
    }

    // ── Varyant bazında stok (A03) ────────────────────────────────────────
    const vs = resolveVariantStock({ before, body: { variantStock, variantStocks, stock }, data })
    if ('error' in vs) return NextResponse.json({ error: vs.error }, { status: 400 })
    audit.push(...vs.audit)
    if (vs.rows.length) {
      await prisma.$transaction(
        vs.rows.map((r) => prisma.stockOverride.upsert({ where: { productId: r.key }, update: { stock: r.stock }, create: { productId: r.key, stock: r.stock } }))
      )
    }

    // StockOverride'ı da güncelle — getMergedProducts önceliği StockOverride > ProductOverride.stock
    // Böylece her iki kaynaktan da doğru stok görünür. Varyantlar ayrı stoklanıyorsa ürün stoğu varyant toplamıdır.
    const stockBefore = { stock: before.stock ?? 0, name: before.name }
    if (stock !== undefined && !vs.enabled) {
      const stockVal = Math.max(0, Math.floor(Number(stock) || 0))
      await prisma.stockOverride.upsert({
        where: { productId },
        update: { stock: stockVal },
        create: { productId, stock: stockVal },
      })
    }

    const updated = await prisma.productOverride.upsert({
      where: { productId },
      update: data as Parameters<typeof prisma.productOverride.update>[0]['data'],
      // Yalnızca gönderilen alanlar yazılır: katalog ürününün adı/fiyatı/kategorisi boş değerle ezilmez
      create: { productId, ...(data as object) },
    })

    // Stoğa giren ürünler için "stok gelince haber ver" e-postaları (yanıtı bekletmeden)
    processStockAlerts([productId]).catch((e) => console.error('Stock alert error:', e))
    const afterProduct = await getMergedProductById(productId)
    if ((stock !== undefined || vs.changed) && afterProduct) {
      void notifyLowStockTransitions([{ productId, before: stockBefore.stock, after: afterProduct.stock ?? 0, name: afterProduct.name }])
    }
    // İşlem kaydı (A09): değişen her alan eski → yeni değeriyle; alanla ifade edilemeyen notlar (mod, maliyet, yayın) ayrıca
    if (afterProduct) {
      const changes = [
        ...diffFields(
          { ...before, imageCount: before.images?.length ?? (before.image ? 1 : 0) } as Record<string, unknown>,
          { ...afterProduct, imageCount: afterProduct.images?.length ?? (afterProduct.image ? 1 : 0) } as Record<string, unknown>,
          PRODUCT_AUDIT_LABELS
        ),
        ...diffVariants(before.variants, afterProduct.variants),
      ]
      const summary = summarizeChanges(changes)
      const notes = audit.filter((n) => !summary.includes(n))
      if (changes.length || notes.length) {
        void logAdminAction(auth.actor, 'Ürün güncellendi', {
          method: 'PATCH',
          path: `/admin/products/duzenle?id=${productId}`,
          objectType: 'product',
          objectId: productId,
          changes,
          details: [`${afterProduct.name}:`, summary, ...notes].filter(Boolean).join(' · ').replace(': · ', ': '),
        })
      }
    }
    revalidateStorefront()
    return NextResponse.json(withoutCost(updated))
  } catch (error) {
    console.error('Admin catalog PATCH error:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}

export async function DELETE(
  request: NextRequest,
  { params }: { params: Promise<{ productId: string }> }
) {
  const auth = await checkAdmin(request)
  if ('error' in auth) {
    return NextResponse.json({ error: auth.error }, { status: auth.status })
  }

  try {
    const { productId } = await params
    const res = await prisma.productOverride.deleteMany({ where: { productId } })
    if (res.count === 0) return NextResponse.json({ error: 'Bu ürün için kayıtlı düzenleme yok' }, { status: 404 })
    revalidateStorefront()
    return NextResponse.json({ success: true })
  } catch (error) {
    console.error('Admin catalog DELETE error:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}
