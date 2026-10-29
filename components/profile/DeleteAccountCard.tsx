'use client'

import React, { useEffect, useState } from 'react'
import Link, { useRouter } from '@/lib/i18n/navigation'
import { EmailAuthProvider, FacebookAuthProvider, GoogleAuthProvider, deleteUser, reauthenticateWithCredential, reauthenticateWithPopup } from 'firebase/auth'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Loader2, Trash2 } from 'lucide-react'
import { getAuth } from '@/lib/firebase/config'
import { useAuthStore } from '@/lib/store/useAuthStore'
import { useL } from '@/lib/i18n-inline'
import { useServerError } from '@/lib/server-error-i18n'

/**
 * KVKK — hesabı silme. Yeniden doğrulama (şifreli hesapta şifre, Google/Facebook ile girişte sağlayıcı penceresi)
 * → DELETE /api/account → çıkış.
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
  const L = useL()
  const tErr = useServerError()
  const confirmWord = L('SİL', 'DELETE')
  // Şifresi olmayan (yalnızca Google/Facebook ile giriş yapan) kullanıcı şifreyle yeniden doğrulanamaz
  const [socialProvider, setSocialProvider] = useState<'google.com' | 'facebook.com' | null>(null)
  useEffect(() => {
    if (!open) return
    const providers = getAuth().currentUser?.providerData.map((p) => p.providerId) ?? []
    setSocialProvider(
      providers.includes('password') ? null : providers.includes('google.com') ? 'google.com' : providers.includes('facebook.com') ? 'facebook.com' : null
    )
  }, [open])

  const submit = async (e: React.FormEvent) => {
    e.preventDefault()
    setError('')
    const current = getAuth().currentUser
    if (!current?.email) return setError(L('Oturum bulunamadı. Lütfen yeniden giriş yapın.', 'Session not found. Please sign in again.'))
    setLoading(true)
    try {
      if (socialProvider) {
        await reauthenticateWithPopup(current, socialProvider === 'google.com' ? new GoogleAuthProvider() : new FacebookAuthProvider())
      } else {
        await reauthenticateWithCredential(current, EmailAuthProvider.credential(current.email, password))
      }
      const token = await current.getIdToken(true)
      const res = await fetch('/api/account', { method: 'DELETE', headers: { Authorization: `Bearer ${token}` } })
      const data = await res.json().catch(() => null)
      if (!res.ok || !data?.success) throw new Error(tErr(data?.error) || L('Hesap silinemedi.', 'Your account could not be deleted.'))
      if (data.clientDelete) {
        // Sunucuda Firebase servis hesabı yok: kendi Firestore verilerini ve Firebase hesabını tarayıcı siler
        const fs = await import('@/lib/firebase/firestore')
        const uid = current.uid
        await Promise.all([
          fs.getFavorites(uid).then((list) => Promise.all(list.map((f) => fs.removeFavorite(uid, f.productId)))).catch(() => {}),
          fs.getAddresses(uid).then((list) => Promise.all(list.map((a) => fs.deleteAddress(uid, a.id)))).catch(() => {}),
        ])
        await deleteUser(current)
      }
      try {
        localStorage.removeItem('cart-storage')
      } catch {}
      logout()
      router.push('/?hesap=silindi')
    } catch (err: unknown) {
      const code = (err as { code?: string })?.code
      setError(
        code === 'auth/wrong-password' || code === 'auth/invalid-credential'
          ? L('Şifre hatalı.', 'Incorrect password.')
          : code === 'auth/popup-closed-by-user' || code === 'auth/cancelled-popup-request'
          ? L('Doğrulama penceresi kapatıldı. Hesabı silmek için yeniden doğrulayın.', 'The verification window was closed. Please verify again to delete your account.')
          : code === 'auth/user-mismatch'
          ? L('Farklı bir hesapla doğrulandı. Bu hesabın Google/Facebook hesabını seçin.', 'You verified with a different account. Choose the account linked to this profile.')
          : err instanceof Error ? err.message : L('Hesap silinemedi.', 'Your account could not be deleted.')
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
          {L('Hesabı Sil', 'Delete Account')}
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-3 text-sm text-ink-muted">
        <p>
          {L('Hesabınızı sildiğinizde üyelik bilgileriniz, kayıtlı adresleriniz, favorileriniz ve bülten aboneliğiniz kalıcı olarak silinir. Verdiğiniz siparişler ve faturalar, yasal saklama yükümlülüğü nedeniyle mevzuatta öngörülen süre boyunca saklanır', 'When you delete your account, your membership details, saved addresses, favorites and newsletter subscription are permanently deleted. Your orders and invoices are retained for the period required by law due to legal record-keeping obligations')}{' '}
          (<Link href="/pages/kvkk" className="text-brand hover:underline">{L('KVKK Aydınlatma Metni', 'KVKK Privacy Notice')}</Link>).
        </p>
        {!open ? (
          <Button variant="outline" className="border-red-300 text-red-700 hover:bg-red-50" onClick={() => setOpen(true)}>
            {L('Hesabımı silmek istiyorum', 'I want to delete my account')}
          </Button>
        ) : (
          <form onSubmit={submit} className="space-y-3">
            {socialProvider ? (
              <p>
                {socialProvider === 'google.com'
                  ? L('Silme işleminden önce Google hesabınızla yeniden doğrulamanız istenecek.', 'You will be asked to verify again with your Google account before deletion.')
                  : L('Silme işleminden önce Facebook hesabınızla yeniden doğrulamanız istenecek.', 'You will be asked to verify again with your Facebook account before deletion.')}
              </p>
            ) : (
              <div className="space-y-1">
                <Label htmlFor="delete-password">{L('Şifreniz', 'Your password')}</Label>
                <Input id="delete-password" type="password" autoComplete="current-password" required value={password} onChange={(e) => setPassword(e.target.value)} />
              </div>
            )}
            <div className="space-y-1">
              <Label htmlFor="delete-confirm">{L('Onaylamak için', 'Type')} <strong>{confirmWord}</strong> {L('yazın', 'to confirm')}</Label>
              <Input id="delete-confirm" required value={confirmText} onChange={(e) => setConfirmText(e.target.value)} autoComplete="off" />
            </div>
            {error && <p role="alert" className="text-destructive">{error}</p>}
            <div className="flex gap-2">
              <Button
                type="submit"
                className="bg-red-600 hover:bg-red-700 text-white"
                disabled={loading || (!socialProvider && !password) || confirmText.trim().toLocaleUpperCase('tr-TR') !== confirmWord}
              >
                {loading && <Loader2 className="w-4 h-4 animate-spin mr-1" />}
                {L('Hesabımı Kalıcı Olarak Sil', 'Permanently Delete My Account')}
              </Button>
              <Button type="button" variant="ghost" onClick={() => { setOpen(false); setPassword(''); setConfirmText(''); setError('') }}>
                {L('Vazgeç', 'Cancel')}
              </Button>
            </div>
          </form>
        )}
      </CardContent>
    </Card>
  )
}
