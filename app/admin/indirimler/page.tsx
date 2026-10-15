'use client'

import React, { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'
import { Badge } from '@/components/ui/badge'
import { Percent, Plus, Pencil, Trash2, Loader2, ToggleLeft, ToggleRight } from 'lucide-react'
import { CATEGORY_GROUPS } from '@/lib/categories'
import { mockProducts } from '@/lib/products-mock'
import { CouponManager } from '@/components/admin/CouponManager'

type Discount = {
  id: string
  name: string
  scope: string
  categoryName: string | null
  productIds: string[] | null
  type: string
  value: number
  startDate: string | null
  endDate: string | null
  active: boolean
  createdAt: string
  updatedAt: string
}

const SCOPE_LABELS: Record<string, string> = {
  ALL: 'Tüm ürünler',
  CATEGORY: 'Kategori bazlı',
  PRODUCT: 'Ürün bazlı',
}

const TYPE_LABELS: Record<string, string> = {
  PERCENT: 'Yüzde',
  FIXED: 'Sabit (TL)',
}

const allCategoryValues = CATEGORY_GROUPS.flatMap((g) => g.categoryValues)

export default function AdminIndirimlerPage() {
  const router = useRouter()
  const [discounts, setDiscounts] = useState<Discount[]>([])
  const [loading, setLoading] = useState(true)
  const [dialogOpen, setDialogOpen] = useState(false)
  const [editingId, setEditingId] = useState<string | null>(null)
  const [saving, setSaving] = useState(false)
  const [deletingId, setDeletingId] = useState<string | null>(null)
  const [form, setForm] = useState({
    name: '',
    scope: 'ALL' as 'ALL' | 'CATEGORY' | 'PRODUCT',
    categoryName: '',
    productIds: [] as string[],
    type: 'PERCENT' as 'PERCENT' | 'FIXED',
    value: 10,
    startDate: '',
    endDate: '',
    active: true,
  })

  const loadDiscounts = async () => {
    try {
      const res = await fetch('/api/admin/discounts', { credentials: 'include' })
      if (!res.ok) throw new Error('API hatası')
      const rows: Discount[] = await res.json()
      setDiscounts(rows)
    } catch {
      setDiscounts([])
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    loadDiscounts()
  }, [router])

  const openCreate = () => {
    setEditingId(null)
    setForm({
      name: '',
      scope: 'ALL',
      categoryName: '',
      productIds: [],
      type: 'PERCENT',
      value: 10,
      startDate: '',
      endDate: '',
      active: true,
    })
    setDialogOpen(true)
  }

  const openEdit = (d: Discount) => {
    setEditingId(d.id)
    setForm({
      name: d.name,
      scope: d.scope as 'ALL' | 'CATEGORY' | 'PRODUCT',
      categoryName: d.categoryName ?? '',
      productIds: Array.isArray(d.productIds) ? d.productIds : [],
      type: d.type as 'PERCENT' | 'FIXED',
      value: d.value,
      startDate: d.startDate ? d.startDate.slice(0, 16) : '',
      endDate: d.endDate ? d.endDate.slice(0, 16) : '',
      active: d.active,
    })
    setDialogOpen(true)
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setSaving(true)
    try {
      const body = {
        name: form.name.trim(),
        scope: form.scope,
        categoryName: form.scope === 'CATEGORY' ? form.categoryName || null : null,
        productIds: form.scope === 'PRODUCT' ? form.productIds : null,
        type: form.type,
        value: Number(form.value),
        startDate: form.startDate ? new Date(form.startDate).toISOString() : null,
        endDate: form.endDate ? new Date(form.endDate).toISOString() : null,
        active: form.active,
      }
      if (editingId) {
        const res = await fetch(`/api/admin/discounts/${editingId}`, {
          method: 'PATCH',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(body),
          credentials: 'include',
        })
        if (!res.ok) throw new Error('Güncelleme hatası')
      } else {
        const res = await fetch('/api/admin/discounts', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(body),
          credentials: 'include',
        })
        if (!res.ok) throw new Error('Oluşturma hatası')
      }
      setDialogOpen(false)
      loadDiscounts()
    } finally {
      setSaving(false)
    }
  }

  const handleDelete = async (id: string) => {
    if (!confirm('Bu indirimi silmek istediğinize emin misiniz?')) return
    setDeletingId(id)
    try {
      const res = await fetch(`/api/admin/discounts/${id}`, {
        method: 'DELETE',
        credentials: 'include',
      })
      if (!res.ok) throw new Error('Silme hatası')
      loadDiscounts()
    } finally {
      setDeletingId(null)
    }
  }

  const [togglingId, setTogglingId] = useState<string | null>(null)

  const handleToggleActive = async (d: Discount) => {
    setTogglingId(d.id)
    try {
      await fetch(`/api/admin/discounts/${d.id}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ active: !d.active }),
        credentials: 'include',
      })
      setDiscounts((prev) => prev.map((x) => x.id === d.id ? { ...x, active: !x.active } : x))
    } finally {
      setTogglingId(null)
    }
  }

  const toggleProduct = (id: string) => {
    setForm((prev) => ({
      ...prev,
      productIds: prev.productIds.includes(id)
        ? prev.productIds.filter((x) => x !== id)
        : [...prev.productIds, id],
    }))
  }

  return (
    <div className="space-y-8">
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-xl font-bold text-slate-900">Kampanyalar ve Kuponlar</h1>
          <p className="text-slate-600 mt-1">Kampanyalar ürün fiyatına otomatik uygulanır (tüm ürünler, kategori veya ürün bazlı); kupon kodlarını müşteri sepette girer.</p>
        </div>
        <Button onClick={openCreate} className="shrink-0">
          <Plus className="w-4 h-4 mr-2" />
          Yeni kampanya
        </Button>
      </div>

      <Card className="border-slate-200/80 bg-white shadow-sm">
        <CardHeader>
          <CardTitle className="text-lg">Kampanyalar (otomatik indirim)</CardTitle>
        </CardHeader>
        <CardContent>
          {loading ? (
            <div className="flex items-center justify-center py-12">
              <Loader2 className="w-8 h-8 animate-spin text-slate-400" />
            </div>
          ) : discounts.length === 0 ? (
            <p className="text-slate-500 py-8 text-center">Henüz indirim tanımlanmamış.</p>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead>
                  <tr className="border-b border-slate-200">
                    <th className="text-left py-3 px-2 font-medium text-slate-700">Ad</th>
                    <th className="text-left py-3 px-2 font-medium text-slate-700">Kapsam</th>
                    <th className="text-left py-3 px-2 font-medium text-slate-700">İndirim</th>
                    <th className="text-left py-3 px-2 font-medium text-slate-700">Tarih</th>
                    <th className="text-left py-3 px-2 font-medium text-slate-700">Durum</th>
                    <th className="text-right py-3 px-2 font-medium text-slate-700">İşlem</th>
                  </tr>
                </thead>
                <tbody>
                  {discounts.map((d) => (
                    <tr key={d.id} className="border-b border-slate-100 hover:bg-slate-50/50">
                      <td className="py-3 px-2">{d.name}</td>
                      <td className="py-3 px-2">
                        {SCOPE_LABELS[d.scope] ?? d.scope}
                        {d.scope === 'CATEGORY' && d.categoryName && (
                          <span className="block text-xs text-slate-500 truncate max-w-[180px]" title={d.categoryName}>
                            {d.categoryName}
                          </span>
                        )}
                        {d.scope === 'PRODUCT' && Array.isArray(d.productIds) && (
                          <span className="block text-xs text-slate-500">{d.productIds.length} ürün</span>
                        )}
                      </td>
                      <td className="py-3 px-2">
                        {d.type === 'PERCENT' ? `%${d.value}` : `${d.value} TL`}
                      </td>
                      <td className="py-3 px-2 text-slate-600">
                        {d.startDate || d.endDate
                          ? `${d.startDate ? new Date(d.startDate).toLocaleDateString('tr-TR') : '–'} / ${d.endDate ? new Date(d.endDate).toLocaleDateString('tr-TR') : '–'}`
                          : '–'}
                      </td>
                      <td className="py-3 px-2">
                        <button
                          onClick={() => handleToggleActive(d)}
                          disabled={togglingId === d.id}
                          className="flex items-center gap-1.5 disabled:opacity-50 transition-opacity"
                          title={d.active ? 'Pasifleştir' : 'Aktifleştir'}
                        >
                          {togglingId === d.id ? (
                            <Loader2 className="w-5 h-5 animate-spin text-slate-400" />
                          ) : d.active ? (
                            <ToggleRight className="w-6 h-6 text-green-500" />
                          ) : (
                            <ToggleLeft className="w-6 h-6 text-slate-300" />
                          )}
                          <span className={`text-xs font-medium ${d.active ? 'text-green-600' : 'text-slate-400'}`}>
                            {d.active ? 'Aktif' : 'Pasif'}
                          </span>
                        </button>
                      </td>
                      <td className="py-3 px-2 text-right">
                        <Button variant="ghost" size="icon" onClick={() => openEdit(d)} className="h-8 w-8">
                          <Pencil className="w-4 h-4" />
                        </Button>
                        <Button
                          variant="ghost"
                          size="icon"
                          onClick={() => handleDelete(d.id)}
                          disabled={deletingId === d.id}
                          className="h-8 w-8 text-red-400 hover:text-red-600 hover:bg-red-50"
                        >
                          {deletingId === d.id ? <Loader2 className="w-4 h-4 animate-spin" /> : <Trash2 className="w-4 h-4" />}
                        </Button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </CardContent>
      </Card>

      <CouponManager />

      <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
        <DialogContent className="max-w-lg max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>{editingId ? 'İndirimi düzenle' : 'Yeni indirim'}</DialogTitle>
            <DialogDescription>Kapsam, tip ve değer girin. Tarih boş bırakılırsa süresiz geçerli olur.</DialogDescription>
          </DialogHeader>
          <form onSubmit={handleSubmit} className="space-y-4">
            <div>
              <Label htmlFor="name">Kampanya adı</Label>
              <Input
                id="name"
                value={form.name}
                onChange={(e) => setForm((p) => ({ ...p, name: e.target.value }))}
                placeholder="Örn. Yaz İndirimi"
                required
                className="mt-1"
              />
            </div>
            <div>
              <Label>Kapsam</Label>
              <Select
                value={form.scope ?? ''}
                onValueChange={(v) => setForm((p) => ({ ...p, scope: v as 'ALL' | 'CATEGORY' | 'PRODUCT' }))}
              >
                <SelectTrigger className="mt-1">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="ALL">{SCOPE_LABELS.ALL}</SelectItem>
                  <SelectItem value="CATEGORY">{SCOPE_LABELS.CATEGORY}</SelectItem>
                  <SelectItem value="PRODUCT">{SCOPE_LABELS.PRODUCT}</SelectItem>
                </SelectContent>
              </Select>
            </div>
            {form.scope === 'CATEGORY' && (
              <div>
                <Label>Kategori</Label>
                <Select
                  value={form.categoryName ?? ''}
                  onValueChange={(v) => setForm((p) => ({ ...p, categoryName: v }))}
                >
                  <SelectTrigger className="mt-1">
                    <SelectValue placeholder="Kategori seçin" />
                  </SelectTrigger>
                  <SelectContent>
                    {allCategoryValues.map((c) => (
                      <SelectItem key={c} value={c}>
                        {c}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            )}
            {form.scope === 'PRODUCT' && (
              <div>
                <Label>Ürünler (çoklu seçim)</Label>
                <div className="mt-1 border rounded-lg p-3 max-h-48 overflow-y-auto space-y-2 bg-slate-50">
                  {mockProducts.slice(0, 200).map((p) => (
                    <label key={p.id} className="flex items-center gap-2 cursor-pointer">
                      <input
                        type="checkbox"
                        checked={form.productIds.includes(p.id)}
                        onChange={() => toggleProduct(p.id)}
                        className="rounded border-slate-300"
                      />
                      <span className="text-sm truncate">{p.name}</span>
                    </label>
                  ))}
                  {mockProducts.length > 200 && (
                    <p className="text-xs text-slate-500">İlk 200 ürün listeleniyor. Daha fazlası için arama eklenebilir.</p>
                  )}
                </div>
              </div>
            )}
            <div className="grid grid-cols-2 gap-4">
              <div>
                <Label>Tip</Label>
                <Select
                  value={form.type ?? ''}
                  onValueChange={(v) => setForm((p) => ({ ...p, type: v as 'PERCENT' | 'FIXED' }))}
                >
                  <SelectTrigger className="mt-1">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="PERCENT">{TYPE_LABELS.PERCENT}</SelectItem>
                    <SelectItem value="FIXED">{TYPE_LABELS.FIXED}</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              <div>
                <Label htmlFor="value">{form.type === 'PERCENT' ? 'Yüzde (%)' : 'Tutar (TL)'}</Label>
                <p className="text-xs text-slate-500">
                  {form.type === 'PERCENT'
                    ? 'Ürün ve varyant fiyatlarına yüzde olarak uygulanır.'
                    : 'Birim fiyattan (KDV hariç) düşülür.'}{' '}
                  Bir ürüne birden fazla kampanya uyarsa müşteri için en avantajlısı uygulanır; kampanyalar toplanmaz.
                </p>
                <Input
                  id="value"
                  type="number"
                  min={0}
                  step={form.type === 'PERCENT' ? 1 : 0.01}
                  value={form.value}
                  onChange={(e) => setForm((p) => ({ ...p, value: Number(e.target.value) || 0 }))}
                  className="mt-1"
                />
              </div>
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div>
                <Label htmlFor="startDate">Başlangıç (opsiyonel)</Label>
                <Input
                  id="startDate"
                  type="datetime-local"
                  value={form.startDate}
                  onChange={(e) => setForm((p) => ({ ...p, startDate: e.target.value }))}
                  className="mt-1"
                />
              </div>
              <div>
                <Label htmlFor="endDate">Bitiş (opsiyonel)</Label>
                <Input
                  id="endDate"
                  type="datetime-local"
                  value={form.endDate}
                  onChange={(e) => setForm((p) => ({ ...p, endDate: e.target.value }))}
                  className="mt-1"
                />
              </div>
            </div>
            <div className="flex items-center gap-2">
              <input
                type="checkbox"
                id="active"
                checked={form.active}
                onChange={(e) => setForm((p) => ({ ...p, active: e.target.checked }))}
                className="rounded border-slate-300"
              />
              <Label htmlFor="active">Aktif</Label>
            </div>
            <DialogFooter>
              <Button type="button" variant="outline" onClick={() => setDialogOpen(false)}>
                İptal
              </Button>
              <Button type="submit" disabled={saving}>
                {saving ? <Loader2 className="w-4 h-4 animate-spin mr-2" /> : null}
                {editingId ? 'Güncelle' : 'Oluştur'}
              </Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>
    </div>
  )
}
