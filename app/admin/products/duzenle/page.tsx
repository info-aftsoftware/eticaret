'use client'

/**
 * Ürün düzenleme / yeni ürün: temel bilgiler, fiyat ve stok, varyantlar, görseller (yükleme, sıralama, silme),
 * öne çıkan özellikler ve teknik özellikler. Yalnızca değişen alanlar kaydedilir (katalog ürünlerinde
 * döviz bazlı fiyatlar gereksiz yere sabit TL'ye dönmesin diye).
 */

import React, { Suspense, useCallback, useEffect, useMemo, useRef, useState } from 'react'
import { useRouter, useSearchParams } from 'next/navigation'
import {
  ArrowDown,
  ArrowUp,
  ExternalLink,
  GripVertical,
  ImagePlus,
  Info,
  Plus,
  RotateCcw,
  Save,
  Trash2,
  Upload,
  Star,
  Package,
  Layers,
  Images,
  ListChecks,
  SlidersHorizontal,
} from 'lucide-react'
import { CATEGORY_GROUPS } from '@/lib/categories'
import { fmtTRY } from '@/lib/format'
import { Btn, BtnLink, Checkbox, EmptyState, Field, Modal, PageHeader, Panel, PanelHeader, Pill, SelectInput, Spinner, TextArea, TextInput } from '@/components/admin/ui'
import { useToast } from '@/components/admin/toast'
import { useAdminMe } from '@/components/admin/AdminMeContext'
import { packageDesi } from '@/lib/shipping/fee'
import { cn } from '@/lib/utils'
import { DC_SYSTEM_CATEGORIES } from '@/lib/compat'

type Variant = {
  key: string
  label: string
  price: number
  basePrice?: number
  sku?: string
  stock?: number
  [k: string]: unknown
}

type PriceMode = 'fx' | 'fixed'

type Product = {
  id: string
  name: string
  sku?: string
  brand?: string
  category: string
  description?: string
  fullDescription?: string
  descriptionHtml?: string
  slogan?: string
  warranty?: string
  price: number
  basePrice?: number
  priceCurrency?: string
  stock: number
  featured: boolean
  image?: string
  images?: string[]
  imagesByVariant?: string[][]
  variants?: Variant[]
  features?: string[]
  specifications?: Record<string, string>
  priceMode?: PriceMode
  variantStock?: boolean
  salesClosed?: string
  systemVoltage?: string[]
  dimensionsCm?: number[]
  weightKg?: number
  packageCount?: number
  desi?: number
  saleMode?: string
  logisticsSource?: string
  _meta?: {
    isCatalog: boolean
    hasOverride: boolean
    overrideUpdatedAt: string | null
    /** Katalogdaki döviz fiyatları: varsa ürün dövize bağlı satılabilir */
    catalogPricing: { currency: string; basePrice: number; variants: { key: string; label: string; basePrice: number | null }[]; origin: 'catalog' | 'panel' } | null
    rate: { value: number; updatedAt: string; source: 'TCMB' | 'fallback' | 'snapshot' } | null
    /** Yalnız Sahip/Yönetici rolüne gelir (A06) */
    cost?: { costPrice: number | null; costCurrency: string | null; targetMargin: number | null }
    rates?: { USD: number; EUR: number }
    status: 'draft' | 'published'
    publishProblems: string[]
    variantImagesSource?: 'panel' | 'catalog' | null
    catalogDescriptionHtml?: string | null
    descriptionSource?: 'panel' | 'catalog' | 'none'
    /** DC sistem ürünü ise: panel değeri ve panel değeri yokken geçerli olan (veri dosyası / ürün adı) */
    voltage?: { panel: string[] | null; fallback: { any: boolean; classes: string[]; source: 'veri' | 'ad' | null } } | null
  }
}

type Form = {
  name: string
  brand: string
  sku: string
  category: string
  description: string
  fullDescription: string
  slogan: string
  warranty: string
  featured: boolean
  price: string
  /** Dövize bağlı modda ürün fiyatı (katalog para birimi, KDV hariç) */
  basePrice: string
  priceMode: PriceMode
  stock: string
  variantStock: boolean
  features: string
  /** Yeni ürünün fiyat para birimi (A06); USD/EUR dövize bağlı oluşturulur */
  currency: 'TRY' | 'USD' | 'EUR'
  costPrice: string
  costCurrency: 'TRY' | 'USD' | 'EUR'
  targetMargin: string
  /** Lojistik (A07): koli ölçüsü (cm), koli ağırlığı (kg), koli sayısı, satış biçimi */
  dimL: string
  dimW: string
  dimH: string
  weightKg: string
  packageCount: string
  saleMode: 'normal' | 'install' | 'quote'
  /** Satışa kapalı: sitede görünür, satın alınamaz */
  salesClosed: boolean
  /** Sistem voltajı (panel): 12/24/48/HV alt kümesi veya ["any"]; boş = katalogdan okunan */
  systemVoltage: string[]
}

/** price: TL (sabit TL modunda girilir); base: döviz fiyatı (dövize bağlı modda girilir); stock: ayrı varyant stoğu */
type VariantRow = { key: string; label: string; sku: string; price: string; base: string; stock: string; extra: Record<string, unknown> }
type SpecRow = { id: number; k: string; v: string }

const EMPTY_FORM: Form = { name: '', brand: '', sku: '', category: '', description: '', fullDescription: '', slogan: '', warranty: '', featured: false, price: '', basePrice: '', priceMode: 'fixed', stock: '0', variantStock: false, features: '', currency: 'TRY', costPrice: '', costCurrency: 'TRY', targetMargin: '', dimL: '', dimW: '', dimH: '', weightKg: '', packageCount: '1', saleMode: 'normal', salesClosed: false, systemVoltage: [] }

const SALE_MODE_OPTIONS = [
  ['normal', 'Kargo ile gönderilir'],
  ['install', 'Kurulum ve nakliye ayrıca planlanır (kargo ücretine girmez)'],
  ['quote', 'Teklifle satılır (sepete eklenemez)'],
] as const

const RATE_SOURCE_TR = { TCMB: 'TCMB', fallback: 'yedek kaynak', snapshot: 'katalog kuru (canlı kur alınamadı)' } as const

const num = (s: string) => Number(s.trim().replace(',', '.'))
/** Döviz → TL (sunucu ile aynı kural: tam TL'ye yukarı yuvarlama, lib/fx-rates toTry) */
const fxToTry = (base: number, rate: number) => Math.ceil(base * rate - 1e-9)

const ALL_CATEGORIES: string[] = CATEGORY_GROUPS.flatMap((g) => [...g.categoryValues])

function toForm(p: Product): Form {
  return {
    name: p.name ?? '',
    brand: p.brand ?? '',
    sku: p.sku ?? '',
    category: p.category ?? '',
    description: p.description ?? '',
    fullDescription: p.fullDescription ?? '',
    slogan: p.slogan ?? '',
    warranty: p.warranty ?? '',
    featured: !!p.featured,
    price: String(p.price ?? ''),
    basePrice: typeof p.basePrice === 'number' ? String(p.basePrice) : '',
    priceMode: p.priceMode === 'fx' && p._meta?.catalogPricing ? 'fx' : 'fixed',
    stock: String(p.stock ?? 0),
    variantStock: !!p.variantStock,
    features: (p.features ?? []).join('\n'),
    currency: 'TRY',
    costPrice: p._meta?.cost?.costPrice != null ? String(p._meta.cost.costPrice) : '',
    costCurrency: (p._meta?.cost?.costCurrency as Form['costCurrency']) ?? 'TRY',
    targetMargin: p._meta?.cost?.targetMargin != null ? String(p._meta.cost.targetMargin) : '',
    dimL: p.dimensionsCm?.[0] != null ? String(p.dimensionsCm[0]) : '',
    dimW: p.dimensionsCm?.[1] != null ? String(p.dimensionsCm[1]) : '',
    dimH: p.dimensionsCm?.[2] != null ? String(p.dimensionsCm[2]) : '',
    weightKg: p.weightKg != null ? String(p.weightKg) : '',
    packageCount: String(p.packageCount ?? 1),
    saleMode: p.saleMode === 'install' || p.saleMode === 'quote' ? p.saleMode : 'normal',
    salesClosed: !!p.salesClosed,
    systemVoltage: p.systemVoltage ?? [],
  }
}

function toVariantRows(vs?: Variant[]): VariantRow[] {
  return (vs ?? []).map(({ key, label, sku, price, basePrice, stock, ...extra }) => ({
    key,
    label,
    sku: sku ?? '',
    price: String(price ?? ''),
    base: typeof basePrice === 'number' ? String(basePrice) : '',
    stock: String(stock ?? 0),
    extra,
  }))
}

let specSeq = 0
const toSpecRows = (s?: Record<string, string>): SpecRow[] => Object.entries(s ?? {}).map(([k, v]) => ({ id: ++specSeq, k, v: String(v) }))

const newVariantKey = (label: string) =>
  `${label
    .toLowerCase()
    .normalize('NFKD')
    .replace(/[^a-z0-9]+/g, '')
    .slice(0, 24) || 'secenek'}${Math.random().toString(36).slice(2, 7)}`

/**
 * Kaydedilecek varyant listesi. Dövize bağlı modda döviz fiyatı (basePrice) gönderilir, TL fiyatı sunucu kurla hesaplar
 * (burada gönderilen TL yalnızca bilgi amaçlı ön hesaptır). Sabit TL modunda döviz fiyatı gönderilmez.
 */
