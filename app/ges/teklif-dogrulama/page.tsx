'use client'

import React, { useState } from 'react'
import Link from 'next/link'
import { useTranslations } from 'next-intl'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Card, CardContent } from '@/components/ui/card'
import {
  Select, SelectContent, SelectItem, SelectTrigger, SelectValue,
} from '@/components/ui/select'
import {
  FileCheck, Loader2, CheckCircle, AlertTriangle, Phone,
  ChevronRight, ChevronDown, ShieldCheck, Clock, Star,
  Search, Info,
} from 'lucide-react'

const CONTACT_PHONE = '+90 551 829 16 13'
const CONTACT_PHONE_HREF = 'tel:+905518291613'

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

function scrollToFirstError(errors: Record<string, string>) {
  const firstKey = Object.keys(errors)[0]
  if (!firstKey) return
  const el = document.getElementById(`field-${firstKey}`) || document.getElementById(firstKey)
  if (el) {
    el.scrollIntoView({ behavior: 'smooth', block: 'center' })
    const focusable = el.querySelector<HTMLElement>('input,select,textarea,button')
    if (focusable) setTimeout(() => focusable.focus({ preventScroll: true }), 400)
  }
}

type FormState = {
  companyName: string
  quoteDate: string
  totalPriceTry: string
  turnkey: string
  panelBrandModel: string
  panelWatt: string
  panelCount: string
  totalKwp: string
  panelTechnology: string
  panelEfficiencyPct: string
  warrantyProductYears: string
  warrantyPerformanceYears: string
  warrantyPerformance25Pct: string
  inverterBrandModel: string
  inverterTotalKw: string
  inverterType: string
  mpptCount: string
  storageCompatible: string
  batteryBrandModel: string
  batteryKwh: string
  batteryChemistry: string
  mountingType: string
  staticProjectProvided: string
  annualProductionKwh: string
  paybackYearsQuoted: string
  contactName: string
  contactEmail: string
  contactPhone: string
}

const initialForm: FormState = {
  companyName: '', quoteDate: '', totalPriceTry: '', turnkey: '',
  panelBrandModel: '', panelWatt: '', panelCount: '', totalKwp: '',
  panelTechnology: '', panelEfficiencyPct: '',
  warrantyProductYears: '', warrantyPerformanceYears: '', warrantyPerformance25Pct: '',
  inverterBrandModel: '', inverterTotalKw: '', inverterType: '', mpptCount: '',
  storageCompatible: '', batteryBrandModel: '', batteryKwh: '', batteryChemistry: '',
  mountingType: '', staticProjectProvided: '',
  annualProductionKwh: '', paybackYearsQuoted: '',
  contactName: '', contactEmail: '', contactPhone: '',
}

