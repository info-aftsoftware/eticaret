'use client'

/**
 * E-posta doğrulama ve Firebase e-posta işlemleri.
 * - ?mode=verifyEmail&oobCode=…  → applyActionCode, ardından token yenilenir (email_verified sunucuya yansır)
 * - ?mode=resetPassword&oobCode=… → /reset-password'e yönlendirilir (Console'da özel işlem URL'si bu sayfaysa)
 * - ?mode=recoverEmail&oobCode=…  → e-posta değişikliği geri alınır
 * - kod yoksa: kayıt sonrası "e-postanızı kontrol edin" ekranı / tekrar gönder / doğrulama durumu
 */

import React, { useEffect, useRef, useState, Suspense } from 'react'
import Link from 'next/link'
import { useRouter, useSearchParams } from 'next/navigation'
import { applyActionCode, checkActionCode } from 'firebase/auth'
import { Loader2, RefreshCw, ArrowRight } from 'lucide-react'
import { getAuth, isFirebaseConfigured } from '@/lib/firebase/config'
import { refreshEmailVerified } from '@/lib/store/useFirebaseAuth'
import { useAuthStore } from '@/lib/store/useAuthStore'
import { authErrorCode } from '@/lib/auth-errors'
import { safeRedirect } from '@/lib/safe-redirect'
import { ClassicPageShell } from '@/components/ClassicPageShell'
import { AuthLayout, FormAlert, PrimaryButton, SecondaryButton } from '@/components/auth/AuthUI'
import { useEmailVerification } from '@/components/EmailVerifyBanner'
import { useL } from '@/lib/i18n-inline'

type Status = 'loading' | 'verified' | 'recovered' | 'expired' | 'invalid' | 'pending' | 'signed-out'

