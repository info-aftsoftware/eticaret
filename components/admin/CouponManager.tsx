'use client'

import React, { useEffect, useState } from 'react'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Badge } from '@/components/ui/badge'
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from '@/components/ui/dialog'
import { Plus, Pencil, Trash2, Loader2, ToggleLeft, ToggleRight, Ticket } from 'lucide-react'

type Coupon = {
  id: string
  code: string
  description: string | null
  type: 'PERCENT' | 'FIXED'
  value: number
  minAmount: number | null
  maxDiscount: number | null
  usageLimit: number | null
  usedCount: number
  startDate: string | null
  endDate: string | null
  active: boolean
}

const EMPTY = {
  code: '',
  description: '',
  type: 'PERCENT' as 'PERCENT' | 'FIXED',
  value: '10',
  minAmount: '',
  maxDiscount: '',
  usageLimit: '',
  startDate: '',
  endDate: '',
  active: true,
}

const fmtTL = (n: number) => n.toLocaleString('tr-TR', { maximumFractionDigits: 2 }) + ' TL'
const fmtDate = (s: string | null) => (s ? new Date(s).toLocaleDateString('tr-TR', { timeZone: 'Europe/Istanbul' }) : null)
/** ISO tarih → Türkiye günü (YYYY-MM-DD) */
const toInputDate = (s: string | null) => (s ? new Date(new Date(s).getTime() + 3 * 3600_000).toISOString().slice(0, 10) : '')

function couponState(c: Coupon): { label: string; tone: 'ok' | 'off' | 'warn' } {
  const now = Date.now()
  if (!c.active) return { label: 'Pasif', tone: 'off' }
  if (c.startDate && new Date(c.startDate).getTime() > now) return { label: 'Başlamadı', tone: 'warn' }
  if (c.endDate && new Date(c.endDate).getTime() < now) return { label: 'Süresi doldu', tone: 'off' }
  if (c.usageLimit != null && c.usedCount >= c.usageLimit) return { label: 'Limit doldu', tone: 'off' }
  return { label: 'Geçerli', tone: 'ok' }
}

