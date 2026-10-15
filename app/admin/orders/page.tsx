'use client'

import React, { useState, useEffect } from 'react'
import Link from 'next/link'
import { useRouter } from 'next/navigation'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { Input } from '@/components/ui/input'
import { Package, Search, Eye, CheckCircle2, Loader2, RefreshCw } from 'lucide-react'
import { fmtTRY } from '@/lib/format'

type OrderRow = {
  id: string
  source: 'prisma' | 'firestore'
  orderId: string
  customerName?: string
  customerEmail?: string
  total: number
  status: string
  paymentStatus?: string
  paymentMethod?: string | null
  /** Açık iade talebi sayısı (talep alındı / onaylandı / teslim alındı) */
  openReturns?: number
  /** Müşteri havale yaptığını bildirdi */
  paymentNotified?: boolean
  createdAt: string
  userId?: string | null
}

const PAYMENT_STATUS_LABELS: Record<string, string> = {
  PENDING: 'Bekliyor',
  pending: 'Bekliyor',
  PAID: 'Ödendi',
  paid: 'Ödendi',
  FAILED: 'Başarısız',
  REFUNDED: 'İade edildi',
  PARTIALLY_REFUNDED: 'Kısmi iade',
}

const PAYMENT_METHOD_LABELS: Record<string, string> = {
  bank_transfer: 'Havale/EFT',
  stripe: 'Kart',
  card: 'Kart (Sanal POS)',
  paytr: 'Kart (PayTR)',
}

const isAwaitingTransfer = (o: OrderRow) =>
  o.source === 'prisma' && o.paymentMethod === 'bank_transfer' && o.paymentStatus !== 'PAID' &&
  (o.status === 'PENDING' || o.status === 'pending')

const STATUS_LABELS: Record<string, string> = {
  pending: 'Beklemede',
  PENDING: 'Beklemede',
  confirmed: 'Onaylandı',
  CONFIRMED: 'Onaylandı',
  processing: 'Hazırlanıyor',
  PROCESSING: 'Hazırlanıyor',
  picking: 'Hazırlanıyor',
  PICKING: 'Hazırlanıyor',
  shipped: 'Kargoda',
  SHIPPED: 'Kargoda',
  delivered: 'Teslim Edildi',
  DELIVERED: 'Teslim Edildi',
  cancelled: 'İptal',
  CANCELLED: 'İptal',
  returned: 'İade',
  RETURNED: 'İade',
  PAID: 'Ödendi',
  paid: 'Ödendi',
}

const STATUS_BADGE_CLASS: Record<string, string> = {
  pending: 'bg-amber-100 text-amber-800 border-0',
  PENDING: 'bg-amber-100 text-amber-800 border-0',
  confirmed: 'bg-blue-100 text-blue-800 border-0',
  CONFIRMED: 'bg-blue-100 text-blue-800 border-0',
  processing: 'bg-indigo-100 text-indigo-800 border-0',
  PROCESSING: 'bg-indigo-100 text-indigo-800 border-0',
  picking: 'bg-indigo-100 text-indigo-800 border-0',
  PICKING: 'bg-indigo-100 text-indigo-800 border-0',
  shipped: 'bg-purple-100 text-purple-800 border-0',
  SHIPPED: 'bg-purple-100 text-purple-800 border-0',
  delivered: 'bg-green-100 text-green-800 border-0',
  DELIVERED: 'bg-green-100 text-green-800 border-0',
  cancelled: 'bg-red-100 text-red-800 border-0',
  CANCELLED: 'bg-red-100 text-red-800 border-0',
  returned: 'bg-slate-100 text-slate-700 border-0',
  RETURNED: 'bg-slate-100 text-slate-700 border-0',
  PAID: 'bg-green-100 text-green-800 border-0',
  paid: 'bg-green-100 text-green-800 border-0',
}

const FILTER_STATUSES = ['PENDING', 'PAID', 'PICKING', 'SHIPPED', 'DELIVERED', 'CANCELLED', 'RETURNED']
const AWAITING_TRANSFER_FILTER = '__awaiting_transfer'
const OPEN_RETURNS_FILTER = '__open_returns'

