'use client'

/** Müşteri iptal talebi kartı (ödenmiş, kargoya verilmemiş sipariş). Onay → iptal + ücret iadesi; ret → gerekçeli e-posta. */

import React, { useState } from 'react'
import { XCircle, AlertTriangle } from 'lucide-react'
import { fmtTRY } from '@/lib/format'
import { Btn, Field, Modal, Pill, TextArea, fmtDateTime } from '@/components/admin/ui'

export type AdminCancelRequest = {
  status: 'REQUESTED' | 'APPROVED' | 'REJECTED'
  reason: string | null
  requestedAt: string
  resolvedAt?: string | null
  rejectReason?: string | null
  resolvedBy?: string | null
}

const REFUND_WARNING =
  'Onaylanınca sipariş iptal edilir, ücret iadesi başlatılmış sayılır ve müşteriye e-posta gider. Kart iadesini POS panelinden, havale iadesini ödemenin geldiği hesaba yapın.'

export function CancelRequestCard({
  request,
  total,
  paymentMethod,
  busy,
  onAction,
}: {
  request: AdminCancelRequest
  total: number
  paymentMethod?: string | null
  busy: string | null
  onAction: (key: string, body: Record<string, unknown>, successText: string) => Promise<boolean | void>
}) {
  const [dialog, setDialog] = useState<null | 'approve' | 'reject'>(null)
  const [note, setNote] = useState('')
  const [rejectReason, setRejectReason] = useState('')
  const open = request.status === 'REQUESTED'

  const run = async (key: string, body: Record<string, unknown>, text: string) => {
    const ok = await onAction(key, body, text)
    if (ok !== false) {
      setDialog(null)
      setNote('')
      setRejectReason('')
    }
  }

  return (
    <div className={open ? 'rounded-xl border-2 border-red-200 bg-red-50/60 p-4 space-y-3' : 'rounded-xl border border-[#e6ebf1] bg-white p-4 space-y-2'}>
      <div className="flex items-center justify-between gap-2">
        <p className="text-sm font-semibold text-[#121926] inline-flex items-center gap-2">
          <XCircle className={open ? 'w-4 h-4 text-red-600' : 'w-4 h-4 text-[#5d6e80]'} />
          Müşteri iptal talebi
        </p>
        <Pill tone={open ? 'red' : request.status === 'APPROVED' ? 'slate' : 'amber'}>
          {open ? 'Yanıt bekliyor' : request.status === 'APPROVED' ? 'Onaylandı' : 'Reddedildi'}
        </Pill>
      </div>
      <dl className="text-[13px] space-y-1 text-[#20384e]">
        <div><dt className="inline text-[#5d6e80]">Talep: </dt><dd className="inline">{fmtDateTime(request.requestedAt)}</dd></div>
        <div><dt className="inline text-[#5d6e80]">Neden: </dt><dd className="inline">{request.reason || 'Belirtilmedi'}</dd></div>
        {request.resolvedAt && <div><dt className="inline text-[#5d6e80]">Sonuç: </dt><dd className="inline">{fmtDateTime(request.resolvedAt)}</dd></div>}
        {request.rejectReason && <div><dt className="inline text-[#5d6e80]">Ret gerekçesi: </dt><dd className="inline">{request.rejectReason}</dd></div>}
      </dl>
      {open && (
        <div className="flex flex-wrap gap-2 pt-1">
          <Btn variant="danger" className="flex-1 sm:flex-none border-red-300" onClick={() => setDialog('approve')} disabled={busy !== null}>
            Talebi onayla ve iptal et
          </Btn>
          <Btn variant="outline" className="flex-1 sm:flex-none" onClick={() => setDialog('reject')} disabled={busy !== null}>
            Reddet
          </Btn>
        </div>
      )}

      <Modal
        open={dialog === 'approve'}
        onClose={() => setDialog(null)}
        title="İptal talebi onaylansın mı?"
        description={`İade edilecek tutar: ${fmtTRY(total)}`}
        footer={
          <>
            <Btn variant="outline" onClick={() => setDialog(null)}>Vazgeç</Btn>
            <Btn
              variant="danger"
              className="bg-red-600 text-white border-red-600 hover:bg-red-700"
              loading={busy === 'cancel-approve'}
              onClick={() => run('cancel-approve', { action: 'cancel_request', op: 'approve', note: note.trim() || undefined }, 'İptal talebi onaylandı; sipariş iptal edildi ve müşteriye bildirildi.')}
            >
              Onayla ve iptal et
            </Btn>
          </>
        }
      >
        <div className="space-y-3">
          <p className="flex gap-2 text-[13px] text-red-800 bg-red-50 border border-red-200 rounded-lg px-3 py-2.5">
            <AlertTriangle className="w-4 h-4 shrink-0 mt-0.5" />
            {REFUND_WARNING}
          </p>
          <p className="text-xs text-[#5d6e80]">Ödeme yöntemi: {paymentMethod === 'bank_transfer' ? 'Havale/EFT' : 'Kart'}</p>
          <Field label="Not (isteğe bağlı, müşteriye iletilir)" htmlFor="cancel-note">
            <TextArea id="cancel-note" rows={2} value={note} onChange={(e) => setNote(e.target.value)} maxLength={500} />
          </Field>
        </div>
      </Modal>

      <Modal
        open={dialog === 'reject'}
        onClose={() => setDialog(null)}
        title="İptal talebini reddet"
        description="Sipariş akışı değişmez; gerekçe müşteriye e-postayla gönderilir."
        footer={
          <>
            <Btn variant="outline" onClick={() => setDialog(null)}>Vazgeç</Btn>
            <Btn
              variant="primary"
              loading={busy === 'cancel-reject'}
              disabled={!rejectReason.trim()}
              onClick={() => run('cancel-reject', { action: 'cancel_request', op: 'reject', reason: rejectReason.trim() }, 'İptal talebi reddedildi; müşteriye gerekçe gönderildi.')}
            >
              Reddet
            </Btn>
          </>
        }
      >
        <Field label="Ret gerekçesi (zorunlu)" htmlFor="cancel-reject-reason">
          <TextArea id="cancel-reject-reason" rows={3} value={rejectReason} onChange={(e) => setRejectReason(e.target.value)} maxLength={500} placeholder="Örn. Siparişiniz kargoya hazırlandığı için iptal edilemiyor; teslimattan sonra iade talebi oluşturabilirsiniz." autoFocus />
        </Field>
      </Modal>
    </div>
  )
}
