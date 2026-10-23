'use client'

/**
 * İstatistikler: tahsilat ile sipariş hacmi ayrı gösterilir (tanımlar lib/revenue.ts).
 * Ödeme bekleyen sipariş tahsilata ve en çok satanlara girmez; yalnız sipariş hacminde görünür.
 */

import React, { useState, useEffect, useCallback } from 'react'
import Link from 'next/link'
import {
  TrendingUp,
  ShoppingCart,
  Wallet,
  Package,
  Loader2,
  BarChart2,
  Calendar,
  Award,
  ClipboardList,
} from 'lucide-react'
import { fmtTRY } from '@/lib/format'
import { ORDER_STATUS_LABEL } from '@/components/admin/order-meta'

type DailyPoint = { date: string; collected: number; paidCount: number; volume: number; orderCount: number }
type TopProduct = { name: string; soldQty: number; grossAmount: number }
type StatusBucket = { status: string; count: number; total: number }

type SalesData = {
  period: string
  startDay: string
  endDay: string
  summary: {
    collected: number
    collectedGross: number
    refunded: number
    paidCount: number
    avgPaidOrder: number
    volume: number
    orderCount: number
    allOrderCount: number
  }
  dailySeries: DailyPoint[]
  topProducts: TopProduct[]
  ordersByStatus: StatusBucket[]
}

type Series = 'collected' | 'volume'

const PERIOD_OPTIONS = [
  { value: 'today', label: 'Bugün' },
  { value: '7d', label: '7 Gün' },
  { value: '30d', label: '30 Gün' },
  { value: '90d', label: '90 Gün' },
]

const STATUS_COLOR: Record<string, string> = {
  PENDING: 'bg-amber-400', CONFIRMED: 'bg-blue-400', PROCESSING: 'bg-indigo-400', PAID: 'bg-sky-500',
  PICKING: 'bg-violet-300', SHIPPED: 'bg-violet-400', DELIVERED: 'bg-emerald-400', CANCELLED: 'bg-red-400', RETURNED: 'bg-slate-400',
}

/** YYYY-MM-DD (İstanbul günü) → "22 Eki"; saat dilimi kaymasın diye öğlen UTC kullanılır */
const dayLabel = (key: string) => new Date(`${key}T12:00:00Z`).toLocaleDateString('tr-TR', { day: '2-digit', month: 'short', timeZone: 'UTC' })

function MiniBarChart({ data, series }: { data: DailyPoint[]; series: Series }) {
  if (!data.length) return null
  const value = (d: DailyPoint) => (series === 'collected' ? d.collected : d.volume)
  const count = (d: DailyPoint) => (series === 'collected' ? `${d.paidCount} ödenen sipariş` : `${d.orderCount} sipariş`)
  const maxVal = Math.max(...data.map(value), 1)
  return (
    <div className="flex items-end gap-px h-24 w-full">
      {data.map((d) => {
        const pct = (value(d) / maxVal) * 100
        return (
          <div key={d.date} className="flex-1 h-full flex flex-col justify-end items-center gap-0.5 group relative">
            <div
              className="w-full bg-brand/70 hover:bg-brand rounded-t transition-all duration-200"
              style={{ height: `${Math.max(pct, value(d) > 0 ? 2 : 0)}%` }}
            />
            <div className="absolute bottom-full mb-1 hidden group-hover:block z-10 bg-slate-900 text-white text-[10px] rounded px-2 py-1 whitespace-nowrap pointer-events-none shadow-lg">
              {dayLabel(d.date)}
              <br />{fmtTRY(value(d))} · {count(d)}
            </div>
          </div>
        )
      })}
    </div>
  )
}

function Card({ title, value, sub, icon: Icon, tone }: { title: string; value: React.ReactNode; sub: React.ReactNode; icon: React.ElementType; tone: string }) {
  return (
    <div className="bg-white border border-slate-200 rounded-xl p-5 shadow-sm">
      <div className="flex items-center justify-between mb-3">
        <p className="text-xs font-semibold text-slate-500 uppercase tracking-wider">{title}</p>
        <div className={`w-8 h-8 rounded-lg flex items-center justify-center ${tone}`}>
          <Icon className="w-4 h-4" />
        </div>
      </div>
      <p className="text-2xl font-bold text-slate-900">{value}</p>
      <p className="text-xs text-slate-500 mt-1 leading-relaxed">{sub}</p>
    </div>
  )
}

