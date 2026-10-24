'use client'

import { StockPriceTransfer } from '@/components/admin/DataTransfer'
/**
 * Ürünler & Stok — tek ürün yöneticisi (eski "Ürün Düzenleme" /admin/katalog ve "Stok Yönetimi" /admin/urunler
 * sayfaları buraya yönlenir). Liste, satır içi stok düzenleme, toplu işlemler; ayrıntılı düzenleme
 * /admin/products/duzenle?id=... sayfasında.
 */

import React, { Suspense, useCallback, useEffect, useMemo, useState } from 'react'
import Link from 'next/link'
import { usePathname, useRouter, useSearchParams } from 'next/navigation'
import { Package, Plus, Star, Pencil, RefreshCw, ImageOff, Layers, Percent, X, ExternalLink } from 'lucide-react'
import { fmtTRY } from '@/lib/format'
import {
  Btn,
  BtnLink,
  EmptyState,
  PageHeader,
  Pagination,
  Panel,
  Pill,
  SearchInput,
  SelectInput,
  Spinner,
  TabStrip,
  TextInput,
  Modal,
  Field,
} from '@/components/admin/ui'
import { useToast } from '@/components/admin/toast'
import { cn } from '@/lib/utils'
import { DC_SYSTEM_CATEGORIES, hasKnownVoltage } from '@/lib/compat'
import { matchProduct } from '@/lib/admin-product-search'
import { BULK_STOCK_MODE_TR, planBulkStock, type BulkStockMode } from '@/lib/bulk-stock'

type CatalogRow = {
  id: string
  name: string
  sku?: string
  brand?: string | null
  category?: string | null
  price: number
  stock: number
  featured: boolean
  image?: string | null
  images?: string[]
  variants?: { key: string; label: string; price: number; sku?: string; stock?: number }[]
  /** Varyantlar ayrı stoklanıyor: satırdaki stok varyant toplamıdır, düzenleyiciden değişir */
  variantStock?: boolean
  /** Panelde eklenen ürün taslakta (A08): sitede görünmez */
  status?: 'draft'
  salesClosed?: string
  specifications?: Record<string, string>
  systemVoltage?: string[]
}

const LOW = 5

/** DC sistem ürünü ve voltajı panelde, veri dosyasında ya da adında yok: uyumlu ürün önerilerine giremez (lib/compat) */
const voltageUnknown = (p: CatalogRow) => DC_SYSTEM_CATEGORIES.has(p.category ?? '') && !hasKnownVoltage({ ...p, category: p.category ?? null })
const PAGE_SIZE = 50

type StockTab = 'all' | 'in' | 'low' | 'out' | 'featured' | 'novoltage'

function priceLabel(p: CatalogRow) {
  const prices = (p.variants?.length ? p.variants.map((v) => v.price) : [p.price]).filter((n) => Number.isFinite(n))
  if (!prices.length) return '—'
  const min = Math.min(...prices)
  const max = Math.max(...prices)
  return min === max ? fmtTRY(min) : `${fmtTRY(min)} – ${fmtTRY(max)}`
}

