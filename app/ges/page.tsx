'use client'

import React, { useState, useCallback, useEffect, useRef } from 'react'
import Link from 'next/link'
import { useTranslations } from 'next-intl'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Card, CardContent } from '@/components/ui/card'
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog'
import {
  Select, SelectContent, SelectItem, SelectTrigger, SelectValue,
} from '@/components/ui/select'
import { Calculator, ChevronDown, CheckCircle, Clock, ShieldCheck, Loader2, FileCheck, Star } from 'lucide-react'
import {
  GES_REGIONS, MONTHLY_KWH_MIN, MONTHLY_KWH_MAX,
  SUN_HOURS_MIN, SUN_HOURS_MAX, PR_MIN, PR_MAX, GES_DEFAULT_PR,
} from '@/lib/ges-constants'
import { gesCalculationRanges, type GesCalcRanges } from '@/lib/ges-calc'
import { TR_CITIES, getDistrictsByCity } from '@/lib/tr-cities'
import { useAuthStore } from '@/lib/store/useAuthStore'
import { getAddresses } from '@/lib/firebase/firestore'
import { useL } from '@/lib/i18n-inline'
import { isValidTrPhone, PHONE_ERROR_TR, PHONE_ERROR_EN } from '@/lib/checkout-validation'

const CONTACT_DRAFT_KEY = 'site_contact_draft'

/** Required field marker */
const Req = () => <span className="text-red-500 font-bold ml-0.5" aria-hidden="true">*</span>

/** Input className with error state */
function fieldCls(err?: string) {
  return `flex h-12 w-full rounded-xl border px-4 py-2 text-sm bg-white transition-shadow focus:outline-none focus:ring-2 disabled:cursor-not-allowed disabled:opacity-50 ${err
    ? 'border-red-400 focus:ring-red-200 bg-red-50/40'
    : 'border-slate-200 focus:ring-brand/20'
    }`
}

/** Select trigger className with error state */
function selectCls(err?: string) {
  return `h-12 w-full rounded-xl border bg-white transition-shadow focus:outline-none focus:ring-2 ${err
    ? 'border-red-400 focus:ring-red-200 bg-red-50/40'
    : 'border-slate-200 focus:ring-brand/20'
    }`
}

type FormState = {
  fullName: string
  phone: string
  email: string
  city: string
  district: string
  propertyType: string
  monthlyBillRange: string
  monthlyKwh: string
  subscriberType: string
  threePhase: string
  installationAreaType: string
  roofType: string
  roofAreaRange: string
  shading: string
  deedStatus: string
  usageGoal: string[]
  storagePreference: string
  budgetRange: string
  attachmentBillUrl: string
  attachmentRoofUrl: string
  kvkkAccepted: boolean
  callAccepted: boolean
}

const initialForm: FormState = {
  fullName: '', phone: '', email: '', city: '', district: '',
  propertyType: '', monthlyBillRange: '', monthlyKwh: '',
  subscriberType: '', threePhase: '', installationAreaType: '',
  roofType: '', roofAreaRange: '', shading: '', deedStatus: '',
  usageGoal: [], storagePreference: '', budgetRange: '',
  attachmentBillUrl: '', attachmentRoofUrl: '',
  kvkkAccepted: false, callAccepted: false,
}

function scrollToFirstError(errors: Record<string, string>) {
  const firstKey = Object.keys(errors)[0]
  if (!firstKey) return
  const el =
    document.getElementById(`field-${firstKey}`) ||
    document.getElementById(firstKey)
  if (el) {
    el.scrollIntoView({ behavior: 'smooth', block: 'center' })
    const focusable = el.querySelector<HTMLElement>('input,select,textarea,button')
    if (focusable) setTimeout(() => focusable.focus({ preventScroll: true }), 400)
  }
}

