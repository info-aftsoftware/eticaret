'use client'

import React, { Suspense, useState, useEffect } from 'react'
import { useRouter, useSearchParams } from 'next/navigation'
import Link from 'next/link'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Badge } from '@/components/ui/badge'
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
import { Package, Plus, Pencil, Trash2, Loader2, Search } from 'lucide-react'
import { CATEGORY_GROUPS } from '@/lib/categories'
import { fmtTRY } from '@/lib/format'

type CatalogProduct = {
  id: string
  name: string
  category: string
  price: number
  stock: number
  featured: boolean
  description?: string
  fullDescription?: string
  image?: string
  sku?: string
  brand?: string
}

const allCategoryValues: string[] = CATEGORY_GROUPS.flatMap((g) => [...g.categoryValues])

function AdminKatalogContent() {
  const router = useRouter()
  const searchParams = useSearchParams()
  const [products, setProducts] = useState<CatalogProduct[]>([])
  const [loading, setLoading] = useState(true)
  const [searchQuery, setSearchQuery] = useState('')
  const [dialogOpen, setDialogOpen] = useState(false)
  const [editingId, setEditingId] = useState<string | null>(null)
  const [saving, setSaving] = useState(false)
  const [deletingId, setDeletingId] = useState<string | null>(null)
  const [form, setForm] = useState({
    name: '',
    price: '',
    category: 'Diğer',
    description: '',
    fullDescription: '',
    image: '',
    stock: '',
    featured: false,
    sku: '',
    brand: '',
  })

  const loadCatalog = async () => {
    setLoading(true)
    try {
      const res = await fetch('/api/admin/catalog', { credentials: 'include' })
      if (!res.ok) throw new Error('API hatası')
      const data: CatalogProduct[] = await res.json()
      setProducts(data)
    } catch {
      setProducts([])
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    loadCatalog()
  }, [router])

  // ?id=xxx ile gelince otomatik olarak o ürünün edit dialogunu aç
  useEffect(() => {
    const idParam = searchParams?.get('id')
    if (!idParam || loading || products.length === 0) return
    const product = products.find((p) => p.id === idParam)
    if (product) openEdit(product)
  }, [searchParams, loading, products])

  const filteredProducts = products.filter(
    (p) =>
      p.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
      (p.id || '').toLowerCase().includes(searchQuery.toLowerCase()) ||
      (p.sku || '').toLowerCase().includes(searchQuery.toLowerCase())
  )

  const openCreate = () => {
    setEditingId(null)
    setForm({
      name: '',
      price: '',
      category: 'Diğer',
      description: '',
      fullDescription: '',
      image: '',
      stock: '',
      featured: false,
      sku: '',
      brand: '',
    })
    setDialogOpen(true)
  }

  const openEdit = (p: CatalogProduct) => {
    setEditingId(p.id)
    setForm({
      name: p.name,
      price: String(p.price),
      category: p.category || 'Diğer',
      description: p.description ?? '',
      fullDescription: p.fullDescription ?? '',
      image: p.image ?? '',
      stock: String(p.stock ?? ''),
      featured: p.featured ?? false,
      sku: p.sku ?? '',
      brand: p.brand ?? '',
    })
    setDialogOpen(true)
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setSaving(true)
    try {
      const body = {
        name: form.name.trim(),
        price: Number(form.price) || 0,
        category: form.category.trim() || 'Diğer',
        description: form.description.trim() || null,
        fullDescription: form.fullDescription.trim() || null,
        image: form.image.trim() || null,
        stock: form.stock !== '' ? Math.max(0, Math.floor(Number(form.stock))) : null,
        featured: form.featured,
        sku: form.sku.trim() || null,
        brand: form.brand.trim() || null,
      }
      if (editingId) {
        const res = await fetch(`/api/admin/catalog/${editingId}`, {
          method: 'PATCH',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(body),
          credentials: 'include',
        })
        if (!res.ok) throw new Error('Güncelleme hatası')
      } else {
        const res = await fetch('/api/admin/catalog', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(body),
          credentials: 'include',
        })
        if (!res.ok) throw new Error('Oluşturma hatası')
      }
      setDialogOpen(false)
      loadCatalog()
    } finally {
      setSaving(false)
    }
  }

  const handleDelete = async (id: string) => {
    if (!confirm('Bu ürün düzenlemesini kaldırmak istediğinize emin misiniz? (Mock ürünse orijinal hali kalır.)')) return
    setDeletingId(id)
    try {
      const res = await fetch(`/api/admin/catalog/${id}`, {
        method: 'DELETE',
        credentials: 'include',
      })
      if (!res.ok && res.status !== 404) throw new Error('Silme hatası')
      loadCatalog()
    } finally {
      setDeletingId(null)
    }
  }

  return (
    <div className="space-y-8 pb-safe">
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-slate-900">Katalog / Ürün Düzenleme</h1>
          <p className="text-slate-600 mt-1">Site kataloğundaki ürünleri düzenleyin veya yeni ürün ekleyin</p>
        </div>
        <div className="flex gap-2">
          <Link href="/admin/urunler">
            <Button variant="outline" size="sm">Stok Yönetimi</Button>
          </Link>
          <Button onClick={openCreate} className="shrink-0">
            <Plus className="w-4 h-4 mr-2" />
            Yeni ürün
          </Button>
        </div>
      </div>

      <Card className="border-slate-200/80 bg-white shadow-sm">
        <CardHeader>
          <div className="flex flex-col sm:flex-row gap-4">
            <div className="flex-1 relative">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-slate-400 shrink-0" />
              <Input
                placeholder="Ürün ara (isim, ID veya SKU)..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="pl-10 min-w-0 border-slate-200"
              />
            </div>
          </div>
        </CardHeader>
        <CardContent>
          {loading ? (
            <div className="flex items-center justify-center py-12">
              <Loader2 className="w-8 h-8 animate-spin text-slate-400" />
            </div>
          ) : filteredProducts.length === 0 ? (
            <p className="text-slate-500 py-8 text-center">Ürün bulunamadı.</p>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead>
                  <tr className="border-b border-slate-200">
                    <th className="text-left py-3 px-2 font-medium text-slate-700">Ürün</th>
                    <th className="text-left py-3 px-2 font-medium text-slate-700">Kategori</th>
                    <th className="text-left py-3 px-2 font-medium text-slate-700">Fiyat</th>
                    <th className="text-left py-3 px-2 font-medium text-slate-700">Stok</th>
                    <th className="text-left py-3 px-2 font-medium text-slate-700">Öne çıkan</th>
                    <th className="text-right py-3 px-2 font-medium text-slate-700">İşlem</th>
                  </tr>
                </thead>
                <tbody>
                  {filteredProducts.map((p) => (
                    <tr key={p.id} className="border-b border-slate-100 hover:bg-slate-50/50">
                      <td className="py-3 px-2">
                        <div className="font-medium text-slate-900 max-w-[280px] truncate" title={p.name}>
                          {p.name}
                        </div>
                        {p.sku && (
                          <div className="text-xs text-slate-500 font-mono">{p.sku}</div>
                        )}
                      </td>
                      <td className="py-3 px-2 text-slate-600 max-w-[180px] truncate" title={p.category}>
                        {p.category}
                      </td>
                      <td className="py-3 px-2 tabular-nums">{fmtTRY(p.price)}</td>
                      <td className="py-3 px-2">{p.stock}</td>
                      <td className="py-3 px-2">
                        {p.featured ? (
                          <Badge className="bg-green-100 text-green-800 border-0">Evet</Badge>
                        ) : (
                          <span className="text-slate-400">–</span>
                        )}
                      </td>
                      <td className="py-3 px-2 text-right">
                        <Button variant="ghost" size="icon" onClick={() => openEdit(p)} className="h-8 w-8">
                          <Pencil className="w-4 h-4" />
                        </Button>
                        <Button
                          variant="ghost"
                          size="icon"
                          onClick={() => handleDelete(p.id)}
                          disabled={deletingId === p.id}
                          className="h-8 w-8 text-brand hover:text-brand-hover hover:bg-brand-light"
                        >
                          {deletingId === p.id ? (
                            <Loader2 className="w-4 h-4 animate-spin" />
                          ) : (
                            <Trash2 className="w-4 h-4" />
                          )}
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

      <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
        <DialogContent className="max-w-lg max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>{editingId ? 'Ürünü düzenle' : 'Yeni ürün'}</DialogTitle>
            <DialogDescription>
              {editingId
                ? 'Değiştirmek istediğiniz alanları güncelleyin.'
                : 'Yeni ürün için zorunlu alanları doldurun.'}
            </DialogDescription>
          </DialogHeader>
          <form onSubmit={handleSubmit} className="space-y-4">
            <div>
              <Label htmlFor="name">Ürün adı *</Label>
              <Input
                id="name"
                value={form.name}
                onChange={(e) => setForm((prev) => ({ ...prev, name: e.target.value }))}
                placeholder="Ürün adı"
                required
                className="mt-1"
              />
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div>
                <Label htmlFor="price">Fiyat (TL) *</Label>
                <Input
                  id="price"
                  type="number"
                  min={0}
                  step={0.01}
                  value={form.price}
                  onChange={(e) => setForm((prev) => ({ ...prev, price: e.target.value }))}
                  required
                  className="mt-1"
                />
              </div>
              <div>
                <Label htmlFor="category">Kategori *</Label>
                <Select
                  value={form.category ?? ''}
                  onValueChange={(v) => setForm((prev) => ({ ...prev, category: v }))}
                >
                  <SelectTrigger className="mt-1">
                    <SelectValue />
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
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div>
                <Label htmlFor="stock">Stok</Label>
                <Input
                  id="stock"
                  type="number"
                  min={0}
                  value={form.stock}
                  onChange={(e) => setForm((prev) => ({ ...prev, stock: e.target.value }))}
                  placeholder="0"
                  className="mt-1"
                />
              </div>
              <div className="flex items-end gap-2 pb-2">
                <label className="flex items-center gap-2 cursor-pointer">
                  <input
                    type="checkbox"
                    checked={form.featured}
                    onChange={(e) => setForm((prev) => ({ ...prev, featured: e.target.checked }))}
                    className="rounded border-slate-300"
                  />
                  <span className="text-sm">Öne çıkan</span>
                </label>
              </div>
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div>
                <Label htmlFor="sku">SKU</Label>
                <Input
                  id="sku"
                  value={form.sku}
                  onChange={(e) => setForm((prev) => ({ ...prev, sku: e.target.value }))}
                  placeholder="Örn. ÜRUN-001"
                  className="mt-1"
                />
              </div>
              <div>
                <Label htmlFor="brand">Marka</Label>
                <Input
                  id="brand"
                  value={form.brand}
                  onChange={(e) => setForm((prev) => ({ ...prev, brand: e.target.value }))}
                  placeholder="Marka adı"
                  className="mt-1"
                />
              </div>
            </div>
            <div>
              <Label htmlFor="image">Görsel URL</Label>
              <Input
                id="image"
                value={form.image}
                onChange={(e) => setForm((prev) => ({ ...prev, image: e.target.value }))}
                placeholder="/images/products/urun.jpg"
                className="mt-1"
              />
            </div>
            <div>
              <Label htmlFor="description">Kısa açıklama</Label>
              <textarea
                id="description"
                value={form.description}
                onChange={(e) => setForm((prev) => ({ ...prev, description: e.target.value }))}
                placeholder="Liste ve kartlarda görünen kısa metin"
                rows={2}
                className="mt-1 w-full rounded-md border border-slate-200 px-3 py-2 text-sm"
              />
            </div>
            <div>
              <Label htmlFor="fullDescription">Uzun açıklama</Label>
              <textarea
                id="fullDescription"
                value={form.fullDescription}
                onChange={(e) => setForm((prev) => ({ ...prev, fullDescription: e.target.value }))}
                placeholder="Ürün detay sayfası açıklama sekmesi"
                rows={4}
                className="mt-1 w-full rounded-md border border-slate-200 px-3 py-2 text-sm"
              />
            </div>
            <DialogFooter>
              <Button type="button" variant="outline" onClick={() => setDialogOpen(false)}>
                İptal
              </Button>
              <Button type="submit" disabled={saving}>
                {saving ? <Loader2 className="w-4 h-4 animate-spin" /> : null}
                {editingId ? 'Güncelle' : 'Oluştur'}
              </Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>
    </div>
  )
}

export default function AdminKatalogPage() {
  return (
    <Suspense fallback={
      <div className="flex items-center justify-center py-24">
        <div className="w-6 h-6 border-2 border-brand border-t-transparent rounded-full animate-spin" />
      </div>
    }>
      <AdminKatalogContent />
    </Suspense>
  )
}
