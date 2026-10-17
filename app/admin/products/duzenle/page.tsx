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
import { cn } from '@/lib/utils'

type Variant = {
  key: string
  label: string
  price: number
  basePrice?: number
  sku?: string
  [k: string]: unknown
}

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
  _meta?: { isCatalog: boolean; hasOverride: boolean; overrideUpdatedAt: string | null }
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
  stock: string
  features: string
}

type VariantRow = { key: string; label: string; sku: string; price: string; basePrice?: number; extra: Record<string, unknown> }
type SpecRow = { id: number; k: string; v: string }

const EMPTY_FORM: Form = { name: '', brand: '', sku: '', category: '', description: '', fullDescription: '', slogan: '', warranty: '', featured: false, price: '', stock: '0', features: '' }

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
    stock: String(p.stock ?? 0),
    features: (p.features ?? []).join('\n'),
  }
}

function toVariantRows(vs?: Variant[]): VariantRow[] {
  return (vs ?? []).map(({ key, label, sku, price, basePrice, ...extra }) => ({
    key,
    label,
    sku: sku ?? '',
    price: String(price ?? ''),
    basePrice,
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

function variantsPayload(rows: VariantRow[], original: VariantRow[]): Variant[] {
  const origMap = new Map(original.map((r) => [r.key, r]))
  return rows.map((r) => {
    const o = origMap.get(r.key)
    const price = Math.round(Number(r.price.replace(',', '.')) * 100) / 100
    // Fiyat elle değiştirildiyse döviz bazlı fiyat bırakılır (sabit TL fiyat geçerli olur)
    const keepBase = o && o.price === r.price && r.basePrice !== undefined
    return {
      ...r.extra,
      key: r.key,
      label: r.label.trim(),
      price,
      ...(r.sku.trim() ? { sku: r.sku.trim() } : {}),
      ...(keepBase ? { basePrice: r.basePrice } : {}),
    }
  })
}

function SectionNav({ items }: { items: { id: string; label: string }[] }) {
  return (
    <nav className="hidden xl:block sticky top-20 space-y-0.5" aria-label="Bölümler">
      {items.map((i) => (
        <a key={i.id} href={`#${i.id}`} className="block px-3 py-1.5 rounded-md text-[13px] text-[#6b7c8f] hover:text-[#0b2540] hover:bg-white">
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
  const id = sp.get('id') || ''
  const isNew = !id && sp.get('yeni') === '1'

  const [product, setProduct] = useState<Product | null>(null)
  const [loadError, setLoadError] = useState<string | null>(null)
  const [form, setForm] = useState<Form>(EMPTY_FORM)
  const [variants, setVariants] = useState<VariantRow[]>([])
  const [images, setImages] = useState<string[]>([])
  const [specs, setSpecs] = useState<SpecRow[]>([])
  const [saving, setSaving] = useState(false)
  const [uploading, setUploading] = useState(0)
  const [dragIndex, setDragIndex] = useState<number | null>(null)
  const [dropActive, setDropActive] = useState(false)
  const [confirmReset, setConfirmReset] = useState(false)
  const fileInput = useRef<HTMLInputElement>(null)

  const orig = useRef<{ form: Form; variants: VariantRow[]; images: string[]; specs: SpecRow[] }>({ form: EMPTY_FORM, variants: [], images: [], specs: [] })
  // Bu oturumda yüklenen ama kaydedilmeden kaldırılan dosyalar silinir
  const sessionUploads = useRef<Set<string>>(new Set())

  const apply = useCallback((p: Product) => {
    const f = toForm(p)
    const v = toVariantRows(p.variants)
    const imgs = p.images?.length ? [...p.images] : p.image ? [p.image] : []
    const s = toSpecRows(p.specifications)
    setProduct(p)
    setForm(f)
    setVariants(v)
    setImages(imgs)
    setSpecs(s)
    orig.current = { form: f, variants: v, images: imgs, specs: s }
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
      orig.current = { form: EMPTY_FORM, variants: [], images: [], specs: [] }
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
    if (str('price') !== o.form.price.trim()) body.price = Number(str('price').replace(',', '.'))
    if (str('stock') !== o.form.stock.trim()) body.stock = Math.max(0, Math.floor(Number(str('stock')) || 0))
    const feats = form.features.split('\n').map((l) => l.trim()).filter(Boolean)
    if (feats.join('\n') !== o.form.features.split('\n').map((l) => l.trim()).filter(Boolean).join('\n')) body.features = feats
    if (JSON.stringify(images) !== JSON.stringify(o.images)) {
      body.images = images
      body.image = images[0] ?? null
    }
    const vNow = variants.map((r) => [r.key, r.label.trim(), r.sku.trim(), r.price.trim()])
    const vOrig = o.variants.map((r) => [r.key, r.label.trim(), r.sku.trim(), r.price.trim()])
    if (JSON.stringify(vNow) !== JSON.stringify(vOrig)) body.variants = variantsPayload(variants, o.variants)
    const sNow = specs.filter((s) => s.k.trim()).map((s) => [s.k.trim(), s.v.trim()])
    const sOrig = o.specs.map((s) => [s.k.trim(), s.v.trim()])
    if (JSON.stringify(sNow) !== JSON.stringify(sOrig)) body.specifications = Object.fromEntries(sNow)
    return body
  }, [form, images, variants, specs])

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
    const price = Number(form.price.replace(',', '.'))
    if (!Number.isFinite(price) || price < 0) return 'Fiyat geçersiz.'
    for (const v of variants) {
      if (!v.label.trim()) return 'Her varyantın bir adı olmalı.'
      const vp = Number(v.price.replace(',', '.'))
      if (!Number.isFinite(vp) || vp < 0 || v.price.trim() === '') return `“${v.label}” varyantının fiyatı geçersiz.`
    }
    if (product?.variants?.length && variants.length === 0) return 'Varyantlı üründe en az bir varyant kalmalı.'
    return null
  }

  const save = async () => {
    const err = validate()
    if (err) {
      toast.error('Kaydedilemedi', err)
      return
    }
    setSaving(true)
    try {
      if (isNew) {
        const body = {
          name: form.name.trim(),
          price: Number(form.price.replace(',', '.')),
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
          ...(variants.length ? { variants: variantsPayload(variants, []) } : {}),
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
        orig.current = { form, variants, images, specs }
        toast.success('Ürün oluşturuldu', 'Şimdi görselleri ekleyebilirsiniz.')
        router.replace(`/admin/products/duzenle?id=${encodeURIComponent(json.productId)}`)
        return
      }

      const body = changes
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
      toast.success('Değişiklikler kaydedildi', form.name)
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
  const currencyNote = product?.priceCurrency && product.priceCurrency !== 'TRY' && typeof product.basePrice === 'number'
  const hasVariantImages = !!product?.imagesByVariant?.some((a) => a?.length)
  const categories = [...new Set([...ALL_CATEGORIES, ...(form.category ? [form.category] : [])])]

  const sections = [
    { id: 'genel', label: 'Genel bilgiler' },
    { id: 'fiyat', label: 'Fiyat ve stok' },
    { id: 'varyantlar', label: 'Varyantlar' },
    { id: 'gorseller', label: 'Görseller' },
    { id: 'ozellikler', label: 'Öne çıkan özellikler' },
    { id: 'teknik', label: 'Teknik özellikler' },
  ]

  return (
    <div className="space-y-5 pb-24">
      <PageHeader
        back={{ href: '/admin/products', label: 'Ürünler & Stok' }}
        title={isNew ? 'Yeni ürün' : form.name || 'Ürün'}
        description={
          isNew ? (
            'Temel bilgileri girip oluşturun; görselleri oluşturduktan sonra ekleyebilirsiniz.'
          ) : (
            <span className="inline-flex flex-wrap items-center gap-1.5">
              <span className="font-mono text-xs">{id}</span>
              {isCatalog ? <Pill tone="navy">Katalog ürünü</Pill> : <Pill tone="violet">Panelde eklendi</Pill>}
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
                hint={product?.descriptionHtml ? 'Bu ürünün katalogdan gelen biçimli açıklaması var; buraya metin yazarsanız sitede onun yerine bu metin gösterilir.' : undefined}
              >
                <TextArea id="p-full" rows={6} value={form.fullDescription} onChange={(e) => set('fullDescription', e.target.value)} />
              </Field>
              <Checkbox className="md:col-span-2" checked={form.featured} onChange={(v) => set('featured', v)} label={<span className="inline-flex items-center gap-1.5"><Star className="w-4 h-4 text-[#e0a500]" />Ana sayfada öne çıkar</span>} />
            </div>
          </Panel>

          <Panel id="fiyat" className="scroll-mt-20">
            <PanelHeader title="Fiyat ve stok" icon={SlidersHorizontal} />
            <div className="p-4 sm:p-5 grid gap-4 sm:grid-cols-2">
              <Field
                label={variants.length ? 'Taban fiyat (TL, KDV hariç)' : 'Fiyat (TL, KDV hariç)'}
                htmlFor="p-price"
                hint={variants.length ? 'Varyantlı üründe sepette varyant fiyatı kullanılır.' : undefined}
              >
                <TextInput id="p-price" inputMode="decimal" value={form.price} onChange={(e) => set('price', e.target.value)} />
              </Field>
              <Field label="Stok (adet)" htmlFor="p-stock" hint="Stok ürün bazında tutulur (varyantlar ortak stoktan düşer).">
                <TextInput id="p-stock" type="number" min={0} value={form.stock} onChange={(e) => set('stock', e.target.value)} />
              </Field>
              {currencyNote && (
                <p className="sm:col-span-2 flex gap-2 text-[13px] text-[#20384e] bg-[#f5f7fa] border border-[#e6ebf1] rounded-lg px-3 py-2.5">
                  <Info className="w-4 h-4 text-[#6b7c8f] shrink-0 mt-0.5" />
                  <span>
                    Katalog fiyatı <strong>{product!.basePrice} {product!.priceCurrency}</strong>; TL karşılığı her gün güncel kurla hesaplanır
                    {' '}(şu an {fmtTRY(product!.price)}). TL fiyatı değiştirirseniz ürün sabit TL fiyatla satılır.
                  </span>
                </p>
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
                  onClick={() => setVariants((prev) => [...prev, { key: newVariantKey(`v${prev.length + 1}`), label: '', sku: '', price: form.price || '', extra: {} }])}
                >
                  <Plus />
                  Varyant ekle
                </Btn>
              }
            />
            {variants.length === 0 ? (
              <p className="px-5 py-6 text-[13px] text-[#6b7c8f]">Bu ürünün varyantı yok. Farklı model/güç seçenekleri varsa “Varyant ekle” ile tanımlayın.</p>
            ) : (
              <div className="overflow-x-auto">
                <table className="w-full text-[13px] min-w-[640px]">
                  <thead>
                    <tr className="text-[11px] uppercase tracking-wider text-[#6b7c8f] border-b border-[#e6ebf1] text-left">
                      <th className="px-4 py-2 w-16">Sıra</th>
                      <th className="px-2 py-2">Varyant adı</th>
                      <th className="px-2 py-2 w-48">SKU</th>
                      <th className="px-2 py-2 w-40">Fiyat (TL, KDV hariç)</th>
                      <th className="px-4 py-2 w-12" />
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-[#eef2f6]">
                    {variants.map((v, i) => {
                      const o = orig.current.variants.find((x) => x.key === v.key)
                      const priceChanged = o && o.price !== v.price
                      return (
                        <tr key={v.key} className="align-top">
                          <td className="px-4 py-2">
                            <div className="flex gap-0.5">
                              <button type="button" className="w-6 h-8 rounded flex items-center justify-center text-[#6b7c8f] hover:bg-[#f1f4f8] disabled:opacity-30" disabled={i === 0} onClick={() => moveVariant(i, i - 1)} aria-label="Yukarı taşı">
                                <ArrowUp className="w-3.5 h-3.5" />
                              </button>
                              <button type="button" className="w-6 h-8 rounded flex items-center justify-center text-[#6b7c8f] hover:bg-[#f1f4f8] disabled:opacity-30" disabled={i === variants.length - 1} onClick={() => moveVariant(i, i + 1)} aria-label="Aşağı taşı">
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
                            <TextInput
                              inputMode="decimal"
                              value={v.price}
                              onChange={(e) => setVariants((prev) => prev.map((x, j) => (j === i ? { ...x, price: e.target.value } : x)))}
                              aria-label="Varyant fiyatı"
                              className={priceChanged ? 'border-[#f5b400] bg-[#fffbeb]' : undefined}
                            />
                            {v.basePrice !== undefined && product?.priceCurrency && (
                              <p className="text-[11px] text-[#6b7c8f] mt-1">{priceChanged ? 'Sabit TL fiyata geçecek' : `${v.basePrice} ${product.priceCurrency} · kurla`}</p>
                            )}
                          </td>
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
              {hasVariantImages && (
                <p className="flex gap-2 text-[13px] text-[#7a5a00] bg-[#fffbeb] border border-[#f5dc85] rounded-lg px-3 py-2.5">
                  <Info className="w-4 h-4 shrink-0 mt-0.5" />
                  Bu katalog ürününde varyant bazlı görseller tanımlı; ürün sayfasında varyant seçiliyken o görseller gösterilir.
                </p>
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
                  <p className="py-6 text-center text-[13px] text-[#6b7c8f]">Görsel eklemek için önce ürünü oluşturun.</p>
                ) : images.length === 0 && uploading === 0 ? (
                  <button type="button" onClick={() => fileInput.current?.click()} className="w-full py-8 flex flex-col items-center gap-2 text-[13px] text-[#6b7c8f] hover:text-[#0b2540]">
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
                            <button type="button" onClick={() => moveImage(i, i - 1)} disabled={i === 0} className="w-7 h-7 rounded flex items-center justify-center text-[#6b7c8f] hover:bg-[#f1f4f8] disabled:opacity-30" aria-label="Öne al">
                              <ArrowUp className="w-3.5 h-3.5 -rotate-90" />
                            </button>
                            <button type="button" onClick={() => moveImage(i, i + 1)} disabled={i === images.length - 1} className="w-7 h-7 rounded flex items-center justify-center text-[#6b7c8f] hover:bg-[#f1f4f8] disabled:opacity-30" aria-label="Sona al">
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
                        <li key={`up-${i}`} className="aspect-square rounded-lg border border-dashed border-[#d3d9e1] bg-[#fafbfd] flex items-center justify-center text-xs text-[#6b7c8f] animate-pulse">
                          Yükleniyor…
                        </li>
                      ))}
                    <li>
                      <button type="button" onClick={() => fileInput.current?.click()} className="w-full aspect-square rounded-lg border border-dashed border-[#d3d9e1] flex flex-col items-center justify-center gap-1 text-xs text-[#6b7c8f] hover:border-[#0b2540] hover:text-[#0b2540]">
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
              {specs.length === 0 && <p className="text-[13px] text-[#6b7c8f]">Teknik özellik yok.</p>}
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
        </div>
      </div>

      {/* Kaydet çubuğu */}
      <div className="fixed bottom-0 left-0 right-0 lg:left-60 z-20 border-t border-[#e6ebf1] bg-white/95 backdrop-blur px-4 sm:px-8 py-3">
        <div className="max-w-[1600px] mx-auto flex items-center justify-between gap-3">
          <p className="text-[13px] text-[#6b7c8f] truncate">
            {isNew ? 'Yeni ürün' : dirty ? <span className="text-[#7a5a00] font-medium">Kaydedilmemiş değişiklikler var ({Object.keys(changes).filter((k) => k !== 'image').length} alan)</span> : 'Tüm değişiklikler kaydedildi'}
          </p>
          <div className="flex gap-2 shrink-0">
            {dirty && !isNew && (
              <Btn variant="ghost" onClick={() => product && apply(product)} disabled={saving}>
                Vazgeç
              </Btn>
            )}
            <Btn variant="accent" size="md" onClick={save} loading={saving} disabled={!isNew && !dirty}>
              {!saving && <Save />}
              {isNew ? 'Ürünü oluştur' : 'Kaydet'}
            </Btn>
          </div>
        </div>
      </div>

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