function StockCell({ row, onSaved }: { row: CatalogRow; onSaved: (id: string, stock: number) => void }) {
  const toast = useToast()
  const [value, setValue] = useState(String(row.stock ?? 0))
  const [saving, setSaving] = useState(false)
  useEffect(() => setValue(String(row.stock ?? 0)), [row.stock])
  const dirty = value !== String(row.stock ?? 0)

  const save = async () => {
    const n = Math.max(0, Math.floor(Number(value)))
    if (!Number.isFinite(n)) {
      setValue(String(row.stock))
      return
    }
    if (n === row.stock) return
    setSaving(true)
    try {
      const res = await fetch('/api/admin/stock-overrides', {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ productId: row.id, stock: n }),
        credentials: 'include',
      })
      if (!res.ok) throw new Error((await res.json().catch(() => null))?.error || 'Stok kaydedilemedi')
      onSaved(row.id, n)
      toast.success('Stok güncellendi', `${row.name}: ${n} adet`)
    } catch (e) {
      toast.error('Stok kaydedilemedi', e instanceof Error ? e.message : undefined)
      setValue(String(row.stock))
    } finally {
      setSaving(false)
    }
  }

  if (row.variantStock) {
    return (
      <Link
        href={`/admin/products/duzenle?id=${encodeURIComponent(row.id)}#varyantlar`}
        title="Varyantlar ayrı stoklanıyor; stok varyant bazında düzenlenir"
        className={cn('inline-flex items-center h-8 px-2 rounded-md border border-dashed border-[#d3d9e1] text-sm tabular-nums hover:bg-[#f5f7fa]', row.stock === 0 ? 'text-red-700' : row.stock <= LOW ? 'text-amber-700' : 'text-[#121926]')}
      >
        {row.stock} <span className="ml-1 text-[11px] text-[#5d6e80]">toplam</span>
      </Link>
    )
  }

  return (
    <div className="flex items-center gap-1.5">
      <input
        type="number"
        min={0}
        inputMode="numeric"
        value={value}
        onChange={(e) => setValue(e.target.value)}
        onKeyDown={(e) => {
          if (e.key === 'Enter') (e.target as HTMLInputElement).blur()
          if (e.key === 'Escape') setValue(String(row.stock))
        }}
        onBlur={save}
        disabled={saving}
        aria-label={`${row.name} stok`}
        className={cn(
          'w-20 h-8 rounded-md border px-2 text-sm tabular-nums text-right focus:outline-none focus:ring-2 focus:ring-[#0b2540]/10',
          dirty ? 'border-[#f5b400] bg-[#fffbeb]' : 'border-[#d3d9e1]',
          row.stock === 0 ? 'text-red-700' : row.stock <= LOW ? 'text-amber-700' : 'text-[#121926]'
        )}
      />
      {saving && <span className="text-xs text-[#5d6e80]">…</span>}
    </div>
  )
}

