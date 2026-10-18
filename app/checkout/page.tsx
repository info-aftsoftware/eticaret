'use client'

import React, { useMemo, useRef, useState } from 'react'
import Link from 'next/link'
import Image from 'next/image'
import { useRouter } from 'next/navigation'
import {
  AlertCircle,
  ArrowLeft,
  Banknote,
  Building2,
  Check,
  ChevronDown,
  CreditCard,
  Loader2,
  Lock,
  MapPin,
  Package,
  ShoppingCart,
  User,
} from 'lucide-react'
import { useCartStore } from '@/lib/store/useCartStore'
import { trackBeginCheckout, trackAddPaymentInfo, cartItemToGa } from '@/lib/analytics'
import { useAuthStore, getAuthToken } from '@/lib/store/useAuthStore'
import { fmtPrice } from '@/lib/format'
import { useCurrencyStore } from '@/lib/store/useCurrencyStore'
import { useExchangeRates } from '@/lib/useExchangeRates'
import { getAddresses } from '@/lib/firebase/firestore'
import {
  computeOrderTotals,
  BANK_TRANSFER_DISCOUNT_RATE,
  BANK_TRANSFER_PAYMENT_DAYS,
  VAT_RATE,
} from '@/lib/store-config'
import { cartLogistics, shippingFeeFor } from '@/lib/shipping/fee'
import { TR_CITIES, getDistrictsByCity } from '@/lib/tr-cities'
import {
  formatTrPhone,
  isValidEmail,
  isValidPostalCode,
  isValidTrPhone,
  onlyDigits,
  validateBilling,
} from '@/lib/checkout-validation'
import { LegalDocumentDialog, LegalLink } from '@/components/LegalDocumentDialog'
import { CartQuoteNotice } from '@/components/CartQuoteNotice'
import type { LegalSlug } from '@/lib/legal/documents'
import { useL } from '@/lib/i18n-inline'

type FormState = {
  name: string
  email: string
  phone: string
  addressLine: string
  city: string
  district: string
  postalCode: string
  country: string
  billingType: 'individual' | 'company'
  idNumber: string
  companyName: string
  taxId: string
  taxOffice: string
  notes: string
  useDifferentBillingAddress: boolean
  billingAddressLine: string
  billingCity: string
  billingDistrict: string
  billingPostalCode: string
}

type SavedAddress = {
  id: string
  title?: string
  name: string
  phone: string
  addressLine: string
  city: string
  district: string
  postalCode: string
  country?: string
  isDefault?: boolean
}

/** Kayıtlı adresteki il adını listedeki yazımla eşleştirir (büyük/küçük harf farkı vb.) */
function matchCity(value: string): string {
  if (!value) return ''
  const v = value.trim().toLocaleLowerCase('tr-TR')
  return TR_CITIES.find((c) => c.name.toLocaleLowerCase('tr-TR') === v)?.name ?? value.trim()
}

function matchDistrict(city: string, value: string): string {
  if (!value) return ''
  const v = value.trim().toLocaleLowerCase('tr-TR')
  return getDistrictsByCity(city).find((d) => d.toLocaleLowerCase('tr-TR') === v) ?? value.trim()
}

const inputCls = (invalid?: boolean) =>
  `w-full h-12 rounded-lg border bg-white px-3.5 text-base text-[#121926] placeholder:text-[#8a99a8] outline-none transition-colors focus:ring-2 disabled:bg-[#f5f7fa] disabled:text-[#5d6e80] ${
    invalid ? 'border-red-500 focus:border-red-500 focus:ring-red-500/15' : 'border-[#d3d9e1] hover:border-[#b8c2ce] focus:border-[#0b2540] focus:ring-[#0b2540]/15'
  }`

function Field({
  id,
  label,
  required,
  error,
  hint,
  className = '',
  children,
}: {
  id: string
  label: string
  required?: boolean
  error?: string
  hint?: React.ReactNode
  className?: string
  children: React.ReactNode
}) {
  const L = useL()
  return (
    <div className={`min-w-0 ${className}`}>
      <label htmlFor={id} className="mb-1.5 block text-sm font-medium text-[#20384e]">
        {label}
        {required ? <span className="text-red-600"> *</span> : <span className="font-normal text-[#5d6e80]"> {L('(isteğe bağlı)', '(optional)')}</span>}
      </label>
      {children}
      {error ? (
        <p id={`${id}-error`} className="mt-1.5 flex items-start gap-1 text-[13px] text-red-600">
          <AlertCircle className="mt-px h-3.5 w-3.5 shrink-0" aria-hidden />
          {error}
        </p>
      ) : hint ? (
        <p id={`${id}-hint`} className="mt-1.5 text-[13px] text-[#5d6e80]">{hint}</p>
      ) : null}
    </div>
  )
}

function Section({ step, title, icon: Icon, children, aside }: {
  step: number
  title: string
  icon: React.ComponentType<{ className?: string }>
  children: React.ReactNode
  aside?: React.ReactNode
}) {
  return (
    <section className="rounded-xl border border-[#e6ebf1] bg-white shadow-[0_1px_2px_rgba(16,24,40,0.04)]" aria-labelledby={`step-${step}`}>
      <header className="flex flex-wrap items-center gap-3 border-b border-[#eef1f5] px-4 py-3.5 sm:px-6">
        <span className="flex h-7 w-7 shrink-0 items-center justify-center rounded-full bg-[#0b2540] text-[13px] font-semibold text-white">{step}</span>
        <h2 id={`step-${step}`} className="flex items-center gap-2 text-base font-semibold text-[#121926] sm:text-[17px]">
          <Icon className="h-[18px] w-[18px] text-[#5d6e80]" aria-hidden />
          {title}
        </h2>
        {aside && <div className="ml-auto text-sm">{aside}</div>}
      </header>
      <div className="px-4 py-5 sm:px-6">{children}</div>
    </section>
  )
}

function CitySelect({ id, value, onChange, invalid, describedBy }: {
  id: string
  value: string
  onChange: (city: string) => void
  invalid?: boolean
  describedBy?: string
}) {
  const L = useL()
  const known = TR_CITIES.some((c) => c.name === value)
  return (
    <div className="relative">
      <select
        id={id}
        value={value}
        onChange={(e) => onChange(e.target.value)}
        aria-invalid={invalid || undefined}
        aria-describedby={describedBy}
        autoComplete="address-level1"
        className={`${inputCls(invalid)} appearance-none pr-10 ${value ? '' : 'text-[#8a99a8]'}`}
      >
        <option value="">{L('İl seçin', 'Select province')}</option>
        {!known && value && <option value={value}>{value}</option>}
        {TR_CITIES.map((c) => (
          <option key={c.name} value={c.name} className="text-[#121926]">{c.name}</option>
        ))}
      </select>
      <ChevronDown className="pointer-events-none absolute right-3 top-1/2 h-4 w-4 -translate-y-1/2 text-[#5d6e80]" aria-hidden />
    </div>
  )
}

