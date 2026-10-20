'use client'

import { BulkShipping, OrdersExport } from '@/components/admin/DataTransfer'
import { useAdminMe } from '@/components/admin/AdminMeContext'
import React, { Suspense, useCallback, useEffect, useMemo, useRef, useState } from 'react'
import Link from 'next/link'
import { usePathname, useRouter, useSearchParams } from 'next/navigation'
import { Package, RefreshCw, SlidersHorizontal, X } from 'lucide-react'
import { fmtTRY } from '@/lib/format'
import {
  Btn,
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
  fmtDateTime,
} from '@/components/admin/ui'
import { OrderQuickActions } from '@/components/admin/OrderQuickActions'
import { useAdminLive } from '@/components/admin/AdminLiveProvider'
import { ORDER_STATUS_TONE, PAYMENT_STATUS_TONE, methodLabel, paymentLabel, statusLabel, type AdminOrderRow } from '@/components/admin/order-meta'

type ListResponse = { orders: AdminOrderRow[]; total: number; page: number; pageSize: number; counts: Record<string, number> }

const TABS = [
  { value: 'all', label: 'Tümü' },
  { value: 'awaiting_payment', label: 'Ödeme bekleyen', tone: 'yellow' as const },
  { value: 'awaiting_transfer', label: 'Havale/EFT onayı', tone: 'yellow' as const },
  { value: 'to_prepare', label: 'Hazırlanacak', tone: 'yellow' as const },
  { value: 'picking', label: 'Hazırlanıyor', tone: 'yellow' as const },
  { value: 'shipped', label: 'Kargoda' },
  { value: 'delivered', label: 'Teslim edildi' },
  { value: 'cancel_requests', label: 'İptal talepleri', tone: 'yellow' as const },
  { value: 'open_returns', label: 'İade talepleri', tone: 'yellow' as const },
  { value: 'cancelled', label: 'İptal' },
  { value: 'returned', label: 'İade' },
]

const PAGE_SIZE = 20

