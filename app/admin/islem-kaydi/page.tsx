'use client'

import React, { useEffect, useState } from 'react'
import { PageHeader, Panel, SearchInput, Spinner, EmptyState, Pagination, SelectInput, TextInput, Field, fmtDateTime } from '@/components/admin/ui'

type Change = { field: string; label: string; from: string | null; to: string | null }
type Log = {
  id: string
  createdAt: string
  actor: string
  action: string
  method: string | null
  path: string | null
  ip: string | null
  details: string | null
  objectType: string | null
  objectId: string | null
  changes: Change[] | null
}

const PAGE_SIZE = 50

/**
 * Yönetim işlem kaydı (A09): kim, ne zaman, hangi nesnede hangi alanı hangi değerden hangi değere değiştirdi.
 * Süzgeçler: metin, nesne (ürün id'si / sipariş no), tür ve tarih aralığı (Türkiye günü). Sayfalı.
 */
export default function AdminAuditPage() {
  const [data, setData] = useState<{ logs: Log[]; total: number; retentionDays: number } | null>(null)
  const [q, setQ] = useState('')
  const [object, setObject] = useState('')
  const [type, setType] = useState('')
  const [from, setFrom] = useState('')
  const [to, setTo] = useState('')
  const [page, setPage] = useState(1)
  const [open, setOpen] = useState<string | null>(null)
  const [error, setError] = useState('')

  useEffect(() => setPage(1), [q, object, type, from, to])
  useEffect(() => {
    const t = setTimeout(() => {
      const sp = new URLSearchParams({ page: String(page), pageSize: String(PAGE_SIZE) })
      if (q.trim()) sp.set('q', q.trim())
      if (object.trim()) sp.set('object', object.trim())
      if (type) sp.set('type', type)
      if (from) sp.set('from', from)
      if (to) sp.set('to', to)
      fetch(`/api/admin/audit?${sp}`, { credentials: 'include' })
        .then((r) => r.json())
        .then((d) => {
          if (d.success) {
            setData({ logs: d.logs, total: d.total, retentionDays: d.retentionDays })
            setError('')
          } else setError(d.error || 'Kayıtlar alınamadı.')
        })
        .catch(() => setError('Kayıtlar alınamadı.'))
    }, 250)
    return () => clearTimeout(t)
  }, [q, object, type, from, to, page])

  return (
    <div className="space-y-6">
      <PageHeader
        title="İşlem Kaydı"
        description={`Kim, ne zaman, hangi işlemi yaptı; ürün ve siparişlerde değişen alanlar eski → yeni değerleriyle.${data ? ` Kayıtlar ${data.retentionDays} gün saklanır.` : ''}`}
      />
      <div className="grid gap-3 md:grid-cols-[2fr_1.4fr_1fr_1fr_1fr] items-end">
        <SearchInput value={q} onChange={setQ} placeholder="Kişi, işlem veya ayrıntı ara" />
        <Field label="Nesne" htmlFor="a-obj">
          <TextInput id="a-obj" value={object} onChange={(e) => setObject(e.target.value)} placeholder="Ürün id'si veya sipariş no" />
        </Field>
        <Field label="Tür" htmlFor="a-type">
          <SelectInput id="a-type" value={type} onChange={(e) => setType(e.target.value)}>
            <option value="">Tümü</option>
            <option value="product">Ürün</option>
            <option value="order">Sipariş</option>
          </SelectInput>
        </Field>
        <Field label="Başlangıç" htmlFor="a-from">
          <TextInput id="a-from" type="date" value={from} max={to || undefined} onChange={(e) => setFrom(e.target.value)} />
        </Field>
        <Field label="Bitiş" htmlFor="a-to">
          <TextInput id="a-to" type="date" value={to} min={from || undefined} onChange={(e) => setTo(e.target.value)} />
        </Field>
      </div>
      {error && <p role="alert" className="text-sm text-red-700">{error}</p>}
      {!data && !error && <div className="flex justify-center py-10"><Spinner /></div>}
      {data && data.logs.length === 0 && <EmptyState title="Kayıt yok" description="Süzgeçlerle eşleşen işlem bulunamadı." />}
      {data && data.logs.length > 0 && (
        <Panel className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead className="bg-[#f5f7fa] text-left text-[12px] text-[#5d6e80]">
              <tr>
                <th className="px-4 py-2.5 font-semibold">Zaman</th>
                <th className="px-4 py-2.5 font-semibold">Kişi</th>
                <th className="px-4 py-2.5 font-semibold">İşlem</th>
                <th className="px-4 py-2.5 font-semibold">Ayrıntı</th>
                <th className="px-4 py-2.5 font-semibold">IP</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-[#eef1f5]">
              {data.logs.map((l) => (
                <React.Fragment key={l.id}>
                  <tr className="align-top">
                    <td className="px-4 py-2.5 whitespace-nowrap text-[13px] text-[#5d6e80]">{fmtDateTime(l.createdAt)}</td>
                    <td className="px-4 py-2.5 text-[13px] text-[#121926]">{l.actor}</td>
                    <td className="px-4 py-2.5 text-[13px] text-[#121926]">
                      {l.action}
                      {l.objectId && (
                        <button type="button" onClick={() => setObject(l.objectId!)} className="block text-[11px] font-mono text-[#5d6e80] hover:underline" title="Bu nesnenin kayıtlarını göster">
                          {l.objectId}
                        </button>
                      )}
                    </td>
                    <td className="px-4 py-2.5 text-[12px] text-[#5d6e80] break-words max-w-[440px]">
                      {l.details ?? ''}
                      {!!l.changes?.length && (
                        <button type="button" onClick={() => setOpen(open === l.id ? null : l.id)} className="block mt-1 text-[12px] font-medium text-[#0b2540] hover:underline" aria-expanded={open === l.id}>
                          {open === l.id ? 'Değişiklikleri gizle' : `${l.changes.length} değişiklik`}
                        </button>
                      )}
                    </td>
                    <td className="px-4 py-2.5 text-[12px] text-[#5d6e80] whitespace-nowrap">{l.ip ?? ''}</td>
                  </tr>
                  {open === l.id && l.changes && (
                    <tr className="bg-[#fafbfd]">
                      <td colSpan={5} className="px-4 py-3">
                        <table className="w-full text-[12px]">
                          <thead className="text-left text-[#5d6e80]">
                            <tr>
                              <th className="py-1 pr-3 font-semibold">Alan</th>
                              <th className="py-1 pr-3 font-semibold">Eski değer</th>
                              <th className="py-1 font-semibold">Yeni değer</th>
                            </tr>
                          </thead>
                          <tbody>
                            {l.changes.map((c) => (
                              <tr key={c.field} className="align-top">
                                <td className="py-1 pr-3 text-[#20384e]">{c.label}</td>
                                <td className="py-1 pr-3 text-[#5d6e80] break-all">{c.from ?? '—'}</td>
                                <td className="py-1 text-[#121926] break-all">{c.to ?? '—'}</td>
                              </tr>
                            ))}
                          </tbody>
                        </table>
                      </td>
                    </tr>
                  )}
                </React.Fragment>
              ))}
            </tbody>
          </table>
        </Panel>
      )}
      {data && <Pagination page={page} pageSize={PAGE_SIZE} total={data.total} onPage={setPage} />}
    </div>
  )
}
