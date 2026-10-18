'use client'

import React, { useState, useEffect, useRef, Suspense } from 'react'
import { useSearchParams, useRouter } from 'next/navigation'
import Link from 'next/link'
import { Lock, KeyRound, CheckCircle2, XCircle, Loader2, ArrowLeft } from 'lucide-react'
import { confirmPasswordReset, verifyPasswordResetCode } from 'firebase/auth'
import { getAuth, isFirebaseConfigured } from '@/lib/firebase/config'
import { authErrorCode, authErrorMessage } from '@/lib/auth-errors'
import { ClassicPageShell } from '@/components/ClassicPageShell'
import { AuthLayout, PasswordField, PasswordStrength, PrimaryButton, SecondaryButton, FormAlert, linkClass } from '@/components/auth/AuthUI'

const MIN_PASSWORD = 8

type CodeState = 'checking' | 'valid' | 'expired' | 'invalid'

function ResetPasswordForm() {
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
    if (!password) next.password = 'Yeni şifrenizi girin.'
    else if (password.length < MIN_PASSWORD) next.password = `Şifre en az ${MIN_PASSWORD} karakter olmalıdır.`
    if (!confirmPassword) next.confirm = 'Şifrenizi tekrar girin.'
    else if (password !== confirmPassword) next.confirm = 'Şifreler eşleşmiyor.'
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
      <AuthLayout breadcrumb="Şifre Sıfırla" icon={KeyRound} title="Bağlantı kontrol ediliyor" showBenefits={false}>
        <div className="flex flex-col items-center py-8 text-[#5d6e80]">
          <Loader2 className="mb-3 h-8 w-8 animate-spin text-[#0b2540]" />
          Lütfen bekleyin…
        </div>
      </AuthLayout>
    )
  }

  if (success) {
    return (
      <AuthLayout
        breadcrumb="Şifre Sıfırla"
        icon={CheckCircle2}
        title="Şifreniz güncellendi"
        subtitle="Yeni şifrenizle giriş yapabilirsiniz. Birkaç saniye içinde giriş sayfasına yönlendirileceksiniz."
        showBenefits={false}
      >
        <PrimaryButton type="button" onClick={() => router.push('/login?reset=true')}>Giriş yap</PrimaryButton>
      </AuthLayout>
    )
  }

  if (codeState === 'expired' || codeState === 'invalid') {
    return (
      <AuthLayout
        breadcrumb="Şifre Sıfırla"
        icon={XCircle}
        title={codeState === 'expired' ? 'Bağlantının süresi dolmuş' : 'Bağlantı geçersiz'}
        subtitle={
          codeState === 'expired'
            ? 'Şifre sıfırlama bağlantıları güvenlik nedeniyle yaklaşık 1 saat geçerlidir. Yeni bir bağlantı isteyin.'
            : 'Bu bağlantı daha önce kullanılmış ya da eksik kopyalanmış olabilir. En son gönderilen e-postadaki bağlantıyı kullanın veya yeni bir bağlantı isteyin.'
        }
        showBenefits={false}
      >
        <div className="space-y-3">
          <PrimaryButton type="button" onClick={() => router.push('/forgot-password')}>Yeni bağlantı iste</PrimaryButton>
          <SecondaryButton type="button" onClick={() => router.push('/login')}>Giriş sayfasına dön</SecondaryButton>
        </div>
      </AuthLayout>
    )
  }

  return (
    <AuthLayout
      breadcrumb="Şifre Sıfırla"
      icon={KeyRound}
      title="Yeni şifre belirleyin"
      subtitle={accountEmail ? <>Hesap: <span className="break-all font-semibold text-[#20384e]">{accountEmail}</span></> : 'Hesabınız için yeni bir şifre belirleyin.'}
      showBenefits={false}
    >
      <form onSubmit={handleSubmit} noValidate className="space-y-4">
        {error && <FormAlert>{error}</FormAlert>}
        {/* Parola yöneticileri için gizli kullanıcı adı alanı */}
        <input type="email" name="username" autoComplete="username" value={accountEmail} readOnly hidden />
        <PasswordField
          label="Yeni şifre"
          required
          icon={Lock}
          placeholder={`En az ${MIN_PASSWORD} karakter`}
          value={password}
          onChange={(e) => { setPassword(e.target.value); if (errors.password) setErrors({ ...errors, password: undefined }) }}
          error={errors.password}
          autoComplete="new-password"
          disabled={loading}
          autoFocus
          hint={<PasswordStrength password={password} />}
        />
        <PasswordField
          label="Yeni şifre (tekrar)"
          required
          icon={Lock}
          placeholder="Şifrenizi tekrar girin"
          value={confirmPassword}
          onChange={(e) => { setConfirmPassword(e.target.value); if (errors.confirm) setErrors({ ...errors, confirm: undefined }) }}
          error={errors.confirm}
          autoComplete="new-password"
          disabled={loading}
        />
        <PrimaryButton type="submit" loading={loading} loadingText="Kaydediliyor…">
          Şifremi güncelle
        </PrimaryButton>
        <p className="pt-1 text-center text-[14.5px]">
          <Link href="/login" className={`${linkClass} inline-flex items-center gap-1.5`}>
            <ArrowLeft className="h-4 w-4" /> Giriş sayfasına dön
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