function variantsPayload(rows: VariantRow[], mode: PriceMode, rate: number | null): Variant[] {
  return rows.map((r) => {
    const base = num(r.base)
    const fx = mode === 'fx' && Number.isFinite(base) && base > 0
    const tl = num(r.price)
    // Kur bilinmiyorsa (yeni dövizli ürün) TL fiyatı sunucu hesaplar; burada 0 gönderilir
    const price = fx && rate ? fxToTry(base, rate) : Number.isFinite(tl) ? Math.round(tl * 100) / 100 : 0
    return {
      ...r.extra,
      key: r.key,
      label: r.label.trim(),
      price,
      ...(r.sku.trim() ? { sku: r.sku.trim() } : {}),
      ...(fx ? { basePrice: base } : {}),
    }
  })
}

function SectionNav({ items }: { items: { id: string; label: string }[] }) {
  return (
    <nav className="hidden xl:block sticky top-20 space-y-0.5" aria-label="Bölümler">
      {items.map((i) => (
        <a key={i.id} href={`#${i.id}`} className="block px-3 py-1.5 rounded-md text-[13px] text-[#5d6e80] hover:text-[#0b2540] hover:bg-white">
          {i.label}
        </a>
      ))}
    </nav>
  )
}

function Editor() {
  const sp = useSearchParams()
  const router = useRouter()
  const toast = useToast()
  const me = useAdminMe()
  // Maliyet ve kâr alanları yalnız Sahip/Yönetici (sunucu da aynı kuralla süzer; lib/admin-users canSeeCost)
  const canCost = !!me && (me.user.isMaster || me.user.role === 'owner' || me.user.role === 'manager')
  const id = sp.get('id') || ''
  const isNew = !id && sp.get('yeni') === '1'

  const [product, setProduct] = useState<Product | null>(null)
  const [loadError, setLoadError] = useState<string | null>(null)
  const [form, setForm] = useState<Form>(EMPTY_FORM)
  const [variants, setVariants] = useState<VariantRow[]>([])
  const [images, setImages] = useState<string[]>([])
  const [specs, setSpecs] = useState<SpecRow[]>([])
  // Varyant görselleri (A17): anahtar → görseller; boş dizi genel galeri
  const [variantImages, setVariantImages] = useState<Record<string, string[]>>({})
  const [showCatalogDesc, setShowCatalogDesc] = useState(false)
  const [saving, setSaving] = useState(false)
  const [uploading, setUploading] = useState(0)
  const [dragIndex, setDragIndex] = useState<number | null>(null)
  const [dropActive, setDropActive] = useState(false)
  const [confirmReset, setConfirmReset] = useState(false)
  // Fiyat modu değişikliği kaydedilmeden önce mevcut ve yeni davranış gösterilir, açık onay istenir (A05)
  const [confirmMode, setConfirmMode] = useState(false)
  const pendingStatus = useRef<'published' | 'draft' | undefined>(undefined)
  const fileInput = useRef<HTMLInputElement>(null)

  const orig = useRef<{ form: Form; variants: VariantRow[]; images: string[]; specs: SpecRow[]; variantImages: Record<string, string[]> }>({ form: EMPTY_FORM, variants: [], images: [], specs: [], variantImages: {} })
  // Bu oturumda yüklenen ama kaydedilmeden kaldırılan dosyalar silinir
  const sessionUploads = useRef<Set<string>>(new Set())

  const apply = useCallback((p: Product) => {
    const f = toForm(p)
    const v = toVariantRows(p.variants)
    const imgs = p.images?.length ? [...p.images] : p.image ? [p.image] : []
    const s = toSpecRows(p.specifications)
    const vi = Object.fromEntries((p.variants ?? []).map((v, i) => [v.key, [...(p.imagesByVariant?.[i] ?? [])]]))
    setProduct(p)
    setVariantImages(vi)
    setForm(f)
    setVariants(v)
    setImages(imgs)
    setSpecs(s)
    orig.current = { form: f, variants: v, images: imgs, specs: s, variantImages: vi }
  }, [])

  const load = useCallback(async () => {
    if (!id) return
    try {
      const res = await fetch(`/api/admin/catalog/${encodeURIComponent(id)}`, { credentials: 'include', cache: 'no-store' })
      const json = await res.json().catch(() => null)
      if (!res.ok) throw new Error(json?.error || 'Ürün alınamadı')
      apply(json)
      setLoadError(null)
    } catch (e) {
      setLoadError(e instanceof Error ? e.message : 'Ürün alınamadı')
    }
  }, [id, apply])

  useEffect(() => {
    if (isNew) {
      setProduct(null)
      setForm(EMPTY_FORM)
      orig.current = { form: EMPTY_FORM, variants: [], images: [], specs: [], variantImages: {} }
      return
    }
    load()
  }, [load, isNew])

  const set = <K extends keyof Form>(k: K, v: Form[K]) => setForm((prev) => ({ ...prev, [k]: v }))

  // --- Değişiklik tespiti
  const changes = useMemo(() => {
    const o = orig.current
    const body: Record<string, unknown> = {}
    const str = (k: keyof Form) => (form[k] as string).trim()
    if (str('name') !== o.form.name.trim()) body.name = str('name')
    if (str('brand') !== o.form.brand.trim()) body.brand = str('brand') || null
    if (str('sku') !== o.form.sku.trim()) body.sku = str('sku') || null
    if (str('category') !== o.form.category.trim()) body.category = str('category')
    if (str('description') !== o.form.description.trim()) body.description = str('description')
    if (str('fullDescription') !== o.form.fullDescription.trim()) body.fullDescription = str('fullDescription')
    if (str('slogan') !== o.form.slogan.trim()) body.slogan = str('slogan')
    if (str('warranty') !== o.form.warranty.trim()) body.warranty = str('warranty')
    if (form.featured !== o.form.featured) body.featured = form.featured
    if (form.salesClosed !== o.form.salesClosed) body.salesClosed = form.salesClosed
    if (form.systemVoltage.join(',') !== o.form.systemVoltage.join(',')) body.systemVoltage = form.systemVoltage.length ? form.systemVoltage : null
    // Fiyat: modu açıkça gönderilir; dövize bağlıda döviz fiyatı, sabit TL'de TL fiyatı (A05)
    if (form.priceMode !== o.form.priceMode) body.priceMode = form.priceMode
    if (form.priceMode === 'fx') {
      if (str('basePrice') !== o.form.basePrice.trim() || body.priceMode) body.basePrice = num(form.basePrice)
    } else if (str('price') !== o.form.price.trim() || body.priceMode) body.price = num(form.price)
    // Stok: varyantlar ayrı stoklanıyorsa varyant satırları, değilse ürün stoğu (A03)
    // Maliyet (A06): yalnız yetkili role gösterilir ve gönderilir
    if (canCost) {
      if (str('costPrice') !== o.form.costPrice.trim()) body.costPrice = str('costPrice') ? num(form.costPrice) : null
      if (form.costCurrency !== o.form.costCurrency) body.costCurrency = form.costCurrency
      if (str('targetMargin') !== o.form.targetMargin.trim()) body.targetMargin = str('targetMargin') ? num(form.targetMargin) : null
    }
    // Lojistik (A07): koli ölçüsü üç alan birlikte gönderilir; sunucu desiyi hesaplar
    const dimsNow = [form.dimL, form.dimW, form.dimH].map((d) => d.trim())
    const dimsOrig = [o.form.dimL, o.form.dimW, o.form.dimH].map((d) => d.trim())
    if (dimsNow.join('|') !== dimsOrig.join('|')) body.dimensionsCm = dimsNow.every((d) => !d) ? null : dimsNow.map(num)
    if (str('weightKg') !== o.form.weightKg.trim()) body.weightKg = str('weightKg') ? num(form.weightKg) : null
    if (str('packageCount') !== o.form.packageCount.trim()) body.packageCount = Math.floor(num(form.packageCount))
    if (form.saleMode !== o.form.saleMode) body.saleMode = form.saleMode
    if (form.variantStock !== o.form.variantStock) body.variantStock = form.variantStock
    if (form.variantStock) {
      const vsNow = variants.map((r) => [r.key, r.stock.trim()])
      const vsOrig = o.variants.map((r) => [r.key, r.stock.trim()])
      if (body.variantStock || JSON.stringify(vsNow) !== JSON.stringify(vsOrig)) {
        body.variantStocks = Object.fromEntries(variants.map((r) => [r.key, Math.max(0, Math.floor(Number(r.stock) || 0))]))
      }
    } else if (str('stock') !== o.form.stock.trim() || body.variantStock === false) {
      body.stock = Math.max(0, Math.floor(Number(str('stock')) || 0))
    }
    const feats = form.features.split('\n').map((l) => l.trim()).filter(Boolean)
    if (feats.join('\n') !== o.form.features.split('\n').map((l) => l.trim()).filter(Boolean).join('\n')) body.features = feats
    if (JSON.stringify(images) !== JSON.stringify(o.images)) {
      body.images = images
      body.image = images[0] ?? null
    }
    // Varyant fiyatı modda girilen alandan karşılaştırılır (dövize bağlıda döviz, sabit TL'de TL)
    const priceCol = (r: VariantRow) => (form.priceMode === 'fx' ? r.base.trim() : r.price.trim())
    const vNow = variants.map((r) => [r.key, r.label.trim(), r.sku.trim(), priceCol(r)])
    const vOrig = o.variants.map((r) => [r.key, r.label.trim(), r.sku.trim(), priceCol(r)])
    if (JSON.stringify(vNow) !== JSON.stringify(vOrig)) body.variants = variantsPayload(variants, form.priceMode, product?._meta?.rate?.value ?? null)
    const viNow = JSON.stringify(variants.map((v) => [v.key, variantImages[v.key] ?? []]))
    const viOrig = JSON.stringify(variants.map((v) => [v.key, o.variantImages[v.key] ?? []]))
    const anyVariantImages = variants.some((v) => (variantImages[v.key] ?? []).length)
    if (viNow !== viOrig || (body.images && anyVariantImages)) {
      body.variantImages = Object.fromEntries(variants.map((v) => [v.key, variantImages[v.key] ?? []]))
    }
    const sNow = specs.filter((s) => s.k.trim()).map((s) => [s.k.trim(), s.v.trim()])
    const sOrig = o.specs.map((s) => [s.k.trim(), s.v.trim()])
    if (JSON.stringify(sNow) !== JSON.stringify(sOrig)) body.specifications = Object.fromEntries(sNow)
    return body
  }, [form, images, variants, specs, product, canCost, variantImages])

  const dirty = Object.keys(changes).length > 0

  useEffect(() => {
    if (!dirty) return
    const onBefore = (e: BeforeUnloadEvent) => {
      e.preventDefault()
      e.returnValue = ''
    }
    window.addEventListener('beforeunload', onBefore)
    return () => window.removeEventListener('beforeunload', onBefore)
  }, [dirty])

  const validate = (): string | null => {
    if (!form.name.trim()) return 'Ürün adı gerekli.'
    if (!form.category.trim()) return 'Kategori seçin.'
    const fx = form.priceMode === 'fx'
    const price = fx ? num(form.basePrice) : num(form.price)
    if (!Number.isFinite(price) || price < 0 || (fx && price === 0)) return fx ? 'Döviz fiyatı geçersiz.' : 'Fiyat geçersiz.'
    for (const v of variants) {
      if (!v.label.trim()) return 'Her varyantın bir adı olmalı.'
      // Dövize bağlıda boş döviz fiyatı katalogdan doldurulur
      const raw = fx ? v.base : v.price
      const vp = num(raw)
      if (fx ? raw.trim() !== '' && (!Number.isFinite(vp) || vp <= 0) : !Number.isFinite(vp) || vp < 0 || raw.trim() === '') {
        return `“${v.label}” varyantının fiyatı geçersiz.`
      }
      if (form.variantStock && (!Number.isInteger(Number(v.stock)) || Number(v.stock) < 0)) return `“${v.label}” varyantının stoğu geçersiz.`
    }
    if (product?.variants?.length && variants.length === 0) return 'Varyantlı üründe en az bir varyant kalmalı.'
    return null
  }

  /** statusTo: yayına al / taslağa al (A08); değişikliklerle birlikte tek istekte gönderilir */
  const save = async (modeConfirmed = false, statusTo?: 'published' | 'draft') => {
    const err = validate()
    if (err) {
      toast.error('Kaydedilemedi', err)
      return
    }
    if (!isNew && changes.priceMode && !modeConfirmed) {
      pendingStatus.current = statusTo
      setConfirmMode(true)
      return
    }
    setConfirmMode(false)
    setSaving(true)
    try {
      if (isNew) {
        const fxNew = form.currency !== 'TRY'
        const dims = [form.dimL, form.dimW, form.dimH].map((d) => d.trim())
        const body = {
          name: form.name.trim(),
          // Para birimi (A06): USD/EUR ürünün TL fiyatı her gün kurla hesaplanır
          priceCurrency: form.currency,
          ...(fxNew ? { basePrice: num(form.basePrice) } : { price: num(form.price) }),
          ...(canCost
            ? { costPrice: form.costPrice.trim() ? num(form.costPrice) : null, costCurrency: form.costCurrency, targetMargin: form.targetMargin.trim() ? num(form.targetMargin) : null }
            : {}),
          // Lojistik (A07)
          ...(dims.some(Boolean) ? { dimensionsCm: dims.map(num) } : {}),
          ...(form.weightKg.trim() ? { weightKg: num(form.weightKg) } : {}),
          packageCount: Math.max(1, Math.floor(num(form.packageCount) || 1)),
          saleMode: form.saleMode,
          category: form.category.trim(),
          brand: form.brand.trim() || null,
          sku: form.sku.trim() || null,
          description: form.description.trim() || null,
          fullDescription: form.fullDescription.trim() || null,
          slogan: form.slogan.trim() || null,
          warranty: form.warranty.trim() || null,
          stock: Math.max(0, Math.floor(Number(form.stock) || 0)),
          featured: form.featured,
          features: form.features.split('\n').map((l) => l.trim()).filter(Boolean),
          specifications: Object.fromEntries(specs.filter((s) => s.k.trim()).map((s) => [s.k.trim(), s.v.trim()])),
          ...(variants.length ? { variants: variantsPayload(variants, fxNew ? 'fx' : 'fixed', null) } : {}),
        }
        const res = await fetch('/api/admin/catalog', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(body), credentials: 'include' })
        const json = await res.json().catch(() => null)
        if (!res.ok) throw new Error(json?.error || 'Ürün oluşturulamadı')
        // Stok kaydı (StockOverride) ayrıca tutulur
        await fetch('/api/admin/stock-overrides', {
          method: 'PATCH',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ productId: json.productId, stock: body.stock }),
          credentials: 'include',
        })
        orig.current = { form, variants, images, specs, variantImages }
        toast.success('Taslak oluşturuldu', 'Görselleri ve eksikleri tamamlayıp "Yayına al" deyin; o zamana kadar sitede görünmez.')
        router.replace(`/admin/products/duzenle?id=${encodeURIComponent(json.productId)}`)
        return
      }

      const body = statusTo ? { ...changes, status: statusTo } : changes
      const res = await fetch(`/api/admin/catalog/${encodeURIComponent(id)}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(body),
        credentials: 'include',
      })
      const json = await res.json().catch(() => null)
      if (!res.ok) throw new Error(json?.error || 'Kaydedilemedi')
      // Kaldırılan, panelden yüklenmiş görsel dosyalarını sil
      if (body.images) {
        const removed = new Set([...orig.current.images, ...sessionUploads.current].filter((u) => !images.includes(u) && u.startsWith('/media/products/')))
        for (const u of removed) {
          fetch(`/api/admin/catalog/${encodeURIComponent(id)}/images?url=${encodeURIComponent(u)}`, { method: 'DELETE', credentials: 'include' }).catch(() => {})
          sessionUploads.current.delete(u)
        }
      }
      toast.success(statusTo === 'published' ? 'Yayına alındı' : statusTo === 'draft' ? 'Taslağa alındı' : 'Değişiklikler kaydedildi', statusTo === 'draft' ? 'Ürün sitede görünmüyor; sipariş geçmişi korunur.' : form.name)
      await load()
    } catch (e) {
      toast.error('Kaydedilemedi', e instanceof Error ? e.message : undefined)
    } finally {
      setSaving(false)
    }
  }

  const resetOverride = async () => {
    try {
      const res = await fetch(`/api/admin/catalog/${encodeURIComponent(id)}`, { method: 'DELETE', credentials: 'include' })
      const json = await res.json().catch(() => null)
      if (!res.ok) throw new Error(json?.error || 'İşlem başarısız')
      setConfirmReset(false)
      if (product?._meta?.isCatalog) {
        toast.success('Panel düzenlemeleri kaldırıldı', 'Ürün katalogdaki haline döndü.')
        await load()
      } else {
        toast.success('Ürün silindi')
        router.replace('/admin/products')
      }
    } catch (e) {
      toast.error('İşlem başarısız', e instanceof Error ? e.message : undefined)
    }
  }

  // --- Görseller
  const upload = async (files: FileList | File[]) => {
    const list = Array.from(files).filter((f) => f.type.startsWith('image/') || /\.(jpe?g|png|webp|avif|heic|gif)$/i.test(f.name))
    if (!list.length || !id) return
    for (let i = 0; i < list.length; i += 10) {
      const chunk = list.slice(i, i + 10)
      const fd = new FormData()
      chunk.forEach((f) => fd.append('files', f))
      setUploading((n) => n + chunk.length)
      try {
        const res = await fetch(`/api/admin/catalog/${encodeURIComponent(id)}/images`, { method: 'POST', body: fd, credentials: 'include' })
        const json = await res.json().catch(() => null)
        const uploaded: { url: string }[] = json?.uploaded ?? []
        uploaded.forEach((u) => sessionUploads.current.add(u.url))
        if (uploaded.length) setImages((prev) => [...prev, ...uploaded.map((u) => u.url)])
        for (const er of (json?.errors ?? []) as { name: string; error: string }[]) toast.error(`${er.name} yüklenemedi`, er.error)
        if (!res.ok && !json?.errors?.length) throw new Error(json?.error || 'Yükleme başarısız')
      } catch (e) {
        toast.error('Yükleme başarısız', e instanceof Error ? e.message : undefined)
      } finally {
        setUploading((n) => n - chunk.length)
      }
    }
  }

  const moveImage = (from: number, to: number) =>
    setImages((prev) => {
      if (to < 0 || to >= prev.length || from === to) return prev
      const next = [...prev]
      const [m] = next.splice(from, 1)
      next.splice(to, 0, m)
      return next
    })

  const moveVariant = (from: number, to: number) =>
    setVariants((prev) => {
      if (to < 0 || to >= prev.length) return prev
      const next = [...prev]
      const [m] = next.splice(from, 1)
      next.splice(to, 0, m)
      return next
    })

  if (!id && !isNew) {
    return (
      <Panel>
        <EmptyState icon={Package} title="Ürün seçilmedi" action={<BtnLink href="/admin/products">Ürünlere dön</BtnLink>} />
      </Panel>
    )
  }
  if (loadError) {
    return (
      <div className="space-y-5">
        <PageHeader title="Ürün" back={{ href: '/admin/products', label: 'Ürünler & Stok' }} />
        <Panel>
          <EmptyState icon={Package} title={loadError} />
        </Panel>
      </div>
    )
  }
  if (!isNew && !product) return <Spinner />

  const isCatalog = !!product?._meta?.isCatalog
  const catalogPricing = product?._meta?.catalogPricing ?? null
  const rate = product?._meta?.rate ?? null
  // Yeni üründe para birimi formda seçilir (A06)
  const currency = catalogPricing?.currency ?? (isNew && form.currency !== 'TRY' ? form.currency : '')
  const fromCatalog = catalogPricing?.origin === 'catalog'
  const fx = form.priceMode === 'fx'
  const modeChanged = !isNew && form.priceMode !== orig.current.form.priceMode
  const rateLine = rate
    ? `1 ${currency} = ${rate.value.toLocaleString('tr-TR', { maximumFractionDigits: 4 })} TL · ${RATE_SOURCE_TR[rate.source]} · ${new Date(rate.updatedAt).toLocaleString('tr-TR', { timeZone: 'Europe/Istanbul', dateStyle: 'short', timeStyle: 'short' })}`
    : ''
  const fxPreview = (base: string) => {
    const n = num(base)
    return rate && Number.isFinite(n) && n > 0 ? fmtTRY(fxToTry(n, rate.value)) : '—'
  }
  const variantStockSum = variants.reduce((n, v) => n + Math.max(0, Math.floor(Number(v.stock) || 0)), 0)
  // Lojistik ön hesap (A07): sunucu kaydederken aynı kuralla hesaplar (lib/shipping/fee packageDesi)
  const dimsNum = [form.dimL, form.dimW, form.dimH].map(num)
  const dimsComplete = dimsNum.every((n) => Number.isFinite(n) && n > 0)
  const weightNum = num(form.weightKg)
  const pkgCount = Math.max(1, Math.floor(num(form.packageCount) || 1))
  const desiPreview = dimsComplete || weightNum > 0 ? packageDesi(dimsComplete ? dimsNum : null, weightNum > 0 ? weightNum : null, pkgCount) : null
  // Maliyet ve kâr (A06): TL karşılıkları güncel kurla
  const rateOf = (c: string) => (c === 'USD' ? product?._meta?.rates?.USD : c === 'EUR' ? product?._meta?.rates?.EUR : 1) ?? null
  const costNum = num(form.costPrice)
  const costRate = rateOf(form.costCurrency)
  const costTry = Number.isFinite(costNum) && costNum > 0 && costRate ? costNum * costRate : null
  const salePrice = product?.price ?? null
  const marginNow = costTry != null && salePrice ? ((salePrice - costTry) / salePrice) * 100 : null
  const targetNum = num(form.targetMargin)
  const targetPrice = costTry != null && Number.isFinite(targetNum) && targetNum >= 0 && targetNum < 100 ? costTry / (1 - targetNum / 100) : null
  // Yayın (A08): panelde eklenen ürün taslak/yayında; katalog ürünü her zaman yayında
  const isDraft = product?._meta?.status === 'draft'
  const problems = product?._meta?.publishProblems ?? []
  const categories = [...new Set([...ALL_CATEGORIES, ...(form.category ? [form.category] : [])])]

  // Sistem voltajı (uyumlu ürün önerisi): yalnız akü, BMS, inverter, şarj cihazı gibi DC sistem ürünlerinde
  const showVoltage = !isNew && DC_SYSTEM_CATEGORIES.has(form.category)
  const voltageMeta = product?._meta?.voltage ?? null
  const toggleVoltage = (v: string, on: boolean) => {
    const order = ['12', '24', '48', 'HV']
    if (v === 'any') return set('systemVoltage', on ? ['any'] : [])
    const next = new Set(form.systemVoltage.filter((x) => x !== 'any'))
    if (on) next.add(v)
    else next.delete(v)
    set('systemVoltage', order.filter((x) => next.has(x)))
  }

  const sections = [
    { id: 'genel', label: 'Genel bilgiler' },
    { id: 'fiyat', label: 'Fiyat ve stok' },
    ...(canCost ? [{ id: 'maliyet', label: 'Maliyet ve kâr' }] : []),
    { id: 'kargo', label: 'Kargo ve teslimat' },
    { id: 'varyantlar', label: 'Varyantlar' },
    { id: 'gorseller', label: 'Görseller' },
    { id: 'ozellikler', label: 'Öne çıkan özellikler' },
    { id: 'teknik', label: 'Teknik özellikler' },
    ...(showVoltage ? [{ id: 'voltaj', label: 'Sistem voltajı' }] : []),
  ]

  return (
    <div className="space-y-5 pb-24">
      <PageHeader
        back={{ href: '/admin/products', label: 'Ürünler & Stok' }}
        title={isNew ? 'Yeni ürün' : form.name || 'Ürün'}
        description={
          isNew ? (
            'Ürün taslak olarak oluşturulur ve sitede görünmez. Görselleri oluşturduktan sonra ekleyin; eksikler tamamlanınca “Yayına al” deyin.'
          ) : (
            <span className="inline-flex flex-wrap items-center gap-1.5">
              <span className="font-mono text-xs">{id}</span>
              {isCatalog ? <Pill tone="navy">Katalog ürünü</Pill> : <Pill tone="violet">Panelde eklendi</Pill>}
              {!isCatalog && (isDraft ? <Pill tone="amber">Taslak</Pill> : <Pill tone="green">Yayında</Pill>)}
              {product?._meta?.hasOverride && isCatalog && <Pill tone="yellow">Panelde düzenlendi</Pill>}
            </span>
          )
        }
        actions={
          !isNew && (
            <>
              <a href={`/products/${id}`} target="_blank" rel="noopener noreferrer" className="inline-flex items-center gap-1.5 h-8 px-3 rounded-md border border-[#d3d9e1] bg-white text-[13px] font-medium text-[#20384e] hover:bg-[#f5f7fa]">
                <ExternalLink className="w-4 h-4" />
                Sitede gör
              </a>
              {(product?._meta?.hasOverride || !isCatalog) && (
                <Btn variant="danger" onClick={() => setConfirmReset(true)}>
                  {isCatalog ? <RotateCcw /> : <Trash2 />}
                  {isCatalog ? 'Düzenlemeleri sıfırla' : 'Ürünü sil'}
                </Btn>
              )}
            </>
          )
        }
      />

      <div className="grid xl:grid-cols-[180px_1fr] gap-6 items-start">
        <SectionNav items={sections} />
        <div className="space-y-5 min-w-0">
          {!isNew && !isCatalog && (
            <Panel id="yayin" className={cn('scroll-mt-20', isDraft && 'border-[#f5dc85]')}>
              <PanelHeader
                title={isDraft ? 'Taslak: sitede görünmüyor' : 'Yayında'}
                description={isDraft ? 'Taslak ürün arama, kategori, ürün akışları ve sepette yer almaz. Önizleme yalnız yöneticilere açıktır.' : 'Ürün sitede satışta. Taslağa almak ürünü gizler; sipariş geçmişi silinmez.'}
                icon={Info}
                actions={
                  <div className="flex flex-wrap gap-2">
                    <a href={`/onizleme/${encodeURIComponent(id)}`} target="_blank" rel="noopener noreferrer" className="inline-flex items-center gap-1.5 h-7 px-2.5 rounded-md border border-[#d3d9e1] bg-white text-xs font-medium text-[#20384e] hover:bg-[#f5f7fa]">
                      <ExternalLink className="w-3.5 h-3.5" />
                      Önizle
                    </a>
                    {isDraft ? (
                      <Btn size="xs" variant="accent" onClick={() => save(false, 'published')} disabled={saving || (problems.length > 0 && !dirty)}>
                        Yayına al
                      </Btn>
                    ) : (
                      <Btn size="xs" variant="outline" onClick={() => save(false, 'draft')} disabled={saving}>
                        Taslağa al
                      </Btn>
                    )}
                  </div>
                }
              />
              {problems.length > 0 && (
                <p className="px-4 sm:px-5 py-3 text-[13px] text-[#7a5a00]">
                  Yayına almak için eksik: <strong>{problems.join(', ')}</strong>. Tamamlayıp kaydedin.
                </p>
              )}
            </Panel>
          )}

          <Panel id="genel" className="scroll-mt-20">
            <PanelHeader title="Genel bilgiler" icon={Package} />
            <div className="p-4 sm:p-5 grid gap-4 md:grid-cols-2">
              <Field label="Ürün adı" htmlFor="p-name" className="md:col-span-2">
                <TextInput id="p-name" value={form.name} onChange={(e) => set('name', e.target.value)} maxLength={300} />
              </Field>
              <Field label="Marka" htmlFor="p-brand">
                <TextInput id="p-brand" value={form.brand} onChange={(e) => set('brand', e.target.value)} />
              </Field>
              <Field label="SKU / stok kodu" htmlFor="p-sku">
                <TextInput id="p-sku" value={form.sku} onChange={(e) => set('sku', e.target.value)} />
              </Field>
              <Field label="Kategori" htmlFor="p-cat">
                <SelectInput id="p-cat" value={form.category} onChange={(e) => set('category', e.target.value)}>
                  <option value="">Seçin…</option>
                  {categories.map((c) => (
                    <option key={c} value={c}>{c}</option>
                  ))}
                </SelectInput>
              </Field>
              <Field label="Garanti" htmlFor="p-warranty">
                <TextInput id="p-warranty" value={form.warranty} onChange={(e) => set('warranty', e.target.value)} placeholder="Örn. 2 yıl üretici garantisi" />
              </Field>
              <Field label="Slogan" htmlFor="p-slogan" className="md:col-span-2">
                <TextInput id="p-slogan" value={form.slogan} onChange={(e) => set('slogan', e.target.value)} maxLength={200} />
              </Field>
              <Field label="Kısa açıklama" htmlFor="p-desc" hint="Liste kartlarında ve arama sonuçlarında (meta açıklama) görünür." className="md:col-span-2">
                <TextArea id="p-desc" rows={3} value={form.description} onChange={(e) => set('description', e.target.value)} maxLength={500} />
              </Field>
              <Field
                label="Detaylı açıklama"
                htmlFor="p-full"
                className="md:col-span-2"
                hint={
                  product?._meta?.catalogDescriptionHtml
                    ? form.fullDescription.trim()
                      ? 'Sitede şu an bu kutudaki metin gösteriliyor (katalogdaki biçimli açıklamanın yerine). Kutuyu boşaltıp kaydederseniz katalog açıklaması geri gelir.'
                      : 'Kutu boş: sitede katalogdaki biçimli açıklama (tablolar ve bağlantılarla) gösteriliyor. Buraya yazılan düz metin onun yerine geçer.'
                    : undefined
                }
              >
                <TextArea id="p-full" rows={6} value={form.fullDescription} onChange={(e) => set('fullDescription', e.target.value)} />
                {product?._meta?.catalogDescriptionHtml && (
                  <div className="mt-2 space-y-2">
                    <div className="flex flex-wrap items-center gap-2 text-xs">
                      <Pill tone={form.fullDescription.trim() ? 'violet' : 'navy'}>
                        {form.fullDescription.trim() ? 'Gösterilen: panel metni' : 'Gösterilen: katalog açıklaması'}
                      </Pill>
                      <button type="button" className="font-medium text-[#0b2540] hover:underline" onClick={() => setShowCatalogDesc((x) => !x)} aria-expanded={showCatalogDesc}>
                        {showCatalogDesc ? 'Katalog açıklamasını gizle' : 'Katalog açıklamasını önizle'}
                      </button>
                      {form.fullDescription.trim() && (
                        <button type="button" className="font-medium text-[#0b2540] hover:underline" onClick={() => set('fullDescription', '')}>
                          Katalog açıklamasına dön
                        </button>
                      )}
                    </div>
                    {showCatalogDesc && (
                      <div
                        className="max-h-80 overflow-auto rounded-lg border border-[#e6ebf1] bg-[#fafbfd] p-3 text-[13px] text-[#20384e] [&_table]:w-full [&_td]:border [&_td]:border-[#e6ebf1] [&_td]:px-2 [&_td]:py-1 [&_a]:underline"
                        // Katalog dosyasındaki (içe aktarıcının ürettiği) açıklama; vitrin aynı HTML'i gösterir
                        dangerouslySetInnerHTML={{ __html: product._meta.catalogDescriptionHtml }}
                      />
                    )}
                  </div>
                )}
              </Field>
              {!isNew && (
                <div className="md:col-span-2">
                  <Checkbox checked={form.salesClosed} onChange={(v) => set('salesClosed', v)} label="Satışa kapalı" />
                  <p className="text-xs text-[#5d6e80] mt-1 ml-6">Ürün sitede görünür ama satın alınamaz. Ürün grubu sayfasından kapatılan gruplar ayrıca orada açılır.</p>
                </div>
              )}
              <Checkbox className="md:col-span-2" checked={form.featured} onChange={(v) => set('featured', v)} label={<span className="inline-flex items-center gap-1.5"><Star className="w-4 h-4 text-[#e0a500]" />Ana sayfada öne çıkar</span>} />
            </div>
          </Panel>

          <Panel id="fiyat" className="scroll-mt-20">
            <PanelHeader title="Fiyat ve stok" icon={SlidersHorizontal} />
            <div className="p-4 sm:p-5 grid gap-4 sm:grid-cols-2">
              {isNew && (
                <Field label="Fiyat para birimi" htmlFor="p-currency" className="sm:col-span-2" hint="USD veya EUR seçilirse ürün dövize bağlı satılır: TL fiyatı güncel kurla hesaplanır. Sonradan Sabit TL'ye geçilebilir.">
                  <SelectInput
                    id="p-currency"
                    value={form.currency}
                    onChange={(e) => {
                      const c = e.target.value as Form['currency']
                      set('currency', c)
                      set('priceMode', c === 'TRY' ? 'fixed' : 'fx')
                    }}
                  >
                    <option value="TRY">TL (sabit)</option>
                    <option value="USD">USD (dövize bağlı)</option>
                    <option value="EUR">EUR (dövize bağlı)</option>
                  </SelectInput>
                </Field>
              )}
              {catalogPricing && (
                <fieldset className="sm:col-span-2">
                  <legend className="text-[13px] font-medium text-[#20384e] mb-2">Fiyatlandırma</legend>
                  <div className="grid gap-2 sm:grid-cols-2">
                    {([
                      ['fx', 'Dövize bağlı', `${currency} fiyat × güncel kur; kur değişince TL fiyat da değişir.`],
                      ['fixed', 'Sabit TL', 'TL fiyat siz değiştirene kadar aynı kalır; kur değişiminden etkilenmez.'],
                    ] as const).map(([mode, title, desc]) => (
                      <label
                        key={mode}
                        className={cn('flex gap-2.5 rounded-lg border px-3 py-2.5 cursor-pointer', form.priceMode === mode ? 'border-[#0b2540] bg-[#f5f7fa] ring-1 ring-[#0b2540]' : 'border-[#d3d9e1] hover:border-[#8a99a8]')}
                      >
                        <input
                          type="radio"
                          name="price-mode"
                          className="mt-0.5 accent-[#0b2540]"
                          checked={form.priceMode === mode}
                          onChange={() => {
                            set('priceMode', mode)
                            // Sabit TL'ye geçerken TL alanları o anki kurla hesaplanmış fiyatla başlar
                            if (mode === 'fixed' && rate) {
                              if (num(form.basePrice) > 0) set('price', String(fxToTry(num(form.basePrice), rate.value)))
                              setVariants((prev) => prev.map((v) => (num(v.base) > 0 ? { ...v, price: String(fxToTry(num(v.base), rate.value)) } : v)))
                            }
                          }}
                        />
                        <span>
                          <span className="block text-[13px] font-medium text-[#121926]">{title}</span>
                          <span className="block text-xs text-[#5d6e80] mt-0.5">{desc}</span>
                        </span>
                      </label>
                    ))}
                  </div>
                  {modeChanged && (
                    <p className="mt-2 text-xs text-[#7a5a00]">Fiyatlandırma modu değişecek; kaydederken onayınız istenecek.</p>
                  )}
                </fieldset>
              )}
              {fx ? (
                <Field
                  label={`${variants.length ? 'Taban fiyat' : 'Fiyat'} (${currency}, KDV hariç)`}
                  htmlFor="p-base"
                  hint={isNew ? 'TL fiyatı her gün güncel kurla hesaplanır.' : `Bugünkü kurla ${fxPreview(form.basePrice)}.${fromCatalog ? ` Katalog fiyatı ${catalogPricing!.basePrice} ${currency}.` : ''}`}
                >
                  <div className="flex gap-2">
                    <TextInput id="p-base" inputMode="decimal" value={form.basePrice} onChange={(e) => set('basePrice', e.target.value)} />
                    {fromCatalog && num(form.basePrice) !== catalogPricing!.basePrice && (
                      <Btn variant="outline" onClick={() => set('basePrice', String(catalogPricing!.basePrice))}>
                        <RotateCcw />
                        Katalog fiyatı
                      </Btn>
                    )}
                  </div>
                </Field>
              ) : (
                <Field
                  label={variants.length ? 'Taban fiyat (TL, KDV hariç)' : 'Fiyat (TL, KDV hariç)'}
                  htmlFor="p-price"
                  hint={variants.length ? 'Varyantlı üründe sepette varyant fiyatı kullanılır.' : undefined}
                >
                  <TextInput id="p-price" inputMode="decimal" value={form.price} onChange={(e) => set('price', e.target.value)} />
                </Field>
              )}
              {form.variantStock ? (
                <Field label="Stok (adet)" htmlFor="p-stock" hint="Varyant stoklarının toplamı; varyant satırlarından değişir.">
                  <TextInput id="p-stock" value={String(variantStockSum)} disabled readOnly />
                </Field>
              ) : (
                <Field label="Stok (adet)" htmlFor="p-stock" hint={variants.length ? 'Varyantlar bu ortak stoktan düşer.' : undefined}>
                  <TextInput id="p-stock" type="number" min={0} value={form.stock} onChange={(e) => set('stock', e.target.value)} />
                </Field>
              )}
              {variants.length > 0 && (
                <div className="sm:col-span-2">
                  <Checkbox
                    checked={form.variantStock}
                    disabled={isNew}
                    onChange={(v) => {
                      set('variantStock', v)
                      // Kapatılırken ortak stok varyant toplamıyla başlar (stok kaybolmaz)
                      if (!v) set('stock', String(variantStockSum))
                    }}
                    label="Varyantlar ayrı stoklanır"
                  />
                  <p className="text-xs text-[#5d6e80] mt-1 ml-6">
                    {isNew
                      ? 'Ürün oluşturulduktan sonra açılabilir.'
                      : form.variantStock
                        ? 'Her varyantın stoğu “Varyantlar” bölümünde girilir; bir varyantın satışı diğerinin stoğunu etkilemez. Stoğu 0 olan varyant satılamaz.'
                        : 'Kapalıyken bütün varyantlar tek stoğu paylaşır (ör. 450 Wp satışı 600 Wp stoğunu da düşürür).'}
                  </p>
                </div>
              )}
              {catalogPricing && (
                <p className="sm:col-span-2 flex gap-2 text-[13px] text-[#20384e] bg-[#f5f7fa] border border-[#e6ebf1] rounded-lg px-3 py-2.5">
                  <Info className="w-4 h-4 text-[#5d6e80] shrink-0 mt-0.5" />
                  <span>
                    {fx ? 'Dövize bağlı: TL fiyat her saat güncel kurla yeniden hesaplanır (tam TL\'ye yukarı yuvarlanır).' : 'Sabit TL: kur değişse de TL fiyat aynı kalır.'}
                    {rateLine && <> Kullanılan kur: {rateLine}.</>}
                    {' '}Şu anki satış fiyatı {fmtTRY(product!.price)}.
                  </span>
                </p>
              )}
            </div>
          </Panel>

          {canCost && (
            <Panel id="maliyet" className="scroll-mt-20">
              <PanelHeader title="Maliyet ve kâr" description="Yalnız Sahip ve Yönetici görür; sitede ve ürün listesinde görünmez." icon={SlidersHorizontal} />
              <div className="p-4 sm:p-5 grid gap-4 sm:grid-cols-3">
                <Field label="Alış maliyeti (KDV hariç)" htmlFor="p-cost">
                  <TextInput id="p-cost" inputMode="decimal" value={form.costPrice} onChange={(e) => set('costPrice', e.target.value)} />
                </Field>
                <Field label="Maliyet para birimi" htmlFor="p-cost-cur">
                  <SelectInput id="p-cost-cur" value={form.costCurrency} onChange={(e) => set('costCurrency', e.target.value as Form['costCurrency'])}>
                    <option value="TRY">TL</option>
                    <option value="USD">USD</option>
                    <option value="EUR">EUR</option>
                  </SelectInput>
                </Field>
                <Field label="Hedef kâr marjı (%)" htmlFor="p-margin" hint="Satış fiyatı üzerinden">
                  <TextInput id="p-margin" inputMode="decimal" value={form.targetMargin} onChange={(e) => set('targetMargin', e.target.value)} />
                </Field>
                {costTry != null && (
                  <p className="sm:col-span-3 text-[13px] text-[#20384e] bg-[#f5f7fa] border border-[#e6ebf1] rounded-lg px-3 py-2.5">
                    Maliyet ≈ {fmtTRY(costTry)}{form.costCurrency !== 'TRY' && ' (güncel kurla)'}.
                    {salePrice != null && marginNow != null && <> Şu anki satış fiyatı {fmtTRY(salePrice)}: kâr {fmtTRY(salePrice - costTry)} (%{marginNow.toFixed(1)}).</>}
                    {targetPrice != null && <> Hedef %{targetNum} için en az {fmtTRY(targetPrice)} (KDV hariç).</>}
                  </p>
                )}
                {isNew && <p className="sm:col-span-3 text-xs text-[#5d6e80]">Kâr hesabı ürün oluşturulup fiyatı belirlendikten sonra gösterilir.</p>}
              </div>
            </Panel>
          )}

          <Panel id="kargo" className="scroll-mt-20">
            <PanelHeader title="Kargo ve teslimat" description="Sepetteki kargo ücreti buradaki koli bilgisinden hesaplanır." icon={Package} />
            <div className="p-4 sm:p-5 grid gap-4 sm:grid-cols-2">
              <Field label="Satış biçimi" htmlFor="p-sale" className="sm:col-span-2">
                <SelectInput id="p-sale" value={form.saleMode} onChange={(e) => set('saleMode', e.target.value as Form['saleMode'])}>
                  {SALE_MODE_OPTIONS.map(([v, l]) => (
                    <option key={v} value={v}>{l}</option>
                  ))}
                </SelectInput>
              </Field>
              {form.saleMode === 'normal' && (
                <>
                  <Field label="Koli ölçüsü (cm, uzunluk × genişlik × yükseklik)" htmlFor="p-dim-l" className="sm:col-span-2" hint="Ürünün kendi ölçüsü değil, gönderilen kolinin ölçüsü.">
                    <div className="grid grid-cols-3 gap-2">
                      <TextInput id="p-dim-l" inputMode="decimal" placeholder="U" value={form.dimL} onChange={(e) => set('dimL', e.target.value)} aria-label="Koli uzunluğu (cm)" />
                      <TextInput inputMode="decimal" placeholder="G" value={form.dimW} onChange={(e) => set('dimW', e.target.value)} aria-label="Koli genişliği (cm)" />
                      <TextInput inputMode="decimal" placeholder="Y" value={form.dimH} onChange={(e) => set('dimH', e.target.value)} aria-label="Koli yüksekliği (cm)" />
                    </div>
                  </Field>
                  <Field label="Koli ağırlığı (kg, brüt)" htmlFor="p-kg">
                    <TextInput id="p-kg" inputMode="decimal" value={form.weightKg} onChange={(e) => set('weightKg', e.target.value)} />
                  </Field>
                  <Field label="Koli sayısı (1 adet ürün için)" htmlFor="p-pkg">
                    <TextInput id="p-pkg" type="number" min={1} max={50} value={form.packageCount} onChange={(e) => set('packageCount', e.target.value)} />
                  </Field>
                  <p className="sm:col-span-2 text-[13px] text-[#20384e] bg-[#f5f7fa] border border-[#e6ebf1] rounded-lg px-3 py-2.5">
                    {desiPreview != null ? (
                      <>
                        1 adet = <strong>{desiPreview} desi</strong>
                        {weightNum > 0 && <>, {Math.round(weightNum * pkgCount * 100) / 100} kg</>} (koli başına hacim/3000 ile ağırlığın büyüğü × koli sayısı). 100 desi veya 100 kg üstü parça ağır taşıma sayılır.
                      </>
                    ) : (
                      'Koli ölçüsü ve ağırlık girilmeden kargo ücreti hesaplanamaz; panelde eklenen ürün bu bilgi olmadan yayına alınamaz.'
                    )}
                    {isCatalog && product?.logisticsSource !== 'panel' && ' Siz değiştirene kadar katalogdaki kargo bilgisi kullanılır.'}
                    {variants.length > 0 && ' Panelde girilen koli bilgisi bütün varyantlara uygulanır.'}
                  </p>
                </>
              )}
              {form.saleMode === 'install' && (
                <p className="sm:col-span-2 text-[13px] text-[#20384e]">Kargo ücretine girmez. Sepet, ödeme ve siparişte kurulum ve nakliyenin fiyata dahil olmadığı, siparişten sonra müşteriyle iletişime geçileceği yazar.</p>
              )}
              {form.saleMode === 'quote' && (
                <p className="sm:col-span-2 text-[13px] text-[#20384e]">Fiyat gösterilmez, sepete eklenemez; ürün sayfasında teklif ve iletişim seçenekleri görünür.</p>
              )}
            </div>
          </Panel>

          <Panel id="varyantlar" className="scroll-mt-20 overflow-hidden">
            <PanelHeader
              title="Varyantlar"
              description="Seçenekler sepette ayrı kalem olur; sipariş tutarı varyant fiyatından hesaplanır."
              icon={Layers}
              actions={
                <Btn
                  size="xs"
                  variant="outline"
                  onClick={() => setVariants((prev) => [...prev, { key: newVariantKey(`v${prev.length + 1}`), label: '', sku: '', price: form.price || '', base: fx ? form.basePrice : '', stock: '0', extra: {} }])}
                >
                  <Plus />
                  Varyant ekle
                </Btn>
              }
            />
            {variants.length === 0 ? (
              <p className="px-5 py-6 text-[13px] text-[#5d6e80]">Bu ürünün varyantı yok. Farklı model/güç seçenekleri varsa “Varyant ekle” ile tanımlayın.</p>
            ) : (
              <div className="overflow-x-auto">
                <table className="w-full text-[13px] min-w-[640px]">
                  <thead>
                    <tr className="text-[11px] uppercase tracking-wider text-[#5d6e80] border-b border-[#e6ebf1] text-left">
                      <th className="px-4 py-2 w-16">Sıra</th>
                      <th className="px-2 py-2">Varyant adı</th>
                      <th className="px-2 py-2 w-48">SKU</th>
                      <th className="px-2 py-2 w-40">{fx ? `Fiyat (${currency}, KDV hariç)` : 'Fiyat (TL, KDV hariç)'}</th>
                      {form.variantStock && <th className="px-2 py-2 w-24">Stok</th>}
                      <th className="px-4 py-2 w-12" />
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-[#eef2f6]">
                    {variants.map((v, i) => {
                      const o = orig.current.variants.find((x) => x.key === v.key)
                      const priceChanged = o && (fx ? o.base !== v.base : o.price !== v.price)
                      const stockChanged = o && o.stock !== v.stock
                      return (
                        <tr key={v.key} className="align-top">
                          <td className="px-4 py-2">
                            <div className="flex gap-0.5">
                              <button type="button" className="w-6 h-8 rounded flex items-center justify-center text-[#5d6e80] hover:bg-[#f1f4f8] disabled:opacity-30" disabled={i === 0} onClick={() => moveVariant(i, i - 1)} aria-label="Yukarı taşı">
                                <ArrowUp className="w-3.5 h-3.5" />
                              </button>
                              <button type="button" className="w-6 h-8 rounded flex items-center justify-center text-[#5d6e80] hover:bg-[#f1f4f8] disabled:opacity-30" disabled={i === variants.length - 1} onClick={() => moveVariant(i, i + 1)} aria-label="Aşağı taşı">
                                <ArrowDown className="w-3.5 h-3.5" />
                              </button>
                            </div>
                          </td>
                          <td className="px-2 py-2">
                            <TextInput value={v.label} onChange={(e) => setVariants((prev) => prev.map((x, j) => (j === i ? { ...x, label: e.target.value } : x)))} aria-label="Varyant adı" placeholder="Örn. 450Wp" />
                            <p className="text-[11px] text-[#9aa8b6] mt-1 font-mono truncate" title="Sepet kimliği (değişmez)">{v.key}</p>
                          </td>
                          <td className="px-2 py-2">
                            <TextInput value={v.sku} onChange={(e) => setVariants((prev) => prev.map((x, j) => (j === i ? { ...x, sku: e.target.value } : x)))} aria-label="Varyant SKU" />
                          </td>
                          <td className="px-2 py-2">
                            {fx ? (
                              <>
                                <TextInput
                                  inputMode="decimal"
                                  value={v.base}
                                  placeholder={String(catalogPricing?.variants.find((c) => c.key === v.key)?.basePrice ?? '')}
                                  onChange={(e) => setVariants((prev) => prev.map((x, j) => (j === i ? { ...x, base: e.target.value } : x)))}
                                  aria-label={`Varyant fiyatı (${currency})`}
                                  className={priceChanged ? 'border-[#f5b400] bg-[#fffbeb]' : undefined}
                                />
                                <p className="text-[11px] text-[#5d6e80] mt-1">
                                  {v.base.trim() ? `≈ ${fxPreview(v.base)} · kurla` : 'Boş: katalog döviz fiyatı kullanılır'}
                                </p>
                              </>
                            ) : (
                              <>
                                <TextInput
                                  inputMode="decimal"
                                  value={v.price}
                                  onChange={(e) => setVariants((prev) => prev.map((x, j) => (j === i ? { ...x, price: e.target.value } : x)))}
                                  aria-label="Varyant fiyatı"
                                  className={priceChanged ? 'border-[#f5b400] bg-[#fffbeb]' : undefined}
                                />
                                {catalogPricing && <p className="text-[11px] text-[#5d6e80] mt-1">Sabit TL</p>}
                              </>
                            )}
                          </td>
                          {form.variantStock && (
                            <td className="px-2 py-2">
                              <TextInput
                                type="number"
                                min={0}
                                value={v.stock}
                                onChange={(e) => setVariants((prev) => prev.map((x, j) => (j === i ? { ...x, stock: e.target.value } : x)))}
                                aria-label={`${v.label || 'Varyant'} stok`}
                                className={stockChanged ? 'border-[#f5b400] bg-[#fffbeb]' : undefined}
                              />
                            </td>
                          )}
                          <td className="px-4 py-2">
                            <button
                              type="button"
                              onClick={() => setVariants((prev) => prev.filter((_, j) => j !== i))}
                              className="w-8 h-9 rounded flex items-center justify-center text-[#9aa8b6] hover:text-red-600 hover:bg-red-50"
                              aria-label={`${v.label || 'Varyant'} sil`}
                            >
                              <Trash2 className="w-4 h-4" />
                            </button>
                          </td>
                        </tr>
                      )
                    })}
                  </tbody>
                </table>
              </div>
            )}
          </Panel>

          <Panel id="gorseller" className="scroll-mt-20">
            <PanelHeader
              title="Görseller"
              description="İlk görsel kapak görselidir. Sürükleyerek veya oklarla sıralayın. Yüklenenler WebP'ye çevrilir (en fazla 1600 px)."
              icon={Images}
              actions={
                <Btn size="xs" variant="outline" onClick={() => fileInput.current?.click()} disabled={isNew || uploading > 0}>
                  <Upload />
                  Görsel yükle
                </Btn>
              }
            />
            <div className="p-4 sm:p-5 space-y-3">
              {variants.length > 0 && !isNew && (
                <div className="rounded-lg border border-[#e6ebf1]">
                  <div className="px-3 py-2.5 border-b border-[#eef2f6]">
                    <p className="text-[13px] font-medium text-[#121926]">Varyant görselleri</p>
                    <p className="text-xs text-[#5d6e80] mt-0.5">
                      Varyantın kendi görseli varsa ürün sayfasında o varyant seçiliyken o gösterilir; yoksa genel galeri. Genel galeriyi değiştirmek kendi görseli olan varyantları etkilemez.
                      {product?._meta?.variantImagesSource === 'catalog' && ' Şu anki varyant görselleri katalogdan geliyor.'}
                      {' '}Görsel atamak için önce genel galeriye yükleyin, sonra aşağıdan seçin.
                    </p>
                  </div>
                  <ul className="divide-y divide-[#eef2f6]">
                    {variants.map((v) => {
                      const own = variantImages[v.key] ?? []
                      return (
                        <li key={v.key} className="px-3 py-2.5 space-y-2">
                          <div className="flex flex-wrap items-center justify-between gap-2">
                            <span className="text-[13px] text-[#20384e]">
                              {v.label || v.key} · <span className={own.length ? 'text-[#121926] font-medium' : 'text-[#5d6e80]'}>{own.length ? `kendi görselleri (${own.length})` : 'genel galeri'}</span>
                            </span>
                            {own.length > 0 && (
                              <button type="button" className="text-xs font-medium text-[#0b2540] hover:underline" onClick={() => setVariantImages((p) => ({ ...p, [v.key]: [] }))}>
                                Genel galeriyi kullan
                              </button>
                            )}
                          </div>
                          <div className="flex flex-wrap gap-1.5">
                            {[...new Set([...own, ...images])].map((url) => {
                              const on = own.includes(url)
                              return (
                                <button
                                  key={url}
                                  type="button"
                                  aria-pressed={on}
                                  title={on ? 'Bu varyanttan kaldır' : 'Bu varyanta ata'}
                                  onClick={() => setVariantImages((p) => ({ ...p, [v.key]: on ? own.filter((u) => u !== url) : [...own, url] }))}
                                  className={cn('w-12 h-12 rounded border bg-white overflow-hidden', on ? 'border-[#0b2540] ring-2 ring-[#0b2540]' : 'border-[#e6ebf1] opacity-60 hover:opacity-100')}
                                >
                                  {/* eslint-disable-next-line @next/next/no-img-element */}
                                  <img src={url} alt="" className="w-full h-full object-contain" loading="lazy" />
                                </button>
                              )
                            })}
                          </div>
                        </li>
                      )
                    })}
                  </ul>
                </div>
              )}
              <input
                ref={fileInput}
                type="file"
                accept="image/jpeg,image/png,image/webp,image/avif"
                multiple
                className="hidden"
                onChange={(e) => {
                  if (e.target.files) upload(e.target.files)
                  e.target.value = ''
                }}
              />
              <div
                onDragOver={(e) => {
                  if (dragIndex !== null || isNew) return
                  e.preventDefault()
                  setDropActive(true)
                }}
                onDragLeave={() => setDropActive(false)}
                onDrop={(e) => {
                  setDropActive(false)
                  if (dragIndex !== null || isNew) return
                  e.preventDefault()
                  if (e.dataTransfer.files?.length) upload(e.dataTransfer.files)
                }}
                className={cn('rounded-xl border-2 border-dashed p-3 transition-colors', dropActive ? 'border-[#f5b400] bg-[#fffbeb]' : 'border-[#e6ebf1]')}
              >
                {isNew ? (
                  <p className="py-6 text-center text-[13px] text-[#5d6e80]">Görsel eklemek için önce ürünü oluşturun.</p>
                ) : images.length === 0 && uploading === 0 ? (
                  <button type="button" onClick={() => fileInput.current?.click()} className="w-full py-8 flex flex-col items-center gap-2 text-[13px] text-[#5d6e80] hover:text-[#0b2540]">
                    <ImagePlus className="w-8 h-8 text-[#b9c3cf]" />
                    Görselleri buraya sürükleyin veya tıklayıp seçin
                  </button>
                ) : (
                  <ul className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 2xl:grid-cols-6 gap-3">
                    {images.map((url, i) => (
                      <li
                        key={url}
                        draggable
                        onDragStart={() => setDragIndex(i)}
                        onDragEnd={() => setDragIndex(null)}
                        onDragOver={(e) => {
                          if (dragIndex === null) return
                          e.preventDefault()
                          if (dragIndex !== i) {
                            moveImage(dragIndex, i)
                            setDragIndex(i)
                          }
                        }}
                        className={cn('group relative rounded-lg border bg-white overflow-hidden', dragIndex === i ? 'border-[#f5b400] opacity-60' : 'border-[#e6ebf1]')}
                      >
                        <div className="aspect-square flex items-center justify-center bg-[#fafbfd]">
                          {/* eslint-disable-next-line @next/next/no-img-element */}
                          <img src={url} alt={`Görsel ${i + 1}`} className="max-w-full max-h-full object-contain" loading="lazy" />
                        </div>
                        {i === 0 && <span className="absolute top-1.5 left-1.5"><Pill tone="yellow">Kapak</Pill></span>}
                        <span className="absolute top-1.5 right-1.5 w-6 h-6 rounded bg-white/90 border border-[#e6ebf1] flex items-center justify-center text-[#9aa8b6] cursor-grab" aria-hidden>
                          <GripVertical className="w-3.5 h-3.5" />
                        </span>
                        <div className="flex items-center justify-between gap-1 px-1.5 py-1 border-t border-[#eef2f6]">
                          <div className="flex">
                            <button type="button" onClick={() => moveImage(i, i - 1)} disabled={i === 0} className="w-7 h-7 rounded flex items-center justify-center text-[#5d6e80] hover:bg-[#f1f4f8] disabled:opacity-30" aria-label="Öne al">
                              <ArrowUp className="w-3.5 h-3.5 -rotate-90" />
                            </button>
                            <button type="button" onClick={() => moveImage(i, i + 1)} disabled={i === images.length - 1} className="w-7 h-7 rounded flex items-center justify-center text-[#5d6e80] hover:bg-[#f1f4f8] disabled:opacity-30" aria-label="Sona al">
                              <ArrowUp className="w-3.5 h-3.5 rotate-90" />
                            </button>
                            {i > 0 && (
                              <button type="button" onClick={() => moveImage(i, 0)} className="h-7 px-1.5 rounded text-[11px] font-medium text-[#20384e] hover:bg-[#f1f4f8]">
                                Kapak yap
                              </button>
                            )}
                          </div>
                          <button type="button" onClick={() => setImages((prev) => prev.filter((u) => u !== url))} className="w-7 h-7 rounded flex items-center justify-center text-[#9aa8b6] hover:text-red-600 hover:bg-red-50" aria-label="Görseli kaldır">
                            <Trash2 className="w-3.5 h-3.5" />
                          </button>
                        </div>
                      </li>
                    ))}
                    {uploading > 0 &&
                      Array.from({ length: uploading }).map((_, i) => (
                        <li key={`up-${i}`} className="aspect-square rounded-lg border border-dashed border-[#d3d9e1] bg-[#fafbfd] flex items-center justify-center text-xs text-[#5d6e80] animate-pulse">
                          Yükleniyor…
                        </li>
                      ))}
                    <li>
                      <button type="button" onClick={() => fileInput.current?.click()} className="w-full aspect-square rounded-lg border border-dashed border-[#d3d9e1] flex flex-col items-center justify-center gap-1 text-xs text-[#5d6e80] hover:border-[#0b2540] hover:text-[#0b2540]">
                        <ImagePlus className="w-5 h-5" />
                        Ekle
                      </button>
                    </li>
                  </ul>
                )}
              </div>
            </div>
          </Panel>

          <Panel id="ozellikler" className="scroll-mt-20">
            <PanelHeader title="Öne çıkan özellikler" description="Her satır bir madde" icon={ListChecks} />
            <div className="p-4 sm:p-5">
              <TextArea rows={5} value={form.features} onChange={(e) => set('features', e.target.value)} aria-label="Öne çıkan özellikler" placeholder={'Örn.\n%23 modül verimi\n30 yıl performans garantisi'} />
            </div>
          </Panel>

          <Panel id="teknik" className="scroll-mt-20">
            <PanelHeader
              title="Teknik özellikler"
              icon={SlidersHorizontal}
              actions={
                <Btn size="xs" variant="outline" onClick={() => setSpecs((prev) => [...prev, { id: ++specSeq, k: '', v: '' }])}>
                  <Plus />
                  Satır ekle
                </Btn>
              }
            />
            <div className="p-4 sm:p-5 space-y-2">
              {specs.length === 0 && <p className="text-[13px] text-[#5d6e80]">Teknik özellik yok.</p>}
              {specs.map((s) => (
                <div key={s.id} className="grid grid-cols-[1fr_1.4fr_auto] gap-2">
                  <TextInput value={s.k} onChange={(e) => setSpecs((prev) => prev.map((x) => (x.id === s.id ? { ...x, k: e.target.value } : x)))} placeholder="Özellik" aria-label="Özellik adı" />
                  <TextInput value={s.v} onChange={(e) => setSpecs((prev) => prev.map((x) => (x.id === s.id ? { ...x, v: e.target.value } : x)))} placeholder="Değer" aria-label="Özellik değeri" />
                  <button type="button" onClick={() => setSpecs((prev) => prev.filter((x) => x.id !== s.id))} className="w-9 h-9 rounded flex items-center justify-center text-[#9aa8b6] hover:text-red-600 hover:bg-red-50" aria-label="Satırı sil">
                    <Trash2 className="w-4 h-4" />
                  </button>
                </div>
              ))}
            </div>
          </Panel>

          {showVoltage && (
            <Panel id="voltaj" className={cn('scroll-mt-20', !form.systemVoltage.length && !voltageMeta?.fallback.any && !voltageMeta?.fallback.classes.length && 'border-[#f5dc85]')}>
              <PanelHeader title="Sistem voltajı" description="Uyumlu ürün önerileri bu değere göre seçilir: akü, inverter ve şarj cihazı ancak voltajları örtüşüyorsa birlikte önerilir." icon={SlidersHorizontal} />
              <div className="p-4 sm:p-5 space-y-3">
                <div className="flex flex-wrap gap-x-5 gap-y-2">
                  {(['12', '24', '48', 'HV'] as const).map((v) => (
                    <Checkbox key={v} checked={form.systemVoltage.includes(v)} onChange={(on) => toggleVoltage(v, on)} label={v === 'HV' ? 'Yüksek gerilim (HV)' : `${v} V`} />
                  ))}
                  <Checkbox checked={form.systemVoltage.includes('any')} onChange={(on) => toggleVoltage('any', on)} label="Voltajdan bağımsız (kablo, aksesuar)" />
                </div>
                <p className="text-[13px] text-[#5d6e80]">
                  {form.systemVoltage.length
                    ? 'Panelde seçilen değer kullanılır.'
                    : voltageMeta?.fallback.any
                      ? 'Seçim yok: katalog kaydına göre voltajdan bağımsız.'
                      : voltageMeta?.fallback.classes.length
                        ? `Seçim yok: ${voltageMeta.fallback.source === 'veri' ? 'katalog kaydına' : 'ürün adına ve özelliklerine'} göre ${voltageMeta.fallback.classes.map((c) => (c === 'HV' ? 'HV' : `${c} V`)).join(', ')}.`
                        : 'Voltaj tanımsız: ürün adında ve özelliklerinde voltaj yok. Seçim yapılana kadar akü, inverter ve şarj cihazlarıyla birlikte uyumlu ürün olarak önerilmez.'}
                </p>
              </div>
            </Panel>
          )}
        </div>
      </div>

      {/* Kaydet çubuğu */}
      <div className="fixed bottom-0 left-0 right-0 lg:left-60 z-20 border-t border-[#e6ebf1] bg-white/95 backdrop-blur px-4 sm:px-8 py-3">
        <div className="max-w-[1600px] mx-auto flex items-center justify-between gap-3">
          <p className="text-[13px] text-[#5d6e80] truncate">
            {isNew ? 'Yeni ürün' : dirty ? <span className="text-[#7a5a00] font-medium">Kaydedilmemiş değişiklikler var ({Object.keys(changes).filter((k) => k !== 'image').length} alan)</span> : 'Tüm değişiklikler kaydedildi'}
          </p>
          <div className="flex gap-2 shrink-0">
            {dirty && !isNew && (
              <Btn variant="ghost" onClick={() => product && apply(product)} disabled={saving}>
                Vazgeç
              </Btn>
            )}
            <Btn variant="accent" size="md" onClick={() => save()} loading={saving} disabled={!isNew && !dirty}>
              {!saving && <Save />}
              {isNew ? 'Taslak olarak oluştur' : 'Kaydet'}
            </Btn>
          </div>
        </div>
      </div>

      <Modal
        open={confirmMode}
        onClose={() => setConfirmMode(false)}
        title="Fiyatlandırma modu değişsin mi?"
        size="sm"
        footer={
          <>
            <Btn variant="outline" onClick={() => setConfirmMode(false)}>Vazgeç</Btn>
            <Btn variant="accent" onClick={() => save(true, pendingStatus.current)} loading={saving}>
              {fx ? 'Dövize bağla ve kaydet' : 'Sabit TL yap ve kaydet'}
            </Btn>
          </>
        }
      >
        <div className="space-y-3 text-sm text-[#20384e]">
          <p>
            <strong>Şu an:</strong>{' '}
            {fx
              ? `Sabit TL, ${fmtTRY(product?.price ?? 0)}. Kur değişimi fiyatı etkilemiyor.`
              : `Dövize bağlı, ${product?.basePrice ?? catalogPricing?.basePrice} ${currency} × kur = ${fmtTRY(product?.price ?? 0)}.`}
          </p>
          <p>
            <strong>Kaydedince:</strong>{' '}
            {fx
              ? `Dövize bağlı, ${form.basePrice} ${currency} × güncel kur ≈ ${fxPreview(form.basePrice)}. TL fiyat kurla birlikte değişir; boş bırakılan varyant fiyatları katalogdan alınır.`
              : `Sabit TL, ${fmtTRY(num(form.price) || 0)}. Kur artsa da fiyat değişmez; ${variants.length ? 'varyant fiyatları da o anki TL değerlerinde sabitlenir.' : 'fiyatı siz güncellemelisiniz.'}`}
          </p>
          <p className="text-xs text-[#5d6e80]">İstediğiniz zaman bu ekrandan diğer moda geri dönebilirsiniz. Değişiklik işlem kaydına yazılır.</p>
        </div>
      </Modal>

      <Modal
        open={confirmReset}
        onClose={() => setConfirmReset(false)}
        title={isCatalog ? 'Panel düzenlemeleri sıfırlansın mı?' : 'Ürün silinsin mi?'}
        size="sm"
        footer={
          <>
            <Btn variant="outline" onClick={() => setConfirmReset(false)}>Vazgeç</Btn>
            <Btn variant="danger" onClick={resetOverride}>{isCatalog ? 'Sıfırla' : 'Sil'}</Btn>
          </>
        }
      >
        <p className="text-sm text-[#20384e]">
          {isCatalog
            ? 'Bu üründe panelden yapılan ad, fiyat, açıklama, varyant ve görsel değişiklikleri kaldırılır; ürün katalogdaki haline döner. Stok değeri korunur.'
            : 'Panelden eklenen bu ürün siteden kaldırılır. Bu işlem geri alınamaz.'}
        </p>
      </Modal>
    </div>
  )
}

export default function ProductEditPage() {
  return (
    <Suspense fallback={<Spinner />}>
      <Editor />
    </Suspense>
  )
}
