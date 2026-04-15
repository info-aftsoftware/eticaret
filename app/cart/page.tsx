'use client'

import React, { useEffect, useState } from 'react'
import Link from 'next/link'
import Image from 'next/image'
import { useRouter } from 'next/navigation'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { Separator } from '@/components/ui/separator'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { useCartStore } from '@/lib/store/useCartStore'
import { ClassicPageShell } from '@/components/ClassicPageShell'
import { Trash2, Plus, Minus, ArrowLeft, Package, CreditCard } from 'lucide-react'
import { fmtPrice } from '@/lib/format'
import { useCurrencyStore } from '@/lib/store/useCurrencyStore'
import { useExchangeRates } from '@/lib/useExchangeRates'
import { useAuthStore } from '@/lib/store/useAuthStore'
import { Alert, AlertDescription } from '@/components/ui/alert'
import { Info, Tag, FileText, Shield } from 'lucide-react'
import { useTranslations } from 'next-intl'
import { getCategoryKey } from '@/lib/categories'
import { CartRelatedProducts } from '@/components/CartRelatedProducts'

export default function CartPage() {
  const router = useRouter()
  const t = useTranslations('cart')
  const tHome = useTranslations('home')
  const tHeader = useTranslations('header')
  const currency = useCurrencyStore((s) => s.currency)
  const { rates } = useExchangeRates()
  const formatPrice = (amount: number) => fmtPrice(amount, currency, rates?.rates ?? null)
  const { items, removeItem, updateQuantity, clearCart, getTotalPrice, getTotalItems, _hasHydrated } = useCartStore()
  const { isAuthenticated } = useAuthStore()
  const [couponCode, setCouponCode] = useState('')
  const [couponDiscount, setCouponDiscount] = useState(0)
  const [couponError, setCouponError] = useState('')
  const [contractsAccepted, setContractsAccepted] = useState(false)
  const [privacyAccepted, setPrivacyAccepted] = useState(false)
  const [termsAccepted, setTermsAccepted] = useState(false)
  const [contractErrors, setContractErrors] = useState<{ contracts: boolean; privacy: boolean; kvkk: boolean }>({
    contracts: false,
    privacy: false,
    kvkk: false,
  })
  const [showModal, setShowModal] = useState<string | null>(null)
  const [pageReady, setPageReady] = useState(false)

  useEffect(() => {
    const timer = setTimeout(() => setPageReady(true), 250)
    return () => clearTimeout(timer)
  }, [])
  
  const subtotal = getTotalPrice()
  const tax = subtotal * 0.20 // %20 KDV
  const shipping = subtotal > 3000 ? 0 : 50 // 3000 TL üzeri ücretsiz kargo
  const discount = couponDiscount
  const total = subtotal + tax + shipping - discount
  const hasContractErrors = contractErrors.contracts || contractErrors.privacy || contractErrors.kvkk

  const handleCheckoutClick = () => {
    const nextErrors = {
      contracts: !contractsAccepted,
      privacy: !privacyAccepted,
      kvkk: !termsAccepted,
    }

    setContractErrors(nextErrors)

    if (nextErrors.contracts || nextErrors.privacy || nextErrors.kvkk) {
      return
    }

    router.push('/checkout')
  }

  if (!pageReady && !_hasHydrated) {
    return (
      <ClassicPageShell breadcrumbs={[{ label: t('title') }]} title={t('title')} description="">
        <div className="max-w-lg mx-auto text-center py-12">
          <div className="w-24 h-24 rounded-2xl bg-white border border-slate-200 flex items-center justify-center mx-auto mb-8 shadow-sm">
            <div className="h-8 w-8 animate-spin rounded-full border-2 border-slate-300 border-t-slate-700" />
          </div>
          <p className="text-slate-600">Sepet yükleniyor...</p>
        </div>
      </ClassicPageShell>
    )
  }

  if (items.length === 0) {
    return (
      <ClassicPageShell breadcrumbs={[{ label: t('title') }]} title={t('emptyTitle')} description={t('emptyDesc')}>
        <div className="max-w-lg mx-auto text-center py-12">
          <div className="w-24 h-24 rounded-2xl bg-white border border-slate-200 flex items-center justify-center mx-auto mb-8 shadow-sm">
            <Package className="w-12 h-12 text-slate-400" />
          </div>
          <p className="text-slate-600 mb-6 leading-relaxed">
            {t('browseAndContact')}{' '}
            <Link href="/contact" className="text-brand font-semibold hover:underline">{tHome('contactUs')}</Link>.
          </p>
          <Button asChild size="lg" className="rounded-xl min-h-[48px] w-full sm:w-auto touch-manipulation bg-brand hover:bg-brand-hover text-white">
            <Link href="/products" className="flex items-center justify-center gap-2">
              <ArrowLeft className="w-5 h-5" />
              {t('goToProducts')}
            </Link>
          </Button>
        </div>
      </ClassicPageShell>
    )
  }

  return (
    <ClassicPageShell
      breadcrumbs={[{ label: t('title') }]}
      title={t('cartTitle')}
      description={`${getTotalItems()} ${t('itemsCount')}`}
    >
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-5 sm:gap-6 md:gap-8 pb-safe min-w-0 max-w-full">
        <div className="lg:col-span-2 space-y-4 min-w-0">
          <Card className="bg-white rounded-2xl border border-slate-200 shadow-sm">
              <CardHeader>
                <div className="flex items-center justify-between">
                  <CardTitle>{t('myCart')} ({getTotalItems()} {t('itemsCount')})</CardTitle>
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={clearCart}
                    className="text-destructive hover:text-destructive/90"
                  >
                    <Trash2 className="w-4 h-4 mr-2" />
                    {t('clearCart')}
                  </Button>
                </div>
              </CardHeader>
              <CardContent className="space-y-4">
                {items.map((item) => (
                  <div key={item.id} className="flex flex-col sm:flex-row gap-3 sm:gap-4 pb-4 border-b last:border-0">
                    {/* Product Image */}
                    <div className="w-full sm:w-24 h-40 sm:h-24 bg-muted rounded-xl flex items-center justify-center flex-shrink-0 overflow-hidden">
                      {item.image ? (
                        <Image
                          src={item.image}
                          alt={item.name || 'Ürün'}
                          width={96}
                          height={96}
                          className="rounded-xl object-cover w-full h-full"
                          onError={(e) => {
                            // Fallback to package icon on error
                            e.currentTarget.style.display = 'none'
                          }}
                        />
                      ) : (
                        <Package className="w-12 h-12 text-slate-400" />
                      )}
                    </div>

                    {/* Product Info */}
                    <div className="flex-1 min-w-0">
                      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 mb-4">
                        <div className="flex-1">
                          <h3 className="font-semibold text-slate-900 mb-1 text-base sm:text-lg">{item.name || 'Ürün'}</h3>
                          {item.description && (
                            <p className="text-sm text-slate-600 line-clamp-2 mb-2">
                              {item.description}
                            </p>
                          )}
                          <div className="flex flex-wrap gap-2">
                            {item.category && (
                              <Badge variant="secondary" className="text-xs">
                                {getCategoryKey(item.category) ? tHeader(getCategoryKey(item.category)!) : item.category}
                              </Badge>
                            )}
                            {item.isCustom && (
                              <Badge className="text-xs bg-brand text-white">
                                Özel Konfigürasyon
                              </Badge>
                            )}
                          </div>
                        </div>
                        <div className="text-left sm:text-right w-full sm:w-auto">
                          <div className="font-bold text-slate-900 mb-1 text-lg sm:text-xl">
                            {formatPrice(item.price * item.quantity)}
                          </div>
                          <div className="text-sm text-slate-600">
                            {formatPrice(item.price)} / adet
                          </div>
                        </div>
                      </div>

                      {/* Quantity Controls */}
                      <div className="flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-3">
                        <div className="flex items-center gap-2">
                          <Button
                            variant="outline"
                            size="sm"
                            className="h-11 w-11 sm:h-9 sm:w-9 p-0 touch-manipulation rounded-xl"
                            onClick={() => updateQuantity(item.id, item.quantity - 1)}
                            aria-label="Miktarı azalt"
                          >
                            <Minus className="w-5 h-5 sm:w-4 sm:h-4" />
                          </Button>
                          <Input
                            type="number"
                            value={item.quantity}
                            onChange={(e) => {
                              const raw = parseInt(e.target.value)
                              const qty = isNaN(raw) ? 1 : Math.max(1, raw)
                              updateQuantity(item.id, qty)
                            }}
                            className="w-24 sm:w-20 text-center h-11 sm:h-9 text-base sm:text-sm rounded-xl"
                            min="1"
                          />
                          <Button
                            variant="outline"
                            size="sm"
                            className="h-11 w-11 sm:h-9 sm:w-9 p-0 touch-manipulation rounded-xl"
                            onClick={() => updateQuantity(item.id, item.quantity + 1)}
                            aria-label="Miktarı artır"
                          >
                            <Plus className="w-5 h-5 sm:w-4 sm:h-4" />
                          </Button>
                        </div>
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() => removeItem(item.id)}
                          className="text-destructive hover:text-destructive/90 w-full sm:w-auto h-11 sm:h-9 touch-manipulation"
                        >
                          <Trash2 className="w-5 h-5 sm:w-4 sm:h-4 mr-2" />
                          Kaldır
                        </Button>
                      </div>
                    </div>
                  </div>
                ))}
              </CardContent>
            </Card>

            {/* Tamamlayıcı / Birlikte alınan ürünler */}
            <CartRelatedProducts
              cartItemIds={items.map((i) => i.id)}
              cartCategories={[...new Set(items.map((i) => i.category).filter((c): c is string => !!c))]}
            />

            <Button asChild variant="outline" className="w-full rounded-xl min-h-[48px] touch-manipulation">
              <Link href="/products" className="flex items-center justify-center gap-2">
                <ArrowLeft className="w-4 h-4" />
                Alışverişe Devam Et
              </Link>
            </Button>
          </div>

          <div className="lg:col-span-1">
            <Card className="rounded-2xl border border-slate-200 bg-white shadow-sm lg:sticky lg:top-24">
              <CardHeader>
                <CardTitle>Sipariş Özeti</CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="space-y-2">
                  <div className="flex justify-between text-sm">
                    <span className="text-slate-600">Ara Toplam</span>
                    <span className="font-medium">{formatPrice(subtotal)}</span>
                  </div>
                  <div className="flex justify-between text-sm">
                    <span className="text-slate-600">KDV (%20)</span>
                    <span className="font-medium">{formatPrice(tax)}</span>
                  </div>
                  <div className="flex justify-between text-sm">
                    <span className="text-slate-600">Kargo</span>
                    <span className="font-medium">
                      {shipping === 0 ? (
                        <span className="text-green-600">Ücretsiz</span>
                      ) : (
                        formatPrice(shipping)
                      )}
                    </span>
                  </div>
                </div>

                <Separator />

                {couponDiscount > 0 && (
                  <div className="flex justify-between text-sm text-green-600">
                    <span>İndirim</span>
                    <span className="font-medium">-{formatPrice(couponDiscount)}</span>
                  </div>
                )}
                <div className="flex justify-between font-bold text-lg">
                  <span>Toplam</span>
                  <span className="text-slate-900 font-bold">{formatPrice(total)}</span>
                </div>

                {/* Coupon Code */}
                <div className="pt-4 border-t">
                  <Label htmlFor="coupon" className="text-sm font-medium mb-2 block">
                    Kupon Kodu
                  </Label>
                  <div className="flex gap-2">
                    <Input
                      id="coupon"
                      placeholder="Kupon kodunuzu girin"
                      value={couponCode}
                      onChange={(e) => {
                        setCouponCode(e.target.value)
                        setCouponError('')
                      }}
                      className="flex-1 rounded-xl"
                    />
                    <Button
                      type="button"
                      variant="outline"
                      className="rounded-xl min-h-[44px] min-w-[44px] touch-manipulation shrink-0"
                      onClick={async () => {
                        if (!couponCode.trim()) return
                        setCouponError('')
                        try {
                          // Firestore'dan kupon doğrulama (statik hosting - API yok)
                          const { collection: col, query, where, getDocs } = await import('firebase/firestore')
                          const { getDb } = await import('@/lib/firebase/config')
                          const db = getDb()
                          const q = query(col(db, 'coupons'), where('code', '==', couponCode.trim().toUpperCase()))
                          const snap = await getDocs(q)
                          if (snap.empty) {
                            setCouponDiscount(0)
                            setCouponError('Geçersiz kupon kodu')
                            return
                          }
                          const coupon = snap.docs[0].data()
                          // Kupon aktif mi?
                          if (coupon.active === false) {
                            setCouponDiscount(0)
                            setCouponError('Bu kupon artık geçerli değil')
                            return
                          }
                          // Min tutar kontrolü
                          if (coupon.minAmount && subtotal < coupon.minAmount) {
                            setCouponDiscount(0)
                            setCouponError(`Bu kupon en az ${coupon.minAmount} TL alışverişlerde geçerlidir`)
                            return
                          }
                          // İndirim hesapla
                          let disc = 0
                          if (coupon.type === 'percent' || coupon.discountType === 'percent') {
                            disc = Math.round(subtotal * ((coupon.discount || coupon.value || 0) / 100))
                          } else {
                            disc = coupon.discount || coupon.value || 0
                          }
                          if (coupon.maxDiscount && disc > coupon.maxDiscount) disc = coupon.maxDiscount
                          setCouponDiscount(disc)
                          setCouponError('')
                        } catch {
                          setCouponDiscount(0)
                          setCouponError('Kupon kontrol edilemedi.')
                        }
                      }}
                    >
                      <Tag className="w-4 h-4" />
                    </Button>
                  </div>
                  {couponError && (
                    <p className="text-xs text-destructive mt-1">{couponError}</p>
                  )}
                  {couponDiscount > 0 && (
                    <p className="text-xs text-green-600 mt-1">Kupon uygulandı!</p>
                  )}
                </div>

                {!isAuthenticated && (
                  <Alert className="mb-4">
                    <Info className="h-4 w-4" />
                    <AlertDescription>
                      {'H\u0131zl\u0131 \u00f6deme i\u00e7in'}{' '}
                      <Link href="/login" className="text-brand hover:underline font-semibold">
                        {'giri\u015f yap\u0131n'}
                      </Link>
                      {' '}veya{' '}
                      <Link href="/register" className="text-brand hover:underline font-semibold">
                        {'kay\u0131t olun'}
                      </Link>
                      {'. Hesap olmadan da '}<Link href="/checkout" className="text-brand hover:underline font-semibold">{'\u00d6demeye Ge\u00e7'}</Link>{' ile sipari\u015f verebilirsiniz.'}
                    </AlertDescription>
                  </Alert>
                )}

                {/* Sozlesme ve Sartlar */}
                <div className={`pt-4 border-t space-y-3 rounded-2xl transition-colors ${hasContractErrors ? 'border-red-200 bg-red-50/70 p-4' : ''}`}>
                  <h4 className="text-sm font-semibold text-ink flex items-center gap-2">
                    <Shield className="w-4 h-4 text-slate-600" />
                    {'S\u00f6zle\u015fme ve \u015eartlar'}
                  </h4>
                  
                  <label className={`flex items-start gap-2 cursor-pointer py-2 px-2 touch-manipulation min-h-[44px] items-center rounded-xl transition-colors ${contractErrors.contracts ? 'border border-red-200 bg-white' : ''}`}>
                    <input
                      type="checkbox"
                      checked={contractsAccepted}
                      onChange={(e) => {
                        setContractsAccepted(e.target.checked)
                        setContractErrors((prev) => ({ ...prev, contracts: false }))
                      }}
                      className={`w-5 h-5 min-w-[20px] min-h-[20px] text-slate-800 rounded focus:ring-2 focus:ring-slate-400 shrink-0 ${contractErrors.contracts ? 'border-red-400' : 'border-slate-300'}`}
                    />
                    <span className="text-xs text-ink">
                      <button type="button" onClick={(e) => { e.preventDefault(); setShowModal('sales'); }} className="font-medium text-slate-800 hover:underline text-left">{'"Uzaktan Sat\u0131\u015f S\u00f6zle\u015fmesi"'}</button>{"'ni okudum ve kabul ediyorum."}
                    </span>
                  </label>

                  <label className={`flex items-start gap-2 cursor-pointer py-2 px-2 touch-manipulation min-h-[44px] items-center rounded-xl transition-colors ${contractErrors.privacy ? 'border border-red-200 bg-white' : ''}`}>
                    <input
                      type="checkbox"
                      checked={privacyAccepted}
                      onChange={(e) => {
                        setPrivacyAccepted(e.target.checked)
                        setContractErrors((prev) => ({ ...prev, privacy: false }))
                      }}
                      className={`w-5 h-5 min-w-[20px] min-h-[20px] text-slate-800 rounded focus:ring-2 focus:ring-slate-400 shrink-0 ${contractErrors.privacy ? 'border-red-400' : 'border-slate-300'}`}
                    />
                    <span className="text-xs text-ink">
                      <button type="button" onClick={(e) => { e.preventDefault(); setShowModal('privacy'); }} className="font-medium text-slate-800 hover:underline text-left">{'"Gizlilik S\u00f6zle\u015fmesi"'}</button>{"'ni okudum ve kabul ediyorum."}
                    </span>
                  </label>

                  <label className={`flex items-start gap-2 cursor-pointer py-2 px-2 touch-manipulation min-h-[44px] items-center rounded-xl transition-colors ${contractErrors.kvkk ? 'border border-red-200 bg-white' : ''}`}>
                    <input
                      type="checkbox"
                      checked={termsAccepted}
                      onChange={(e) => {
                        setTermsAccepted(e.target.checked)
                        setContractErrors((prev) => ({ ...prev, kvkk: false }))
                      }}
                      className={`w-5 h-5 min-w-[20px] min-h-[20px] text-slate-800 rounded focus:ring-2 focus:ring-slate-400 shrink-0 ${contractErrors.kvkk ? 'border-red-400' : 'border-slate-300'}`}
                    />
                    <span className="text-xs text-ink">
                      <button type="button" onClick={(e) => { e.preventDefault(); setShowModal('kvkk'); }} className="font-medium text-slate-800 hover:underline text-left">{'"KVKK Ayd\u0131nlatma Metni"'}</button>{"'ni okudum ve kabul ediyorum."}
                    </span>
                  </label>

                  {hasContractErrors && (
                    <p className="text-xs font-medium text-red-600">
                      {'\u00d6demeye ge\u00e7mek i\u00e7in t\u00fcm s\u00f6zle\u015fme ve ayd\u0131nlatma onaylar\u0131n\u0131 i\u015faretlemelisiniz.'}
                    </p>
                  )}
                </div>

                <Button 
                  size="lg" 
                  className="w-full rounded-xl min-h-[48px] touch-manipulation bg-brand hover:bg-brand-hover text-white"
                  onClick={handleCheckoutClick}
                >
                  <span className="flex items-center justify-center gap-2">
                    <CreditCard className="w-5 h-5" />
                    {'Sat\u0131n Al'}
                  </span>
                </Button>
                <div className="text-xs text-slate-500 text-center space-y-1">
                  <div className="flex items-center justify-center gap-1">
                    <Package className="w-3 h-3" />
                    <span>{'G\u00fcvenli \u00d6deme'}</span>
                  </div>
                  <div>{'7/24 M\u00fc\u015fteri Deste\u011fi'}</div>
                </div>
              </CardContent>
            </Card>
          </div>
        </div>

        {/* Sozlesme Modali */}
        {showModal && (
          <div
            className="fixed z-50 inset-0 flex items-center justify-center bg-black/60 backdrop-blur-sm p-4"
            onClick={() => setShowModal(null)}
          >
            <div
              className="bg-white rounded-2xl shadow-2xl max-w-2xl w-full max-h-[80vh] overflow-hidden flex flex-col"
              onClick={(e) => e.stopPropagation()}
            >
              <div className="flex items-center justify-between p-6 border-b border-slate-200 bg-slate-50">
                <h3 className="text-xl font-bold text-ink">
                  {showModal === 'sales' && 'Uzaktan Satış Sözleşmesi'}
                  {showModal === 'privacy' && 'Gizlilik Sözleşmesi'}
                  {showModal === 'kvkk' && 'KVKK Aydınlatma Metni'}
                </h3>
                <button
                  className="p-3 -mr-2 min-h-[44px] min-w-[44px] flex items-center justify-center hover:bg-muted rounded-lg transition-colors touch-manipulation"
                  onClick={() => setShowModal(null)}
                  aria-label="Kapat"
                >
                  <span className="text-2xl text-slate-500 hover:text-slate-900">×</span>
                </button>
              </div>
              <div className="p-6 overflow-y-auto flex-1">
                <div className="prose prose-sm max-w-none text-ink whitespace-pre-line leading-relaxed">
                  {showModal === 'sales' && `UZAKTAN SATIŞ SÖZLEŞMESİ

1. Taraflar
Bu sözleşme, sipariş veren müşteri ile satıcı arasında elektronik ortamda kurulmuştur.

2. Konu
Sözleşmenin konusu, internet sitesi üzerinden verilen siparişin satış, ödeme, teslimat ve iade şartlarının belirlenmesidir.

3. Sipariş ve Ödeme
Sipariş, müşteri tarafından onaylandığında yürürlüğe girer. Ürün bedeli ve varsa kargo ücreti ödeme adımında açıkça gösterilir.

4. Teslimat
Siparişler, stok ve operasyon durumuna göre hazırlanır ve müşterinin teslimat adresine gönderilir. Teslimat sırasında hasarlı paket tespit edilirse kargo görevlisine tutanak tutturulmalıdır.

5. Cayma Hakkı
Tüketici, yasal istisnalar dışında ürünü teslim aldığı tarihten itibaren 14 gün içinde cayma hakkını kullanabilir.

6. Genel Hükümler
Müşteri, sipariş vermeden önce ön bilgilendirme metnini, mesafeli satış sözleşmesini ve ödeme koşullarını okuyup kabul ettiğini beyan eder.

Sözleşme Tarihi: ${new Date().toLocaleDateString('tr-TR')}
Satıcı: Voltekno Enerji Sistemleri`}
                  {showModal === 'privacy' && `GİZLİLİK SÖZLEŞMESİ

1. Toplanan Veriler
Sipariş sürecinde ad, soyad, e-posta, telefon, teslimat ve fatura bilgileri alınır.

2. Kullanım Amacı
Bu bilgiler siparişin hazırlanması, teslim edilmesi, faturalandırılması, müşteri desteği sağlanması ve yasal yükümlülüklerin yerine getirilmesi için kullanılır.

3. Veri Paylaşımı
Bilgileriniz yalnızca ödeme, kargo ve yasal süreçlerde ihtiyaç duyulan hizmet sağlayıcılarla sınırlı olarak paylaşılır.

4. Güvenlik
Kişisel verileriniz teknik ve idari güvenlik tedbirleri ile korunur. Yetkisiz erişime karşı gerekli önlemler uygulanır.

5. Haklarınız
KVKK kapsamında verilerinize erişme, düzeltme, silme ve işlenmesine itiraz etme hakkına sahipsiniz.

Son Güncelleme: ${new Date().toLocaleDateString('tr-TR')}`}
                  {showModal === 'kvkk' && `KVKK AYDINLATMA METNİ

6698 sayılı Kişisel Verilerin Korunması Kanunu kapsamında, sipariş ve müşteri ilişkileri süreçlerinde paylaştığınız kişisel veriler veri sorumlusu tarafından işlenmektedir.

İşlenen veriler:
- Kimlik ve iletişim bilgileri
- Teslimat ve fatura bilgileri
- Sipariş ve ödeme bilgileri

İşleme amaçları:
- Siparişin alınması ve tamamlanması
- Fatura düzenlenmesi
- Teslimat operasyonunun yürütülmesi
- Müşteri destek süreçlerinin yürütülmesi
- Yasal yükümlülüklerin yerine getirilmesi

Haklarınız için bizimle iletişime geçebilirsiniz: info@voltekno.com`}
                </div>
              </div>
              <div className="p-4 border-t border-slate-200 bg-slate-50 pb-safe">
                <Button
                  onClick={() => setShowModal(null)}
                  className="w-full rounded-xl min-h-[48px] touch-manipulation bg-brand hover:bg-brand-hover text-white"
                >
                  Kapat
                </Button>
              </div>
            </div>
          </div>
        )}
    </ClassicPageShell>
  )
}


