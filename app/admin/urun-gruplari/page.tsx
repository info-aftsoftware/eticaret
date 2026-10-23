'use client'

/**
 * Ürün grupları: tek tek ürün + marka + kategori seçimiyle grup tanımı (üyelik dinamik), gruba indirim,
 * satışa kapat/aç, toplu fiyat değişikliği (önizlemeli) ve silme (etki özetiyle).
 */

import React, { useCallback, useEffect, useMemo, useState } from 'react'
import { Btn, EmptyState, Field, Modal, PageHeader, Panel, Pill, SearchInput, Spinner, TextInput, SelectInput, Checkbox } from '@/components/admin/ui'
import { useToast } from '@/components/admin/toast'
import { fmtTRY } from '@/lib/format'
import { matchProduct } from '@/lib/admin-product-search'
import { groupMembers, PRICE_CHANGE_MAX, PRICE_CHANGE_MIN, type PriceChangeRow } from '@/lib/product-groups'
import { discountValueError, PERCENT_MAX } from '@/lib/campaign-rules'
import { cn } from '@/lib/utils'

type Group = {
  id: string
  name: string
  productIds: string[]
  brands: string[]
  categories: string[]
  salesActive: boolean
  memberCount: number
  panelProductCount: number
  discountCount: number
}
type CatalogRow = { id: string; name: string; sku?: string; brand?: string | null; category: string; variants?: { key: string; label: string; sku?: string }[] }
type Impact = { panelProducts: { id: string; name: string }[]; catalogProducts: number; discounts: string[] }

const EMPTY = { name: '', productIds: [] as string[], brands: [] as string[], categories: [] as string[] }

function Chips({ options, selected, onToggle }: { options: string[]; selected: string[]; onToggle: (v: string) => void }) {
  return (
    <div className="flex flex-wrap gap-1.5 max-h-36 overflow-auto">
      {options.map((o) => {
        const on = selected.includes(o)
        return (
          <button
            key={o}
            type="button"
            aria-pressed={on}
            onClick={() => onToggle(o)}
            className={cn('rounded-full border px-2.5 py-1 text-xs', on ? 'border-[#0b2540] bg-[#0b2540] text-white' : 'border-[#d3d9e1] text-[#20384e] hover:border-[#8a99a8]')}
          >
            {o}
          </button>
        )
      })}
    </div>
  )
}

