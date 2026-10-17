'use client'

/**
 * Sipariş satırı hızlı işlemleri (dashboard ve sipariş listesi).
 * Durum ve ödeme durumuna göre yalnızca geçerli işlemler gösterilir; işlemler
 * PATCH /api/admin/orders/[id] (lib/order-service) üzerinden yapılır, yanıt kontrol edilir.
 */

import React, { useState } from 'react'
import { Banknote, PackageCheck, Truck, CheckCircle2 } from 'lucide-react'
import { getAllCarriers } from '@/lib/shipping/carriers'
import { fmtTRY } from '@/lib/format'
import { Btn, Checkbox, Field, Modal, SelectInput, TextInput } from './ui'
import { useToast } from './toast'

export type QuickOrder = {
  id: string
  orderNo: string
  total: number
  status: string
  paymentStatus: string
  paymentMethod?: string | null
  /** Sunucunun izin verdiği sonraki durumlar (lib/order-service allowedNextStatuses) */
  allowed: string[]
}

type Dialog = null | 'paid' | 'ship' | 'deliver'

export function quickActionsFor(o: QuickOrder) {
  const paid = o.paymentStatus === 'PAID'
  const closed = o.status === 'CANCELLED' || o.status === 'RETURNED'
  return {
    markPaid: !paid && !closed && o.paymentMethod === 'bank_transfer',
    pick: paid && o.allowed.includes('PICKING'),
    ship: paid && o.allowed.includes('SHIPPED'),
    deliver: o.allowed.includes('DELIVERED'),
  }
}

export async function patchOrder(id: string, body: Record<string, unknown>) {
  const res = await fetch(`/api/admin/orders/${id}`, {
    method: 'PATCH',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(body),
    credentials: 'include',
  })
  const data = await res.json().catch(() => null)
  if (!res.ok) throw new Error(data?.error || `İşlem başarısız (${res.status})`)
  return data
}