async function loadOrdersFromAPI(): Promise<OrderRow[]> {
  const res = await fetch('/api/admin/orders', { credentials: 'include' })
  if (!res.ok) throw new Error('API hatası')
  const data: { prisma: any[]; firestore: any[] } = await res.json()

  const rows: OrderRow[] = []

  // Prisma siparişleri
  for (const o of data.prisma ?? []) {
    rows.push({
      id: o.id,
      source: 'prisma',
      orderId: o.orderNo || o.id,
      customerName: o.shippingName || o.user?.name,
      customerEmail: o.user?.email || o.shippingEmail,
      total: o.total ?? 0,
      status: o.status ?? 'PENDING',
      paymentStatus: o.paymentStatus,
      paymentMethod: o.paymentMethod ?? null,
      openReturns: Array.isArray(o.returnRequests) ? o.returnRequests.length : 0,
      paymentNotified: Array.isArray(o.events) && o.events.length > 0,
      createdAt: o.createdAt ?? '',
      userId: o.userId ?? null,
    })
  }

  // Firestore siparişleri
  for (const o of data.firestore ?? []) {
    const customer = o.customer || {}
    const pricing = o.pricing || {}
    rows.push({
      id: o.id,
      source: 'firestore',
      orderId: o.orderId || o.id,
      customerName: customer.name,
      customerEmail: customer.email,
      total: pricing.total ?? 0,
      status: o.status ?? 'pending',
      paymentStatus: o.paymentStatus,
      createdAt: o.createdAt ?? '',
      userId: o.userId ?? null,
    })
  }

  rows.sort((a, b) => (b.createdAt || '').localeCompare(a.createdAt || ''))
  return rows
}

