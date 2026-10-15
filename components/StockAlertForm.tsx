'use client'

import React, { useState } from 'react'
import { Bell, Loader2 } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { useAuthStore } from '@/lib/store/useAuthStore'
import { Turnstile } from '@/components/Turnstile'

/** Stoğu biten ürün için "Stok gelince haber ver" formu. */
export function StockAlertForm({ productId }: { productId: string }) {
  const userEmail = useAuthStore((s) => s.user?.email)
  const [email, setEmail] = useState(userEmail ?? '')
  const [state, setState] = useState<'idle' | 'sending' | 'done' | 'error'>('idle')
  const [error, setError] = useState('')
  const [turnstileToken, setTurnstileToken] = useState<string | null>(null)
  const [turnstileReset, setTurnstileReset] = useState(0)

  if (state === 'done') {
    return (
      <p role="status" className="flex items-center gap-2 text-sm text-emerald-700 mb-4">
        <Bell className="w-4 h-4" aria-hidden /> Ürün stoğa girdiğinde {email} adresine haber vereceğiz.
      </p>
    )
  }

  const submit = async (e: React.FormEvent) => {
    e.preventDefault()
    setState('sending')
    setError('')
    try {
      const res = await fetch('/api/stock-alerts', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ productId, email, turnstileToken }),
      })
      setTurnstileReset((n) => n + 1)
      const data = await res.json().catch(() => null)
      if (!res.ok || !data?.success) throw new Error(data?.error || 'Kaydedilemedi.')
      setState('done')
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Kaydedilemedi.')
      setState('error')
    }
  }

  return (
    <form onSubmit={submit} className="mb-4 rounded-xl border border-palette p-3 space-y-2">
      <label htmlFor={`stock-alert-${productId}`} className="flex items-center gap-2 text-sm font-medium text-ink">
        <Bell className="w-4 h-4 text-brand" aria-hidden /> Stok gelince haber ver
      </label>
      <div className="flex gap-2">
        <Input
          id={`stock-alert-${productId}`}
          type="email"
          required
          placeholder="E-posta adresiniz"
          value={email}
          onChange={(e) => setEmail(e.target.value)}
          autoComplete="email"
        />
        <Button type="submit" disabled={state === 'sending'} className="shrink-0">
          {state === 'sending' ? <Loader2 className="w-4 h-4 animate-spin" /> : 'Haber Ver'}
        </Button>
      </div>
      <Turnstile onToken={setTurnstileToken} resetKey={turnstileReset} />
      {error && <p role="alert" className="text-xs text-destructive">{error}</p>}
      <p className="text-[11px] text-ink-muted">E-posta adresiniz yalnızca bu bildirim için kullanılır, bildirimden sonra tekrar ileti gönderilmez.</p>
    </form>
  )
}