export function OrderQuickActions({
  order,
  onDone,
  compact = false,
}: {
  order: QuickOrder
  onDone: () => void
  /** true: yalnızca simge + kısa etiket */
  compact?: boolean
}) {
  const toast = useToast()
  const [busy, setBusy] = useState<string | null>(null)
  const [dialog, setDialog] = useState<Dialog>(null)
  const carriers = getAllCarriers()
  const [carrier, setCarrier] = useState(carriers[0]?.id ?? '')
  const [tracking, setTracking] = useState('')
  const [notify, setNotify] = useState(true)
  const can = quickActionsFor(order)

  const run = async (key: string, body: Record<string, unknown>, success: string) => {
    setBusy(key)
    try {
      await patchOrder(order.id, body)
      toast.success(success, order.orderNo)
      setDialog(null)
      setTracking('')
      onDone()
    } catch (e) {
      toast.error(`${order.orderNo}: işlem yapılamadı`, e instanceof Error ? e.message : undefined)
    } finally {
      setBusy(null)
    }
  }

  if (!can.markPaid && !can.pick && !can.ship && !can.deliver) return null

  return (
    <>
      <div className="flex items-center justify-end gap-1.5 flex-wrap">
        {can.markPaid && (
          <Btn size="xs" variant="success" loading={busy === 'paid'} onClick={() => setDialog('paid')} title="Havale/EFT ödemesini onayla">
            <Banknote />
            {compact ? 'Ödendi' : 'Ödeme Alındı'}
          </Btn>
        )}
        {can.pick && (
          <Btn
            size="xs"
            variant="primary"
            loading={busy === 'pick'}
            onClick={() => run('pick', { action: 'status', status: 'PICKING' }, 'Sipariş hazırlanmaya alındı')}
            title="Hazırlanıyor durumuna al (müşteriye bilgi e-postası gider)"
          >
            <PackageCheck />
            Hazırla
          </Btn>
        )}
        {can.ship && (
          <Btn size="xs" variant={can.pick ? 'outline' : 'accent'} onClick={() => setDialog('ship')} title="Kargo bilgisini gir ve kargoya ver">
            <Truck />
            Kargola
          </Btn>
        )}
        {can.deliver && (
          <Btn size="xs" variant="outline" loading={busy === 'deliver'} onClick={() => setDialog('deliver')} title="Teslim edildi olarak işaretle">
            <CheckCircle2 />
            Teslim
          </Btn>
        )}
      </div>

      <Modal
        open={dialog === 'paid'}
        onClose={() => setDialog(null)}
        title="Ödeme alındı mı?"
        description={`${order.orderNo} · ${fmtTRY(order.total)}`}
        size="sm"
        footer={
          <>
            <Btn variant="outline" onClick={() => setDialog(null)}>Vazgeç</Btn>
            <Btn variant="success" loading={busy === 'paid'} onClick={() => run('paid', { action: 'mark_paid' }, 'Ödeme onaylandı')}>
              Ödemeyi Onayla
            </Btn>
          </>
        }
      >
        <p className="text-sm text-[#20384e]">
          Havale/EFT tutarı hesaba geçtiyse onaylayın. Müşteriye ödeme onayı ve fatura e-postası gönderilir.
        </p>
      </Modal>

      <Modal
        open={dialog === 'deliver'}
        onClose={() => setDialog(null)}
        title="Teslim edildi olarak işaretle"
        description={order.orderNo}
        size="sm"
        footer={
          <>
            <Btn variant="outline" onClick={() => setDialog(null)}>Vazgeç</Btn>
            <Btn variant="primary" loading={busy === 'deliver'} onClick={() => run('deliver', { action: 'status', status: 'DELIVERED', notifyCustomer: notify }, 'Sipariş teslim edildi olarak işaretlendi')}>
              Teslim Edildi
            </Btn>
          </>
        }
      >
        <Checkbox checked={notify} onChange={setNotify} label="Müşteriye e-posta ile bildir" />
      </Modal>

      <Modal
        open={dialog === 'ship'}
        onClose={() => setDialog(null)}
        title="Kargoya ver"
        description={`${order.orderNo} · kargo firması ve takip numarası zorunludur`}
        footer={
          <>
            <Btn variant="outline" onClick={() => setDialog(null)}>Vazgeç</Btn>
            <Btn
              variant="accent"
              loading={busy === 'ship'}
              disabled={!carrier || !tracking.trim()}
              onClick={() =>
                run('ship', { action: 'status', status: 'SHIPPED', carrier, trackingNumber: tracking.trim(), notifyCustomer: notify }, 'Sipariş kargoya verildi')
              }
            >
              <Truck className="w-4 h-4" />
              Kargoya Verildi
            </Btn>
          </>
        }
      >
        <form
          className="space-y-3"
          onSubmit={(e) => {
            e.preventDefault()
            if (carrier && tracking.trim())
              run('ship', { action: 'status', status: 'SHIPPED', carrier, trackingNumber: tracking.trim(), notifyCustomer: notify }, 'Sipariş kargoya verildi')
          }}
        >
          <Field label="Kargo firması" htmlFor={`carrier-${order.id}`}>
            <SelectInput id={`carrier-${order.id}`} value={carrier} onChange={(e) => setCarrier(e.target.value)}>
              {carriers.map((c) => (
                <option key={c.id} value={c.id}>{c.name}</option>
              ))}
            </SelectInput>
          </Field>
          <Field label="Takip numarası" htmlFor={`tracking-${order.id}`}>
            <TextInput id={`tracking-${order.id}`} value={tracking} onChange={(e) => setTracking(e.target.value)} placeholder="Örn. 1234567890" autoFocus />
          </Field>
          <Checkbox checked={notify} onChange={setNotify} label="Müşteriye takip bağlantılı e-posta gönder" />
          <button type="submit" className="hidden" aria-hidden tabIndex={-1} />
        </form>
      </Modal>
    </>
  )
}
