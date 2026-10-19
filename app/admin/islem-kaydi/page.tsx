'use client'

import React, { useEffect, useState } from 'react'
import { PageHeader, Panel, SearchInput, Spinner, EmptyState, fmtDateTime } from '@/components/admin/ui'

type Log = { id: string; createdAt: string; actor: string; action: string; method: string | null; path: string | null; ip: string | null; details: string | null }

/** Yönetim işlem kaydı: girişler, kullanıcı/rol değişiklikleri ve paneldeki tüm değiştiren işlemler */
export default function AdminAuditPage() {
  const [logs, setLogs] = useState<Log[] | null>(null)
  const [q, setQ] = useState('')
  const [error, setError] = useState('')

  useEffect(() => {
    const t = setTimeout(() => {
      fetch(`/api/admin/audit${q.trim() ? `?q=${encodeURIComponent(q.trim())}` : ''}`, { credentials: 'include' })
        .then((r) => r.json())
        .then((d) => (d.success ? setLogs(d.logs) : setError(d.error || 'Kayıtlar alınamadı.')))
        .catch(() => setError('Kayıtlar alınamadı.'))
    }, 250)
    return () => clearTimeout(t)
  }, [q])

  return (
    <div className="space-y-6">
      <PageHeader title="İşlem Kaydı" description="Kim, ne zaman, hangi işlemi yaptı. Son 300 kayıt." />
      <SearchInput value={q} onChange={setQ} placeholder="Kişi, işlem veya sayfa ara" />
      {error && <p role="alert" className="text-sm text-red-700">{error}</p>}
      {!logs && !error && <div className="flex justify-center py-10"><Spinner /></div>}
      {logs && logs.length === 0 && <EmptyState title="Kayıt yok" description="Aramanızla eşleşen işlem bulunamadı." />}
      {logs && logs.length > 0 && (
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
              {logs.map((l) => (
                <tr key={l.id}>
                  <td className="px-4 py-2.5 whitespace-nowrap text-[13px] text-[#5d6e80]">{fmtDateTime(l.createdAt)}</td>
                  <td className="px-4 py-2.5 text-[13px] text-[#121926]">{l.actor}</td>
                  <td className="px-4 py-2.5 text-[13px] text-[#121926]">{l.action}</td>
                  <td className="px-4 py-2.5 text-[12px] text-[#5d6e80] break-all max-w-[360px]">{l.details ?? ''}</td>
                  <td className="px-4 py-2.5 text-[12px] text-[#5d6e80] whitespace-nowrap">{l.ip ?? ''}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </Panel>
      )}
    </div>
  )
}
