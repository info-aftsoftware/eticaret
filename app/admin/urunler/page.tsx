'use client'

import React, { useState, useEffect, useMemo } from 'react'
import Link from 'next/link'
import { useRouter } from 'next/navigation'
import { Card, CardContent, CardHeader } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { mockProducts } from '@/lib/products-mock'
import { Package, Search, Save, Loader2, AlertTriangle, CheckSquare, Square, ChevronDown } from 'lucide-react'

const LOW_STOCK_THRESHOLD = 5

type StockFilter = 'all' | 'inStock' | 'lowStock' | 'outOfStock'

export default function AdminUrunlerPage() {
  const router = useRouter()
  const [overrides, setOverrides] = useState<Record<string, number>>({})
  const [editing, setEditing] = useState<Record<string, number>>({})
  const [loading, setLoading] = useState(true)
  const [savingId, setSavingId] = useState<string | null>(null)
  const [savingBulk, setSavingBulk] = useState(false)
  const [searchQuery, setSearchQuery] = useState('')
  const [stockFilter, setStockFilter] = useState<StockFilter>('all')
  const [selectedIds, setSelectedIds] = useState<Set<string>>(new Set())
  const [bulkValue, setBulkValue] = useState('')

  useEffect(() => {
    (async () => {
      try {
        const res = await fetch('/api/admin/stock-overrides', { credentials: 'include' })
        if (!res.ok) throw new Error('API hatası')
        const list: { productId: string; stock: number }[] = await res.json()
        const map: Record<string, number> = {}
        list.forEach((row) => { map[row.productId] = row.stock })
        setOverrides(map)
        setEditing({ ...map })
      } catch {
        setOverrides({})
      } finally {
        setLoading(false)
      }
    })()
  }, [router])

  const handleSaveStock = async (productId: string) => {
    const value = editing[productId] ?? overrides[productId] ?? 0
    setSavingId(productId)
    try {
      const stockVal = Math.max(0, Math.floor(Number(value) || 0))
      const res = await fetch('/api/admin/stock-overrides', {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ productId, stock: stockVal }),
        credentials: 'include',
      })
      if (!res.ok) throw new Error('Stok güncelleme hatası')
      setOverrides((prev) => ({ ...prev, [productId]: stockVal }))
      setEditing((prev) => ({ ...prev, [productId]: stockVal }))
    } finally {
      setSavingId(null)
    }
  }

  const handleBulkSave = async () => {
    if (!selectedIds.size) return
    const stockVal = Math.max(0, Math.floor(Number(bulkValue) || 0))
    setSavingBulk(true)
    try {
      await Promise.all(
        Array.from(selectedIds).map((id) =>
          fetch('/api/admin/stock-overrides', {
            method: 'PATCH',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ productId: id, stock: stockVal }),
            credentials: 'include',
          })
        )
      )
      const updates: Record<string, number> = {}
      selectedIds.forEach((id) => { updates[id] = stockVal })
      setOverrides((prev) => ({ ...prev, ...updates }))
      setEditing((prev) => ({ ...prev, ...updates }))
      setSelectedIds(new Set())
      setBulkValue('')
    } finally {
      setSavingBulk(false)
    }
  }

  const getEffectiveStock = (id: string, defaultStock: number) =>
    overrides[id] !== undefined ? overrides[id] : defaultStock

  const filteredProducts = useMemo(() => {
    return mockProducts.filter((p) => {
      const nameMatch =
        p.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
        p.id.toLowerCase().includes(searchQuery.toLowerCase())
      if (!nameMatch) return false
      const stock = getEffectiveStock(p.id, p.stock)
      if (stockFilter === 'outOfStock') return stock === 0
      if (stockFilter === 'lowStock') return stock > 0 && stock <= LOW_STOCK_THRESHOLD
      if (stockFilter === 'inStock') return stock > LOW_STOCK_THRESHOLD
      return true
    })
  }, [mockProducts, searchQuery, stockFilter, overrides])

  const allFilteredIds = filteredProducts.map((p) => p.id)
  const allSelected = allFilteredIds.length > 0 && allFilteredIds.every((id) => selectedIds.has(id))
  const someSelected = allFilteredIds.some((id) => selectedIds.has(id))

  const toggleSelectAll = () => {
    if (allSelected) {
      setSelectedIds((prev) => {
        const next = new Set(prev)
        allFilteredIds.forEach((id) => next.delete(id))
        return next
      })
    } else {
      setSelectedIds((prev) => {
        const next = new Set(prev)
        allFilteredIds.forEach((id) => next.add(id))
        return next
      })
    }
  }

  const toggleSelect = (id: string) => {
    setSelectedIds((prev) => {
      const next = new Set(prev)
      if (next.has(id)) next.delete(id)
      else next.add(id)
      return next
    })
  }

  const lowStockProducts = mockProducts.filter((p) => {
    const stock = getEffectiveStock(p.id, p.stock)
    return stock <= LOW_STOCK_THRESHOLD
  })

  const filterButtons: { label: string; value: StockFilter }[] = [
    { label: 'Tümü', value: 'all' },
    { label: 'Stokta', value: 'inStock' },
    { label: 'Düşük Stok', value: 'lowStock' },
    { label: 'Tükendi', value: 'outOfStock' },
  ]

  return (
    <div className="space-y-6 pb-safe">
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-xl font-bold text-slate-900">Stok Yönetimi</h1>
          <p className="text-slate-600 mt-1">Site ürünlerinin stok adetlerini güncelleyin</p>
        </div>
        <Link href="/admin/products">
          <Button variant="outline" size="sm">Ürünler</Button>
        </Link>
      </div>

      {/* Düşük stok uyarısı */}
      {!loading && lowStockProducts.length > 0 && (
        <div className="rounded-lg border border-amber-200 bg-amber-50 p-4">
          <div className="flex items-center gap-2 mb-2">
            <AlertTriangle className="w-5 h-5 text-amber-600 shrink-0" />
            <span className="font-semibold text-amber-800 text-sm">
              {lowStockProducts.length} ürünün stoğu kritik seviyede (≤{LOW_STOCK_THRESHOLD} adet)
            </span>
          </div>
          <ul className="space-y-1">
            {lowStockProducts.slice(0, 5).map((p) => {
              const stock = getEffectiveStock(p.id, p.stock)
              return (
                <li key={p.id} className="text-xs text-amber-700 flex items-center gap-2">
                  <span className="font-mono bg-amber-100 px-1.5 py-0.5 rounded text-amber-800 font-semibold">
                    {stock === 0 ? 'TÜKENDI' : stock}
                  </span>
                  {p.name}
                </li>
              )
            })}
            {lowStockProducts.length > 5 && (
              <li className="text-xs text-amber-600">...ve {lowStockProducts.length - 5} ürün daha</li>
            )}
          </ul>
        </div>
      )}

      <Card className="border-slate-200/80 bg-white shadow-sm">
        <CardHeader className="pb-4">
          <div className="flex flex-col gap-3">
            {/* Arama */}
            <div className="flex flex-col sm:flex-row gap-3">
              <div className="flex-1 relative">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-ink-muted z-10 pointer-events-none shrink-0" />
                <Input
                  placeholder="Ürün ara (isim veya ID)..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="pl-12 min-w-0 border-palette"
                />
              </div>
            </div>
            {/* Filtre butonları */}
            <div className="flex flex-wrap gap-2">
              {filterButtons.map((btn) => (
                <Button
                  key={btn.value}
                  variant={stockFilter === btn.value ? 'default' : 'outline'}
                  size="sm"
                  onClick={() => {
                    setStockFilter(btn.value)
                    setSelectedIds(new Set())
                  }}
                  className={stockFilter === btn.value ? 'bg-brand hover:bg-brand-hover' : ''}
                >
                  {btn.label}
                  {btn.value !== 'all' && !loading && (
                    <span className="ml-1.5 text-xs opacity-70">
                      ({mockProducts.filter((p) => {
                        const s = getEffectiveStock(p.id, p.stock)
                        if (btn.value === 'outOfStock') return s === 0
                        if (btn.value === 'lowStock') return s > 0 && s <= LOW_STOCK_THRESHOLD
                        return s > LOW_STOCK_THRESHOLD
                      }).length})
                    </span>
                  )}
                </Button>
              ))}
            </div>
          </div>
        </CardHeader>

        {/* Toplu işlem çubuğu */}
        {selectedIds.size > 0 && (
          <div className="mx-6 mb-4 flex flex-wrap items-center gap-3 rounded-lg bg-brand/5 border border-brand/20 px-4 py-3">
            <span className="text-sm font-medium text-brand">
              {selectedIds.size} ürün seçili
            </span>
            <div className="flex items-center gap-2 ml-auto">
              <Input
                type="number"
                min={0}
                placeholder="Stok adedi"
                value={bulkValue}
                onChange={(e) => setBulkValue(e.target.value)}
                className="w-32 border-palette h-8 text-sm"
              />
              <Button
                size="sm"
                onClick={handleBulkSave}
                disabled={savingBulk || bulkValue === ''}
                className="bg-brand hover:bg-brand-hover h-8"
              >
                {savingBulk ? (
                  <Loader2 className="w-4 h-4 animate-spin" />
                ) : (
                  <>
                    <Save className="w-4 h-4 mr-1" />
                    Seçililere Uygula
                  </>
                )}
              </Button>
              <Button
                size="sm"
                variant="ghost"
                onClick={() => setSelectedIds(new Set())}
                className="h-8 text-slate-500"
              >
                Seçimi Temizle
              </Button>
            </div>
          </div>
        )}

        <CardContent>
          {loading ? (
            <div className="flex items-center justify-center py-12">
              <Loader2 className="w-8 h-8 animate-spin text-brand" />
            </div>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead>
                  <tr className="border-b border-palette">
                    <th className="py-3 px-2 w-10">
                      <button
                        onClick={toggleSelectAll}
                        className="flex items-center justify-center text-brand"
                        title={allSelected ? 'Tümünü kaldır' : 'Tümünü seç'}
                      >
                        {allSelected ? (
                          <CheckSquare className="w-5 h-5" />
                        ) : someSelected ? (
                          <CheckSquare className="w-5 h-5 opacity-50" />
                        ) : (
                          <Square className="w-5 h-5 text-slate-400" />
                        )}
                      </button>
                    </th>
                    <th className="text-left py-3 px-2 font-semibold text-ink">Ürün Adı</th>
                    <th className="text-left py-3 px-2 font-semibold text-ink">Mevcut Stok</th>
                    <th className="text-left py-3 px-2 font-semibold text-ink">Yeni Stok</th>
                    <th className="text-left py-3 px-2 font-semibold text-ink w-24">İşlem</th>
                  </tr>
                </thead>
                <tbody>
                  {filteredProducts.length === 0 ? (
                    <tr>
                      <td colSpan={5} className="text-center py-12 text-slate-500">
                        <Package className="w-10 h-10 mx-auto mb-2 text-slate-300" />
                        Bu filtreye uygun ürün bulunamadı
                      </td>
                    </tr>
                  ) : (
                    filteredProducts.map((product) => {
                      const currentStock = getEffectiveStock(product.id, product.stock)
                      const editValue = editing[product.id] ?? currentStock
                      const isOutOfStock = currentStock === 0
                      const isLowStock = currentStock > 0 && currentStock <= LOW_STOCK_THRESHOLD
                      const isSelected = selectedIds.has(product.id)
                      return (
                        <tr
                          key={product.id}
                          onClick={() => toggleSelect(product.id)}
                          className={`border-b border-palette/70 cursor-pointer transition-colors
                            ${isSelected ? 'bg-brand/5' : isOutOfStock ? 'bg-red-50/40' : isLowStock ? 'bg-amber-50/40' : 'hover:bg-muted/50'}`}
                        >
                          <td className="py-3 px-2" onClick={(e) => e.stopPropagation()}>
                            <button
                              onClick={() => toggleSelect(product.id)}
                              className="flex items-center justify-center"
                            >
                              {isSelected ? (
                                <CheckSquare className="w-5 h-5 text-brand" />
                              ) : (
                                <Square className="w-5 h-5 text-slate-300" />
                              )}
                            </button>
                          </td>
                          <td className="py-3 px-2 font-medium text-ink">
                            <div>{product.name}</div>
                            <div className="text-xs text-ink-muted font-mono">{product.id}</div>
                            <div className="flex gap-1 mt-0.5">
                              {isOutOfStock && (
                                <span className="text-xs font-semibold text-red-600 bg-red-100 px-1.5 py-0.5 rounded">TÜKENDI</span>
                              )}
                              {isLowStock && (
                                <span className="text-xs font-semibold text-amber-700 bg-amber-100 px-1.5 py-0.5 rounded">DÜŞÜK STOK</span>
                              )}
                            </div>
                          </td>
                          <td className={`py-3 px-2 font-semibold ${isOutOfStock ? 'text-red-600' : isLowStock ? 'text-amber-600' : 'text-ink-muted'}`}>
                            {currentStock}
                            <span className="ml-1 text-xs font-normal text-slate-400">
                              {overrides[product.id] !== undefined ? '(güncellendi)' : '(varsayılan)'}
                            </span>
                          </td>
                          <td className="py-3 px-2" onClick={(e) => e.stopPropagation()}>
                            <Input
                              type="number"
                              min={0}
                              value={editValue}
                              onChange={(e) =>
                                setEditing((prev) => ({ ...prev, [product.id]: parseInt(e.target.value, 10) || 0 }))
                              }
                              className="w-24 border-palette"
                            />
                          </td>
                          <td className="py-3 px-2" onClick={(e) => e.stopPropagation()}>
                            <Button
                              size="sm"
                              onClick={() => handleSaveStock(product.id)}
                              disabled={savingId === product.id}
                              className="bg-brand hover:bg-brand-hover"
                            >
                              {savingId === product.id ? (
                                <Loader2 className="w-4 h-4 animate-spin" />
                              ) : (
                                <>
                                  <Save className="w-4 h-4 mr-1" />
                                  Kaydet
                                </>
                              )}
                            </Button>
                          </td>
                        </tr>
                      )
                    })
                  )}
                </tbody>
              </table>
              <p className="text-xs text-ink-muted mt-4">
                Toplam {filteredProducts.length} ürün gösteriliyor. Kaydettiğiniz stok değeri sitede anında yansır.
              </p>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  )
}
