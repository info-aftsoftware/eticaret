'use client'

import React, { useState, useEffect } from 'react'
import Image from 'next/image'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Textarea } from '@/components/ui/textarea'
import { Label } from '@/components/ui/label'
import { ClassicPageShell } from '@/components/ClassicPageShell'
import {
  Mail,
  Phone,
  MapPin,
  Send,
  CheckCircle2,
  MessageSquare,
  Loader2,
} from 'lucide-react'

const CONTACT_IMAGE =
  'https://images.unsplash.com/photo-1557804506-669a67965ba0?w=800&q=80'

const SITE_CONTACT_DRAFT_KEY = 'site_contact_draft'

function loadContactDraftForPage(): { name: string; email: string; phone: string } {
  if (typeof window === 'undefined') return { name: '', email: '', phone: '' }
  try {
    const raw = localStorage.getItem(SITE_CONTACT_DRAFT_KEY)
    if (!raw) return { name: '', email: '', phone: '' }
    const parsed = JSON.parse(raw) as { fullName?: string; phone?: string; city?: string; email?: string }
    return {
      name: typeof parsed.fullName === 'string' ? parsed.fullName : '',
      email: typeof parsed.email === 'string' ? parsed.email : '',
      phone: typeof parsed.phone === 'string' ? parsed.phone : '',
    }
  } catch {
    return { name: '', email: '', phone: '' }
  }
}

