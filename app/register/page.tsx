'use client'

import React, { useState, useEffect, Suspense } from 'react'
import Link from 'next/link'
import { useRouter, useSearchParams } from 'next/navigation'
import { Mail, Lock, User, Phone, UserPlus, Loader2 } from 'lucide-react'
import { useAuthStore } from '@/lib/store/useAuthStore'
import { requestWelcomeEmail } from '@/lib/store/useFirebaseAuth'
import { ClassicPageShell } from '@/components/ClassicPageShell'
import { safeRedirect } from '@/lib/safe-redirect'
import { EMAIL_RE } from '@/lib/auth-errors'
import type { LegalSlug } from '@/lib/legal/documents'
import { LegalDocumentDialog, LegalLink } from '@/components/LegalDocumentDialog'
import { AuthLayout, TextField, PasswordField, PasswordStrength, Checkbox, PrimaryButton, FormAlert, linkClass } from '@/components/auth/AuthUI'
import { GoogleSignInButton } from '@/components/auth/GoogleSignInButton'
import { saveSignupConsents } from '@/components/auth/consents'

const MIN_PASSWORD = 8

type Errors = Partial<Record<'name' | 'email' | 'phone' | 'password' | 'confirmPassword' | 'terms', string>>

function RegisterPageContent() {
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
    if (!name) next.name = 'Adınızı ve soyadınızı girin.'
    else if (name.length < 3) next.name = 'Ad soyad en az 3 karakter olmalıdır.'
    const email = formData.email.trim()
    if (!email) next.email = 'E-posta adresinizi girin.'
    else if (!EMAIL_RE.test(email)) next.email = 'Geçerli bir e-posta adresi girin (örn. ad@ornek.com).'
    const digits = formData.phone.replace(/\D/g, '')
    if (formData.phone.trim() && (digits.length < 10 || digits.length > 13)) next.phone = 'Geçerli bir telefon numarası girin (örn. 0555 123 45 67).'
    if (!formData.password) next.password = 'Bir şifre belirleyin.'
    else if (formData.password.length < MIN_PASSWORD) next.password = `Şifre en az ${MIN_PASSWORD} karakter olmalıdır.`
    if (!formData.confirmPassword) next.confirmPassword = 'Şifrenizi tekrar girin.'
    else if (formData.password !== formData.confirmPassword) next.confirmPassword = 'Şifreler eşleşmiyor.'
    if (!acceptTerms) next.terms = 'Devam etmek için Üyelik ve Kullanım Koşulları’nı kabul etmelisiniz.'
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
      setError(result.error || 'Kayıt tamamlanamadı.')
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
      breadcrumb="Kayıt Ol"
      icon={UserPlus}
      title="Üye Ol"
      subtitle={fromOrder ? 'Siparişiniz oluşturuldu. Siparişlerinizi takip etmek için hesabınızı oluşturun.' : 'Birkaç adımda hesabınızı oluşturun, siparişlerinizi kolayca takip edin.'}
    >
      <div className="space-y-5">
        {error && (
          <FormAlert>
            {error}
            {error.includes('zaten var') && (
              <span className="mt-1 block">
                <Link href={`/login?email=${encodeURIComponent(formData.email.trim())}${redirectParam ? `&redirect=${encodeURIComponent(target)}` : ''}`} className="font-semibold underline">Giriş yap</Link>
                {' · '}
                <Link href={`/forgot-password?email=${encodeURIComponent(formData.email.trim())}`} className="font-semibold underline">Şifremi unuttum</Link>
              </span>
            )}
          </FormAlert>
        )}

        <GoogleSignInButton
          onSuccess={() => router.push(target)}
          onError={setError}
          acceptMarketing={acceptMarketing}
          disabled={loading}
          dividerText="veya e-posta ile"
          canStart={() => {
            if (acceptTerms) return true
            setErrors((prev) => ({ ...prev, terms: 'Google ile devam etmeden önce Üyelik ve Kullanım Koşulları’nı kabul edin.' }))
            document.querySelector<HTMLElement>('[data-field="terms"] input')?.focus()
            return false
          }}
        />

        <form onSubmit={handleSubmit} noValidate className="space-y-4">
          <div data-field="name">
            <TextField label="Ad Soyad" required icon={User} placeholder="Adınız Soyadınız" value={formData.name} onChange={update('name')} error={errors.name} autoComplete="name" disabled={loading} />
          </div>
          <div data-field="email">
            <TextField label="E-posta" required icon={Mail} type="email" inputMode="email" placeholder="ornek@email.com" value={formData.email} onChange={update('email')} error={errors.email} autoComplete="email" disabled={loading} hint="Sipariş ve fatura bildirimleri bu adrese gönderilir." />
          </div>
          <div data-field="phone">
            <TextField label="Telefon" icon={Phone} type="tel" inputMode="tel" placeholder="0555 123 45 67" value={formData.phone} onChange={update('phone')} error={errors.phone} autoComplete="tel" disabled={loading} hint="İsteğe bağlı — teslimatla ilgili size ulaşabilmemiz için." />
          </div>
          <div className="grid gap-4 sm:grid-cols-2">
            <div data-field="password">
              <PasswordField label="Şifre" required icon={Lock} placeholder={`En az ${MIN_PASSWORD} karakter`} value={formData.password} onChange={update('password')} error={errors.password} autoComplete="new-password" disabled={loading} />
            </div>
            <div data-field="confirmPassword">
              <PasswordField label="Şifre Tekrar" required icon={Lock} placeholder="Şifrenizi tekrar girin" value={formData.confirmPassword} onChange={update('confirmPassword')} error={errors.confirmPassword} autoComplete="new-password" disabled={loading} />
            </div>
          </div>
          <div className="-mt-1 text-[13px] text-[#5d6e80]">
            <PasswordStrength password={formData.password} />
          </div>

          <div className="space-y-3 rounded-[10px] bg-[#f5f7fa] p-4">
            <div data-field="terms">
              <Checkbox checked={acceptTerms} onChange={(v) => { setAcceptTerms(v); if (v) setErrors((p) => ({ ...p, terms: undefined })) }} error={errors.terms} disabled={loading}>
                <LegalLink slug="uyelik-ve-kullanim-kosullari" onOpen={setLegalDoc}>Üyelik ve Kullanım Koşulları</LegalLink>’nı okudum ve kabul ediyorum. <span className="text-red-500">*</span>
              </Checkbox>
            </div>
            <Checkbox checked={acceptMarketing} onChange={setAcceptMarketing} disabled={loading}>
              Kampanya ve duyurulardan haberdar olmak için <LegalLink slug="ticari-elektronik-ileti-onayi" onOpen={setLegalDoc}>ticari elektronik ileti</LegalLink> almayı kabul ediyorum (isteğe bağlı).
            </Checkbox>
            <p className="pl-8 text-[12.5px] leading-relaxed text-[#5d6e80] [&_button]:min-h-0 [&_button]:min-w-0">
              Kişisel verileriniz <LegalLink slug="kvkk" onOpen={setLegalDoc}>KVKK Aydınlatma Metni</LegalLink> ve{' '}
              <LegalLink slug="gizlilik-ve-cerez-politikasi" onOpen={setLegalDoc}>Gizlilik ve Çerez Politikası</LegalLink> kapsamında işlenir.
            </p>
          </div>
          <LegalDocumentDialog slug={legalDoc} onClose={() => setLegalDoc(null)} />

          <PrimaryButton type="submit" loading={loading} loadingText="Hesabınız oluşturuluyor…">
            Üye Ol
          </PrimaryButton>
        </form>

        <p className="text-center text-[14.5px] text-[#5d6e80]">
          Zaten hesabınız var mı? <Link href={loginHref} className={linkClass}>Giriş yapın</Link>
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