function OrdersContent() {
  const me = useAdminMe()
  const router = useRouter()
  const pathname = usePathname()
  const sp = useSearchParams()
  const { tick, refresh: refreshLive } = useAdminLive()

  const tab = sp.get('tab') || 'all'
  const page = Math.max(1, Number(sp.get('page')) || 1)
  const q = sp.get('q') || ''
  const paymentStatus = sp.get('paymentStatus') || ''
  const paymentMethod = sp.get('paymentMethod') || ''
  const from = sp.get('from') || ''
  const to = sp.get('to') || ''
  const sort = sp.get('sort') || 'createdAt_desc'

  const [data, setData] = useState<ListResponse | null>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [search, setSearch] = useState(q)
  const [filtersOpen, setFiltersOpen] = useState(!!(paymentStatus || paymentMethod || from || to))
  const debounce = useRef<ReturnType<typeof setTimeout> | null>(null)

  const setParams = useCallback(
    (patch: Record<string, string | number | null>, resetPage = true) => {
      const next = new URLSearchParams(sp.toString())
      for (const [k, v] of Object.entries(patch)) {
        if (v === null || v === '' || (k === 'tab' && v === 'all') || (k === 'sort' && v === 'createdAt_desc')) next.delete(k)
        else next.set(k, String(v))
      }
      if (resetPage && !('page' in patch)) next.delete('page')
      const qs = next.toString()
      router.replace(qs ? `${pathname}?${qs}` : pathname, { scroll: false })
    },
    [sp, router, pathname]
  )

  const apiQuery = useMemo(() => {
    const p = new URLSearchParams({ page: String(page), pageSize: String(PAGE_SIZE), tab, sort })
    if (q) p.set('q', q)
    if (paymentStatus) p.set('paymentStatus', paymentStatus)
    if (paymentMethod) p.set('paymentMethod', paymentMethod)
    if (from) p.set('from', from)
    if (to) p.set('to', to)
    return p.toString()
  }, [page, tab, sort, q, paymentStatus, paymentMethod, from, to])

  const load = useCallback(async () => {
    setLoading(true)
    try {
      const res = await fetch(`/api/admin/orders?${apiQuery}`, { credentials: 'include', cache: 'no-store' })
      const json = await res.json().catch(() => null)
      if (!res.ok) throw new Error(json?.error || `Liste alınamadı (${res.status})`)
      setData(json)
      setError(null)
    } catch (e) {
      setError(e instanceof Error ? e.message : 'Liste alınamadı')
    } finally {
      setLoading(false)
    }
  }, [apiQuery])

  useEffect(() => {
    load()
  }, [load, tick])

  // URL'deki arama değişirse kutuyu eşitle (geri/ileri)
  useEffect(() => setSearch(q), [q])

  const onSearch = (v: string) => {
    setSearch(v)
    if (debounce.current) clearTimeout(debounce.current)
    debounce.current = setTimeout(() => setParams({ q: v.trim() || null }), 350)
  }

  const afterAction = () => {
    load()
    refreshLive()
  }

  const hasFilters = !!(q || paymentStatus || paymentMethod || from || to)
  const counts = data?.counts ?? {}
  const rows = data?.orders ?? []

  return (
    <div className="space-y-5">
      <PageHeader
        title="Siparişler"
        description={data ? `${counts.all ?? 0} sipariş${hasFilters ? ' (filtreli)' : ''}` : 'Yükleniyor…'}
        actions={
          <>
            <Btn variant="outline" onClick={afterAction} loading={loading && !!data}>
              {!(loading && data) && <RefreshCw />}
              Yenile
            </Btn>
            <BulkShipping onApplied={afterAction} />
            {(me?.user.role === 'owner' || me?.user.role === 'manager') && <OrdersExport />}
          </>
        }
      />

      <Panel className="overflow-hidden">
        <div className="px-2 sm:px-3 border-b border-[#e6ebf1]">
          <TabStrip
            tabs={TABS.map((t) => ({ ...t, count: counts[t.value] }))}
            value={tab}
            onChange={(v) => setParams({ tab: v })}
          />
        </div>

        <div className="p-3 sm:p-4 space-y-3 border-b border-[#e6ebf1] bg-[#fafbfd]">
          <div className="flex flex-col sm:flex-row gap-2">
            <SearchInput value={search} onChange={onSearch} placeholder="Sipariş no, ad, e-posta veya telefon" className="flex-1" />
            <div className="flex gap-2">
              <SelectInput value={sort} onChange={(e) => setParams({ sort: e.target.value })} className="sm:w-48" aria-label="Sıralama">
                <option value="createdAt_desc">En yeni</option>
                <option value="createdAt_asc">En eski</option>
                <option value="total_desc">Tutar (yüksek → düşük)</option>
                <option value="total_asc">Tutar (düşük → yüksek)</option>
              </SelectInput>
              <Btn variant={filtersOpen ? 'subtle' : 'outline'} size="md" onClick={() => setFiltersOpen((v) => !v)} aria-expanded={filtersOpen} className="h-9">
                <SlidersHorizontal />
                <span className="hidden sm:inline">Filtre</span>
              </Btn>
            </div>
          </div>
          {filtersOpen && (
            <div className="grid grid-cols-2 lg:grid-cols-5 gap-2 items-end">
              <label className="space-y-1">
                <span className="text-xs text-[#5d6e80]">Ödeme durumu</span>
                <SelectInput value={paymentStatus} onChange={(e) => setParams({ paymentStatus: e.target.value })}>
                  <option value="">Tümü</option>
                  <option value="PENDING">Ödeme bekleniyor</option>
                  <option value="PAID">Ödendi</option>
                  <option value="FAILED">Başarısız</option>
                  <option value="REFUNDED">İade edildi</option>
                </SelectInput>
              </label>
              <label className="space-y-1">
                <span className="text-xs text-[#5d6e80]">Ödeme yöntemi</span>
                <SelectInput value={paymentMethod} onChange={(e) => setParams({ paymentMethod: e.target.value })}>
                  <option value="">Tümü</option>
                  <option value="bank_transfer">Havale/EFT</option>
                  <option value="card">Kart</option>
                </SelectInput>
              </label>
              <label className="space-y-1">
                <span className="text-xs text-[#5d6e80]">Başlangıç</span>
                <TextInput type="date" value={from} max={to || undefined} onChange={(e) => setParams({ from: e.target.value })} />
              </label>
              <label className="space-y-1">
                <span className="text-xs text-[#5d6e80]">Bitiş</span>
                <TextInput type="date" value={to} min={from || undefined} onChange={(e) => setParams({ to: e.target.value })} />
              </label>
              <Btn
                variant="ghost"
                size="md"
                className="h-9 col-span-2 lg:col-span-1"
                disabled={!hasFilters}
                onClick={() => {
                  setSearch('')
                  setParams({ q: null, paymentStatus: null, paymentMethod: null, from: null, to: null })
                }}
              >
                <X />
                Filtreleri temizle
              </Btn>
            </div>
          )}
        </div>

        {error && (
          <div role="alert" className="m-4 rounded-lg border border-red-200 bg-red-50 text-red-800 text-sm px-4 py-3">
            {error}
          </div>
        )}

        {!data && loading ? (
          <Spinner />
        ) : rows.length === 0 ? (
          <EmptyState
            icon={Package}
            title={hasFilters || tab !== 'all' ? 'Kritere uyan sipariş yok' : 'Henüz sipariş yok'}
            description={hasFilters ? 'Arama veya filtreleri değiştirerek tekrar deneyin.' : undefined}
          />
        ) : (
          <div className={loading ? 'opacity-60 transition-opacity' : 'transition-opacity'}>
            {/* Geniş ekran: tablo */}
            <div className="hidden lg:block overflow-x-auto">
              <table className="w-full text-left text-[13px]">
                <thead>
                  <tr className="text-[11px] uppercase tracking-wider text-[#5d6e80] border-b border-[#e6ebf1]">
                    <th className="font-semibold px-5 py-2.5">Sipariş</th>
                    <th className="font-semibold px-3 py-2.5">Müşteri</th>
                    <th className="font-semibold px-3 py-2.5 text-right">Tutar</th>
                    <th className="font-semibold px-3 py-2.5">Durum</th>
                    <th className="font-semibold px-3 py-2.5">Ödeme</th>
                    <th className="font-semibold px-5 py-2.5 text-right">İşlem</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-[#eef2f6]">
                  {rows.map((o) => (
                    <tr key={o.id} className="hover:bg-[#fafbfd] align-middle">
                      <td className="px-5 py-3">
                        <Link href={`/admin/orders/${o.id}`} className="font-mono font-semibold text-[#0b2540] hover:underline">
                          {o.orderNo}
                        </Link>
                        <p className="text-xs text-[#5d6e80] mt-0.5">
                          {fmtDateTime(o.createdAt)} · {o.itemCount} kalem
                        </p>
                      </td>
                      <td className="px-3 py-3 max-w-[260px]">
                        <p className="font-medium text-[#121926] truncate">
                          {o.customerName}
                          {!o.userId && <span className="ml-1.5 text-[10px] font-semibold uppercase text-[#9aa8b6]">misafir</span>}
                        </p>
                        <p className="text-xs text-[#5d6e80] truncate">{o.customerEmail || o.phone}</p>
                      </td>
                      <td className="px-3 py-3 text-right whitespace-nowrap">
                        <span className="font-semibold text-[#121926] tabular-nums">{fmtTRY(o.total)}</span>
                        {o.shippingProvider && <p className="text-xs text-[#5d6e80] mt-0.5">Kargo: {o.shippingProvider}</p>}
                      </td>
                      <td className="px-3 py-3">
                        <div className="flex flex-wrap gap-1">
                          <Pill tone={ORDER_STATUS_TONE[o.status] ?? 'slate'} dot>{statusLabel(o.status)}</Pill>
                          {o.cancelRequested && <Pill tone="red">İptal talebi</Pill>}
                          {o.openReturns > 0 && <Pill tone="orange">İade talebi</Pill>}
                        </div>
                      </td>
                      <td className="px-3 py-3">
                        <div className="flex flex-wrap items-center gap-1">
                          <Pill tone={PAYMENT_STATUS_TONE[o.paymentStatus] ?? 'slate'}>{paymentLabel(o.paymentStatus)}</Pill>
                          {o.paymentNotified && o.paymentStatus !== 'PAID' && <Pill tone="yellow">Bildirildi</Pill>}
                        </div>
                        <p className="text-xs text-[#5d6e80] mt-0.5">{methodLabel(o.paymentMethod)}</p>
                      </td>
                      <td className="px-5 py-3">
                        <OrderQuickActions order={o} onDone={afterAction} />
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>

            {/* Tablet/mobil: kartlar */}
            <ul className="lg:hidden divide-y divide-[#eef2f6]">
              {rows.map((o) => (
                <li key={o.id} className="px-4 py-3 space-y-2">
                  <div className="flex items-start justify-between gap-3">
                    <Link href={`/admin/orders/${o.id}`} className="min-w-0">
                      <span className="font-mono text-[13px] font-semibold text-[#0b2540]">{o.orderNo}</span>
                      <p className="text-[13px] font-medium text-[#121926] truncate">{o.customerName}</p>
                      <p className="text-xs text-[#5d6e80] truncate">
                        {fmtDateTime(o.createdAt)} · {methodLabel(o.paymentMethod)}
                        {o.shippingProvider && <> · Kargo: {o.shippingProvider}</>}
                      </p>
                    </Link>
                    <span className="text-sm font-semibold tabular-nums text-[#121926] whitespace-nowrap">{fmtTRY(o.total)}</span>
                  </div>
                  <div className="flex flex-wrap items-center justify-between gap-2">
                    <div className="flex flex-wrap gap-1">
                      <Pill tone={ORDER_STATUS_TONE[o.status] ?? 'slate'} dot>{statusLabel(o.status)}</Pill>
                      <Pill tone={PAYMENT_STATUS_TONE[o.paymentStatus] ?? 'slate'}>{paymentLabel(o.paymentStatus)}</Pill>
                      {o.paymentNotified && o.paymentStatus !== 'PAID' && <Pill tone="yellow">Bildirildi</Pill>}
                      {o.cancelRequested && <Pill tone="red">İptal talebi</Pill>}
                          {o.openReturns > 0 && <Pill tone="orange">İade talebi</Pill>}
                    </div>
                    <OrderQuickActions order={o} onDone={afterAction} compact />
                  </div>
                </li>
              ))}
            </ul>
          </div>
        )}

        {data && <Pagination page={data.page} pageSize={data.pageSize} total={data.total} onPage={(p) => setParams({ page: p }, false)} />}
      </Panel>
    </div>
  )
}

export default function AdminOrdersPage() {
  return (
    <Suspense fallback={<Spinner />}>
      <OrdersContent />
    </Suspense>
  )
}
