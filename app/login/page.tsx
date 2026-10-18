'use client'

import React, { useEffect, useState, Suspense } from 'react'
import Link from 'next/link'
import { useRouter, useSearchParams } from 'next/navigation'
import { Loader2 } from 'lucide-react'
import { useAuthStore } from '@/lib/store/useAuthStore'
import { safeRedirect } from '@/lib/safe-redirect'
import { EMAIL_RE } from '@/lib/auth-errors'
import { ClassicPageShell } from '@/components/ClassicPageShell'
import { AuthLayout, TextField, PasswordField, Checkbox, PrimaryButton, FormAlert, linkClass } from '@/components/auth/AuthUI'
import { SocialSignInButtons } from '@/components/auth/SocialSignInButtons'
import { LegalDocumentDialog, LegalLink } from '@/components/LegalDocumentDialog'
import type { LegalSlug } from '@/lib/legal/documents'

function LoginForm() {
  const router = useRouter()
  const searchParams = useSearchParams()
  const login = useAuthStore((state) => state.login)
  const isAuthenticated = useAuthStore((s) => s.isAuthenticated)
  const authReady = useAuthStore((s) => s.authReady)
  const redirectParam = searchParams.get('redirect')
  const target = safeRedirect(redirectParam)

  const [email, setEmail] = useState(searchParams.get('email') ?? '')
  const [password, setPassword] = useState('')
  const [rememberMe, setRememberMe] = useState(true)
  const [errors, setErrors] = useState<{ email?: string; password?: string }>({})
  const [error, setError] = useState('')
  const [loading, setLoading] = useState(false)
  const [legalDoc, setLegalDoc] = useState<LegalSlug | null>(null)

  // Zaten giriş yapmış kullanıcıyı hedef sayfaya gönder
  useEffect(() => {
    if (authReady && isAuthenticated && !loading) router.replace(target)
  }, [authReady, isAuthenticated, loading, router, target])

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setError('')
    const next: typeof errors = {}
    if (!email.trim()) next.email = 'E-posta adresinizi girin.'
    else if (!EMAIL_RE.test(email.trim())) next.email = 'Geçerli bir e-posta adresi girin (örn. ad@ornek.com).'
    if (!password) next.password = 'Şifrenizi girin.'
    setErrors(next)
    if (Object.keys(next).length) return

    setLoading(true)
    const result = await login(email, password, rememberMe)
    if (result.success) {
      router.push(target)
      return
    }
    setError(result.error || 'Giriş yapılamadı.')
    setLoading(false)
  }

  const verified = searchParams.get('verified') === 'true'
  const reset = searchParams.get('reset') === 'true'
  const registerHref = redirectParam ? `/register?redirect=${encodeURIComponent(target)}` : '/register'

  return (
    <AuthLayout breadcrumb="Giriş Yap" title="Giriş Yap" subtitle="Hesabınıza giriş yaparak siparişlerinizi takip edin ve hızlıca alışveriş yapın.">
      <div className="space-y-5">
        {verified && <FormAlert tone="success">E-posta adresiniz doğrulandı. Giriş yapabilirsiniz.</FormAlert>}
        {reset && <FormAlert tone="success">Şifreniz güncellendi. Yeni şifrenizle giriş yapabilirsiniz.</FormAlert>}
        {redirectParam && !verified && !reset && (
          <FormAlert tone="info">Devam etmek için lütfen giriş yapın.</FormAlert>
        )}
        {error && <FormAlert>{error}</FormAlert>}

        <SocialSignInButtons
          onSuccess={() => router.push(target)}
          onError={setError}
          disabled={loading}
          dividerText="veya e-posta ile"
          notice={
            <>
              Google veya Facebook ile ilk girişinizde hesabınız oluşturulur ve{' '}
              <LegalLink slug="uyelik-ve-kullanim-kosullari" onOpen={setLegalDoc}>Üyelik ve Kullanım Koşulları</LegalLink>’nı kabul etmiş
              olursunuz. Kişisel verileriniz <LegalLink slug="kvkk" onOpen={setLegalDoc}>KVKK Aydınlatma Metni</LegalLink> kapsamında işlenir.
            </>
          }
        />

        <form onSubmit={handleSubmit} noValidate className="space-y-4">
          <TextField
            label="E-posta"
            type="email"
            inputMode="email"
            placeholder="ornek@email.com"
            value={email}
            onChange={(e) => { setEmail(e.target.value); if (errors.email) setErrors({ ...errors, email: undefined }) }}
            error={errors.email}
            autoComplete="email"
            disabled={loading}
            autoFocus
          />
          <PasswordField
            label="Şifre"
            placeholder="Şifreniz"
            value={password}
            onChange={(e) => { setPassword(e.target.value); if (errors.password) setErrors({ ...errors, password: undefined }) }}
            error={errors.password}
            autoComplete="current-password"
            disabled={loading}
            labelExtra={
              <Link href={email ? `/forgot-password?email=${encodeURIComponent(email.trim())}` : '/forgot-password'} className="text-[13.5px] font-medium text-[#0b2540] hover:underline underline-offset-2">
                Şifremi unuttum
              </Link>
            }
          />
          <Checkbox checked={rememberMe} onChange={setRememberMe} disabled={loading}>
            Beni hatırla <span className="text-[#5d6e80]">— ortak kullanılan cihazlarda işaretlemeyin</span>
          </Checkbox>

          <PrimaryButton type="submit" loading={loading} loadingText="Giriş yapılıyor…">
            Giriş Yap
          </PrimaryButton>
        </form>

        <p className="text-center text-[14.5px] text-[#5d6e80]">
          Hesabınız yok mu?{' '}
          <Link href={registerHref} className={linkClass}>Hemen üye olun</Link>
        </p>

        <LegalDocumentDialog slug={legalDoc} onClose={() => setLegalDoc(null)} />
      </div>
    </AuthLayout>
  )
}

export default function LoginPage() {
  return (
    <Suspense
      fallback={
        <ClassicPageShell noTitle>
          <div className="flex items-center justify-center py-20">
            <Loader2 className="h-8 w-8 animate-spin text-[#0b2540]" />
          </div>
        </ClassicPageShell>
      }
    >
      <LoginForm />
    </Suspense>
  )
}
