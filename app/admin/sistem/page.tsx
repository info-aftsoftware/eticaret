'use client'

import React, { useCallback, useEffect, useState } from 'react'
import { PageHeader, Panel, PanelHeader, Btn, Pill, Spinner, fmtDateTime, timeAgo } from '@/components/admin/ui'
import { useToast } from '@/components/admin/toast'

type Check = { key: string; label: string; ok: boolean; level: 'error' | 'warn' | 'info'; hint: string }
type JobOutcome = 'ok' | 'idle' | 'disabled' | 'skipped' | 'error'
type JobState = { lastRunAt?: string; lastOk?: boolean; lastError?: string; lastSummary?: string; outcome?: JobOutcome | null; lastSuccessAt?: string }

/** Görev sonucu etiketleri (A11): kapalı entegrasyon ve atlanan görev başarılı sayılmaz */
const OUTCOME: Record<JobOutcome, { label: string; tone: 'green' | 'blue' | 'slate' | 'amber' | 'red' }> = {
  ok: { label: 'Başarılı', tone: 'green' },
  idle: { label: 'Çalıştı, yeni kayıt yok', tone: 'blue' },
  disabled: { label: 'Kapalı', tone: 'slate' },
  skipped: { label: 'Atlandı', tone: 'amber' },
  error: { label: 'Hatalı', tone: 'red' },
}
type SystemData = {
  db: { ok: boolean; ms: number; engine: string | null; sizeBytes: number | null; journalMode: string | null }
  scheduler: Record<string, JobState>
  internalCron: boolean
  backups: { name: string; sizeBytes: number; createdAt: string }[]
  errors: { id: string; source: string; context: string; message: string; url: string | null; count: number; createdAt: string; lastSeenAt: string; stack: string | null }[]
  checks: Check[]
  node: string
  uptimeSec: number
}

const JOBS: Record<string, { label: string; every: string }> = {
  'expire-orders': { label: 'Havale süresi takibi', every: '6 saatte bir' },
  backup: { label: 'Veritabanı yedeği', every: 'günde bir' },
  'geliver-tracking': { label: 'Geliver kargo takibi', every: 'saatte bir' },
  'navlungo-tracking': { label: 'Navlungo kargo takibi', every: '2 saatte bir' },
  'audit-retention': { label: 'İşlem kaydı saklama süresi', every: 'günde bir' },
}
const kb = (n: number | null) => (n == null ? '—' : n > 1048576 ? `${(n / 1048576).toFixed(1)} MB` : `${Math.round(n / 1024)} KB`)
const uptime = (s: number) => (s > 86400 ? `${Math.floor(s / 86400)} gün` : s > 3600 ? `${Math.floor(s / 3600)} saat` : `${Math.floor(s / 60)} dk`)