function DistrictSelect({ id, city, value, onChange, invalid, describedBy }: {
  id: string
  city: string
  value: string
  onChange: (d: string) => void
  invalid?: boolean
  describedBy?: string
}) {
  const L = useL()
  const districts = getDistrictsByCity(city)
  const known = districts.includes(value)
  return (
    <div className="relative">
      <select
        id={id}
        value={value}
        disabled={!city}
        onChange={(e) => onChange(e.target.value)}
        aria-invalid={invalid || undefined}
        aria-describedby={describedBy}
        autoComplete="address-level2"
        className={`${inputCls(invalid)} appearance-none pr-10 ${value ? '' : 'text-[#8a99a8]'}`}
      >
        <option value="">{city ? L('İlçe seçin', 'Select district') : L('Önce il seçin', 'Select a province first')}</option>
        {!known && value && <option value={value}>{value}</option>}
        {districts.map((d) => (
          <option key={d} value={d} className="text-[#121926]">{d}</option>
        ))}
      </select>
      <ChevronDown className="pointer-events-none absolute right-3 top-1/2 h-4 w-4 -translate-y-1/2 text-[#5d6e80]" aria-hidden />
    </div>
  )
}

function Stepper() {
  const L = useL()
  const steps = [
    { label: L('Sepet', 'Cart'), href: '/cart', state: 'done' as const },
    { label: L('Bilgiler ve ödeme', 'Details & payment'), state: 'current' as const },
    { label: L('Onay', 'Confirmation'), state: 'todo' as const },
  ]
  return (
    <ol className="flex items-center gap-2 text-[13px] sm:text-sm" aria-label={L('Sipariş adımları', 'Checkout steps')}>
      {steps.map((s, i) => (
        <li key={s.label} className="flex min-w-0 items-center gap-2" aria-current={s.state === 'current' ? 'step' : undefined}>
          {i > 0 && <span className="h-px w-4 bg-[#d3d9e1] sm:w-8" aria-hidden />}
          <span
            className={`flex h-6 w-6 shrink-0 items-center justify-center rounded-full text-xs font-semibold ${
              s.state === 'done' ? 'bg-[#0b2540] text-white' : s.state === 'current' ? 'bg-[#f5b400] text-[#111]' : 'bg-[#e6ebf1] text-[#5d6e80]'
            }`}
          >
            {s.state === 'done' ? <Check className="h-3.5 w-3.5" aria-hidden /> : i + 1}
          </span>
          {s.href ? (
            <Link href={s.href} className="hidden truncate text-[#20384e] hover:underline sm:inline">{s.label}</Link>
          ) : (
            <span className={`truncate ${s.state === 'current' ? 'font-semibold text-[#121926]' : 'hidden text-[#5d6e80] sm:inline'}`}>{s.label}</span>
          )}
        </li>
      ))}
    </ol>
  )
}

/** Hata alanlarının sayfadaki sırası (ilk hatalı alana odaklanmak için) */
const FIELD_ORDER = [
  'name', 'email', 'phone', 'city', 'district', 'postalCode', 'addressLine',
  'idNumber', 'companyName', 'taxId', 'taxOffice',
  'billingCity', 'billingDistrict', 'billingPostalCode', 'billingAddressLine', 'terms',
]

