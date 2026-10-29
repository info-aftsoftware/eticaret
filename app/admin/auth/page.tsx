'use client'

import React, { useState } from 'react'
import Link from 'next/link'
import { useRouter } from 'next/navigation'
import { Button } from '@/components/ui/button'
import { ArrowLeft, Lock, Loader2, AlertCircle, Eye, EyeOff } from 'lucide-react'
import Image from 'next/image'

export default function AdminAuthPage() {
  const router = useRouter()
  const [email, setEmail] = useState('')
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
        body: JSON.stringify(otpRequired ? { email, password, otp } : { email, password }),
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
      // İlk girişte veya şifre sıfırlandıktan sonra önce şifre değiştirilir
      router.push(data.mustChangePassword ? '/admin/hesabim' : '/admin')
      router.refresh()
    } catch (err: any) {
      setError('Bağlantı hatası. Tekrar deneyin.')
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="min-h-screen bg-[#f5f7fa] flex items-center justify-center p-4">
      <div className="w-full max-w-sm">
        <div className="text-center mb-6">
          <div className="flex justify-center mb-3">
            <Image src="/voltekno-logo-transparent.png" alt="Voltekno" width={180} height={54} style={{ height: 'auto' }} className="object-contain" priority />
          </div>
          <p className="text-sm text-[#5d6e80]">Yönetim paneline giriş yapın</p>
        </div>

        <div className="bg-white border border-[#e6ebf1] rounded-xl p-6 shadow-sm">
          <form onSubmit={handleSubmit} className="space-y-4">
            {error && (
              <div role="alert" className="flex items-center gap-2 rounded-lg bg-red-50 border border-red-200 text-red-700 px-3 py-2.5 text-sm">
                <AlertCircle className="w-4 h-4 shrink-0" />
                {error}
              </div>
            )}
            <div className="space-y-1.5">
              <label htmlFor="admin-email" className="block text-[13px] font-medium text-[#121926]">
                E-posta
              </label>
              <input
                id="admin-email"
                type="email"
                autoComplete="username"
                placeholder="ad@voltekno.com"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                className="w-full h-11 rounded-lg border border-[#d3d9e1] bg-white text-sm text-[#121926] placeholder:text-[#9aa8b6] outline-none focus:border-[#0b2540] focus:ring-2 focus:ring-[#0b2540]/10 transition-colors px-3"
                disabled={loading}
                autoFocus
              />
              <p className="text-[12px] text-[#5d6e80]">Ana yönetici şifresiyle girmek için boş bırakın.</p>
            </div>
            <div className="space-y-1.5">
              <label htmlFor="admin-password" className="block text-[13px] font-medium text-[#121926]">
                Şifre
              </label>
              <div className="relative">
                <Lock className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-[#9aa8b6] pointer-events-none z-10" />
                <input
                  id="admin-password"
                  type={showPassword ? 'text' : 'password'}
                  autoComplete="current-password"
                  placeholder="••••••••"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  className="w-full h-11 rounded-lg border border-[#d3d9e1] bg-white text-sm text-[#121926] placeholder:text-[#9aa8b6] outline-none focus:border-[#0b2540] focus:ring-2 focus:ring-[#0b2540]/10 transition-colors pl-10 pr-10"
                  required
                  disabled={loading}
                />
                <button
                  type="button"
                  onClick={() => setShowPassword((v) => !v)}
                  aria-label={showPassword ? 'Şifreyi gizle' : 'Şifreyi göster'}
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-[#5d6e80] hover:text-[#121926] transition-colors z-10"
                  tabIndex={-1}
                >
                  {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                </button>
              </div>
            </div>
            {otpRequired && (
              <div className="space-y-1.5">
                <label htmlFor="admin-otp" className="block text-[13px] font-medium text-[#121926]">
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
                  className="w-full h-11 rounded-lg border border-[#d3d9e1] bg-white text-sm text-[#121926] placeholder:text-[#9aa8b6] outline-none focus:border-[#0b2540] focus:ring-2 focus:ring-[#0b2540]/10 transition-colors px-4 tracking-[0.4em]"
                  required
                  disabled={loading}
                  autoFocus
                />
                <p className="text-[12px] text-[#5d6e80]">Doğrulama uygulamanızdaki (Google/Microsoft Authenticator) 6 haneli kod.</p>
              </div>
            )}
            <Button
              type="submit"
              className="w-full h-11 rounded-lg bg-[#0b2540] hover:bg-[#12335a] text-white font-semibold gap-2 transition-colors"
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
          <Link href="/" className="inline-flex items-center gap-1.5 text-[13px] text-[#5d6e80] hover:text-[#121926] transition-colors">
            <ArrowLeft className="w-3.5 h-3.5" />
            Siteye Dön
          </Link>
        </div>
      </div>
    </div>
  )
}
