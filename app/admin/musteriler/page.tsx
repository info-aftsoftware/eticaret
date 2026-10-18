'use client'

import React, { Suspense, useCallback, useEffect, useMemo, useRef, useState } from 'react'
import Link from 'next/link'
import { usePathname, useRouter, useSearchParams } from 'next/navigation'
import { Users, RefreshCw, ChevronRight } from 'lucide-react'
import { Avatar, ConsentPill, type CustomerRow } from '@/components/admin/customer-bits'
import { fmtTRY } from '@/lib/format'
import { Btn, EmptyState, PageHeader, Pagination, Panel, SearchInput, SelectInput, Spinner, TabStrip, fmtDate } from '@/components/admin/ui'

type ListResponse = { customers: CustomerRow[]; total: number; page: number; pageSize: number; counts: Record<string, number> }

const PAGE_SIZE = 25

function CustomersContent() {
  const router = useRouter()
  const pathname = usePathname()
  const sp = useSearchParams()
  const filter = sp.get('filter') || 'all'
  const sort = sp.get('sort') || 'last_order'
  const q = sp.get('q') || ''
  const page = Math.max(1, Number(sp.get('page')) || 1)

  const [data, setData] = useState<ListResponse | null>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [search, setSearch] = useState(q)
  const debounce = useRef<ReturnType<typeof setTimeout> | null>(null)

  const setParams = useCallback(
    (patch: Record<string, string | number | null>) => {
      const next = new URLSearchParams(sp.toString())
      for (const [k, v] of Object.entries(patch)) {
        if (v === null || v === '' || (k === 'filter' && v === 'all') || (k === 'sort' && v === 'last_order')) next.delete(k)
        else next.set(k, String(v))
      }
      if (!('page' in patch)) next.delete('page')
      const qs = next.toString()
      router.replace(qs ? `${pathname}?${qs}` : pathname, { scroll: false })
    },
    [sp, router, pathname]
  )

  const query = useMemo(() => {
    const p = new URLSearchParams({ page: String(page), pageSize: String(PAGE_SIZE), filter, sort })
    if (q) p.set('q', q)
    return p.toString()
  }, [page, filter, sort, q])

  const load = useCallback(async () => {
    setLoading(true)
    try {
      const res = await fetch(`/api/admin/customers?${query}`, { credentials: 'include', cache: 'no-store' })
      const json = await res.json().catch(() => null)
      if (!res.ok) throw new Error(json?.error || `Liste alınamadı (${res.status})`)
      setData(json)
      setError(null)
    } catch (e) {
      setError(e instanceof Error ? e.message : 'Liste alınamadı')
    } finally {
      setLoading(false)
    }
  }, [query])

  useEffect(() => {
    load()
  }, [load])
  useEffect(() => setSearch(q), [q])

  const onSearch = (v: string) => {
    setSearch(v)
    if (debounce.current) clearTimeout(debounce.current)
    debounce.current = setTimeout(() => setParams({ q: v.trim() || null }), 350)
  }

  const counts = data?.counts ?? {}
  const rows = data?.customers ?? []

  return (
    <div className="space-y-5">
      <PageHeader
        title="Müşteriler"
        description="Üyeler ve misafir alışveriş yapanlar (e-postaya göre gruplanır)"
        actions={
          <Btn variant="outline" onClick={load} loading={loading && !!data}>
            {!(loading && data) && <RefreshCw />}
            Yenile
          </Btn>
        }
      />

      <Panel className="overflow-hidden">
        <div className="px-2 sm:px-3 border-b border-[#e6ebf1]">
          <TabStrip
            tabs={[
              { value: 'all', label: 'Tümü', count: counts.all },
              { value: 'with_orders', label: 'Sipariş verenler', count: counts.with_orders },
              { value: 'registered', label: 'Üyeler', count: counts.registered },
              { value: 'guest', label: 'Misafirler', count: counts.guest },
            ]}
            value={filter}
            onChange={(v) => setParams({ filter: v })}
          />
        </div>
        <div className="p-3 sm:p-4 flex flex-col sm:flex-row gap-2 border-b border-[#e6ebf1] bg-[#fafbfd]">
          <SearchInput value={search} onChange={onSearch} placeholder="Ad, e-posta, telefon, müşteri no veya sipariş no" className="flex-1" />
          <SelectInput value={sort} onChange={(e) => setParams({ sort: e.target.value })} className="sm:w-56" aria-label="Sıralama">
            <option value="last_order">Son sipariş tarihi</option>
            <option value="spend">Toplam harcama</option>
            <option value="orders">Sipariş sayısı</option>
            <option value="newest">En yeni müşteri</option>
            <option value="name">Ada göre (A–Z)</option>
          </SelectInput>
        </div>

        {error && (
          <div role="alert" className="m-4 rounded-lg border border-red-200 bg-red-50 text-red-800 text-sm px-4 py-3">
            {error}
          </div>
        )}

        {!data && loading ? (
          <Spinner />
        ) : rows.length === 0 ? (
          <EmptyState icon={Users} title={q ? 'Aramaya uyan müşteri yok' : 'Henüz müşteri yok'} />
        ) : (
          <div className={loading ? 'opacity-60' : ''}>
            <div className="hidden lg:block overflow-x-auto">
              <table className="w-full text-left text-[13px]">
                <thead>
                  <tr className="text-[11px] uppercase tracking-wider text-[#5d6e80] border-b border-[#e6ebf1]">
                    <th className="font-semibold px-5 py-2.5">Müşteri</th>
                    <th className="font-semibold px-3 py-2.5">İletişim</th>
                    <th className="font-semibold px-3 py-2.5 text-right">Sipariş</th>
                    <th className="font-semibold px-3 py-2.5 text-right">Ödenen toplam</th>
                    <th className="font-semibold px-3 py-2.5">Son sipariş</th>
                    <th className="font-semibold px-3 py-2.5">Pazarlama izni</th>
                    <th className="px-3 py-2.5" />
                  </tr>
                </thead>
                <tbody className="divide-y divide-[#eef2f6]">
                  {rows.map((c) => (
                    <tr key={c.key} className="hover:bg-[#fafbfd] cursor-pointer" onClick={() => router.push(`/admin/musteriler/detay?key=${c.key}`)}>
                      <td className="px-5 py-3">
                        <div className="flex items-center gap-3 min-w-0">
                          <Avatar name={c.name} guest={c.type === 'guest'} />
                          <div className="min-w-0">
                            <Link href={`/admin/musteriler/detay?key=${c.key}`} className="font-medium text-[#121926] hover:underline truncate block" onClick={(e) => e.stopPropagation()}>
                              {c.name}
                            </Link>
                            <p className="text-xs text-[#5d6e80]">
                              {c.type === 'registered' ? (c.customerNo ?? 'Üye') : 'Misafir'}
                              {c.registeredAt && ` · ${fmtDate(c.registeredAt)}`}
                            </p>
                          </div>
                        </div>
                      </td>
                      <td className="px-3 py-3 max-w-[240px]">
                        <p className="truncate text-[#20384e]">{c.email ?? '—'}</p>
                        <p className="text-xs text-[#5d6e80] truncate">{[c.phone, c.city].filter(Boolean).join(' · ') || '—'}</p>
                      </td>
                      <td className="px-3 py-3 text-right tabular-nums">
                        <span className="font-semibold text-[#121926]">{c.orderCount}</span>
                        {c.orderCount > c.paidOrderCount && <span className="text-xs text-[#9aa8b6]"> ({c.paidOrderCount} ödendi)</span>}
                      </td>
                      <td className="px-3 py-3 text-right font-semibold tabular-nums text-[#121926]">{fmtTRY(c.paidTotal)}</td>
                      <td className="px-3 py-3 text-[#20384e] whitespace-nowrap">{c.lastOrderAt ? fmtDate(c.lastOrderAt) : '—'}</td>
                      <td className="px-3 py-3"><ConsentPill value={c.marketingConsent} /></td>
                      <td className="px-3 py-3 text-right"><ChevronRight className="w-4 h-4 text-[#b9c3cf] inline" /></td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
            <ul className="lg:hidden divide-y divide-[#eef2f6]">
              {rows.map((c) => (
                <li key={c.key}>
                  <Link href={`/admin/musteriler/detay?key=${c.key}`} className="flex items-center gap-3 px-4 py-3 hover:bg-[#fafbfd]">
                    <Avatar name={c.name} guest={c.type === 'guest'} />
                    <div className="min-w-0 flex-1">
                      <p className="text-[13px] font-medium text-[#121926] truncate">
                        {c.name} <span className="text-[11px] font-normal text-[#9aa8b6]">{c.type === 'registered' ? c.customerNo ?? 'Üye' : 'Misafir'}</span>
                      </p>
                      <p className="text-xs text-[#5d6e80] truncate">{c.email ?? c.phone}</p>
                      <div className="mt-1"><ConsentPill value={c.marketingConsent} /></div>
                    </div>
                    <div className="text-right shrink-0">
                      <p className="text-[13px] font-semibold tabular-nums text-[#121926]">{fmtTRY(c.paidTotal)}</p>
                      <p className="text-xs text-[#5d6e80]">{c.orderCount} sipariş</p>
                    </div>
                  </Link>
                </li>
              ))}
            </ul>
          </div>
        )}
        {data && <Pagination page={data.page} pageSize={data.pageSize} total={data.total} onPage={(p) => setParams({ page: p })} />}
      </Panel>
    </div>
  )
}

export default function AdminMusterilerPage() {
  return (
    <Suspense fallback={<Spinner />}>
      <CustomersContent />
    </Suspense>
  )
}