function ProductsContent() {
  const router = useRouter()
  const pathname = usePathname()
  const sp = useSearchParams()
  const toast = useToast()

  const rawStock = sp.get('stock')
  const tab: StockTab = rawStock === 'outofstock' ? 'out' : (['in', 'low', 'out', 'featured', 'novoltage'].includes(rawStock ?? '') ? rawStock : 'all') as StockTab
  const q = sp.get('q') || ''
  const brand = sp.get('brand') || ''
  const category = sp.get('category') || ''
  const page = Math.max(1, Number(sp.get('page')) || 1)

  const [products, setProducts] = useState<CatalogRow[] | null>(null)
  const [error, setError] = useState<string | null>(null)
  const [search, setSearch] = useState(q)
  const [selected, setSelected] = useState<Set<string>>(new Set())
  const [bulk, setBulk] = useState<null | 'stock' | 'discount'>(null)
  const [bulkValue, setBulkValue] = useState('')
  const [bulkBusy, setBulkBusy] = useState(false)
  // Toplu stok (A16): eşitle / ekle / çıkar; kaydetmeden önce ürün bazında önizleme
  const [stockMode, setStockMode] = useState<BulkStockMode>('add')

  const setParams = useCallback(
    (patch: Record<string, string | number | null>) => {
      const next = new URLSearchParams(sp.toString())
      for (const [k, v] of Object.entries(patch)) {
        if (v === null || v === '' || (k === 'stock' && v === 'all')) next.delete(k)
        else next.set(k, String(v))
      }
      if (!('page' in patch)) next.delete('page')
      const qs = next.toString()
      router.replace(qs ? `${pathname}?${qs}` : pathname, { scroll: false })
    },
    [sp, router, pathname]
  )

  const load = useCallback(async () => {
    try {
      const res = await fetch('/api/admin/catalog', { credentials: 'include', cache: 'no-store' })
      const json = await res.json().catch(() => null)
      if (!res.ok || !Array.isArray(json)) throw new Error(json?.error || 'Ürünler alınamadı')
      setProducts(json)
      setError(null)
    } catch (e) {
      setError(e instanceof Error ? e.message : 'Ürünler alınamadı')
      setProducts((p) => p ?? [])
    }
  }, [])

  useEffect(() => {
    load()
  }, [load])
  useEffect(() => setSearch(q), [q])
  useEffect(() => {
    const t = setTimeout(() => {
      if (search.trim() !== q) setParams({ q: search.trim() || null })
    }, 300)
    return () => clearTimeout(t)
  }, [search, q, setParams])

  const all = useMemo(() => products ?? [], [products])
  const brands = useMemo(() => [...new Set(all.map((p) => p.brand).filter(Boolean) as string[])].sort((a, b) => a.localeCompare(b, 'tr')), [all])
  const categories = useMemo(() => [...new Set(all.map((p) => p.category).filter(Boolean) as string[])].sort((a, b) => a.localeCompare(b, 'tr')), [all])

  // Arama: ad, SKU, marka, varyant adı ve varyant SKU'su (lib/admin-product-search); eşleşen varyant satırda gösterilir
  const { base, matchedVariant } = useMemo(() => {
    const matchedVariant = new Map<string, { label: string; sku?: string }>()
    const base = all.filter((p) => {
      if (brand && p.brand !== brand) return false
      if (category && p.category !== category) return false
      if (!q.trim()) return true
      const m = matchProduct(p, q)
      if (m?.variant) matchedVariant.set(p.id, m.variant)
      return !!m
    })
    return { base, matchedVariant }
  }, [all, q, brand, category])

  const counts = {
    all: base.length,
    in: base.filter((p) => p.stock > LOW).length,
    low: base.filter((p) => p.stock > 0 && p.stock <= LOW).length,
    out: base.filter((p) => p.stock <= 0).length,
    featured: base.filter((p) => p.featured).length,
    novoltage: base.filter(voltageUnknown).length,
  }
  const filtered = base.filter((p) =>
    tab === 'in' ? p.stock > LOW : tab === 'low' ? p.stock > 0 && p.stock <= LOW : tab === 'out' ? p.stock <= 0 : tab === 'featured' ? p.featured : tab === 'novoltage' ? voltageUnknown(p) : true
  )
  const pageRows = filtered.slice((page - 1) * PAGE_SIZE, page * PAGE_SIZE)
  const allOnPageSelected = pageRows.length > 0 && pageRows.every((p) => selected.has(p.id))

  const toggle = (id: string) =>
    setSelected((prev) => {
      const next = new Set(prev)
      if (next.has(id)) next.delete(id)
      else next.add(id)
      return next
    })

  const patchLocal = (id: string, patch: Partial<CatalogRow>) => setProducts((prev) => (prev ?? []).map((p) => (p.id === id ? { ...p, ...patch } : p)))

  const toggleFeatured = async (p: CatalogRow) => {
    patchLocal(p.id, { featured: !p.featured })
    try {
      const res = await fetch(`/api/admin/catalog/${encodeURIComponent(p.id)}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ featured: !p.featured }),
        credentials: 'include',
      })
      if (!res.ok) throw new Error()
    } catch {
      patchLocal(p.id, { featured: p.featured })
      toast.error('Öne çıkarma güncellenemedi', p.name)
    }
  }

  const stockPlan = useMemo(
    () => planBulkStock(all.filter((p) => selected.has(p.id)), stockMode, Number(bulkValue) || 0),
    [all, selected, stockMode, bulkValue]
  )

  const runBulk = async (action: 'feature' | 'unfeature' | 'set_stock' | 'adjust_stock' | 'apply_discount', value?: number) => {
    setBulkBusy(true)
    try {
      const res = await fetch('/api/admin/catalog/bulk', {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ ids: [...selected], action, value }),
        credentials: 'include',
      })
      const json = await res.json().catch(() => null)
      if (!res.ok) throw new Error(json?.error || 'Toplu işlem başarısız')
      toast.success(
        action === 'apply_discount' ? 'İndirim kampanyası oluşturuldu' : 'Toplu işlem tamamlandı',
        action === 'apply_discount'
          ? `${json.affected} ürün · İndirimler sayfasından yönetebilirsiniz`
          : `${json.affected} ürün güncellendi${json.skippedVariantStock?.length ? ` · ayrı varyant stoklu ${json.skippedVariantStock.length} ürün atlandı` : ''}`
      )
      setBulk(null)
      setBulkValue('')
      setSelected(new Set())
      await load()
    } catch (e) {
      toast.error('Toplu işlem başarısız', e instanceof Error ? e.message : undefined)
    } finally {
      setBulkBusy(false)
    }
  }

  return (
    <div className="space-y-5">
      <PageHeader
        title="Ürünler & Stok"
        description={products ? `${all.length} ürün · stok, fiyat, varyant ve görselleri buradan yönetin` : 'Yükleniyor…'}
        actions={
          <>
            <Btn variant="outline" onClick={load}>
              <RefreshCw />
              Yenile
            </Btn>
            <StockPriceTransfer onApplied={load} />
            <BtnLink href="/admin/products/duzenle?yeni=1" variant="primary">
              <Plus />
              Yeni Ürün
            </BtnLink>
          </>
        }
      />

      <Panel className="overflow-hidden">
        <div className="px-2 sm:px-3 border-b border-[#e6ebf1]">
          <TabStrip<StockTab>
            tabs={[
              { value: 'all', label: 'Tümü', count: counts.all },
              { value: 'in', label: 'Stokta', count: counts.in },
              { value: 'low', label: `Düşük stok (≤${LOW})`, count: counts.low, tone: 'yellow' },
              { value: 'out', label: 'Tükendi', count: counts.out, tone: 'yellow' },
              { value: 'featured', label: 'Öne çıkan', count: counts.featured },
              { value: 'novoltage', label: 'Voltajı tanımsız', count: counts.novoltage, tone: 'yellow' },
            ]}
            value={tab}
            onChange={(v) => setParams({ stock: v })}
          />
        </div>
        <div className="p-3 sm:p-4 grid gap-2 sm:grid-cols-[1fr_auto_auto] border-b border-[#e6ebf1] bg-[#fafbfd]">
          <SearchInput value={search} onChange={setSearch} placeholder="Ürün adı, SKU, marka veya varyant" />
          <SelectInput value={brand} onChange={(e) => setParams({ brand: e.target.value })} className="sm:w-44" aria-label="Marka">
            <option value="">Tüm markalar</option>
            {brands.map((b) => (
              <option key={b} value={b}>{b}</option>
            ))}
          </SelectInput>
          <SelectInput value={category} onChange={(e) => setParams({ category: e.target.value })} className="sm:w-56" aria-label="Kategori">
            <option value="">Tüm kategoriler</option>
            {categories.map((c) => (
              <option key={c} value={c}>{c}</option>
            ))}
          </SelectInput>
        </div>

        {selected.size > 0 && (
          <div className="flex flex-wrap items-center gap-2 px-4 py-2.5 bg-[#eef3f9] border-y border-[#d6e2ef] text-[#0b2540] text-[13px]">
            <span className="font-semibold mr-1">{selected.size} ürün seçildi</span>
            <Btn size="xs" variant="accent" onClick={() => runBulk('feature')} disabled={bulkBusy}>
              <Star />
              Öne çıkar
            </Btn>
            <Btn size="xs" variant="outline" onClick={() => runBulk('unfeature')} disabled={bulkBusy}>
              Öne çıkarmayı kaldır
            </Btn>
            <Btn size="xs" variant="outline" onClick={() => setBulk('stock')} disabled={bulkBusy}>
              <Layers />
              Stok işlemi
            </Btn>
            <Btn size="xs" variant="outline" onClick={() => setBulk('discount')} disabled={bulkBusy}>
              <Percent />
              İndirim kampanyası
            </Btn>
            <button type="button" onClick={() => setSelected(new Set())} className="ml-auto inline-flex items-center gap-1 text-[#3b4a5a] hover:text-[#121926]">
              <X className="w-4 h-4" />
              Seçimi temizle
            </button>
          </div>
        )}

        {error && (
          <div role="alert" className="m-4 rounded-lg border border-red-200 bg-red-50 text-red-800 text-sm px-4 py-3">
            {error}
          </div>
        )}

        {products === null ? (
          <Spinner />
        ) : filtered.length === 0 ? (
          <EmptyState icon={Package} title="Kritere uyan ürün yok" />
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left text-[13px] min-w-[600px]">
              <thead>
                <tr className="text-[11px] uppercase tracking-wider text-[#5d6e80] border-b border-[#e6ebf1]">
                  <th className="pl-4 pr-1 py-2.5 w-8">
                    <input
                      type="checkbox"
                      aria-label="Sayfadakilerin tümünü seç"
                      checked={allOnPageSelected}
                      onChange={() =>
                        setSelected((prev) => {
                          const next = new Set(prev)
                          for (const p of pageRows) {
                            if (allOnPageSelected) next.delete(p.id)
                            else next.add(p.id)
                          }
                          return next
                        })
                      }
                      className="w-4 h-4 accent-[#0b2540]"
                    />
                  </th>
                  <th className="font-semibold px-3 py-2.5">Ürün</th>
                  <th className="font-semibold px-3 py-2.5 hidden xl:table-cell">Kategori</th>
                  <th className="font-semibold px-3 py-2.5 text-right whitespace-nowrap">Fiyat (KDV hariç)</th>
                  <th className="font-semibold px-3 py-2.5">Stok</th>
                  <th className="font-semibold px-3 py-2.5 text-center hidden lg:table-cell">Öne çıkan</th>
                  <th className="px-4 py-2.5" />
                </tr>
              </thead>
              <tbody className="divide-y divide-[#eef2f6]">
                {pageRows.map((p) => {
                  const img = p.image || p.images?.[0]
                  return (
                    <tr key={p.id} className={cn('hover:bg-[#fafbfd]', selected.has(p.id) && 'bg-[#f5f8fc]')}>
                      <td className="pl-4 pr-1 py-2.5">
                        <input type="checkbox" checked={selected.has(p.id)} onChange={() => toggle(p.id)} aria-label={`${p.name} seç`} className="w-4 h-4 accent-[#0b2540]" />
                      </td>
                      <td className="px-3 py-2.5 max-w-[240px] lg:max-w-[460px]">
                        <div className="flex items-center gap-3 min-w-0">
                          <div className="w-11 h-11 rounded-lg border border-[#e6ebf1] bg-white overflow-hidden flex items-center justify-center shrink-0">
                            {img ? (
                              // eslint-disable-next-line @next/next/no-img-element
                              <img src={img} alt="" className="w-full h-full object-contain" loading="lazy" />
                            ) : (
                              <ImageOff className="w-4 h-4 text-[#b9c3cf]" />
                            )}
                          </div>
                          <div className="min-w-0">
                            <Link href={`/admin/products/duzenle?id=${encodeURIComponent(p.id)}`} className="font-medium text-[#121926] hover:underline line-clamp-2">
                              {p.name}
                            </Link>
                            <p className="text-xs text-[#5d6e80] truncate">
                              {[p.brand, p.sku].filter(Boolean).join(' · ')}
                              {p.variants?.length ? ` · ${p.variants.length} varyant` : ''}
                              {p.status === 'draft' && ' · Taslak (sitede görünmüyor)'}
                              {p.salesClosed && ' · Satışa kapalı'}
                              {voltageUnknown(p) && ' · Voltajı tanımsız'}
                            </p>
                            {matchedVariant.has(p.id) && (
                              <p className="text-xs text-[#7a5a00] truncate">
                                Eşleşen varyant: {matchedVariant.get(p.id)!.label}
                                {matchedVariant.get(p.id)!.sku ? ` · ${matchedVariant.get(p.id)!.sku}` : ''}
                              </p>
                            )}
                          </div>
                        </div>
                      </td>
                      <td className="px-3 py-2.5 text-[#20384e] hidden xl:table-cell max-w-[200px] truncate">{p.category}</td>
                      <td className="px-3 py-2.5 text-right tabular-nums font-medium text-[#121926] whitespace-nowrap">{priceLabel(p)}</td>
                      <td className="px-3 py-2.5">
                        <div className="flex items-center gap-2">
                          <StockCell row={p} onSaved={(id, stock) => patchLocal(id, { stock })} />
                          <span className="hidden xl:inline-flex">{p.stock <= 0 ? <Pill tone="red">Tükendi</Pill> : p.stock <= LOW ? <Pill tone="amber">Az</Pill> : null}</span>
                        </div>
                      </td>
                      <td className="px-3 py-2.5 text-center hidden lg:table-cell">
                        <button
                          type="button"
                          onClick={() => toggleFeatured(p)}
                          aria-pressed={p.featured}
                          aria-label={p.featured ? 'Öne çıkarmayı kaldır' : 'Öne çıkar'}
                          className="w-8 h-8 rounded-lg inline-flex items-center justify-center hover:bg-[#f1f4f8]"
                        >
                          <Star className={cn('w-4 h-4', p.featured ? 'fill-[#f5b400] text-[#f5b400]' : 'text-[#b9c3cf]')} />
                        </button>
                      </td>
                      <td className="px-4 py-2.5">
                        <div className="flex justify-end gap-1">
                          <a href={`/products/${p.id}`} target="_blank" rel="noopener noreferrer" className="w-8 h-8 rounded-lg hidden lg:inline-flex items-center justify-center text-[#5d6e80] hover:bg-[#f1f4f8]" title="Sitede gör">
                            <ExternalLink className="w-4 h-4" />
                          </a>
                          <BtnLink href={`/admin/products/duzenle?id=${encodeURIComponent(p.id)}`} size="xs" variant="outline">
                            <Pencil />
                            <span className="hidden 2xl:inline">Düzenle</span>
                          </BtnLink>
                        </div>
                      </td>
                    </tr>
                  )
                })}
              </tbody>
            </table>
          </div>
        )}
        <Pagination page={page} pageSize={PAGE_SIZE} total={filtered.length} onPage={(p) => setParams({ page: p })} />
      </Panel>

      <Modal
        open={bulk === 'stock'}
        onClose={() => setBulk(null)}
        title="Toplu stok işlemi"
        description={`${selected.size} seçili ürün · kaydetmeden önce sonucu aşağıda görün`}
        footer={
          <>
            <Btn variant="outline" onClick={() => setBulk(null)}>Vazgeç</Btn>
            <Btn
              variant="primary"
              loading={bulkBusy}
              disabled={bulkValue === '' || !(Number(bulkValue) >= 0) || stockPlan.changed === 0}
              onClick={() => {
                const n = Math.floor(Number(bulkValue))
                if (stockMode === 'set') runBulk('set_stock', n)
                else runBulk('adjust_stock', stockMode === 'add' ? n : -n)
              }}
            >
              {BULK_STOCK_MODE_TR[stockMode]} ({stockPlan.changed} ürün)
            </Btn>
          </>
        }
      >
        <div className="space-y-4">
          <div className="grid grid-cols-3 gap-2" role="radiogroup" aria-label="İşlem">
            {(['add', 'subtract', 'set'] as const).map((m) => (
              <button
                key={m}
                type="button"
                role="radio"
                aria-checked={stockMode === m}
                onClick={() => setStockMode(m)}
                className={cn('rounded-lg border px-3 py-2 text-[13px] font-medium', stockMode === m ? 'border-[#0b2540] bg-[#f5f7fa] ring-1 ring-[#0b2540] text-[#121926]' : 'border-[#d3d9e1] text-[#20384e] hover:border-[#8a99a8]')}
              >
                {BULK_STOCK_MODE_TR[m]}
              </button>
            ))}
          </div>
          <Field
            label={stockMode === 'set' ? 'Yeni stok (her ürün bu adede eşitlenir)' : stockMode === 'add' ? 'Eklenecek adet (mevcut stoğun üstüne)' : 'Çıkarılacak adet (0\'ın altına inmez)'}
            htmlFor="bulk-stock"
          >
            <TextInput id="bulk-stock" type="number" min={0} value={bulkValue} onChange={(e) => setBulkValue(e.target.value)} autoFocus />
          </Field>
          {bulkValue !== '' && (
            <div className="max-h-64 overflow-auto rounded-lg border border-[#e6ebf1]">
              <table className="w-full text-[12px]">
                <thead className="bg-[#f5f7fa] text-left text-[#5d6e80] sticky top-0">
                  <tr>
                    <th className="px-3 py-1.5 font-semibold">Ürün</th>
                    <th className="px-3 py-1.5 font-semibold text-right">Mevcut</th>
                    <th className="px-3 py-1.5 font-semibold text-right">Yeni</th>
                    <th className="px-3 py-1.5 font-semibold text-right">Fark</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-[#eef1f5]">
                  {stockPlan.rows.map((r) => (
                    <tr key={r.id} className={r.skipped ? 'text-[#9aa8b6]' : undefined}>
                      <td className="px-3 py-1.5 max-w-[220px] truncate" title={r.name}>{r.name}</td>
                      <td className="px-3 py-1.5 text-right tabular-nums">{r.current}</td>
                      <td className="px-3 py-1.5 text-right tabular-nums">{r.skipped ? 'atlanır' : r.next}</td>
                      <td className={cn('px-3 py-1.5 text-right tabular-nums', r.diff > 0 ? 'text-green-700' : r.diff < 0 ? 'text-red-700' : '')}>
                        {r.skipped ? 'varyant stoklu' : r.diff > 0 ? `+${r.diff}` : r.diff}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
          {stockPlan.skipped > 0 && <p className="text-xs text-[#5d6e80]">{stockPlan.skipped} ürünün varyantları ayrı stoklanıyor; stokları ürün düzenleyicisinden girilir.</p>}
        </div>
      </Modal>

      <Modal
        open={bulk === 'discount'}
        onClose={() => setBulk(null)}
        title="İndirim kampanyası"
        description="Fiyatlar değişmez; seçili ürünler için geri alınabilir bir kampanya oluşturulur (İndirimler & Kuponlar)."
        size="sm"
        footer={
          <>
            <Btn variant="outline" onClick={() => setBulk(null)}>Vazgeç</Btn>
            <Btn
              variant="accent"
              loading={bulkBusy}
              disabled={!(Number(bulkValue) > 0 && Number(bulkValue) < 100)}
              onClick={() => runBulk('apply_discount', Number(bulkValue))}
            >
              Kampanyayı Oluştur
            </Btn>
          </>
        }
      >
        <Field label="İndirim oranı (%)" htmlFor="bulk-discount" hint="1–99 arası">
          <TextInput id="bulk-discount" type="number" min={1} max={99} value={bulkValue} onChange={(e) => setBulkValue(e.target.value)} autoFocus />
        </Field>
      </Modal>
    </div>
  )
}

export default function AdminProductsPage() {
  return (
    <Suspense fallback={<Spinner />}>
      <ProductsContent />
    </Suspense>
  )
}
