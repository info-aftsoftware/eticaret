'use client'

import React, { useState } from 'react'
import Link from 'next/link'
import { useRouter } from 'next/navigation'
import { EmailAuthProvider, reauthenticateWithCredential } from 'firebase/auth'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Loader2, Trash2 } from 'lucide-react'
import { getAuth } from '@/lib/firebase/config'
import { useAuthStore } from '@/lib/store/useAuthStore'

/**
 * KVKK — hesabı silme. Şifreyle yeniden doğrulama → DELETE /api/account → çıkış.
 * Siparişler yasal saklama süresi boyunca tutulur (hesapla bağlantısı kaldırılır).
 */
export function DeleteAccountCard() {
  const router = useRouter()
  const logout = useAuthStore((s) => s.logout)
  const [open, setOpen] = useState(false)
  const [password, setPassword] = useState('')
  const [confirmText, setConfirmText] = useState('')
  const [error, setError] = useState('')
  const [loading, setLoading] = useState(false)

  const submit = async (e: React.FormEvent) => {
    e.preventDefault()
    setError('')
    const current = getAuth().currentUser
    if (!current?.email) return setError('Oturum bulunamadı. Lütfen yeniden giriş yapın.')
    setLoading(true)
    try {
      await reauthenticateWithCredential(current, EmailAuthProvider.credential(current.email, password))
      const token = await current.getIdToken(true)
      const res = await fetch('/api/account', { method: 'DELETE', headers: { Authorization: `Bearer ${token}` } })
      const data = await res.json().catch(() => null)
      if (!res.ok || !data?.success) throw new Error(data?.error || 'Hesap silinemedi.')
      try {
        localStorage.removeItem('cart-storage')
      } catch {}
      logout()
      router.push('/?hesap=silindi')
    } catch (err: unknown) {
      const code = (err as { code?: string })?.code
      setError(
        code === 'auth/wrong-password' || code === 'auth/invalid-credential'
          ? 'Şifre hatalı.'
          : err instanceof Error ? err.message : 'Hesap silinemedi.'
      )
    } finally {
      setLoading(false)
    }
  }

  return (
    <Card className="classic-card rounded-lg border-red-200">
      <CardHeader>
        <CardTitle className="flex items-center gap-2 text-red-700">
          <Trash2 className="w-5 h-5" />
          Hesabı Sil
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-3 text-sm text-ink-muted">
        <p>
          Hesabınızı sildiğinizde üyelik bilgileriniz, kayıtlı adresleriniz, favorileriniz ve bülten aboneliğiniz kalıcı olarak silinir.
          Verdiğiniz siparişler ve faturalar, yasal saklama yükümlülüğü nedeniyle mevzuatta öngörülen süre boyunca saklanır
          (<Link href="/pages/kvkk" className="text-brand hover:underline">KVKK Aydınlatma Metni</Link>).
        </p>
        {!open ? (
          <Button variant="outline" className="border-red-300 text-red-700 hover:bg-red-50" onClick={() => setOpen(true)}>
            Hesabımı silmek istiyorum
          </Button>
        ) : (
          <form onSubmit={submit} className="space-y-3">
            <div className="space-y-1">
              <Label htmlFor="delete-password">Şifreniz</Label>
              <Input id="delete-password" type="password" autoComplete="current-password" required value={password} onChange={(e) => setPassword(e.target.value)} />
            </div>
            <div className="space-y-1">
              <Label htmlFor="delete-confirm">Onaylamak için <strong>SİL</strong> yazın</Label>
              <Input id="delete-confirm" required value={confirmText} onChange={(e) => setConfirmText(e.target.value)} autoComplete="off" />
            </div>
            {error && <p role="alert" className="text-destructive">{error}</p>}
            <div className="flex gap-2">
              <Button
                type="submit"
                className="bg-red-600 hover:bg-red-700 text-white"
                disabled={loading || !password || confirmText.trim().toLocaleUpperCase('tr-TR') !== 'SİL'}
              >
                {loading && <Loader2 className="w-4 h-4 animate-spin mr-1" />}
                Hesabımı Kalıcı Olarak Sil
              </Button>
              <Button type="button" variant="ghost" onClick={() => { setOpen(false); setPassword(''); setConfirmText(''); setError('') }}>
                Vazgeç
              </Button>
            </div>
          </form>
        )}
      </CardContent>
    </Card>
  )
}