export default function ContactPage() {
  const [formData, setFormData] = useState({
    name: '',
    email: '',
    phone: '',
    subject: '',
    message: '',
  })
  const [errors, setErrors] = useState<Record<string, string>>({})
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [isSubmitted, setIsSubmitted] = useState(false)

  useEffect(() => {
    const draft = loadContactDraftForPage()
    if (draft.name || draft.email || draft.phone) {
      setFormData((prev) => ({
        ...prev,
        name: draft.name || prev.name,
        email: draft.email || prev.email,
        phone: draft.phone || prev.phone,
      }))
    }
  }, [])

  const validate = (): boolean => {
    const next: Record<string, string> = {}
    if (!formData.name?.trim()) next.name = 'Ad Soyad zorunludur.'
    if (!formData.email?.trim()) next.email = 'E-posta zorunludur.'
    else if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(formData.email)) next.email = 'Geçerli bir e-posta adresi girin.'
    if (!formData.subject?.trim()) next.subject = 'Konu zorunludur.'
    if (!formData.message?.trim()) next.message = 'Mesaj zorunludur.'
    else if (formData.message.trim().length < 10) next.message = 'Mesaj en az 10 karakter olmalıdır.'
    setErrors(next)
    return Object.keys(next).length === 0
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!validate()) {
      window.scrollTo({ top: 0, behavior: 'smooth' })
      return
    }
    setIsSubmitting(true)
    try {
      // Static hosting: Firestore'a kaydet (API yok)
      const { collection, addDoc, serverTimestamp } = await import('firebase/firestore')
      const { getDb } = await import('@/lib/firebase/config')
      const db = getDb()
      await addDoc(collection(db, 'contactMessages'), {
        ...formData,
        createdAt: serverTimestamp(),
        status: 'new',
      })
      setIsSubmitting(false)
      setIsSubmitted(true)
      setFormData({ name: '', email: '', phone: '', subject: '', message: '' })
      setTimeout(() => setIsSubmitted(false), 5000)
    } catch (error) {
      console.error('Contact form error:', error)
      setIsSubmitting(false)
      setErrors({ general: 'Mesaj gönderilirken bir hata oluştu. Lütfen tekrar deneyin.' })
      window.scrollTo({ top: 0, behavior: 'smooth' })
    }
  }

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
    setFormData((prev) => ({ ...prev, [e.target.name]: e.target.value }))
  }

  return (
    <ClassicPageShell
      breadcrumbs={[{ label: 'İletişim' }]}
      title="İletişim | voltekno"
      description="Sorularınız için formu doldurun veya aşağıdaki kanallardan yazın."
    >
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-5 gap-5 sm:gap-6 md:gap-8 min-w-0 max-w-full">
        <div className="md:col-span-1 lg:col-span-3 order-1 min-w-0">
          <Card className="bg-white rounded-2xl border border-slate-200 shadow-sm overflow-hidden">
            <CardHeader className="pb-4">
              <CardTitle className="text-xl">Bize Yazın</CardTitle>
              <CardDescription>
                Formu doldurun, en kısa sürede size dönüş yapalım.
              </CardDescription>
            </CardHeader>
            <CardContent>
              {isSubmitted ? (
                <div className="text-center py-10">
                  <div className="w-16 h-16 rounded-2xl bg-emerald-100 flex items-center justify-center mx-auto mb-4">
                    <CheckCircle2 className="w-8 h-8 text-emerald-600" />
                  </div>
                  <h3 className="text-lg font-semibold text-slate-900 mb-1">Mesajınız Gönderildi!</h3>
                  <p className="text-slate-600 text-sm">En kısa sürede size dönüş yapacağız.</p>
                </div>
              ) : (
                <form onSubmit={handleSubmit} className="space-y-5">
                  {errors.general && (
                    <div className="p-4 bg-red-50 border border-red-200 rounded-xl text-sm text-red-700">
                      {errors.general}
                    </div>
                  )}
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                    <div className="space-y-2">
                      <Label htmlFor="name">Ad Soyad *</Label>
                      <Input
                        id="name"
                        name="name"
                        value={formData.name}
                        onChange={(e) => { handleChange(e); setErrors((prev) => ({ ...prev, name: '' })) }}
                        placeholder="Adınız ve soyadınız"
                        className={`rounded-xl border-slate-200 focus:ring-2 focus:ring-slate-400 focus:border-slate-400 ${errors.name ? 'border-red-500' : ''}`}
                      />
                      {errors.name && <p className="text-sm text-destructive">{errors.name}</p>}
                    </div>
                    <div className="space-y-2">
                      <Label htmlFor="email">E-posta *</Label>
                      <Input
                        id="email"
                        name="email"
                        type="email"
                        value={formData.email}
                        onChange={(e) => { handleChange(e); setErrors((prev) => ({ ...prev, email: '' })) }}
                        placeholder="ornek@email.com"
                        className={`rounded-xl border-slate-200 focus:ring-2 focus:ring-slate-400 focus:border-slate-400 ${errors.email ? 'border-red-500' : ''}`}
                      />
                      {errors.email && <p className="text-sm text-destructive">{errors.email}</p>}
                    </div>
                  </div>
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                    <div className="space-y-2">
                      <Label htmlFor="phone">Telefon</Label>
                      <Input
                        id="phone"
                        name="phone"
                        type="tel"
                        value={formData.phone}
                        onChange={handleChange}
                        placeholder="+90 (555) 123 45 67"
                        className="rounded-xl border-slate-200 focus:ring-2 focus:ring-slate-400 focus:border-slate-400"
                      />
                    </div>
                    <div className="space-y-2">
                      <Label htmlFor="subject">Konu *</Label>
                      <Input
                        id="subject"
                        name="subject"
                        value={formData.subject}
                        onChange={(e) => { handleChange(e); setErrors((prev) => ({ ...prev, subject: '' })) }}
                        placeholder="Mesaj konusu"
                        className={`rounded-xl border-slate-200 focus:ring-2 focus:ring-slate-400 focus:border-slate-400 ${errors.subject ? 'border-red-500' : ''}`}
                      />
                      {errors.subject && <p className="text-sm text-destructive">{errors.subject}</p>}
                    </div>
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="message">Mesaj *</Label>
                    <Textarea
                      id="message"
                      name="message"
                      value={formData.message}
                      onChange={(e) => { handleChange(e); setErrors((prev) => ({ ...prev, message: '' })) }}
                      rows={5}
                      placeholder="Mesajınızı buraya yazın..."
                      className={`rounded-xl border-slate-200 focus:ring-2 focus:ring-slate-400 focus:border-slate-400 resize-none ${errors.message ? 'border-red-500' : ''}`}
                    />
                    {errors.message && <p className="text-sm text-destructive">{errors.message}</p>}
                  </div>
                  <Button
                    type="submit"
                    size="lg"
                    disabled={isSubmitting}
                    className="w-full rounded-xl min-h-[48px] touch-manipulation bg-brand hover:bg-brand-hover text-white"
                  >
                    {isSubmitting ? (
                      <>
                        <Loader2 className="w-5 h-5 mr-2 animate-spin" />
                        Gönderiliyor...
                      </>
                    ) : (
                      <>
                        <Send className="w-5 h-5 mr-2" />
                        Mesajı Gönder
                      </>
                    )}
                  </Button>
                </form>
              )}
            </CardContent>
          </Card>
        </div>

        <div className="md:col-span-1 lg:col-span-2 order-2">
          <div className="relative rounded-2xl overflow-hidden border border-slate-200 aspect-[4/3] lg:aspect-auto lg:min-h-[420px] bg-slate-100">
            <Image
              src={CONTACT_IMAGE}
              alt="İletişim - profesyonel destek"
              fill
              className="object-cover"
              sizes="(max-width: 1024px) 100vw, 40vw"
              priority
            />
            <div className="absolute inset-0 bg-gradient-to-t from-slate-900/40 via-transparent to-transparent" />
          </div>
        </div>
      </div>

      <div className="mt-8 md:mt-10">
        <h2 className="text-lg font-bold text-slate-900 mb-4">İletişim bilgileri</h2>
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 md:gap-5">
          <Card className="bg-white rounded-2xl border border-slate-200 shadow-sm">
            <CardContent className="p-5">
              <div className="w-10 h-10 rounded-xl bg-slate-100 flex items-center justify-center mb-3">
                <Mail className="w-5 h-5 text-slate-600" />
              </div>
              <h3 className="font-semibold text-slate-900 mb-1">E-posta</h3>
              <a
                href="mailto:info@voltekno.com"
                className="text-slate-800 hover:text-slate-600 text-sm font-medium block py-2 touch-manipulation min-h-[44px] flex items-center"
              >
                info@voltekno.com
              </a>
            </CardContent>
          </Card>
          <Card className="bg-white rounded-2xl border border-slate-200 shadow-sm">
            <CardContent className="p-5">
              <div className="w-10 h-10 rounded-xl bg-slate-100 flex items-center justify-center mb-3">
                <Phone className="w-5 h-5 text-slate-600" />
              </div>
              <h3 className="font-semibold text-slate-900 mb-1">Telefon</h3>
              <a
                href="tel:+905343288383"
                className="text-slate-800 hover:text-slate-600 text-sm font-medium block py-2 touch-manipulation min-h-[44px] flex items-center"
              >
                0534 328 83 83
              </a>
            </CardContent>
          </Card>
          <Card className="bg-white rounded-2xl border border-slate-200 shadow-sm">
            <CardContent className="p-5">
              <div className="w-10 h-10 rounded-xl bg-slate-100 flex items-center justify-center mb-3">
                <MapPin className="w-5 h-5 text-slate-600" />
              </div>
              <h3 className="font-semibold text-slate-900 mb-1">Adres</h3>
              <p className="text-slate-600 text-sm">Antalya, Türkiye</p>
            </CardContent>
          </Card>
          <Card className="bg-white rounded-2xl border border-slate-200 shadow-sm">
            <CardContent className="p-5">
              <div className="w-10 h-10 rounded-xl bg-slate-100 flex items-center justify-center mb-3">
                <MessageSquare className="w-5 h-5 text-slate-600" />
              </div>
              <h3 className="font-semibold text-slate-900 mb-1">Çalışma saatleri</h3>
              <div className="text-slate-600 text-sm space-y-0.5">
                <p>Pzt - Cuma: 09:00 - 18:00</p>
                <p>Cumartesi: 10:00 - 16:00</p>
                <p>Pazar: Kapalı</p>
              </div>
            </CardContent>
          </Card>
        </div>
      </div>
    </ClassicPageShell>
  )
}
