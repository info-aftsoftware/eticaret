'use client'

import React, { useMemo, useState } from 'react'
import Link from 'next/link'
import Image from 'next/image'
import { useRouter } from 'next/navigation'
import { useCartStore } from '@/lib/store/useCartStore'
import { useAuthStore } from '@/lib/store/useAuthStore'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { Separator } from '@/components/ui/separator'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Textarea } from '@/components/ui/textarea'
import { CheckCircle, Package, Truck, CreditCard, ArrowLeft, AlertCircle, Phone, Mail, MapPin, Building2, User, ShoppingCart } from 'lucide-react'
import { fmtPrice } from '@/lib/format'
import { useCurrencyStore } from '@/lib/store/useCurrencyStore'
import { useExchangeRates } from '@/lib/useExchangeRates'
import { getAddresses } from '@/lib/firebase/firestore'

function onlyDigits(value: string) {
  return value.replace(/\D/g, '')
}

function formatPhoneNumber(value: string) {
  const digits = onlyDigits(value).slice(0, 10)
  const parts = [
    digits.slice(0, 3),
    digits.slice(3, 6),
    digits.slice(6, 8),
    digits.slice(8, 10),
  ].filter(Boolean)
  return parts.join(' ')
}

function readPersistedCartItems() {
  if (typeof window === 'undefined') return []
  try {
    const raw = window.localStorage.getItem('cart-storage')
    if (!raw) return []
    const parsed = JSON.parse(raw)
    return Array.isArray(parsed?.state?.items) ? parsed.state.items : []
  } catch {
    return []
  }
}