export default function CheckoutPage() {
  const L = useL()
  const router = useRouter()
  const currency = useCurrencyStore((s) => s.currency)
  const { rates } = useExchangeRates()
  const formatPrice = (amount: number) => fmtPrice(amount, currency, rates?.rates ?? null)
  const cartItems = useCartStore((state) => state.items)
  const cartTotal = useCartStore((state) => state.getTotalPrice())
  const clearCart = useCartStore((state) => state.clearCart)
  const couponCode = useCartStore((state) => state.couponCode)
  const cartHydrated = useCartStore((state) => state._hasHydrated)
  const { user, isAuthenticated } = useAuthStore()

  const isFromCart = cartItems.length > 0

  const [isSubmitting, setIsSubmitting] = useState(false)
  const [formData, setFormData] = useState<FormState>({
    name: user?.name || '',
    email: user?.email || '',
    phone: user?.phone ? formatTrPhone(user.phone) : '',
    addressLine: '',
    city: '',
    district: '',
    postalCode: '',
    country: 'Türkiye',
    billingType: 'individual',
    idNumber: '',
    companyName: '',
    taxId: '',
    taxOffice: '',
    notes: '',
    useDifferentBillingAddress: false,
    billingAddressLine: '',
    billingCity: '',
    billingDistrict: '',
    billingPostalCode: '',
  })

  const [savedAddresses, setSavedAddresses] = useState<SavedAddress[]>([])
  const [selectedAddressId, setSelectedAddressId] = useState<string | null>(null)
  const [errors, setErrors] = useState<Record<string, string>>({})
  const [generalError, setGeneralError] = useState('')
  const [paymentMethod, setPaymentMethod] = useState<'havale' | 'card'>('havale')
  /** Banka sanal POS yapılandırılmamışsa kart seçeneği pasif (null: henüz bilinmiyor) */
  const [cardAvailable, setCardAvailable] = useState<boolean | null>(null)
  React.useEffect(() => {
    let cancelled = false
    fetch('/api/payments/methods')
      .then((r) => (r.ok ? r.json() : null))
      .then((d) => {
        if (cancelled || !d) return
        setCardAvailable(d.card === true)
        if (d.card !== true) setPaymentMethod('havale')
      })
      .catch(() => {})
    return () => { cancelled = true }
  }, [])
  const [acceptedTerms, setAcceptedTerms] = useState(false)
  const [legalDoc, setLegalDoc] = useState<LegalSlug | null>(null)
  const [couponDiscount, setCouponDiscount] = useState(0)
  const [showNote, setShowNote] = useState(false)
  const [mobileSummaryOpen, setMobileSummaryOpen] = useState(false)
  const errorBannerRef = useRef<HTMLDivElement>(null)

  // Fiyatlar sunucuda katalogdan hesaplanır; istemci yalnızca kalem id + adet gönderir
  const orderItems = useMemo(
    () => cartItems.map((i) => ({ id: i.id, quantity: i.quantity })),
    [cartItems]
  )

  // Sepette uygulanan kuponun indirimini sunucudan al (sipariş sırasında tekrar doğrulanır)
  React.useEffect(() => {
    if (!couponCode || orderItems.length === 0) {
      setCouponDiscount(0)
      return
    }
    let cancelled = false
    fetch('/api/coupons/preview', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ code: couponCode, items: orderItems }),
    })
      .then((r) => r.json())
      .then((d) => { if (!cancelled) setCouponDiscount(d?.success ? Number(d.discount) || 0 : 0) })
      .catch(() => { if (!cancelled) setCouponDiscount(0) })
    return () => { cancelled = true }
  }, [couponCode, orderItems])

  const applyAddress = React.useCallback((address: SavedAddress) => {
    const city = matchCity(address.city)
    setFormData((prev) => ({
      ...prev,
      name: address.name || prev.name,
      phone: address.phone ? formatTrPhone(address.phone) : prev.phone,
      addressLine: address.addressLine,
      city,
      district: matchDistrict(city, address.district),
      postalCode: onlyDigits(address.postalCode || '').slice(0, 5),
      country: address.country || 'Türkiye',
    }))
    setErrors({})
  }, [])

  // Üyenin kayıtlı adresleri (varsayılan adres otomatik seçilir)
  React.useEffect(() => {
    if (!isAuthenticated || !user?.id) return
    getAddresses(user.id)
      .then((addresses) => {
        const list = addresses as SavedAddress[]
        setSavedAddresses(list)
        const def = list.find((a) => a.isDefault) ?? list[0]
        if (def) {
          setSelectedAddressId(def.id)
          applyAddress(def)
        }
      })
      .catch((err) => console.error('Error loading addresses:', err))
  }, [isAuthenticated, user?.id, applyAddress])

  // Oturum sonradan yüklenirse iletişim bilgilerini doldur (kullanıcının yazdıklarının üzerine yazmadan)
  React.useEffect(() => {
    if (!user) return
    setFormData((prev) => ({
      ...prev,
      name: prev.name || user.name || '',
      email: prev.email || user.email || '',
      phone: prev.phone || (user.phone ? formatTrPhone(user.phone) : ''),
    }))
  }, [user])

  React.useEffect(() => {
    if (cartHydrated) return
    try {
      useCartStore.persist?.rehydrate?.()
    } catch {}
    // Yedek: rehydrate tamamlanmazsa yalnızca bayrak açılır; sepet içeriği (üye/misafir ayrımı) store'da kalır
    const timer = window.setTimeout(() => {
      if (!useCartStore.getState()._hasHydrated) useCartStore.setState({ _hasHydrated: true })
    }, 900)
    return () => window.clearTimeout(timer)
  }, [cartHydrated])

  // Sunucuyla aynı hesaplayıcı (lib/store-config): indirimler KDV matrahından düşülür
  // Form alanlarına her tuşta yeniden hesaplanmasın
  const shippingFee = useMemo(() => shippingFeeFor(cartLogistics(cartItems)), [cartItems])
  const totals = useMemo(
    () => computeOrderTotals({ subtotal: cartTotal, couponDiscount, paymentMethod: paymentMethod === 'havale' ? 'bank_transfer' : 'card', shippingFee }),
    [cartTotal, couponDiscount, paymentMethod, shippingFee]
  )
  const { subtotal, tax, shipping, total, paymentDiscount } = totals
  const itemCount = cartItems.reduce((n, i) => n + i.quantity, 0)

  /** Sipariş oluştu ve sayfadan ayrılınıyor (banka / başarı sayfası): sepet boşalınca /cart'a atlamasın */
  const leavingRef = useRef(false)

  React.useEffect(() => {
    if (!cartHydrated || leavingRef.current) return
    if (!isFromCart) router.push('/cart')
  }, [cartHydrated, isFromCart, router])

  // GA4: ödeme adımına başlama (sayfa başına bir kez)
  const beginCheckoutSent = useRef(false)
  React.useEffect(() => {
    if (!cartHydrated || !isFromCart || beginCheckoutSent.current) return
    beginCheckoutSent.current = true
    void trackBeginCheckout(cartItems.map(cartItemToGa), couponCode)
  }, [cartHydrated, isFromCart, cartItems, couponCode])

  const setField = <K extends keyof FormState>(name: K, value: FormState[K]) => {
    setFormData((prev) => ({ ...prev, [name]: value }))
    if (errors[name]) setErrors((prev) => ({ ...prev, [name]: '' }))
  }

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
    const name = e.target.name as keyof FormState
    let value = e.target.value
    if (name === 'phone') value = formatTrPhone(value)
    if (name === 'idNumber') value = onlyDigits(value).slice(0, 11)
    if (name === 'taxId') value = onlyDigits(value).slice(0, 10)
    if (name === 'postalCode' || name === 'billingPostalCode') value = onlyDigits(value).slice(0, 5)
    // Kayıtlı adres seçiliyken adres alanı değişirse "yeni adres" sayılır
    if (selectedAddressId && ['addressLine', 'postalCode'].includes(name)) setSelectedAddressId(null)
    setField(name, value as never)
  }

  /** Tek alan doğrulaması (alandan çıkınca); boş zorunlu alanlar yalnızca gönderimde işaretlenir */
  const validateField = (name: string, value: string) => {
    let msg = ''
    if (name === 'email' && value && !isValidEmail(value)) msg = L('Geçerli bir e-posta adresi girin.', 'Enter a valid email address.')
    if (name === 'phone' && value && !isValidTrPhone(value)) msg = L('Telefon numarası 10 haneli olmalı (5xx xxx xx xx).', 'Phone number must be 10 digits (5xx xxx xx xx).')
    if ((name === 'postalCode' || name === 'billingPostalCode') && value && !isValidPostalCode(value)) msg = L('Geçerli bir posta kodu girin (5 hane).', 'Enter a valid postal code (5 digits).')
    if (['idNumber', 'taxId'].includes(name) && value) {
      msg = validateBilling({ ...formData, [name]: value })[name] ?? ''
    }
    setErrors((prev) => ({ ...prev, [name]: msg }))
  }

  const validateAll = (): Record<string, string> => {
    const f = formData
    const err: Record<string, string> = {}
    if (!f.name.trim() || f.name.trim().length < 3) err.name = L('Ad ve soyadınızı girin.', 'Enter your full name.')
    if (!f.email.trim()) err.email = L('E-posta zorunludur.', 'Email is required.')
    else if (!isValidEmail(f.email)) err.email = L('Geçerli bir e-posta adresi girin.', 'Enter a valid email address.')
    if (!f.phone.trim()) err.phone = L('Telefon zorunludur.', 'Phone is required.')
    else if (!isValidTrPhone(f.phone)) err.phone = L('Telefon numarası 10 haneli olmalı (5xx xxx xx xx).', 'Phone number must be 10 digits (5xx xxx xx xx).')
    if (!f.city) err.city = L('İl seçin.', 'Select a province.')
    if (!f.district) err.district = L('İlçe seçin.', 'Select a district.')
    if (f.postalCode && !isValidPostalCode(f.postalCode)) err.postalCode = L('Geçerli bir posta kodu girin (5 hane).', 'Enter a valid postal code (5 digits).')
    if (f.addressLine.trim().length < 10) err.addressLine = f.addressLine.trim() ? L('Adresinizi mahalle, sokak ve kapı no ile eksiksiz yazın.', 'Enter your full address including neighborhood, street and building number.') : L('Adres zorunludur.', 'Address is required.')
    Object.assign(err, validateBilling(f))
    if (f.useDifferentBillingAddress) {
      if (!f.billingCity) err.billingCity = L('İl seçin.', 'Select a province.')
      if (!f.billingDistrict) err.billingDistrict = L('İlçe seçin.', 'Select a district.')
      if (f.billingPostalCode && !isValidPostalCode(f.billingPostalCode)) err.billingPostalCode = L('Geçerli bir posta kodu girin (5 hane).', 'Enter a valid postal code (5 digits).')
      if (f.billingAddressLine.trim().length < 10) err.billingAddressLine = L('Fatura adresini eksiksiz yazın.', 'Enter the full billing address.')
    }
    if (!acceptedTerms) err.terms = L("Siparişi tamamlamak için Ön Bilgilendirme Formu ve Mesafeli Satış Sözleşmesi'ni onaylamalısınız.", 'To place your order, you must accept the Preliminary Information Form and the Distance Sales Agreement.')
    return err
  }

  const focusFirstError = (err: Record<string, string>) => {
    const first = FIELD_ORDER.find((k) => err[k])
    const el = first ? document.getElementById(first === 'terms' ? 'acceptTerms' : first) : null
    if (el) {
      el.scrollIntoView({ behavior: 'smooth', block: 'center' })
      window.setTimeout(() => (el as HTMLElement).focus({ preventScroll: true }), 300)
    }
  }

  const createOrderWithApi = async (method: 'bank_transfer' | 'card') => {
    // Üye siparişi hesaba bağlansın diye güncel (yenilenmiş) Firebase token gönderilir
    const authToken = isAuthenticated ? await getAuthToken() : null
    const f = formData
    const response = await fetch('/api/orders', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        ...(authToken ? { Authorization: `Bearer ${authToken}` } : {}),
      },
      body: JSON.stringify({
        customer: {
          name: f.name.trim(),
          email: f.email.trim(),
          phone: f.phone,
          addressLine: f.addressLine.trim(),
          city: f.city,
          district: f.district,
          postalCode: f.postalCode,
          country: f.country || 'Türkiye',
          billingType: f.billingType,
          idNumber: f.billingType === 'individual' ? f.idNumber : '',
          billingName: f.billingType === 'company' ? f.companyName.trim() : f.name.trim(),
          taxId: f.billingType === 'company' ? f.taxId : '',
          taxOffice: f.billingType === 'company' ? f.taxOffice.trim() : '',
          billingAddress: f.useDifferentBillingAddress ? f.billingAddressLine.trim() : '',
          billingCity: f.useDifferentBillingAddress ? f.billingCity : '',
          billingDistrict: f.useDifferentBillingAddress ? f.billingDistrict : '',
          billingPostalCode: f.useDifferentBillingAddress ? f.billingPostalCode : '',
        },
        items: orderItems,
        couponCode: couponCode || undefined,
        notes: f.notes.trim() || undefined,
        acceptedTerms,
        paymentMethod: method,
      }),
    })

    const data = await response.json().catch(() => null)
    if (!response.ok || !data?.success) {
      const e = new Error(data?.error || L('Sipariş oluşturulamadı.', 'The order could not be created.')) as Error & { code?: string; fields?: Record<string, string> }
      e.code = data?.code
      e.fields = data?.fields
      throw e
    }
    return data as {
      success: true
      orderId: string
      pricing?: { total: number; tax?: number; shipping?: number }
      payment?: { bank: string; form: { action: string; fields: Record<string, string> } }
    }
  }

  /** Bankanın 3D Secure sayfasına imzalı formla geçiş (kart bilgisi sitemizden geçmez) */
  const submitToBank = (form: { action: string; fields: Record<string, string> }) => {
    const el = document.createElement('form')
    el.method = 'POST'
    el.action = form.action
    el.acceptCharset = 'UTF-8'
    for (const [name, value] of Object.entries(form.fields)) {
      const input = document.createElement('input')
      input.type = 'hidden'
      input.name = name
      input.value = value
      el.appendChild(input)
    }
    document.body.appendChild(el)
    el.submit()
  }

  const showGeneralError = (message: string) => {
    setGeneralError(message)
    window.setTimeout(() => errorBannerRef.current?.scrollIntoView({ behavior: 'smooth', block: 'center' }), 50)
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    if (leavingRef.current || isSubmitting) return
    setGeneralError('')

    const err = validateAll()
    if (Object.values(err).some(Boolean)) {
      setErrors(err)
      focusFirstError(err)
      return
    }
    setErrors({})

    const gaItems = cartItems.map(cartItemToGa)
    void trackAddPaymentInfo(gaItems, paymentMethod === 'card' ? 'card' : 'bank_transfer')
    const lastOrder = (orderNo: string, pricing?: { total: number; tax?: number; shipping?: number }) => {
      try {
        sessionStorage.setItem('last-order', JSON.stringify({
          orderNo,
          total: pricing?.total ?? total,
          tax: pricing?.tax ?? tax,
          shipping: pricing?.shipping ?? shipping,
          coupon: couponCode,
          gaItems,
          paymentMethod: paymentMethod === 'card' ? 'card' : 'bank_transfer',
          // Başarı sayfasındaki "hesap oluştur" önerisi için (URL'ye kişisel veri yazılmaz)
          guest: !isAuthenticated ? { name: formData.name.trim(), email: formData.email.trim(), phone: formData.phone } : null,
        }))
      } catch {}
    }

    try {
      setIsSubmitting(true)
      if (paymentMethod === 'card') {
        const data = await createOrderWithApi('card')
        if (!data.payment?.form) {
          showGeneralError(L('Banka ödeme sayfası açılamadı. Lütfen tekrar deneyin veya Havale/EFT seçin.', 'The bank payment page could not be opened. Please try again or choose Bank Transfer (EFT).'))
          return
        }
        lastOrder(data.orderId, data.pricing)
        // Sepet burada temizlenmez: ödeme tamamlanmazsa müşteri sepetine döner. Başarı sayfası temizler.
        leavingRef.current = true
        submitToBank(data.payment.form)
        return
      }

      const data = await createOrderWithApi('bank_transfer')
      lastOrder(data.orderId, data.pricing)
      leavingRef.current = true
      router.push(`/checkout/success?order_id=${encodeURIComponent(data.orderId)}&payment=bank_transfer`)
      if (isFromCart) clearCart()
    } catch (error) {
      const ex = error as Error & { code?: string; fields?: Record<string, string> }
      if (ex.code === 'CARD_UNAVAILABLE') {
        setPaymentMethod('havale')
        showGeneralError(L('Kartla ödeme şu anda kullanılamıyor. Ödeme yöntemi Havale/EFT olarak değiştirildi; siparişi bu şekilde tamamlayabilirsiniz.', 'Card payment is currently unavailable. Your payment method has been switched to Bank Transfer (EFT); you can complete your order this way.'))
      } else if (ex.fields && Object.keys(ex.fields).length > 0) {
        setErrors(ex.fields)
        focusFirstError(ex.fields)
      } else {
        showGeneralError(ex?.message || L('Sipariş oluşturulurken bir hata oluştu. Lütfen tekrar deneyin.', 'An error occurred while creating your order. Please try again.'))
      }
    } finally {
      // Yönlendirme sürerken düğme kilitli kalır
      if (!leavingRef.current) setIsSubmitting(false)
    }
  }

  if (!cartHydrated || (!isFromCart && leavingRef.current)) {
    return (
      <div className="flex min-h-[60vh] items-center justify-center bg-[#f5f7fa] px-4">
        <div className="flex items-center gap-3 text-[#20384e]">
          <Loader2 className="h-5 w-5 animate-spin" aria-hidden />
          <span>{leavingRef.current ? L('Siparişiniz tamamlanıyor…', 'Completing your order…') : L('Sepetiniz yükleniyor…', 'Loading your cart…')}</span>
        </div>
      </div>
    )
  }

  if (!isFromCart) {
    return (
      <div className="flex min-h-[60vh] items-center justify-center bg-[#f5f7fa] px-4">
        <div className="w-full max-w-md rounded-xl border border-[#e6ebf1] bg-white p-8 text-center">
          <div className="mx-auto mb-4 flex h-14 w-14 items-center justify-center rounded-full bg-[#f1f4f8]">
            <ShoppingCart className="h-7 w-7 text-[#0b2540]" aria-hidden />
          </div>
          <h1 className="text-xl font-semibold text-[#121926]">{L('Sepetiniz boş', 'Your cart is empty')}</h1>
          <p className="mt-2 text-sm text-[#5d6e80]">{L('Ödeme adımına geçmek için önce sepetinize ürün ekleyin.', 'Add products to your cart before proceeding to checkout.')}</p>
          <Link href="/products" className="mt-6 inline-flex h-11 items-center justify-center rounded-lg bg-[#0b2540] px-5 text-sm font-semibold text-white hover:bg-[#12335a]">
            {L('Ürünlere göz atın', 'Browse products')}
          </Link>
        </div>
      </div>
    )
  }

  const errorCount = Object.values(errors).filter(Boolean).length
  const f = formData
  const describe = (id: string) => (errors[id] ? `${id}-error` : undefined)

  const summaryLines = (
    <dl className="space-y-2.5 text-sm">
      <div className="flex justify-between gap-3">
        <dt className="text-[#5d6e80]">{L('Ara toplam', 'Subtotal')} <span className="text-xs">{L('(KDV hariç)', '(excl. VAT)')}</span></dt>
        <dd className="font-medium text-[#121926] tabular-nums">{formatPrice(subtotal)}</dd>
      </div>
      {couponDiscount > 0 && (
        <div className="flex justify-between gap-3 text-emerald-700">
          <dt>{L('Kupon', 'Coupon')} <span className="rounded bg-emerald-50 px-1.5 py-0.5 font-mono text-xs">{couponCode}</span></dt>
          <dd className="font-medium tabular-nums">−{formatPrice(couponDiscount)}</dd>
        </div>
      )}
      {paymentDiscount > 0 && (
        <div className="flex justify-between gap-3 text-emerald-700">
          <dt>{L(`Havale/EFT indirimi (%${BANK_TRANSFER_DISCOUNT_RATE})`, `Bank transfer discount (${BANK_TRANSFER_DISCOUNT_RATE}%)`)}</dt>
          <dd className="font-medium tabular-nums">−{formatPrice(paymentDiscount)}</dd>
        </div>
      )}
      <div className="flex justify-between gap-3">
        <dt className="text-[#5d6e80]">{L(`KDV (%${VAT_RATE})`, `VAT (${VAT_RATE}%)`)}</dt>
        <dd className="font-medium text-[#121926] tabular-nums">{formatPrice(tax)}</dd>
      </div>
      <div className="flex justify-between gap-3">
        <dt className="text-[#5d6e80]">{L('Kargo', 'Shipping')}</dt>
        <dd className="font-medium tabular-nums">
          <span className="text-[#121926]">{formatPrice(shipping)}</span>
        </dd>
      </div>
      <div className="flex items-baseline justify-between gap-3 border-t border-[#e6ebf1] pt-3">
        <dt className="text-base font-semibold text-[#121926]">{L('Toplam', 'Total')} <span className="text-xs font-normal text-[#5d6e80]">{L('(KDV dahil)', '(VAT incl.)')}</span></dt>
        <dd className="text-xl font-bold text-[#0b2540] tabular-nums">{formatPrice(total)}</dd>
      </div>
    </dl>
  )

  const itemList = (
    <ul className="divide-y divide-[#eef1f5]">
      {cartItems.map((item) => (
        <li key={item.id} className="flex items-center gap-3 py-3 first:pt-0">
          <div className="relative h-14 w-14 shrink-0 overflow-hidden rounded-lg border border-[#e6ebf1] bg-white">
            {item.image ? (
              <Image src={item.image} alt="" fill className="object-contain p-1" sizes="56px" />
            ) : (
              <div className="flex h-full w-full items-center justify-center"><Package className="h-6 w-6 text-[#b8c2ce]" aria-hidden /></div>
            )}
            <span className="absolute -right-0 -top-0 flex h-5 min-w-5 items-center justify-center rounded-bl-md bg-[#0b2540] px-1 text-[11px] font-semibold text-white">{item.quantity}</span>
          </div>
          <div className="min-w-0 flex-1">
            <p className="line-clamp-2 text-sm font-medium leading-snug text-[#121926]">{item.name}</p>
            {item.selectedVariant?.label && <p className="mt-0.5 text-xs text-[#5d6e80]">{item.selectedVariant.label}</p>}
            <p className="mt-0.5 text-xs text-[#5d6e80]">{L(`${item.quantity} adet`, `${item.quantity} pcs`)} × {formatPrice(item.price)}</p>
          </div>
          <span className="shrink-0 text-sm font-semibold text-[#121926] tabular-nums">{formatPrice(item.price * item.quantity)}</span>
        </li>
      ))}
    </ul>
  )

  return (
    <div className="min-h-screen bg-[#f5f7fa] pb-safe">
      <div className="border-b border-[#e6ebf1] bg-white">
        <div className="container mx-auto flex max-w-6xl flex-col gap-3 px-4 py-4 sm:flex-row sm:items-center sm:justify-between sm:px-6">
          <div className="flex items-center gap-3">
            <Link href="/cart" className="inline-flex h-9 w-9 items-center justify-center rounded-lg border border-[#e6ebf1] text-[#20384e] hover:bg-[#f5f7fa]" aria-label={L('Sepete dön', 'Back to cart')}>
              <ArrowLeft className="h-4 w-4" aria-hidden />
            </Link>
            <h1 className="text-xl font-bold text-[#121926] sm:text-2xl">{L('Güvenli Ödeme', 'Secure Checkout')}</h1>
            <span className="hidden items-center gap-1 rounded-full bg-emerald-50 px-2.5 py-1 text-xs font-medium text-emerald-700 sm:inline-flex">
              <Lock className="h-3 w-3" aria-hidden /> {L('SSL korumalı', 'SSL secured')}
            </span>
          </div>
          <Stepper />
        </div>
      </div>

      <div className="container mx-auto max-w-6xl px-4 py-5 sm:px-6 sm:py-8">
        {/* Mobil: daraltılabilir sipariş özeti */}
        <div className="mb-4 overflow-hidden rounded-xl border border-[#e6ebf1] bg-white lg:hidden">
          <button
            type="button"
            onClick={() => setMobileSummaryOpen((v) => !v)}
            aria-expanded={mobileSummaryOpen}
            className="flex w-full items-center justify-between gap-3 px-4 py-3.5 text-left"
          >
            <span className="flex items-center gap-2 text-sm font-medium text-[#20384e]">
              <ShoppingCart className="h-4 w-4" aria-hidden />
              {L(`Sipariş özeti (${itemCount} ürün)`, `Order summary (${itemCount} ${itemCount === 1 ? 'item' : 'items'})`)}
              <ChevronDown className={`h-4 w-4 transition-transform ${mobileSummaryOpen ? 'rotate-180' : ''}`} aria-hidden />
            </span>
            <span className="text-base font-bold text-[#0b2540] tabular-nums">{formatPrice(total)}</span>
          </button>
          {mobileSummaryOpen && (
            <div className="space-y-4 border-t border-[#eef1f5] px-4 py-4">
              {itemList}
              {summaryLines}
            </div>
          )}
        </div>

        {(generalError || errorCount > 0) && (
          <div ref={errorBannerRef} role="alert" className="mb-5 flex items-start gap-3 rounded-xl border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-800">
            <AlertCircle className="mt-0.5 h-5 w-5 shrink-0" aria-hidden />
            <div>
              {generalError ? <p>{generalError}</p> : <p>{L(`Lütfen işaretli ${errorCount > 1 ? `${errorCount} alanı` : 'alanı'} kontrol edin.`, errorCount > 1 ? `Please check the ${errorCount} highlighted fields.` : 'Please check the highlighted field.')}</p>}
            </div>
          </div>
        )}

        <form onSubmit={handleSubmit} noValidate>
          <div className="grid min-w-0 grid-cols-1 gap-5 lg:grid-cols-[minmax(0,1fr)_380px] lg:gap-8">
            <div className="min-w-0 space-y-5">
              {/* 1. İletişim */}
              <Section
                step={1}
                title={L('İletişim bilgileri', 'Contact information')}
                icon={User}
                aside={!isAuthenticated ? (
                  <span className="text-[#5d6e80]">{L('Üye misiniz?', 'Have an account?')} <Link href="/login?redirect=/checkout" className="font-medium text-[#0b2540] underline-offset-2 hover:underline">{L('Giriş yapın', 'Sign in')}</Link></span>
                ) : undefined}
              >
                <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
                  <Field id="name" label={L('Ad Soyad', 'Full name')} required error={errors.name} className="sm:col-span-2">
                    <input id="name" name="name" autoComplete="name" value={f.name} onChange={handleInputChange}
                      aria-invalid={!!errors.name || undefined} aria-describedby={describe('name')} className={inputCls(!!errors.name)} />
                  </Field>
                  <Field id="email" label={L('E-posta', 'Email')} required error={errors.email} hint={L('Sipariş onayı ve kargo bilgisi bu adrese gönderilir.', 'Order confirmation and shipping updates will be sent to this address.')}>
                    <input id="email" name="email" type="email" autoComplete="email" inputMode="email" value={f.email} onChange={handleInputChange}
                      onBlur={(e) => validateField('email', e.target.value)}
                      aria-invalid={!!errors.email || undefined} aria-describedby={errors.email ? 'email-error' : 'email-hint'} className={inputCls(!!errors.email)} />
                  </Field>
                  <Field id="phone" label={L('Cep telefonu', 'Mobile phone')} required error={errors.phone} hint={L('Kargo firması teslimat için arayabilir.', 'The courier may call you about the delivery.')}>
                    <div className="relative">
                      <span className="pointer-events-none absolute left-3.5 top-1/2 -translate-y-1/2 text-base text-[#5d6e80]">+90</span>
                      <input id="phone" name="phone" type="tel" inputMode="tel" autoComplete="tel-national" placeholder="5xx xxx xx xx"
                        value={f.phone} onChange={handleInputChange} onBlur={(e) => validateField('phone', e.target.value)}
                        aria-invalid={!!errors.phone || undefined} aria-describedby={errors.phone ? 'phone-error' : 'phone-hint'} className={`${inputCls(!!errors.phone)} pl-12`} />
                    </div>
                  </Field>
                </div>
              </Section>

              {/* 2. Teslimat adresi */}
              <Section
                step={2}
                title={L('Teslimat adresi', 'Shipping address')}
                icon={MapPin}
                aside={isAuthenticated && savedAddresses.length > 0 ? (
                  <Link href="/profile?tab=addresses" className="font-medium text-[#0b2540] underline-offset-2 hover:underline">{L('Adreslerim', 'My addresses')}</Link>
                ) : undefined}
              >
                {isAuthenticated && savedAddresses.length > 0 && (
                  <fieldset className="mb-5">
                    <legend className="mb-2 text-sm font-medium text-[#20384e]">{L('Kayıtlı adreslerim', 'My saved addresses')}</legend>
                    <div className="grid grid-cols-1 gap-2.5 sm:grid-cols-2">
                      {savedAddresses.map((address) => {
                        const active = selectedAddressId === address.id
                        return (
                          <label key={address.id} className={`flex cursor-pointer items-start gap-3 rounded-lg border p-3 transition-colors ${active ? 'border-[#0b2540] bg-[#f1f4f8] ring-1 ring-[#0b2540]' : 'border-[#d3d9e1] hover:border-[#b8c2ce]'}`}>
                            <input
                              type="radio"
                              name="savedAddress"
                              checked={active}
                              onChange={() => { setSelectedAddressId(address.id); applyAddress(address) }}
                              className="mt-1 h-4 w-4 accent-[#0b2540]"
                            />
                            <span className="min-w-0 text-sm">
                              <span className="flex items-center gap-2 font-medium text-[#121926]">
                                {address.title || L('Adres', 'Address')}
                                {address.isDefault && <span className="rounded bg-[#e6ebf1] px-1.5 py-0.5 text-[11px] font-medium text-[#20384e]">{L('Varsayılan', 'Default')}</span>}
                              </span>
                              <span className="mt-0.5 block truncate text-[#5d6e80]">{address.addressLine}</span>
                              <span className="block text-xs text-[#5d6e80]">{address.district} / {address.city}</span>
                            </span>
                          </label>
                        )
                      })}
                    </div>
                  </fieldset>
                )}
                <div className="grid grid-cols-1 gap-4 sm:grid-cols-6">
                  <Field id="city" label={L('İl', 'Province')} required error={errors.city} className="sm:col-span-2">
                    <CitySelect id="city" value={f.city} invalid={!!errors.city} describedBy={describe('city')}
                      onChange={(city) => { setSelectedAddressId(null); setFormData((p) => ({ ...p, city, district: '' })); setErrors((p) => ({ ...p, city: '', district: '' })) }} />
                  </Field>
                  <Field id="district" label={L('İlçe', 'District')} required error={errors.district} className="sm:col-span-2">
                    <DistrictSelect id="district" city={f.city} value={f.district} invalid={!!errors.district} describedBy={describe('district')}
                      onChange={(d) => { setSelectedAddressId(null); setField('district', d) }} />
                  </Field>
                  <Field id="postalCode" label={L('Posta kodu', 'Postal code')} error={errors.postalCode} className="sm:col-span-2">
                    <input id="postalCode" name="postalCode" inputMode="numeric" autoComplete="postal-code" placeholder="34000"
                      value={f.postalCode} onChange={handleInputChange} onBlur={(e) => validateField('postalCode', e.target.value)}
                      aria-invalid={!!errors.postalCode || undefined} aria-describedby={describe('postalCode')} className={inputCls(!!errors.postalCode)} />
                  </Field>
                  <Field id="addressLine" label={L('Açık adres', 'Street address')} required error={errors.addressLine} hint={L('Mahalle, cadde/sokak, bina ve daire numarası', 'Neighborhood, street, building and apartment number')} className="sm:col-span-6">
                    <textarea id="addressLine" name="addressLine" autoComplete="street-address" rows={3} value={f.addressLine} onChange={handleInputChange}
                      aria-invalid={!!errors.addressLine || undefined} aria-describedby={errors.addressLine ? 'addressLine-error' : 'addressLine-hint'}
                      className={`${inputCls(!!errors.addressLine)} h-auto min-h-[88px] py-3 leading-relaxed`} />
                  </Field>
                </div>
                <div className="mt-4">
                  {showNote || f.notes ? (
                    <Field id="notes" label={L('Sipariş notu', 'Order note')}>
                      <textarea id="notes" name="notes" rows={2} maxLength={2000} value={f.notes} onChange={handleInputChange}
                        placeholder={L('Teslimat veya sipariş ile ilgili eklemek istedikleriniz', 'Anything you would like to add about your delivery or order')}
                        className={`${inputCls(false)} h-auto py-3`} />
                    </Field>
                  ) : (
                    <button type="button" onClick={() => setShowNote(true)} className="text-sm font-medium text-[#0b2540] underline-offset-2 hover:underline">
                      {L('+ Sipariş notu ekle', '+ Add order note')}
                    </button>
                  )}
                </div>
              </Section>

              {/* 3. Fatura */}
              <Section step={3} title={L('Fatura bilgileri', 'Billing information')} icon={Building2}>
                <div role="radiogroup" aria-label={L('Fatura türü', 'Invoice type')} className="mb-5 inline-flex rounded-lg border border-[#d3d9e1] bg-[#f5f7fa] p-1">
                  {([
                    ['individual', L('Bireysel', 'Individual')],
                    ['company', L('Kurumsal', 'Corporate')],
                  ] as const).map(([value, label]) => (
                    <button
                      key={value}
                      type="button"
                      role="radio"
                      aria-checked={f.billingType === value}
                      onClick={() => { setField('billingType', value); setErrors((p) => ({ ...p, idNumber: '', companyName: '', taxId: '', taxOffice: '' })) }}
                      className={`h-9 rounded-md px-4 text-sm font-medium transition-colors ${f.billingType === value ? 'bg-white text-[#0b2540] shadow-sm ring-1 ring-[#d3d9e1]' : 'text-[#5d6e80] hover:text-[#20384e]'}`}
                    >
                      {label}
                    </button>
                  ))}
                </div>

                {f.billingType === 'individual' ? (
                  <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
                    <Field id="idNumber" label={L('T.C. kimlik no', 'Turkish ID number')} error={errors.idNumber} hint={L('E-arşiv faturanız için; boş bırakabilirsiniz.', 'For your e-archive invoice; you may leave this blank.')}>
                      <input id="idNumber" name="idNumber" inputMode="numeric" autoComplete="off" placeholder={L('11 haneli', '11 digits')}
                        value={f.idNumber} onChange={handleInputChange} onBlur={(e) => validateField('idNumber', e.target.value)}
                        aria-invalid={!!errors.idNumber || undefined} aria-describedby={errors.idNumber ? 'idNumber-error' : 'idNumber-hint'} className={inputCls(!!errors.idNumber)} />
                    </Field>
                  </div>
                ) : (
                  <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
                    <Field id="companyName" label={L('Firma ünvanı', 'Company name')} required error={errors.companyName} className="sm:col-span-2">
                      <input id="companyName" name="companyName" autoComplete="organization" value={f.companyName} onChange={handleInputChange}
                        aria-invalid={!!errors.companyName || undefined} aria-describedby={describe('companyName')} className={inputCls(!!errors.companyName)} />
                    </Field>
                    <Field id="taxId" label={L('Vergi numarası', 'Tax number')} required error={errors.taxId}>
                      <input id="taxId" name="taxId" inputMode="numeric" autoComplete="off" placeholder={L('10 haneli', '10 digits')}
                        value={f.taxId} onChange={handleInputChange} onBlur={(e) => validateField('taxId', e.target.value)}
                        aria-invalid={!!errors.taxId || undefined} aria-describedby={describe('taxId')} className={inputCls(!!errors.taxId)} />
                    </Field>
                    <Field id="taxOffice" label={L('Vergi dairesi', 'Tax office')} required error={errors.taxOffice}>
                      <input id="taxOffice" name="taxOffice" autoComplete="off" value={f.taxOffice} onChange={handleInputChange}
                        aria-invalid={!!errors.taxOffice || undefined} aria-describedby={describe('taxOffice')} className={inputCls(!!errors.taxOffice)} />
                    </Field>
                  </div>
                )}

                <label className="mt-5 flex cursor-pointer items-start gap-3 rounded-lg border border-[#e6ebf1] bg-[#f5f7fa] p-3">
                  <input
                    type="checkbox"
                    checked={!f.useDifferentBillingAddress}
                    onChange={(e) => setField('useDifferentBillingAddress', !e.target.checked)}
                    className="mt-0.5 h-4 w-4 accent-[#0b2540]"
                  />
                  <span className="text-sm text-[#20384e]">{L('Fatura adresim teslimat adresiyle aynı', 'Billing address is the same as shipping address')}</span>
                </label>

                {f.useDifferentBillingAddress && (
                  <div className="mt-4 grid grid-cols-1 gap-4 sm:grid-cols-6">
                    <Field id="billingCity" label={L('Fatura ili', 'Billing province')} required error={errors.billingCity} className="sm:col-span-2">
                      <CitySelect id="billingCity" value={f.billingCity} invalid={!!errors.billingCity} describedBy={describe('billingCity')}
                        onChange={(city) => { setFormData((p) => ({ ...p, billingCity: city, billingDistrict: '' })); setErrors((p) => ({ ...p, billingCity: '', billingDistrict: '' })) }} />
                    </Field>
                    <Field id="billingDistrict" label={L('Fatura ilçesi', 'Billing district')} required error={errors.billingDistrict} className="sm:col-span-2">
                      <DistrictSelect id="billingDistrict" city={f.billingCity} value={f.billingDistrict} invalid={!!errors.billingDistrict} describedBy={describe('billingDistrict')}
                        onChange={(d) => setField('billingDistrict', d)} />
                    </Field>
                    <Field id="billingPostalCode" label={L('Posta kodu', 'Postal code')} error={errors.billingPostalCode} className="sm:col-span-2">
                      <input id="billingPostalCode" name="billingPostalCode" inputMode="numeric" autoComplete="billing postal-code" placeholder="34000"
                        value={f.billingPostalCode} onChange={handleInputChange} onBlur={(e) => validateField('billingPostalCode', e.target.value)}
                        aria-invalid={!!errors.billingPostalCode || undefined} aria-describedby={describe('billingPostalCode')} className={inputCls(!!errors.billingPostalCode)} />
                    </Field>
                    <Field id="billingAddressLine" label={L('Fatura adresi', 'Billing address')} required error={errors.billingAddressLine} className="sm:col-span-6">
                      <textarea id="billingAddressLine" name="billingAddressLine" autoComplete="billing street-address" rows={3} value={f.billingAddressLine} onChange={handleInputChange}
                        aria-invalid={!!errors.billingAddressLine || undefined} aria-describedby={describe('billingAddressLine')}
                        className={`${inputCls(!!errors.billingAddressLine)} h-auto min-h-[88px] py-3 leading-relaxed`} />
                    </Field>
                  </div>
                )}
              </Section>

              {/* 4. Ödeme */}
              <Section step={4} title={L('Ödeme yöntemi', 'Payment method')} icon={CreditCard}>
                <div role="radiogroup" aria-label={L('Ödeme yöntemi', 'Payment method')} className="grid grid-cols-1 gap-3 sm:grid-cols-2">
                  {([
                    {
                      value: 'havale' as const,
                      title: L('Havale / EFT', 'Bank Transfer (EFT)'),
                      icon: Banknote,
                      badge: L(`%${BANK_TRANSFER_DISCOUNT_RATE} indirim`, `${BANK_TRANSFER_DISCOUNT_RATE}% off`),
                      text: L(`Sipariş sonrası IBAN bilgileri gösterilir. ${BANK_TRANSFER_PAYMENT_DAYS} gün içinde ödeme yapmanız yeterli.`, `IBAN details are shown after you place your order. Simply pay within ${BANK_TRANSFER_PAYMENT_DAYS} days.`),
                    },
                    {
                      value: 'card' as const,
                      title: L('Kredi / banka kartı', 'Credit / debit card'),
                      icon: CreditCard,
                      badge: '3D Secure',
                      text: L('Bankanın güvenli ödeme sayfasına yönlendirilirsiniz; kart bilgileriniz sitemizde saklanmaz.', "You'll be redirected to the bank's secure payment page; your card details are never stored on our site."),
                    },
                  ]).map((m) => {
                    const active = paymentMethod === m.value
                    const unavailable = m.value === 'card' && cardAvailable === false
                    return (
                      <label key={m.value} className={`relative flex flex-col gap-2 rounded-lg border p-4 transition-colors ${unavailable ? 'cursor-not-allowed border-[#e6ebf1] bg-[#f7f8fa] opacity-70' : active ? 'cursor-pointer border-[#0b2540] bg-[#f1f4f8] ring-1 ring-[#0b2540]' : 'cursor-pointer border-[#d3d9e1] bg-white hover:border-[#b8c2ce]'}`}>
                        <span className="flex items-center gap-3">
                          <input type="radio" name="paymentMethod" checked={active} disabled={unavailable} onChange={() => setPaymentMethod(m.value)} className="h-4 w-4 accent-[#0b2540]" />
                          <m.icon className="h-5 w-5 text-[#20384e]" aria-hidden />
                          <span className="text-[15px] font-semibold text-[#121926]">{m.title}</span>
                          <span className={`ml-auto shrink-0 rounded-full px-2 py-0.5 text-[11px] font-semibold ${m.value === 'havale' ? 'bg-emerald-50 text-emerald-700 ring-1 ring-emerald-200' : 'bg-white text-[#20384e] ring-1 ring-[#d3d9e1]'}`}>{m.badge}</span>
                        </span>
                        <span className="pl-7 text-[13px] leading-relaxed text-[#5d6e80]">
                          {unavailable ? L('Kartla ödeme yakında kullanıma açılacak. Şimdilik Havale/EFT ile sipariş verebilirsiniz.', 'Card payment will be available soon. For now you can order by bank transfer (EFT).') : m.text}
                        </span>
                      </label>
                    )
                  })}
                </div>
              </Section>
            </div>

            {/* Sağ sütun: özet + onay */}
            <aside className="min-w-0">
              <div className="space-y-4 lg:sticky lg:top-24">
                <div className="rounded-xl border border-[#e6ebf1] bg-white shadow-[0_1px_2px_rgba(16,24,40,0.04)]">
                  <div className="flex items-center justify-between border-b border-[#eef1f5] px-5 py-3.5">
                    <h2 className="text-base font-semibold text-[#121926]">{L('Sipariş özeti', 'Order summary')}</h2>
                    <Link href="/cart" className="text-sm font-medium text-[#0b2540] underline-offset-2 hover:underline">{L('Sepeti düzenle', 'Edit cart')}</Link>
                  </div>
                  <div className="space-y-4 px-5 py-4">
                    <CartQuoteNotice />
                    <div className="hidden max-h-[300px] overflow-y-auto pr-1 lg:block">{itemList}</div>
                    <div className="hidden lg:block">{summaryLines}</div>
                    <div className="lg:hidden">{summaryLines}</div>

                    <div>
                      <label className="flex cursor-pointer items-start gap-3">
                        <input
                          id="acceptTerms"
                          type="checkbox"
                          checked={acceptedTerms}
                          onChange={(e) => {
                            setAcceptedTerms(e.target.checked)
                            if (errors.terms) setErrors((prev) => ({ ...prev, terms: '' }))
                          }}
                          className="mt-0.5 h-[18px] w-[18px] shrink-0 accent-[#0b2540]"
                          aria-invalid={!!errors.terms || undefined}
                          aria-describedby={errors.terms ? 'terms-error' : undefined}
                        />
                        <span className="text-[13px] leading-relaxed text-[#20384e] [&_button]:inline [&_button]:min-h-0 [&_button]:p-0 [&_button]:align-baseline">
                          {L('', 'I have read and accept the ')}
                          <LegalLink slug="on-bilgilendirme-formu" onOpen={setLegalDoc}>{L('Ön Bilgilendirme Formu', 'Preliminary Information Form')}</LegalLink>{L("'nu ve ", ' and the ')}
                          <LegalLink slug="mesafeli-satis-sozlesmesi" onOpen={setLegalDoc}>{L('Mesafeli Satış Sözleşmesi', 'Distance Sales Agreement')}</LegalLink>
                          {L("'ni okudum, onaylıyorum.", '.')}
                        </span>
                      </label>
                      {errors.terms && (
                        <p id="terms-error" className="mt-1.5 flex items-start gap-1 text-[13px] text-red-600">
                          <AlertCircle className="mt-px h-3.5 w-3.5 shrink-0" aria-hidden />
                          {errors.terms}
                        </p>
                      )}
                    </div>

                    <button
                      type="submit"
                      disabled={isSubmitting}
                      aria-busy={isSubmitting}
                      className="flex h-[52px] w-full items-center justify-center gap-2 rounded-lg bg-[#f5b400] px-4 text-base font-semibold text-[#111] shadow-sm transition-colors hover:bg-[#e0a500] focus:outline-none focus-visible:ring-2 focus-visible:ring-[#0b2540] focus-visible:ring-offset-2 disabled:cursor-wait disabled:opacity-70"
                    >
                      {isSubmitting ? (
                        <><Loader2 className="h-5 w-5 animate-spin" aria-hidden />{paymentMethod === 'card' ? L('Bankaya yönlendiriliyor…', 'Redirecting to your bank…') : L('Sipariş oluşturuluyor…', 'Creating your order…')}</>
                      ) : paymentMethod === 'card' ? (
                        <><Lock className="h-[18px] w-[18px]" aria-hidden />{L('Kartla öde', 'Pay by card')}</>
                      ) : (
                        <><Check className="h-5 w-5" aria-hidden />{L('Siparişi onayla', 'Place Order')}</>
                      )}
                    </button>
                    <p className="text-center text-xs text-[#5d6e80]">
                      {paymentMethod === 'card'
                        ? L('Ödeme, bankanızın 3D Secure sayfasında tamamlanır.', "Payment is completed on your bank's 3D Secure page.")
                        : L('Siparişiniz oluşturulur; ödeme bilgileri ekranda ve e-postanızda yer alır.', 'Your order will be created; payment details will be shown on screen and sent to your email.')}
                    </p>
                  </div>
                </div>

              </div>
            </aside>
          </div>
        </form>
        <LegalDocumentDialog slug={legalDoc} onClose={() => setLegalDoc(null)} />
      </div>
    </div>
  )
}