export default function GesPage() {
  const t = useTranslations('ges')
  const L = useL()

  const { user, isAuthenticated } = useAuthStore()

  // Calculator state
  const [calcMonthlyKwh, setCalcMonthlyKwh] = useState('')
  const [regionId, setRegionId] = useState('')
  const [sunHours, setSunHours] = useState('5')
  const [performanceRatio, setPerformanceRatio] = useState(String(GES_DEFAULT_PR))
  const [calcErrors, setCalcErrors] = useState<Record<string, string>>({})
  const [calcResult, setCalcResult] = useState<GesCalcRanges | null>(null)
  const [kvkkDialogOpen, setKvkkDialogOpen] = useState(false)

  // Form state
  const [form, setForm] = useState<FormState>(initialForm)
  const [formErrors, setFormErrors] = useState<Record<string, string>>({})
  const [submitting, setSubmitting] = useState(false)
  const [success, setSuccess] = useState(false)
  const [uploading, setUploading] = useState<string | null>(null)

  const districts = form.city ? getDistrictsByCity(form.city) : []

  useEffect(() => {
    let mounted = true
    const draft = (() => {
      if (typeof window === 'undefined') return {}
      try { return JSON.parse(localStorage.getItem(CONTACT_DRAFT_KEY) || '{}') as Record<string, string> }
      catch { return {} }
    })()
    if (isAuthenticated && user?.id) {
      getAddresses(user.id)
        .then((addresses) => {
          if (!mounted) return
          const addr = addresses.find((a) => a.isDefault) ?? addresses[0]
          setForm((p) => ({
            ...p,
            fullName: user.name?.trim() || draft.fullName || p.fullName,
            phone: user.phone?.trim() || draft.phone || p.phone,
            email: user.email?.trim() || draft.email || p.email,
            city: addr?.city?.trim() || draft.city || p.city,
            district: addr?.district?.trim() || p.district,
          }))
        })
        .catch(() => {
          if (!mounted) return
          setForm((p) => ({
            ...p,
            fullName: user.name?.trim() || draft.fullName || p.fullName,
            phone: user.phone?.trim() || draft.phone || p.phone,
            email: user.email?.trim() || draft.email || p.email,
            city: draft.city || p.city,
          }))
        })
    } else {
      setForm((p) => ({
        ...p,
        fullName: draft.fullName || p.fullName,
        phone: draft.phone || p.phone,
        email: draft.email || p.email,
        city: draft.city || p.city,
      }))
    }
    return () => { mounted = false }
  }, [isAuthenticated, user?.id, user?.name, user?.phone, user?.email])

  useEffect(() => {
    if (form.city && !districts.includes(form.district)) {
      setForm((p) => ({ ...p, district: '' }))
    }
  }, [form.city, form.district, districts])

  const set = (updates: Partial<FormState>) => {
    setForm((p) => ({ ...p, ...updates }))
    setFormErrors((p) => {
      const next = { ...p }
      Object.keys(updates).forEach((k) => delete next[k])
      return next
    })
  }

  const handleRegionChange = (value: string) => {
    setRegionId(value)
    const region = GES_REGIONS.find((r) => r.id === value)
    if (region) setSunHours(String(region.sunHours))
  }

  const validateCalc = useCallback((): boolean => {
    const kwh = parseFloat(calcMonthlyKwh.replace(',', '.'))
    const hours = parseFloat(sunHours.replace(',', '.'))
    const pr = parseFloat(performanceRatio.replace(',', '.'))
    const next: Record<string, string> = {}
    if (!Number.isFinite(kwh) || kwh < MONTHLY_KWH_MIN || kwh > MONTHLY_KWH_MAX)
      next.monthlyKwh = t('errorInvalidKwh')
    if (!Number.isFinite(hours) || hours < SUN_HOURS_MIN || hours > SUN_HOURS_MAX)
      next.sunHours = t('errorInvalidSunHours')
    if (!Number.isFinite(pr) || pr < PR_MIN || pr > PR_MAX)
      next.pr = t('errorInvalidPr')
    setCalcErrors(next)
    return Object.keys(next).length === 0
  }, [calcMonthlyKwh, sunHours, performanceRatio, t])

  const handleCalculate = (e: React.FormEvent) => {
    e.preventDefault()
    setCalcResult(null)
    if (!validateCalc()) return
    const kwh = parseFloat(calcMonthlyKwh.replace(',', '.'))
    const hours = parseFloat(sunHours.replace(',', '.'))
    const pr = parseFloat(performanceRatio.replace(',', '.'))
    setCalcResult(gesCalculationRanges(kwh, hours, pr))
    set({ monthlyKwh: String(kwh) })
  }

  const validateForm = (): boolean => {
    const next: Record<string, string> = {}
    if (!form.fullName.trim() || form.fullName.trim().length < 2)
      next.fullName = t('quoteForm.errorFullName')
    if (!isValidTrPhone(form.phone))
      next.phone = form.phone.trim() ? L(PHONE_ERROR_TR, PHONE_ERROR_EN) : t('quoteForm.errorPhone')
    if (!form.city.trim())
      next.city = t('quoteForm.errorCity')
    if (!form.kvkkAccepted)
      next.kvkkAccepted = t('quoteForm.errorKvkk')
    // Aranma onayı isteğe bağlı: seçilmezse dönüş e-postayla yapılır, bu durumda e-posta gerekir
    if (!form.callAccepted && !form.email.trim())
      next.email = L('Aranmak istemiyorsanız size e-postayla dönebilmemiz için e-posta adresinizi yazın.', 'If you prefer not to be called, enter your email so we can reply.')
    setFormErrors(next)
    if (Object.keys(next).length > 0) {
      scrollToFirstError(next)
    }
    return Object.keys(next).length === 0
  }

  const uploadDirRef = useRef<string | null>(null)
  const getUploadDir = () => {
    if (!uploadDirRef.current) {
      uploadDirRef.current = `ges-attachments/${typeof crypto !== 'undefined' && crypto.randomUUID
        ? crypto.randomUUID()
        : `${Date.now()}_${Math.random().toString(36).slice(2, 10)}`}`
    }
    return uploadDirRef.current
  }

  const handleFileUpload = async (field: 'attachmentBillUrl' | 'attachmentRoofUrl', file: File) => {
    const MAX_SIZE_MB = 10
    if (file.size > MAX_SIZE_MB * 1024 * 1024) {
      setFormErrors((p) => ({ ...p, [field]: L(`Dosya en fazla ${MAX_SIZE_MB} MB olabilir.`, `File size can be at most ${MAX_SIZE_MB} MB.`) }))
      return
    }
    setUploading(field)
    setFormErrors((p) => { const n = { ...p }; delete n[field]; return n })
    try {
      const { getStorage } = await import('@/lib/firebase/config')
      const storage = getStorage()
      const { ref, uploadBytes, getDownloadURL } = await import('firebase/storage')
      const safeName = file.name.replace(/[^a-zA-Z0-9._-]/g, '_').slice(0, 80)
      const path = `${getUploadDir()}/${field}_${safeName}`
      const storageRef = ref(storage, path)
      await uploadBytes(storageRef, file, { contentType: file.type || 'application/octet-stream' })
      const url = await getDownloadURL(storageRef)
      set({ [field]: url })
    } catch {
      setFormErrors((p) => ({ ...p, [field]: L('Yükleme başarısız. Lütfen tekrar deneyin.', 'Upload failed. Please try again.') }))
      set({ [field]: `${file.name} (${(file.size / 1024).toFixed(1)} KB)` })
    } finally {
      setUploading(null)
    }
  }

  const handleSubmit = async (e: React.FormEvent, excludeInstallationCost = false) => {
    e.preventDefault()
    if (!validateForm() || submitting) return
    setSubmitting(true)
    setFormErrors({})
    try {
      const body: Record<string, unknown> = {
        fullName: form.fullName.trim(),
        phone: form.phone.trim().replace(/\s/g, ''),
        city: form.city.trim(),
        kvkkAccepted: form.kvkkAccepted,
        callAccepted: form.callAccepted,
        excludeInstallationCost,
        fullQuoteRequested: !excludeInstallationCost,
      }
      if (form.email.trim()) body.email = form.email.trim()
      if (form.district.trim()) body.district = form.district.trim()
      if (form.propertyType) body.propertyType = form.propertyType
      if (form.monthlyBillRange) body.monthlyBillRange = form.monthlyBillRange
      const kwh = parseFloat(form.monthlyKwh.replace(',', '.'))
      if (Number.isFinite(kwh)) body.monthlyKwh = kwh
      if (regionId) body.regionId = regionId
      if (calcResult?.kwp != null) body.suggestedKwp = calcResult.kwp
      if (form.subscriberType) body.subscriberType = form.subscriberType
      if (form.threePhase) body.threePhase = form.threePhase
      if (form.installationAreaType) body.installationAreaType = form.installationAreaType
      if (form.roofType) body.roofType = form.roofType
      if (form.roofAreaRange) body.roofAreaRange = form.roofAreaRange
      if (form.shading) body.shading = form.shading
      if (form.deedStatus) body.deedStatus = form.deedStatus
      if (form.usageGoal.length) body.usageGoal = form.usageGoal.join(',')
      if (form.storagePreference) body.storagePreference = form.storagePreference
      if (form.budgetRange) body.budgetRange = form.budgetRange
      if (form.attachmentBillUrl) body.attachmentBillUrl = form.attachmentBillUrl
      if (form.attachmentRoofUrl) body.attachmentRoofUrl = form.attachmentRoofUrl

      const { collection: col, addDoc, serverTimestamp: srvTs } = await import('firebase/firestore')
      const { getDb } = await import('@/lib/firebase/config')
      const db = getDb()
      await addDoc(col(db, 'gesQuotes'), { ...body, createdAt: srvTs() })

      const notifyRes = await fetch('/api/ges-quote/notify', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(body),
      })
      if (!notifyRes.ok) console.error('GES notify error:', notifyRes.statusText)

      if (typeof window !== 'undefined') {
        try {
          localStorage.setItem(CONTACT_DRAFT_KEY, JSON.stringify({
            fullName: form.fullName.trim(), phone: form.phone.trim(),
            city: form.city.trim(), email: form.email.trim(),
          }))
        } catch { /* ignore */ }
      }
      setSuccess(true)
      window.scrollTo({ top: 0, behavior: 'smooth' })
    } catch {
      setFormErrors({ submit: t('quoteForm.errorSubmit') })
    } finally {
      setSubmitting(false)
    }
  }

  const toggleUsageGoal = (value: string) => {
    setForm((p) => ({
      ...p,
      usageGoal: p.usageGoal.includes(value)
        ? p.usageGoal.filter((v) => v !== value)
        : [...p.usageGoal, value],
    }))
  }

  // ─── RENDER ────────────────────────────────────────────────────────────────

  if (success) {
    return (
      <div className="min-h-screen bg-slate-50 flex flex-col">
        <div className="flex-1 flex items-center justify-center py-20 px-4">
          <Card className="max-w-lg w-full shadow-xl border-0">
            <CardContent className="py-16 text-center px-8">
              <h2 className="text-2xl font-bold text-slate-900 mb-3">{t('quoteForm.successTitle')}</h2>
              <p className="text-slate-600 mb-8 leading-relaxed">{t('quoteForm.successMessage')}</p>
              <div className="flex flex-col sm:flex-row gap-3 justify-center">
                <Button onClick={() => { setSuccess(false); setCalcResult(null); setForm(initialForm) }}
                  size="lg" className="rounded-xl px-8 bg-orange-500 hover:bg-orange-600">
                  {L('Yeni Form Doldur', 'Fill Out a New Form')}
                </Button>
                <Button asChild variant="outline" size="lg" className="rounded-xl px-8">
                  <Link href="/ges/teklif-dogrulama">
                    <FileCheck className="w-4 h-4 mr-2" />
                    {L('Teklif Doğrula', 'Verify a Quote')}
                  </Link>
                </Button>
              </div>
            </CardContent>
          </Card>
        </div>
      </div>
    )
  }

  const howToSchema = {
    '@context': 'https://schema.org',
    '@type': 'HowTo',
    name: 'GES Hesaplama — Güneş Enerji Sistemi Nasıl Hesaplanır?',
    description: 'Aylık elektrik tüketiminize göre ihtiyacınız olan güneş paneli gücünü, inverter kapasitesini ve yatırım geri dönüş süresini ücretsiz olarak hesaplayın.',
    tool: [{ '@type': 'HowToTool', name: 'voltekno GES Hesaplama Aracı' }],
    step: [
      {
        '@type': 'HowToStep',
        position: 1,
        name: 'Aylık elektrik tüketiminizi girin',
        text: 'Son fatura veya sayaç okumalarınızdan aylık ortalama kWh tüketiminizi girin.',
      },
      {
        '@type': 'HowToStep',
        position: 2,
        name: 'Şehir ve güneşlenme bilgisi seçin',
        text: 'Bulunduğunuz şehri seçin. Sistem bölgenizin ortalama güneşlenme saatini otomatik hesaplar.',
      },
      {
        '@type': 'HowToStep',
        position: 3,
        name: 'Sonuçları inceleyin',
        text: 'İhtiyacınız olan panel gücü (kWp), yıllık üretim tahmini ve yaklaşık yatırım geri dönüş süresi otomatik hesaplanır.',
      },
      {
        '@type': 'HowToStep',
        position: 4,
        name: 'Teklif alın',
        text: 'Hesaplama sonuçlarına göre voltekno uzmanlarından ücretsiz GES kurulum teklifi alın.',
      },
    ],
  }

  return (
    <div className="min-h-screen bg-slate-50">
      <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(howToSchema) }} />

      {/* ── HERO ─────────────────────────────────────────────────── */}
      <div
        className="relative overflow-hidden pt-16 pb-28 md:pt-24 md:pb-36"
        style={{
          backgroundImage: 'url("/images/ges/solar-prominent.webp")',
          backgroundSize: 'cover',
          backgroundPosition: 'center',
        }}
      >
        {/* Gradient overlay - lightened for better visibility of the premium image */}
        <div className="absolute inset-0 bg-gradient-to-b from-slate-900/70 via-slate-900/40 to-slate-900/80" />
        {/* Decorative blobs - blue/slate accents */}
        <div className="absolute inset-0 pointer-events-none overflow-hidden">
          <div className="absolute -top-24 -right-24 w-96 h-96 rounded-full bg-brand/10 blur-3xl" />
          <div className="absolute -bottom-12 -left-24 w-80 h-80 rounded-full bg-slate-400/5 blur-3xl" />
          <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[600px] h-[600px] rounded-full bg-white/5 blur-3xl" />
        </div>

        <div className="container mx-auto px-4 relative z-10">

          <div className="max-w-3xl mx-auto text-center">
            <h1 className="text-4xl md:text-5xl font-black text-white tracking-tight mb-4 drop-shadow">
              {L('Güneş Enerjisi Analizi & Ücretsiz Teklif', 'Solar Energy Analysis & Free Quote')}
            </h1>
            <p className="text-lg md:text-xl text-slate-200 max-w-2xl mx-auto leading-relaxed mb-8">
              {L('Aylık tüketiminizle kişisel bilgi vermeden ön tahmin alın; ayrıntılı ücretsiz teklif için formu doldurun.', 'Enter your monthly electricity consumption to size your system and get a free, personalized quote.')}
            </p>

            {/* Stat chips */}
            <div className="flex flex-wrap justify-center gap-3">
              {[
                { icon: ShieldCheck, text: L('Ücretsiz Analiz', 'Free Analysis') },
                { icon: Clock, text: L('2 Dakikada Doldur', 'Takes 2 Minutes') },
                { icon: Star, text: L('24 Saat İçinde Dönüş', 'Response Within 24 Hours') },
              ].map(({ icon: Icon, text }) => (
                <div key={text} className="flex items-center gap-2 bg-white/10 backdrop-blur-sm rounded-full px-4 py-2 ring-1 ring-white/10">
                  <Icon className="w-4 h-4 text-white" />
                  <span className="text-sm font-semibold text-white">{text}</span>
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>

      {/* ── MAIN CARD ─────────────────────── */}
      <div className="container mx-auto px-4 pb-16 pt-12 relative z-10">
        <div className="max-w-3xl mx-auto">
          {/* ── ÖN TAHMİN (madde 16): kişisel bilgi istemeden, tarayıcıda hesaplanır; hiçbir yere gönderilmez ── */}
          <Card className="mb-8 shadow-xl shadow-slate-900/5 border-0 overflow-hidden rounded-2xl">
            <CardContent className="p-6 md:p-8">
              <form onSubmit={handleCalculate} className="space-y-4" noValidate>
                <div>
                  <h2 className="text-lg font-bold text-slate-800 flex items-center gap-2">
                    <Calculator className="w-5 h-5 text-slate-500" aria-hidden />
                    {L('Ön tahmin', 'Quick estimate')}
                  </h2>
                  <p className="text-sm text-slate-500 mt-1">
                    {L('İsim veya telefon gerekmez; tahmin bu sayfada hesaplanır, bilgileriniz gönderilmez.', 'No name or phone needed; the estimate is calculated on this page and nothing is sent.')}
                  </p>
                </div>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <div className="space-y-1.5">
                    <Label htmlFor="estimateKwh" className="text-sm font-medium text-slate-700">{t('monthlyKwh')}</Label>
                    <input
                      id="estimateKwh"
                      type="text"
                      inputMode="decimal"
                      value={calcMonthlyKwh}
                      onChange={(e) => {
                        setCalcMonthlyKwh(e.target.value)
                        set({ monthlyKwh: e.target.value })
                        if (calcErrors.monthlyKwh) setCalcErrors((p) => ({ ...p, monthlyKwh: undefined as any }))
                      }}
                      placeholder={t('monthlyKwhPlaceholder')}
                      className={fieldCls(calcErrors.monthlyKwh)}
                    />
                    {calcErrors.monthlyKwh ? <p className="text-xs text-red-600">{calcErrors.monthlyKwh}</p> : <p className="text-xs text-slate-500">{t('monthlyKwhHint')}</p>}
                  </div>
                  <div className="space-y-1.5">
                    <Label htmlFor="estimateRegion" className="text-sm font-medium text-slate-700">{t('regionLabel')}</Label>
                    <Select value={regionId} onValueChange={(v) => handleRegionChange(v || '')}>
                      <SelectTrigger id="estimateRegion" className={selectCls()}>
                        <SelectValue placeholder={t('regionPlaceholder')} />
                      </SelectTrigger>
                      <SelectContent>
                        {GES_REGIONS.map((r) => (
                          <SelectItem key={r.id} value={r.id}>{t(`region.${r.id}`)}</SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                    <p className="text-xs text-slate-500">{t('regionHint')}</p>
                  </div>
                </div>
                <Button type="submit" variant="outline" className="rounded-xl border-slate-300">{t('calculate')}</Button>
                {calcResult && (
                  <div className="rounded-xl border border-slate-200 bg-slate-50 p-4 space-y-3" aria-live="polite">
                    <dl className="grid grid-cols-1 sm:grid-cols-3 gap-3 text-sm">
                      <div>
                        <dt className="text-slate-500">{t('suggestedKwp')}</dt>
                        <dd className="font-bold text-slate-900">{calcResult.kwpMin.toLocaleString('tr-TR')} – {calcResult.kwpMax.toLocaleString('tr-TR')} kWp</dd>
                      </div>
                      <div>
                        <dt className="text-slate-500">{t('estimatedAnnualProd')}</dt>
                        <dd className="font-bold text-slate-900">{calcResult.annualKwhMin.toLocaleString('tr-TR')} – {calcResult.annualKwhMax.toLocaleString('tr-TR')} kWh</dd>
                      </div>
                      <div>
                        <dt className="text-slate-500">{t('annualSavings')}</dt>
                        <dd className="font-bold text-slate-900">{calcResult.savingsMin.toLocaleString('tr-TR')} – {calcResult.savingsMax.toLocaleString('tr-TR')} TL</dd>
                      </div>
                    </dl>
                    <p className="text-xs text-slate-500">{t('formulaNote')} {L('Kurulum bedeli keşiften sonra teklifte belirlenir.', 'The installation price is set in the quote after a site survey.')}</p>
                    <a href="#teklif-formu" className="inline-block text-sm font-semibold text-brand hover:underline">{L('Bu tahminle ücretsiz teklif isteyin', 'Request a free quote with this estimate')}</a>
                  </div>
                )}
              </form>
            </CardContent>
          </Card>

          <Card className="shadow-2xl shadow-slate-900/5 border-0 overflow-hidden rounded-2xl">
            <CardContent className="p-0">

              {/* ── QUOTE FORM ──────────────────────────────────────── */}
              <form id="teklif-formu" onSubmit={(e) => handleSubmit(e, false)} className="p-6 md:p-8 space-y-8 scroll-mt-24" noValidate>

                {/* Form header */}
                <div className="flex items-center gap-3">
                  <div>
                    <h2 className="text-lg font-bold text-slate-800">{L('Ücretsiz Teklif Al', 'Get a Free Quote')}</h2>
                    <p className="text-sm text-slate-500">
                      {L('', 'Fields marked ')}<span className="text-red-500 font-bold">*</span>{L(' işaretli alanlar zorunludur', ' are required')}
                    </p>
                  </div>
                </div>

                {/* ── SECTION 1: Kişisel Bilgiler ─────────────────── */}
                <div className="space-y-4">
                  <h3 className="text-sm font-bold text-slate-700 uppercase tracking-wide flex items-center gap-2">
                    <span className="flex items-center justify-center w-6 h-6 rounded-full bg-orange-500 text-white text-xs font-bold">1</span>
                    {L('Kişisel Bilgiler', 'Personal Information')}
                  </h3>

                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                    {/* fullName */}
                    <div id="field-fullName" className="space-y-1.5">
                      <Label htmlFor="fullName" className="text-sm font-medium text-slate-700">
                        {t('quoteForm.fullName')} <Req />
                      </Label>
                      <input
                        id="fullName"
                        type="text"
                        value={form.fullName}
                        onChange={(e) => set({ fullName: e.target.value })}
                        placeholder={t('quoteForm.fullNamePlaceholder')}
                        className={fieldCls(formErrors.fullName)}
                        autoComplete="name"
                      />
                      {formErrors.fullName && <p className="text-xs text-red-600">{formErrors.fullName}</p>}
                    </div>

                    {/* phone */}
                    <div id="field-phone" className="space-y-1.5">
                      <Label htmlFor="phone" className="text-sm font-medium text-slate-700">
                        {t('quoteForm.phone')} <Req />
                      </Label>
                      <input
                        id="phone"
                        type="tel"
                        value={form.phone}
                        onChange={(e) => set({ phone: e.target.value })}
                        placeholder={t('quoteForm.phonePlaceholder')}
                        className={fieldCls(formErrors.phone)}
                        autoComplete="tel"
                      />
                      {formErrors.phone && <p className="text-xs text-red-600">{formErrors.phone}</p>}
                    </div>

                    {/* email */}
                    <div className="space-y-1.5">
                      <Label htmlFor="email" className="text-sm font-medium text-slate-700">
                        {t('quoteForm.email')}
                      </Label>
                      <input
                        id="email"
                        type="email"
                        value={form.email}
                        onChange={(e) => set({ email: e.target.value })}
                        placeholder={t('quoteForm.emailPlaceholder')}
                        className={fieldCls(formErrors.email)}
                        autoComplete="email"
                      />
                      {formErrors.email && <p className="text-xs text-red-600">{formErrors.email}</p>}
                    </div>

                    {/* city */}
                    <div id="field-city" className="space-y-1.5">
                      <Label htmlFor="city" className="text-sm font-medium text-slate-700">
                        {t('quoteForm.city')} <Req />
                      </Label>
                      <Select value={form.city} onValueChange={(v) => set({ city: v || '', district: '' })}>
                        <SelectTrigger id="city" className={selectCls(formErrors.city)}>
                          <SelectValue placeholder={t('quoteForm.cityPlaceholder')} />
                        </SelectTrigger>
                        <SelectContent>
                          {TR_CITIES.map((c) => (
                            <SelectItem key={c.name} value={c.name}>{c.name}</SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                      {formErrors.city && <p className="text-xs text-red-600">{formErrors.city}</p>}
                    </div>

                    {/* district */}
                    {districts.length > 0 && (
                      <div className="space-y-1.5">
                        <Label htmlFor="district" className="text-sm font-medium text-slate-700">
                          {t('quoteForm.district')}
                        </Label>
                        <Select value={form.district} onValueChange={(v) => set({ district: v || '' })}>
                          <SelectTrigger id="district" className={selectCls()}>
                            <SelectValue placeholder={t('quoteForm.districtPlaceholder')} />
                          </SelectTrigger>
                          <SelectContent>
                            {districts.map((d) => (
                              <SelectItem key={d} value={d}>{d}</SelectItem>
                            ))}
                          </SelectContent>
                        </Select>
                      </div>
                    )}
                  </div>
                </div>

                {/* ── SECTION 2: Elektrik Tüketiminiz ─────────────── */}
                <div className="space-y-4">
                  <h3 className="text-sm font-bold text-slate-700 uppercase tracking-wide flex items-center gap-2">
                    <span className="flex items-center justify-center w-6 h-6 rounded-full bg-orange-500 text-white text-xs font-bold">2</span>
                    {t('quoteForm.sectionElectricity')}
                  </h3>

                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                    {/* monthlyKwh — linked to calculator */}
                    <div className="space-y-1.5">
                      <Label htmlFor="monthlyKwhForm" className="text-sm font-medium text-slate-700">
                        {t('quoteForm.monthlyKwhFree')}
                        {calcResult && (
                          <span className="ml-2 text-xs text-green-600 font-normal">{L('(hesaplamadan alındı)', '(from calculation)')}</span>
                        )}
                      </Label>
                      <input
                        id="monthlyKwhForm"
                        type="text"
                        inputMode="decimal"
                        value={calcMonthlyKwh}
                        onChange={(e) => {
                          setCalcMonthlyKwh(e.target.value)
                          set({ monthlyKwh: e.target.value })
                          if (calcErrors.monthlyKwh) setCalcErrors((p) => ({ ...p, monthlyKwh: undefined as any }))
                        }}
                        placeholder={L('Örn. 350', 'e.g. 350')}
                        className={fieldCls()}
                      />
                    </div>

                    {/* monthlyBillRange */}
                    <div className="space-y-1.5">
                      <Label htmlFor="monthlyBillRange" className="text-sm font-medium text-slate-700">
                        {t('quoteForm.monthlyBillRange')}
                      </Label>
                      <Select value={form.monthlyBillRange} onValueChange={(v) => set({ monthlyBillRange: v || '' })}>
                        <SelectTrigger id="monthlyBillRange" className={selectCls()}>
                          <SelectValue placeholder={L('Aylık fatura aralığı', 'Monthly bill range')} />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="0_1000">{t('quoteForm.monthlyBill0_1000')}</SelectItem>
                          <SelectItem value="1000_3000">{t('quoteForm.monthlyBill1000_3000')}</SelectItem>
                          <SelectItem value="3000_10000">{t('quoteForm.monthlyBill3000_10000')}</SelectItem>
                          <SelectItem value="10000_25000">{t('quoteForm.monthlyBill10000_25000')}</SelectItem>
                          <SelectItem value="25k_plus">{t('quoteForm.monthlyBill25kPlus')}</SelectItem>
                        </SelectContent>
                      </Select>
                    </div>

                    {/* propertyType */}
                    <div className="space-y-1.5">
                      <Label htmlFor="propertyType" className="text-sm font-medium text-slate-700">
                        {t('quoteForm.propertyType')}
                      </Label>
                      <Select value={form.propertyType} onValueChange={(v) => set({ propertyType: v || '' })}>
                        <SelectTrigger id="propertyType" className={selectCls()}>
                          <SelectValue placeholder={L('Tesis türü', 'Property type')} />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="mustakil_ev">{t('quoteForm.propertyTypeMustakil')}</SelectItem>
                          <SelectItem value="site_villa">{t('quoteForm.propertyTypeSite')}</SelectItem>
                          <SelectItem value="apartman_cati">{t('quoteForm.propertyTypeApartman')}</SelectItem>
                          <SelectItem value="dukkan">{t('quoteForm.propertyTypeDukkan')}</SelectItem>
                          <SelectItem value="atolye">{t('quoteForm.propertyTypeAtolye')}</SelectItem>
                          <SelectItem value="fabrika">{t('quoteForm.propertyTypeFabrika')}</SelectItem>
                          <SelectItem value="tarimsal">{t('quoteForm.propertyTypeTarim')}</SelectItem>
                          <SelectItem value="depo">{t('quoteForm.propertyTypeDepo')}</SelectItem>
                          <SelectItem value="diger">{t('quoteForm.propertyTypeDiger')}</SelectItem>
                        </SelectContent>
                      </Select>
                    </div>

                    {/* budgetRange */}
                    <div className="space-y-1.5">
                      <Label htmlFor="budgetRange" className="text-sm font-medium text-slate-700">
                        {t('quoteForm.budgetRange')}
                      </Label>
                      <Select value={form.budgetRange} onValueChange={(v) => set({ budgetRange: v || '' })}>
                        <SelectTrigger id="budgetRange" className={selectCls()}>
                          <SelectValue placeholder={L('Bütçe aralığı', 'Budget range')} />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="100k_alti">{t('quoteForm.budget100kAlt')}</SelectItem>
                          <SelectItem value="100_300k">{t('quoteForm.budget100_300k')}</SelectItem>
                          <SelectItem value="300_1000k">{t('quoteForm.budget300_1000k')}</SelectItem>
                          <SelectItem value="1m_ustu">{t('quoteForm.budget1mPlus')}</SelectItem>
                          <SelectItem value="teklif_istiyorum">{t('quoteForm.budgetTeklif')}</SelectItem>
                        </SelectContent>
                      </Select>
                    </div>
                  </div>
                </div>

                {/* ── SECTION 3: Ek Bilgiler (collapsible) ─────────── */}
                <details className="group rounded-xl border border-slate-200 bg-slate-50/50 overflow-hidden">
                  <summary className="flex items-center justify-between gap-3 px-5 py-4 cursor-pointer list-none hover:bg-slate-50 transition-colors [&::-webkit-details-marker]:hidden">
                    <div className="flex items-center gap-3">
                      <span className="flex items-center justify-center w-6 h-6 rounded-full bg-slate-400 text-white text-xs font-bold">3</span>
                      <div>
                        <span className="font-semibold text-slate-700 text-sm">{L('Ek Detaylar', 'Additional Details')}</span>
                        <span className="text-xs text-slate-400 ml-1.5">{L('(isteğe bağlı — daha doğru teklif için)', '(optional — for a more accurate quote)')}</span>
                      </div>
                    </div>
                    <ChevronDown className="w-4 h-4 text-slate-400 transition-transform group-open:rotate-180 shrink-0" />
                  </summary>

                  <div className="p-5 pt-3 space-y-6 border-t border-slate-200">

                    {/* Abone & şebeke */}
                    <div className="space-y-3">
                      <p className="text-xs font-semibold text-slate-500 uppercase tracking-wide">{L('Abonelik ve Şebeke', 'Subscription & Grid')}</p>
                      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                        <div className="space-y-1.5">
                          <Label htmlFor="subscriberType" className="text-sm font-medium text-slate-700">{t('quoteForm.subscriberType')}</Label>
                          <Select value={form.subscriberType} onValueChange={(v) => set({ subscriberType: v || '' })}>
                            <SelectTrigger id="subscriberType" className={selectCls()}>
                              <SelectValue placeholder={L('Abone türü', 'Subscriber type')} />
                            </SelectTrigger>
                            <SelectContent>
                              <SelectItem value="mesken">{t('quoteForm.subscriberMesken')}</SelectItem>
                              <SelectItem value="ticarethane">{t('quoteForm.subscriberTicaret')}</SelectItem>
                              <SelectItem value="sanayi">{t('quoteForm.subscriberSanayi')}</SelectItem>
                              <SelectItem value="tarimsal_sulama">{t('quoteForm.subscriberTarim')}</SelectItem>
                            </SelectContent>
                          </Select>
                        </div>
                        <div className="space-y-1.5">
                          <Label htmlFor="threePhase" className="text-sm font-medium text-slate-700">{t('quoteForm.threePhase')}</Label>
                          <Select value={form.threePhase} onValueChange={(v) => set({ threePhase: v || '' })}>
                            <SelectTrigger id="threePhase" className={selectCls()}>
                              <SelectValue placeholder={L('Seçin', 'Select')} />
                            </SelectTrigger>
                            <SelectContent>
                              <SelectItem value="evet">{t('quoteForm.threePhaseYes')}</SelectItem>
                              <SelectItem value="hayir">{t('quoteForm.threePhaseNo')}</SelectItem>
                              <SelectItem value="bilmiyorum">{t('quoteForm.threePhaseUnknown')}</SelectItem>
                            </SelectContent>
                          </Select>
                        </div>
                      </div>
                    </div>

                    {/* Kurulum alanı */}
                    <div className="space-y-3">
                      <p className="text-xs font-semibold text-slate-500 uppercase tracking-wide">{t('quoteForm.sectionArea')}</p>
                      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                        <div className="space-y-1.5">
                          <Label htmlFor="installationAreaType" className="text-sm font-medium text-slate-700">{t('quoteForm.installationAreaType')}</Label>
                          <Select value={form.installationAreaType} onValueChange={(v) => set({ installationAreaType: v || '' })}>
                            <SelectTrigger id="installationAreaType" className={selectCls()}>
                              <SelectValue placeholder={L('Alan türü', 'Area type')} />
                            </SelectTrigger>
                            <SelectContent>
                              <SelectItem value="cati">{t('quoteForm.areaCati')}</SelectItem>
                              <SelectItem value="arazi">{t('quoteForm.areaArazi')}</SelectItem>
                              <SelectItem value="carport">{t('quoteForm.areaCarport')}</SelectItem>
                              <SelectItem value="cephe">{t('quoteForm.areaCephe')}</SelectItem>
                              <SelectItem value="bilmiyorum">{t('quoteForm.areaUnknown')}</SelectItem>
                            </SelectContent>
                          </Select>
                        </div>
                        <div className="space-y-1.5">
                          <Label htmlFor="roofType" className="text-sm font-medium text-slate-700">{t('quoteForm.roofType')}</Label>
                          <Select value={form.roofType} onValueChange={(v) => set({ roofType: v || '' })}>
                            <SelectTrigger id="roofType" className={selectCls()}>
                              <SelectValue placeholder={L('Çatı türü', 'Roof type')} />
                            </SelectTrigger>
                            <SelectContent>
                              <SelectItem value="betonarme_duz">{t('quoteForm.roofBetonarme')}</SelectItem>
                              <SelectItem value="kiremit">{t('quoteForm.roofKiremit')}</SelectItem>
                              <SelectItem value="sandvic">{t('quoteForm.roofSandvic')}</SelectItem>
                              <SelectItem value="trapez">{t('quoteForm.roofTrapez')}</SelectItem>
                              <SelectItem value="bilmiyorum">{t('quoteForm.roofUnknown')}</SelectItem>
                            </SelectContent>
                          </Select>
                        </div>
                        <div className="space-y-1.5">
                          <Label htmlFor="roofAreaRange" className="text-sm font-medium text-slate-700">{t('quoteForm.roofAreaRange')}</Label>
                          <Select value={form.roofAreaRange} onValueChange={(v) => set({ roofAreaRange: v || '' })}>
                            <SelectTrigger id="roofAreaRange" className={selectCls()}>
                              <SelectValue placeholder={L('Çatı alanı', 'Roof area')} />
                            </SelectTrigger>
                            <SelectContent>
                              <SelectItem value="0_50">{t('quoteForm.roofArea0_50')}</SelectItem>
                              <SelectItem value="50_100">{t('quoteForm.roofArea50_100')}</SelectItem>
                              <SelectItem value="100_250">{t('quoteForm.roofArea100_250')}</SelectItem>
                              <SelectItem value="250_plus">{t('quoteForm.roofArea250Plus')}</SelectItem>
                            </SelectContent>
                          </Select>
                        </div>
                        <div className="space-y-1.5">
                          <Label htmlFor="shading" className="text-sm font-medium text-slate-700">{t('quoteForm.shading')}</Label>
                          <Select value={form.shading} onValueChange={(v) => set({ shading: v || '' })}>
                            <SelectTrigger id="shading" className={selectCls()}>
                              <SelectValue placeholder={L('Gölgelenme durumu', 'Shading')} />
                            </SelectTrigger>
                            <SelectContent>
                              <SelectItem value="hayir">{t('quoteForm.shadingNo')}</SelectItem>
                              <SelectItem value="baca">{t('quoteForm.shadingBaca')}</SelectItem>
                              <SelectItem value="agac">{t('quoteForm.shadingAgac')}</SelectItem>
                              <SelectItem value="komsu">{t('quoteForm.shadingKomsu')}</SelectItem>
                              <SelectItem value="emin_degilim">{t('quoteForm.shadingUnsure')}</SelectItem>
                            </SelectContent>
                          </Select>
                        </div>
                        <div className="space-y-1.5">
                          <Label htmlFor="deedStatus" className="text-sm font-medium text-slate-700">{t('quoteForm.deedStatus')}</Label>
                          <Select value={form.deedStatus} onValueChange={(v) => set({ deedStatus: v || '' })}>
                            <SelectTrigger id="deedStatus" className={selectCls()}>
                              <SelectValue placeholder={L('Mülkiyet', 'Ownership')} />
                            </SelectTrigger>
                            <SelectContent>
                              <SelectItem value="kendi">{t('quoteForm.deedOwn')}</SelectItem>
                              <SelectItem value="kiracı">{t('quoteForm.deedRenter')}</SelectItem>
                              <SelectItem value="ortak">{t('quoteForm.deedShared')}</SelectItem>
                            </SelectContent>
                          </Select>
                        </div>
                        <div className="space-y-1.5">
                          <Label htmlFor="storagePreference" className="text-sm font-medium text-slate-700">{t('quoteForm.storagePreference')}</Label>
                          <Select value={form.storagePreference} onValueChange={(v) => set({ storagePreference: v || '' })}>
                            <SelectTrigger id="storagePreference" className={selectCls()}>
                              <SelectValue placeholder={L('Depolama tercihi', 'Storage preference')} />
                            </SelectTrigger>
                            <SelectContent>
                              <SelectItem value="hayir">{t('quoteForm.storageNo')}</SelectItem>
                              <SelectItem value="evet_kesinti">{t('quoteForm.storageKesinti')}</SelectItem>
                              <SelectItem value="evet_enerji_satis">{t('quoteForm.storageEnerji')}</SelectItem>
                              <SelectItem value="kararsiz">{t('quoteForm.storageUnsure')}</SelectItem>
                            </SelectContent>
                          </Select>
                        </div>
                      </div>
                    </div>

                    {/* Kullanım amacı */}
                    <div className="space-y-3">
                      <p className="text-xs font-semibold text-slate-500 uppercase tracking-wide">{t('quoteForm.usageGoal')}</p>
                      <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                        {[
                          { v: 'fatura_sifir', key: 'usageFatura' },
                          { v: 'satis', key: 'usageSatis' },
                          { v: 'kismi_tasarruf', key: 'usageKismi' },
                          { v: 'yedekleme', key: 'usageYedek' },
                          { v: 'offgrid', key: 'usageOffgrid' },
                        ].map(({ v, key }) => (
                          <label key={v} className="flex items-center gap-3 cursor-pointer p-3 rounded-lg border border-slate-200 bg-white hover:border-orange-300 hover:bg-orange-50/50 transition-colors">
                            <input
                              type="checkbox"
                              checked={form.usageGoal.includes(v)}
                              onChange={() => toggleUsageGoal(v)}
                              className="h-4 w-4 rounded border-slate-300 text-brand focus:ring-brand"
                            />
                            <span className="text-sm font-medium text-slate-700">{t(`quoteForm.${key}`)}</span>
                          </label>
                        ))}
                      </div>
                    </div>

                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                      {([
                        { key: 'attachmentBillUrl' as const, label: t('quoteForm.fileBill') },
                        { key: 'attachmentRoofUrl' as const, label: t('quoteForm.fileRoof') },
                      ]).map(({ key, label }) => (
                        <div key={key} className="space-y-1.5">
                          <Label className="text-sm font-medium text-slate-700">{label}</Label>
                          <div className="relative">
                            <input
                              type="file"
                              accept=".pdf,.jpg,.jpeg,.png,.webp,application/pdf,image/*"
                              disabled={!!uploading}
                              onChange={(e) => {
                                const file = e.target.files?.[0]
                                if (file) handleFileUpload(key, file)
                                e.target.value = ''
                              }}
                              className="flex h-12 w-full rounded-xl border border-slate-200 bg-white px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-brand/20 file:rounded-lg file:border-0 file:bg-orange-50 file:px-3 file:py-1.5 file:text-xs file:font-medium file:text-orange-700 disabled:opacity-50"
                            />
                            {uploading === key && (
                              <Loader2 className="absolute right-3 top-1/2 -translate-y-1/2 w-4 h-4 animate-spin text-brand" />
                            )}
                            {form[key] && !uploading && (
                              <CheckCircle className="absolute right-3 top-1/2 -translate-y-1/2 w-4 h-4 text-green-500" />
                            )}
                          </div>
                          {formErrors[key] && <p className="text-xs text-red-600">{formErrors[key]}</p>}
                        </div>
                      ))}
                    </div>
                  </div>
                </details>

                {/* ── KVKK & ONAYLAR ──────────────────────────────────── */}
                <div id="field-kvkkAccepted" className="rounded-xl border border-slate-200 bg-slate-50/50 p-4 space-y-3">
                  {/* KVKK */}
                  <label className={`flex items-start gap-3 cursor-pointer p-3 rounded-lg hover:bg-white transition-colors ${formErrors.kvkkAccepted ? 'bg-red-50/50 border border-red-200 rounded-lg' : ''}`}>
                    <input
                      type="checkbox"
                      checked={form.kvkkAccepted}
                      onChange={(e) => set({ kvkkAccepted: e.target.checked })}
                      className="mt-0.5 h-4 w-4 rounded border-slate-300 text-brand focus:ring-brand shrink-0"
                    />
                    <span className="text-sm text-slate-700">
                      <button
                        type="button"
                        onClick={(e) => { e.preventDefault(); e.stopPropagation(); setKvkkDialogOpen(true) }}
                        className="underline font-semibold text-brand hover:text-orange-600 focus:outline-none"
                      >
                        {t('quoteForm.kvkkLinkText')}
                      </button>
                      {' '}{t('quoteForm.kvkkLabelSuffix')}
                    </span>
                  </label>
                  {formErrors.kvkkAccepted && (
                    <p className="text-xs text-red-600 ml-7">{formErrors.kvkkAccepted}</p>
                  )}

                  {/* callAccepted */}
                  <div id="field-callAccepted">
                    <label className={`flex items-start gap-3 cursor-pointer p-3 rounded-lg hover:bg-white transition-colors ${formErrors.callAccepted ? 'bg-red-50/50 border border-red-200 rounded-lg' : ''}`}>
                      <input
                        type="checkbox"
                        checked={form.callAccepted}
                        onChange={(e) => set({ callAccepted: e.target.checked })}
                        className="mt-0.5 h-4 w-4 rounded border-slate-300 text-brand focus:ring-brand shrink-0"
                      />
                      <span className="text-sm text-slate-700">
                        {t('quoteForm.callLabel')}
                        <span className="block text-xs text-slate-500 mt-0.5">{L('İsteğe bağlı. Seçmezseniz teklifinizi e-postayla göndeririz.', 'Optional. If unchecked, we will send your quote by email.')}</span>
                      </span>
                    </label>
                    {formErrors.callAccepted && (
                      <p className="text-xs text-red-600 ml-7">{formErrors.callAccepted}</p>
                    )}
                  </div>
                </div>

                {/* ── SUBMIT ─────────────────────────────────────────── */}
                <div className="space-y-3">
                  {formErrors.submit && (
                    <p className="p-3 bg-red-50 border border-red-200 text-red-700 text-sm rounded-xl">
                      {formErrors.submit}
                    </p>
                  )}

                  <Button
                    type="submit"
                    size="lg"
                    disabled={submitting}
                    className="w-full h-14 text-base font-bold rounded-xl bg-orange-500 hover:bg-orange-600 gap-2 shadow-lg shadow-orange-500/25"
                  >
                    {submitting && <Loader2 className="w-5 h-5 animate-spin" />}
                    {t('quoteForm.submit')}
                  </Button>

                </div>

                {/* Footer link */}
                <div className="pt-4 border-t border-slate-100 text-center">
                  <Link
                    href="/ges/teklif-dogrulama"
                    className="inline-flex items-center gap-2 text-sm text-slate-500 hover:text-brand transition-colors"
                  >
                    <FileCheck className="w-4 h-4" />
                    {L('Başka bir firmadan aldığınız teklifi doğrulatmak ister misiniz?', 'Would you like to have a quote from another company verified?')}
                  </Link>
                </div>

              </form>
            </CardContent>
          </Card>
        </div>
      </div>

      {/* KVKK Dialog */}
      <Dialog open={kvkkDialogOpen} onOpenChange={setKvkkDialogOpen}>
        <DialogContent className="max-w-2xl max-h-[85vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle className="text-xl text-slate-900 pr-8">{L('KVKK Aydınlatma Metni', 'Personal Data Protection (KVKK) Notice')}</DialogTitle>
          </DialogHeader>
          <div className="text-sm text-slate-700 space-y-4 pr-2 leading-relaxed">
            <p><strong>{L('1. Veri Sorumlusu', '1. Data Controller')}</strong></p>
            <p>{L('6698 sayılı Kişisel Verilerin Korunması Kanunu ("KVKK") uyarınca, kişisel verileriniz; veri sorumlusu olarak voltekno tarafından aşağıda açıklanan kapsamda işlenebilecektir.', 'Under the Turkish Personal Data Protection Law No. 6698 ("KVKK"), your personal data may be processed by voltekno, as the data controller, within the scope described below.')}</p>
            <p><strong>{L('2. İşlenen Kişisel Veriler ve Amaçları', '2. Personal Data Processed and Purposes')}</strong></p>
            <p>{L('GES teklif formu aracılığıyla toplanan ad soyad, telefon numarası, e-posta adresi, şehir/ilçe, mülk türü, tahmini bütçe, elektrik tüketim bilgileri ve kurulum alanına ilişkin bilgileriniz; teklif talebinizin değerlendirilmesi, sizinle iletişime geçilmesi, teknik keşif ve fiyat teklifi sunulması amacıyla işlenmektedir.', 'Your full name, phone number, email address, city/district, property type, estimated budget, electricity consumption details and installation area information collected through the solar quote form are processed to evaluate your quote request, contact you, carry out a technical survey and provide a price quote.')}</p>
            <p><strong>{L('3. Hukuki Sebep', '3. Legal Basis')}</strong></p>
            <p>{L(`Bu verilerin işlenmesi, KVKK'nın 5. ve 6. maddelerine dayanmaktadır; özellikle açık rızanız, teklif ve sözleşme süreçlerinin yürütülmesi ile meşru menfaatlerimiz çerçevesinde gerçekleştirilmektedir.`, 'Processing of this data is based on Articles 5 and 6 of the KVKK; in particular, it is carried out on the basis of your explicit consent, the execution of quote and contract processes, and our legitimate interests.')}</p>
            <p><strong>{L('4. Verilerin Aktarımı', '4. Data Transfers')}</strong></p>
            <p>{L('Toplanan verileriniz, yalnızca hukuki zorunluluk veya hizmet sağlayıcılarımız ile sınırlı ve gerekli ölçüde paylaşılabilir.', 'Your collected data may only be shared where legally required or with our service providers, to a limited and necessary extent.')}</p>
            <p><strong>{L('5. Saklama Süresi', '5. Retention Period')}</strong></p>
            <p>{L('Kişisel verileriniz, teklif ve iletişim süreçlerinin gerektirdiği süre boyunca ve yasal saklama süreleriyle sınırlı olarak saklanacak; bu süreler sonunda silinecek veya anonim hale getirilecektir.', 'Your personal data will be retained for as long as the quote and communication processes require and within statutory retention periods; at the end of these periods it will be deleted or anonymized.')}</p>
            <p><strong>{L('6. Haklarınız (KVKK Md. 11)', '6. Your Rights (KVKK Art. 11)')}</strong></p>
            <p>{L('Kişisel verilerinizin işlenip işlenmediğini öğrenme, işlenmişse bilgi talep etme, düzeltilmesini veya silinmesini isteme ve ilgili diğer haklarınızı kullanmak için veri sorumlusuna başvurabilirsiniz.', 'You may apply to the data controller to learn whether your personal data is processed, request information if it has been, request its correction or deletion, and exercise your other related rights.')}</p>
          </div>
        </DialogContent>
      </Dialog>

    </div>
  )
}
