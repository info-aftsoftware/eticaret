'use client'

import React, { useState } from 'react'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Loader2 } from 'lucide-react'

/** "Ödemeyi yaptım" — havale/EFT bildirimi. Bildirim siparişi ödendi yapmaz; admin hesabı kontrol edip onaylar. */
export function PaymentNoticeForm({
  total,
  alreadyNotified,
  onSubmit,
}: {
  total: number
  alreadyNotified: boolean
  onSubmit: (body: { senderName: string; bank: string; amount: number; paidOn: string; note: string }) => Promise<string | null>
}) {
  const today = new Date().toISOString().slice(0, 10)
  const [open, setOpen] = useState(false)
  const [senderName, setSenderName] = useState('')
  const [bank, setBank] = useState('')
  const [amount, setAmount] = useState(String(total))
  const [paidOn, setPaidOn] = useState(today)
  const [note, setNote] = useState('')
  const [error, setError] = useState('')
  const [sending, setSending] = useState(false)
  const [done, setDone] = useState(false)

  if (done || (alreadyNotified && !open)) {
    return (
      <div className="rounded-lg bg-white border border-amber-200 p-3 text-amber-900 space-y-2">
        <p>Ödeme bildiriminiz alındı. Ödemeniz hesabımızda görüldüğünde siparişiniz onaylanacak ve size e-posta gönderilecek.</p>
        {!done && <Button variant="outline" size="sm" onClick={() => setOpen(true)}>Yeni bildirim gönder</Button>}
      </div>
    )
  }
  if (!open) {
    return <Button variant="outline" className="bg-white" onClick={() => setOpen(true)}>Ödemeyi yaptım, bildir</Button>
  }

  const submit = async (e: React.FormEvent) => {
    e.preventDefault()
    setError('')
    setSending(true)
    const err = await onSubmit({ senderName, bank, amount: Number(amount.replace(',', '.')), paidOn, note })
    setSending(false)
    if (err) return setError(err)
    setDone(true)
  }

  return (
    <form onSubmit={submit} className="rounded-lg bg-white border border-amber-200 p-3 space-y-3 text-gray-800">
      <p className="font-medium">Havale / EFT bildirimi</p>
      <div className="grid gap-3 sm:grid-cols-2">
        <div className="space-y-1">
          <Label htmlFor="pn-sender">Gönderen ad soyad</Label>
          <Input id="pn-sender" required value={senderName} onChange={(e) => setSenderName(e.target.value)} maxLength={120} />
        </div>
        <div className="space-y-1">
          <Label htmlFor="pn-bank">Gönderen banka</Label>
          <Input id="pn-bank" required value={bank} onChange={(e) => setBank(e.target.value)} maxLength={80} />
        </div>
        <div className="space-y-1">
          <Label htmlFor="pn-amount">Tutar (TL)</Label>
          <Input id="pn-amount" required inputMode="decimal" value={amount} onChange={(e) => setAmount(e.target.value)} />
        </div>
        <div className="space-y-1">
          <Label htmlFor="pn-date">Ödeme tarihi</Label>
          <Input id="pn-date" type="date" required max={today} value={paidOn} onChange={(e) => setPaidOn(e.target.value)} />
        </div>
      </div>
      <div className="space-y-1">
        <Label htmlFor="pn-note">Not (isteğe bağlı)</Label>
        <Input id="pn-note" value={note} onChange={(e) => setNote(e.target.value)} maxLength={500} />
      </div>
      {error && <p role="alert" className="text-sm text-destructive">{error}</p>}
      <div className="flex gap-2">
        <Button type="submit" disabled={sending}>{sending && <Loader2 className="w-4 h-4 animate-spin mr-1" />}Bildirimi Gönder</Button>
        <Button type="button" variant="ghost" onClick={() => setOpen(false)}>Vazgeç</Button>
      </div>
    </form>
  )
}