export default function GesTeklifDogrulamaPage() {
  const t = useTranslations('ges')
  const [form, setForm] = useState<FormState>(initialForm)
  const [errors, setErrors] = useState<Record<string, string>>({})
  const [submitting, setSubmitting] = useState(false)
  const [success, setSuccess] = useState(false)
  const [redFlags, setRedFlags] = useState<string[]>([])

  const set = (updates: Partial<FormState>) => {
    setForm((p) => ({ ...p, ...updates }))
    setErrors((p) => {
      const next = { ...p }
      Object.keys(updates).forEach((k) => delete next[k])
      return next
    })
  }

  const num = (s: string) => { const n = parseFloat(s.replace(',', '.')); return Number.isFinite(n) ? n : undefined }
  const int = (s: string) => { const n = parseInt(s, 10); return Number.isFinite(n) ? n : undefined }

  const validate = (): boolean => {
    const next: Record<string, string> = {}
    if (!form.quoteDate)
      next.quoteDate = 'Teklif tarihi zorunludur.'
    if (!form.totalPriceTry || (num(form.totalPriceTry) ?? 0) <= 0)
      next.totalPriceTry = 'Toplam fiyat (TL) zorunludur ve 0\'dan büyük olmalıdır.'
    if (!form.totalKwp || (num(form.totalKwp) ?? 0) <= 0)
      next.totalKwp = 'Toplam sistem gücü (kWp) zorunludur.'
    if (!form.panelBrandModel.trim() || form.panelBrandModel.trim().length < 2)
      next.panelBrandModel = 'Panel marka/model bilgisi zorunludur.'
    if (!form.panelCount || (int(form.panelCount) ?? 0) <= 0)
      next.panelCount = 'Panel adedi zorunludur.'
    if (!form.inverterBrandModel.trim() || form.inverterBrandModel.trim().length < 2)
      next.inverterBrandModel = 'İnverter marka/model bilgisi zorunludur.'
    if (!form.contactName.trim() || form.contactName.trim().length < 2)
      next.contactName = 'Ad soyad zorunludur.'
    if (!form.contactEmail.trim() || !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(form.contactEmail.trim()))
      next.contactEmail = 'Geçerli bir e-posta adresi zorunludur.'
    if (!form.contactPhone.trim() || form.contactPhone.replace(/[\s\-().+]/g, '').length < 10)
      next.contactPhone = 'Geçerli bir telefon numarası giriniz.'
    setErrors(next)
    if (Object.keys(next).length > 0) scrollToFirstError(next)
    return Object.keys(next).length === 0
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!validate() || submitting) return
    setSubmitting(true)
    setErrors({})
    setRedFlags([])
    try {
      const body: Record<string, unknown> = {
        companyName: form.companyName.trim(),
      }
      if (form.quoteDate) body.quoteDate = form.quoteDate
      const price = num(form.totalPriceTry)
      if (price != null) body.totalPriceTry = price
      if (form.turnkey) body.turnkey = form.turnkey
      if (form.panelBrandModel) body.panelBrandModel = form.panelBrandModel
      const panelWatt = int(form.panelWatt)
      if (panelWatt != null) body.panelWatt = panelWatt
      const panelCount = int(form.panelCount)
      if (panelCount != null) body.panelCount = panelCount
      const totalKwp = num(form.totalKwp)
      if (totalKwp != null) body.totalKwp = totalKwp
      if (form.panelTechnology) body.panelTechnology = form.panelTechnology
      const eff = num(form.panelEfficiencyPct)
      if (eff != null) body.panelEfficiencyPct = eff
      const wp = int(form.warrantyProductYears)
      if (wp != null) body.warrantyProductYears = wp
      const wperf = int(form.warrantyPerformanceYears)
      if (wperf != null) body.warrantyPerformanceYears = wperf
      const w25 = num(form.warrantyPerformance25Pct)
      if (w25 != null) body.warrantyPerformance25Pct = w25
      if (form.inverterBrandModel) body.inverterBrandModel = form.inverterBrandModel
      const invKw = num(form.inverterTotalKw)
      if (invKw != null) body.inverterTotalKw = invKw
      if (form.inverterType) body.inverterType = form.inverterType
      const mppt = int(form.mpptCount)
      if (mppt != null) body.mpptCount = mppt
      if (form.storageCompatible) body.storageCompatible = form.storageCompatible
      if (form.batteryBrandModel) body.batteryBrandModel = form.batteryBrandModel
      const batKwh = num(form.batteryKwh)
      if (batKwh != null) body.batteryKwh = batKwh
      if (form.batteryChemistry) body.batteryChemistry = form.batteryChemistry
      if (form.mountingType) body.mountingType = form.mountingType
      if (form.staticProjectProvided) body.staticProjectProvided = form.staticProjectProvided
      const ann = num(form.annualProductionKwh)
      if (ann != null) body.annualProductionKwh = ann
      const payback = num(form.paybackYearsQuoted)
      if (payback != null) body.paybackYearsQuoted = payback
      if (form.contactName) body.contactName = form.contactName
      if (form.contactEmail) body.contactEmail = form.contactEmail
      if (form.contactPhone) body.contactPhone = form.contactPhone

      // Client-side red flag analizi
      const flags: string[] = []
      const kwp = num(form.totalKwp)
      const priceTry = num(form.totalPriceTry)
      const panelCountVal = int(form.panelCount)
      const panelWattVal = int(form.panelWatt)
      const annualProd = num(form.annualProductionKwh)
      const paybackYears = num(form.paybackYearsQuoted)

      if (kwp && priceTry) {
        const pricePerKwp = priceTry / kwp
        if (pricePerKwp < 8000) flags.push('kWp başına fiyat çok düşük — ekipman kalitesini sorgulayın.')
        if (pricePerKwp > 25000) flags.push('kWp başına fiyat ortalamanın üzerinde.')
      }
      if (panelCountVal && panelWattVal && kwp) {
        const calcKwp = (panelCountVal * panelWattVal) / 1000
        if (Math.abs(calcKwp - kwp) > 0.5)
          flags.push(`Panel adedi × Watt (${calcKwp.toFixed(1)} kWp) ile belirtilen toplam kWp (${kwp}) uyuşmuyor.`)
      }
      if (paybackYears && paybackYears < 3) flags.push('Amortisman süresi gerçekçi olmayabilir (3 yıldan kısa).')
      if (paybackYears && paybackYears > 12) flags.push('Amortisman süresi uzun — teklifin ekonomik fizibilitesini değerlendirin.')
      if (annualProd && kwp) {
        const cf = annualProd / (kwp * 8760)
        if (cf > 0.22) flags.push('Yıllık üretim tahmini iyimser olabilir.')
        if (cf < 0.10) flags.push('Yıllık üretim tahmini düşük — panel yönelimi/gölgelenme kontrol edin.')
      }

      const { collection: col, addDoc, serverTimestamp: srvTs } = await import('firebase/firestore')
      const { getDb } = await import('@/lib/firebase/config')
      const db = getDb()
      await addDoc(col(db, 'gesVerifications'), { ...body, redFlags: flags, createdAt: srvTs() })

      setRedFlags(flags)
      setSuccess(true)
      window.scrollTo({ top: 0, behavior: 'smooth' })
    } catch {
      setErrors({ submit: 'Gönderilirken bir hata oluştu. Lütfen tekrar deneyin.' })
    } finally {
      setSubmitting(false)
    }
  }

  // ─── SUCCESS ────────────────────────────────────────────────────────────────

  if (success) {
    return (
      <div className="min-h-screen bg-slate-50 flex flex-col">
        <div className="flex-1 container mx-auto max-w-lg px-4 py-16 space-y-6">
          <div className="text-center">
            <div className="inline-flex items-center justify-center w-20 h-20 rounded-full bg-emerald-100 text-emerald-600 mb-5 shadow-inner">
              <CheckCircle className="w-10 h-10" />
            </div>
            <h2 className="text-2xl font-bold text-slate-900 mb-2">{t('quoteVerify.successTitle')}</h2>
            <p className="text-slate-600 leading-relaxed">{t('quoteVerify.successMessageNew')}</p>
          </div>

          {redFlags.length > 0 && (
            <Card className="border-amber-200 bg-amber-50/60 shadow-sm rounded-xl overflow-hidden">
              <CardContent className="p-5">
                <div className="flex items-center gap-2 mb-3">
                  <AlertTriangle className="w-5 h-5 text-amber-600 shrink-0" />
                  <h3 className="font-semibold text-amber-800 text-sm">{t('quoteVerify.redFlagsTitleSoft')}</h3>
                </div>
                <ul className="space-y-1.5">
                  {redFlags.map((f, i) => (
                    <li key={i} className="flex items-start gap-2 text-sm text-amber-900">
                      <span className="text-amber-500 mt-0.5 shrink-0">•</span>
                      {f}
                    </li>
                  ))}
                </ul>
              </CardContent>
            </Card>
          )}

          {redFlags.length === 0 && (
            <div className="text-center p-4 bg-green-50 rounded-xl border border-green-200">
              <p className="text-sm text-green-700 font-medium">{t('quoteVerify.redFlagsNone')}</p>
            </div>
          )}

          <Card className="border-slate-200 bg-white shadow-sm rounded-xl">
            <CardContent className="p-5">
              <p className="font-medium text-slate-800 mb-3 text-sm">{t('quoteVerify.callUsSuccess')}</p>
              <div className="flex flex-wrap items-center gap-3">
                <a href={CONTACT_PHONE_HREF} className="inline-flex items-center gap-2 text-brand font-semibold hover:underline text-sm">
                  <Phone className="w-4 h-4" />
                  {CONTACT_PHONE}
                </a>
                <span className="text-slate-300">|</span>
                <Link href="/contact" className="text-sm text-brand font-medium hover:underline">
                  İletişim Formu
                </Link>
              </div>
            </CardContent>
          </Card>

          <div className="flex flex-wrap justify-center gap-3">
            <Button
              onClick={() => { setSuccess(false); setForm(initialForm); setRedFlags([]) }}
              className="rounded-xl bg-orange-500 hover:bg-orange-600 shadow-lg shadow-orange-500/20"
            >
              <FileCheck className="w-4 h-4 mr-2" />
              Yeni Doğrulama
            </Button>
            <Button asChild variant="outline" className="rounded-xl border-slate-200">
              <Link href="/ges">GES Hesaplama</Link>
            </Button>
          </div>
        </div>
      </div>
    )
  }

  // ─── RENDER ────────────────────────────────────────────────────────────────

  return (
    <div className="min-h-screen bg-slate-50">

      {/* ── HERO ─────────────────────────────────────────────────── */}
      <div
        className="relative overflow-hidden pt-12 pb-24 md:pt-20 md:pb-32"
        style={{
          backgroundImage: 'url("/images/ges/ges-verification-hero.webp")',
          backgroundSize: 'cover',
          backgroundPosition: 'center',
        }}
      >
        {/* Gradient overlay - lightened for premium feel */}
        <div className="absolute inset-0 bg-gradient-to-b from-slate-900/80 via-slate-900/40 to-slate-900/80" />
        {/* Decorative blobs */}
        <div className="absolute inset-0 pointer-events-none overflow-hidden">
          <div className="absolute -top-24 -right-24 w-96 h-96 rounded-full bg-brand/10 blur-3xl" />
          <div className="absolute -bottom-12 -left-24 w-80 h-80 rounded-full bg-slate-400/5 blur-3xl" />
        </div>

        <div className="container mx-auto px-4 relative z-10">
          <div className="max-w-3xl mx-auto text-center">
            <div className="inline-flex items-center justify-center w-16 h-16 rounded-2xl bg-white/10 backdrop-blur-sm ring-1 ring-white/20 mb-6 shadow-lg">
              <FileCheck className="w-9 h-9 text-white" />
            </div>
            <h1 className="text-4xl md:text-5xl font-black text-white tracking-tight mb-4 drop-shadow">
              {t('quoteVerify.title')}
            </h1>
            <p className="text-lg md:text-xl text-slate-200 max-w-2xl mx-auto leading-relaxed mb-8">
              {t('quoteVerify.description')}
            </p>

            {/* Stat chips */}
            <div className="flex flex-wrap justify-center gap-3">
              {[
                { icon: ShieldCheck, text: 'Ücretsiz Analiz' },
                { icon: Search, text: 'Kırmızı Bayrak Tespiti' },
                { icon: Clock, text: '24 Saat İçinde Dönüş' },
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

      {/* ── MAIN CARD (overlaps hero bottom) ─────────────────────── */}
      <div className="container mx-auto px-4 pb-16 -mt-12 relative z-10">
        <div className="max-w-3xl mx-auto space-y-5">

          {/* Info banner */}
          <Card className="border-0 shadow-lg rounded-2xl overflow-hidden bg-white">
            <CardContent className="p-5 flex flex-col sm:flex-row items-start sm:items-center gap-4">
              <div className="flex items-center justify-center w-11 h-11 rounded-xl bg-orange-100 text-orange-600 shrink-0">
                <Info className="w-5 h-5" />
              </div>
              <p className="text-sm text-slate-700 leading-relaxed flex-1">
                {t('quoteVerify.intro')}
              </p>
              <a
                href={CONTACT_PHONE_HREF}
                className="inline-flex items-center gap-2 bg-brand text-white text-sm font-semibold px-4 py-2.5 rounded-xl hover:bg-brand/90 transition-colors whitespace-nowrap shrink-0"
              >
                <Phone className="w-4 h-4" />
                {CONTACT_PHONE}
              </a>
            </CardContent>
          </Card>

          {/* Main form card */}
          <Card className="shadow-2xl shadow-slate-900/10 border-0 overflow-hidden rounded-2xl">
            <CardContent className="p-0">
              <form onSubmit={handleSubmit} className="p-6 md:p-8 space-y-8" noValidate>

                {/* Form header */}
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-3">
                    <div className="flex items-center justify-center w-10 h-10 rounded-xl bg-blend-soft-light bg-orange-100 text-orange-600 shrink-0">
                      <FileCheck className="w-5 h-5" />
                    </div>
                    <div>
                      <h2 className="text-lg font-bold text-slate-800">Teklif Bilgilerini Girin</h2>
                      <p className="text-sm text-slate-500">
                        <span className="text-red-500 font-bold">*</span> işaretli alanlar zorunludur
                      </p>
                    </div>
                  </div>
                </div>

                {/* ── SECTION 1: Teklif Özeti ─────────────────────────── */}
                <div className="space-y-4">
                  <h3 className="text-sm font-bold text-slate-700 uppercase tracking-wide flex items-center gap-2">
                    <span className="flex items-center justify-center w-6 h-6 rounded-full bg-orange-500 text-white text-xs font-bold">1</span>
                    {t('quoteVerify.section1')}
                  </h3>

                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                    {/* companyName */}
                    <div id="field-companyName" className="space-y-1.5">
                      <Label htmlFor="companyName" className="text-sm font-medium text-slate-700">
                        {t('quoteVerify.companyName')} <span className="font-normal text-slate-500">({t('quoteVerify.optional')})</span>
                      </Label>
                      <Input
                        id="companyName"
                        value={form.companyName}
                        onChange={(e) => set({ companyName: e.target.value })}
                        placeholder={t('quoteVerify.companyNamePlaceholder')}
                        className={fieldCls()}
                      />
                    </div>

                    {/* quoteDate */}
                    <div id="field-quoteDate" className="space-y-1.5">
                      <Label htmlFor="quoteDate" className="text-sm font-medium text-slate-700">
                        {t('quoteVerify.quoteDate')} <Req />
                      </Label>
                      <Input
                        id="quoteDate"
                        type="date"
                        value={form.quoteDate}
                        onChange={(e) => set({ quoteDate: e.target.value })}
                        className={fieldCls(errors.quoteDate)}
                      />
                      {errors.quoteDate && <p className="text-xs text-red-600">{errors.quoteDate}</p>}
                    </div>

                    {/* totalPriceTry */}
                    <div id="field-totalPriceTry" className="space-y-1.5">
                      <Label htmlFor="totalPriceTry" className="text-sm font-medium text-slate-700">
                        {t('quoteVerify.totalPriceTry')} (TL) <Req />
                      </Label>
                      <Input
                        id="totalPriceTry"
                        type="text"
                        inputMode="decimal"
                        value={form.totalPriceTry}
                        onChange={(e) => set({ totalPriceTry: e.target.value })}
                        placeholder="Örn. 250000"
                        className={fieldCls(errors.totalPriceTry)}
                      />
                      {errors.totalPriceTry && <p className="text-xs text-red-600">{errors.totalPriceTry}</p>}
                    </div>

                    {/* totalKwp */}
                    <div id="field-totalKwp" className="space-y-1.5">
                      <Label htmlFor="totalKwp" className="text-sm font-medium text-slate-700">
                        {t('quoteVerify.totalKwp')} <Req />
                      </Label>
                      <Input
                        id="totalKwp"
                        type="text"
                        inputMode="decimal"
                        value={form.totalKwp}
                        onChange={(e) => set({ totalKwp: e.target.value })}
                        placeholder="kWp"
                        className={fieldCls(errors.totalKwp)}
                      />
                      {errors.totalKwp && <p className="text-xs text-red-600">{errors.totalKwp}</p>}
                    </div>

                    {/* turnkey */}
                    <div className="space-y-1.5 sm:col-span-2 sm:max-w-xs">
                      <Label htmlFor="turnkey" className="text-sm font-medium text-slate-700">
                        {t('quoteVerify.turnkey')}
                      </Label>
                      <Select value={form.turnkey} onValueChange={(v) => set({ turnkey: v || '' })}>
                        <SelectTrigger id="turnkey" className={selectCls()}>
                          <SelectValue placeholder="Anahtar teslim mi?" />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="evet">{t('quoteVerify.turnkeyYes')}</SelectItem>
                          <SelectItem value="hayir">{t('quoteVerify.turnkeyNo')}</SelectItem>
                          <SelectItem value="emin_degilim">{t('quoteVerify.turnkeyUnsure')}</SelectItem>
                        </SelectContent>
                      </Select>
                    </div>
                  </div>
                </div>

                {/* ── SECTION 2: Panel ve İnverter ─────────────────────── */}
                <div className="space-y-4">
                  <h3 className="text-sm font-bold text-slate-700 uppercase tracking-wide flex items-center gap-2">
                    <span className="flex items-center justify-center w-6 h-6 rounded-full bg-orange-500 text-white text-xs font-bold">2</span>
                    Panel ve İnverter
                  </h3>

                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                    {/* panelBrandModel */}
                    <div id="field-panelBrandModel" className="space-y-1.5">
                      <Label htmlFor="panelBrandModel" className="text-sm font-medium text-slate-700">
                        {t('quoteVerify.panelBrandModel')} <Req />
                      </Label>
                      <Input
                        id="panelBrandModel"
                        value={form.panelBrandModel}
                        onChange={(e) => set({ panelBrandModel: e.target.value })}
                        placeholder="Marka / model"
                        className={fieldCls(errors.panelBrandModel)}
                      />
                      {errors.panelBrandModel && <p className="text-xs text-red-600">{errors.panelBrandModel}</p>}
                    </div>

                    {/* panelCount */}
                    <div id="field-panelCount" className="space-y-1.5">
                      <Label htmlFor="panelCount" className="text-sm font-medium text-slate-700">
                        {t('quoteVerify.panelCount')} <Req />
                      </Label>
                      <Input
                        id="panelCount"
                        type="text"
                        inputMode="numeric"
                        value={form.panelCount}
                        onChange={(e) => set({ panelCount: e.target.value })}
                        placeholder="Adet"
                        className={fieldCls(errors.panelCount)}
                      />
                      {errors.panelCount && <p className="text-xs text-red-600">{errors.panelCount}</p>}
                    </div>

                    {/* inverterBrandModel */}
                    <div id="field-inverterBrandModel" className="space-y-1.5">
                      <Label htmlFor="inverterBrandModel" className="text-sm font-medium text-slate-700">
                        {t('quoteVerify.inverterBrandModel')} <Req />
                      </Label>
                      <Input
                        id="inverterBrandModel"
                        value={form.inverterBrandModel}
                        onChange={(e) => set({ inverterBrandModel: e.target.value })}
                        placeholder="Marka / model"
                        className={fieldCls(errors.inverterBrandModel)}
                      />
                      {errors.inverterBrandModel && <p className="text-xs text-red-600">{errors.inverterBrandModel}</p>}
                    </div>

                    {/* panelWatt */}
                    <div className="space-y-1.5">
                      <Label htmlFor="panelWatt" className="text-sm font-medium text-slate-700">
                        {t('quoteVerify.panelWatt')}
                      </Label>
                      <Input
                        id="panelWatt"
                        type="text"
                        inputMode="numeric"
                        value={form.panelWatt}
                        onChange={(e) => set({ panelWatt: e.target.value })}
                        placeholder="Örn. 550 Wp"
                        className={fieldCls()}
                      />
                    </div>
                  </div>

                  {/* Expandable panel details */}
                  <details className="group rounded-xl border border-slate-200 bg-slate-50/50 overflow-hidden">
                    <summary className="flex items-center justify-between gap-3 px-4 py-3 cursor-pointer list-none hover:bg-slate-50 transition-colors [&::-webkit-details-marker]:hidden">
                      <span className="text-sm font-medium text-slate-600">Panel &amp; İnverter Detayları <span className="text-slate-400 font-normal">(isteğe bağlı)</span></span>
                      <ChevronDown className="w-4 h-4 text-slate-400 transition-transform group-open:rotate-180 shrink-0" />
                    </summary>
                    <div className="p-4 pt-3 border-t border-slate-200 grid grid-cols-1 sm:grid-cols-2 gap-4">
                      <div className="space-y-1.5">
                        <Label htmlFor="panelTechnology" className="text-sm font-medium text-slate-700">{t('quoteVerify.panelTech')}</Label>
                        <Select value={form.panelTechnology} onValueChange={(v) => set({ panelTechnology: v || '' })}>
                          <SelectTrigger id="panelTechnology" className={selectCls()}>
                            <SelectValue placeholder="Hücre teknolojisi" />
                          </SelectTrigger>
                          <SelectContent>
                            <SelectItem value="monokristal">{t('quoteVerify.panelMono')}</SelectItem>
                            <SelectItem value="perc">{t('quoteVerify.panelPerc')}</SelectItem>
                            <SelectItem value="topcon">{t('quoteVerify.panelTopcon')}</SelectItem>
                            <SelectItem value="hjt">{t('quoteVerify.panelHjt')}</SelectItem>
                            <SelectItem value="bilmiyorum">{t('quoteVerify.panelUnknown')}</SelectItem>
                          </SelectContent>
                        </Select>
                      </div>
                      <div className="space-y-1.5">
                        <Label htmlFor="panelEfficiencyPct" className="text-sm font-medium text-slate-700">{t('quoteVerify.panelEfficiency')} (%)</Label>
                        <Input id="panelEfficiencyPct" type="text" inputMode="decimal" value={form.panelEfficiencyPct} onChange={(e) => set({ panelEfficiencyPct: e.target.value })} placeholder="Örn. 22.5" className={fieldCls()} />
                      </div>
                      <div className="space-y-1.5">
                        <Label htmlFor="warrantyProductYears" className="text-sm font-medium text-slate-700">{t('quoteVerify.warrantyProduct')} (yıl)</Label>
                        <Input id="warrantyProductYears" type="text" inputMode="numeric" value={form.warrantyProductYears} onChange={(e) => set({ warrantyProductYears: e.target.value })} placeholder="Yıl" className={fieldCls()} />
                      </div>
                      <div className="space-y-1.5">
                        <Label htmlFor="warrantyPerformanceYears" className="text-sm font-medium text-slate-700">{t('quoteVerify.warrantyPerformance')} (yıl)</Label>
                        <Input id="warrantyPerformanceYears" type="text" inputMode="numeric" value={form.warrantyPerformanceYears} onChange={(e) => set({ warrantyPerformanceYears: e.target.value })} placeholder="Yıl" className={fieldCls()} />
                      </div>
                      <div className="space-y-1.5">
                        <Label htmlFor="inverterTotalKw" className="text-sm font-medium text-slate-700">{t('quoteVerify.inverterTotalKw')} (kW)</Label>
                        <Input id="inverterTotalKw" type="text" inputMode="decimal" value={form.inverterTotalKw} onChange={(e) => set({ inverterTotalKw: e.target.value })} placeholder="kW" className={fieldCls()} />
                      </div>
                      <div className="space-y-1.5">
                        <Label htmlFor="inverterType" className="text-sm font-medium text-slate-700">{t('quoteVerify.inverterType')}</Label>
                        <Select value={form.inverterType} onValueChange={(v) => set({ inverterType: v || '' })}>
                          <SelectTrigger id="inverterType" className={selectCls()}><SelectValue placeholder="İnverter türü" /></SelectTrigger>
                          <SelectContent>
                            <SelectItem value="string">{t('quoteVerify.inverterString')}</SelectItem>
                            <SelectItem value="mikro">{t('quoteVerify.inverterMikro')}</SelectItem>
                            <SelectItem value="hibrit">{t('quoteVerify.inverterHibrit')}</SelectItem>
                            <SelectItem value="merkezi">{t('quoteVerify.inverterMerkezi')}</SelectItem>
                          </SelectContent>
                        </Select>
                      </div>
                      <div className="space-y-1.5">
                        <Label htmlFor="mpptCount" className="text-sm font-medium text-slate-700">{t('quoteVerify.mpptCount')}</Label>
                        <Input id="mpptCount" type="text" inputMode="numeric" value={form.mpptCount} onChange={(e) => set({ mpptCount: e.target.value })} placeholder="Adet" className={fieldCls()} />
                      </div>
                    </div>
                  </details>
                </div>

                {/* ── SECTION 3: Depolama ve Montaj ─────────────────────── */}
                <details className="group rounded-xl border border-slate-200 bg-slate-50/50 overflow-hidden">
                  <summary className="flex items-center justify-between gap-3 px-5 py-4 cursor-pointer list-none hover:bg-slate-50 transition-colors [&::-webkit-details-marker]:hidden">
                    <div className="flex items-center gap-3">
                      <span className="flex items-center justify-center w-6 h-6 rounded-full bg-slate-400 text-white text-xs font-bold">3</span>
                      <div>
                        <span className="font-semibold text-slate-700 text-sm">Depolama, Montaj &amp; Üretim</span>
                        <span className="text-xs text-slate-400 ml-1.5">(isteğe bağlı)</span>
                      </div>
                    </div>
                    <ChevronDown className="w-4 h-4 text-slate-400 transition-transform group-open:rotate-180 shrink-0" />
                  </summary>
                  <div className="p-5 pt-3 border-t border-slate-200 grid grid-cols-1 sm:grid-cols-2 gap-4">
                    <div className="space-y-1.5">
                      <Label htmlFor="storageCompatible" className="text-sm font-medium text-slate-700">{t('quoteVerify.storageCompatible')}</Label>
                      <Select value={form.storageCompatible} onValueChange={(v) => set({ storageCompatible: v || '' })}>
                        <SelectTrigger id="storageCompatible" className={selectCls()}><SelectValue placeholder="Depolama uyumlu mu?" /></SelectTrigger>
                        <SelectContent>
                          <SelectItem value="evet">Evet</SelectItem>
                          <SelectItem value="hayir">Hayır</SelectItem>
                          <SelectItem value="bilmiyorum">Bilmiyorum</SelectItem>
                        </SelectContent>
                      </Select>
                    </div>
                    <div className="space-y-1.5">
                      <Label htmlFor="batteryBrandModel" className="text-sm font-medium text-slate-700">{t('quoteVerify.batteryBrandModel')}</Label>
                      <Input id="batteryBrandModel" value={form.batteryBrandModel} onChange={(e) => set({ batteryBrandModel: e.target.value })} placeholder="Marka / model" className={fieldCls()} />
                    </div>
                    <div className="space-y-1.5">
                      <Label htmlFor="batteryKwh" className="text-sm font-medium text-slate-700">{t('quoteVerify.batteryKwh')} (kWh)</Label>
                      <Input id="batteryKwh" type="text" inputMode="decimal" value={form.batteryKwh} onChange={(e) => set({ batteryKwh: e.target.value })} placeholder="kWh" className={fieldCls()} />
                    </div>
                    <div className="space-y-1.5">
                      <Label htmlFor="batteryChemistry" className="text-sm font-medium text-slate-700">{t('quoteVerify.batteryChemistry')}</Label>
                      <Select value={form.batteryChemistry} onValueChange={(v) => set({ batteryChemistry: v || '' })}>
                        <SelectTrigger id="batteryChemistry" className={selectCls()}><SelectValue placeholder="Kimya türü" /></SelectTrigger>
                        <SelectContent>
                          <SelectItem value="lfp">{t('quoteVerify.batteryLfp')}</SelectItem>
                          <SelectItem value="nmc">{t('quoteVerify.batteryNmc')}</SelectItem>
                        </SelectContent>
                      </Select>
                    </div>
                    <div className="space-y-1.5">
                      <Label htmlFor="mountingType" className="text-sm font-medium text-slate-700">{t('quoteVerify.mountingType')}</Label>
                      <Select value={form.mountingType} onValueChange={(v) => set({ mountingType: v || '' })}>
                        <SelectTrigger id="mountingType" className={selectCls()}><SelectValue placeholder="Montaj türü" /></SelectTrigger>
                        <SelectContent>
                          <SelectItem value="delinerek">{t('quoteVerify.mountingDrill')}</SelectItem>
                          <SelectItem value="balastli">{t('quoteVerify.mountingBallast')}</SelectItem>
                          <SelectItem value="entegre">{t('quoteVerify.mountingIntegral')}</SelectItem>
                        </SelectContent>
                      </Select>
                    </div>
                    <div className="space-y-1.5">
                      <Label htmlFor="staticProjectProvided" className="text-sm font-medium text-slate-700">{t('quoteVerify.staticProject')}</Label>
                      <Select value={form.staticProjectProvided} onValueChange={(v) => set({ staticProjectProvided: v || '' })}>
                        <SelectTrigger id="staticProjectProvided" className={selectCls()}><SelectValue placeholder="Statik proje?" /></SelectTrigger>
                        <SelectContent>
                          <SelectItem value="evet">Evet</SelectItem>
                          <SelectItem value="hayir">Hayır</SelectItem>
                        </SelectContent>
                      </Select>
                    </div>
                    <div className="space-y-1.5">
                      <Label htmlFor="annualProductionKwh" className="text-sm font-medium text-slate-700">{t('quoteVerify.annualProductionKwh')} (kWh)</Label>
                      <Input id="annualProductionKwh" type="text" inputMode="decimal" value={form.annualProductionKwh} onChange={(e) => set({ annualProductionKwh: e.target.value })} placeholder="kWh/yıl" className={fieldCls()} />
                    </div>
                    <div className="space-y-1.5">
                      <Label htmlFor="paybackYearsQuoted" className="text-sm font-medium text-slate-700">{t('quoteVerify.paybackYearsQuoted')} (yıl)</Label>
                      <Input id="paybackYearsQuoted" type="text" inputMode="decimal" value={form.paybackYearsQuoted} onChange={(e) => set({ paybackYearsQuoted: e.target.value })} placeholder="Yıl" className={fieldCls()} />
                    </div>
                  </div>
                </details>

                {/* ── SECTION 4: İletişim Bilgileriniz ─────────────────── */}
                <div className="space-y-4">
                  <h3 className="text-sm font-bold text-slate-700 uppercase tracking-wide flex items-center gap-2">
                    <span className="flex items-center justify-center w-6 h-6 rounded-full bg-orange-500 text-white text-xs font-bold">4</span>
                    İletişim Bilgileriniz
                  </h3>

                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                    <div id="field-contactName" className="space-y-1.5">
                      <Label htmlFor="contactName" className="text-sm font-medium text-slate-700">
                        {t('quoteVerify.contactName')} <Req />
                      </Label>
                      <Input
                        id="contactName"
                        value={form.contactName}
                        onChange={(e) => set({ contactName: e.target.value })}
                        placeholder="Ad soyad"
                        className={fieldCls(errors.contactName)}
                        autoComplete="name"
                      />
                      {errors.contactName && <p className="text-xs text-red-600">{errors.contactName}</p>}
                    </div>

                    <div id="field-contactEmail" className="space-y-1.5">
                      <Label htmlFor="contactEmail" className="text-sm font-medium text-slate-700">
                        {t('quoteVerify.contactEmail')} <Req />
                      </Label>
                      <Input
                        id="contactEmail"
                        type="email"
                        value={form.contactEmail}
                        onChange={(e) => set({ contactEmail: e.target.value })}
                        placeholder="ornek@email.com"
                        className={fieldCls(errors.contactEmail)}
                        autoComplete="email"
                      />
                      {errors.contactEmail && <p className="text-xs text-red-600">{errors.contactEmail}</p>}
                    </div>

                    <div id="field-contactPhone" className="space-y-1.5">
                      <Label htmlFor="contactPhone" className="text-sm font-medium text-slate-700">
                        {t('quoteVerify.contactPhone')} <Req />
                      </Label>
                      <Input
                        id="contactPhone"
                        type="tel"
                        value={form.contactPhone}
                        onChange={(e) => set({ contactPhone: e.target.value })}
                        placeholder="+90 5xx xxx xx xx"
                        className={fieldCls(errors.contactPhone)}
                        autoComplete="tel"
                      />
                      {errors.contactPhone && <p className="text-xs text-red-600">{errors.contactPhone}</p>}
                    </div>
                  </div>
                </div>

                {/* ── SUBMIT ────────────────────────────────────────────── */}
                <div className="space-y-3">
                  {errors.submit && (
                    <p className="p-3 bg-red-50 border border-red-200 text-red-700 text-sm rounded-xl">
                      {errors.submit}
                    </p>
                  )}

                  <Button
                    type="submit"
                    size="lg"
                    disabled={submitting}
                    className="w-full h-14 text-base font-bold rounded-xl bg-orange-500 hover:bg-orange-600 gap-2 shadow-lg shadow-orange-500/25"
                  >
                    {submitting ? (
                      <Loader2 className="w-5 h-5 animate-spin" />
                    ) : (
                      <FileCheck className="w-5 h-5" />
                    )}
                    {t('quoteVerify.submit')}
                  </Button>
                </div>

                {/* Footer link */}
                <div className="pt-4 border-t border-slate-100 text-center">
                  <Link
                    href="/ges"
                    className="inline-flex items-center gap-2 text-sm text-slate-500 hover:text-brand transition-colors"
                  >
                    <Star className="w-4 h-4" />
                    GES hesaplama &amp; teklif almak ister misiniz?
                  </Link>
                </div>

              </form>
            </CardContent>
          </Card>
        </div>
      </div>

    </div>
  )
}
