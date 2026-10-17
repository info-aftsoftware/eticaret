'use client'

import React, { useEffect, useState, Suspense } from 'react'
import Link from 'next/link'
import { useSearchParams } from 'next/navigation'
import { Mail, KeyRound, ArrowLeft, MailCheck, Loader2 } from 'lucide-react'
import { sendPasswordResetEmail } from 'firebase/auth'
import { getAuth, isFirebaseConfigured } from '@/lib/firebase/config'
import { authErrorCode, authErrorMessage, EMAIL_RE } from '@/lib/auth-errors'
import { ClassicPageShell } from '@/components/ClassicPageShell'
import { AuthLayout, TextField, PrimaryButton, SecondaryButton, FormAlert, linkClass } from '@/components/auth/AuthUI'

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
      setError((err as { userMessage?: string }).userMessage || authErrorMessage(err))
    } finally {
      setLoading(false)
    }
  }

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault()
    const value = email.trim()
    if (!value) return setFieldError('E-posta adresinizi girin.')
    if (!EMAIL_RE.test(value)) return setFieldError('Geçerli bir e-posta adresi girin (örn. ad@ornek.com).')
    setFieldError('')
    submit(value)
  }

  if (sentTo) {
    return (
      <AuthLayout
        breadcrumb="Şifremi Unuttum"
        icon={MailCheck}
        title="E-postanızı kontrol edin"
        subtitle="Bu adrese kayıtlı bir hesap varsa şifre sıfırlama bağlantısını gönderdik."
        showBenefits={false}
      >
        <div className="space-y-5">
          <div className="rounded-[10px] border border-[#e6ebf1] bg-[#f5f7fa] p-4">
            <p className="text-[13px] text-[#6b7c8f]">Gönderilen adres</p>
            <p className="mt-0.5 break-all text-[15px] font-semibold text-[#121926]">{sentTo}</p>
            <ul className="mt-3 space-y-1.5 text-[13.5px] leading-relaxed text-[#20384e]">
              <li>• Bağlantı yaklaşık 1 saat geçerlidir ve bir kez kullanılabilir.</li>
              <li>• E-posta gelmediyse spam / gereksiz klasörünü kontrol edin.</li>
            </ul>
          </div>
          {error && <FormAlert>{error}</FormAlert>}
          <div className="space-y-3">
            <SecondaryButton type="button" onClick={() => submit(sentTo)} disabled={loading || remaining > 0}>
              {loading && <Loader2 className="h-4 w-4 animate-spin" />}
              {remaining > 0 ? `Tekrar gönder (${remaining} sn)` : 'Bağlantıyı tekrar gönder'}
            </SecondaryButton>
            <SecondaryButton type="button" onClick={() => { setSentTo(''); setError('') }} disabled={loading}>
              Farklı bir e-posta adresi gir
            </SecondaryButton>
          </div>
          <p className="text-center text-[14.5px]">
            <Link href="/login" className={`${linkClass} inline-flex items-center gap-1.5`}>
              <ArrowLeft className="h-4 w-4" /> Giriş sayfasına dön
            </Link>
          </p>
        </div>
      </AuthLayout>
    )
  }

  return (
    <AuthLayout
      breadcrumb="Şifremi Unuttum"
      icon={KeyRound}
      title="Şifremi unuttum"
      subtitle="Hesabınıza kayıtlı e-posta adresini girin; şifrenizi yenilemeniz için bir bağlantı gönderelim."
      showBenefits={false}
    >
      <form onSubmit={handleSubmit} noValidate className="space-y-4">
        {error && <FormAlert>{error}</FormAlert>}
        <TextField
          label="E-posta"
          icon={Mail}
          type="email"
          inputMode="email"
          placeholder="ornek@email.com"
          value={email}
          onChange={(e) => { setEmail(e.target.value); if (fieldError) setFieldError('') }}
          error={fieldError}
          autoComplete="email"
          disabled={loading}
          autoFocus
        />
        <PrimaryButton type="submit" loading={loading} loadingText="Gönderiliyor…">
          Sıfırlama bağlantısı gönder
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
