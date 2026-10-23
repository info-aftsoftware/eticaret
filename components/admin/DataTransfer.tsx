'use client'

import React, { useState } from 'react'
import { Download, Upload } from 'lucide-react'
import { Btn, Field, Modal, Pill, TextInput, btnClass } from '@/components/admin/ui'
import { useToast } from '@/components/admin/toast'
import { businessDateKey } from '@/lib/business-time'

/** İndirme bağlantısı (CSV uçları dosya adını kendisi verir) */
export function DownloadLink({ href, children }: { href: string; children: React.ReactNode }) {
  return (
    <a href={href} className={btnClass('outline', 'sm')} download>
      <Download />
      {children}
    </a>
  )
}

type PlanRow = {
  line: number
  id: string | null
  name: string | null
  oldStock: number | null
  newStock: number | null
  oldPrice: number | null
  newPrice: number | null
  status: 'change' | 'same' | 'error'
  message?: string
}
type Plan = { rows: PlanRow[]; changes: number; errors: number; columns: { stock: boolean; price: boolean } }

const tl = (n: number | null) => (n == null ? '—' : n.toLocaleString('tr-TR', { maximumFractionDigits: 2 }))

/** Ürünler & Stok: katalog CSV'si dışa aktar + düzenlenmiş dosyayı ön izlemeyle içe aktar */
export function StockPriceTransfer({ onApplied }: { onApplied: () => void }) {
  const toast = useToast()
  const [open, setOpen] = useState(false)
  const [csv, setCsv] = useState('')
  const [fileName, setFileName] = useState('')
  const [plan, setPlan] = useState<Plan | null>(null)
  const [busy, setBusy] = useState(false)

  const reset = () => {
    setCsv('')
    setFileName('')
    setPlan(null)
  }
  const send = async (apply: boolean, text = csv) => {
    setBusy(true)
    try {
      const res = await fetch('/api/admin/imports/stock-price', {
        method: 'POST',
        credentials: 'include',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ csv: text, apply }),
      })
      const d = await res.json()
      if (!res.ok || !d.success) throw new Error(d.error || 'Dosya okunamadı.')
      if (apply) {
        toast.success('İçe aktarma tamamlandı', `${d.stockUpdated} stok, ${d.priceUpdated} fiyat güncellendi${d.errors ? `; ${d.errors} satır atlandı` : ''}.`)
        setOpen(false)
        reset()
        onApplied()
      } else setPlan(d)
    } catch (e) {
      toast.error((e as Error).message)
    } finally {
      setBusy(false)
    }
  }
  const onFile = async (f: File | undefined) => {
    if (!f) return
    const text = await f.text()
    setCsv(text)
    setFileName(f.name)
    await send(false, text)
  }

  const shown = plan ? [...plan.rows.filter((r) => r.status === 'error'), ...plan.rows.filter((r) => r.status === 'change')].slice(0, 100) : []

  return (
    <>
      <DownloadLink href="/api/admin/exports/catalog">Dışa aktar</DownloadLink>
      <Btn variant="outline" onClick={() => setOpen(true)}>
        <Upload />
        İçe aktar
      </Btn>
      <Modal
        open={open}
        onClose={() => { setOpen(false); reset() }}
        size="lg"
        title="Stok ve fiyat içe aktar"
        description="Dışa aktarılan dosyada Stok ve Fiyat (KDV hariç) sütunlarını düzenleyip CSV olarak kaydedin. Önce ön izleme gösterilir; onaylamadan hiçbir şey değişmez."
        footer={
          <>
            <Btn onClick={() => { setOpen(false); reset() }}>Vazgeç</Btn>
            <Btn variant="primary" disabled={!plan || plan.changes === 0} loading={busy && !!plan} onClick={() => send(true)}>
              {plan ? `${plan.changes} değişikliği uygula` : 'Uygula'}
            </Btn>
          </>
        }
      >
        <div className="space-y-4 text-sm">
          <Field label="CSV dosyası" htmlFor="import-file" hint="Ürün kodu veya SKU ile eşlenir. Excel'de: Farklı kaydet > CSV UTF-8.">
            <input id="import-file" type="file" accept=".csv,text/csv" onChange={(e) => onFile(e.target.files?.[0])} className="block text-sm" />
          </Field>
          {fileName && !plan && busy && <p className="text-[#5d6e80]">Okunuyor…</p>}
          {plan && (
            <>
              <p className="flex flex-wrap gap-2">
                <Pill tone="green">{plan.changes} değişecek</Pill>
                <Pill tone="slate">{plan.rows.length - plan.changes - plan.errors} aynı</Pill>
                {plan.errors > 0 && <Pill tone="red">{plan.errors} hatalı (atlanacak)</Pill>}
              </p>
              {shown.length > 0 && (
                <div className="max-h-[50vh] overflow-auto rounded-lg border border-[#e6ebf1]">
                  <table className="w-full text-[13px]">
                    <thead className="sticky top-0 bg-[#f5f7fa] text-left text-[12px] text-[#5d6e80]">
                      <tr>
                        <th className="px-3 py-2">Satır</th>
                        <th className="px-3 py-2">Ürün</th>
                        {plan.columns.stock && <th className="px-3 py-2">Stok</th>}
                        {plan.columns.price && <th className="px-3 py-2">Fiyat (KDV hariç)</th>}
                        <th className="px-3 py-2">Durum</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-[#eef1f5]">
                      {shown.map((r) => (
                        <tr key={r.line}>
                          <td className="px-3 py-1.5 text-[#5d6e80]">{r.line}</td>
                          <td className="px-3 py-1.5">{r.name ?? r.id ?? '—'}</td>
                          {plan.columns.stock && <td className="px-3 py-1.5 whitespace-nowrap">{r.newStock != null && r.newStock !== r.oldStock ? `${r.oldStock ?? '—'} → ${r.newStock}` : tl(r.oldStock)}</td>}
                          {plan.columns.price && <td className="px-3 py-1.5 whitespace-nowrap">{r.newPrice != null && r.newPrice !== r.oldPrice ? `${tl(r.oldPrice)} → ${tl(r.newPrice)}` : tl(r.oldPrice)}</td>}
                          <td className="px-3 py-1.5">{r.status === 'error' ? <span className="text-red-700">{r.message}</span> : 'Değişecek'}</td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              )}
            </>
          )}
        </div>
      </Modal>
    </>
  )
}

/** Siparişler: tarih aralığıyla muhasebe dökümü (özet ve satır detayı) */
export function OrdersExport() {
  const [open, setOpen] = useState(false)
  // Türkiye günü: gece 00.00–03.00 arasında UTC tarihi bir gün geride kalıyordu
  const today = businessDateKey()
  const monthStart = today.slice(0, 8) + '01'
  const [from, setFrom] = useState(monthStart)
  const [to, setTo] = useState(today)
  const q = `from=${from}&to=${to}`
  return (
    <>
      <Btn variant="outline" onClick={() => setOpen(true)}>
        <Download />
        Muhasebe dökümü
      </Btn>
      <Modal
        open={open}
        onClose={() => setOpen(false)}
        title="Muhasebe dökümü"
        description="Seçilen tarihlerdeki siparişler Excel uyumlu CSV olarak iner: fatura bilgileri, KDV matrahı, KDV, kargo, indirimler ve ödeme durumu."
        footer={<Btn onClick={() => setOpen(false)}>Kapat</Btn>}
      >
        <div className="space-y-4">
          <div className="grid grid-cols-2 gap-3">
            <Field label="Başlangıç" htmlFor="exp-from"><TextInput id="exp-from" type="date" value={from} max={to} onChange={(e) => setFrom(e.target.value)} /></Field>
            <Field label="Bitiş" htmlFor="exp-to"><TextInput id="exp-to" type="date" value={to} min={from} onChange={(e) => setTo(e.target.value)} /></Field>
          </div>
          <p className="text-xs text-[#5d6e80]">Tarihler sipariş tarihidir ve Türkiye saatine göre gün başından gün sonuna kadar alınır.</p>
          {!from || !to || from > to ? (
            <p role="alert" className="text-[13px] text-red-700">Başlangıç tarihi bitiş tarihinden sonra olamaz; iki tarihi de seçin.</p>
          ) : (
            <div className="flex flex-wrap gap-2">
              <DownloadLink href={`/api/admin/exports/orders?${q}`}>Sipariş özeti</DownloadLink>
              <DownloadLink href={`/api/admin/exports/orders?${q}&detail=lines`}>Satır detayı (ürün bazında)</DownloadLink>
            </div>
          )}
        </div>
      </Modal>
    </>
  )
}

type ShipRow = { line: number; orderNo: string; carrierName: string | null; trackingNumber: string; status: 'ship' | 'error'; message?: string }
type ShipPlan = { rows: ShipRow[]; ready: number; errors: number }

/** Siparişler: CSV ile toplu kargolama (ön izlemeli) + hazırlanan siparişlerin kargo etiketleri */
export function BulkShipping({ onApplied }: { onApplied: () => void }) {
  const toast = useToast()
  const [open, setOpen] = useState(false)
  const [csv, setCsv] = useState('')
  const [plan, setPlan] = useState<ShipPlan | null>(null)
  const [busy, setBusy] = useState(false)
  const close = () => {
    setOpen(false)
    setCsv('')
    setPlan(null)
  }
  const send = async (apply: boolean, text = csv) => {
    setBusy(true)
    try {
      const res = await fetch('/api/admin/shipping/bulk', {
        method: 'POST',
        credentials: 'include',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ csv: text, apply }),
      })
      const d = await res.json()
      if (!res.ok || !d.success) throw new Error(d.error || 'Dosya okunamadı.')
      if (apply) {
        const failed = (d.results as { ok: boolean }[]).filter((r) => !r.ok).length
        toast.success('Toplu kargolama tamamlandı', `${d.shipped} sipariş kargoya verildi${failed ? `, ${failed} başarısız` : ''}; müşterilere takip e-postası gönderildi.`)
        close()
        onApplied()
      } else setPlan(d)
    } catch (e) {
      toast.error((e as Error).message)
    } finally {
      setBusy(false)
    }
  }
  return (
    <>
      <a href="/api/admin/shipping/labels?status=PICKING" target="_blank" rel="noopener noreferrer" className={btnClass('outline', 'sm')}>
        <Download />
        Kargo etiketleri
      </a>
      <Btn variant="outline" onClick={() => setOpen(true)}>
        <Upload />
        Toplu kargola
      </Btn>
      <Modal
        open={open}
        onClose={close}
        size="lg"
        title="Toplu kargolama"
        description='CSV sütunları: "Sipariş no", "Kargo firması", "Takip no". Onaylanınca siparişler kargoya verildi olur ve müşterilere takip e-postası gider.'
        footer={
          <>
            <Btn onClick={close}>Vazgeç</Btn>
            <Btn variant="primary" disabled={!plan || plan.ready === 0} loading={busy && !!plan} onClick={() => send(true)}>
              {plan ? `${plan.ready} siparişi kargola` : 'Kargola'}
            </Btn>
          </>
        }
      >
        <div className="space-y-4 text-sm">
          <Field label="CSV dosyası" htmlFor="ship-file" hint="Kargo firmasının gönderi listesini bu üç sütuna indirgeyip CSV olarak kaydedin.">
            <input
              id="ship-file"
              type="file"
              accept=".csv,text/csv"
              className="block text-sm"
              onChange={async (e) => {
                const f = e.target.files?.[0]
                if (!f) return
                const text = await f.text()
                setCsv(text)
                await send(false, text)
              }}
            />
          </Field>
          {plan && (
            <>
              <p className="flex flex-wrap gap-2">
                <Pill tone="green">{plan.ready} kargolanacak</Pill>
                {plan.errors > 0 && <Pill tone="red">{plan.errors} hatalı (atlanacak)</Pill>}
              </p>
              <div className="max-h-[50vh] overflow-auto rounded-lg border border-[#e6ebf1]">
                <table className="w-full text-[13px]">
                  <thead className="sticky top-0 bg-[#f5f7fa] text-left text-[12px] text-[#5d6e80]">
                    <tr>
                      <th className="px-3 py-2">Sipariş</th>
                      <th className="px-3 py-2">Kargo</th>
                      <th className="px-3 py-2">Takip no</th>
                      <th className="px-3 py-2">Durum</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-[#eef1f5]">
                    {plan.rows.map((r) => (
                      <tr key={r.line}>
                        <td className="px-3 py-1.5">{r.orderNo || `Satır ${r.line}`}</td>
                        <td className="px-3 py-1.5">{r.carrierName ?? '—'}</td>
                        <td className="px-3 py-1.5">{r.trackingNumber || '—'}</td>
                        <td className="px-3 py-1.5">{r.status === 'error' ? <span className="text-red-700">{r.message}</span> : 'Kargolanacak'}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </>
          )}
        </div>
      </Modal>
    </>
  )
}