export default function CheckoutPage() {
  const router = useRouter()
  const currency = useCurrencyStore((s) => s.currency)
  const { rates } = useExchangeRates()
  const formatPrice = (amount: number) => fmtPrice(amount, currency, rates?.rates ?? null)
  const cartItems = useCartStore((state) => state.items)
  const cartTotal = useCartStore((state) => state.getTotalPrice())
  const clearCart = useCartStore((state) => state.clearCart)
  const cartHydrated = useCartStore((state) => state._hasHydrated)
  const { user, isAuthenticated, token } = useAuthStore()
  
  const isFromCart = cartItems.length > 0

  const [isSubmitting, setIsSubmitting] = useState(false)
  const [formData, setFormData] = useState({
    name: user?.name || '',
    email: user?.email || '',
    phone: user?.phone || '',
    addressLine: '',
    city: '',
    district: '',
    postalCode: '',
    country: 'Türkiye',
    billingType: 'individual' as 'individual' | 'company',
    idNumber: '',
    companyName: '',
    taxId: '',
    taxOffice: '',
    notes: '',
    createAccount: false,
    password: '',
    confirmPassword: '',
    useDifferentBillingAddress: false,
    billingAddressLine: '',
    billingCity: '',
    billingDistrict: '',
  })

  const [savedAddresses, setSavedAddresses] = useState<any[]>([])
  const [selectedAddressId, setSelectedAddressId] = useState<string | null>(null)
  const [checkoutErrors, setCheckoutErrors] = useState<Record<string, string>>({})
  const [paymentMethod, setPaymentMethod] = useState<'havale' | 'card'>('havale')
  const [isTestOrderLoading, setIsTestOrderLoading] = useState(false)
  const orderItems = useMemo(
    () => cartItems.map((i) => ({ id: i.id, name: i.name, price: i.price, quantity: i.quantity })),
    [cartItems]
  )

  // Load saved addresses from Firestore when user is authenticated
  React.useEffect(() => {
    if (isAuthenticated && user?.id) {
      getAddresses(user.id)
        .then((addresses) => {
          setSavedAddresses(addresses)
          const defaultAddress = addresses.find((a) => a.isDefault)
          if (defaultAddress) {
            setSelectedAddressId(defaultAddress.id)
            setFormData(prev => ({
              ...prev,
              name: defaultAddress.name,
              phone: defaultAddress.phone,
              addressLine: defaultAddress.addressLine,
              city: defaultAddress.city,
              district: defaultAddress.district,
              postalCode: defaultAddress.postalCode,
              country: defaultAddress.country || 'Türkiye',
            }))
          }
        })
        .catch((err) => console.error('Error loading addresses:', err))
    }
  }, [isAuthenticated, user?.id])
  React.useEffect(() => {
    if (cartHydrated) return

    try {
      useCartStore.persist?.rehydrate?.()
    } catch {}

    const timer = window.setTimeout(() => {
      const persistedItems = readPersistedCartItems()
      useCartStore.setState({
        items: persistedItems,
        _hasHydrated: true,
      })
    }, 900)

    return () => window.clearTimeout(timer)
  }, [cartHydrated])

  const subtotal = cartTotal
  
  const tax = subtotal * 0.20
  const shipping = subtotal > 3000 ? 0 : 50
  const total = subtotal + tax + shipping

  React.useEffect(() => {
    if (!cartHydrated) return
    if (!isFromCart) router.push('/cart')
  }, [cartHydrated, isFromCart, router])

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
    const { name, value } = e.target
    let nextValue = value
    if (name === 'phone') nextValue = formatPhoneNumber(value)
    if (name === 'idNumber') nextValue = onlyDigits(value).slice(0, 11)
    if (name === 'taxId') nextValue = onlyDigits(value).slice(0, 10)
    if (name === 'postalCode') nextValue = onlyDigits(value).slice(0, 5)
    setFormData(prev => ({ ...prev, [name]: nextValue }))
    if (checkoutErrors[name]) setCheckoutErrors(prev => ({ ...prev, [name]: '' }))
  }

  const createOrderWithApi = async (options: {
    paymentMethod: 'bank_transfer' | 'pending'
    paymentProvider?: 'stripe'
  }) => {
    const response = await fetch('/api/orders', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        ...(token ? { Authorization: `Bearer ${token}` } : {}),
      },
      body: JSON.stringify({
        customer: {
          name: formData.name,
          email: formData.email,
          phone: formData.phone,
          addressLine: formData.addressLine,
          city: formData.city,
          district: formData.district,
          postalCode: formData.postalCode,
          country: formData.country || 'Türkiye',
          billingType: formData.billingType,
          address: formData.addressLine,
          billingName: formData.billingType === 'company' ? formData.companyName : formData.name,
          taxId: formData.taxId,
          taxOffice: formData.taxOffice,
          billingAddress: formData.useDifferentBillingAddress ? formData.billingAddressLine : formData.addressLine,
          billingCity: formData.useDifferentBillingAddress ? formData.billingCity : formData.city,
          billingDistrict: formData.useDifferentBillingAddress ? formData.billingDistrict : formData.district,
        },
        items: orderItems,
        pricing: { subtotal, tax, shipping, total },
        paymentMethod: options.paymentMethod,
        userId: user?.id || null,
        ...(options.paymentProvider ? { paymentProvider: options.paymentProvider } : {}),
      }),
    })

    const data = await response.json().catch(() => null)
    if (!response.ok || !data?.success) {
      throw new Error(data?.error || 'Sipariş oluşturulamadı.')
    }

    return data as {
      success: true
      orderId: string
      payment?: { redirectUrl?: string; clientSecret?: string; requiresRedirect: boolean }
    }
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    
    const scrollToTop = () => {
      window.scrollTo({ top: 0, behavior: 'smooth' })
    }

    const err: Record<string, string> = {}
    if (!formData.name?.trim()) err.name = 'Ad Soyad zorunludur.'
    if (!formData.email?.trim()) err.email = 'E-posta zorunludur.'
    else if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(formData.email)) err.email = 'Geçerli bir e-posta adresi girin.'
    if (!formData.phone?.trim()) err.phone = 'Telefon zorunludur.'
    if (!formData.addressLine?.trim()) err.addressLine = 'Adres zorunludur.'
    if (!formData.city?.trim()) err.city = 'Şehir zorunludur.'
    if (!formData.district?.trim()) err.district = 'İlçe zorunludur.'
    if (Object.keys(err).length > 0) {
      setCheckoutErrors(err)
      scrollToTop()
      return
    }
    setCheckoutErrors({})

    if (formData.createAccount) {
      if (!formData.password || formData.password.length < 6) {
        setCheckoutErrors(prev => ({ ...prev, password: 'Şifre en az 6 karakter olmalıdır' }))
        scrollToTop()
        return
      }
      if (formData.password !== formData.confirmPassword) {
        setCheckoutErrors(prev => ({ ...prev, confirmPassword: 'Şifreler eşleşmiyor' }))
        scrollToTop()
        return
      }
    }

    try {
      setIsSubmitting(true)
      if (paymentMethod === 'card') {
        const data = await createOrderWithApi({
          paymentMethod: 'pending',
          paymentProvider: 'stripe',
        })
        if (!data.payment?.redirectUrl) {
          setCheckoutErrors(prev => ({ ...prev, payment: 'Stripe bağlantısı kurulamadı. Lütfen tekrar deneyin.' }))
          scrollToTop()
          return
        }
        if (isFromCart) clearCart()
        window.location.href = data.payment.redirectUrl
        return
      }

      const data = await createOrderWithApi({ paymentMethod: 'bank_transfer' })
      if (isFromCart) clearCart()
      if (formData.createAccount) {
        const params = new URLSearchParams({
          email: formData.email || '',
          name: formData.name || '',
          from_order: '1',
          redirect: `/checkout/success?order_id=${data.orderId}&payment=bank_transfer`,
        })
        if (formData.phone) params.set('phone', formData.phone)
        router.push(`/register?${params.toString()}`)
      } else {
        router.push(`/checkout/success?order_id=${data.orderId}&payment=bank_transfer`)
      }
    } catch (error) {
      console.error('Order creation error:', error)
      setCheckoutErrors(prev => ({ ...prev, general: 'Sipariş oluşturulurken bir hata oluştu. Lütfen tekrar deneyin.' }))
      scrollToTop()
    } finally {
      setIsSubmitting(false)
    }
  }

  /** Deneme siparişi: normal sipariş akışıyla aynı, paymentMethod='bank_transfer', success URL'de payment=test */
  const handleTestOrder = async () => {
    const scrollToTop = () => window.scrollTo({ top: 0, behavior: 'smooth' })
    const err: Record<string, string> = {}
    if (!formData.name?.trim()) err.name = 'Ad Soyad zorunludur.'
    if (!formData.email?.trim()) err.email = 'E-posta zorunludur.'
    else if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(formData.email)) err.email = 'Geçerli bir e-posta adresi girin.'
    if (!formData.phone?.trim()) err.phone = 'Telefon zorunludur.'
    if (!formData.addressLine?.trim()) err.addressLine = 'Adres zorunludur.'
    if (!formData.city?.trim()) err.city = 'Şehir zorunludur.'
    if (!formData.district?.trim()) err.district = 'İlçe zorunludur.'
    if (Object.keys(err).length > 0) {
      setCheckoutErrors(err)
      scrollToTop()
      return
    }
    if (formData.createAccount) {
      if (!formData.password || formData.password.length < 6) {
        setCheckoutErrors(prev => ({ ...prev, password: 'Şifre en az 6 karakter olmalıdır' }))
        scrollToTop()
        return
      }
      if (formData.password !== formData.confirmPassword) {
        setCheckoutErrors(prev => ({ ...prev, confirmPassword: 'Şifreler eşleşmiyor' }))
        scrollToTop()
        return
      }
    }
    setCheckoutErrors({})
    setIsTestOrderLoading(true)
    try {
      const data = await createOrderWithApi({ paymentMethod: 'bank_transfer' })
      if (isFromCart) clearCart()
      const successUrl = `/checkout/success?order_id=${data.orderId}&payment=test`
      if (!user?.id && formData.createAccount) {
        const params = new URLSearchParams({
          email: formData.email || '',
          name: formData.name || '',
          from_order: '1',
          redirect: successUrl,
        })
        if (formData.phone) params.set('phone', formData.phone)
        router.push(`/register?${params.toString()}`)
      } else {
        router.push(successUrl)
      }
    } catch (e) {
      console.error('Test order error:', e)
      setCheckoutErrors(prev => ({ ...prev, general: 'Sipariş oluşturulurken bir hata oluştu. Lütfen tekrar deneyin.' }))
      scrollToTop()
    } finally {
      setIsTestOrderLoading(false)
    }
  }

  if (!cartHydrated) {
    return (
      <div className="min-h-screen bg-surface flex items-center justify-center px-4" id="main-content">
        <Card className="rounded-2xl border border-palette shadow-lg p-8 max-w-md text-center">
          <div className="inline-flex h-16 w-16 items-center justify-center rounded-2xl bg-brand-light mb-4">
            <div className="h-8 w-8 animate-spin rounded-full border-2 border-slate-300 border-t-slate-700" />
          </div>
          <h2 className="text-xl font-bold text-ink">Yükleniyor...</h2>
          <p className="text-ink-muted mt-2">Sepet bilgileri alınıyor.</p>
        </Card>
      </div>
    )
  }

  if (!isFromCart) {
    return (
      <div className="min-h-screen bg-surface flex items-center justify-center px-4" id="main-content">
        <Card className="rounded-2xl border border-palette shadow-lg p-8 max-w-md text-center">
          <div className="inline-flex h-16 w-16 items-center justify-center rounded-2xl bg-brand-light mb-4">
            <AlertCircle className="w-8 h-8 text-brand" />
          </div>
          <h2 className="text-xl font-bold text-ink">Sepetiniz Boş</h2>
          <p className="text-ink-muted mt-2 mb-2">Lütfen önce ürün ekleyin. B2B siparişler için <Link href="/contact" className="text-brand hover:underline font-medium">iletişime geçiniz</Link>.</p>
          <div className="mt-6 flex justify-center">
            <Button onClick={() => router.push('/products')} variant="outline" className="rounded-full min-h-[48px] w-full sm:w-auto touch-manipulation">
              Ürünlere Git
            </Button>
          </div>
        </Card>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-surface pb-safe" id="main-content">
      <div className="container mx-auto px-4 sm:px-6 md:px-8 lg:px-8 py-5 sm:py-6 md:py-8">
        <Button variant="ghost" onClick={() => router.back()} className="mb-4 sm:mb-6 rounded-xl min-h-[44px] touch-manipulation -ml-2 pl-2">
          <ArrowLeft className="w-4 h-4 mr-2" />
          Geri Dön
        </Button>

        <h1 className="text-xl sm:text-2xl md:text-3xl font-bold text-ink mb-5 sm:mb-6 md:mb-8">Ödeme</h1>

        {(checkoutErrors.general || checkoutErrors.payment) && (
          <div className="mb-4 p-4 bg-destructive/10 border border-destructive/30 rounded-xl text-sm text-destructive">
            <div className="flex items-start gap-2">
              <AlertCircle className="w-5 h-5 mt-0.5 shrink-0" />
              <span>{checkoutErrors.general || checkoutErrors.payment}</span>
            </div>
          </div>
        )}

        <form onSubmit={handleSubmit}>
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-5 sm:gap-6 md:gap-8 min-w-0 max-w-full">
            {/* Left Column - Order & Customer Info */}
            <div className="lg:col-span-2 space-y-6 min-w-0">
              {/* Order Items */}
              {isFromCart && (
                <Card className="rounded-2xl border border-palette shadow-lg">
                  <CardHeader>
                    <CardTitle className="flex items-center gap-2">
                      <ShoppingCart className="w-5 h-5" />
                      Sipariş Özeti
                    </CardTitle>
                  </CardHeader>
                  <CardContent>
                    <div className="space-y-4">
                      {cartItems.map((item) => (
                        <div key={item.id} className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3 pb-4 border-b last:border-0">
                          <div className="flex items-center gap-4 flex-1">
                            <div className="w-16 h-16 bg-muted rounded-xl overflow-hidden flex-shrink-0 relative">
                              {item.image ? (
                                <Image src={item.image} alt={item.name} fill className="object-cover" sizes="64px" />
                              ) : (
                                <div className="w-full h-full flex items-center justify-center">
                                  <Package className="w-8 h-8 text-ink-muted" />
                                </div>
                              )}
                            </div>
                            <div className="flex-1 min-w-0">
                              <h3 className="font-semibold text-ink text-sm sm:text-base">{item.name}</h3>
                              <p className="text-sm text-ink-muted">Adet: {item.quantity}</p>
                            </div>
                          </div>
                          <div className="text-left sm:text-right w-full sm:w-auto">
                            <div className="font-bold text-base sm:text-lg">{formatPrice(item.price * item.quantity)}</div>
                          </div>
                        </div>
                      ))}
                    </div>
                  </CardContent>
                </Card>
              )}

              <Card className="rounded-2xl border border-palette shadow-lg">
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <User className="w-5 h-5" />
                    Müşteri Bilgileri
                  </CardTitle>
                </CardHeader>
                <CardContent className="space-y-4">
                  {isAuthenticated && savedAddresses.length > 0 && (
                    <div className="mb-4 p-4 bg-brand-light rounded-xl border border-palette">
                      <Label className="text-sm font-semibold mb-2 block">Kayıtlı Adreslerim</Label>
                      <div className="space-y-2">
                        {savedAddresses.map((address) => (
                          <label
                            key={address.id}
                            className={`flex items-start gap-3 p-3 min-h-[52px] border rounded-xl cursor-pointer transition-colors touch-manipulation ${
                              selectedAddressId === address.id
                                ? 'border-brand bg-brand-light'
                                : 'border-palette hover:border-ink-muted/30'
                            }`}
                          >
                            <input
                              type="radio"
                              name="address"
                              checked={selectedAddressId === address.id}
                              onChange={() => {
                                setSelectedAddressId(address.id)
                                setFormData(prev => ({
                                  ...prev,
                                  name: address.name,
                                  phone: address.phone,
                                  addressLine: address.addressLine,
                                  city: address.city,
                                  district: address.district,
                                  postalCode: address.postalCode,
                                  country: address.country
                                }))
                              }}
                              className="mt-1"
                            />
                            <div className="flex-1">
                              <div className="flex items-center gap-2 mb-1">
                                <span className="font-medium text-sm">{address.title}</span>
                                {address.isDefault && (
                                  <Badge variant="outline" className="text-xs">Varsayılan</Badge>
                                )}
                              </div>
                              <p className="text-sm text-ink-muted">{address.addressLine}</p>
                              <p className="text-xs text-ink-muted">
                                {address.district} / {address.city} {address.postalCode}
                              </p>
                            </div>
                          </label>
                        ))}
                      </div>
                      <Button
                        variant="ghost"
                        size="sm"
                        className="mt-2 text-brand min-h-[44px] touch-manipulation"
                        onClick={() => router.push('/profile?tab=addresses')}
                      >
                        <MapPin className="w-4 h-4 mr-2" />
                        Adres Yönetimi
                      </Button>
                    </div>
                  )}

                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div className="space-y-1">
                      <Label htmlFor="name">Ad Soyad *</Label>
                      <Input
                        id="name"
                        name="name"
                        autoComplete="name"
                        value={formData.name}
                        onChange={handleInputChange}
                        className={`rounded-xl ${checkoutErrors.name ? 'border-destructive' : ''}`}
                      />
                      {checkoutErrors.name && <p className="text-sm text-destructive">{checkoutErrors.name}</p>}
                    </div>
                    <div className="space-y-1">
                      <Label htmlFor="email">E-posta *</Label>
                      <Input
                        id="email"
                        name="email"
                        type="email"
                        autoComplete="email"
                        value={formData.email}
                        onChange={handleInputChange}
                        className={`rounded-xl ${checkoutErrors.email ? 'border-destructive' : ''}`}
                      />
                      {checkoutErrors.email && <p className="text-sm text-destructive">{checkoutErrors.email}</p>}
                    </div>
                    <div className="space-y-1">
                      <Label htmlFor="phone">Telefon *</Label>
                      <Input
                        id="phone"
                        name="phone"
                        inputMode="numeric"
                        autoComplete="tel"
                        placeholder="5xx xxx xx xx"
                        value={formData.phone}
                        onChange={handleInputChange}
                        className={`rounded-xl ${checkoutErrors.phone ? 'border-destructive' : ''}`}
                      />
                      {checkoutErrors.phone && <p className="text-sm text-destructive">{checkoutErrors.phone}</p>}
                    </div>
                    <div className="space-y-1">
                      <Label htmlFor="city">Şehir *</Label>
                      <Input
                        id="city"
                        name="city"
                        value={formData.city}
                        onChange={handleInputChange}
                        className={`rounded-xl ${checkoutErrors.city ? 'border-destructive' : ''}`}
                      />
                      {checkoutErrors.city && <p className="text-sm text-destructive">{checkoutErrors.city}</p>}
                    </div>
                    <div className="space-y-1">
                      <Label htmlFor="district">İlçe *</Label>
                      <Input
                        id="district"
                        name="district"
                        value={formData.district}
                        onChange={handleInputChange}
                        className={`rounded-xl ${checkoutErrors.district ? 'border-destructive' : ''}`}
                      />
                      {checkoutErrors.district && <p className="text-sm text-destructive">{checkoutErrors.district}</p>}
                    </div>
                    <div>
                      <Label htmlFor="postalCode">Posta Kodu</Label>
                      <Input
                        id="postalCode"
                        name="postalCode"
                        inputMode="numeric"
                        placeholder="34000"
                        value={formData.postalCode}
                        onChange={handleInputChange}
                        className="rounded-xl"
                      />
                    </div>
                  </div>
                  <div className="space-y-1">
                    <Label htmlFor="addressLine">Adres *</Label>
                      <Textarea
                        id="addressLine"
                        name="addressLine"
                        autoComplete="street-address"
                        value={formData.addressLine}
                        onChange={handleInputChange}
                        rows={3}
                      className={`rounded-xl ${checkoutErrors.addressLine ? 'border-destructive' : ''}`}
                    />
                    {checkoutErrors.addressLine && <p className="text-sm text-destructive">{checkoutErrors.addressLine}</p>}
                  </div>

                  {/* Billing address toggle */}
                  <div className="flex items-center gap-2 mt-4">
                    <input
                      type="checkbox"
                      id="diffBilling"
                      checked={formData.useDifferentBillingAddress || false}
                      onChange={e => setFormData(prev => ({ ...prev, useDifferentBillingAddress: e.target.checked }))}
                      className="w-4 h-4 rounded border-gray-300 text-brand"
                    />
                    <label htmlFor="diffBilling" className="text-sm text-ink-muted cursor-pointer">
                      Fatura adresi teslimat adresinden farklı
                    </label>
                  </div>

                  {formData.useDifferentBillingAddress && (
                    <div className="mt-4 space-y-3 p-4 rounded-xl border border-palette bg-surface/50">
                      <p className="text-sm font-semibold text-ink">Fatura Adresi</p>
                      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                        <div className="space-y-1">
                          <Label htmlFor="billingCity">Şehir</Label>
                          <Input
                            id="billingCity"
                            name="billingCity"
                            value={formData.billingCity}
                            onChange={handleInputChange}
                            className="rounded-xl"
                          />
                        </div>
                        <div className="space-y-1">
                          <Label htmlFor="billingDistrict">İlçe</Label>
                          <Input
                            id="billingDistrict"
                            name="billingDistrict"
                            value={formData.billingDistrict}
                            onChange={handleInputChange}
                            className="rounded-xl"
                          />
                        </div>
                      </div>
                      <div className="space-y-1">
                        <Label htmlFor="billingAddressLine">Fatura Adresi</Label>
                        <Textarea
                          id="billingAddressLine"
                          name="billingAddressLine"
                          value={formData.billingAddressLine}
                          onChange={handleInputChange}
                          rows={3}
                          className="rounded-xl"
                        />
                      </div>
                    </div>
                  )}

                  {/* Create Account Option - Only show if not authenticated */}
                  {!isAuthenticated && (
                    <div className="pt-4 border-t space-y-2">
                      <p className="text-xs text-ink-muted">
                        Hesap olmadan devam etmek için aşağıdaki kutuyu işaretlemeyin; zorunlu bilgileri doldurup siparişi tamamlayabilirsiniz.
                      </p>
                      <label className="flex items-start gap-3 cursor-pointer py-2 touch-manipulation">
                        <input
                          type="checkbox"
                          checked={formData.createAccount}
                          onChange={(e) => setFormData(prev => ({ ...prev, createAccount: e.target.checked }))}
                          className="mt-1 w-5 h-5 min-w-[20px] min-h-[20px] text-brand border-palette rounded focus:ring-2 focus:ring-brand"
                        />
                        <div className="flex-1">
                          <div className="text-sm font-medium text-ink">
                            Hesap oluştur
                          </div>
                          <div className="text-xs text-ink-muted mt-1">
                            Siparişlerinizi takip edin ve gelecekteki alışverişlerinizde hızlıca ödeme yapın.
                          </div>
                        </div>
                      </label>
                      
                      {formData.createAccount && (
                        <div className="mt-4 space-y-3 pl-8">
                          <div>
                            <Label htmlFor="password">Şifre *</Label>
                            <Input
                              id="password"
                              name="password"
                              type="password"
                              value={formData.password}
                              onChange={handleInputChange}
                              required={formData.createAccount}
                              minLength={6}
                              autoComplete="new-password"
                              className="rounded-xl"
                            />
                            {checkoutErrors.password && <p className="text-sm text-destructive mt-1">{checkoutErrors.password}</p>}
                          </div>
                          <div>
                            <Label htmlFor="confirmPassword">Şifre Tekrar *</Label>
                            <Input
                              id="confirmPassword"
                              name="confirmPassword"
                              type="password"
                              value={formData.confirmPassword}
                              onChange={handleInputChange}
                              required={formData.createAccount}
                              minLength={6}
                              autoComplete="new-password"
                              className="rounded-xl"
                            />
                            {checkoutErrors.confirmPassword && <p className="text-sm text-destructive mt-1">{checkoutErrors.confirmPassword}</p>}
                          </div>
                        </div>
                      )}
                    </div>
                  )}
                </CardContent>
              </Card>
            </div>

            <div className="lg:col-span-1">
              <Card className="rounded-2xl border border-palette shadow-lg lg:sticky lg:top-4">
                <CardHeader>
                  <CardTitle>Sipariş Özeti</CardTitle>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div className="space-y-2">
                    <div className="flex justify-between text-sm">
                      <span className="text-ink-muted">Ara Toplam</span>
                      <span className="font-medium">{formatPrice(subtotal)}</span>
                    </div>
                    <div className="flex justify-between text-sm">
                      <span className="text-ink-muted">KDV (%20)</span>
                      <span className="font-medium">{formatPrice(tax)}</span>
                    </div>
                    <div className="flex justify-between text-sm">
                      <span className="text-ink-muted">Kargo</span>
                      <span className="font-medium">
                        {shipping === 0 ? (
                          <span className="text-green-600">Ücretsiz</span>
                        ) : (
                          formatPrice(shipping)
                        )}
                      </span>
                    </div>
                    {subtotal < 3000 && (
                      <div className="text-xs text-brand mt-1">
                        {formatPrice(3000 - subtotal)} daha alışveriş yapın, kargo ücretsiz olsun!
                      </div>
                    )}
                  </div>

                  <Separator />

                  <div className="flex justify-between font-bold text-lg">
                    <span>Toplam</span>
                    <span className="text-brand">{formatPrice(total)}</span>
                  </div>

                  <div className="space-y-2">
                    <span className="text-sm font-medium text-ink">Ödeme yöntemi</span>
                    <div className="flex flex-col gap-2">
                      <label className={`flex items-center gap-3 p-3 min-h-[48px] rounded-xl border-2 cursor-pointer transition-colors touch-manipulation ${paymentMethod === 'havale' ? 'border-brand bg-brand-light' : 'border-palette hover:border-ink-muted/30'}`}>
                        <input type="radio" name="paymentMethod" checked={paymentMethod === 'havale'} onChange={() => setPaymentMethod('havale')} className="text-brand w-5 h-5" />
                        <span className="text-sm font-medium">Havale / EFT</span>
                        <span className="ml-auto shrink-0 text-[11px] font-bold text-emerald-600 bg-emerald-50 border border-emerald-200 rounded-full px-2 py-0.5">%3 İndirim</span>
                      </label>
                      <label className={`flex items-center gap-3 p-3 min-h-[48px] rounded-xl border-2 cursor-pointer transition-colors touch-manipulation ${paymentMethod === 'card' ? 'border-brand bg-brand-light' : 'border-palette hover:border-ink-muted/30'}`}>
                        <input type="radio" name="paymentMethod" checked={paymentMethod === 'card'} onChange={() => setPaymentMethod('card')} className="text-brand w-5 h-5" />
                        <span className="text-sm font-medium">Kredi kartı ile öde</span>
                      </label>
                    </div>
                    {paymentMethod === 'card' && (
                      <p className="text-xs text-ink-muted">Güvenli ödeme sayfasına (Stripe) yönlendirileceksiniz.</p>
                    )}
                  </div>

                  <Button type="submit" disabled={isSubmitting} size="lg" className="w-full rounded-full bg-brand hover:bg-brand-hover font-semibold shadow-lg min-h-[48px] touch-manipulation">
                    {isSubmitting ? (
                      <><div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin mr-2" />İşleniyor...</>
                    ) : (
                      <><CreditCard className="w-5 h-5 mr-2" />Ödemeye Geç</>
                    )}
                  </Button>

                  <Button
                    type="button"
                    variant="outline"
                    size="lg"
                    className="w-full rounded-full border-dashed min-h-[48px] touch-manipulation text-ink-muted hover:text-ink hover:border-brand"
                    disabled={isTestOrderLoading}
                    onClick={handleTestOrder}
                  >
                    {isTestOrderLoading ? 'Oluşturuluyor...' : 'Deneme için sipariş oluştur'}
                  </Button>

                  <div className="text-xs text-ink-muted text-center space-y-1">
                    <div className="flex items-center justify-center gap-1">
                      <Truck className="w-3 h-3" />
                      <span>Güvenli Ödeme</span>
                    </div>
                    <div>7/24 Müşteri Desteği</div>
                  </div>
                </CardContent>
              </Card>
            </div>
          </div>
        </form>
      </div>
    </div>
  )
}


