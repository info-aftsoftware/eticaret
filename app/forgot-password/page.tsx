'use client'

import React, { useEffect, useState, Suspense } from 'react'
import Link from 'next/link'
import { useSearchParams } from 'next/navigation'
import { ArrowLeft, Loader2 } from 'lucide-react'
import { sendPasswordResetEmail } from 'firebase/auth'
import { getAuth, isFirebaseConfigured } from '@/lib/firebase/config'
import { authErrorCode, authErrorMessage, EMAIL_RE } from '@/lib/auth-errors'
import { ClassicPageShell } from '@/components/ClassicPageShell'
import { AuthLayout, TextField, PrimaryButton, SecondaryButton, FormAlert, linkClass } from '@/components/auth/AuthUI'
import { useL } from '@/lib/i18n-inline'
import { useServerError } from '@/lib/server-error-i18n'

const COOLDOWN = 60

/** Önce sunucu (markalı e-posta, bağlantı doğrudan /reset-password), olmazsa Firebase'in kendi e-postası. */
async function requestReset(email: string): Promise<void> {
  try {
    const res = await fetch('/api/account/password-reset', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ email }),
    })
    const data = await res.json().catch(() => ({}))
    if (res.ok && data.success) return
    if (res.status === 429 || res.status === 400) throw Object.assign(new Error(data.error), { userMessage: data.error })
  } catch (e) {
    if ((e as { userMessage?: string }).userMessage) throw e
    // sunucuya ulaşılamadı → Firebase
  }
  if (!isFirebaseConfigured) throw new Error('Firebase yapılandırılmamış.')
  const auth = getAuth()
  try {
    await sendPasswordResetEmail(auth, email, { url: `${window.location.origin}/login?reset=true` })
  } catch (err) {
    const code = authErrorCode(err)
    if (code === 'auth/unauthorized-continue-uri' || code === 'auth/invalid-continue-uri') {
      await sendPasswordResetEmail(auth, email)
      return
    }
    // Hesap yoksa da aynı yanıtı ver (e-posta numaralandırmaya karşı)
    if (code === 'auth/user-not-found') return
    throw err
  }
}

function ForgotPasswordContent() {
  const L = useL()
  const tErr = useServerError()
  const searchParams = useSearchParams()
  const [email, setEmail] = useState(searchParams.get('email') ?? '')
  const [fieldError, setFieldError] = useState('')
  const [loading, setLoading] = useState(false)
  const [sentTo, setSentTo] = useState('')
  const [error, setError] = useState('')
  const [remaining, setRemaining] = useState(0)

  useEffect(() => {
    if (remaining <= 0) return
    const t = setTimeout(() => setRemaining((r) => r - 1), 1000)
    return () => clearTimeout(t)
  }, [remaining])

  const submit = async (address: string) => {
    setError('')
    setLoading(true)
    try {
      await requestReset(address)
      setSentTo(address)
      setRemaining(COOLDOWN)
    } catch (err) {
      setError(tErr((err as { userMessage?: string }).userMessage || authErrorMessage(err)) || L('Bir hata oluştu. Lütfen tekrar deneyin.', 'Something went wrong. Please try again.'))
    } finally {
      setLoading(false)
    }
  }

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault()
    const value = email.trim()
    if (!value) return setFieldError(L('E-posta adresinizi girin.', 'Enter your email address.'))
    if (!EMAIL_RE.test(value)) return setFieldError(L('Geçerli bir e-posta adresi girin (örn. ad@ornek.com).', 'Enter a valid email address (e.g. name@example.com).'))
    setFieldError('')
    submit(value)
  }

  if (sentTo) {
    return (
      <AuthLayout
        breadcrumb={L('Şifremi Unuttum', 'Forgot Password')}
        title={L('E-postanızı kontrol edin', 'Check your email')}
        subtitle={L('Bu adrese kayıtlı bir hesap varsa şifre sıfırlama bağlantısını gönderdik.', 'If an account is registered with this address, we have sent a password reset link.')}
       
      >
        <div className="space-y-5">
          <div className="rounded-[10px] border border-[#e6ebf1] bg-[#f5f7fa] p-4">
            <p className="text-[13px] text-[#5d6e80]">{L('Gönderilen adres', 'Sent to')}</p>
            <p className="mt-0.5 break-all text-[15px] font-semibold text-[#121926]">{sentTo}</p>
            <ul className="mt-3 space-y-1.5 text-[13.5px] leading-relaxed text-[#20384e]">
              <li>• {L('Bağlantı yaklaşık 1 saat geçerlidir ve bir kez kullanılabilir.', 'The link is valid for about 1 hour and can be used once.')}</li>
              <li>• {L('E-posta gelmediyse spam / gereksiz klasörünü kontrol edin.', 'If the email hasn’t arrived, check your spam / junk folder.')}</li>
            </ul>
          </div>
          {error && <FormAlert>{error}</FormAlert>}
          <div className="space-y-3">
            <SecondaryButton type="button" onClick={() => submit(sentTo)} disabled={loading || remaining > 0}>
              {loading && <Loader2 className="h-4 w-4 animate-spin" />}
              {remaining > 0 ? L(`Tekrar gönder (${remaining} sn)`, `Resend (${remaining}s)`) : L('Bağlantıyı tekrar gönder', 'Resend link')}
            </SecondaryButton>
            <SecondaryButton type="button" onClick={() => { setSentTo(''); setError('') }} disabled={loading}>
              {L('Farklı bir e-posta adresi gir', 'Use a different email address')}
            </SecondaryButton>
          </div>
          <p className="text-center text-[14.5px]">
            <Link href="/login" className={`${linkClass} inline-flex items-center gap-1.5`}>
              <ArrowLeft className="h-4 w-4" /> {L('Giriş sayfasına dön', 'Back to sign in')}
            </Link>
          </p>
        </div>
      </AuthLayout>
    )
  }

  return (
    <AuthLayout
      breadcrumb={L('Şifremi Unuttum', 'Forgot Password')}
      title={L('Şifremi unuttum', 'Forgot password')}
      subtitle={L('Hesabınıza kayıtlı e-posta adresini girin; şifrenizi yenilemeniz için bir bağlantı gönderelim.', 'Enter the email address registered to your account and we’ll send you a link to reset your password.')}
     
    >
      <form onSubmit={handleSubmit} noValidate className="space-y-4">
        {error && <FormAlert>{error}</FormAlert>}
        <TextField
          label={L('E-posta', 'Email')}
          type="email"
          inputMode="email"
          placeholder={L('ornek@email.com', 'example@email.com')}
          value={email}
          onChange={(e) => { setEmail(e.target.value); if (fieldError) setFieldError('') }}
          error={fieldError}
          autoComplete="email"
          disabled={loading}
          autoFocus
        />
        <PrimaryButton type="submit" loading={loading} loadingText={L('Gönderiliyor…', 'Sending…')}>
          {L('Sıfırlama bağlantısı gönder', 'Send reset link')}
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

export default function ForgotPasswordPage() {
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
      <ForgotPasswordContent />
    </Suspense>
  )
}
