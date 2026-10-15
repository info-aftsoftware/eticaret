'use client'

import React, { useState } from 'react'
import Link from 'next/link'
import { useRouter } from 'next/navigation'
import { ClassicPageShell } from '@/components/ClassicPageShell'
import { Card } from '@/components/ui/card'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Button } from '@/components/ui/button'
import { Package } from 'lucide-react'
import { useAuthStore } from '@/lib/store/useAuthStore'

/**
 * Sipariş takibi: sipariş no + e-posta + telefon. Doğrulanınca bilgiler bu sekmede saklanır ve
 * sipariş sayfası (/orders/[no]) aynı bilgilerle siparişi otomatik açar.
 */
export default function OrderTrackingPage() {
  const router = useRouter()
  const { isAuthenticated } = useAuthStore()
  const [orderNo, setOrderNo] = useState('')
  const [email, setEmail] = useState('')
  const [phone, setPhone] = useState('')
  const [error, setError] = useState('')
  const [loading, setLoading] = useState(false)

  const submit = async (e: React.FormEvent) => {
    e.preventDefault()
    setError('')
    const no = orderNo.trim().toUpperCase()
    if (!/^ORD-\d{4}-\d+$/.test(no)) {
      setError('Sipariş numarası ORD-2026-00001 biçiminde olmalıdır.')
      return
    }
    setLoading(true)
    try {
      const params = new URLSearchParams({ email: email.trim(), phone: phone.trim() })
      const res = await fetch(`/api/orders/by-no/${encodeURIComponent(no)}?${params.toString()}`)
      if (!res.ok) {
        setError(res.status === 429 ? 'Çok fazla deneme yaptınız. Lütfen biraz sonra tekrar deneyin.' : 'Bu bilgilerle eşleşen sipariş bulunamadı.')
        return
      }
      try {
        sessionStorage.setItem('order-lookup', JSON.stringify({ orderNo: no, email: email.trim(), phone: phone.trim() }))
      } catch {}
      router.push(`/orders/${no}`)
    } catch {
      setError('Sipariş sorgulanamadı. Lütfen tekrar deneyin.')
    } finally {
      setLoading(false)
    }
  }

  return (
    <ClassicPageShell breadcrumbs={[{ label: 'Sipariş Takibi' }]} title="Sipariş Takibi" description="Siparişinizin durumunu ve kargo bilgisini görüntüleyin.">
      <div className="flex justify-center py-6">
        <Card className="max-w-md w-full p-6 md:p-8 classic-card rounded-lg">
          <div className="inline-flex h-12 w-12 rounded-lg bg-red-100 items-center justify-center mb-4">
            <Package className="w-6 h-6 text-brand" aria-hidden />
          </div>
          <form onSubmit={submit} className="space-y-4" noValidate>
            <div className="space-y-1">
              <Label htmlFor="orderNo">Sipariş numarası</Label>
              <Input id="orderNo" required value={orderNo} onChange={(e) => setOrderNo(e.target.value)} placeholder="ORD-2026-00001" autoComplete="off" />
            </div>
            <div className="space-y-1">
              <Label htmlFor="email">E-posta</Label>
              <Input id="email" type="email" required value={email} onChange={(e) => setEmail(e.target.value)} autoComplete="email" />
            </div>
            <div className="space-y-1">
              <Label htmlFor="phone">Telefon</Label>
              <Input id="phone" type="tel" required value={phone} onChange={(e) => setPhone(e.target.value)} placeholder="5xx xxx xx xx" autoComplete="tel" />
            </div>
            {error && <p role="alert" className="text-sm text-destructive">{error}</p>}
            <Button type="submit" className="w-full" disabled={loading || !orderNo || !email || !phone}>
              {loading ? 'Sorgulanıyor...' : 'Siparişimi Göster'}
            </Button>
          </form>
          <p className="text-xs text-ink-muted mt-4">
            Sipariş numaranız sipariş onay e-postanızda yer alır.{' '}
            {isAuthenticated ? (
              <Link href="/profile?tab=orders" className="text-brand hover:underline">Siparişlerim</Link>
            ) : (
              <>Üye iseniz <Link href="/login?redirect=/profile?tab=orders" className="text-brand hover:underline">giriş yaparak</Link> tüm siparişlerinizi görebilirsiniz.</>
            )}
          </p>
        </Card>
      </div>
    </ClassicPageShell>
  )
}
