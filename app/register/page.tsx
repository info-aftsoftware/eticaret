'use client'

import React, { useState, useEffect, Suspense } from 'react'
import Link from 'next/link'
import { useRouter, useSearchParams } from 'next/navigation'
import { Loader2 } from 'lucide-react'
import { useAuthStore } from '@/lib/store/useAuthStore'
import { requestWelcomeEmail } from '@/lib/store/useFirebaseAuth'
import { ClassicPageShell } from '@/components/ClassicPageShell'
import { safeRedirect } from '@/lib/safe-redirect'
import { EMAIL_RE } from '@/lib/auth-errors'
import type { LegalSlug } from '@/lib/legal/documents'
import { LegalDocumentDialog, LegalLink } from '@/components/LegalDocumentDialog'
import { AuthLayout, TextField, PasswordField, PasswordStrength, Checkbox, PrimaryButton, FormAlert, linkClass } from '@/components/auth/AuthUI'
import { SocialSignInButtons } from '@/components/auth/SocialSignInButtons'
import { saveSignupConsents } from '@/components/auth/consents'
import { useL } from '@/lib/i18n-inline'

const MIN_PASSWORD = 8

type Errors = Partial<Record<'name' | 'email' | 'phone' | 'password' | 'confirmPassword' | 'terms', string>>

