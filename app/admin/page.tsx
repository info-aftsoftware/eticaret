'use client'

import React, { useState, useEffect } from 'react'
import Link from 'next/link'
import { useRouter } from 'next/navigation'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import {
  Package,
  ShoppingCart,
  DollarSign,
  Search,
  Eye,
  Clock,
  Loader2,
  ArrowRight,
  Layers,
  Tag,
  AlertTriangle,
  TrendingUp,
  Calendar,
  CheckCircle,
  XCircle,
  Truck,
} from 'lucide-react'
import { fmtTRY } from '@/lib/format'

type SiteStats = {
  totalProducts: number
  outOfStockProducts: number
  activeCoupons: number
  todayOrders: number
  pendingOrders: number
  awaitingPayment?: number
  toShip?: number
  totalOrders: number
  todayRevenue: number
  monthRevenue: number
  topProducts?: { productId: string | null; name: string; quantity: number; revenue: number }[]
  lowStock?: { id: string; name: string; stock: number; waiting: number }[]
}

type OrderRow = {
  id: string
  source: 'prisma' | 'firestore'
  orderId: string
  customerName?: string
  customerEmail?: string
  total: number
  status: string
  paymentStatus?: string
  createdAt: string
  userId?: string | null
}

const STATUS_LABELS: Record<string, string> = {
  pending: 'Beklemede', PENDING: 'Beklemede',
  confirmed: 'Onaylandı', CONFIRMED: 'Onaylandı',
  processing: 'İşleniyor', PROCESSING: 'İşleniyor',
  shipped: 'Kargoda', SHIPPED: 'Kargoda',
  delivered: 'Teslim Edildi', DELIVERED: 'Teslim Edildi',
  cancelled: 'İptal', CANCELLED: 'İptal',
  PAID: 'Ödendi', paid: 'Ödendi',
  failed: 'Başarısız', FAILED: 'Başarısız',
  refunded: 'İade', REFUNDED: 'İade',
}

const STATUS_STYLES: Record<string, string> = {
  pending: 'bg-amber-100 text-amber-700', PENDING: 'bg-amber-100 text-amber-700',
  confirmed: 'bg-blue-100 text-blue-700', CONFIRMED: 'bg-blue-100 text-blue-700',
  processing: 'bg-indigo-100 text-indigo-700', PROCESSING: 'bg-indigo-100 text-indigo-700',
  shipped: 'bg-purple-100 text-purple-700', SHIPPED: 'bg-purple-100 text-purple-700',
  delivered: 'bg-green-100 text-green-700', DELIVERED: 'bg-green-100 text-green-700',
  cancelled: 'bg-red-100 text-red-700', CANCELLED: 'bg-red-100 text-red-700',
  PAID: 'bg-green-100 text-green-700', paid: 'bg-green-100 text-green-700',
}

