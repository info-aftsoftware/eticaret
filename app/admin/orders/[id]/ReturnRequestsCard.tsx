'use client'

import React, { useState } from 'react'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Badge } from '@/components/ui/badge'
import { Loader2, RotateCcw } from 'lucide-react'
import { fmtTRY } from '@/lib/format'

export type AdminReturnRequest = {
  id: string
  requestNo: string
  typeLabel: string
  status: string
  statusLabel: string
  items: { lineId: string; name: string; quantity: number }[]
  reason: string | null
  customerNote: string | null
  rejectReason: string | null
  returnCarrierName: string | null
  returnCode: string | null
  refundAmount: number | null
  suggestedRefund: number
  createdAt: string
}

const STATUS_CLASS: Record<string, string> = {
  REQUESTED: 'bg-amber-100 text-amber-800 border-0',
  APPROVED: 'bg-blue-100 text-blue-800 border-0',
  RECEIVED: 'bg-indigo-100 text-indigo-800 border-0',
  REFUNDED: 'bg-green-100 text-green-800 border-0',
  REJECTED: 'bg-red-100 text-red-800 border-0',
  CANCELLED: 'bg-slate-100 text-slate-700 border-0',
}

/** Admin: sipariş iade talepleri ve durum işlemleri. */
export function ReturnRequestsCard({
  requests,
  carriers,
  busy,
  onAction,
}: {
  requests: AdminReturnRequest[]
  carriers: { id: string; name: string }[]
  busy: string | null
  onAction: (key: string, body: Record<string, unknown>, successText: string, confirmText?: string) => void
}) {
  const [form, setForm] = useState<Record<string, { carrier?: string; code?: string; reason?: string; amount?: string }>>({})
  const f = (id: string) => form[id] ?? {}
  const set = (id: string, patch: Record<string, string>) => setForm((p) => ({ ...p, [id]: { ...p[id], ...patch } }))

  if (requests.length === 0) return null

  return (
    <Card id="iade" className="border-slate-200/80 bg-white shadow-sm">
      <CardHeader><CardTitle className="text-base flex items-center gap-2"><RotateCcw className="w-4 h-4" />İade Talepleri</CardTitle></CardHeader>
      <CardContent className="space-y-4">
        {requests.map((r) => {
          const key = `return-${r.id}`
          const loading = busy?.startsWith(key)
          return (
            <div key={r.id} className="rounded-lg border border-slate-200 p-3 space-y-2 text-sm">
              <div className="flex flex-wrap items-center justify-between gap-2">
                <span className="font-semibold">{r.requestNo}</span>
                <Badge className={STATUS_CLASS[r.status] ?? ''}>{r.statusLabel}</Badge>
              </div>
              <p className="text-slate-600">{r.typeLabel} · {new Date(r.createdAt).toLocaleDateString('tr-TR')}</p>
              <ul className="list-disc pl-5 text-slate-800">
                {r.items.map((i) => <li key={i.lineId}>{i.name} × {i.quantity}</li>)}
              </ul>
              {r.reason && <p><span className="font-medium">Neden:</span> {r.reason}</p>}
              {r.customerNote && <p><span className="font-medium">Not:</span> {r.customerNote}</p>}
              {r.returnCode && <p>{r.returnCarrierName} · iade kodu <span className="font-mono">{r.returnCode}</span></p>}
              {r.rejectReason && <p className="text-red-700">Ret gerekçesi: {r.rejectReason}</p>}
              {r.refundAmount != null && <p className="text-green-700">İade edilen: {fmtTRY(r.refundAmount)}</p>}

              {r.status === 'REQUESTED' && (
                <div className="space-y-2 pt-1 border-t border-slate-100">
                  <div className="grid gap-2 sm:grid-cols-2">
                    <div className="space-y-1">
                      <Label htmlFor={`${key}-carrier`}>İade kargo firması</Label>
                      <select
                        id={`${key}-carrier`}
                        value={f(r.id).carrier ?? carriers[0]?.id ?? ''}
                        onChange={(e) => set(r.id, { carrier: e.target.value })}
                        className="w-full h-10 rounded-md border border-slate-200 px-3 text-sm bg-white"
                      >
                        {carriers.map((c) => <option key={c.id} value={c.id}>{c.name}</option>)}
                      </select>
                    </div>
                    <div className="space-y-1">
                      <Label htmlFor={`${key}-code`}>İade kodu</Label>
                      <Input id={`${key}-code`} value={f(r.id).code ?? ''} onChange={(e) => set(r.id, { code: e.target.value })} placeholder="Anlaşmalı kargo kodu" />
                    </div>
                  </div>
                  <Button
                    className="w-full"
                    disabled={!!busy || !(f(r.id).code ?? '').trim()}
                    onClick={() => onAction(`${key}-approve`, { action: 'return', returnId: r.id, op: 'approve', carrier: f(r.id).carrier ?? carriers[0]?.id, code: f(r.id).code }, 'İade talebi onaylandı; müşteriye kargo ve iade kodu gönderildi.')}
                  >
                    {loading && busy?.endsWith('approve') ? <Loader2 className="w-4 h-4 animate-spin mr-2" /> : null}
                    Onayla ve İade Kodunu Gönder
                  </Button>
                  <div className="flex gap-2">
                    <Input value={f(r.id).reason ?? ''} onChange={(e) => set(r.id, { reason: e.target.value })} placeholder="Ret gerekçesi (müşteriye gider)" aria-label="Ret gerekçesi" />
                    <Button
                      variant="outline"
                      className="border-red-300 text-red-700 hover:bg-red-50 shrink-0"
                      disabled={!!busy || !(f(r.id).reason ?? '').trim()}
                      onClick={() => onAction(`${key}-reject`, { action: 'return', returnId: r.id, op: 'reject', reason: f(r.id).reason }, 'İade talebi reddedildi.', 'Talep reddedilecek ve müşteriye gerekçe gönderilecek. Emin misiniz?')}
                    >
                      Reddet
                    </Button>
                  </div>
                </div>
              )}

              {r.status === 'APPROVED' && (
                <Button
                  className="w-full"
                  disabled={!!busy}
                  onClick={() => onAction(`${key}-receive`, { action: 'return', returnId: r.id, op: 'receive' }, 'Ürünler teslim alındı ve stoğa eklendi.', 'İade edilen ürünler depoya ulaştı ve kontrol edildi mi? Stoğa geri eklenecek.')}
                >
                  Ürün Teslim Alındı
                </Button>
              )}

              {r.status === 'RECEIVED' && (
                <div className="space-y-1 pt-1 border-t border-slate-100">
                  <Label htmlFor={`${key}-amount`}>İade tutarı (önerilen: {fmtTRY(r.suggestedRefund)})</Label>
                  <div className="flex gap-2">
                    <Input
                      id={`${key}-amount`}
                      type="number"
                      step="0.01"
                      min="0"
                      value={f(r.id).amount ?? String(r.suggestedRefund)}
                      onChange={(e) => set(r.id, { amount: e.target.value })}
                    />
                    <Button
                      className="bg-green-600 hover:bg-green-700 shrink-0"
                      disabled={!!busy}
                      onClick={() => {
                        const amount = Number(f(r.id).amount ?? r.suggestedRefund)
                        onAction(`${key}-refund`, { action: 'return', returnId: r.id, op: 'refund', amount }, 'Ücret iadesi kaydedildi ve müşteriye bildirildi.', `${fmtTRY(amount)} müşteriye iade edildi mi? (Banka/ödeme sağlayıcısı panelinden iadeyi yaptıktan sonra onaylayın.)`)
                      }}
                    >
                      İade Yapıldı
                    </Button>
                  </div>
                  <p className="text-xs text-slate-500">Önerilen tutar: iade edilen ürünlerin indirimli payı; siparişin tamamı iade ediliyorsa kargo ücreti dahil.</p>
                </div>
              )}
            </div>
          )
        })}
      </CardContent>
    </Card>
  )
}
