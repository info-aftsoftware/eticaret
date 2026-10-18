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

type Status = 'loading' | 'verified' | 'recovered' | 'expired' | 'invalid' | 'pending' | 'signed-out'

function VerifyEmailContent() {
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
      <AuthLayout breadcrumb="E-posta Doğrulama" title="E-posta doğrulanıyor">
        <div className="flex flex-col items-center py-8 text-[#5d6e80]">
          <Loader2 className="mb-3 h-8 w-8 animate-spin text-[#0b2540]" />
          Lütfen bekleyin…
        </div>
      </AuthLayout>
    )
  }

  if (status === 'verified' || status === 'recovered') {
    return (
      <AuthLayout
        breadcrumb="E-posta Doğrulama"
        title={status === 'recovered' ? 'E-posta adresiniz geri yüklendi' : 'E-posta adresiniz doğrulandı'}
        subtitle={
          status === 'recovered'
            ? `Hesabınızın e-posta adresi ${restoredEmail || 'önceki adresinize'} geri alındı. Güvenliğiniz için şifrenizi değiştirmenizi öneririz.`
            : 'Teşekkürler! Hesabınız tamamen etkin. Siparişlerinizi ve üye olmadan verdiğiniz siparişleri hesabınızdan takip edebilirsiniz.'
        }
       
      >
        <div className="space-y-3">
          {user ? (
            <PrimaryButton type="button" onClick={() => router.push(target)}>
              {target === '/profile' ? 'Hesabıma git' : 'Devam et'} <ArrowRight className="h-4 w-4" />
            </PrimaryButton>
          ) : (
            <PrimaryButton type="button" onClick={() => router.push('/login?verified=true')}>
              Giriş yap <ArrowRight className="h-4 w-4" />
            </PrimaryButton>
          )}
          {status === 'recovered' && (
            <SecondaryButton type="button" onClick={() => router.push('/forgot-password')}>Şifremi değiştir</SecondaryButton>
          )}
          <SecondaryButton type="button" onClick={() => router.push('/products')}>Alışverişe devam et</SecondaryButton>
        </div>
      </AuthLayout>
    )
  }

  if (status === 'expired' || status === 'invalid') {
    return (
      <AuthLayout
        breadcrumb="E-posta Doğrulama"
        title={status === 'expired' ? 'Bağlantının süresi dolmuş' : 'Bağlantı geçersiz'}
        subtitle={
          status === 'expired'
            ? 'Güvenlik nedeniyle doğrulama bağlantıları sınırlı süre geçerlidir. Yeni bir bağlantı isteyebilirsiniz.'
            : 'Bu bağlantı daha önce kullanılmış ya da eksik kopyalanmış olabilir. En son gönderilen e-postadaki bağlantıyı kullanın veya yeni bir bağlantı isteyin.'
        }
       
      >
        <div className="space-y-3">
          {message && <FormAlert tone={message.tone}>{message.text}</FormAlert>}
          {user && !user.emailVerified ? (
            <PrimaryButton type="button" onClick={resend} loading={sending} disabled={remaining > 0} loadingText="Gönderiliyor…">
              {remaining > 0 ? `Yeni bağlantı gönder (${remaining} sn)` : 'Yeni doğrulama bağlantısı gönder'}
            </PrimaryButton>
          ) : (
            <PrimaryButton type="button" onClick={() => router.push(loginForResend)}>
              Giriş yapıp yeni bağlantı iste
            </PrimaryButton>
          )}
          <SecondaryButton type="button" onClick={() => router.push('/')}>Ana sayfaya dön</SecondaryButton>
        </div>
      </AuthLayout>
    )
  }

  if (status === 'signed-out') {
    return (
      <AuthLayout
        breadcrumb="E-posta Doğrulama"
        title="E-posta doğrulama"
        subtitle="Doğrulama için e-posta adresinize gönderdiğimiz bağlantıya tıklayın. Bağlantı ulaşmadıysa giriş yapıp yeni bir bağlantı isteyebilirsiniz."
       
      >
        <div className="space-y-3">
          <PrimaryButton type="button" onClick={() => router.push(loginForResend)}>Giriş yap</PrimaryButton>
          <p className="text-center text-[14px] text-[#5d6e80]">
            Hesabınız yok mu? <Link href="/register" className="font-semibold text-[#0b2540] hover:underline">Üye olun</Link>
          </p>
        </div>
      </AuthLayout>
    )
  }

  // pending: oturum açık, doğrulanmamış
  return (
    <AuthLayout
      breadcrumb="E-posta Doğrulama"
      title={sent ? 'Hesabınız oluşturuldu' : 'E-posta adresinizi doğrulayın'}
      subtitle={
        sent === '0'
          ? 'Doğrulama e-postası şu anda gönderilemedi. Aşağıdan tekrar deneyebilirsiniz.'
          : 'Son bir adım kaldı: e-posta adresinize gönderdiğimiz doğrulama bağlantısına tıklayın.'
      }
     
    >
      <div className="space-y-5">
        <div className="rounded-[10px] border border-[#e6ebf1] bg-[#f5f7fa] p-4">
          <p className="text-[13px] text-[#5d6e80]">Doğrulama bağlantısının gönderildiği adres</p>
          <p className="mt-0.5 break-all text-[15px] font-semibold text-[#121926]">{user?.email}</p>
          <ul className="mt-3 space-y-1.5 text-[13.5px] leading-relaxed text-[#20384e]">
            <li>• E-posta birkaç dakika içinde ulaşır; gelmezse spam / gereksiz klasörünü kontrol edin.</li>
            <li>• Bağlantıya tıkladıktan sonra bu sayfada &quot;Doğruladım&quot; düğmesine basın.</li>
            <li>• Doğrulamadan da alışverişe devam edebilirsiniz.</li>
          </ul>
        </div>

        {message && <FormAlert tone={message.tone}>{message.text}</FormAlert>}

        <div className="space-y-3">
          <PrimaryButton
            type="button"
            loading={checking}
            loadingText="Kontrol ediliyor…"
            onClick={async () => { if (await check()) setStatus('verified') }}
          >
            <RefreshCw className="h-4 w-4" /> Doğruladım
          </PrimaryButton>
          <SecondaryButton type="button" onClick={resend} disabled={sending || remaining > 0}>
            {sending && <Loader2 className="h-4 w-4 animate-spin" />}
            {remaining > 0 ? `Tekrar gönder (${remaining} sn)` : 'Doğrulama e-postasını tekrar gönder'}
          </SecondaryButton>
        </div>

        <p className="text-center text-[14.5px]">
          <Link href={target} className="font-semibold text-[#0b2540] hover:underline underline-offset-2">
            Şimdilik geç, {target === '/profile' ? 'hesabıma git' : 'devam et'} →
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