function RegisterPageContent() {
  const L = useL()
  const router = useRouter()
  const searchParams = useSearchParams()
  const register = useAuthStore((state) => state.register)
  const redirectParam = searchParams.get('redirect')
  const target = safeRedirect(redirectParam)
  const [formData, setFormData] = useState({ name: '', email: '', phone: '', password: '', confirmPassword: '' })
  // Sipariş sonrası "hesap oluştur": ödeme sayfası ad/e-posta/telefonu URL yerine sessionStorage'a bırakır
  useEffect(() => {
    if (searchParams.get('from_order') !== '1') return
    try {
      const raw = sessionStorage.getItem('register-prefill')
      if (!raw) return
      const p = JSON.parse(raw) as { name?: string; email?: string; phone?: string }
      setFormData((prev) => ({ ...prev, name: prev.name || p.name || '', email: prev.email || p.email || '', phone: prev.phone || p.phone || '' }))
      sessionStorage.removeItem('register-prefill')
    } catch {
      /* depolama kapalıysa form boş kalır */
    }
  }, [searchParams])
  const [errors, setErrors] = useState<Errors>({})
  const [error, setError] = useState('')
  const [loading, setLoading] = useState(false)
  const [acceptTerms, setAcceptTerms] = useState(false)
  // İYS / 6563 sayılı Kanun: ticari ileti izni ayrı ve varsayılan olarak işaretsiz olmalı
  const [acceptMarketing, setAcceptMarketing] = useState(false)
  const [legalDoc, setLegalDoc] = useState<LegalSlug | null>(null)

  useEffect(() => {
    const email = searchParams.get('email') ?? ''
    const name = searchParams.get('name') ?? ''
    const phone = searchParams.get('phone') ?? ''
    if (email || name || phone) {
      setFormData((prev) => ({ ...prev, email: email || prev.email, name: name || prev.name, phone: phone || prev.phone }))
    }
  }, [searchParams])

  const update = (field: keyof typeof formData) => (e: React.ChangeEvent<HTMLInputElement>) => {
    setFormData((prev) => ({ ...prev, [field]: e.target.value }))
    if (errors[field]) setErrors((prev) => ({ ...prev, [field]: undefined }))
  }

  const validate = (): Errors => {
    const next: Errors = {}
    const name = formData.name.trim()
    if (!name) next.name = L('Adınızı ve soyadınızı girin.', 'Enter your full name.')
    else if (name.length < 3) next.name = L('Ad soyad en az 3 karakter olmalıdır.', 'Full name must be at least 3 characters.')
    const email = formData.email.trim()
    if (!email) next.email = L('E-posta adresinizi girin.', 'Enter your email address.')
    else if (!EMAIL_RE.test(email)) next.email = L('Geçerli bir e-posta adresi girin (örn. ad@ornek.com).', 'Enter a valid email address (e.g. name@example.com).')
    const digits = formData.phone.replace(/\D/g, '')
    if (formData.phone.trim() && (digits.length < 10 || digits.length > 13)) next.phone = L('Geçerli bir telefon numarası girin (örn. 0555 123 45 67).', 'Enter a valid phone number (e.g. 0555 123 45 67).')
    if (!formData.password) next.password = L('Bir şifre belirleyin.', 'Choose a password.')
    else if (formData.password.length < MIN_PASSWORD) next.password = L(`Şifre en az ${MIN_PASSWORD} karakter olmalıdır.`, `Password must be at least ${MIN_PASSWORD} characters.`)
    if (!formData.confirmPassword) next.confirmPassword = L('Şifrenizi tekrar girin.', 'Re-enter your password.')
    else if (formData.password !== formData.confirmPassword) next.confirmPassword = L('Şifreler eşleşmiyor.', 'Passwords do not match.')
    if (!acceptTerms) next.terms = L('Devam etmek için Üyelik ve Kullanım Koşulları’nı kabul etmelisiniz.', 'You must accept the Membership and Terms of Use to continue.')
    return next
  }

  const afterSignup = (verificationSent: boolean) => {
    requestWelcomeEmail()
    const q = new URLSearchParams({ sent: verificationSent ? '1' : '0' })
    if (redirectParam) q.set('redirect', target)
    router.push(`/verify-email?${q.toString()}`)
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setError('')
    const next = validate()
    setErrors(next)
    if (Object.keys(next).length) {
      const first = Object.keys(next)[0]
      document.querySelector<HTMLElement>(`[data-field="${first}"] input`)?.focus()
      return
    }

    setLoading(true)
    const result = await register(formData.email.trim(), formData.password, formData.name.trim(), formData.phone.trim() || undefined)

    if (!result.success) {
      setError(result.error || L('Kayıt tamamlanamadı.', 'Registration could not be completed.'))
      setLoading(false)
      window.scrollTo({ top: 0, behavior: 'smooth' })
      return
    }
    // Onay kayıtları (zaman damgalı) kullanıcı profiline yazılır
    const uid = useAuthStore.getState().user?.id
    if (uid) await saveSignupConsents(uid, acceptMarketing).catch((err) => console.error('Consent save error:', err))
    afterSignup(!!result.verificationSent)
  }

  const fromOrder = searchParams.get('from_order') === '1'
  const loginHref = redirectParam ? `/login?redirect=${encodeURIComponent(target)}` : '/login'

  return (
    <AuthLayout
      breadcrumb={L('Kayıt Ol', 'Register')}
      title={L('Üye Ol', 'Sign Up')}
      subtitle={fromOrder ? L('Siparişiniz oluşturuldu. Siparişlerinizi takip etmek için hesabınızı oluşturun.', 'Your order has been placed. Create an account to track your orders.') : L('Birkaç adımda hesabınızı oluşturun, siparişlerinizi kolayca takip edin.', 'Create your account in a few steps and track your orders easily.')}
    >
      <div className="space-y-5">
        {error && (
          <FormAlert>
            {error}
            {error.includes('zaten var') && (
              <span className="mt-1 block">
                <Link href={`/login?email=${encodeURIComponent(formData.email.trim())}${redirectParam ? `&redirect=${encodeURIComponent(target)}` : ''}`} className="font-semibold underline">{L('Giriş yap', 'Sign in')}</Link>
                {' · '}
                <Link href={`/forgot-password?email=${encodeURIComponent(formData.email.trim())}`} className="font-semibold underline">{L('Şifremi unuttum', 'Forgot password')}</Link>
              </span>
            )}
          </FormAlert>
        )}

        <SocialSignInButtons
          onSuccess={() => router.push(target)}
          onError={setError}
          acceptMarketing={acceptMarketing}
          disabled={loading}
          dividerText={L('veya e-posta ile', 'or with email')}
          canStart={() => {
            if (acceptTerms) return true
            setErrors((prev) => ({ ...prev, terms: L('Google veya Facebook ile devam etmeden önce Üyelik ve Kullanım Koşulları’nı kabul edin.', 'Accept the Membership and Terms of Use before continuing with Google or Facebook.') }))
            document.querySelector<HTMLElement>('[data-field="terms"] input')?.focus()
            return false
          }}
        />

        <form onSubmit={handleSubmit} noValidate className="space-y-4">
          <div data-field="name">
            <TextField label={L('Ad Soyad', 'Full Name')} required placeholder={L('Adınız Soyadınız', 'Your full name')} value={formData.name} onChange={update('name')} error={errors.name} autoComplete="name" disabled={loading} />
          </div>
          <div data-field="email">
            <TextField label={L('E-posta', 'Email')} required type="email" inputMode="email" placeholder={L('ornek@email.com', 'example@email.com')} value={formData.email} onChange={update('email')} error={errors.email} autoComplete="email" disabled={loading} hint={L('Sipariş ve fatura bildirimleri bu adrese gönderilir.', 'Order and invoice notifications are sent to this address.')} />
          </div>
          <div data-field="phone">
            <TextField label={L('Telefon', 'Phone')} type="tel" inputMode="tel" placeholder="0555 123 45 67" value={formData.phone} onChange={update('phone')} error={errors.phone} autoComplete="tel" disabled={loading} hint={L('İsteğe bağlı — teslimatla ilgili size ulaşabilmemiz için.', 'Optional — so we can reach you about delivery.')} />
          </div>
          <div className="space-y-4">
            <div data-field="password">
              <PasswordField label={L('Şifre', 'Password')} required placeholder={L(`En az ${MIN_PASSWORD} karakter`, `At least ${MIN_PASSWORD} characters`)} value={formData.password} onChange={update('password')} error={errors.password} autoComplete="new-password" disabled={loading} />
            </div>
            <div data-field="confirmPassword">
              <PasswordField label={L('Şifre Tekrar', 'Confirm Password')} required placeholder={L('Şifrenizi tekrar girin', 'Re-enter your password')} value={formData.confirmPassword} onChange={update('confirmPassword')} error={errors.confirmPassword} autoComplete="new-password" disabled={loading} />
            </div>
          </div>
          <div className="-mt-1 text-[13px] text-[#5d6e80]">
            <PasswordStrength password={formData.password} />
          </div>

          <div className="space-y-3 rounded-md border border-[#e6ebf1] p-4">
            <div data-field="terms">
              <Checkbox checked={acceptTerms} onChange={(v) => { setAcceptTerms(v); if (v) setErrors((p) => ({ ...p, terms: undefined })) }} error={errors.terms} disabled={loading}>
                {L('', 'I have read and accept the ')}<LegalLink slug="uyelik-ve-kullanim-kosullari" onOpen={setLegalDoc}>{L('Üyelik ve Kullanım Koşulları', 'Membership and Terms of Use')}</LegalLink>{L('’nı okudum ve kabul ediyorum.', '.')} <span className="text-red-500">*</span>
              </Checkbox>
            </div>
            <Checkbox checked={acceptMarketing} onChange={setAcceptMarketing} disabled={loading}>
              {L('Kampanya ve duyurulardan haberdar olmak için', 'I agree to receive')} <LegalLink slug="ticari-elektronik-ileti-onayi" onOpen={setLegalDoc}>{L('ticari elektronik ileti', 'commercial electronic messages')}</LegalLink> {L('almayı kabul ediyorum (isteğe bağlı).', 'to stay informed about campaigns and announcements (optional).')}
            </Checkbox>
            <p className="pl-8 text-[12.5px] leading-relaxed text-[#5d6e80] [&_button]:min-h-0 [&_button]:min-w-0">
              {L('Kişisel verileriniz', 'Your personal data is processed under the')} <LegalLink slug="kvkk" onOpen={setLegalDoc}>{L('KVKK Aydınlatma Metni', 'KVKK Privacy Notice')}</LegalLink> {L('ve', 'and')}{' '}
              <LegalLink slug="gizlilik-ve-cerez-politikasi" onOpen={setLegalDoc}>{L('Gizlilik ve Çerez Politikası', 'Privacy and Cookie Policy')}</LegalLink>{L(' kapsamında işlenir.', '.')}
            </p>
          </div>
          <LegalDocumentDialog slug={legalDoc} onClose={() => setLegalDoc(null)} />

          <PrimaryButton type="submit" loading={loading} loadingText={L('Hesabınız oluşturuluyor…', 'Creating your account…')}>
            {L('Üye Ol', 'Sign Up')}
          </PrimaryButton>
        </form>

        <p className="text-center text-[14.5px] text-[#5d6e80]">
          {L('Zaten hesabınız var mı?', 'Already have an account?')} <Link href={loginHref} className={linkClass}>{L('Giriş yapın', 'Sign in')}</Link>
        </p>
      </div>
    </AuthLayout>
  )
}

export default function RegisterPage() {
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
      <RegisterPageContent />
    </Suspense>
  )
}
