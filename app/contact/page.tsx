'use client'

import React, { useState, useEffect } from 'react'
import Image from 'next/image'
import { Turnstile } from '@/components/Turnstile'
import { whatsappHref, WhatsAppIcon } from '@/components/WhatsAppButton'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Textarea } from '@/components/ui/textarea'
import { Label } from '@/components/ui/label'
import { ClassicPageShell } from '@/components/ClassicPageShell'
import { useL } from '@/lib/i18n-inline'
import { isValidEmail, isValidTrPhone, EMAIL_ERROR_TR, EMAIL_ERROR_EN, PHONE_ERROR_TR, PHONE_ERROR_EN } from '@/lib/checkout-validation'
import { useServerError } from '@/lib/server-error-i18n'
import { Phone, Send, Loader2 } from 'lucide-react'

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
  const L = useL()
  const tErr = useServerError()
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

  const [turnstileToken, setTurnstileToken] = useState<string | null>(null)
  const [turnstileReset, setTurnstileReset] = useState(0)

  const validate = (): boolean => {
    const next: Record<string, string> = {}
    if (!formData.name?.trim()) next.name = L('Ad Soyad zorunludur.', 'Full name is required.')
    if (!formData.email?.trim()) next.email = L('E-posta zorunludur.', 'Email is required.')
    else if (!isValidEmail(formData.email)) next.email = L(EMAIL_ERROR_TR, EMAIL_ERROR_EN)
    if (formData.phone?.trim() && !isValidTrPhone(formData.phone)) next.phone = L(PHONE_ERROR_TR, PHONE_ERROR_EN)
    if (!formData.subject?.trim()) next.subject = L('Konu zorunludur.', 'Subject is required.')
    if (!formData.message?.trim()) next.message = L('Mesaj zorunludur.', 'Message is required.')
    else if (formData.message.trim().length < 10) next.message = L('Mesaj en az 10 karakter olmalıdır.', 'Message must be at least 10 characters.')
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
      // Sunucu: doğrulama + bot koruması + admin'e e-posta + panel kaydı (contactMessages)
      const res = await fetch('/api/contact', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ ...formData, turnstileToken }),
      })
      const data = await res.json().catch(() => null)
      if (!res.ok || !data?.success) throw new Error(tErr(data?.error) || L('Mesaj gönderilemedi.', 'Message could not be sent.'))
      setIsSubmitting(false)
      setTurnstileReset((n) => n + 1)
      setIsSubmitted(true)
      setFormData({ name: '', email: '', phone: '', subject: '', message: '' })
      setTimeout(() => setIsSubmitted(false), 5000)
    } catch (error) {
      console.error('Contact form error:', error)
      setIsSubmitting(false)
      setErrors({ general: error instanceof Error && error.message ? error.message : L('Mesaj gönderilirken bir hata oluştu. Lütfen tekrar deneyin.', 'An error occurred while sending your message. Please try again.') })
      setTurnstileReset((n) => n + 1)
      window.scrollTo({ top: 0, behavior: 'smooth' })
    }
  }

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
    setFormData((prev) => ({ ...prev, [e.target.name]: e.target.value }))
  }

  return (
    <ClassicPageShell
      breadcrumbs={[{ label: L('İletişim', 'Contact') }]}
      title={L('İletişim | voltekno', 'Contact | voltekno')}
      description={L('Sorularınız için formu doldurun veya aşağıdaki kanallardan yazın.', 'Fill out the form for your questions or reach us through the channels below.')}
    >
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-5 gap-5 sm:gap-6 md:gap-8 min-w-0 max-w-full">
        <div className="md:col-span-1 lg:col-span-3 order-1 min-w-0">
          <Card className="bg-white rounded-2xl border border-slate-200 shadow-sm overflow-hidden">
            <CardHeader className="pb-4">
              <CardTitle className="text-xl">{L('Bize Yazın', 'Write to Us')}</CardTitle>
              <CardDescription>
                {L('Formu doldurun, en kısa sürede size dönüş yapalım.', 'Fill out the form and we will get back to you as soon as possible.')}
              </CardDescription>
            </CardHeader>
            <CardContent>
              {isSubmitted ? (
                <div className="text-center py-10">
                  <h3 className="text-lg font-semibold text-slate-900 mb-1">{L('Mesajınız Gönderildi!', 'Your Message Has Been Sent!')}</h3>
                  <p className="text-slate-600 text-sm">{L('En kısa sürede size dönüş yapacağız.', 'We will get back to you as soon as possible.')}</p>
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
                      <Label htmlFor="name">{L('Ad Soyad *', 'Full Name *')}</Label>
                      <Input
                        id="name"
                        name="name"
                        value={formData.name}
                        onChange={(e) => { handleChange(e); setErrors((prev) => ({ ...prev, name: '' })) }}
                        placeholder={L('Adınız ve soyadınız', 'Your full name')}
                        className={`rounded-xl border-slate-200 focus:ring-2 focus:ring-slate-400 focus:border-slate-400 ${errors.name ? 'border-red-500' : ''}`}
                      />
                      {errors.name && <p className="text-sm text-destructive">{errors.name}</p>}
                    </div>
                    <div className="space-y-2">
                      <Label htmlFor="email">{L('E-posta *', 'Email *')}</Label>
                      <Input
                        id="email"
                        name="email"
                        type="email"
                        value={formData.email}
                        onChange={(e) => { handleChange(e); setErrors((prev) => ({ ...prev, email: '' })) }}
                        placeholder={L('ornek@email.com', 'example@email.com')}
                        className={`rounded-xl border-slate-200 focus:ring-2 focus:ring-slate-400 focus:border-slate-400 ${errors.email ? 'border-red-500' : ''}`}
                      />
                      {errors.email && <p className="text-sm text-destructive">{errors.email}</p>}
                    </div>
                  </div>
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                    <div className="space-y-2">
                      <Label htmlFor="phone">{L('Telefon', 'Phone')}</Label>
                      <Input
                        id="phone"
                        name="phone"
                        type="tel"
                        value={formData.phone}
                        onChange={(e) => { handleChange(e); setErrors((prev) => ({ ...prev, phone: '' })) }}
                        placeholder="0532 123 45 67"
                        inputMode="tel"
                        autoComplete="tel"
                        aria-invalid={Boolean(errors.phone)}
                        className={`rounded-xl border-slate-200 focus:ring-2 focus:ring-slate-400 focus:border-slate-400 ${errors.phone ? 'border-red-500' : ''}`}
                      />
                      {errors.phone && <p className="text-sm text-destructive">{errors.phone}</p>}
                    </div>
                    <div className="space-y-2">
                      <Label htmlFor="subject">{L('Konu *', 'Subject *')}</Label>
                      <Input
                        id="subject"
                        name="subject"
                        value={formData.subject}
                        onChange={(e) => { handleChange(e); setErrors((prev) => ({ ...prev, subject: '' })) }}
                        placeholder={L('Mesaj konusu', 'Message subject')}
                        className={`rounded-xl border-slate-200 focus:ring-2 focus:ring-slate-400 focus:border-slate-400 ${errors.subject ? 'border-red-500' : ''}`}
                      />
                      {errors.subject && <p className="text-sm text-destructive">{errors.subject}</p>}
                    </div>
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="message">{L('Mesaj *', 'Message *')}</Label>
                    <Textarea
                      id="message"
                      name="message"
                      value={formData.message}
                      onChange={(e) => { handleChange(e); setErrors((prev) => ({ ...prev, message: '' })) }}
                      rows={5}
                      placeholder={L('Mesajınızı buraya yazın...', 'Write your message here...')}
                      className={`rounded-xl border-slate-200 focus:ring-2 focus:ring-slate-400 focus:border-slate-400 resize-none ${errors.message ? 'border-red-500' : ''}`}
                    />
                    {errors.message && <p className="text-sm text-destructive">{errors.message}</p>}
                  </div>
                  <Turnstile onToken={setTurnstileToken} resetKey={turnstileReset} />
                  <Button
                    type="submit"
                    size="lg"
                    disabled={isSubmitting}
                    className="w-full rounded-xl min-h-[48px] touch-manipulation bg-brand hover:bg-brand-hover text-white"
                  >
                    {isSubmitting ? (
                      <>
                        <Loader2 className="w-5 h-5 mr-2 animate-spin" />
                        {L('Gönderiliyor...', 'Sending...')}
                      </>
                    ) : (
                      <>
                        <Send className="w-5 h-5 mr-2" />
                        {L('Mesajı Gönder', 'Send Message')}
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
              alt={L('İletişim - profesyonel destek', 'Contact - professional support')}
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
        <h2 className="text-lg font-bold text-slate-900 mb-4">{L('İletişim bilgileri', 'Contact information')}</h2>
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 md:gap-5">
          <Card className="bg-white rounded-2xl border border-slate-200 shadow-sm">
            <CardContent className="p-5">
              <h3 className="font-semibold text-slate-900 mb-1">{L('E-posta', 'Email')}</h3>
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
              <h3 className="font-semibold text-slate-900 mb-1">{L('Telefon', 'Phone')}</h3>
              <a
                href="tel:+905518291613"
                className="text-slate-800 hover:text-slate-600 text-sm font-medium block py-2 touch-manipulation min-h-[44px] flex items-center"
              >
                0551 829 16 13
              </a>
              <a
                href={whatsappHref(L('Merhaba, voltekno.com üzerinden yazıyorum.', 'Hello, I am writing via voltekno.com.'))}
                target="_blank"
                rel="noopener noreferrer"
                className="inline-flex items-center gap-2 text-sm font-medium text-[#128C7E] hover:underline py-2 min-h-[44px]"
              >
                <WhatsAppIcon className="w-4 h-4" /> {L('WhatsApp ile yazın', 'Message us on WhatsApp')}
              </a>
            </CardContent>
          </Card>
          <Card className="bg-white rounded-2xl border border-slate-200 shadow-sm">
            <CardContent className="p-5">
              <h3 className="font-semibold text-slate-900 mb-1">{L('Adres', 'Address')}</h3>
              <p className="text-slate-600 text-sm">Çaydaçıra Mah. Prof. Dr. Nuri Orhan Bul. No:5 İç Kapı No:17 Merkez/ELAZIĞ</p>
            </CardContent>
          </Card>
          <Card className="bg-white rounded-2xl border border-slate-200 shadow-sm">
            <CardContent className="p-5">
              <h3 className="font-semibold text-slate-900 mb-1">{L('Çalışma saatleri', 'Working hours')}</h3>
              <div className="text-slate-600 text-sm space-y-0.5">
                <p>{L('Pzt - Cuma: 09:00 - 18:00', 'Mon - Fri: 09:00 - 18:00')}</p>
                <p>{L('Cumartesi: 10:00 - 16:00', 'Saturday: 10:00 - 16:00')}</p>
                <p>{L('Pazar: Kapalı', 'Sunday: Closed')}</p>
              </div>
            </CardContent>
          </Card>
        </div>
      </div>
    </ClassicPageShell>
  )
}
