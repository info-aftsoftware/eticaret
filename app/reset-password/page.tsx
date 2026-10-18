'use client'

import React, { useState, useEffect, useRef, Suspense } from 'react'
import { useSearchParams, useRouter } from 'next/navigation'
import Link from 'next/link'
import { Loader2, ArrowLeft } from 'lucide-react'
import { confirmPasswordReset, verifyPasswordResetCode } from 'firebase/auth'
import { getAuth, isFirebaseConfigured } from '@/lib/firebase/config'
import { authErrorCode, authErrorMessage } from '@/lib/auth-errors'
import { ClassicPageShell } from '@/components/ClassicPageShell'
import { AuthLayout, PasswordField, PasswordStrength, PrimaryButton, SecondaryButton, FormAlert, linkClass } from '@/components/auth/AuthUI'
import { useL } from '@/lib/i18n-inline'

const MIN_PASSWORD = 8

type CodeState = 'checking' | 'valid' | 'expired' | 'invalid'

function ResetPasswordForm() {
  const L = useL()
  const router = useRouter()
  const searchParams = useSearchParams()
  const oobCode = searchParams.get('oobCode') || searchParams.get('token')

  const [codeState, setCodeState] = useState<CodeState>('checking')
  const [accountEmail, setAccountEmail] = useState('')
  const [password, setPassword] = useState('')
  const [confirmPassword, setConfirmPassword] = useState('')
  const [errors, setErrors] = useState<{ password?: string; confirm?: string }>({})
  const [loading, setLoading] = useState(false)
  const [success, setSuccess] = useState(false)
  const [error, setError] = useState('')
  const checked = useRef(false)

  // Bağlantıyı baştan kontrol et: süresi dolmuşsa form gösterilmez
  useEffect(() => {
    if (checked.current) return
    checked.current = true
    if (!oobCode || !isFirebaseConfigured) {
      setCodeState('invalid')
      return
    }
    verifyPasswordResetCode(getAuth(), oobCode)
      .then((email) => {
        setAccountEmail(email)
        setCodeState('valid')
      })
      .catch((err) => setCodeState(authErrorCode(err) === 'auth/expired-action-code' ? 'expired' : 'invalid'))
  }, [oobCode])

  useEffect(() => {
    if (!success) return
    const t = setTimeout(() => router.push('/login?reset=true'), 4000)
    return () => clearTimeout(t)
  }, [success, router])

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setError('')
    const next: typeof errors = {}
    if (!password) next.password = L('Yeni şifrenizi girin.', 'Enter your new password.')
    else if (password.length < MIN_PASSWORD) next.password = L(`Şifre en az ${MIN_PASSWORD} karakter olmalıdır.`, `Password must be at least ${MIN_PASSWORD} characters.`)
    if (!confirmPassword) next.confirm = L('Şifrenizi tekrar girin.', 'Re-enter your password.')
    else if (password !== confirmPassword) next.confirm = L('Şifreler eşleşmiyor.', 'Passwords do not match.')
    setErrors(next)
    if (Object.keys(next).length || !oobCode) return

    setLoading(true)
    try {
      await confirmPasswordReset(getAuth(), oobCode, password)
      setSuccess(true)
    } catch (err) {
      const code = authErrorCode(err)
      if (code === 'auth/expired-action-code') setCodeState('expired')
      else if (code === 'auth/invalid-action-code') setCodeState('invalid')
      else setError(authErrorMessage(err))
    } finally {
      setLoading(false)
    }
  }

  if (codeState === 'checking') {
    return (
      <AuthLayout breadcrumb={L('Şifre Sıfırla', 'Reset Password')} title={L('Bağlantı kontrol ediliyor', 'Checking link')}>
        <div className="flex flex-col items-center py-8 text-[#5d6e80]">
          <Loader2 className="mb-3 h-8 w-8 animate-spin text-[#0b2540]" />
          {L('Lütfen bekleyin…', 'Please wait…')}
        </div>
      </AuthLayout>
    )
  }

  if (success) {
    return (
      <AuthLayout
        breadcrumb={L('Şifre Sıfırla', 'Reset Password')}
        title={L('Şifreniz güncellendi', 'Your password has been updated')}
        subtitle={L('Yeni şifrenizle giriş yapabilirsiniz. Birkaç saniye içinde giriş sayfasına yönlendirileceksiniz.', 'You can sign in with your new password. You will be redirected to the sign-in page in a few seconds.')}
       
      >
        <PrimaryButton type="button" onClick={() => router.push('/login?reset=true')}>{L('Giriş yap', 'Sign in')}</PrimaryButton>
      </AuthLayout>
    )
  }

  if (codeState === 'expired' || codeState === 'invalid') {
    return (
      <AuthLayout
        breadcrumb={L('Şifre Sıfırla', 'Reset Password')}
        title={codeState === 'expired' ? L('Bağlantının süresi dolmuş', 'This link has expired') : L('Bağlantı geçersiz', 'Invalid link')}
        subtitle={
          codeState === 'expired'
            ? L('Şifre sıfırlama bağlantıları güvenlik nedeniyle yaklaşık 1 saat geçerlidir. Yeni bir bağlantı isteyin.', 'For security, password reset links are valid for about 1 hour. Please request a new link.')
            : L('Bu bağlantı daha önce kullanılmış ya da eksik kopyalanmış olabilir. En son gönderilen e-postadaki bağlantıyı kullanın veya yeni bir bağlantı isteyin.', 'This link may have already been used or copied incompletely. Use the link in the most recent email or request a new one.')
        }
       
      >
        <div className="space-y-3">
          <PrimaryButton type="button" onClick={() => router.push('/forgot-password')}>{L('Yeni bağlantı iste', 'Request a new link')}</PrimaryButton>
          <SecondaryButton type="button" onClick={() => router.push('/login')}>{L('Giriş sayfasına dön', 'Back to sign in')}</SecondaryButton>
        </div>
      </AuthLayout>
    )
  }

  return (
    <AuthLayout
      breadcrumb={L('Şifre Sıfırla', 'Reset Password')}
      title={L('Yeni şifre belirleyin', 'Set a new password')}
      subtitle={accountEmail ? <>{L('Hesap:', 'Account:')} <span className="break-all font-semibold text-[#20384e]">{accountEmail}</span></> : L('Hesabınız için yeni bir şifre belirleyin.', 'Set a new password for your account.')}
     
    >
      <form onSubmit={handleSubmit} noValidate className="space-y-4">
        {error && <FormAlert>{error}</FormAlert>}
        {/* Parola yöneticileri için gizli kullanıcı adı alanı */}
        <input type="email" name="username" autoComplete="username" value={accountEmail} readOnly hidden />
        <PasswordField
          label={L('Yeni şifre', 'New password')}
          required
          placeholder={L(`En az ${MIN_PASSWORD} karakter`, `At least ${MIN_PASSWORD} characters`)}
          value={password}
          onChange={(e) => { setPassword(e.target.value); if (errors.password) setErrors({ ...errors, password: undefined }) }}
          error={errors.password}
          autoComplete="new-password"
          disabled={loading}
          autoFocus
          hint={<PasswordStrength password={password} />}
        />
        <PasswordField
          label={L('Yeni şifre (tekrar)', 'New password (again)')}
          required
          placeholder={L('Şifrenizi tekrar girin', 'Re-enter your password')}
          value={confirmPassword}
          onChange={(e) => { setConfirmPassword(e.target.value); if (errors.confirm) setErrors({ ...errors, confirm: undefined }) }}
          error={errors.confirm}
          autoComplete="new-password"
          disabled={loading}
        />
        <PrimaryButton type="submit" loading={loading} loadingText={L('Kaydediliyor…', 'Saving…')}>
          {L('Şifremi güncelle', 'Update my password')}
        </PrimaryButton>
        <p className="pt-1 text-center text-[14.5px]">
          <Link href="/login" className={`${linkClass} inline-flex items-center gap-1.5`}>
            <ArrowLeft className="h-4 w-4" /> {L('Giriş sayfasına dön', 'Back to sign in')}
          </Link>
        </p>
      </form>
    </AuthLayout>
  )
}

export default function ResetPasswordPage() {
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
      <ResetPasswordForm />
    </Suspense>
  )
}