export default function AdminOrdersPage() {
  const router = useRouter()
  const [orders, setOrders] = useState<OrderRow[]>([])
  const [loading, setLoading] = useState(true)
  const [refreshing, setRefreshing] = useState(false)
  const [searchQuery, setSearchQuery] = useState('')
  const [statusFilter, setStatusFilter] = useState<string | null>(null)
  const [updatingId, setUpdatingId] = useState<string | null>(null)
  const [actionError, setActionError] = useState<string | null>(null)

  const fetchOrders = async (silent = false) => {
    if (!silent) setLoading(true)
    else setRefreshing(true)
    try {
      const rows = await loadOrdersFromAPI()
      setOrders(rows)
    } catch (err) {
      console.error('Admin orders load error:', err)
      setOrders([])
    } finally {
      setLoading(false)
      setRefreshing(false)
    }
  }

  useEffect(() => {
    fetchOrders()
  }, [router])

  /** Prisma siparişlerinde lib/order-service üzerinden işlem yapar (e-posta + zaman çizelgesi). */
  const runQuickAction = async (row: OrderRow, body: Record<string, unknown>, confirmText?: string) => {
    if (confirmText && !window.confirm(confirmText)) return
    setUpdatingId(row.id)
    setActionError(null)
    try {
      const url = row.source === 'firestore' && row.userId
        ? `/api/admin/orders/${row.id}?source=firestore&userId=${row.userId}`
        : `/api/admin/orders/${row.id}?source=${row.source}`
      const res = await fetch(url, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(body),
        credentials: 'include',
      })
      const data = await res.json().catch(() => null)
      if (!res.ok) throw new Error(data?.error || 'Güncelleme hatası')
      const updated = data?.order
      setOrders((prev) =>
        prev.map((o) =>
          o.id === row.id && o.source === row.source
            ? { ...o, status: updated?.status ?? o.status, paymentStatus: updated?.paymentStatus ?? o.paymentStatus }
            : o
        )
      )
    } catch (err) {
      setActionError(`${row.orderId}: ${err instanceof Error ? err.message : 'Güncelleme hatası'}`)
    } finally {
      setUpdatingId(null)
    }
  }

  const filteredOrders = orders.filter((order) => {
    const q = searchQuery.toLowerCase()
    const matchesSearch =
      !q ||
      (order.orderId || '').toLowerCase().includes(q) ||
      (order.customerName || '').toLowerCase().includes(q) ||
      (order.customerEmail || '').toLowerCase().includes(q)
    const matchesStatus =
      !statusFilter ||
      (statusFilter === AWAITING_TRANSFER_FILTER
        ? isAwaitingTransfer(order)
        : statusFilter === OPEN_RETURNS_FILTER
          ? (order.openReturns ?? 0) > 0
          : order.status === statusFilter)
    return matchesSearch && matchesStatus
  })

  const awaitingTransferCount = orders.filter(isAwaitingTransfer).length
  const openReturnsCount = orders.filter((o) => (o.openReturns ?? 0) > 0).length
  const toPrepareCount = orders.filter((o) => o.status === 'PAID').length
  // Yalnızca ödemesi alınmış ve iptal/iade edilmemiş siparişler
  const totalRevenue = orders
    .filter((o) => (o.paymentStatus === 'PAID' || o.paymentStatus === 'paid') && !['CANCELLED', 'RETURNED', 'cancelled', 'returned'].includes(o.status))
    .reduce((sum, o) => sum + (o.total || 0), 0)

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-xl font-bold text-slate-900">Siparişler</h1>
          <p className="text-slate-600 mt-1">
            {loading ? 'Yükleniyor...' : `${orders.length} sipariş · ${fmtTRY(totalRevenue)} tahsil edilen`}
          </p>
        </div>
        <Button
          variant="outline"
          size="sm"
          onClick={() => fetchOrders(true)}
          disabled={refreshing || loading}
          className="w-fit"
        >
          <RefreshCw className={`w-4 h-4 mr-2 ${refreshing ? 'animate-spin' : ''}`} />
          Yenile
        </Button>
      </div>

      {/* Özet satırı */}
      {!loading && (awaitingTransferCount > 0 || toPrepareCount > 0) && (
        <div className="flex flex-col sm:flex-row gap-2">
          {awaitingTransferCount > 0 && (
            <button
              type="button"
              onClick={() => setStatusFilter(AWAITING_TRANSFER_FILTER)}
              className="flex-1 flex items-center gap-3 px-4 py-3 rounded-lg bg-amber-50 border border-amber-200 text-amber-800 text-sm font-medium text-left hover:bg-amber-100"
            >
              <CheckCircle2 className="w-5 h-5 shrink-0 text-amber-600" />
              {awaitingTransferCount} sipariş havale/EFT ödemesi bekliyor — hesaba geçenleri “Ödeme Alındı” ile onaylayın.
            </button>
          )}
          {toPrepareCount > 0 && (
            <button
              type="button"
              onClick={() => setStatusFilter('PAID')}
              className="flex-1 flex items-center gap-3 px-4 py-3 rounded-lg bg-blue-50 border border-blue-200 text-blue-800 text-sm font-medium text-left hover:bg-blue-100"
            >
              <Package className="w-5 h-5 shrink-0 text-blue-600" />
              {toPrepareCount} ödenmiş sipariş hazırlanmayı bekliyor.
            </button>
          )}
        </div>
      )}

      {actionError && (
        <div role="alert" className="px-4 py-3 rounded-lg bg-red-50 border border-red-200 text-red-800 text-sm">
          {actionError}
        </div>
      )}

      <Card className="border-slate-200/80 bg-white shadow-sm">
        <CardHeader className="border-b border-slate-200/80 pb-4">
          <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-3">
            <div>
              <CardTitle className="text-lg font-semibold">Tüm Siparişler</CardTitle>
              <CardDescription className="mt-0.5">
                {filteredOrders.length} sipariş görüntüleniyor
              </CardDescription>
            </div>
          </div>
          {/* Arama + Filtre */}
          <div className="flex flex-col md:flex-row gap-3 pt-3">
            <div className="flex-1 relative">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400 w-4 h-4 pointer-events-none shrink-0" />
              <Input
                type="text"
                placeholder="Sipariş no, müşteri adı veya e-posta ara..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="pl-10 min-w-0 border-slate-200 text-sm"
              />
            </div>
            <div className="flex gap-2 flex-wrap">
              <Button
                variant={statusFilter === null ? 'default' : 'outline'}
                size="sm"
                onClick={() => setStatusFilter(null)}
              >
                Tümü ({orders.length})
              </Button>
              {openReturnsCount > 0 && (
                <Button
                  variant={statusFilter === OPEN_RETURNS_FILTER ? 'default' : 'outline'}
                  size="sm"
                  onClick={() => setStatusFilter(statusFilter === OPEN_RETURNS_FILTER ? null : OPEN_RETURNS_FILTER)}
                >
                  İade talebi ({openReturnsCount})
                </Button>
              )}
              {awaitingTransferCount > 0 && (
                <Button
                  variant={statusFilter === AWAITING_TRANSFER_FILTER ? 'default' : 'outline'}
                  size="sm"
                  onClick={() => setStatusFilter(statusFilter === AWAITING_TRANSFER_FILTER ? null : AWAITING_TRANSFER_FILTER)}
                >
                  Havale bekleyen ({awaitingTransferCount})
                </Button>
              )}
              {FILTER_STATUSES.map((s) => {
                const count = orders.filter((o) => o.status === s || (s === 'pending' && o.status === 'PENDING')).length
                if (count === 0) return null
                return (
                  <Button
                    key={s}
                    variant={statusFilter === s ? 'default' : 'outline'}
                    size="sm"
                    onClick={() => setStatusFilter(statusFilter === s ? null : s)}
                  >
                    {STATUS_LABELS[s]} ({count})
                  </Button>
                )
              })}
            </div>
          </div>
        </CardHeader>

        <CardContent className="p-0">
          {loading ? (
            <div className="flex items-center justify-center py-20">
              <Loader2 className="w-10 h-10 animate-spin text-brand" />
            </div>
          ) : filteredOrders.length === 0 ? (
            <div className="text-center py-16 text-slate-500">
              <Package className="w-14 h-14 mx-auto mb-3 text-slate-300" />
              <p className="font-medium">
                {searchQuery || statusFilter ? 'Kritere uyan sipariş bulunamadı.' : 'Henüz sipariş yok.'}
              </p>
              {(searchQuery || statusFilter) && (
                <Button
                  variant="outline"
                  size="sm"
                  className="mt-3"
                  onClick={() => { setSearchQuery(''); setStatusFilter(null) }}
                >
                  Filtreleri temizle
                </Button>
              )}
            </div>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full min-w-[800px]">
                <thead className="bg-slate-50/80 border-b border-slate-200/80 text-left text-sm text-slate-700">
                  <tr>
                    <th className="py-3 px-4 font-semibold">Sipariş No</th>
                    <th className="py-3 px-4 font-semibold">Müşteri</th>
                    <th className="py-3 px-4 font-semibold">Tutar</th>
                    <th className="py-3 px-4 font-semibold">Durum</th>
                    <th className="py-3 px-4 font-semibold">Ödeme</th>
                    <th className="py-3 px-4 font-semibold">Yöntem</th>
                    <th className="py-3 px-4 font-semibold">Tarih</th>
                    <th className="py-3 px-4 font-semibold">İşlemler</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100">
                  {filteredOrders.map((row) => {
                    const isUpdating = updatingId === row.id
                    return (
                      <tr key={`${row.source}-${row.id}`} className="hover:bg-slate-50/60 transition-colors">
                        <td className="py-3 px-4 font-medium text-slate-900 text-sm">
                          {row.orderId}
                          {row.paymentNotified && isAwaitingTransfer(row) && (
                            <Badge className="ml-2 bg-emerald-100 text-emerald-800 border-0 text-[10px]">Ödeme bildirildi</Badge>
                          )}
                          {(row.openReturns ?? 0) > 0 && (
                            <Link href={`/admin/orders/${row.id}?source=prisma#iade`} className="ml-2 inline-block">
                              <Badge className="bg-orange-100 text-orange-800 border-0 text-[10px]">İade talebi</Badge>
                            </Link>
                          )}
                        </td>
                        <td className="py-3 px-4">
                          <div className="text-sm font-medium text-slate-900">{row.customerName || '—'}</div>
                          {row.customerEmail && (
                            <div className="text-xs text-slate-500 truncate max-w-[200px]">{row.customerEmail}</div>
                          )}
                        </td>
                        <td className="py-3 px-4 font-semibold text-slate-900 tabular-nums">{fmtTRY(row.total)}</td>
                        <td className="py-3 px-4">
                          <Badge className={`text-xs ${STATUS_BADGE_CLASS[row.status] ?? 'bg-slate-100 text-slate-700 border-0'}`}>
                            {STATUS_LABELS[row.status] ?? row.status}
                          </Badge>
                        </td>
                        <td className="py-3 px-4">
                          <Badge
                            variant="outline"
                            className={`text-xs ${row.paymentStatus === 'PAID' ? 'border-green-300 text-green-700' : row.paymentStatus === 'FAILED' ? 'border-red-300 text-red-700' : ''}`}
                          >
                            {PAYMENT_STATUS_LABELS[row.paymentStatus ?? ''] ?? row.paymentStatus ?? '—'}
                          </Badge>
                        </td>
                        <td className="py-3 px-4 text-xs text-slate-600 whitespace-nowrap">
                          {PAYMENT_METHOD_LABELS[row.paymentMethod ?? ''] ?? row.paymentMethod ?? '—'}
                        </td>
                        <td className="py-3 px-4 text-sm text-slate-500 whitespace-nowrap">
                          {row.createdAt
                            ? new Date(row.createdAt).toLocaleDateString('tr-TR', {
                                day: '2-digit',
                                month: 'short',
                                year: 'numeric',
                              })
                            : '—'}
                        </td>
                        <td className="py-3 px-4">
                          <div className="flex items-center gap-2 flex-wrap">
                            <Button asChild variant="outline" size="sm" className="h-7 text-xs">
                              <Link
                                href={`/admin/orders/${row.id}?source=${row.source}&userId=${row.userId ?? ''}`}
                                className="inline-flex items-center gap-1"
                              >
                                <Eye className="w-3.5 h-3.5" />
                                Detay
                              </Link>
                            </Button>
                            {row.source === 'prisma' && isAwaitingTransfer(row) && (
                              <Button
                                size="sm"
                                className="h-7 text-xs bg-green-600 hover:bg-green-700"
                                onClick={() => runQuickAction(row, { action: 'mark_paid' },
                                  `${row.orderId} için ${fmtTRY(row.total)} havale/EFT ödemesi hesaba geçti mi? Müşteriye ödeme onayı ve fatura e-postası gönderilecek.`)}
                                disabled={isUpdating}
                              >
                                {isUpdating ? <Loader2 className="w-3 h-3 animate-spin" /> : 'Ödeme Alındı'}
                              </Button>
                            )}
                            {row.source === 'prisma' && row.status === 'PAID' && (
                              <Button
                                size="sm"
                                className="h-7 text-xs bg-indigo-600 hover:bg-indigo-700"
                                onClick={() => runQuickAction(row, { action: 'status', status: 'PICKING' })}
                                disabled={isUpdating}
                              >
                                {isUpdating ? <Loader2 className="w-3 h-3 animate-spin" /> : 'Hazırlamaya Al'}
                              </Button>
                            )}
                            {row.source === 'prisma' && row.status === 'PICKING' && (
                              <Button asChild size="sm" className="h-7 text-xs bg-purple-600 hover:bg-purple-700">
                                <Link href={`/admin/orders/${row.id}?source=prisma#kargo`}>Kargoya Ver</Link>
                              </Button>
                            )}
                          </div>
                        </td>
                      </tr>
                    )
                  })}
                </tbody>
              </table>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  )
}
