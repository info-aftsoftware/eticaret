'use client'

import React, { useState } from 'react'
import Link from 'next/link'
import { useRouter } from 'next/navigation'
import { Button } from '@/components/ui/button'
import { ArrowLeft, Lock, Loader2, AlertCircle, Eye, EyeOff } from 'lucide-react'
import Image from 'next/image'

export default function AdminAuthPage() {
  const router = useRouter()
  const [password, setPassword] = useState('')
  const [error, setError] = useState('')
  const [loading, setLoading] = useState(false)
  const [showPassword, setShowPassword] = useState(false)
  /** İki adımlı doğrulama açıksa (ADMIN_TOTP_SECRET) şifreden sonra kod alanı gösterilir */
  const [otpRequired, setOtpRequired] = useState(false)
  const [otp, setOtp] = useState('')

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setError('')
    setLoading(true)
    try {
      const res = await fetch('/api/admin/auth', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(otpRequired ? { password, otp } : { password }),
        credentials: 'include',
      })
      const data = await res.json().catch(() => ({}))
      if (!res.ok || !data.success) {
        if (data.requiresOtp) {
          // İlk adımda (kod henüz istenmemişken) uyarı yerine kod alanını göster
          if (!otpRequired) {
            setOtpRequired(true)
            return
          }
          setOtp('')
        }
        setError(data.error || 'Giriş başarısız.')
        return
      }
      // Firebase custom token ile sessiz giriş (Firestore okuma izni için)
      if (data.firebaseCustomToken) {
        try {
          const { getAuth } = await import('@/lib/firebase/config')
          const { signInWithCustomToken } = await import('firebase/auth')
          const auth = getAuth()
          await signInWithCustomToken(auth, data.firebaseCustomToken)
        } catch {}
      }
      router.push('/admin')
      router.refresh()
    } catch (err: any) {
      setError('Bağlantı hatası. Tekrar deneyin.')
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="min-h-screen bg-slate-900 flex items-center justify-center p-4">
      {/* Arka plan desen */}
      <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_top,rgba(30,58,110,0.4),transparent_60%)] pointer-events-none" />

      <div className="relative w-full max-w-sm">
        {/* Logo */}
        <div className="text-center mb-8">
          <div className="flex justify-center mb-4">
            <Image src="/voltekno-logo-transparent.png" alt="Voltekno" width={180} height={54} style={{ height: 'auto' }} className="object-contain brightness-0 invert" priority />
          </div>
          <p className="text-sm text-white/40 mt-1">Yönetim paneline giriş yapın</p>
        </div>

        <div className="bg-white/5 border border-white/10 rounded-2xl p-7 backdrop-blur-sm shadow-2xl">
          <form onSubmit={handleSubmit} className="space-y-4">
            {error && (
              <div className="flex items-center gap-2 rounded-xl bg-red-500/10 border border-red-500/20 text-red-300 px-3 py-2.5 text-sm">
                <AlertCircle className="w-4 h-4 shrink-0" />
                {error}
              </div>
            )}
            <div className="space-y-1.5">
              <label htmlFor="admin-password" className="block text-white/60 text-xs font-semibold uppercase tracking-wider">
                Şifre
              </label>
              <div className="relative">
                <Lock className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-white/30 pointer-events-none z-10" />
                <input
                  id="admin-password"
                  type={showPassword ? 'text' : 'password'}
                  autoComplete="current-password"
                  placeholder="••••••••"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  style={{ background: 'rgba(255,255,255,0.08)', color: 'white' }}
                  className="w-full h-11 pl-10 pr-10 rounded-xl border border-white/15 text-sm outline-none focus:border-[#f4a11a] placeholder-white/25 transition-colors"
                  required
                  disabled={loading}
                  autoFocus
                />
                <button
                  type="button"
                  onClick={() => setShowPassword((v) => !v)}
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-white/40 hover:text-white/80 transition-colors z-10"
                  tabIndex={-1}
                >
                  {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                </button>
              </div>
            </div>
            {otpRequired && (
              <div className="space-y-1.5">
                <label htmlFor="admin-otp" className="block text-white/60 text-xs font-semibold uppercase tracking-wider">
                  Doğrulama kodu
                </label>
                <input
                  id="admin-otp"
                  type="text"
                  inputMode="numeric"
                  autoComplete="one-time-code"
                  pattern="[0-9]{6}"
                  maxLength={6}
                  placeholder="123456"
                  value={otp}
                  onChange={(e) => setOtp(e.target.value.replace(/\D/g, ''))}
                  style={{ background: 'rgba(255,255,255,0.08)', color: 'white' }}
                  className="w-full h-11 px-4 rounded-xl border border-white/15 text-sm tracking-[0.4em] outline-none focus:border-[#f4a11a] placeholder-white/25 transition-colors"
                  required
                  disabled={loading}
                  autoFocus
                />
                <p className="text-white/40 text-xs">Doğrulama uygulamanızdaki (Google/Microsoft Authenticator) 6 haneli kod.</p>
              </div>
            )}
            <Button
              type="submit"
              className="w-full h-11 rounded-xl bg-[#f4a11a] hover:bg-[#e09510] text-white font-semibold gap-2 shadow-lg shadow-amber-500/20 transition-all"
              disabled={loading}
            >
              {loading ? (
                <>
                  <Loader2 className="w-4 h-4 animate-spin" />
                  Doğrulanıyor...
                </>
              ) : (
                'Giriş Yap'
              )}
            </Button>
          </form>
        </div>

        <div className="mt-5 text-center">
          <Link href="/" className="inline-flex items-center gap-1.5 text-xs text-white/30 hover:text-white/60 transition-colors">
            <ArrowLeft className="w-3 h-3" />
            Siteye Dön
          </Link>
        </div>
      </div>
    </div>
  )
}
