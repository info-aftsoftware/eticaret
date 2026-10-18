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
import { useL } from '@/lib/i18n-inline'
import { useServerError } from '@/lib/server-error-i18n'

function LoginForm() {
  const L = useL()
  const tErr = useServerError()
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
    if (!email.trim()) next.email = L('E-posta adresinizi girin.', 'Enter your email address.')
    else if (!EMAIL_RE.test(email.trim())) next.email = L('Geçerli bir e-posta adresi girin (örn. ad@ornek.com).', 'Enter a valid email address (e.g. name@example.com).')
    if (!password) next.password = L('Şifrenizi girin.', 'Enter your password.')
    setErrors(next)
    if (Object.keys(next).length) return

    setLoading(true)
    const result = await login(email, password, rememberMe)
    if (result.success) {
      router.push(target)
      return
    }
    setError(tErr(result.error) || L('Giriş yapılamadı.', 'Sign-in failed.'))
    setLoading(false)
  }

  const verified = searchParams.get('verified') === 'true'
  const reset = searchParams.get('reset') === 'true'
  const registerHref = redirectParam ? `/register?redirect=${encodeURIComponent(target)}` : '/register'

  return (
    <AuthLayout breadcrumb={L('Giriş Yap', 'Sign In')} title={L('Giriş Yap', 'Sign In')} subtitle={L('Hesabınıza giriş yaparak siparişlerinizi takip edin ve hızlıca alışveriş yapın.', 'Sign in to your account to track your orders and shop faster.')}>
      <div className="space-y-5">
        {verified && <FormAlert tone="success">{L('E-posta adresiniz doğrulandı. Giriş yapabilirsiniz.', 'Your email address has been verified. You can now sign in.')}</FormAlert>}
        {reset && <FormAlert tone="success">{L('Şifreniz güncellendi. Yeni şifrenizle giriş yapabilirsiniz.', 'Your password has been updated. You can sign in with your new password.')}</FormAlert>}
        {redirectParam && !verified && !reset && (
          <FormAlert tone="info">{L('Devam etmek için lütfen giriş yapın.', 'Please sign in to continue.')}</FormAlert>
        )}
        {error && <FormAlert>{error}</FormAlert>}

        <SocialSignInButtons
          onSuccess={() => router.push(target)}
          onError={setError}
          disabled={loading}
          dividerText={L('veya e-posta ile', 'or with email')}
          notice={
            <>
              {L('Google veya Facebook ile ilk girişinizde hesabınız oluşturulur ve', 'Your account is created the first time you sign in with Google or Facebook, and you accept the')}{' '}
              <LegalLink slug="uyelik-ve-kullanim-kosullari" onOpen={setLegalDoc}>{L('Üyelik ve Kullanım Koşulları', 'Membership and Terms of Use')}</LegalLink>{L('’nı kabul etmiş olursunuz.', '.')}{' '}
              {L('Kişisel verileriniz', 'Your personal data is processed under the')} <LegalLink slug="kvkk" onOpen={setLegalDoc}>{L('KVKK Aydınlatma Metni', 'KVKK Privacy Notice')}</LegalLink>{L(' kapsamında işlenir.', '.')}
            </>
          }
        />

        <form onSubmit={handleSubmit} noValidate className="space-y-4">
          <TextField
            label={L('E-posta', 'Email')}
            type="email"
            inputMode="email"
            placeholder={L('ornek@email.com', 'example@email.com')}
            value={email}
            onChange={(e) => { setEmail(e.target.value); if (errors.email) setErrors({ ...errors, email: undefined }) }}
            error={errors.email}
            autoComplete="email"
            disabled={loading}
            autoFocus
          />
          <PasswordField
            label={L('Şifre', 'Password')}
            placeholder={L('Şifreniz', 'Your password')}
            value={password}
            onChange={(e) => { setPassword(e.target.value); if (errors.password) setErrors({ ...errors, password: undefined }) }}
            error={errors.password}
            autoComplete="current-password"
            disabled={loading}
            labelExtra={
              <Link href={email ? `/forgot-password?email=${encodeURIComponent(email.trim())}` : '/forgot-password'} className="text-[13.5px] font-medium text-[#0b2540] hover:underline underline-offset-2">
                {L('Şifremi unuttum', 'Forgot password?')}
              </Link>
            }
          />
          <Checkbox checked={rememberMe} onChange={setRememberMe} disabled={loading}>
            {L('Beni hatırla', 'Remember me')}
          </Checkbox>

          <PrimaryButton type="submit" loading={loading} loadingText={L('Giriş yapılıyor…', 'Signing in…')}>
            {L('Giriş Yap', 'Sign In')}
          </PrimaryButton>
        </form>

        <p className="text-center text-[14.5px] text-[#5d6e80]">
          {L('Hesabınız yok mu?', 'Don’t have an account?')}{' '}
          <Link href={registerHref} className={linkClass}>{L('Hemen üye olun', 'Sign up now')}</Link>
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