export default function AdminIstatistiklerPage() {
  const [period, setPeriod] = useState('30d')
  const [series, setSeries] = useState<Series>('collected')
  const [data, setData] = useState<SalesData | null>(null)
  const [loading, setLoading] = useState(true)

  const loadData = useCallback(async (p: string) => {
    setLoading(true)
    try {
      const res = await fetch(`/api/admin/stats/sales?period=${p}`, { credentials: 'include' })
      setData(res.ok ? await res.json() : null)
    } finally {
      setLoading(false)
    }
  }, [])

  useEffect(() => { loadData(period) }, [period, loadData])

  const totalStatusCount = data ? data.ordersByStatus.reduce((s, b) => s + b.count, 0) : 0
  const rangeLabel = data ? (data.startDay === data.endDay ? dayLabel(data.endDay) : `${dayLabel(data.startDay)} – ${dayLabel(data.endDay)}`) : ''

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
        <div>
          <h1 className="text-xl font-bold text-slate-900 flex items-center gap-2">
            <TrendingUp className="w-5 h-5 text-brand" />
            İstatistikler
          </h1>
          <p className="text-sm text-slate-500 mt-0.5">Tahsilat ve sipariş analizi · günler Türkiye saatine göre</p>
        </div>
        <div className="flex rounded-xl border border-slate-200 overflow-hidden bg-white text-sm shadow-sm">
          {PERIOD_OPTIONS.map((opt) => (
            <button
              key={opt.value}
              onClick={() => setPeriod(opt.value)}
              className={`px-4 py-2 font-medium transition-colors ${
                period === opt.value
                  ? 'bg-brand text-white'
                  : 'text-slate-600 hover:bg-slate-50'
              }`}
            >
              {opt.label}
            </button>
          ))}
        </div>
      </div>

      {loading ? (
        <div className="flex items-center justify-center py-32 bg-white rounded-xl border border-slate-200">
          <div className="flex flex-col items-center gap-3">
            <Loader2 className="w-8 h-8 animate-spin text-brand" />
            <p className="text-sm text-slate-500">İstatistikler yükleniyor...</p>
          </div>
        </div>
      ) : !data ? (
        <div className="text-center py-24 bg-white rounded-xl border border-slate-200">
          <BarChart2 className="w-12 h-12 text-slate-200 mx-auto mb-3" />
          <p className="text-slate-500 font-medium">Veri bulunamadı</p>
          <p className="text-sm text-slate-400 mt-1">Bu periyot için sipariş verisi yok.</p>
        </div>
      ) : (
        <>
          <p className="text-xs text-slate-500 flex items-center gap-1.5">
            <Calendar className="w-3.5 h-3.5" />
            {rangeLabel}
          </p>
          <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-4 gap-4">
            <Card
              title="Tahsilat"
              value={fmtTRY(data.summary.collected)}
              sub={
                <>
                  Ödemesi alınmış siparişler, ödeme tarihine göre (KDV ve kargo dahil, indirimler düşülmüş)
                  {data.summary.refunded > 0 && <> · {fmtTRY(data.summary.refunded)} ücret iadesi düşüldü</>}
                </>
              }
              icon={Wallet}
              tone="bg-brand/8 text-brand"
            />
            <Card
              title="Ödenen sipariş"
              value={data.summary.paidCount}
              sub={`Ortalama ${fmtTRY(data.summary.avgPaidOrder)} / sipariş`}
              icon={TrendingUp}
              tone="bg-amber-50 text-amber-500"
            />
            <Card
              title="Sipariş hacmi"
              value={fmtTRY(data.summary.volume)}
              sub="Dönemde verilen siparişler, ödeme bekleyenler dahil; tahsilat değildir. İptal ve iadeler hariç."
              icon={ClipboardList}
              tone="bg-blue-50 text-blue-500"
            />
            <Card
              title="Sipariş sayısı"
              value={data.summary.orderCount}
              sub={`İptal ve iadeler hariç · tümü ${data.summary.allOrderCount}`}
              icon={ShoppingCart}
              tone="bg-slate-100 text-slate-500"
            />
          </div>

          <div className="bg-white border border-slate-200 rounded-xl p-5 shadow-sm">
            <div className="flex flex-wrap items-center justify-between gap-3 mb-4">
              <div>
                <h2 className="text-sm font-semibold text-slate-900">{series === 'collected' ? 'Günlük tahsilat' : 'Günlük sipariş hacmi'}</h2>
                <p className="text-xs text-slate-400 mt-0.5">
                  {series === 'collected' ? 'Her çubuk ödemenin alındığı gün' : 'Her çubuk siparişin verildiği gün'}
                </p>
              </div>
              <div className="flex rounded-lg border border-slate-200 overflow-hidden text-xs">
                {(['collected', 'volume'] as const).map((s) => (
                  <button
                    key={s}
                    onClick={() => setSeries(s)}
                    className={`px-3 py-1.5 font-medium ${series === s ? 'bg-slate-900 text-white' : 'text-slate-600 hover:bg-slate-50'}`}
                  >
                    {s === 'collected' ? 'Tahsilat' : 'Sipariş hacmi'}
                  </button>
                ))}
              </div>
            </div>
            {data.dailySeries.every((d) => (series === 'collected' ? d.collected : d.volume) === 0) ? (
              <div className="flex items-center justify-center h-24 text-slate-400 text-sm">
                {series === 'collected' ? 'Bu periyotta tahsilat yok' : 'Bu periyotta sipariş yok'}
              </div>
            ) : (
              <>
                <MiniBarChart data={data.dailySeries} series={series} />
                <div className="flex justify-between mt-2">
                  <p className="text-[10px] text-slate-400">{dayLabel(data.dailySeries[0].date)}</p>
                  <p className="text-[10px] text-slate-400">{dayLabel(data.dailySeries[data.dailySeries.length - 1].date)}</p>
                </div>
              </>
            )}
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
            <div className="bg-white border border-slate-200 rounded-xl p-5 shadow-sm">
              <div className="flex items-center gap-2 mb-1">
                <Award className="w-4 h-4 text-amber-500" />
                <h2 className="text-sm font-semibold text-slate-900">En Çok Satan Ürünler</h2>
              </div>
              <p className="text-xs text-slate-400 mb-4">Yalnız ödemesi alınmış siparişler · ürün bedeli KDV dahil, indirim öncesi</p>
              {data.topProducts.length === 0 ? (
                <div className="flex items-center justify-center py-10 text-slate-400 text-sm">
                  <Package className="w-8 h-8 mr-2 opacity-40" /> Bu dönemde ödenmiş satış yok
                </div>
              ) : (
                <div className="space-y-3">
                  {data.topProducts.map((p, i) => {
                    const maxRev = data.topProducts[0]?.grossAmount || 1
                    const pct = (p.grossAmount / maxRev) * 100
                    return (
                      <div key={p.name} className="space-y-1">
                        <div className="flex items-center justify-between gap-2">
                          <div className="flex items-center gap-2 min-w-0">
                            <span className="text-[10px] font-bold text-slate-400 w-4 shrink-0">#{i + 1}</span>
                            <p className="text-xs font-medium text-slate-800 truncate">{p.name}</p>
                          </div>
                          <div className="flex items-center gap-2 shrink-0">
                            <span className="text-[10px] text-slate-500">{p.soldQty} adet</span>
                            <span className="text-xs font-semibold text-brand">{fmtTRY(p.grossAmount)}</span>
                          </div>
                        </div>
                        <div className="h-1 bg-slate-100 rounded-full overflow-hidden">
                          <div className="h-full bg-brand/60 rounded-full transition-all" style={{ width: `${pct}%` }} />
                        </div>
                      </div>
                    )
                  })}
                </div>
              )}
            </div>

            <div className="bg-white border border-slate-200 rounded-xl p-5 shadow-sm">
              <div className="flex items-center gap-2 mb-1">
                <ShoppingCart className="w-4 h-4 text-brand" />
                <h2 className="text-sm font-semibold text-slate-900">Durum Dağılımı</h2>
              </div>
              <p className="text-xs text-slate-400 mb-4">Dönemde verilen tüm siparişler (iptal ve iade dahil) · sipariş toplamı</p>
              {data.ordersByStatus.length === 0 ? (
                <div className="flex items-center justify-center py-10 text-slate-400 text-sm">
                  Sipariş verisi yok
                </div>
              ) : (
                <div className="space-y-3">
                  {[...data.ordersByStatus]
                    .sort((a, b) => b.count - a.count)
                    .map((s) => {
                      const pct = totalStatusCount > 0 ? (s.count / totalStatusCount) * 100 : 0
                      const colorClass = STATUS_COLOR[s.status] ?? 'bg-slate-400'
                      return (
                        <div key={s.status} className="space-y-1">
                          <div className="flex items-center justify-between">
                            <div className="flex items-center gap-2">
                              <div className={`w-2 h-2 rounded-full shrink-0 ${colorClass}`} />
                              <p className="text-xs font-medium text-slate-700">
                                {ORDER_STATUS_LABEL[s.status] ?? s.status}
                              </p>
                            </div>
                            <div className="flex items-center gap-3">
                              <span className="text-xs text-slate-400">{s.count} sipariş</span>
                              <span className="text-xs font-semibold text-slate-700">{fmtTRY(s.total)}</span>
                              <span className="text-[10px] text-slate-400 w-8 text-right">{pct.toFixed(0)}%</span>
                            </div>
                          </div>
                          <div className="h-1.5 bg-slate-100 rounded-full overflow-hidden">
                            <div className={`h-full rounded-full transition-all ${colorClass}`} style={{ width: `${pct}%` }} />
                          </div>
                        </div>
                      )
                    })}
                </div>
              )}
              <div className="mt-4 pt-3 border-t border-slate-100 flex items-center justify-between">
                <p className="text-xs text-slate-500">Toplam: <strong className="text-slate-800">{totalStatusCount} sipariş</strong></p>
                <Link href="/admin/orders" className="text-xs font-medium text-brand hover:underline">
                  Siparişlere Git →
                </Link>
              </div>
            </div>
          </div>
        </>
      )}
    </div>
  )
}
