'use client'

import React, { useCallback, useEffect, useState } from 'react'
import Link from 'next/link'
import {
  ShoppingCart,
  TrendingUp,
  Banknote,
  PackageCheck,
  Truck,
  ArrowRight,
  AlertTriangle,
  Star,
  MessageCircle,
  Undo2,
  BellRing,
  Package,
  RefreshCw,
  Trophy,
  CheckCircle2,
  XCircle,
} from 'lucide-react'
import { fmtTRY } from '@/lib/format'
import { Btn, BtnLink, EmptyState, Panel, PanelHeader, Pill, Spinner, timeAgo } from '@/components/admin/ui'
import { OrderQuickActions } from '@/components/admin/OrderQuickActions'
import { useAdminLive } from '@/components/admin/AdminLiveProvider'
import { ORDER_STATUS_TONE, PAYMENT_STATUS_TONE, methodLabel, paymentLabel, statusLabel, type AdminOrderRow } from '@/components/admin/order-meta'

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

function Kpi({ label, value, sub, icon: Icon, accent }: { label: string; value: React.ReactNode; sub?: React.ReactNode; icon: React.ComponentType<{ className?: string }>; accent?: boolean }) {
  return (
    <Panel className={accent ? 'p-4 sm:p-5 border-[#f5dc85] bg-[#fffbeb]' : 'p-4 sm:p-5'}>
      <div className="flex items-start justify-between gap-3">
        <p className="text-[12px] font-medium text-[#5d6e80]">{label}</p>
        <span className={accent ? 'w-8 h-8 rounded-lg bg-[#f5b400] text-[#111] flex items-center justify-center' : 'w-8 h-8 rounded-lg bg-[#f1f4f8] text-[#0b2540] flex items-center justify-center'}>
          <Icon className="w-4 h-4" />
        </span>
      </div>
      <p className="text-2xl sm:text-[28px] font-bold text-[#121926] tracking-tight mt-1 tabular-nums">{value}</p>
      {sub && <p className="text-xs text-[#5d6e80] mt-1">{sub}</p>}
    </Panel>
  )
}