export default function AdminPage() {
  const router = useRouter()
  const [orders, setOrders] = useState<OrderRow[]>([])
  const [loading, setLoading] = useState(true)
  const [siteStats, setSiteStats] = useState<SiteStats | null>(null)
  const [searchQuery, setSearchQuery] = useState('')
  const [statusFilter, setStatusFilter] = useState<string | null>(null)
  const [updatingId, setUpdatingId] = useState<string | null>(null)

  useEffect(() => {
    fetch('/api/admin/stats', { credentials: 'include' })
      .then((r) => r.ok ? r.json() : null)
      .then((d) => d && setSiteStats(d))
      .catch(() => { })
  }, [])

  useEffect(() => {
    ; (async () => {
      try {
        const res = await fetch('/api/admin/orders', { credentials: 'include' })
        if (!res.ok) throw new Error('API hatası')
        const data: { prisma: any[]; firestore: any[] } = await res.json()
        const rows: OrderRow[] = []
        for (const o of data.prisma ?? []) {
          rows.push({ id: o.id, source: 'prisma', orderId: o.orderNo || o.id, customerName: o.shippingName || o.user?.name, customerEmail: o.user?.email || o.shippingEmail, total: o.total ?? 0, status: o.status ?? 'PENDING', paymentStatus: o.paymentStatus, createdAt: o.createdAt ?? '', userId: o.userId ?? null })
        }
        for (const o of data.firestore ?? []) {
          const customer = o.customer || {}
          rows.push({ id: o.id, source: 'firestore', orderId: o.orderId || o.id, customerName: customer.name, customerEmail: customer.email, total: o.pricing?.total ?? 0, status: o.status ?? 'pending', paymentStatus: o.paymentStatus, createdAt: o.createdAt ?? '', userId: o.userId ?? null })
        }
        rows.sort((a, b) => (b.createdAt || '').localeCompare(a.createdAt || ''))
        setOrders(rows)
      } catch { setOrders([]) }
      finally { setLoading(false) }
    })()
  }, [router])

  const filteredOrders = orders.filter((o) => {
    const q = searchQuery.toLowerCase()
    const matchSearch = !q || (o.orderId || '').toLowerCase().includes(q) || (o.customerName || '').toLowerCase().includes(q) || (o.customerEmail || '').toLowerCase().includes(q)
    const matchStatus = !statusFilter || o.status?.toLowerCase() === statusFilter?.toLowerCase()
    return matchSearch && matchStatus
  })

  const totalOrders = siteStats?.totalOrders ?? orders.length
  const pendingOrders = siteStats?.pendingOrders ?? orders.filter((o) => o.status === 'pending' || o.status === 'PENDING').length
  const monthRevenue = siteStats?.monthRevenue ?? 0
  const todayOrders = siteStats?.todayOrders ?? 0

  const handleStatusChange = async (row: OrderRow, newStatus: string) => {
    setUpdatingId(row.id)
    try {
      const url = row.source === 'firestore' && row.userId
        ? `/api/admin/orders/${row.id}?source=firestore&userId=${row.userId}`
        : `/api/admin/orders/${row.id}?source=${row.source}`
      await fetch(url, { method: 'PATCH', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ status: newStatus }), credentials: 'include' })
      setOrders((prev) => prev.map((o) => o.id === row.id && o.source === row.source ? { ...o, status: newStatus } : o))
    } catch { }
    finally { setUpdatingId(null) }
  }

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-[60vh]">
        <Loader2 className="w-8 h-8 animate-spin text-slate-400" />
      </div>
    )
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div>
        <h1 className="text-2xl font-bold text-slate-900">Dashboard</h1>
        <p className="text-slate-500 text-sm mt-0.5">Hoş geldiniz, işte günlük özet.</p>
      </div>

      {/* KPI Kartları */}
      <div className="grid grid-cols-2 xl:grid-cols-4 gap-6">
        {[
          { label: 'Toplam Sipariş', value: totalOrders, subtext: 'Tüm zamanlar', icon: ShoppingCart, gradient: 'from-blue-600/90 to-indigo-700/90', shadow: 'shadow-blue-500/20' },
          { label: 'Bu Ay Gelir', value: fmtTRY(monthRevenue), subtext: `Bugün: ${fmtTRY(siteStats?.todayRevenue ?? 0)}`, icon: TrendingUp, gradient: 'from-emerald-500/90 to-teal-600/90', shadow: 'shadow-emerald-500/20' },
          { label: 'Bekleyen', value: pendingOrders, subtext: `Havale bekleyen: ${siteStats?.awaitingPayment ?? 0} · Kargolanacak: ${siteStats?.toShip ?? 0}`, icon: Clock, gradient: pendingOrders > 0 ? 'from-amber-500/90 to-orange-600/90' : 'from-slate-500/90 to-slate-600/90', shadow: pendingOrders > 0 ? 'shadow-amber-500/20' : 'shadow-slate-500/20' },
          { label: 'Bugün', value: todayOrders, subtext: 'Son 24 saat', icon: Calendar, gradient: 'from-violet-600/90 to-fuchsia-700/90', shadow: 'shadow-violet-500/20' }
        ].map((kpi, i) => (
          <div key={i} className={`relative overflow-hidden rounded-2xl bg-gradient-to-br ${kpi.gradient} p-6 text-white shadow-xl ${kpi.shadow} backdrop-blur-md border border-white/10 group transition-all duration-300 hover:-translate-y-1 hover:shadow-2xl`}>
            <div className="absolute -right-6 -top-6 w-32 h-32 rounded-full bg-white/10 blur-2xl group-hover:bg-white/20 transition-colors" />
            <div className="absolute -left-6 -bottom-6 w-32 h-32 rounded-full bg-white/5 blur-2xl group-hover:bg-white/15 transition-colors" />
            <div className="relative z-10">
              <div className="flex items-center justify-between mb-4">
                <span className="text-white/80 text-xs font-semibold uppercase tracking-wider">{kpi.label}</span>
                <div className="w-10 h-10 rounded-xl bg-white/15 flex items-center justify-center backdrop-blur-sm border border-white/10">
                  <kpi.icon className="w-5 h-5 text-white" />
                </div>
              </div>
              <p className="text-4xl font-bold tracking-tight mb-1">{kpi.value}</p>
              <p className="text-white/70 text-sm font-medium">{kpi.subtext}</p>
            </div>
          </div>
        ))}
      </div>

      {/* Katalog + Hızlı Linkler */}
      <div className="grid grid-cols-1 xl:grid-cols-3 gap-6">
        {/* Ürün istatistikleri */}
        <div className="xl:col-span-2 grid grid-cols-1 md:grid-cols-3 gap-6">
          {[
            { label: 'Ürünler', value: siteStats?.totalProducts ?? '—', link: '/admin/products', linkText: 'Yönet', icon: Package, color: 'blue' },
            { label: 'Stoksuz', value: siteStats?.outOfStockProducts ?? '—', link: '/admin/products?stock=outofstock', linkText: 'Güncelle', icon: AlertTriangle, color: (siteStats?.outOfStockProducts ?? 0) > 0 ? 'red' : 'slate' },
            { label: 'Kupon', value: siteStats?.activeCoupons ?? '—', link: '/admin/indirimler', linkText: 'Yönet', icon: Tag, color: 'amber' }
          ].map((stat, i) => (
            <div key={i} className={`bg-white rounded-2xl border ${stat.color === 'red' ? 'border-red-200 bg-red-50/50' : 'border-slate-200'} shadow-sm p-6 hover:shadow-md transition-shadow`}>
              <div className="flex items-center justify-between mb-6">
                <span className="text-slate-500 text-xs font-bold uppercase tracking-wider">{stat.label}</span>
                <div className={`w-12 h-12 rounded-xl flex items-center justify-center ${stat.color === 'red' ? 'bg-red-100 text-red-600' : stat.color === 'amber' ? 'bg-amber-100 text-amber-600' : stat.color === 'blue' ? 'bg-blue-100 text-blue-600' : 'bg-slate-100 text-slate-500'}`}>
                  <stat.icon className="w-6 h-6" />
                </div>
              </div>
              <p className={`text-4xl font-black mb-3 ${stat.color === 'red' ? 'text-red-700' : 'text-slate-800'}`}>{stat.value}</p>
              <Link href={stat.link} className={`text-sm font-semibold inline-flex items-center gap-1.5 transition-colors ${stat.color === 'red' ? 'text-red-600 hover:text-red-700' : stat.color === 'amber' ? 'text-amber-600 hover:text-amber-700' : 'text-blue-600 hover:text-blue-700'}`}>
                {stat.linkText} <ArrowRight className="w-4 h-4" />
              </Link>
            </div>
          ))}
        </div>

        {/* Hızlı İşlemler */}
        <div className="bg-white rounded-2xl border border-slate-100 shadow-sm p-5">
          <p className="text-sm font-semibold text-slate-800 mb-4">Hızlı İşlemler</p>
          <div className="space-y-2">
            {[
              { href: '/admin/orders', label: 'Siparişler', icon: ShoppingCart, badge: pendingOrders > 0 ? pendingOrders : null, color: 'text-blue-600 bg-blue-50' },
              { href: '/admin/products', label: 'Ürün Yönetimi', icon: Package, color: 'text-slate-600 bg-slate-100' },
              { href: '/admin/urunler', label: 'Stok Yönetimi', icon: Layers, color: 'text-emerald-600 bg-emerald-50' },
              { href: '/admin/istatistikler', label: 'İstatistikler', icon: TrendingUp, color: 'text-violet-600 bg-violet-50' },
            ].map((item) => {
              const Icon = item.icon
              return (
                <Link key={item.href} href={item.href} className="flex items-center gap-3 p-2.5 rounded-xl hover:bg-slate-50 transition-colors group">
                  <div className={`w-8 h-8 rounded-lg flex items-center justify-center ${item.color}`}>
                    <Icon className="w-4 h-4" />
                  </div>
                  <span className="text-sm font-medium text-slate-700 flex-1">{item.label}</span>
                  {item.badge ? (
                    <span className="text-xs font-bold bg-amber-100 text-amber-700 rounded-full px-2 py-0.5">{item.badge}</span>
                  ) : (
                    <ArrowRight className="w-4 h-4 text-slate-300 group-hover:text-slate-500 transition-colors" />
                  )}
                </Link>
              )
            })}
          </div>
        </div>
      </div>

      {/* Satış ve stok raporu */}
      {siteStats && (
        <div className="grid gap-6 lg:grid-cols-2">
          <div className="bg-white rounded-3xl border border-slate-100 shadow-xl shadow-slate-200/40 p-6">
            <h2 className="text-lg font-bold text-slate-800 mb-1">En Çok Satanlar</h2>
            <p className="text-xs text-slate-500 mb-4">Son 30 gün · ödenmiş siparişler</p>
            {(siteStats.topProducts ?? []).length === 0 ? (
              <p className="text-sm text-slate-500">Henüz satış yok.</p>
            ) : (
              <ol className="space-y-2">
                {siteStats.topProducts!.map((p, i) => (
                  <li key={p.productId ?? p.name} className="flex items-center justify-between gap-3 text-sm">
                    <span className="min-w-0 truncate">
                      <span className="text-slate-400 mr-2">{i + 1}.</span>
                      {p.productId ? <Link href={`/products/${p.productId}`} target="_blank" className="hover:underline">{p.name}</Link> : p.name}
                    </span>
                    <span className="shrink-0 tabular-nums text-slate-700">{p.quantity} adet · {fmtTRY(p.revenue)}</span>
                  </li>
                ))}
              </ol>
            )}
          </div>
          <div className="bg-white rounded-3xl border border-slate-100 shadow-xl shadow-slate-200/40 p-6">
            <h2 className="text-lg font-bold text-slate-800 mb-1">Düşük Stok</h2>
            <p className="text-xs text-slate-500 mb-4">Stok ≤ 5 · “Stok gelince haber ver” bekleyen müşteri sayısıyla</p>
            {(siteStats.lowStock ?? []).length === 0 ? (
              <p className="text-sm text-slate-500">Düşük stoklu ürün yok.</p>
            ) : (
              <ul className="space-y-2">
                {siteStats.lowStock!.map((p) => (
                  <li key={p.id} className="flex items-center justify-between gap-3 text-sm">
                    <span className="min-w-0 truncate">{p.name}</span>
                    <span className="shrink-0 flex items-center gap-2">
                      {p.waiting > 0 && <span className="rounded-full bg-blue-100 text-blue-800 px-2 py-0.5 text-xs">{p.waiting} bekleyen</span>}
                      <span className={`rounded-full px-2 py-0.5 text-xs ${p.stock === 0 ? 'bg-red-100 text-red-800' : 'bg-amber-100 text-amber-800'}`}>
                        {p.stock === 0 ? 'Tükendi' : `${p.stock} adet`}
                      </span>
                    </span>
                  </li>
                ))}
              </ul>
            )}
          </div>
        </div>
      )}

      {/* Son Siparişler */}
      <div className="bg-white rounded-3xl border border-slate-100 shadow-xl shadow-slate-200/40 overflow-hidden">
        <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between p-6 sm:px-8 border-b border-slate-100 bg-slate-50/50">
          <div>
            <h2 className="text-lg font-bold text-slate-800">Son Siparişler</h2>
            <p className="text-sm font-medium text-slate-500 mt-1">{filteredOrders.length} sipariş bulundu</p>
          </div>
          <div className="mt-4 sm:mt-0 flex gap-3 w-full sm:w-auto">
            <Link href="/admin/orders" className="shrink-0 flex items-center justify-center gap-2 text-sm font-semibold text-blue-600 bg-blue-50/80 hover:bg-blue-100 px-5 py-2.5 rounded-xl transition-all w-full sm:w-auto">
              Tümünü Gör <ArrowRight className="w-4 h-4" />
            </Link>
          </div>
        </div>

        {/* Arama + Filtreler */}
        <div className="flex flex-col xl:flex-row gap-4 p-6 sm:px-8 border-b border-slate-50 bg-white">
          <div className="relative w-full xl:w-96 shrink-0">
            <Search className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400 pointer-events-none" />
            <Input type="text" placeholder="Sipariş No, İsim veya E-posta ara..." value={searchQuery} onChange={(e) => setSearchQuery(e.target.value)} className="pl-11 h-11 text-sm bg-slate-50/50 border-slate-200 hover:border-slate-300 focus:bg-white rounded-xl shadow-sm transition-all" />
          </div>
          <div className="flex gap-2 overflow-x-auto pb-2 xl:pb-0 scrollbar-hide flex-1">
            {[null, 'pending', 'confirmed', 'processing', 'shipped', 'delivered'].map((s) => (
              <button key={s ?? 'all'} onClick={() => setStatusFilter(s)} className={`shrink-0 px-4 py-2 rounded-xl text-sm font-semibold transition-all ${statusFilter === s ? 'bg-slate-800 text-white shadow-md shadow-slate-800/20' : 'bg-slate-50 text-slate-600 border border-slate-200 hover:border-slate-300 hover:bg-slate-100'}`}>
                {s ? STATUS_LABELS[s] : 'Tümü'}
              </button>
            ))}
          </div>
        </div>

        {filteredOrders.length === 0 ? (
          <div className="flex flex-col items-center justify-center py-20 px-6">
            <div className="w-20 h-20 rounded-full bg-slate-50 flex items-center justify-center mb-4">
              <Package className="w-10 h-10 text-slate-300" />
            </div>
            <p className="text-lg font-bold text-slate-700">Sipariş Bulunamadı</p>
            <p className="text-sm font-medium text-slate-500 mt-2 text-center max-w-md">Seçili filtrelere uygun sipariş bulunamadı. Lütfen filtreleri değiştirerek tekrar deneyin.</p>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left border-collapse">
              <thead>
                <tr className="bg-slate-50/80 border-y border-slate-100">
                  <th className="px-8 py-4 text-xs font-bold text-slate-500 uppercase tracking-wider">Sipariş</th>
                  <th className="px-8 py-4 text-xs font-bold text-slate-500 uppercase tracking-wider">Müşteri</th>
                  <th className="px-8 py-4 text-xs font-bold text-slate-500 uppercase tracking-wider">Tutar</th>
                  <th className="px-8 py-4 text-xs font-bold text-slate-500 uppercase tracking-wider">Durum</th>
                  <th className="px-8 py-4 text-xs font-bold text-slate-500 uppercase tracking-wider">Tarih</th>
                  <th className="px-8 py-4 text-xs font-bold text-slate-500 uppercase tracking-wider text-right">İşlemler</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100/60">
                {filteredOrders.slice(0, 20).map((row) => (
                  <tr key={`${row.source}-${row.id}`} className="hover:bg-slate-50/80 transition-colors group">
                    <td className="px-8 py-5">
                      <span className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-slate-100/80 text-sm font-bold text-slate-700 border border-slate-200">
                        {row.orderId}
                      </span>
                    </td>
                    <td className="px-8 py-5">
                      <div className="flex flex-col">
                        <span className="text-sm font-bold text-slate-800 leading-tight">{row.customerName || 'İsimsiz Müşteri'}</span>
                        {row.customerEmail && <span className="text-xs font-medium text-slate-500 max-w-[200px] truncate mt-1">{row.customerEmail}</span>}
                      </div>
                    </td>
                    <td className="px-8 py-5">
                      <span className="text-[15px] font-black text-slate-800 tabular-nums">{fmtTRY(row.total)}</span>
                    </td>
                    <td className="px-8 py-5">
                      <span className={`inline-flex items-center px-3 py-1.5 rounded-xl text-xs font-bold border ${STATUS_STYLES[row.status] ? STATUS_STYLES[row.status].replace('bg-', 'bg-opacity-10 border-').replace('text-', 'text-opacity-90 ') : 'bg-slate-100 text-slate-600 border-slate-200'}`}>
                        <span className="w-1.5 h-1.5 rounded-full bg-current mr-2 opacity-75"></span>
                        {STATUS_LABELS[row.status] ?? row.status}
                      </span>
                    </td>
                    <td className="px-8 py-5 text-sm font-medium text-slate-500 whitespace-nowrap">
                      {row.createdAt ? new Date(row.createdAt).toLocaleDateString('tr-TR', { day: '2-digit', month: 'short', year: 'numeric' }) : '—'}
                    </td>
                    <td className="px-8 py-5 text-right">
                      <div className="flex items-center justify-end gap-2 opacity-100 lg:opacity-0 lg:group-hover:opacity-100 transition-opacity">
                        <Link href={`/admin/orders/${row.id}?source=${row.source}&userId=${row.userId ?? ''}`} title="Detayı Gör" className="w-9 h-9 flex items-center justify-center rounded-xl bg-slate-100 text-slate-600 hover:bg-slate-200 hover:text-slate-800 transition-colors">
                          <Eye className="w-4 h-4" />
                        </Link>
                        {(row.status === 'pending' || row.status === 'PENDING') && (
                          <button onClick={() => handleStatusChange(row, 'confirmed')} disabled={updatingId === row.id} title="Siparişi Onayla" className="w-9 h-9 flex items-center justify-center rounded-xl bg-emerald-50 text-emerald-600 hover:bg-emerald-500 hover:text-white transition-all disabled:opacity-50 border border-emerald-100 hover:border-transparent">
                            {updatingId === row.id ? <Loader2 className="w-4 h-4 animate-spin" /> : <CheckCircle className="w-4 h-4" />}
                          </button>
                        )}
                        {row.status === 'confirmed' && (
                          <button onClick={() => handleStatusChange(row, 'processing')} disabled={updatingId === row.id} title="İşleme Al" className="px-3 h-9 flex items-center gap-1.5 rounded-xl bg-blue-50 text-blue-600 hover:bg-blue-500 hover:text-white transition-all disabled:opacity-50 text-xs font-bold border border-blue-100 hover:border-transparent">
                            {updatingId === row.id ? <Loader2 className="w-4 h-4 animate-spin" /> : 'İşle'}
                          </button>
                        )}
                        {row.status === 'processing' && (
                          <button onClick={() => handleStatusChange(row, 'shipped')} disabled={updatingId === row.id} title="Kargoya Ver" className="px-3 h-9 flex items-center gap-1.5 rounded-xl bg-violet-50 text-violet-600 hover:bg-violet-500 hover:text-white transition-all disabled:opacity-50 text-xs font-bold border border-violet-100 hover:border-transparent">
                            {updatingId === row.id ? <Loader2 className="w-4 h-4 animate-spin" /> : <><Truck className="w-4 h-4" /> Kargo</>}
                          </button>
                        )}
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
            {filteredOrders.length > 20 && (
              <div className="px-8 py-5 border-t border-slate-100 text-center bg-slate-50/50">
                <Link href="/admin/orders" className="text-sm font-bold text-blue-600 hover:text-blue-700 bg-white px-5 py-2.5 rounded-xl shadow-sm border border-slate-200 inline-block transition-all hover:shadow-md">
                  +{filteredOrders.length - 20} Siparişi Daha Gör
                </Link>
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  )
}