/** Sistem durumu: sağlık, zamanlanmış görevler, yedekler, hatalar ve yapılandırma kontrolü */
export default function AdminSystemPage() {
  const toast = useToast()
  const [data, setData] = useState<SystemData | null>(null)
  const [error, setError] = useState('')
  const [busy, setBusy] = useState<string | null>(null)
  const [openError, setOpenError] = useState<string | null>(null)

  const load = useCallback(async () => {
    try {
      const r = await fetch('/api/admin/system', { credentials: 'include' })
      const d = await r.json()
      if (!d.success) throw new Error(d.error)
      setData(d)
    } catch (e) {
      setError((e as Error).message || 'Sistem bilgisi alınamadı.')
    }
  }, [])
  useEffect(() => {
    void load()
  }, [load])

  const action = async (name: 'backup' | 'clear-errors') => {
    setBusy(name)
    try {
      const r = await fetch('/api/admin/system', { method: 'POST', credentials: 'include', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ action: name }) })
      const d = await r.json()
      if (!d.success) throw new Error(d.error || 'İşlem başarısız.')
      toast.success(name === 'backup' ? `Yedek alındı: ${d.file}` : 'Hata kaydı temizlendi.', name === 'backup' ? `Sunucu dışı kopya: ${d.offsite}` : undefined)
      await load()
    } catch (e) {
      toast.error((e as Error).message)
    } finally {
      setBusy(null)
    }
  }

  if (error) return <p role="alert" className="text-sm text-red-700">{error}</p>
  if (!data) return <div className="flex justify-center py-16"><Spinner /></div>

  const problems = data.checks.filter((c) => !c.ok && c.level !== 'info')

  return (
    <div className="space-y-6">
      <PageHeader
        title="Sistem Durumu"
        description={`Node ${data.node} · çalışma süresi ${uptime(data.uptimeSec)} · dış izleme için sağlık adresi: /api/health`}
        actions={<Btn onClick={() => void load()}>Yenile</Btn>}
      />

      <div className="grid gap-4 md:grid-cols-3">
        <Panel className="p-4">
          <p className="text-[12px] text-[#5d6e80]">Veritabanı</p>
          <p className="mt-1 text-lg font-semibold text-[#121926]">{data.db.ok ? 'Çalışıyor' : 'Ulaşılamıyor'}</p>
          <p className="text-[12px] text-[#5d6e80]">{data.db.engine ?? '—'} · {kb(data.db.sizeBytes)} · {data.db.ms} ms{data.db.journalMode ? ` · ${data.db.journalMode.toUpperCase()}` : ''}</p>
        </Panel>
        <Panel className="p-4">
          <p className="text-[12px] text-[#5d6e80]">Son yedek</p>
          <p className="mt-1 text-lg font-semibold text-[#121926]">{data.backups[0] ? timeAgo(data.backups[0].createdAt) : 'Yok'}</p>
          <p className="text-[12px] text-[#5d6e80]">{data.backups.length} yerel yedek · {data.scheduler.backup?.lastSummary?.split('sunucu dışı: ')[1]?.replace(')', '') ?? 'sunucu dışı kopya henüz yok'}</p>
        </Panel>
        <Panel className="p-4">
          <p className="text-[12px] text-[#5d6e80]">Yapılandırma</p>
          <p className="mt-1 text-lg font-semibold text-[#121926]">{problems.length ? `${problems.length} konu` : 'Sorun yok'}</p>
          <p className="text-[12px] text-[#5d6e80]">{data.errors.length ? `${data.errors.length} farklı hata kaydı` : 'Hata kaydı yok'}</p>
        </Panel>
      </div>

      <Panel>
        <PanelHeader title="Yapılandırma kontrolü" description="Değerler gösterilmez; yalnızca tanımlı olup olmadığı ve ne işe yaradığı." />
        <ul className="divide-y divide-[#eef1f5]">
          {data.checks.map((c) => (
            <li key={c.key} className="flex flex-col sm:flex-row sm:items-start gap-2 px-5 py-3">
              <span className="w-28 shrink-0">
                {c.ok ? <Pill tone="green" dot>Tamam</Pill> : c.level === 'error' ? <Pill tone="red" dot>Eksik</Pill> : c.level === 'warn' ? <Pill tone="amber" dot>Önerilir</Pill> : <Pill tone="slate">Bilgi</Pill>}
              </span>
              <span className="min-w-0">
                <span className="block text-sm font-medium text-[#121926]">{c.label}</span>
                {!c.ok && <span className="block text-[13px] text-[#5d6e80]">{c.hint}</span>}
              </span>
            </li>
          ))}
        </ul>
      </Panel>

      <Panel>
        <PanelHeader
          title="Zamanlanmış görevler"
          description={data.internalCron ? 'Uygulama kendi içinde çalıştırır; sunucu cron kurmak gerekmez.' : 'Uygulama içi zamanlayıcı kapalı (INTERNAL_CRON=0); görevler sunucu cron ile çalışmalı.'}
        />
        <ul className="divide-y divide-[#eef1f5]">
          {Object.entries(JOBS).map(([key, job]) => {
            const s = data.scheduler[key]
            return (
              <li key={key} className="flex flex-col sm:flex-row sm:items-center gap-2 px-5 py-3">
                <span className="w-44 shrink-0">{!s?.outcome ? <Pill tone="slate">Henüz çalışmadı</Pill> : <Pill tone={OUTCOME[s.outcome].tone} dot>{OUTCOME[s.outcome].label}</Pill>}</span>
                <span className="min-w-0 text-sm">
                  <span className="font-medium text-[#121926]">{job.label}</span> <span className="text-[#5d6e80]">· {job.every}</span>
                  {s && (
                    <span className="block text-[13px] text-[#5d6e80]">
                      Son deneme {fmtDateTime(s.lastRunAt)} · {s.outcome === 'error' ? s.lastError : s.lastSummary}
                      {s.outcome !== 'disabled' && <> · son başarılı çalışma {s.lastSuccessAt ? fmtDateTime(s.lastSuccessAt) : s.outcome === 'ok' || s.outcome === 'idle' ? fmtDateTime(s.lastRunAt) : 'yok'}</>}
                    </span>
                  )}
                </span>
              </li>
            )
          })}
        </ul>
      </Panel>

      <Panel>
        <PanelHeader
          title="Yedekler"
          description="Günlük yedek sunucuda saklanır ve sıkıştırılmış kopyası yönetici e-postasına gönderilir. Son 14 yedek tutulur."
          actions={<Btn variant="primary" onClick={() => action('backup')} loading={busy === 'backup'}>Şimdi yedek al</Btn>}
        />
        {data.backups.length === 0 ? (
          <p className="px-5 py-4 text-sm text-[#5d6e80]">Henüz yedek yok.</p>
        ) : (
          <ul className="divide-y divide-[#eef1f5]">
            {data.backups.map((b) => (
              <li key={b.name} className="flex items-center gap-3 px-5 py-2.5 text-sm">
                <span className="flex-1 min-w-0 truncate text-[#121926]">{b.name}</span>
                <span className="text-[13px] text-[#5d6e80] whitespace-nowrap">{fmtDateTime(b.createdAt)} · {kb(b.sizeBytes)}</span>
                <a className="text-[13px] font-medium text-[#0b2540] hover:underline" href={`/api/admin/system/backup?file=${encodeURIComponent(b.name)}`}>İndir</a>
              </li>
            ))}
          </ul>
        )}
      </Panel>

      <Panel>
        <PanelHeader
          title="Hata kaydı"
          description="Sunucu ve ziyaretçi tarayıcısında oluşan hatalar; aynı hata tek satırda sayılır. 30 günden eskiler silinir."
          actions={data.errors.length > 0 && <Btn variant="danger" onClick={() => action('clear-errors')} loading={busy === 'clear-errors'}>Temizle</Btn>}
        />
        {data.errors.length === 0 ? (
          <p className="px-5 py-4 text-sm text-[#5d6e80]">Kayıtlı hata yok.</p>
        ) : (
          <ul className="divide-y divide-[#eef1f5]">
            {data.errors.map((e) => (
              <li key={e.id} className="px-5 py-3 text-sm">
                <button type="button" className="w-full text-left" onClick={() => setOpenError(openError === e.id ? null : e.id)} aria-expanded={openError === e.id}>
                  <span className="flex flex-wrap items-center gap-2">
                    <Pill tone={e.source === 'server' ? 'navy' : 'blue'}>{e.source === 'server' ? 'Sunucu' : 'Tarayıcı'}</Pill>
                    <span className="font-medium text-[#121926]">{e.context}</span>
                    {e.count > 1 && <Pill tone="amber">{e.count} kez</Pill>}
                    <span className="ml-auto text-[12px] text-[#5d6e80]">son: {timeAgo(e.lastSeenAt)}</span>
                  </span>
                  <span className="mt-1 block text-[13px] text-[#3b4a5a] break-words">{e.message}</span>
                </button>
                {openError === e.id && (
                  <div className="mt-2 space-y-1 text-[12px] text-[#5d6e80]">
                    <p>İlk: {fmtDateTime(e.createdAt)}{e.url ? ` · Sayfa: ${e.url}` : ''}</p>
                    {e.stack && <pre className="max-h-64 overflow-auto rounded bg-[#f5f7fa] p-2 whitespace-pre-wrap">{e.stack}</pre>}
                  </div>
                )}
              </li>
            ))}
          </ul>
        )}
      </Panel>
    </div>
  )
}
