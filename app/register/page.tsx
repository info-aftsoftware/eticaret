'use client'

import React, { useState, useEffect, Suspense } from 'react'
import Link from 'next/link'
import { useRouter, useSearchParams } from 'next/navigation'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { useAuthStore } from '@/lib/store/useAuthStore'
import { ClassicPageShell } from '@/components/ClassicPageShell'
import { Mail, Lock, User, Phone, UserPlus, AlertCircle, Eye, EyeOff, Loader2 } from 'lucide-react'
import { Alert, AlertDescription } from '@/components/ui/alert'
import { setUserProfile } from '@/lib/firebase/firestore'
import { safeRedirect } from '@/lib/safe-redirect'
import { getLegalDocument, type LegalSlug } from '@/lib/legal/documents'
import { LegalDocumentDialog, LegalLink } from '@/components/LegalDocumentDialog'

function RegisterPageContent() {
  const router = useRouter()
  const searchParams = useSearchParams()
  const register = useAuthStore((state) => state.register)
  const [formData, setFormData] = useState({
    name: '',
    email: '',
    phone: '',
    password: '',
    confirmPassword: '',
  })
  const [showPassword, setShowPassword] = useState(false)
  const [showConfirmPassword, setShowConfirmPassword] = useState(false)
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
      setFormData((prev) => ({
        ...prev,
        email: email || prev.email,
        name: name || prev.name,
        phone: phone || prev.phone,
      }))
    }
  }, [searchParams])

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setError('')

    // Scroll to top on error
    const scrollToTop = () => {
      window.scrollTo({ top: 0, behavior: 'smooth' })
    }

    if (!acceptTerms) {
      setError('Üyelik ve Kullanım Koşulları’nı kabul etmelisiniz')
      scrollToTop()
      return
    }

    if (formData.password !== formData.confirmPassword) {
      setError('Şifreler eşleşmiyor')
      scrollToTop()
      return
    }

    if (formData.password.length < 6) {
      setError('Şifre en az 6 karakter olmalıdır')
      scrollToTop()
      return
    }

    setLoading(true)

    const result = await register(
      formData.email,
      formData.password,
      formData.name,
      formData.phone || undefined
    )

    if (result.success) {
      if (result.message) setError('')
      // Onay kayıtları (zaman damgalı) kullanıcı profiline yazılır
      try {
        const uid = useAuthStore.getState().user?.id
        if (uid) {
          const now = new Date().toISOString()
          await setUserProfile(uid, {
            consents: {
              membershipTerms: { accepted: true, at: now, version: getLegalDocument('uyelik-ve-kullanim-kosullari')?.updated ?? null },
              kvkkInformed: { at: now, version: getLegalDocument('kvkk')?.updated ?? null },
              commercialMessages: { accepted: acceptMarketing, at: now, channels: acceptMarketing ? ['email', 'sms'] : [] },
            },
          })
        }
      } catch (err) {
        console.error('Consent save error:', err)
      }
      router.push(safeRedirect(searchParams.get('redirect')))
    } else {
      setError(result.error || 'Kayıt başarısız')
      window.scrollTo({ top: 0, behavior: 'smooth' })
    }

    setLoading(false)
  }

  return (
    <ClassicPageShell breadcrumbs={[{ label: 'Kayıt Ol' }]} noTitle>
      <div className="flex justify-center py-6">
        <div className="w-full max-w-md">
          <Card className="classic-card rounded-lg border border-gray-200 overflow-hidden">
            <CardHeader className="space-y-1 text-center pb-4 bg-white">
              <div className="flex justify-center mb-4">
                <div className="w-14 h-14 bg-brand rounded-lg flex items-center justify-center">
                  <UserPlus className="w-7 h-7 text-white" />
                </div>
              </div>
              <CardTitle className="text-xl font-bold text-gray-900 uppercase tracking-tight">Kayıt Ol</CardTitle>
              <CardDescription className="text-gray-600 text-sm">
                {searchParams.get('from_order') === '1' ? 'Siparişiniz oluşturuldu. Hesabınızı aktifleştirmek için şifre belirleyin.' : 'Yeni hesap oluşturun ve alışverişe başlayın'}
              </CardDescription>
            </CardHeader>
            <CardContent className="bg-white">
            <form onSubmit={handleSubmit} className="space-y-4">
              {error && (
                <Alert variant="destructive" className="rounded-xl">
                  <AlertCircle className="h-4 w-4" />
                  <AlertDescription>{error}</AlertDescription>
                </Alert>
              )}

              <div className="space-y-2">
                <Label htmlFor="name">Ad Soyad *</Label>
                <div className="relative flex items-center">
                  <span className="absolute left-0 flex h-full w-12 items-center justify-center text-gray-400 pointer-events-none shrink-0">
                    <User className="w-5 h-5" />
                  </span>
                  <Input id="name" type="text" placeholder="Adınız Soyadınız" value={formData.name} onChange={(e) => setFormData({ ...formData, name: e.target.value })} className="rounded-xl pl-12 pr-4 min-w-0" required disabled={loading} />
                </div>
              </div>
              <div className="space-y-2">
                <Label htmlFor="email">E-posta *</Label>
                <div className="relative flex items-center">
                  <span className="absolute left-0 flex h-full w-12 items-center justify-center text-gray-400 pointer-events-none shrink-0">
                    <Mail className="w-5 h-5" />
                  </span>
                  <Input id="email" type="email" placeholder="ornek@email.com" value={formData.email} onChange={(e) => setFormData({ ...formData, email: e.target.value })} className="rounded-xl pl-12 pr-4 min-w-0" required disabled={loading} autoComplete="username" />
                </div>
              </div>
              <div className="space-y-2">
                <Label htmlFor="phone">Telefon</Label>
                <div className="relative flex items-center">
                  <span className="absolute left-0 flex h-full w-12 items-center justify-center text-gray-400 pointer-events-none shrink-0">
                    <Phone className="w-5 h-5" />
                  </span>
                  <Input id="phone" type="tel" placeholder="+90 555 123 4567" value={formData.phone} onChange={(e) => setFormData({ ...formData, phone: e.target.value })} className="rounded-xl pl-12 pr-4 min-w-0" disabled={loading} autoComplete="tel" />
                </div>
              </div>
              <div className="space-y-2">
                <Label htmlFor="password">Şifre *</Label>
                <div className="relative flex items-center">
                  <span className="absolute left-0 flex h-full w-12 items-center justify-center text-gray-400 pointer-events-none shrink-0">
                    <Lock className="w-5 h-5" />
                  </span>
                  <Input id="password" type={showPassword ? 'text' : 'password'} placeholder="En az 6 karakter" value={formData.password} onChange={(e) => setFormData({ ...formData, password: e.target.value })} className="rounded-xl pl-12 pr-12 min-w-0" required minLength={6} disabled={loading} autoComplete="new-password" />
                  <button type="button" onClick={(e) => { e.preventDefault(); e.stopPropagation(); setShowPassword(!showPassword) }} className="absolute right-2 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600 z-10 p-2 min-h-[44px] min-w-[44px] flex items-center justify-center rounded touch-manipulation" aria-label={showPassword ? 'Şifreyi gizle' : 'Şifreyi göster'}>{showPassword ? <EyeOff className="w-5 h-5" /> : <Eye className="w-5 h-5" />}</button>
                </div>
              </div>
              <div className="space-y-2">
                <Label htmlFor="confirmPassword">Şifre Tekrar *</Label>
                <div className="relative flex items-center">
                  <span className="absolute left-0 flex h-full w-12 items-center justify-center text-gray-400 pointer-events-none shrink-0">
                    <Lock className="w-5 h-5" />
                  </span>
                  <Input id="confirmPassword" type={showConfirmPassword ? 'text' : 'password'} placeholder="Şifrenizi tekrar girin" value={formData.confirmPassword} onChange={(e) => setFormData({ ...formData, confirmPassword: e.target.value })} className="rounded-xl pl-12 pr-12 min-w-0" required minLength={6} disabled={loading} autoComplete="new-password" />
                  <button type="button" onClick={(e) => { e.preventDefault(); e.stopPropagation(); setShowConfirmPassword(!showConfirmPassword) }} className="absolute right-2 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600 z-10 p-2 min-h-[44px] min-w-[44px] flex items-center justify-center rounded touch-manipulation" aria-label={showConfirmPassword ? 'Şifreyi gizle' : 'Şifreyi göster'}>{showConfirmPassword ? <EyeOff className="w-5 h-5" /> : <Eye className="w-5 h-5" />}</button>
                </div>
              </div>

              <label className="flex items-start gap-2 cursor-pointer py-2 touch-manipulation min-h-[44px] items-center">
                <input type="checkbox" id="terms" checked={acceptTerms} onChange={(e) => setAcceptTerms(e.target.checked)} className="w-5 h-5 min-w-[20px] min-h-[20px] text-brand border-gray-300 rounded focus:ring-brand shrink-0" required />
                <span className="text-sm text-gray-600">
                  <LegalLink slug="uyelik-ve-kullanim-kosullari" onOpen={setLegalDoc}>Üyelik ve Kullanım Koşulları</LegalLink>’nı okudum ve kabul ediyorum *
                </span>
              </label>

              <label className="flex items-start gap-2 cursor-pointer py-1 touch-manipulation">
                <input type="checkbox" id="marketing" checked={acceptMarketing} onChange={(e) => setAcceptMarketing(e.target.checked)} className="mt-0.5 w-5 h-5 min-w-[20px] min-h-[20px] text-brand border-gray-300 rounded focus:ring-brand shrink-0" />
                <span className="text-sm text-gray-600">
                  Kampanya ve duyurulardan haberdar olmak için <LegalLink slug="ticari-elektronik-ileti-onayi" onOpen={setLegalDoc}>ticari elektronik ileti</LegalLink> almayı kabul ediyorum (isteğe bağlı).
                </span>
              </label>

              <p className="text-xs text-gray-500">
                Kişisel verileriniz <LegalLink slug="kvkk" onOpen={setLegalDoc}>KVKK Aydınlatma Metni</LegalLink> ve{' '}
                <LegalLink slug="gizlilik-ve-cerez-politikasi" onOpen={setLegalDoc}>Gizlilik ve Çerez Politikası</LegalLink> kapsamında işlenir.
              </p>
              <LegalDocumentDialog slug={legalDoc} onClose={() => setLegalDoc(null)} />

              <Button type="submit" className="w-full btn-classic-primary rounded-lg min-h-[48px] touch-manipulation" disabled={loading} size="lg">
                {loading ? <><Loader2 className="w-5 h-5 mr-2 animate-spin" /> Kayıt yapılıyor...</> : 'Kayıt Ol'}
              </Button>

              <div className="text-center text-sm text-gray-600 py-2">
                Zaten hesabınız var mı? <Link href="/login" className="text-brand hover:text-brand-hover font-semibold py-2 inline-block touch-manipulation">Giriş yapın</Link>
              </div>
            </form>
            </CardContent>
          </Card>
        </div>
      </div>
    </ClassicPageShell>
  )
}

export default function RegisterPage() {
  return (
    <Suspense fallback={
      <ClassicPageShell noTitle>
        <div className="flex items-center justify-center py-20">
          <div className="animate-spin rounded-full h-12 w-12 border-2 border-slate-800 border-t-transparent mx-auto" />
        </div>
      </ClassicPageShell>
    }>
      <RegisterPageContent />
    </Suspense>
  )
}