/** Yönetim paneli: kupon kodu ekleme / düzenleme / pasifleştirme / silme */
export function CouponManager() {
  const [coupons, setCoupons] = useState<Coupon[]>([])
  const [loading, setLoading] = useState(true)
  const [dialogOpen, setDialogOpen] = useState(false)
  const [editingId, setEditingId] = useState<string | null>(null)
  const [form, setForm] = useState(EMPTY)
  const [saving, setSaving] = useState(false)
  const [error, setError] = useState('')

  const load = async () => {
    try {
      const res = await fetch('/api/admin/coupons', { credentials: 'include' })
      if (res.ok) setCoupons(await res.json())
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    load()
  }, [])

  const openCreate = () => {
    setEditingId(null)
    setForm(EMPTY)
    setError('')
    setDialogOpen(true)
  }

  const openEdit = (c: Coupon) => {
    setEditingId(c.id)
    setForm({
      code: c.code,
      description: c.description ?? '',
      type: c.type,
      value: String(c.value),
      minAmount: c.minAmount != null ? String(c.minAmount) : '',
      maxDiscount: c.maxDiscount != null ? String(c.maxDiscount) : '',
      usageLimit: c.usageLimit != null ? String(c.usageLimit) : '',
      startDate: toInputDate(c.startDate),
      endDate: toInputDate(c.endDate),
      active: c.active,
    })
    setError('')
    setDialogOpen(true)
  }

  const save = async (e: React.FormEvent) => {
    e.preventDefault()
    setSaving(true)
    setError('')
    try {
      const payload = {
        ...form,
        // Türkiye saatiyle: başlangıç günü 00:00, bitiş günü 23:59 dahil (sunucu saat diliminden bağımsız)
        endDate: form.endDate ? `${form.endDate}T23:59:59+03:00` : null,
        startDate: form.startDate ? `${form.startDate}T00:00:00+03:00` : null,
      }
      const res = await fetch(editingId ? `/api/admin/coupons/${editingId}` : '/api/admin/coupons', {
        method: editingId ? 'PATCH' : 'POST',
        headers: { 'Content-Type': 'application/json' },
        credentials: 'include',
        body: JSON.stringify(payload),
      })
      const data = await res.json().catch(() => null)
      if (!res.ok) {
        setError(data?.error || 'Kaydedilemedi')
        return
      }
      setDialogOpen(false)
      await load()
    } finally {
      setSaving(false)
    }
  }

  const toggle = async (c: Coupon) => {
    await fetch(`/api/admin/coupons/${c.id}`, {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      credentials: 'include',
      body: JSON.stringify({ active: !c.active }),
    })
    await load()
  }

  const remove = async (c: Coupon) => {
    if (!confirm(`"${c.code}" kuponu silinsin mi? Bu işlem geri alınamaz. (Geçmiş siparişlerdeki kupon kaydı etkilenmez.)`)) return
    await fetch(`/api/admin/coupons/${c.id}`, { method: 'DELETE', credentials: 'include' })
    await load()
  }

  const set = (k: keyof typeof EMPTY) => (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) =>
    setForm((p) => ({ ...p, [k]: e.target.value }))

  return (
    <Card className="border-slate-200/80 bg-white shadow-sm">
      <CardHeader className="flex flex-row items-center justify-between gap-4 space-y-0">
        <div>
          <CardTitle className="text-lg flex items-center gap-2">
            <Ticket className="w-5 h-5 text-slate-500" aria-hidden />
            Kupon kodları
          </CardTitle>
          <p className="text-sm text-slate-500 mt-1">Müşteri sepette kodu girer; indirim KDV hariç ara toplamdan düşülür. Kampanyalarla birlikte kullanılabilir.</p>
        </div>
        <Button onClick={openCreate} className="shrink-0">
          <Plus className="w-4 h-4 mr-2" />
          Yeni kupon
        </Button>
      </CardHeader>
      <CardContent>
        {loading ? (
          <div className="flex items-center justify-center py-10">
            <Loader2 className="w-8 h-8 animate-spin text-slate-400" />
          </div>
        ) : coupons.length === 0 ? (
          <p className="text-slate-500 py-8 text-center">Henüz kupon tanımlanmamış.</p>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b border-slate-200 text-left text-slate-500">
                  <th className="py-2 pr-3 font-medium">Kod</th>
                  <th className="py-2 pr-3 font-medium">İndirim</th>
                  <th className="py-2 pr-3 font-medium">Koşullar</th>
                  <th className="py-2 pr-3 font-medium">Kullanım</th>
                  <th className="py-2 pr-3 font-medium">Geçerlilik</th>
                  <th className="py-2 pr-3 font-medium">Durum</th>
                  <th className="py-2 font-medium text-right">İşlem</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {coupons.map((c) => {
                  const st = couponState(c)
                  return (
                    <tr key={c.id} className="align-top">
                      <td className="py-3 pr-3">
                        <span className="font-mono font-semibold text-slate-900">{c.code}</span>
                        {c.description && <span className="block text-xs text-slate-500">{c.description}</span>}
                      </td>
                      <td className="py-3 pr-3 whitespace-nowrap">
                        {c.type === 'PERCENT' ? `%${c.value}` : fmtTL(c.value)}
                        {c.type === 'PERCENT' && c.maxDiscount ? <span className="block text-xs text-slate-500">en fazla {fmtTL(c.maxDiscount)}</span> : null}
                      </td>
                      <td className="py-3 pr-3 text-xs text-slate-600">{c.minAmount ? `En az ${fmtTL(c.minAmount)} sepet` : '—'}</td>
                      <td className="py-3 pr-3 whitespace-nowrap">
                        {c.usedCount}
                        {c.usageLimit != null ? ` / ${c.usageLimit}` : ''}
                      </td>
                      <td className="py-3 pr-3 text-xs text-slate-600 whitespace-nowrap">
                        {fmtDate(c.startDate) ?? 'Hemen'} – {fmtDate(c.endDate) ?? 'Süresiz'}
                      </td>
                      <td className="py-3 pr-3">
                        <Badge variant={st.tone === 'ok' ? 'default' : 'secondary'} className={st.tone === 'warn' ? 'bg-amber-100 text-amber-800' : undefined}>
                          {st.label}
                        </Badge>
                      </td>
                      <td className="py-3 text-right whitespace-nowrap">
                        <Button variant="ghost" size="sm" onClick={() => toggle(c)} aria-label={c.active ? `${c.code} kuponunu pasifleştir` : `${c.code} kuponunu aktifleştir`}>
                          {c.active ? <ToggleRight className="w-5 h-5 text-emerald-600" /> : <ToggleLeft className="w-5 h-5 text-slate-400" />}
                        </Button>
                        <Button variant="ghost" size="sm" onClick={() => openEdit(c)} aria-label={`${c.code} kuponunu düzenle`}>
                          <Pencil className="w-4 h-4" />
                        </Button>
                        <Button variant="ghost" size="sm" onClick={() => remove(c)} aria-label={`${c.code} kuponunu sil`}>
                          <Trash2 className="w-4 h-4 text-red-600" />
                        </Button>
                      </td>
                    </tr>
                  )
                })}
              </tbody>
            </table>
          </div>
        )}
      </CardContent>

      <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
        <DialogContent className="max-w-lg">
          <DialogHeader>
            <DialogTitle>{editingId ? 'Kuponu düzenle' : 'Yeni kupon'}</DialogTitle>
            <DialogDescription>Boş bırakılan koşullar uygulanmaz.</DialogDescription>
          </DialogHeader>
          <form onSubmit={save} className="space-y-4">
            <div className="grid grid-cols-2 gap-3">
              <div className="col-span-2 sm:col-span-1">
                <Label htmlFor="cp-code">Kupon kodu</Label>
                <Input id="cp-code" disabled={!!editingId && (coupons.find((c) => c.id === editingId)?.usedCount ?? 0) > 0} title="Kullanılmış kuponun kodu değiştirilemez" value={form.code} onChange={(e) => setForm((p) => ({ ...p, code: e.target.value.toUpperCase().replace(/\s+/g, '') }))} placeholder="HOSGELDIN" required maxLength={32} className="font-mono" />
              </div>
              <div className="col-span-2 sm:col-span-1">
                <Label htmlFor="cp-desc">Açıklama (isteğe bağlı)</Label>
                <Input id="cp-desc" value={form.description} onChange={set('description')} placeholder="Yeni üye indirimi" maxLength={200} />
              </div>
              <div>
                <Label htmlFor="cp-type">İndirim türü</Label>
                <select id="cp-type" value={form.type} onChange={set('type')} className="w-full h-10 rounded-md border border-slate-300 bg-white px-3 text-sm">
                  <option value="PERCENT">Yüzde (%)</option>
                  <option value="FIXED">Sabit tutar (TL)</option>
                </select>
              </div>
              <div>
                <Label htmlFor="cp-value">{form.type === 'PERCENT' ? 'Yüzde' : 'Tutar (TL)'}</Label>
                <Input id="cp-value" type="number" min="0.01" step="0.01" max={form.type === 'PERCENT' ? 99 : undefined} value={form.value} onChange={set('value')} required />
              </div>
              <div>
                <Label htmlFor="cp-min">En az sepet (TL, KDV hariç)</Label>
                <Input id="cp-min" type="number" min="0" step="0.01" value={form.minAmount} onChange={set('minAmount')} />
              </div>
              {form.type === 'PERCENT' ? (
                <div>
                  <Label htmlFor="cp-max">En fazla indirim (TL)</Label>
                  <Input id="cp-max" type="number" min="0" step="0.01" value={form.maxDiscount} onChange={set('maxDiscount')} />
                </div>
              ) : (
                <div />
              )}
              <div>
                <Label htmlFor="cp-limit">Toplam kullanım sınırı</Label>
                <Input id="cp-limit" type="number" min="1" step="1" value={form.usageLimit} onChange={set('usageLimit')} placeholder="Sınırsız" />
              </div>
              <div />
              <div>
                <Label htmlFor="cp-start">Başlangıç</Label>
                <Input id="cp-start" type="date" value={form.startDate} onChange={set('startDate')} />
              </div>
              <div>
                <Label htmlFor="cp-end">Bitiş (gün dahil)</Label>
                <Input id="cp-end" type="date" value={form.endDate} onChange={set('endDate')} />
              </div>
            </div>
            <label className="flex items-center gap-2 text-sm">
              <input type="checkbox" checked={form.active} onChange={(e) => setForm((p) => ({ ...p, active: e.target.checked }))} className="rounded border-slate-300" />
              Aktif
            </label>
            {error && <p role="alert" className="text-sm text-red-600">{error}</p>}
            <DialogFooter>
              <Button type="button" variant="outline" onClick={() => setDialogOpen(false)}>İptal</Button>
              <Button type="submit" disabled={saving}>
                {saving ? <Loader2 className="w-4 h-4 animate-spin mr-2" /> : null}
                {editingId ? 'Güncelle' : 'Oluştur'}
              </Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>
    </Card>
  )
}