function VerifyEmailContent() {
  const L = useL()
  const searchParams = useSearchParams()
  const router = useRouter()
  const authReady = useAuthStore((s) => s.authReady)
  const user = useAuthStore((s) => s.user)
  const oobCode = searchParams.get('oobCode') || searchParams.get('token')
  const mode = searchParams.get('mode') || 'verifyEmail'
  const sent = searchParams.get('sent')
  const target = safeRedirect(searchParams.get('redirect'))
  const [status, setStatus] = useState<Status>('loading')
  const [restoredEmail, setRestoredEmail] = useState('')
  const handled = useRef(false)
  const { remaining, sending, checking, message, resend, check, markSent } = useEmailVerification()

  // Bağlantıdaki kodu işle (React geliştirme modunda efekt iki kez çalışır; kod tek kullanımlık → ref ile koru)
  useEffect(() => {
    if (!oobCode || handled.current) return
    if (mode === 'resetPassword') {
      handled.current = true
      router.replace(`/reset-password?mode=resetPassword&oobCode=${encodeURIComponent(oobCode)}`)
      return
    }
    if (!isFirebaseConfigured) {
      setStatus('invalid')
      return
    }
    handled.current = true
    const auth = getAuth()
    ;(async () => {
      try {
        if (mode === 'recoverEmail') {
          const info = await checkActionCode(auth, oobCode)
          await applyActionCode(auth, oobCode)
          setRestoredEmail(info.data.email ?? '')
          setStatus('recovered')
          return
        }
        await applyActionCode(auth, oobCode)
        await auth.authStateReady()
        await refreshEmailVerified()
        setStatus('verified')
      } catch (err) {
        // Kod daha önce kullanıldıysa ama hesap zaten doğrulanmışsa başarı göster
        await auth.authStateReady().catch(() => {})
        if (mode !== 'recoverEmail' && (await refreshEmailVerified())) {
          setStatus('verified')
          return
        }
        setStatus(authErrorCode(err) === 'auth/expired-action-code' ? 'expired' : 'invalid')
      }
    })()
  }, [oobCode, mode, router])

  // Kod yoksa: oturum durumuna göre ekran
  useEffect(() => {
    if (oobCode || !authReady) return
    if (!user) {
      setStatus('signed-out')
      return
    }
    if (user.emailVerified) {
      setStatus('verified')
      return
    }
    // Firebase'in kendi sayfasında doğrulayıp buraya dönen kullanıcı için durumu tazele
    let cancelled = false
    refreshEmailVerified().then((ok) => {
      if (cancelled) return
      setStatus(ok ? 'verified' : 'pending')
    })
    return () => { cancelled = true }
  }, [oobCode, authReady, user])

  useEffect(() => {
    if (sent === '1') markSent()
  }, [sent, markSent])

  const loginForResend = `/login?redirect=${encodeURIComponent('/verify-email')}`

  if (status === 'loading') {
    return (
      <AuthLayout breadcrumb={L('E-posta Doğrulama', 'Email Verification')} title={L('E-posta doğrulanıyor', 'Verifying email')}>
        <div className="flex flex-col items-center py-8 text-[#5d6e80]">
          <Loader2 className="mb-3 h-8 w-8 animate-spin text-[#0b2540]" />
          {L('Lütfen bekleyin…', 'Please wait…')}
        </div>
      </AuthLayout>
    )
  }

  if (status === 'verified' || status === 'recovered') {
    return (
      <AuthLayout
        breadcrumb={L('E-posta Doğrulama', 'Email Verification')}
        title={status === 'recovered' ? L('E-posta adresiniz geri yüklendi', 'Your email address has been restored') : L('E-posta adresiniz doğrulandı', 'Your email address has been verified')}
        subtitle={
          status === 'recovered'
            ? L(`Hesabınızın e-posta adresi ${restoredEmail || 'önceki adresinize'} geri alındı. Güvenliğiniz için şifrenizi değiştirmenizi öneririz.`, `Your account’s email address has been restored to ${restoredEmail || 'your previous address'}. For your security, we recommend changing your password.`)
            : L('Teşekkürler! Hesabınız tamamen etkin. Siparişlerinizi ve üye olmadan verdiğiniz siparişleri hesabınızdan takip edebilirsiniz.', 'Thank you! Your account is fully active. You can track your orders, including those placed as a guest, from your account.')
        }
       
      >
        <div className="space-y-3">
          {user ? (
            <PrimaryButton type="button" onClick={() => router.push(target)}>
              {target === '/profile' ? L('Hesabıma git', 'Go to my account') : L('Devam et', 'Continue')} <ArrowRight className="h-4 w-4" />
            </PrimaryButton>
          ) : (
            <PrimaryButton type="button" onClick={() => router.push('/login?verified=true')}>
              {L('Giriş yap', 'Sign in')} <ArrowRight className="h-4 w-4" />
            </PrimaryButton>
          )}
          {status === 'recovered' && (
            <SecondaryButton type="button" onClick={() => router.push('/forgot-password')}>{L('Şifremi değiştir', 'Change my password')}</SecondaryButton>
          )}
          <SecondaryButton type="button" onClick={() => router.push('/products')}>{L('Alışverişe devam et', 'Continue shopping')}</SecondaryButton>
        </div>
      </AuthLayout>
    )
  }

  if (status === 'expired' || status === 'invalid') {
    return (
      <AuthLayout
        breadcrumb={L('E-posta Doğrulama', 'Email Verification')}
        title={status === 'expired' ? L('Bağlantının süresi dolmuş', 'This link has expired') : L('Bağlantı geçersiz', 'Invalid link')}
        subtitle={
          status === 'expired'
            ? L('Güvenlik nedeniyle doğrulama bağlantıları sınırlı süre geçerlidir. Yeni bir bağlantı isteyebilirsiniz.', 'For security, verification links are valid for a limited time. You can request a new link.')
            : L('Bu bağlantı daha önce kullanılmış ya da eksik kopyalanmış olabilir. En son gönderilen e-postadaki bağlantıyı kullanın veya yeni bir bağlantı isteyin.', 'This link may have already been used or copied incompletely. Use the link in the most recent email or request a new one.')
        }
       
      >
        <div className="space-y-3">
          {message && <FormAlert tone={message.tone}>{message.text}</FormAlert>}
          {user && !user.emailVerified ? (
            <PrimaryButton type="button" onClick={resend} loading={sending} disabled={remaining > 0} loadingText={L('Gönderiliyor…', 'Sending…')}>
              {remaining > 0 ? L(`Yeni bağlantı gönder (${remaining} sn)`, `Send new link (${remaining}s)`) : L('Yeni doğrulama bağlantısı gönder', 'Send a new verification link')}
            </PrimaryButton>
          ) : (
            <PrimaryButton type="button" onClick={() => router.push(loginForResend)}>
              {L('Giriş yapıp yeni bağlantı iste', 'Sign in to request a new link')}
            </PrimaryButton>
          )}
          <SecondaryButton type="button" onClick={() => router.push('/')}>{L('Ana sayfaya dön', 'Back to home page')}</SecondaryButton>
        </div>
      </AuthLayout>
    )
  }

  if (status === 'signed-out') {
    return (
      <AuthLayout
        breadcrumb={L('E-posta Doğrulama', 'Email Verification')}
        title={L('E-posta doğrulama', 'Email verification')}
        subtitle={L('Doğrulama için e-posta adresinize gönderdiğimiz bağlantıya tıklayın. Bağlantı ulaşmadıysa giriş yapıp yeni bir bağlantı isteyebilirsiniz.', 'To verify, click the link we sent to your email address. If it hasn’t arrived, you can sign in and request a new link.')}
       
      >
        <div className="space-y-3">
          <PrimaryButton type="button" onClick={() => router.push(loginForResend)}>{L('Giriş yap', 'Sign in')}</PrimaryButton>
          <p className="text-center text-[14px] text-[#5d6e80]">
            {L('Hesabınız yok mu?', 'Don’t have an account?')} <Link href="/register" className="font-semibold text-[#0b2540] hover:underline">{L('Üye olun', 'Sign up')}</Link>
          </p>
        </div>
      </AuthLayout>
    )
  }

  // pending: oturum açık, doğrulanmamış
  return (
    <AuthLayout
      breadcrumb={L('E-posta Doğrulama', 'Email Verification')}
      title={sent ? L('Hesabınız oluşturuldu', 'Your account has been created') : L('E-posta adresinizi doğrulayın', 'Verify your email address')}
      subtitle={
        sent === '0'
          ? L('Doğrulama e-postası şu anda gönderilemedi. Aşağıdan tekrar deneyebilirsiniz.', 'The verification email could not be sent right now. You can try again below.')
          : L('Son bir adım kaldı: e-posta adresinize gönderdiğimiz doğrulama bağlantısına tıklayın.', 'One last step: click the verification link we sent to your email address.')
      }
     
    >
      <div className="space-y-5">
        <div className="rounded-[10px] border border-[#e6ebf1] bg-[#f5f7fa] p-4">
          <p className="text-[13px] text-[#5d6e80]">{L('Doğrulama bağlantısının gönderildiği adres', 'Verification link sent to')}</p>
          <p className="mt-0.5 break-all text-[15px] font-semibold text-[#121926]">{user?.email}</p>
          <ul className="mt-3 space-y-1.5 text-[13.5px] leading-relaxed text-[#20384e]">
            <li>• {L('E-posta birkaç dakika içinde ulaşır; gelmezse spam / gereksiz klasörünü kontrol edin.', 'The email arrives within a few minutes; if not, check your spam / junk folder.')}</li>
            <li>• {L('Bağlantıya tıkladıktan sonra bu sayfada "Doğruladım" düğmesine basın.', 'After clicking the link, press the "I’ve verified" button on this page.')}</li>
            <li>• {L('Doğrulamadan da alışverişe devam edebilirsiniz.', 'You can continue shopping without verifying.')}</li>
          </ul>
        </div>

        {message && <FormAlert tone={message.tone}>{message.text}</FormAlert>}

        <div className="space-y-3">
          <PrimaryButton
            type="button"
            loading={checking}
            loadingText={L('Kontrol ediliyor…', 'Checking…')}
            onClick={async () => { if (await check()) setStatus('verified') }}
          >
            <RefreshCw className="h-4 w-4" /> {L('Doğruladım', 'I’ve verified')}
          </PrimaryButton>
          <SecondaryButton type="button" onClick={resend} disabled={sending || remaining > 0}>
            {sending && <Loader2 className="h-4 w-4 animate-spin" />}
            {remaining > 0 ? L(`Tekrar gönder (${remaining} sn)`, `Resend (${remaining}s)`) : L('Doğrulama e-postasını tekrar gönder', 'Resend verification email')}
          </SecondaryButton>
        </div>

        <p className="text-center text-[14.5px]">
          <Link href={target} className="font-semibold text-[#0b2540] hover:underline underline-offset-2">
            {L('Şimdilik geç,', 'Skip for now,')} {target === '/profile' ? L('hesabıma git', 'go to my account') : L('devam et', 'continue')} →
          </Link>
        </p>
      </div>
    </AuthLayout>
  )
}

export default function VerifyEmailPage() {
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
      <VerifyEmailContent />
    </Suspense>
  )
}
