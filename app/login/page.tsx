'use client'

import React, { useState, Suspense } from 'react'
import Link from 'next/link'
import { useRouter, useSearchParams } from 'next/navigation'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { useAuthStore } from '@/lib/store/useAuthStore'
import { safeRedirect as safeRedirectPath } from '@/lib/safe-redirect'
import { ClassicPageShell } from '@/components/ClassicPageShell'
import { Mail, Lock, LogIn, AlertCircle, Eye, EyeOff, Loader2 } from 'lucide-react'
import { Alert, AlertDescription } from '@/components/ui/alert'

function LoginForm() {
  const router = useRouter()
  const searchParams = useSearchParams()
  const login = useAuthStore((state) => state.login)
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [showPassword, setShowPassword] = useState(false)
  const [rememberMe, setRememberMe] = useState(false)
  const [error, setError] = useState('')
  const [loading, setLoading] = useState(false)

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setError('')
    setLoading(true)

    const result = await login(email, password, rememberMe)

    if (result.success) {
      const redirect = searchParams.get('redirect')
      const safeRedirect = safeRedirectPath(redirect)
      router.push(safeRedirect)
    } else {
      setError(result.error || 'Giriş başarısız')
      window.scrollTo({ top: 0, behavior: 'smooth' })
    }

    setLoading(false)
  }

  return (
    <ClassicPageShell breadcrumbs={[{ label: 'Giriş Yap' }]} noTitle>
      <div className="flex justify-center py-6 px-4 min-w-0">
        <div className="w-full max-w-md min-w-0">
          <Card className="bg-white rounded-2xl border border-slate-200 shadow-sm overflow-hidden max-w-md mx-auto w-full">
            <CardHeader className="space-y-1 text-center pb-4 bg-white">
              <div className="flex justify-center mb-4">
                <div className="w-14 h-14 bg-brand rounded-xl flex items-center justify-center">
                  <LogIn className="w-7 h-7 text-white" />
                </div>
              </div>
              <CardTitle className="text-2xl font-bold text-slate-900 tracking-tight">Giriş Yap</CardTitle>
              <CardDescription className="text-base text-slate-600 leading-relaxed">Hesabınıza giriş yapın</CardDescription>
            </CardHeader>
            <CardContent className="bg-white text-base leading-relaxed">
            <form onSubmit={handleSubmit} className="space-y-4">
              {error && (
                <Alert variant="destructive" className="rounded-xl text-base">
                  <AlertCircle className="h-4 w-4 shrink-0" />
                  <AlertDescription className="text-base">{error}</AlertDescription>
                </Alert>
              )}

              <div className="space-y-2">
                <Label htmlFor="email" className="text-base font-medium text-slate-900">E-posta</Label>
                <div className="relative">
                  <Mail className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400 w-5 h-5 z-10 pointer-events-none shrink-0" />
                  <Input id="email" type="email" placeholder="ornek@email.com" value={email} onChange={(e) => setEmail(e.target.value)} className="pl-12 rounded-xl min-w-0 text-base border-slate-200 focus:ring-slate-400" required disabled={loading} autoComplete="email" />
                </div>
              </div>

              <div className="space-y-2">
                <Label htmlFor="password" className="text-base font-medium text-slate-900">Şifre</Label>
                <div className="relative">
                  <Lock className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400 w-5 h-5 z-10 pointer-events-none shrink-0" />
                  <Input id="password" type={showPassword ? 'text' : 'password'} placeholder="••••••••" value={password} onChange={(e) => setPassword(e.target.value)} className="pl-12 pr-12 rounded-xl min-w-0 text-base border-slate-200 focus:ring-slate-400" required disabled={loading} autoComplete="current-password" />
                  <button type="button" onClick={() => setShowPassword(!showPassword)} className="absolute right-2 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600 z-10 p-2 min-h-[44px] min-w-[44px] flex items-center justify-center touch-manipulation rounded" aria-label={showPassword ? 'Şifreyi gizle' : 'Şifreyi göster'}>
                    {showPassword ? <EyeOff className="w-5 h-5" /> : <Eye className="w-5 h-5" />}
                  </button>
                </div>
              </div>

              <div className="flex flex-wrap items-center justify-between gap-3">
                <label className="flex items-center gap-2 cursor-pointer py-2 touch-manipulation min-h-[44px]">
                  <input type="checkbox" id="remember" checked={rememberMe} onChange={(e) => setRememberMe(e.target.checked)} className="w-5 h-5 min-w-[20px] min-h-[20px] text-slate-800 border-slate-300 rounded focus:ring-slate-400 shrink-0" />
                  <Label htmlFor="remember" className="text-base text-slate-600 cursor-pointer font-normal">Beni hatırla</Label>
                </label>
                <Link href="/forgot-password" className="text-base text-slate-800 hover:text-brand font-medium py-2 touch-manipulation min-h-[44px] flex items-center">Şifremi unuttum</Link>
              </div>

              <Button type="submit" className="w-full rounded-xl min-h-[48px] touch-manipulation text-base font-semibold bg-brand hover:bg-brand-hover text-white" disabled={loading} size="lg">
                {loading ? <><Loader2 className="w-5 h-5 mr-2 animate-spin" /> Giriş yapılıyor...</> : 'Giriş Yap'}
              </Button>

              <div className="text-center text-base text-slate-600 py-2 leading-relaxed">
                Hesabınız yok mu? <Link href="/register" className="text-brand hover:underline font-semibold py-2 inline-block touch-manipulation">Kayıt olun</Link>
              </div>
            </form>
            </CardContent>
          </Card>
        </div>
      </div>
    </ClassicPageShell>
  )
}

export default function LoginPage() {
  return (
    <Suspense fallback={
      <ClassicPageShell noTitle>
        <div className="flex items-center justify-center py-20">
          <div className="text-center">
            <div className="animate-spin rounded-full h-12 w-12 border-2 border-slate-800 border-t-transparent mx-auto mb-4"></div>
            <p className="text-base text-slate-600">Yükleniyor...</p>
          </div>
        </div>
      </ClassicPageShell>
    }>
      <LoginForm />
    </Suspense>
  )
}