export default function ProductGroupsPage() {
  const toast = useToast()
  const [groups, setGroups] = useState<Group[] | null>(null)
  const [brands, setBrands] = useState<string[]>([])
  const [categories, setCategories] = useState<string[]>([])
  const [catalog, setCatalog] = useState<CatalogRow[]>([])
  const [busy, setBusy] = useState<string | null>(null)

  // Düzenleme
  const [editing, setEditing] = useState<string | 'new' | null>(null)
  const [form, setForm] = useState(EMPTY)
  const [productQuery, setProductQuery] = useState('')
  const [formError, setFormError] = useState('')

  // İndirim, zam, silme pencereleri
  const [discountFor, setDiscountFor] = useState<Group | null>(null)
  const [discount, setDiscount] = useState({ name: '', type: 'PERCENT' as 'PERCENT' | 'FIXED', value: '10' })
  const [priceFor, setPriceFor] = useState<Group | null>(null)
  const [percent, setPercent] = useState('10')
  const [preview, setPreview] = useState<{ rows: PriceChangeRow[]; changed: number; skipped: number } | null>(null)
  const [deleteFor, setDeleteFor] = useState<Group | null>(null)
  const [impact, setImpact] = useState<Impact | null>(null)

  const load = useCallback(async () => {
    const [g, c] = await Promise.all([
      fetch('/api/admin/product-groups', { credentials: 'include' }).then((r) => r.json()),
      fetch('/api/admin/catalog', { credentials: 'include' }).then((r) => r.json()),
    ])
    setGroups(g.groups ?? [])
    setBrands(g.brands ?? [])
    setCategories(g.categories ?? [])
    setCatalog(Array.isArray(c) ? c : [])
  }, [])

  useEffect(() => {
    load().catch(() => setGroups([]))
  }, [load])

  const call = async (key: string, url: string, init: RequestInit, success: string) => {
    setBusy(key)
    try {
      const res = await fetch(url, { credentials: 'include', headers: { 'Content-Type': 'application/json' }, ...init })
      const json = await res.json().catch(() => null)
      if (!res.ok) throw new Error(json?.error || 'İşlem başarısız')
      toast.success(success)
      await load()
      return json
    } catch (e) {
      toast.error('İşlem başarısız', e instanceof Error ? e.message : undefined)
      return null
    } finally {
      setBusy(null)
    }
  }

  // ── Düzenleme ──
  const openEdit = (g?: Group) => {
    setForm(g ? { name: g.name, productIds: g.productIds, brands: g.brands, categories: g.categories } : EMPTY)
    setEditing(g ? g.id : 'new')
    setProductQuery('')
    setFormError('')
  }
  const toggle = (k: 'productIds' | 'brands' | 'categories', v: string) =>
    setForm((p) => ({ ...p, [k]: p[k].includes(v) ? p[k].filter((x) => x !== v) : [...p[k], v] }))
  const memberPreview = useMemo(() => groupMembers(form, catalog), [form, catalog])
  const productHits = useMemo(() => {
    const q = productQuery.trim()
    if (!q) return catalog.filter((p) => form.productIds.includes(p.id)).slice(0, 60)
    return catalog.filter((p) => matchProduct(p, q)).slice(0, 60)
  }, [catalog, productQuery, form.productIds])
  const saveGroup = async () => {
    if (!form.name.trim()) return setFormError('Grup adı gerekli.')
    if (!form.productIds.length && !form.brands.length && !form.categories.length) return setFormError('En az bir ürün, marka veya kategori seçin.')
    const ok = await call('save', editing === 'new' ? '/api/admin/product-groups' : `/api/admin/product-groups/${editing}`, { method: editing === 'new' ? 'POST' : 'PATCH', body: JSON.stringify(form) }, editing === 'new' ? 'Grup oluşturuldu' : 'Grup güncellendi')
    if (ok) setEditing(null)
  }

  // ── İndirim ──
  const openDiscount = (g: Group) => {
    setDiscount({ name: `${g.name} indirimi`, type: 'PERCENT', value: '10' })
    setDiscountFor(g)
  }
  const saveDiscount = async () => {
    const err = discountValueError(discount.type, discount.value)
    if (err) return toast.error('Kaydedilemedi', err)
    const ok = await call('discount', '/api/admin/discounts', { method: 'POST', body: JSON.stringify({ name: discount.name.trim() || `${discountFor!.name} indirimi`, scope: 'GROUP', groupId: discountFor!.id, type: discount.type, value: Number(discount.value), active: true }) }, 'İndirim tanımlandı · İndirimler sayfasından tarih ekleyip yönetebilirsiniz')
    if (ok) setDiscountFor(null)
  }

  // ── Toplu zam ──
  const openPrice = (g: Group) => {
    setPriceFor(g)
    setPercent('10')
    setPreview(null)
  }
  const runPreview = async () => {
    setBusy('preview')
    try {
      const res = await fetch(`/api/admin/product-groups/${priceFor!.id}/price`, { method: 'POST', credentials: 'include', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ percent: Number(percent) }) })
      const json = await res.json()
      if (!res.ok) throw new Error(json.error)
      setPreview(json)
    } catch (e) {
      toast.error('Önizleme alınamadı', e instanceof Error ? e.message : undefined)
    } finally {
      setBusy(null)
    }
  }
  const applyPrice = async () => {
    if (!window.confirm(`${preview!.changed} ürünün fiyatı %${Number(percent) > 0 ? '+' : ''}${percent} değişecek. Bu işlem fiyatları kalıcı olarak değiştirir. Uygulansın mı?`)) return
    const ok = await call('price', `/api/admin/product-groups/${priceFor!.id}/price`, { method: 'POST', body: JSON.stringify({ percent: Number(percent), apply: true }) }, 'Fiyatlar güncellendi')
    if (ok) setPriceFor(null)
  }

  // ── Silme ──
  const openDelete = async (g: Group) => {
    setDeleteFor(g)
    setImpact(null)
    const res = await fetch(`/api/admin/product-groups/${g.id}`, { credentials: 'include' })
    const json = await res.json().catch(() => null)
    setImpact(json?.impact ?? null)
  }
  const confirmDelete = async () => {
    const ok = await call('delete', `/api/admin/product-groups/${deleteFor!.id}?confirm=1`, { method: 'DELETE' }, 'Grup silindi')
    if (ok) setDeleteFor(null)
  }

  const fmtPrice = (n: number, currency: string) => (currency === 'TL' ? fmtTRY(n) : `${n.toLocaleString('tr-TR', { maximumFractionDigits: 2 })} ${currency}`)

  return (
    <div className="space-y-5">
      <PageHeader
        title="Ürün Grupları"
        description="Tek tek ürün, marka ve kategori seçerek grup oluşturun; gruba indirim tanımlayın, satışa kapatın, toplu fiyat değişikliği uygulayın. Seçilen marka veya kategoriye sonradan eklenen ürünler de gruba girer."
        actions={<Btn variant="accent" onClick={() => openEdit()}>Yeni grup</Btn>}
      />

      <Panel className="overflow-x-auto">
        {!groups ? (
          <div className="py-10 flex justify-center"><Spinner /></div>
        ) : groups.length === 0 ? (
          <EmptyState title="Henüz ürün grubu yok" description="“Yeni grup” ile ürün, marka veya kategori seçerek başlayın." />
        ) : (
          <table className="w-full text-sm min-w-[860px]">
            <thead className="bg-[#f5f7fa] text-left text-[12px] text-[#5d6e80]">
              <tr>
                <th className="px-4 py-2.5 font-semibold">Grup</th>
                <th className="px-4 py-2.5 font-semibold">Kapsam</th>
                <th className="px-4 py-2.5 font-semibold text-right">Ürün</th>
                <th className="px-4 py-2.5 font-semibold">Durum</th>
                <th className="px-4 py-2.5 font-semibold text-right">İşlemler</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-[#eef1f5]">
              {groups.map((g) => (
                <tr key={g.id} className="align-top">
                  <td className="px-4 py-3 font-medium text-[#121926]">
                    {g.name}
                    {g.discountCount > 0 && <span className="block text-xs font-normal text-[#5d6e80]">{g.discountCount} indirim</span>}
                  </td>
                  <td className="px-4 py-3 text-[12px] text-[#5d6e80] max-w-[320px]">
                    {[
                      g.productIds.length ? `${g.productIds.length} seçili ürün` : null,
                      g.brands.length ? `Marka: ${g.brands.join(', ')}` : null,
                      g.categories.length ? `Kategori: ${g.categories.join(', ')}` : null,
                    ]
                      .filter(Boolean)
                      .join(' · ')}
                  </td>
                  <td className="px-4 py-3 text-right tabular-nums">{g.memberCount}</td>
                  <td className="px-4 py-3">{g.salesActive ? <Pill tone="green" dot>Satışta</Pill> : <Pill tone="red" dot>Satışa kapalı</Pill>}</td>
                  <td className="px-4 py-3">
                    <div className="flex flex-wrap justify-end gap-1.5">
                      <Btn size="xs" variant="outline" onClick={() => openEdit(g)}>Düzenle</Btn>
                      <Btn size="xs" variant="outline" onClick={() => openDiscount(g)}>İndirim tanımla</Btn>
                      <Btn size="xs" variant="outline" onClick={() => openPrice(g)}>Toplu zam</Btn>
                      <Btn
                        size="xs"
                        variant="outline"
                        loading={busy === `sales-${g.id}`}
                        onClick={() => {
                          if (g.salesActive && !window.confirm(`“${g.name}” grubundaki ${g.memberCount} ürün satışa kapatılsın mı? Ürünler sitede görünür ama satın alınamaz.`)) return
                          void call(`sales-${g.id}`, `/api/admin/product-groups/${g.id}`, { method: 'PATCH', body: JSON.stringify({ salesActive: !g.salesActive }) }, g.salesActive ? 'Grup satışa kapatıldı' : 'Grup satışa açıldı')
                        }}
                      >
                        {g.salesActive ? 'Satışa kapat' : 'Satışa aç'}
                      </Btn>
                      <Btn size="xs" variant="danger" onClick={() => void openDelete(g)}>Sil</Btn>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        )}
      </Panel>

      {/* Grup oluştur / düzenle */}
      <Modal
        open={editing !== null}
        onClose={() => setEditing(null)}
        title={editing === 'new' ? 'Yeni ürün grubu' : 'Ürün grubunu düzenle'}
        description={`Şu an ${memberPreview.length} ürün kapsanıyor.`}
        size="lg"
        footer={
          <>
            <Btn variant="outline" onClick={() => setEditing(null)}>Vazgeç</Btn>
            <Btn variant="accent" loading={busy === 'save'} onClick={() => void saveGroup()}>Kaydet</Btn>
          </>
        }
      >
        <div className="space-y-4">
          <Field label="Grup adı" htmlFor="g-name">
            <TextInput id="g-name" value={form.name} maxLength={120} onChange={(e) => setForm((p) => ({ ...p, name: e.target.value }))} placeholder="Örn. TommaTech paneller" />
          </Field>
          <Field label={`Markalar (${form.brands.length} seçili)`} htmlFor="g-brands" hint="Seçilen markanın bütün ürünleri gruba girer.">
            <Chips options={brands} selected={form.brands} onToggle={(v) => toggle('brands', v)} />
          </Field>
          <Field label={`Kategoriler (${form.categories.length} seçili)`} htmlFor="g-cats" hint="Seçilen kategorinin bütün ürünleri gruba girer.">
            <Chips options={categories} selected={form.categories} onToggle={(v) => toggle('categories', v)} />
          </Field>
          <Field label={`Tek tek ürünler (${form.productIds.length} seçili)`} htmlFor="g-prod">
            <SearchInput value={productQuery} onChange={setProductQuery} placeholder="Ürün adı, SKU, marka veya varyant ara" />
            <ul className="mt-2 max-h-56 overflow-auto rounded-lg border border-[#e6ebf1] divide-y divide-[#eef1f5]">
              {productHits.length === 0 && <li className="px-3 py-2 text-xs text-[#5d6e80]">{productQuery ? 'Eşleşen ürün yok.' : 'Seçili ürün yok; aramayla ekleyin.'}</li>}
              {productHits.map((p) => (
                <li key={p.id} className="px-3 py-1.5">
                  <Checkbox checked={form.productIds.includes(p.id)} onChange={() => toggle('productIds', p.id)} label={<span className="text-[13px]">{p.name} <span className="text-[#9aa8b6]">· {p.brand ?? '—'}</span></span>} />
                </li>
              ))}
            </ul>
          </Field>
          {formError && <p role="alert" className="text-sm text-red-700">{formError}</p>}
        </div>
      </Modal>

      {/* İndirim tanımla */}
      <Modal
        open={!!discountFor}
        onClose={() => setDiscountFor(null)}
        title="Gruba indirim tanımla"
        description={discountFor ? `“${discountFor.name}” grubundaki ${discountFor.memberCount} ürüne uygulanır; gruba sonradan giren ürünler de alır.` : undefined}
        size="sm"
        footer={
          <>
            <Btn variant="outline" onClick={() => setDiscountFor(null)}>Vazgeç</Btn>
            <Btn variant="accent" loading={busy === 'discount'} onClick={() => void saveDiscount()}>İndirimi başlat</Btn>
          </>
        }
      >
        <div className="space-y-3">
          <Field label="Kampanya adı" htmlFor="d-name">
            <TextInput id="d-name" value={discount.name} onChange={(e) => setDiscount((p) => ({ ...p, name: e.target.value }))} />
          </Field>
          <div className="grid grid-cols-2 gap-3">
            <Field label="Tür" htmlFor="d-type">
              <SelectInput id="d-type" value={discount.type} onChange={(e) => setDiscount((p) => ({ ...p, type: e.target.value as 'PERCENT' | 'FIXED' }))}>
                <option value="PERCENT">Yüzde</option>
                <option value="FIXED">Sabit (TL)</option>
              </SelectInput>
            </Field>
            <Field label={discount.type === 'PERCENT' ? `Yüzde (en fazla %${PERCENT_MAX})` : 'Tutar (TL, KDV hariç)'} htmlFor="d-value">
              <TextInput id="d-value" type="number" min={0.01} max={discount.type === 'PERCENT' ? PERCENT_MAX : undefined} value={discount.value} onChange={(e) => setDiscount((p) => ({ ...p, value: e.target.value }))} />
            </Field>
          </div>
          <p className="text-xs text-[#5d6e80]">Kampanya hemen başlar ve süresizdir; başlangıç/bitiş tarihini İndirimler sayfasından ekleyebilirsiniz. Bir ürüne birden fazla kampanya uyarsa müşteri için en avantajlısı uygulanır.</p>
        </div>
      </Modal>

      {/* Toplu zam */}
      <Modal
        open={!!priceFor}
        onClose={() => setPriceFor(null)}
        title="Toplu fiyat değişikliği"
        description={priceFor ? `“${priceFor.name}” grubundaki ürünlerin fiyatı kalıcı olarak değişir. Dövize bağlı ürünlerde döviz fiyatı, sabit TL ürünlerde TL fiyatı değişir; varyant fiyatları birlikte.` : undefined}
        size="lg"
        footer={
          <>
            <Btn variant="outline" onClick={() => setPriceFor(null)}>Vazgeç</Btn>
            <Btn variant="outline" loading={busy === 'preview'} onClick={() => void runPreview()}>Önizle</Btn>
            <Btn variant="accent" loading={busy === 'price'} disabled={!preview || preview.changed === 0} onClick={() => void applyPrice()}>
              Uygula{preview ? ` (${preview.changed} ürün)` : ''}
            </Btn>
          </>
        }
      >
        <div className="space-y-3">
          <Field label={`Değişim (%, ${PRICE_CHANGE_MIN} ile ${PRICE_CHANGE_MAX} arası; zam için pozitif)`} htmlFor="p-pct">
            <TextInput
              id="p-pct"
              type="number"
              value={percent}
              onChange={(e) => {
                setPercent(e.target.value)
                setPreview(null)
              }}
            />
          </Field>
          {preview && (
            <div className="max-h-80 overflow-auto rounded-lg border border-[#e6ebf1]">
              <table className="w-full text-[12px]">
                <thead className="bg-[#f5f7fa] text-left text-[#5d6e80] sticky top-0">
                  <tr>
                    <th className="px-3 py-1.5 font-semibold">Ürün</th>
                    <th className="px-3 py-1.5 font-semibold text-right">Şu an</th>
                    <th className="px-3 py-1.5 font-semibold text-right">Yeni</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-[#eef1f5]">
                  {preview.rows.map((r) => (
                    <tr key={r.id} className={r.skipped ? 'text-[#9aa8b6]' : undefined}>
                      <td className="px-3 py-1.5 max-w-[320px]">
                        <span className="block truncate" title={r.name}>{r.name}</span>
                        {r.variants.length > 0 && !r.skipped && <span className="block text-[11px] text-[#9aa8b6]">{r.variants.length} varyant birlikte</span>}
                      </td>
                      <td className="px-3 py-1.5 text-right tabular-nums whitespace-nowrap">{fmtPrice(r.from, r.currency)}</td>
                      <td className="px-3 py-1.5 text-right tabular-nums whitespace-nowrap">{r.skipped ? (r.skipped === 'quote' ? 'teklifli, atlanır' : 'fiyatsız, atlanır') : fmtPrice(r.to, r.currency)}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>
      </Modal>

      {/* Sil */}
      <Modal
        open={!!deleteFor}
        onClose={() => setDeleteFor(null)}
        title="Ürün grubu silinsin mi?"
        size="sm"
        footer={
          <>
            <Btn variant="outline" onClick={() => setDeleteFor(null)}>Vazgeç</Btn>
            <Btn variant="danger" loading={busy === 'delete'} disabled={!impact} onClick={() => void confirmDelete()}>Kalıcı olarak sil</Btn>
          </>
        }
      >
        {!impact ? (
          <Spinner />
        ) : (
          <div className="space-y-2 text-sm text-[#20384e]">
            <p>“{deleteFor?.name}” grubu silinir. Bu işlem geri alınamaz:</p>
            <ul className="list-disc pl-5 space-y-1">
              <li>
                <strong>{impact.panelProducts.length}</strong> panelden eklenmiş ürün kalıcı olarak silinir
                {impact.panelProducts.length > 0 && <span className="block text-xs text-[#5d6e80]">{impact.panelProducts.map((p) => p.name).join(', ')}</span>}
              </li>
              <li><strong>{impact.catalogProducts}</strong> katalog ürünü satışa kapatılır (sitede görünür, satın alınamaz; ürün düzenleyicisinden tek tek açılabilir)</li>
              <li><strong>{impact.discounts.length}</strong> grup indirimi silinir{impact.discounts.length > 0 && `: ${impact.discounts.join(', ')}`}</li>
            </ul>
            <p className="text-xs text-[#5d6e80]">Geçmiş siparişler etkilenmez.</p>
          </div>
        )}
      </Modal>
    </div>
  )
}