export default function AdminDashboardPage() {
  const { counts, tick, refresh: refreshLive } = useAdminLive()
  const [stats, setStats] = useState<SiteStats | null>(null)
  const [orders, setOrders] = useState<AdminOrderRow[] | null>(null)
  const [loadError, setLoadError] = useState(false)
  const [reloading, setReloading] = useState(false)

  const load = useCallback(async () => {
    setReloading(true)
    try {
      const [s, o] = await Promise.all([
        fetch('/api/admin/stats', { credentials: 'include' }).then((r) => (r.ok ? r.json() : null)),
        fetch('/api/admin/orders?pageSize=8', { credentials: 'include' }).then((r) => (r.ok ? r.json() : null)),
      ])
      if (s) setStats(s)
      setOrders(o?.orders ?? [])
      setLoadError(!s || !o)
    } catch {
      setLoadError(true)
      setOrders((prev) => prev ?? [])
    } finally {
      setReloading(false)
    }
  }, [])

  useEffect(() => {
    load()
  }, [load, tick])

  const afterAction = () => {
    load()
    refreshLive()
  }

  const todo = [
    { show: (counts?.toPrepare ?? 0) > 0, n: counts?.toPrepare ?? 0, label: 'ödenmiş sipariş hazırlanmayı bekliyor', href: '/admin/orders?tab=to_prepare', icon: PackageCheck, tone: 'yellow' as const },
    { show: (counts?.cancelRequests ?? 0) > 0, n: counts?.cancelRequests ?? 0, label: 'iptal talebi yanıt bekliyor', href: '/admin/orders?tab=cancel_requests', icon: XCircle, tone: 'yellow' as const },
    { show: (counts?.picking ?? 0) > 0, n: counts?.picking ?? 0, label: 'sipariş kargoya verilmeyi bekliyor', href: '/admin/orders?tab=picking', icon: Truck, tone: 'navy' as const },
    { show: (counts?.paymentNotices ?? 0) > 0, n: counts?.paymentNotices ?? 0, label: 'havale bildirimi onay bekliyor', href: '/admin/orders?tab=awaiting_payment', icon: BellRing, tone: 'yellow' as const },
    { show: (counts?.awaitingPayment ?? 0) > 0, n: counts?.awaitingPayment ?? 0, label: 'sipariş havale/EFT ödemesi bekliyor', href: '/admin/orders?tab=awaiting_payment', icon: Banknote, tone: 'slate' as const },
    { show: (counts?.openReturns ?? 0) > 0, n: counts?.openReturns ?? 0, label: 'açık iade talebi', href: '/admin/orders?tab=open_returns', icon: Undo2, tone: 'yellow' as const },
    { show: (counts?.pendingReviews ?? 0) > 0, n: counts?.pendingReviews ?? 0, label: 'yorum onay bekliyor', href: '/admin/yorumlar', icon: Star, tone: 'slate' as const },
    { show: (counts?.pendingQuestions ?? 0) > 0, n: counts?.pendingQuestions ?? 0, label: 'soru yanıt bekliyor', href: '/admin/sorular', icon: MessageCircle, tone: 'slate' as const },
    { show: (stats?.outOfStockProducts ?? 0) > 0, n: stats?.outOfStockProducts ?? 0, label: 'ürünün stoğu tükendi', href: '/admin/products?stock=out', icon: AlertTriangle, tone: 'slate' as const },
  ].filter((t) => t.show)

  const today = new Date().toLocaleDateString('tr-TR', { weekday: 'long', day: 'numeric', month: 'long', year: 'numeric' })

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-end sm:justify-between gap-3">
        <div>
          <h1 className="text-xl sm:text-2xl font-bold text-[#121926] tracking-tight">Genel Bakış</h1>
          <p className="text-sm text-[#5d6e80] mt-1 first-letter:uppercase">{today}</p>
        </div>
        <div className="flex gap-2">
          <Btn variant="outline" onClick={afterAction} loading={reloading}>
            {!reloading && <RefreshCw />}
            Yenile
          </Btn>
          <BtnLink href="/admin/orders" variant="primary">
            <ShoppingCart />
            Siparişler
          </BtnLink>
        </div>
      </div>

      {loadError && (
        <div role="alert" className="rounded-lg border border-red-200 bg-red-50 text-red-800 text-sm px-4 py-3">
          Veriler yüklenemedi. Oturumunuzun süresi dolmuş olabilir; sayfayı yenileyin.
        </div>
      )}

      <div className="grid grid-cols-2 xl:grid-cols-4 gap-3 sm:gap-4">
        <Kpi label="Bu ay ciro" value={stats ? fmtTRY(stats.monthRevenue) : '—'} sub={stats ? `Bugün ${fmtTRY(stats.todayRevenue)}` : ' '} icon={TrendingUp} />
        <Kpi label="Bugünkü siparişler" value={stats?.todayOrders ?? '—'} sub={stats ? `Toplam ${stats.totalOrders} sipariş` : ' '} icon={ShoppingCart} />
        <Kpi
          label="Hazırlanacak / kargolanacak"
          value={counts ? `${counts.toPrepare} / ${counts.picking}` : '—'}
          sub="Ödenmiş, gönderilmemiş"
          icon={PackageCheck}
          accent={(counts?.toPrepare ?? 0) + (counts?.picking ?? 0) > 0}
        />
        <Kpi label="Havale bekleyen" value={counts?.awaitingPayment ?? '—'} sub={counts?.paymentNotices ? `${counts.paymentNotices} ödeme bildirimi` : 'Müşteri ödemesi bekleniyor'} icon={Banknote} />
      </div>

      <div className="grid gap-4 sm:gap-6 xl:grid-cols-3">
        <Panel className="xl:col-span-2 overflow-hidden">
          <PanelHeader
            title="Son siparişler"
            description="Durumuna göre hızlı işlem yapabilirsiniz"
            icon={ShoppingCart}
            actions={
              <BtnLink href="/admin/orders" variant="ghost" size="xs">
                Tümü <ArrowRight />
              </BtnLink>
            }
          />
          {orders === null ? (
            <Spinner />
          ) : orders.length === 0 ? (
            <EmptyState icon={Package} title="Henüz sipariş yok" />
          ) : (
            <ul className="divide-y divide-[#eef2f6]">
              {orders.map((o) => (
                <li key={o.id} className="px-4 sm:px-5 py-3 flex flex-col md:flex-row md:items-center gap-2 md:gap-4 hover:bg-[#fafbfd]">
                  <Link href={`/admin/orders/${o.id}`} className="min-w-0 flex-1 group">
                    <div className="flex items-center gap-2 flex-wrap">
                      <span className="font-mono text-[13px] font-semibold text-[#0b2540] group-hover:underline">{o.orderNo}</span>
                      <Pill tone={ORDER_STATUS_TONE[o.status] ?? 'slate'} dot>{statusLabel(o.status)}</Pill>
                      <Pill tone={PAYMENT_STATUS_TONE[o.paymentStatus] ?? 'slate'}>{paymentLabel(o.paymentStatus)}</Pill>
                      {o.paymentNotified && o.paymentStatus !== 'PAID' && <Pill tone="yellow">Ödeme bildirildi</Pill>}
                      {o.cancelRequested && <Pill tone="red">İptal talebi</Pill>}
                      {o.openReturns > 0 && <Pill tone="orange">İade talebi</Pill>}
                    </div>
                    <p className="text-[13px] text-[#5d6e80] mt-0.5 truncate">
                      {o.customerName} · {methodLabel(o.paymentMethod)} · {timeAgo(o.createdAt)}
                    </p>
                  </Link>
                  <div className="flex items-center justify-between md:justify-end gap-3 shrink-0">
                    <span className="text-sm font-semibold text-[#121926] tabular-nums">{fmtTRY(o.total)}</span>
                    <OrderQuickActions order={o} onDone={afterAction} compact />
                  </div>
                </li>
              ))}
            </ul>
          )}
        </Panel>

        <Panel className="overflow-hidden">
          <PanelHeader title="Yapılacaklar" description="İşlem bekleyen kayıtlar" icon={CheckCircle2} />
          {counts === null ? (
            <Spinner />
          ) : todo.length === 0 ? (
            <EmptyState icon={CheckCircle2} title="Her şey yolunda" description="Bekleyen iş yok." />
          ) : (
            <ul className="p-2">
              {todo.map((t) => (
                <li key={t.label}>
                  <Link href={t.href} className="flex items-center gap-3 px-3 py-2.5 rounded-lg hover:bg-[#f5f7fa] group">
                    <span
                      className={
                        t.tone === 'yellow'
                          ? 'w-8 h-8 rounded-lg bg-[#fff6d6] text-[#a57900] flex items-center justify-center shrink-0'
                          : t.tone === 'navy'
                            ? 'w-8 h-8 rounded-lg bg-[#e8eef6] text-[#0b2540] flex items-center justify-center shrink-0'
                            : 'w-8 h-8 rounded-lg bg-[#f1f4f8] text-[#5d6e80] flex items-center justify-center shrink-0'
                      }
                    >
                      <t.icon className="w-4 h-4" />
                    </span>
                    <span className="text-[13px] text-[#20384e] flex-1">
                      <strong className="text-[#121926] tabular-nums">{t.n}</strong> {t.label}
                    </span>
                    <ArrowRight className="w-4 h-4 text-[#b9c3cf] group-hover:text-[#0b2540]" />
                  </Link>
                </li>
              ))}
            </ul>
          )}
        </Panel>
      </div>

      <div className="grid gap-4 sm:gap-6 lg:grid-cols-2">
        <Panel className="overflow-hidden">
          <PanelHeader title="En çok satanlar" description="Son 30 gün · ödenmiş siparişler" icon={Trophy} />
          {!stats ? (
            <Spinner />
          ) : (stats.topProducts ?? []).length === 0 ? (
            <EmptyState icon={Trophy} title="Henüz satış yok" />
          ) : (
            <ol className="divide-y divide-[#eef2f6]">
              {stats.topProducts!.map((p, i) => (
                <li key={p.productId ?? p.name} className="flex items-center gap-3 px-4 sm:px-5 py-2.5 text-[13px]">
                  <span className="w-6 h-6 rounded-md bg-[#f1f4f8] text-[#5d6e80] text-xs font-semibold flex items-center justify-center shrink-0">{i + 1}</span>
                  <span className="min-w-0 flex-1 truncate text-[#20384e]">
                    {p.productId ? (
                      <Link href={`/admin/products/duzenle?id=${encodeURIComponent(p.productId)}`} className="hover:underline">{p.name}</Link>
                    ) : (
                      p.name
                    )}
                  </span>
                  <span className="shrink-0 tabular-nums text-[#5d6e80]">{p.quantity} adet</span>
                  <span className="shrink-0 tabular-nums font-semibold text-[#121926] w-24 text-right">{fmtTRY(p.revenue)}</span>
                </li>
              ))}
            </ol>
          )}
        </Panel>
        <Panel className="overflow-hidden">
          <PanelHeader
            title="Düşük stok"
            description="Stok ≤ 5 · stok bekleyen müşteri sayısıyla"
            icon={AlertTriangle}
            actions={
              <BtnLink href="/admin/products?stock=low" variant="ghost" size="xs">
                Stok yönetimi <ArrowRight />
              </BtnLink>
            }
          />
          {!stats ? (
            <Spinner />
          ) : (stats.lowStock ?? []).length === 0 ? (
            <EmptyState icon={Package} title="Düşük stoklu ürün yok" />
          ) : (
            <ul className="divide-y divide-[#eef2f6]">
              {stats.lowStock!.map((p) => (
                <li key={p.id} className="flex items-center gap-3 px-4 sm:px-5 py-2.5 text-[13px]">
                  <Link href={`/admin/products/duzenle?id=${encodeURIComponent(p.id)}`} className="min-w-0 flex-1 truncate text-[#20384e] hover:underline">
                    {p.name}
                  </Link>
                  {p.waiting > 0 && <Pill tone="blue">{p.waiting} bekleyen</Pill>}
                  <Pill tone={p.stock === 0 ? 'red' : 'amber'}>{p.stock === 0 ? 'Tükendi' : `${p.stock} adet`}</Pill>
                </li>
              ))}
            </ul>
          )}
        </Panel>
      </div>
    </div>
  )
}
