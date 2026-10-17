'use client'

import React, { useState } from 'react'
import Link from 'next/link'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { Textarea } from '@/components/ui/textarea'
import { Loader2, RotateCcw } from 'lucide-react'
import { SELLER } from '@/lib/legal/company'
import type { OrderView } from '@/lib/order-view'

const TYPES = [
  { value: 'withdrawal', label: 'Cayma hakkı (14 gün içinde, gerekçesiz)' },
  { value: 'defective', label: 'Ayıplı / hasarlı ürün' },
  { value: 'wrong_item', label: 'Yanlış ürün gönderildi' },
] as const

const STATUS_CLASS: Record<string, string> = {
  REQUESTED: 'bg-amber-100 text-amber-800',
  APPROVED: 'bg-blue-100 text-blue-800',
  RECEIVED: 'bg-indigo-100 text-indigo-800',
  REFUNDED: 'bg-green-100 text-green-800',
  REJECTED: 'bg-red-100 text-red-800',
  CANCELLED: 'bg-gray-100 text-gray-700',
}

/** Müşteri: iade / cayma talebi oluşturma ve talep durumları. */
export function ReturnSection({
  order,
  onSubmit,
  onCancel,
}: {
  order: OrderView
  onSubmit: (body: { type: string; items: { lineId: string; quantity: number }[]; reason: string; note: string }) => Promise<string | null>
  onCancel: (returnId: string) => Promise<string | null>
}) {
  const returns = order.returns
  const [open, setOpen] = useState(false)
  const [type, setType] = useState<string>(returns?.canWithdraw ? 'withdrawal' : 'defective')
  const [qty, setQty] = useState<Record<string, number>>({})
  const [reason, setReason] = useState('')
  const [note, setNote] = useState('')
  const [error, setError] = useState('')
  const [sending, setSending] = useState(false)

  const requests = order.returnRequests ?? []
  const canCreate = !!returns && (returns.canWithdraw || returns.canReportDefect)
  const hasPending = requests.some((r) => r.status === 'REQUESTED')
  if (!canCreate && requests.length === 0) return null

  const submit = async (e: React.FormEvent) => {
    e.preventDefault()
    setError('')
    const items = Object.entries(qty).filter(([, q]) => q > 0).map(([lineId, quantity]) => ({ lineId, quantity }))
    if (items.length === 0) return setError('İade edilecek en az bir ürün seçin.')
    if (type !== 'withdrawal' && !reason.trim()) return setError('Lütfen sorunu kısaca açıklayın.')
    setSending(true)
    const err = await onSubmit({ type, items, reason, note })
    setSending(false)
    if (err) return setError(err)
    setOpen(false)
    setQty({})
    setReason('')
    setNote('')
  }

  return (
    <Card className="rounded-xl border border-[#e6ebf1] shadow-[0_1px_2px_rgba(16,24,40,0.04)]">
      <CardHeader className="border-b"><CardTitle className="text-base flex items-center gap-2"><RotateCcw className="w-4 h-4" />İade ve Cayma</CardTitle></CardHeader>
      <CardContent className="pt-4 space-y-4 text-sm">
        {requests.map((r) => (
          <div key={r.id} className="rounded-lg border border-gray-200 p-3 space-y-1.5">
            <div className="flex flex-wrap items-center justify-between gap-2">
              <span className="font-semibold">{r.requestNo}</span>
              <Badge className={STATUS_CLASS[r.status] ?? ''}>{r.statusLabel}</Badge>
            </div>
            <p className="text-gray-600">{r.typeLabel}</p>
            <p className="text-gray-800">{r.items.map((i) => `${i.name} × ${i.quantity}`).join(', ')}</p>
            {r.status === 'REQUESTED' && (
              <div className="flex flex-wrap items-center justify-between gap-2">
                <p className="text-gray-600">Talebiniz inceleniyor. İade kodu e-posta ile gönderilecek; lütfen kod gelmeden ürünü göndermeyin.</p>
                <Button variant="outline" size="sm" onClick={async () => { const e = await onCancel(r.id); if (e) setError(e) }}>Talebi Geri Çek</Button>
              </div>
            )}
            {r.status === 'APPROVED' && (
              <div className="rounded-md bg-amber-50 border border-amber-200 p-2 text-amber-900 space-y-0.5">
                <p className="font-medium">Ürünü 10 gün içinde aşağıdaki bilgilerle gönderin:</p>
                {r.carrierName && <p>Kargo firması: <strong>{r.carrierName}</strong></p>}
                {r.returnCode && <p>İade kodu: <strong className="font-mono">{r.returnCode}</strong></p>}
                <p>Alıcı: {SELLER.shortLegalName}</p>
                <p>Adres: {SELLER.address}</p>
              </div>
            )}
            {r.status === 'REJECTED' && r.rejectReason && <p className="text-red-700">Gerekçe: {r.rejectReason}</p>}
            {r.status === 'REFUNDED' && r.refundAmount != null && (
              <p className="text-green-700">
                {r.refundAmount.toLocaleString('tr-TR', { style: 'currency', currency: 'TRY' })} ödeme yaptığınız yönteme iade edildi.
              </p>
            )}
          </div>
        ))}

        {canCreate && !hasPending && !open && (
          <div className="space-y-2">
            {returns?.canWithdraw && returns.withdrawalUntil && (
              <p className="text-gray-600">
                Cayma hakkınızı <strong>{returns.withdrawalUntil.toLocaleDateString('tr-TR', { day: '2-digit', month: 'long', year: 'numeric' })}</strong> tarihine
                kadar gerekçe göstermeden kullanabilirsiniz.
              </p>
            )}
            <Button variant="outline" onClick={() => setOpen(true)}>İade Talebi Oluştur</Button>
          </div>
        )}

        {open && (
          <form onSubmit={submit} className="space-y-3 border-t pt-3">
            <fieldset className="space-y-1.5">
              <legend className="font-medium text-gray-900 mb-1">Talep türü</legend>
              {TYPES.filter((t) => (t.value === 'withdrawal' ? returns?.canWithdraw : returns?.canReportDefect)).map((t) => (
                <label key={t.value} className="flex items-center gap-2 cursor-pointer">
                  <input type="radio" name="returnType" value={t.value} checked={type === t.value} onChange={() => setType(t.value)} className="w-4 h-4" />
                  {t.label}
                </label>
              ))}
            </fieldset>

            <fieldset className="space-y-1.5">
              <legend className="font-medium text-gray-900 mb-1">İade edilecek ürünler</legend>
              {order.items.map((item) => {
                const max = returns?.returnable[item.id] ?? 0
                return (
                  <div key={item.id} className="flex items-center justify-between gap-3">
                    <label htmlFor={`rq-${item.id}`} className={max === 0 ? 'text-gray-400' : ''}>
                      {item.name} {max === 0 && '(iade edilmiş)'}
                    </label>
                    <select
                      id={`rq-${item.id}`}
                      disabled={max === 0}
                      value={qty[item.id] ?? 0}
                      onChange={(e) => setQty((p) => ({ ...p, [item.id]: Number(e.target.value) }))}
                      className="h-9 rounded-md border border-gray-300 px-2 bg-white"
                    >
                      {Array.from({ length: max + 1 }, (_, n) => <option key={n} value={n}>{n}</option>)}
                    </select>
                  </div>
                )
              })}
            </fieldset>

            <div className="space-y-1">
              <label htmlFor="return-reason" className="font-medium text-gray-900">
                {type === 'withdrawal' ? 'İade nedeni (isteğe bağlı)' : 'Sorunu kısaca açıklayın'}
              </label>
              <Textarea id="return-reason" rows={3} value={reason} onChange={(e) => setReason(e.target.value)} maxLength={1000} />
            </div>
            <div className="space-y-1">
              <label htmlFor="return-note" className="font-medium text-gray-900">Not (isteğe bağlı)</label>
              <Textarea id="return-note" rows={2} value={note} onChange={(e) => setNote(e.target.value)} maxLength={2000} />
            </div>
            <p className="text-xs text-gray-500">
              Talebiniz onaylandığında anlaşmalı kargo firması ve iade kodu e-postanıza gönderilir; bu kodla gönderimde kargo ücreti bize aittir.
              Ayrıntılar: <Link href="/pages/iade-ve-cayma-kosullari" className="text-brand hover:underline" target="_blank">İade ve Cayma Koşulları</Link>
            </p>
            {error && <p role="alert" className="text-destructive">{error}</p>}
            <div className="flex gap-2">
              <Button type="submit" disabled={sending}>{sending && <Loader2 className="w-4 h-4 animate-spin mr-1" />}Talebi Gönder</Button>
              <Button type="button" variant="ghost" onClick={() => setOpen(false)}>Vazgeç</Button>
            </div>
          </form>
        )}
        {!open && error && <p role="alert" className="text-destructive">{error}</p>}
      </CardContent>
    </Card>
  )
}
